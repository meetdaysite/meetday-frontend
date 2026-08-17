"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import clsx from "clsx"
import { toast } from "sonner"
import { Dropdown } from "@/components/ui/Dropdown"
import { Icon } from "@/components/ui/Icon"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import { getMyEventDetail, getCategories, reviseEvent, type Category, type EventRevision } from "@/lib/api"
import { Skeleton } from "@/components/ui/Skeleton"
import { getApiErrorMessage } from "@/lib/errors"
import { uploadEventMedia } from "@/lib/uploadMedia"
import {
	LANGUAGE_OPTIONS,
	EVENT_TYPE_OPTIONS,
	defaultFormData,
	eventToFormData,
	buildRevisionPayload,
	venueFieldsChanged,
	validateStep1,
	validateStep3,
	to12Hour,
	formatEventDateRange,
	type FormData,
	type Errors,
} from "@/lib/eventForm"
import {
	inpCls,
	taCls,
	FieldLabel,
	ErrMsg,
	MiniSpinner,
	PillInput,
} from "@/components/eventForm/shared"
import { VenueAutocompleteInput } from "@/components/eventForm/AddressAutocompleteInput"

import ArrowLeftSvg from "@/icons/outlined/arrow-left.svg"
import CameraAddSvg from "@/icons/outlined/camera-add.svg"
import DangerTriangleSvg from "@/icons/outlined/danger-triangle.svg"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSubmittedAt(iso: string): string {
	const d = new Date(iso)
	if (isNaN(d.getTime())) return iso
	return d.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })
}

const VISIBILITY_LABEL: Record<string, string> = {
	PUBLIC: "Public Searchable",
	PRIVATE: "Private",
}

const REFUND_LABEL: Record<string, string> = {
	NO_REFUND: "No Refund",
	FULL: "Full Refund",
	PARTIAL: "Partial Refund",
}

function validateRevision(f: FormData, venueTouched: boolean): Errors {
	const e: Errors = {
		...validateStep1(f),
		...validateStep3({ hasCover: !!f.coverUrl, hasGallery: f.gallerySlots.some((s) => s !== "") }),
	}
	if (!f.venueName.trim()) e.venueName = "Venue name is required."
	if (!f.fullAddress.trim()) e.fullAddress = "Full address is required."
	if (!e.venueName && venueTouched && (f.latitude == null || f.longitude == null)) {
		e.venueName = "Re-select the venue from the suggestions so we can capture its coordinates."
	}
	return e
}

// ─── Section card wrapper ─────────────────────────────────────────────────────

function SectionCard({
	title,
	subtitle,
	children,
}: {
	title: string
	subtitle?: string
	children: React.ReactNode
}) {
	return (
		<div className="border border-border-default rounded-action bg-surface-card overflow-hidden">
			<div className="px-6 py-4 border-b border-border-default">
				<h2 className="text-label-md font-semibold text-text-primary">{title}</h2>
				{subtitle && <p className="text-caption text-text-tertiary mt-0.5">{subtitle}</p>}
			</div>
			<div className="p-6 flex flex-col gap-4">{children}</div>
		</div>
	)
}

function LockedRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between gap-3 py-2 border-b border-border-default last:border-b-0">
			<span className="text-body-sm text-text-secondary">{label}</span>
			<span className="text-body-sm font-medium text-text-primary text-right">{value}</span>
		</div>
	)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReviseEventPage() {
	const params = useParams()
	const router = useRouter()
	const id = params.id as string

	const [formData, setFormData] = useState<FormData>(defaultFormData)
	const [initialFormData, setInitialFormData] = useState<FormData>(defaultFormData)
	const [loading, setLoading] = useState(true)
	const [loadError, setLoadError] = useState<string | null>(null)
	const [categories, setCategories] = useState<Category[]>([])
	const [categoriesLoading, setCategoriesLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [validated, setValidated] = useState(false)
	const [pendingRevision, setPendingRevision] = useState<EventRevision | null>(null)

	const [coverUploading, setCoverUploading] = useState(false)
	const [galleryUploading, setGalleryUploading] = useState<boolean[]>(Array(6).fill(false))
	const [isDraggingOver, setIsDraggingOver] = useState(false)

	const coverFileRef = useRef<HTMLInputElement>(null)
	const galleryFileRef = useRef<HTMLInputElement>(null)
	const targetSlotRef = useRef<number>(0)

	useEffect(() => {
		Promise.all([getMyEventDetail(id), getCategories()])
			.then(([event, cats]) => {
				if (event.status !== "PUBLISHED") {
					router.replace(`/community/dashboard/events/${id}`)
					return
				}
				const fd = eventToFormData(event)
				setFormData(fd)
				setInitialFormData(fd)
				setCategories(cats)
				setPendingRevision(event.pendingRevision ?? null)
			})
			.catch((err) => setLoadError(getApiErrorMessage(err)))
			.finally(() => {
				setLoading(false)
				setCategoriesLoading(false)
			})
	}, [id, router])

	function set<K extends keyof FormData>(key: K, value: FormData[K]) {
		setFormData((prev) => ({ ...prev, [key]: value }))
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
	const categoryOptions = useMemo(() => categories.map((c) => ({ value: c.id, label: c.name })), [categories])
	const availableLanguages = LANGUAGE_OPTIONS.filter((o) => !formData.languages.includes(o.value))

	const venueTouched = venueFieldsChanged(initialFormData, formData)
	const revisionPayload = useMemo(
		() => buildRevisionPayload(initialFormData, formData),
		[initialFormData, formData],
	)
	const hasChanges = Object.keys(revisionPayload).length > 0

	const errors: Errors = useMemo(
		() => (validated ? validateRevision(formData, venueTouched) : {}),
		[validated, formData, venueTouched],
	)

	async function handleSubmit() {
		setValidated(true)
		const errs = validateRevision(formData, venueTouched)
		if (Object.keys(errs).length > 0) {
			toast.error("Please fix the errors before submitting.")
			const firstErrId = Object.keys(errs)[0]
			document.getElementById(firstErrId)?.scrollIntoView({ behavior: "smooth", block: "center" })
			return
		}
		if (!hasChanges) {
			toast.error("No changes to submit.")
			return
		}
		setSaving(true)
		try {
			await reviseEvent(id, revisionPayload)
			toast.success("Changes submitted for review.")
			router.push(`/community/dashboard/events/${id}`)
		} catch (err) {
			toast.error(getApiErrorMessage(err))
		} finally {
			setSaving(false)
		}
	}

	// ─── Upload handlers ────────────────────────────────────────────────────

	async function handleCoverFile(file: File) {
		if (!file.type.startsWith("image/")) return
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
		if (formData.coverUrl.startsWith("blob:")) URL.revokeObjectURL(formData.coverUrl)
		set("coverUrl", "")
		set("coverKey", "")
	}

	function removeGallerySlot(i: number) {
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
						{Array.from({ length: 3 }).map((_, i) => (
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
						onClick={() => router.push(`/community/dashboard/events/${id}`)}
						className="px-4 py-2 text-label-sm font-medium text-text-secondary border border-border-default rounded-action hover:bg-surface-card-muted transition-colors"
					>
						Back to Event
					</button>
				</div>
			</div>
		)
	}

	const submitBtn = (
		<button
			type="button"
			onClick={handleSubmit}
			disabled={saving || isMediaUploading || (validated && !hasChanges)}
			className="flex items-center gap-2 px-5 py-2 bg-action-primary text-action-primary-text text-label-sm font-semibold rounded-action hover:bg-action-primary-hover transition-colors disabled:opacity-50"
		>
			{saving && <MiniSpinner />}
			Submit for Review
		</button>
	)

	return (
		<div className="flex flex-col min-h-screen">
			<DashboardTopBar />

			{/* Action bar */}
			<div className="flex items-center justify-between px-6 lg:px-8 py-3 bg-surface-card border-b border-border-default sticky top-0 z-20">
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => router.push(`/community/dashboard/events/${id}`)}
						className="p-1.5 rounded-action hover:bg-surface-card-muted transition-colors text-text-secondary hover:text-text-primary"
						aria-label="Back to event"
					>
						<ArrowLeftSvg className="size-5" aria-hidden />
					</button>
					<h2 className="text-label-md font-semibold text-text-primary">Edit Published Experience</h2>
					<span className="text-caption font-semibold px-2.5 py-0.5 rounded-badge bg-green-50 text-green-700">
						Published
					</span>
				</div>
				<div className="flex items-center gap-3">{submitBtn}</div>
			</div>

			{/* Form */}
			<div className="flex-1 px-6 lg:px-10 py-8 bg-surface-page">
				<div className="max-w-4xl mx-auto flex flex-col gap-5">

					{/* Review notice */}
					<div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-action">
						<Icon as={DangerTriangleSvg} size="md" color="info" className="shrink-0 mt-0.5" />
						<p className="text-body-sm text-blue-700">
							Changes to a published event are reviewed by our team before they go live. Your event
							stays public with its current details until the changes are approved.
						</p>
					</div>

					{/* Pending revision overwrite warning */}
					{pendingRevision && (
						<div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-action">
							<Icon as={DangerTriangleSvg} size="md" color="warning" className="shrink-0 mt-0.5" />
							<p className="text-body-sm text-amber-700">
								You already have edits submitted on {formatSubmittedAt(pendingRevision.createdAt)}{" "}
								awaiting review. Submitting again here will replace those pending edits — only the
								latest submission is kept for review.
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

						<div className="flex flex-col gap-1.5">
							<FieldLabel required>Special Instructions</FieldLabel>
							<textarea
								id="instructions"
								rows={4}
								maxLength={3000}
								value={formData.instructions}
								onChange={(e) => set("instructions", e.target.value)}
								className={taCls(!!errors.instructions)}
							/>
							<div className="flex items-center justify-between gap-2">
								<ErrMsg msg={errors.instructions} />
								<p className="text-caption text-text-muted ml-auto">{formData.instructions.length}/3000</p>
							</div>
						</div>
					</SectionCard>

					{/* ── 2. Venue ── */}
					<SectionCard
						title="Venue"
						subtitle="Changing the venue notifies everyone who already booked, once an admin approves it"
					>
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
							<input
								type="text"
								value={formData.fullAddress}
								onChange={(e) => set("fullAddress", e.target.value)}
								onBlur={handleAddressBlur}
								className={inpCls(!!errors.fullAddress)}
							/>
							<ErrMsg msg={errors.fullAddress} />
						</div>

						<div className="flex flex-col gap-1.5">
							<FieldLabel>City</FieldLabel>
							<input
								type="text"
								value={formData.city}
								onChange={(e) => set("city", e.target.value)}
								className={inpCls(false)}
							/>
						</div>

						{venueTouched && (
							<p className="text-caption text-amber-600 bg-amber-50 border border-amber-200 rounded-action px-3 py-2">
								Changing the venue will notify everyone who already booked, once an admin approves it.
								The event date and time stay the same.
							</p>
						)}
					</SectionCard>

					{/* ── 3. Media ── */}
					<SectionCard title="Media" subtitle="Cover and gallery images for your event">
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

					{/* ── 4. Locked details ── */}
					<SectionCard title="Locked Details" subtitle="These can't be changed on a published event">
						<LockedRow label="Event Date" value={formatEventDateRange(formData.eventDate, formData.endDate, "long")} />
						<LockedRow
							label="Time"
							value={formData.startTime && formData.endTime
								? `${to12Hour(formData.startTime)} – ${to12Hour(formData.endTime)}`
								: "—"}
						/>
						<LockedRow
							label="Tickets"
							value={formData.tickets.length > 0
								? formData.tickets.map((t) => `${t.name} (₹${t.price})`).join(", ")
								: "—"}
						/>
						<LockedRow
							label="Refund Policy"
							value={formData.refundType ? (REFUND_LABEL[formData.refundType] ?? formData.refundType) : "—"}
						/>
						<LockedRow
							label="Visibility"
							value={formData.visibility ? (VISIBILITY_LABEL[formData.visibility] ?? formData.visibility) : "—"}
						/>
						<LockedRow label="Age Restriction" value={formData.ageRestriction || "—"} />
					</SectionCard>

					{/* Bottom action row */}
					<div className="flex items-center justify-end gap-3 pb-8">
						{submitBtn}
					</div>

				</div>
			</div>
		</div>
	)
}
