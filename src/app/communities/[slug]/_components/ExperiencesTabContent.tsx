"use client"

import { useReducer, useEffect } from "react"
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
import { Skeleton } from "@/components/ui/Skeleton"

type State = {
	events: ExploreEvent[]
	total: number
	page: number
	loading: boolean
	loadingMore: boolean
	error: string | null
}

type Action =
	| { type: "FETCH_START" }
	| { type: "FETCH_SUCCESS"; events: ExploreEvent[]; total: number }
	| { type: "FETCH_ERROR"; error: string }
	| { type: "LOAD_MORE_START" }
	| { type: "LOAD_MORE_SUCCESS"; events: ExploreEvent[]; total: number; page: number }
	| { type: "LOAD_MORE_ERROR"; error: string }

const initialState: State = {
	events: [],
	total: 0,
	page: 1,
	loading: true,
	loadingMore: false,
	error: null,
}

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case "FETCH_START":      return { ...state, loading: true, error: null }
		case "FETCH_SUCCESS":    return { ...state, loading: false, events: action.events, total: action.total, page: 1 }
		case "FETCH_ERROR":      return { ...state, loading: false, error: action.error }
		case "LOAD_MORE_START":  return { ...state, loadingMore: true }
		case "LOAD_MORE_SUCCESS": return { ...state, loadingMore: false, events: [...state.events, ...action.events], total: action.total, page: action.page }
		case "LOAD_MORE_ERROR":  return { ...state, loadingMore: false, error: action.error }
	}
}

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

// ─── Component ────────────────────────────────────────────────────────────────

const LIMIT = 20

export function ExperiencesTabContent({
	communitySlug,
	filters = DEFAULT_EXPERIENCE_FILTERS,
}: {
	communitySlug: string
	filters?: ExperienceFilters
}) {
	const [{ events, total, page, loading, loadingMore, error }, dispatch] = useReducer(reducer, initialState)

	const buildParams = (pageNum: number) => ({
		page: pageNum,
		limit: LIMIT,
		dateFilter: filters.dateFilter || undefined,
		categoryId: filters.categoryId || undefined,
		interestSlugs: filters.interestSlugs.length > 0 ? filters.interestSlugs : undefined,
		sortBy: filters.sortBy || undefined,
		sortOrder: filters.sortOrder || undefined,
	})

	useEffect(() => {
		dispatch({ type: "FETCH_START" })
		getCommunityEvents(communitySlug, buildParams(1))
			.then(res => dispatch({ type: "FETCH_SUCCESS", events: res.data.map(toExploreEvent), total: res.total }))
			.catch((err) => dispatch({ type: "FETCH_ERROR", error: getApiErrorMessage(err) }))
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [communitySlug, filters.dateFilter, filters.categoryId, filters.interestSlugs.join(","), filters.sortBy, filters.sortOrder])

	const handleLoadMore = () => {
		const next = page + 1
		dispatch({ type: "LOAD_MORE_START" })
		getCommunityEvents(communitySlug, buildParams(next))
			.then(res => dispatch({ type: "LOAD_MORE_SUCCESS", events: res.data.map(toExploreEvent), total: res.total, page: next }))
			.catch((err) => dispatch({ type: "LOAD_MORE_ERROR", error: getApiErrorMessage(err) }))
	}

	const hasMore = events.length < total
	const hasActiveFilters =
		!!filters.dateFilter ||
		!!filters.categoryId ||
		filters.interestSlugs.length > 0

	return (
		<div className="rounded-panel bg-surface-card border border-border-default p-5 flex flex-col gap-5 shadow-md">
			<div>
				<p className="text-body-md font-semibold text-text-primary">All experiences from this community</p>
				{!loading && total > 0 && (
					<p className="text-label-sm text-text-secondary font-normal mt-0.5">
						{`${total} experience${total === 1 ? "" : "s"}`}
					</p>
				)}
			</div>

			{loading ? (
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
					{Array.from({ length: 8 }).map((_, i) => <Skeleton.Card key={i} />)}
				</div>
			) : error ? (
				<div className="py-8 flex flex-col items-center gap-3 text-center">
					<p className="text-label-sm text-text-secondary">{error}</p>
					<Button
						variant="secondary"
						size="sm"
						onClick={() => {
							dispatch({ type: "FETCH_START" })
							getCommunityEvents(communitySlug, buildParams(1))
								.then(res => dispatch({ type: "FETCH_SUCCESS", events: res.data.map(toExploreEvent), total: res.total }))
								.catch((err) => dispatch({ type: "FETCH_ERROR", error: getApiErrorMessage(err) }))
						}}
					>
						Retry
					</Button>
				</div>
			) : events.length === 0 ? (
				<div className="py-8 text-center">
					<p className="text-label-sm text-text-secondary">
						{hasActiveFilters
							? "No experiences match the selected filters."
							: "No experiences from this community yet."}
					</p>
				</div>
			) : (
				<>
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
						{events.map(event => (
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
