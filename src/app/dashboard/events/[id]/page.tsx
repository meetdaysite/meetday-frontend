"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import clsx from "clsx"
import { MOCK_EVENTS, type EventStatus, type MockEvent } from "@/lib/mock-events"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import ArrowLeftSvg from "@/icons/outlined/arrow-left.svg"
import DangerTriangleSvg from "@/icons/outlined/danger-triangle.svg"
import UsersGroupSvg from "@/icons/outlined/users-group.svg"
import UsersGroup2Svg from "@/icons/outlined/users-group-2.svg"
import DollarSvg from "@/icons/outlined/dollar.svg"
import CheckCircleSvg from "@/icons/outlined/check-circle.svg"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import MapPointRotateSvg from "@/icons/outlined/map-point-rotate.svg"
import PlaneSvg from "@/icons/outlined/plane.svg"
import PenSvg from "@/icons/outlined/pen.svg"
import CloseCircleSvg from "@/icons/outlined/close-circle.svg"

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<EventStatus, { label: string; badge: string }> = {
	draft:          { label: "Draft",        badge: "bg-neutral-100/95 text-neutral-700 backdrop-blur-sm shadow-sm" },
	"under-review": { label: "Under Review", badge: "bg-blue-50/95 text-blue-700 backdrop-blur-sm shadow-sm" },
	rejected:       { label: "Rejected",     badge: "bg-red-50/95 text-red-700 backdrop-blur-sm shadow-sm" },
	published:      { label: "Published",    badge: "bg-green-50/95 text-green-700 backdrop-blur-sm shadow-sm" },
	cancelled:      { label: "Cancelled",    badge: "bg-orange-50/95 text-orange-700 backdrop-blur-sm shadow-sm" },
	completed:      { label: "Completed",    badge: "bg-neutral-900/90 text-white backdrop-blur-sm shadow-sm" },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRevenue(amount: number, status: EventStatus): string {
	if (amount === 0 || status === "draft" || status === "rejected") return "Free"
	return "$" + amount.toLocaleString()
}

function formatDate(iso: string): string {
	return iso // Already "YYYY-MM-DD"
}

function progressPct(sold: number, capacity: number): number {
	return Math.min(Math.round((sold / capacity) * 100), 100)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventDetailPage() {
	const { id } = useParams<{ id: string }>()
	const event = MOCK_EVENTS.find(e => e.id === id)

	if (!event) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen gap-4">
				<p className="text-heading-sm font-semibold text-text-primary">Event not found</p>
				<Link href="/dashboard/events" className="text-label-sm text-text-brand hover:underline">
					← Back to My Events
				</Link>
			</div>
		)
	}

	const cfg = STATUS_CONFIG[event.status]

	return (
		<div className="flex flex-col min-h-screen">
			<DashboardTopBar />

			{/* Scrollable content */}
			<div className="flex-1 overflow-y-auto bg-surface-page">
				<div className="px-4 sm:px-6 lg:px-8 py-6">
					{/* Back link */}
					<Link
						href="/dashboard/events"
						className="inline-flex items-center gap-1.5 text-label-sm text-text-secondary hover:text-text-primary transition-colors mb-5"
					>
						<ArrowLeftIcon />
						Back to My Events
					</Link>

					{/* Cover hero */}
					<div className="relative w-full aspect-3/1 min-h-36 rounded-card overflow-hidden mb-5">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={event.cover} alt={event.title} className="w-full h-full object-cover" />
						<div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
						<div className="absolute bottom-4 left-4 sm:bottom-5 sm:left-6 right-4">
							<span className={clsx("inline-block text-caption font-semibold px-2.5 py-1 rounded-badge mb-2", cfg.badge)}>
								{cfg.label}
							</span>
							<h1 className="text-title-md sm:text-heading-sm font-bold text-white leading-tight mb-1">{event.title}</h1>
							<p className="text-body-sm text-white/70">{event.category} &middot; {event.format}</p>
						</div>
					</div>

					{/* Rejection / Cancellation banner */}
					{event.status === "rejected" && event.rejectionReason && (
						<div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-card mb-5">
							<AlertIcon className="text-red-500 shrink-0 mt-0.5" />
							<div>
								<p className="text-label-sm font-semibold text-red-700 mb-0.5">Event Rejected</p>
								<p className="text-body-sm text-red-600">{event.rejectionReason}</p>
							</div>
						</div>
					)}
					{event.status === "cancelled" && event.cancellationReason && (
						<div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-card mb-5">
							<AlertIcon className="text-orange-500 shrink-0 mt-0.5" />
							<div>
								<p className="text-label-sm font-semibold text-orange-700 mb-0.5">Cancellation Reason</p>
								<p className="text-body-sm text-orange-600">{event.cancellationReason}</p>
							</div>
						</div>
					)}

					{/* Stats row */}
					<div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
						<StatCard
							icon={<PeopleStatIcon />}
							label="Registrations"
							value={`${event.registrations} / ${event.capacity}`}
						/>
						<StatCard
							icon={<DollarIcon />}
							label="Revenue"
							value={formatRevenue(event.revenue, event.status)}
						/>
						<StatCard
							icon={<CheckInIcon />}
							label="Checked In"
							value={
								event.checkedIn !== null && event.checkedInCapacity !== null
									? `${event.checkedIn} / ${event.checkedInCapacity}`
									: "—"
							}
						/>
					</div>

					{/* Two-column layout */}
					<div className="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-6">
						{/* ── Left: main content ─────────────────── */}
						<div className="flex flex-col gap-6">
							{/* About */}
							<Section title="About">
								<p className="text-body-sm text-text-secondary leading-relaxed">{event.description}</p>
							</Section>

							{/* Date & Location */}
							<Section title="Date & Location">
								<div className="flex flex-col gap-3">
									<div className="flex items-start gap-3">
										<CalendarIcon className="mt-0.5 shrink-0 text-text-brand" />
										<div>
											<p className="text-label-sm font-medium text-text-primary">{formatDate(event.date)}</p>
											<p className="text-caption text-text-muted">{event.time}</p>
										</div>
									</div>
									<div className="flex items-start gap-3">
										<LocationIcon className="mt-0.5 shrink-0 text-text-brand" />
										<div>
											<p className="text-label-sm font-medium text-text-primary">{event.venue}</p>
											<p className="text-caption text-text-muted">{event.address}</p>
										</div>
									</div>
								</div>
							</Section>

							{/* Ticket Types */}
							<Section title="Ticket Types">
								<div className="flex flex-col gap-4">
									{event.ticketTypes.map(ticket => {
										const pct = progressPct(ticket.sold, ticket.capacity)
										const remaining = ticket.capacity - ticket.sold
										return (
											<div key={ticket.name}>
												<div className="flex items-center justify-between mb-1">
													<span className="text-label-sm font-medium text-text-primary">{ticket.name}</span>
													<span className="text-label-sm font-semibold text-text-primary">
														{ticket.price === 0 ? "Free" : `$${ticket.price}`}
													</span>
												</div>
												<div className="flex items-center justify-between mb-1.5">
													<span className="text-caption text-text-muted">{ticket.sold} sold</span>
													<span className="text-caption text-text-muted">{remaining} remaining</span>
												</div>
												<div className="h-1.5 bg-surface-card-muted rounded-full overflow-hidden">
													<div
														className={clsx(
															"h-full rounded-full transition-all",
															pct >= 90 ? "bg-red-500" : "bg-action-primary",
														)}
														style={{ width: `${pct}%` }}
													/>
												</div>
											</div>
										)
									})}
								</div>
							</Section>
						</div>

						{/* ── Right: sidebar ─────────────────────── */}
						<div className="flex flex-col gap-4">
							{/* Actions panel */}
							<div className="bg-surface-card border border-border-subtle rounded-card p-5">
								<p className="text-label-sm font-semibold text-text-primary mb-4">Actions</p>
								<EventActions event={event} />
							</div>

							{/* Details panel */}
							<div className="bg-surface-card border border-border-subtle rounded-card p-5">
								<p className="text-label-sm font-semibold text-text-primary mb-4">Details</p>
								<div className="flex flex-col gap-3">
									<DetailRow label="Visibility" value={event.visibility} />
									<DetailRow label="Language" value={event.language} />
									<DetailRow label="Age" value={event.age} />
									<DetailRow label="Refund Policy" value={event.refundPolicy} />
									<div className="flex items-start justify-between gap-3">
										<span className="text-caption text-text-muted shrink-0">Tags</span>
										<div className="flex flex-wrap justify-end gap-1">
											{event.tags.map(tag => (
												<span key={tag} className="text-caption px-2 py-0.5 bg-surface-card-muted text-text-secondary rounded-badge">
													{tag}
												</span>
											))}
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
	return (
		<div className="bg-surface-card border border-border-subtle rounded-card p-3 sm:p-4 flex flex-col gap-1.5">
			<div className="flex items-center gap-1.5 text-text-muted">
				{icon}
				<span className="text-caption text-text-secondary truncate">{label}</span>
			</div>
			<p className="text-label-md sm:text-title-md font-bold text-text-primary">{value}</p>
		</div>
	)
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="bg-surface-card border border-border-subtle rounded-card p-5">
			<h2 className="text-label-md font-semibold text-text-primary mb-4">{title}</h2>
			{children}
		</div>
	)
}

function DetailRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-start justify-between gap-3">
			<span className="text-caption text-text-muted shrink-0">{label}</span>
			<span className="text-caption text-text-secondary text-right">{value}</span>
		</div>
	)
}

// ─── Status-driven actions ────────────────────────────────────────────────────

function EventActions({ event }: { event: MockEvent }) {
	switch (event.status) {
		case "draft":
			return (
				<div className="flex flex-col gap-2">
					<ActionButton variant="primary" icon={<SendIcon />}>Submit for Review</ActionButton>
					<ActionButton variant="secondary" icon={<PenIcon />}>Edit Event</ActionButton>
				</div>
			)

		case "under-review":
			return (
				<p className="text-body-sm text-text-muted">
					Your event is currently under review. We&apos;ll notify you once it&apos;s approved or if changes are needed.
				</p>
			)

		case "rejected":
			return (
				<div className="flex flex-col gap-2">
					<ActionButton variant="primary" icon={<SendIcon />}>Submit for Review</ActionButton>
					<ActionButton variant="secondary" icon={<PenIcon />}>Edit Event</ActionButton>
				</div>
			)

		case "published":
			return (
				<div className="flex flex-col gap-2">
					<ActionButton variant="secondary" icon={<PenIcon />}>
						Edit Event
						<span className="text-caption text-text-muted font-normal ml-1">(triggers re-review)</span>
					</ActionButton>
					<Link
						href="/dashboard/registrations"
						className="flex items-center justify-center gap-2 h-(--size-action-md) px-4 text-label-sm font-medium border border-action-secondary-border rounded-action bg-action-secondary text-action-secondary-text hover:bg-action-secondary-hover transition-colors"
					>
						<PeopleActionIcon />
						View Registrations
					</Link>
					<ActionButton variant="danger" icon={<CancelIcon />}>Cancel Event</ActionButton>
				</div>
			)

		case "cancelled":
			return (
				<p className="text-body-sm text-text-muted">
					This event is cancelled. No further actions available.
				</p>
			)

		case "completed":
			return (
				<div className="flex flex-col gap-2">
					<Link
						href="/dashboard/registrations"
						className="flex items-center justify-center gap-2 h-(--size-action-md) px-4 text-label-sm font-medium border border-action-secondary-border rounded-action bg-action-secondary text-action-secondary-text hover:bg-action-secondary-hover transition-colors"
					>
						<PeopleActionIcon />
						View Registrations
					</Link>
					<p className="text-caption text-text-muted text-center pt-1">
						This event is completed. No further actions available.
					</p>
				</div>
			)
	}
}

