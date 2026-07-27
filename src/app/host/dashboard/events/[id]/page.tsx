"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import clsx from "clsx"
import { toast } from "sonner"
import { useEventStore } from "@/store/eventStore"
import { storageUrl } from "@/lib/uploadMedia"
import { createScannerSession, getCheckInStats, getEventAttendees } from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"
import { formatEventDateRange } from "@/lib/eventForm"
import type { CheckInStats, EventAttendee, EventAttendeesResponse } from "@/lib/api"
import type { Event, ApiEventStatus } from "@/types/event"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import ArrowLeftSvg from "@/icons/outlined/arrow-left.svg"
import DangerTriangleSvg from "@/icons/outlined/danger-triangle.svg"
import UsersGroupSvg from "@/icons/outlined/users-group.svg"
import UserCheckSvg from "@/icons/outlined/user-check.svg"
import CheckCircleSvg from "@/icons/outlined/check-circle.svg"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import MapPointRotateSvg from "@/icons/outlined/map-point-rotate.svg"
import PlaneSvg from "@/icons/outlined/plane.svg"
import PenSvg from "@/icons/outlined/pen.svg"
import CloseCircleSvg from "@/icons/outlined/close-circle.svg"
import { Skeleton } from "@/components/ui/Skeleton"

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ApiEventStatus, { label: string; badge: string }> = {
	DRAFT: { label: "Draft", badge: "bg-neutral-100/95 text-neutral-700 backdrop-blur-sm shadow-sm" },
	UNDER_REVIEW: { label: "Under Review", badge: "bg-blue-50/95 text-blue-700 backdrop-blur-sm shadow-sm" },
	REJECTED: { label: "Rejected", badge: "bg-red-50/95 text-red-700 backdrop-blur-sm shadow-sm" },
	PUBLISHED: { label: "Published", badge: "bg-green-50/95 text-green-700 backdrop-blur-sm shadow-sm" },
	CANCELLED: { label: "Cancelled", badge: "bg-orange-50/95 text-orange-700 backdrop-blur-sm shadow-sm" },
	COMPLETED: { label: "Completed", badge: "bg-neutral-900/90 text-white backdrop-blur-sm shadow-sm" },
}

// ─── Revision field labels ────────────────────────────────────────────────────

const REVISION_FIELD_LABEL: Record<string, string> = {
	categoryId: "Category",
	title: "Title",
	description: "Description",
	eventType: "Event Type",
	languages: "Languages",
	tags: "Tags",
	whatToExpect: "What to Expect",
	whoShouldAttend: "Who Should Attend",
	specialInstructions: "Special Instructions",
	media: "Media",
	venueName: "Venue Name",
	fullAddress: "Full Address",
	city: "City",
	latitude: "Latitude",
	longitude: "Longitude",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso?: string): string {
	if (!iso) return "—"
	const d = new Date(iso)
	if (isNaN(d.getTime())) return iso
	return d.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })
}

