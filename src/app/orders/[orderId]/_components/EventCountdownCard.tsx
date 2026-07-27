"use client"

import { useEffect, useState } from "react"
import { Icon } from "@/components/ui/Icon"
import ClockCircleSvg from "@/icons/filled/clock-circle.svg"
import { parseEventDateTime } from "@/lib/eventDateTime"

interface Remaining {
	days: number
	hours: number
	mins: number
	secs: number
}

function getRemaining(target: Date): Remaining | null {
	const diff = target.getTime() - Date.now()
	if (diff <= 0) return null
	return {
		days: Math.floor(diff / (1000 * 60 * 60 * 24)),
		hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
		mins: Math.floor((diff / (1000 * 60)) % 60),
		secs: Math.floor((diff / 1000) % 60),
	}
}

interface EventCountdownCardProps {
	eventDate: string
	startTime: string
	eventTitle: string
}

export function EventCountdownCard({ eventDate, startTime, eventTitle }: EventCountdownCardProps) {
	const target = parseEventDateTime(eventDate, startTime)
	const [remaining, setRemaining] = useState<Remaining | null>(() => getRemaining(target))

	useEffect(() => {
		const interval = setInterval(() => setRemaining(getRemaining(target)), 1000)
		return () => clearInterval(interval)
	}, [target.getTime()]) // eslint-disable-line react-hooks/exhaustive-deps

	if (!remaining) return null

	const units: { value: number; label: string }[] = [
		{ value: remaining.days, label: "Days" },
		{ value: remaining.hours, label: "Hours" },
		{ value: remaining.mins, label: "Mins" },
		{ value: remaining.secs, label: "Secs" },
	]

	return (
		<div className="rounded-action bg-surface-card border border-border-default shadow-md p-5 flex flex-col gap-4">
			<div className="flex items-center gap-2">
				<Icon as={ClockCircleSvg} size="lg" color="vibe" />
				<span className="text-title-md font-bold text-text-primary">Event Countdown</span>
			</div>

			<div className="grid grid-cols-4 gap-2">
				{units.map(u => (
					<div
						key={u.label}
						className="rounded-action bg-surface-vibe-soft border border-violet-200 flex flex-col items-center justify-center py-2.5"
					>
						<span className="text-heading-sm font-extrabold text-text-vibe leading-none">
							{String(u.value).padStart(2, "0")}
						</span>
						<span className="text-caption text-text-vibe mt-1">{u.label}</span>
					</div>
				))}
			</div>

			<p className="text-label-sm font-normal text-text-primary">Until <span className="font-medium">{eventTitle}</span> begins</p>
		</div>
	)
}
