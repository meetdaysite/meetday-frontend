"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import clsx from "clsx"
import { toast } from "sonner"
import { Switch } from "@/components/ui/Switch"
import { Dropdown } from "@/components/ui/Dropdown"
import { Icon } from "@/components/ui/Icon"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import { getMyEventDetail, updateEventDraft, submitEventForReview, getCategories, type Category } from "@/lib/api"
import { Skeleton } from "@/components/ui/Skeleton"
import { getApiErrorMessage } from "@/lib/errors"
import { uploadEventMedia } from "@/lib/uploadMedia"
import {
	LANGUAGE_OPTIONS,
	EVENT_TYPE_OPTIONS,
	addOneDay,
	defaultFormData,
	eventToFormData,
	buildPayload,
	timeToMinutes,
	to12Hour,
	validateAll,
	validateMediaKeys,
	type FormData,
	type Errors,
} from "@/lib/eventForm"
import {
	inpCls,
	iconWrapCls,
	taCls,
	FieldLabel,
	ErrMsg,
	MiniSpinner,
	PillInput,
} from "@/components/eventForm/shared"
import { VenueAutocompleteInput } from "@/components/eventForm/AddressAutocompleteInput"
import { DateField, parseDateInput } from "@/components/eventForm/DateField"
import { TimeField } from "@/components/eventForm/TimeField"
import { TicketListEditor } from "@/components/eventForm/TicketListEditor"
import type { ApiEventStatus } from "@/types/event"

import ArrowLeftSvg from "@/icons/outlined/arrow-left.svg"
import MapPointRotateSvg from "@/icons/outlined/map-point-rotate.svg"
import CameraAddSvg from "@/icons/outlined/camera-add.svg"
import DangerTriangleSvg from "@/icons/outlined/danger-triangle.svg"

// ─── Status display ───────────────────────────────────────────────────────────

const STATUS_BADGE: Record<ApiEventStatus, string> = {
	DRAFT:        "bg-neutral-100 text-neutral-700",
	UNDER_REVIEW: "bg-blue-50 text-blue-700",
	REJECTED:     "bg-red-50 text-red-700",
	PUBLISHED:    "bg-green-50 text-green-700",
	CANCELLED:    "bg-orange-50 text-orange-700",
	COMPLETED:    "bg-neutral-900 text-white",
}

const STATUS_LABEL: Record<ApiEventStatus, string> = {
	DRAFT:        "Draft",
	UNDER_REVIEW: "Under Review",
	REJECTED:     "Rejected",
	PUBLISHED:    "Published",
	CANCELLED:    "Cancelled",
	COMPLETED:    "Completed",
}

// ─── Section card wrapper ─────────────────────────────────────────────────────

