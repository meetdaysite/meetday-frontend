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

export type ProposalDeckBuilderProps = {
	content: {
		eventName: string
		about: string
		venues?: string[]
		eventDate?: string
		audienceProfile?: string[]
		ageGroup?: string
		guestCount?: string
		sponsorTiers?: { name: string; price: string }[]
	}
	defaultContactName?: string
	defaultLogoUrl?: string | null
	defaultSecondaryLogoUrl?: string | null
	defaultPrimaryLogoKey?: string | null
	defaultSecondaryLogoKey?: string | null
	onClose: () => void
	onAttached: (result: FinalizeProposalDeckResult) => void
}

const THEME_OPTIONS: { value: DeckTheme; label: string; hint: string }[] = [
	{ value: "AUTO", label: "Auto", hint: "Dark cover/closing, light content slides" },
	{ value: "LIGHT", label: "Light", hint: "All slides light background" },
	{ value: "DARK", label: "Dark", hint: "All slides dark background" },
]

const FONT_OPTIONS: { value: DeckFontVibe; label: string }[] = [
	{ value: "MODERN_SANS", label: "Modern Sans-Serif" },
	{ value: "CLASSIC_SERIF", label: "Classic Serif" },
	{ value: "TECH_GEOMETRIC", label: "Tech / Geometric" },
	{ value: "MINIMALIST", label: "Minimalist" },
]

async function uploadLogoAndGetKey(file: File): Promise<string> {
	const { url, key } = await getUploadUrl({ context: "SPONSORSHIP_MEDIA", contentType: file.type })
	await fetch(url, { method: "PUT", headers: { "Content-Type": file.type }, body: file })
	return key
}

