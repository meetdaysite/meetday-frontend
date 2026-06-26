"use client"

import { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import clsx from "clsx"
import { Dropdown } from "@/components/ui/Dropdown"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import { MOCK_REGISTRATIONS } from "@/lib/mock-registrations"
import SearchSvg from "@/icons/outlined/search.svg"
import CloseSvg from "@/icons/outlined/close.svg"
import UserCheckSvg from "@/icons/outlined/user-check.svg"
import UserCrossSvg from "@/icons/outlined/user-cross.svg"
import ArrowLeftSvg from "@/icons/outlined/arrow-left.svg"
import ArrowRightSvg from "@/icons/outlined/arrow-right.svg"
import EyeOpenSvg from "@/icons/outlined/eye-open.svg"
import CalendarSvg from "@/icons/outlined/calendar.svg"

// ─── Constants ────────────────────────────────────────────────────────────────

const ROWS_OPTIONS = [
	{ value: "12", label: "12 / page" },
	{ value: "24", label: "24 / page" },
	{ value: "48", label: "48 / page" },
]

const AVATAR_COLORS = [
	"bg-red-100 text-red-700",
	"bg-orange-100 text-orange-700",
	"bg-amber-100 text-amber-700",
	"bg-emerald-100 text-emerald-700",
	"bg-cyan-100 text-cyan-700",
	"bg-blue-100 text-blue-700",
	"bg-violet-100 text-violet-700",
	"bg-pink-100 text-pink-700",
]

function avatarColor(name: string): string {
	let hash = 0
	for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
	return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// Deduplicate registrations by email, keeping all events for each attendee
interface Attendee {
	email: string
	name: string
	eventId: string
	eventTitle: string
	checkIn: "checked-in" | "pending"
	totalEvents: number
}

function buildAttendees(): Attendee[] {
	const map = new Map<string, Attendee>()
	for (const reg of MOCK_REGISTRATIONS) {
		const existing = map.get(reg.attendeeEmail)
		if (existing) {
			existing.totalEvents += 1
		} else {
			map.set(reg.attendeeEmail, {
				email: reg.attendeeEmail,
				name: reg.attendeeName,
				eventId: reg.eventId,
				eventTitle: reg.eventTitle,
				checkIn: reg.checkIn,
				totalEvents: 1,
			})
		}
	}
	return Array.from(map.values())
}

const ALL_ATTENDEES = buildAttendees()

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AttendeesPage() {
	const [search, setSearch] = useState("")
	const [currentPage, setCurrentPage] = useState(1)
	const [perPage, setPerPage] = useState(12)

	const handleSearch = useCallback((v: string) => {
		setSearch(v)
		setCurrentPage(1)
	}, [])

	const handlePerPage = useCallback((v: string) => {
		setPerPage(Number(v))
		setCurrentPage(1)
	}, [])

	const filtered = useMemo(() => {
		if (!search.trim()) return ALL_ATTENDEES
		const q = search.toLowerCase()
		return ALL_ATTENDEES.filter(a =>
			a.name.toLowerCase().includes(q) ||
			a.eventTitle.toLowerCase().includes(q),
		)
	}, [search])

	const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
	const safePage = Math.min(currentPage, totalPages)
	const startIdx = (safePage - 1) * perPage
	const pageItems = filtered.slice(startIdx, startIdx + perPage)

	const rangeStart = filtered.length === 0 ? 0 : startIdx + 1
	const rangeEnd = Math.min(startIdx + perPage, filtered.length)

	return (
		<div className="flex flex-col min-h-screen">
			<DashboardTopBar />

			<div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 bg-surface-page">
				{/* Header */}
				<div className="mb-6">
					<h1 className="text-heading-sm font-semibold text-text-primary">Attendees</h1>
					<p className="text-body-sm text-text-secondary mt-0.5">
						{ALL_ATTENDEES.length} unique attendees across all your events
					</p>
				</div>

				{/* Search */}
				<div className="mb-5 flex items-center gap-2 h-9 px-3 rounded-action border border-border-default bg-surface-canvas text-text-muted hover:border-border-strong focus-within:border-border-focused transition-colors max-w-xs">
					<SearchIcon />
					<input
						type="text"
						value={search}
						onChange={e => handleSearch(e.target.value)}
						placeholder="Search attendee..."
						className="flex-1 min-w-0 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
					/>
					{search && (
						<button onClick={() => handleSearch("")} className="text-text-muted hover:text-text-primary shrink-0">
							<CloseIcon />
						</button>
					)}
				</div>

				{/* Card grid */}
				{pageItems.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-24 text-center">
						<p className="text-body-sm text-text-muted">No attendees match your search.</p>
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
						{pageItems.map(attendee => (
							<AttendeeCard key={attendee.email} attendee={attendee} />
						))}
					</div>
				)}

				{/* Pagination */}
				{filtered.length > 0 && (
					<div className="flex items-center justify-between gap-4 mt-6 flex-wrap gap-y-3">
						<p className="text-caption text-text-muted shrink-0">
							Showing <span className="font-medium text-text-primary">{rangeStart}–{rangeEnd}</span> of{" "}
							<span className="font-medium text-text-primary">{filtered.length}</span>
						</p>

						<div className="flex items-center gap-3 ml-auto">
							<Dropdown
								options={ROWS_OPTIONS}
								value={String(perPage)}
								onChange={handlePerPage}
								size="sm"
								className="w-28"
							/>

							<div className="flex items-center gap-1">
								<PageButton
									onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
									disabled={safePage === 1}
									aria-label="Previous page"
								>
									<ArrowLeftIcon />
								</PageButton>

								{buildPageNumbers(safePage, totalPages).map((item, i) =>
									item === "…" ? (
										<span key={`ellipsis-${i}`} className="px-1 text-caption text-text-muted select-none">…</span>
									) : (
										<PageButton
											key={item}
											onClick={() => setCurrentPage(item as number)}
											active={(item as number) === safePage}
										>
											{item}
										</PageButton>
									),
								)}

								<PageButton
									onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
									disabled={safePage === totalPages}
									aria-label="Next page"
								>
									<ArrowRightIcon />
								</PageButton>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function AttendeeCard({ attendee }: { attendee: Attendee }) {
	const initials = attendee.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
	const color = avatarColor(attendee.name)
	const isCheckedIn = attendee.checkIn === "checked-in"

	return (
		<div className="bg-surface-card border border-border-default rounded-action px-4 py-4 flex items-center gap-3 hover:border-border-default transition-colors">
			{/* Avatar */}
			<div className={clsx("size-10 rounded-full flex items-center justify-center shrink-0 text-label-sm font-semibold", color)}>
				{initials}
			</div>

			{/* Info */}
			<div className="flex-1 min-w-0">
				<p className="text-label-sm font-medium text-text-primary truncate">{attendee.name}</p>
				<div className="flex items-center gap-1 mt-1 min-w-0">
					<CalendarIcon />
					<span className="text-caption text-text-muted truncate">{attendee.eventTitle}</span>
				</div>
			</div>

			{/* Right side: status + link */}
			<div className="flex flex-col items-end gap-2 shrink-0">
				<span className={clsx(
					"inline-flex items-center gap-1 text-caption font-medium whitespace-nowrap",
					isCheckedIn ? "text-green-600" : "text-text-muted",
				)}>
					{isCheckedIn ? <UserCheckIcon /> : <UserCrossIcon />}
					{isCheckedIn ? "In" : "Pending"}
				</span>
				<Link
					href={`/dashboard/events/${attendee.eventId}`}
					aria-label={`View ${attendee.eventTitle}`}
					className="inline-flex items-center justify-center size-6 rounded text-text-muted hover:text-text-primary transition-colors"
				>
					<EyeIcon />
				</Link>
			</div>
		</div>
	)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────────

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

// ─── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon() { return <SearchSvg className="size-4 shrink-0" aria-hidden /> }
function CloseIcon() { return <CloseSvg className="size-3.5" aria-hidden /> }
function UserCheckIcon() { return <UserCheckSvg className="size-3.5" aria-hidden /> }
function UserCrossIcon() { return <UserCrossSvg className="size-3.5" aria-hidden /> }
function ArrowLeftIcon() { return <ArrowLeftSvg className="size-4" aria-hidden /> }
function ArrowRightIcon() { return <ArrowRightSvg className="size-4" aria-hidden /> }
function EyeIcon() { return <EyeOpenSvg className="size-4" aria-hidden /> }
function CalendarIcon() { return <CalendarSvg className="size-3 shrink-0 text-text-muted" aria-hidden /> }
