"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Icon } from "@/components/ui/Icon"
import PinSvg from "@/icons/outlined/pin.svg"
import DotsSvg from "@/icons/outlined/dots.svg"
import ChatSvg from "@/icons/outlined/chat.svg"
import SmileCircleSvg from "@/icons/outlined/smile-circle.svg"
import { ReactionBar } from "./ReactionBar"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { avatarColor } from "@/lib/avatarColor"
import type { StoredMessage } from "@/store/chatStore"
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

function formatTimeShort(iso: string) {
	return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })
}

interface MessageBubbleProps {
	message: StoredMessage
	isGrouped?: boolean
	isActiveThread?: boolean
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
	isGrouped = false,
	isActiveThread = false,
	currentUserId,
	currentUserRole,
	onReactionToggle,
	onPin,
	onUnpin,
	onDelete,
	onReply,
}: MessageBubbleProps) {
	const [menuOpen, setMenuOpen] = useState(false)
	const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const menuRef = useRef<HTMLDivElement>(null)
	const emojiRef = useRef<HTMLDivElement>(null)

	const isOwn = message.senderId === currentUserId
	const isMod = canModerate(currentUserRole)
	const displayName = `${message.sender.firstName} ${message.sender.lastName}`
	const initials = `${message.sender.firstName[0] ?? ""}${message.sender.lastName[0] ?? ""}`.toUpperCase()
	const color = avatarColor(message.sender.firstName)

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

	useEffect(() => {
		if (!emojiPickerOpen) return
		function handleClick(e: MouseEvent) {
			if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
				setEmojiPickerOpen(false)
			}
		}
		document.addEventListener("mousedown", handleClick)
		return () => document.removeEventListener("mousedown", handleClick)
	}, [emojiPickerOpen])

	return (
		<>
			<div
				className={`flex gap-3 group relative ${isGrouped ? "mt-0.5" : "mt-4"} ${
					message.isPinned
						? isActiveThread
							? "p-3 rounded-action bg-surface-vibe-soft border border-purple-400"
							: "p-3 rounded-action bg-surface-vibe-soft border border-purple-100"
						: "px-1"
				}`}
			>
				{/* Avatar or grouped spacer */}
				{isGrouped ? (
					<div className="w-10 shrink-0" />
				) : (
					<div
						className={`relative size-10 shrink-0 rounded-full overflow-hidden border-2 flex items-center justify-center self-start ${message.sender.avatarUrl ? "border-border-default bg-surface-hover" : `${color.border} ${color.bg}`}`}
					>
						{message.sender.avatarUrl ? (
							<Image
								src={message.sender.avatarUrl}
								alt={displayName}
								fill
								sizes="40px"
								className="object-cover"
							/>
						) : (
							<span className={`text-[10px] font-bold ${color.text}`}>{initials}</span>
						)}
					</div>
				)}

				{/* Content */}
				<div
					className={`rounded-lg ${
						message.isPinned
							? "bg-surface-vibe-soft"
							: isOwn
								? isActiveThread
									? "p-3 bg-surface-brand-soft border border-border-focus"
									: "p-3 bg-surface-brand-soft border border-border-brand"
								: isActiveThread
									? "p-3 bg-neutral-50 border border-neutral-500"
									: "p-3 bg-neutral-50 border border-border-default"
					}`}
				>
					{!isGrouped && (
						<div className="flex items-center gap-2 mb-0.5">
							<span
								className={`text-label-sm font-bold ${isOwn ? "text-text-brand" : "text-text-primary"}`}
							>
								{displayName}
							</span>
							{message.isPinned && (
								<span className="text-[10px] font-semibold text-text-info bg-surface-info-soft border border-blue-200 rounded-avatar px-1.5 py-0.5">
									Pinned
								</span>
							)}
							<span className="text-[11px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
								{formatTimeShort(message.createdAt)}
							</span>
						</div>
					)}

					<p className="text-label-sm text-text-primary font-normal leading-relaxed whitespace-pre-line">
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

				{/* Emoji picker — anchored to the outer row so it never clips */}
				{emojiPickerOpen && (
					<div ref={emojiRef} className="absolute left-13 bottom-full mb-1 z-20 flex gap-1 p-2 bg-surface-card border border-border-default rounded-action shadow-lg">
						{["👍", "❤️", "😂", "🔥", "👏", "😮", "😢", "🎉"].map(emoji => (
							<button
								key={emoji}
								type="button"
								onClick={() => {
									const existing = message.reactions.find(r => r.emoji === emoji)
									onReactionToggle(message.id, emoji, existing?.mine ?? false)
									setEmojiPickerOpen(false)
								}}
								className="text-lg leading-none p-1 rounded hover:bg-surface-hover transition-colors"
							>
								{emoji}
							</button>
						))}
					</div>
				)}

				{/* Actions — visible on hover */}
				<div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity self-start mt-0.5">
					<div>
						<button
							type="button"
							onClick={() => setEmojiPickerOpen(v => !v)}
							className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
							title="Add reaction"
						>
							<Icon as={SmileCircleSvg} size="sm" color="muted" />
						</button>
					</div>

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
							<div className="absolute right-0 top-7 z-20 min-w-35 bg-surface-card border border-border-default rounded-action shadow-lg py-1 text-label-sm">
								<button
									type="button"
									onClick={() => {
										onReply(message.id)
										setMenuOpen(false)
									}}
									className="w-full text-left px-3 py-1.5 text-text-primary hover:bg-surface-hover transition-colors"
								>
									Reply in thread
								</button>
								{isMod && !message.isPinned && (
									<button
										type="button"
										onClick={() => {
											onPin(message.id)
											setMenuOpen(false)
										}}
										className="w-full text-left px-3 py-1.5 text-text-primary hover:bg-surface-hover transition-colors"
									>
										Pin message
									</button>
								)}
								{(isOwn || isMod) && (
									<button
										type="button"
										onClick={() => {
											setMenuOpen(false)
											setDeleteDialogOpen(true)
										}}
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

			<ConfirmDialog
				open={deleteDialogOpen}
				title="Delete message?"
				description="This will permanently remove the message for everyone in the channel."
				confirmLabel="Delete"
				destructive
				onClose={() => setDeleteDialogOpen(false)}
				onConfirm={() => {
					onDelete(message.id)
					setDeleteDialogOpen(false)
				}}
			/>
		</>
	)
}
