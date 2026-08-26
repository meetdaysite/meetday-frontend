"use client"

import { useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { Icon } from "@/components/ui/Icon"
import AltArrowLeftSvg from "@/icons/outlined/alt-arrow-left.svg"
import { MessageInput } from "./MessageInput"
import { TypingIndicator } from "./TypingIndicator"
import { LinkifiedText } from "@/components/ui/LinkifiedText"
import type { DmConversation, DmMessage } from "@/lib/chatApi"

function formatTime(iso: string) {
	const d = new Date(iso)
	const now = new Date()
	const diff = (now.getTime() - d.getTime()) / 1000

	if (diff < 60) return "just now"
	if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
	if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
	return `${Math.floor(diff / 86400)}d ago`
}

interface DMThreadProps {
	conversation: DmConversation
	messages: DmMessage[]
	currentUserId: string | null
	hasMore: boolean
	isLoading: boolean
	typingUserIds: string[]
	onLoadMore: () => void
	onSend: (content: string) => void
	onBack: () => void
	onTypingStart: () => void
	onTypingStop: () => void
}

export function DMThread({
	conversation,
	messages,
	currentUserId,
	hasMore,
	isLoading,
	typingUserIds,
	onLoadMore,
	onSend,
	onBack,
	onTypingStart,
	onTypingStop,
}: DMThreadProps) {
	const bottomRef = useRef<HTMLDivElement>(null)
	const listRef = useRef<HTMLDivElement>(null)
	const isNearBottom = useRef(true)
	const prevScrollHeight = useRef(0)

	const otherName = `${conversation.other.firstName} ${conversation.other.lastName}`
	const otherInitials = `${conversation.other.firstName[0] ?? ""}${conversation.other.lastName[0] ?? ""}`.toUpperCase()

	useEffect(() => {
		if (isNearBottom.current) {
			bottomRef.current?.scrollIntoView({ behavior: "smooth" })
		}
	}, [messages.length])

	useEffect(() => {
		const el = listRef.current
		if (!el) return
		if (isLoading) {
			prevScrollHeight.current = el.scrollHeight
		} else if (prevScrollHeight.current > 0) {
			el.scrollTop = el.scrollHeight - prevScrollHeight.current
			prevScrollHeight.current = 0
		}
	}, [isLoading])

	const handleScroll = useCallback(() => {
		const el = listRef.current
		if (!el) return
		isNearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120
		if (el.scrollTop < 80 && hasMore && !isLoading) {
			onLoadMore()
		}
	}, [hasMore, isLoading, onLoadMore])

	useEffect(() => {
		const el = listRef.current
		if (!el) return
		el.addEventListener("scroll", handleScroll, { passive: true })
		return () => el.removeEventListener("scroll", handleScroll)
	}, [handleScroll])

	const typingNames = typingUserIds.length > 0
		? [conversation.other.firstName]
		: []

	return (
		<div className="flex-1 flex flex-col min-w-0">
			{/* DM header */}
			<div className="flex items-center gap-3 px-5 py-3.5 border-b border-border-default shrink-0">
				<button
					type="button"
					onClick={onBack}
					className="text-text-muted hover:text-text-primary transition-colors"
					title="Back to channel"
				>
					<Icon as={AltArrowLeftSvg} size="sm" color="muted" />
				</button>

				<div className="relative size-8 rounded-full overflow-hidden border border-border-default bg-surface-hover shrink-0 flex items-center justify-center">
					{conversation.other.avatarUrl ? (
						<Image src={conversation.other.avatarUrl} alt={otherName} fill sizes="32px" className="object-cover" />
					) : (
						<span className="text-[10px] font-bold text-text-secondary">{otherInitials}</span>
					)}
				</div>

				<div className="min-w-0">
					<p className="text-body-sm font-bold text-text-primary truncate">{otherName}</p>
					<p className="text-[11px] text-text-muted">Direct message</p>
				</div>
			</div>

			{/* Messages */}
			<div
				ref={listRef}
				className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 flex flex-col gap-3"
			>
				{isLoading && (
					<p className="text-[11px] text-text-muted text-center">Loading…</p>
				)}

				{!hasMore && messages.length > 0 && (
					<p className="text-[11px] text-text-muted text-center py-2">
						Beginning of your conversation with <span className="font-semibold">{conversation.other.firstName}</span>
					</p>
				)}

				{messages.map(msg => {
					const isOwn = msg.senderId === currentUserId
					const senderName = `${msg.sender.firstName} ${msg.sender.lastName}`
					const initials = `${msg.sender.firstName[0] ?? ""}${msg.sender.lastName[0] ?? ""}`.toUpperCase()

					return (
						<div key={msg.id} className={`flex gap-2.5 ${isOwn ? "flex-row-reverse" : ""}`}>
							{!isOwn && (
								<div className="relative size-7 rounded-full overflow-hidden border border-border-default bg-surface-hover shrink-0 flex items-center justify-center">
									{msg.sender.avatarUrl ? (
										<Image src={msg.sender.avatarUrl} alt={senderName} fill sizes="28px" className="object-cover" />
									) : (
										<span className="text-[9px] font-bold text-text-secondary">{initials}</span>
									)}
								</div>
							)}
							<div className={`flex flex-col gap-0.5 max-w-[75%] ${isOwn ? "items-end" : ""}`}>
								<div
									className={`px-3 py-2 rounded-2xl text-label-sm leading-snug ${
										isOwn
											? "bg-violet-600 text-white rounded-tr-sm"
											: "bg-surface-card border border-border-default text-text-primary rounded-tl-sm"
									}`}
								>
									{msg.content ? <LinkifiedText text={msg.content} /> : <span className="italic opacity-60">Message unavailable</span>}
								</div>
								<span className="text-[10px] text-text-muted">{formatTime(msg.createdAt)}</span>
							</div>
						</div>
					)
				})}

				<TypingIndicator displayNames={typingNames} />

				<div ref={bottomRef} />
			</div>

			{/* Input */}
			<div className="px-5 py-3.5 border-t border-border-default shrink-0">
				<MessageInput
					placeholder={`Message ${conversation.other.firstName}…`}
					onSend={onSend}
					onTypingStart={onTypingStart}
					onTypingStop={onTypingStop}
				/>
			</div>
		</div>
	)
}
