"use client"

import { useState, useEffect, useMemo } from "react"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import AltArrowDownSvg from "@/icons/outlined/alt-arrow-down.svg"
import { EventCard } from "@/components/attendee/EventCard"
import { getCommunityEvents } from "@/lib/api"
import type { CommunityEvent } from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"
import type { ExploreEvent } from "@/types/attendee"
import type { ExperienceFilters } from "./CommunitySidePanel"
import { DEFAULT_EXPERIENCE_FILTERS } from "./CommunitySidePanel"

// ─── Mapper ───────────────────────────────────────────────────────────────────

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

// ─── Client-side date filter + sort ──────────────────────────────────────────

function passesDateFilter(eventDate: string, filter: string): boolean {
	if (filter === "All") return true
	const now = new Date()
	const d = new Date(eventDate)
	if (filter === "This Week") {
		const start = new Date(now)
		start.setDate(now.getDate() - now.getDay())
		start.setHours(0, 0, 0, 0)
		const end = new Date(start)
		end.setDate(start.getDate() + 6)
		end.setHours(23, 59, 59, 999)
		return d >= start && d <= end
	}
	if (filter === "This Month") {
		return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
	}
	if (filter === "Next Month") {
		const nm = new Date(now.getFullYear(), now.getMonth() + 1, 1)
		return d.getMonth() === nm.getMonth() && d.getFullYear() === nm.getFullYear()
	}
	return true
}

function applyDateAndSort(events: CommunityEvent[], filters: ExperienceFilters): CommunityEvent[] {
	const filtered = events.filter(e => passesDateFilter(e.eventDate, filters.date))
	const sorted = [...filtered]
	if (filters.sort === "Date: Latest") {
		sorted.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
	} else if (filters.sort === "Date: Soonest") {
		sorted.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
	} else if (filters.sort === "Popularity") {
		sorted.sort((a, b) => b.attendeeCount - a.attendeeCount)
	} else if (filters.sort === "Price: Low to High") {
		sorted.sort((a, b) => a.minPrice - b.minPrice)
	}
	return sorted
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function EventCardSkeleton() {
	return (
		<div className="rounded-2xl bg-surface-hover animate-pulse aspect-3/4 border border-border-default" />
	)
}

// ─── Component ────────────────────────────────────────────────────────────────

const LIMIT = 20

export function ExperiencesTabContent({
	communitySlug,
	filters = DEFAULT_EXPERIENCE_FILTERS,
}: {
	communitySlug: string
	filters?: ExperienceFilters
}) {
	const [rawEvents, setRawEvents] = useState<CommunityEvent[]>([])
	const [total, setTotal] = useState(0)
	const [page, setPage] = useState(1)
	const [loading, setLoading] = useState(true)
	const [loadingMore, setLoadingMore] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const serverParams = {
		categoryId: filters.categoryId || undefined,
		interestSlug: filters.interestSlug || undefined,
	}

	const fetchPage = (pageNum: number) =>
		getCommunityEvents(communitySlug, { page: pageNum, limit: LIMIT, ...serverParams })

	// Re-fetch from page 1 whenever community or server-side filters change
	useEffect(() => {
		setLoading(true)
		setError(null)
		getCommunityEvents(communitySlug, {
			page: 1,
			limit: LIMIT,
			categoryId: filters.categoryId || undefined,
			interestSlug: filters.interestSlug || undefined,
		})
			.then(res => {
				setRawEvents(res.data)
				setTotal(res.total)
				setPage(1)
			})
			.catch((err) => setError(getApiErrorMessage(err)))
			.finally(() => setLoading(false))
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [communitySlug, filters.categoryId, filters.interestSlug])

	const handleLoadMore = () => {
		const next = page + 1
		setLoadingMore(true)
		fetchPage(next)
			.then(res => {
				setRawEvents(prev => [...prev, ...res.data])
				setTotal(res.total)
				setPage(next)
			})
			.catch((err) => setError(getApiErrorMessage(err)))
			.finally(() => setLoadingMore(false))
	}

	const displayEvents = useMemo<ExploreEvent[]>(
		() => applyDateAndSort(rawEvents, filters).map(toExploreEvent),
		[rawEvents, filters],
	)

	const hasMore = rawEvents.length < total
	const hasDateFilter = filters.date !== "All"

	return (
		<div className="rounded-panel bg-surface-card border border-border-default p-5 flex flex-col gap-5">
			<div>
				<p className="text-body-md font-semibold text-text-primary">All experiences from this community</p>
				{!loading && total > 0 && (
					<p className="text-label-sm text-text-secondary font-normal mt-0.5">
						{hasDateFilter
							? `${displayEvents.length} of ${total} experience${total === 1 ? "" : "s"}`
							: `${total} experience${total === 1 ? "" : "s"}`}
					</p>
				)}
			</div>

			{loading ? (
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
					{Array.from({ length: 8 }).map((_, i) => <EventCardSkeleton key={i} />)}
				</div>
			) : error ? (
				<div className="py-8 flex flex-col items-center gap-3 text-center">
					<p className="text-label-sm text-text-secondary">{error}</p>
					<Button
						variant="secondary"
						size="sm"
						onClick={() => {
							setLoading(true)
							setError(null)
							fetchPage(1)
								.then(res => { setRawEvents(res.data); setTotal(res.total); setPage(1) })
								.catch((err) => setError(getApiErrorMessage(err)))
								.finally(() => setLoading(false))
						}}
					>
						Retry
					</Button>
				</div>
			) : displayEvents.length === 0 ? (
				<div className="py-8 text-center">
					<p className="text-label-sm text-text-secondary">
						{filters.categoryId || filters.interestSlug || hasDateFilter
							? "No experiences match the selected filters."
							: "No experiences from this community yet."}
					</p>
				</div>
			) : (
				<>
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
						{displayEvents.map(event => (
							<EventCard key={event.id} event={event} />
						))}
					</div>

					{hasMore && (
						<button
							type="button"
							disabled={loadingMore}
							onClick={handleLoadMore}
							className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-action border border-border-default text-label-sm text-text-brand font-semibold hover:bg-surface-brand-soft transition-colors disabled:opacity-50"
						>
							{loadingMore ? "Loading…" : "Load more experiences"}
							{!loadingMore && <Icon as={AltArrowDownSvg} size="xs" color="brand" />}
						</button>
					)}
				</>
			)}
		</div>
	)
}
