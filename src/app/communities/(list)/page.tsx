"use client"

import { useEffect, useState } from "react"
import { CommunityCard } from "@/components/attendee/CommunityCard"
import { Button } from "@/components/ui/Button"
import { Dropdown } from "@/components/ui/Dropdown"
import { Icon } from "@/components/ui/Icon"
import { TextField } from "@/components/ui/TextField"
import { useCommunitiesStore } from "@/store/communitiesStore"
import GpsSvg from "@/icons/outlined/gps.svg"
import SearchSvg from "@/icons/outlined/search.svg"
import WidgetsSvg from "@/icons/outlined/widgets.svg"

const SKELETON_COUNT = 12

function SkeletonCard() {
	return <div className="aspect-3/4 rounded-2xl bg-surface-hover animate-pulse" />
}

export default function CommunitiesPage() {
	const filters = useCommunitiesStore(s => s.filters)
	const communities = useCommunitiesStore(s => s.communities)
	const loading = useCommunitiesStore(s => s.loading)
	const loadingMore = useCommunitiesStore(s => s.loadingMore)
	const error = useCommunitiesStore(s => s.error)
	const total = useCommunitiesStore(s => s.total)
	const categories = useCommunitiesStore(s => s.categories)
	const fetchCommunities = useCommunitiesStore(s => s.fetchCommunities)
	const loadMore = useCommunitiesStore(s => s.loadMore)
	const setFilter = useCommunitiesStore(s => s.setFilter)
	const resetFilters = useCommunitiesStore(s => s.resetFilters)
	const fetchCategories = useCommunitiesStore(s => s.fetchCategories)

	const [searchInput, setSearchInput] = useState(filters.search)
	const [cityInput, setCityInput] = useState(filters.city)

	useEffect(() => {
		fetchCategories()
	}, []) // eslint-disable-line

	useEffect(() => {
		fetchCommunities()
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

	const categoryOptions = [
		{ value: "", label: "All Categories" },
		...categories.map(c => ({ value: c.id, label: c.name })),
	]

	const isFiltered = !!filters.search || !!filters.city || !!filters.categoryId

	function handleClearAll() {
		setSearchInput("")
		setCityInput("")
		resetFilters()
	}

	const hasMore = communities.length < total

	return (
		<main className="flex-1 py-8 md:py-10">
			<div className="max-w-384 mx-auto px-(--space-page-x-mobile) md:px-(--space-page-x-tablet) lg:px-(--space-page-x-desktop)">
				<div className="mb-6">
					<h1 className="text-2xl md:text-3xl font-extrabold text-text-primary">Communities</h1>
					<p className="text-body-sm text-text-secondary mt-1">
						Join communities to discover more events, get updates, and meet people with similar vibes.
					</p>
				</div>

				{/* Search row */}
				<div className="flex items-center gap-2">
					<TextField
						className="flex-1"
						leftIcon={<Icon as={SearchSvg} color="muted" size="sm" />}
						placeholder="Search communities..."
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
				<div className="flex items-center gap-2 mt-4 flex-wrap">
					<Button
						size="sm"
						radius="md"
						variant="secondary"
						onClick={handleClearAll}
						className={!isFiltered ? "bg-neutral-900! text-white! border-neutral-900!" : ""}
					>
						All Communities
					</Button>

					<Dropdown
						size="sm"
						placeholder="Category"
						options={categoryOptions}
						value={filters.categoryId}
						onChange={v => setFilter("categoryId", v)}
						className="w-36"
						leftIcon={<Icon as={WidgetsSvg} color="muted" size="sm" />}
					/>
				</div>

				{/* Grid */}
				{loading ? (
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mt-6">
						{Array.from({ length: SKELETON_COUNT }).map((_, i) => (
							<SkeletonCard key={i} />
						))}
					</div>
				) : error ? (
					<div className="mt-16 flex flex-col items-center gap-4 text-center">
						<p className="text-body-md text-text-secondary">{error}</p>
						<Button variant="secondary" size="sm" onClick={fetchCommunities}>
							Retry
						</Button>
					</div>
				) : communities.length === 0 ? (
					<div className="mt-16 text-center">
						<p className="text-body-md text-text-secondary">
							No communities found. Try adjusting your filters.
						</p>
					</div>
				) : (
					<>
						<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mt-6">
							{communities.map(community => (
								<CommunityCard key={community.id} community={community} />
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
