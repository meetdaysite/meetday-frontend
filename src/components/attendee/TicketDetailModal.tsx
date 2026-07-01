"use client"

import { useEffect } from "react"
import { Icon } from "@/components/ui/Icon"
import CloseSvg from "@/icons/outlined/close.svg"
import { CATEGORY_LABELS, type SupportTicket, type SupportTicketStatus } from "@/lib/supportApi"
import clsx from "clsx"

const STATUS_CONFIG: Record<SupportTicketStatus, { label: string; className: string }> = {
	OPEN: { label: "Open", className: "bg-surface-info-soft text-text-info border-blue-200" },
	IN_PROGRESS: { label: "In Progress", className: "bg-surface-warning-soft text-text-warning border-yellow-200" },
	RESOLVED: { label: "Resolved", className: "bg-surface-success-soft text-text-success border-green-200" },
	CLOSED: { label: "Closed", className: "bg-surface-card-muted text-text-muted border-border-default" },
}

function StatusBadge({ status }: { status: SupportTicketStatus }) {
	const { label, className } = STATUS_CONFIG[status]
	return (
		<span className={clsx("inline-flex items-center px-2 py-0.5 rounded-avatar text-caption font-semibold border", className)}>
			{label}
		</span>
	)
}

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

interface TicketDetailModalProps {
	ticket: SupportTicket | null
	onClose: () => void
}

export function TicketDetailModal({ ticket, onClose }: TicketDetailModalProps) {
	useEffect(() => {
		if (ticket) {
			document.body.style.overflow = "hidden"
		}
		return () => { document.body.style.overflow = "" }
	}, [ticket])

	if (!ticket) return null

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
			onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
		>
			<div className="bg-surface-card rounded-panel border border-border-default shadow-floating w-full max-w-lg flex flex-col max-h-[85vh]">
				{/* Header */}
				<div className="flex items-start gap-3 px-6 pt-6 pb-4 border-b border-border-default shrink-0">
					<div className="flex-1 min-w-0">
						<p className="text-caption font-mono text-text-muted mb-0.5">{ticket.ticketNumber}</p>
						<h2 className="text-body-md font-extrabold text-text-primary leading-snug">
							{ticket.subject}
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="flex items-center justify-center size-8 rounded-full bg-surface-hover hover:bg-surface-page border border-border-default transition-colors shrink-0 mt-0.5"
					>
						<Icon as={CloseSvg} size="sm" color="secondary" />
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
					{/* Meta badges */}
					<div className="flex flex-wrap items-center gap-2">
						<StatusBadge status={ticket.status} />
						<span className="inline-flex items-center px-2 py-0.5 rounded-avatar text-caption font-semibold border border-border-default bg-surface-page text-text-secondary">
							{CATEGORY_LABELS[ticket.category]}
						</span>
						<span className="text-caption text-text-muted">{formatDate(ticket.createdAt)}</span>
					</div>

					{/* Message body */}
					<div>
						<p className="text-label-sm font-semibold text-text-secondary mb-2">Your Message</p>
						<p className="text-body-sm text-text-primary whitespace-pre-wrap leading-relaxed">
							{ticket.body}
						</p>
					</div>

					{/* In Progress */}
					{ticket.status === "IN_PROGRESS" && (
						<div className="rounded-action bg-surface-warning-soft border border-yellow-200 px-4 py-3">
							<p className="text-label-sm font-semibold text-text-warning">Being Reviewed</p>
							<p className="text-caption text-text-secondary mt-0.5">
								Our support team is looking into this. We&apos;ll update you shortly.
							</p>
						</div>
					)}

					{/* Resolution */}
					{ticket.status === "RESOLVED" && ticket.resolution && (
						<div className="rounded-action bg-surface-success-soft border border-green-200 px-4 py-4">
							<p className="text-label-sm font-semibold text-text-success mb-2">Resolution</p>
							<p className="text-body-sm text-text-primary whitespace-pre-wrap leading-relaxed">
								{ticket.resolution}
							</p>
							{ticket.resolvedAt && (
								<p className="text-caption text-text-muted mt-3">
									Resolved on {formatDate(ticket.resolvedAt)}
								</p>
							)}
						</div>
					)}

					{/* Closed */}
					{ticket.status === "CLOSED" && (
						<div className="rounded-action bg-surface-card-muted border border-border-default px-4 py-3">
							<p className="text-label-sm font-semibold text-text-secondary">Ticket Closed</p>
							<p className="text-caption text-text-muted mt-0.5">
								This ticket has been closed and requires no further action.
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
