"use client"

import { EventCard } from "@/components/attendee/EventCard"
import { Button } from "@/components/ui/Button"
import { Dropdown } from "@/components/ui/Dropdown"
import { Icon } from "@/components/ui/Icon"
import { TextField } from "@/components/ui/TextField"
import AltArrowRightSvg from "@/icons/outlined/alt-arrow-right.svg"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import GpsSvg from "@/icons/outlined/gps.svg"
import MapPointSvg from "@/icons/outlined/map-point.svg"
import SearchSvg from "@/icons/outlined/search.svg"
import SuspensionBoltSvg from "@/icons/outlined/suspension-bolt.svg"
import TagPriceSvg from "@/icons/outlined/tag-price.svg"
import { MOCK_ATTENDEE_EVENTS, VIBE_CATEGORIES } from "@/lib/mock-attendee"
import { useState } from "react"

// ---------------------------------------------------------------------------
// Dropdown option sets for filter chips
// ---------------------------------------------------------------------------

const DATE_OPTIONS = [
	{ value: "today", label: "Today" },
	{ value: "weekend", label: "This Weekend" },
	{ value: "week", label: "This Week" },
	{ value: "next-week", label: "Next Week" },
]

const VIBES_OPTIONS = VIBE_CATEGORIES.map(v => ({ value: v.id, label: v.label }))

const DISTANCE_OPTIONS = [
	{ value: "1", label: "Under 1 km" },
	{ value: "5", label: "Under 5 km" },
	{ value: "10", label: "Under 10 km" },
	{ value: "any", label: "Any distance" },
]

const PRICE_OPTIONS = [
	{ value: "free", label: "Free" },
	{ value: "500", label: "Under ₹500" },
	{ value: "1000", label: "Under ₹1,000" },
	{ value: "any", label: "Any price" },
]

const SORT_OPTIONS = [
	{ value: "recommended", label: "Recommended" },
	{ value: "date", label: "Date" },
	{ value: "distance", label: "Distance" },
	{ value: "price", label: "Price" },
]

// ---------------------------------------------------------------------------
// Search bar
// ---------------------------------------------------------------------------

function SearchBar() {
	const [query, setQuery] = useState("")

	return (
		<div className="flex items-center gap-2">
			<TextField
				className="flex-1"
				leftIcon={<Icon as={SearchSvg} color="muted" size="sm" />}
				placeholder="Search events, people, or vibes"
				value={query}
				onChange={e => setQuery(e.target.value)}
				size="md"
			/>
			<TextField
				className="hidden sm:flex w-52 shrink-0"
				leftIcon={<Icon as={GpsSvg} color="muted" size="sm" />}
				value="Kolkata, West Bengal"
				readOnly
				size="md"
			/>
			<Button variant="primary" size="md" className="bg-neutral-900">
				Search
			</Button>
		</div>
	)
}

// ---------------------------------------------------------------------------
// Filter chips
// ---------------------------------------------------------------------------

interface FilterChipsProps {
	active: string
	onChange: (id: string) => void
}

function FilterChips({ active, onChange }: FilterChipsProps) {
	return (
		<div className="flex items-center justify-between gap-2 mt-4 flex-wrap">
			<div className="flex items-center gap-2 flex-wrap">
				{/* "All Events" — toggle, not a dropdown */}
				<Button
					size="sm"
					radius="pill"
					variant="secondary"
					onClick={() => onChange("all")}
					className={active === "all" ? "bg-neutral-900! text-white! border-neutral-900!" : ""}
				>
					All Events
				</Button>

				<Dropdown
					size="sm"
					placeholder="Date"
					options={DATE_OPTIONS}
					className="w-32"
					leftIcon={<Icon as={CalendarSvg} color="muted" size="sm" />}
				/>
				<Dropdown
					size="sm"
					placeholder="Vibes"
					options={VIBES_OPTIONS}
					className="w-32"
					leftIcon={<Icon as={SuspensionBoltSvg} color="muted" size="sm" />}
				/>
				<Dropdown
					size="sm"
					placeholder="Distance"
					options={DISTANCE_OPTIONS}
					className="w-32"
					leftIcon={<Icon as={MapPointSvg} color="muted" size="sm" />}
				/>
				<Dropdown
					size="sm"
					placeholder="Price"
					options={PRICE_OPTIONS}
					className="w-32"
					leftIcon={<Icon as={TagPriceSvg} color="muted" size="sm" />}
				/>
			</div>

			{/* Sort */}
			<Dropdown
				size="sm"
				placeholder="Sort: Recommended"
				options={SORT_OPTIONS}
				defaultValue="recommended"
			/>
		</div>
	)
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ExploreEventsPage() {
	const [activeFilter, setActiveFilter] = useState("all")

	return (
		<main className="flex-1 py-8 md:py-10">
			<div className="max-w-384 mx-auto px-(--space-page-x-mobile) md:px-(--space-page-x-tablet) lg:px-(--space-page-x-desktop)">
				<div className="flex gap-8 items-start">
					{/* Main column */}
					<div className="flex-1 min-w-0">
						{/* Hero */}
						<div className="flex items-start justify-between gap-6 mb-8">
							<div className="max-w-2xl">
								<h1 className="text-2xl md:text-3xl xl:text-4xl font-extrabold leading-[1.12] text-text-primary mb-3">
									Find events that <span className="text-text-brand">feel like you.</span>
									<br />
									Meet people who <span className="text-text-brand">match your vibe.</span>
								</h1>
								<p className="text-body-sm text-text-secondary leading-relaxed">
									Discover real events around Kolkata — from music nights to mindful
									mornings and connect with people who share your interests.
								</p>
							</div>
						</div>

						<SearchBar />
						<FilterChips active={activeFilter} onChange={setActiveFilter} />

						{/* Events grid */}
						<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mt-6">
							{MOCK_ATTENDEE_EVENTS.map(event => (
								<EventCard key={event.id} event={event} />
							))}
						</div>

						{/* Load more */}
						<div className="mt-8 flex justify-center">
							<Button
								variant="secondary"
								size="md"
								rightIcon={<Icon as={AltArrowRightSvg} size="sm" color="secondary" />}
							>
								Load more events
							</Button>
						</div>
					</div>
				</div>
			</div>
		</main>
	)
}
