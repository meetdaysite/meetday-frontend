"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import clsx from "clsx"
import { Button } from "@/components/ui/Button"
import { Dropdown } from "@/components/ui/Dropdown"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import { useEventStore } from "@/store/eventStore"
import { storageUrl } from "@/lib/uploadMedia"
import type { Event, ApiEventStatus } from "@/types/event"
import PlusSvg from "@/icons/outlined/plus.svg"
import SearchSvg from "@/icons/outlined/search.svg"
import CloseSvg from "@/icons/outlined/close.svg"
import ListSvg from "@/icons/outlined/list.svg"
import GridSvg from "@/icons/outlined/grid.svg"
import DotsSvg from "@/icons/outlined/dots.svg"
import EyeOpenSvg from "@/icons/outlined/eye-open.svg"
import PenSquareSvg from "@/icons/outlined/pen-square.svg"
import UsersGroupSvg from "@/icons/outlined/users-group.svg"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import TrashBinSvg from "@/icons/outlined/trash-bin.svg"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/errors"
import { Skeleton } from "@/components/ui/Skeleton"

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 6

const STATUS_CONFIG: Record<ApiEventStatus, { label: string; listPill: string; imageBadge: string }> = {
	DRAFT: {
		label: "Draft",
		listPill: "bg-neutral-100 text-neutral-700",
		imageBadge: "bg-neutral-100/95 text-neutral-700 backdrop-blur-sm shadow-sm",
	},
	UNDER_REVIEW: {
		label: "Under Review",
		listPill: "bg-blue-50 text-blue-700",
		imageBadge: "bg-blue-50/95 text-blue-700 backdrop-blur-sm shadow-sm",
	},
	REJECTED: {
		label: "Rejected",
		listPill: "bg-red-50 text-red-700",
		imageBadge: "bg-red-50/95 text-red-700 backdrop-blur-sm shadow-sm",
	},
	PUBLISHED: {
		label: "Published",
		listPill: "bg-green-50 text-green-700",
		imageBadge: "bg-green-50/95 text-green-700 backdrop-blur-sm shadow-sm",
	},
	CANCELLED: {
		label: "Cancelled",
		listPill: "bg-orange-50 text-orange-700",
		imageBadge: "bg-orange-50/95 text-orange-700 backdrop-blur-sm shadow-sm",
	},
	COMPLETED: {
		label: "Completed",
		listPill: "bg-neutral-900 text-white",
		imageBadge: "bg-neutral-900/90 text-white backdrop-blur-sm shadow-sm",
	},
}

const SORT_OPTIONS = [
	{ value: "newest", label: "Newest First" },
	{ value: "oldest", label: "Oldest First" },
]

