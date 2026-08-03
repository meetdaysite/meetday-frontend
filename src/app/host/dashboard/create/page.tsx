"use client"

import { CopilotPanel, type CopilotPanelState, type EventSummaryData } from "@/components/aiCopilot/CopilotPanel"
import { VenueAutocompleteInput } from "@/components/eventForm/AddressAutocompleteInput"
import { DateField, parseDateInput } from "@/components/eventForm/DateField"
import { TimeField } from "@/components/eventForm/TimeField"
import {
	ErrMsg,
	FieldLabel,
	MiniSpinner,
	PillInput,
	iconWrapCls,
	inpCls,
	taCls,
} from "@/components/eventForm/shared"
import { TicketListEditor } from "@/components/eventForm/TicketListEditor"
import { HostDetailsPrompt } from "@/components/host/HostDetailsPrompt"
import { Button } from "@/components/ui/Button"
import { Switch } from "@/components/ui/Switch"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import { Dropdown } from "@/components/ui/Dropdown"
import { Icon } from "@/components/ui/Icon"
import { useHostStore } from "@/store/hostStore"
import {
	createEventDraft,
	generateEventDraft,
	getCategories,
	getMyEventDetail,
	submitEventForReview,
	updateEventDraft,
	getHostProfile,
	updateHostProfile,
	type Category,
} from "@/lib/api"
import {
	EVENT_TYPE_OPTIONS,
	LANGUAGE_OPTIONS,
	addOneDay,
	buildPayload,
	defaultFormData,
	eventToFormData,
	timeToMinutes,
	to12Hour,
	validateStep1,
	validateStep2,
	validateStep3,
	validateStep4,
	validateStep5,
	type DraftTicket,
	type FormData,
} from "@/lib/eventForm"
import { uploadEventMedia } from "@/lib/uploadMedia"
import { getApiErrorMessage } from "@/lib/errors"
import { isAxiosError } from "axios"
import clsx from "clsx"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react"
import { toast } from "sonner"

import AiAvatarSvg from "@/assets/ai-avatar.svg"
import StarsSvg from "@/icons/filled/stars.svg"
import AltArrowRightSvg from "@/icons/outlined/alt-arrow-right.svg"
import CameraAddSvg from "@/icons/outlined/camera-add.svg"
import FileTextSvg from "@/icons/outlined/file-text.svg"
import GalleryWideSvg from "@/icons/outlined/gallery-wide.svg"
import MapPointRotateSvg from "@/icons/outlined/map-point-rotate.svg"
import SettingsSvg from "@/icons/outlined/settings.svg"
import TicketSvg from "@/icons/outlined/ticket.svg"
import UploadSvg from "@/icons/outlined/upload.svg"
import AltXSvg from "@/icons/outlined/close.svg"

import type { ComponentType, SVGProps } from "react"

function startOfToday() {
	const d = new Date()
	d.setHours(0, 0, 0, 0)
	return d
}

// ─── Step definitions ──────────────────────────────────────────────────────────

// Creating an experience takes three steps and ten fields. Media and the
// publishing settings moved to the "Finish your listing" phase, which runs after
// the draft exists and before it can be submitted for review.
const STEPS = [
	{
		id: 1,
		title: "Basic Info",
		subtitle: "Name and describe your experience",
		icon: FileTextSvg as ComponentType<SVGProps<SVGSVGElement>>,
	},
	{
		id: 2,
		title: "Date & Location",
		subtitle: "When and where it happens",
		icon: MapPointRotateSvg as ComponentType<SVGProps<SVGSVGElement>>,
	},
	{
		id: 3,
		title: "Ticket Types",
		subtitle: "Set up pricing and capacity",
		icon: TicketSvg as ComponentType<SVGProps<SVGSVGElement>>,
	},
]

const FINISH_STEPS = [
	{
		id: 1,
		title: "Media Upload",
		subtitle: "Add a cover image and gallery",
		icon: GalleryWideSvg as ComponentType<SVGProps<SVGSVGElement>>,
	},
	{
		id: 2,
		title: "Setting & Review",
		subtitle: "Finalize and submit for review",
		icon: SettingsSvg as ComponentType<SVGProps<SVGSVGElement>>,
	},
]

const BUILD_TOTAL = STEPS.length

// ─── Copilot state ─────────────────────────────────────────────────────────────

type CopilotState = { mode: "idle" } | CopilotPanelState

// ─── Draft keys ────────────────────────────────────────────────────────────────

const DRAFT_KEY = "meetday_create_draft"
const DRAFT_ID_KEY = "meetday_create_draft_id"

// ─── Style constants ───────────────────────────────────────────────────────────


// ─── Step circle indicator ─────────────────────────────────────────────────────

function StepCircle({
	state,
	icon: IconSvg,
}: {
	state: "completed" | "active" | "upcoming"
	icon: ComponentType<SVGProps<SVGSVGElement>>
}) {
	if (state === "completed")
		return (
			<div className="size-8 rounded-full bg-action-primary flex items-center justify-center shrink-0">
				<Icon as={IconSvg} size="sm" color="inverse" />
			</div>
		)
	if (state === "active")
		return (
			<div className="size-8 rounded-full border-2 border-text-primary flex items-center justify-center shrink-0">
				<Icon as={IconSvg} size="sm" color="primary" />
			</div>
		)
	return (
		<div className="size-8 rounded-full border-2 border-border-default flex items-center justify-center shrink-0">
			<Icon as={IconSvg} size="sm" color="muted" />
		</div>
	)
}

// ─── Experience Builder sidebar ────────────────────────────────────────────────

function ExperienceBuilderSidebar({
	currentStep,
	steps = STEPS,
	heading = "Experience Builder",
	caption = "Three steps to create your draft",
}: {
	currentStep: number
	steps?: typeof STEPS
	heading?: string
	caption?: string
}) {
	return (
		<aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-border-default bg-surface-card px-6 py-8 gap-6 overflow-y-auto">
			<div>
				<h2 className="text-label-md font-semibold text-text-primary">{heading}</h2>
				<p className="text-caption text-text-tertiary mt-1">{caption}</p>
			</div>
			<div className="flex flex-col gap-5">
				{steps.map(({ id, title, subtitle, icon }) => {
					const state: "completed" | "active" | "upcoming" =
						id < currentStep ? "completed" : id === currentStep ? "active" : "upcoming"
					return (
						<div key={id} className="flex items-start gap-3">
							<StepCircle state={state} icon={icon} />
							<div className="pt-0.5">
								<p
									className={`text-label-sm font-semibold ${state === "upcoming" ? "text-text-muted" : "text-text-primary"}`}
								>
									{title}
								</p>
								<p
									className={`text-caption mt-0.5 ${state === "upcoming" ? "text-text-muted" : "text-text-tertiary"}`}
								>
									{subtitle}
								</p>
							</div>
						</div>
					)
				})}
			</div>
		</aside>
	)
}

// ─── AI Copilot banners ────────────────────────────────────────────────────────

function CopilotIdleBanner({ onStart }: { onStart: () => void }) {
	return (
		<div className="flex items-center justify-between gap-4 px-4 py-3.5 rounded-action bg-surface-vibe-soft border border-border-default mb-6">
			<div className="flex items-center gap-3 min-w-0">
				<Icon as={AiAvatarSvg} size="xl" color="vibe" className="shrink-0" aria-hidden />
				<div className="min-w-0">
					<p className="text-label-sm font-semibold text-text-primary">
						Start with Meetday AI Copilot
					</p>
					<p className="text-caption text-text-secondary truncate">
						Describe your event in natural language. Our AI will create a complete draft for you.
					</p>
				</div>
			</div>
			<Button
				type="button"
				size="sm"
				radius="md"
				onClick={onStart}
				leftIcon={<Icon as={StarsSvg} size="sm" color="inherit" />}
				className="bg-linear-to-r from-purple-400 to-purple-800 text-white hover:opacity-90 font-semibold shrink-0"
			>
				Generate draft with AI
			</Button>
		</div>
	)
}

