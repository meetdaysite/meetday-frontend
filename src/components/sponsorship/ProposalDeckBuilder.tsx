"use client"

import { useRef, useState } from "react"
import { toast } from "@/lib/toast"
import PdfViewer from "@/components/pdf/PdfViewer"
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
type MediaAssetDraft = { file: File; preview: string }

export type ProposalDeckBuilderProps = {
	// Bound directly to the parent Create/Edit Proposal form's own fields.
	eventTitle: string
	onEventTitleChange: (value: string) => void
	eventOverview: string
	onEventOverviewChange: (value: string) => void
	eventDate?: string
	onEventDateChange?: (value: string) => void
	eventEndDate?: string
	onEventEndDateChange?: (value: string) => void
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
// The media kit file is never embedded into the PDF (only linked), so it can be larger.
const MAX_MEDIA_KIT_SIZE_BYTES = 20 * 1024 * 1024

async function uploadFileAndGetKey(file: File, context: "SPONSORSHIP_MEDIA" | "SPONSORSHIP_DOCUMENT" = "SPONSORSHIP_MEDIA"): Promise<string> {
	const { url, key } = await getUploadUrl({ context, contentType: file.type })
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
	eventEndDate,
	onEventEndDateChange,
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
	const [step, setStep] = useState<"form" | "preview" | "pdfPreview">("form")

	// Host & Event Basics
	const [hostName, setHostName] = useState(defaultHostName ?? "")
	const [tagline, setTagline] = useState("")
	const [aboutCommunity, setAboutCommunity] = useState(defaultAboutCommunity ?? "")
	const [eventTime, setEventTime] = useState("")
	const [location, setLocation] = useState(defaultLocation ?? "")

	// Design & Brand Identity Tokens
	const [theme, setTheme] = useState<DeckTheme>("AUTO")
	const [fontVibe, setFontVibe] = useState<DeckFontVibe>("MODERN_SANS")
	const [primaryColors, setPrimaryColors] = useState<string[]>(["#EE2C2C", "#111111"])
	const [accentColors, setAccentColors] = useState<string[]>(["#FFC940", "#0EA5E9", "#22C55E"])
	const [primaryLogoFile, setPrimaryLogoFile] = useState<File | null>(null)
	const [secondaryLogoFile, setSecondaryLogoFile] = useState<File | null>(null)
	const [primaryLogoPreview, setPrimaryLogoPreview] = useState<string | null>(null)
	const [secondaryLogoPreview, setSecondaryLogoPreview] = useState<string | null>(null)
	const [mediaKitUrl, setMediaKitUrl] = useState("")
	const [mediaKitFile, setMediaKitFile] = useState<File | null>(null)
	const [mediaAssets, setMediaAssets] = useState<MediaAssetDraft[]>([])
	const [viewingImagePreview, setViewingImagePreview] = useState<string | null>(null)
	const primaryLogoInputRef = useRef<HTMLInputElement>(null)
	const secondaryLogoInputRef = useRef<HTMLInputElement>(null)
	const mediaKitFileInputRef = useRef<HTMLInputElement>(null)
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
	const [pkgTiers, setPkgTiers] = useState<{ name: string; price: string }[]>(
		sponsorTiers?.length ? sponsorTiers.map(t => ({ ...t })) : [{ name: "", price: "" }],
	)
	const [barterEnabled, setBarterEnabled] = useState(!!openToBarter)
	const [sponsorshipDeadline, setSponsorshipDeadline] = useState("")
	const [onsiteDeliverables, setOnsiteDeliverables] = useState("")
	const [digitalDeliverables, setDigitalDeliverables] = useState("")
	const [customPerks, setCustomPerks] = useState("")

	const [attemptedSubmit, setAttemptedSubmit] = useState(false)
	const [generating, setGenerating] = useState(false)
	const [finalizing, setFinalizing] = useState(false)
	const [slides, setSlides] = useState<DeckSlide[]>([])
	const [finalizedResult, setFinalizedResult] = useState<FinalizeProposalDeckResult | null>(null)

	const hostNameError = attemptedSubmit && !hostName.trim() ? "Community/Host Name is required." : null
	const eventTitleError = attemptedSubmit && !eventTitle.trim() ? "Event Title is required." : null
	const primaryLogoError = attemptedSubmit && !primaryLogoFile ? "Primary logo (dark backgrounds) is required." : null
	const secondaryLogoError = attemptedSubmit && !secondaryLogoFile ? "Secondary logo (light backgrounds) is required." : null
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

	function addPkgTier() {
		if (pkgTiers.length >= 6) return
		setPkgTiers(prev => [...prev, { name: "", price: "" }])
	}

	function updatePkgTier(idx: number, patch: Partial<{ name: string; price: string }>) {
		setPkgTiers(prev => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)))
	}

	function removePkgTier(idx: number) {
		setPkgTiers(prev => prev.filter((_, i) => i !== idx))
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

	function handleMediaKitFilePick(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		e.target.value = ""
		if (!file) return
		if (file.size > MAX_MEDIA_KIT_SIZE_BYTES) {
			toast.error("Media kit file must be 20MB or smaller.")
			return
		}
		setMediaKitFile(file)
		setMediaKitUrl("")
	}

	function handleMediaAssetsPick(e: React.ChangeEvent<HTMLInputElement>) {
		const files = Array.from(e.target.files ?? [])
		e.target.value = ""
		if (!files.length) return
		const oversized = files.filter(f => f.size > MAX_IMAGE_SIZE_BYTES)
		if (oversized.length) {
			toast.error("Each image must be 5MB or smaller — some were skipped.")
		}
		const accepted = files.filter(f => f.size <= MAX_IMAGE_SIZE_BYTES)
		setMediaAssets(prev => [...prev, ...accepted.map(file => ({ file, preview: URL.createObjectURL(file) }))].slice(0, 10))
	}

	function removeMediaAsset(idx: number) {
		setMediaAssets(prev => prev.filter((_, i) => i !== idx))
	}

	async function handleGenerate() {
		setAttemptedSubmit(true)
		if (!hostName.trim() || !eventTitle.trim() || !primaryLogoFile || !secondaryLogoFile) {
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
				eventDate: eventDate || undefined,
				eventEndDate: eventEndDate || undefined,
				eventTime: eventTime.trim() || undefined,
				heroMetricValue: heroMetricValue.trim() || undefined,
				heroMetricLabel: heroMetricLabel.trim() || undefined,
				targetAudienceProfile: targetAudienceProfile.trim() || undefined,
				pastSponsors: pastSponsors
					.filter(p => p.name.trim())
					.map(p => ({ name: p.name.trim(), projectReference: p.projectReference.trim() || undefined })),
				sponsorTiers: pkgTiers
					.filter(t => t.name.trim() && t.price.trim())
					.map(t => ({ name: t.name.trim(), price: t.price.trim() })),
				openToBarter: barterEnabled,
				sponsorshipDeadline: sponsorshipDeadline || undefined,
				onsiteDeliverables: onsiteDeliverables.trim() || undefined,
				digitalDeliverables: digitalDeliverables.trim() || undefined,
				customPerks: customPerks.trim() || undefined,
			})
			setSlides(planSlides)
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
		if (step === "pdfPreview") {
			// Discard the rendered PDF only — keep the edited slide text so they can tweak and retry.
			setFinalizedResult(null)
			setStep("preview")
			return
		}
		setSlides([])
		setStep("form")
	}

	// Renders the deck into an actual PDF and uploads it to storage, then shows it in an in-app,
	// view-only preview — no direct download is ever exposed. "Upload" (the next step) simply
	// attaches this already-rendered doc to the proposal, without re-rendering.
	async function handleDone() {
		setFinalizing(true)
		try {
			const [primaryLogoKey, secondaryLogoKey, mediaAssetKeys, mediaKitKey] = await Promise.all([
				primaryLogoFile ? uploadFileAndGetKey(primaryLogoFile) : Promise.resolve(undefined),
				secondaryLogoFile ? uploadFileAndGetKey(secondaryLogoFile) : Promise.resolve(undefined),
				Promise.all(mediaAssets.map(m => uploadFileAndGetKey(m.file))),
				mediaKitFile ? uploadFileAndGetKey(mediaKitFile, "SPONSORSHIP_DOCUMENT") : Promise.resolve(undefined),
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
				primaryColors,
				accentColors,
				primaryLogoKey,
				secondaryLogoKey,
				mediaKitUrl: mediaKitKey ? undefined : mediaKitUrl.trim() || undefined,
				mediaKitKey,
				mediaAssetKeys: mediaAssetKeys.length ? mediaAssetKeys : undefined,
			})
			setFinalizedResult(result)
			setStep("pdfPreview")
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

	function handleConfirmUpload() {
		if (!finalizedResult) return
		toast.success("Proposal deck attached!")
		onAttached(finalizedResult)
	}

	return (
		<div className="animate-in fade-in duration-150 flex flex-col gap-5 sm:gap-6">
			<input ref={pastSponsorLogoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePastSponsorLogoPick} />

			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 pb-2 border-b border-black/10 sm:border-0 sm:pb-0">
				<div className="flex flex-col gap-1">
					<div
						className="flex items-center gap-2 cursor-pointer text-black/60 hover:text-black"
						onClick={() => (step === "form" ? onClose() : step === "preview" ? setStep("form") : setStep("preview"))}
					>
						<span className="text-xl font-bold">←</span>
						<h1 className="text-xl sm:text-2xl md:text-3xl font-heading font-black tracking-tight text-black leading-tight">
							{step === "form" ? "Create a Deck with Meetday" : step === "preview" ? "Review Slide Content" : "Preview Proposal Deck"}
						</h1>
					</div>
					<p className="text-xs sm:text-sm font-semibold text-black/50">
						{step === "form"
							? "Fill in your event and brand details — AI fills in the rest of the copy"
							: step === "preview"
								? "Edit the AI-written copy for each slide, then proceed to preview the final deck"
								: "This is how your deck will look — upload it to attach it to your proposal"}
					</p>
				</div>
				{step === "form" ? (
					<button
						type="button"
						onClick={handleGenerate}
						disabled={generating}
						className="w-full sm:w-auto bg-[#EE2C2C] text-white text-[10px] sm:text-[9px] font-black px-5 py-2.5 rounded-lg uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all select-none disabled:opacity-50 text-center"
					>
						{generating ? "Planning…" : "Generate with AI"}
					</button>
				) : step === "preview" ? (
					<div className="flex items-center gap-2 w-full sm:w-auto justify-end">
						<button
							type="button"
							onClick={handleDiscard}
							disabled={finalizing}
							className="flex-1 sm:flex-none bg-white text-black text-[10px] sm:text-[9px] font-black px-4 py-2.5 rounded-lg uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all select-none disabled:opacity-50 text-center"
						>
							Discard
						</button>
						<button
							type="button"
							onClick={handleDone}
							disabled={finalizing}
							className="flex-1 sm:flex-none bg-[#EE2C2C] text-white text-[10px] sm:text-[9px] font-black px-5 py-2.5 rounded-lg uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all select-none disabled:opacity-50 text-center"
						>
							{finalizing ? "Generating…" : "Done"}
						</button>
					</div>
				) : (
					<div className="flex items-center gap-2 w-full sm:w-auto justify-end">
						<button
							type="button"
							onClick={handleDiscard}
							className="flex-1 sm:flex-none bg-white text-black text-[10px] sm:text-[9px] font-black px-4 py-2.5 rounded-lg uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all select-none text-center"
						>
							Discard
						</button>
						<button
							type="button"
							onClick={handleConfirmUpload}
							className="flex-1 sm:flex-none bg-[#EE2C2C] text-white text-[10px] sm:text-[9px] font-black px-5 py-2.5 rounded-lg uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all select-none text-center"
						>
							Upload
						</button>
					</div>
				)}
			</div>

			{step === "form" ? (
				<div className="flex flex-col gap-5 sm:gap-6">
					{/* Host & Event Basics */}
					<div className="border-[3px] border-dashed border-black/30 rounded-2xl sm:rounded-[28px] p-4 sm:p-6 bg-white flex flex-col gap-4 w-full">
						<SectionLabel>Host & Event Basics</SectionLabel>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
							<label className="text-xs font-bold text-black">About the Community</label>
							<textarea
								value={aboutCommunity}
								onChange={e => setAboutCommunity(e.target.value)}
								rows={2}
								placeholder="Leave empty to let AI write this from your other details"
								className="p-3 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors resize-none"
							/>
						</div>

						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-black">Event Tagline / One-Liner <span className="text-black/40 font-medium">(max 80 chars)</span></label>
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

						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-black">Event Start Date</label>
								<input
									type="date"
									value={eventDate ?? ""}
									onChange={e => onEventDateChange?.(e.target.value)}
									className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors w-full"
								/>
							</div>
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-black">Event End Date</label>
								<input
									type="date"
									value={eventEndDate ?? ""}
									onChange={e => onEventEndDateChange?.(e.target.value)}
									className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors w-full"
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
					<div className="border-[3px] border-dashed border-black/30 rounded-2xl sm:rounded-[28px] p-4 sm:p-6 bg-white flex flex-col gap-4 w-full">
						<SectionLabel>Design & Brand Identity Tokens</SectionLabel>

						<div className="flex flex-col gap-2">
							<label className="text-xs font-bold text-black">Deck Color Theme</label>
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
								{THEME_OPTIONS.map(opt => (
									<button
										key={opt.value}
										type="button"
										onClick={() => setTheme(opt.value)}
										className={`flex flex-col items-start gap-1 p-3 rounded-xl border-2 text-left transition-all ${
											theme === opt.value ? "border-black bg-[#FFC940]/20 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "border-black/10 hover:border-black/30 bg-slate-50/50"
										}`}
									>
										<div className="flex items-center justify-between w-full">
											<span className="text-xs font-black text-black">{opt.label}</span>
											{theme === opt.value && (
												<span className="text-[8px] font-black uppercase tracking-wider bg-black text-white px-1.5 py-0.5 rounded">Selected</span>
											)}
										</div>
										<span className="text-[10px] text-black/60 leading-tight">{opt.hint}</span>
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

						<div className="flex flex-col gap-3">
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-black">Primary Brand Colors <span className="text-black/40 font-medium">(up to 2)</span></label>
								<div className="flex flex-wrap items-center gap-3 sm:gap-4">
									{primaryColors.map((c, i) => (
										<div key={i} className="flex items-center gap-2 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-black/10">
											<input
												type="color"
												value={c}
												onChange={e => setPrimaryColors(prev => prev.map((v, vi) => (vi === i ? e.target.value : v)))}
												className="size-9 rounded-lg border border-black/10 cursor-pointer"
											/>
											<span className="text-xs font-semibold text-black/70 uppercase">{c}</span>
										</div>
									))}
								</div>
							</div>
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-black">Accent / Highlight Colors <span className="text-black/40 font-medium">(up to 3)</span></label>
								<div className="flex flex-wrap items-center gap-3 sm:gap-4">
									{accentColors.map((c, i) => (
										<div key={i} className="flex items-center gap-2 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-black/10">
											<input
												type="color"
												value={c}
												onChange={e => setAccentColors(prev => prev.map((v, vi) => (vi === i ? e.target.value : v)))}
												className="size-9 rounded-lg border border-black/10 cursor-pointer"
											/>
											<span className="text-xs font-semibold text-black/70 uppercase">{c}</span>
										</div>
									))}
								</div>
							</div>
							<span className="text-[10px] text-black/40">Colors are used across slide backgrounds, text, and accents for variety — not just one flat theme.</span>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-black">Primary Logo (Dark Backgrounds) *</label>
								<input ref={primaryLogoInputRef} type="file" accept="image/*,.svg" className="hidden" onChange={e => handleLogoPick(e, "primary")} />
								<button
									type="button"
									onClick={() => primaryLogoInputRef.current?.click()}
									className={`flex items-center justify-between gap-3 px-3.5 py-2.5 bg-neutral-900 border rounded-xl text-xs font-bold hover:bg-neutral-800 transition-colors w-full ${primaryLogoError ? "border-red-500" : "border-black"}`}
								>
									<div className="flex items-center gap-2.5 min-w-0">
										{primaryLogoPreview ? (
											// eslint-disable-next-line @next/next/no-img-element
											<img src={primaryLogoPreview} alt="Primary logo" className="size-8 rounded object-contain bg-white/10 shrink-0" />
										) : (
											<span className="size-8 rounded bg-white/10 flex items-center justify-center text-white/40 text-[10px] shrink-0">Logo</span>
										)}
										<span className="text-white truncate">{primaryLogoFile ? primaryLogoFile.name : "Choose Dark BG Logo"}</span>
									</div>
									<span className="text-[10px] font-black uppercase text-white/60 bg-white/10 px-2 py-1 rounded shrink-0">Browse</span>
								</button>
								{primaryLogoError && <span className="text-[10px] font-semibold text-red-600">{primaryLogoError}</span>}
							</div>
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-black">Secondary Logo (Light Backgrounds) *</label>
								<input ref={secondaryLogoInputRef} type="file" accept="image/*,.svg" className="hidden" onChange={e => handleLogoPick(e, "secondary")} />
								<button
									type="button"
									onClick={() => secondaryLogoInputRef.current?.click()}
									className={`flex items-center justify-between gap-3 px-3.5 py-2.5 bg-white border rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors w-full ${secondaryLogoError ? "border-red-500" : "border-black"}`}
								>
									<div className="flex items-center gap-2.5 min-w-0">
										{secondaryLogoPreview ? (
											// eslint-disable-next-line @next/next/no-img-element
											<img src={secondaryLogoPreview} alt="Secondary logo" className="size-8 rounded object-contain shrink-0" />
										) : (
											<span className="size-8 rounded bg-slate-100 flex items-center justify-center text-black/30 text-[10px] shrink-0">Logo</span>
										)}
										<span className="text-black truncate">{secondaryLogoFile ? secondaryLogoFile.name : "Choose Light BG Logo"}</span>
									</div>
									<span className="text-[10px] font-black uppercase text-black/60 bg-black/5 px-2 py-1 rounded shrink-0">Browse</span>
								</button>
								{secondaryLogoError && <span className="text-[10px] font-semibold text-red-600">{secondaryLogoError}</span>}
							</div>
						</div>
						<span className="text-[10px] text-black/40 -mt-2">
							If only one logo is provided, it&apos;s used for both with an automatic contrast backing.
						</span>

						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-black">Brand Media Kit / Guidelines <span className="text-black/40 font-medium">(file upload or URL)</span></label>
							<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
								<input
									type="url"
									value={mediaKitUrl}
									onChange={e => {
										setMediaKitUrl(e.target.value)
										setMediaKitFile(null)
									}}
									placeholder="Link to a doc, deck, or website"
									className="h-10 flex-1 min-w-0 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
								/>
								<span className="text-[10px] font-bold text-black/30 text-center sm:text-left shrink-0">OR</span>
								<input
									ref={mediaKitFileInputRef}
									type="file"
									accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf"
									className="hidden"
									onChange={handleMediaKitFilePick}
								/>
								<button
									type="button"
									onClick={() => mediaKitFileInputRef.current?.click()}
									className="h-10 shrink-0 px-4 bg-white border border-black rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50 transition-colors truncate max-w-full"
								>
									{mediaKitFile ? `📎 ${mediaKitFile.name}` : "Choose File"}
								</button>
							</div>
						</div>

						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-black">Brand Media Assets <span className="text-black/40 font-medium">(up to 10 images)</span></label>
							<input ref={mediaAssetsInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleMediaAssetsPick} />
							<div className="flex flex-wrap gap-2.5">
								{mediaAssets.map((asset, idx) => (
									<div key={idx} className="relative size-16 sm:size-20 shrink-0">
										<button
											type="button"
											onClick={() => setViewingImagePreview(asset.preview)}
											className="size-16 sm:size-20 rounded-xl overflow-hidden border-2 border-black/15 hover:border-black transition-colors"
										>
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img src={asset.preview} alt="" className="w-full h-full object-cover" />
										</button>
										<button
											type="button"
											onClick={() => removeMediaAsset(idx)}
											className="absolute -top-1.5 -right-1.5 size-6 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center shadow-sm hover:bg-red-600 transition-colors"
											aria-label="Remove image"
										>
											✕
										</button>
									</div>
								))}
								{mediaAssets.length < 10 && (
									<button
										type="button"
										onClick={() => mediaAssetsInputRef.current?.click()}
										className="size-16 sm:size-20 shrink-0 rounded-xl border-2 border-dashed border-black/20 hover:border-black/40 flex items-center justify-center text-black/30 text-2xl font-black transition-colors"
										aria-label="Add image"
									>
										+
									</button>
								)}
							</div>
						</div>
					</div>

					{/* Narrative & Copy Prompts */}
					<div className="border-[3px] border-dashed border-black/30 rounded-2xl sm:rounded-[28px] p-4 sm:p-6 bg-white flex flex-col gap-4 w-full">
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
							<label className="text-xs font-bold text-black">Sponsor ROI Pitch <span className="text-black/40 font-medium">(2–3 sentences on why a brand should sponsor)</span></label>
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
					<div className="border-[3px] border-dashed border-black/30 rounded-2xl sm:rounded-[28px] p-4 sm:p-6 bg-white flex flex-col gap-4 w-full">
						<SectionLabel>Audience & Traction Data</SectionLabel>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-black">Hero Audience Metric</label>
								<div className="grid grid-cols-2 gap-2 sm:gap-3">
									<input
										type="text"
										value={heroMetricValue}
										onChange={e => setHeroMetricValue(e.target.value)}
										placeholder="1,200"
										className="w-full h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
									/>
									<input
										type="text"
										value={heroMetricLabel}
										onChange={e => setHeroMetricLabel(e.target.value)}
										placeholder="Attendees"
										className="w-full h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
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
							<label className="text-xs font-bold text-black">Past / Confirmed Brand Sponsors <span className="text-black/40 font-medium">(up to 4)</span></label>
							{pastSponsors.map((sponsor, idx) => (
								<div key={idx} className="flex flex-col sm:flex-row gap-2 sm:items-center p-3 sm:p-0 bg-slate-50 sm:bg-transparent rounded-xl border border-black/10 sm:border-0 relative">
									<div className="flex items-center gap-2 flex-1 min-w-0">
										<button
											type="button"
											onClick={() => {
												setPastSponsorLogoTargetIdx(idx)
												pastSponsorLogoInputRef.current?.click()
											}}
											className="size-10 shrink-0 rounded-lg bg-white border border-dashed border-black/20 flex items-center justify-center overflow-hidden hover:border-black/50 transition-colors"
										>
											{sponsor.logoPreview ? (
												// eslint-disable-next-line @next/next/no-img-element
												<img src={sponsor.logoPreview} alt="" className="w-full h-full object-cover" />
											) : (
												<span className="text-black/30 text-[10px] font-bold">Logo</span>
											)}
										</button>
										<input
											type="text"
											value={sponsor.name}
											onChange={e => updatePastSponsor(idx, { name: e.target.value })}
											placeholder="Brand name *"
											className="flex-1 min-w-0 h-10 px-4 rounded-xl border border-black/10 bg-white text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
										/>
										<button
											type="button"
											onClick={() => removePastSponsor(idx)}
											className="sm:hidden size-8 shrink-0 rounded-full bg-red-100 text-red-600 font-bold flex items-center justify-center hover:bg-red-200 transition-colors text-xs"
											aria-label="Remove sponsor"
										>
											✕
										</button>
									</div>
									<div className="flex items-center gap-2 flex-1 min-w-0">
										<input
											type="text"
											value={sponsor.projectReference}
											onChange={e => updatePastSponsor(idx, { projectReference: e.target.value })}
											placeholder="Project reference"
											className="flex-1 min-w-0 h-10 px-4 rounded-xl border border-black/10 bg-white text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
										/>
										<button
											type="button"
											onClick={() => removePastSponsor(idx)}
											className="hidden sm:flex text-red-500 hover:text-red-700 font-bold text-lg p-1 shrink-0"
											aria-label="Remove sponsor"
										>
											✕
										</button>
									</div>
								</div>
							))}
							{pastSponsors.length < 4 && (
								<button type="button" onClick={addPastSponsor} className="self-start text-xs font-black text-[#EE2C2C] hover:underline mt-1">
									+ Add sponsor
								</button>
							)}
						</div>
					</div>

					{/* Sponsorship Offerings & Pricing */}
					<div className="border-[3px] border-dashed border-black/30 rounded-2xl sm:rounded-[28px] p-4 sm:p-6 bg-white flex flex-col gap-4 w-full">
						<SectionLabel>Sponsorship Offerings & Pricing</SectionLabel>

						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-black">Package Tier Name & Pricing</label>
							<div className="flex flex-col gap-2">
								{pkgTiers.map((t, i) => (
									<div key={i} className="flex flex-col sm:flex-row gap-2 sm:items-center p-3 sm:p-0 bg-slate-50 sm:bg-transparent rounded-xl border border-black/10 sm:border-0 relative">
										<input
											type="text"
											value={t.name}
											onChange={e => updatePkgTier(i, { name: e.target.value })}
											placeholder="e.g. Gold Sponsor"
											className="flex-1 min-w-0 h-10 px-4 rounded-xl border border-black/10 bg-white text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
										/>
										<div className="flex items-center gap-2">
											<input
												type="text"
												value={t.price}
												onChange={e => updatePkgTier(i, { price: e.target.value })}
												placeholder="e.g. ₹50,000"
												className="flex-1 sm:w-36 sm:flex-none h-10 px-4 rounded-xl border border-black/10 bg-white text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
											/>
											{pkgTiers.length > 1 && (
												<button
													type="button"
													onClick={() => removePkgTier(i)}
													className="size-8 shrink-0 rounded-full bg-black text-white font-bold flex items-center justify-center hover:bg-red-600 transition-colors text-xs"
													aria-label="Remove tier"
												>
													✕
												</button>
											)}
										</div>
									</div>
								))}
								{pkgTiers.length < 6 && (
									<button
										type="button"
										onClick={addPkgTier}
										className="self-start px-3 py-1.5 bg-white border border-black rounded-lg text-[10px] font-bold shadow-sm hover:bg-slate-50 transition-colors mt-1"
									>
										+ Add Tier
									</button>
								)}
							</div>
						</div>

						<label className="flex items-center gap-2 cursor-pointer select-none">
							<input
								type="checkbox"
								checked={barterEnabled}
								onChange={e => setBarterEnabled(e.target.checked)}
								className="size-4 accent-black"
							/>
							<span className="text-xs font-bold text-black">Open to Barter</span>
						</label>

						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-black">Sponsorship Deadline</label>
							<input
								type="date"
								value={sponsorshipDeadline}
								onChange={e => setSponsorshipDeadline(e.target.value)}
								className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors w-full sm:max-w-xs"
							/>
						</div>

						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-black">On-Site Visibility Deliverables</label>
							<input
								type="text"
								value={onsiteDeliverables}
								onChange={e => setOnsiteDeliverables(e.target.value)}
								placeholder="e.g. Stage banner, booth space, on-ground announcements"
								className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-black">Digital & Media Deliverables</label>
							<input
								type="text"
								value={digitalDeliverables}
								onChange={e => setDigitalDeliverables(e.target.value)}
								placeholder="e.g. Instagram shoutouts, newsletter mention"
								className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-black">Custom Perks Description</label>
							<textarea
								value={customPerks}
								onChange={e => setCustomPerks(e.target.value)}
								rows={2}
								placeholder="Leave empty to let AI write this"
								className="p-3 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors resize-none"
							/>
						</div>
					</div>
				</div>
			) : step === "preview" ? (
				<div className="flex flex-col gap-4">
					{slides.map((slide, idx) => (
						<div key={idx} className="border-[3px] border-dashed border-black/30 rounded-2xl sm:rounded-[24px] p-4 sm:p-5 bg-white flex flex-col gap-3">
							<span className="self-start text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-black/60 bg-neutral-100 px-2.5 py-1 rounded-full border border-black/10">
								Slide {idx + 1}: {slide.layout.replace(/_/g, " ")}
							</span>

							{slide.layout === "PRICING_COMPARISON" ? (
								<div className="flex flex-col gap-1.5">
									<p className="text-sm font-black text-black">{slide.title}</p>
									<div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1">
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
								<div className="flex flex-col gap-1.5">
									<p className="text-sm font-black text-black">{slide.title}</p>
									{pastSponsors.filter(p => p.name.trim()).length ? (
										<div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1">
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
										className="text-sm font-black text-black outline-none border-b border-black/10 focus:border-black pb-1 bg-transparent"
									/>
									{slide.layout === "COVER" && (
										<input
											value={slide.subtitle ?? ""}
											onChange={e => updateSlide(idx, { subtitle: e.target.value })}
											placeholder="Tagline"
											className="text-xs font-semibold text-black/60 outline-none border-b border-black/10 focus:border-black pb-1 bg-transparent"
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
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
											{(slide.stats ?? []).map((s, si) => (
												<div key={si} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-black/10 bg-slate-50">
													<input
														value={s.value}
														onChange={e => updateStat(idx, si, { value: e.target.value })}
														className="w-20 text-xs font-black text-black outline-none bg-transparent"
														placeholder="Value"
													/>
													<input
														value={s.label}
														onChange={e => updateStat(idx, si, { label: e.target.value })}
														className="flex-1 min-w-0 text-[11px] font-semibold text-black/60 outline-none bg-transparent"
														placeholder="Label"
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
								</>
							)}
						</div>
					))}
				</div>
			) : (
				<div className="border-[3px] border-black rounded-2xl sm:rounded-[24px] overflow-hidden bg-white h-[65vh] sm:h-[75vh]">
					{finalizedResult && <PdfViewer url={finalizedResult.docUrl} />}
				</div>
			)}

			{viewingImagePreview && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
					onClick={() => setViewingImagePreview(null)}
				>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={viewingImagePreview} alt="" className="max-w-full max-h-full rounded-xl object-contain" />
					<button
						type="button"
						onClick={() => setViewingImagePreview(null)}
						className="absolute top-4 sm:top-6 right-4 sm:right-6 size-9 rounded-full bg-white text-black font-bold flex items-center justify-center shadow-md"
						aria-label="Close image preview"
					>
						✕
					</button>
				</div>
			)}
		</div>
	)
}
