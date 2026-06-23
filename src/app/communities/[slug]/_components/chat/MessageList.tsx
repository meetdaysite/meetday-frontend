"use client"

import { useEffect, useRef, useCallback } from "react"
import { MessageBubble } from "./MessageBubble"
import { WelcomeBanner } from "./WelcomeBanner"
import { TypingIndicator } from "./TypingIndicator"
import type { StoredMessage } from "@/store/chatStore"
import type { CommunityRole } from "@/lib/api"
import type { ChatChannel } from "@/lib/chatApi"

interface MessageListProps {
	messages: StoredMessage[]
	channel: ChatChannel
	bannerDismissed: boolean
	typingDisplayNames: string[]
	currentUserId: string | null
	currentUserRole: CommunityRole | null
	hasMore: boolean
	isLoadingMore: boolean
	onLoadMore: () => void
	onDismissBanner: () => void
	onReactionToggle: (messageId: string, emoji: string, mine: boolean) => void
	onPin: (messageId: string) => void
	onUnpin: (messageId: string) => void
	onDelete: (messageId: string) => void
	onReply: (messageId: string) => void
}

export function MessageList({
	messages,
	channel,
	bannerDismissed,
	typingDisplayNames,
	currentUserId,
	currentUserRole,
	hasMore,
	isLoadingMore,
	onLoadMore,
	onDismissBanner,
	onReactionToggle,
	onPin,
	onUnpin,
	onDelete,
	onReply,
}: MessageListProps) {
	const listRef = useRef<HTMLDivElement>(null)
	const bottomRef = useRef<HTMLDivElement>(null)
	const isNearBottom = useRef(true)

	const showBanner =
		!bannerDismissed &&
		channel.welcomeTitle != null &&
		channel.memberState?.bannerDismissedAt == null

	// Scroll to bottom when new messages arrive (only if user is near bottom)
	useEffect(() => {
		if (isNearBottom.current) {
			bottomRef.current?.scrollIntoView({ behavior: "smooth" })
		}
	}, [messages.length])

	const handleScroll = useCallback(() => {
		const el = listRef.current
		if (!el) return

		// Near bottom check
		isNearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120

		// Load more when scrolled to top
		if (el.scrollTop < 80 && hasMore && !isLoadingMore) {
			onLoadMore()
		}
	}, [hasMore, isLoadingMore, onLoadMore])

	useEffect(() => {
		const el = listRef.current
		if (!el) return
		el.addEventListener("scroll", handleScroll, { passive: true })
		return () => el.removeEventListener("scroll", handleScroll)
	}, [handleScroll])

	// Preserve scroll position when prepending older messages
	const prevScrollHeight = useRef(0)
	useEffect(() => {
		const el = listRef.current
		if (!el) return
		if (isLoadingMore) {
			prevScrollHeight.current = el.scrollHeight
		} else if (prevScrollHeight.current > 0) {
			el.scrollTop = el.scrollHeight - prevScrollHeight.current
			prevScrollHeight.current = 0
		}
	}, [isLoadingMore])

	return (
		<div
			ref={listRef}
			className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 flex flex-col gap-1"
		>
			{isLoadingMore && (
				<div className="flex justify-center py-2">
					<span className="text-[11px] text-text-muted">Loading older messages…</span>
				</div>
			)}

			{!hasMore && messages.length > 0 && (
				<p className="text-[11px] text-text-muted text-center py-2">
					Beginning of <span className="font-semibold">#{channel.name}</span>
				</p>
			)}

			{showBanner && (
				<WelcomeBanner
					channelName={channel.name}
					welcomeTitle={channel.welcomeTitle!}
					welcomeBody={channel.welcomeBody}
					onDismiss={onDismissBanner}
				/>
			)}

			<div className="flex flex-col gap-4">
				{messages.map(msg => (
					<MessageBubble
						key={msg.id}
						message={msg}
						currentUserId={currentUserId}
						currentUserRole={currentUserRole}
						onReactionToggle={onReactionToggle}
						onPin={onPin}
						onUnpin={onUnpin}
						onDelete={onDelete}
						onReply={onReply}
					/>
				))}
			</div>

			<TypingIndicator displayNames={typingDisplayNames} />

			<div ref={bottomRef} />
		</div>
	)
}
