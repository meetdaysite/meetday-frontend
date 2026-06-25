"use client"

import { useState, useEffect } from "react"
import { Icon } from "@/components/ui/Icon"
import ArrowRightSvg from "@/icons/outlined/arrow-right.svg"
import { EventCard } from "@/components/attendee/EventCard"
import { getCommunityEvents } from "@/lib/api"
import type { CommunityEvent } from "@/lib/api"
import type { ExploreEvent } from "@/types/attendee"

// ─── Mapper ───────────────────────────────────────────────────────────────────
// Fields present in API but not yet consumed by ExploreEvent / EventCard:
//   endTime, city, fullAddress, isFree, attendeeCount, status, source, host
// These are tracked in plans/community-experiences-api-gaps.md

function toExploreEvent(e: CommunityEvent): ExploreEvent {
	return {
		id: e.id,
		title: e.title,
		eventDate: e.eventDate,
		startTime: e.startTime,
		venueName: e.venueName,
		tags: e.tags,
		coverImageUrl: e.coverImageUrl,
		startingPrice: e.minPrice,
		eventType: e.eventType ?? "UPCOMING",
		category: { id: "city", name: e.city },
	}
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function EventCardSkeleton() {
	return (
		<div className="rounded-2xl bg-surface-hover animate-pulse aspect-3/4 border border-border-default" />
	)
}

// ─── Upcoming strip (overview tab) ────────────────────────────────────────────

export function UpcomingExperiences({
	communitySlug,
	onViewAll,
}: {
	communitySlug: string
	onViewAll: () => void
}) {
	const [events, setEvents] = useState<ExploreEvent[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(false)

	useEffect(() => {
		void Promise.resolve().then(() => { setLoading(true); setError(false) })
		getCommunityEvents(communitySlug, { upcoming: true, limit: 8 })
			.then(res => setEvents(res.data.map(toExploreEvent)))
			.catch(() => setError(true))
			.finally(() => setLoading(false))
	}, [communitySlug])

	return (
		<div className="rounded-panel bg-surface-card border border-border-default p-5">
			<div className="flex items-center justify-between gap-2 mb-4">
				<p className="text-body-md font-semibold text-text-primary">
					Upcoming experiences from this community
				</p>
				<button
					type="button"
					onClick={onViewAll}
					className="text-sm text-text-brand font-medium hover:underline shrink-0 flex items-center gap-1"
				>
					View all
					<Icon as={ArrowRightSvg} size="sm" className="inline-block" color="brand" />
				</button>
			</div>

			{loading ? (
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
					{Array.from({ length: 5 }).map((_, i) => <EventCardSkeleton key={i} />)}
				</div>
			) : error ? (
				<div className="py-6 text-center">
					<p className="text-label-sm text-text-secondary">
						Failed to load experiences.{" "}
						<button
							type="button"
							className="text-text-brand underline"
							onClick={() => {
								setLoading(true)
								setError(false)
								getCommunityEvents(communitySlug, { upcoming: true, limit: 8 })
									.then(res => setEvents(res.data.map(toExploreEvent)))
									.catch(() => setError(true))
									.finally(() => setLoading(false))
							}}
						>
							Retry
						</button>
					</p>
				</div>
			) : events.length === 0 ? (
				<div className="py-6 text-center">
					<p className="text-label-sm text-text-secondary">No upcoming experiences from this community.</p>
				</div>
			) : (
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
					{events.map(event => (
						<EventCard key={event.id} event={event} />
					))}
				</div>
			)}
		</div>
	)
}
