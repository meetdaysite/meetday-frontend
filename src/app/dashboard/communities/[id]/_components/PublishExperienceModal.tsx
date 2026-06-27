"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import clsx from "clsx"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import { getMyEvents, addHostCommunityEvent } from "@/lib/api"
import type { Event, ApiEventStatus } from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"
import { toast } from "sonner"
import SearchSvg from "@/icons/outlined/search.svg"
import CloseCircleSvg from "@/icons/outlined/close-circle.svg"
import PlaneSvg from "@/icons/outlined/plane.svg"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import MapPointSvg from "@/icons/outlined/map-point.svg"
import AltArrowRightSvg from "@/icons/outlined/alt-arrow-right.svg"

// ─── Constants ────────────────────────────────────────────────────────────────

type StatusFilter = "ALL" | ApiEventStatus

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
	{ value: "ALL", label: "All" },
	{ value: "PUBLISHED", label: "Published" },
	{ value: "UNDER_REVIEW", label: "Under Review" },
	{ value: "DRAFT", label: "Draft" },
]

const STATUS_CONFIG: Record<ApiEventStatus, { label: string; className: string }> = {
	DRAFT: { label: "Draft", className: "bg-neutral-100 text-neutral-700" },
	UNDER_REVIEW: { label: "Under Review", className: "bg-blue-50 text-blue-700" },
	PUBLISHED: { label: "Published", className: "bg-green-50 text-green-700" },
	CANCELLED: { label: "Cancelled", className: "bg-orange-50 text-orange-700" },
	REJECTED: { label: "Rejected", className: "bg-red-50 text-red-700" },
	COMPLETED: { label: "Completed", className: "bg-neutral-900 text-white" },
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface PublishExperienceModalProps {
	communityId: string
	open: boolean
	onClose: () => void
	onSuccess: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PublishExperienceModal({
	communityId,
	open,
	onClose,
	onSuccess,
}: PublishExperienceModalProps) {
	const [events, setEvents] = useState<Event[]>([])
	const [loading, setLoading] = useState(false)
	const [fetchError, setFetchError] = useState<string | null>(null)
	const [search, setSearch] = useState("")
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [submitting, setSubmitting] = useState(false)
	const [submitError, setSubmitError] = useState<string | null>(null)
	const searchRef = useRef<HTMLInputElement>(null)

	// Fetch events when modal opens
	useEffect(() => {
		if (!open) return
		setSearch("")
		setStatusFilter("ALL")
		setSelectedId(null)
		setSubmitError(null)
		let cancelled = false
		async function load() {
			setLoading(true)
			setFetchError(null)
			try {
				const res = await getMyEvents({ limit: 100 })
				if (!cancelled) setEvents(res.events)
			} catch (err) {
				if (!cancelled) setFetchError(getApiErrorMessage(err))
			} finally {
				if (!cancelled) setLoading(false)
			}
		}
		load()
		return () => { cancelled = true }
	}, [open])

	// Close on Escape
	useEffect(() => {
		if (!open) return
		function handleKey(e: KeyboardEvent) {
			if (e.key === "Escape") onClose()
		}
		document.addEventListener("keydown", handleKey)
		return () => document.removeEventListener("keydown", handleKey)
	}, [open, onClose])

	// Focus search on open
	useEffect(() => {
		if (open) setTimeout(() => searchRef.current?.focus(), 50)
	}, [open])

	if (!open) return null

	// Client-side filter
	const filtered = events.filter((ev) => {
		if (statusFilter !== "ALL" && ev.status !== statusFilter) return false
		if (search.trim()) {
			const q = search.trim().toLowerCase()
			const title = (ev.title ?? "").toLowerCase()
			const city = (ev.city ?? "").toLowerCase()
			if (!title.includes(q) && !city.includes(q)) return false
		}
		return true
	})

	async function handleContinue() {
		if (!selectedId) return
		setSubmitting(true)
		setSubmitError(null)
		try {
			await addHostCommunityEvent(communityId, selectedId)
			toast.success("Experience published to community")
			onSuccess()
			onClose()
		} catch (err) {
			setSubmitError(getApiErrorMessage(err))
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
			onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
		>
			<div className="bg-surface-card rounded-panel border border-border-default shadow-floating w-full max-w-2xl flex flex-col max-h-[90vh]">

				{/* Header */}
				<div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border-default shrink-0">
					<div>
						<p className="text-body-lg font-bold text-text-primary">Publish an Experience</p>
						<p className="text-label-sm text-text-secondary mt-0.5">
							Select an experience to publish in this community.
						</p>
					</div>
					<button
						onClick={onClose}
						className="size-8 flex items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-surface-card-muted transition-colors"
						aria-label="Close"
					>
						<Icon as={CloseCircleSvg} size="md" color="inherit" />
					</button>
				</div>

				{/* Search + Status filter */}
				<div className="px-6 pt-4 pb-3 flex flex-col gap-3 shrink-0">
					<div className="relative">
						<SearchSvg className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-secondary pointer-events-none" aria-hidden />
						<input
							ref={searchRef}
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search by title or city…"
							className="w-full h-[var(--size-action-md)] pl-9 pr-4 rounded-action border border-border-default bg-surface-page text-label-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-action-primary/30 focus:border-action-primary transition-colors"
						/>
					</div>

					<div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
						{STATUS_TABS.map(({ value, label }) => (
							<button
								key={value}
								onClick={() => setStatusFilter(value)}
								className={clsx(
									"shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium border whitespace-nowrap transition-colors",
									statusFilter === value
										? "border-text-primary text-text-primary bg-transparent"
										: "border-border-default text-text-secondary hover:text-text-primary hover:border-border-focus",
								)}
							>
								{label}
							</button>
						))}
					</div>
				</div>

				{/* List */}
				<div className="flex-1 overflow-y-auto px-6 pb-2 flex flex-col gap-2 min-h-0">
					{loading ? (
						<>
							{Array.from({ length: 4 }).map((_, i) => (
								<div key={i} className="flex items-center gap-3 p-3 rounded-action border border-border-default animate-pulse">
									<div className="size-4 rounded-full bg-neutral-200 shrink-0" />
									<div className="w-12 h-12 rounded-action bg-neutral-200 shrink-0" />
									<div className="flex-1 flex flex-col gap-1.5">
										<div className="h-4 w-2/3 bg-neutral-200 rounded" />
										<div className="h-3 w-1/2 bg-neutral-100 rounded" />
									</div>
									<div className="h-5 w-20 bg-neutral-100 rounded-full" />
								</div>
							))}
						</>
					) : fetchError ? (
						<div className="py-12 flex flex-col items-center text-center">
							<p className="text-body-md font-semibold text-text-primary mb-1">Failed to load experiences</p>
							<p className="text-label-sm text-text-secondary">{fetchError}</p>
						</div>
					) : filtered.length === 0 ? (
						<div className="py-12 flex flex-col items-center text-center">
							<div className="size-12 rounded-full bg-surface-brand-soft flex items-center justify-center mb-3">
								<Icon as={PlaneSvg} size="md" color="brand" />
							</div>
							{events.length === 0 ? (
								<>
									<p className="text-body-md font-semibold text-text-primary mb-1">No experiences yet</p>
									<p className="text-label-sm text-text-secondary mb-4">
										Create your first experience to publish it in this community.
									</p>
									<Link href="/dashboard/create" onClick={onClose} className="text-label-sm text-text-brand font-medium hover:underline flex items-center gap-1">
										Create a new one
										<AltArrowRightSvg className="size-3.5" aria-hidden />
									</Link>
								</>
							) : (
								<>
									<p className="text-body-md font-semibold text-text-primary mb-1">No results</p>
									<p className="text-label-sm text-text-secondary">
										{search ? `No experiences match "${search}".` : "No experiences with this status."}
									</p>
								</>
							)}
						</div>
					) : (
						filtered.map((ev) => {
							const statusCfg = STATUS_CONFIG[ev.status]
							const dateLabel = ev.eventDate
								? new Date(ev.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
								: null
							const isSelected = selectedId === ev.id
							return (
								<button
									key={ev.id}
									type="button"
									onClick={() => setSelectedId(ev.id)}
									className={clsx(
										"flex items-center gap-3 p-3 rounded-action border text-left transition-colors w-full",
										isSelected
											? "border-action-primary bg-surface-brand-soft"
											: "border-border-default hover:bg-surface-card-muted",
									)}
								>
									{/* Radio */}
									<div className={clsx(
										"size-4 rounded-full border-2 shrink-0 flex items-center justify-center",
										isSelected ? "border-action-primary" : "border-border-default",
									)}>
										{isSelected && <div className="size-2 rounded-full bg-action-primary" />}
									</div>

									{/* Cover thumbnail */}
									<div className="w-12 h-12 rounded-action overflow-hidden shrink-0 relative bg-neutral-100">
										{ev.coverImageUrl ? (
											<Image src={ev.coverImageUrl} alt={ev.title ?? ""} fill sizes="48px" className="object-cover" />
										) : (
											<div className="w-full h-full flex items-center justify-center">
												<Icon as={PlaneSvg} size="sm" color="secondary" />
											</div>
										)}
									</div>

									{/* Info */}
									<div className="flex-1 min-w-0">
										<p className="text-label-sm font-semibold text-text-primary truncate">
											{ev.title ?? "Untitled"}
										</p>
										<div className="flex items-center gap-2 mt-0.5 flex-wrap">
											{dateLabel && (
												<span className="flex items-center gap-1 text-caption text-text-secondary">
													<CalendarSvg className="size-3 shrink-0" aria-hidden />
													{dateLabel}
												</span>
											)}
											{ev.city && (
												<span className="flex items-center gap-1 text-caption text-text-secondary">
													<MapPointSvg className="size-3 shrink-0" aria-hidden />
													{ev.city}
												</span>
											)}
											{ev.totalCapacity != null && (
												<span className="text-caption text-text-muted">· {ev.totalCapacity} capacity</span>
											)}
										</div>
									</div>

									{/* Status badge */}
									<span className={clsx("shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full", statusCfg.className)}>
										{statusCfg.label}
									</span>
								</button>
							)
						})
					)}
				</div>

				{/* Create new link */}
				{!loading && !fetchError && events.length > 0 && (
					<div className="px-6 py-2 border-t border-border-subtle shrink-0">
						<p className="text-caption text-text-muted">
							Don&apos;t see what you need?{" "}
							<Link href="/dashboard/create" onClick={onClose} className="text-text-brand font-medium hover:underline inline-flex items-center gap-0.5">
								Create a new one
								<AltArrowRightSvg className="size-3" aria-hidden />
							</Link>
						</p>
					</div>
				)}

				{/* Submit error */}
				{submitError && (
					<div className="mx-6 px-4 py-2.5 rounded-action bg-red-50 border border-red-200 shrink-0">
						<p className="text-label-sm text-red-700">{submitError}</p>
					</div>
				)}

				{/* Footer */}
				<div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-default shrink-0">
					<Button variant="secondary" size="md" radius="md" onClick={onClose} disabled={submitting}>
						Cancel
					</Button>
					<Button
						variant="primary"
						size="md"
						radius="md"
						disabled={!selectedId || submitting}
						onClick={handleContinue}
						rightIcon={<Icon as={AltArrowRightSvg} size="sm" color="inherit" />}
					>
						{submitting ? "Publishing…" : "Continue"}
					</Button>
				</div>
			</div>
		</div>
	)
}
