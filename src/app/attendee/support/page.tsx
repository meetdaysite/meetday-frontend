"use client"

import { useCallback, useEffect, useState } from "react"
import clsx from "clsx"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { SupportTicketModal } from "@/components/attendee/SupportTicketModal"
import { TicketDetailModal } from "@/components/attendee/TicketDetailModal"
import {
	listMyTickets,
	CATEGORY_LABELS,
	type SupportTicket,
	type SupportTicketStatus,
} from "@/lib/supportApi"

// ─── Constants ────────────────────────────────────────────────────────────────

type Tab = "active" | "resolved" | "all"

const TABS: { value: Tab; label: string }[] = [
	{ value: "active", label: "Active" },
	{ value: "resolved", label: "Resolved" },
	{ value: "all", label: "All" },
]

const STATUS_CONFIG: Record<SupportTicketStatus, { label: string; className: string }> = {
	OPEN: { label: "Open", className: "bg-surface-info-soft text-text-info border-blue-200" },
	IN_PROGRESS: { label: "In Progress", className: "bg-surface-warning-soft text-text-warning border-yellow-200" },
	RESOLVED: { label: "Resolved", className: "bg-surface-success-soft text-text-success border-green-200" },
	CLOSED: { label: "Closed", className: "bg-surface-card-muted text-text-muted border-border-default" },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
	const date = new Date(iso)
	const now = new Date()
	const diffMs = now.getTime() - date.getTime()
	const diffMins = Math.floor(diffMs / 60000)
	const diffHours = Math.floor(diffMs / 3600000)
	const diffDays = Math.floor(diffMs / 86400000)
	if (diffMins < 1) return "Just now"
	if (diffMins < 60) return `${diffMins}m ago`
	if (diffHours < 24) return `${diffHours}h ago`
	if (diffDays === 1) return "Yesterday"
	if (diffDays < 7) return `${diffDays}d ago`
	return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
}

function filterTickets(tickets: SupportTicket[], tab: Tab): SupportTicket[] {
	if (tab === "active") return tickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS")
	if (tab === "resolved") return tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED")
	return tickets
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SupportTicketStatus }) {
	const { label, className } = STATUS_CONFIG[status]
	return (
		<span className={clsx("inline-flex items-center px-2 py-0.5 rounded-avatar text-caption font-semibold border", className)}>
			{label}
		</span>
	)
}

function TicketRow({ ticket, onClick }: { ticket: SupportTicket; onClick: () => void }) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="w-full text-left px-5 py-4 border-b border-border-default last:border-b-0 hover:bg-surface-card-muted transition-colors"
		>
			<div className="flex items-start justify-between gap-4">
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2 mb-1">
						<span className="text-caption font-mono text-text-muted shrink-0">{ticket.ticketNumber}</span>
						<StatusBadge status={ticket.status} />
					</div>
					<p className="text-body-sm font-semibold text-text-primary truncate">{ticket.subject}</p>
					<p className="text-caption text-text-muted mt-0.5">
						{CATEGORY_LABELS[ticket.category]} · {formatDate(ticket.createdAt)}
					</p>
				</div>
				<ChevronRightIcon />
			</div>
		</button>
	)
}