function ActionButton({
	variant,
	icon,
	children,
	onClick,
}: {
	variant: "primary" | "secondary" | "danger"
	icon?: React.ReactNode
	children: React.ReactNode
	onClick?: () => void
}) {
	return (
		<button
			onClick={onClick}
			className={clsx(
				"flex items-center justify-center gap-2 h-(--size-action-md) px-4 text-label-sm font-semibold rounded-action transition-colors",
				variant === "primary" && "bg-action-primary text-action-primary-text hover:bg-action-primary-hover",
				variant === "secondary" && "border border-action-secondary-border bg-action-secondary text-action-secondary-text hover:bg-action-secondary-hover",
				variant === "danger" && "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100",
			)}
		>
			{icon}
			{children}
		</button>
	)
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function ArrowLeftIcon() { return <ArrowLeftSvg className="size-4" aria-hidden /> }
function AlertIcon({ className }: { className?: string }) { return <DangerTriangleSvg className={clsx("size-4.5", className)} aria-hidden /> }
function PeopleStatIcon() { return <UsersGroupSvg className="size-4" aria-hidden /> }
function DollarIcon() { return <DollarSvg className="size-4" aria-hidden /> }
function CheckInIcon() { return <CheckCircleSvg className="size-4" aria-hidden /> }
function CalendarIcon({ className }: { className?: string }) { return <CalendarSvg className={clsx("size-4.5", className)} aria-hidden /> }
function LocationIcon({ className }: { className?: string }) { return <MapPointRotateSvg className={clsx("size-4.5", className)} aria-hidden /> }
function SendIcon() { return <PlaneSvg className="size-4" aria-hidden /> }
function PenIcon() { return <PenSvg className="size-4" aria-hidden /> }
function PeopleActionIcon() { return <UsersGroup2Svg className="size-4" aria-hidden /> }
function CancelIcon() { return <CloseCircleSvg className="size-4" aria-hidden /> }
