"use client"

import { useEffect, useState } from "react"
import { CommunityCard } from "@/components/attendee/CommunityCard"
import type { Community } from "@/components/attendee/CommunityCard"
import { EventCard } from "@/components/attendee/EventCard"
import { Button } from "@/components/ui/Button"
import { Dropdown } from "@/components/ui/Dropdown"
import { Icon } from "@/components/ui/Icon"
import { TextField } from "@/components/ui/TextField"
import { useExploreStore } from "@/store/exploreStore"
import type { DateRangeKey, PriceKey, SortKey } from "@/store/exploreStore"
import ArrowRightSvg from "@/icons/outlined/arrow-right.svg"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import GpsSvg from "@/icons/outlined/gps.svg"
import SearchSvg from "@/icons/outlined/search.svg"
import SuspensionBoltSvg from "@/icons/outlined/suspension-bolt.svg"
import TagPriceSvg from "@/icons/outlined/tag-price.svg"
import WidgetsSvg from "@/icons/outlined/widgets.svg"
import Link from "next/link"

// ---------------------------------------------------------------------------
// Community mock data
// ---------------------------------------------------------------------------

// TODO: Replace with API call — GET /api/communities/nearby?limit=10
const MOCK_COMMUNITIES: Community[] = [
	{
		id: "1",
		name: "Founder's Huddle",
		memberCount: 1200,
		upcomingCount: 12,
		coverImageUrl: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=300&fit=crop",
		memberAvatars: [
			"https://i.pravatar.cc/32?img=1",
			"https://i.pravatar.cc/32?img=2",
			"https://i.pravatar.cc/32?img=3",
			"https://i.pravatar.cc/32?img=4",
		],
		extraMemberCount: 42,
	},
	{
		id: "2",
		name: "Supper Club",
		memberCount: 2100,
		upcomingCount: 18,
		coverImageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop",
		memberAvatars: [
			"https://i.pravatar.cc/32?img=5",
			"https://i.pravatar.cc/32?img=6",
			"https://i.pravatar.cc/32?img=7",
			"https://i.pravatar.cc/32?img=8",
		],
		extraMemberCount: 56,
	},
	{
		id: "3",
		name: "Sunrise Social Club",
		memberCount: 1800,
		upcomingCount: 14,
		coverImageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop",
		memberAvatars: [
			"https://i.pravatar.cc/32?img=9",
			"https://i.pravatar.cc/32?img=10",
			"https://i.pravatar.cc/32?img=11",
			"https://i.pravatar.cc/32?img=12",
		],
		extraMemberCount: 34,
	},
	{
		id: "4",
		name: "Gallery Hops",
		memberCount: 1100,
		upcomingCount: 10,
		coverImageUrl: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=300&fit=crop",
		memberAvatars: [
			"https://i.pravatar.cc/32?img=13",
			"https://i.pravatar.cc/32?img=14",
			"https://i.pravatar.cc/32?img=15",
			"https://i.pravatar.cc/32?img=16",
		],
		extraMemberCount: 34,
	},
	{
		id: "5",
		name: "Creator Meetups",
		memberCount: 1100,
		upcomingCount: 10,
		coverImageUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&h=300&fit=crop",
		memberAvatars: [
			"https://i.pravatar.cc/32?img=17",
			"https://i.pravatar.cc/32?img=18",
			"https://i.pravatar.cc/32?img=19",
			"https://i.pravatar.cc/32?img=20",
		],
		extraMemberCount: 39,
	},
	{
		id: "6",
		name: "Book & Brew",
		memberCount: 900,
		upcomingCount: 8,
		coverImageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop",
		memberAvatars: [
			"https://i.pravatar.cc/32?img=21",
			"https://i.pravatar.cc/32?img=22",
			"https://i.pravatar.cc/32?img=23",
			"https://i.pravatar.cc/32?img=24",
		],
		extraMemberCount: 27,
	},
]

// ---------------------------------------------------------------------------
// Static option lists
// ---------------------------------------------------------------------------

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
// Skeleton card
// ---------------------------------------------------------------------------

function SkeletonCard() {
	return <div className="aspect-3/4 rounded-2xl bg-surface-hover animate-pulse" />
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ExploreEventsPage() {
	const filters = useExploreStore(s => s.filters)
	const events = useExploreStore(s => s.events)
	const loading = useExploreStore(s => s.loading)
	const error = useExploreStore(s => s.error)
	const interests = useExploreStore(s => s.interests)
	const categories = useExploreStore(s => s.categories)
	const fetchEvents = useExploreStore(s => s.fetchEvents)
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


	return (
		<main className="flex-1 py-8 md:py-10">
			<div className="max-w-384 mx-auto px-(--space-page-x-mobile) md:px-(--space-page-x-tablet) lg:px-(--space-page-x-desktop)">
				<div className="flex gap-8 items-start">
					<div className="flex-1 min-w-0">
						{/* Hero */}
						<div className="mb-8 max-w-2xl">
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

						{/* Communities section */}
						<div className="mt-10">
							<div className="flex items-center justify-between gap-2 mb-4">
								<div>
									<div className="text-xl font-medium">Communities around you</div>
									<p className="text-body-sm text-text-secondary mt-0.5">
										Join communities to discover more events, get updates, and meet people
										with similar vibes.
									</p>
								</div>
								{/* TODO: Link to /communities once the communities listing page is built */}
								<Link
									href="/communities"
									className="text-sm text-text-brand font-medium hover:underline shrink-0"
								>
									View all communities
									<Icon as={ArrowRightSvg} size="sm" className="inline-block ml-1" />
								</Link>
							</div>
							{/* TODO: Replace MOCK_COMMUNITIES with API data — GET /api/communities/nearby */}
							<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mt-4">
								{MOCK_COMMUNITIES.map(community => (
									<CommunityCard key={community.id} community={community} />
								))}
							</div>
						</div>

						{/* Events grid header */}
						<div className="mt-8 flex items-center justify-between gap-2 font-medium">
							<div className="text-xl">Experiences for you</div>
							<Link href="/events" className="text-sm text-text-brand hover:underline shrink-0">
								View all experiences
								<Icon as={ArrowRightSvg} size="sm" className="inline-block ml-1" />
							</Link>
						</div>

						{/* Events grid */}
						{loading ? (
							<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mt-4">
								{Array.from({ length: 12 }).map((_, i) => (
									<SkeletonCard key={i} />
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
							<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mt-4">
								{events.map(event => (
									<EventCard key={event.id} event={event} />
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</main>
	)
}
