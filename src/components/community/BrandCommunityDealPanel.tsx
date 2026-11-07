"use client"

import { useState, useEffect } from "react"
import { Icon } from "@/components/ui/Icon"
import clsx from "clsx"
import confetti from "canvas-confetti"
import { toast } from "sonner"
import { ImageLightbox } from "@/components/ui/ImageLightbox"
import {
	type BrandCommunityCollaborationDeal,
	type BrandCommunityCollaborationDealReport,
	type BrandCommunityInterestDomain,
	lockBrandCommunityDeal,
	approveBrandCommunityDeal,
	requestBrandCommunityDealChanges,
	submitBrandCommunityDealReport,
} from "@/lib/api"
import LockSvg from "@/icons/outlined/lock.svg"

const STATUS_COLOR: Record<string, string> = {
	PENDING_APPROVAL: "bg-amber-100 text-amber-900 border-amber-900",
	CHANGES_REQUESTED: "bg-orange-100 text-orange-900 border-orange-900",
	APPROVED: "bg-emerald-100 text-emerald-900 border-emerald-900",
	REJECTED: "bg-rose-100 text-rose-900 border-rose-900",
}

const STATUS_LABEL: Record<string, string> = {
	PENDING_APPROVAL: "Awaiting Brand Approval",
	CHANGES_REQUESTED: "Changes Requested",
	APPROVED: "Deal Locked",
	REJECTED: "Rejected",
}

function formatAmount(amount?: number | string | null): string {
	if (!amount) return "₹0"
	const num = Number(amount)
	return `₹${num.toLocaleString("en-IN")}`
}

export function BrandCommunityDealBanner({
	deal,
	role,
	onLock,
	onEdit,
	onView,
	onReport,
	hasReport,
	report,
}: {
	deal: BrandCommunityCollaborationDeal | null
	role: "COMMUNITY" | "BRAND"
	onLock?: () => void
	onEdit?: () => void
	onView: () => void
	onReport?: () => void
	hasReport?: boolean
	report?: BrandCommunityCollaborationDealReport | null
}) {
	const isCommunity = role === "COMMUNITY"
	const isClosed = report?.status === "APPROVED"

	if (!deal) {
		if (!isCommunity) {
			return (
				<div className="px-4 sm:px-5 py-2.5 sm:py-3 border-b-[3px] border-black bg-[#FFFBEB] flex items-center justify-between gap-3 shrink-0">
					<div className="flex items-center gap-2">
						<span className="size-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
						<p className="text-xs font-bold text-black/60">
							Awaiting the community to submit the agreed deal terms.
						</p>
					</div>
				</div>
			)
		}
		return (
			<div className="px-4 sm:px-5 py-2.5 sm:py-3 border-b-[3px] border-black bg-[#FFFBEB] flex items-center justify-between gap-3 shrink-0">
				<div className="flex items-center gap-2">
					<span className="size-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
					<p className="text-xs font-bold text-black/60">
						Once terms are agreed with the brand, lock the deal terms here.
					</p>
				</div>
				<button
					type="button"
					onClick={onLock}
					className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FFC940] hover:bg-[#ffbe1a] text-black font-black text-xs border-[2.5px] border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer select-none"
				>
					<Icon as={LockSvg} size="sm" />
					<span>Lock the Deal</span>
				</button>
			</div>
		)
	}

	return (
		<div className="px-3 sm:px-5 py-2.5 sm:py-3 border-b-[3px] border-black bg-neutral-50 flex items-center justify-between gap-2 sm:gap-3 shrink-0 min-w-0">
			<div className="min-w-0 flex-1 flex items-center gap-2 overflow-hidden">
				<span
					className={clsx(
						"px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] inline-flex items-center gap-1.5",
						isClosed ? "bg-black text-white" : STATUS_COLOR[deal.status] || "bg-neutral-100 text-black border-black"
					)}
				>
					{isClosed ? (
						<>
							<span className="inline-flex items-center justify-center size-3.5 rounded-full bg-[#10B981] text-white shrink-0">
								<svg className="size-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
									<polyline points="20 6 9 17 4 12" />
								</svg>
							</span>
							<span>Closed</span>
						</>
					) : (
						STATUS_LABEL[deal.status] || deal.status
					)}
				</span>
				<p className="text-xs font-black text-black truncate min-w-0">
					{deal.projectName} · {deal.collaborationType}
				</p>
			</div>
			<div className="flex items-center gap-2.5 shrink-0">
				<button
					type="button"
					onClick={onView}
					className="animate-zoom-in-out hover:animate-none inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#EE2C2C] hover:bg-[#d42525] text-white font-black text-xs border-[2.5px] border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:scale-105 active:scale-95 transition-transform cursor-pointer select-none"
				>
					<svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
						<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
						<circle cx="12" cy="12" r="3" />
					</svg>
					<span>View Deal</span>
				</button>
				{isCommunity && deal.status !== "APPROVED" && (
					<button
						type="button"
						onClick={onEdit}
						className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFC940] hover:bg-[#ffbe1a] text-black font-black text-xs border-[2.5px] border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer select-none"
					>
						<svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
							<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
						</svg>
						<span>Edit Deal</span>
					</button>
				)}
				{deal.status === "APPROVED" && (
					<>
						{hasReport ? (
							<button
								type="button"
								onClick={onReport}
								className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFC940] hover:bg-[#ffbe1a] text-black font-black text-xs border-[2.5px] border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer select-none"
							>
								<svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
									<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
									<polyline points="14 2 14 8 20 8" />
									<line x1="16" y1="13" x2="8" y2="13" />
									<line x1="16" y1="17" x2="8" y2="17" />
								</svg>
								<span>View Report</span>
							</button>
						) : (
							isCommunity && (
								<button
									type="button"
									onClick={onReport}
									className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFC940] hover:bg-[#ffbe1a] text-black font-black text-xs border-[2.5px] border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer select-none"
								>
									<svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
										<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
										<polyline points="14 2 14 8 20 8" />
										<line x1="12" y1="18" x2="12" y2="12" />
										<line x1="9" y1="15" x2="15" y2="15" />
									</svg>
									<span>Submit Report</span>
								</button>
							)
						)}
					</>
				)}
			</div>
		</div>
	)
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-1.5">
			<label className="text-xs font-black uppercase text-black/70 flex items-center gap-1">
				<span>{label}</span>
				{required && <span className="text-[#EE2C2C]">*</span>}
			</label>
			{children}
		</div>
	)
}

const inputClass =
	"w-full px-3.5 py-2.5 rounded-xl bg-white text-xs font-bold text-black border-2 border-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-[#EE2C2C] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"

import { uploadBrandCommunityDealReportImage } from "@/lib/uploadMedia"

