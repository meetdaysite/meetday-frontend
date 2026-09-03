"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
	expandProposalDeckContent,
	generateProposalDeckPdf,
	type ExpandProposalDeckContentResult,
} from "@/lib/api"

type PricingTier = { name: string; price: string }

export type GenerateProposalPdfPanelProps = {
	onClose: () => void
}

// AI-powered "quick pitch" deck generator — separate from the full Create Proposal flow;
// no saved record, just a form-in/PDF-out download. Two steps: (1) basic form inputs are sent
// to the AI service to expand into slide-ready copy, (2) host reviews/edits that AI copy before
// the final 6-slide presentation-style PDF is rendered and downloaded.
export function GenerateProposalPdfPanel({ onClose }: GenerateProposalPdfPanelProps) {
	const [step, setStep] = useState<"form" | "review">("form")

	const [sponsorName, setSponsorName] = useState("")
	const [eventTitle, setEventTitle] = useState("")
	const [deliverables, setDeliverables] = useState("")
	const [timeline, setTimeline] = useState("")
	const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([{ name: "", price: "" }])
	const [terms, setTerms] = useState("")
	const [contactName, setContactName] = useState("")
	const [contactEmail, setContactEmail] = useState("")
	const [contactPhone, setContactPhone] = useState("")
	const [expanding, setExpanding] = useState(false)

	const [aiContent, setAiContent] = useState<ExpandProposalDeckContentResult | null>(null)
	const [generating, setGenerating] = useState(false)

	function updateTier(idx: number, field: keyof PricingTier, value: string) {
		setPricingTiers(prev => prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t)))
	}

	function updateAiField(field: keyof ExpandProposalDeckContentResult, value: string) {
		setAiContent(prev => (prev ? { ...prev, [field]: value } : prev))
	}

	async function handleExpand(e: React.FormEvent) {
		e.preventDefault()
		if (!sponsorName.trim() || !eventTitle.trim() || !deliverables.trim() || !timeline.trim() || !terms.trim() || !contactName.trim() || !contactEmail.trim()) {
			toast.error("Please fill in all required fields.")
			return
		}
		setExpanding(true)
		try {
			const result = await expandProposalDeckContent({
				sponsorName: sponsorName.trim(),
				eventTitle: eventTitle.trim(),
				deliverables: deliverables.trim(),
				timeline: timeline.trim(),
				pricingTiers: pricingTiers.filter(t => t.name.trim() && t.price.trim()),
				terms: terms.trim(),
			})
			setAiContent(result)
			setStep("review")
		} catch (err) {
			console.error(err)
			toast.error("Failed to generate slide content. Please try again.")
		} finally {
			setExpanding(false)
		}
	}

	async function handleExportPdf() {
		if (!aiContent) return
		setGenerating(true)
		try {
			const blob = await generateProposalDeckPdf({
				sponsorName: sponsorName.trim(),
				eventTitle: eventTitle.trim(),
				valueProposition: aiContent.valueProposition.trim(),
				campaignOverview: aiContent.campaignOverview.trim(),
				audienceReach: aiContent.audienceReach.trim(),
				deliverablesExpanded: aiContent.deliverablesExpanded.trim(),
				timelineExpanded: aiContent.timelineExpanded.trim(),
				pricingTiers: pricingTiers.filter(t => t.name.trim() && t.price.trim()),
				terms: terms.trim(),
				contactName: contactName.trim(),
				contactEmail: contactEmail.trim(),
				contactPhone: contactPhone.trim() || undefined,
			})
			const url = URL.createObjectURL(blob)
			const a = document.createElement("a")
			a.href = url
			a.download = "sponsorship-pitch-deck.pdf"
			document.body.appendChild(a)
			a.click()
			a.remove()
			URL.revokeObjectURL(url)
			toast.success("Pitch deck PDF downloaded!")
		} catch (err) {
			console.error(err)
			toast.error("Failed to generate PDF. Please try again.")
		} finally {
			setGenerating(false)
		}
	}

	if (step === "review" && aiContent) {
		return (
			<div className="animate-in fade-in duration-150 flex flex-col gap-6">
				<div className="flex justify-between items-center shrink-0">
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-2 cursor-pointer text-black/60 hover:text-black" onClick={() => setStep("form")}>
							<span className="text-xl font-bold">←</span>
							<h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-black leading-tight">
								Review Slide Content
							</h1>
						</div>
						<p className="text-sm font-semibold text-black/50 mt-1">
							Edit the AI-generated copy for each slide, then export the final pitch deck
						</p>
					</div>
					<button
						type="button"
						onClick={handleExportPdf}
						disabled={generating}
						className="bg-[#EE2C2C] text-white text-[9px] font-black px-4 py-2.5 rounded-lg uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all select-none disabled:opacity-50"
					>
						{generating ? "Generating…" : "Export PDF"}
					</button>
				</div>

				<div className="border-[3px] border-dashed border-black/30 rounded-[28px] p-6 bg-white flex flex-col gap-6 w-full">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-black">Value Proposition</label>
						<textarea
							value={aiContent.valueProposition}
							onChange={e => updateAiField("valueProposition", e.target.value)}
							rows={4}
							className="p-3 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors resize-none"
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-black">Campaign Overview</label>
						<textarea
							value={aiContent.campaignOverview}
							onChange={e => updateAiField("campaignOverview", e.target.value)}
							rows={4}
							className="p-3 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors resize-none"
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-black">Audience Reach</label>
						<textarea
							value={aiContent.audienceReach}
							onChange={e => updateAiField("audienceReach", e.target.value)}
							rows={4}
							className="p-3 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors resize-none"
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-black">Deliverables</label>
						<textarea
							value={aiContent.deliverablesExpanded}
							onChange={e => updateAiField("deliverablesExpanded", e.target.value)}
							rows={4}
							className="p-3 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors resize-none"
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-black">Timeline</label>
						<textarea
							value={aiContent.timelineExpanded}
							onChange={e => updateAiField("timelineExpanded", e.target.value)}
							rows={4}
							className="p-3 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors resize-none"
						/>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="animate-in fade-in duration-150 flex flex-col gap-6">
			<div className="flex justify-between items-center shrink-0">
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2 cursor-pointer text-black/60 hover:text-black" onClick={onClose}>
						<span className="text-xl font-bold">←</span>
						<h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-black leading-tight">
							Generate Proposal PDF
						</h1>
					</div>
					<p className="text-sm font-semibold text-black/50 mt-1">
						Fill in the pitch details — AI will expand them into a full slide deck you can review before download
					</p>
				</div>
				<button
					type="button"
					onClick={handleExpand}
					disabled={expanding}
					className="bg-[#EE2C2C] text-white text-[9px] font-black px-4 py-2.5 rounded-lg uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all select-none disabled:opacity-50"
				>
					{expanding ? "Generating…" : "Generate Slide Content"}
				</button>
			</div>

			<form onSubmit={handleExpand} className="border-[3px] border-dashed border-black/30 rounded-[28px] p-6 bg-white flex flex-col gap-6 w-full">
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-bold text-black">Sponsor / Brand Name *</label>
					<input
						type="text"
						required
						value={sponsorName}
						onChange={e => setSponsorName(e.target.value)}
						placeholder="e.g. Acme Beverages"
						className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
					/>
				</div>

				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-bold text-black">Project / Event Title *</label>
					<input
						type="text"
						required
						value={eventTitle}
						onChange={e => setEventTitle(e.target.value)}
						placeholder="e.g. Night Rituals — Kolkata Music Fest"
						className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
					/>
				</div>

				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-bold text-black">Deliverables *</label>
					<textarea
						required
						value={deliverables}
						onChange={e => setDeliverables(e.target.value)}
						placeholder="e.g. Stage banner, social media shoutouts, on-ground booth"
						rows={4}
						className="p-3 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors resize-none"
					/>
				</div>

				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-bold text-black">Timeline *</label>
					<textarea
						required
						value={timeline}
						onChange={e => setTimeline(e.target.value)}
						placeholder="e.g. Campaign runs 1 Oct – 15 Nov, deliverables live by 20 Oct"
						rows={3}
						className="p-3 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors resize-none"
					/>
				</div>

				<div className="flex flex-col gap-2">
					<label className="text-xs font-bold text-black">Budget / Pricing Breakdown</label>
					{pricingTiers.map((tier, idx) => (
						<div key={idx} className="flex items-center gap-2">
							<input
								type="text"
								value={tier.name}
								onChange={e => updateTier(idx, "name", e.target.value)}
								placeholder="Tier name (e.g. Gold Sponsor)"
								className="h-10 flex-1 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
							/>
							<input
								type="text"
								value={tier.price}
								onChange={e => updateTier(idx, "price", e.target.value)}
								placeholder="Price (e.g. 50,000)"
								className="h-10 w-40 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
							/>
							{pricingTiers.length > 1 && (
								<button
									type="button"
									onClick={() => setPricingTiers(prev => prev.filter((_, i) => i !== idx))}
									className="text-red-500 hover:text-red-700 font-bold text-lg p-1 shrink-0"
								>
									✕
								</button>
							)}
						</div>
					))}
					<button
						type="button"
						onClick={() => setPricingTiers(prev => [...prev, { name: "", price: "" }])}
						className="self-start text-xs font-black text-[#EE2C2C] hover:underline"
					>
						+ Add another tier
					</button>
				</div>

				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-bold text-black">Terms *</label>
					<textarea
						required
						value={terms}
						onChange={e => setTerms(e.target.value)}
						placeholder="e.g. Full payment due upfront, non-refundable after event date confirmed"
						rows={3}
						className="p-3 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors resize-none"
					/>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-black">Contact Name *</label>
						<input
							type="text"
							required
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
							required
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
			</form>
		</div>
	)
}