function refundLabel(policy?: Event["refundPolicy"]): string {
	if (!policy) return "—"
	if (policy.type === "NO_REFUND") return "No Refund"
	if (policy.type === "FULL") return "Full Refund"
	const pct = policy.refundPercent ? ` (${policy.refundPercent}%)` : ""
	const hours = policy.cutoffHours ? ` up to ${policy.cutoffHours}h before` : ""
	return `Partial Refund${pct}${hours}`
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventDetailPage() {
	const { id } = useParams<{ id: string }>()
	const router = useRouter()
	const {
		currentEvent,
		currentEventLoading,
		currentEventError,
		fetchMyEventDetail,
		submitForReview,
		cancelEvent,
	} = useEventStore()
	const [checkInStats, setCheckInStats] = useState<CheckInStats | null>(null)
	const [attendeesData, setAttendeesData] = useState<EventAttendeesResponse | null>(null)
	const [attendeesPage, setAttendeesPage] = useState(1)

	useEffect(() => {
		fetchMyEventDetail(id)
	}, [id, fetchMyEventDetail])

	useEffect(() => {
		if (!currentEvent) return
		if (currentEvent.status !== "PUBLISHED" && currentEvent.status !== "COMPLETED") return
		getCheckInStats(id)
			.then(setCheckInStats)
			.catch(() => {})
	}, [id, currentEvent])

	useEffect(() => {
		if (!currentEvent) return
		if (currentEvent.status !== "PUBLISHED" && currentEvent.status !== "COMPLETED") return
		getEventAttendees(id, attendeesPage, 20)
			.then(setAttendeesData)
			.catch(() => {})
	}, [id, currentEvent, attendeesPage])

	if (currentEventLoading) return <DetailSkeleton />

	if (currentEventError || !currentEvent) {
		return (
			<div className="flex flex-col min-h-screen">
				<DashboardTopBar />
				<div className="flex flex-col items-center justify-center flex-1 gap-4">
					<p className="text-heading-sm font-semibold text-text-primary">
						{currentEventError ?? "Event not found"}
					</p>
					<Link href="/host/dashboard/events" className="text-label-sm text-text-brand hover:underline">
						← Back to My Events
					</Link>
				</div>
			</div>
		)
	}

	const event = currentEvent
	const cfg = STATUS_CONFIG[event.status]
	const cover = event.media?.find(m => m.type === "COVER")
	const coverUrl = cover ? (cover.url ?? storageUrl(cover.key ?? "")) : ""
	const galleryImages = (event.media?.filter(m => m.type !== "COVER") ?? [])
		.slice()
		.sort((a, b) => a.order - b.order)

	return (
		<div className="flex flex-col min-h-screen">
			<DashboardTopBar />

			<div className="flex-1 overflow-y-auto bg-surface-page">
				<div className="px-4 sm:px-6 lg:px-8 py-6">
					{/* Back link */}
					<Link
						href="/host/dashboard/events"
						className="inline-flex items-center gap-1.5 text-label-sm text-text-secondary hover:text-text-primary transition-colors mb-5"
					>
						<ArrowLeftIcon />
						Back to My Events
					</Link>

					{/* Cover hero */}
					<div className="relative w-full aspect-3/1 min-h-36 rounded-action overflow-hidden mb-5 bg-surface-card-muted">
						{coverUrl ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img
								src={coverUrl}
								alt={event.title ?? ""}
								className="w-full h-full object-cover"
								loading="eager"
								fetchPriority="high"
							/>
						) : (
							<div className="w-full h-full bg-linear-to-br from-surface-card-muted to-border-default" />
						)}
						<div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
						<div className="absolute bottom-4 left-4 sm:bottom-5 sm:left-6 right-4">
							<span
								className={clsx(
									"inline-block text-caption font-semibold px-2.5 py-1 rounded-badge mb-2",
									cfg.badge,
								)}
							>
								{cfg.label}
							</span>
							<h1 className="text-title-md sm:text-heading-sm font-bold text-white leading-tight mb-1">
								{event.title ?? "Untitled Event"}
							</h1>
							<p className="text-body-sm text-white/70">{event.eventType ?? "—"}</p>
						</div>
					</div>

					{/* Rejection banner */}
					{event.status === "REJECTED" && event.rejectionReason && (
						<div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-action mb-5">
							<AlertIcon className="text-red-500 shrink-0 mt-0.5" />
							<div>
								<p className="text-label-sm font-semibold text-red-700 mb-0.5">
									Event Rejected
								</p>
								<p className="text-body-sm text-red-600">{event.rejectionReason}</p>
							</div>
						</div>
					)}

					{/* Cancellation banner */}
					{event.status === "CANCELLED" && event.cancellationReason && (
						<div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-action mb-5">
							<AlertIcon className="text-orange-500 shrink-0 mt-0.5" />
							<div>
								<p className="text-label-sm font-semibold text-orange-700 mb-0.5">
									Cancellation Reason
								</p>
								<p className="text-body-sm text-orange-600">{event.cancellationReason}</p>
							</div>
						</div>
					)}

					{/* Pending revision banner */}
					{event.pendingRevision && (
						<div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-action mb-5">
							<AlertIcon className="text-blue-500 shrink-0 mt-0.5" />
							<div>
								<p className="text-label-sm font-semibold text-blue-700 mb-0.5">
									Edits awaiting review
								</p>
								<p className="text-body-sm text-blue-600 mb-2">
									Submitted on {formatDate(event.pendingRevision.createdAt)}. This event is still
									showing its currently published version — your changes go live once an admin
									approves them.
								</p>
								{Object.keys(event.pendingRevision.changes).length > 0 && (
									<div className="flex flex-wrap gap-1.5">
										{Object.keys(event.pendingRevision.changes).map((field) => (
											<span
												key={field}
												className="text-caption text-blue-700 bg-blue-100 px-2 py-0.5 rounded-badge"
											>
												{REVISION_FIELD_LABEL[field] ?? field}
											</span>
										))}
									</div>
								)}
							</div>
						</div>
					)}

					{/* Two-column layout */}
					<div className="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-6">
						{/* Left — main content */}
						<div className="flex flex-col gap-6">
							{/* About */}
							<Section title="About">
								<p className="text-body-sm text-text-secondary leading-relaxed">
									{event.description ?? "No description provided."}
								</p>
							</Section>

							{/* Gallery */}
							{galleryImages.length > 0 && (
								<Section title="Gallery">
									<div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
										{galleryImages.map((item, i) => {
											const url = item.url ?? storageUrl(item.key ?? "")
											return item.type === "VIDEO" ? (
												<video
													key={item.id ?? i}
													src={url}
													controls
													preload="none"
													className="w-full aspect-video rounded-action bg-surface-card-muted"
												/>
											) : (
												// eslint-disable-next-line @next/next/no-img-element
												<img
													key={item.id ?? i}
													src={url}
													alt={`Gallery ${i + 1}`}
													className="w-full aspect-video object-cover rounded-action bg-surface-card-muted"
													loading="lazy"
												/>
											)
										})}
									</div>
								</Section>
							)}

							{/* Experience Details */}
							{event.whatToExpect?.length || event.whoShouldAttend?.length ? (
								<Section title="Experience Details">
									{event.whatToExpect && event.whatToExpect.length > 0 && (
										<div className="mb-4">
											<p className="text-label-sm font-semibold text-text-primary mb-2">
												What to Expect
											</p>
											<ul className="flex flex-col gap-1.5">
												{event.whatToExpect.map(item => (
													<li
														key={item}
														className="flex items-start gap-2 text-body-sm text-text-secondary"
													>
														<span className="mt-1.5 size-1.5 rounded-full bg-text-brand shrink-0" />
														{item}
													</li>
												))}
											</ul>
										</div>
									)}
									{event.whoShouldAttend && event.whoShouldAttend.length > 0 && (
										<div>
											<p className="text-label-sm font-semibold text-text-primary mb-2">
												Who Should Attend
											</p>
											<ul className="flex flex-col gap-1.5">
												{event.whoShouldAttend.map(item => (
													<li
														key={item}
														className="flex items-start gap-2 text-body-sm text-text-secondary"
													>
														<span className="mt-1.5 size-1.5 rounded-full bg-text-brand shrink-0" />
														{item}
													</li>
												))}
											</ul>
										</div>
									)}
								</Section>
							) : null}

							{/* Attendees */}
							{(event.status === "PUBLISHED" || event.status === "COMPLETED") && (
								<AttendeesSection
									data={attendeesData}
									loading={attendeesData === null}
									page={attendeesPage}
									onPageChange={(p) => {
										setAttendeesData(null)
										setAttendeesPage(p)
									}}
								/>
							)}
						</div>

						{/* Right sidebar */}
						<div className="flex flex-col gap-4">
							{/* Actions */}
							<div className="bg-surface-card border border-border-default rounded-action p-5">
								<p className="text-label-sm font-semibold text-text-primary mb-4">Actions</p>
								<EventActions
									event={event}
									onSubmitForReview={async () => {
										try {
											await submitForReview(event.id)
											toast.success("Submitted for review.")
										} catch (err) {
											toast.error(getApiErrorMessage(err))
										}
									}}
									onEdit={() =>
										router.push(
											event.status === "PUBLISHED"
												? `/host/dashboard/events/${event.id}/revise`
												: `/host/dashboard/events/${event.id}/edit`,
										)
									}
									onCancel={cancelEvent}
								/>
							</div>

							{/* Stats */}
							<div className="grid grid-cols-2 gap-3">
								<StatCard
									icon={<PeopleStatIcon />}
									label="Attendees"
									value={checkInStats ? String(checkInStats.totalAttendees) : "—"}
								/>
								<StatCard
									icon={<CheckInIcon />}
									label="Checked In"
									value={checkInStats ? String(checkInStats.checkedIn) : "—"}
								/>
							</div>

							{/* Date & Location */}
							<div className="bg-surface-card border border-border-default rounded-action p-5 flex flex-col gap-3">
								<p className="text-label-sm font-semibold text-text-primary">
									Date & Location
								</p>
								<div className="flex items-start gap-3">
									<CalendarIcon className="mt-0.5 shrink-0 text-text-brand" />
									<div>
										<p className="text-label-sm font-medium text-text-primary">
											{formatEventDateRange(event.eventDate, event.endDate, "long")}
										</p>
										<p className="text-caption text-text-muted">
											{event.startTime && event.endTime
												? `${event.startTime} – ${event.endTime}`
												: (event.startTime ?? "—")}
										</p>
									</div>
								</div>
								<div className="flex items-start gap-3">
									<LocationIcon className="mt-0.5 shrink-0 text-text-brand" />
									<div>
										<p className="text-label-sm font-medium text-text-primary">
											{event.venueName ?? "—"}
										</p>
										<p className="text-caption text-text-muted">
											{event.fullAddress ?? "—"}
										</p>
										{event.city && (
											<p className="text-caption text-text-muted">{event.city}</p>
										)}
									</div>
								</div>
							</div>

							{/* Event details */}
							<div className="bg-surface-card border border-border-default rounded-action p-5">
								<p className="text-label-sm font-semibold text-text-primary mb-4">Details</p>
								<div className="flex flex-col gap-3">
									{event.category?.name && (
										<DetailRow label="Category" value={event.category.name} />
									)}
									<DetailRow label="Type" value={event.eventType ?? "—"} />
									<DetailRow label="Visibility" value={event.visibility ?? "—"} />
									<DetailRow label="Age" value={event.ageRestriction ?? "—"} />
									<DetailRow label="Languages" value={event.languages?.join(", ") ?? "—"} />
									<DetailRow label="Refund" value={refundLabel(event.refundPolicy)} />
									{event.tags && event.tags.length > 0 && (
										<div className="flex items-start justify-between gap-3">
											<span className="text-caption text-text-muted shrink-0">
												Tags
											</span>
											<div className="flex flex-wrap justify-end gap-1">
												{event.tags.map(tag => (
													<span
														key={tag}
														className="text-caption px-2 py-0.5 bg-surface-card-muted text-text-secondary rounded-badge"
													>
														{tag}
													</span>
												))}
											</div>
										</div>
									)}
								</div>
							</div>

							{/* Ticket Types */}
							{event.tickets && event.tickets.length > 0 && (
								<div className="bg-surface-card border border-border-default rounded-action p-5">
									<p className="text-label-sm font-semibold text-text-primary mb-4">
										Ticket Types
									</p>
									<div className="flex flex-col gap-4">
										{event.tickets.map(ticket => (
											<div key={ticket.name}>
												<div className="flex items-center justify-between mb-1">
													<span className="text-label-sm font-medium text-text-primary">
														{ticket.name}
													</span>
													<span className="text-label-sm font-semibold text-text-primary">
														{ticket.price === 0 ? "Free" : `₹${ticket.price}`}
													</span>
												</div>
												<div className="flex items-center justify-between mb-1.5">
													<span className="text-caption text-text-muted">
														{ticket.soldCount ?? 0} sold
													</span>
													<span className="text-caption text-text-muted">
														{ticket.totalCapacity} capacity
													</span>
												</div>
												<div className="h-1.5 bg-surface-card-muted rounded-full overflow-hidden">
													<div
														className="h-full bg-action-primary rounded-full"
														style={{
															width:
																ticket.totalCapacity > 0
																	? `${Math.min(100, ((ticket.soldCount ?? 0) / ticket.totalCapacity) * 100)}%`
																	: "0%",
														}}
													/>
												</div>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

// ─── Status-driven actions ────────────────────────────────────────────────────

function EventActions({
	event,
	onSubmitForReview,
	onEdit,
	onCancel,
}: {
	event: Event
	onSubmitForReview: () => Promise<void>
	onEdit: () => void
	onCancel: (id: string, reason: string) => Promise<void>
}) {
	const [submitting, setSubmitting] = useState(false)
	const [showCancelModal, setShowCancelModal] = useState(false)
	const [showAddStaffModal, setShowAddStaffModal] = useState(false)

	async function handleSubmit() {
		setSubmitting(true)
		await onSubmitForReview()
		setSubmitting(false)
	}

	switch (event.status) {
		case "DRAFT":
			return (
				<div className="flex flex-col gap-2">
					<ActionButton
						variant="primary"
						icon={<SendIcon />}
						onClick={handleSubmit}
						loading={submitting}
					>
						Submit for Review
					</ActionButton>
					<ActionButton variant="secondary" icon={<PenIcon />} onClick={onEdit}>
						Edit Event
					</ActionButton>
				</div>
			)

		case "REJECTED":
			return (
				<p className="text-body-sm text-text-muted">
					This event was rejected and can no longer be edited.
				</p>
			)

		case "UNDER_REVIEW":
			return (
				<div className="flex flex-col gap-2">
					<p className="text-[12px] text-text-secondary">
						Your event is currently under review. We&apos;ll notify you once it&apos;s approved or if
						changes are needed.
					</p>
					<ActionButton variant="secondary" icon={<PenIcon />} onClick={onEdit}>
						Edit Event
					</ActionButton>
					<p className="text-caption text-amber-700 bg-amber-50 border border-amber-200 rounded-action px-3 py-2">
						Editing will move this event back to draft — you&apos;ll need to submit it for review again.
					</p>
				</div>
			)

		case "PUBLISHED":
			return (
				<>
					<div className="flex flex-col gap-2">
						<ActionButton variant="secondary" icon={<PenIcon />} onClick={onEdit}>
							Edit Event
						</ActionButton>
						<ActionButton
							variant="secondary"
							icon={<ScannerStaffIcon />}
							onClick={() => setShowAddStaffModal(true)}
						>
							Add Support Staff
						</ActionButton>
						<ActionButton
							variant="danger"
							icon={<CancelIcon />}
							onClick={() => setShowCancelModal(true)}
						>
							Cancel Event
						</ActionButton>
					</div>
					{showAddStaffModal && (
						<AddStaffModal eventId={event.id} onClose={() => setShowAddStaffModal(false)} />
					)}
					{showCancelModal && (
						<CancelModal
							eventId={event.id}
							onCancel={onCancel}
							onClose={() => setShowCancelModal(false)}
						/>
					)}
				</>
			)

		case "CANCELLED":
			return (
				<p className="text-body-sm text-text-muted">
					This event is cancelled. No further actions available.
				</p>
			)

		case "COMPLETED":
			return (
				<div className="flex flex-col gap-2">
					<p className="text-caption text-text-muted text-center pt-1">
						This event is completed. No further actions available.
					</p>
				</div>
			)
	}
}

// ─── Cancel modal ─────────────────────────────────────────────────────────────

function CancelModal({
	eventId,
	onCancel,
	onClose,
}: {
	eventId: string
	onCancel: (id: string, reason: string) => Promise<void>
	onClose: () => void
}) {
	const [reason, setReason] = useState("")
	const [loading, setLoading] = useState(false)
	const inputRef = useRef<HTMLTextAreaElement>(null)

	useEffect(() => {
		inputRef.current?.focus()
	}, [])

	async function handleConfirm() {
		if (!reason.trim()) return
		setLoading(true)
		try {
			await onCancel(eventId, reason.trim())
			toast.success("Event cancelled.")
			onClose()
		} catch (err) {
			toast.error(getApiErrorMessage(err))
			setLoading(false)
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
			<div className="w-full max-w-md bg-surface-card rounded-action shadow-modal p-6 flex flex-col gap-4">
				<div>
					<p className="text-label-md font-semibold text-text-primary mb-1">Cancel this event?</p>
					<p className="text-body-sm text-text-secondary">
						This will cancel a published event and notify all registered attendees. This action
						cannot be undone.
					</p>
				</div>
				<div className="flex flex-col gap-1.5">
					<label className="text-label-sm font-semibold text-text-primary">
						Cancellation reason <span className="text-text-brand">*</span>
					</label>
					<textarea
						ref={inputRef}
						rows={3}
						value={reason}
						onChange={e => setReason(e.target.value)}
						placeholder="e.g. Venue became unavailable due to unforeseen circumstances."
						className="w-full px-4 py-3 rounded-input border border-border-default bg-surface-canvas text-text-primary placeholder:text-text-muted text-sm resize-none focus:outline-none focus:border-border-focused transition-colors"
					/>
				</div>
				<div className="flex items-center justify-end gap-3 pt-1">
					<button
						onClick={onClose}
						disabled={loading}
						className="px-4 py-2.5 text-label-sm text-text-secondary border border-border-default rounded-action hover:bg-surface-card-muted transition-colors disabled:opacity-50"
					>
						Keep Event
					</button>
					<button
						onClick={handleConfirm}
						disabled={!reason.trim() || loading}
						className="flex items-center gap-2 px-4 py-2.5 text-label-sm font-semibold bg-red-600 text-white rounded-action hover:bg-red-700 transition-colors disabled:opacity-50"
					>
						{loading && <MiniSpinner />}
						Confirm Cancel
					</button>
				</div>
			</div>
		</div>
	)
}

// ─── Add staff modal ──────────────────────────────────────────────────────────

function AddStaffModal({ eventId, onClose }: { eventId: string; onClose: () => void }) {
	const [name, setName] = useState("")
	const [email, setEmail] = useState("")
	const [phone, setPhone] = useState("")
	const [label, setLabel] = useState("")
	const [loading, setLoading] = useState(false)
	const nameRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		nameRef.current?.focus()
	}, [])

	const phoneDigits = phone.trim().replace(/[\s-]/g, "")
	const phoneError = phoneDigits.length > 0 && !/^(?:\+?91|0)?[6-9]\d{9}$/.test(phoneDigits)
		? "Enter a valid Indian phone number"
		: null

	async function handleConfirm() {
		if (!name.trim() || !email.trim() || phoneError) return
		setLoading(true)
		try {
			await createScannerSession(eventId, {
				name: name.trim(),
				email: email.trim(),
				...(phoneDigits ? { phone: phoneDigits } : {}),
				...(label.trim() ? { label: label.trim() } : {}),
			})
			toast.success("Support staff added. An invite email has been sent.")
			onClose()
		} catch (err) {
			toast.error(getApiErrorMessage(err))
			setLoading(false)
		}
	}

	const isValid = name.trim().length > 0 && email.trim().length > 0 && !phoneError

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
			<div className="w-full max-w-md bg-surface-card rounded-action shadow-modal p-6 flex flex-col gap-4">
				<div>
					<p className="text-label-md font-semibold text-text-primary mb-1">Add Support Staff</p>
					<p className="text-body-sm text-text-secondary">
						A time-limited scanner link will be emailed to the staff member. No login required.
					</p>
				</div>
				<div className="flex flex-col gap-3">
					<div className="flex flex-col gap-1.5">
						<label className="text-label-sm font-semibold text-text-primary">
							Name <span className="text-text-brand">*</span>
						</label>
						<input
							ref={nameRef}
							type="text"
							value={name}
							onChange={e => setName(e.target.value)}
							placeholder="e.g. Rahul Sharma"
							className="w-full px-4 py-3 rounded-input border border-border-default bg-surface-canvas text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-border-focused transition-colors"
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-label-sm font-semibold text-text-primary">
							Email <span className="text-text-brand">*</span>
						</label>
						<input
							type="email"
							value={email}
							onChange={e => setEmail(e.target.value)}
							placeholder="e.g. rahul@example.com"
							className="w-full px-4 py-3 rounded-input border border-border-default bg-surface-canvas text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-border-focused transition-colors"
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-label-sm font-semibold text-text-primary">Phone</label>
						<input
							type="tel"
							value={phone}
							onChange={e => setPhone(e.target.value)}
							placeholder="e.g. +919876543210"
							className={clsx(
								"w-full px-4 py-3 rounded-input border bg-surface-canvas text-text-primary placeholder:text-text-muted text-sm focus:outline-none transition-colors",
								phoneError
									? "border-red-400 focus:border-red-500"
									: "border-border-default focus:border-border-focused",
							)}
						/>
						{phoneError && <p className="text-caption text-red-600">{phoneError}</p>}
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-label-sm font-semibold text-text-primary">Label</label>
						<input
							type="text"
							value={label}
							onChange={e => setLabel(e.target.value)}
							placeholder="e.g. Gate A"
							className="w-full px-4 py-3 rounded-input border border-border-default bg-surface-canvas text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-border-focused transition-colors"
						/>
					</div>
				</div>
				<div className="flex items-center justify-end gap-3 pt-1">
					<button
						onClick={onClose}
						disabled={loading}
						className="px-4 py-2.5 text-label-sm text-text-secondary border border-border-default rounded-action hover:bg-surface-card-muted transition-colors disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						onClick={handleConfirm}
						disabled={!isValid || loading}
						className="flex items-center gap-2 px-4 py-2.5 text-label-sm font-semibold bg-action-primary text-action-primary-text rounded-action hover:bg-action-primary-hover transition-colors disabled:opacity-50"
					>
						{loading && <MiniSpinner />}
						Send Invite
					</button>
				</div>
			</div>
		</div>
	)
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function DetailSkeleton() {
	return (
		<div className="flex flex-col min-h-screen">
			<DashboardTopBar />
			<div className="flex-1 bg-surface-page px-4 sm:px-6 lg:px-8 py-6">
				<Skeleton.Text className="w-32 mb-5" />
				<Skeleton.Block className="w-full aspect-3/1 min-h-36 mb-5" />
				<div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
					{[0, 1, 2].map(i => (
						<Skeleton.Block key={i} className="h-20" />
					))}
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-6">
					<div className="flex flex-col gap-6">
						{[0, 1].map(i => (
							<Skeleton.Block key={i} className="h-40" />
						))}
					</div>
					<div className="flex flex-col gap-4">
						<Skeleton.Block className="h-48" />
						<Skeleton.Block className="h-40" />
					</div>
				</div>
			</div>
		</div>
	)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
	return (
		<div className="bg-surface-card border border-border-default rounded-action p-3 sm:p-4 flex flex-col gap-1.5">
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
		<div className="bg-surface-card border border-border-default rounded-action p-5">
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

function ActionButton({
	variant,
	icon,
	children,
	onClick,
	loading,
}: {
	variant: "primary" | "secondary" | "danger"
	icon?: React.ReactNode
	children: React.ReactNode
	onClick?: () => void
	loading?: boolean
}) {
	return (
		<button
			onClick={onClick}
			disabled={loading}
			className={clsx(
				"flex items-center justify-center gap-2 h-(--size-action-md) px-4 text-label-sm font-semibold rounded-action transition-colors disabled:opacity-60",
				variant === "primary" &&
					"bg-action-primary text-action-primary-text hover:bg-action-primary-hover",
				variant === "secondary" &&
					"border border-action-secondary-border bg-action-secondary text-action-secondary-text hover:bg-action-secondary-hover",
				variant === "danger" && "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100",
			)}
		>
			{loading ? <MiniSpinner /> : icon}
			{children}
		</button>
	)
}

// ─── Attendees section ────────────────────────────────────────────────────────

function AttendeesSection({
	data,
	loading,
	page,
	onPageChange,
}: {
	data: EventAttendeesResponse | null
	loading: boolean
	page: number
	onPageChange: (p: number) => void
}) {
	const totalPages = data ? Math.ceil(data.total / data.limit) : 1

	return (
		<div className="bg-surface-card border border-border-default rounded-action p-5">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-label-md font-semibold text-text-primary">
					Attendees
					{data && (
						<span className="ml-2 text-caption font-normal text-text-muted">({data.total})</span>
					)}
				</h2>
			</div>

			{loading && !data && (
				<div className="flex flex-col gap-2">
					{[0, 1, 2].map(i => (
						<Skeleton.Block key={i} className="h-14" />
					))}
				</div>
			)}

			{!loading && data && data.attendees.length === 0 && (
				<p className="text-body-sm text-text-muted text-center py-6">No attendees yet.</p>
			)}

			{data && data.attendees.length > 0 && (
				<>
					{/* Table header */}
					<div className="hidden sm:grid grid-cols-[1fr_1fr_120px_80px] gap-3 px-3 py-2 mb-1">
						<span className="text-caption font-semibold text-text-muted uppercase tracking-wide">
							Name
						</span>
						<span className="text-caption font-semibold text-text-muted uppercase tracking-wide">
							Ticket
						</span>
						<span className="text-caption font-semibold text-text-muted uppercase tracking-wide">
							Booking ID
						</span>
						<span className="text-caption font-semibold text-text-muted uppercase tracking-wide text-right">
							Check-in
						</span>
					</div>

					<div className="flex flex-col divide-y divide-border-default">
						{data.attendees.map((a, i) => (
							<AttendeeRow key={`${a.bookingId}-${i}`} attendee={a} />
						))}
					</div>

					{totalPages > 1 && (
						<div className="flex items-center justify-between mt-4 pt-4 border-t border-border-default">
							<span className="text-caption text-text-muted">
								Page {page} of {totalPages}
							</span>
							<div className="flex items-center gap-2">
								<button
									onClick={() => onPageChange(page - 1)}
									disabled={page === 1 || loading}
									className="px-3 py-1.5 text-caption font-medium border border-border-default rounded-action hover:bg-surface-card-muted disabled:opacity-40 transition-colors"
								>
									Prev
								</button>
								<button
									onClick={() => onPageChange(page + 1)}
									disabled={page >= totalPages || loading}
									className="px-3 py-1.5 text-caption font-medium border border-border-default rounded-action hover:bg-surface-card-muted disabled:opacity-40 transition-colors"
								>
									Next
								</button>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	)
}

function AttendeeRow({ attendee: a }: { attendee: EventAttendee }) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_120px_80px] gap-1 sm:gap-3 px-3 py-3">
			<div>
				<p className="text-label-sm font-medium text-text-primary">
					{a.firstName} {a.lastName}
				</p>
				<p className="text-caption text-text-muted sm:hidden">{a.ticketType}</p>
			</div>
			<p className="hidden sm:block text-body-sm text-text-secondary truncate self-center">
				{a.ticketType}
			</p>
			<p className="text-caption text-text-muted self-center font-mono">{a.bookingId}</p>
			<div className="sm:text-right self-center">
				{a.isCheckedIn ? (
					<span className="inline-flex items-center gap-1 text-caption font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-badge">
						<span className="size-1.5 rounded-full bg-green-500 shrink-0" />
						In
					</span>
				) : (
					<span className="inline-flex items-center gap-1 text-caption font-semibold text-text-muted bg-surface-card-muted px-2 py-0.5 rounded-badge">
						<span className="size-1.5 rounded-full bg-border-default shrink-0" />
						Pending
					</span>
				)}
			</div>
		</div>
	)
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ArrowLeftIcon() {
	return <ArrowLeftSvg className="size-4" aria-hidden />
}
function AlertIcon({ className }: { className?: string }) {
	return <DangerTriangleSvg className={clsx("size-4.5", className)} aria-hidden />
}
function PeopleStatIcon() {
	return <UsersGroupSvg className="size-4" aria-hidden />
}
function CheckInIcon() {
	return <CheckCircleSvg className="size-4" aria-hidden />
}
function CalendarIcon({ className }: { className?: string }) {
	return <CalendarSvg className={clsx("size-4.5", className)} aria-hidden />
}
function LocationIcon({ className }: { className?: string }) {
	return <MapPointRotateSvg className={clsx("size-4.5", className)} aria-hidden />
}
function SendIcon() {
	return <PlaneSvg className="size-4" aria-hidden />
}
function PenIcon() {
	return <PenSvg className="size-4" aria-hidden />
}
function CancelIcon() {
	return <CloseCircleSvg className="size-4" aria-hidden />
}
function ScannerStaffIcon() {
	return <UserCheckSvg className="size-4" aria-hidden />
}

function MiniSpinner() {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden
			className="animate-spin shrink-0"
		>
			<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
			<path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}
