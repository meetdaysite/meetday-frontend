"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react"
import clsx from "clsx"
import { Icon } from "@/components/ui/Icon"
import { Dropdown } from "@/components/ui/Dropdown"

import FileTextSvg from "@/icons/outlined/file-text.svg"
import MapPointRotateSvg from "@/icons/outlined/map-point-rotate.svg"
import GalleryWideSvg from "@/icons/outlined/gallery-wide.svg"
import TicketSvg from "@/icons/outlined/ticket.svg"
import SettingsSvg from "@/icons/outlined/settings.svg"
import AltArrowRightSvg from "@/icons/outlined/alt-arrow-right.svg"
import AltArrowDownSvg from "@/icons/outlined/alt-arrow-down.svg"
import AddCircleSvg from "@/icons/outlined/add-circle.svg"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import ClockCircleSvg from "@/icons/outlined/clock-circle.svg"
import BellSvg from "@/icons/outlined/bell.svg"
import CameraAddSvg from "@/icons/outlined/camera-add.svg"

import type { ComponentType, ReactNode, SVGProps } from "react"

// ─── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
	{ id: 1, title: "Basic Info", subtitle: "Name and describe your event", icon: FileTextSvg as ComponentType<SVGProps<SVGSVGElement>> },
	{ id: 2, title: "Date & Location", subtitle: "When and where it happens", icon: MapPointRotateSvg as ComponentType<SVGProps<SVGSVGElement>> },
	{ id: 3, title: "Media Upload", subtitle: "Add cover and gallery images", icon: GalleryWideSvg as ComponentType<SVGProps<SVGSVGElement>> },
	{ id: 4, title: "Ticket Types", subtitle: "Set up pricing and capacity", icon: TicketSvg as ComponentType<SVGProps<SVGSVGElement>> },
	{ id: 5, title: "Setting & Review", subtitle: "Finalize and publish", icon: SettingsSvg as ComponentType<SVGProps<SVGSVGElement>> },
]

// ─── Centralised form data ─────────────────────────────────────────────────────

const defaultFormData = {
	// Step 1
	title: "", desc: "", category: "", eventType: "", language: "", tags: [] as string[],
	// Step 2
	eventDate: "", endDate: "", startTime: "", endTime: "", venueName: "", fullAddress: "", mapsLink: "",
	// Step 3
	coverUrl: "", gallerySlots: Array(6).fill("") as string[], promoVideoUrl: "",
	// Step 4
	ticketName: "", price: "", totalCapacity: "", maxPerPerson: "", ticketDesc: "", saleStartDate: "", saleEndDate: "",
	// Step 5
	visibility: "", ageRestriction: "", refundPolicy: "", instructions: "",
}

type FormData = typeof defaultFormData

const DRAFT_KEY = "meetday_create_draft"

// ─── Validation helpers ────────────────────────────────────────────────────────

type Errors = Record<string, string>

function isUrl(val: string) {
	return /^https?:\/\/.+/.test(val.trim())
}

function isImageSrc(val: string) {
	return /^(https?|blob):\/\/.+/.test(val.trim())
}

function isFutureOrToday(val: string) {
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	return new Date(val) >= today
}

function timeToMinutes(val: string) {
	const [h, m] = val.split(":").map(Number)
	return h * 60 + m
}

function validateStep1(f: Pick<FormData, "title" | "desc" | "category" | "eventType">): Errors {
	const e: Errors = {}
	if (!f.title.trim()) e.title = "Event title is required."
	else if (f.title.trim().length < 3) e.title = "Title must be at least 3 characters."
	if (!f.desc.trim()) e.desc = "Description is required."
	else if (f.desc.trim().length < 20) e.desc = "Description must be at least 20 characters."
	if (!f.category) e.category = "Please select a category."
	if (!f.eventType) e.eventType = "Please select an event type."
	return e
}

function validateStep2(f: Pick<FormData, "eventDate" | "endDate" | "startTime" | "endTime" | "venueName" | "fullAddress" | "mapsLink">): Errors {
	const e: Errors = {}
	if (!f.eventDate) e.eventDate = "Start date is required."
	else if (!isFutureOrToday(f.eventDate)) e.eventDate = "Start date must be today or in the future."
	if (!f.endDate) e.endDate = "End date is required."
	else if (f.eventDate && f.endDate < f.eventDate) e.endDate = "End date must be on or after start date."
	if (!f.startTime) e.startTime = "Start time is required."
	if (!f.endTime) e.endTime = "End time is required."
	else if (f.startTime && f.eventDate && f.endDate && f.endDate === f.eventDate && timeToMinutes(f.endTime) <= timeToMinutes(f.startTime))
		e.endTime = "End time must be after start time on the same day."
	if (!f.venueName.trim()) e.venueName = "Venue name is required."
	if (!f.fullAddress.trim()) e.fullAddress = "Full address is required."
	if (f.mapsLink.trim() && !isUrl(f.mapsLink)) e.mapsLink = "Enter a valid URL (https://...)."
	return e
}

