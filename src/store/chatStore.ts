"use client"

import { create } from "zustand"
import type { ChatChannel, ChatMessage, DmConversation, DmMessage } from "@/lib/chatApi"
import type { PresenceUser } from "@/lib/chatSocket"
import { aggregateRawReactions } from "@/lib/chatApi"

// ─── Types ────────────────────────────────────────────────────────────────────

export type AggregatedReactionWithMine = {
	emoji: string
	count: number
	userIds: string[]
	mine: boolean
}

export type StoredMessage = Omit<ChatMessage, "reactions"> & {
	reactions: AggregatedReactionWithMine[]
}

export type TypingUser = {
	userId: string
	displayName: string
	expiresAt: number
}

export type ChatView = "channel" | "dm"

type ChatState = {
	// channels
	channels: ChatChannel[]
	activeChannelId: string | null

	// messages per channel (display order: oldest first)
	messages: Record<string, StoredMessage[]>
	messageCursors: Record<string, string | null>
	messageLoading: Record<string, boolean>

	// session-level unread per channel (incremented by WS new-message for non-active channels)
	channelUnread: Record<string, number>

	// presence
	onlineCount: number
	onlineUsers: PresenceUser[]

	// typing per channel: keyed by channelId
	typingUsers: Record<string, TypingUser[]>

	// DMs
	dmConversations: DmConversation[]
	activeDmConversationId: string | null
	dmMessages: Record<string, DmMessage[]>
	dmCursors: Record<string, string | null>
	dmLoading: Record<string, boolean>
	totalUnreadDMs: number

	// DM typing: keyed by conversationId
	dmTypingUsers: Record<string, { userId: string; expiresAt: number }[]>

	// view state
	chatView: ChatView
	pinnedPanelOpen: boolean
	threadMessageId: string | null

	// connection
	socketConnected: boolean
}

type ChatActions = {
	// channels
	setChannels: (channels: ChatChannel[]) => void
	setActiveChannel: (channelId: string) => void

	// messages
	setMessages: (channelId: string, messages: StoredMessage[]) => void
	prependMessages: (channelId: string, messages: StoredMessage[], nextCursor: string | null) => void
	setMessageCursor: (channelId: string, cursor: string | null) => void
	setMessageLoading: (channelId: string, loading: boolean) => void
	receiveNewMessage: (channelId: string, message: ChatMessage, currentUserId: string | null) => void
	removeMessage: (channelId: string, messageId: string) => void
	updateMessageReactions: (messageId: string, reactions: AggregatedReactionWithMine[]) => void
	setPinned: (channelId: string, message: ChatMessage, currentUserId: string | null) => void
	setUnpinned: (channelId: string, messageId: string) => void
	incrementChannelUnread: (channelId: string) => void
	clearChannelUnread: (channelId: string) => void

	// presence
	setPresence: (onlineCount: number, onlineUsers: PresenceUser[]) => void

	// typing
	setTypingUser: (channelId: string, userId: string, displayName: string) => void
	clearTypingUser: (channelId: string, userId: string) => void

	// DMs
	setDMConversations: (convs: DmConversation[]) => void
	setActiveDMConversation: (conversationId: string | null) => void
	setDMMessages: (conversationId: string, messages: DmMessage[]) => void
	prependDMMessages: (conversationId: string, messages: DmMessage[], nextCursor: string | null) => void
	setDMCursor: (conversationId: string, cursor: string | null) => void
	setDMLoading: (conversationId: string, loading: boolean) => void
	receiveNewDM: (conversationId: string, message: DmMessage, currentUserId: string | null) => void
	setTotalUnreadDMs: (count: number) => void
	incrementDMUnread: () => void
	clearDMUnread: (conversationId: string) => void
	upsertDMConversation: (conv: DmConversation) => void
	setDmTypingUser: (conversationId: string, userId: string) => void
	clearDmTypingUser: (conversationId: string, userId: string) => void

	// view
	setChatView: (view: ChatView) => void
	setPinnedPanelOpen: (open: boolean) => void
	setThreadMessageId: (messageId: string | null) => void

	// connection
	setSocketConnected: (connected: boolean) => void

	// reset
	reset: () => void
}

// ─── Typing timer registry (module-level — not serialized in state) ────────────

const channelTypingTimers = new Map<string, ReturnType<typeof setTimeout>>()
const dmTypingTimers = new Map<string, ReturnType<typeof setTimeout>>()

