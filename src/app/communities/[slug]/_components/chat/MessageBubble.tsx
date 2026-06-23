"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Icon } from "@/components/ui/Icon"
import PinSvg from "@/icons/outlined/pin.svg"
import DotsSvg from "@/icons/outlined/dots.svg"
import ChatSvg from "@/icons/outlined/chat.svg"
import { ReactionBar } from "./ReactionBar"
import type { StoredMessage, AggregatedReactionWithMine } from "@/store/chatStore"
import type { CommunityRole } from "@/lib/api"

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

function formatTime(iso: string) {
	const d = new Date(iso)
	const now = new Date()
	const diff = (now.getTime() - d.getTime()) / 1000

	if (diff < 60) return "just now"
	if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
	if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
	return `${Math.floor(diff / 86400)}d ago`
}

interface MessageBubbleProps {
	message: StoredMessage
	currentUserId: string | null
	currentUserRole: CommunityRole | null
	onReactionToggle: (messageId: string, emoji: string, mine: boolean) => void
	onPin: (messageId: string) => void
	onUnpin: (messageId: string) => void
	onDelete: (messageId: string) => void
	onReply: (messageId: string) => void
}

export function MessageBubble({
	message,
	currentUserId,
	currentUserRole,
	onReactionToggle,
	onPin,
	onUnpin,
	onDelete,
	onReply,
}: MessageBubbleProps) {
	const [menuOpen, setMenuOpen] = useState(false)
	const menuRef = useRef<HTMLDivElement>(null)

	const isOwn = message.senderId === currentUserId
	const isMod = canModerate(currentUserRole)
	const displayName = `${message.sender.firstName} ${message.sender.lastName}`
	const initials = `${message.sender.firstName[0] ?? ""}${message.sender.lastName[0] ?? ""}`.toUpperCase()

	useEffect(() => {
		if (!menuOpen) return
		function handleClick(e: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setMenuOpen(false)
			}
		}
		document.addEventListener("mousedown", handleClick)
		return () => document.removeEventListener("mousedown", handleClick)
	}, [menuOpen])

	return (
		<div
			className={`flex gap-3 group ${
				message.isPinned ? "p-3 rounded-action bg-surface-vibe-soft border border-purple-100" : ""
			}`}
		>
			{/* Avatar */}
			<div className="relative size-9 shrink-0 rounded-full overflow-hidden border border-border-default bg-surface-hover flex items-center justify-center">
				{message.sender.avatarUrl ? (
					<Image
						src={message.sender.avatarUrl}
						alt={displayName}
						fill
						sizes="36px"
						className="object-cover"
					/>
				) : (
					<span className="text-[10px] font-bold text-text-secondary">{initials}</span>
				)}
			</div>

			{/* Content */}
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 flex-wrap">
					<span className="text-label-sm font-bold text-text-primary">{displayName}</span>
					{message.isPinned && (
						<span className="text-[10px] font-semibold text-text-info bg-surface-info-soft border border-blue-200 rounded-avatar px-1.5 py-0.5">
							Pinned
						</span>
					)}
					<span className="text-[11px] text-text-muted">{formatTime(message.createdAt)}</span>
				</div>

				<p className="text-label-sm text-text-primary font-normal mt-0.5 leading-relaxed whitespace-pre-line">
					{message.content}
				</p>

				<ReactionBar
					reactions={message.reactions}
					onToggle={(emoji, mine) => onReactionToggle(message.id, emoji, mine)}
				/>

				{message.replyCount > 0 && (
					<button
						type="button"
						onClick={() => onReply(message.id)}
						className="flex items-center gap-1 mt-1.5 text-[11px] text-text-brand hover:underline"
					>
						<Icon as={ChatSvg} size="xs" color="brand" />
						{message.replyCount} {message.replyCount === 1 ? "reply" : "replies"}
					</button>
				)}
			</div>

			{/* Actions — visible on hover */}
			<div className="shrink-0 flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
				{message.isPinned && isMod && (
					<button
						type="button"
						onClick={() => onUnpin(message.id)}
						className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
						title="Unpin"
					>
						<Icon as={PinSvg} size="sm" color="muted" />
					</button>
				)}

				<div className="relative" ref={menuRef}>
					<button
						type="button"
						onClick={() => setMenuOpen(v => !v)}
						className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
						title="More options"
					>
						<Icon as={DotsSvg} size="sm" color="muted" />
					</button>

					{menuOpen && (
						<div className="absolute right-0 top-7 z-20 min-w-[140px] bg-surface-card border border-border-default rounded-action shadow-lg py-1 text-label-sm">
							<button
								type="button"
								onClick={() => { onReply(message.id); setMenuOpen(false) }}
								className="w-full text-left px-3 py-1.5 text-text-primary hover:bg-surface-hover transition-colors"
							>
								Reply in thread
							</button>
							{isMod && !message.isPinned && (
								<button
									type="button"
									onClick={() => { onPin(message.id); setMenuOpen(false) }}
									className="w-full text-left px-3 py-1.5 text-text-primary hover:bg-surface-hover transition-colors"
								>
									Pin message
								</button>
							)}
							{(isOwn || isMod) && (
								<button
									type="button"
									onClick={() => { onDelete(message.id); setMenuOpen(false) }}
									className="w-full text-left px-3 py-1.5 text-text-error hover:bg-surface-hover transition-colors"
								>
									Delete message
								</button>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