function validateStep3(f: { coverUrl: string; hasGallery: boolean; promoVideoUrl: string }): Errors {
	const e: Errors = {}
	if (!f.coverUrl.trim()) e.coverUrl = "Cover image is required."
	else if (!isImageSrc(f.coverUrl)) e.coverUrl = "Enter a valid URL (https://...) or upload a file."
	if (!f.hasGallery) e.gallery = "Add at least one gallery image."
	if (!f.promoVideoUrl.trim()) e.promoVideoUrl = "Promo video URL is required."
	else if (!isUrl(f.promoVideoUrl)) e.promoVideoUrl = "Enter a valid URL (https://...)."
	return e
}

function validateStep4(f: Pick<FormData, "ticketName" | "price" | "totalCapacity" | "maxPerPerson" | "saleStartDate" | "saleEndDate">): Errors {
	const e: Errors = {}
	if (!f.ticketName.trim()) e.ticketName = "Ticket name is required."
	if (f.price === "") e.price = "Price is required."
	else if (isNaN(Number(f.price)) || Number(f.price) < 0) e.price = "Enter a valid price (0 or above)."
	const cap = Number(f.totalCapacity)
	if (!f.totalCapacity.trim()) e.totalCapacity = "Total capacity is required."
	else if (isNaN(cap) || cap < 1 || !Number.isInteger(cap)) e.totalCapacity = "Enter a whole number of at least 1."
	const maxP = Number(f.maxPerPerson)
	if (!f.maxPerPerson.trim()) e.maxPerPerson = "Max per person is required."
	else if (isNaN(maxP) || maxP < 1 || !Number.isInteger(maxP)) e.maxPerPerson = "Enter a whole number of at least 1."
	else if (!isNaN(cap) && maxP > cap) e.maxPerPerson = "Cannot exceed total capacity."
	if (f.saleEndDate && f.saleStartDate && new Date(f.saleEndDate) < new Date(f.saleStartDate))
		e.saleEndDate = "Sale end date must be on or after start date."
	return e
}

function validateStep5(f: Pick<FormData, "visibility" | "ageRestriction" | "refundPolicy" | "instructions">): Errors {
	const e: Errors = {}
	if (!f.visibility) e.visibility = "Please select a visibility option."
	if (!f.ageRestriction) e.ageRestriction = "Please select an age restriction."
	if (!f.refundPolicy) e.refundPolicy = "Please select a refund policy."
	if (!f.instructions.trim()) e.instructions = "Special instructions are required."
	return e
}

// ─── Shared style helpers ──────────────────────────────────────────────────────

function inpCls(err: boolean) {
	return clsx(
		"h-[var(--size-input-md)] w-full px-4 rounded-input border text-text-primary placeholder:text-text-muted text-sm transition-colors duration-(--duration-120) focus:outline-none",
		err
			? "border-border-brand bg-surface-brand-soft hover:border-border-focus focus:border-border-focus"
			: "border-border-default bg-surface-canvas hover:border-border-strong focus:border-border-focused",
	)
}

function iconWrapCls(err: boolean) {
	return clsx(
		"flex items-center gap-2 h-[var(--size-input-md)] px-4 rounded-input border transition-colors duration-(--duration-120)",
		err
			? "border-border-brand bg-surface-brand-soft hover:border-border-focus focus-within:border-border-focus"
			: "border-border-default bg-surface-canvas hover:border-border-strong focus-within:border-border-focused",
	)
}

function taCls(err: boolean) {
	return clsx(
		"w-full px-4 py-3 rounded-input border text-text-primary placeholder:text-text-muted text-sm transition-colors duration-(--duration-120) focus:outline-none resize-none",
		err
			? "border-border-brand bg-surface-brand-soft hover:border-border-focus focus:border-border-focus"
			: "border-border-default bg-surface-canvas hover:border-border-strong focus:border-border-focused",
	)
}

const saveContinueCls = "flex items-center gap-2 px-6 py-3 bg-surface-inverse text-text-inverse rounded-action text-label-md font-semibold hover:opacity-90 transition-opacity"
const backBtnCls = "px-5 py-2.5 text-label-md text-text-secondary border border-border-default rounded-action hover:bg-surface-card-muted transition-colors"

// ─── Small shared UI pieces ────────────────────────────────────────────────────

function FieldLabel({ children, required, hint }: { children: ReactNode; required?: boolean; hint?: string }) {
	return (
		<div className="flex items-center justify-between gap-2">
			<label className="text-label-sm font-semibold text-text-primary">
				{children}
				{required && <span className="text-text-brand ml-0.5">*</span>}
			</label>
			{hint && <span className="text-caption text-text-muted">{hint}</span>}
		</div>
	)
}

