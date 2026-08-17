import type { LiveStatsResponse } from "@/lib/scannerApi"

type Props = {
	stats: LiveStatsResponse | null
}

export function LiveStats({ stats }: Props) {
	return (
		<div className="flex items-center justify-between gap-2">
			<StatItem
				icon={<CheckIcon />}
				label="Checked in"
				value={stats?.checkedIn ?? "—"}
				sub="So far"
				className="text-text-success"
			/>
			<div className="w-px h-10 bg-border-subtle" />
			<StatItem
				icon={<PeopleIcon />}
				label="Remaining"
				value={stats?.remaining ?? "—"}
				sub="To be checked in"
				className="text-text-primary"
			/>
		</div>
	)
}

function StatItem({
	icon,
	value,
	sub,
	className,
}: {
	icon: React.ReactNode
	label: string
	value: number | string
	sub: string
	className: string
}) {
	return (
		<div className="flex flex-col items-center gap-0.5 flex-1">
			<div className={`flex items-center gap-1 ${className}`}>
				{icon}
				<span className="text-title-md font-bold">{value}</span>
			</div>
			<span className="text-caption text-text-muted text-center leading-tight">{sub}</span>
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