const STATUS_TABS: { value: "ALL" | ApiEventStatus; label: string }[] = [
	{ value: "ALL", label: "All" },
	{ value: "DRAFT", label: "Draft" },
	{ value: "UNDER_REVIEW", label: "Under Review" },
	{ value: "REJECTED", label: "Rejected" },
	{ value: "CANCELLED", label: "Cancelled" },
	{ value: "COMPLETED", label: "Completed" },
	{ value: "PUBLISHED", label: "Published" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEventDate(iso?: string): string {
	if (!iso) return "—"
	const d = new Date(iso)
	if (isNaN(d.getTime())) return iso
	return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
}

function eventCoverUrl(event: Event): string {
	if (event.coverImageUrl) return event.coverImageUrl
	const cover = event.media?.find(m => m.type === "COVER")
	return cover ? (cover.url ?? storageUrl(cover.key ?? "")) : ""
}

function eventCapacity(event: Event): number {
	return event.totalCapacity ?? event.tickets?.reduce((sum, t) => sum + t.totalCapacity, 0) ?? 0
}

function eventStartingPrice(event: Event): number | null {
	if (event.isFree) return 0
	if (event.startingPrice != null) return event.startingPrice
	const prices = event.tickets?.map(t => t.price) ?? []
	return prices.length > 0 ? Math.min(...prices) : null
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyEventsPage() {
	const router = useRouter()
	const { events, eventsLoading, eventsError, fetchMyEvents, deleteEvent } = useEventStore()

	const [viewMode, setViewMode] = useState<"list" | "grid">(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("events-view-mode")
			if (saved === "list" || saved === "grid") return saved
		}
		return "grid"
	})
	const [statusFilter, setStatusFilter] = useState<"ALL" | ApiEventStatus>("ALL")
	const [searchQuery, setSearchQuery] = useState("")
	const [sortOrder, setSortOrder] = useState("newest")
	const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
	const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
	const [deletingEventId, setDeletingEventId] = useState<string | null>(null)
	const sentinelRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		fetchMyEvents()
	}, [fetchMyEvents])

	const handleViewMode = useCallback((mode: "list" | "grid") => {
		setViewMode(mode)
		localStorage.setItem("events-view-mode", mode)
	}, [])

	const handleStatusFilter = useCallback((v: "ALL" | ApiEventStatus) => {
		setStatusFilter(v)
		setVisibleCount(PAGE_SIZE)
	}, [])

	const handleSearchQuery = useCallback((v: string) => {
		setSearchQuery(v)
		setVisibleCount(PAGE_SIZE)
	}, [])

	const handleSortOrder = useCallback((v: string) => {
		setSortOrder(v)
		setVisibleCount(PAGE_SIZE)
	}, [])

	const filteredEvents = useMemo(() => {
		let result = [...events]
		if (statusFilter !== "ALL") result = result.filter(e => e.status === statusFilter)
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase()
			result = result.filter(
				e =>
					(e.title ?? "").toLowerCase().includes(q) ||
					(e.venueName ?? "").toLowerCase().includes(q),
			)
		}
		result.sort((a, b) => {
			const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			return sortOrder === "oldest" ? -diff : diff
		})
		return result
	}, [events, statusFilter, searchQuery, sortOrder])

	const visibleEvents = filteredEvents.slice(0, visibleCount)
	const hasMore = visibleCount < filteredEvents.length

	useEffect(() => {
		const sentinel = sentinelRef.current
		if (!sentinel) return
		const observer = new IntersectionObserver(
			entries => {
				if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
					setIsLoadingMore(true)
					setTimeout(() => {
						setVisibleCount(prev => prev + PAGE_SIZE)
						setIsLoadingMore(false)
					}, 300)
				}
			},
			{ threshold: 0.1 },
		)
		observer.observe(sentinel)
		return () => observer.disconnect()
	}, [hasMore, isLoadingMore])

	useEffect(() => {
		if (!openDropdownId) return
		const handler = (e: MouseEvent) => {
			if (!(e.target as Element).closest("[data-kebab]")) setOpenDropdownId(null)
		}
		document.addEventListener("mousedown", handler)
		return () => document.removeEventListener("mousedown", handler)
	}, [openDropdownId])

	const toggleKebab = useCallback((id: string, e: React.MouseEvent) => {
		e.stopPropagation()
		setOpenDropdownId(prev => (prev === id ? null : id))
	}, [])

	const navigateTo = useCallback(
		(path: string) => {
			router.push(path)
		},
		[router],
	)

	const handleDeleteDraft = useCallback((id: string) => {
		setOpenDropdownId(null)
		setConfirmDeleteId(id)
	}, [])

	const handleConfirmDelete = useCallback(async () => {
		if (!confirmDeleteId) return
		setDeletingEventId(confirmDeleteId)
		try {
			await deleteEvent(confirmDeleteId)
			toast.success("Draft deleted")
			setConfirmDeleteId(null)
		} catch (err) {
			toast.error(getApiErrorMessage(err))
		} finally {
			setDeletingEventId(null)
		}
	}, [confirmDeleteId, deleteEvent])

	const tabCounts = useMemo(() => {
		const counts: Partial<Record<"ALL" | ApiEventStatus, number>> = { ALL: events.length }
		for (const event of events) {
			counts[event.status] = (counts[event.status] ?? 0) + 1
		}
		return counts
	}, [events])

	return (
		<>
			<div className="flex flex-col min-h-screen">
				<DashboardTopBar />

				<div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 bg-surface-page">
					{/* Header */}
					<div className="flex items-start justify-between gap-4 mb-6">
						<div>
							<h1 className="text-heading-sm font-semibold text-text-primary">My Events</h1>
							<p className="text-body-sm text-text-secondary mt-0.5">
								Manage events across all statuses.
							</p>
						</div>
						<Button
							leftIcon={<PlusIcon />}
							onClick={() => router.push("/dashboard/create")}
							className="shrink-0 font-semibold"
						>
							<span className="hidden sm:inline">Create New Experience</span>
							<span className="sm:hidden">Create</span>
						</Button>
					</div>

					{/* Toolbar */}
					<div className="flex items-center gap-3 mb-4 flex-wrap">
						<div className="flex items-center gap-2 h-9 px-3 rounded-action border border-border-default bg-surface-canvas text-text-muted hover:border-border-strong focus-within:border-border-focused transition-colors flex-1 min-w-0 max-w-xs">
							<SearchIcon />
							<input
								type="text"
								value={searchQuery}
								onChange={e => handleSearchQuery(e.target.value)}
								placeholder="Search experiences..."
								className="flex-1 min-w-0 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
							/>
							{searchQuery && (
								<button
									onClick={() => handleSearchQuery("")}
									className="text-text-muted hover:text-text-primary shrink-0"
								>
									<XIcon />
								</button>
							)}
						</div>

						<div className="flex items-center gap-2 ml-auto">
							<Dropdown
								options={SORT_OPTIONS}
								value={sortOrder}
								onChange={handleSortOrder}
								size="sm"
								className="w-36"
							/>
							<div className="flex items-center border border-border-default rounded-action overflow-hidden">
								<button
									onClick={() => handleViewMode("list")}
									aria-label="List view"
									className={clsx(
										"flex items-center justify-center w-9 h-9 transition-colors",
										viewMode === "list"
											? "bg-surface-inverse text-text-inverse"
											: "bg-surface-canvas text-text-muted hover:bg-surface-card-muted",
									)}
								>
									<ListViewIcon />
								</button>
								<button
									onClick={() => handleViewMode("grid")}
									aria-label="Grid view"
									className={clsx(
										"flex items-center justify-center w-9 h-9 transition-colors",
										viewMode === "grid"
											? "bg-surface-inverse text-text-inverse"
											: "bg-surface-canvas text-text-muted hover:bg-surface-card-muted",
									)}
								>
									<GridViewIcon />
								</button>
							</div>
						</div>
					</div>

					{/* Status tabs */}
					<div className="flex items-center gap-1 overflow-x-auto pb-1 mb-6 scrollbar-none border-b border-border-default">
						{STATUS_TABS.map(tab => {
							const count = tabCounts[tab.value] ?? 0
							const isActive = statusFilter === tab.value
							return (
								<button
									key={tab.value}
									onClick={() => handleStatusFilter(tab.value)}
									className={clsx(
										"shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-label-sm border-b-2 transition-colors whitespace-nowrap -mb-px",
										isActive
											? "border-text-primary text-text-primary font-semibold"
											: "border-transparent text-text-muted hover:text-text-secondary",
									)}
								>
									{tab.label}
									<span
										className={clsx(
											"text-caption font-medium px-1.5 py-0.5 rounded-badge min-w-5 text-center",
											isActive
												? "bg-surface-inverse text-text-inverse"
												: "bg-surface-card-muted text-text-muted",
										)}
									>
										{count}
									</span>
								</button>
							)
						})}
					</div>

					{/* Error */}
					{eventsError && (
						<div className="flex items-center justify-between gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-action mb-6 text-body-sm text-red-700">
							{eventsError}
							<button
								onClick={() => fetchMyEvents()}
								className="text-label-sm font-semibold text-red-700 hover:underline shrink-0"
							>
								Retry
							</button>
						</div>
					)}

					{/* Loading skeleton */}
					{eventsLoading && events.length === 0 && (
						<div
							className={clsx(
								viewMode === "grid"
									? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5"
									: "flex flex-col gap-3",
							)}
						>
							{Array.from({ length: 6 }).map((_, i) => (
								<Skeleton.Block
									key={i}
									className={clsx(
										"bg-surface-card border border-border-default rounded-action",
										viewMode === "grid" ? "h-64" : "h-28",
									)}
								/>
							))}
						</div>
					)}

					{/* Empty state */}
					{!eventsLoading && filteredEvents.length === 0 && (
						<div className="flex flex-col items-center justify-center py-20 text-center gap-3">
							<div className="size-12 rounded-full bg-surface-card-muted flex items-center justify-center">
								<CalendarEmptyIcon />
							</div>
							<p className="text-label-md font-semibold text-text-primary">No experiences found</p>
							<p className="text-body-sm text-text-muted max-w-xs">
								{searchQuery
									? `No experiences match "${searchQuery}".`
									: "No experiences in this category yet."}
							</p>
						</div>
					)}

					{/* Grid view */}
					{!eventsLoading && viewMode === "grid" && filteredEvents.length > 0 && (
						<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
							{visibleEvents.map(event => (
								<GridCard
									key={event.id}
									event={event}
									openDropdownId={openDropdownId}
									onToggleKebab={toggleKebab}
									onNavigate={navigateTo}
									onDeleteDraft={handleDeleteDraft}
								/>
							))}
						</div>
					)}

					{/* List view */}
					{!eventsLoading && viewMode === "list" && filteredEvents.length > 0 && (
						<div className="flex flex-col gap-3">
							{visibleEvents.map(event => (
								<ListCard
									key={event.id}
									event={event}
									openDropdownId={openDropdownId}
									onToggleKebab={toggleKebab}
									onNavigate={navigateTo}
									onDeleteDraft={handleDeleteDraft}
								/>
							))}
						</div>
					)}

					{/* Infinite scroll sentinel */}
					<div ref={sentinelRef} className="h-1" />
					{isLoadingMore && (
						<div className="flex justify-center py-8">
							<LoaderSpinner />
						</div>
					)}
					{!hasMore && filteredEvents.length > 0 && (
						<p className="text-center text-caption text-text-muted py-8">
							You&apos;ve seen all {filteredEvents.length} events
						</p>
					)}
				</div>
			</div>

			{/* Delete confirmation modal */}
			{confirmDeleteId && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
					<div className="bg-surface-card rounded-action border border-border-default shadow-floating w-full max-w-sm p-6">
						<h2 className="text-label-lg font-semibold text-text-primary mb-2">Delete Draft?</h2>
						<p className="text-body-sm text-text-secondary mb-6">
							This draft will be permanently deleted and cannot be recovered.
						</p>
						<div className="flex gap-3 justify-end">
							<button
								onClick={() => setConfirmDeleteId(null)}
								disabled={!!deletingEventId}
								className="px-4 py-2 text-label-sm font-medium text-text-primary border border-border-default rounded-action hover:bg-surface-card-muted transition-colors disabled:opacity-50"
							>
								Cancel
							</button>
							<button
								onClick={handleConfirmDelete}
								disabled={!!deletingEventId}
								className="flex items-center gap-2 px-4 py-2 text-label-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-action transition-colors disabled:opacity-60"
							>
								{deletingEventId ? <LoaderSpinner /> : <TrashIcon />}
								Delete
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	)
}

