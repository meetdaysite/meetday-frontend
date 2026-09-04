"use client"

import { useRef, useState } from "react"
import { toast } from "@/lib/toast"
import {
	generateProposalDeckPlan,
	finalizeProposalDeck,
	getUploadUrl,
	type DeckSlide,
	type DeckTheme,
	type DeckFontVibe,
	type DeckStat,
	type FinalizeProposalDeckResult,
} from "@/lib/api"

type PastSponsorDraft = { name: string; projectReference: string; logoFile: File | null; logoPreview: string | null }

export type ProposalDeckBuilderProps = {
	// Bound directly to the parent Create/Edit Proposal form's own fields.
	eventTitle: string
	onEventTitleChange: (value: string) => void
	eventOverview: string
	onEventOverviewChange: (value: string) => void
	eventDate?: string
	onEventDateChange?: (value: string) => void
	sponsorTiers?: { name: string; price: string }[]
	openToBarter?: boolean
	// Seed values only — these become independent local state within the deck builder.
	defaultHostName?: string
	defaultAboutCommunity?: string
	defaultLocation?: string
	defaultHeroMetricValue?: string
	defaultTargetAudienceProfile?: string
	onClose: () => void
	onAttached: (result: FinalizeProposalDeckResult) => void
}

const THEME_OPTIONS: { value: DeckTheme; label: string; hint: string }[] = [
	{ value: "AUTO", label: "Auto", hint: "Dark cover/closing, light content slides" },
	{ value: "LIGHT", label: "Light Mode", hint: "All slides light background" },
	{ value: "DARK", label: "Dark Mode", hint: "All slides dark background" },
]

const FONT_OPTIONS: { value: DeckFontVibe; label: string }[] = [
	{ value: "MODERN_SANS", label: "Modern Sans-Serif" },
	{ value: "CLASSIC_SERIF", label: "Classic Serif" },
	{ value: "TECH_GEOMETRIC", label: "Tech / Geometric" },
	{ value: "MINIMALIST", label: "Minimalist" },
]

// Every image gets base64-inlined into the rendered PDF's HTML — an uncapped file size here
// risks blowing Puppeteer's container memory once several logos/sponsor logos/media assets
// are all embedded into one 10-slide document at once.
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

async function uploadFileAndGetKey(file: File): Promise<string> {
	const { url, key } = await getUploadUrl({ context: "SPONSORSHIP_MEDIA", contentType: file.type })
	await fetch(url, { method: "PUT", headers: { "Content-Type": file.type }, body: file })
	return key
}

function SectionLabel({ children }: { children: string }) {
	return <p className="text-[10px] font-black uppercase tracking-wider text-black/40">{children}</p>
}

