"use client"

import { useEffect, useCallback, useRef, useState } from "react"
import { toast } from "sonner"
import { Icon } from "@/components/ui/Icon"
import PinSvg from "@/icons/outlined/pin.svg"
import DotsSvg from "@/icons/outlined/dots.svg"
import { useAuthStore } from "@/store/authStore"
import {
	getChatChannels,
	getChannelMessages,
	getCommunityPresence,
	getDMConversations,
	getDMMessages,
	getTotalUnreadDMCount,
	dismissWelcomeBanner,
	pinMessage,
	unpinMessage as unpinMessageApi,
	deleteChannelMessage,
} from "@/lib/chatApi"
import { chatSocket } from "@/lib/chatSocket"
import { useChatStore } from "@/store/chatStore"
import { aggregateRawReactions } from "@/lib/chatApi"
import type { CommunityRole } from "@/lib/api"
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
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ChatTabContent({
	communityName: _communityName,
	communityId,
	currentUserId,
	currentUserRole,
}: ChatTabContentProps) {
	const store = useChatStore()
	const isMod = canModerate(currentUserRole)

	// Track locally dismissed banners (optimistic, before API confirms)
	const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set())

	// Ref to track if initial data is already loading (prevent double-init in StrictMode)
	const initialized = useRef(false)

	// ── Initial data load ──────────────────────────────────────────────────────

	useEffect(() => {
		if (initialized.current) return
		initialized.current = true

		async function init() {
			try {
				// Channels are the critical path — abort if this fails
				const channels = await getChatChannels(communityId)
				store.setChannels(channels)

				// Non-critical — load in parallel, ignore individual failures
				const [presenceResult, conversationsResult, unreadResult] = await Promise.allSettled([
					getCommunityPresence(communityId),
					getDMConversations(communityId),
					getTotalUnreadDMCount(communityId),
				])
				if (presenceResult.status === "fulfilled") {
					store.setPresence(presenceResult.value.onlineCount, presenceResult.value.onlineUsers)
				}
				if (conversationsResult.status === "fulfilled") {
					store.setDMConversations(conversationsResult.value)
				}
				if (unreadResult.status === "fulfilled") {
					store.setTotalUnreadDMs(unreadResult.value)
				}

				const firstChannel = channels[0]
				if (firstChannel) {
					store.setActiveChannel(firstChannel.id)
					await loadChannelMessages(firstChannel.id, channels)
				}

				// Use store user as token source — avoids auth.currentUser race condition
				const firebaseUser = useAuthStore.getState().user
				if (!firebaseUser || !currentUserId) {
					console.debug("[chat] no auth user — socket not connected")
					return
				}
				const token = await firebaseUser.getIdToken()
				if (!token) {
					console.debug("[chat] token fetch returned empty")
					return
				}

				console.debug("[chat] connecting socket, communityId:", communityId, "userId:", currentUserId)
				chatSocket.connect(
					token,
					communityId,
					currentUserId,
					channels.map(c => c.id),
					{
						onConnect: () => {
							console.debug("[chat] socket connected")
							store.setSocketConnected(true)
						},
						onDisconnect: () => {
							console.debug("[chat] socket disconnected")
							store.setSocketConnected(false)
						},
						onNewMessage: (channelId, message) => {
							console.debug("[chat] new-message received", channelId, message.id)
							const active = useChatStore.getState().activeChannelId
							store.receiveNewMessage(channelId, message, currentUserId)
							if (channelId !== active) {
								store.incrementChannelUnread(channelId)
							} else {
								// Mark read automatically while viewing
								chatSocket.markRead(channelId, message.createdAt)
							}
						},
						onMessageDeleted: (channelId, messageId) => {
							store.removeMessage(channelId, messageId)
						},
						onReactionUpdated: (messageId, reactions) => {
							store.updateMessageReactions(messageId, reactions)
						},
						onMessagePinned: (channelId, message) => {
							store.setPinned(channelId, message, currentUserId)
						},
						onMessageUnpinned: (channelId, messageId) => {
							store.setUnpinned(channelId, messageId)
						},
						onTyping: (channelId, userId, displayName) => {
							if (userId !== currentUserId) {
								store.setTypingUser(channelId, userId, displayName)
							}
						},
						onPresenceUpdate: (_communityId, onlineCount, onlineUsers) => {
							store.setPresence(onlineCount, onlineUsers)
						},
						onNewDM: (conversationId, message) => {
							store.receiveNewDM(conversationId, message, currentUserId)
							if (message.senderId !== currentUserId) {
								store.incrementDMUnread()
							}
						},
						onDmTyping: (conversationId, userId) => {
							if (userId !== currentUserId) {
								store.setDmTypingUser(conversationId, userId)
							}
						},
						onDmRead: (conversationId, _userId, _lastReadAt) => {
							store.clearDMUnread(conversationId)
						},
						onError: (_event, message) => {
							toast.error(message)
						},
					},
				)
			} catch {
				toast.error("Failed to load chat. Please try again.")
			}
		}

		init()

		return () => {
			chatSocket.disconnect()
			store.reset()
			initialized.current = false
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [communityId])

	// ── Load channel messages ──────────────────────────────────────────────────

	const loadChannelMessages = useCallback(async (channelId: string, allChannels?: ChatChannel[]) => {
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
					reactions: aggregateRawReactions(msg.reactions, currentUserId),
				}))

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
	}, [communityId, currentUserId, store])

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
					reactions: aggregateRawReactions(msg.reactions, currentUserId),
				}))
			store.prependMessages(channelId, older, res.nextCursor)
		} finally {
			store.setMessageLoading(channelId, false)
		}
	}, [store, communityId, currentUserId])

	// ── Send message ───────────────────────────────────────────────────────────

	const handleSend = useCallback((content: string) => {
		if (!store.activeChannelId) return
		chatSocket.sendMessage(store.activeChannelId, content)
	}, [store.activeChannelId])

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
		if (!store.activeChannelId || !isMod) return
		try {
			await pinMessage(communityId, store.activeChannelId, messageId)
		} catch {
			toast.error("Failed to pin message.")
		}
	}, [communityId, store.activeChannelId, isMod])

	const handleUnpin = useCallback(async (messageId: string) => {
		if (!store.activeChannelId || !isMod) return
		try {
			await unpinMessageApi(communityId, store.activeChannelId, messageId)
			store.setUnpinned(store.activeChannelId, messageId)
		} catch {
			toast.error("Failed to unpin message.")
		}
	}, [communityId, store.activeChannelId, isMod, store])

	// ── Delete ─────────────────────────────────────────────────────────────────

	const handleDelete = useCallback(async (messageId: string) => {
		if (!store.activeChannelId) return
		try {
			await deleteChannelMessage(communityId, store.activeChannelId, messageId)
			store.removeMessage(store.activeChannelId, messageId)
		} catch {
			toast.error("Failed to delete message.")
		}
	}, [communityId, store.activeChannelId, store])

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
		if (store.activeChannelId) chatSocket.typingStart(store.activeChannelId)
	}, [store.activeChannelId])

	const handleTypingStop = useCallback(() => {
		if (store.activeChannelId) chatSocket.typingStop(store.activeChannelId)
	}, [store.activeChannelId])

	// ── Thread ────────────────────────────────────────────────────────────────

	const handleOpenThread = useCallback((messageId: string) => {
		store.setThreadMessageId(messageId)
		store.setChatView("channel")
	}, [store])

	const handleSendReply = useCallback((content: string) => {
		if (!store.activeChannelId || !store.threadMessageId) return
		chatSocket.sendMessage(store.activeChannelId, content, store.threadMessageId)
	}, [store.activeChannelId, store.threadMessageId])

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
		const convId = store.activeDmConversationId
		if (!convId) return
		chatSocket.sendDM(communityId, content, convId)
	}, [store.activeDmConversationId, communityId])

	const handleNewDM = useCallback(() => {
		// Opening a new DM requires picking a member — will be wired to MemberProfileDrawer
		// For now this is a no-op placeholder
		toast("Select a member from the Members tab to start a DM.")
	}, [])

	const handleDMBack = useCallback(() => {
		store.setChatView("channel")
		store.setActiveDMConversation(null)
	}, [store])

	const handleDMTypingStart = useCallback(() => {
		if (store.activeDmConversationId) chatSocket.dmTypingStart(store.activeDmConversationId)
	}, [store.activeDmConversationId])

	const handleDMTypingStop = useCallback(() => {
		if (store.activeDmConversationId) chatSocket.dmTypingStop(store.activeDmConversationId)
	}, [store.activeDmConversationId])

	// ── Derived state ──────────────────────────────────────────────────────────

	const activeChannel = store.channels.find(c => c.id === store.activeChannelId) ?? null
	const activeMessages = store.activeChannelId ? (store.messages[store.activeChannelId] ?? []) : []
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

	return (
		<div className="rounded-panel border border-border-default bg-surface-card overflow-hidden flex h-155">
			{/* ── Left sidebar ── */}
			<aside className="w-60 shrink-0 border-r border-border-default flex flex-col bg-surface-page overflow-y-auto no-scrollbar">
				<ChannelList
					channels={store.channels}
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
					conversations={store.dmConversations}
					activeDmConversationId={store.activeDmConversationId}
					onSelect={handleDMSelect}
					onNewDM={handleNewDM}
				/>
			</aside>

			{/* ── Right panel: channel or DM view ── */}
			{store.chatView === "dm" && activeDmConv ? (
				<DMThread
					conversation={activeDmConv}
					messages={activeDmMessages}
					currentUserId={currentUserId}
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
						{/* Channel header */}
						{activeChannel && (
							<div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-border-default shrink-0">
								<div className="min-w-0">
									<div className="flex items-center gap-1.5">
										<span className="text-text-muted font-medium">#</span>
										<h2 className="text-body-md font-bold text-text-primary">{activeChannel.name}</h2>
									</div>
									{activeChannel.description && (
										<p className="text-[11px] text-text-secondary mt-0.5 truncate">
											{activeChannel.description}
										</p>
									)}
								</div>
								<div className="flex items-center gap-2 shrink-0">
									<button
										type="button"
										onClick={() => store.setPinnedPanelOpen(!store.pinnedPanelOpen)}
										className={`p-1 rounded transition-colors ${
											store.pinnedPanelOpen
												? "text-violet-600 bg-surface-vibe-soft"
												: "text-text-muted hover:text-text-primary"
										}`}
										title="Pinned messages"
									>
										<Icon as={PinSvg} size="sm" color={store.pinnedPanelOpen ? "vibe" : "muted"} />
									</button>
									<button
										type="button"
										className="text-text-muted hover:text-text-primary transition-colors p-1"
										title="Channel options"
									>
										<Icon as={DotsSvg} size="sm" color="muted" />
									</button>
								</div>
							</div>
						)}

						{/* Loading state */}
						{isLoadingMessages && activeMessages.length === 0 && (
							<div className="flex-1 flex items-center justify-center">
								<p className="text-label-sm text-text-muted">Loading messages…</p>
							</div>
						)}

						{/* Message list */}
						{activeChannel && (
							<MessageList
								messages={activeMessages}
								channel={activeChannel}
								bannerDismissed={dismissedBanners.has(activeChannel.id)}
								typingDisplayNames={typingDisplayNames}
								currentUserId={currentUserId}
								currentUserRole={currentUserRole}
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
						)}

						{/* Message input */}
						<div className="px-5 py-3.5 border-t border-border-default shrink-0">
							<MessageInput
								placeholder={activeChannel ? `Message #${activeChannel.name}` : "Say hello to the community…"}
								quickReplies={activeChannel?.quickReplies}
								onSend={handleSend}
								onTypingStart={handleTypingStart}
								onTypingStop={handleTypingStop}
							/>
						</div>
					</div>

					{/* Thread panel — slides in when a thread is open */}
					{threadMessage && (
						<ThreadPanel
							parentMessage={threadMessage}
							communityId={communityId}
							channelId={store.activeChannelId!}
							currentUserId={currentUserId}
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