function ErrMsg({ msg }: { msg?: string }) {
	if (!msg) return null
	return <p className="text-caption text-text-danger">{msg}</p>
}

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
				<p className="text-caption text-text-tertiary mt-1">Complete all steps to publish</p>
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
	formData, setFormData, onNext, registerValidate,
}: {
	formData: FormData
	setFormData: Dispatch<SetStateAction<FormData>>
	onNext: () => void
	registerValidate: (fn: () => boolean) => void
}) {
	const [tagInput, setTagInput] = useState("")
	const [validated, setValidated] = useState(false)

	const { title, desc, category, eventType, language, tags } = formData

	const errors = useMemo(
		() => validated ? validateStep1({ title, desc, category, eventType }) : {},
		[validated, title, desc, category, eventType],
	)

	const validate = useCallback(() => {
		setValidated(true)
		return Object.keys(validateStep1({ title, desc, category, eventType })).length === 0
	}, [title, desc, category, eventType])

	useEffect(() => { registerValidate(validate) }, [validate, registerValidate])

	function set<K extends keyof FormData>(key: K, value: FormData[K]) {
		setFormData((prev) => ({ ...prev, [key]: value }))
	}

	function addTag() {
		const t = tagInput.trim()
		if (t && !tags.includes(t)) set("tags", [...tags, t])
		setTagInput("")
	}

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
						value={category} onChange={(v) => set("category", v)} error={!!errors.category}
						placeholder="Select Category"
						options={[
							{ value: "music", label: "Music" },
							{ value: "art", label: "Art & Culture" },
							{ value: "food", label: "Food & Drink" },
							{ value: "tech", label: "Technology" },
							{ value: "sports", label: "Sports & Fitness" },
							{ value: "business", label: "Business" },
							{ value: "education", label: "Education" },
							{ value: "health", label: "Health & Wellness" },
						]}
					/>
					<ErrMsg msg={errors.category} />
				</div>
				<div className="flex flex-col gap-1.5">
					<FieldLabel required>Event Type</FieldLabel>
					<Dropdown
						value={eventType} onChange={(v) => set("eventType", v)} error={!!errors.eventType}
						placeholder="Select Event Type"
						options={[
							{ value: "in-person", label: "In-person" },
							{ value: "online", label: "Online" },
							{ value: "hybrid", label: "Hybrid" },
						]}
					/>
					<ErrMsg msg={errors.eventType} />
				</div>
			</div>

			{/* Language + Tags */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div className="flex flex-col gap-1.5">
					<FieldLabel>Language</FieldLabel>
					<Dropdown
						value={language} onChange={(v) => set("language", v)}
						placeholder="Select Language"
						options={[
							{ value: "en", label: "English" },
							{ value: "hi", label: "Hindi" },
							{ value: "bn", label: "Bengali" },
							{ value: "ta", label: "Tamil" },
							{ value: "te", label: "Telugu" },
							{ value: "mr", label: "Marathi" },
						]}
					/>
				</div>
				<div className="flex flex-col gap-1.5">
					<FieldLabel>Tags / Keywords</FieldLabel>
					<div className="flex gap-2">
						<input
							type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
							onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag() } }}
							placeholder="Add tags..."
							className="flex-1 h-(--size-input-md) px-4 rounded-input border border-border-default bg-surface-canvas text-text-primary placeholder:text-text-muted text-sm hover:border-border-strong focus:border-border-focused focus:outline-none transition-colors"
						/>
						<button type="button" onClick={addTag} className="flex items-center gap-1.5 px-4 h-(--size-input-md) bg-surface-inverse text-text-inverse rounded-action text-label-sm font-medium hover:opacity-90 transition-opacity shrink-0">
							<Icon as={AddCircleSvg} size="sm" color="inverse" />
							Add
						</button>
					</div>
					{tags.length > 0 && (
						<div className="flex flex-wrap gap-1.5 mt-1">
							{tags.map((tag) => (
								<span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-card-muted rounded-badge text-caption text-text-primary">
									{tag}
									<button type="button" onClick={() => set("tags", tags.filter((t) => t !== tag))} className="text-text-tertiary hover:text-text-primary leading-none" aria-label={`Remove tag ${tag}`}>×</button>
								</span>
							))}
						</div>
					)}
				</div>
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
	const { eventDate, endDate, startTime, endTime, venueName, fullAddress, mapsLink } = formData

	const errors = useMemo(
		() => validated ? validateStep2({ eventDate, endDate, startTime, endTime, venueName, fullAddress, mapsLink }) : {},
		[validated, eventDate, endDate, startTime, endTime, venueName, fullAddress, mapsLink],
	)

	const validate = useCallback(() => {
		setValidated(true)
		return Object.keys(validateStep2({ eventDate, endDate, startTime, endTime, venueName, fullAddress, mapsLink })).length === 0
	}, [eventDate, endDate, startTime, endTime, venueName, fullAddress, mapsLink])

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

				<div className="grid grid-cols-2 gap-4">
					<div className="flex flex-col gap-1.5">
						<FieldLabel required>Start Date</FieldLabel>
						<div className={iconWrapCls(!!errors.eventDate)}>
							<Icon as={CalendarSvg} size="md" color="secondary" />
							<input type="date" value={eventDate} min={new Date().toISOString().split("T")[0]} onChange={(e) => { set("eventDate", e.target.value); if (endDate && e.target.value > endDate) set("endDate", "") }} className="flex-1 bg-transparent text-sm text-text-primary outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute" />
						</div>
						<ErrMsg msg={errors.eventDate} />
					</div>
					<div className="flex flex-col gap-1.5">
						<FieldLabel required>End Date</FieldLabel>
						<div className={iconWrapCls(!!errors.endDate)}>
							<Icon as={CalendarSvg} size="md" color="secondary" />
							<input type="date" value={endDate} min={eventDate || new Date().toISOString().split("T")[0]} onChange={(e) => set("endDate", e.target.value)} className="flex-1 bg-transparent text-sm text-text-primary outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute" />
						</div>
						<ErrMsg msg={errors.endDate} />
					</div>
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
					<input type="text" value={venueName} onChange={(e) => set("venueName", e.target.value)} placeholder="e.g. Zilker Park" className={inpCls(!!errors.venueName)} />
					<ErrMsg msg={errors.venueName} />
				</div>

				<div className="flex flex-col gap-1.5">
					<FieldLabel required>Full Address</FieldLabel>
					<div className={iconWrapCls(!!errors.fullAddress)}>
						<Icon as={MapPointRotateSvg} size="md" color="secondary" />
						<input type="text" value={fullAddress} onChange={(e) => set("fullAddress", e.target.value)} placeholder="123 Main St, Austin, TX 78701" className="flex-1 bg-transparent text-sm placeholder:text-text-muted text-text-primary outline-none" />
					</div>
					<ErrMsg msg={errors.fullAddress} />
				</div>

				<div className="flex flex-col gap-1.5">
					<FieldLabel>Google Maps Link</FieldLabel>
					<div className={iconWrapCls(!!errors.mapsLink)}>
						<svg className="size-4 text-icon-secondary shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden>
							<path d="M6.667 3.333H4A1.333 1.333 0 0 0 2.667 4.667V12A1.333 1.333 0 0 0 4 13.333h7.333A1.333 1.333 0 0 0 12.667 12V9.333M10 2.667h3.333V6M6.667 9.333 13.333 2.667" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
						<input type="text" value={mapsLink} onChange={(e) => set("mapsLink", e.target.value)} placeholder="https://maps.google.com/..." className="flex-1 bg-transparent text-sm placeholder:text-text-muted text-text-primary outline-none" />
					</div>
					<ErrMsg msg={errors.mapsLink} />
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