// AI-powered pitch-deck generator, embedded in the Create/Edit Proposal form alongside manual
// document upload. Two steps: (1) fill Host & Event Basics / Design & Brand Identity Tokens /
// Narrative & Copy Prompts / Audience & Traction Data / Sponsorship Offerings & Pricing, AI
// fills a fallback for any optional narrative field left empty; (2) review/edit the 10-slide
// plan (design/layout is locked, only text is editable), then Upload (attach) or Discard.
export function ProposalDeckBuilder({
	eventTitle,
	onEventTitleChange,
	eventOverview,
	onEventOverviewChange,
	eventDate,
	onEventDateChange,
	sponsorTiers,
	openToBarter,
	defaultHostName,
	defaultAboutCommunity,
	defaultLocation,
	defaultHeroMetricValue,
	defaultTargetAudienceProfile,
	onClose,
	onAttached,
}: ProposalDeckBuilderProps) {
	const [step, setStep] = useState<"form" | "preview">("form")

	// Host & Event Basics
	const [hostName, setHostName] = useState(defaultHostName ?? "")
	const [tagline, setTagline] = useState("")
	const [aboutCommunity, setAboutCommunity] = useState(defaultAboutCommunity ?? "")
	const [eventTime, setEventTime] = useState("")
	const [location, setLocation] = useState(defaultLocation ?? "")

	// Design & Brand Identity Tokens
	const [theme, setTheme] = useState<DeckTheme>("AUTO")
	const [fontVibe, setFontVibe] = useState<DeckFontVibe>("MODERN_SANS")
	const [primaryColor, setPrimaryColor] = useState("#EE2C2C")
	const [accentColor, setAccentColor] = useState("#FFC940")
	const [primaryLogoFile, setPrimaryLogoFile] = useState<File | null>(null)
	const [secondaryLogoFile, setSecondaryLogoFile] = useState<File | null>(null)
	const [primaryLogoPreview, setPrimaryLogoPreview] = useState<string | null>(null)
	const [secondaryLogoPreview, setSecondaryLogoPreview] = useState<string | null>(null)
	const [mediaKitUrl, setMediaKitUrl] = useState("")
	const [mediaAssetFiles, setMediaAssetFiles] = useState<File[]>([])
	const primaryLogoInputRef = useRef<HTMLInputElement>(null)
	const secondaryLogoInputRef = useRef<HTMLInputElement>(null)
	const mediaAssetsInputRef = useRef<HTMLInputElement>(null)

	// Narrative & Copy Prompts
	const [sponsorROIPitch, setSponsorROIPitch] = useState("")

	// Audience & Traction Data
	const [heroMetricValue, setHeroMetricValue] = useState(defaultHeroMetricValue ?? "")
	const [heroMetricLabel, setHeroMetricLabel] = useState("Attendees")
	const [targetAudienceProfile, setTargetAudienceProfile] = useState(defaultTargetAudienceProfile ?? "")
	const [pastSponsors, setPastSponsors] = useState<PastSponsorDraft[]>([])
	const pastSponsorLogoInputRef = useRef<HTMLInputElement>(null)
	const [pastSponsorLogoTargetIdx, setPastSponsorLogoTargetIdx] = useState<number | null>(null)

	// Sponsorship Offerings & Pricing
	const [sponsorshipDeadline, setSponsorshipDeadline] = useState("")
	const [onsiteDeliverables, setOnsiteDeliverables] = useState("")
	const [digitalDeliverables, setDigitalDeliverables] = useState("")
	const [customPerks, setCustomPerks] = useState("")

	// Contact (shown on the closing slide)
	const [contactName, setContactName] = useState(defaultHostName ?? "")
	const [contactEmail, setContactEmail] = useState("")
	const [contactPhone, setContactPhone] = useState("")

	const [attemptedSubmit, setAttemptedSubmit] = useState(false)
	const [generating, setGenerating] = useState(false)
	const [finalizing, setFinalizing] = useState(false)
	const [slides, setSlides] = useState<DeckSlide[]>([])

	const hostNameError = attemptedSubmit && !hostName.trim() ? "Community/Host Name is required." : null
	const eventTitleError = attemptedSubmit && !eventTitle.trim() ? "Event Title is required." : null
	const primaryLogoError = attemptedSubmit && !primaryLogoFile ? "Primary logo (dark backgrounds) is required." : null
	const secondaryLogoError = attemptedSubmit && !secondaryLogoFile ? "Secondary logo (light backgrounds) is required." : null
	const contactEmailError = attemptedSubmit && !contactEmail.trim() ? "Contact email is required." : null
	const taglineError = tagline.length > 80 ? "Tagline must be 80 characters or fewer." : null
	const errorInputClass = "border-red-500 focus:border-red-500"

	function updateSlide(idx: number, patch: Partial<DeckSlide>) {
		setSlides(prev => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)))
	}

	function updateBullet(idx: number, bulletIdx: number, value: string) {
		setSlides(prev =>
			prev.map((s, i) => (i === idx ? { ...s, bullets: (s.bullets ?? []).map((b, bi) => (bi === bulletIdx ? value : b)) } : s)),
		)
	}

	function updateStat(idx: number, statIdx: number, patch: Partial<DeckStat>) {
		setSlides(prev =>
			prev.map((s, i) =>
				i === idx ? { ...s, stats: (s.stats ?? []).map((st, sti) => (sti === statIdx ? { ...st, ...patch } : st)) } : s,
			),
		)
	}

	function addPastSponsor() {
		if (pastSponsors.length >= 4) return
		setPastSponsors(prev => [...prev, { name: "", projectReference: "", logoFile: null, logoPreview: null }])
	}

	function updatePastSponsor(idx: number, patch: Partial<PastSponsorDraft>) {
		setPastSponsors(prev => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)))
	}

	function removePastSponsor(idx: number) {
		setPastSponsors(prev => prev.filter((_, i) => i !== idx))
	}

	function handlePastSponsorLogoPick(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		e.target.value = ""
		if (!file || pastSponsorLogoTargetIdx === null) return
		if (file.size > MAX_IMAGE_SIZE_BYTES) {
			toast.error("Logo image must be 5MB or smaller.")
			return
		}
		updatePastSponsor(pastSponsorLogoTargetIdx, { logoFile: file, logoPreview: URL.createObjectURL(file) })
		setPastSponsorLogoTargetIdx(null)
	}

	function handleLogoPick(e: React.ChangeEvent<HTMLInputElement>, variant: "primary" | "secondary") {
		const file = e.target.files?.[0]
		e.target.value = ""
		if (!file) return
		if (file.size > MAX_IMAGE_SIZE_BYTES) {
			toast.error("Logo image must be 5MB or smaller.")
			return
		}
		const previewUrl = URL.createObjectURL(file)
		if (variant === "primary") {
			setPrimaryLogoFile(file)
			setPrimaryLogoPreview(previewUrl)
		} else {
			setSecondaryLogoFile(file)
			setSecondaryLogoPreview(previewUrl)
		}
	}

	function handleMediaAssetsPick(e: React.ChangeEvent<HTMLInputElement>) {
		const files = Array.from(e.target.files ?? [])
		e.target.value = ""
		if (!files.length) return
		const oversized = files.filter(f => f.size > MAX_IMAGE_SIZE_BYTES)
		if (oversized.length) {
			toast.error("Each image must be 5MB or smaller — some were skipped.")
		}
		setMediaAssetFiles(prev => [...prev, ...files.filter(f => f.size <= MAX_IMAGE_SIZE_BYTES)].slice(0, 10))
	}

	async function handleGenerate() {
		setAttemptedSubmit(true)
		if (!hostName.trim() || !eventTitle.trim() || !primaryLogoFile || !secondaryLogoFile || !contactEmail.trim()) {
			toast.error("Please fill in all required fields, highlighted in red below.")
			return
		}
		setGenerating(true)
		try {
			const { slides: planSlides } = await generateProposalDeckPlan({
				hostName: hostName.trim(),
				eventTitle: eventTitle.trim(),
				tagline: tagline.trim() || undefined,
				aboutCommunity: aboutCommunity.trim() || undefined,
				eventOverview: eventOverview.trim() || undefined,
				sponsorROIPitch: sponsorROIPitch.trim() || undefined,
				location: location.trim() || undefined,
				heroMetricValue: heroMetricValue.trim() || undefined,
				heroMetricLabel: heroMetricLabel.trim() || undefined,
				targetAudienceProfile: targetAudienceProfile.trim() || undefined,
				pastSponsors: pastSponsors
					.filter(p => p.name.trim())
					.map(p => ({ name: p.name.trim(), projectReference: p.projectReference.trim() || undefined })),
				sponsorTiers,
				openToBarter,
				sponsorshipDeadline: sponsorshipDeadline || undefined,
				onsiteDeliverables: onsiteDeliverables.trim() || undefined,
				digitalDeliverables: digitalDeliverables.trim() || undefined,
				customPerks: customPerks.trim() || undefined,
			})
			setSlides(
				planSlides.map(s =>
					s.layout === "CLOSING_CONTACT"
						? { ...s, contactName: contactName.trim(), contactEmail: contactEmail.trim(), contactPhone: contactPhone.trim() || undefined }
						: s,
				),
			)
			setStep("preview")
		} catch (err) {
			console.error(err)
			const axiosErr = err as { response?: { data?: { message?: string | string[] } }; message?: string }
			const serverMessage = axiosErr?.response?.data?.message
			const detail = Array.isArray(serverMessage) ? serverMessage.join(", ") : serverMessage
			toast.error(detail || axiosErr?.message || "Failed to generate deck content. Please try again.")
		} finally {
			setGenerating(false)
		}
	}

	function handleDiscard() {
		setSlides([])
		setStep("form")
	}

	async function handleUpload() {
		setFinalizing(true)
		try {
			const [primaryLogoKey, secondaryLogoKey, mediaAssetKeys] = await Promise.all([
				primaryLogoFile ? uploadFileAndGetKey(primaryLogoFile) : Promise.resolve(undefined),
				secondaryLogoFile ? uploadFileAndGetKey(secondaryLogoFile) : Promise.resolve(undefined),
				Promise.all(mediaAssetFiles.map(uploadFileAndGetKey)),
			])

			const slidesWithSponsorLogos = await Promise.all(
				slides.map(async slide => {
					if (slide.layout !== "PAST_SPONSORS") return slide
					const resolved = await Promise.all(
						pastSponsors
							.filter(p => p.name.trim())
							.map(async p => ({
								name: p.name.trim(),
								projectReference: p.projectReference.trim() || undefined,
								logoKey: p.logoFile ? await uploadFileAndGetKey(p.logoFile) : undefined,
							})),
					)
					return { ...slide, pastSponsors: resolved }
				}),
			)

			const result = await finalizeProposalDeck({
				slides: slidesWithSponsorLogos,
				theme,
				fontVibe,
				primaryColor,
				accentColor,
				primaryLogoKey,
				secondaryLogoKey,
				mediaKitUrl: mediaKitUrl.trim() || undefined,
				mediaAssetKeys: mediaAssetKeys.length ? mediaAssetKeys : undefined,
			})
			toast.success("Proposal deck generated and attached!")
			onAttached(result)
		} catch (err) {
			console.error(err)
			const axiosErr = err as { response?: { data?: { message?: string | string[] } }; message?: string }
			const serverMessage = axiosErr?.response?.data?.message
			const detail = Array.isArray(serverMessage) ? serverMessage.join(", ") : serverMessage
			toast.error(detail || axiosErr?.message || "Failed to generate the final deck. Please try again.")
		} finally {
			setFinalizing(false)
		}
	}

	return (
		<div className="animate-in fade-in duration-150 flex flex-col gap-6">
			<input ref={pastSponsorLogoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePastSponsorLogoPick} />

			<div className="flex justify-between items-center shrink-0">
				<div className="flex flex-col gap-1">
					<div
						className="flex items-center gap-2 cursor-pointer text-black/60 hover:text-black"
						onClick={() => (step === "preview" ? setStep("form") : onClose())}
					>
						<span className="text-xl font-bold">←</span>
						<h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-black leading-tight">
							{step === "form" ? "Create a Deck with Meetday" : "Review Slide Content"}
						</h1>
					</div>
					<p className="text-sm font-semibold text-black/50 mt-1">
						{step === "form"
							? "Fill in your event and brand details — AI fills in the rest of the copy"
							: "Edit the AI-written copy for each slide, then upload or discard"}
					</p>
				</div>
				{step === "form" ? (
					<button
						type="button"
						onClick={handleGenerate}
						disabled={generating}
						className="bg-[#EE2C2C] text-white text-[9px] font-black px-4 py-2.5 rounded-lg uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all select-none disabled:opacity-50"
					>
						{generating ? "Planning…" : "Generate with AI"}
					</button>
				) : (
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={handleDiscard}
							disabled={finalizing}
							className="bg-white text-black text-[9px] font-black px-4 py-2.5 rounded-lg uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all select-none disabled:opacity-50"
						>
							Discard
						</button>
						<button
							type="button"
							onClick={handleUpload}
							disabled={finalizing}
							className="bg-[#EE2C2C] text-white text-[9px] font-black px-4 py-2.5 rounded-lg uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all select-none disabled:opacity-50"
						>
							{finalizing ? "Uploading…" : "Upload"}
						</button>
					</div>
				)}
			</div>

			{step === "form" ? (
				<div className="flex flex-col gap-6">
					{/* Host & Event Basics */}
					<div className="border-[3px] border-dashed border-black/30 rounded-[28px] p-6 bg-white flex flex-col gap-4 w-full">
						<SectionLabel>Host & Event Basics</SectionLabel>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-black">Community / Host Name *</label>
								<input
									type="text"
									value={hostName}
									onChange={e => setHostName(e.target.value)}
									className={`h-10 px-4 rounded-xl border bg-slate-50 text-black outline-none hover:border-black/30 text-sm transition-colors ${hostNameError ? errorInputClass : "border-black/10 focus:border-black"}`}
								/>
								{hostNameError && <span className="text-[10px] font-semibold text-red-600">{hostNameError}</span>}
							</div>
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-black">Event Title *</label>
								<input
									type="text"
									value={eventTitle}
									onChange={e => onEventTitleChange(e.target.value)}
									placeholder="e.g. Night Rituals — Kolkata Music Fest"
									className={`h-10 px-4 rounded-xl border bg-slate-50 text-black outline-none hover:border-black/30 text-sm transition-colors ${eventTitleError ? errorInputClass : "border-black/10 focus:border-black"}`}
								/>
								{eventTitleError && <span className="text-[10px] font-semibold text-red-600">{eventTitleError}</span>}
							</div>
						</div>

						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-black">About the Community <span className="text-black/40 font-medium">(optional)</span></label>
							<textarea
								value={aboutCommunity}
								onChange={e => setAboutCommunity(e.target.value)}
								rows={2}
								placeholder="Leave empty to let AI write this from your other details"
								className="p-3 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors resize-none"
							/>
						</div>

						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-black">Event Tagline / One-Liner <span className="text-black/40 font-medium">(optional, max 80 chars)</span></label>
							<input
								type="text"
								value={tagline}
								onChange={e => setTagline(e.target.value.slice(0, 80))}
								maxLength={80}
								placeholder="Leave empty to let AI write one"
								className={`h-10 px-4 rounded-xl border bg-slate-50 text-black outline-none hover:border-black/30 text-sm transition-colors ${taglineError ? errorInputClass : "border-black/10 focus:border-black"}`}
							/>
							<span className={`text-[10px] font-semibold ${taglineError ? "text-red-600" : "text-black/40"}`}>{taglineError ?? `${tagline.length}/80 characters`}</span>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-black">Event Date</label>
								<input
									type="date"
									value={eventDate ?? ""}
									onChange={e => onEventDateChange?.(e.target.value)}
									className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
								/>
							</div>
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-black">Event Time</label>
								<input
									type="text"
									value={eventTime}
									onChange={e => setEventTime(e.target.value)}
									placeholder="e.g. 7:00 PM – 11:00 PM"
									className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
								/>
							</div>
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-black">Location / Venue</label>
								<input
									type="text"
									value={location}
									onChange={e => setLocation(e.target.value)}
									placeholder="City, venue, or virtual link"
									className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
								/>
							</div>
						</div>
					</div>

					{/* Design & Brand Identity Tokens */}
					<div className="border-[3px] border-dashed border-black/30 rounded-[28px] p-6 bg-white flex flex-col gap-4 w-full">
						<SectionLabel>Design & Brand Identity Tokens</SectionLabel>

						<div className="flex flex-col gap-2">
							<label className="text-xs font-bold text-black">Deck Color Theme</label>
							<div className="grid grid-cols-3 gap-2">
								{THEME_OPTIONS.map(opt => (
									<button
										key={opt.value}
										type="button"
										onClick={() => setTheme(opt.value)}
										className={`flex flex-col items-start gap-0.5 p-3 rounded-xl border-2 text-left transition-all ${
											theme === opt.value ? "border-black bg-[#FFC940]/20" : "border-black/10 hover:border-black/30"
										}`}
									>
										<span className="text-xs font-black text-black">{opt.label}</span>
										<span className="text-[10px] text-black/50">{opt.hint}</span>
									</button>
								))}
							</div>
						</div>

						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-black">Visual Style / Font Vibe</label>
							<select
								value={fontVibe}
								onChange={e => setFontVibe(e.target.value as DeckFontVibe)}
								className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
							>
								{FONT_OPTIONS.map(opt => (
									<option key={opt.value} value={opt.value}>{opt.label}</option>
								))}
							</select>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-black">Primary Brand Color <span className="text-black/40 font-medium">(optional)</span></label>
								<div className="flex items-center gap-2">
									<input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="size-10 rounded-lg border border-black/10 cursor-pointer" />
									<span className="text-xs font-semibold text-black/60">{primaryColor}</span>
								</div>
							</div>
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-black">Accent / Highlight Color <span className="text-black/40 font-medium">(optional)</span></label>
								<div className="flex items-center gap-2">
									<input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="size-10 rounded-lg border border-black/10 cursor-pointer" />
									<span className="text-xs font-semibold text-black/60">{accentColor}</span>
								</div>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-black">Primary Logo (Dark Backgrounds) *</label>
								<input ref={primaryLogoInputRef} type="file" accept="image/*,.svg" className="hidden" onChange={e => handleLogoPick(e, "primary")} />
								<button
									type="button"
									onClick={() => primaryLogoInputRef.current?.click()}
									className={`flex items-center gap-3 px-3 py-2 bg-neutral-900 border rounded-xl text-xs font-bold hover:bg-neutral-800 transition-colors ${primaryLogoError ? "border-red-500" : "border-black"}`}
								>
									{primaryLogoPreview ? (
										// eslint-disable-next-line @next/next/no-img-element
										<img src={primaryLogoPreview} alt="Primary logo" className="size-8 rounded object-contain bg-white/10" />
									) : (
										<span className="size-8 rounded bg-white/10 flex items-center justify-center text-white/40 text-[10px]">Logo</span>
									)}
									<span className="text-white">Choose Logo</span>
								</button>
								{primaryLogoError && <span className="text-[10px] font-semibold text-red-600">{primaryLogoError}</span>}
							</div>
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-black">Secondary Logo (Light Backgrounds) *</label>
								<input ref={secondaryLogoInputRef} type="file" accept="image/*,.svg" className="hidden" onChange={e => handleLogoPick(e, "secondary")} />
								<button
									type="button"
									onClick={() => secondaryLogoInputRef.current?.click()}
									className={`flex items-center gap-3 px-3 py-2 bg-white border rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors ${secondaryLogoError ? "border-red-500" : "border-black"}`}
								>
									{secondaryLogoPreview ? (
										// eslint-disable-next-line @next/next/no-img-element
										<img src={secondaryLogoPreview} alt="Secondary logo" className="size-8 rounded object-contain" />
									) : (
										<span className="size-8 rounded bg-slate-100 flex items-center justify-center text-black/30 text-[10px]">Logo</span>
									)}
									<span className="text-black">Choose Logo</span>
								</button>
								{secondaryLogoError && <span className="text-[10px] font-semibold text-red-600">{secondaryLogoError}</span>}
							</div>
						</div>
						<span className="text-[10px] text-black/40 -mt-2">
							If only one logo is provided, it&apos;s used for both with an automatic contrast backing.
						</span>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-black">Brand Media Kit / Guidelines <span className="text-black/40 font-medium">(optional)</span></label>
								<input
									type="url"
									value={mediaKitUrl}
									onChange={e => setMediaKitUrl(e.target.value)}
									placeholder="Link to a doc, deck, or website"
									className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
								/>
							</div>
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-black">Brand Media Assets <span className="text-black/40 font-medium">(optional, up to 10 images)</span></label>
								<input ref={mediaAssetsInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleMediaAssetsPick} />
								<button
									type="button"
									onClick={() => mediaAssetsInputRef.current?.click()}
									className="px-4 py-2 bg-white border border-black rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50 transition-colors self-start"
								>
									Choose Images ({mediaAssetFiles.length}/10)
								</button>
							</div>
						</div>
					</div>

					{/* Narrative & Copy Prompts */}
					<div className="border-[3px] border-dashed border-black/30 rounded-[28px] p-6 bg-white flex flex-col gap-4 w-full">
						<SectionLabel>Narrative & Copy Prompts</SectionLabel>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-black">Event Overview <span className="text-black/40 font-medium">(2–3 sentences on theme and objective)</span></label>
							<textarea
								value={eventOverview}
								onChange={e => onEventOverviewChange(e.target.value)}
								rows={3}
								placeholder="Describe your project's details, format, and goals..."
								className="p-3 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors resize-none"
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-black">Sponsor ROI Pitch <span className="text-black/40 font-medium">(optional — 2–3 sentences on why a brand should sponsor)</span></label>
							<textarea
								value={sponsorROIPitch}
								onChange={e => setSponsorROIPitch(e.target.value)}
								rows={3}
								placeholder="Leave empty to let AI write this"
								className="p-3 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors resize-none"
							/>
						</div>
					</div>

					{/* Audience & Traction Data */}
					<div className="border-[3px] border-dashed border-black/30 rounded-[28px] p-6 bg-white flex flex-col gap-4 w-full">
						<SectionLabel>Audience & Traction Data</SectionLabel>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-black">Hero Audience Metric</label>
								<div className="flex gap-2">
									<input
										type="text"
										value={heroMetricValue}
										onChange={e => setHeroMetricValue(e.target.value)}
										placeholder="1,200"
										className="w-1/2 h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
									/>
									<input
										type="text"
										value={heroMetricLabel}
										onChange={e => setHeroMetricLabel(e.target.value)}
										placeholder="Attendees"
										className="w-1/2 h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
									/>
								</div>
							</div>
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-black">Target Audience Profile</label>
								<input
									type="text"
									value={targetAudienceProfile}
									onChange={e => setTargetAudienceProfile(e.target.value)}
									placeholder="e.g. Early-stage Founders & Investors"
									className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
								/>
							</div>
						</div>

						<div className="flex flex-col gap-2">
							<label className="text-xs font-bold text-black">Past / Confirmed Brand Sponsors <span className="text-black/40 font-medium">(optional, up to 4)</span></label>
							{pastSponsors.map((sponsor, idx) => (
								<div key={idx} className="flex items-center gap-2">
									<button
										type="button"
										onClick={() => {
											setPastSponsorLogoTargetIdx(idx)
											pastSponsorLogoInputRef.current?.click()
										}}
										className="size-10 shrink-0 rounded-lg bg-slate-50 border border-dashed border-black/10 flex items-center justify-center overflow-hidden"
									>
										{sponsor.logoPreview ? (
											// eslint-disable-next-line @next/next/no-img-element
											<img src={sponsor.logoPreview} alt="" className="w-full h-full object-cover" />
										) : (
											<span className="text-black/30 text-[10px]">Logo</span>
										)}
									</button>
									<input
										type="text"
										value={sponsor.name}
										onChange={e => updatePastSponsor(idx, { name: e.target.value })}
										placeholder="Brand name"
										className="flex-1 h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
									/>
									<input
										type="text"
										value={sponsor.projectReference}
										onChange={e => updatePastSponsor(idx, { projectReference: e.target.value })}
										placeholder="Project reference (optional)"
										className="flex-1 h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
									/>
									<button type="button" onClick={() => removePastSponsor(idx)} className="text-red-500 hover:text-red-700 font-bold text-lg p-1 shrink-0">✕</button>
								</div>
							))}
							{pastSponsors.length < 4 && (
								<button type="button" onClick={addPastSponsor} className="self-start text-xs font-black text-[#EE2C2C] hover:underline">
									+ Add sponsor
								</button>
							)}
						</div>
					</div>

					{/* Sponsorship Offerings & Pricing */}
					<div className="border-[3px] border-dashed border-black/30 rounded-[28px] p-6 bg-white flex flex-col gap-4 w-full">
						<SectionLabel>Sponsorship Offerings & Pricing</SectionLabel>
						{(sponsorTiers?.length || openToBarter !== undefined) && (
							<div className="flex flex-wrap gap-1.5">
								{sponsorTiers?.filter(t => t.name && t.price).map((t, i) => (
									<span key={i} className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-black/60">{t.name}: {t.price}</span>
								))}
								{openToBarter && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-black/60">Open to Barter</span>}
							</div>
						)}
						<span className="text-[10px] text-black/40 -mt-2">Package tiers & barter come from the Sponsorship Type section below — edit them there.</span>

						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-black">Sponsorship Deadline <span className="text-black/40 font-medium">(optional)</span></label>
							<input
								type="date"
								value={sponsorshipDeadline}
								onChange={e => setSponsorshipDeadline(e.target.value)}
								className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors max-w-xs"
							/>
						</div>

						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-black">On-Site Visibility Deliverables <span className="text-black/40 font-medium">(optional)</span></label>
							<input
								type="text"
								value={onsiteDeliverables}
								onChange={e => setOnsiteDeliverables(e.target.value)}
								placeholder="e.g. Stage banner, booth space, on-ground announcements"
								className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-black">Digital & Media Deliverables <span className="text-black/40 font-medium">(optional)</span></label>
							<input
								type="text"
								value={digitalDeliverables}
								onChange={e => setDigitalDeliverables(e.target.value)}
								placeholder="e.g. Instagram shoutouts, newsletter mention"
								className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-black">Custom Perks Description <span className="text-black/40 font-medium">(optional)</span></label>
							<textarea
								value={customPerks}
								onChange={e => setCustomPerks(e.target.value)}
								rows={2}
								placeholder="Leave empty to let AI write this"
								className="p-3 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors resize-none"
							/>
						</div>

						<div className="border-t border-black/10 -mx-6" />

						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-black">Contact Name</label>
								<input
									type="text"
									value={contactName}
									onChange={e => setContactName(e.target.value)}
									className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
								/>
							</div>
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-black">Contact Email *</label>
								<input
									type="email"
									value={contactEmail}
									onChange={e => setContactEmail(e.target.value)}
									placeholder="e.g. priya@example.com"
									className={`h-10 px-4 rounded-xl border bg-slate-50 text-black outline-none hover:border-black/30 text-sm transition-colors ${contactEmailError ? errorInputClass : "border-black/10 focus:border-black"}`}
								/>
								{contactEmailError && <span className="text-[10px] font-semibold text-red-600">{contactEmailError}</span>}
							</div>
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-black">Contact Phone</label>
								<input
									type="text"
									value={contactPhone}
									onChange={e => setContactPhone(e.target.value)}
									placeholder="Optional"
									className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
								/>
							</div>
						</div>
					</div>
				</div>
			) : (
				<div className="flex flex-col gap-4">
					{slides.map((slide, idx) => (
						<div key={idx} className="border-[3px] border-dashed border-black/30 rounded-[24px] p-5 bg-white flex flex-col gap-3">
							<span className="self-start text-[10px] font-black uppercase tracking-wider text-black/40 bg-neutral-100 px-2.5 py-1 rounded-full">
								{slide.layout.replace(/_/g, " ")}
							</span>

							{slide.layout === "PRICING_COMPARISON" ? (
								<div className="flex flex-col gap-1">
									<p className="text-sm font-black text-black">{slide.title}</p>
									<div className="flex flex-wrap gap-2 mt-1">
										{(slide.pricingTiers ?? []).map((t, ti) => (
											<span key={ti} className="text-xs font-bold px-3 py-1.5 rounded-full border border-black/15 bg-slate-50">
												{t.name} — {t.price}
											</span>
										))}
										{slide.openToBarter && <span className="text-xs font-bold px-3 py-1.5 rounded-full border border-black/15 bg-slate-50">Open to Barter</span>}
									</div>
									<textarea
										value={slide.body ?? ""}
										onChange={e => updateSlide(idx, { body: e.target.value })}
										rows={2}
										className="mt-2 p-3 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors resize-none"
									/>
								</div>
							) : slide.layout === "PAST_SPONSORS" ? (
								<div className="flex flex-col gap-1">
									<p className="text-sm font-black text-black">{slide.title}</p>
									{pastSponsors.filter(p => p.name.trim()).length ? (
										<div className="flex flex-wrap gap-2 mt-1">
											{pastSponsors.filter(p => p.name.trim()).map((p, pi) => (
												<span key={pi} className="text-xs font-bold px-3 py-1.5 rounded-full border border-black/15 bg-slate-50">{p.name}</span>
											))}
										</div>
									) : (
										<p className="text-xs text-black/50">{slide.body}</p>
									)}
								</div>
							) : (
								<>
									<input
										value={slide.title}
										onChange={e => updateSlide(idx, { title: e.target.value })}
										className="text-sm font-black text-black outline-none border-b border-transparent focus:border-black/30 pb-1"
									/>
									{slide.layout === "COVER" && (
										<input
											value={slide.subtitle ?? ""}
											onChange={e => updateSlide(idx, { subtitle: e.target.value })}
											placeholder="Tagline"
											className="text-xs font-semibold text-black/60 outline-none border-b border-transparent focus:border-black/30 pb-1"
										/>
									)}
									{(slide.layout === "VALUE_PROP" || slide.layout === "STAT_HIGHLIGHT" || slide.layout === "CLOSING_CONTACT") && (
										<textarea
											value={slide.body ?? ""}
											onChange={e => updateSlide(idx, { body: e.target.value })}
											rows={3}
											className="p-3 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors resize-none"
										/>
									)}
									{slide.layout === "STAT_HIGHLIGHT" && (
										<div className="flex flex-wrap gap-2">
											{(slide.stats ?? []).map((s, si) => (
												<div key={si} className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl border border-black/10 bg-slate-50">
													<input
														value={s.value}
														onChange={e => updateStat(idx, si, { value: e.target.value })}
														className="w-16 text-xs font-black text-black outline-none bg-transparent"
													/>
													<input
														value={s.label}
														onChange={e => updateStat(idx, si, { label: e.target.value })}
														className="w-28 text-[11px] font-semibold text-black/60 outline-none bg-transparent"
													/>
												</div>
											))}
										</div>
									)}
									{slide.layout === "BULLET_LIST" && (
										<div className="flex flex-col gap-1.5">
											{(slide.bullets ?? []).map((b, bi) => (
												<input
													key={bi}
													value={b}
													onChange={e => updateBullet(idx, bi, e.target.value)}
													className="px-3 py-2 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
												/>
											))}
										</div>
									)}
									{slide.layout === "CLOSING_CONTACT" && (
										<span className="text-[10px] text-black/40">Contact info shown here comes from the fields you filled on the previous step.</span>
									)}
								</>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	)
}
