"use client"

import { useEffect, useCallback, useState } from "react"
import { toast } from "sonner"
import { useAuthStore } from "@/store/authStore"
import { useAttendeeProfileStore } from "@/store/attendeeProfileStore"
import {
	getChatChannels,
	getChannelMessages,
	getCommunityPresence,
	getDMConversations,
	getDMMessages,
	getTotalUnreadDMCount,
	getReceivedIntros,
	dismissWelcomeBanner,
	pinMessage,
	unpinMessage as unpinMessageApi,
	deleteChannelMessage,
} from "@/lib/chatApi"
import { chatSocket } from "@/lib/chatSocket"
import { auth } from "@/lib/firebase"
import { useChatStore } from "@/store/chatStore"
import { aggregateRawReactions } from "@/lib/chatApi"
import type { CommunityRole } from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"
import type { ChatChannel, DmConversation } from "@/lib/chatApi"
import type { StoredMessage } from "@/store/chatStore"

import { ChannelList } from "./chat/ChannelList"
import { OnlinePresence } from "./chat/OnlinePresence"
import { DMList } from "./chat/DMList"
import { MessageList } from "./chat/MessageList"
import { MessageInput } from "./chat/MessageInput"
import { PinnedPanel } from "./chat/PinnedPanel"
import { ThreadPanel } from "./chat/ThreadPanel"
import { DMThread } from "./chat/DMThread"
import { IntroInboxPanel } from "./IntroInboxPanel"
import { Skeleton } from "@/components/ui/Skeleton"

// ─── Role helpers ─────────────────────────────────────────────────────────────

const ROLE_WEIGHT: Record<CommunityRole, number> = {
	MEMBER: 0,
	MODERATOR: 1,
	HOST: 2,
	MANAGER: 3,
	OWNER: 4,
}

