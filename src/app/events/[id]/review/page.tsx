"use client"

import { Suspense, use, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import clsx from "clsx"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import CheckCircleSvg from "@/icons/filled/check-circle.svg"
import SmileCircleSvg from "@/icons/filled/smile-circle.svg"
import ShieldCheckSvg from "@/icons/filled/shield-check.svg"
import StarCircleSvg from "@/icons/filled/star-circle.svg"
import HeadphonesSvg from "@/icons/filled/headphones.svg"
import UsersGroupSvg from "@/icons/filled/users-group.svg"
import UsersGroup2Svg from "@/icons/filled/users-group-2.svg"
import UserCheckSvg from "@/icons/filled/user-check.svg"
import ShareCircleSvg from "@/icons/filled/share-circle.svg"
import BoltCircleSvg from "@/icons/filled/bolt-circle.svg"
import ChatSvg from "@/icons/filled/chat.svg"
import VerifiedCheckSvg from "@/icons/filled/verified-check.svg"
import GiftSvg from "@/icons/outlined/gift.svg"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import ClockCircleSvg from "@/icons/outlined/clock-circle.svg"
import MapPointSvg from "@/icons/outlined/map-point.svg"
import CameraAddSvg from "@/icons/outlined/camera-add.svg"
import AltArrowLeftSvg from "@/icons/outlined/alt-arrow-left.svg"
import { getPublicEventDetails } from "@/lib/api"
import { getReviewHighlights, submitReview, uploadReviewPhoto } from "@/lib/reviewsApi"
import { useAuthStore } from "@/store/authStore"
import type { ReviewHighlight } from "@/types/review"
import type { PublicEventDetails } from "@/types/attendee"

interface PageProps {
	params: Promise<{ id: string }>
}

function formatEventDate(isoDate: string): string {
	return new Date(isoDate).toLocaleDateString("en-IN", {
		weekday: "short",
		day: "numeric",
		month: "short",
		year: "numeric",
	})
}

// ─── Highlight chip icon map ──────────────────────────────────────────────────

const HIGHLIGHT_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
	GREAT_MUSIC: HeadphonesSvg,
	GOOD_CROWD: UsersGroupSvg,
	NICE_VENUE: StarCircleSvg,
	HELPFUL_HOST: UserCheckSvg,
	SMOOTH_ENTRY: CheckCircleSvg,
	FELT_SAFE: ShieldCheckSvg,
	GREAT_ART: StarCircleSvg,
	DIVERSE_EXHIBITS: BoltCircleSvg,
	GREAT_VIBE: SmileCircleSvg,
	WELL_ORGANIZED: CheckCircleSvg,
	GREAT_ENERGY: UsersGroupSvg,
}

// ─── Star rating ──────────────────────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
	const [hover, setHover] = useState(0)
	const active = hover || value
	return (
		<div className="flex items-center gap-2">
			<div className="flex gap-1.5">
				{[1, 2, 3, 4, 5].map((n) => (
					<button
						key={n}
						type="button"
						onClick={() => onChange(n)}
						onMouseEnter={() => setHover(n)}
						onMouseLeave={() => setHover(0)}
						aria-label={`Rate ${n} star${n !== 1 ? "s" : ""}`}
						className="transition-transform hover:scale-110 active:scale-95"
					>
						<svg
							width="28"
							height="28"
							viewBox="0 0 24 24"
							fill={n <= active ? "#f59e0b" : "none"}
							stroke={n <= active ? "#f59e0b" : "#d1d5db"}
							strokeWidth="1.5"
							aria-hidden
						>
							<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
						</svg>
					</button>
				))}
			</div>
			<span className="text-label-sm text-text-muted">
				{value > 0
					? ["", "Poor", "Fair", "Good", "Great", "Amazing"][value]
					: "Tap a star to rate"}
			</span>
		</div>
	)
}

// ─── Photo upload ─────────────────────────────────────────────────────────────

interface PhotoItem {
	file: File
	preview: string
	uploading: boolean
	key?: string
	error?: boolean
}

