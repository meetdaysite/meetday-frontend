"use client"

import { useEffect, useState } from "react"
import { EventCard } from "@/components/attendee/EventCard"
import { Button } from "@/components/ui/Button"
import { Dropdown } from "@/components/ui/Dropdown"
import { Icon } from "@/components/ui/Icon"
import { TextField } from "@/components/ui/TextField"
import { useExploreStore } from "@/store/exploreStore"
import type { DateRangeKey, PriceKey, SortKey } from "@/store/exploreStore"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import GpsSvg from "@/icons/outlined/gps.svg"
import SearchSvg from "@/icons/outlined/search.svg"
import SuspensionBoltSvg from "@/icons/outlined/suspension-bolt.svg"
import TagPriceSvg from "@/icons/outlined/tag-price.svg"
import WidgetsSvg from "@/icons/outlined/widgets.svg"
import { Skeleton } from "@/components/ui/Skeleton"

// ---------------------------------------------------------------------------
// Static option lists
// ---------------------------------------------------------------------------

const SKELETON_COUNT = 12

const DATE_OPTIONS = [
	{ value: "", label: "Any Date" },
	{ value: "today", label: "Today" },
	{ value: "weekend", label: "This Weekend" },
	{ value: "week", label: "This Week" },
	{ value: "next-week", label: "Next Week" },
]

const PRICE_OPTIONS = [
	{ value: "", label: "Any Price" },
	{ value: "free", label: "Free" },
	{ value: "paid", label: "Paid" },
]

