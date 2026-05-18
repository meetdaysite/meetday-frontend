"use client"

import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type Dispatch,
	type SetStateAction,
} from "react"
import { useRouter } from "next/navigation"
import clsx from "clsx"
import { toast } from "sonner"
import { Icon } from "@/components/ui/Icon"
import { Dropdown } from "@/components/ui/Dropdown"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import {
	createEventDraft,
	updateEventDraft,
	submitEventForReview,
	getCategories,
	getMyEventDetail,
	type Category,
} from "@/lib/api"
import { uploadEventMedia } from "@/lib/uploadMedia"
import {
	LANGUAGE_OPTIONS,
	EVENT_TYPE_OPTIONS,
	defaultFormData,
	eventToFormData,
	buildPayload,
	validateStep1,
	validateStep2,
	validateStep3,
	validateStep4,
	validateStep5,
	type FormData,
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
import { AddressAutocompleteInput, VenueAutocompleteInput } from "@/components/eventForm/AddressAutocompleteInput"
import { TicketListEditor } from "@/components/eventForm/TicketListEditor"

import FileTextSvg from "@/icons/outlined/file-text.svg"
import MapPointRotateSvg from "@/icons/outlined/map-point-rotate.svg"
import GalleryWideSvg from "@/icons/outlined/gallery-wide.svg"
import TicketSvg from "@/icons/outlined/ticket.svg"
import SettingsSvg from "@/icons/outlined/settings.svg"
import AltArrowRightSvg from "@/icons/outlined/alt-arrow-right.svg"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import ClockCircleSvg from "@/icons/outlined/clock-circle.svg"
import CameraAddSvg from "@/icons/outlined/camera-add.svg"

import type { ComponentType, SVGProps } from "react"

// ─── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
	{ id: 1, title: "Basic Info",       subtitle: "Name and describe your event",    icon: FileTextSvg       as ComponentType<SVGProps<SVGSVGElement>> },
	{ id: 2, title: "Date & Location",  subtitle: "When and where it happens",       icon: MapPointRotateSvg as ComponentType<SVGProps<SVGSVGElement>> },
	{ id: 3, title: "Media Upload",     subtitle: "Add cover and gallery images",    icon: GalleryWideSvg    as ComponentType<SVGProps<SVGSVGElement>> },
	{ id: 4, title: "Ticket Types",     subtitle: "Set up pricing and capacity",     icon: TicketSvg         as ComponentType<SVGProps<SVGSVGElement>> },
	{ id: 5, title: "Setting & Review", subtitle: "Finalize and submit for review",  icon: SettingsSvg       as ComponentType<SVGProps<SVGSVGElement>> },
]

// ─── Centralised form data ─────────────────────────────────────────────────────

const DRAFT_KEY = "meetday_create_draft"
const DRAFT_ID_KEY = "meetday_create_draft_id"

// ─── Create-specific style constants ──────────────────────────────────────────

const saveContinueCls = "flex items-center gap-2 px-6 py-3 bg-surface-inverse text-text-inverse rounded-action text-label-md font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
const backBtnCls = "px-5 py-2.5 text-label-md text-text-secondary border border-border-default rounded-action hover:bg-surface-card-muted transition-colors"

// ─── Step circle indicator ─────────────────────────────────────────────────────

function StepCircle({ state, icon: IconSvg }: { state: "completed" | "active" | "upcoming"; icon: ComponentType<SVGProps<SVGSVGElement>> }) {
	if (state === "completed")
		return <div className="size-8 rounded-full bg-action-primary flex items-center justify-center shrink-0"><Icon as={IconSvg} size="sm" color="inverse" /></div>
	if (state === "active")
		return <div className="size-8 rounded-full border-2 border-text-primary flex items-center justify-center shrink-0"><Icon as={IconSvg} size="sm" color="primary" /></div>
	return <div className="size-8 rounded-full border-2 border-border-subtle flex items-center justify-center shrink-0"><Icon as={IconSvg} size="sm" color="muted" /></div>
}

// ─── Experience Builder sidebar ────────────────────────────────────────────────

function ExperienceBuilderSidebar({ currentStep }: { currentStep: number }) {
	return (
		<aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-border-subtle bg-surface-card px-6 py-8 gap-6 min-h-full">
			<div>
				<h2 className="text-label-md font-semibold text-text-primary">Experience Builder</h2>
				<p className="text-caption text-text-tertiary mt-1">Complete all steps to submit for review</p>
			</div>
			<div className="flex flex-col gap-5">
				{STEPS.map(({ id, title, subtitle, icon }) => {
					const state: "completed" | "active" | "upcoming" = id < currentStep ? "completed" : id === currentStep ? "active" : "upcoming"
					return (
						<div key={id} className="flex items-start gap-3">
							<StepCircle state={state} icon={icon} />
							<div className="pt-0.5">
								<p className={`text-label-sm font-semibold ${state === "upcoming" ? "text-text-muted" : "text-text-primary"}`}>{title}</p>
								<p className={`text-caption mt-0.5 ${state === "upcoming" ? "text-text-muted" : "text-text-tertiary"}`}>{subtitle}</p>
							</div>
						</div>
					)
				})}
			</div>
		</aside>
	)
}