function PhotoUpload({
	photos,
	onAdd,
	onRemove,
}: {
	photos: PhotoItem[]
	onAdd: (files: File[]) => void
	onRemove: (index: number) => void
}) {
	const inputRef = useRef<HTMLInputElement>(null)
	const [dragging, setDragging] = useState(false)

	const handleFiles = (files: FileList | null) => {
		if (!files) return
		const remaining = 10 - photos.length
		const newFiles = Array.from(files)
			.filter((f) => f.type.startsWith("image/"))
			.slice(0, remaining)
		if (newFiles.length) onAdd(newFiles)
	}

	return (
		<div className="flex gap-4 items-start">
			{/* Drop zone */}
			{photos.length < 10 && (
				<div
					onClick={() => inputRef.current?.click()}
					onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
					onDragLeave={() => setDragging(false)}
					onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
					className={clsx(
						"w-44 shrink-0 rounded-action border-2 border-dashed flex flex-col items-center justify-center gap-2 py-6 cursor-pointer transition-colors",
						dragging
							? "border-action-primary bg-surface-brand-soft"
							: "border-border-subtle bg-surface-secondary hover:border-action-primary",
					)}
				>
					<Icon as={CameraAddSvg} size="lg" color="muted" />
					<p className="text-caption text-text-muted text-center px-2 leading-snug">
						Drag & drop photos here or{" "}
						<span className="text-text-brand">click to browse</span>
					</p>
					<p className="text-[10px] text-text-muted text-center">JPG / PNG, Min 1200×630px, Max 5MB, 16:9 ratio</p>
					<input
						ref={inputRef}
						type="file"
						accept="image/jpeg,image/png,image/webp"
						multiple
						className="hidden"
						onChange={(e) => handleFiles(e.target.files)}
					/>
				</div>
			)}

			{/* Thumbnails */}
			{photos.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{photos.map((photo, i) => (
						<div key={i} className="relative size-24 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
							<Image src={photo.preview} alt={`Photo ${i + 1}`} fill sizes="96px" className="object-cover" />
							{photo.uploading && (
								<div className="absolute inset-0 bg-black/40 flex items-center justify-center">
									<div className="size-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
								</div>
							)}
							<button
								type="button"
								onClick={() => onRemove(i)}
								className="absolute top-1 right-1 size-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
								aria-label="Remove photo"
							>
								<svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
									<path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
								</svg>
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	)
}

// ─── Feedback progress (right panel) ─────────────────────────────────────────

function FeedbackProgress({
	rating,
	highlights,
	body,
	photos,
}: {
	rating: number
	highlights: string[]
	body: string
	photos: PhotoItem[]
}) {
	const steps = [
		{ label: "Rate your experience", done: rating > 0 },
		{ label: "Share what you think", done: highlights.length > 0 || body.length > 0 },
		{ label: "Write a review (Optional)", done: body.length > 0 },
		{ label: "Add your memories", done: photos.length > 0 },
	]
	const done = steps.filter((s) => s.done).length
	const pct = Math.round((done / steps.length) * 100)

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center justify-between">
				<span className="text-label-sm font-semibold text-text-primary">Feedback progress</span>
				<span className="text-label-sm text-text-muted">{pct}% Complete</span>
			</div>
			<div className="h-1.5 rounded-full bg-surface-secondary overflow-hidden">
				<div
					className="h-full rounded-full bg-action-primary transition-all duration-500"
					style={{ width: `${pct}%` }}
				/>
			</div>
			<div className="flex flex-col gap-2.5 mt-1">
				{steps.map((step) => (
					<div key={step.label} className="flex items-center gap-2.5">
						<div
							className={clsx(
								"size-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
								step.done
									? "bg-action-primary border-action-primary"
									: "border-border-default bg-surface-canvas",
							)}
						>
							{step.done && (
								<svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden>
									<path d="M1.5 4l2 2 3-3" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							)}
						</div>
						<span className={clsx("text-label-sm", step.done ? "text-text-primary" : "text-text-muted")}>
							{step.label}
						</span>
					</div>
				))}
			</div>
		</div>
	)
}

// ─── Section header helper ────────────────────────────────────────────────────

function SectionHeader({
	icon,
	label,
	sub,
}: {
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
	label: string
	sub?: string
}) {
	return (
		<div className="flex items-start gap-3">
			<div className="size-8 rounded-full bg-surface-brand-soft flex items-center justify-center shrink-0 mt-0.5">
				<Icon as={icon} size="sm" color="brand" />
			</div>
			<div>
				<p className="text-body-sm font-bold text-text-primary">{label}</p>
				{sub && <p className="text-caption text-text-muted">{sub}</p>}
			</div>
		</div>
	)
}

// ─── Avatar stack (host + attendees) ─────────────────────────────────────────

function AvatarStack({ hostInitial: _hostInitial }: { hostInitial: string }) {
	const gradients = ["from-purple-400 to-pink-400", "from-blue-400 to-cyan-400", "from-green-400 to-teal-400", "from-orange-400 to-red-400"]
	return (
		<div className="flex items-center gap-2">
			<div className="flex -space-x-1.5">
				{gradients.map((g, i) => (
					<div
						key={i}
						className={`size-6 rounded-full bg-linear-to-br ${g} border-2 border-surface-card`}
						style={{ zIndex: 4 - i }}
					/>
				))}
			</div>
			<span className="text-caption text-text-muted">+24</span>
		</div>
	)
}

// ─── Review form ──────────────────────────────────────────────────────────────

function ReviewFormContent({
	eventId,
	orderId,
	event,
	highlightOptions,
}: {
	eventId: string
	orderId: string
	event: PublicEventDetails
	highlightOptions: ReviewHighlight[]
}) {
	const router = useRouter()
	const [rating, setRating] = useState(0)
	const [highlights, setHighlights] = useState<string[]>([])
	const [body, setBody] = useState("")
	const [photos, setPhotos] = useState<PhotoItem[]>([])
	const [confirmed, setConfirmed] = useState(false)
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const coverImageUrl = event.media.find((m) => m.type === "COVER")?.url ?? null
	const hostInitial = event.hostProfile?.displayName?.charAt(0).toUpperCase() ?? "H"
	const isEventPast = new Date(event.eventDate) < new Date()

	const toggleHighlight = (key: string) => {
		setHighlights((prev) => prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key])
	}

	const handleAddPhotos = (files: File[]) => {
		const newPhotos: PhotoItem[] = files.map((file) => ({
			file,
			preview: URL.createObjectURL(file),
			uploading: false,
		}))
		setPhotos((prev) => [...prev, ...newPhotos])
	}

	const handleRemovePhoto = (index: number) => {
		setPhotos((prev) => {
			const next = [...prev]
			URL.revokeObjectURL(next[index].preview)
			next.splice(index, 1)
			return next
		})
	}

	const handleSubmit = async () => {
		if (rating === 0) {
			setError("Please rate your experience before submitting.")
			return
		}
		setError(null)
		setSubmitting(true)

		const photoKeys: string[] = []
		if (photos.length > 0) {
			const results = await Promise.allSettled(photos.map((p) => uploadReviewPhoto(p.file)))
			results.forEach((r) => { if (r.status === "fulfilled") photoKeys.push(r.value) })
		}

		try {
			await submitReview({ eventId, orderId, rating, highlights, body: body.trim() || undefined, photoKeys })
			router.push(`/orders/${orderId}?reviewed=1`)
		} catch (err: unknown) {
			const msg =
				err instanceof Error ? err.message :
				(err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to submit review. Please try again."
			setError(msg)
			setSubmitting(false)
		}
	}

	return (
		<main className="flex-1 py-6 md:py-8 pb-16">
			<div className="max-w-384 mx-auto px-(--space-page-x-mobile) md:px-(--space-page-x-tablet) lg:px-(--space-page-x-desktop)">
				{/* Back */}
				<Link
					href={`/orders/${orderId}`}
					className="inline-flex items-center gap-1.5 text-body-sm text-text-primary hover:text-text-primary transition-colors mb-6"
				>
					<Icon as={AltArrowLeftSvg} size="sm" color="primary" />
					Back to my ticket
				</Link>

				{/* Page heading */}
				<div className="mb-6">
					<h1 className="text-heading-md font-extrabold text-text-primary leading-tight">
						How was the{" "}
						<span className="text-text-brand">{event.title}</span>{" "}
						vibe?
					</h1>
					<p className="text-body-sm text-text-secondary mt-1.5">
						Your feedback helps the host improve and helps others find the right event.
					</p>
				</div>

				{/* Event not yet happened notice */}
				{!isEventPast && (
					<div className="mb-5 flex items-start gap-3 rounded-action border border-amber-200 bg-amber-50 px-4 py-3.5">
						<svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0 mt-0.5 text-amber-500" aria-hidden>
							<path d="M9 1.5L1.5 15h15L9 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
							<path d="M9 7v4M9 13h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
						</svg>
						<div>
							<p className="text-label-sm font-semibold text-amber-800">Review not available yet</p>
							<p className="text-caption text-amber-700 mt-0.5">
								You can share your experience after the event takes place on{" "}
								<span className="font-medium">{formatEventDate(event.eventDate)}</span>.
								Feel free to explore the form below.
							</p>
						</div>
					</div>
				)}

				<div className="flex gap-6 items-start">
					{/* ── Left: single card ── */}
					<div className="flex-1 min-w-0">
						<div className="rounded-action border border-border-subtle bg-surface-card overflow-hidden divide-y divide-border-subtle">

							{/* Event summary */}
							<div className="flex gap-4 p-5">
								<div className="relative w-36 h-28 rounded-lg overflow-hidden shrink-0 bg-neutral-200">
									{coverImageUrl && (
										<Image
											src={coverImageUrl}
											alt={event.title}
											fill
											sizes="144px"
											className="object-cover"
										/>
									)}
								</div>
								<div className="flex flex-col gap-2 justify-center min-w-0">
									<h2 className="text-body-lg font-bold text-text-primary">{event.title}</h2>
									<div className="flex flex-wrap items-center gap-x-4 gap-y-1">
										<div className="flex items-center gap-1.5">
											<Icon as={CalendarSvg} size="sm" color="muted" />
											<span className="text-label-sm text-text-secondary">
												{formatEventDate(event.eventDate)}
											</span>
										</div>
										<div className="flex items-center gap-1.5">
											<Icon as={ClockCircleSvg} size="sm" color="muted" />
											<span className="text-label-sm text-text-secondary">
												{event.startTime} – {event.endTime}
											</span>
										</div>
										<div className="flex items-center gap-1.5">
											<Icon as={MapPointSvg} size="sm" color="muted" />
											<span className="text-label-sm text-text-secondary">{event.venueName}</span>
										</div>
									</div>
									{event.hostProfile && (
										<div className="flex items-center gap-3">
											<div className="flex items-center gap-2">
												<div className="size-7 rounded-full bg-neutral-200 border border-border-subtle flex items-center justify-center shrink-0">
													<span className="text-[11px] font-bold text-neutral-600">{hostInitial}</span>
												</div>
												<span className="text-label-sm text-text-secondary">
													Hosted by{" "}
													<span className="font-semibold text-text-primary">
														{event.hostProfile.displayName}
													</span>
												</span>
												<Icon as={VerifiedCheckSvg} size="sm" color="inherit" className="text-action-primary shrink-0" />
											</div>
											<AvatarStack hostInitial={hostInitial} />
										</div>
									)}
								</div>
							</div>

							{/* Rate your overall experience */}
							<div className="p-5 flex flex-col gap-4">
								<SectionHeader icon={SmileCircleSvg} label="Rate your overall experience" />
								<div className="pl-11">
									<StarRating value={rating} onChange={setRating} />
								</div>
							</div>

							{/* What stood out */}
							<div className="p-5 flex flex-col gap-4">
								<SectionHeader icon={BoltCircleSvg} label="What stood out to you?" sub="Select all that apply" />
								<div className="pl-11 flex flex-wrap gap-2">
									{highlightOptions.map(({ key, label }) => {
										const HIcon = HIGHLIGHT_ICONS[key]
										const isSelected = highlights.includes(key)
										return (
											<button
												key={key}
												type="button"
												onClick={() => toggleHighlight(key)}
												className={clsx(
													"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-badge text-label-sm font-medium border transition-all",
													isSelected
														? "bg-action-primary border-action-primary text-white"
														: "bg-surface-secondary border-border-subtle text-text-secondary hover:border-border-default hover:text-text-primary",
												)}
											>
												{HIcon && (
													<Icon
														as={HIcon}
														size="sm"
														color="inherit"
														className={isSelected ? "text-white" : "text-icon-brand"}
													/>
												)}
												{label}
											</button>
										)
									})}
								</div>
							</div>

							{/* Write a review */}
							<div className="p-5 flex flex-col gap-4">
								<SectionHeader
									icon={ChatSvg}
									label="Write a review"
									sub="Optional"
								/>
								<div className="pl-11 flex flex-col gap-1.5">
									<textarea
										value={body}
										onChange={(e) => setBody(e.target.value.slice(0, 800))}
										rows={3}
										placeholder="Share your experience, what you loved, and suggestions for next time..."
										className="w-full resize-none rounded-action border border-border-subtle bg-surface-secondary px-3.5 py-2.5 text-body-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-action-primary transition-colors"
									/>
									<span className="text-caption text-text-muted text-right">{body.length}/800</span>
								</div>
							</div>

							{/* Share your moments */}
							<div className="p-5 flex flex-col gap-4">
								<div className="flex items-start justify-between">
									<SectionHeader icon={ShareCircleSvg} label="Share your moments" sub="Photos appear publicly only after host approval." />
									<span className="text-caption text-text-muted shrink-0 mt-0.5">
										You can upload up to {10 - photos.length} photos
									</span>
								</div>
								<div className="pl-11">
									<PhotoUpload photos={photos} onAdd={handleAddPhotos} onRemove={handleRemovePhoto} />
								</div>
							</div>

							{/* Privacy checkbox */}
							<div className="px-5 py-4">
								<label className="flex items-start gap-3 cursor-pointer group">
									<div className="relative shrink-0 mt-0.5">
										<input
											type="checkbox"
											checked={confirmed}
											onChange={(e) => setConfirmed(e.target.checked)}
											className="sr-only"
										/>
										<div
											className={clsx(
												"size-4 rounded border-2 transition-colors flex items-center justify-center",
												confirmed
													? "bg-action-primary border-action-primary"
													: "border-border-default bg-surface-canvas group-hover:border-action-primary",
											)}
										>
											{confirmed && (
												<svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
													<path d="M1.5 5l3 3 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
												</svg>
											)}
										</div>
									</div>
									<span className="text-label-sm text-text-secondary leading-relaxed">
										I confirm, I have the right to share these photos and they do not violate
										anyone&apos;s privacy.
									</span>
								</label>
							</div>

							{/* Error */}
							{error && (
								<div className="px-5 pb-2">
									{error.toLowerCase().includes("after it has taken place") ? (
										<div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-action px-4 py-3">
											<svg width="16" height="16" viewBox="0 0 18 18" fill="none" className="shrink-0 mt-0.5 text-amber-500" aria-hidden>
												<path d="M9 1.5L1.5 15h15L9 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
												<path d="M9 7v4M9 13h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
											</svg>
											<p className="text-label-sm text-amber-800">
												Reviews open after the event takes place. Come back on{" "}
												<span className="font-semibold">{formatEventDate(event.eventDate)}</span> to share your experience.
											</p>
										</div>
									) : (
										<p className="text-label-sm text-red-600 bg-red-50 border border-red-200 rounded-action px-4 py-2.5">
											{error}
										</p>
									)}
								</div>
							)}

							{/* Submit */}
							<div className="p-5">
								<Button
									variant="primary"
									size="lg"
									radius="md"
									onClick={handleSubmit}
									disabled={submitting || !isEventPast || (photos.length > 0 && !confirmed)}
									className="w-full justify-center"
								>
									{submitting ? (
										<span className="flex items-center gap-2">
											<span className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
											Submitting...
										</span>
									) : (
										<span className="flex items-center gap-2">
											<Icon as={SmileCircleSvg} size="sm" color="inherit" />
											Submit feedback & memories
										</span>
									)}
								</Button>
							</div>
						</div>
					</div>

					{/* ── Right panel ── */}
					<aside className="hidden lg:flex flex-col gap-4 w-96 shrink-0 sticky top-20">
						{/* Experience recap */}
						<div className="rounded-panel bg-surface-card border border-border-subtle p-5 flex flex-col gap-4">
							<div className="flex items-center gap-2">
								<Icon as={StarCircleSvg} size="md" color="brand" />
								<p className="text-title-md font-bold text-text-primary">Your experience recap</p>
							</div>
							<div className="flex gap-3">
								<div className="relative size-16 rounded-lg overflow-hidden shrink-0 bg-neutral-200">
									{coverImageUrl && (
										<Image src={coverImageUrl} alt={event.title} fill sizes="64px" className="object-cover" />
									)}
								</div>
								<div className="flex-1 min-w-0 flex flex-col gap-0.5">
									<p className="text-label-sm font-bold text-text-primary truncate">{event.title}</p>
									<p className="text-caption text-text-muted">{formatEventDate(event.eventDate)}</p>
									<p className="text-caption text-text-muted">{event.startTime} – {event.endTime}</p>
									<p className="text-caption text-text-muted truncate">{event.venueName}</p>
									{event.hostProfile && (
										<div className="flex items-center gap-1 mt-0.5">
											<span className="text-caption text-text-muted">Hosted by</span>
											<span className="text-caption font-semibold text-text-primary">{event.hostProfile.displayName}</span>
											<Icon as={VerifiedCheckSvg} size="sm" color="inherit" className="text-action-primary" />
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Feedback progress */}
						<div className="rounded-panel bg-surface-card border border-border-subtle p-5">
							<FeedbackProgress rating={rating} highlights={highlights} body={body} photos={photos} />
						</div>

						{/* Invite */}
						<div className="rounded-panel bg-surface-card border border-border-subtle p-5 flex flex-col gap-3">
							<div className="flex items-center gap-3">
								<div className="size-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
									<Icon as={UsersGroup2Svg} size="md" color="info" />
								</div>
								<div>
									<p className="text-body-sm font-bold text-text-primary">Invite friend, get rewarded</p>
									<p className="text-caption text-text-muted leading-snug">
										Invite your crew and unlock meetday rewards when they join.
									</p>
								</div>
							</div>
							<Button variant="secondary" size="sm" radius="pill" className="w-full justify-center">
								<Icon as={GiftSvg} size="sm" color="inherit" className="mr-1.5" />
								Invite friends
							</Button>
						</div>

						{/* Host approval */}
						<div className="rounded-panel bg-surface-card border border-border-subtle p-5 flex flex-col gap-3">
							<div className="flex items-start gap-3">
								<div className="size-9 rounded-full bg-surface-brand-soft flex items-center justify-center shrink-0">
									<Icon as={ShieldCheckSvg} size="md" color="brand" />
								</div>
								<div>
									<p className="text-body-sm font-bold text-text-primary">Host approval required</p>
									<p className="text-caption text-text-muted leading-snug">
										Your photos will appear on the event page only after the host approves them.
									</p>
								</div>
							</div>
							<button type="button" className="text-label-sm text-text-brand hover:underline font-medium text-left">
								Learn more about approvals →
							</button>
						</div>
					</aside>
				</div>
			</div>
		</main>
	)
}

// ─── Page inner (data fetching) ───────────────────────────────────────────────

function ReviewPageInner({ id }: { id: string }) {
	const searchParams = useSearchParams()
	const orderId = searchParams.get("orderId") ?? ""
	const { authLoading } = useAuthStore()

	const [event, setEvent] = useState<PublicEventDetails | null>(null)
	const [highlightOptions, setHighlightOptions] = useState<ReviewHighlight[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (authLoading) return
		Promise.all([
			getPublicEventDetails(id).then((e) => { if (e) setEvent(e) }),
			getReviewHighlights(id).then((h) => { if (h.length > 0) setHighlightOptions(h) }),
		])
			.catch((err) => { setError(err instanceof Error ? err.message : "Failed to load event.") })
			.finally(() => setLoading(false))
	}, [id, authLoading])

	if (loading) {
		return (
			<main className="flex-1 flex items-center justify-center py-24">
				<div className="size-8 rounded-full border-2 border-action-primary border-t-transparent animate-spin" />
			</main>
		)
	}

	if (error || !event) {
		return (
			<main className="flex-1 flex items-center justify-center py-24">
				<div className="text-center flex flex-col items-center gap-3">
					<p className="text-heading-sm font-bold text-text-primary">Event not found</p>
					<p className="text-body-sm text-text-secondary">{error ?? "We couldn't load this event."}</p>
					<Link href="/explore" className="text-label-sm text-text-brand hover:underline font-medium">← Back to events</Link>
				</div>
			</main>
		)
	}

	if (!orderId) {
		return (
			<main className="flex-1 flex items-center justify-center py-24">
				<div className="text-center flex flex-col items-center gap-3">
					<p className="text-heading-sm font-bold text-text-primary">Order not found</p>
					<p className="text-body-sm text-text-secondary">Navigate here from your ticket page.</p>
					<Link href="/attendee/my-events" className="text-label-sm text-text-brand hover:underline font-medium">← My Events</Link>
				</div>
			</main>
		)
	}

	return <ReviewFormContent eventId={id} orderId={orderId} event={event} highlightOptions={highlightOptions} />
}

export default function ReviewPage({ params }: PageProps) {
	const { id } = use(params)
	return (
		<Suspense
			fallback={
				<main className="flex-1 flex items-center justify-center py-24">
					<div className="size-8 rounded-full border-2 border-action-primary border-t-transparent animate-spin" />
				</main>
			}
		>
			<ReviewPageInner id={id} />
		</Suspense>
	)
}