// ─── Grid Card ────────────────────────────────────────────────────────────────

interface CardProps {
	event: Event
	openDropdownId: string | null
	onToggleKebab: (id: string, e: React.MouseEvent) => void
	onNavigate: (path: string) => void
	onDeleteDraft: (id: string) => void
}

function GridCard({ event, openDropdownId, onToggleKebab, onNavigate, onDeleteDraft }: CardProps) {
	const cfg = STATUS_CONFIG[event.status]
	const cap = eventCapacity(event)
	const price = eventStartingPrice(event)
	const priceLabel = price === null ? "—" : price === 0 ? "Free" : `₹${price}`
	const cover = eventCoverUrl(event)

	return (
		<div
			onClick={() => onNavigate(`/dashboard/events/${event.id}`)}
			className="group relative cursor-pointer bg-surface-card border border-border-default rounded-action hover:border-border-strong hover:shadow-card-hover transition-all"
		>
			{/* Image */}
			<div className="relative aspect-16/10 overflow-hidden rounded-t-action bg-surface-card-muted">
				{cover ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img
						src={cover}
						alt={event.title ?? ""}
						className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
						loading="lazy"
					/>
				) : (
					<div className="w-full h-full bg-linear-to-br from-surface-card-muted to-border-default" />
				)}
				<span
					className={clsx(
						"absolute top-3 left-3 text-caption font-semibold px-2.5 py-1 rounded-badge",
						cfg.imageBadge,
					)}
				>
					{cfg.label}
				</span>
			</div>

			{/* Kebab */}
			<div data-kebab className="absolute top-2.5 right-2.5 z-10" onClick={e => e.stopPropagation()}>
				<button
					onClick={e => onToggleKebab(event.id, e)}
					className="flex items-center justify-center size-8 rounded-full bg-white/80 backdrop-blur-sm text-neutral-700 hover:bg-white transition-colors"
					aria-label="Event options"
				>
					<DotsIcon />
				</button>
				{openDropdownId === event.id && (
					<div className="absolute right-0 top-10 z-50 w-44 bg-surface-card border border-border-default rounded-action shadow-floating py-1">
						<button
							onClick={() => onNavigate(`/dashboard/events/${event.id}`)}
							className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-label-sm text-text-primary hover:bg-surface-card-muted transition-colors"
						>
							<EyeIcon />
							View Detail
						</button>
						{event.status === "DRAFT" && (
							<>
								<button
									onClick={() => onNavigate(`/dashboard/events/${event.id}/edit`)}
									className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-label-sm text-text-primary hover:bg-surface-card-muted transition-colors"
								>
									<EditIcon />
									Edit
								</button>
								<div className="my-1 border-t border-border-default" />
								<button
									onClick={e => {
										e.stopPropagation()
										onDeleteDraft(event.id)
									}}
									className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-label-sm text-red-600 hover:bg-red-50 transition-colors"
								>
									<TrashIcon />
									Delete Draft
								</button>
							</>
						)}
					</div>
				)}
			</div>

			{/* Card body */}
			<div className="p-4">
				{event.category?.name && (
					<span className="inline-block text-caption text-text-brand bg-surface-brand-soft px-2 py-0.5 rounded-badge mb-2">
						{event.category.name}
					</span>
				)}

				<div className="flex items-start justify-between gap-2 mb-0.5">
					<h3 className="text-label-md font-semibold text-text-primary line-clamp-1 group-hover:text-text-brand transition-colors">
						{event.title ?? "Untitled Event"}
					</h3>
					<span
						className={clsx(
							"text-caption font-semibold shrink-0",
							price === 0 ? "text-text-success" : "text-text-primary",
						)}
					>
						{priceLabel}
					</span>
				</div>

				<p className="text-caption text-text-muted mb-3 line-clamp-1">
					{formatEventDate(event.eventDate)}
					{event.venueName && <> &middot; {event.venueName}</>}
					{event.city && <> &middot; {event.city}</>}
				</p>

				<div className="flex items-center justify-between mb-1.5">
					<div className="flex items-center gap-1.5 text-caption text-text-secondary">
						<PeopleIcon />
						{cap > 0 ? `${cap} capacity` : "—"}
					</div>
				</div>
				<div className="h-1.5 bg-surface-card-muted rounded-full overflow-hidden">
					<div className="h-full bg-action-primary rounded-full w-0" />
				</div>
			</div>
		</div>
	)
}