// AI-powered pitch-deck generator, embedded in the Create/Edit Proposal form — replaces manual
// document upload. Two steps: (1) pick deck styling (theme/font vibe/colors/logos) + contact
// info, AI plans the content slides; (2) review/edit the AI-written slide copy (design/layout is
// locked, only the text is editable) then "Attach to Proposal" renders + uploads the final PDF.
export function ProposalDeckBuilder({
	content,
	defaultContactName,
	defaultLogoUrl,
	defaultSecondaryLogoUrl,
	defaultPrimaryLogoKey,
	defaultSecondaryLogoKey,
	onClose,
	onAttached,
}: ProposalDeckBuilderProps) {
	const [step, setStep] = useState<"style" | "preview">("style")
	const [theme, setTheme] = useState<DeckTheme>("AUTO")
	const [fontVibe, setFontVibe] = useState<DeckFontVibe>("MODERN_SANS")
	const [primaryColor, setPrimaryColor] = useState("#EE2C2C")
	const [accentColor, setAccentColor] = useState("#FFC940")

	const [primaryLogoFile, setPrimaryLogoFile] = useState<File | null>(null)
	const [secondaryLogoFile, setSecondaryLogoFile] = useState<File | null>(null)
	const [primaryLogoPreview, setPrimaryLogoPreview] = useState<string | null>(defaultSecondaryLogoUrl ?? null)
	const [secondaryLogoPreview, setSecondaryLogoPreview] = useState<string | null>(defaultLogoUrl ?? null)
	const primaryLogoInputRef = useRef<HTMLInputElement>(null)
	const secondaryLogoInputRef = useRef<HTMLInputElement>(null)

	const [contactName, setContactName] = useState(defaultContactName ?? "")
	const [contactEmail, setContactEmail] = useState("")
	const [contactPhone, setContactPhone] = useState("")

	const [generating, setGenerating] = useState(false)
	const [finalizing, setFinalizing] = useState(false)
	const [slides, setSlides] = useState<DeckSlide[]>([])

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

	async function handleGenerate() {
		if (!contactName.trim() || !contactEmail.trim()) {
			toast.error("Please provide a contact name and email — shown on the closing slide.")
			return
		}
		setGenerating(true)
		try {
			const { slides: planSlides } = await generateProposalDeckPlan({
				eventName: content.eventName,
				about: content.about,
				venues: content.venues,
				eventDate: content.eventDate,
				audienceProfile: content.audienceProfile,
				ageGroup: content.ageGroup,
				guestCount: content.guestCount,
				sponsorTiers: content.sponsorTiers,
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
			toast.error("Failed to generate deck content. Please try again.")
		} finally {
			setGenerating(false)
		}
	}

	async function handleAttach() {
		setFinalizing(true)
		try {
			let primaryLogoKey = defaultPrimaryLogoKey ?? undefined
			let secondaryLogoKey = defaultSecondaryLogoKey ?? undefined
			if (primaryLogoFile) primaryLogoKey = await uploadLogoAndGetKey(primaryLogoFile)
			if (secondaryLogoFile) secondaryLogoKey = await uploadLogoAndGetKey(secondaryLogoFile)

			const result = await finalizeProposalDeck({
				slides,
				theme,
				fontVibe,
				primaryColor,
				accentColor,
				primaryLogoKey: primaryLogoKey ?? undefined,
				secondaryLogoKey: secondaryLogoKey ?? undefined,
			})
			toast.success("Proposal deck generated and attached!")
			onAttached(result)
		} catch (err) {
			console.error(err)
			toast.error("Failed to generate the final deck. Please try again.")
		} finally {
			setFinalizing(false)
		}
	}

	function handleLogoPick(e: React.ChangeEvent<HTMLInputElement>, variant: "primary" | "secondary") {
		const file = e.target.files?.[0]
		e.target.value = ""
		if (!file) return
		const previewUrl = URL.createObjectURL(file)
		if (variant === "primary") {
			setPrimaryLogoFile(file)
			setPrimaryLogoPreview(previewUrl)
		} else {
			setSecondaryLogoFile(file)
			setSecondaryLogoPreview(previewUrl)
		}
	}

	return (
		<div className="animate-in fade-in duration-150 flex flex-col gap-6">
			<div className="flex justify-between items-center shrink-0">
				<div className="flex flex-col gap-1">
					<div
						className="flex items-center gap-2 cursor-pointer text-black/60 hover:text-black"
						onClick={() => (step === "preview" ? setStep("style") : onClose())}
					>
						<span className="text-xl font-bold">←</span>
						<h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-black leading-tight">
							{step === "style" ? "Generate Proposal Deck" : "Review Slide Content"}
						</h1>
					</div>
					<p className="text-sm font-semibold text-black/50 mt-1">
						{step === "style"
							? "Pick a theme and let AI turn your proposal details into a branded pitch deck"
							: "Edit the AI-written copy for each slide, then attach the final deck to your proposal"}
					</p>
				</div>
				{step === "style" ? (
					<button
						type="button"
						onClick={handleGenerate}
						disabled={generating}
						className="bg-[#EE2C2C] text-white text-[9px] font-black px-4 py-2.5 rounded-lg uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all select-none disabled:opacity-50"
					>
						{generating ? "Planning…" : "Generate with AI"}
					</button>
				) : (
					<button
						type="button"
						onClick={handleAttach}
						disabled={finalizing}
						className="bg-[#EE2C2C] text-white text-[9px] font-black px-4 py-2.5 rounded-lg uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all select-none disabled:opacity-50"
					>
						{finalizing ? "Attaching…" : "Attach to Proposal"}
					</button>
				)}
			</div>

			{step === "style" ? (
				<div className="border-[3px] border-dashed border-black/30 rounded-[28px] p-6 bg-white flex flex-col gap-6 w-full">
					<div className="flex flex-col gap-2">
						<label className="text-xs font-bold text-black">Theme</label>
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
						<label className="text-xs font-bold text-black">Font Vibe</label>
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
							<label className="text-xs font-bold text-black">Primary Color</label>
							<div className="flex items-center gap-2">
								<input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="size-10 rounded-lg border border-black/10 cursor-pointer" />
								<span className="text-xs font-semibold text-black/60">{primaryColor}</span>
							</div>
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-black">Accent Color</label>
							<div className="flex items-center gap-2">
								<input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="size-10 rounded-lg border border-black/10 cursor-pointer" />
								<span className="text-xs font-semibold text-black/60">{accentColor}</span>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-black">Logo — Dark Backgrounds</label>
							<input ref={primaryLogoInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleLogoPick(e, "primary")} />
							<button
								type="button"
								onClick={() => primaryLogoInputRef.current?.click()}
								className="flex items-center gap-3 px-3 py-2 bg-neutral-900 border border-black rounded-xl text-xs font-bold hover:bg-neutral-800 transition-colors"
							>
								{primaryLogoPreview ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img src={primaryLogoPreview} alt="Primary logo" className="size-8 rounded object-contain bg-white/10" />
								) : (
									<span className="size-8 rounded bg-white/10 flex items-center justify-center text-white/40 text-[10px]">Logo</span>
								)}
								<span className="text-white">Choose Logo</span>
							</button>
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-black">Logo — Light Backgrounds</label>
							<input ref={secondaryLogoInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleLogoPick(e, "secondary")} />
							<button
								type="button"
								onClick={() => secondaryLogoInputRef.current?.click()}
								className="flex items-center gap-3 px-3 py-2 bg-white border border-black rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
							>
								{secondaryLogoPreview ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img src={secondaryLogoPreview} alt="Secondary logo" className="size-8 rounded object-contain" />
								) : (
									<span className="size-8 rounded bg-slate-100 flex items-center justify-center text-black/30 text-[10px]">Logo</span>
								)}
								<span className="text-black">Choose Logo</span>
							</button>
						</div>
					</div>
					<span className="text-[10px] text-black/40 -mt-3">
						If only one logo is provided, it&apos;s used for both with an automatic contrast backing.
					</span>

					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-black">Contact Name *</label>
							<input
								type="text"
								value={contactName}
								onChange={e => setContactName(e.target.value)}
								placeholder="e.g. Priya Nair"
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
								className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
							/>
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
									</div>
									<span className="text-[10px] text-black/40 mt-1">Edit pricing tiers in the form above — they sync here automatically.</span>
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
											placeholder="Subtitle (optional)"
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