function AIDraftBanner() {
	return (
		<div className="flex items-center gap-3 px-4 py-3.5 rounded-action bg-surface-vibe-soft border border-border-default mb-6">
			<Icon as={AiAvatarSvg} size="xl" color="vibe" className="shrink-0" aria-hidden />
			<div>
				<p className="text-label-sm font-semibold text-text-primary">AI Generated Draft</p>
				<p className="text-caption text-text-secondary">
					Review and edit your event details. You can refine anything before continuing.
				</p>
			</div>
		</div>
	)
}

function AIStepBanner({ title, desc }: { title: string; desc: string }) {
	return (
		<div className="flex items-center gap-3 px-4 py-3.5 rounded-action bg-surface-vibe-soft border border-border-default mb-6">
			<Icon as={AiAvatarSvg} size="xl" color="vibe" className="shrink-0" aria-hidden />
			<div>
				<p className="text-label-sm font-semibold text-text-primary">{title}</p>
				<p className="text-caption text-text-secondary">{desc}</p>
			</div>
		</div>
	)
}

// ─── Prompt screen ─────────────────────────────────────────────────────────────

function PromptScreen({
	prompt,
	onPromptChange,
	onGenerate,
	onSkip,
	loading,
}: {
	prompt: string
	onPromptChange: (v: string) => void
	onGenerate: () => void
	onSkip: () => void
	loading: boolean
}) {
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	useEffect(() => {
		const el = textareaRef.current
		if (!el) return
		el.style.height = "auto"
		el.style.height = `${el.scrollHeight}px`
	}, [prompt])

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-heading-sm font-semibold text-text-primary">
					Start with Meetday AI Copilot
				</h1>
				<p className="text-body-sm text-text-secondary mt-1">
					Describe your event in natural language. AI Copilot will create a complete draft for you.
				</p>
			</div>

			<div className="flex flex-col gap-1.5">
				<FieldLabel required>Describe your event</FieldLabel>
				<textarea
					ref={textareaRef}
					rows={4}
					maxLength={1500}
					value={prompt}
					onChange={e => onPromptChange(e.target.value)}
					placeholder="e.g. Create a rooftop nightlife event in Kolkata for young professionals, with DJ, cocktails, sunset vibes, and ticketed entry for Saturday evening."
					className={`${taCls(false)} resize-none overflow-hidden`}
					disabled={loading}
				/>
				<p className="text-caption text-text-muted ml-auto">{prompt.length}/1500</p>
			</div>

			<div className="flex flex-col gap-4">
				<div className="flex items-center gap-3">
					<Button
						type="button"
						variant="secondary"
						size="md"
						radius="md"
						onClick={onSkip}
						disabled={loading}
					>
						Skip AI &amp; Fill manually
					</Button>
					<Button
						type="button"
						size="md"
						radius="md"
						onClick={onGenerate}
						disabled={loading || !prompt.trim() || prompt.trim().length < 20}
						leftIcon={loading ? <MiniSpinner /> : <Icon as={StarsSvg} size="sm" color="inherit" />}
						className="bg-linear-to-r from-purple-400 to-purple-800 text-white hover:opacity-90 font-semibold"
					>
						Generate draft with AI
					</Button>
				</div>

				<p className="text-caption text-text-muted">
					AI will generate: title, description, category, event type, date/location suggestions,
					pricing suggestions, and tags &amp; keywords.
				</p>
			</div>
		</div>
	)
}

// ─── Step 1: Basic Information ─────────────────────────────────────────────────

function Step1BasicInfo({
	formData,
	setFormData,
	onNext,
	registerValidate,
	categories,
	categoriesLoading,
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
		() =>
			validated
				? validateStep1({ title, desc, category, eventType, whatToExpect, whoShouldAttend })
				: {},
		[validated, title, desc, category, eventType, whatToExpect, whoShouldAttend],
	)

	const validate = useCallback(() => {
		setValidated(true)
		return (
			Object.keys(validateStep1({ title, desc, category, eventType, whatToExpect, whoShouldAttend }))
				.length === 0
		)
	}, [title, desc, category, eventType, whatToExpect, whoShouldAttend])

	useEffect(() => {
		registerValidate(validate)
	}, [validate, registerValidate])

	function set<K extends keyof FormData>(key: K, value: FormData[K]) {
		setFormData(prev => ({ ...prev, [key]: value }))
	}

	const categoryOptions = useMemo(() => categories.map(c => ({ value: c.id, label: c.name })), [categories])
	const availableLanguages = LANGUAGE_OPTIONS.filter(o => !languages.includes(o.value))

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-heading-sm font-semibold text-text-primary">Basic Information</h1>
				<p className="text-body-sm text-text-secondary mt-1">
					Let&apos;s start with the core details of your experience.
				</p>
			</div>

			<div className="flex flex-col gap-1.5">
				<FieldLabel required>Event Title</FieldLabel>
				<input
					type="text"
					maxLength={100}
					value={title}
					onChange={e => set("title", e.target.value)}
					placeholder="e.g. Summer Music Festival 2025"
					className={inpCls(!!errors.title)}
				/>
				<div className="flex items-center justify-between gap-2">
					<ErrMsg msg={errors.title} />
					<p className="text-caption text-text-muted ml-auto">{title.length}/100</p>
				</div>
			</div>

			<div className="flex flex-col gap-1.5">
				<FieldLabel required>Description</FieldLabel>
				<textarea
					rows={5}
					maxLength={3000}
					value={desc}
					onChange={e => set("desc", e.target.value)}
					placeholder="Describe your event in detail..."
					className={taCls(!!errors.desc)}
				/>
				<div className="flex items-center justify-between gap-2">
					<ErrMsg msg={errors.desc} />
					<p className="text-caption text-text-muted ml-auto">{desc.length}/3000</p>
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div className="flex flex-col gap-1.5">
					<FieldLabel required>Category</FieldLabel>
					<Dropdown
						value={category}
						onChange={v => set("category", v)}
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
						onChange={v => set("eventType", v)}
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
					onChange={v => {
						if (v && !languages.includes(v)) set("languages", [...languages, v])
					}}
					placeholder="Add a language…"
					options={availableLanguages}
					disabled={availableLanguages.length === 0}
				/>
				{languages.length > 0 && (
					<div className="flex flex-wrap gap-1.5 mt-1">
						{languages.map(lang => {
							const label = LANGUAGE_OPTIONS.find(o => o.value === lang)?.label ?? lang
							return (
								<span
									key={lang}
									className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-card-muted rounded-badge text-caption text-text-primary"
								>
									{label}
									<Button
										type="button"
										onClick={() => set("languages", languages.filter(l => l !== lang))}
										aria-label={`Remove ${lang}`}
										className="size-4 p-0 bg-transparent border-0 text-text-tertiary hover:text-text-primary hover:bg-transparent leading-none min-h-0"
									>
										×
									</Button>
								</span>
							)
						})}
					</div>
				)}
			</div>

			<div className="flex flex-col gap-1.5">
				<FieldLabel>Tags / Keywords</FieldLabel>
				<PillInput values={tags} onChange={v => set("tags", v)} placeholder="Add tags…" />
			</div>

			<div className="flex flex-col gap-1.5">
				<FieldLabel required>What to Expect</FieldLabel>
				<PillInput
					values={whatToExpect}
					onChange={v => set("whatToExpect", v)}
					placeholder="e.g. Guided walk"
				/>
				<ErrMsg msg={errors.whatToExpect} />
			</div>

			<div className="flex flex-col gap-1.5">
				<FieldLabel required>Who Should Attend</FieldLabel>
				<PillInput
					values={whoShouldAttend}
					onChange={v => set("whoShouldAttend", v)}
					placeholder="e.g. Photography enthusiasts"
				/>
				<ErrMsg msg={errors.whoShouldAttend} />
			</div>

			<div className="flex justify-end pt-4">
				<Button
					type="button"
					size="lg"
					radius="md"
					onClick={() => { if (validate()) onNext() }}
					rightIcon={<Icon as={AltArrowRightSvg} size="sm" aria-hidden />}
					className="bg-surface-inverse text-text-inverse hover:opacity-90 font-semibold"
				>
					Save &amp; Continue
				</Button>
			</div>
		</div>
	)
}

