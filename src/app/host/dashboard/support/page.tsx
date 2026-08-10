"use client"

import { useEffect, useState } from "react"
import clsx from "clsx"
import { toast } from "@/lib/toast"
import { TicketDetailModal } from "@/components/attendee/TicketDetailModal"
import {
	listMyTickets,
	createSupportTicket,
	CATEGORY_LABELS,
	type SupportTicket,
	type SupportTicketStatus,
	type SupportCategory,
} from "@/lib/supportApi"

// ─── Constants ────────────────────────────────────────────────────────────────

type Tab = "active" | "resolved" | "all"

const TABS: { value: Tab; label: string }[] = [
	{ value: "active", label: "Active" },
	{ value: "resolved", label: "Resolved" },
	{ value: "all", label: "All" },
]

const STATUS_CONFIG: Record<SupportTicketStatus, { label: string; className: string }> = {
	OPEN: { label: "Open", className: "bg-blue-100 text-blue-800 border-black" },
	IN_PROGRESS: { label: "In Progress", className: "bg-amber-100 text-amber-800 border-black" },
	RESOLVED: { label: "Resolved", className: "bg-green-100 text-green-800 border-black" },
	CLOSED: { label: "Closed", className: "bg-gray-100 text-gray-800 border-black" },
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
		<span className={clsx("inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border-2", className)}>
			{label}
		</span>
	)
}

function TicketRow({ ticket, onClick }: { ticket: SupportTicket; onClick: () => void }) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="w-full text-left px-5 py-4 border-b-2 border-dashed border-black/10 last:border-b-0 hover:bg-black/[0.01] transition-colors"
		>
			<div className="flex items-start justify-between gap-4">
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2 mb-1.5">
						<span className="text-xs font-mono font-black text-black/45 shrink-0">{ticket.ticketNumber}</span>
						<StatusBadge status={ticket.status} />
					</div>
					<p className="text-sm font-bold text-black truncate">{ticket.subject}</p>
					<p className="text-[11px] font-semibold text-black/50 mt-0.5">
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
		<div className="px-5 py-4 border-b-2 border-dashed border-black/10 last:border-b-0 animate-pulse">
			<div className="flex items-center gap-2 mb-2.5">
				<div className="h-3 w-24 bg-black/5 rounded" />
				<div className="h-4 w-14 bg-black/5 rounded-lg" />
			</div>
			<div className="h-4 w-2/3 bg-black/5 rounded mb-2" />
			<div className="h-3 w-1/3 bg-black/5 rounded" />
		</div>
	)
}

function SupportTicketForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: (ticket: SupportTicket) => void }) {
	const [subject, setSubject] = useState("")
	const [body, setBody] = useState("")
	const [category, setCategory] = useState<SupportCategory>("EVENT_ISSUE")
	const [submitting, setSubmitting] = useState(false)

	const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS) as [SupportCategory, string][]

	const isValid = subject.trim().length > 0 && body.trim().length > 0

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!isValid || submitting) return
		setSubmitting(true)
		try {
			const newTicket = await createSupportTicket({
				subject: subject.trim(),
				body: body.trim(),
				category,
			})
			toast.success("Support ticket submitted. We'll get back to you shortly.")
			onSuccess(newTicket)
		} catch (err: any) {
			const errMsg = err?.message || err?.response?.data?.message || "Failed to submit support ticket."
			toast.error(errMsg)
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-5">
			<div className="flex flex-col gap-1.5">
				<label className="text-xs font-bold text-black">Category *</label>
				<select
					value={category}
					onChange={(e) => setCategory(e.target.value as SupportCategory)}
					disabled={submitting}
					className="h-10 px-3 rounded-xl border-2 border-black bg-white text-black outline-none text-sm transition-colors w-full"
				>
					{CATEGORY_OPTIONS.map(([value, label]) => (
						<option key={value} value={value}>{label}</option>
					))}
				</select>
			</div>

			<div className="flex flex-col gap-1.5">
				<label className="text-xs font-bold text-black">Subject *</label>
				<input
					type="text"
					required
					placeholder="Briefly describe your issue"
					value={subject}
					onChange={(e) => setSubject(e.target.value)}
					disabled={submitting}
					maxLength={150}
					className="h-10 px-4 rounded-xl border-2 border-black bg-white text-black outline-none text-sm transition-colors w-full"
				/>
			</div>

			<div className="flex flex-col gap-1.5">
				<div className="flex items-center justify-between">
					<label className="text-xs font-bold text-black">Message *</label>
					<span className="text-[10px] text-black/40">{body.length}/2000</span>
				</div>
				<textarea
					required
					placeholder="Describe your issue in detail…"
					value={body}
					onChange={(e) => setBody(e.target.value)}
					disabled={submitting}
					rows={6}
					maxLength={2000}
					className="p-3 rounded-xl border-2 border-black bg-white text-black outline-none text-sm transition-colors resize-none w-full"
				/>
			</div>

			<div className="flex gap-3 pt-2">
				<button
					type="submit"
					disabled={!isValid || submitting}
					className="flex-1 py-2.5 bg-[#EE2C2C] text-white border-[3px] border-black rounded-2xl font-bold text-xs tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:pointer-events-none"
				>
					{submitting ? "SUBMITTING…" : "SUBMIT TICKET"}
				</button>
				<button
					type="button"
					onClick={onClose}
					disabled={submitting}
					className="flex-1 py-2.5 bg-white text-black border-[3px] border-black rounded-2xl font-bold text-xs tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
				>
					CANCEL
				</button>
			</div>
		</form>
	)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardSupportPage() {
	const [tickets, setTickets] = useState<SupportTicket[]>([])
	const [loading, setLoading] = useState(true)
	const [tab, setTab] = useState<Tab>("active")
	const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
	const [createOpen, setCreateOpen] = useState(false)

	useEffect(() => {
		let cancelled = false
		async function load() {
			try {
				const result = await listMyTickets({ limit: 100 })
				if (!cancelled) setTickets(result.items)
			} catch {
				// show empty state
			} finally {
				if (!cancelled) setLoading(false)
			}
		}
		load()
		return () => {
			cancelled = true
		}
	}, [])

	const visible = filterTickets(tickets, tab)
	const activeCount = tickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length

	return (
		<div className="flex flex-col min-h-screen bg-white">
			{/* Top Nav / Subheader */}
			<div className="flex justify-between items-center px-8 py-4 border-b border-black/10 shrink-0">
				<p className="text-sm font-semibold text-black/50 mx-auto">
					Welcome to <span className="text-[#EE2C2C] font-bold">Meetday</span>
				</p>
			</div>

			<div className={clsx(
				"flex-1 min-h-0 w-full overflow-hidden relative",
				createOpen ? "md:grid md:grid-cols-[65%_35%]" : "flex"
			)}>
				<div className={clsx(
					"px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col gap-6 overflow-y-auto h-full",
					createOpen ? "max-w-none w-full" : "max-w-3xl w-full mx-auto"
				)}>
					{/* Page header */}
					<div className="flex items-start justify-between gap-4">
						<div>
							<h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-black leading-tight">Support Tickets</h1>
							<p className="text-sm font-semibold text-black/50 mt-1.5">
								Track your support requests and view resolutions.
							</p>
						</div>
						{!createOpen && (
							<button
								type="button"
								onClick={() => setCreateOpen(true)}
								className="bg-[#EE2C2C] text-white text-xs font-black px-4.5 py-2.5 border-[3px] border-black rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all shrink-0"
							>
								+ NEW TICKET
							</button>
						)}
					</div>

					{/* Tabs */}
					<div className="flex gap-2">
						{TABS.map((t) => {
							const active = tab === t.value
							return (
								<button
									key={t.value}
									type="button"
									onClick={() => setTab(t.value)}
									className={clsx(
										"px-4 py-2 border-2 border-black rounded-xl font-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all flex items-center gap-1.5",
										active ? "bg-[#FFC940] text-black" : "bg-white text-black hover:bg-black/5"
									)}
								>
									{t.label}
									{t.value === "active" && activeCount > 0 && (
										<span className="bg-[#EE2C2C] text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
											{activeCount}
										</span>
									)}
								</button>
							)
						})}
					</div>

					{/* Ticket list */}
					<div className="w-full bg-white border-[3px] border-black rounded-[28px] p-3.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
						<div className="bg-white border-2 border-dashed border-black/40 rounded-[20px] overflow-hidden">
							{loading ? (
								<>
									<TicketRowSkeleton />
									<TicketRowSkeleton />
									<TicketRowSkeleton />
								</>
							) : visible.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-16 text-center px-6">
									<div className="size-14 rounded-2xl border-[3px] border-black bg-[#FFEAA7] flex items-center justify-center mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black shrink-0">
										<TicketEmptyIcon />
									</div>
									<p className="text-base font-heading font-black text-black">
										{tab === "active" ? "No active tickets" : tab === "resolved" ? "No resolved tickets" : "No support tickets yet"}
									</p>
									<p className="text-xs font-semibold text-black/50 mt-1 max-w-xs leading-relaxed">
										{tab === "active"
											? "All good! Create a new ticket if you need any help."
											: tab === "resolved"
											? "Resolved and closed tickets will appear here."
											: "Create a ticket and our team will get back to you within 24 hours."}
									</p>
									{tab === "all" && (
										<button
											type="button"
											className="mt-4 bg-[#FFC940] text-black border-[3px] border-black rounded-2xl font-bold text-center text-xs px-4 py-2 tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all block"
											onClick={() => setCreateOpen(true)}
										>
											Create Ticket
										</button>
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
				</div>

				{/* Right Column Drawer / Mobile drawer */}
				{createOpen && (
					<>
						{/* Mobile/Tablet Backdrop Blur */}
						<div
							onClick={() => setCreateOpen(false)}
							className="md:hidden fixed inset-0 bg-black/45 z-40 backdrop-blur-xs"
						/>

						{/* Responsive drawer container */}
						<div className={clsx(
							"bg-white h-full flex flex-col z-50 transition-all duration-300 animate-in slide-in-from-right shrink-0",
							"fixed inset-y-0 right-0 w-full sm:w-[420px] border-l-4 border-black shadow-modal overflow-y-auto p-6",
							"md:static md:border-l-0 md:border-l md:border-black/10 md:shadow-none md:w-full"
						)}>
							<div className="flex justify-between items-center mb-6 shrink-0">
								<h2 className="text-xl font-heading font-black text-black">Contact Support</h2>
								<button
									type="button"
									onClick={() => setCreateOpen(false)}
									className="text-black/60 hover:text-black font-extrabold text-sm"
								>
									✕
								</button>
							</div>

							<SupportTicketForm
								onClose={() => setCreateOpen(false)}
								onSuccess={(newTicket) => {
									setTickets((prev) => [newTicket, ...prev])
									setCreateOpen(false)
								}}
							/>
						</div>
					</>
				)}
			</div>

			<TicketDetailModal
				ticket={selectedTicket}
				onClose={() => setSelectedTicket(null)}
			/>
		</div>
	)
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronRightIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="text-black/40 shrink-0 mt-1">
			<path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

function TicketEmptyIcon() {
	return (
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden className="text-black">
			<path d="M16.5 3H7.5A2 2 0 005.5 5v14A2 2 0 007.5 21h9A2 2 0 0018.5 19V5A2 2 0 0016.5 3z" stroke="currentColor" strokeWidth="2.2" />
			<path d="M9 8.5h6M9 12h6M9 15.5h4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
		</svg>
	)
}