// ─── Tab switcher (URL ↔ Upload) ───────────────────────────────────────────────

function TabSwitcher({ value, onChange }: { value: "url" | "file"; onChange: (v: "url" | "file") => void }) {
	return (
		<div className="flex items-center p-0.5 bg-surface-card-muted rounded-action border border-border-subtle w-fit shrink-0">
			{(["url", "file"] as const).map((m) => (
				<button
					key={m}
					type="button"
					onClick={() => onChange(m)}
					className={clsx(
						"px-3 py-1 text-label-sm font-medium rounded-[calc(var(--radius-action)-2px)] transition-colors",
						value === m ? "bg-surface-card text-text-primary shadow-sm" : "text-text-muted hover:text-text-secondary",
					)}
				>
					{m === "url" ? "URL" : "Upload"}
				</button>
			))}
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
	const [galleryInput, setGalleryInput] = useState("")
	const [validated, setValidated] = useState(false)
	const [coverMode, setCoverMode] = useState<"url" | "file">("url")
	const [galleryMode, setGalleryMode] = useState<"url" | "file">("url")
	const [isDraggingOver, setIsDraggingOver] = useState(false)

	const coverFileRef = useRef<HTMLInputElement>(null)
	const galleryFileRef = useRef<HTMLInputElement>(null)
	const targetSlotRef = useRef<number>(0)

	const { coverUrl, gallerySlots, promoVideoUrl } = formData
	const hasGallery = gallerySlots.some((s) => s !== "")

	const errors = useMemo(
		() => validated ? validateStep3({ coverUrl, hasGallery, promoVideoUrl }) : {},
		[validated, coverUrl, hasGallery, promoVideoUrl],
	)

	const validate = useCallback(() => {
		setValidated(true)
		return Object.keys(validateStep3({ coverUrl, hasGallery, promoVideoUrl })).length === 0
	}, [coverUrl, hasGallery, promoVideoUrl])

	useEffect(() => { registerValidate(validate) }, [validate, registerValidate])

	function set<K extends keyof FormData>(key: K, value: FormData[K]) {
		setFormData((prev) => ({ ...prev, [key]: value }))
	}

	function addGalleryImage() {
		const trimmed = galleryInput.trim()
		if (!trimmed) return
		const next = [...gallerySlots]
		const idx = next.findIndex((s) => s === "")
		if (idx !== -1) next[idx] = trimmed
		set("gallerySlots", next)
		setGalleryInput("")
	}

	function removeCover() {
		if (coverUrl.startsWith("blob:")) URL.revokeObjectURL(coverUrl)
		set("coverUrl", "")
	}

	function removeGallerySlot(i: number) {
		const next = [...gallerySlots]
		if (next[i].startsWith("blob:")) URL.revokeObjectURL(next[i])
		next[i] = ""
		set("gallerySlots", next)
	}

	function handleCoverFile(file: File) {
		if (!file.type.startsWith("image/")) return
		if (coverUrl.startsWith("blob:")) URL.revokeObjectURL(coverUrl)
		set("coverUrl", URL.createObjectURL(file))
	}

	function handleGalleryFile(file: File, slotIndex: number) {
		if (!file.type.startsWith("image/")) return
		const next = [...gallerySlots]
		if (next[slotIndex].startsWith("blob:")) URL.revokeObjectURL(next[slotIndex])
		next[slotIndex] = URL.createObjectURL(file)
		set("gallerySlots", next)
	}

	function onCoverDragOver(e: React.DragEvent) {
		e.preventDefault()
		setIsDraggingOver(true)
	}

	function onCoverDragLeave() {
		setIsDraggingOver(false)
	}

	function onCoverDrop(e: React.DragEvent) {
		e.preventDefault()
		setIsDraggingOver(false)
		const file = e.dataTransfer.files[0]
		if (file) handleCoverFile(file)
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-heading-sm font-semibold text-text-primary">Media Upload</h1>
				<p className="text-body-sm text-text-secondary mt-1">Upload images and videos to showcase your event.</p>
			</div>

			{/* Cover Image */}
			<div className="flex flex-col gap-3">
				<div className="flex items-center justify-between gap-3">
					<FieldLabel required>Cover Image</FieldLabel>
					<TabSwitcher value={coverMode} onChange={setCoverMode} />
				</div>

				{coverMode === "url" ? (
					<>
						<input
							type="text" value={coverUrl} onChange={(e) => set("coverUrl", e.target.value)}
							placeholder="https://images.unsplash.com/..."
							className={inpCls(!!errors.coverUrl)}
						/>
						{coverUrl && isImageSrc(coverUrl) && (
							<div className="relative aspect-video rounded-card overflow-hidden border border-border-default">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src={coverUrl} alt="Cover preview" className="w-full h-full object-cover" />
								<button type="button" onClick={removeCover} className="absolute top-2 right-2 size-6 rounded-full bg-black/50 text-white flex items-center justify-center text-sm hover:bg-black/70" aria-label="Remove cover">×</button>
							</div>
						)}
					</>
				) : (
					<>
						<input
							ref={coverFileRef} type="file" accept="image/*" className="hidden"
							onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverFile(f); e.target.value = "" }}
						/>
						<div
							onClick={() => coverFileRef.current?.click()}
							onDragOver={onCoverDragOver}
							onDragLeave={onCoverDragLeave}
							onDrop={onCoverDrop}
							className={clsx(
								"border-2 border-dashed rounded-card flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors overflow-hidden",
								coverUrl ? "aspect-video p-0" : "py-14",
								isDraggingOver
									? "border-border-focused bg-surface-brand-soft"
									: "border-border-default bg-surface-card-muted hover:bg-surface-card",
							)}
						>
							{coverUrl ? (
								<div className="relative w-full h-full">
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img src={coverUrl} alt="Cover preview" className="w-full h-full object-cover" />
									<button
										type="button"
										onClick={(e) => { e.stopPropagation(); removeCover() }}
										className="absolute top-2 right-2 size-6 rounded-full bg-black/50 text-white flex items-center justify-center text-sm hover:bg-black/70"
										aria-label="Remove cover"
									>×</button>
								</div>
							) : (
								<>
									<div className="size-12 rounded-full bg-surface-card flex items-center justify-center">
										<Icon as={CameraAddSvg} size="lg" color="muted" />
									</div>
									<p className="text-label-sm font-medium text-text-secondary">Click or drop your cover image here</p>
									<p className="text-caption text-text-muted">JPG / PNG · Min 1200×630px · Max 5MB · 16:9 ratio</p>
								</>
							)}
						</div>
					</>
				)}
				<ErrMsg msg={errors.coverUrl} />
			</div>

			{/* Gallery Images */}
			<div className="flex flex-col gap-3">
				<div className="flex items-center justify-between gap-3">
					<FieldLabel required>Gallery Images</FieldLabel>
					<TabSwitcher value={galleryMode} onChange={setGalleryMode} />
				</div>

				{galleryMode === "url" && (
					<div className="flex items-end gap-2">
						<div className="flex flex-col gap-1.5 flex-1">
							<input
								type="text" value={galleryInput} onChange={(e) => setGalleryInput(e.target.value)}
								onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addGalleryImage() } }}
								placeholder="https://images.unsplash.com/..."
								className={inpCls(!!errors.gallery)}
							/>
						</div>
						<button type="button" onClick={addGalleryImage} className="flex items-center gap-1.5 px-4 h-(--size-input-md) bg-surface-inverse text-text-inverse rounded-action text-label-sm font-medium hover:opacity-90 transition-opacity shrink-0">
							<Icon as={AddCircleSvg} size="sm" color="inverse" />
							Add
						</button>
					</div>
				)}

				{galleryMode === "file" && (
					<>
						<input
							ref={galleryFileRef} type="file" accept="image/*" className="hidden"
							onChange={(e) => { const f = e.target.files?.[0]; if (f) handleGalleryFile(f, targetSlotRef.current); e.target.value = "" }}
						/>
						<p className="text-caption text-text-muted">Click any slot to pick an image from your device.</p>
					</>
				)}

				<ErrMsg msg={errors.gallery} />

				<div className="grid grid-cols-3 gap-3">
					{gallerySlots.map((img, i) => (
						<div
							key={i}
							onClick={galleryMode === "file" ? () => { targetSlotRef.current = i; galleryFileRef.current?.click() } : undefined}
							className={clsx(
								"relative aspect-video rounded-card border-2 border-dashed border-border-default bg-surface-card-muted flex items-center justify-center transition-colors overflow-hidden",
								galleryMode === "file" && "cursor-pointer hover:bg-surface-card",
							)}
						>
							{img ? (
								<>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
									<button
										type="button"
										onClick={(e) => { e.stopPropagation(); removeGallerySlot(i) }}
										className="absolute top-1 right-1 size-5 rounded-full bg-black/50 text-white flex items-center justify-center text-xs hover:bg-black/70"
										aria-label={`Remove gallery image ${i + 1}`}
									>×</button>
								</>
							) : (
								<span className="text-text-muted text-2xl leading-none select-none">+</span>
							)}
						</div>
					))}
				</div>
			</div>

			<div className="flex flex-col gap-1.5">
				<FieldLabel required>Promo Video URL</FieldLabel>
				<input type="text" value={promoVideoUrl} onChange={(e) => set("promoVideoUrl", e.target.value)} placeholder="https://video.stock.com/..." className={inpCls(!!errors.promoVideoUrl)} />
				<ErrMsg msg={errors.promoVideoUrl} />
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
	const { ticketName, price, totalCapacity, maxPerPerson, ticketDesc, saleStartDate, saleEndDate } = formData

	const errors = useMemo(
		() => validated ? validateStep4({ ticketName, price, totalCapacity, maxPerPerson, saleStartDate, saleEndDate }) : {},
		[validated, ticketName, price, totalCapacity, maxPerPerson, saleStartDate, saleEndDate],
	)

	const validate = useCallback(() => {
		setValidated(true)
		return Object.keys(validateStep4({ ticketName, price, totalCapacity, maxPerPerson, saleStartDate, saleEndDate })).length === 0
	}, [ticketName, price, totalCapacity, maxPerPerson, saleStartDate, saleEndDate])

	useEffect(() => { registerValidate(validate) }, [validate, registerValidate])

	function set<K extends keyof FormData>(key: K, value: FormData[K]) {
		setFormData((prev) => ({ ...prev, [key]: value }))
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-heading-sm font-semibold text-text-primary">Ticket Types</h1>
					<p className="text-body-sm text-text-secondary mt-1">Define pricing and capacity for your event tiers.</p>
				</div>
				<button type="button" className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-inverse text-text-inverse rounded-action text-label-sm font-medium hover:opacity-90 transition-opacity shrink-0">
					<Icon as={AddCircleSvg} size="sm" color="inverse" />
					Add Ticket
				</button>
			</div>

			<div className="border border-border-subtle rounded-card bg-surface-card overflow-hidden">
				<div className="flex items-center gap-3 px-5 py-4 border-b border-border-subtle">
					<div className="size-8 rounded-full bg-surface-inverse text-text-inverse flex items-center justify-center text-label-sm font-bold shrink-0">01</div>
					<p className="text-label-md font-semibold text-text-primary">Ticket Tier Details</p>
				</div>

				<div className="p-5 flex flex-col gap-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="flex flex-col gap-1.5">
							<FieldLabel required>Ticket Name</FieldLabel>
							<input type="text" value={ticketName} onChange={(e) => set("ticketName", e.target.value)} placeholder="General Admission" className={inpCls(!!errors.ticketName)} />
							<ErrMsg msg={errors.ticketName} />
						</div>
						<div className="flex flex-col gap-1.5">
							<FieldLabel required>Price (INR)</FieldLabel>
							<input type="number" value={price} onChange={(e) => set("price", e.target.value)} placeholder="₹ 0" min={0} className={inpCls(!!errors.price)} />
							<ErrMsg msg={errors.price} />
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="flex flex-col gap-1.5">
							<FieldLabel required>Total Capacity</FieldLabel>
							<input type="number" value={totalCapacity} onChange={(e) => set("totalCapacity", e.target.value)} placeholder="100" min={1} className={inpCls(!!errors.totalCapacity)} />
							<ErrMsg msg={errors.totalCapacity} />
						</div>
						<div className="flex flex-col gap-1.5">
							<FieldLabel required>Max Per Person</FieldLabel>
							<input type="number" value={maxPerPerson} onChange={(e) => set("maxPerPerson", e.target.value)} placeholder="01" min={1} className={inpCls(!!errors.maxPerPerson)} />
							<ErrMsg msg={errors.maxPerPerson} />
						</div>
					</div>

					<div className="flex flex-col gap-1.5">
						<FieldLabel hint="Optional">Description</FieldLabel>
						<textarea rows={3} value={ticketDesc} onChange={(e) => set("ticketDesc", e.target.value)} placeholder="What's included in this tier?" className={taCls(false)} />
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="flex flex-col gap-1.5">
							<FieldLabel>Sale Start Date</FieldLabel>
							<div className={iconWrapCls(!!errors.saleStartDate)}>
								<Icon as={CalendarSvg} size="sm" color="secondary" />
								<input type="date" value={saleStartDate} onChange={(e) => set("saleStartDate", e.target.value)} className="flex-1 bg-transparent text-sm text-text-primary outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute" />
							</div>
							<ErrMsg msg={errors.saleStartDate} />
						</div>
						<div className="flex flex-col gap-1.5">
							<FieldLabel>Sale End Date</FieldLabel>
							<div className={iconWrapCls(!!errors.saleEndDate)}>
								<Icon as={CalendarSvg} size="sm" color="secondary" />
								<input type="date" value={saleEndDate} min={saleStartDate || undefined} onChange={(e) => set("saleEndDate", e.target.value)} className="flex-1 bg-transparent text-sm text-text-primary outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute" />
							</div>
							<ErrMsg msg={errors.saleEndDate} />
						</div>
					</div>
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

// ─── Step 5: Settings & Review ─────────────────────────────────────────────────

function Step5SettingsReview({
	formData, setFormData, onBack, registerValidate,
}: {
	formData: FormData
	setFormData: Dispatch<SetStateAction<FormData>>
	onBack: () => void
	registerValidate: (fn: () => boolean) => void
}) {
	const [validated, setValidated] = useState(false)
	const { visibility, ageRestriction, refundPolicy, instructions } = formData

	const errors = useMemo(
		() => validated ? validateStep5({ visibility, ageRestriction, refundPolicy, instructions }) : {},
		[validated, visibility, ageRestriction, refundPolicy, instructions],
	)

	const validate = useCallback(() => {
		setValidated(true)
		return Object.keys(validateStep5({ visibility, ageRestriction, refundPolicy, instructions })).length === 0
	}, [visibility, ageRestriction, refundPolicy, instructions])

	useEffect(() => { registerValidate(validate) }, [validate, registerValidate])

	function set<K extends keyof FormData>(key: K, value: FormData[K]) {
		setFormData((prev) => ({ ...prev, [key]: value }))
	}

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
								value={visibility} onChange={(v) => set("visibility", v)} error={!!errors.visibility}
								placeholder="Public Searchable"
								options={[
									{ value: "public", label: "Public Searchable" },
									{ value: "private", label: "Private" },
									{ value: "invite", label: "Invite Only" },
								]}
							/>
							<ErrMsg msg={errors.visibility} />
						</div>
						<div className="flex flex-col gap-1.5">
							<FieldLabel required>Age Restriction</FieldLabel>
							<Dropdown
								value={ageRestriction} onChange={(v) => set("ageRestriction", v)} error={!!errors.ageRestriction}
								placeholder="All Ages"
								options={[
									{ value: "all", label: "All Ages" },
									{ value: "18+", label: "18+" },
									{ value: "21+", label: "21+" },
								]}
							/>
							<ErrMsg msg={errors.ageRestriction} />
						</div>
					</div>

					<div className="flex flex-col gap-1.5">
						<FieldLabel required>Refund Policy</FieldLabel>
						<Dropdown
							value={refundPolicy} onChange={(v) => set("refundPolicy", v)} error={!!errors.refundPolicy}
							placeholder="Select Refund Policy"
							options={[
								{ value: "no-refund", label: "No Refunds" },
								{ value: "7-day", label: "7-day Refund" },
								{ value: "30-day", label: "30-day Refund" },
							]}
						/>
						<ErrMsg msg={errors.refundPolicy} />
					</div>

					<div className="flex flex-col gap-1.5">
						<FieldLabel required>Special Instructions</FieldLabel>
						<textarea rows={5} maxLength={3000} value={instructions} onChange={(e) => set("instructions", e.target.value)} placeholder="Any special notes for your attendees..." className={taCls(!!errors.instructions)} />
						<div className="flex items-center justify-between gap-2">
							<ErrMsg msg={errors.instructions} />
							<p className="text-caption text-text-muted ml-auto">{instructions.length}/3000</p>
						</div>
					</div>
				</div>

				{/* Summary panel */}
				<div className="border border-border-subtle rounded-card bg-surface-card p-5 flex flex-col gap-4">
					<h2 className="text-label-md font-semibold text-text-primary">Summary</h2>
					<div className="w-full aspect-video rounded-card bg-surface-card-muted" />
					<div className="flex flex-col divide-y divide-border-subtle">
						{[
							{ label: "Title", value: formData.title || "—" },
							{ label: "Date", value: formData.eventDate || "—" },
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
							<span className="text-caption text-text-tertiary shrink-0">Total Capacity</span>
							<span className="text-caption font-semibold text-text-primary">{formData.totalCapacity || "—"}</span>
						</div>
						<div className="flex items-start justify-between gap-3">
							<span className="text-caption text-text-tertiary shrink-0">Potential Revenue</span>
							<span className="text-caption font-semibold text-text-success">
								{formData.price && formData.totalCapacity
									? `₹${(Number(formData.price) * Number(formData.totalCapacity)).toLocaleString("en-IN")}`
									: "—"}
							</span>
						</div>
					</div>
				</div>
			</div>

			<div className="flex items-center justify-between pt-2">
				<button type="button" onClick={onBack} className={backBtnCls}>Back</button>
				<button type="button" onClick={() => validate()} className={saveContinueCls}>
					Save & Continue
					<AltArrowRightSvg className="size-4" aria-hidden />
				</button>
			</div>
		</div>
	)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreateExperiencePage() {
	const [currentStep, setCurrentStep] = useState(1)
	const [formData, setFormData] = useState<FormData>(() => {
		try {
			const saved = localStorage.getItem(DRAFT_KEY)
			if (saved) return JSON.parse(saved) as FormData
		} catch {
			// ignore corrupt draft
		}
		return defaultFormData
	})
	const [draftSaved, setDraftSaved] = useState(false)
	const stepValidateRef = useRef<() => boolean>(() => true)

	function registerValidate(fn: () => boolean) {
		stepValidateRef.current = fn
	}

	function goNext() {
		setCurrentStep((s) => Math.min(s + 1, 5))
	}

	function goBack() {
		setCurrentStep((s) => Math.max(s - 1, 1))
	}

	function handleTopNext() {
		if (stepValidateRef.current()) goNext()
	}

	function saveDraft() {
		try {
			localStorage.setItem(DRAFT_KEY, JSON.stringify(formData))
			setDraftSaved(true)
			setTimeout(() => setDraftSaved(false), 2000)
		} catch {
			// ignore storage errors (e.g. private browsing quota)
		}
	}

	const isLastStep = currentStep === 5
	const sharedProps = { formData, setFormData }

	return (
		<div className="flex flex-col min-h-screen">
			{/* Desktop page header */}
			<div className="hidden lg:flex items-center justify-between px-8 py-4 bg-surface-card border-b border-border-subtle">
				<p className="text-body-sm text-text-secondary">
					Welcome to <span className="font-semibold text-text-primary">Meetday</span>
				</p>
				<div className="flex items-center gap-3">
					<button className="relative p-2 rounded-action hover:bg-surface-card-muted transition-colors" aria-label="Notifications">
						<Icon as={BellSvg} size="md" color="secondary" />
						<span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-action-primary" />
					</button>
					<div className="flex items-center gap-2 cursor-pointer hover:bg-surface-card-muted px-2 py-1.5 rounded-action transition-colors">
						<div className="size-8 rounded-avatar bg-surface-brand-soft flex items-center justify-center">
							<span className="text-label-sm font-semibold text-text-brand">AM</span>
						</div>
						<span className="text-label-md text-text-primary">Alex Morgan</span>
						<Icon as={AltArrowDownSvg} size="sm" color="secondary" />
					</div>
				</div>
			</div>

			{/* Create action bar */}
			<div className="flex items-center justify-between px-6 lg:px-8 py-3 bg-surface-card border-b border-border-subtle">
				<div className="flex items-center gap-3">
					<button type="button" className="p-1.5 rounded-action hover:bg-surface-card-muted transition-colors text-text-secondary hover:text-text-primary" aria-label="Close">
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

					{isLastStep ? (
						<button type="button" onClick={handleTopNext} className="flex items-center gap-2 px-5 py-2 bg-action-primary text-white text-label-sm font-semibold rounded-action hover:opacity-90 transition-opacity">
							Publish
							<AltArrowRightSvg className="size-4" aria-hidden />
						</button>
					) : (
						<button type="button" onClick={handleTopNext} className="flex items-center gap-2 px-5 py-2 bg-surface-inverse text-text-inverse text-label-sm font-semibold rounded-action hover:opacity-90 transition-opacity">
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
							{currentStep === 1 && <Step1BasicInfo {...sharedProps} onNext={goNext} registerValidate={registerValidate} />}
							{currentStep === 2 && <Step2DateTime {...sharedProps} onNext={goNext} onBack={goBack} registerValidate={registerValidate} />}
							{currentStep === 3 && <Step3MediaUpload {...sharedProps} onNext={goNext} onBack={goBack} registerValidate={registerValidate} />}
							{currentStep === 4 && <Step4TicketTypes {...sharedProps} onNext={goNext} onBack={goBack} registerValidate={registerValidate} />}
							{currentStep === 5 && <Step5SettingsReview {...sharedProps} onBack={goBack} registerValidate={registerValidate} />}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
