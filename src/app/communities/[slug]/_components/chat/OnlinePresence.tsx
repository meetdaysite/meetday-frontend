"use client"

import Image from "next/image"
import type { PresenceUser } from "@/lib/chatSocket"

const MAX_SHOWN = 10

interface OnlinePresenceProps {
	onlineCount: number
	onlineUsers: PresenceUser[]
}

export function OnlinePresence({ onlineCount, onlineUsers }: OnlinePresenceProps) {
	const shown = onlineUsers.slice(0, MAX_SHOWN)
	const overflow = onlineCount - shown.length

	return (
		<div className="p-4">
			<p className="text-[10px] font-bold text-text-muted tracking-wider uppercase mb-3">
				Online now · {onlineCount}
			</p>
			<div className="flex flex-wrap gap-1.5">
				{shown.map(u => {
					const initials = `${u.firstName[0] ?? ""}${u.lastName[0] ?? ""}`.toUpperCase()
					return (
						<div key={u.id} className="relative" title={`${u.firstName} ${u.lastName}`}>
							<div className="relative size-8 rounded-full overflow-hidden border border-surface-card bg-surface-hover flex items-center justify-center">
								{u.avatarUrl ? (
									<Image src={u.avatarUrl} alt={`${u.firstName} ${u.lastName}`} fill sizes="32px" className="object-cover" />
								) : (
									<span className="text-[9px] font-bold text-text-secondary">{initials}</span>
								)}
							</div>
							<span className="absolute bottom-0 right-0 size-2 rounded-full bg-green-500 border border-surface-card" />
						</div>
					)
				})}
				{overflow > 0 && (
					<div className="size-8 rounded-full bg-surface-hover border border-border-default flex items-center justify-center">
						<span className="text-[9px] font-semibold text-text-muted">+{overflow}</span>
					</div>
				)}
			</div>
		</div>
	)
}