function SectionCard({
	title,
	subtitle,
	action,
	children,
}: {
	title: string
	subtitle?: string
	action?: React.ReactNode
	children: React.ReactNode
}) {
	return (
		<div className="border border-border-default rounded-action bg-surface-card overflow-hidden">
			<div className="px-6 py-4 border-b border-border-default flex items-center justify-between gap-3">
				<div>
					<h2 className="text-label-md font-semibold text-text-primary">{title}</h2>
					{subtitle && <p className="text-caption text-text-tertiary mt-0.5">{subtitle}</p>}
				</div>
				{action}
			</div>
			<div className="p-6 flex flex-col gap-4">{children}</div>
		</div>
	)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditEventPage() {
	const params = useParams()
	const router = useRouter()
	const id = params.id as string

	const [formData, setFormData] = useState<FormData>(defaultFormData)
	const [originalStatus, setOriginalStatus] = useState<ApiEventStatus | null>(null)
	const [loading, setLoading] = useState(true)
	const [loadError, setLoadError] = useState<string | null>(null)
	const [categories, setCategories] = useState<Category[]>([])
	const [categoriesLoading, setCategoriesLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [submitting, setSubmitting] = useState(false)
	const [validated, setValidated] = useState(false)
	const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
	const [overnightConfirm, setOvernightConfirm] = useState<{ startTime: string; endTime: string } | null>(null)

	const [coverUploading, setCoverUploading] = useState(false)
	const [galleryUploading, setGalleryUploading] = useState<boolean[]>(Array(6).fill(false))
	const [isDraggingOver, setIsDraggingOver] = useState(false)
	const [mediaTouched, setMediaTouched] = useState(false)

	const coverFileRef = useRef<HTMLInputElement>(null)
	const galleryFileRef = useRef<HTMLInputElement>(null)
	const targetSlotRef = useRef<number>(0)

	useEffect(() => {
		Promise.all([getMyEventDetail(id), getCategories()])
			.then(([event, cats]) => {
				if (event.status === "PUBLISHED") {
					router.replace(`/host/dashboard/events/${id}/revise`)
					return
				}
				if (event.status !== "DRAFT" && event.status !== "UNDER_REVIEW") {
					router.replace(`/host/dashboard/events/${id}`)
					return
				}
				setFormData(eventToFormData(event))
				setOriginalStatus(event.status)
				setCategories(cats)
			})
			.catch((err) => setLoadError(getApiErrorMessage(err)))
			.finally(() => {
				setLoading(false)
				setCategoriesLoading(false)
			})
	}, [id, router])

	const errors: Errors = useMemo(
		() => (validated ? { ...validateAll(formData, true), ...validateMediaKeys(formData, mediaTouched) } : {}),
		[validated, formData, mediaTouched],
	)

	function set<K extends keyof FormData>(key: K, value: FormData[K]) {
		setFormData((prev) => ({ ...prev, [key]: value }))
	}

	// If start/end times now cross midnight while the event is still marked
	// single-day, don't silently accept it — the host may have mistyped one of
	// the times. Ask before promoting to a multi-day listing.
	function checkOvernight(nextStart: string, nextEnd: string): boolean {
		if (formData.isMultiDay || !nextStart || !nextEnd) return false
		if (timeToMinutes(nextEnd) > timeToMinutes(nextStart)) return false
		setOvernightConfirm({ startTime: nextStart, endTime: nextEnd })
		return true
	}

	function confirmOvernight() {
		if (!overnightConfirm) return
		setFormData((prev) => ({
			...prev,
			startTime: overnightConfirm.startTime,
			endTime: overnightConfirm.endTime,
			isMultiDay: true,
			endDate: prev.eventDate ? addOneDay(prev.eventDate) : prev.endDate,
		}))
		setOvernightConfirm(null)
	}

	async function handleAddressBlur() {
		if (!formData.fullAddress.trim() || formData.latitude !== null) return
		try {
			const res = await fetch(`/api/geocode?address=${encodeURIComponent(formData.fullAddress)}`)
			const data = await res.json()
			if (data.lat) {
				setFormData((prev) => ({
					...prev,
					latitude: data.lat,
					longitude: data.lng,
					city: data.city || prev.city,
				}))
			}
		} catch {
			// geocoding is best-effort, silently ignore errors
		}
	}

	const isMediaUploading = coverUploading || galleryUploading.some(Boolean)
	const canSubmitForReview = originalStatus === "DRAFT"
	const categoryOptions = useMemo(() => categories.map((c) => ({ value: c.id, label: c.name })), [categories])
	const availableLanguages = LANGUAGE_OPTIONS.filter((o) => !formData.languages.includes(o.value))
	const isPartial = formData.refundType === "PARTIAL"

	async function handleSave() {
		setValidated(true)
		const errs = { ...validateAll(formData, true), ...validateMediaKeys(formData, mediaTouched) }
		if (Object.keys(errs).length > 0) {
			toast.error("Please fix the errors before saving.")
			const firstErrId = Object.keys(errs)[0]
			document.getElementById(firstErrId)?.scrollIntoView({ behavior: "smooth", block: "center" })
			return
		}
		setSaving(true)
		try {
			const wasUnderReview = originalStatus === "UNDER_REVIEW"
			const updated = await updateEventDraft(id, buildPayload(formData))
			if (wasUnderReview && updated.status === "DRAFT") {
				setOriginalStatus("DRAFT")
				toast.success("Moved back to draft — submit again for review.")
			} else {
				toast.success("Changes saved.")
			}
		} catch (err) {
			toast.error(getApiErrorMessage(err))
		} finally {
			setSaving(false)
		}
	}

	async function handleSubmit() {
		setValidated(true)
		const errs = { ...validateAll(formData, true), ...validateMediaKeys(formData, mediaTouched) }
		if (Object.keys(errs).length > 0) {
			setShowSubmitConfirm(false)
			toast.error("Please fix the errors before submitting.")
			return
		}
		setSubmitting(true)
		try {
			await updateEventDraft(id, buildPayload(formData))
			await submitEventForReview(id)
			toast.success("Experience submitted for review!")
			router.push("/host/dashboard/events")
		} catch (err) {
			toast.error(getApiErrorMessage(err))
			setSubmitting(false)
		}
	}

	// ─── Upload handlers ────────────────────────────────────────────────────

	async function handleCoverFile(file: File) {
		if (!file.type.startsWith("image/")) return
		setMediaTouched(true)
		const prev = formData.coverUrl
		if (prev.startsWith("blob:")) URL.revokeObjectURL(prev)
		set("coverUrl", URL.createObjectURL(file))
		set("coverKey", "")
		setCoverUploading(true)
		try {
			const key = await uploadEventMedia(file, "COVER")
			set("coverKey", key)
		} catch (err) {
			toast.error(getApiErrorMessage(err))
			set("coverUrl", "")
		} finally {
			setCoverUploading(false)
		}
	}

	async function handleGalleryFile(file: File, slotIndex: number) {
		const isVideo = file.type.startsWith("video/")
		if (!isVideo && !file.type.startsWith("image/")) return
		setMediaTouched(true)
		const nextSlots = [...formData.gallerySlots]
		if (nextSlots[slotIndex].startsWith("blob:")) URL.revokeObjectURL(nextSlots[slotIndex])
		nextSlots[slotIndex] = URL.createObjectURL(file)
		set("gallerySlots", nextSlots)
		const nextKeys = [...formData.galleryKeys]
		nextKeys[slotIndex] = ""
		set("galleryKeys", nextKeys)
		const nextTypes = [...formData.galleryTypes]
		nextTypes[slotIndex] = isVideo ? "VIDEO" : "GALLERY"
		set("galleryTypes", nextTypes)
		setGalleryUploading((prev) => { const n = [...prev]; n[slotIndex] = true; return n })
		try {
			const key = await uploadEventMedia(file, "GALLERY")
			setFormData((prev) => {
				const keys = [...prev.galleryKeys]
				keys[slotIndex] = key
				return { ...prev, galleryKeys: keys }
			})
		} catch (err) {
			toast.error(getApiErrorMessage(err))
			setFormData((prev) => {
				const slots = [...prev.gallerySlots]
				slots[slotIndex] = ""
				const types = [...prev.galleryTypes]
				types[slotIndex] = ""
				return { ...prev, gallerySlots: slots, galleryTypes: types }
			})
		} finally {
			setGalleryUploading((prev) => { const n = [...prev]; n[slotIndex] = false; return n })
		}
	}

	function removeCover() {
		setMediaTouched(true)
		if (formData.coverUrl.startsWith("blob:")) URL.revokeObjectURL(formData.coverUrl)
		set("coverUrl", "")
		set("coverKey", "")
	}

	function removeGallerySlot(i: number) {
		setMediaTouched(true)
		const nextSlots = [...formData.gallerySlots]
		if (nextSlots[i].startsWith("blob:")) URL.revokeObjectURL(nextSlots[i])
		nextSlots[i] = ""
		set("gallerySlots", nextSlots)
		const nextKeys = [...formData.galleryKeys]
		nextKeys[i] = ""
		set("galleryKeys", nextKeys)
		const nextTypes = [...formData.galleryTypes]
		nextTypes[i] = ""
		set("galleryTypes", nextTypes)
	}

	// ─── Loading / error states ─────────────────────────────────────────────

	if (loading) {
		return (
			<div className="flex flex-col min-h-screen">
				<DashboardTopBar />
				<div className="flex-1 px-6 lg:px-10 py-8 bg-surface-page">
					<div className="max-w-4xl mx-auto flex flex-col gap-5">
						{Array.from({ length: 5 }).map((_, i) => (
							<div key={i} className="border border-border-default rounded-action bg-surface-card overflow-hidden">
								<div className="px-6 py-4 border-b border-border-default">
									<Skeleton.Text className="w-32" />
								</div>
								<div className="p-6 flex flex-col gap-4">
									<Skeleton.Block className="h-10 rounded-input" />
									<Skeleton.Block className="h-10 rounded-input" />
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		)
	}

	if (loadError) {
		return (
			<div className="flex flex-col min-h-screen">
				<DashboardTopBar />
				<div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
					<p className="text-label-md font-semibold text-text-primary">{loadError}</p>
					<button
						onClick={() => router.push(`/host/dashboard/events/${id}`)}
						className="px-4 py-2 text-label-sm font-medium text-text-secondary border border-border-default rounded-action hover:bg-surface-card-muted transition-colors"
					>
						Back to Event
					</button>
				</div>
			</div>
		)
	}

	const saveBtn = (
		<button
			type="button"
			onClick={handleSave}
			disabled={saving || isMediaUploading}
			className="flex items-center gap-2 px-5 py-2 bg-surface-inverse text-text-inverse text-label-sm font-semibold rounded-action hover:opacity-90 transition-opacity disabled:opacity-50"
		>
			{saving && <MiniSpinner />}
			Save Changes
		</button>
	)

	return (
		<>
		<div className="flex flex-col min-h-screen">
			<DashboardTopBar />

			{/* Action bar */}
			<div className="flex items-center justify-between px-6 lg:px-8 py-3 bg-surface-card border-b border-border-default sticky top-0 z-20">
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => router.push(`/host/dashboard/events/${id}`)}
						className="p-1.5 rounded-action hover:bg-surface-card-muted transition-colors text-text-secondary hover:text-text-primary"
						aria-label="Back to event"
					>
						<ArrowLeftSvg className="size-5" aria-hidden />
					</button>
					<h2 className="text-label-md font-semibold text-text-primary">Edit Experience</h2>
					{originalStatus && (
						<span className={clsx("text-caption font-semibold px-2.5 py-0.5 rounded-badge", STATUS_BADGE[originalStatus])}>
							{STATUS_LABEL[originalStatus]}
						</span>
					)}
				</div>
				<div className="flex items-center gap-3">
					{canSubmitForReview && (
						<button
							type="button"
							onClick={() => setShowSubmitConfirm(true)}
							disabled={submitting}
							className="px-4 py-2 text-label-sm font-semibold text-white bg-action-primary rounded-action hover:opacity-90 transition-opacity disabled:opacity-50"
						>
							Submit for Review
						</button>
					)}
					{saveBtn}
				</div>
			</div>

			{/* Form */}
			<div className="flex-1 px-6 lg:px-10 py-8 bg-surface-page">
				<div className="max-w-4xl mx-auto flex flex-col gap-5">

					{/* Recall-to-draft notice */}
					{originalStatus === "UNDER_REVIEW" && (
						<div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-action">
							<Icon as={DangerTriangleSvg} size="md" color="warning" className="shrink-0 mt-0.5" />
							<p className="text-body-sm text-amber-700">
								This event is currently under review. Saving any change here will move it back to
								draft and clear its submission — you&apos;ll need to submit it for review again.
							</p>
						</div>
					)}

					{/* ── 1. Basic Info ── */}
					<SectionCard title="Basic Information" subtitle="Name and describe your experience">
						<div className="flex flex-col gap-1.5">
							<FieldLabel required>Event Title</FieldLabel>
							<input
								id="title"
								type="text"
								maxLength={100}
								value={formData.title}
								onChange={(e) => set("title", e.target.value)}
								placeholder="e.g. Summer Music Festival 2025"
								className={inpCls(!!errors.title)}
							/>
							<div className="flex items-center justify-between gap-2">
								<ErrMsg msg={errors.title} />
								<p className="text-caption text-text-muted ml-auto">{formData.title.length}/100</p>
							</div>
						</div>

						<div className="flex flex-col gap-1.5">
							<FieldLabel required>Description</FieldLabel>
							<textarea
								id="desc"
								rows={5}
								maxLength={3000}
								value={formData.desc}
								onChange={(e) => set("desc", e.target.value)}
								placeholder="Describe your event in detail..."
								className={taCls(!!errors.desc)}
							/>
							<div className="flex items-center justify-between gap-2">
								<ErrMsg msg={errors.desc} />
								<p className="text-caption text-text-muted ml-auto">{formData.desc.length}/3000</p>
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="flex flex-col gap-1.5">
								<FieldLabel required>Category</FieldLabel>
								<Dropdown
									value={formData.category}
									onChange={(v) => set("category", v)}
									error={!!errors.category}
									placeholder={categoriesLoading ? "Loading…" : "Select Category"}
									disabled={categoriesLoading}
									options={categoryOptions}
								/>
								<ErrMsg msg={errors.category} />
							</div>
							<div className="flex flex-col gap-1.5">
								<FieldLabel required>Event Type</FieldLabel>
								<Dropdown
									value={formData.eventType}
									onChange={(v) => set("eventType", v)}
									error={!!errors.eventType}
									placeholder="Select Experience Type"
									options={EVENT_TYPE_OPTIONS}
								/>
								<ErrMsg msg={errors.eventType} />
							</div>
						</div>

						<div className="flex flex-col gap-1.5">
							<FieldLabel>Languages</FieldLabel>
							<Dropdown
								value=""
								onChange={(v) => {
									if (v && !formData.languages.includes(v))
										set("languages", [...formData.languages, v])
								}}
								placeholder="Add a language…"
								options={availableLanguages}
								disabled={availableLanguages.length === 0}
							/>
							{formData.languages.length > 0 && (
								<div className="flex flex-wrap gap-1.5 mt-1">
									{formData.languages.map((lang) => {
										const label = LANGUAGE_OPTIONS.find((o) => o.value === lang)?.label ?? lang
										return (
											<span key={lang} className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-card-muted rounded-badge text-caption text-text-primary">
												{label}
												<button
													type="button"
													onClick={() => set("languages", formData.languages.filter((l) => l !== lang))}
													className="text-text-tertiary hover:text-text-primary leading-none"
													aria-label={`Remove ${lang}`}
												>×</button>
											</span>
										)
									})}
								</div>
							)}
						</div>

						<div className="flex flex-col gap-1.5">
							<FieldLabel>Tags / Keywords</FieldLabel>
							<PillInput values={formData.tags} onChange={(v) => set("tags", v)} placeholder="Add tags…" />
						</div>

						<div className="flex flex-col gap-1.5">
							<FieldLabel required>What to Expect</FieldLabel>
							<PillInput
								values={formData.whatToExpect}
								onChange={(v) => set("whatToExpect", v)}
								placeholder="e.g. Guided walk"
							/>
							<ErrMsg msg={errors.whatToExpect} />
						</div>

						<div className="flex flex-col gap-1.5">
							<FieldLabel required>Who Should Attend</FieldLabel>
							<PillInput
								values={formData.whoShouldAttend}
								onChange={(v) => set("whoShouldAttend", v)}
								placeholder="e.g. Photography enthusiasts"
							/>
							<ErrMsg msg={errors.whoShouldAttend} />
						</div>
					</SectionCard>

					{/* ── 2. Date & Location ── */}
					<SectionCard
						title="Date & Location"
						subtitle="When and where your event takes place"
						action={
							<Switch
								label="Multi-day event"
								checked={formData.isMultiDay}
								onChange={(checked) =>
									setFormData((prev) => ({ ...prev, isMultiDay: checked, endDate: checked ? prev.endDate : "" }))
								}
							/>
						}
					>
						<div className={clsx("grid gap-4", formData.isMultiDay ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
							<div className="flex flex-col gap-1.5">
								<FieldLabel required>Event Date</FieldLabel>
								<DateField
									id="eventDate"
									value={formData.eventDate}
									onChange={(v) => set("eventDate", v)}
									error={!!errors.eventDate}
								/>
								<ErrMsg msg={errors.eventDate} />
							</div>

							{formData.isMultiDay && (
								<div className="flex flex-col gap-1.5">
									<FieldLabel required>End Date</FieldLabel>
									<DateField
										id="endDate"
										value={formData.endDate}
										onChange={(v) => set("endDate", v)}
										error={!!errors.endDate}
										minDate={parseDateInput(formData.eventDate) ?? undefined}
									/>
									<ErrMsg msg={errors.endDate} />
								</div>
							)}
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="flex flex-col gap-1.5">
								<FieldLabel required>Start Time</FieldLabel>
								<TimeField
									id="startTime"
									value={formData.startTime}
									onChange={(v) => {
										if (checkOvernight(v, formData.endTime)) return
										set("startTime", v)
									}}
									error={!!errors.startTime}
								/>
								<ErrMsg msg={errors.startTime} />
							</div>
							<div className="flex flex-col gap-1.5">
								<FieldLabel required>End Time</FieldLabel>
								<TimeField
									id="endTime"
									value={formData.endTime}
									onChange={(v) => {
										if (checkOvernight(formData.startTime, v)) return
										set("endTime", v)
									}}
									error={!!errors.endTime}
								/>
								<ErrMsg msg={errors.endTime} />
							</div>
						</div>

						<div className="flex flex-col gap-1.5">
							<FieldLabel required>Venue Name</FieldLabel>
							<VenueAutocompleteInput
								id="venueName"
								value={formData.venueName}
								error={!!errors.venueName}
								onChange={(v) => set("venueName", v)}
								onPlaceSelect={(fields) =>
									setFormData((prev) => ({
										...prev,
										venueName: fields.venueName || prev.venueName,
										fullAddress: fields.fullAddress || prev.fullAddress,
										city: fields.city || prev.city,
										latitude: fields.latitude,
										longitude: fields.longitude,
									}))
								}
							/>
							<ErrMsg msg={errors.venueName} />
						</div>

						<div id="fullAddress" className="flex flex-col gap-1.5">
							<FieldLabel required>Full Address</FieldLabel>
							<div className={iconWrapCls(!!errors.fullAddress)}>
								<Icon as={MapPointRotateSvg} size="md" color="secondary" />
								<input
									type="text"
									value={formData.fullAddress}
									onChange={(e) => set("fullAddress", e.target.value)}
									onBlur={handleAddressBlur}
									placeholder="Auto-filled from venue name"
									className="flex-1 bg-transparent text-sm placeholder:text-text-muted text-text-primary outline-none"
								/>
							</div>
							<ErrMsg msg={errors.fullAddress} />
						</div>

						<div className="flex flex-col gap-1.5">
							<FieldLabel>City</FieldLabel>
							<input
								type="text"
								value={formData.city}
								onChange={(e) => set("city", e.target.value)}
								placeholder="e.g. Mumbai"
								className={inpCls(false)}
							/>
						</div>
					</SectionCard>

					{/* ── 3. Media ── */}
					<SectionCard title="Media" subtitle="Cover and gallery images for your event">
						<p className="text-caption text-amber-700 bg-amber-50 border border-amber-200 rounded-action px-3 py-2 -mt-1">
							Changing any image here means you&apos;ll need to re-upload every other image you want
							to keep — existing images can&apos;t be carried over automatically once you touch this
							section.
						</p>
						{/* Cover */}
						<div className="flex flex-col gap-2">
							<FieldLabel required>Cover Image</FieldLabel>
							<input
								ref={coverFileRef}
								type="file"
								accept="image/jpeg,image/png,image/webp"
								className="hidden"
								onChange={(e) => {
									const f = e.target.files?.[0]
									if (f) handleCoverFile(f)
									e.target.value = ""
								}}
							/>
							<div
								id="coverUrl"
								onClick={() => !coverUploading && coverFileRef.current?.click()}
								onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true) }}
								onDragLeave={() => setIsDraggingOver(false)}
								onDrop={(e) => {
									e.preventDefault()
									setIsDraggingOver(false)
									const f = e.dataTransfer.files[0]
									if (f) handleCoverFile(f)
								}}
								className={clsx(
									"border-2 border-dashed rounded-action flex flex-col items-center justify-center gap-2 transition-colors overflow-hidden",
									coverUploading ? "cursor-wait opacity-70" : "cursor-pointer",
									formData.coverUrl ? "aspect-video p-0" : "py-14",
									isDraggingOver
										? "border-border-focused bg-surface-brand-soft"
										: "border-border-default bg-surface-card-muted hover:bg-surface-card",
								)}
							>
								{formData.coverUrl ? (
									<div className="relative w-full h-full">
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img src={formData.coverUrl} alt="Cover preview" className="w-full h-full object-cover" loading="lazy" />
										{coverUploading && (
											<div className="absolute inset-0 bg-black/40 flex items-center justify-center">
												<MiniSpinner />
											</div>
										)}
										{!coverUploading && (
											<button
												type="button"
												onClick={(e) => { e.stopPropagation(); removeCover() }}
												className="absolute top-2 right-2 size-6 rounded-full bg-black/50 text-white flex items-center justify-center text-sm hover:bg-black/70"
												aria-label="Remove cover"
											>×</button>
										)}
									</div>
								) : (
									<>
										<div className="size-12 rounded-full bg-surface-card flex items-center justify-center">
											<Icon as={CameraAddSvg} size="lg" color="muted" />
										</div>
										<p className="text-label-sm font-medium text-text-secondary">Click or drop your cover image here</p>
										<p className="text-caption text-text-muted">JPG / PNG / WebP · Max 5MB · 16:9 ratio recommended</p>
									</>
								)}
							</div>
							<ErrMsg msg={errors.coverUrl} />
						</div>

						{/* Gallery */}
						<div className="flex flex-col gap-2">
							<FieldLabel required>Gallery Images & Videos</FieldLabel>
							<p className="text-caption text-text-muted -mt-1">Click any slot to replace an image or video.</p>
							<input
								ref={galleryFileRef}
								type="file"
								accept="image/jpeg,image/png,image/webp,video/*"
								className="hidden"
								onChange={(e) => {
									const f = e.target.files?.[0]
									if (f) handleGalleryFile(f, targetSlotRef.current)
									e.target.value = ""
								}}
							/>
							<ErrMsg msg={errors.gallery} />
							<div className="grid grid-cols-3 gap-3">
								{formData.gallerySlots.map((img, i) => (
									<div
										key={i}
										onClick={() => {
											if (!galleryUploading[i]) {
												targetSlotRef.current = i
												galleryFileRef.current?.click()
											}
										}}
										className={clsx(
											"relative aspect-video rounded-action border-2 border-dashed border-border-default bg-surface-card-muted flex items-center justify-center transition-colors overflow-hidden",
											galleryUploading[i] ? "cursor-wait opacity-70" : "cursor-pointer hover:bg-surface-card",
										)}
									>
										{img ? (
											<>
												{formData.galleryTypes[i] === "VIDEO" ? (
													<video
														src={img}
														preload="none"
														className="w-full h-full object-cover"
														onClick={(e) => e.stopPropagation()}
													/>
												) : (
													// eslint-disable-next-line @next/next/no-img-element
													<img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
												)}
												{galleryUploading[i] && (
													<div className="absolute inset-0 bg-black/40 flex items-center justify-center">
														<MiniSpinner />
													</div>
												)}
												{!galleryUploading[i] && (
													<button
														type="button"
														onClick={(e) => { e.stopPropagation(); removeGallerySlot(i) }}
														className="absolute top-1 right-1 size-5 rounded-full bg-black/50 text-white flex items-center justify-center text-xs hover:bg-black/70"
														aria-label={`Remove gallery item ${i + 1}`}
													>×</button>
												)}
											</>
										) : (
											<span className="text-text-muted text-2xl leading-none select-none">+</span>
										)}
									</div>
								))}
							</div>
						</div>
					</SectionCard>

					{/* ── 4. Ticket Types ── */}
					<SectionCard title="Ticket Types" subtitle="Pricing and capacity for your event">
						<TicketListEditor
							tickets={formData.tickets}
							onChange={(updated) => set("tickets", updated)}
							listError={errors.tickets}
						/>
					</SectionCard>

					{/* ── 5. Settings ── */}
					<SectionCard title="Settings" subtitle="Visibility, restrictions, and refund policy">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="flex flex-col gap-1.5">
								<FieldLabel required>Visibility</FieldLabel>
								<Dropdown
									value={formData.visibility}
									onChange={(v) => set("visibility", v)}
									error={!!errors.visibility}
									placeholder="Select Visibility"
									options={[
										{ value: "PUBLIC",  label: "Public Searchable" },
										{ value: "PRIVATE", label: "Private" },
									]}
								/>
								<ErrMsg msg={errors.visibility} />
							</div>
							<div className="flex flex-col gap-1.5">
								<FieldLabel required>Age Restriction</FieldLabel>
								<Dropdown
									value={formData.ageRestriction}
									onChange={(v) => set("ageRestriction", v)}
									error={!!errors.ageRestriction}
									placeholder="All Ages"
									options={[
										{ value: "All Ages", label: "All Ages" },
										{ value: "18+",      label: "18+" },
										{ value: "21+",      label: "21+" },
									]}
								/>
								<ErrMsg msg={errors.ageRestriction} />
							</div>
						</div>

						<div className="flex flex-col gap-1.5">
							<FieldLabel required>Refund Policy</FieldLabel>
							<Dropdown
								value={formData.refundType}
								onChange={(v) => set("refundType", v)}
								error={!!errors.refundType}
								placeholder="Select Refund Policy"
								options={[
									{ value: "NO_REFUND", label: "No Refund" },
									{ value: "PARTIAL",   label: "Partial Refund" },
									{ value: "FULL",      label: "Full Refund" },
								]}
							/>
							<ErrMsg msg={errors.refundType} />
						</div>

						{isPartial && (
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="flex flex-col gap-1.5">
									<FieldLabel required>Cutoff Hours</FieldLabel>
									<div className={iconWrapCls(!!errors.cutoffHours)}>
										<input
											id="cutoffHours"
											type="number"
											value={formData.cutoffHours}
											onChange={(e) => set("cutoffHours", e.target.value)}
											placeholder="24"
											min={0}
											className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
										/>
										<span className="text-sm text-text-muted shrink-0">hours</span>
									</div>
									<ErrMsg msg={errors.cutoffHours} />
								</div>
								<div className="flex flex-col gap-1.5">
									<FieldLabel required>Refund Percent</FieldLabel>
									<div className={iconWrapCls(!!errors.refundPercent)}>
										<input
											id="refundPercent"
											type="number"
											value={formData.refundPercent}
											onChange={(e) => set("refundPercent", e.target.value)}
											placeholder="50"
											min={0}
											max={100}
											className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
										/>
										<span className="text-sm text-text-muted shrink-0">%</span>
									</div>
									<ErrMsg msg={errors.refundPercent} />
								</div>
							</div>
						)}

						<div className="flex flex-col gap-1.5">
							<FieldLabel required>Special Instructions</FieldLabel>
							<textarea
								id="instructions"
								rows={5}
								maxLength={3000}
								value={formData.instructions}
								onChange={(e) => set("instructions", e.target.value)}
								placeholder="Any special notes for your attendees…"
								className={taCls(!!errors.instructions)}
							/>
							<div className="flex items-center justify-between gap-2">
								<ErrMsg msg={errors.instructions} />
								<p className="text-caption text-text-muted ml-auto">{formData.instructions.length}/3000</p>
							</div>
						</div>
					</SectionCard>

					{/* Bottom action row */}
					<div className="flex items-center justify-end gap-3 pb-8">
						{canSubmitForReview && (
							<button
								type="button"
								onClick={() => setShowSubmitConfirm(true)}
								disabled={submitting}
								className="px-4 py-2 text-label-sm font-semibold text-white bg-action-primary rounded-action hover:opacity-90 transition-opacity disabled:opacity-50"
							>
								Submit for Review
							</button>
						)}
						{saveBtn}
					</div>

				</div>
			</div>
		</div>

		{/* Submit confirmation modal */}
		{showSubmitConfirm && (
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
				<div className="bg-surface-card rounded-action border border-border-default shadow-floating w-full max-w-sm p-6">
					<h2 className="text-label-lg font-semibold text-text-primary mb-2">Submit for Review?</h2>
					<p className="text-body-sm text-text-secondary mb-6">
						Your latest changes will be saved and the event will be sent to the team for review. You won&apos;t be able to edit it until a decision is made.
					</p>
					<div className="flex gap-3 justify-end">
						<button
							onClick={() => setShowSubmitConfirm(false)}
							disabled={submitting}
							className="px-4 py-2 text-label-sm font-medium text-text-primary border border-border-default rounded-action hover:bg-surface-card-muted transition-colors disabled:opacity-50"
						>
							Cancel
						</button>
						<button
							onClick={() => { setShowSubmitConfirm(false); handleSubmit() }}
							disabled={submitting}
							className="flex items-center gap-2 px-4 py-2 text-label-sm font-semibold text-white bg-action-primary hover:opacity-90 rounded-action transition-opacity disabled:opacity-60"
						>
							{submitting && <MiniSpinner />}
							Submit
						</button>
					</div>
				</div>
			</div>
		)}

		{/* Overnight event confirmation modal */}
		{overnightConfirm && (
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
				<div className="bg-surface-card rounded-action border border-border-default shadow-floating w-full max-w-sm p-6">
					<h2 className="text-label-lg font-semibold text-text-primary mb-2">Make this a multi-day event?</h2>
					<p className="text-body-sm text-text-secondary mb-6">
						{to12Hour(overnightConfirm.startTime)} to {to12Hour(overnightConfirm.endTime)} runs past midnight.
						Continuing will list this as a multi-day experience ending the day after your event date.
					</p>
					<div className="flex gap-3 justify-end">
						<button
							onClick={() => setOvernightConfirm(null)}
							className="px-4 py-2 text-label-sm font-medium text-text-primary border border-border-default rounded-action hover:bg-surface-card-muted transition-colors"
						>
							Cancel
						</button>
						<button
							onClick={confirmOvernight}
							className="px-4 py-2 text-label-sm font-semibold text-action-primary-text bg-action-primary hover:bg-action-primary-hover rounded-action transition-colors"
						>
							Make it multi-day
						</button>
					</div>
				</div>
			</div>
		)}
		</>
	)
}
