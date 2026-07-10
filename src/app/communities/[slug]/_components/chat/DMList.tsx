"use client"

import Image from "next/image"
import { Icon } from "@/components/ui/Icon"
import PlusSvg from "@/icons/outlined/plus.svg"
import ArrowRightSvg from "@/icons/outlined/arrow-right.svg"
import type { DmConversation } from "@/lib/chatApi"
import { avatarColor } from "@/lib/avatarColor"

interface DMListProps {
	conversations: DmConversation[]
	activeDmConversationId: string | null
	onSelect: (conv: DmConversation) => void
	onNewDM: () => void
}

export function DMList({ conversations, activeDmConversationId, onSelect, onNewDM }: DMListProps) {
	const shown = conversations.slice(0, 5)
	const hasMore = conversations.length > 5

	return (
		<div className="p-4 flex-1">
			<div className="flex items-center justify-between mb-2">
				<span className="text-[10px] font-bold text-text-muted tracking-wider uppercase">
					Direct Messages
				</span>
				<button
					type="button"
					onClick={onNewDM}
					className="text-text-muted hover:text-text-primary transition-colors"
					title="New direct message"
				>
					<Icon as={PlusSvg} size="sm" color="muted" />
				</button>
			</div>

			{conversations.length === 0 && (
				<div className="flex flex-col gap-1.5 px-2 py-2">
					<p className="text-label-sm text-text-muted font-normal leading-snug">
						No direct messages yet.
					</p>
					<button
						type="button"
						onClick={onNewDM}
						className="text-label-sm text-text-brand font-medium hover:underline text-left"
					>
						Go to Members to start one
					</button>
				</div>
			)}

			<div className="flex flex-col gap-1">
				{shown.map(conv => {
					const isActive = activeDmConversationId === conv.id
					const name = `${conv.other.firstName} ${conv.other.lastName}`
					const initials = `${conv.other.firstName[0] ?? ""}${conv.other.lastName[0] ?? ""}`.toUpperCase()
					const color = avatarColor(conv.other.firstName)

					return (
						<button
							key={conv.id}
							type="button"
							onClick={() => onSelect(conv)}
							className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-action transition-colors text-left ${
								isActive
									? "bg-surface-vibe-soft text-violet-600"
									: "hover:bg-surface-hover"
							}`}
						>
							<div className="relative shrink-0">
								<div className={`relative size-7 rounded-full overflow-hidden border flex items-center justify-center ${conv.other.avatarUrl ? "bg-surface-hover border-border-default" : `${color.bg} ${color.border}`}`}>
									{conv.other.avatarUrl ? (
										<Image src={conv.other.avatarUrl} alt={name} fill sizes="28px" className="object-cover" />
									) : (
										<span className={`text-[9px] font-bold ${color.text}`}>{initials}</span>
									)}
								</div>
							</div>
							<span className="text-label-sm text-text-primary font-medium truncate flex-1">{name}</span>
							{conv.unreadCount > 0 && (
								<span className="size-2 rounded-full bg-text-brand shrink-0" />
							)}
						</button>
					)
				})}
			</div>

			{hasMore && (
				<button
					type="button"
					className="flex items-center gap-1 mt-3 px-2 text-label-sm text-text-brand font-medium hover:underline"
				>
					See all
					<Icon as={ArrowRightSvg} size="xs" color="brand" />
				</button>
			)}
		</div>
	)
}
