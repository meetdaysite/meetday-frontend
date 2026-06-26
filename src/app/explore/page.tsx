"use client"

import { useEffect, useState } from "react"
import { CommunityCard } from "@/components/attendee/CommunityCard"
import { EventCard } from "@/components/attendee/EventCard"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import { getPublicEvents, getRecommendedCommunities } from "@/lib/api"
import type { PublicCommunity } from "@/lib/api"
import type { ExploreEvent } from "@/types/attendee"
import ArrowRightSvg from "@/icons/outlined/arrow-right.svg"
import Link from "next/link"

// ---------------------------------------------------------------------------
// Skeleton card
// ---------------------------------------------------------------------------

function SkeletonCard() {
	return <div className="aspect-3/4 rounded-2xl bg-surface-hover animate-pulse" />
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ExploreEventsPage() {
	const [communities, setCommunities] = useState<PublicCommunity[]>([])
	const [communitiesLoading, setCommunitiesLoading] = useState(true)

	const [events, setEvents] = useState<ExploreEvent[]>([])
	const [eventsLoading, setEventsLoading] = useState(true)
	const [eventsError, setEventsError] = useState<string | null>(null)

	useEffect(() => {
		let cancelled = false

		getRecommendedCommunities({ limit: 6 })
			.then(res => {
				if (!cancelled) setCommunities(res.data.slice(0, 6))
			})
			.catch(() => {
				// silently show nothing on error
			})
			.finally(() => {
				if (!cancelled) setCommunitiesLoading(false)
			})

		return () => { cancelled = true }
	}, [])

	function fetchEvents() {
		setEventsLoading(true)
		setEventsError(null)
		getPublicEvents({ limit: 6 })
			.then(res => {
				setEvents(res.events)
			})
			.catch(() => setEventsError("Failed to load experiences."))
			.finally(() => setEventsLoading(false))
	}

	useEffect(() => {
		void Promise.resolve().then(fetchEvents)
	}, [])

	return (
		<main className="flex-1 py-8 md:py-10">
			<div className="max-w-384 mx-auto px-(--space-page-x-mobile) md:px-(--space-page-x-tablet) lg:px-(--space-page-x-desktop)">
				<div className="flex gap-8 items-start">
					<div className="flex-1 min-w-0">
						{/* Hero */}
						<div className="mb-10 max-w-2xl">
							<h1 className="text-2xl md:text-3xl xl:text-4xl font-extrabold leading-[1.12] text-text-primary mb-3">
								Find events that <span className="text-text-brand">feel like you.</span>
								<br />
								Meet people who <span className="text-text-brand">match your vibe.</span>
							</h1>
							<p className="text-body-sm text-text-secondary leading-relaxed">
								Discover real events — from music nights to mindful mornings and connect with
								people who share your interests.
							</p>
						</div>

						{/* Communities section */}
						<div>
							<div className="flex items-center justify-between gap-2 mb-4">
								<div>
									<div className="text-xl font-medium">Communities around you</div>
									<p className="text-body-sm text-text-secondary mt-0.5">
										Join communities to discover more events, get updates, and meet people
										with similar vibes.
									</p>
								</div>
								<Link
									href="/communities"
									className="text-sm text-text-brand font-medium hover:underline shrink-0"
								>
									View all communities
									<Icon as={ArrowRightSvg} size="sm" className="inline-block ml-1" />
								</Link>
							</div>

							{communitiesLoading ? (
								<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
									{Array.from({ length: 6 }).map((_, i) => (
										<SkeletonCard key={i} />
									))}
								</div>
							) : communities.length === 0 ? null : (
								<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
									{communities.map(community => (
										<CommunityCard key={community.id} community={community} />
									))}
								</div>
							)}
						</div>

						{/* Experiences section */}
						<div className="mt-10">
							<div className="flex items-center justify-between gap-2 mb-4 font-medium">
								<div className="text-xl">Experiences for you</div>
								<Link
									href="/experiences"
									className="text-sm text-text-brand hover:underline shrink-0"
								>
									View all experiences
									<Icon as={ArrowRightSvg} size="sm" className="inline-block ml-1" />
								</Link>
							</div>

							{eventsLoading ? (
								<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
									{Array.from({ length: 6 }).map((_, i) => (
										<SkeletonCard key={i} />
									))}
								</div>
							) : eventsError ? (
								<div className="mt-12 flex flex-col items-center gap-4 text-center">
									<p className="text-body-md text-text-secondary">{eventsError}</p>
									<Button variant="secondary" size="sm" onClick={fetchEvents}>
										Retry
									</Button>
								</div>
							) : events.length === 0 ? (
								<div className="mt-12 text-center">
									<p className="text-body-md text-text-secondary">No experiences found.</p>
								</div>
							) : (
								<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
									{events.map(event => (
										<EventCard key={event.id} event={event} />
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</main>
	)
}
