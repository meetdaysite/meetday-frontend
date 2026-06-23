"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Icon } from "@/components/ui/Icon"
import CloseSvg from "@/icons/outlined/close.svg"
import PinSvg from "@/icons/outlined/pin.svg"
import { getPinnedMessages, unpinMessage } from "@/lib/chatApi"
import type { ChatMessage } from "@/lib/chatApi"
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
	return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

interface PinnedPanelProps {
	communityId: string
	channelId: string
	currentUserRole: CommunityRole | null
	onUnpinSuccess: (messageId: string) => void
	onClose: () => void
}

export function PinnedPanel({
	communityId,
	channelId,
	currentUserRole,
	onUnpinSuccess,
	onClose,
}: PinnedPanelProps) {
	const [messages, setMessages] = useState<ChatMessage[]>([])
	const [loading, setLoading] = useState(true)
	const isMod = canModerate(currentUserRole)

	useEffect(() => {
		setLoading(true)
		getPinnedMessages(communityId, channelId)
			.then(setMessages)
			.finally(() => setLoading(false))
	}, [communityId, channelId])

	const handleUnpin = async (messageId: string) => {
		await unpinMessage(communityId, channelId, messageId)
		setMessages(prev => prev.filter(m => m.id !== messageId))
		onUnpinSuccess(messageId)
	}

	return (
		<div className="w-72 shrink-0 border-l border-border-default flex flex-col bg-surface-page">
			<div className="flex items-center justify-between px-4 py-3 border-b border-border-default shrink-0">
				<div className="flex items-center gap-2">
					<Icon as={PinSvg} size="sm" color="vibe" />
					<span className="text-body-sm font-semibold text-text-primary">Pinned Messages</span>
				</div>
				<button
					type="button"
					onClick={onClose}
					className="text-text-muted hover:text-text-primary transition-colors"
				>
					<Icon as={CloseSvg} size="sm" color="muted" />
				</button>
			</div>

			<div className="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col gap-3">
				{loading && (
					<p className="text-label-sm text-text-muted text-center py-4">Loading…</p>
				)}

				{!loading && messages.length === 0 && (
					<p className="text-label-sm text-text-muted text-center py-4">No pinned messages yet.</p>
				)}

				{messages.map(msg => {
					const name = `${msg.sender.firstName} ${msg.sender.lastName}`
					const initials = `${msg.sender.firstName[0] ?? ""}${msg.sender.lastName[0] ?? ""}`.toUpperCase()

					return (
						<div key={msg.id} className="p-3 rounded-action bg-surface-card border border-border-default flex flex-col gap-2">
							<div className="flex items-center justify-between gap-2">
								<div className="flex items-center gap-2 min-w-0">
									<div className="relative size-7 rounded-full overflow-hidden border border-border-default bg-surface-hover shrink-0 flex items-center justify-center">
										{msg.sender.avatarUrl ? (
											<Image src={msg.sender.avatarUrl} alt={name} fill sizes="28px" className="object-cover" />
										) : (
											<span className="text-[9px] font-bold text-text-secondary">{initials}</span>
										)}
									</div>
									<span className="text-label-sm font-semibold text-text-primary truncate">{name}</span>
								</div>
								<span className="text-[11px] text-text-muted shrink-0">{formatTime(msg.createdAt)}</span>
							</div>

							<p className="text-label-sm text-text-primary font-normal leading-snug line-clamp-3">
								{msg.content}
							</p>

							{isMod && (
								<button
									type="button"
									onClick={() => handleUnpin(msg.id)}
									className="self-start text-[11px] text-text-error hover:underline"
								>
									Unpin
								</button>
							)}
						</div>
					)
				})}
			</div>
		</div>
	)
}
