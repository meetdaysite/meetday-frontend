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
	type Category,
} from "@/lib/api"
import { uploadEventMedia } from "@/lib/uploadMedia"
import type { EventDraftPayload, Ticket, RefundPolicy, EventMedia } from "@/types/event"

import FileTextSvg from "@/icons/outlined/file-text.svg"
import MapPointRotateSvg from "@/icons/outlined/map-point-rotate.svg"
import GalleryWideSvg from "@/icons/outlined/gallery-wide.svg"
import TicketSvg from "@/icons/outlined/ticket.svg"
import SettingsSvg from "@/icons/outlined/settings.svg"
import AltArrowRightSvg from "@/icons/outlined/alt-arrow-right.svg"
import AddCircleSvg from "@/icons/outlined/add-circle.svg"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import ClockCircleSvg from "@/icons/outlined/clock-circle.svg"
import CameraAddSvg from "@/icons/outlined/camera-add.svg"

import type { ComponentType, ReactNode, SVGProps } from "react"

// ─── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
	{ id: 1, title: "Basic Info",       subtitle: "Name and describe your event",    icon: FileTextSvg       as ComponentType<SVGProps<SVGSVGElement>> },
	{ id: 2, title: "Date & Location",  subtitle: "When and where it happens",       icon: MapPointRotateSvg as ComponentType<SVGProps<SVGSVGElement>> },
	{ id: 3, title: "Media Upload",     subtitle: "Add cover and gallery images",    icon: GalleryWideSvg    as ComponentType<SVGProps<SVGSVGElement>> },
	{ id: 4, title: "Ticket Types",     subtitle: "Set up pricing and capacity",     icon: TicketSvg         as ComponentType<SVGProps<SVGSVGElement>> },
	{ id: 5, title: "Setting & Review", subtitle: "Finalize and submit for review",  icon: SettingsSvg       as ComponentType<SVGProps<SVGSVGElement>> },
]

const LANGUAGE_OPTIONS = [
	{ value: "English", label: "English" },
	{ value: "Hindi",   label: "Hindi" },
	{ value: "Bengali", label: "Bengali" },
	{ value: "Tamil",   label: "Tamil" },
	{ value: "Telugu",  label: "Telugu" },
	{ value: "Marathi", label: "Marathi" },
]

const EVENT_TYPE_OPTIONS = [
	{ value: "In-Person", label: "In-Person" },
	{ value: "Online",    label: "Online" },
	{ value: "Hybrid",    label: "Hybrid" },
]

// ─── Centralised form data ─────────────────────────────────────────────────────

const defaultFormData = {
	// Step 1
	title: "", desc: "", category: "", eventType: "",
	languages: [] as string[], tags: [] as string[],
	whatToExpect: [] as string[], whoShouldAttend: [] as string[],
	// Step 2
	eventDate: "", startTime: "", endTime: "",
	venueName: "", fullAddress: "", city: "",
	// Step 3
	coverUrl: "", coverKey: "",
	gallerySlots: Array(6).fill("") as string[],
	galleryKeys:  Array(6).fill("") as string[],
	// Step 4
	ticketName: "", price: "", totalCapacity: "", maxPerPerson: "",
	ticketDesc: "", saleStartDate: "", saleEndDate: "",
	// Step 5
	visibility: "", ageRestriction: "", refundType: "",
	cutoffHours: "", refundPercent: "", instructions: "",
}

type FormData = typeof defaultFormData

const DRAFT_KEY = "meetday_create_draft"

// ─── Payload builder ──────────────────────────────────────────────────────────

function to12Hour(time24: string): string {
	if (!time24) return ""
	const [hStr, mStr] = time24.split(":")
	const h = parseInt(hStr, 10)
	const suffix = h >= 12 ? "PM" : "AM"
	const hour12 = h % 12 || 12
	return `${hour12.toString().padStart(2, "0")}:${mStr} ${suffix}`
}

function toISODate(dateStr: string): string {
	if (!dateStr) return ""
	return new Date(`${dateStr}T00:00:00`).toISOString()
}