function TicketRowSkeleton() {
	return (
		<div className="px-5 py-4 border-b border-border-default last:border-b-0 animate-pulse">
			<div className="flex items-center gap-2 mb-2">
				<div className="h-3 w-28 bg-surface-card-muted rounded" />
				<div className="h-4 w-16 bg-surface-card-muted rounded-full" />
			</div>
			<div className="h-4 w-2/3 bg-surface-card-muted rounded mb-1.5" />
			<div className="h-3 w-1/3 bg-surface-card-muted rounded" />
		</div>
	)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SupportPage() {
	const [tickets, setTickets] = useState<SupportTicket[]>([])
	const [loading, setLoading] = useState(true)
	const [tab, setTab] = useState<Tab>("active")
	const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
	const [createOpen, setCreateOpen] = useState(false)

	const fetchTickets = useCallback(async () => {
		setLoading(true)
		try {
			const result = await listMyTickets({ limit: 100 })
			setTickets(result.items)
		} catch {
			// show empty state
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => { fetchTickets() }, [fetchTickets])

	const visible = filterTickets(tickets, tab)
	const activeCount = tickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length

	function handleCreated(ticket: SupportTicket) {
		setTickets((prev) => [ticket, ...prev])
	}

	return (
		<main className="flex-1 py-6 md:py-8 pb-16">
			<div className="max-w-384 mx-auto px-(--space-page-x-mobile) md:px-(--space-page-x-tablet) lg:px-(--space-page-x-desktop)">
				{/* Page header */}
				<div className="flex items-start justify-between gap-4 mb-6">
					<div>
						<h1 className="text-heading-md font-extrabold text-text-primary">Support Tickets</h1>
						<p className="text-body-sm text-text-secondary mt-1">
							Track your support requests and view resolutions.
						</p>
					</div>
					<Button
						variant="primary"
						size="md"
						radius="pill"
						className="shrink-0"
						onClick={() => setCreateOpen(true)}
					>
						+ New Ticket
					</Button>
				</div>

				{/* Tabs */}
				<div className="flex items-center gap-0 border-b border-border-default mb-4">
					{TABS.map((t) => (
						<button
							key={t.value}
							type="button"
							onClick={() => setTab(t.value)}
							className={clsx(
								"relative px-4 py-2.5 text-label-md transition-colors",
								tab === t.value
									? "text-text-primary"
									: "text-text-secondary hover:text-text-primary",
							)}
						>
							{t.label}
							{t.value === "active" && activeCount > 0 && (
								<span className="ml-1.5 inline-flex items-center justify-center size-4 rounded-full bg-action-primary text-white text-[10px] font-bold">
									{activeCount}
								</span>
							)}
							{tab === t.value && (
								<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-text-brand rounded-full" />
							)}
						</button>
					))}
				</div>

				{/* Ticket list */}
				<div className="rounded-panel border border-border-default bg-surface-card overflow-hidden">
					{loading ? (
						<>
							<TicketRowSkeleton />
							<TicketRowSkeleton />
							<TicketRowSkeleton />
						</>
					) : visible.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-16 text-center px-6">
							<div className="size-14 rounded-full bg-surface-card-muted flex items-center justify-center mb-3">
								<TicketEmptyIcon />
							</div>
							<p className="text-body-sm font-semibold text-text-secondary">
								{tab === "active" ? "No active tickets" : tab === "resolved" ? "No resolved tickets" : "No support tickets yet"}
							</p>
							<p className="text-caption text-text-muted mt-1 max-w-xs">
								{tab === "active"
									? "All good! Create a new ticket if you need any help."
									: tab === "resolved"
									? "Resolved and closed tickets will appear here."
									: "Create a ticket and our team will get back to you within 24 hours."}
							</p>
							{tab === "all" && (
								<Button
									variant="secondary"
									size="sm"
									radius="pill"
									className="mt-4"
									onClick={() => setCreateOpen(true)}
								>
									Create Ticket
								</Button>
							)}
						</div>
					) : (
						visible.map((ticket) => (
							<TicketRow
								key={ticket.id}
								ticket={ticket}
								onClick={() => setSelectedTicket(ticket)}
							/>
						))
					)}
				</div>
			</div>

			<SupportTicketModal
				open={createOpen}
				onClose={() => setCreateOpen(false)}
			/>

			<TicketDetailModal
				ticket={selectedTicket}
				onClose={() => setSelectedTicket(null)}
			/>
		</main>
	)
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronRightIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="text-text-muted shrink-0 mt-0.5">
			<path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

function TicketEmptyIcon() {
	return (
		<svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden className="text-text-muted">
			<path d="M18.5 3H9.5A2.5 2.5 0 007 5.5v17A2.5 2.5 0 009.5 25h9A2.5 2.5 0 0021 22.5v-17A2.5 2.5 0 0018.5 3z" stroke="currentColor" strokeWidth="1.5" />
			<path d="M10.5 9.5h7M10.5 13.5h7M10.5 17.5h4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
		</svg>
	)
}
