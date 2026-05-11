"use client"

import { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import clsx from "clsx"
import { Dropdown } from "@/components/ui/Dropdown"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import { MOCK_REGISTRATIONS, type MockRegistration } from "@/lib/mock-registrations"
import SearchSvg from "@/icons/outlined/search.svg"
import CloseSvg from "@/icons/outlined/close.svg"
import EyeOpenSvg from "@/icons/outlined/eye-open.svg"
import UserCheckSvg from "@/icons/outlined/user-check.svg"
import UserCrossSvg from "@/icons/outlined/user-cross.svg"
import ArrowLeftSvg from "@/icons/outlined/arrow-left.svg"
import ArrowRightSvg from "@/icons/outlined/arrow-right.svg"

// ─── Constants ────────────────────────────────────────────────────────────────

const ROWS_OPTIONS = [
	{ value: "10", label: "10 / page" },
	{ value: "25", label: "25 / page" },
	{ value: "50", label: "50 / page" },
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RegistrationsPage() {
	const [search, setSearch] = useState("")
	const [currentPage, setCurrentPage] = useState(1)
	const [rowsPerPage, setRowsPerPage] = useState(10)

	const handleSearch = useCallback((v: string) => {
		setSearch(v)
		setCurrentPage(1)
	}, [])

	const handleRowsPerPage = useCallback((v: string) => {
		setRowsPerPage(Number(v))
		setCurrentPage(1)
	}, [])

	const filtered = useMemo(() => {
		if (!search.trim()) return MOCK_REGISTRATIONS
		const q = search.toLowerCase()
		return MOCK_REGISTRATIONS.filter(r =>
			r.attendeeName.toLowerCase().includes(q) ||
			r.attendeeEmail.toLowerCase().includes(q) ||
			r.eventTitle.toLowerCase().includes(q),
		)
	}, [search])

	const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
	const safePage = Math.min(currentPage, totalPages)
	const startIdx = (safePage - 1) * rowsPerPage
	const pageRows = filtered.slice(startIdx, startIdx + rowsPerPage)

	const rangeStart = filtered.length === 0 ? 0 : startIdx + 1
	const rangeEnd = Math.min(startIdx + rowsPerPage, filtered.length)

	return (
		<div className="flex flex-col min-h-screen">
			<DashboardTopBar />

			<div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 bg-surface-page">
				{/* Header */}
				<div className="mb-6">
					<h1 className="text-heading-sm font-semibold text-text-primary">Registrations</h1>
					<p className="text-body-sm text-text-secondary mt-0.5">
						{MOCK_REGISTRATIONS.length} total registrations across all events
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

				{/* Table card */}
				<div className="bg-surface-card border border-border-subtle rounded-card overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="border-b border-border-subtle">
									<th className="px-4 py-3 text-caption font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap w-64">Attendee</th>
									<th className="px-4 py-3 text-caption font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap">Event</th>
									<th className="px-4 py-3 text-caption font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap">Ticket</th>
									<th className="px-4 py-3 text-caption font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap">Date</th>
									<th className="px-4 py-3 text-caption font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap">Paid</th>
									<th className="px-4 py-3 text-caption font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap">Check-In</th>
									<th className="px-4 py-3 text-caption font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap text-right">Event</th>
								</tr>
							</thead>
							<tbody>
								{pageRows.length === 0 ? (
									<tr>
										<td colSpan={7} className="px-4 py-16 text-center text-body-sm text-text-muted">
											No registrations match your search.
										</td>
									</tr>
								) : (
									pageRows.map((reg, i) => (
										<RegistrationRow
											key={reg.id}
											reg={reg}
											isLast={i === pageRows.length - 1}
										/>
									))
								)}
							</tbody>
						</table>
					</div>

					{/* Pagination footer */}
					<div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-border-subtle flex-wrap gap-y-3">
						{/* Range label */}
						<p className="text-caption text-text-muted shrink-0">
							Showing <span className="font-medium text-text-primary">{rangeStart}–{rangeEnd}</span> of{" "}
							<span className="font-medium text-text-primary">{filtered.length}</span>
						</p>

						<div className="flex items-center gap-3 ml-auto">
							{/* Rows per page */}
							<Dropdown
								options={ROWS_OPTIONS}
								value={String(rowsPerPage)}
								onChange={handleRowsPerPage}
								size="sm"
								className="w-28"
							/>

							{/* Page controls */}
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
				</div>
			</div>
		</div>
	)
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function RegistrationRow({ reg, isLast }: { reg: MockRegistration; isLast: boolean }) {
	const initials = reg.attendeeName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
	const color = avatarColor(reg.attendeeName)
	const isCheckedIn = reg.checkIn === "checked-in"

	return (
		<tr className={clsx("hover:bg-surface-card-muted transition-colors", !isLast && "border-b border-border-subtle")}>
			{/* Attendee */}
			<td className="px-4 py-3.5">
				<div className="flex items-center gap-3 min-w-0">
					<div className={clsx("size-8 rounded-full flex items-center justify-center shrink-0 text-caption font-semibold", color)}>
						{initials}
					</div>
					<div className="min-w-0">
						<p className="text-label-sm font-medium text-text-primary truncate">{reg.attendeeName}</p>
						<p className="text-caption text-text-muted truncate">{reg.attendeeEmail}</p>
					</div>
				</div>
			</td>

			{/* Event */}
			<td className="px-4 py-3.5">
				<span className="text-label-sm font-medium text-text-primary truncate block max-w-48">
					{reg.eventTitle}
				</span>
			</td>

			{/* Ticket type */}
			<td className="px-4 py-3.5">
				<span className="inline-flex items-center px-2.5 py-1 rounded-badge text-caption font-medium bg-neutral-100 text-text-secondary border border-border-subtle whitespace-nowrap">
					{reg.ticketType}
				</span>
			</td>

			{/* Date */}
			<td className="px-4 py-3.5">
				<span className="text-label-sm text-text-primary tabular-nums whitespace-nowrap">{reg.date}</span>
			</td>

			{/* Paid */}
			<td className="px-4 py-3.5">
				<span className="text-label-sm font-semibold text-text-primary whitespace-nowrap">
					${reg.paid}
				</span>
			</td>

			{/* Check-in status */}
			<td className="px-4 py-3.5">
				<span className={clsx(
					"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-badge text-caption font-medium whitespace-nowrap",
					isCheckedIn
						? "bg-green-50 text-green-700"
						: "bg-surface-card-muted text-text-secondary",
				)}>
					{isCheckedIn ? <UserCheckIcon /> : <UserCrossIcon />}
					{isCheckedIn ? "Checked In" : "Pending"}
				</span>
			</td>

			{/* View event action */}
			<td className="px-4 py-3.5 text-right">
				<Link
					href={`/dashboard/events/${reg.eventId}`}
					aria-label={`View ${reg.eventTitle}`}
					className="inline-flex items-center justify-center size-8 rounded-action text-text-muted hover:text-text-primary hover:bg-surface-card-muted transition-colors"
				>
					<EyeIcon />
				</Link>
			</td>
		</tr>
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

// ─── Icons ───────────────────────────────────────────────────────────────────

function SearchIcon() { return <SearchSvg className="size-4 shrink-0" aria-hidden /> }
function CloseIcon() { return <CloseSvg className="size-3.5" aria-hidden /> }
function EyeIcon() { return <EyeOpenSvg className="size-4" aria-hidden /> }
function UserCheckIcon() { return <UserCheckSvg className="size-3.5" aria-hidden /> }
function UserCrossIcon() { return <UserCrossSvg className="size-3.5" aria-hidden /> }
function ArrowLeftIcon() { return <ArrowLeftSvg className="size-4" aria-hidden /> }
function ArrowRightIcon() { return <ArrowRightSvg className="size-4" aria-hidden /> }