function buildPayload(f: FormData): EventDraftPayload {
	const isFree = Number(f.price) === 0

	const ticket: Ticket | undefined = f.ticketName
		? {
			name: f.ticketName,
			price: Number(f.price) || 0,
			totalCapacity: Number(f.totalCapacity) || 1,
			maxPerPerson: Number(f.maxPerPerson) || 1,
			description: f.ticketDesc || undefined,
			saleStartDate: f.saleStartDate ? toISODate(f.saleStartDate) : undefined,
			saleEndDate: f.saleEndDate ? toISODate(f.saleEndDate) : undefined,
		  }
		: undefined

	const refundPolicy: RefundPolicy | undefined = f.refundType
		? {
			type: f.refundType as "FULL" | "PARTIAL" | "NO_REFUND",
			cutoffHours: f.cutoffHours ? Number(f.cutoffHours) : undefined,
			refundPercent: f.refundPercent ? Number(f.refundPercent) : undefined,
			refundTo: "ORIGINAL_PAYMENT",
		  }
		: undefined

	const media: EventMedia[] = []
	if (f.coverKey) media.push({ key: f.coverKey, type: "COVER", order: 0 })
	f.galleryKeys.forEach((key, i) => {
		if (key) media.push({ key, type: "GALLERY", order: i + 1 })
	})

	return {
		categoryId:          f.category || undefined,
		title:               f.title || undefined,
		description:         f.desc || undefined,
		eventType:           f.eventType || undefined,
		languages:           f.languages.length > 0 ? f.languages : undefined,
		tags:                f.tags.length > 0 ? f.tags : undefined,
		eventDate:           f.eventDate ? toISODate(f.eventDate) : undefined,
		startTime:           f.startTime ? to12Hour(f.startTime) : undefined,
		endTime:             f.endTime ? to12Hour(f.endTime) : undefined,
		venueName:           f.venueName || undefined,
		fullAddress:         f.fullAddress || undefined,
		city:                f.city || undefined,
		whatToExpect:        f.whatToExpect.length > 0 ? f.whatToExpect : undefined,
		whoShouldAttend:     f.whoShouldAttend.length > 0 ? f.whoShouldAttend : undefined,
		visibility:          (f.visibility as "PUBLIC" | "PRIVATE") || undefined,
		ageRestriction:      f.ageRestriction || undefined,
		specialInstructions: f.instructions || undefined,
		isFree,
		tickets:             ticket ? [ticket] : undefined,
		refundPolicy,
		media:               media.length > 0 ? media : undefined,
	}
}

// ─── Validation helpers ────────────────────────────────────────────────────────

type Errors = Record<string, string>

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

function validateStep2(f: Pick<FormData, "eventDate" | "startTime" | "endTime" | "venueName" | "fullAddress">): Errors {
	const e: Errors = {}
	if (!f.eventDate) e.eventDate = "Event date is required."
	else if (!isFutureOrToday(f.eventDate)) e.eventDate = "Date must be today or in the future."
	if (!f.startTime) e.startTime = "Start time is required."
	if (!f.endTime) e.endTime = "End time is required."
	else if (f.startTime && timeToMinutes(f.endTime) <= timeToMinutes(f.startTime))
		e.endTime = "End time must be after start time."
	if (!f.venueName.trim()) e.venueName = "Venue name is required."
	if (!f.fullAddress.trim()) e.fullAddress = "Full address is required."
	return e
}

