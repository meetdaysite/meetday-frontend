import type { LiveStatsResponse } from "@/lib/scannerApi"

type Props = {
	stats: LiveStatsResponse | null
	syncStatus?: "live" | "offline"
	showSync?: boolean
	lastSynced?: string
}

export function LiveStats({ stats, syncStatus, showSync = false }: Props) {
	return (
		<div className="flex items-center justify-between gap-2">
			<StatItem
				icon={<CheckIcon />}
				label="Checked in"
				value={stats?.checkedIn ?? "—"}
				sub="This gate"
				color="text-green-600"
			/>
			<div className="w-px h-10 bg-neutral-100" />
			<StatItem
				icon={<PeopleIcon />}
				label="Remaining"
				value={stats?.remaining ?? "—"}
				sub="To be checked in"
				color="text-neutral-700"
			/>
			<div className="w-px h-10 bg-neutral-100" />
			{showSync ? (
				<div className="flex flex-col items-center gap-0.5 flex-1">
					<div className="flex items-center gap-1">
						{syncStatus === "live" ? <SyncIcon className="text-green-500" /> : <OfflineIcon className="text-orange-400" />}
						<span className="text-[13px] font-bold text-neutral-800">
							{syncStatus === "live" ? "Live" : "Offline"}
						</span>
					</div>
					<span className="text-[11px] text-neutral-400">
						{syncStatus === "live" ? "● Connected" : "Reconnecting…"}
					</span>
				</div>
			) : (
				<StatItem
					icon={<NoShowIcon />}
					label="No-shows"
					value={stats?.noShows ?? "—"}
					sub="Marked"
					color="text-orange-500"
				/>
			)}
		</div>
	)
}

function StatItem({
	icon,
	label: _label,
	value,
	sub,
	color,
}: {
	icon: React.ReactNode
	label: string
	value: number | string
	sub: string
	color: string
}) {
	return (
		<div className="flex flex-col items-center gap-0.5 flex-1">
			<div className={`flex items-center gap-1 ${color}`}>
				{icon}
				<span className="text-[18px] font-bold">{value}</span>
			</div>
			<span className="text-[11px] text-neutral-400 text-center leading-tight">{sub}</span>
		</div>
	)
}

function CheckIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
			<path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}
function PeopleIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
			<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
			<circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
			<path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}
function NoShowIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
			<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
			<path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}
function SyncIcon({ className }: { className?: string }) {
	return (
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
			<path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}
function OfflineIcon({ className }: { className?: string }) {
	return (
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
			<path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}