export function BrandCommunityDealFormModal({
	interestId,
	initialDomain,
	deal,
	onClose,
	onSaved,
}: {
	interestId: string
	initialDomain?: BrandCommunityInterestDomain | null
	deal: BrandCommunityCollaborationDeal | null
	onClose: () => void
	onSaved: (deal: BrandCommunityCollaborationDeal) => void
}) {
	const [collaborationType, setCollaborationType] = useState<BrandCommunityInterestDomain>(
		(deal?.collaborationType as BrandCommunityInterestDomain) || initialDomain || "SPONSORSHIP"
	)
	// Common / Category fields
	const [projectName, setProjectName] = useState(deal?.projectName || "")
	const [startDate, setStartDate] = useState(deal?.startDate ? deal.startDate.slice(0, 10) : "")
	const [endDate, setEndDate] = useState(deal?.endDate ? deal.endDate.slice(0, 10) : "")
	const [deliverables, setDeliverables] = useState(deal?.deliverables || "")
	
	// Sponsorship: Sponsorship Cost
	// Branded Content: Platforms, Project Cost
	// Sampling: Cities, Sampling Elements, Sampling Cost
	const existingData = (deal?.dealData as any) || {}
	const [sponsorshipCost, setSponsorshipCost] = useState(
		deal?.sponsorshipAmount ? String(deal.sponsorshipAmount) : existingData.sponsorshipCost ? String(existingData.sponsorshipCost) : ""
	)
	const [platforms, setPlatforms] = useState<string>(existingData.platforms || deal?.venue || "")
	const [projectCost, setProjectCost] = useState(
		deal?.sponsorshipAmount ? String(deal.sponsorshipAmount) : existingData.projectCost ? String(existingData.projectCost) : ""
	)
	const [cities, setCities] = useState<string>(existingData.cities || deal?.venue || "")
	const [samplingElements, setSamplingElements] = useState<string>(
		existingData.samplingElements || deal?.barterElements || ""
	)
	const [samplingCost, setSamplingCost] = useState(
		deal?.sponsorshipAmount ? String(deal.sponsorshipAmount) : existingData.samplingCost ? String(existingData.samplingCost) : ""
	)

	const [saving, setSaving] = useState(false)

	// Validation by category
	let isValid = false
	if (collaborationType === "SPONSORSHIP") {
		isValid = Boolean(startDate && endDate && sponsorshipCost.trim() && deliverables.trim())
	} else if (collaborationType === "BRANDED_CONTENT") {
		isValid = Boolean(projectName.trim() && startDate && endDate && platforms.trim() && projectCost.trim() && deliverables.trim())
	} else if (collaborationType === "SAMPLING") {
		isValid = Boolean(projectName.trim() && startDate && endDate && cities.trim() && samplingElements.trim() && samplingCost.trim() && deliverables.trim())
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!isValid || saving) return
		setSaving(true)
		try {
			let costAmount = 0
			let venueValue = ""
			let barterElementsValue: string | null = null
			let resolvedProjectName = projectName.trim()

			if (collaborationType === "SPONSORSHIP") {
				costAmount = Number(sponsorshipCost) || 0
				resolvedProjectName = resolvedProjectName || "Sponsorship Deal"
				venueValue = "On-ground / Event"
			} else if (collaborationType === "BRANDED_CONTENT") {
				costAmount = Number(projectCost) || 0
				venueValue = platforms.trim()
			} else if (collaborationType === "SAMPLING") {
				costAmount = Number(samplingCost) || 0
				venueValue = cities.trim()
				barterElementsValue = samplingElements.trim()
			}

			const payload = {
				collaborationType,
				projectName: resolvedProjectName,
				startDate: new Date(startDate).toISOString(),
				endDate: endDate ? new Date(endDate).toISOString() : null,
				venue: venueValue,
				deliverables: deliverables.trim(),
				sponsorshipAmount: costAmount,
				barterElements: barterElementsValue,
				dealData: {
					platforms: collaborationType === "BRANDED_CONTENT" ? platforms.trim() : undefined,
					cities: collaborationType === "SAMPLING" ? cities.trim() : undefined,
					samplingElements: collaborationType === "SAMPLING" ? samplingElements.trim() : undefined,
					sponsorshipCost: collaborationType === "SPONSORSHIP" ? costAmount : undefined,
					projectCost: collaborationType === "BRANDED_CONTENT" ? costAmount : undefined,
					samplingCost: collaborationType === "SAMPLING" ? costAmount : undefined,
				},
			}
			const result = await lockBrandCommunityDeal(interestId, payload, "COMMUNITY")
			toast.success(deal ? "Deal updated successfully." : "Deal terms locked and sent to the brand!")
			onSaved(result)
			onClose()
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Failed to save deal.")
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
			<div className="bg-white rounded-[24px] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-black shrink-0 bg-neutral-50">
					<div>
						<h2 className="text-base sm:text-lg font-black text-black">
							{deal ? "Edit Deal Terms" : "Lock the Deal Terms"}
						</h2>
						<p className="text-xs font-semibold text-black/50">
							Define agreed deliverables and terms for brand review.
						</p>
					</div>
					<button onClick={onClose} className="text-2xl font-black text-black/40 hover:text-black leading-none cursor-pointer" aria-label="Close">
						×
					</button>
				</div>

				<form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
					{/* Category selection */}
					<div className="flex flex-col gap-2">
						<label className="text-xs font-black uppercase text-black/70 flex items-center gap-1">
							<span>Collaboration Category</span>
							<span className="text-[#EE2C2C]">*</span>
						</label>
						<div className="grid grid-cols-3 gap-2.5">
							{(
								[
									{ value: "SPONSORSHIP" as const, label: "Sponsorship" },
									{ value: "BRANDED_CONTENT" as const, label: "Branded Content" },
									{ value: "SAMPLING" as const, label: "Sampling" },
								] as const
							).map((opt) => {
								const isSelected = collaborationType === opt.value
								return (
									<button
										key={opt.value}
										type="button"
										onClick={() => setCollaborationType(opt.value)}
										className={clsx(
											"py-2 px-3 border-2 border-black rounded-xl text-xs font-black uppercase tracking-wide transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none cursor-pointer text-center",
											isSelected
												? "bg-[#EE2C2C] text-white shadow-none translate-x-[2px] translate-y-[2px]"
												: "bg-white hover:bg-neutral-100 text-black hover:translate-x-[1px] hover:translate-y-[1px]"
										)}
									>
										{opt.label}
									</button>
								)
							})}
						</div>
					</div>

					{/* Category Specific Form Fields */}
					{collaborationType === "SPONSORSHIP" && (
						<>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<Field label="Start Date" required>
									<input
										type="date"
										value={startDate}
										onChange={(e) => setStartDate(e.target.value)}
										className={inputClass}
										required
									/>
								</Field>
								<Field label="End Date" required>
									<input
										type="date"
										value={endDate}
										onChange={(e) => setEndDate(e.target.value)}
										className={inputClass}
										required
									/>
								</Field>
							</div>

							<Field label="Sponsorship Cost (₹)" required>
								<input
									type="number"
									min="0"
									value={sponsorshipCost}
									onChange={(e) => setSponsorshipCost(e.target.value)}
									placeholder="e.g. 50000"
									className={inputClass}
									required
								/>
							</Field>

							<Field label="Deliverables" required>
								<textarea
									value={deliverables}
									onChange={(e) => setDeliverables(e.target.value)}
									rows={3}
									placeholder="Specify all agreed sponsorship deliverables..."
									className={inputClass}
									required
								/>
							</Field>
						</>
					)}

					{collaborationType === "BRANDED_CONTENT" && (
						<>
							<Field label="Project Name" required>
								<input
									type="text"
									value={projectName}
									onChange={(e) => setProjectName(e.target.value)}
									placeholder="e.g. Summer Campaign Video Series"
									className={inputClass}
									required
								/>
							</Field>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<Field label="Start Date" required>
									<input
										type="date"
										value={startDate}
										onChange={(e) => setStartDate(e.target.value)}
										className={inputClass}
										required
									/>
								</Field>
								<Field label="End Date" required>
									<input
										type="date"
										value={endDate}
										onChange={(e) => setEndDate(e.target.value)}
										className={inputClass}
										required
									/>
								</Field>
							</div>

							<Field label="Platforms" required>
								<input
									type="text"
									value={platforms}
									onChange={(e) => setPlatforms(e.target.value)}
									placeholder="e.g. Instagram, YouTube, LinkedIn"
									className={inputClass}
									required
								/>
							</Field>

							<Field label="Project Cost (₹)" required>
								<input
									type="number"
									min="0"
									value={projectCost}
									onChange={(e) => setProjectCost(e.target.value)}
									placeholder="e.g. 45000"
									className={inputClass}
									required
								/>
							</Field>

							<Field label="Deliverables" required>
								<textarea
									value={deliverables}
									onChange={(e) => setDeliverables(e.target.value)}
									rows={3}
									placeholder="Detail the branded content deliverables (e.g. 2 Reels, 1 Video)..."
									className={inputClass}
									required
								/>
							</Field>
						</>
					)}

					{collaborationType === "SAMPLING" && (
						<>
							<Field label="Project Name" required>
								<input
									type="text"
									value={projectName}
									onChange={(e) => setProjectName(e.target.value)}
									placeholder="e.g. Citywide Product Sampling Drive"
									className={inputClass}
									required
								/>
							</Field>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<Field label="Start Date" required>
									<input
										type="date"
										value={startDate}
										onChange={(e) => setStartDate(e.target.value)}
										className={inputClass}
										required
									/>
								</Field>
								<Field label="End Date" required>
									<input
										type="date"
										value={endDate}
										onChange={(e) => setEndDate(e.target.value)}
										className={inputClass}
										required
									/>
								</Field>
							</div>

							<Field label="Cities" required>
								<input
									type="text"
									value={cities}
									onChange={(e) => setCities(e.target.value)}
									placeholder="e.g. Bengaluru, Mumbai, Delhi"
									className={inputClass}
									required
								/>
							</Field>

							<Field label="Sampling Elements" required>
								<textarea
									value={samplingElements}
									onChange={(e) => setSamplingElements(e.target.value)}
									rows={2}
									placeholder="e.g. 500 Energy drink cans, branded sample bags, feedback QR standee"
									className={inputClass}
									required
								/>
							</Field>

							<Field label="Sampling Cost (₹)" required>
								<input
									type="number"
									min="0"
									value={samplingCost}
									onChange={(e) => setSamplingCost(e.target.value)}
									placeholder="e.g. 25000"
									className={inputClass}
									required
								/>
							</Field>

							<Field label="Deliverables" required>
								<textarea
									value={deliverables}
									onChange={(e) => setDeliverables(e.target.value)}
									rows={3}
									placeholder="Detail sampling distribution deliverables..."
									className={inputClass}
									required
								/>
							</Field>
						</>
					)}

					{/* Actions */}
					<div className="px-1 pt-3 border-t-[2.5px] border-black/10 flex items-center justify-end gap-3 shrink-0">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer select-none"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={!isValid || saving}
							className="px-5 py-2 rounded-xl bg-[#EE2C2C] hover:bg-[#d42525] text-white font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer select-none disabled:opacity-50"
						>
							{saving ? "Saving…" : deal ? "Save Changes" : "Submit & Lock Deal"}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}

export function BrandCommunityDealDetailsModal({
	interestId,
	deal,
	role,
	onClose,
	onUpdated,
}: {
	interestId: string
	deal: BrandCommunityCollaborationDeal
	role: "COMMUNITY" | "BRAND"
	onClose: () => void
	onUpdated: (deal: BrandCommunityCollaborationDeal) => void
}) {
	const [requestingChanges, setRequestingChanges] = useState(false)
	const [note, setNote] = useState("")
	const [busy, setBusy] = useState(false)

	const isBrand = role === "BRAND"
	const canApproveOrRevise = isBrand && deal.status !== "APPROVED"
	const dealData = (deal.dealData as any) || {}

	async function handleApprove() {
		setBusy(true)
		try {
			const updated = await approveBrandCommunityDeal(interestId, "BRAND")
			if (typeof window !== "undefined") {
				confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })
			}
			toast.success("Deal terms approved! Deal is now locked.")
			onUpdated(updated)
			onClose()
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Failed to approve deal.")
		} finally {
			setBusy(false)
		}
	}

	async function handleRequestChanges() {
		setBusy(true)
		try {
			const updated = await requestBrandCommunityDealChanges(interestId, { note: note.trim() || undefined }, "BRAND")
			toast.success("Requested changes to the deal.")
			onUpdated(updated)
			onClose()
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Failed to request changes.")
		} finally {
			setBusy(false)
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
			<div className="bg-white rounded-[24px] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
				<div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-black shrink-0 bg-neutral-50">
					<div className="flex items-center gap-2">
						<h2 className="text-base sm:text-lg font-black text-black">
							Deal Details
						</h2>
						<span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-black uppercase border border-black", STATUS_COLOR[deal.status])}>
							{STATUS_LABEL[deal.status] || deal.status}
						</span>
					</div>
					<button onClick={onClose} className="text-2xl font-black text-black/40 hover:text-black leading-none cursor-pointer" aria-label="Close">
						×
					</button>
				</div>

				<div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3 text-xs">
					<div className="p-3 bg-neutral-50 rounded-xl border-2 border-black flex items-center justify-between">
						<span className="font-bold text-black/60 uppercase">Collaboration Category</span>
						<span className="font-black text-sm text-[#EE2C2C]">{deal.collaborationType}</span>
					</div>

					{/* Sponsorship fields display */}
					{deal.collaborationType === "SPONSORSHIP" && (
						<>
							<div className="grid grid-cols-2 gap-3 pt-1">
								<div>
									<span className="font-bold text-black/40 uppercase text-[10px]">Start Date</span>
									<p className="font-bold text-black">{deal.startDate ? new Date(deal.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</p>
								</div>
								<div>
									<span className="font-bold text-black/40 uppercase text-[10px]">End Date</span>
									<p className="font-bold text-black">{deal.endDate ? new Date(deal.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</p>
								</div>
							</div>

							<div>
								<span className="font-bold text-black/40 uppercase text-[10px]">Sponsorship Cost</span>
								<p className="font-black text-black text-sm">{formatAmount(deal.sponsorshipAmount || dealData.sponsorshipCost)}</p>
							</div>

							<div>
								<span className="font-bold text-black/40 uppercase text-[10px]">Deliverables</span>
								<p className="font-semibold text-black/80 whitespace-pre-wrap mt-0.5 bg-neutral-50 p-2.5 rounded-lg border border-black/20">
									{deal.deliverables}
								</p>
							</div>
						</>
					)}

					{/* Branded Content fields display */}
					{deal.collaborationType === "BRANDED_CONTENT" && (
						<>
							<div className="flex flex-col gap-1">
								<span className="font-bold text-black/40 uppercase text-[10px]">Project Name</span>
								<p className="font-black text-sm text-black">{deal.projectName}</p>
							</div>

							<div className="grid grid-cols-2 gap-3 pt-1">
								<div>
									<span className="font-bold text-black/40 uppercase text-[10px]">Start Date</span>
									<p className="font-bold text-black">{deal.startDate ? new Date(deal.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</p>
								</div>
								<div>
									<span className="font-bold text-black/40 uppercase text-[10px]">End Date</span>
									<p className="font-bold text-black">{deal.endDate ? new Date(deal.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</p>
								</div>
							</div>

							<div>
								<span className="font-bold text-black/40 uppercase text-[10px]">Platforms</span>
								<p className="font-bold text-black">{dealData.platforms || deal.venue || "—"}</p>
							</div>

							<div>
								<span className="font-bold text-black/40 uppercase text-[10px]">Project Cost</span>
								<p className="font-black text-black text-sm">{formatAmount(deal.sponsorshipAmount || dealData.projectCost)}</p>
							</div>

							<div>
								<span className="font-bold text-black/40 uppercase text-[10px]">Deliverables</span>
								<p className="font-semibold text-black/80 whitespace-pre-wrap mt-0.5 bg-neutral-50 p-2.5 rounded-lg border border-black/20">
									{deal.deliverables}
								</p>
							</div>
						</>
					)}

					{/* Sampling fields display */}
					{deal.collaborationType === "SAMPLING" && (
						<>
							<div className="flex flex-col gap-1">
								<span className="font-bold text-black/40 uppercase text-[10px]">Project Name</span>
								<p className="font-black text-sm text-black">{deal.projectName}</p>
							</div>

							<div className="grid grid-cols-2 gap-3 pt-1">
								<div>
									<span className="font-bold text-black/40 uppercase text-[10px]">Start Date</span>
									<p className="font-bold text-black">{deal.startDate ? new Date(deal.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</p>
								</div>
								<div>
									<span className="font-bold text-black/40 uppercase text-[10px]">End Date</span>
									<p className="font-bold text-black">{deal.endDate ? new Date(deal.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</p>
								</div>
							</div>

							<div>
								<span className="font-bold text-black/40 uppercase text-[10px]">Cities</span>
								<p className="font-bold text-black">{dealData.cities || deal.venue || "—"}</p>
							</div>

							<div>
								<span className="font-bold text-black/40 uppercase text-[10px]">Sampling Elements</span>
								<p className="font-semibold text-black/80 whitespace-pre-wrap mt-0.5 bg-neutral-50 p-2.5 rounded-lg border border-black/20">
									{dealData.samplingElements || deal.barterElements || "—"}
								</p>
							</div>

							<div>
								<span className="font-bold text-black/40 uppercase text-[10px]">Sampling Cost</span>
								<p className="font-black text-black text-sm">{formatAmount(deal.sponsorshipAmount || dealData.samplingCost)}</p>
							</div>

							<div>
								<span className="font-bold text-black/40 uppercase text-[10px]">Deliverables</span>
								<p className="font-semibold text-black/80 whitespace-pre-wrap mt-0.5 bg-neutral-50 p-2.5 rounded-lg border border-black/20">
									{deal.deliverables}
								</p>
							</div>
						</>
					)}

					{deal.changeRequestNote && (
						<div className="p-3 bg-amber-50 rounded-xl border-2 border-amber-800 text-amber-900">
							<p className="font-black text-[10px] uppercase">Requested Changes Note:</p>
							<p className="font-bold mt-0.5">{deal.changeRequestNote}</p>
						</div>
					)}

					{canApproveOrRevise && requestingChanges && (
						<div className="pt-2 border-t border-black/10 flex flex-col gap-1.5">
							<label className="text-[10px] font-black uppercase text-black/60">What needs to change?</label>
							<textarea
								value={note}
								onChange={(e) => setNote(e.target.value)}
								rows={2}
								className={inputClass}
								placeholder="e.g. Can we adjust the deliverables or timeline?"
							/>
						</div>
					)}
				</div>

				{canApproveOrRevise ? (
					<div className="px-6 py-4 border-t-[3px] border-black flex justify-end gap-3 shrink-0 bg-neutral-50">
						{requestingChanges ? (
							<>
								<button
									type="button"
									onClick={() => setRequestingChanges(false)}
									disabled={busy}
									className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
								>
									Back
								</button>
								<button
									type="button"
									onClick={handleRequestChanges}
									disabled={busy}
									className="px-4 py-2 rounded-xl bg-[#EE2C2C] hover:bg-[#d42525] text-white font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
								>
									{busy ? "…" : "Send Request"}
								</button>
							</>
						) : (
							<>
								<button
									type="button"
									onClick={() => setRequestingChanges(true)}
									disabled={busy}
									className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
								>
									Request Changes
								</button>
								<button
									type="button"
									onClick={handleApprove}
									disabled={busy}
									className="px-4.5 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
								>
									{busy ? "…" : "Approve & Lock Deal"}
								</button>
							</>
						)}
					</div>
				) : (
					<div className="px-6 py-4 border-t-[3px] border-black flex justify-end gap-3 shrink-0 bg-neutral-50">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
						>
							Close
						</button>
					</div>
				)}
			</div>
		</div>
	)
}

export function BrandCommunityDealReportModal({
	interestId,
	deal,
	report,
	role,
	onClose,
	onSaved,
}: {
	interestId: string
	deal: BrandCommunityCollaborationDeal
	report: BrandCommunityCollaborationDealReport | null
	role: "COMMUNITY" | "BRAND"
	onClose: () => void
	onSaved: (report: BrandCommunityCollaborationDealReport) => void
}) {
	const isCommunity = role === "COMMUNITY"
	const isBrand = role === "BRAND"
	const isApproved = report?.status === "APPROVED"
	const isReadOnly = isBrand || isApproved
	const category = deal.collaborationType

	// Review / revision controls for Brand
	const [revisionNote, setRevisionNote] = useState(report?.revisionNote || "")
	const [showRevisionInput, setShowRevisionInput] = useState(false)
	const [reviewAction, setReviewAction] = useState<"APPROVE" | "REVISE" | null>(null)

	// Common fields
	const existingReportData = (report?.reportData as any) || {}
	const [projectName, setProjectName] = useState(
		report?.projectName || existingReportData.projectName || deal.projectName || ""
	)
	const [startDate, setStartDate] = useState(
		report?.eventDate ? report.eventDate.slice(0, 10) : existingReportData.startDate || (deal.startDate ? deal.startDate.slice(0, 10) : "")
	)
	const [endDate, setEndDate] = useState(
		existingReportData.endDate || (deal.endDate ? deal.endDate.slice(0, 10) : "")
	)

	// Checklist deliverables: array of { text: string; checked: boolean }
	// Parse current deal deliverables
	const currentDealItems = (deal.deliverables || "")
		.split("\n")
		.map((s) => s.replace(/^[-*•\d.]+\s*/, "").trim())
		.filter(Boolean)

	const [deliverablesList, setDeliverablesList] = useState<{ text: string; checked: boolean }[]>(() => {
		const savedList: { text: string; checked: boolean }[] =
			Array.isArray(report?.deliverables) && report.deliverables.length > 0
				? report.deliverables
				: Array.isArray(existingReportData.deliverablesChecklist)
				? existingReportData.deliverablesChecklist
				: []

		// If no report saved yet, or if deal was revised and has new deliverables, synchronize them:
		if (savedList.length === 0) {
			return currentDealItems.map((text) => ({ text, checked: false }))
		}

		// Merge saved checklist check state with updated deal items
		const savedMap = new Map(savedList.map((item) => [item.text.trim().toLowerCase(), item.checked]))
		return currentDealItems.map((text) => ({
			text,
			checked: savedMap.get(text.trim().toLowerCase()) ?? false,
		}))
	})

	const [viewingImage, setViewingImage] = useState<string | null>(null)

	// Proof Photos
	const [proofPhotos, setProofPhotos] = useState<{ key?: string; url: string }[]>(() => {
		if (Array.isArray(report?.mediaKeys) && report.mediaKeys.length > 0) {
			return report.mediaKeys.map((key, i) => {
				const url =
					report.proofUrls?.[i] ||
					(Array.isArray(existingReportData.proofPhotos) ? existingReportData.proofPhotos[i]?.url : "") ||
					key
				return { key, url }
			})
		}
		if (Array.isArray(existingReportData.proofPhotos) && existingReportData.proofPhotos.length > 0) {
			return existingReportData.proofPhotos
		}
		return []
	})

	useEffect(() => {
		if (Array.isArray(report?.mediaKeys) && report.mediaKeys.length > 0) {
			setProofPhotos((prev) => {
				return report.mediaKeys!.map((key, i) => {
					const existing = prev.find((p) => p.key === key)
					if (existing?.url && (existing.url.startsWith("blob:") || existing.url.startsWith("http"))) {
						return existing
					}
					const url =
						report.proofUrls?.[i] ||
						(Array.isArray(existingReportData.proofPhotos) ? existingReportData.proofPhotos[i]?.url : "") ||
						existing?.url ||
						key
					return { key, url }
				})
			})
		}
	}, [report?.mediaKeys, report?.proofUrls])

	const [uploadingPhoto, setUploadingPhoto] = useState(false)

	// Video links
	const [videoLinks, setVideoLinks] = useState<string[]>(() => {
		if (Array.isArray(report?.videoLinks) && report.videoLinks.length > 0) return report.videoLinks
		if (Array.isArray(existingReportData.videoLinks)) return existingReportData.videoLinks
		return [""]
	})

	// Social media links
	const [socialLinks, setSocialLinks] = useState<string[]>(() => {
		if (Array.isArray(report?.socialLinks) && report.socialLinks.length > 0) return report.socialLinks
		if (Array.isArray(existingReportData.socialLinks)) return existingReportData.socialLinks
		return [""]
	})

	// Branded Content specific:
	const [guestCount, setGuestCount] = useState(
		report?.guestCount || existingReportData.guestCount || ""
	)
	const [socialReach, setSocialReach] = useState(
		existingReportData.socialReach || ""
	)

	// Sampling specific:
	const [totalSamplesDistributed, setTotalSamplesDistributed] = useState(
		existingReportData.totalSamplesDistributed || report?.guestCount || ""
	)
	const [membersData, setMembersData] = useState(
		existingReportData.membersData || report?.summary || ""
	)

	const [saving, setSaving] = useState(false)

	async function handleUploadPhoto(file: File) {
		if (!file.type.startsWith("image/")) {
			toast.error("Please upload an image file.")
			return
		}
		setUploadingPhoto(true)
		try {
			const key = await uploadBrandCommunityDealReportImage(file, interestId)
			setProofPhotos((prev) => [...prev, { key, url: URL.createObjectURL(file) }])
			toast.success("Photo uploaded successfully!")
		} catch (err: any) {
			toast.error(err?.message || "Failed to upload photo.")
		} finally {
			setUploadingPhoto(false)
		}
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (saving || isApproved) return
		setSaving(true)
		try {
			const cleanVideoLinks = videoLinks.map((v) => v.trim()).filter(Boolean)
			const cleanSocialLinks = socialLinks.map((s) => s.trim()).filter(Boolean)
			const mediaKeyList = proofPhotos.map((p) => p.key).filter((k): k is string => Boolean(k))

			const reportDataPayload: any = {
				projectName: projectName.trim(),
				startDate,
				endDate,
				deliverablesChecklist: deliverablesList,
				proofPhotos,
				videoLinks: cleanVideoLinks,
				socialLinks: cleanSocialLinks,
				guestCount: category === "BRANDED_CONTENT" ? guestCount.trim() : undefined,
				socialReach: category === "BRANDED_CONTENT" ? socialReach.trim() : undefined,
				totalSamplesDistributed: category === "SAMPLING" ? totalSamplesDistributed.trim() : undefined,
				membersData: category === "SAMPLING" ? membersData.trim() : undefined,
			}

			const payload = {
				projectName: projectName.trim() || deal.projectName,
				eventDate: startDate || (deal.startDate ? deal.startDate.slice(0, 10) : ""),
				venue: deal.venue,
				guestCount: category === "BRANDED_CONTENT" ? guestCount.trim() || null : category === "SAMPLING" ? totalSamplesDistributed.trim() || null : null,
				deliverables: deliverablesList,
				videoLinks: cleanVideoLinks,
				socialLinks: cleanSocialLinks,
				mediaKeys: mediaKeyList,
				summary: category === "SAMPLING" ? membersData.trim() || null : null,
				reportData: reportDataPayload,
				status: isBrand ? (reviewAction === "REVISE" ? "REVISION_REQUESTED" : "APPROVED") : "PENDING",
				revisionNote: isBrand && reviewAction === "REVISE" ? revisionNote.trim() : null,
			}

			const result = await submitBrandCommunityDealReport(interestId, payload, isBrand ? "BRAND" : "COMMUNITY")
			if (isBrand) {
				if (reviewAction === "REVISE") {
					toast.success("Requested changes on the deliverables report.")
				} else {
					if (typeof window !== "undefined") {
						confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })
					}
					toast.success("Report approved! Deal is officially closed.")
				}
			} else {
				toast.success(report ? "Report resubmitted for review!" : "Deliverables report submitted successfully!")
			}
			onSaved(result)
			onClose()
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Failed to submit report.")
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
			<div className="bg-white rounded-[24px] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full max-w-xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
				<div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-black shrink-0 bg-neutral-50">
					<div className="flex items-center gap-2">
						<div>
							<h2 className="text-base sm:text-lg font-black text-black">
								{isApproved ? "Deliverables Report (Approved)" : report ? "Deliverables Report" : "Submit Deliverables Report"}
							</h2>
							<p className="text-xs font-semibold text-black/50">
								{deal.projectName} · {deal.collaborationType}
							</p>
						</div>
						{report?.status && (
							<span
								className={clsx(
									"ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border border-black",
									report.status === "APPROVED"
										? "bg-emerald-100 text-emerald-900 border-emerald-900"
										: report.status === "REVISION_REQUESTED"
										? "bg-rose-100 text-rose-900 border-rose-900"
										: "bg-amber-100 text-amber-900 border-amber-900"
								)}
							>
								{report.status === "APPROVED"
									? "Approved"
									: report.status === "REVISION_REQUESTED"
									? "Revision Requested"
									: "Pending Review"}
							</span>
						)}
					</div>
					<button onClick={onClose} className="text-2xl font-black text-black/40 hover:text-black leading-none cursor-pointer" aria-label="Close">
						×
					</button>
				</div>

				{isApproved && (
					<div className="mx-6 mt-4 p-3 bg-emerald-50 rounded-xl border-2 border-emerald-800 text-emerald-950 flex items-center gap-2.5">
						<span className="text-base shrink-0">✅</span>
						<div>
							<p className="font-black text-xs uppercase tracking-wider text-emerald-900">Report Approved · Deal Officially Closed</p>
							<p className="font-bold text-[11px] text-emerald-800 mt-0.5">This deliverables report has been approved. No further modifications or resubmissions can be made.</p>
						</div>
					</div>
				)}

				{report?.revisionNote && !isApproved && (
					<div className="mx-6 mt-4 p-3.5 bg-rose-50 rounded-xl border-2 border-rose-800 text-rose-950">
						<p className="font-black text-[11px] uppercase tracking-wider text-rose-900">Brand Requested Revision Note:</p>
						<p className="font-bold text-xs mt-1 whitespace-pre-wrap">{report.revisionNote}</p>
					</div>
				)}

				<form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4 text-xs">
					{/* Project Name */}
					<Field label="Project Name" required>
						<input
							type="text"
							value={projectName}
							onChange={(e) => setProjectName(e.target.value)}
							readOnly={isReadOnly}
							placeholder="e.g. Project / Campaign Name"
							className={inputClass}
							required
						/>
					</Field>

					{/* Start Date & End Date */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<Field label="Start Date" required>
							<input
								type="date"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
								readOnly={isReadOnly}
								className={inputClass}
								required
							/>
						</Field>
						<Field label="End Date" required>
							<input
								type="date"
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
								readOnly={isReadOnly}
								className={inputClass}
								required
							/>
						</Field>
					</div>

					{/* SPONSORSHIP REPORT FIELDS */}
					{category === "SPONSORSHIP" && (
						<>
							{/* Deliverables Checklist */}
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-black uppercase text-black/70">Deliverables Checklist</label>
								<div className="flex flex-col gap-2 p-3 bg-neutral-50 border-2 border-black rounded-xl">
									{deliverablesList.length === 0 ? (
										<p className="text-black/50 italic text-[11px]">No deliverables specified in deal.</p>
									) : (
										deliverablesList.map((item, idx) => (
											<label key={idx} className={clsx("flex items-center gap-2.5", isReadOnly ? "cursor-default" : "cursor-pointer")}>
												<input
													type="checkbox"
													checked={item.checked}
													disabled={isReadOnly}
													onChange={(e) => {
														if (isReadOnly) return
														const updated = [...deliverablesList]
														updated[idx].checked = e.target.checked
														setDeliverablesList(updated)
													}}
													className="size-4 rounded accent-[#EE2C2C] border-2 border-black cursor-pointer"
												/>
												<span className={clsx("text-xs font-bold", item.checked ? "text-black line-through opacity-70" : "text-black")}>
													{item.text}
												</span>
											</label>
										))
									)}
								</div>
							</div>

							{/* Proof Photos */}
							<div className="flex flex-col gap-1.5">
								<div className="flex items-center justify-between">
									<label className="text-xs font-black uppercase text-black/70">Proof Photos</label>
									{proofPhotos.length > 0 && (
										<span className="text-[10px] font-bold text-black/40">
											Click photo to view full size
										</span>
									)}
								</div>
								<div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
									{proofPhotos.map((photo, i) => {
										const isRealImage =
											photo.url.startsWith("http") ||
											photo.url.startsWith("blob:") ||
											photo.url.startsWith("data:")
										return (
											<div
												key={i}
												onClick={() => {
													if (isRealImage) {
														setViewingImage(photo.url)
													}
												}}
												className={clsx(
													"relative aspect-square border-2 border-black rounded-xl overflow-hidden bg-neutral-100 group transition-all",
													isRealImage
														? "cursor-pointer hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
														: ""
												)}
												title={isRealImage ? "Click to view full image" : undefined}
											>
												{isRealImage ? (
													<>
														{/* eslint-disable-next-line @next/next/no-img-element */}
														<img
															src={photo.url}
															alt={`Proof photo ${i + 1}`}
															className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
														/>
														<div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center pointer-events-none">
															<span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
																View
															</span>
														</div>
													</>
												) : (
													<div className="w-full h-full flex flex-col items-center justify-center text-[10px] font-black p-2 text-center bg-amber-50 text-amber-900">
														<span className="text-base mb-0.5">🖼️</span>
														<span>Proof Photo {i + 1}</span>
													</div>
												)}
												{!isReadOnly && (
													<button
														type="button"
														onClick={(e) => {
															e.stopPropagation()
															setProofPhotos((prev) => prev.filter((_, idx) => idx !== i))
														}}
														className="absolute top-1.5 right-1.5 size-5 bg-black text-white rounded-full flex items-center justify-center text-xs font-black hover:bg-[#EE2C2C] cursor-pointer shadow-sm z-10 transition-colors"
														title="Remove photo"
													>
														×
													</button>
												)}
											</div>
										)
									})}
									{!isReadOnly && (
										<label className="aspect-square border-2 border-dashed border-black/40 hover:border-black rounded-xl flex flex-col items-center justify-center text-center p-2 cursor-pointer transition-colors hover:bg-neutral-50 group">
											<input
												type="file"
												accept="image/*"
												className="hidden"
												disabled={uploadingPhoto}
												onChange={(e) => {
													const f = e.target.files?.[0]
													if (f) handleUploadPhoto(f)
												}}
											/>
											<span className="text-xl leading-none font-black group-hover:scale-110 transition-transform">+</span>
											<span className="text-[10px] font-bold text-black/60 mt-1">
												{uploadingPhoto ? "Uploading…" : "Add Photo"}
											</span>
										</label>
									)}
								</div>
							</div>

							{/* Video Links */}
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-black uppercase text-black/70">Video Links</label>
								{videoLinks.map((link, i) => (
									<div key={i} className="flex items-center gap-2">
										<input
											type="url"
											value={link}
											readOnly={isReadOnly}
											onChange={(e) => {
												const copy = [...videoLinks]
												copy[i] = e.target.value
												setVideoLinks(copy)
											}}
											placeholder="https://youtube.com/... or Google Drive"
											className={inputClass}
										/>
										{!isReadOnly && videoLinks.length > 1 && (
											<button
												type="button"
												onClick={() => setVideoLinks((prev) => prev.filter((_, idx) => idx !== i))}
												className="p-2 border-2 border-black rounded-xl hover:bg-neutral-100 font-black cursor-pointer"
											>
												×
											</button>
										)}
									</div>
								))}
								{!isReadOnly && (
									<button
										type="button"
										onClick={() => setVideoLinks((prev) => [...prev, ""])}
										className="self-start text-[11px] font-black text-[#EE2C2C] hover:underline cursor-pointer"
									>
										+ Add another video link
									</button>
								)}
							</div>

							{/* Social Media Links */}
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-black uppercase text-black/70">Social Media Links</label>
								{socialLinks.map((link, i) => (
									<div key={i} className="flex items-center gap-2">
										<input
											type="url"
											value={link}
											readOnly={isReadOnly}
											onChange={(e) => {
												const copy = [...socialLinks]
												copy[i] = e.target.value
												setSocialLinks(copy)
											}}
											placeholder="https://instagram.com/..."
											className={inputClass}
										/>
										{!isReadOnly && socialLinks.length > 1 && (
											<button
												type="button"
												onClick={() => setSocialLinks((prev) => prev.filter((_, idx) => idx !== i))}
												className="p-2 border-2 border-black rounded-xl hover:bg-neutral-100 font-black cursor-pointer"
											>
												×
											</button>
										)}
									</div>
								))}
								{!isReadOnly && (
									<button
										type="button"
										onClick={() => setSocialLinks((prev) => [...prev, ""])}
										className="self-start text-[11px] font-black text-[#EE2C2C] hover:underline cursor-pointer"
									>
										+ Add another social link
									</button>
								)}
							</div>
						</>
					)}

					{/* BRANDED CONTENT REPORT FIELDS */}
					{category === "BRANDED_CONTENT" && (
						<>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<Field label="Guest Count" required>
									<input
										type="text"
										value={guestCount}
										readOnly={isReadOnly}
										onChange={(e) => setGuestCount(e.target.value)}
										placeholder="e.g. 250 attendees"
										className={inputClass}
										required
									/>
								</Field>
								<Field label="Social Reach" required>
									<input
										type="text"
										value={socialReach}
										readOnly={isReadOnly}
										onChange={(e) => setSocialReach(e.target.value)}
										placeholder="e.g. 50,000+ impressions"
										className={inputClass}
										required
									/>
								</Field>
							</div>

							{/* Deliverables Checklist */}
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-black uppercase text-black/70">Deliverables Checklist</label>
								<div className="flex flex-col gap-2 p-3 bg-neutral-50 border-2 border-black rounded-xl">
									{deliverablesList.length === 0 ? (
										<p className="text-black/50 italic text-[11px]">No deliverables specified in deal.</p>
									) : (
										deliverablesList.map((item, idx) => (
											<label key={idx} className={clsx("flex items-center gap-2.5", isReadOnly ? "cursor-default" : "cursor-pointer")}>
												<input
													type="checkbox"
													checked={item.checked}
													disabled={isReadOnly}
													onChange={(e) => {
														if (isReadOnly) return
														const updated = [...deliverablesList]
														updated[idx].checked = e.target.checked
														setDeliverablesList(updated)
													}}
													className="size-4 rounded accent-[#EE2C2C] border-2 border-black cursor-pointer"
												/>
												<span className={clsx("text-xs font-bold", item.checked ? "text-black line-through opacity-70" : "text-black")}>
													{item.text}
												</span>
											</label>
										))
									)}
								</div>
							</div>

							{/* Social Media Links */}
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-black uppercase text-black/70">Social Media Links</label>
								{socialLinks.map((link, i) => (
									<div key={i} className="flex items-center gap-2">
										<input
											type="url"
											value={link}
											readOnly={isReadOnly}
											onChange={(e) => {
												const copy = [...socialLinks]
												copy[i] = e.target.value
												setSocialLinks(copy)
											}}
											placeholder="https://instagram.com/reel/..."
											className={inputClass}
										/>
										{!isReadOnly && socialLinks.length > 1 && (
											<button
												type="button"
												onClick={() => setSocialLinks((prev) => prev.filter((_, idx) => idx !== i))}
												className="p-2 border-2 border-black rounded-xl hover:bg-neutral-100 font-black cursor-pointer"
											>
												×
											</button>
										)}
									</div>
								))}
								{!isReadOnly && (
									<button
										type="button"
										onClick={() => setSocialLinks((prev) => [...prev, ""])}
										className="self-start text-[11px] font-black text-[#EE2C2C] hover:underline cursor-pointer"
									>
										+ Add another social link
									</button>
								)}
							</div>
						</>
					)}

					{/* SAMPLING REPORT FIELDS */}
					{category === "SAMPLING" && (
						<>
							<Field label="Total Samples Distributed" required>
								<input
									type="text"
									value={totalSamplesDistributed}
									readOnly={isReadOnly}
									onChange={(e) => setTotalSamplesDistributed(e.target.value)}
									placeholder="e.g. 500 samples distributed across 3 hubs"
									className={inputClass}
									required
								/>
							</Field>

							<Field label="Members Data / Feedback" required>
								<textarea
									value={membersData}
									readOnly={isReadOnly}
									onChange={(e) => setMembersData(e.target.value)}
									rows={3}
									placeholder="Enter member feedback, recipient list summary, or demographic details..."
									className={inputClass}
									required
								/>
							</Field>

							{/* Proof Photos */}
							<div className="flex flex-col gap-1.5">
								<div className="flex items-center justify-between">
									<label className="text-xs font-black uppercase text-black/70">Proof Photos</label>
									{proofPhotos.length > 0 && (
										<span className="text-[10px] font-bold text-black/40">
											Click photo to view full size
										</span>
									)}
								</div>
								<div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
									{proofPhotos.map((photo, i) => {
										const isRealImage =
											photo.url.startsWith("http") ||
											photo.url.startsWith("blob:") ||
											photo.url.startsWith("data:")
										return (
											<div
												key={i}
												onClick={() => {
													if (isRealImage) {
														setViewingImage(photo.url)
													}
												}}
												className={clsx(
													"relative aspect-square border-2 border-black rounded-xl overflow-hidden bg-neutral-100 group transition-all",
													isRealImage
														? "cursor-pointer hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
														: ""
												)}
												title={isRealImage ? "Click to view full image" : undefined}
											>
												{isRealImage ? (
													<>
														{/* eslint-disable-next-line @next/next/no-img-element */}
														<img
															src={photo.url}
															alt={`Proof photo ${i + 1}`}
															className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
														/>
														<div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center pointer-events-none">
															<span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
																View
															</span>
														</div>
													</>
												) : (
													<div className="w-full h-full flex flex-col items-center justify-center text-[10px] font-black p-2 text-center bg-amber-50 text-amber-900">
														<span className="text-base mb-0.5">🖼️</span>
														<span>Proof Photo {i + 1}</span>
													</div>
												)}
												{!isReadOnly && (
													<button
														type="button"
														onClick={(e) => {
															e.stopPropagation()
															setProofPhotos((prev) => prev.filter((_, idx) => idx !== i))
														}}
														className="absolute top-1.5 right-1.5 size-5 bg-black text-white rounded-full flex items-center justify-center text-xs font-black hover:bg-[#EE2C2C] cursor-pointer shadow-sm z-10 transition-colors"
														title="Remove photo"
													>
														×
													</button>
												)}
											</div>
										)
									})}
									{!isReadOnly && (
										<label className="aspect-square border-2 border-dashed border-black/40 hover:border-black rounded-xl flex flex-col items-center justify-center text-center p-2 cursor-pointer transition-colors hover:bg-neutral-50 group">
											<input
												type="file"
												accept="image/*"
												className="hidden"
												disabled={uploadingPhoto}
												onChange={(e) => {
													const f = e.target.files?.[0]
													if (f) handleUploadPhoto(f)
												}}
											/>
											<span className="text-xl leading-none font-black group-hover:scale-110 transition-transform">+</span>
											<span className="text-[10px] font-bold text-black/60 mt-1">
												{uploadingPhoto ? "Uploading…" : "Add Photo"}
											</span>
										</label>
									)}
								</div>
							</div>
						</>
					)}

					{/* Brand Review Section */}
					{isBrand && !isApproved && showRevisionInput && (
						<div className="p-3 bg-amber-50 rounded-xl border-2 border-amber-800 flex flex-col gap-2 mt-2">
							<label className="text-xs font-black uppercase text-amber-950">
								What revisions are requested for this report?
							</label>
							<textarea
								value={revisionNote}
								onChange={(e) => setRevisionNote(e.target.value)}
								rows={2}
								placeholder="e.g. Missing 2 proof photos from the activation, or social reach link is inaccessible..."
								className={inputClass}
								required
							/>
						</div>
					)}

					<div className="px-1 pt-3 border-t-[2.5px] border-black/10 flex items-center justify-end gap-3 shrink-0">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
						>
							{isApproved ? "Close" : "Cancel"}
						</button>

						{/* Brand Actions */}
						{isBrand && !isApproved && (
							<>
								{showRevisionInput ? (
									<>
										<button
											type="button"
											onClick={() => {
												setShowRevisionInput(false)
												setReviewAction(null)
											}}
											className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
										>
											Back
										</button>
										<button
											type="submit"
											disabled={saving || !revisionNote.trim()}
											onClick={() => setReviewAction("REVISE")}
											className="px-5 py-2 rounded-xl bg-[#EE2C2C] hover:bg-[#d42525] text-white font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer disabled:opacity-50"
										>
											{saving ? "Sending…" : "Send Revision Request"}
										</button>
									</>
								) : (
									<>
										<button
											type="button"
											onClick={() => {
												setShowRevisionInput(true)
												setReviewAction("REVISE")
											}}
											className="px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
										>
											Request Changes
										</button>
										<button
											type="submit"
											disabled={saving}
											onClick={() => setReviewAction("APPROVE")}
											className="px-5 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer disabled:opacity-50"
										>
											{saving ? "Approving…" : "Approve & Close Deal"}
										</button>
									</>
								)}
							</>
						)}

						{/* Community Actions */}
						{!isBrand && !isApproved && (
							<button
								type="submit"
								disabled={saving}
								className="px-5 py-2 rounded-xl bg-[#EE2C2C] hover:bg-[#d42525] text-white font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer disabled:opacity-50"
							>
								{saving ? "Submitting…" : report ? "Resubmit Report" : "Submit Report"}
							</button>
						)}
					</div>
				</form>
			</div>
			{viewingImage && (
				<ImageLightbox url={viewingImage} onClose={() => setViewingImage(null)} />
			)}
		</div>
	)
}
