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

	// Silently join all channels for session-level unread tracking (gap #8 mitigation)
	for (const channelId of _allChannelIds) {
		socket.emit("join-channel", { channelId, communityId: _communityId })
	}

	if (_activeDmConversationId) {
		socket.emit("join-dm", { conversationId: _activeDmConversationId })
	}

	// Fire any pending mark-read that couldn't be sent before connect
	if (_pendingMarkRead) {
		socket.emit("mark-read", _pendingMarkRead)
		_pendingMarkRead = null
	}
}

function attachHandlers(h: ChatSocketHandlers) {
	if (!socket) return

	socket.on("connect", () => {
		rejoinRooms()
		h.onConnect()
	})

	socket.on("disconnect", async (reason) => {
		h.onDisconnect()
		if (reason === "io server disconnect" || reason === "transport close") {
			const freshToken = await auth.currentUser?.getIdToken(true)
			if (!freshToken) return
			socket!.auth = { token: freshToken }
			socket!.connect()
		}
	})

	socket.on("connect_error", () => {
		h.onDisconnect()
	})

	socket.on("new-message", ({ channelId, message }: { channelId: string; message: ChatMessage }) => {
		h.onNewMessage(channelId, message)
	})

	socket.on("message-deleted", ({ channelId, messageId }: { channelId: string; messageId: string }) => {
		h.onMessageDeleted(channelId, messageId)
	})

	socket.on("reaction-updated", ({
		messageId,
		reactions,
	}: {
		messageId: string
		reactions: (AggregatedReaction & { userIds: string[] })[]
	}) => {
		const enriched = reactions.map(r => ({
			...r,
			mine: _currentUserId ? r.userIds.includes(_currentUserId) : false,
		}))
		h.onReactionUpdated(messageId, enriched)
	})

	socket.on("message-pinned", ({ channelId, message }: { channelId: string; message: ChatMessage }) => {
		h.onMessagePinned(channelId, message)
	})

	socket.on("message-unpinned", ({ channelId, messageId }: { channelId: string; messageId: string }) => {
		h.onMessageUnpinned(channelId, messageId)
	})

	socket.on("typing", ({ channelId, userId, displayName }: { channelId: string; userId: string; displayName: string }) => {
		h.onTyping(channelId, userId, displayName)
	})

	socket.on("presence-update", ({ communityId, onlineCount, onlineUsers }: {
		communityId: string
		onlineCount: number
		onlineUsers: PresenceUser[]
	}) => {
		h.onPresenceUpdate(communityId, onlineCount, onlineUsers)
	})

	socket.on("new-dm", ({ conversationId, message }: { conversationId: string; message: DmMessage }) => {
		h.onNewDM(conversationId, message)
	})

	socket.on("dm-typing", ({ conversationId, userId }: { conversationId: string; userId: string }) => {
		h.onDmTyping(conversationId, userId)
	})

	socket.on("dm-read", ({ conversationId, userId, lastReadAt }: {
		conversationId: string
		userId: string
		lastReadAt: string
	}) => {
		h.onDmRead(conversationId, userId, lastReadAt)
	})

	socket.on("error", ({ event, message }: { event: string; message: string }) => {
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
			socket.removeAllListeners()
			socket.disconnect()
			socket = null
		}

		_communityId = communityId
		_currentUserId = currentUserId
		_allChannelIds = allChannelIds
		_handlers = handlers

		const url = `${getOrigin()}/community-chat`
		console.debug("[chatSocket] io connecting to:", url)
		socket = io(url, {
			auth: { token },
			transports: ["websocket"],
		})

		attachHandlers(handlers)
	},

	disconnect() {
		if (socket) {
			socket.removeAllListeners()
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
		if (!socket?.connected || !_communityId) return
		socket.emit("join-channel", { channelId, communityId: _communityId })
	},

	leaveChannel(channelId: string) {
		if (!socket?.connected) return
		socket.emit("leave-channel", { channelId })
	},

	sendMessage(channelId: string, content: string, parentMessageId?: string) {
		console.debug("[chatSocket] sendMessage — connected:", socket?.connected, "channelId:", channelId)
		if (!socket?.connected) return
		socket.emit("send-message", { channelId, content, ...(parentMessageId ? { parentMessageId } : {}) })
	},

	addReaction(messageId: string, emoji: string) {
		if (!socket?.connected) return
		socket.emit("add-reaction", { messageId, emoji })
	},

	removeReaction(messageId: string, emoji: string) {
		if (!socket?.connected) return
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
			_pendingMarkRead = { channelId, lastReadAt }
			return
		}
		socket.emit("mark-read", { channelId, lastReadAt })
	},

	joinDM(conversationId: string) {
		_activeDmConversationId = conversationId
		if (!socket?.connected) return
		socket.emit("join-dm", { conversationId })
	},

	sendDM(communityId: string, content: string, conversationId?: string, targetUserId?: string) {
		if (!socket?.connected) return
		socket.emit("send-dm", {
			communityId,
			content,
			...(conversationId ? { conversationId } : {}),
			...(targetUserId ? { targetUserId } : {}),
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
		socket.emit("mark-dm-read", { conversationId })
	},

	isConnected() {
		return socket?.connected ?? false
	},
}
