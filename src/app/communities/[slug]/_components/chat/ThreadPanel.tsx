"use client"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import { Icon } from "@/components/ui/Icon"
import CloseSvg from "@/icons/outlined/close.svg"
import ChatDotsSvg from "@/icons/outlined/chat-dots.svg"
import { getMessageReplies } from "@/lib/chatApi"
import { MessageInput } from "./MessageInput"
import { avatarColor } from "@/lib/avatarColor"
import type { ChatMessage } from "@/lib/chatApi"
import type { StoredMessage } from "@/store/chatStore"
import type { CommunityRole } from "@/lib/api"

function formatTime(iso: string) {
	const d = new Date(iso)
	return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
}

interface ThreadPanelProps {
	parentMessage: StoredMessage
	communityId: string
	channelId: string
	currentUserId: string | null
	currentUserRole: CommunityRole | null
	onClose: () => void
	onSendReply: (content: string) => void
	onTypingStart: () => void
	onTypingStop: () => void
}

export function ThreadPanel({
	parentMessage,
	communityId,
	channelId,
	currentUserId: _currentUserId,
	currentUserRole: _currentUserRole,
	onClose,
	onSendReply,
	onTypingStart,
	onTypingStop,
}: ThreadPanelProps) {
	const [replies, setReplies] = useState<ChatMessage[]>([])
	const [loading, setLoading] = useState(true)
	const [nextCursor, setNextCursor] = useState<string | null>(null)
	const [loadingMore, setLoadingMore] = useState(false)

	const parentName = `${parentMessage.sender.firstName} ${parentMessage.sender.lastName}`
	const parentInitials = `${parentMessage.sender.firstName[0] ?? ""}${parentMessage.sender.lastName[0] ?? ""}`.toUpperCase()
	const parentColor = avatarColor(parentMessage.sender.firstName)

	const loadReplies = useCallback(async (cursor?: string) => {
		const res = await getMessageReplies(communityId, channelId, parentMessage.id, cursor ? { cursor } : undefined)
		return res
	}, [communityId, channelId, parentMessage.id])

	useEffect(() => {
		setLoading(true)
		loadReplies().then(res => {
			setReplies(res.messages)
			setNextCursor(res.nextCursor)
		}).finally(() => setLoading(false))
	}, [loadReplies])

	const handleLoadMore = async () => {
		if (!nextCursor || loadingMore) return
		setLoadingMore(true)
		const res = await loadReplies(nextCursor)
		setReplies(prev => [...prev, ...res.messages])
		setNextCursor(res.nextCursor)
		setLoadingMore(false)
	}

	return (
		<div className="w-72 shrink-0 border-l-2 border-violet-200 flex flex-col bg-gray-50">
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-violet-100 bg-violet-50/60 shrink-0">
				<div className="flex items-center gap-2">
					<Icon as={ChatDotsSvg} size="sm" color="vibe" />
					<span className="text-body-sm font-semibold text-violet-700">Thread</span>
				</div>
				<button
					type="button"
					onClick={onClose}
					className="text-text-muted hover:text-text-primary transition-colors"
				>
					<Icon as={CloseSvg} size="sm" color="vibe" />
				</button>
			</div>

			{/* Parent message */}
			<div className="px-4 py-3 border-b border-violet-100 bg-white shrink-0">
				<div className="flex gap-2">
					<div className={`relative size-8 rounded-full overflow-hidden border-2 flex items-center justify-center shrink-0 ${parentMessage.sender.avatarUrl ? "bg-surface-hover border-border-default" : `${parentColor.bg} ${parentColor.border}`}`}>
						{parentMessage.sender.avatarUrl ? (
							<Image src={parentMessage.sender.avatarUrl} alt={parentName} fill sizes="32px" className="object-cover" />
						) : (
							<span className={`text-[9px] font-bold ${parentColor.text}`}>{parentInitials}</span>
						)}
					</div>
					<div className="flex-1 min-w-0">
						<p className="text-label-sm font-bold text-text-primary">{parentName}</p>
						<p className="text-label-sm text-text-primary font-normal mt-0.5 leading-snug line-clamp-4">
							{parentMessage.content}
						</p>
					</div>
				</div>
			</div>

			{/* Replies */}
			<div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3 flex flex-col gap-3">
				{loading && <p className="text-label-sm text-text-muted text-center">Loading…</p>}

				{!loading && replies.length === 0 && (
					<p className="text-label-sm text-text-muted text-center">No replies yet. Start the thread!</p>
				)}

				{nextCursor && !loadingMore && (
					<button
						type="button"
						onClick={handleLoadMore}
						className="text-label-sm text-text-brand hover:underline text-center"
					>
						Load older replies
					</button>
				)}

				{replies.map(reply => {
					const name = `${reply.sender.firstName} ${reply.sender.lastName}`
					const initials = `${reply.sender.firstName[0] ?? ""}${reply.sender.lastName[0] ?? ""}`.toUpperCase()
					const color = avatarColor(reply.sender.firstName)
					return (
						<div key={reply.id} className="flex gap-2">
							<div className={`relative size-7 rounded-full overflow-hidden border-2 flex items-center justify-center shrink-0 ${reply.sender.avatarUrl ? "bg-surface-hover border-border-default" : `${color.bg} ${color.border}`}`}>
								{reply.sender.avatarUrl ? (
									<Image src={reply.sender.avatarUrl} alt={name} fill sizes="28px" className="object-cover" />
								) : (
									<span className={`text-[9px] font-bold ${color.text}`}>{initials}</span>
								)}
							</div>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2">
									<span className="text-label-sm font-bold text-text-primary">{name}</span>
									<span className="text-[11px] text-text-muted">{formatTime(reply.createdAt)}</span>
								</div>
								<p className="text-label-sm text-text-primary font-normal mt-0.5 leading-snug">
									{reply.content}
								</p>
							</div>
						</div>
					)
				})}
			</div>

			{/* Reply input */}
			<div className="px-4 py-3.5 border-t border-violet-100 bg-white shrink-0">
				<MessageInput
					placeholder="Reply in thread"
					onSend={onSendReply}
					onTypingStart={onTypingStart}
					onTypingStop={onTypingStop}
				/>
			</div>
		</div>
	)
}
