"use client"

import { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import clsx from "clsx"
import { Icon } from "@/components/ui/Icon"
import { Dropdown } from "@/components/ui/Dropdown"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import { MOCK_PAYOUTS, PAYOUT_TOTALS, type MockPayout, type PayoutStatus } from "@/lib/mock-payouts"
import DollarSvg from "@/icons/outlined/dollar.svg"
import CheckCircleSvg from "@/icons/outlined/check-circle.svg"
import ClockCircleSvg from "@/icons/outlined/clock-circle.svg"
import SearchSvg from "@/icons/outlined/search.svg"
import CloseSvg from "@/icons/outlined/close.svg"
import ArrowLeftSvg from "@/icons/outlined/arrow-left.svg"
import ArrowRightSvg from "@/icons/outlined/arrow-right.svg"
import AltArrowDownSvg from "@/icons/outlined/alt-arrow-down.svg"

// ─── Constants ────────────────────────────────────────────────────────────────

const ROWS_OPTIONS = [
	{ value: "10", label: "10 / page" },
	{ value: "25", label: "25 / page" },
	{ value: "50", label: "50 / page" },
]

const STATUS_TABS: { label: string; value: PayoutStatus | "All" }[] = [
	{ label: "All", value: "All" },
	{ label: "Paid", value: "Paid" },
	{ label: "Processing", value: "Processing" },
	{ label: "Failed", value: "Failed" },
]

const STATUS_STYLES: Record<PayoutStatus, string> = {
	Paid: "bg-status-success-bg text-status-success-text",
	Processing: "bg-amber-50 text-amber-700",
	Failed: "bg-status-error-bg text-status-error-text",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
	return `$${amount.toLocaleString("en-US")}`
}

function buildPageNumbers(current: number, total: number): (number | "…")[] {
	if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
	if (current <= 4) return [1, 2, 3, 4, 5, "…", total]
	if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total]
	return [1, "…", current - 1, current, current + 1, "…", total]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SearchIcon() {
	return (
		<Icon as={SearchSvg} size="sm" color="muted" aria-hidden />
	)
}

function CloseIcon() {
	return (
		<Icon as={CloseSvg} size="sm" color="muted" aria-hidden />
	)
}

function ArrowLeftIcon() {
	return <Icon as={ArrowLeftSvg} size="sm" aria-hidden />
}

function ArrowRightIcon() {
	return <Icon as={ArrowRightSvg} size="sm" aria-hidden />
}

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

function PayoutRow({ payout, isLast }: { payout: MockPayout; isLast: boolean }) {
	return (
		<tr className={clsx("hover:bg-surface-card-muted transition-colors", !isLast && "border-b border-border-subtle")}>
			<td className="px-4 py-3.5">
				<Link
					href={`/dashboard/events/${payout.eventId}`}
					className="text-body-sm font-medium text-text-brand hover:underline underline-offset-2"
				>
					{payout.eventTitle}
				</Link>
			</td>
			<td className="px-4 py-3.5">
				<span className="text-body-sm font-semibold text-text-primary">{formatCurrency(payout.amount)}</span>
			</td>
			<td className="px-4 py-3.5">
				<span className="text-body-sm text-text-secondary">{payout.date}</span>
			</td>
			<td className="px-4 py-3.5">
				<span className="text-body-sm text-text-secondary">{payout.method}</span>
			</td>
			<td className="px-4 py-3.5">
				<span
					className={clsx(
						"inline-flex items-center px-2.5 py-1 rounded-badge text-caption font-medium",
						STATUS_STYLES[payout.status],
					)}
				>
					{payout.status}
				</span>
			</td>
		</tr>
	)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PayoutsPage() {
	const [search, setSearch] = useState("")
	const [statusFilter, setStatusFilter] = useState<PayoutStatus | "All">("All")
	const [currentPage, setCurrentPage] = useState(1)
	const [rowsPerPage, setRowsPerPage] = useState(10)

	const handleSearch = useCallback((v: string) => {
		setSearch(v)
		setCurrentPage(1)
	}, [])

	const handleStatusFilter = useCallback((v: PayoutStatus | "All") => {
		setStatusFilter(v)
		setCurrentPage(1)
	}, [])

	const handleRowsPerPage = useCallback((v: string) => {
		setRowsPerPage(Number(v))
		setCurrentPage(1)
	}, [])

	const filtered = useMemo(() => {
		let result = MOCK_PAYOUTS
		if (statusFilter !== "All") {
			result = result.filter(p => p.status === statusFilter)
		}
		if (search.trim()) {
			const q = search.toLowerCase()
			result = result.filter(p =>
				p.eventTitle.toLowerCase().includes(q) ||
				p.method.toLowerCase().includes(q) ||
				p.reference.toLowerCase().includes(q),
			)
		}
		return result
	}, [search, statusFilter])

	const statusCounts = useMemo(() => {
		const counts: Record<PayoutStatus | "All", number> = { All: MOCK_PAYOUTS.length, Paid: 0, Processing: 0, Failed: 0 }
		for (const p of MOCK_PAYOUTS) counts[p.status]++
		return counts
	}, [])

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
					<h1 className="text-heading-sm font-semibold text-text-primary">Payouts</h1>
					<p className="text-body-sm text-text-secondary mt-0.5">Track your earnings and payout history</p>
				</div>

				{/* Stats cards */}
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
					{/* Total Earned */}
					<div className="bg-surface-card border border-border-subtle rounded-card px-5 py-4 flex items-center gap-4">
						<div className="size-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
							<Icon as={DollarSvg} size="md" color="success" aria-hidden />
						</div>
						<div>
							<p className="text-caption text-text-tertiary">Total Earned</p>
							<p className="text-title-md font-semibold text-text-primary mt-0.5">
								{formatCurrency(PAYOUT_TOTALS.totalEarned)}
							</p>
						</div>
					</div>

					{/* Total Paid Out */}
					<div className="bg-surface-card border border-border-subtle rounded-card px-5 py-4 flex items-center gap-4">
						<div className="size-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
							<Icon as={CheckCircleSvg} size="md" color="info" aria-hidden />
						</div>
						<div>
							<p className="text-caption text-text-tertiary">Total Paid Out</p>
							<p className="text-title-md font-semibold text-text-primary mt-0.5">
								{formatCurrency(PAYOUT_TOTALS.totalPaidOut)}
							</p>
						</div>
					</div>

					{/* Processing */}
					<div className="bg-surface-card border border-border-subtle rounded-card px-5 py-4 flex items-center gap-4">
						<div className="size-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
							<Icon as={ClockCircleSvg} size="md" color="warning" aria-hidden />
						</div>
						<div>
							<p className="text-caption text-text-tertiary">Processing</p>
							<p className="text-title-md font-semibold text-text-primary mt-0.5">
								{formatCurrency(PAYOUT_TOTALS.processing)}
							</p>
						</div>
					</div>
				</div>

				{/* Payout History */}
				<div className="bg-surface-card border border-border-subtle rounded-card overflow-hidden">
					{/* Section header */}
					<div className="flex items-center justify-between gap-4 px-5 pt-5 pb-4 border-b border-border-subtle flex-wrap gap-y-3">
						<h2 className="text-label-md font-semibold text-text-primary">Payout History</h2>
						<button className="flex items-center gap-1.5 text-label-sm font-medium text-text-brand hover:text-text-brand/80 transition-colors">
							<Icon as={AltArrowDownSvg} size="sm" color="brand" aria-hidden />
							Download Report
						</button>
					</div>

					{/* Search + filter bar */}
					<div className="px-5 pt-4 pb-0">
						{/* Search */}
						<div className="mb-4 flex items-center gap-2 h-9 px-3 rounded-action border border-border-default bg-surface-canvas text-text-muted hover:border-border-strong focus-within:border-border-focused transition-colors max-w-xs">
							<SearchIcon />
							<input
								type="text"
								value={search}
								onChange={e => handleSearch(e.target.value)}
								placeholder="Search payouts..."
								className="flex-1 min-w-0 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
							/>
							{search && (
								<button onClick={() => handleSearch("")} className="text-text-muted hover:text-text-primary shrink-0">
									<CloseIcon />
								</button>
							)}
						</div>

						{/* Status tabs */}
						<div className="flex items-center gap-1 overflow-x-auto scrollbar-none border-b border-border-subtle -mx-5 px-5">
							{STATUS_TABS.map(tab => {
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
											{statusCounts[tab.value]}
										</span>
									</button>
								)
							})}
						</div>
					</div>

					{/* Table */}
					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="border-b border-border-subtle">
									<th className="px-4 py-3 text-caption font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap">Event</th>
									<th className="px-4 py-3 text-caption font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap">Amount</th>
									<th className="px-4 py-3 text-caption font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap">Date</th>
									<th className="px-4 py-3 text-caption font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap">Method</th>
									<th className="px-4 py-3 text-caption font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap">Status</th>
								</tr>
							</thead>
							<tbody>
								{pageRows.length === 0 ? (
									<tr>
										<td colSpan={5} className="px-4 py-16 text-center text-body-sm text-text-muted">
											No payouts match your search.
										</td>
									</tr>
								) : (
									pageRows.map((payout, i) => (
										<PayoutRow
											key={payout.id}
											payout={payout}
											isLast={i === pageRows.length - 1}
										/>
									))
								)}
							</tbody>
						</table>
					</div>

					{/* Pagination footer */}
					<div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-border-subtle flex-wrap gap-y-3">
						<p className="text-caption text-text-muted shrink-0">
							Showing <span className="font-medium text-text-primary">{rangeStart}–{rangeEnd}</span> of{" "}
							<span className="font-medium text-text-primary">{filtered.length}</span>
						</p>

						<div className="flex items-center gap-3 ml-auto">
							<Dropdown
								options={ROWS_OPTIONS}
								value={String(rowsPerPage)}
								onChange={handleRowsPerPage}
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
				</div>
			</div>
		</div>
	)
}