const SORT_OPTIONS = [
	{ value: "date-asc", label: "Date: Soonest" },
	{ value: "date-desc", label: "Date: Latest" },
	{ value: "price-asc", label: "Price: Low to High" },
	{ value: "price-desc", label: "Price: High to Low" },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ExperiencesPage() {
	const filters = useExploreStore(s => s.filters)
	const events = useExploreStore(s => s.events)
	const loading = useExploreStore(s => s.loading)
	const error = useExploreStore(s => s.error)
	const loadingMore = useExploreStore(s => s.loadingMore)
	const total = useExploreStore(s => s.total)
	const interests = useExploreStore(s => s.interests)
	const categories = useExploreStore(s => s.categories)
	const fetchEvents = useExploreStore(s => s.fetchEvents)
	const loadMore = useExploreStore(s => s.loadMore)
	const setFilter = useExploreStore(s => s.setFilter)
	const resetFilters = useExploreStore(s => s.resetFilters)
	const fetchInterests = useExploreStore(s => s.fetchInterests)
	const fetchCategories = useExploreStore(s => s.fetchCategories)

	const [searchInput, setSearchInput] = useState(filters.search)
	const [cityInput, setCityInput] = useState(filters.city)

	// Fetch reference data once on mount
	useEffect(() => {
		fetchInterests()
		fetchCategories()
	}, []) // eslint-disable-line

	// Fetch events whenever filters change
	useEffect(() => {
		fetchEvents()
	}, [filters]) // eslint-disable-line

	// Debounce search → store
	useEffect(() => {
		const t = setTimeout(() => setFilter("search", searchInput), 400)
		return () => clearTimeout(t)
	}, [searchInput]) // eslint-disable-line

	// Debounce city → store
	useEffect(() => {
		const t = setTimeout(() => setFilter("city", cityInput), 400)
		return () => clearTimeout(t)
	}, [cityInput]) // eslint-disable-line

	const interestOptions = [
		{ value: "", label: "All Interests" },
		...interests.map(i => ({ value: i.slug, label: i.name })),
	]

	const categoryOptions = [
		{ value: "", label: "All Categories" },
		...categories.map(c => ({ value: c.id, label: c.name })),
	]

	const isFiltered =
		!!filters.search ||
		!!filters.city ||
		!!filters.categoryId ||
		!!filters.interestSlug ||
		!!filters.price ||
		!!filters.dateRange

	function handleClearAll() {
		setSearchInput("")
		setCityInput("")
		resetFilters()
	}

	const hasMore = events.length < total

	return (
		<main className="flex-1 py-8 md:py-10">
			<div className="max-w-384 mx-auto px-(--space-page-x-mobile) md:px-(--space-page-x-tablet) lg:px-(--space-page-x-desktop)">
				<h1 className="text-2xl md:text-3xl font-extrabold text-text-primary mb-6">
					All Experiences
				</h1>

				{/* Search row */}
				<div className="flex items-center gap-2">
					<TextField
						className="flex-1"
						leftIcon={<Icon as={SearchSvg} color="muted" size="sm" />}
						placeholder="Search experiences..."
						value={searchInput}
						onChange={e => setSearchInput(e.target.value)}
						size="md"
					/>
					<TextField
						className="hidden sm:flex w-52 shrink-0"
						leftIcon={<Icon as={GpsSvg} color="muted" size="sm" />}
						placeholder="City (e.g. Mumbai)"
						value={cityInput}
						onChange={e => setCityInput(e.target.value)}
						size="md"
					/>
					<Button
						variant="primary"
						size="md"
						className="bg-neutral-900"
						onClick={() => {
							setFilter("search", searchInput)
							setFilter("city", cityInput)
						}}
					>
						Search
					</Button>
				</div>

				{/* Filter chips */}
				<div className="flex items-center justify-between gap-2 mt-4 flex-wrap">
					<div className="flex items-center gap-2 flex-wrap">
						<Button
							size="sm"
							radius="md"
							variant="secondary"
							onClick={handleClearAll}
							className={
								!isFiltered ? "bg-neutral-900! text-white! border-neutral-900!" : ""
							}
						>
							All Events
						</Button>

						<Dropdown
							size="sm"
							placeholder="Date"
							options={DATE_OPTIONS}
							value={filters.dateRange}
							onChange={v => setFilter("dateRange", v as DateRangeKey)}
							className="w-36"
							leftIcon={<Icon as={CalendarSvg} color="muted" size="sm" />}
						/>
						<Dropdown
							size="sm"
							placeholder="Interests"
							options={interestOptions}
							value={filters.interestSlug}
							onChange={v => setFilter("interestSlug", v)}
							className="w-36"
							leftIcon={<Icon as={SuspensionBoltSvg} color="muted" size="sm" />}
						/>
						<Dropdown
							size="sm"
							placeholder="Category"
							options={categoryOptions}
							value={filters.categoryId}
							onChange={v => setFilter("categoryId", v)}
							className="w-36"
							leftIcon={<Icon as={WidgetsSvg} color="muted" size="sm" />}
						/>
						<Dropdown
							size="sm"
							placeholder="Price"
							options={PRICE_OPTIONS}
							value={filters.price}
							onChange={v => setFilter("price", v as PriceKey)}
							className="w-32"
							leftIcon={<Icon as={TagPriceSvg} color="muted" size="sm" />}
						/>
					</div>

					<Dropdown
						size="sm"
						placeholder="Sort"
						options={SORT_OPTIONS}
						value={filters.sort}
						onChange={v => setFilter("sort", v as SortKey)}
						className="w-44"
					/>
				</div>

				{/* Events grid */}
				{loading ? (
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mt-6">
						{Array.from({ length: SKELETON_COUNT }).map((_, i) => (
							<Skeleton.Card key={i} />
						))}
					</div>
				) : error ? (
					<div className="mt-16 flex flex-col items-center gap-4 text-center">
						<p className="text-body-md text-text-secondary">{error}</p>
						<Button variant="secondary" size="sm" onClick={fetchEvents}>
							Retry
						</Button>
					</div>
				) : events.length === 0 ? (
					<div className="mt-16 text-center">
						<p className="text-body-md text-text-secondary">
							No experiences found. Try adjusting your filters.
						</p>
					</div>
				) : (
					<>
						<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mt-6">
							{events.map(event => (
								<EventCard key={event.id} event={event} />
							))}
						</div>

						{hasMore && (
							<div className="mt-8 flex justify-center">
								<Button
									variant="secondary"
									size="md"
									onClick={loadMore}
									disabled={loadingMore}
								>
									{loadingMore ? "Loading..." : "Load more"}
								</Button>
							</div>
						)}
					</>
				)}
			</div>
		</main>
	)
}