// ─── List Card ────────────────────────────────────────────────────────────────

function ListCard({ event, openDropdownId, onToggleKebab, onNavigate, onDeleteDraft }: CardProps) {
	const cfg = STATUS_CONFIG[event.status]
	const cap = eventCapacity(event)
	const price = eventStartingPrice(event)
	const priceLabel = price === null ? "—" : price === 0 ? "Free" : `₹${price}`
	const cover = eventCoverUrl(event)

	return (
		<div
			onClick={() => onNavigate(`/dashboard/events/${event.id}`)}
			className="group cursor-pointer flex gap-4 bg-surface-card border border-border-default rounded-action p-4 hover:border-border-strong hover:shadow-card-hover transition-all"
		>
			{/* Thumbnail */}
			<div className="relative w-32 sm:w-40 aspect-4/3 rounded-action overflow-hidden shrink-0 bg-surface-card-muted">
				{cover ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img
						src={cover}
						alt={event.title ?? ""}
						className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
						loading="lazy"
					/>
				) : (
					<div className="w-full h-full bg-linear-to-br from-surface-card-muted to-border-default" />
				)}
				<span
					className={clsx(
						"absolute top-2 left-2 text-caption font-semibold px-2 py-0.5 rounded-badge",
						cfg.imageBadge,
					)}
				>
					{cfg.label}
				</span>
			</div>

			{/* Content */}
			<div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
				<div>
					<h3 className="text-label-md font-semibold text-text-primary mb-0.5 line-clamp-1 group-hover:text-text-brand transition-colors">
						{event.title ?? "Untitled Event"}
					</h3>
					{event.category?.name && (
						<span className="inline-block text-caption text-text-brand bg-surface-brand-soft px-2 py-0.5 rounded-badge mb-1.5">
							{event.category.name}
						</span>
					)}
					<p className="text-caption text-text-muted line-clamp-1">
						{formatEventDate(event.eventDate)}
						{event.venueName && <> &middot; {event.venueName}</>}
						{event.city && <> &middot; {event.city}</>}
					</p>
				</div>
				<div className="mt-2">
					<div className="flex items-center gap-1.5 text-caption text-text-secondary mb-1.5">
						<PeopleIcon />
						{cap > 0 ? `${cap} capacity` : "—"}
					</div>
					<div className="h-1.5 bg-surface-card-muted rounded-full overflow-hidden max-w-48">
						<div className="h-full bg-action-primary rounded-full w-0" />
					</div>
				</div>
			</div>

			{/* Price + kebab */}
			<div
				className="flex flex-col items-end justify-between shrink-0"
				onClick={e => e.stopPropagation()}
			>
				<div data-kebab className="relative">
					<button
						onClick={e => onToggleKebab(event.id, e)}
						className="flex items-center justify-center size-8 rounded-action text-text-muted hover:bg-surface-card-muted hover:text-text-primary transition-colors"
						aria-label="Event options"
					>
						<DotsIcon />
					</button>
					{openDropdownId === event.id && (
						<div className="absolute right-0 top-10 z-50 w-44 bg-surface-card border border-border-default rounded-action shadow-floating py-1">
							<button
								onClick={() => onNavigate(`/dashboard/events/${event.id}`)}
								className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-label-sm text-text-primary hover:bg-surface-card-muted transition-colors"
							>
								<EyeIcon />
								View Detail
							</button>
							{event.status === "DRAFT" && (
								<>
									<button
										onClick={() => onNavigate(`/dashboard/events/${event.id}/edit`)}
										className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-label-sm text-text-primary hover:bg-surface-card-muted transition-colors"
									>
										<EditIcon />
										Edit
									</button>
									<div className="my-1 border-t border-border-default" />
									<button
										onClick={e => {
											e.stopPropagation()
											onDeleteDraft(event.id)
										}}
										className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-label-sm text-red-600 hover:bg-red-50 transition-colors"
									>
										<TrashIcon />
										Delete Draft
									</button>
								</>
							)}
						</div>
					)}
				</div>
				<div className="text-right hidden sm:block">
					<p
						className={clsx(
							"text-label-sm font-semibold",
							price === 0 ? "text-text-success" : "text-text-primary",
						)}
					>
						{priceLabel}
					</p>
					<p className="text-caption text-text-muted">
						{price === 0 ? "Free entry" : "Starting from"}
					</p>
				</div>
			</div>
		</div>
	)
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function PlusIcon() {
	return <PlusSvg className="size-4" aria-hidden />
}
function SearchIcon() {
	return <SearchSvg className="size-4 shrink-0" aria-hidden />
}
function XIcon() {
	return <CloseSvg className="size-3.5" aria-hidden />
}
function ListViewIcon() {
	return <ListSvg className="size-4" aria-hidden />
}
function GridViewIcon() {
	return <GridSvg className="size-4" aria-hidden />
}
function DotsIcon() {
	return <DotsSvg className="size-4" aria-hidden />
}
function EyeIcon() {
	return <EyeOpenSvg className="size-4" aria-hidden />
}
function EditIcon() {
	return <PenSquareSvg className="size-4" aria-hidden />
}
function PeopleIcon({ className }: { className?: string }) {
	return <UsersGroupSvg className={clsx("size-3.5", className)} aria-hidden />
}
function CalendarEmptyIcon() {
	return <CalendarSvg className="size-6" aria-hidden />
}
function TrashIcon() {
	return <TrashBinSvg className="size-4" aria-hidden />
}

function LoaderSpinner() {
	return (
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden
			className="animate-spin text-text-muted"
		>
			<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
			<path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}
