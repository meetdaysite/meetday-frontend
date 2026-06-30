"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Icon } from "@/components/ui/Icon"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import ClockCircleSvg from "@/icons/outlined/clock-circle.svg"
import MapPointSvg from "@/icons/outlined/map-point.svg"
import UserSvg from "@/icons/outlined/user.svg"
import StarCircleSvg from "@/icons/filled/star-circle.svg"
import type { PublicEventDetails, VibeMatchResponse } from "@/types/attendee"
import { useAuthStore } from "@/store/authStore"
import { getEventVibeMatch } from "@/lib/api"

function formatEventDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString("en-IN", {
		weekday: "short",
		day: "numeric",
		month: "long",
		year: "numeric",
	})
}

export function EventPreviewBar({ event }: { event: PublicEventDetails }) {
	const cover = event.media.find(m => m.type === "COVER")
	const categoryLabel = event.category.name.toUpperCase()
	const { user, authLoading } = useAuthStore()
	const [match, setMatch] = useState<VibeMatchResponse | null>(null)

	useEffect(() => {
		if (authLoading || !user) return
		getEventVibeMatch(event.id)
			.then(setMatch)
			.catch(() => {})
	}, [event.id, authLoading, user])

	const showVibe = !!user && match !== null

	return (
		<div className="rounded-panel bg-surface-card border border-border-default p-4 flex gap-5 shadow-md">
			{/* Thumbnail */}
			<div className="relative shrink-0 w-40 rounded-action overflow-hidden bg-neutral-200 self-stretch min-h-25">
				{cover?.url && (
					<Image src={cover.url} alt={event.title} fill sizes="160px" className="object-cover" />
				)}
				<div className="absolute inset-0 bg-linear-to-t from-neutral-900/70 to-neutral-900/20" />
				{categoryLabel && (
					<span className="absolute top-2 left-2 right-2 text-[9px] font-semibold text-white leading-tight bg-action-primary/80 px-1.5 py-0.5 rounded-badge truncate text-center w-fit">
						{categoryLabel}
					</span>
				)}
			</div>

			{/* Event info */}
			<div className="flex-1 min-w-0 flex flex-col justify-around gap-4 py-0.5">
				<div className="flex flex-col gap-2">
					<h3 className="text-heading-sm font-extrabold text-text-primary leading-tight">
						{event.title}
					</h3>

					{/* Meta row */}
					<div className="flex flex-wrap gap-x-4 gap-y-1">
						<div className="flex items-center gap-1.5">
							<Icon as={CalendarSvg} size="sm" color="secondary" />
							<span className="text-body-sm text-text-secondary">
								{formatEventDate(event.eventDate)}
							</span>
						</div>
						<div className="flex items-center gap-1.5">
							<Icon as={ClockCircleSvg} size="sm" color="secondary" />
							<span className="text-body-sm text-text-secondary">
								{event.startTime} – {event.endTime}
							</span>
						</div>
						<div className="flex items-center gap-1.5">
							<Icon as={MapPointSvg} size="sm" color="secondary" />
							<span className="text-body-sm text-text-secondary">
								<span className="font-medium text-text-primary">{event.venueName}</span>
								{", "}
								{event.city}
							</span>
						</div>
					</div>
				</div>

				<div className="h-px bg-border-default w-full"></div>

				{/* Host row */}
				<div className="flex items-center gap-3 flex-wrap">
					<div className="flex items-center gap-2">
						<div className="size-7 rounded-full bg-surface-brand-soft border border-border-brand flex items-center justify-center shrink-0">
							<Icon as={UserSvg} size="sm" color="brand" />
						</div>
						<div className="flex items-center gap-1">
							<span className="text-body-sm text-text-muted">Hosted by</span>
							<span className="text-body-sm font-semibold text-text-primary">
								{event.hostProfile.displayName}
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Vibe match — only shown when authenticated and data is available */}
			{showVibe && (
				<div className="hidden md:flex flex-col items-center justify-center gap-1.5 shrink-0 w-30 rounded-action bg-blue-50 border border-blue-100 p-3 text-center">
					<div className="flex gap-2 items-center justify-center">
						<Icon as={StarCircleSvg} size="lg" color="vibe" />
						<p className="text-heading-sm font-extrabold text-text-vibe leading-none">
							{match.score !== null ? `${match.score}%` : "—"}
						</p>
					</div>
					<p className="text-label-sm font-bold text-text-vibe">
						{match.label ?? "Vibe match"}
					</p>
					{match.summary && (
						<p className="text-[10px] text-text-vibe leading-tight">{match.summary}</p>
					)}
				</div>
			)}
		</div>
	)
}
