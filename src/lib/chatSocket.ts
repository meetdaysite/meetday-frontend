import { io, type Socket } from "socket.io-client"
import { auth } from "@/lib/firebase"
import type { ChatMessage, AggregatedReaction, DmMessage } from "./chatApi"

// ─── Types ────────────────────────────────────────────────────────────────────

export type PresenceUser = {
	id: string
	firstName: string
	lastName: string
	avatarUrl: string | null
}

export type ChatSocketHandlers = {
	onNewMessage: (channelId: string, message: ChatMessage) => void
	onMessageDeleted: (channelId: string, messageId: string) => void
	onReactionUpdated: (messageId: string, reactions: (AggregatedReaction & { mine: boolean })[]) => void
	onMessagePinned: (channelId: string, message: ChatMessage) => void
	onMessageUnpinned: (channelId: string, messageId: string) => void
	onTyping: (channelId: string, userId: string, displayName: string) => void
	onPresenceUpdate: (communityId: string, onlineCount: number, onlineUsers: PresenceUser[]) => void
	onNewDM: (conversationId: string, message: DmMessage) => void
	onDmTyping: (conversationId: string, userId: string) => void
	onDmRead: (conversationId: string, userId: string, lastReadAt: string) => void
	onIntroReceived: (conversationId: string, fromUser: { id: string; firstName: string; lastName: string; avatarUrl: string | null }) => void
	onIntroAccepted: (conversationId: string, byUser: { id: string; firstName: string; lastName: string; avatarUrl: string | null }) => void
	onError: (event: string, message: string) => void
	onConnect: () => void
	onDisconnect: () => void
}

// ─── Module-level state ───────────────────────────────────────────────────────

let socket: Socket | null = null
let _currentUserId: string | null = null
let _communityId: string | null = null
let _allChannelIds: string[] = []
let _activeChannelId: string | null = null
let _activeDmConversationId: string | null = null
let _handlers: ChatSocketHandlers | null = null
let _pendingMarkRead: { channelId: string; lastReadAt: string } | null = null

