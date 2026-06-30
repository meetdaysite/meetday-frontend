"use client"

import { CommunityGuidelinesCard } from "@/components/communities/CommunityGuidelinesCard"
import { Button } from "@/components/ui/Button"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import { Dropdown } from "@/components/ui/Dropdown"
import { Icon } from "@/components/ui/Icon"
import { Skeleton } from "@/components/ui/Skeleton"
import {
	getCategories,
	getHostBrowseCommunities,
	getHostCommunityActivity,
	type Category,
	type HostBrowseCommunitiesParams,
	type HostBrowseCommunity,
	type HostCommunityAccess,
	type HostCommunityActivity,
	type HostCommunityAudienceSize,
	type HostCommunityBrowseTab,
} from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"
import clsx from "clsx"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

import VerifiedSvg from "@/icons/filled/verified-check.svg"
import ArrowLeftSvg from "@/icons/outlined/arrow-left.svg"
import ArrowRightSvg from "@/icons/outlined/arrow-right.svg"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import CheckSvg from "@/icons/outlined/check.svg"
import CloseSvg from "@/icons/outlined/close.svg"
import LockSvg from "@/icons/outlined/lock.svg"
import MapPointSvg from "@/icons/outlined/map-point.svg"
import SearchSvg from "@/icons/outlined/search.svg"
import StarSvg from "@/icons/outlined/star.svg"
import UsersGroupSvg from "@/icons/outlined/users-group-2.svg"

// ─── Constants ────────────────────────────────────────────────────────────────

const LIMIT = 10
const SEARCH_DEBOUNCE_MS = 400

const TABS: { value: HostCommunityBrowseTab; label: string }[] = [
	{ value: "ALL", label: "All Communities" },
	{ value: "MY_COMMUNITIES", label: "My Communities" },
]

const CITY_OPTIONS = [
	{ value: "", label: "Location" },
	{ value: "Bangalore", label: "Bangalore" },
	{ value: "Mumbai", label: "Mumbai" },
	{ value: "Delhi", label: "Delhi" },
	{ value: "Hyderabad", label: "Hyderabad" },
	{ value: "Chennai", label: "Chennai" },
	{ value: "Pune", label: "Pune" },
	{ value: "Kolkata", label: "Kolkata" },
]

const AUDIENCE_SIZE_OPTIONS = [
	{ value: "", label: "Audience Size" },
	{ value: "SMALL", label: "Small (< 100)" },
	{ value: "MEDIUM", label: "Medium (100–499)" },
	{ value: "LARGE", label: "Large (500–1,999)" },
	{ value: "VERY_LARGE", label: "Very Large (2,000+)" },
]

const ACCESS_TYPE_OPTIONS = [
	{ value: "", label: "Access Type" },
	{ value: "PUBLIC", label: "Public (Open)" },
	{ value: "APPROVAL_REQUIRED", label: "Approval Required" },
]

const ACCESS_CONFIG: Record<
	"PUBLIC" | "APPROVAL_REQUIRED",
	{
		label: string
		description: string
		pillCls: string
	}
> = {
	PUBLIC: {
		label: "Public",
		description: "Anyone can discover and join",
		pillCls: "bg-green-50 text-green-700 border-green-200",
	},
	APPROVAL_REQUIRED: {
		label: "Approval Required",
		description: "Request access to publish experiences",
		pillCls: "bg-orange-50 text-orange-700 border-orange-200",
	},
}