// ─── Step 1: Basic Information ─────────────────────────────────────────────────

function Step1BasicInfo({
	formData, setFormData, onNext, registerValidate, categories, categoriesLoading,
}: {
	formData: FormData
	setFormData: Dispatch<SetStateAction<FormData>>
	onNext: () => void
	registerValidate: (fn: () => boolean) => void
	categories: Category[]
	categoriesLoading: boolean
}) {
	const [validated, setValidated] = useState(false)

	const { title, desc, category, eventType, languages, tags, whatToExpect, whoShouldAttend } = formData

	const errors = useMemo(
		() => validated ? validateStep1({ title, desc, category, eventType, whatToExpect, whoShouldAttend }) : {},
		[validated, title, desc, category, eventType, whatToExpect, whoShouldAttend],
	)

	const validate = useCallback(() => {
		setValidated(true)
		return Object.keys(validateStep1({ title, desc, category, eventType, whatToExpect, whoShouldAttend })).length === 0
	}, [title, desc, category, eventType, whatToExpect, whoShouldAttend])

	useEffect(() => { registerValidate(validate) }, [validate, registerValidate])

	function set<K extends keyof FormData>(key: K, value: FormData[K]) {
		setFormData((prev) => ({ ...prev, [key]: value }))
	}

	const categoryOptions = useMemo(
		() => categories.map((c) => ({ value: c.id, label: c.name })),
		[categories],
	)

	const availableLanguages = LANGUAGE_OPTIONS.filter((o) => !languages.includes(o.value))

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-heading-sm font-semibold text-text-primary">Basic Information</h1>
				<p className="text-body-sm text-text-secondary mt-1">Let&apos;s start with the core details of your experience.</p>
			</div>

			{/* Event Title */}
			<div className="flex flex-col gap-1.5">
				<FieldLabel required>Event Title</FieldLabel>
				<input type="text" maxLength={100} value={title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Summer Music Festival 2025" className={inpCls(!!errors.title)} />
				<div className="flex items-center justify-between gap-2">
					<ErrMsg msg={errors.title} />
					<p className="text-caption text-text-muted ml-auto">{title.length}/100</p>
				</div>
			</div>

			{/* Description */}
			<div className="flex flex-col gap-1.5">
				<FieldLabel required>Description</FieldLabel>
				<textarea rows={5} maxLength={3000} value={desc} onChange={(e) => set("desc", e.target.value)} placeholder="Describe your event in detail..." className={taCls(!!errors.desc)} />
				<div className="flex items-center justify-between gap-2">
					<ErrMsg msg={errors.desc} />
					<p className="text-caption text-text-muted ml-auto">{desc.length}/3000</p>
				</div>
			</div>

			{/* Category + Event Type */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div className="flex flex-col gap-1.5">
					<FieldLabel required>Category</FieldLabel>
					<Dropdown
						value={category}
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
						value={eventType}
						onChange={(v) => set("eventType", v)}
						error={!!errors.eventType}
						placeholder="Select Event Type"
						options={EVENT_TYPE_OPTIONS}
					/>
					<ErrMsg msg={errors.eventType} />
				</div>
			</div>

			{/* Languages (multi-select) */}
			<div className="flex flex-col gap-1.5">
				<FieldLabel>Languages</FieldLabel>
				<Dropdown
					value=""
					onChange={(v) => {
						if (v && !languages.includes(v)) set("languages", [...languages, v])
					}}
					placeholder="Add a language…"
					options={availableLanguages}
					disabled={availableLanguages.length === 0}
				/>
				{languages.length > 0 && (
					<div className="flex flex-wrap gap-1.5 mt-1">
						{languages.map((lang) => {
							const label = LANGUAGE_OPTIONS.find((o) => o.value === lang)?.label ?? lang
							return (
								<span key={lang} className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-card-muted rounded-badge text-caption text-text-primary">
									{label}
									<button type="button" onClick={() => set("languages", languages.filter((l) => l !== lang))} className="text-text-tertiary hover:text-text-primary leading-none" aria-label={`Remove ${lang}`}>×</button>
								</span>
							)
						})}
					</div>
				)}
			</div>

			{/* Tags */}
			<div className="flex flex-col gap-1.5">
				<FieldLabel>Tags / Keywords</FieldLabel>
				<PillInput values={tags} onChange={(v) => set("tags", v)} placeholder="Add tags…" />
			</div>

			{/* What to Expect */}
			<div className="flex flex-col gap-1.5">
				<FieldLabel required>What to Expect</FieldLabel>
				<PillInput values={whatToExpect} onChange={(v) => set("whatToExpect", v)} placeholder="e.g. Guided walk" />
				<ErrMsg msg={errors.whatToExpect} />
			</div>

			{/* Who Should Attend */}
			<div className="flex flex-col gap-1.5">
				<FieldLabel required>Who Should Attend</FieldLabel>
				<PillInput values={whoShouldAttend} onChange={(v) => set("whoShouldAttend", v)} placeholder="e.g. Photography enthusiasts" />
				<ErrMsg msg={errors.whoShouldAttend} />
			</div>

			<div className="flex justify-end pt-4">
				<button type="button" onClick={() => { if (validate()) onNext() }} className={saveContinueCls}>
					Save & Continue
					<AltArrowRightSvg className="size-4" aria-hidden />
				</button>
			</div>
		</div>
	)
}

// ─── Step 2: Date & Location ───────────────────────────────────────────────────

function Step2DateTime({
	formData, setFormData, onNext, onBack, registerValidate,
}: {
	formData: FormData
	setFormData: Dispatch<SetStateAction<FormData>>
	onNext: () => void
	onBack: () => void
	registerValidate: (fn: () => boolean) => void
}) {
	const [validated, setValidated] = useState(false)
	const { eventDate, startTime, endTime, venueName, fullAddress, city } = formData

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

	const errors = useMemo(
		() => validated ? validateStep2({ eventDate, startTime, endTime, venueName, fullAddress }) : {},
		[validated, eventDate, startTime, endTime, venueName, fullAddress],
	)

	const validate = useCallback(() => {
		setValidated(true)
		return Object.keys(validateStep2({ eventDate, startTime, endTime, venueName, fullAddress })).length === 0
	}, [eventDate, startTime, endTime, venueName, fullAddress])

	useEffect(() => { registerValidate(validate) }, [validate, registerValidate])

	function set<K extends keyof FormData>(key: K, value: FormData[K]) {
		setFormData((prev) => ({ ...prev, [key]: value }))
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-heading-sm font-semibold text-text-primary">Date & Location</h1>
				<p className="text-body-sm text-text-secondary mt-1">Specify when and where your experience will take place.</p>
			</div>

			<div className="border border-border-subtle rounded-card p-5 bg-surface-card flex flex-col gap-4">
				<h3 className="text-label-md font-semibold text-text-primary">Date & Time</h3>

				<div className="flex flex-col gap-1.5">
					<FieldLabel required>Event Date</FieldLabel>
					<div className={iconWrapCls(!!errors.eventDate)}>
						<Icon as={CalendarSvg} size="md" color="secondary" />
						<input type="date" value={eventDate} min={new Date().toISOString().split("T")[0]} onChange={(e) => set("eventDate", e.target.value)} className="flex-1 bg-transparent text-sm text-text-primary outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute" />
					</div>
					<ErrMsg msg={errors.eventDate} />
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="flex flex-col gap-1.5">
						<FieldLabel required>Start Time</FieldLabel>
						<div className={iconWrapCls(!!errors.startTime)}>
							<Icon as={ClockCircleSvg} size="md" color="secondary" />
							<input type="time" value={startTime} onChange={(e) => set("startTime", e.target.value)} className="flex-1 bg-transparent text-sm text-text-primary outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute" />
						</div>
						<ErrMsg msg={errors.startTime} />
					</div>
					<div className="flex flex-col gap-1.5">
						<FieldLabel required>End Time</FieldLabel>
						<div className={iconWrapCls(!!errors.endTime)}>
							<Icon as={ClockCircleSvg} size="md" color="secondary" />
							<input type="time" value={endTime} onChange={(e) => set("endTime", e.target.value)} className="flex-1 bg-transparent text-sm text-text-primary outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute" />
						</div>
						<ErrMsg msg={errors.endTime} />
					</div>
				</div>
			</div>

			<div className="border border-border-subtle rounded-card p-5 bg-surface-card flex flex-col gap-4">
				<h3 className="text-label-md font-semibold text-text-primary">Location Details</h3>

				<div className="flex flex-col gap-1.5">
					<FieldLabel required>Venue Name</FieldLabel>
					<VenueAutocompleteInput
						value={venueName}
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

				<div className="flex flex-col gap-1.5">
					<FieldLabel required>Full Address</FieldLabel>
					<AddressAutocompleteInput
						value={fullAddress}
						currentVenueName={venueName}
						error={!!errors.fullAddress}
						onChange={(v) => set("fullAddress", v)}
						onBlur={handleAddressBlur}
						onPlaceSelect={(fields) =>
							setFormData((prev) => ({
								...prev,
								fullAddress: fields.fullAddress,
								city: fields.city || prev.city,
								venueName: prev.venueName.trim() ? prev.venueName : fields.venueName,
								latitude: fields.latitude,
								longitude: fields.longitude,
							}))
						}
					/>
					<ErrMsg msg={errors.fullAddress} />
				</div>

				<div className="flex flex-col gap-1.5">
					<FieldLabel>City</FieldLabel>
					<input type="text" value={city} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Mumbai" className={inpCls(false)} />
				</div>
			</div>

			<div className="flex items-center justify-between pt-4">
				<button type="button" onClick={onBack} className={backBtnCls}>Back</button>
				<button type="button" onClick={() => { if (validate()) onNext() }} className={saveContinueCls}>
					Save & Continue
					<AltArrowRightSvg className="size-4" aria-hidden />
				</button>
			</div>
		</div>
	)
}

// ─── Step 3: Media Upload ──────────────────────────────────────────────────────

function Step3MediaUpload({
	formData, setFormData, onNext, onBack, registerValidate,
}: {
	formData: FormData
	setFormData: Dispatch<SetStateAction<FormData>>
	onNext: () => void
	onBack: () => void
	registerValidate: (fn: () => boolean) => void
}) {
	const [validated, setValidated] = useState(false)
	const [coverUploading, setCoverUploading] = useState(false)
	const [galleryUploading, setGalleryUploading] = useState<boolean[]>(Array(6).fill(false))
	const [isDraggingOver, setIsDraggingOver] = useState(false)

	const coverFileRef = useRef<HTMLInputElement>(null)
	const galleryFileRef = useRef<HTMLInputElement>(null)
	const targetSlotRef = useRef<number>(0)

	const { coverUrl, coverKey, gallerySlots, galleryKeys, galleryTypes } = formData
	const hasGallery = galleryKeys.some((k) => k !== "")

	const errors = useMemo(
		() => validated ? validateStep3({ coverKey, hasGallery }) : {},
		[validated, coverKey, hasGallery],
	)

	const validate = useCallback(() => {
		setValidated(true)
		return Object.keys(validateStep3({ coverKey, hasGallery })).length === 0
	}, [coverKey, hasGallery])

	useEffect(() => { registerValidate(validate) }, [validate, registerValidate])

	function set<K extends keyof FormData>(key: K, value: FormData[K]) {
		setFormData((prev) => ({ ...prev, [key]: value }))
	}

	async function handleCoverFile(file: File) {
		if (!file.type.startsWith("image/")) return
		// Show preview immediately
		if (coverUrl.startsWith("blob:")) URL.revokeObjectURL(coverUrl)
		const previewUrl = URL.createObjectURL(file)
		set("coverUrl", previewUrl)
		set("coverKey", "")
		setCoverUploading(true)
		try {
			const key = await uploadEventMedia(file, "COVER")
			set("coverKey", key)
		} catch {
			toast.error("Cover upload failed. Please try again.")
			set("coverUrl", "")
		} finally {
			setCoverUploading(false)
		}
	}

	async function handleGalleryFile(file: File, slotIndex: number) {
		const isVideo = file.type.startsWith("video/")
		if (!isVideo && !file.type.startsWith("image/")) return
		// Show preview
		const next = [...gallerySlots]
		if (next[slotIndex].startsWith("blob:")) URL.revokeObjectURL(next[slotIndex])
		next[slotIndex] = URL.createObjectURL(file)
		set("gallerySlots", next)
		const nextKeys = [...galleryKeys]
		nextKeys[slotIndex] = ""
		set("galleryKeys", nextKeys)
		const nextTypes = [...galleryTypes]
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
		} catch {
			toast.error(`Gallery slot ${slotIndex + 1} upload failed.`)
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
		if (coverUrl.startsWith("blob:")) URL.revokeObjectURL(coverUrl)
		set("coverUrl", "")
		set("coverKey", "")
	}

	function removeGallerySlot(i: number) {
		const next = [...gallerySlots]
		if (next[i].startsWith("blob:")) URL.revokeObjectURL(next[i])
		next[i] = ""
		set("gallerySlots", next)
		const keys = [...galleryKeys]
		keys[i] = ""
		set("galleryKeys", keys)
		const types = [...galleryTypes]
		types[i] = ""
		set("galleryTypes", types)
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-heading-sm font-semibold text-text-primary">Media Upload</h1>
				<p className="text-body-sm text-text-secondary mt-1">Upload images to showcase your event. Files are uploaded directly to secure storage.</p>
			</div>

			{/* Cover Image */}
			<div className="flex flex-col gap-3">
				<FieldLabel required>Cover Image</FieldLabel>
				<input
					ref={coverFileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
					onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverFile(f); e.target.value = "" }}
				/>
				<div
					onClick={() => !coverUploading && coverFileRef.current?.click()}
					onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true) }}
					onDragLeave={() => setIsDraggingOver(false)}
					onDrop={(e) => { e.preventDefault(); setIsDraggingOver(false); const f = e.dataTransfer.files[0]; if (f) handleCoverFile(f) }}
					className={clsx(
						"border-2 border-dashed rounded-card flex flex-col items-center justify-center gap-2 transition-colors overflow-hidden",
						coverUploading ? "cursor-wait opacity-70" : "cursor-pointer",
						coverUrl ? "aspect-video p-0" : "py-14",
						isDraggingOver
							? "border-border-focused bg-surface-brand-soft"
							: "border-border-default bg-surface-card-muted hover:bg-surface-card",
					)}
				>
					{coverUrl ? (
						<div className="relative w-full h-full">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={coverUrl} alt="Cover preview" className="w-full h-full object-cover" loading="lazy" />
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

			{/* Gallery Images & Videos */}
			<div className="flex flex-col gap-3">
				<FieldLabel required>Gallery Images & Videos</FieldLabel>
				<p className="text-caption text-text-muted -mt-1">Click any slot to pick an image or video from your device.</p>
				<input
					ref={galleryFileRef} type="file" accept="image/jpeg,image/png,image/webp,video/*" className="hidden"
					onChange={(e) => { const f = e.target.files?.[0]; if (f) handleGalleryFile(f, targetSlotRef.current); e.target.value = "" }}
				/>
				<ErrMsg msg={errors.gallery} />
				<div className="grid grid-cols-3 gap-3">
					{gallerySlots.map((img, i) => (
						<div
							key={i}
							onClick={() => { if (!galleryUploading[i]) { targetSlotRef.current = i; galleryFileRef.current?.click() } }}
							className={clsx(
								"relative aspect-video rounded-card border-2 border-dashed border-border-default bg-surface-card-muted flex items-center justify-center transition-colors overflow-hidden",
								galleryUploading[i] ? "cursor-wait opacity-70" : "cursor-pointer hover:bg-surface-card",
							)}
						>
							{img ? (
								<>
									{galleryTypes[i] === "VIDEO" ? (
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

			<div className="flex items-center justify-between pt-4">
				<button type="button" onClick={onBack} className={backBtnCls}>Back</button>
				<button type="button" onClick={() => { if (validate()) onNext() }} className={saveContinueCls} disabled={coverUploading || galleryUploading.some(Boolean)}>
					{(coverUploading || galleryUploading.some(Boolean)) && <MiniSpinner />}
					Save & Continue
					<AltArrowRightSvg className="size-4" aria-hidden />
				</button>
			</div>
		</div>
	)
}

// ─── Step 4: Ticket Types ──────────────────────────────────────────────────────

function Step4TicketTypes({
	formData, setFormData, onNext, onBack, registerValidate,
}: {
	formData: FormData
	setFormData: Dispatch<SetStateAction<FormData>>
	onNext: () => void
	onBack: () => void
	registerValidate: (fn: () => boolean) => void
}) {
	const [validated, setValidated] = useState(false)
	const { tickets } = formData

	const errors = useMemo(
		() => validated ? validateStep4({ tickets }) : {},
		[validated, tickets],
	)

	const validate = useCallback(() => {
		setValidated(true)
		return Object.keys(validateStep4({ tickets })).length === 0
	}, [tickets])

	useEffect(() => { registerValidate(validate) }, [validate, registerValidate])

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-heading-sm font-semibold text-text-primary">Ticket Types</h1>
					<p className="text-body-sm text-text-secondary mt-1">Define pricing and capacity for your event tiers.</p>
				</div>
			</div>

			<TicketListEditor
				tickets={tickets}
				onChange={(updated) => setFormData((prev) => ({ ...prev, tickets: updated }))}
				listError={errors.tickets}
			/>

			<div className="flex items-center justify-between pt-4">
				<button type="button" onClick={onBack} className={backBtnCls}>Back</button>
				<button type="button" onClick={() => { if (validate()) onNext() }} className={saveContinueCls}>
					Save & Continue
					<AltArrowRightSvg className="size-4" aria-hidden />
				</button>
			</div>
		</div>
	)
}

// ─── Step 5: Settings & Review ─────────────────────────────────────────────────

function Step5SettingsReview({
	formData, setFormData, onBack, registerValidate, onSubmit, submitting,
}: {
	formData: FormData
	setFormData: Dispatch<SetStateAction<FormData>>
	onBack: () => void
	registerValidate: (fn: () => boolean) => void
	onSubmit: () => void
	submitting: boolean
}) {
	const [validated, setValidated] = useState(false)
	const { visibility, ageRestriction, refundType, cutoffHours, refundPercent, instructions } = formData

	const errors = useMemo(
		() => validated ? validateStep5({ visibility, ageRestriction, refundType, cutoffHours, refundPercent, instructions }) : {},
		[validated, visibility, ageRestriction, refundType, cutoffHours, refundPercent, instructions],
	)

	const validate = useCallback(() => {
		setValidated(true)
		return Object.keys(validateStep5({ visibility, ageRestriction, refundType, cutoffHours, refundPercent, instructions })).length === 0
	}, [visibility, ageRestriction, refundType, cutoffHours, refundPercent, instructions])

	useEffect(() => { registerValidate(validate) }, [validate, registerValidate])

	function set<K extends keyof FormData>(key: K, value: FormData[K]) {
		setFormData((prev) => ({ ...prev, [key]: value }))
	}

	const isPartial = refundType === "PARTIAL"

	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5 items-start">
				{/* Event Settings */}
				<div className="border border-border-subtle rounded-card bg-surface-card p-5 flex flex-col gap-5">
					<h2 className="text-label-md font-semibold text-text-primary">Event Settings</h2>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="flex flex-col gap-1.5">
							<FieldLabel required>Visibility</FieldLabel>
							<Dropdown
								value={visibility}
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
								value={ageRestriction}
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
							value={refundType}
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
									<input type="number" value={cutoffHours} onChange={(e) => set("cutoffHours", e.target.value)} placeholder="24" min={0} className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none" />
									<span className="text-sm text-text-muted shrink-0">hours</span>
								</div>
								<ErrMsg msg={errors.cutoffHours} />
							</div>
							<div className="flex flex-col gap-1.5">
								<FieldLabel required>Refund Percent</FieldLabel>
								<div className={iconWrapCls(!!errors.refundPercent)}>
									<input type="number" value={refundPercent} onChange={(e) => set("refundPercent", e.target.value)} placeholder="50" min={0} max={100} className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none" />
									<span className="text-sm text-text-muted shrink-0">%</span>
								</div>
								<ErrMsg msg={errors.refundPercent} />
							</div>
						</div>
					)}

					<div className="flex flex-col gap-1.5">
						<FieldLabel required>Special Instructions</FieldLabel>
						<textarea rows={5} maxLength={3000} value={instructions} onChange={(e) => set("instructions", e.target.value)} placeholder="Any special notes for your attendees…" className={taCls(!!errors.instructions)} />
						<div className="flex items-center justify-between gap-2">
							<ErrMsg msg={errors.instructions} />
							<p className="text-caption text-text-muted ml-auto">{instructions.length}/3000</p>
						</div>
					</div>
				</div>

				{/* Summary panel */}
				<div className="border border-border-subtle rounded-card bg-surface-card p-5 flex flex-col gap-4">
					<h2 className="text-label-md font-semibold text-text-primary">Summary</h2>
					<div className="w-full aspect-video rounded-card bg-surface-card-muted overflow-hidden">
						{formData.coverUrl && (
							// eslint-disable-next-line @next/next/no-img-element
							<img src={formData.coverUrl} alt="Cover" className="w-full h-full object-cover" loading="lazy" />
						)}
					</div>
					<div className="flex flex-col divide-y divide-border-subtle">
						{[
							{ label: "Title",    value: formData.title || "—" },
							{ label: "Date",     value: formData.eventDate || "—" },
							{ label: "Location", value: formData.venueName || "—" },
						].map(({ label, value }) => (
							<div key={label} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
								<span className="text-caption text-text-tertiary shrink-0">{label}</span>
								<span className="text-caption font-semibold text-text-primary text-right">{value}</span>
							</div>
						))}
					</div>
					<div className="border-t border-border-subtle pt-3 flex flex-col gap-2.5">
						<div className="flex items-start justify-between gap-3">
							<span className="text-caption text-text-tertiary shrink-0">Ticket Types</span>
							<span className="text-caption font-semibold text-text-primary">
								{formData.tickets.length > 0 ? `${formData.tickets.length} type${formData.tickets.length > 1 ? "s" : ""}` : "—"}
							</span>
						</div>
						<div className="flex items-start justify-between gap-3">
							<span className="text-caption text-text-tertiary shrink-0">Total Capacity</span>
							<span className="text-caption font-semibold text-text-primary">
								{formData.tickets.length > 0
									? formData.tickets.reduce((s, t) => s + t.totalCapacity, 0).toLocaleString("en-IN")
									: "—"}
							</span>
						</div>
					</div>
				</div>
			</div>

			<div className="flex items-center justify-between pt-2">
				<button type="button" onClick={onBack} className={backBtnCls}>Back</button>
				<button
					type="button"
					disabled={submitting}
					onClick={() => { if (validate()) onSubmit() }}
					className="flex items-center gap-2 px-6 py-3 bg-action-primary text-action-primary-text rounded-action text-label-md font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
				>
					{submitting && <MiniSpinner />}
					Submit for Review
					<AltArrowRightSvg className="size-4" aria-hidden />
				</button>
			</div>
		</div>
	)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreateExperiencePage() {
	const router = useRouter()
	const [currentStep, setCurrentStep] = useState(1)
	const [formData, setFormData] = useState<FormData>(() => {
		try {
			const saved = localStorage.getItem(DRAFT_KEY)
			if (saved) return { ...defaultFormData, ...JSON.parse(saved) } as FormData
		} catch { /* ignore */ }
		return defaultFormData
	})
	const [draftId, setDraftId] = useState<string | null>(null)
	const [draftSaved, setDraftSaved] = useState(false)
	const [submitting, setSubmitting] = useState(false)
	const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
	const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
	const [categories, setCategories] = useState<Category[]>([])
	const [categoriesLoading, setCategoriesLoading] = useState(true)
	const stepValidateRef = useRef<() => boolean>(() => true)

	// On mount: load existing saved draft only — never create one automatically
	useEffect(() => {
		const savedId = localStorage.getItem(DRAFT_ID_KEY)
		if (savedId) {
			getMyEventDetail(savedId)
				.then((event) => {
					if (event.status !== "DRAFT") {
						localStorage.removeItem(DRAFT_ID_KEY)
						localStorage.removeItem(DRAFT_KEY)
						setFormData(defaultFormData)
						return
					}
					setDraftId(event.id)
					setFormData(eventToFormData(event))
				})
				.catch(() => {
					localStorage.removeItem(DRAFT_ID_KEY)
				})
		}

		getCategories()
			.then((cats) => setCategories(cats))
			.catch(() => {})
			.finally(() => setCategoriesLoading(false))
	}, [])

	// Persist form to localStorage on every change
	useEffect(() => {
		try { localStorage.setItem(DRAFT_KEY, JSON.stringify(formData)) } catch { /* ignore */ }
	}, [formData])

	function registerValidate(fn: () => boolean) {
		stepValidateRef.current = fn
	}

	function goNext() { setCurrentStep((s) => Math.min(s + 1, 5)) }
	function goBack() { setCurrentStep((s) => Math.max(s - 1, 1)) }

	function handleTopNext() {
		if (stepValidateRef.current()) goNext()
	}

	async function saveDraft() {
		try {
			localStorage.setItem(DRAFT_KEY, JSON.stringify(formData))
			if (draftId) {
				await updateEventDraft(draftId, buildPayload(formData))
			} else {
				const event = await createEventDraft(buildPayload(formData))
				setDraftId(event.id)
				localStorage.setItem(DRAFT_ID_KEY, event.id)
			}
			setDraftSaved(true)
			setTimeout(() => setDraftSaved(false), 2000)
		} catch {
			toast.error("Failed to save draft.")
		}
	}

	async function handleSubmit() {
		setSubmitting(true)
		try {
			let id = draftId
			if (!id) {
				const event = await createEventDraft(buildPayload(formData))
				id = event.id
				setDraftId(id)
				localStorage.setItem(DRAFT_ID_KEY, id)
			} else {
				await updateEventDraft(id, buildPayload(formData))
			}
			await submitEventForReview(id)
			localStorage.removeItem(DRAFT_KEY)
			localStorage.removeItem(DRAFT_ID_KEY)
			toast.success("Event submitted for review!")
			router.push("/dashboard/events")
		} catch {
			toast.error("Submission failed. Please try again.")
			setSubmitting(false)
		}
	}

	function requestSubmit() { setShowSubmitConfirm(true) }

	function handleLeave() {
		const hasData = !!(formData.title || formData.desc || formData.venueName || formData.coverKey || formData.tickets.length > 0)
		if (hasData && !draftId) {
			setShowLeaveConfirm(true)
		} else {
			router.push("/dashboard/events")
		}
	}

	async function handleSaveAndLeave() {
		await saveDraft()
		router.push("/dashboard/events")
	}

	const isLastStep = currentStep === 5
	const sharedProps = { formData, setFormData }

	return (
		<>
		<div className="flex flex-col min-h-screen">
			<DashboardTopBar />

			{/* Action bar */}
			<div className="flex items-center justify-between px-6 lg:px-8 py-3 bg-surface-card border-b border-border-subtle">
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={handleLeave}
						className="p-1.5 rounded-action hover:bg-surface-card-muted transition-colors text-text-secondary hover:text-text-primary"
						aria-label="Close"
					>
						<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
							<path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
						</svg>
					</button>
					<h2 className="text-label-md font-semibold text-text-primary">Create New Experience</h2>
				</div>

				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={saveDraft}
						className="flex items-center gap-1.5 px-4 py-2 text-label-sm text-text-secondary border border-border-default rounded-action hover:bg-surface-card-muted transition-colors"
					>
						<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
							<path d="M13.333 10v2.667A1.333 1.333 0 0 1 12 14H4a1.333 1.333 0 0 1-1.333-1.333V10M10.667 5.333 8 2.667 5.333 5.333M8 2.667v8" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
						{draftSaved ? "Saved!" : "Save Draft"}
					</button>

					{!isLastStep && (
						<button
							type="button"
							onClick={handleTopNext}
							className="flex items-center gap-2 px-5 py-2 bg-surface-inverse text-text-inverse text-label-sm font-semibold rounded-action hover:opacity-90 transition-opacity"
						>
							Next step
							<AltArrowRightSvg className="size-4" aria-hidden />
						</button>
					)}
				</div>
			</div>

			{/* Body */}
			<div className="flex flex-1">
				<ExperienceBuilderSidebar currentStep={currentStep} />

				<div className="flex-1 px-6 lg:px-10 py-8 overflow-y-auto bg-surface-page">
					<div className="relative max-w-4xl">
						<div
							className="absolute top-0 right-0 w-40 h-40 opacity-30 pointer-events-none"
							style={{ backgroundImage: "radial-gradient(circle, var(--color-border-default) 1.5px, transparent 1.5px)", backgroundSize: "16px 16px" }}
							aria-hidden
						/>
						<div className="relative">
							{currentStep === 1 && (
								<Step1BasicInfo
									{...sharedProps}
									onNext={goNext}
									registerValidate={registerValidate}
									categories={categories}
									categoriesLoading={categoriesLoading}
								/>
							)}
							{currentStep === 2 && (
								<Step2DateTime
									{...sharedProps}
									onNext={goNext}
									onBack={goBack}
									registerValidate={registerValidate}
								/>
							)}
							{currentStep === 3 && (
								<Step3MediaUpload
									{...sharedProps}
									onNext={goNext}
									onBack={goBack}
									registerValidate={registerValidate}
								/>
							)}
							{currentStep === 4 && (
								<Step4TicketTypes
									{...sharedProps}
									onNext={goNext}
									onBack={goBack}
									registerValidate={registerValidate}
								/>
							)}
							{currentStep === 5 && (
								<Step5SettingsReview
									{...sharedProps}
									onBack={goBack}
									registerValidate={registerValidate}
									onSubmit={requestSubmit}
									submitting={submitting}
								/>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>

		{/* Submit confirmation modal */}
		{showSubmitConfirm && (
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
				<div className="bg-surface-card rounded-card border border-border-default shadow-floating w-full max-w-sm p-6">
					<h2 className="text-label-lg font-semibold text-text-primary mb-2">Submit for Review?</h2>
					<p className="text-body-sm text-text-secondary mb-6">
						Once submitted, your event will be sent to the team for review. You won&apos;t be able to edit it until a decision is made.
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

		{/* Leave confirmation modal */}
		{showLeaveConfirm && (
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
				<div className="bg-surface-card rounded-card border border-border-default shadow-floating w-full max-w-sm p-6">
					<h2 className="text-label-lg font-semibold text-text-primary mb-2">Leave without saving?</h2>
					<p className="text-body-sm text-text-secondary mb-6">
						Your progress is only saved locally. Save as a draft to keep it on the server before you leave.
					</p>
					<div className="flex gap-3 justify-end">
						<button
							onClick={() => setShowLeaveConfirm(false)}
							className="px-4 py-2 text-label-sm font-medium text-text-primary border border-border-default rounded-action hover:bg-surface-card-muted transition-colors"
						>
							Cancel
						</button>
						<button
							onClick={() => {
								localStorage.removeItem(DRAFT_KEY)
								localStorage.removeItem(DRAFT_ID_KEY)
								router.push("/dashboard/events")
							}}
							className="px-4 py-2 text-label-sm font-medium text-text-secondary border border-border-default rounded-action hover:bg-surface-card-muted transition-colors"
						>
							Leave Anyway
						</button>
						<button
							onClick={handleSaveAndLeave}
							className="px-4 py-2 text-label-sm font-semibold text-white bg-surface-inverse hover:opacity-90 rounded-action transition-opacity"
						>
							Save Draft & Leave
						</button>
					</div>
				</div>
			</div>
		)}
		</>
	)
}