function getOrigin(): string {
	const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? ""
	return baseUrl.replace(/\/api(\/v\d+)?$/, "")
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function rejoinRooms() {
	if (!socket || !_communityId) return

	console.debug("[chatSocket] rejoinRooms — joining", _allChannelIds.length, "channels")
	// Silently join all channels for session-level unread tracking (gap #8 mitigation)
	for (const channelId of _allChannelIds) {
		socket.emit("join-channel", { channelId, communityId: _communityId })
	}

	if (_activeDmConversationId) {
		console.debug("[chatSocket] rejoinRooms — rejoining DM", _activeDmConversationId)
		socket.emit("join-dm", { conversationId: _activeDmConversationId })
	}

	// Fire any pending mark-read that couldn't be sent before connect
	if (_pendingMarkRead) {
		console.debug("[chatSocket] rejoinRooms — flushing pending mark-read", _pendingMarkRead.channelId)
		socket.emit("mark-read", _pendingMarkRead)
		_pendingMarkRead = null
	}
}

function attachHandlers(h: ChatSocketHandlers) {
	if (!socket) return

	socket.on("connect", () => {
		console.debug("[chatSocket] ✅ connected, id:", socket?.id)
		rejoinRooms()
		h.onConnect()
	})

	socket.on("disconnect", async (reason) => {
		console.debug("[chatSocket] ❌ disconnected, reason:", reason)
		h.onDisconnect()
		// "io server disconnect" is the one reason Socket.IO won't auto-reconnect for —
		// everything else (transport close, transport error, ping timeout) is retried
		// automatically, with the token refreshed on each attempt below.
		if (reason === "io server disconnect") {
			console.debug("[chatSocket] attempting manual reconnect with fresh token")
			const freshToken = await auth.currentUser?.getIdToken(true)
			if (!freshToken) return
			socket!.auth = { token: freshToken }
			socket!.connect()
		}
	})

	// Covers every automatic reconnect attempt (any disconnect reason other than
	// "io server disconnect"), reusing Socket.IO's own backoff — no custom retry needed.
	socket.io.on("reconnect_attempt", async () => {
		console.debug("[chatSocket] reconnect_attempt — refreshing token")
		const freshToken = await auth.currentUser?.getIdToken(true)
		if (freshToken && socket) socket.auth = { token: freshToken }
	})

	socket.on("connect_error", (err) => {
		console.debug("[chatSocket] ⚠️ connect_error:", err.message)
		h.onDisconnect()
	})

	socket.on("new-message", ({ channelId, message }: { channelId: string; message: ChatMessage }) => {
		console.debug("[chatSocket] ← new-message", channelId, message.id)
		h.onNewMessage(channelId, message)
	})

	socket.on("message-deleted", ({ channelId, messageId }: { channelId: string; messageId: string }) => {
		console.debug("[chatSocket] ← message-deleted", channelId, messageId)
		h.onMessageDeleted(channelId, messageId)
	})

	socket.on("reaction-updated", ({
		messageId,
		reactions,
	}: {
		messageId: string
		reactions: (AggregatedReaction & { userIds: string[] })[]
	}) => {
		console.debug("[chatSocket] ← reaction-updated", messageId, reactions.length, "reactions")
		const enriched = reactions.map(r => ({
			...r,
			mine: _currentUserId ? r.userIds.includes(_currentUserId) : false,
		}))
		h.onReactionUpdated(messageId, enriched)
	})

	socket.on("message-pinned", ({ channelId, message }: { channelId: string; message: ChatMessage }) => {
		console.debug("[chatSocket] ← message-pinned", channelId, message.id)
		h.onMessagePinned(channelId, message)
	})

	socket.on("message-unpinned", ({ channelId, messageId }: { channelId: string; messageId: string }) => {
		console.debug("[chatSocket] ← message-unpinned", channelId, messageId)
		h.onMessageUnpinned(channelId, messageId)
	})

	socket.on("typing", ({ channelId, userId, displayName }: { channelId: string; userId: string; displayName: string }) => {
		console.debug("[chatSocket] ← typing", channelId, userId)
		h.onTyping(channelId, userId, displayName)
	})

	socket.on("presence-update", ({ communityId, onlineCount, onlineUsers }: {
		communityId: string
		onlineCount: number
		onlineUsers: PresenceUser[]
	}) => {
		console.debug("[chatSocket] ← presence-update", communityId, onlineCount, "online")
		h.onPresenceUpdate(communityId, onlineCount, onlineUsers)
	})

	socket.on("new-dm", ({ conversationId, message }: { conversationId: string; message: DmMessage }) => {
		console.debug("[chatSocket] ← new-dm", conversationId, message.id)
		h.onNewDM(conversationId, message)
	})

	socket.on("dm-typing", ({ conversationId, userId }: { conversationId: string; userId: string }) => {
		console.debug("[chatSocket] ← dm-typing", conversationId, userId)
		h.onDmTyping(conversationId, userId)
	})

	socket.on("dm-read", ({ conversationId, userId, lastReadAt }: {
		conversationId: string
		userId: string
		lastReadAt: string
	}) => {
		console.debug("[chatSocket] ← dm-read", conversationId, userId)
		h.onDmRead(conversationId, userId, lastReadAt)
	})

	socket.on("intro-received", ({
		conversationId,
		fromUser,
	}: { conversationId: string; fromUser: { id: string; firstName: string; lastName: string; avatarUrl: string | null } }) => {
		console.debug("[chatSocket] ← intro-received", conversationId, fromUser.id)
		h.onIntroReceived(conversationId, fromUser)
	})

	socket.on("intro-accepted", ({
		conversationId,
		byUser,
	}: { conversationId: string; byUser: { id: string; firstName: string; lastName: string; avatarUrl: string | null } }) => {
		console.debug("[chatSocket] ← intro-accepted", conversationId, byUser.id)
		h.onIntroAccepted(conversationId, byUser)
	})

	socket.on("error", ({ event, message }: { event: string; message: string }) => {
		console.debug("[chatSocket] ← error", event, message)
		h.onError(event, message)
	})
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const chatSocket = {
	connect(
		token: string,
		communityId: string,
		currentUserId: string,
		allChannelIds: string[],
		handlers: ChatSocketHandlers,
	) {
		if (socket) {
			console.debug("[chatSocket] connect — tearing down existing socket")
			socket.removeAllListeners()
			socket.io.off("reconnect_attempt")
			socket.disconnect()
			socket = null
		}

		_communityId = communityId
		_currentUserId = currentUserId
		_allChannelIds = allChannelIds
		_handlers = handlers

		const url = `${getOrigin()}/community-chat`
		console.debug("[chatSocket] → connecting to", url, "communityId:", communityId, "channels:", allChannelIds.length)
		socket = io(url, {
			auth: { token },
			transports: ["websocket"],
		})

		attachHandlers(handlers)
	},

	disconnect() {
		console.debug("[chatSocket] disconnect called")
		if (socket) {
			socket.removeAllListeners()
			socket.io.off("reconnect_attempt")
			socket.disconnect()
			socket = null
		}
		_communityId = null
		_currentUserId = null
		_allChannelIds = []
		_activeChannelId = null
		_activeDmConversationId = null
		_handlers = null
		_pendingMarkRead = null
	},

	setAllChannels(channelIds: string[]) {
		_allChannelIds = channelIds
	},

	joinChannel(channelId: string) {
		_activeChannelId = channelId
		if (!socket?.connected || !_communityId) {
			console.debug("[chatSocket] → joinChannel deferred (not connected yet)", channelId)
			return
		}
		console.debug("[chatSocket] → join-channel emit", channelId)
		socket.emit("join-channel", { channelId, communityId: _communityId })
	},

	leaveChannel(channelId: string) {
		if (!socket?.connected) return
		console.debug("[chatSocket] → leave-channel emit", channelId)
		socket.emit("leave-channel", { channelId })
	},

	sendMessage(channelId: string, content: string, parentMessageId?: string) {
		console.debug("[chatSocket] → send-message, connected:", socket?.connected, "channelId:", channelId)
		if (!socket?.connected) return
		socket.emit("send-message", { channelId, content, ...(parentMessageId ? { parentMessageId } : {}) })
	},

	addReaction(messageId: string, emoji: string) {
		if (!socket?.connected) return
		console.debug("[chatSocket] → add-reaction", messageId, emoji)
		socket.emit("add-reaction", { messageId, emoji })
	},

	removeReaction(messageId: string, emoji: string) {
		if (!socket?.connected) return
		console.debug("[chatSocket] → remove-reaction", messageId, emoji)
		socket.emit("remove-reaction", { messageId, emoji })
	},

	typingStart(channelId: string) {
		if (!socket?.connected) return
		socket.emit("typing-start", { channelId })
	},

	typingStop(channelId: string) {
		if (!socket?.connected) return
		socket.emit("typing-stop", { channelId })
	},

	markRead(channelId: string, lastReadAt: string) {
		if (!socket?.connected) {
			console.debug("[chatSocket] → mark-read queued (not connected)", channelId)
			_pendingMarkRead = { channelId, lastReadAt }
			return
		}
		console.debug("[chatSocket] → mark-read emit", channelId)
		socket.emit("mark-read", { channelId, lastReadAt })
	},

	joinDM(conversationId: string) {
		_activeDmConversationId = conversationId
		if (!socket?.connected) return
		console.debug("[chatSocket] → join-dm emit", conversationId)
		socket.emit("join-dm", { conversationId })
	},

	sendDM(
		communityId: string,
		conversationId: string,
		payload: { content?: string; messageType?: "TEXT" | "IMAGE"; mediaKey?: string; mediaSizeBytes?: number },
	) {
		console.debug("[chatSocket] → send-dm, connected:", socket?.connected, "convId:", conversationId)
		if (!socket?.connected) return
		socket.emit("send-dm", {
			communityId,
			conversationId,
			...payload,
		})
	},

	dmTypingStart(conversationId: string) {
		if (!socket?.connected) return
		socket.emit("dm-typing-start", { conversationId })
	},

	dmTypingStop(conversationId: string) {
		if (!socket?.connected) return
		socket.emit("dm-typing-stop", { conversationId })
	},

	markDMRead(conversationId: string) {
		if (!socket?.connected) return
		console.debug("[chatSocket] → mark-dm-read emit", conversationId)
		socket.emit("mark-dm-read", { conversationId })
	},

	updateToken(token: string) {
		if (!socket) return
		socket.auth = { token }
		if (!socket.connected) {
			socket.connect()
		}
	},

	isConnected() {
		return socket?.connected ?? false
	},
}