const FIND_COMMUNITY_BULLETS = [
	"Match with the right audience",
	"Increase visibility for your events",
	"Build credibility as a trusted host",
	"Drive more ticket sales",
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCount(n: number): string {
	if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".0", "")}K`
	return String(n)
}

function buildPageNumbers(current: number, total: number): (number | "…")[] {
	if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
	const pages: (number | "…")[] = []
	if (current <= 4) {
		pages.push(1, 2, 3, 4, 5, "…", total)
	} else if (current >= total - 3) {
		pages.push(1, "…", total - 4, total - 3, total - 2, total - 1, total)
	} else {
		pages.push(1, "…", current - 1, current, current + 1, "…", total)
	}
	return pages
}

// ─── Skeleton components ──────────────────────────────────────────────────────

function CommunityCardSkeleton() {
	return (
		<div className="flex rounded-card border border-border-default bg-red-400 overflow-hidden h-33">
			<Skeleton.Block className="w-44 shrink-0 rounded-none" />
			<div className="flex-1 p-5 flex flex-col justify-between gap-2">
				<div className="flex items-start justify-between gap-6">
					<div className="flex flex-col gap-2 flex-1">
						<div className="flex items-center gap-2">
							<Skeleton.Text className="h-5 w-44" />
							<Skeleton.Avatar size="xs" className="size-4" />
						</div>
						<Skeleton.Text className="h-3.5 w-full max-w-sm" />
						<Skeleton.Text className="h-3.5 w-3/4" />
					</div>
					<div className="shrink-0 flex flex-col items-end gap-1.5">
						<Skeleton.Text className="h-6 w-28 rounded-full" />
						<Skeleton.Text className="h-3 w-32" />
					</div>
				</div>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-6">
						<Skeleton.Text className="h-3.5 w-32" />
						<Skeleton.Text className="h-3.5 w-24" />
					</div>
					<Skeleton.Block className="h-8 w-32 rounded-action" />
				</div>
			</div>
		</div>
	)
}

// ─── Page button (pagination) ─────────────────────────────────────────────────

function PageButton({
	children,
	onClick,
	active,
	disabled,
	"aria-label": ariaLabel,
}: {
	children: React.ReactNode
	onClick?: () => void
	active?: boolean
	disabled?: boolean
	"aria-label"?: string
}) {
	return (
		<button
			onClick={onClick}
			disabled={disabled}
			aria-label={ariaLabel}
			aria-current={active ? "page" : undefined}
			className={clsx(
				"flex items-center justify-center min-w-8 h-8 px-2 rounded-action text-caption font-medium transition-colors",
				active
					? "bg-surface-inverse text-text-inverse"
					: disabled
						? "text-text-muted cursor-not-allowed opacity-40"
						: "text-text-secondary hover:bg-surface-card-muted hover:text-text-primary",
			)}
		>
			{children}
		</button>
	)
}

// ─── CTA button ───────────────────────────────────────────────────────────────

function CommunityCTA({ community }: { community: HostBrowseCommunity }) {
	if (community.isMember) {
		return (
			<Link href={`/dashboard/communities/${community.id}`}>
				<Button
					variant="primary"
					size="sm"
					radius="md"
					className="whitespace-nowrap border-border-brand"
				>
					View Community
				</Button>
			</Link>
		)
	}

	if (community.isPending) {
		return (
			<span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-action text-label-sm font-medium text-text-muted bg-surface-card-muted border border-border-default cursor-default">
				<Icon as={LockSvg} size="xs" color="muted" />
				Requested
			</span>
		)
	}

	if (community.access === "PUBLIC") {
		return (
			<Link href={`/communities/${community.slug}`}>
				<Button variant="primary" size="sm" radius="md" className="whitespace-nowrap">
					Join Community
				</Button>
			</Link>
		)
	}

	if (community.access === "APPROVAL_REQUIRED") {
		return (
			<Link href={`/communities/${community.slug}`}>
				<Button variant="primary" size="sm" radius="md" className="whitespace-nowrap">
					<Icon as={LockSvg} size="xs" color="inherit" />
					Request Access
				</Button>
			</Link>
		)
	}

	return null
}

// ─── Community card ───────────────────────────────────────────────────────────

function HostCommunityCard({ community }: { community: HostBrowseCommunity }) {
	const accessConf =
		community.access !== "INVITE_ONLY"
			? ACCESS_CONFIG[community.access as "PUBLIC" | "APPROVAL_REQUIRED"]
			: null

	const hasMatch = community.matchScore !== null && community.matchLabel !== null
	const matchColorCls = community.matchLabel === "Great match!" ? "text-violet-600" : "text-text-success"

	return (
		<div className="flex rounded-card border border-border-default bg-surface-card overflow-hidden hover:shadow-card-hover transition-shadow">
			{/* Cover image */}
			<div className="relative w-44 shrink-0 bg-neutral-100">
				<Image
					src={community.coverImageUrl}
					alt={community.name}
					fill
					sizes="176px"
					className="object-cover"
				/>
			</div>

			{/* Content */}
			<div className="flex-1 min-w-0 px-5 py-4 flex flex-col justify-between gap-3">
				{/* Top row */}
				<div className="flex items-start justify-between gap-5">
					{/* Name + verified + description + location */}
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-1.5 mb-1">
							<span className="text-label-lg font-semibold text-text-primary leading-snug truncate">
								{community.name}
							</span>
							{community.isVerified && (
								<Icon as={VerifiedSvg} size="sm" color="brand" className="shrink-0" />
							)}
						</div>
						<p className="text-body-sm text-text-secondary line-clamp-2 leading-snug">
							{community.description}
						</p>
						<div className="flex items-center gap-3 mt-2">
							<span className="inline-flex items-center gap-1 text-caption text-text-muted">
								<Icon as={MapPointSvg} size="xs" color="muted" />
								{community.primaryCity}
							</span>
							<span className="inline-flex items-center gap-1 text-caption text-text-muted">
								<Icon as={UsersGroupSvg} size="xs" color="muted" />
								{fmtCount(community.memberCount)} Members
							</span>
						</div>
					</div>

					{/* Access badge */}
					{accessConf && (
						<div className="shrink-0 text-right">
							<span
								className={clsx(
									"inline-flex items-center px-2.5 py-1 rounded-full text-caption font-semibold border",
									accessConf.pillCls,
								)}
							>
								{accessConf.label}
							</span>
							<p className="text-caption text-text-muted mt-1 max-w-37 leading-snug text-right">
								{accessConf.description}
							</p>
						</div>
					)}
				</div>

				{/* Bottom row: stats + match + CTA */}
				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-5 flex-wrap">
						{/* Experiences this month */}
						<span className="inline-flex items-center gap-1.5 text-caption text-text-secondary">
							<Icon as={CalendarSvg} size="xs" color="muted" />
							<span className="font-semibold text-text-primary">
								{community.experiencesThisMonth}
							</span>
							{" Experiences this month"}
						</span>

						{/* Host rating */}
						{community.avgHostRating !== null && (
							<span className="inline-flex items-center gap-1 text-caption text-text-secondary">
								<Icon as={StarSvg} size="xs" color="warning" />
								<span className="font-semibold text-text-primary">
									{community.avgHostRating.toFixed(1)}
								</span>
								{" Host Rating"}
							</span>
						)}

						{/* Match score */}
						{hasMatch && (
							<span className={clsx("text-caption font-semibold", matchColorCls)}>
								{community.matchScore}% match · {community.matchLabel}
							</span>
						)}
					</div>

					{/* CTA */}
					<div className="shrink-0">
						<CommunityCTA community={community} />
					</div>
				</div>
			</div>
		</div>
	)
}

// ─── Sidebar cards ────────────────────────────────────────────────────────────

function ActivityRow({ label, value }: { label: string; value: number | string }) {
	return (
		<div className="flex items-center justify-between py-2.5 border-b border-border-default last:border-0">
			<span className="text-label-sm text-text-secondary">{label}</span>
			<span className="text-label-sm font-semibold text-text-primary">{value}</span>
		</div>
	)
}

function ActivityCard({ loading, activity }: { loading: boolean; activity: HostCommunityActivity | null }) {
	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default shadow-md">
			<div className="flex items-center gap-2.5 mb-4">
				<div className="size-8 rounded-badge bg-surface-vibe-soft flex items-center justify-center shrink-0">
					<Icon as={UsersGroupSvg} size="sm" color="vibe" />
				</div>
				<span className="text-body-md font-semibold text-text-primary">Your Community Activity</span>
			</div>

			{loading ? (
				<div>
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton.Row key={i} />
					))}
				</div>
			) : activity ? (
				<div>
					<ActivityRow label="Communities Joined" value={activity.communitiesJoined} />
					<ActivityRow label="Access Requests" value={activity.accessRequests} />
					<ActivityRow label="Pending Reviews" value={activity.pendingReviews} />
					<ActivityRow
						label="Experiences in Communities"
						value={activity.experiencesInCommunities}
					/>
					<ActivityRow
						label="Total Community Views"
						value={activity.totalCommunityViews.toLocaleString()}
					/>
				</div>
			) : null}

		</div>
	)
}

function FindCommunityCard() {
	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default shadow-md">
			<p className="text-body-md font-semibold text-text-primary">Find the right community</p>
			<p className="text-label-sm text-text-secondary mt-1 mb-4 leading-snug">
				Communities help you reach new audiences and grow your impact.
			</p>
			<div className="flex flex-col gap-2.5">
				{FIND_COMMUNITY_BULLETS.map(bullet => (
					<div key={bullet} className="flex items-center gap-2">
						<div className="size-4 rounded-full bg-surface-success-soft flex items-center justify-center shrink-0">
							<Icon as={CheckSvg} size="xs" color="success" />
						</div>
						<span className="text-label-sm text-text-secondary">{bullet}</span>
					</div>
				))}
			</div>
		</div>
	)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HostCommunitiesPage() {
	// Filter + pagination state
	const [search, setSearch] = useState("")
	const [debouncedSearch, setDebouncedSearch] = useState("")
	const [categoryId, setCategoryId] = useState("")
	const [city, setCity] = useState("")
	const [audienceSize, setAudienceSize] = useState<HostCommunityAudienceSize | "">("")
	const [access, setAccess] = useState<HostCommunityAccess | "">("")
	const [tab, setTab] = useState<HostCommunityBrowseTab>("ALL")
	const [page, setPage] = useState(1)

	// Communities data
	const [communities, setCommunities] = useState<HostBrowseCommunity[]>([])
	const [total, setTotal] = useState(0)
	const [totalPages, setTotalPages] = useState(0)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Categories (for filter dropdown)
	const [categories, setCategories] = useState<Category[]>([])

	// Sidebar activity
	const [activity, setActivity] = useState<HostCommunityActivity | null>(null)
	const [activityLoading, setActivityLoading] = useState(true)

	// Retry trigger — increment to re-run the fetch effect
	const [refreshKey, setRefreshKey] = useState(0)

	// Debounce search
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	function handleSearch(value: string) {
		setSearch(value)
		if (debounceRef.current) clearTimeout(debounceRef.current)
		debounceRef.current = setTimeout(() => {
			setDebouncedSearch(value)
			setPage(1)
		}, SEARCH_DEBOUNCE_MS)
	}

	// Fetch communities whenever filter/pagination deps change
	useEffect(() => {
		let cancelled = false

		async function load() {
			setLoading(true)
			setError(null)
			try {
				const params: HostBrowseCommunitiesParams = {
					page,
					limit: LIMIT,
					tab,
					...(debouncedSearch && { search: debouncedSearch }),
					...(categoryId && { categoryId }),
					...(city && { city }),
					...(audienceSize && { audienceSize }),
					...(access && { access }),
				}
				const res = await getHostBrowseCommunities(params)
				if (!cancelled) {
					setCommunities(res.data)
					setTotal(res.total)
					setTotalPages(res.totalPages)
				}
			} catch (err) {
				if (!cancelled) setError(getApiErrorMessage(err))
			} finally {
				if (!cancelled) setLoading(false)
			}
		}

		load()
		return () => { cancelled = true }
	}, [page, tab, debouncedSearch, categoryId, city, audienceSize, access, refreshKey])

	// Categories + activity on mount
	useEffect(() => {
		getCategories()
			.then(setCategories)
			.catch(() => {})

		getHostCommunityActivity()
			.then(setActivity)
			.catch(() => {})
			.finally(() => setActivityLoading(false))
	}, [])

	// Filter helpers — reset page on any filter change
	function handleTabChange(newTab: HostCommunityBrowseTab) {
		setTab(newTab)
		setPage(1)
	}

	function handleCategoryChange(value: string) {
		setCategoryId(value)
		setPage(1)
	}

	function handleCityChange(value: string) {
		setCity(value)
		setPage(1)
	}

	function handleAudienceSizeChange(value: string) {
		setAudienceSize(value as HostCommunityAudienceSize | "")
		setPage(1)
	}

	function handleAccessChange(value: string) {
		setAccess(value as HostCommunityAccess | "")
		setPage(1)
	}

	const categoryOptions = [
		{ value: "", label: "Category" },
		...categories.map(c => ({ value: c.id, label: c.name })),
	]

	const rangeStart = total === 0 ? 0 : (page - 1) * LIMIT + 1
	const rangeEnd = Math.min(page * LIMIT, total)

	return (
		<div className="flex flex-col min-h-screen">
			<DashboardTopBar />

			<div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 bg-surface-page">
				{/* Page header */}
				<div className="flex items-start justify-between gap-4 mb-7">
					<div>
						<h1 className="text-heading-sm font-bold text-text-primary">Meetday Communities</h1>
						<p className="text-body-sm text-text-secondary mt-1">
							Discover Meetday-managed communities and share your experiences with the right
							audience.
						</p>
					</div>
				</div>

				{/* Two-column layout */}
				<div className="flex gap-6 items-start">
					{/* ── Main content ── */}
					<div className="flex-1 min-w-0">
						{/* Filters row */}
						<div className="flex flex-wrap items-center gap-2 mb-4">
							{/* Search */}
							<div className="flex items-center gap-2 h-9 px-3 rounded-action border border-border-default bg-surface-canvas text-text-muted hover:border-border-strong focus-within:border-border-focused transition-colors flex-1 min-w-44 max-w-64">
								<SearchSvg className="size-4 shrink-0" aria-hidden />
								<input
									type="text"
									value={search}
									onChange={e => handleSearch(e.target.value)}
									placeholder="Search communities..."
									className="flex-1 min-w-0 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
								/>
								{search && (
									<button
										onClick={() => handleSearch("")}
										className="text-text-muted hover:text-text-primary shrink-0 transition-colors"
										aria-label="Clear search"
									>
										<CloseSvg className="size-3.5" aria-hidden />
									</button>
								)}
							</div>

							<Dropdown
								options={categoryOptions}
								value={categoryId}
								onChange={handleCategoryChange}
								size="sm"
								className="w-36"
								disabled={categories.length === 0}
							/>

							<Dropdown
								options={CITY_OPTIONS}
								value={city}
								onChange={handleCityChange}
								size="sm"
								className="w-36"
							/>

							<Dropdown
								options={AUDIENCE_SIZE_OPTIONS}
								value={audienceSize}
								onChange={handleAudienceSizeChange}
								size="sm"
								className="w-44"
							/>

							<Dropdown
								options={ACCESS_TYPE_OPTIONS}
								value={access}
								onChange={handleAccessChange}
								size="sm"
								className="w-40"
							/>
						</div>

						{/* Tabs (pill style) */}
						<div className="flex items-center gap-1.5 mb-5 p-1 bg-surface-card-muted rounded-action w-fit">
							{TABS.map(({ value, label }) => (
								<button
									key={value}
									onClick={() => handleTabChange(value)}
									className={clsx(
										"px-4 py-2.5 rounded-action text-label-sm font-medium transition-colors whitespace-nowrap",
										tab === value
											? "bg-action-primary text-action-primary-text shadow-card"
											: "text-text-primary hover:text-text-primary",
									)}
								>
									{label}
								</button>
							))}
						</div>

						{/* Content */}
						{error ? (
							<div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
								<p className="text-body-md text-text-secondary">{error}</p>
								<Button variant="secondary" size="sm" onClick={() => setRefreshKey((k) => k + 1)}>
									Retry
								</Button>
							</div>
						) : loading ? (
							<div className="flex flex-col gap-3">
								{Array.from({ length: 5 }).map((_, i) => (
									<CommunityCardSkeleton key={i} />
								))}
							</div>
						) : communities.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
								<p className="text-body-md text-text-secondary">No communities found.</p>
								<p className="text-body-sm text-text-muted">
									Try adjusting your filters or search query.
								</p>
							</div>
						) : (
							<div className="flex flex-col gap-3">
								{communities.map(community => (
									<HostCommunityCard key={community.id} community={community} />
								))}
							</div>
						)}

						{/* Pagination */}
						{!loading && !error && total > 0 && (
							<div className="flex items-center justify-between mt-6 pt-5 border-t border-border-default">
								<p className="text-caption text-text-muted shrink-0">
									Showing{" "}
									<span className="font-medium text-text-primary">
										{rangeStart}–{rangeEnd}
									</span>{" "}
									of <span className="font-medium text-text-primary">{total}</span>
								</p>

								<div className="flex items-center gap-1">
									<PageButton
										onClick={() => setPage(p => Math.max(1, p - 1))}
										disabled={page === 1}
										aria-label="Previous page"
									>
										<ArrowLeftSvg className="size-4" aria-hidden />
									</PageButton>

									{buildPageNumbers(page, totalPages).map((item, i) =>
										item === "…" ? (
											<span
												key={`ell-${i}`}
												className="px-1 text-caption text-text-muted select-none"
											>
												…
											</span>
										) : (
											<PageButton
												key={item}
												onClick={() => setPage(item as number)}
												active={(item as number) === page}
											>
												{item}
											</PageButton>
										),
									)}

									<PageButton
										onClick={() => setPage(p => Math.min(totalPages, p + 1))}
										disabled={page === totalPages}
										aria-label="Next page"
									>
										<ArrowRightSvg className="size-4" aria-hidden />
									</PageButton>
								</div>
							</div>
						)}
					</div>

					{/* ── Right sidebar ── */}
					<aside className="w-100 shrink-0 hidden xl:flex flex-col gap-4 sticky top-6">
						<ActivityCard loading={activityLoading} activity={activity} />
						<FindCommunityCard />
						<CommunityGuidelinesCard />
					</aside>
				</div>
			</div>
		</div>
	)
}