// ─── Step 2: Date & Location ───────────────────────────────────────────────────

function Step2DateTime({
	formData,
	setFormData,
	onNext,
	onBack,
	registerValidate,
}: {
	formData: FormData
	setFormData: Dispatch<SetStateAction<FormData>>
	onNext: () => void
	onBack: () => void
	registerValidate: (fn: () => boolean) => void
}) {
	const [validated, setValidated] = useState(false)
	const [overnightConfirm, setOvernightConfirm] = useState<{ startTime: string; endTime: string } | null>(null)
	const { eventDate, endDate, isMultiDay, startTime, endTime, venueName, fullAddress, city } = formData

	// If start/end times now cross midnight while the event is still marked
	// single-day, don't silently accept it — the host may have mistyped one of
	// the times. Ask before promoting to a multi-day listing.
	function checkOvernight(nextStart: string, nextEnd: string): boolean {
		if (isMultiDay || !nextStart || !nextEnd) return false
		if (timeToMinutes(nextEnd) > timeToMinutes(nextStart)) return false
		setOvernightConfirm({ startTime: nextStart, endTime: nextEnd })
		return true
	}

	function confirmOvernight() {
		if (!overnightConfirm) return
		setFormData(prev => ({
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
				setFormData(prev => ({
					...prev,
					latitude: data.lat,
					longitude: data.lng,
					city: data.city || prev.city,
				}))
			}
		} catch {
			// geocoding is best-effort
		}
	}

	const errors = useMemo(
		() => (validated ? validateStep2({ eventDate, endDate, isMultiDay, startTime, endTime, venueName, fullAddress }) : {}),
		[validated, eventDate, endDate, isMultiDay, startTime, endTime, venueName, fullAddress],
	)

	const validate = useCallback(() => {
		setValidated(true)
		return (
			Object.keys(validateStep2({ eventDate, endDate, isMultiDay, startTime, endTime, venueName, fullAddress })).length === 0
		)
	}, [eventDate, endDate, isMultiDay, startTime, endTime, venueName, fullAddress])

	useEffect(() => {
		registerValidate(validate)
	}, [validate, registerValidate])

	function set<K extends keyof FormData>(key: K, value: FormData[K]) {
		setFormData(prev => ({ ...prev, [key]: value }))
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-heading-sm font-semibold text-text-primary">Date & Location</h1>
				<p className="text-body-sm text-text-secondary mt-1">
					Specify when and where your experience will take place.
				</p>
			</div>

			<div className="border border-border-default rounded-action p-5 bg-surface-card flex flex-col gap-4">
				<div className="flex items-center justify-between gap-3">
					<h3 className="text-label-md font-semibold text-text-primary">Date & Time</h3>
					<Switch
						label="Multi-day event"
						checked={isMultiDay}
						onChange={checked =>
							setFormData(prev => ({ ...prev, isMultiDay: checked, endDate: checked ? prev.endDate : "" }))
						}
					/>
				</div>

				<div className={clsx("grid gap-4", isMultiDay ? "grid-cols-2" : "grid-cols-1")}>
					<div className="flex flex-col gap-1.5">
						<FieldLabel required>Event Date</FieldLabel>
						<DateField
							value={eventDate}
							onChange={v => set("eventDate", v)}
							error={!!errors.eventDate}
							minDate={startOfToday()}
						/>
						<ErrMsg msg={errors.eventDate} />
					</div>

					{isMultiDay && (
						<div className="flex flex-col gap-1.5">
							<FieldLabel required>End Date</FieldLabel>
							<DateField
								value={endDate}
								onChange={v => set("endDate", v)}
								error={!!errors.endDate}
								minDate={parseDateInput(eventDate) ?? startOfToday()}
							/>
							<ErrMsg msg={errors.endDate} />
						</div>
					)}
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="flex flex-col gap-1.5">
						<FieldLabel required>Start Time</FieldLabel>
						<TimeField
							value={startTime}
							onChange={v => {
								if (checkOvernight(v, endTime)) return
								set("startTime", v)
							}}
							error={!!errors.startTime}
						/>
						<ErrMsg msg={errors.startTime} />
					</div>
					<div className="flex flex-col gap-1.5">
						<FieldLabel required>End Time</FieldLabel>
						<TimeField
							value={endTime}
							onChange={v => {
								if (checkOvernight(startTime, v)) return
								set("endTime", v)
							}}
							error={!!errors.endTime}
						/>
						<ErrMsg msg={errors.endTime} />
					</div>
				</div>
			</div>

			<div className="border border-border-default rounded-action p-5 bg-surface-card flex flex-col gap-4">
				<h3 className="text-label-md font-semibold text-text-primary">Location Details</h3>

				<div className="flex flex-col gap-1.5">
					<FieldLabel required>Venue Name</FieldLabel>
					<VenueAutocompleteInput
						value={venueName}
						error={!!errors.venueName}
						onChange={v => set("venueName", v)}
						onPlaceSelect={fields =>
							setFormData(prev => ({
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
					<div className={iconWrapCls(!!errors.fullAddress)}>
						<Icon as={MapPointRotateSvg} size="md" color="secondary" />
						<input
							type="text"
							value={fullAddress}
							onChange={e => set("fullAddress", e.target.value)}
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
						value={city}
						onChange={e => set("city", e.target.value)}
						placeholder="e.g. Mumbai"
						className={inpCls(false)}
					/>
				</div>
			</div>

			<div className="flex items-center justify-between pt-4">
				<Button type="button" variant="secondary" size="md" radius="md" onClick={onBack}>
					Back
				</Button>
				<Button
					type="button"
					size="lg"
					radius="md"
					onClick={() => { if (validate()) onNext() }}
					rightIcon={<Icon as={AltArrowRightSvg} size="sm" aria-hidden />}
					className="bg-surface-inverse text-text-inverse hover:opacity-90 font-semibold"
				>
					Save &amp; Continue
				</Button>
			</div>

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
		</div>
	)
}

// ─── Step 3: Media Upload ──────────────────────────────────────────────────────

function Step3MediaUpload({
	formData,
	setFormData,
	onNext,
	onBack,
	registerValidate,
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
	const hasGallery = galleryKeys.some(k => k !== "")

	const errors = useMemo(
		() => (validated ? validateStep3({ hasCover: !!coverKey, hasGallery }) : {}),
		[validated, coverKey, hasGallery],
	)

	const validate = useCallback(() => {
		setValidated(true)
		return Object.keys(validateStep3({ hasCover: !!coverKey, hasGallery })).length === 0
	}, [coverKey, hasGallery])

	useEffect(() => {
		registerValidate(validate)
	}, [validate, registerValidate])

	function set<K extends keyof FormData>(key: K, value: FormData[K]) {
		setFormData(prev => ({ ...prev, [key]: value }))
	}

	async function handleCoverFile(file: File) {
		if (!file.type.startsWith("image/")) return
		if (coverUrl.startsWith("blob:")) URL.revokeObjectURL(coverUrl)
		const previewUrl = URL.createObjectURL(file)
		set("coverUrl", previewUrl)
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
		setGalleryUploading(prev => {
			const n = [...prev]
			n[slotIndex] = true
			return n
		})
		try {
			const key = await uploadEventMedia(file, "GALLERY")
			setFormData(prev => {
				const keys = [...prev.galleryKeys]
				keys[slotIndex] = key
				return { ...prev, galleryKeys: keys }
			})
		} catch (err) {
			toast.error(getApiErrorMessage(err))
			setFormData(prev => {
				const slots = [...prev.gallerySlots]
				slots[slotIndex] = ""
				const types = [...prev.galleryTypes]
				types[slotIndex] = ""
				return { ...prev, gallerySlots: slots, galleryTypes: types }
			})
		} finally {
			setGalleryUploading(prev => {
				const n = [...prev]
				n[slotIndex] = false
				return n
			})
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
				<p className="text-body-sm text-text-secondary mt-1">
					Upload images to showcase your event. Files are uploaded directly to secure storage.
				</p>
			</div>

			<div className="flex flex-col gap-3">
				<FieldLabel required>Cover Image</FieldLabel>
				<input
					ref={coverFileRef}
					type="file"
					accept="image/jpeg,image/png,image/webp"
					className="hidden"
					onChange={e => {
						const f = e.target.files?.[0]
						if (f) handleCoverFile(f)
						e.target.value = ""
					}}
				/>
				<div
					onClick={() => !coverUploading && coverFileRef.current?.click()}
					onDragOver={e => {
						e.preventDefault()
						setIsDraggingOver(true)
					}}
					onDragLeave={() => setIsDraggingOver(false)}
					onDrop={e => {
						e.preventDefault()
						setIsDraggingOver(false)
						const f = e.dataTransfer.files[0]
						if (f) handleCoverFile(f)
					}}
					className={clsx(
						"border-2 border-dashed rounded-action flex flex-col items-center justify-center gap-2 transition-colors overflow-hidden",
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
							<img
								src={coverUrl}
								alt="Cover preview"
								className="w-full h-full object-cover"
								loading="lazy"
							/>
							{coverUploading && (
								<div className="absolute inset-0 bg-black/40 flex items-center justify-center">
									<MiniSpinner />
								</div>
							)}
							{!coverUploading && (
								<Button
									type="button"
									onClick={e => { e.stopPropagation(); removeCover() }}
									aria-label="Remove cover"
									className="absolute top-2 right-2 size-6 p-0 rounded-full bg-black/50 text-white text-sm hover:bg-black/70 border-0"
								>
									×
								</Button>
							)}
						</div>
					) : (
						<>
							<div className="size-12 rounded-full bg-surface-card flex items-center justify-center">
								<Icon as={CameraAddSvg} size="lg" color="muted" />
							</div>
							<p className="text-label-sm font-medium text-text-secondary">
								Click or drop your cover image here
							</p>
							<p className="text-caption text-text-muted">
								JPG / PNG / WebP · Max 5MB · 16:9 ratio recommended
							</p>
						</>
					)}
				</div>
				<ErrMsg msg={errors.coverUrl} />
			</div>

			<div className="flex flex-col gap-3">
				<FieldLabel required>Gallery Images & Videos</FieldLabel>
				<p className="text-caption text-text-muted -mt-1">
					Click any slot to pick an image or video from your device.
				</p>
				<input
					ref={galleryFileRef}
					type="file"
					accept="image/jpeg,image/png,image/webp,video/*"
					className="hidden"
					onChange={e => {
						const f = e.target.files?.[0]
						if (f) handleGalleryFile(f, targetSlotRef.current)
						e.target.value = ""
					}}
				/>
				<ErrMsg msg={errors.gallery} />
				<div className="grid grid-cols-3 gap-3">
					{gallerySlots.map((img, i) => (
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
								galleryUploading[i]
									? "cursor-wait opacity-70"
									: "cursor-pointer hover:bg-surface-card",
							)}
						>
							{img ? (
								<>
									{galleryTypes[i] === "VIDEO" ? (
										<video
											src={img}
											preload="none"
											className="w-full h-full object-cover"
											onClick={e => e.stopPropagation()}
										/>
									) : (
										// eslint-disable-next-line @next/next/no-img-element
										<img
											src={img}
											alt={`Gallery ${i + 1}`}
											className="w-full h-full object-cover"
											loading="lazy"
										/>
									)}
									{galleryUploading[i] && (
										<div className="absolute inset-0 bg-black/40 flex items-center justify-center">
											<MiniSpinner />
										</div>
									)}
									{!galleryUploading[i] && (
										<Button
											type="button"
											onClick={e => { e.stopPropagation(); removeGallerySlot(i) }}
											aria-label={`Remove gallery item ${i + 1}`}
											className="absolute top-1 right-1 size-5 p-0 rounded-full bg-black/50 text-white text-xs hover:bg-black/70 border-0"
										>
											×
										</Button>
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
				<Button type="button" variant="secondary" size="md" radius="md" onClick={onBack}>
					Back
				</Button>
				<Button
					type="button"
					size="lg"
					radius="md"
					onClick={() => { if (validate()) onNext() }}
					disabled={coverUploading || galleryUploading.some(Boolean)}
					leftIcon={(coverUploading || galleryUploading.some(Boolean)) ? <MiniSpinner /> : undefined}
					rightIcon={<Icon as={AltArrowRightSvg} size="sm" aria-hidden />}
					className="bg-surface-inverse text-text-inverse hover:opacity-90 font-semibold"
				>
					Save &amp; Continue
				</Button>
			</div>
		</div>
	)
}

// ─── Step 4: Ticket Types ──────────────────────────────────────────────────────

function Step4TicketTypes({
	formData,
	setFormData,
	onNext,
	onBack,
	registerValidate,
	aiInitialDrafts,
	aiSuggested,
	isFreeEvent = false,
}: {
	formData: FormData
	setFormData: Dispatch<SetStateAction<FormData>>
	onNext: () => void
	onBack: () => void
	registerValidate: (fn: () => boolean) => void
	aiInitialDrafts?: DraftTicket[]
	aiSuggested?: boolean
	isFreeEvent?: boolean
}) {
	const [validated, setValidated] = useState(false)
	const { tickets } = formData

	const errors = useMemo(() => (validated ? validateStep4({ tickets }) : {}), [validated, tickets])

	useEffect(() => {
		if (isFreeEvent) {
			if (tickets.length === 0) {
				setFormData(prev => ({
					...prev,
					tickets: [{
						name: "Free Entry",
						price: 0,
						totalCapacity: 100,
						maxPerPerson: 5,
						description: "Free admission ticket.",
						saleStartDate: "",
						saleEndDate: ""
					}]
				}))
			} else if (tickets.some(t => t.price !== 0)) {
				setFormData(prev => ({
					...prev,
					tickets: prev.tickets.map(t => ({ ...t, price: 0 }))
				}))
			}
		}
	}, [isFreeEvent, tickets, setFormData])

	const validate = useCallback(() => {
		setValidated(true)
		return Object.keys(validateStep4({ tickets })).length === 0
	}, [tickets])

	useEffect(() => {
		registerValidate(validate)
	}, [validate, registerValidate])

	return (
		<div className="flex flex-col gap-6">
			<TicketListEditor
				tickets={tickets}
				onChange={updated => setFormData(prev => ({ ...prev, tickets: updated }))}
				listError={errors.tickets}
				initialDrafts={aiInitialDrafts}
				aiSuggested={aiSuggested}
				isFreeEvent={isFreeEvent}
				headerSlot={
					<div>
						<h1 className="text-heading-sm font-semibold text-text-primary">Ticket Types</h1>
						<p className="text-body-sm text-text-secondary mt-1">
							Define pricing and capacity for your event tiers.
						</p>
					</div>
				}
			/>

			<div className="flex items-center justify-between pt-4">
				<Button type="button" variant="secondary" size="md" radius="md" onClick={onBack}>
					Back
				</Button>
				<Button
					type="button"
					size="lg"
					radius="md"
					onClick={() => { if (validate()) onNext() }}
					rightIcon={<Icon as={AltArrowRightSvg} size="sm" aria-hidden />}
					className="bg-surface-inverse text-text-inverse hover:opacity-90 font-semibold"
				>
					Save &amp; Continue
				</Button>
			</div>
		</div>
	)
}

// ─── Step 5: Settings & Review ─────────────────────────────────────────────────

function Step5SettingsReview({
	formData,
	setFormData,
	onBack,
	registerValidate,
	onSubmit,
	submitting,
	hideSummary,
}: {
	formData: FormData
	setFormData: Dispatch<SetStateAction<FormData>>
	onBack: () => void
	registerValidate: (fn: () => boolean) => void
	onSubmit: () => void
	submitting: boolean
	hideSummary?: boolean
}) {
	const [validated, setValidated] = useState(false)
	const { visibility, ageRestriction, refundType, cutoffHours, refundPercent, instructions } = formData

	const errors = useMemo(
		() =>
			validated
				? validateStep5({
					visibility,
					ageRestriction,
					refundType,
					cutoffHours,
					refundPercent,
					instructions,
				})
				: {},
		[validated, visibility, ageRestriction, refundType, cutoffHours, refundPercent, instructions],
	)

	const validate = useCallback(() => {
		setValidated(true)
		return (
			Object.keys(
				validateStep5({
					visibility,
					ageRestriction,
					refundType,
					cutoffHours,
					refundPercent,
					instructions,
				}),
			).length === 0
		)
	}, [visibility, ageRestriction, refundType, cutoffHours, refundPercent, instructions])

	useEffect(() => {
		registerValidate(validate)
	}, [validate, registerValidate])

	function set<K extends keyof FormData>(key: K, value: FormData[K]) {
		setFormData(prev => ({ ...prev, [key]: value }))
	}

	const isPartial = refundType === "PARTIAL"

	return (
		<div className="flex flex-col gap-6">
			<div className={hideSummary ? "flex flex-col gap-5" : "grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5 items-start"}>
				<div className="border border-border-default rounded-action bg-surface-card p-5 flex flex-col gap-5">
					<h2 className="text-label-md font-semibold text-text-primary">Event Settings</h2>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="flex flex-col gap-1.5">
							<FieldLabel required>Visibility</FieldLabel>
							<Dropdown
								value={visibility}
								onChange={v => set("visibility", v)}
								error={!!errors.visibility}
								placeholder="Select Visibility"
								options={[
									{ value: "PUBLIC", label: "Public Searchable" },
									{ value: "PRIVATE", label: "Private" },
								]}
							/>
							<ErrMsg msg={errors.visibility} />
						</div>
						<div className="flex flex-col gap-1.5">
							<FieldLabel required>Age Restriction</FieldLabel>
							<Dropdown
								value={ageRestriction}
								onChange={v => set("ageRestriction", v)}
								error={!!errors.ageRestriction}
								placeholder="All Ages"
								options={[
									{ value: "All Ages", label: "All Ages" },
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
							value={refundType}
							onChange={v => set("refundType", v)}
							error={!!errors.refundType}
							placeholder="Select Refund Policy"
							options={[
								{ value: "NO_REFUND", label: "No Refund" },
								{ value: "PARTIAL", label: "Partial Refund" },
								{ value: "FULL", label: "Full Refund" },
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
										type="number"
										value={cutoffHours}
										onChange={e => set("cutoffHours", e.target.value)}
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
										type="number"
										value={refundPercent}
										onChange={e => set("refundPercent", e.target.value)}
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
							rows={5}
							maxLength={3000}
							value={instructions}
							onChange={e => set("instructions", e.target.value)}
							placeholder="Any special notes for your attendees…"
							className={taCls(!!errors.instructions)}
						/>
						<div className="flex items-center justify-between gap-2">
							<ErrMsg msg={errors.instructions} />
							<p className="text-caption text-text-muted ml-auto">{instructions.length}/3000</p>
						</div>
					</div>
				</div>

				{!hideSummary && (
					<div className="border border-border-default rounded-action bg-surface-card p-5 flex flex-col gap-4">
						<h2 className="text-label-md font-semibold text-text-primary">Summary</h2>
						<div className="w-full aspect-video rounded-action bg-surface-card-muted overflow-hidden">
							{formData.coverUrl && (
								// eslint-disable-next-line @next/next/no-img-element
								<img
									src={formData.coverUrl}
									alt="Cover"
									className="w-full h-full object-cover"
									loading="lazy"
								/>
							)}
						</div>
						<div className="flex flex-col divide-y divide-border-default">
							{[
								{ label: "Title", value: formData.title || "—" },
								{ label: "Date", value: formData.eventDate || "—" },
								{ label: "Location", value: formData.venueName || "—" },
							].map(({ label, value }) => (
								<div
									key={label}
									className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
								>
									<span className="text-caption text-text-tertiary shrink-0">{label}</span>
									<span className="text-caption font-semibold text-text-primary text-right">
										{value}
									</span>
								</div>
							))}
						</div>
						<div className="border-t border-border-default pt-3 flex flex-col gap-2.5">
							<div className="flex items-start justify-between gap-3">
								<span className="text-caption text-text-tertiary shrink-0">Ticket Types</span>
								<span className="text-caption font-semibold text-text-primary">
									{formData.tickets.length > 0
										? `${formData.tickets.length} type${formData.tickets.length > 1 ? "s" : ""}`
										: "—"}
								</span>
							</div>
							<div className="flex items-start justify-between gap-3">
								<span className="text-caption text-text-tertiary shrink-0">Total Capacity</span>
								<span className="text-caption font-semibold text-text-primary">
									{formData.tickets.length > 0
										? formData.tickets
											.reduce((s, t) => s + t.totalCapacity, 0)
											.toLocaleString("en-IN")
										: "—"}
								</span>
							</div>
						</div>
					</div>
				)}
			</div>

			<div className="flex items-center justify-between pt-2">
				<Button type="button" variant="secondary" size="md" radius="md" onClick={onBack}>
					Back
				</Button>
				<Button
					type="button"
					variant="primary"
					size="md"
					radius="md"
					disabled={submitting}
					onClick={() => { if (validate()) onSubmit() }}
					leftIcon={submitting ? <MiniSpinner /> : undefined}
					rightIcon={<Icon as={AltArrowRightSvg} size="sm" aria-hidden />}
					className="font-semibold"
				>
					Submit for Review
				</Button>
			</div>
		</div>
	)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreateExperiencePage() {
	const router = useRouter()
	const { profile, setProfile } = useHostStore()
	const [experienceType, setExperienceType] = useState<"TICKETED" | "NON_TICKETED" | null>(null)
	const [showSocialModal, setShowSocialModal] = useState(false)



	useEffect(() => {
		if (!profile) {
			getHostProfile().then(setProfile).catch(() => {})
		}
	}, [profile, setProfile])

	const [currentStep, setCurrentStep] = useState(1)
	// "build" = the 3 creation steps; "finish" = media + settings, shown once the
	// draft exists and required before the listing can be submitted for review.
	const [phase, setPhase] = useState<"build" | "finish">("build")
	const [finishStep, setFinishStep] = useState(1)
	const [formData, setFormData] = useState<FormData>(() => {
		try {
			const saved = localStorage.getItem(DRAFT_KEY)
			if (saved) return { ...defaultFormData, ...JSON.parse(saved) } as FormData
		} catch {
			/* ignore */
		}
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

	// AI copilot state
	const [copilot, setCopilot] = useState<CopilotState>({ mode: "idle" })
	const [copilotPrompt, setCopilotPrompt] = useState("")
	const [copilotLoading, setCopilotLoading] = useState(false)

	useEffect(() => {
		const savedId = localStorage.getItem(DRAFT_ID_KEY)
		if (savedId) {
			getMyEventDetail(savedId)
				.then(event => {
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
			.then(cats => setCategories(cats))
			.catch(() => { })
			.finally(() => setCategoriesLoading(false))
	}, [])

	useEffect(() => {
		try {
			localStorage.setItem(DRAFT_KEY, JSON.stringify(formData))
		} catch {
			/* ignore */
		}
	}, [formData])

	function registerValidate(fn: () => boolean) {
		stepValidateRef.current = fn
	}

	function goNext() {
		setCurrentStep(s => Math.min(s + 1, BUILD_TOTAL))
	}
	function goBack() {
		setCurrentStep(s => Math.max(s - 1, 1))
	}
	function handleTopNext() {
		if (!stepValidateRef.current()) return
		if (phase === "finish") {
			if (finishStep === 1) setFinishStep(2)
			return
		}
		if (currentStep === BUILD_TOTAL) {
			void handleCreateDraft()
			return
		}
		goNext()
	}

	// Language ISO code → display name mapping
	const LANG_MAP: Record<string, string> = {
		en: "English",
		hi: "Hindi",
		bn: "Bengali",
		ta: "Tamil",
		te: "Telugu",
		mr: "Marathi",
	}

	async function handleGenerate() {
		const trimmed = copilotPrompt.trim()
		if (!trimmed || copilotLoading) return
		setCopilotLoading(true)
		try {
			const draft = await generateEventDraft(trimmed)
			const cat = categories.find(c => c.id === draft.category_id)
			const mappedLang = LANG_MAP[draft.language]

			setFormData(prev => ({
				...prev,
				title: draft.title,
				desc: draft.description,
				category: cat?.id ?? prev.category,
				eventType: draft.event_format ?? prev.eventType,
				languages: mappedLang ? [mappedLang] : prev.languages,
				tags: draft.tags,
				whatToExpect: draft.what_to_expect,
				whoShouldAttend: draft.who_should_attend,
			}))
			setCopilot({ mode: "generated", draft, prompt: trimmed })
		} catch (err) {
			if (isAxiosError(err)) {
				const status = err.response?.status
				if (status === 400)
					toast.error("Prompt too short, too long, or contains unfilled placeholders.")
				else if (status === 403) toast.error("Host role required to use AI Copilot.")
				else toast.error(getApiErrorMessage(err))
			} else {
				toast.error(getApiErrorMessage(err))
			}
		} finally {
			setCopilotLoading(false)
		}
	}

	// Derive AI ticket initial drafts: only used when AI generated AND no user-edited tickets yet
	const aiInitialDrafts = useMemo<DraftTicket[] | undefined>(() => {
		if (copilot.mode !== "generated") return undefined
		if (formData.tickets.length > 0) return undefined
		return copilot.draft.ticket_tiers.map(tier => ({
			name: tier.name,
			price: String(tier.price),
			totalCapacity: tier.total_capacity != null ? String(tier.total_capacity) : "",
			maxPerPerson: String(tier.max_per_person),
			description: tier.description,
			saleStartDate: "",
			saleEndDate: "",
		}))
	}, [copilot, formData.tickets.length])

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
		} catch (err) {
			toast.error(getApiErrorMessage(err))
		}
	}

	// End of the 3-step build phase: persist the draft so the event exists, then
	// hand off to the finish phase for media + publishing settings.
	async function handleCreateDraft() {
		setSubmitting(true)
		try {
			if (draftId) {
				await updateEventDraft(draftId, buildPayload(formData))
			} else {
				const event = await createEventDraft(buildPayload(formData))
				setDraftId(event.id)
				localStorage.setItem(DRAFT_ID_KEY, event.id)
			}
			setPhase("finish")
			setFinishStep(1)
			toast.success("Draft saved — just a few finishing touches left.")
		} catch (err) {
			toast.error(getApiErrorMessage(err))
		} finally {
			setSubmitting(false)
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
			toast.success("Experience submitted for review!")
			router.push("/host/dashboard/events")
		} catch (err) {
			toast.error(getApiErrorMessage(err))
			setSubmitting(false)
		}
	}

	function requestSubmit() {
		setShowSubmitConfirm(true)
	}

	function handleLeave() {
		const hasData = !!(
			formData.title ||
			formData.desc ||
			formData.venueName ||
			formData.coverKey ||
			formData.tickets.length > 0
		)
		if (hasData && !draftId) {
			setShowLeaveConfirm(true)
		} else {
			router.push("/host/dashboard/events")
		}
	}

	async function handleSaveAndLeave() {
		await saveDraft()
		router.push("/host/dashboard/events")
	}

	// Hide the top-bar "Next step" only on the very last screen of the finish phase,
	// where Step5SettingsReview renders its own submit button.
	const isLastStep = phase === "finish" && finishStep === 2
	const sharedProps = { formData, setFormData }
	const copilotActive = copilot.mode !== "idle"

	if (experienceType === null) {
		return (
			<div className="flex flex-col min-h-screen bg-surface-page animate-in fade-in duration-150">
				<DashboardTopBar />
				<div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 max-w-4xl mx-auto">
					<div className="text-center mb-8 flex flex-col items-center">
						<h1 className="text-2xl sm:text-heading-sm font-bold text-text-primary">Choose Experience Type</h1>
						{profile && (
							<div className="flex items-center gap-2 mt-2 bg-surface-card border border-border-default px-3 py-1.5 rounded-full w-fit shadow-sm text-xs">
								<div className="size-5 rounded-full bg-red-100 flex items-center justify-center text-red-700 text-[10px] font-bold select-none overflow-hidden border border-border-default">
									{profile.avatarUrl ? (
										// eslint-disable-next-line @next/next/no-img-element
										<img src={profile.avatarUrl} alt={profile.displayName} className="size-full object-cover" />
									) : (
										profile.displayName?.[0]?.toUpperCase() || "H"
									)}
								</div>
								<span className="font-medium text-text-primary">{profile.displayName}</span>
								{profile.socialLinks?.instagram && (
									<>
										<span className="text-text-muted">•</span>
										<a
											href={profile.socialLinks.instagram.startsWith("http") ? profile.socialLinks.instagram : `https://instagram.com/${profile.socialLinks.instagram.replace(/^@/, "")}`}
											target="_blank"
											rel="noopener noreferrer"
											className="text-text-brand hover:underline font-medium"
										>
											{profile.socialLinks.instagram.includes("instagram.com") 
												? `@${profile.socialLinks.instagram.split("instagram.com/")[1]?.split("/")[0] || profile.socialLinks.instagram}` 
												: profile.socialLinks.instagram.startsWith("@") ? profile.socialLinks.instagram : `@${profile.socialLinks.instagram}`}
										</a>
									</>
								)}
							</div>
						)}
						<p className="text-body-sm text-text-secondary mt-3">
							Select the format of your experience to proceed with verification.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
						{/* Ticketed Card */}
						<div
							onClick={() => {
								setExperienceType("TICKETED")
							}}
							className="group relative cursor-pointer flex flex-col items-start p-6 rounded-3xl border border-border-default bg-surface-card shadow-md hover:shadow-xl hover:border-red-500/30 transition-all duration-300 overflow-hidden"
						>
							<div className="absolute -right-16 -top-16 size-48 rounded-full bg-red-500/10 blur-3xl group-hover:bg-red-500/20 transition-all duration-300" />
							<div className="size-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
								<Icon as={TicketSvg} size="md" color="inherit" />
							</div>
							<h2 className="text-lg font-bold text-text-primary leading-snug">
								Ticketed Experience
							</h2>
							<p className="text-body-xs text-text-secondary mt-2 mb-6 leading-relaxed">
								For paid or priced experiences. Allows configuring multiple ticket tiers, price levels, and receiving ticket payouts. Requires host KYC verification.
							</p>
							<div className="flex items-center gap-2 text-label-sm font-bold text-red-600 group-hover:translate-x-1.5 transition-transform duration-300">
								Choose Ticketed
								<Icon as={AltArrowRightSvg} size="xs" color="inherit" />
							</div>
						</div>

						{/* Non-Ticketed Card */}
						<div
							onClick={() => {
								setExperienceType("NON_TICKETED")
								const hasInstagram = !!profile?.socialLinks?.instagram
								if (!hasInstagram) {
									setShowSocialModal(true)
								}
							}}
							className="group relative cursor-pointer flex flex-col items-start p-6 rounded-3xl border border-border-default bg-surface-card shadow-md hover:shadow-xl hover:border-red-500/30 transition-all duration-300 overflow-hidden"
						>
							<div className="absolute -right-16 -top-16 size-48 rounded-full bg-red-500/10 blur-3xl group-hover:bg-red-500/20 transition-all duration-300" />
							<div className="size-12 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
								<Icon as={FileTextSvg} size="md" color="inherit" />
							</div>
							<h2 className="text-lg font-bold text-text-primary leading-snug">
								Non-Ticketed Experience
							</h2>
							<p className="text-body-xs text-text-secondary mt-2 mb-6 leading-relaxed">
								For free entry experiences. Requires providing a valid Instagram profile link for verification.
							</p>
							<div className="flex items-center gap-2 text-label-sm font-bold text-red-600 group-hover:translate-x-1.5 transition-transform duration-300">
								Choose Non-Ticketed
								<Icon as={AltArrowRightSvg} size="xs" color="inherit" />
							</div>
						</div>
					</div>
				</div>
			</div>
		)
	}

	return (
		<>
			{/* Collects the host-profile fields that the 2-step onboarding no longer asks for. */}
			{experienceType === "TICKETED" && (
				<HostDetailsPrompt onClose={() => setExperienceType(null)} />
			)}
			{experienceType === "NON_TICKETED" && showSocialModal && (
				<SocialLinksPrompt
					onSuccess={() => setShowSocialModal(false)}
					onClose={() => {
						setExperienceType(null)
						setShowSocialModal(false)
					}}
				/>
			)}
			<div className="flex flex-col h-screen overflow-hidden">
				<DashboardTopBar />

				{/* Action bar */}
				<div className="flex items-center justify-between px-6 lg:px-8 py-3 bg-surface-card border-b border-border-default shrink-0">
					<div className="flex items-center gap-3">
						<Button
							variant="secondary"
							size="sm"
							radius="md"
							onClick={handleLeave}
							aria-label="Close"
							className="border-0 text-text-secondary hover:text-text-primary"
						>
							<Icon as={AltXSvg} color="inherit" size="lg" aria-hidden />
						</Button>
						<h2 className="text-label-md font-semibold text-text-primary">
							{phase === "finish" ? "Finish your listing" : "Create New Experience"}
						</h2>
						{profile && (
							<div className="flex items-center gap-2 bg-surface-card border border-border-default px-2.5 py-1 rounded-full shadow-sm text-[10px]">
								<div className="size-5 rounded-full bg-red-100 flex items-center justify-center text-red-700 text-[9px] font-bold select-none overflow-hidden border border-border-default">
									{profile.avatarUrl ? (
										// eslint-disable-next-line @next/next/no-img-element
										<img src={profile.avatarUrl} alt={profile.displayName} className="size-full object-cover" />
									) : (
										profile.displayName?.[0]?.toUpperCase() || "H"
									)}
								</div>
								<span className="font-medium text-text-primary">{profile.displayName}</span>
								{profile.socialLinks?.instagram && (
									<>
										<span className="text-text-muted">•</span>
										<a
											href={profile.socialLinks.instagram.startsWith("http") ? profile.socialLinks.instagram : `https://instagram.com/${profile.socialLinks.instagram.replace(/^@/, "")}`}
											target="_blank"
											rel="noopener noreferrer"
											className="text-text-brand hover:underline font-medium"
										>
											{profile.socialLinks.instagram.includes("instagram.com") 
												? `@${profile.socialLinks.instagram.split("instagram.com/")[1]?.split("/")[0] || profile.socialLinks.instagram}` 
												: profile.socialLinks.instagram.startsWith("@") ? profile.socialLinks.instagram : `@${profile.socialLinks.instagram}`}
										</a>
									</>
								)}
							</div>
						)}
					</div>

					<div className="flex items-center gap-3">
						<Button
							variant="secondary"
							onClick={saveDraft}
							size="sm"
							radius="md"
							leftIcon={<Icon as={UploadSvg} size="sm" aria-hidden />}
						>
							{draftSaved ? "Saved!" : "Save draft"}
						</Button>
						{!isLastStep && (
							<Button
								onClick={handleTopNext}
								size="sm"
								radius="md"
								rightIcon={<AltArrowRightSvg size="sm" aria-hidden />}
								className="bg-neutral-900"
								disabled={submitting}
							>
								{phase === "build" && currentStep === BUILD_TOTAL
									? submitting
										? "Saving…"
										: "Create experience"
									: "Next step"}
							</Button>
						)}
					</div>
				</div>

				{/* Body */}
				<div className="flex flex-1 overflow-hidden">
					{phase === "build" ? (
						<ExperienceBuilderSidebar currentStep={currentStep} />
					) : (
						<ExperienceBuilderSidebar
							currentStep={finishStep}
							steps={FINISH_STEPS}
							heading="Finish your listing"
							caption="Required before submitting for review"
						/>
					)}

					<div className="flex-1 px-6 lg:px-10 py-8 overflow-y-auto bg-surface-page">
						<div className="relative max-w-4xl">
							<div
								className="absolute top-0 right-0 w-40 h-40 opacity-30 pointer-events-none"
								style={{
									backgroundImage:
										"radial-gradient(circle, var(--color-border-default) 1.5px, transparent 1.5px)",
									backgroundSize: "16px 16px",
								}}
								aria-hidden
							/>
							<div className="relative">
								{/* Step 1 */}
								{phase === "build" && currentStep === 1 && (
									<>
										{copilot.mode === "idle" && (
											<CopilotIdleBanner
												onStart={() => setCopilot({ mode: "prompt" })}
											/>
										)}
										{copilot.mode === "generated" && <AIDraftBanner />}
										{copilot.mode === "prompt" ? (
											<PromptScreen
												prompt={copilotPrompt}
												onPromptChange={setCopilotPrompt}
												onGenerate={handleGenerate}
												onSkip={() => setCopilot({ mode: "idle" })}
												loading={copilotLoading}
											/>
										) : (
											<Step1BasicInfo
												{...sharedProps}
												onNext={goNext}
												registerValidate={registerValidate}
												categories={categories}
												categoriesLoading={categoriesLoading}
											/>
										)}
									</>
								)}

								{/* Step 2 */}
								{phase === "build" && currentStep === 2 && (
									<>
										{copilotActive && (
											<AIStepBanner
												title="AI Suggested Schedule & Venue Details"
												desc="Meetday AI Copilot has prefilled these details based on your prompt. Check the suggestions panel for timing recommendations."
											/>
										)}
										<Step2DateTime
											{...sharedProps}
											onNext={goNext}
											onBack={goBack}
											registerValidate={registerValidate}
										/>
									</>
								)}

								{/* Step 3 — tickets, last of the build phase */}
								{phase === "build" && currentStep === 3 && (
									<Step4TicketTypes
										{...sharedProps}
										onNext={() => void handleCreateDraft()}
										onBack={goBack}
										registerValidate={registerValidate}
										aiInitialDrafts={aiInitialDrafts}
										aiSuggested={copilot.mode === "generated"}
										isFreeEvent={experienceType === "NON_TICKETED"}
									/>
								)}

								{/* Finish 1 — media */}
								{phase === "finish" && finishStep === 1 && (
									<>
										{copilotActive && (
											<AIStepBanner
												title="Media Upload"
												desc="Copilot helps build your event details, but cover images, gallery photos, and videos must be uploaded manually."
											/>
										)}
										<Step3MediaUpload
											{...sharedProps}
											onNext={() => setFinishStep(2)}
											onBack={() => {
												setPhase("build")
												setCurrentStep(BUILD_TOTAL)
											}}
											registerValidate={registerValidate}
										/>
									</>
								)}

								{/* Finish 2 — settings & review */}
								{phase === "finish" && finishStep === 2 && (
									<Step5SettingsReview
										{...sharedProps}
										onBack={() => setFinishStep(1)}
										registerValidate={registerValidate}
										onSubmit={requestSubmit}
										submitting={submitting}
										hideSummary={copilotActive}
									/>
								)}
							</div>
						</div>
					</div>

					{/* AI Copilot right panel — only shown when copilot is active */}
					{copilotActive && (
						<CopilotPanel
							copilot={copilot as CopilotPanelState}
							currentStep={phase === "finish" ? BUILD_TOTAL + finishStep : currentStep}
							summary={phase === "finish" && finishStep === 2 ? {
								coverUrl: formData.coverUrl,
								title: formData.title,
								eventDate: formData.eventDate,
								venueName: formData.venueName,
								ticketCount: formData.tickets.length,
								totalCapacity: formData.tickets.reduce((s, t) => s + t.totalCapacity, 0),
							} satisfies EventSummaryData : undefined}
						/>
					)}
				</div>
			</div>

			{/* Submit confirmation modal */}
			{showSubmitConfirm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
					<div className="bg-surface-card rounded-action border border-border-default shadow-floating w-full max-w-sm p-6">
						<h2 className="text-label-lg font-semibold text-text-primary mb-2">
							Submit for Review?
						</h2>
						<p className="text-body-sm text-text-secondary mb-6">
							Once submitted, your event will be sent to the team for review. You won&apos;t be
							able to edit it until a decision is made.
						</p>
						<div className="flex gap-3 justify-end">
							<Button
								variant="secondary"
								size="sm"
								radius="md"
								onClick={() => setShowSubmitConfirm(false)}
								disabled={submitting}
							>
								Cancel
							</Button>
							<Button
								variant="primary"
								size="sm"
								radius="md"
								onClick={() => { setShowSubmitConfirm(false); handleSubmit() }}
								disabled={submitting}
								leftIcon={submitting ? <MiniSpinner /> : undefined}
							>
								Submit
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Leave confirmation modal */}
			{showLeaveConfirm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
					<div className="bg-surface-card rounded-action border border-border-default shadow-floating w-full max-w-sm p-6">
						<h2 className="text-label-lg font-semibold text-text-primary mb-2">
							Leave without saving?
						</h2>
						<p className="text-body-sm text-text-secondary mb-6">
							Your progress is only saved locally. Save as a draft to keep it on the server
							before you leave.
						</p>
						<div className="flex gap-3 justify-end">
							<Button
								variant="secondary"
								onClick={() => setShowLeaveConfirm(false)}
								size="sm"
								radius="md"
							>
								Cancel
							</Button>
							<Button
								variant="secondary"
								onClick={() => {
									localStorage.removeItem(DRAFT_KEY)
									localStorage.removeItem(DRAFT_ID_KEY)
									router.push("/host/dashboard/events")
								}}
								size="sm"
								radius="md"
							>
								Leave Anyway
							</Button>
							<Button variant="primary" onClick={handleSaveAndLeave} size="sm" radius="md">
								Save Draft
							</Button>
						</div>
					</div>
				</div>
			)}
		</>
	)
}

function SocialLinksPrompt({
	onClose,
	onSuccess,
}: {
	onClose: () => void
	onSuccess: () => void
}) {
	const { profile, setProfile } = useHostStore()
	const [instagram, setInstagram] = useState(profile?.socialLinks?.instagram ?? "")
	const [linkedin, setLinkedin] = useState(profile?.socialLinks?.linkedin ?? "")
	const [youtube, setYoutube] = useState(profile?.socialLinks?.youtube ?? "")
	const [portfolio, setPortfolio] = useState(profile?.socialLinks?.portfolio ?? "")
	const [saving, setSaving] = useState(false)

	const handleSubmit = async () => {
		if (!instagram.trim()) {
			toast.error("Instagram profile link is required.")
			return
		}

		setSaving(true)
		try {
			const updated = await updateHostProfile({
				socialLinks: {
					instagram: instagram.trim() || undefined,
					linkedin: linkedin.trim() || undefined,
					youtube: youtube.trim() || undefined,
					portfolio: portfolio.trim() || undefined,
				}
			})
			setProfile(updated)
			toast.success("Social links updated successfully!")
			onSuccess()
		} catch (err) {
			toast.error("Failed to update social links. Please check the network and try again.")
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
			<div className="relative w-full max-w-md bg-surface-card rounded-action shadow-modal p-6 flex flex-col gap-6 border border-border-default">
				<div>
					<h3 className="text-lg font-bold text-text-primary">Social Media Verification</h3>
					<p className="text-body-sm text-text-secondary mt-1">
						Please provide a valid Instagram profile link (e.g. instagram.com/username) to verify your host profile. Other fields are optional.
					</p>
				</div>

				<div className="flex flex-col gap-4">
					<div>
						<label className="text-xs font-semibold text-text-secondary block mb-1">Instagram Link</label>
						<input
							type="text"
							value={instagram}
							onChange={(e) => setInstagram(e.target.value)}
							placeholder="https://instagram.com/yourprofile"
							className="w-full px-3 py-2 border border-border-default rounded-lg text-sm bg-surface-canvas text-text-primary outline-none focus:border-border-focused"
						/>
					</div>

					<div>
						<label className="text-xs font-semibold text-text-secondary block mb-1">LinkedIn Link</label>
						<input
							type="text"
							value={linkedin}
							onChange={(e) => setLinkedin(e.target.value)}
							placeholder="https://linkedin.com/in/yourprofile"
							className="w-full px-3 py-2 border border-border-default rounded-lg text-sm bg-surface-canvas text-text-primary outline-none focus:border-border-focused"
						/>
					</div>

					<div>
						<label className="text-xs font-semibold text-text-secondary block mb-1">YouTube Link</label>
						<input
							type="text"
							value={youtube}
							onChange={(e) => setYoutube(e.target.value)}
							placeholder="https://youtube.com/@yourchannel"
							className="w-full px-3 py-2 border border-border-default rounded-lg text-sm bg-surface-canvas text-text-primary outline-none focus:border-border-focused"
						/>
					</div>

					<div>
						<label className="text-xs font-semibold text-text-secondary block mb-1">Website / Portfolio</label>
						<input
							type="text"
							value={portfolio}
							onChange={(e) => setPortfolio(e.target.value)}
							placeholder="https://yourwebsite.com"
							className="w-full px-3 py-2 border border-border-default rounded-lg text-sm bg-surface-canvas text-text-primary outline-none focus:border-border-focused"
						/>
					</div>
				</div>

				<div className="flex justify-end gap-3 pt-2">
					<Button variant="secondary" size="sm" radius="pill" onClick={onClose} disabled={saving}>
						Cancel
					</Button>
					<Button variant="primary" size="sm" radius="pill" onClick={handleSubmit} disabled={saving}>
						{saving ? "Saving..." : "Verify & Proceed"}
					</Button>
				</div>
			</div>
		</div>
	)
}