function canModerate(role: CommunityRole | null) {
	if (!role) return false
	return ROLE_WEIGHT[role] >= ROLE_WEIGHT["MODERATOR"]
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChatTabContentProps {
	communityName: string
	communityId: string
	currentUserId: string | null
	currentUserRole: CommunityRole | null
	pendingDmConversationId?: string | null
	onPendingDmHandled?: () => void
	onGoToMembers?: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ChatTabContent({
	communityName: _communityName,
	communityId,
	currentUserId,
	currentUserRole,
	pendingDmConversationId,
	onPendingDmHandled,
	onGoToMembers,
}: ChatTabContentProps) {
	const store = useChatStore()
	const isMod = canModerate(currentUserRole)
	const backendUserId = useAttendeeProfileStore(s => s.profile?.id ?? null)

	// Track locally dismissed banners (optimistic, before API confirms)
	const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set())
	const [chatLoading, setChatLoading] = useState(true)
	const [introInboxOpen, setIntroInboxOpen] = useState(false)
	const [introBadgeCount, setIntroBadgeCount] = useState(0)

	// ── Load channel messages ──────────────────────────────────────────────────

	const loadChannelMessages = useCallback(async (channelId: string, allChannels?: ChatChannel[]) => {
		console.debug("[chat] loadChannelMessages", channelId)
		store.setMessageLoading(channelId, true)
		try {
			const res = await getChannelMessages(communityId, channelId)
			const channels = allChannels ?? store.channels
			const ch = channels.find(c => c.id === channelId)

			const stored: StoredMessage[] = res.messages
				.slice()
				.reverse()
				.map(msg => ({
					...msg,
					reactions: aggregateRawReactions(msg.reactions, backendUserId),
				}))

			console.debug("[chat] loadChannelMessages — got", stored.length, "messages, cursor:", res.nextCursor)
			store.setMessages(channelId, stored)
			store.setMessageCursor(channelId, res.nextCursor)

			// Mark read immediately after load
			if (stored.length > 0) {
				const newest = stored[stored.length - 1]
				chatSocket.markRead(channelId, newest.createdAt)
			}

			// Join channel on WS (also joins for presence updates)
			chatSocket.joinChannel(channelId)

			// Pre-dismiss banner locally if server already recorded dismissal
			if (ch?.memberState?.bannerDismissedAt) {
				setDismissedBanners(prev => new Set(prev).add(channelId))
			}
		} finally {
			store.setMessageLoading(channelId, false)
		}
	}, [communityId, backendUserId, store])

	// ── Initial data load ──────────────────────────────────────────────────────

	useEffect(() => {
		let aborted = false

		async function init() {
			setChatLoading(true)
			try {
				console.debug("[chat] init — fetching channels for community", communityId)
				// Channels are the critical path — abort if this fails
				const channels = await getChatChannels(communityId)
				if (aborted) return

				console.debug("[chat] init — got", channels.length, "channels")
				store.setChannels(channels)
				setChatLoading(false)

				// Non-critical — load in parallel, ignore individual failures
				const [presenceResult, conversationsResult, unreadResult, introsResult] = await Promise.allSettled([
					getCommunityPresence(communityId),
					getDMConversations(communityId),
					getTotalUnreadDMCount(communityId),
					getReceivedIntros(communityId),
				])
				if (aborted) return

				if (presenceResult.status === "fulfilled") {
					console.debug("[chat] init — presence:", presenceResult.value.onlineCount, "online")
					store.setPresence(presenceResult.value.onlineCount, presenceResult.value.onlineUsers)
				} else {
					console.debug("[chat] init — presence failed:", presenceResult.reason)
				}
				if (conversationsResult.status === "fulfilled") {
					console.debug("[chat] init — DMs:", conversationsResult.value.length, "conversations")
					store.setDMConversations(conversationsResult.value)
				} else {
					console.debug("[chat] init — DMs failed:", conversationsResult.reason)
				}
				if (unreadResult.status === "fulfilled") {
					console.debug("[chat] init — unread DM count:", unreadResult.value)
					store.setTotalUnreadDMs(unreadResult.value)
				} else {
					console.debug("[chat] init — unread count failed:", unreadResult.reason)
				}
				if (introsResult.status === "fulfilled") {
					console.debug("[chat] init — pending intros:", introsResult.value.length)
					setIntroBadgeCount(introsResult.value.length)
				}

				const firstChannel = channels[0]
				if (firstChannel) {
					console.debug("[chat] init — setting active channel:", firstChannel.id, firstChannel.name)
					store.setActiveChannel(firstChannel.id)
					await loadChannelMessages(firstChannel.id, channels)
				} else {
					console.debug("[chat] init — no channels found, skipping message load")
				}
				if (aborted) return

				// Use store user as token source — avoids auth.currentUser race condition
				const firebaseUser = useAuthStore.getState().user
				if (!firebaseUser || !currentUserId || !backendUserId) {
					console.debug("[chat] init — no auth user, socket not connected")
					return
				}
				const token = await firebaseUser.getIdToken()
				if (!token) {
					console.debug("[chat] init — token fetch returned empty")
					return
				}
				if (aborted) return

				console.debug("[chat] init — connecting socket, userId:", backendUserId)
				chatSocket.connect(
					token,
					communityId,
					backendUserId,
					channels.map(c => c.id),
					{
						onConnect: () => {
							console.debug("[chat] socket connected ✅")
							store.setSocketConnected(true)
						},
						onDisconnect: () => {
							console.debug("[chat] socket disconnected ❌")
							store.setSocketConnected(false)
						},
						onNewMessage: (channelId, message) => {
							const active = useChatStore.getState().activeChannelId
							console.debug("[chat] new message in", channelId, "| active:", active, "| id:", message.id)
							store.receiveNewMessage(channelId, message, backendUserId)
							if (channelId !== active) {
								store.incrementChannelUnread(channelId)
							} else {
								// Mark read automatically while viewing
								chatSocket.markRead(channelId, message.createdAt)
							}
						},
						onMessageDeleted: (channelId, messageId) => {
							console.debug("[chat] message deleted", channelId, messageId)
							store.removeMessage(channelId, messageId)
						},
						onReactionUpdated: (messageId, reactions) => {
							console.debug("[chat] reaction updated", messageId, reactions.length, "reactions")
							store.updateMessageReactions(messageId, reactions)
						},
						onMessagePinned: (channelId, message) => {
							console.debug("[chat] message pinned", channelId, message.id)
							store.setPinned(channelId, message, backendUserId)
						},
						onMessageUnpinned: (channelId, messageId) => {
							console.debug("[chat] message unpinned", channelId, messageId)
							store.setUnpinned(channelId, messageId)
						},
						onTyping: (channelId, userId, displayName) => {
							if (userId !== backendUserId) {
								store.setTypingUser(channelId, userId, displayName)
							}
						},
						onPresenceUpdate: (_communityId, onlineCount, onlineUsers) => {
							console.debug("[chat] presence update:", onlineCount, "online")
							store.setPresence(onlineCount, onlineUsers)
						},
						onNewDM: (conversationId, message) => {
							console.debug("[chat] new DM in", conversationId, "from", message.senderId)
							store.receiveNewDM(conversationId, message, backendUserId)
							if (message.senderId !== backendUserId) {
								store.incrementDMUnread()
							}
						},
						onDmTyping: (conversationId, userId) => {
							if (userId !== backendUserId) {
								store.setDmTypingUser(conversationId, userId)
							}
						},
						onDmRead: (conversationId, _userId, _lastReadAt) => {
							console.debug("[chat] DM read", conversationId)
							store.clearDMUnread(conversationId)
						},
						onIntroReceived: (conversationId, fromUser) => {
							console.debug("[chat] intro-received from", fromUser.id, "conv:", conversationId)
							setIntroBadgeCount(prev => prev + 1)
						},
						onIntroAccepted: (conversationId, byUser) => {
							console.debug("[chat] intro-accepted by", byUser.id, "conv:", conversationId)
							toast(`${byUser.firstName} accepted your intro! You can now chat.`)
						},
						onError: (_event, message) => {
							console.debug("[chat] socket error:", _event, message)
							toast.error(message)
						},
					},
				)

			} catch (err) {
				if (!aborted) setChatLoading(false)
				console.debug("[chat] init — uncaught error:", err)
				toast.error(getApiErrorMessage(err))
			}
		}

		init()

		return () => {
			aborted = true
			chatSocket.disconnect()
			store.reset()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [communityId])

	// ── Channel switch ─────────────────────────────────────────────────────────

	const handleChannelSelect = useCallback(async (channelId: string) => {
		if (store.activeChannelId && store.activeChannelId !== channelId) {
			chatSocket.leaveChannel(store.activeChannelId)
		}
		store.setActiveChannel(channelId)
		store.setChatView("channel")
		store.setThreadMessageId(null)
		store.clearChannelUnread(channelId)

		if (!store.messages[channelId]) {
			await loadChannelMessages(channelId)
		} else {
			chatSocket.joinChannel(channelId)
			const msgs = store.messages[channelId]
			if (msgs.length > 0) {
				chatSocket.markRead(channelId, msgs[msgs.length - 1].createdAt)
			}
		}
	}, [store, loadChannelMessages])

	// ── Load more (scroll up) ──────────────────────────────────────────────────

	const handleLoadMore = useCallback(async () => {
		const channelId = store.activeChannelId
		if (!channelId) return
		const cursor = store.messageCursors[channelId]
		if (!cursor) return

		store.setMessageLoading(channelId, true)
		try {
			const res = await getChannelMessages(communityId, channelId, { cursor })
			const older: StoredMessage[] = res.messages
				.slice()
				.reverse()
				.map(msg => ({
					...msg,
					reactions: aggregateRawReactions(msg.reactions, backendUserId),
				}))
			store.prependMessages(channelId, older, res.nextCursor)
		} finally {
			store.setMessageLoading(channelId, false)
		}
	}, [store, communityId, backendUserId])

	// ── Send message ───────────────────────────────────────────────────────────

	const handleSend = useCallback((content: string) => {
		const channelId = useChatStore.getState().activeChannelId
		console.debug("[chat] handleSend — channelId:", channelId, "content:", content)
		if (!channelId) return
		chatSocket.sendMessage(channelId, content)
	}, [])

	// ── Reactions ──────────────────────────────────────────────────────────────

	const handleReactionToggle = useCallback((messageId: string, emoji: string, mine: boolean) => {
		if (mine) {
			chatSocket.removeReaction(messageId, emoji)
		} else {
			chatSocket.addReaction(messageId, emoji)
		}
	}, [])

	// ── Pin / unpin ────────────────────────────────────────────────────────────

	const handlePin = useCallback(async (messageId: string) => {
		const channelId = useChatStore.getState().activeChannelId
		if (!channelId || !isMod) return
		try {
			await pinMessage(communityId, channelId, messageId)
		} catch (err) {
			toast.error(getApiErrorMessage(err))
		}
	}, [communityId, isMod])

	const handleUnpin = useCallback(async (messageId: string) => {
		const channelId = useChatStore.getState().activeChannelId
		if (!channelId || !isMod) return
		try {
			await unpinMessageApi(communityId, channelId, messageId)
			store.setUnpinned(channelId, messageId)
		} catch (err) {
			toast.error(getApiErrorMessage(err))
		}
	}, [communityId, isMod, store])

	// ── Delete ─────────────────────────────────────────────────────────────────

	const handleDelete = useCallback(async (messageId: string) => {
		const channelId = useChatStore.getState().activeChannelId
		if (!channelId) return
		try {
			await deleteChannelMessage(communityId, channelId, messageId)
			store.removeMessage(channelId, messageId)
		} catch (err) {
			toast.error(getApiErrorMessage(err))
		}
	}, [communityId, store])

	// ── Welcome banner dismiss ─────────────────────────────────────────────────

	const handleDismissBanner = useCallback(async (channelId: string) => {
		setDismissedBanners(prev => new Set(prev).add(channelId))
		try {
			await dismissWelcomeBanner(communityId, channelId)
		} catch {
			// Silently fail — banner stays dismissed locally this session
		}
	}, [communityId])

	// ── Typing ────────────────────────────────────────────────────────────────

	const handleTypingStart = useCallback(() => {
		const channelId = useChatStore.getState().activeChannelId
		if (channelId) chatSocket.typingStart(channelId)
	}, [])

	const handleTypingStop = useCallback(() => {
		const channelId = useChatStore.getState().activeChannelId
		if (channelId) chatSocket.typingStop(channelId)
	}, [])

	// ── Thread ────────────────────────────────────────────────────────────────

	const handleOpenThread = useCallback((messageId: string) => {
		store.setThreadMessageId(messageId)
		store.setChatView("channel")
	}, [store])

	const handleSendReply = useCallback((content: string) => {
		const { activeChannelId, threadMessageId } = useChatStore.getState()
		if (!activeChannelId || !threadMessageId) return
		chatSocket.sendMessage(activeChannelId, content, threadMessageId)
	}, [])

	// ── DM ────────────────────────────────────────────────────────────────────

	const handleDMSelect = useCallback(async (conv: DmConversation) => {
		store.setActiveDMConversation(conv.id)
		store.setChatView("dm")
		store.setThreadMessageId(null)
		store.clearDMUnread(conv.id)
		chatSocket.joinDM(conv.id)
		chatSocket.markDMRead(conv.id)

		if (!store.dmMessages[conv.id]) {
			store.setDMLoading(conv.id, true)
			try {
				const res = await getDMMessages(communityId, conv.id)
				store.setDMMessages(conv.id, [...res.messages].reverse())
				store.setDMCursor(conv.id, res.nextCursor)
			} finally {
				store.setDMLoading(conv.id, false)
			}
		}
	}, [store, communityId])

	const handleDMLoadMore = useCallback(async () => {
		const convId = store.activeDmConversationId
		if (!convId) return
		const cursor = store.dmCursors[convId]
		if (!cursor) return

		store.setDMLoading(convId, true)
		try {
			const res = await getDMMessages(communityId, convId, { cursor })
			store.prependDMMessages(convId, [...res.messages].reverse(), res.nextCursor)
		} finally {
			store.setDMLoading(convId, false)
		}
	}, [store, communityId])

	const handleDMSend = useCallback((content: string) => {
		const convId = useChatStore.getState().activeDmConversationId
		if (!convId) return
		chatSocket.sendDM(communityId, convId, { content })
	}, [communityId])

	const handleNewDM = useCallback(() => {
		if (onGoToMembers) {
			onGoToMembers()
		} else {
			toast("Go to the Members tab to start a direct message.")
		}
	}, [onGoToMembers])

	const handleDMBack = useCallback(() => {
		store.setChatView("channel")
		store.setActiveDMConversation(null)
	}, [store])

	// ── Proactive Firebase token refresh ──────────────────────────────────────

	useEffect(() => {
		const unsubscribe = auth.onIdTokenChanged(async (user) => {
			if (!user) {
				chatSocket.disconnect()
				return
			}
			const newToken = await user.getIdToken()
			chatSocket.updateToken(newToken)
		})
		return unsubscribe
	}, [])

	// ── Open pending DM (from Members tab "Message" button) ───────────────────

	useEffect(() => {
		if (!pendingDmConversationId || chatLoading) return
		const conv = store.dmConversations.find(c => c.id === pendingDmConversationId)
		if (!conv) return
		handleDMSelect(conv)
		onPendingDmHandled?.()
	}, [pendingDmConversationId, chatLoading, store.dmConversations, handleDMSelect, onPendingDmHandled])

	const handleDMTypingStart = useCallback(() => {
		const convId = useChatStore.getState().activeDmConversationId
		if (convId) chatSocket.dmTypingStart(convId)
	}, [])

	const handleDMTypingStop = useCallback(() => {
		const convId = useChatStore.getState().activeDmConversationId
		if (convId) chatSocket.dmTypingStop(convId)
	}, [])

	// ── Derived state ──────────────────────────────────────────────────────────

	const displayChannels = store.channels
	const displayDMConvs = store.dmConversations

	const activeChannel = displayChannels.find(c => c.id === store.activeChannelId) ?? null
	const activeMessages = store.activeChannelId ? (store.messages[store.activeChannelId] ?? []) : []
	const previewUserId = backendUserId
	const isLoadingMessages = store.activeChannelId ? (store.messageLoading[store.activeChannelId] ?? false) : false
	const hasMoreMessages = store.activeChannelId ? (store.messageCursors[store.activeChannelId] !== null) : false

	const typingUsers = store.activeChannelId ? (store.typingUsers[store.activeChannelId] ?? []) : []
	const typingDisplayNames = typingUsers.map(u => u.displayName)

	const threadMessage = store.threadMessageId
		? activeMessages.find(m => m.id === store.threadMessageId) ?? null
		: null

	const activeDmConv = store.activeDmConversationId
		? store.dmConversations.find(c => c.id === store.activeDmConversationId) ?? null
		: null
	const activeDmMessages = store.activeDmConversationId ? (store.dmMessages[store.activeDmConversationId] ?? []) : []
	const isDmLoading = store.activeDmConversationId ? (store.dmLoading[store.activeDmConversationId] ?? false) : false
	const hasDmMore = store.activeDmConversationId ? (store.dmCursors[store.activeDmConversationId] !== null) : false
	const dmTypingUsers = store.activeDmConversationId ? (store.dmTypingUsers[store.activeDmConversationId] ?? []) : []

	// ── Render ────────────────────────────────────────────────────────────────

	if (chatLoading) {
		return (
			<div className="rounded-action border border-border-default bg-surface-card overflow-hidden flex h-155">
				<aside className="w-60 shrink-0 border-r border-border-default flex flex-col bg-surface-page p-4 gap-3">
					<Skeleton.Text className="w-14" />
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton.Block key={i} className="h-7" />
					))}
					<Skeleton.Text className="mt-4 w-14" />
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton.Block key={i} className="h-7" />
					))}
				</aside>
				<div className="flex-1 flex flex-col">
					<div className="h-14 border-b border-border-default shrink-0 px-5 flex items-center gap-3">
						<Skeleton.Text className="w-28" />
					</div>
					<div className="flex-1" />
					<div className="h-16 border-t border-border-default shrink-0 px-5 flex items-center">
						<Skeleton.Block className="h-9 w-full rounded-full" />
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="rounded-action border border-border-default bg-surface-card overflow-hidden flex h-155 shadow-md">
			{/* ── Left sidebar ── */}
			<aside className="w-60 shrink-0 border-r border-gray-200 flex flex-col bg-gray-50 overflow-y-auto no-scrollbar">
				<ChannelList
					channels={displayChannels}
					activeChannelId={store.activeChannelId}
					onSelect={handleChannelSelect}
					unreadMap={store.channelUnread}
					currentUserRole={currentUserRole}
				/>

				<div className="border-t border-border-default" />

				<OnlinePresence
					onlineCount={store.onlineCount}
					onlineUsers={store.onlineUsers}
				/>

				<div className="border-t border-border-default" />

				<DMList
					conversations={displayDMConvs}
					activeDmConversationId={store.activeDmConversationId}
					onSelect={handleDMSelect}
					onNewDM={handleNewDM}
				/>

				{/* Intro requests badge button */}
				<button
					type="button"
					onClick={() => { setIntroInboxOpen(true); setIntroBadgeCount(0) }}
					className="mx-3 mb-3 mt-1 flex items-center gap-2 px-3 py-2 rounded-action border border-border-default text-label-sm text-text-secondary hover:bg-surface-hover transition-colors"
				>
					<span className="flex-1 text-left">Intro Requests</span>
					{introBadgeCount > 0 && (
						<span className="flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold bg-action-primary text-text-inverse rounded-full leading-none">
							{introBadgeCount > 9 ? "9+" : introBadgeCount}
						</span>
					)}
				</button>
			</aside>

			{/* ── Right panel: channel or DM view ── */}
			{introInboxOpen ? (
				<IntroInboxPanel
					communityId={communityId}
					currentUserId={backendUserId ?? ""}
					onClose={() => setIntroInboxOpen(false)}
					onAccepted={(_conversationId) => {
						setIntroInboxOpen(false)
						// Refresh DM list so accepted conversation appears
						getDMConversations(communityId)
							.then(convs => store.setDMConversations(convs))
							.catch(() => {})
					}}
				/>
			) : store.chatView === "dm" && activeDmConv ? (
				<DMThread
					conversation={activeDmConv}
					messages={activeDmMessages}
					currentUserId={backendUserId}
					hasMore={hasDmMore}
					isLoading={isDmLoading}
					typingUserIds={dmTypingUsers.map(u => u.userId)}
					onLoadMore={handleDMLoadMore}
					onSend={handleDMSend}
					onBack={handleDMBack}
					onTypingStart={handleDMTypingStart}
					onTypingStop={handleDMTypingStop}
				/>
			) : (
				<div className="flex-1 flex min-w-0 overflow-hidden">
					{/* Channel panel */}
					<div className="flex-1 flex flex-col min-w-0">
						{/* No-channel empty state */}
						{!activeChannel ? (
							<div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
								<div className="size-12 rounded-full bg-surface-vibe-soft flex items-center justify-center">
									<span className="text-xl font-bold text-text-vibe">#</span>
								</div>
								<div>
									<p className="text-body-sm font-semibold text-text-primary">No channels yet</p>
									<p className="text-label-sm text-text-secondary font-normal mt-1 max-w-56 leading-snug">
										This community hasn&apos;t set up any channels yet. Check back soon.
									</p>
								</div>
							</div>
						) : (
							<>
								{/* Channel header */}
								<div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-200 shrink-0 bg-white">
									<div className="min-w-0">
										<div className="flex items-center gap-2">
											<span className="text-text-vibe font-bold text-lg">#</span>
											<h2 className="text-body-md font-bold text-text-primary">{activeChannel.name}</h2>
											{store.onlineCount > 0 && (
												<span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
													<span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
													{store.onlineCount} online
												</span>
											)}
										</div>
										{activeChannel.description && (
											<p className="text-[11px] text-text-secondary mt-0.5 truncate">
												{activeChannel.description}
											</p>
										)}
									</div>
								</div>

								{/* Loading state */}
								{isLoadingMessages && activeMessages.length === 0 && (
									<div className="flex-1 flex items-center justify-center">
										<p className="text-label-sm text-text-muted">Loading messages…</p>
									</div>
								)}

								{/* Message list */}
								<MessageList
									messages={activeMessages}
									channel={activeChannel}
									bannerDismissed={dismissedBanners.has(activeChannel.id)}
									typingDisplayNames={typingDisplayNames}
									currentUserId={previewUserId}
									currentUserRole={currentUserRole}
									activeThreadMessageId={store.threadMessageId}
									hasMore={hasMoreMessages}
									isLoadingMore={isLoadingMessages}
									onLoadMore={handleLoadMore}
									onDismissBanner={() => handleDismissBanner(activeChannel.id)}
									onReactionToggle={handleReactionToggle}
									onPin={handlePin}
									onUnpin={handleUnpin}
									onDelete={handleDelete}
									onReply={handleOpenThread}
								/>

								{/* Message input */}
								<div className="px-5 py-3.5 border-t border-border-default shrink-0">
									<MessageInput
										placeholder={`Message #${activeChannel.name}`}
										quickReplies={activeChannel.quickReplies}
										onSend={handleSend}
										onTypingStart={handleTypingStart}
										onTypingStop={handleTypingStop}
									/>
								</div>
							</>
						)}
					</div>

					{/* Thread panel — slides in when a thread is open */}
					{threadMessage && (
						<ThreadPanel
							parentMessage={threadMessage}
							communityId={communityId}
							channelId={store.activeChannelId!}
							currentUserId={backendUserId}
							currentUserRole={currentUserRole}
							onClose={() => store.setThreadMessageId(null)}
							onSendReply={handleSendReply}
							onTypingStart={handleTypingStart}
							onTypingStop={handleTypingStop}
						/>
					)}

					{/* Pinned panel — slides in from the right */}
					{store.pinnedPanelOpen && store.activeChannelId && (
						<PinnedPanel
							communityId={communityId}
							channelId={store.activeChannelId}
							currentUserRole={currentUserRole}
							onUnpinSuccess={(messageId) => store.setUnpinned(store.activeChannelId!, messageId)}
							onClose={() => store.setPinnedPanelOpen(false)}
						/>
					)}
				</div>
			)}
		</div>
	)
}