function channelTypingKey(channelId: string, userId: string) {
	return `${channelId}:${userId}`
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function toStoredMessage(msg: ChatMessage, currentUserId: string | null): StoredMessage {
	return {
		...msg,
		reactions: aggregateRawReactions(msg.reactions, currentUserId),
	}
}

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL: ChatState = {
	channels: [],
	activeChannelId: null,
	messages: {},
	messageCursors: {},
	messageLoading: {},
	channelUnread: {},
	onlineCount: 0,
	onlineUsers: [],
	typingUsers: {},
	dmConversations: [],
	activeDmConversationId: null,
	dmMessages: {},
	dmCursors: {},
	dmLoading: {},
	totalUnreadDMs: 0,
	dmTypingUsers: {},
	chatView: "channel",
	pinnedPanelOpen: false,
	threadMessageId: null,
	socketConnected: false,
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
	...INITIAL,

	// ── channels ──────────────────────────────────────────────────────────────

	setChannels(channels) {
		set({ channels })
	},

	setActiveChannel(channelId) {
		set({ activeChannelId: channelId })
	},

	// ── messages ──────────────────────────────────────────────────────────────

	setMessages(channelId, messages) {
		set(s => ({
			messages: { ...s.messages, [channelId]: messages },
		}))
	},

	prependMessages(channelId, messages, nextCursor) {
		set(s => ({
			messages: {
				...s.messages,
				[channelId]: [...messages, ...(s.messages[channelId] ?? [])],
			},
			messageCursors: { ...s.messageCursors, [channelId]: nextCursor },
		}))
	},

	setMessageCursor(channelId, cursor) {
		set(s => ({
			messageCursors: { ...s.messageCursors, [channelId]: cursor },
		}))
	},

	setMessageLoading(channelId, loading) {
		set(s => ({
			messageLoading: { ...s.messageLoading, [channelId]: loading },
		}))
	},

	receiveNewMessage(channelId, message, currentUserId) {
		set(s => {
			const existing = s.messages[channelId] ?? []
			if (existing.some(m => m.id === message.id)) return s
			return {
				messages: {
					...s.messages,
					[channelId]: [...existing, toStoredMessage(message, currentUserId)],
				},
			}
		})
	},

	removeMessage(channelId, messageId) {
		set(s => ({
			messages: {
				...s.messages,
				[channelId]: (s.messages[channelId] ?? []).filter(m => m.id !== messageId),
			},
		}))
	},

	updateMessageReactions(messageId, reactions) {
		set(s => {
			const updated: Record<string, StoredMessage[]> = {}
			for (const [chId, msgs] of Object.entries(s.messages)) {
				updated[chId] = msgs.map(m =>
					m.id === messageId ? { ...m, reactions } : m,
				)
			}
			return { messages: updated }
		})
	},

	setPinned(channelId, message, currentUserId) {
		set(s => ({
			messages: {
				...s.messages,
				[channelId]: (s.messages[channelId] ?? []).map(m =>
					m.id === message.id
						? { ...toStoredMessage(message, currentUserId), isPinned: true }
						: m,
				),
			},
		}))
	},

	setUnpinned(channelId, messageId) {
		set(s => ({
			messages: {
				...s.messages,
				[channelId]: (s.messages[channelId] ?? []).map(m =>
					m.id === messageId ? { ...m, isPinned: false, pinnedAt: null, pinnedBy: null } : m,
				),
			},
		}))
	},

	incrementChannelUnread(channelId) {
		set(s => ({
			channelUnread: {
				...s.channelUnread,
				[channelId]: (s.channelUnread[channelId] ?? 0) + 1,
			},
		}))
	},

	clearChannelUnread(channelId) {
		set(s => ({
			channelUnread: { ...s.channelUnread, [channelId]: 0 },
		}))
	},

	// ── presence ──────────────────────────────────────────────────────────────

	setPresence(onlineCount, onlineUsers) {
		set({ onlineCount, onlineUsers })
	},

	// ── typing ────────────────────────────────────────────────────────────────

	setTypingUser(channelId, userId, displayName) {
		const key = channelTypingKey(channelId, userId)
		const existing = channelTypingTimers.get(key)
		if (existing) clearTimeout(existing)

		const timer = setTimeout(() => {
			get().clearTypingUser(channelId, userId)
			channelTypingTimers.delete(key)
		}, 3500)
		channelTypingTimers.set(key, timer)

		set(s => {
			const current = s.typingUsers[channelId] ?? []
			const without = current.filter(u => u.userId !== userId)
			return {
				typingUsers: {
					...s.typingUsers,
					[channelId]: [...without, { userId, displayName, expiresAt: Date.now() + 3500 }],
				},
			}
		})
	},

	clearTypingUser(channelId, userId) {
		set(s => ({
			typingUsers: {
				...s.typingUsers,
				[channelId]: (s.typingUsers[channelId] ?? []).filter(u => u.userId !== userId),
			},
		}))
	},

	// ── DMs ───────────────────────────────────────────────────────────────────

	setDMConversations(convs) {
		set({ dmConversations: convs })
	},

	setActiveDMConversation(conversationId) {
		set({ activeDmConversationId: conversationId })
	},

	setDMMessages(conversationId, messages) {
		set(s => ({
			dmMessages: { ...s.dmMessages, [conversationId]: messages },
		}))
	},

	prependDMMessages(conversationId, messages, nextCursor) {
		set(s => ({
			dmMessages: {
				...s.dmMessages,
				[conversationId]: [...messages, ...(s.dmMessages[conversationId] ?? [])],
			},
			dmCursors: { ...s.dmCursors, [conversationId]: nextCursor },
		}))
	},

	setDMCursor(conversationId, cursor) {
		set(s => ({
			dmCursors: { ...s.dmCursors, [conversationId]: cursor },
		}))
	},

	setDMLoading(conversationId, loading) {
		set(s => ({
			dmLoading: { ...s.dmLoading, [conversationId]: loading },
		}))
	},

	receiveNewDM(conversationId, message, _currentUserId) {
		set(s => {
			const existing = s.dmMessages[conversationId] ?? []
			if (existing.some(m => m.id === message.id)) return s

			const updatedConvs = s.dmConversations.map(c =>
				c.id === conversationId
					? { ...c, lastMessageAt: message.createdAt }
					: c,
			)

			return {
				dmMessages: {
					...s.dmMessages,
					[conversationId]: [...existing, message],
				},
				dmConversations: updatedConvs,
			}
		})
	},

	setTotalUnreadDMs(count) {
		set({ totalUnreadDMs: count })
	},

	incrementDMUnread() {
		set(s => ({ totalUnreadDMs: s.totalUnreadDMs + 1 }))
	},

	clearDMUnread(conversationId) {
		set(s => ({
			dmConversations: s.dmConversations.map(c =>
				c.id === conversationId ? { ...c, unreadCount: 0 } : c,
			),
		}))
	},

	upsertDMConversation(conv) {
		set(s => {
			const exists = s.dmConversations.some(c => c.id === conv.id)
			return {
				dmConversations: exists
					? s.dmConversations.map(c => (c.id === conv.id ? conv : c))
					: [conv, ...s.dmConversations],
			}
		})
	},

	setDmTypingUser(conversationId, userId) {
		const key = `${conversationId}:${userId}`
		const existing = dmTypingTimers.get(key)
		if (existing) clearTimeout(existing)

		const timer = setTimeout(() => {
			get().clearDmTypingUser(conversationId, userId)
			dmTypingTimers.delete(key)
		}, 3500)
		dmTypingTimers.set(key, timer)

		set(s => {
			const current = s.dmTypingUsers[conversationId] ?? []
			const without = current.filter(u => u.userId !== userId)
			return {
				dmTypingUsers: {
					...s.dmTypingUsers,
					[conversationId]: [...without, { userId, expiresAt: Date.now() + 3500 }],
				},
			}
		})
	},

	clearDmTypingUser(conversationId, userId) {
		set(s => ({
			dmTypingUsers: {
				...s.dmTypingUsers,
				[conversationId]: (s.dmTypingUsers[conversationId] ?? []).filter(u => u.userId !== userId),
			},
		}))
	},

	// ── view ──────────────────────────────────────────────────────────────────

	setChatView(view) {
		set({ chatView: view })
	},

	setPinnedPanelOpen(open) {
		set({ pinnedPanelOpen: open })
	},

	setThreadMessageId(messageId) {
		set({ threadMessageId: messageId })
	},

	// ── connection ────────────────────────────────────────────────────────────

	setSocketConnected(connected) {
		set({ socketConnected: connected })
	},

	// ── reset ─────────────────────────────────────────────────────────────────

	reset() {
		channelTypingTimers.forEach(t => clearTimeout(t))
		channelTypingTimers.clear()
		dmTypingTimers.forEach(t => clearTimeout(t))
		dmTypingTimers.clear()
		set(INITIAL)
	},
}))
