"use client"

import { Icon } from "@/components/ui/Icon"
import PlusSvg from "@/icons/outlined/plus.svg"
import type { ChatChannel } from "@/lib/chatApi"
import type { CommunityRole } from "@/lib/api"

const ROLE_WEIGHT: Record<CommunityRole, number> = {
	MEMBER: 0,
	MODERATOR: 1,
	HOST: 2,
	MANAGER: 3,
	OWNER: 4,
}

function canManageChannels(role: CommunityRole | null) {
	if (!role) return false
	return ROLE_WEIGHT[role] >= ROLE_WEIGHT["MANAGER"]
}

interface ChannelListProps {
	channels: ChatChannel[]
	activeChannelId: string | null
	onSelect: (channelId: string) => void
	unreadMap: Record<string, number>
	currentUserRole: CommunityRole | null
}

export function ChannelList({
	channels,
	activeChannelId,
	onSelect,
	unreadMap,
	currentUserRole,
}: ChannelListProps) {
	const canCreate = canManageChannels(currentUserRole)

	return (
		<div className="p-4">
			<div className="flex items-center justify-between mb-2">
				<span className="text-[10px] font-bold text-text-muted tracking-wider uppercase">
					Channels
				</span>
				{canCreate && (
					<button
						type="button"
						className="text-text-muted hover:text-text-primary transition-colors"
						title="Create channel"
					>
						<Icon as={PlusSvg} size="sm" color="muted" />
					</button>
				)}
			</div>

			{channels.length === 0 && (
				<p className="text-label-sm text-text-muted font-normal px-2 py-1">
					No channels available
				</p>
			)}

			<div className="flex flex-col gap-0.5">
				{channels.map(ch => {
					const isActive = activeChannelId === ch.id
					const unread = unreadMap[ch.id] ?? 0

					return (
						<button
							key={ch.id}
							type="button"
							onClick={() => onSelect(ch.id)}
							className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-left transition-colors ${
								isActive
									? "bg-surface-vibe-soft text-violet-600 font-semibold"
									: "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
							}`}
						>
							<span className="flex items-center gap-1.5 text-label-sm min-w-0">
								<span className="font-medium shrink-0">#</span>
								<span className="truncate">{ch.name}</span>
							</span>
							{isActive && (
								<span className="size-2 rounded-full bg-violet-500 shrink-0" />
							)}
							{!isActive && unread > 0 && (
								<span className="size-2 rounded-full bg-text-brand shrink-0" />
							)}
						</button>
					)
				})}
			</div>
		</div>
	)
}
