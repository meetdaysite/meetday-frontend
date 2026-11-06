"use client"

import { useState } from "react"
import { Icon } from "@/components/ui/Icon"
import clsx from "clsx"
import confetti from "canvas-confetti"
import { toast } from "sonner"
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
	const [projectName, setProjectName] = useState(deal?.projectName || "")
	const [startDate, setStartDate] = useState(deal?.startDate ? deal.startDate.slice(0, 10) : "")
	const [endDate, setEndDate] = useState(deal?.endDate ? deal.endDate.slice(0, 10) : "")
	const [venue, setVenue] = useState(deal?.venue || "")
	const [time, setTime] = useState(deal?.time || "")
	const [deliverables, setDeliverables] = useState(deal?.deliverables || "")
	const [sponsorshipAmount, setSponsorshipAmount] = useState(deal?.sponsorshipAmount ? String(deal.sponsorshipAmount) : "")
	const [barterElements, setBarterElements] = useState(deal?.barterElements || "")
	const [otherTerms, setOtherTerms] = useState(deal?.otherTerms || "")
	const [additionalNotes, setAdditionalNotes] = useState(deal?.additionalNotes || "")
	const [saving, setSaving] = useState(false)

	const isValid = Boolean(projectName.trim() && startDate && venue.trim() && deliverables.trim())

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!isValid || saving) return
		setSaving(true)
		try {
			const payload = {
				collaborationType,
				projectName: projectName.trim(),
				startDate: new Date(startDate).toISOString(),
				endDate: endDate ? new Date(endDate).toISOString() : null,
				venue: venue.trim(),
				time: time.trim() || null,
				deliverables: deliverables.trim(),
				sponsorshipAmount: sponsorshipAmount ? Number(sponsorshipAmount) : 0,
				barterElements: barterElements.trim() || null,
				otherTerms: otherTerms.trim() || null,
				additionalNotes: additionalNotes.trim() || null,
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
							Define agreed deliverables and timelines for brand review.
						</p>
					</div>
					<button onClick={onClose} className="text-2xl font-black text-black/40 hover:text-black leading-none cursor-pointer" aria-label="Close">
						×
					</button>
				</div>

				<form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
					{/* 1. First Field: Collaboration Type Selection */}
					<div className="flex flex-col gap-2">
						<label className="text-xs font-black uppercase text-black/70 flex items-center gap-1">
							<span>Collaboration Type</span>
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

					{/* 2. Dynamic Subfields */}
					<Field label="Project / Campaign Name" required>
						<input
							type="text"
							value={projectName}
							onChange={(e) => setProjectName(e.target.value)}
							placeholder={
								collaborationType === "SPONSORSHIP"
									? "e.g. Annual Creator Fest Sponsorship"
									: collaborationType === "BRANDED_CONTENT"
									? "e.g. Creator Co-Branded Video Series"
									: "e.g. On-ground Product Sampling Drive"
							}
							className={inputClass}
						/>
					</Field>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<Field label="Start Date" required>
							<input
								type="date"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
								className={inputClass}
							/>
						</Field>
						<Field label="End Date (Optional)">
							<input
								type="date"
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
								className={inputClass}
							/>
						</Field>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<Field label={collaborationType === "BRANDED_CONTENT" ? "Location / Platform" : "Venue / City"} required>
							<input
								type="text"
								value={venue}
								onChange={(e) => setVenue(e.target.value)}
								placeholder="e.g. Bengaluru / Instagram Live"
								className={inputClass}
							/>
						</Field>
						<Field label="Timings (Optional)">
							<input
								type="text"
								value={time}
								onChange={(e) => setTime(e.target.value)}
								placeholder="e.g. 5:00 PM - 9:00 PM"
								className={inputClass}
							/>
						</Field>
					</div>

					{/* Domain Specific Fields container */}
					{collaborationType === "SPONSORSHIP" && (
						<div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-black flex flex-col gap-3">
							<p className="text-[11px] font-black uppercase text-amber-900 tracking-wider">
								Sponsorship Details
							</p>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<Field label="Commercial Value (₹)">
									<input
										type="number"
										value={sponsorshipAmount}
										onChange={(e) => setSponsorshipAmount(e.target.value)}
										placeholder="e.g. 50000"
										className={inputClass}
									/>
								</Field>
								<Field label="Barter Elements (Optional)">
									<input
										type="text"
										value={barterElements}
										onChange={(e) => setBarterElements(e.target.value)}
										placeholder="e.g. 20 Free passes / Product vouchers"
										className={inputClass}
									/>
								</Field>
							</div>
						</div>
					)}

					{collaborationType === "BRANDED_CONTENT" && (
						<div className="p-3.5 rounded-2xl bg-indigo-50 border-2 border-black flex flex-col gap-3">
							<p className="text-[11px] font-black uppercase text-indigo-900 tracking-wider">
								Branded Content Scope
							</p>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<Field label="Budget / Production Fee (₹)">
									<input
										type="number"
										value={sponsorshipAmount}
										onChange={(e) => setSponsorshipAmount(e.target.value)}
										placeholder="e.g. 40000"
										className={inputClass}
									/>
								</Field>
								<Field label="Content Formats">
									<input
										type="text"
										value={barterElements}
										onChange={(e) => setBarterElements(e.target.value)}
										placeholder="e.g. 2 Reels, 4 Stories, 1 YouTube short"
										className={inputClass}
									/>
								</Field>
							</div>
						</div>
					)}

					{collaborationType === "SAMPLING" && (
						<div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-black flex flex-col gap-3">
							<p className="text-[11px] font-black uppercase text-emerald-900 tracking-wider">
								Sampling Drive Terms
							</p>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<Field label="Estimated Samples to Distribute">
									<input
										type="text"
										value={barterElements}
										onChange={(e) => setBarterElements(e.target.value)}
										placeholder="e.g. 250 units"
										className={inputClass}
									/>
								</Field>
								<Field label="Activation / Stall Fee (₹, if any)">
									<input
										type="number"
										value={sponsorshipAmount}
										onChange={(e) => setSponsorshipAmount(e.target.value)}
										placeholder="e.g. 15000"
										className={inputClass}
									/>
								</Field>
							</div>
						</div>
					)}

					<Field label="Key Agreed Deliverables" required>
						<textarea
							value={deliverables}
							onChange={(e) => setDeliverables(e.target.value)}
							rows={3}
							placeholder="Detail what the community will deliver (e.g. dedicated brand booth, logo integration, 3 product announcements)..."
							className={inputClass}
						/>
					</Field>

					<Field label="Other Information / Remarks (Optional)">
						<textarea
							value={additionalNotes}
							onChange={(e) => setAdditionalNotes(e.target.value)}
							rows={2}
							placeholder="Any other terms or special requests agreed in chat..."
							className={inputClass}
						/>
					</Field>

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
						<span className="font-bold text-black/60 uppercase">Collaboration Type</span>
						<span className="font-black text-sm text-[#EE2C2C]">{deal.collaborationType}</span>
					</div>

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

					<div className="grid grid-cols-2 gap-3">
						<div>
							<span className="font-bold text-black/40 uppercase text-[10px]">Venue / Location</span>
							<p className="font-bold text-black">{deal.venue || "—"}</p>
						</div>
						<div>
							<span className="font-bold text-black/40 uppercase text-[10px]">Timings</span>
							<p className="font-bold text-black">{deal.time || "—"}</p>
						</div>
					</div>

					{Number(deal.sponsorshipAmount) > 0 && (
						<div>
							<span className="font-bold text-black/40 uppercase text-[10px]">Commercial Value</span>
							<p className="font-black text-black text-sm">{formatAmount(deal.sponsorshipAmount)}</p>
						</div>
					)}

					{deal.barterElements && (
						<div>
							<span className="font-bold text-black/40 uppercase text-[10px]">Barter / Product Elements</span>
							<p className="font-semibold text-black/80">{deal.barterElements}</p>
						</div>
					)}

					<div>
						<span className="font-bold text-black/40 uppercase text-[10px]">Agreed Deliverables</span>
						<p className="font-semibold text-black/80 whitespace-pre-wrap mt-0.5 bg-neutral-50 p-2.5 rounded-lg border border-black/20">
							{deal.deliverables}
						</p>
					</div>

					{deal.additionalNotes && (
						<div>
							<span className="font-bold text-black/40 uppercase text-[10px]">Notes & Remarks</span>
							<p className="font-semibold text-black/80 whitespace-pre-wrap">{deal.additionalNotes}</p>
						</div>
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
	const isReadOnly = !isCommunity

	const [summary, setSummary] = useState(report?.summary || "")
	const [guestCount, setGuestCount] = useState(report?.guestCount || "")
	const [videoLink, setVideoLink] = useState(report?.videoLinks?.[0] || "")
	const [socialLink, setSocialLink] = useState(report?.socialLinks?.[0] || "")
	const [saving, setSaving] = useState(false)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (saving || isReadOnly) return
		setSaving(true)
		try {
			const payload = {
				projectName: deal.projectName,
				eventDate: deal.startDate ? deal.startDate.slice(0, 10) : "",
				venue: deal.venue,
				guestCount: guestCount.trim() || null,
				summary: summary.trim() || null,
				videoLinks: videoLink.trim() ? [videoLink.trim()] : [],
				socialLinks: socialLink.trim() ? [socialLink.trim()] : [],
			}
			const result = await submitBrandCommunityDealReport(interestId, payload, "COMMUNITY")
			toast.success("Deliverables report submitted successfully!")
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
			<div className="bg-white rounded-[24px] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
				<div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-black shrink-0 bg-neutral-50">
					<div>
						<h2 className="text-base sm:text-lg font-black text-black">
							{report ? "Deliverables Report" : "Submit Deliverables Report"}
						</h2>
						<p className="text-xs font-semibold text-black/50">
							{deal.projectName} · {deal.collaborationType}
						</p>
					</div>
					<button onClick={onClose} className="text-2xl font-black text-black/40 hover:text-black leading-none cursor-pointer" aria-label="Close">
						×
					</button>
				</div>

				<form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3 text-xs">
					<Field label="Summary & Execution Highlights">
						<textarea
							value={summary}
							onChange={(e) => setSummary(e.target.value)}
							rows={3}
							readOnly={isReadOnly}
							placeholder="Briefly describe how the deliverables were executed..."
							className={inputClass}
						/>
					</Field>

					<Field label="Audience Turnout / Reach">
						<input
							type="text"
							value={guestCount}
							onChange={(e) => setGuestCount(e.target.value)}
							readOnly={isReadOnly}
							placeholder="e.g. 150 attendees / 5000 impressions"
							className={inputClass}
						/>
					</Field>

					<Field label="Video Link (Optional)">
						<input
							type="url"
							value={videoLink}
							onChange={(e) => setVideoLink(e.target.value)}
							readOnly={isReadOnly}
							placeholder="https://..."
							className={inputClass}
						/>
					</Field>

					<Field label="Social Media Link / Proof (Optional)">
						<input
							type="url"
							value={socialLink}
							onChange={(e) => setSocialLink(e.target.value)}
							readOnly={isReadOnly}
							placeholder="https://instagram.com/..."
							className={inputClass}
						/>
					</Field>

					<div className="px-1 pt-3 border-t-[2.5px] border-black/10 flex items-center justify-end gap-3 shrink-0">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
						>
							{isReadOnly ? "Close" : "Cancel"}
						</button>
						{!isReadOnly && (
							<button
								type="submit"
								disabled={saving}
								className="px-5 py-2 rounded-xl bg-[#EE2C2C] hover:bg-[#d42525] text-white font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer disabled:opacity-50"
							>
								{saving ? "Submitting…" : "Submit Report"}
							</button>
						)}
					</div>
				</form>
			</div>
		</div>
	)
}