function validateStep3(f: { coverKey: string; hasGallery: boolean }): Errors {
	const e: Errors = {}
	if (!f.coverKey) e.coverUrl = "Cover image is required — please upload a file."
	if (!f.hasGallery) e.gallery = "Add at least one gallery image."
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

function validateStep5(f: Pick<FormData, "visibility" | "ageRestriction" | "refundType" | "cutoffHours" | "refundPercent" | "instructions">): Errors {
	const e: Errors = {}
	if (!f.visibility) e.visibility = "Please select a visibility option."
	if (!f.ageRestriction) e.ageRestriction = "Please select an age restriction."
	if (!f.refundType) e.refundType = "Please select a refund type."
	if (f.refundType === "PARTIAL") {
		if (!f.cutoffHours.trim()) e.cutoffHours = "Cutoff hours is required."
		else if (isNaN(Number(f.cutoffHours)) || Number(f.cutoffHours) < 0) e.cutoffHours = "Enter a valid number of hours."
		if (!f.refundPercent.trim()) e.refundPercent = "Refund percent is required."
		else if (isNaN(Number(f.refundPercent)) || Number(f.refundPercent) < 0 || Number(f.refundPercent) > 100)
			e.refundPercent = "Enter a value between 0 and 100."
	}
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

const saveContinueCls = "flex items-center gap-2 px-6 py-3 bg-surface-inverse text-text-inverse rounded-action text-label-md font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
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

function MiniSpinner() {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="animate-spin shrink-0">
			<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
			<path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}

// ─── PillInput — reusable tag/list pill input ──────────────────────────────────

function PillInput({
	values,
	onChange,
	placeholder,
}: {
	values: string[]
	onChange: (v: string[]) => void
	placeholder: string
}) {
	const [input, setInput] = useState("")

	function add() {
		const t = input.trim()
		if (t && !values.includes(t)) onChange([...values, t])
		setInput("")
	}

	return (
		<>
			<div className="flex gap-2">
				<input
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add() } }}
					placeholder={placeholder}
					className="flex-1 h-(--size-input-md) px-4 rounded-input border border-border-default bg-surface-canvas text-text-primary placeholder:text-text-muted text-sm hover:border-border-strong focus:border-border-focused focus:outline-none transition-colors"
				/>
				<button
					type="button"
					onClick={add}
					className="flex items-center gap-1.5 px-4 h-(--size-input-md) bg-surface-inverse text-text-inverse rounded-action text-label-sm font-medium hover:opacity-90 transition-opacity shrink-0"
				>
					<Icon as={AddCircleSvg} size="sm" color="inverse" />
					Add
				</button>
			</div>
			{values.length > 0 && (
				<div className="flex flex-wrap gap-1.5 mt-1">
					{values.map((v) => (
						<span key={v} className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-card-muted rounded-badge text-caption text-text-primary">
							{v}
							<button
								type="button"
								onClick={() => onChange(values.filter((x) => x !== v))}
								className="text-text-tertiary hover:text-text-primary leading-none"
								aria-label={`Remove ${v}`}
							>
								×
							</button>
						</span>
					))}
				</div>
			)}
		</>
	)
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
				<FieldLabel>What to Expect</FieldLabel>
				<PillInput values={whatToExpect} onChange={(v) => set("whatToExpect", v)} placeholder="e.g. Guided walk" />
			</div>

			{/* Who Should Attend */}
			<div className="flex flex-col gap-1.5">
				<FieldLabel>Who Should Attend</FieldLabel>
				<PillInput values={whoShouldAttend} onChange={(v) => set("whoShouldAttend", v)} placeholder="e.g. Photography enthusiasts" />
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
					<input type="text" value={venueName} onChange={(e) => set("venueName", e.target.value)} placeholder="e.g. Zilker Park" className={inpCls(!!errors.venueName)} />
					<ErrMsg msg={errors.venueName} />
				</div>

				<div className="flex flex-col gap-1.5">
					<FieldLabel required>Full Address</FieldLabel>
					<div className={iconWrapCls(!!errors.fullAddress)}>
						<Icon as={MapPointRotateSvg} size="md" color="secondary" />
						<input type="text" value={fullAddress} onChange={(e) => set("fullAddress", e.target.value)} placeholder="123 Main St, Bandra West, Mumbai" className="flex-1 bg-transparent text-sm placeholder:text-text-muted text-text-primary outline-none" />
					</div>
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

	const { coverUrl, coverKey, gallerySlots, galleryKeys } = formData
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
		if (!file.type.startsWith("image/")) return
		// Show preview
		const next = [...gallerySlots]
		if (next[slotIndex].startsWith("blob:")) URL.revokeObjectURL(next[slotIndex])
		next[slotIndex] = URL.createObjectURL(file)
		set("gallerySlots", next)
		const nextKeys = [...galleryKeys]
		nextKeys[slotIndex] = ""
		set("galleryKeys", nextKeys)
		setGalleryUploading((prev) => { const n = [...prev]; n[slotIndex] = true; return n })
		try {
			const key = await uploadEventMedia(file, "GALLERY")
			setFormData((prev) => {
				const keys = [...prev.galleryKeys]
				keys[slotIndex] = key
				return { ...prev, galleryKeys: keys }
			})
		} catch {
			toast.error(`Gallery image ${slotIndex + 1} upload failed.`)
			setFormData((prev) => {
				const slots = [...prev.gallerySlots]
				slots[slotIndex] = ""
				return { ...prev, gallerySlots: slots }
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
							<img src={coverUrl} alt="Cover preview" className="w-full h-full object-cover" />
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

			{/* Gallery Images */}
			<div className="flex flex-col gap-3">
				<FieldLabel required>Gallery Images</FieldLabel>
				<p className="text-caption text-text-muted -mt-1">Click any slot to pick an image from your device.</p>
				<input
					ref={galleryFileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
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
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
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
											aria-label={`Remove gallery image ${i + 1}`}
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
						<textarea rows={3} value={ticketDesc} onChange={(e) => set("ticketDesc", e.target.value)} placeholder="What&apos;s included in this tier?" className={taCls(false)} />
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
							<img src={formData.coverUrl} alt="Cover" className="w-full h-full object-cover" />
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
	const [categories, setCategories] = useState<Category[]>([])
	const [categoriesLoading, setCategoriesLoading] = useState(true)
	const stepValidateRef = useRef<() => boolean>(() => true)

	// Create a backend draft on mount and fetch categories
	useEffect(() => {
		createEventDraft({})
			.then((e) => setDraftId(e.id))
			.catch(() => { /* non-fatal; media upload will warn if draftId is null */ })

		getCategories()
			.then((cats) => setCategories(cats))
			.catch(() => { /* non-fatal; user can still type */ })
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
			if (draftId) await updateEventDraft(draftId, buildPayload(formData))
			setDraftSaved(true)
			setTimeout(() => setDraftSaved(false), 2000)
		} catch {
			toast.error("Failed to save draft.")
		}
	}

	async function handleSubmit() {
		if (!draftId) { toast.error("Draft not initialised. Please refresh."); return }
		setSubmitting(true)
		try {
			await updateEventDraft(draftId, buildPayload(formData))
			await submitEventForReview(draftId)
			localStorage.removeItem(DRAFT_KEY)
			toast.success("Event submitted for review!")
			router.push("/dashboard/events")
		} catch {
			toast.error("Submission failed. Please try again.")
			setSubmitting(false)
		}
	}

	const isLastStep = currentStep === 5
	const sharedProps = { formData, setFormData }

	return (
		<div className="flex flex-col min-h-screen">
			<DashboardTopBar />

			{/* Action bar */}
			<div className="flex items-center justify-between px-6 lg:px-8 py-3 bg-surface-card border-b border-border-subtle">
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => router.push("/dashboard/events")}
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
									onSubmit={handleSubmit}
									submitting={submitting}
								/>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
