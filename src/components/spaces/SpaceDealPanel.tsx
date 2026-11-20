"use client"

import { useState, useEffect } from "react"
import clsx from "clsx"
import confetti from "canvas-confetti"
import { toast } from "sonner"
import {
	type SpaceDeal,
	type SpaceDealPayload,
	type SpaceDealStatus,
	type SpaceChatThread,
	type SpaceChatRole,
	type SpaceDealReport,
	type SpaceDealReportPayload,
	type BrandHubInterestType,
	isSpaceReportApproved,
	createSpaceDeal,
	updateSpaceDeal,
	approveSpaceDeal,
	requestSpaceDealChanges,
	getSpaceDeal,
	getSpaceDealReport,
	upsertSpaceDealReport,
	getSpaceDealReportPdfUrl,
} from "@/lib/api"
import { uploadSpaceDealReportImage } from "@/lib/uploadMedia"
import { PdfViewerModal } from "@/components/ui/PdfViewerModal"
import { ImageLightbox } from "@/components/ui/ImageLightbox"
import { useSpaceStore } from "@/store/spaceStore"

export const BRAND_HUB_CATEGORIES: { value: BrandHubInterestType; label: string }[] = [
	{ value: "NAMING_RIGHTS", label: "Naming Rights" },
	{ value: "PHYSICAL_BRANDING", label: "Physical Branding" },
	{ value: "SAMPLING_DEMO", label: "Sampling & Demos" },
	{ value: "POPUPS_EXPERIENCES", label: "Pop-ups & Experiences" },
]

export const BRAND_HUB_CATEGORY_LABELS: Record<BrandHubInterestType, string> = {
	NAMING_RIGHTS: "Naming Rights",
	PHYSICAL_BRANDING: "Physical Branding",
	SAMPLING_DEMO: "Sampling & Demos",
	POPUPS_EXPERIENCES: "Pop-ups & Experiences",
}

const STATUS_LABEL: Record<SpaceDealStatus, string> = {
	PENDING_APPROVAL: "Pending Approval",
	CHANGES_REQUESTED: "Changes Requested",
	APPROVED: "Locked",
}

const STATUS_COLOR: Record<SpaceDealStatus, string> = {
	PENDING_APPROVAL: "bg-[#FFC940] text-black",
	CHANGES_REQUESTED: "bg-[#EE2C2C] text-white",
	APPROVED: "bg-black text-white",
}

function formatAmount(amount: string | number | null | undefined) {
	if (!amount) return "₹0"
	return `₹${Number(amount || 0).toLocaleString("en-IN")}`
}

function getTodayDateString(): string {
	const now = new Date()
	const year = now.getFullYear()
	const month = String(now.getMonth() + 1).padStart(2, "0")
	const day = String(now.getDate()).padStart(2, "0")
	return `${year}-${month}-${day}`
}

function Field({
	label,
	required,
	hint,
	children,
}: {
	label: string
	required?: boolean
	hint?: string
	children: React.ReactNode
}) {
	return (
		<div className="flex flex-col gap-1">
			<div className="flex items-center justify-between">
				<label className="text-xs font-black uppercase tracking-wider text-black">
					{label} {required && <span className="text-[#EE2C2C]">*</span>}
				</label>
				{hint && <span className="text-[10px] font-semibold text-black/40">{hint}</span>}
			</div>
			{children}
		</div>
	)
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
	if (!value) return null
	return (
		<div className="flex flex-col gap-0.5 border-b border-black/10 pb-2">
			<span className="text-[10px] font-black uppercase tracking-wider text-black/40">{label}</span>
			<span className="text-xs sm:text-sm font-semibold text-black break-words leading-relaxed whitespace-pre-wrap">
				{value}
			</span>
		</div>
	)
}

const inputClass =
	"w-full px-3.5 py-2.5 rounded-xl border-2 border-black font-semibold text-xs sm:text-sm text-black placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-[#EE2C2C] transition-all shadow-xs"

// ─── Pinned Deal Banner ────────────────────────────────────────────────────────

export function SpaceDealBanner({
	deal,
	role,
	onLock,
	onEdit,
	onView,
	onReport,
	hasReport,
	report,
}: {
	deal: SpaceDeal | null
	role: SpaceChatRole
	onLock?: () => void
	onEdit?: () => void
	onView: () => void
	onReport?: () => void
	hasReport?: boolean
	report?: SpaceDealReport | null
}) {
	const isSpace = role === "SPACE"
	const isClosed = isSpaceReportApproved(report)

	if (!deal) {
		if (!isSpace) {
			return (
				<div className="px-4 sm:px-5 py-2.5 sm:py-3 border-b-[3px] border-black bg-[#FFFBEB] flex items-center justify-between gap-3 shrink-0">
					<div className="flex items-center gap-2">
						<span className="size-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
						<p className="text-xs font-bold text-black/60">
							Awaiting the hub partner to submit the agreed deal terms.
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
						Once terms are agreed, submit the final details here.
					</p>
				</div>
				<button
					type="button"
					onClick={onLock}
					className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FFC940] hover:bg-[#ffbe1a] text-black font-black text-xs border-[2.5px] border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer select-none"
				>
					<svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
						<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
						<path d="M7 11V7a5 5 0 0 1 10 0v4" />
					</svg>
					<span>Lock the Deal</span>
				</button>
			</div>
		)
	}

	const categoryLabel = deal.collaborationType
		? BRAND_HUB_CATEGORY_LABELS[deal.collaborationType as BrandHubInterestType] || deal.collaborationType
		: null

	return (
		<div className="px-3 sm:px-5 py-2.5 sm:py-3 border-b-[3px] border-black bg-neutral-50 flex items-center justify-between gap-2 sm:gap-3 shrink-0 min-w-0">
			<div className="min-w-0 flex-1 flex items-center gap-2 overflow-hidden">
				<span
					className={clsx(
						"px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] inline-flex items-center gap-1.5",
						isClosed ? "bg-black text-white" : STATUS_COLOR[deal.status]
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
						STATUS_LABEL[deal.status]
					)}
				</span>
				<p className="text-xs font-black text-black truncate min-w-0">
					{deal.projectName} {categoryLabel ? `· ${categoryLabel}` : `· ${formatAmount(deal.sponsorshipAmount)}`}
				</p>
			</div>
			<div className="flex items-center gap-2 shrink-0">
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
				{isSpace && deal.status !== "APPROVED" && (
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
							isSpace && (
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

// ─── Space Deal Form Modal (Lock/Edit Deal) ───────────────────────────────────

export function SpaceDealFormModal({
	interestId,
	thread,
	deal,
	role,
	hubName,
	onClose,
	onSaved,
}: {
	interestId: string
	thread?: SpaceChatThread | null
	deal: SpaceDeal | null
	role?: SpaceChatRole
	hubName?: string
	onClose: () => void
	onSaved: (deal: SpaceDeal) => void
}) {
	const spaceProfile = useSpaceStore((s) => s.profile)

	const initialCategory: BrandHubInterestType =
		(deal?.collaborationType as BrandHubInterestType) ||
		(thread?.interestType as BrandHubInterestType) ||
		"NAMING_RIGHTS"

	const [collaborationType, setCollaborationType] = useState<BrandHubInterestType>(initialCategory)

	const existingData = (deal?.dealData as any) || {}

	// Determine autofilled Hub Name
	const resolvedHubName =
		deal?.projectName ||
		hubName ||
		(thread as any)?.spaceName ||
		(thread as any)?.spaceCommunityProfile?.name ||
		(thread as any)?.space?.name ||
		spaceProfile?.businessName ||
		(role !== "SPACE" ? (thread as any)?.counterpartName : "") ||
		""

	// Common Fields
	const [projectName, setProjectName] = useState(resolvedHubName)

	useEffect(() => {
		if (!projectName) {
			const autoName =
				deal?.projectName ||
				hubName ||
				(thread as any)?.spaceName ||
				(thread as any)?.spaceCommunityProfile?.name ||
				(thread as any)?.space?.name ||
				spaceProfile?.businessName ||
				(role !== "SPACE" ? (thread as any)?.counterpartName : "") ||
				""
			if (autoName) setProjectName(autoName)
		}
	}, [deal?.projectName, hubName, thread, spaceProfile?.businessName, role, projectName])

	const [startDate, setStartDate] = useState(deal?.startDate ? deal.startDate.slice(0, 10) : "")
	const [endDate, setEndDate] = useState(deal?.endDate ? deal.endDate.slice(0, 10) : "")
	const [deliverables, setDeliverables] = useState(deal?.deliverables || "")

	// Category Specific:
	// Naming Rights: Project Cost
	// Physical Branding: Branding Inventory, Project Cost
	// Sampling & Demos: Cities, Sampling Elements, Sampling Cost
	// Pop-ups & Experiences: Cities, Sampling Elements, Sampling Cost
	const [projectCost, setProjectCost] = useState(
		deal?.sponsorshipAmount
			? String(deal.sponsorshipAmount)
			: existingData.projectCost
				? String(existingData.projectCost)
				: ""
	)
	const [brandingInventory, setBrandingInventory] = useState(
		existingData.brandingInventory || deal?.venue || ""
	)
	const [cities, setCities] = useState(existingData.cities || deal?.venue || "")
	const [samplingElements, setSamplingElements] = useState(
		existingData.samplingElements || deal?.barterElements || ""
	)
	const [samplingCost, setSamplingCost] = useState(
		deal?.sponsorshipAmount
			? String(deal.sponsorshipAmount)
			: existingData.samplingCost
				? String(existingData.samplingCost)
				: ""
	)

	const [saving, setSaving] = useState(false)

	const todayStr = getTodayDateString()

	// Validation per Category
	let isValid = false
	if (collaborationType === "NAMING_RIGHTS") {
		isValid = Boolean(
			projectName.trim() &&
			startDate &&
			endDate &&
			projectCost.trim() &&
			Number(projectCost) >= 0 &&
			deliverables.trim()
		)
	} else if (collaborationType === "PHYSICAL_BRANDING") {
		isValid = Boolean(
			projectName.trim() &&
			startDate &&
			endDate &&
			brandingInventory.trim() &&
			projectCost.trim() &&
			Number(projectCost) >= 0 &&
			deliverables.trim()
		)
	} else if (collaborationType === "SAMPLING_DEMO" || collaborationType === "POPUPS_EXPERIENCES") {
		isValid = Boolean(
			projectName.trim() &&
			startDate &&
			endDate &&
			cities.trim() &&
			samplingElements.trim() &&
			samplingCost.trim() &&
			Number(samplingCost) >= 0 &&
			deliverables.trim()
		)
	}

	function getMissingFieldLabels(): string[] {
		const missing: string[] = []
		if (!projectName.trim()) missing.push("Hub Name")
		if (!startDate) missing.push("Start Date")
		if (!endDate) missing.push("End Date")

		if (collaborationType === "NAMING_RIGHTS") {
			if (!projectCost.trim() || Number(projectCost) < 0) missing.push("Project Cost")
		} else if (collaborationType === "PHYSICAL_BRANDING") {
			if (!brandingInventory.trim()) missing.push("Branding Inventory")
			if (!projectCost.trim() || Number(projectCost) < 0) missing.push("Project Cost")
		} else if (collaborationType === "SAMPLING_DEMO" || collaborationType === "POPUPS_EXPERIENCES") {
			if (!cities.trim()) missing.push("Cities")
			if (!samplingElements.trim()) missing.push("Sampling Elements")
			if (!samplingCost.trim() || Number(samplingCost) < 0) missing.push("Sampling Cost")
		}

		if (!deliverables.trim()) missing.push("Deliverables")
		return missing
	}

	async function handleSubmit(e?: React.FormEvent) {
		if (e) e.preventDefault()
		if (!isValid) {
			const missing = getMissingFieldLabels()
			toast.error(missing.length ? `Please fill in: ${missing.join(", ")}.` : "Please fill in all required fields.")
			return
		}
		setSaving(true)
		try {
			let costAmount = 0
			let venueValue = ""
			let barterElementsValue: string | null = null

			if (collaborationType === "NAMING_RIGHTS") {
				costAmount = Number(projectCost) || 0
				venueValue = "Naming Rights"
			} else if (collaborationType === "PHYSICAL_BRANDING") {
				costAmount = Number(projectCost) || 0
				venueValue = brandingInventory.trim()
			} else if (collaborationType === "SAMPLING_DEMO" || collaborationType === "POPUPS_EXPERIENCES") {
				costAmount = Number(samplingCost) || 0
				venueValue = cities.trim()
				barterElementsValue = samplingElements.trim()
			}

			const payload: SpaceDealPayload = {
				collaborationType,
				projectName: projectName.trim(),
				startDate: new Date(startDate).toISOString(),
				endDate: endDate ? new Date(endDate).toISOString() : undefined,
				venue: venueValue,
				sponsorshipAmount: costAmount,
				barterElements: barterElementsValue || undefined,
				deliverables: deliverables.trim(),
				dealData: {
					brandingInventory: collaborationType === "PHYSICAL_BRANDING" ? brandingInventory.trim() : undefined,
					cities: (collaborationType === "SAMPLING_DEMO" || collaborationType === "POPUPS_EXPERIENCES") ? cities.trim() : undefined,
					samplingElements: (collaborationType === "SAMPLING_DEMO" || collaborationType === "POPUPS_EXPERIENCES") ? samplingElements.trim() : undefined,
					projectCost: (collaborationType === "NAMING_RIGHTS" || collaborationType === "PHYSICAL_BRANDING") ? costAmount : undefined,
					samplingCost: (collaborationType === "SAMPLING_DEMO" || collaborationType === "POPUPS_EXPERIENCES") ? costAmount : undefined,
				},
			}

			const saved = deal
				? await updateSpaceDeal(interestId, payload, role)
				: await createSpaceDeal(interestId, payload, role)

			toast.success(deal ? "Deal updated successfully." : "Deal locked — waiting for brand approval.")
			onSaved(saved)
			onClose()
		} catch (err: any) {
			const serverMsg = err?.response?.data?.message
			const msg = Array.isArray(serverMsg) ? serverMsg.join(", ") : (serverMsg || "Failed to save the deal.")
			toast.error(msg)
		} finally {
			setSaving(false)
		}
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose()
			}}
		>
			<div className="bg-white rounded-[24px] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg flex flex-col max-h-[90vh]">
				{/* Modal Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-black shrink-0 bg-neutral-50 rounded-t-[21px]">
					<div>
						<p className="text-lg font-black text-black">
							{deal ? "Edit Hub Deal" : "Lock Hub Deal"}
						</p>
						<p className="text-xs font-semibold text-black/50">
							Define agreed deliverables and terms for brand review.
						</p>
					</div>
					<button
						onClick={onClose}
						className="text-2xl font-black text-black/40 hover:text-black transition-colors"
						aria-label="Close"
					>
						×
					</button>
				</div>

				<form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
					{/* Category Selector Tabs */}
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-black uppercase tracking-wider text-black">
							Collaboration Type <span className="text-[#EE2C2C]">*</span>
						</label>
						<div className="grid grid-cols-2 gap-2">
							{BRAND_HUB_CATEGORIES.map((cat) => {
								const isSelected = collaborationType === cat.value
								return (
									<button
										key={cat.value}
										type="button"
										onClick={() => setCollaborationType(cat.value)}
										className={clsx(
											"py-2 px-2.5 border-2 border-black rounded-xl text-xs font-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none cursor-pointer text-center truncate",
											isSelected
												? "bg-[#EE2C2C] text-white shadow-none translate-x-[2px] translate-y-[2px]"
												: "bg-white hover:bg-neutral-100 text-black hover:translate-x-[1px] hover:translate-y-[1px]"
										)}
									>
										{cat.label}
									</button>
								)
							})}
						</div>
					</div>

					{/* Common: Hub Name */}
					<Field label="Hub Name" required>
						<input
							value={projectName}
							onChange={(e) => setProjectName(e.target.value)}
							className={inputClass}
							placeholder="e.g. Indiranagar Creative Hub"
							required
						/>
					</Field>

					{/* Common: Start Date and End Date */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<Field label="Start Date" required>
							<input
								type="date"
								min={todayStr}
								value={startDate}
								onChange={(e) => {
									setStartDate(e.target.value)
									if (endDate && e.target.value > endDate) {
										setEndDate("")
									}
								}}
								className={inputClass}
								required
							/>
						</Field>
						<Field label="End Date" required>
							<input
								type="date"
								min={startDate || todayStr}
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
								className={inputClass}
								required
							/>
						</Field>
					</div>

					{/* 1. Naming Rights Specific */}
					{collaborationType === "NAMING_RIGHTS" && (
						<Field label="Project Cost (₹)" required hint="Agreed amount in INR">
							<input
								type="number"
								min="0"
								value={projectCost}
								onChange={(e) => setProjectCost(e.target.value)}
								className={inputClass}
								placeholder="e.g. 150000"
								required
							/>
						</Field>
					)}

					{/* 2. Physical Branding Specific */}
					{collaborationType === "PHYSICAL_BRANDING" && (
						<>
							<Field label="Branding Inventory" required hint="e.g. Wall vinyls, entrance arch, standees">
								<input
									value={brandingInventory}
									onChange={(e) => setBrandingInventory(e.target.value)}
									className={inputClass}
									placeholder="e.g. Main entrance banner, café counter standees, meeting room wall"
									required
								/>
							</Field>
							<Field label="Project Cost (₹)" required hint="Agreed amount in INR">
								<input
									type="number"
									min="0"
									value={projectCost}
									onChange={(e) => setProjectCost(e.target.value)}
									className={inputClass}
									placeholder="e.g. 50000"
									required
								/>
							</Field>
						</>
					)}

					{/* 3 & 4. Sampling & Demos OR Pop-ups & Experiences Specific */}
					{(collaborationType === "SAMPLING_DEMO" || collaborationType === "POPUPS_EXPERIENCES") && (
						<>
							<Field label="Cities" required hint="e.g. Bengaluru, Mumbai, Delhi">
								<input
									value={cities}
									onChange={(e) => setCities(e.target.value)}
									className={inputClass}
									placeholder="e.g. Bengaluru, Mumbai"
									required
								/>
							</Field>
							<Field label="Sampling Elements" required hint="e.g. Samples, kiosk setup, staff">
								<textarea
									rows={2}
									value={samplingElements}
									onChange={(e) => setSamplingElements(e.target.value)}
									className={`${inputClass} resize-none`}
									placeholder="e.g. 500 beverage cans, branded kiosk, 2 promoters"
									required
								/>
							</Field>
							<Field label="Sampling Cost (₹)" required hint="Agreed amount in INR">
								<input
									type="number"
									min="0"
									value={samplingCost}
									onChange={(e) => setSamplingCost(e.target.value)}
									className={inputClass}
									placeholder="e.g. 35000"
									required
								/>
							</Field>
						</>
					)}

					{/* Common: Deliverables */}
					<Field label="Deliverables" required hint="Detailed deliverables agreed with brand">
						<textarea
							rows={3}
							value={deliverables}
							onChange={(e) => setDeliverables(e.target.value)}
							className={`${inputClass} resize-none`}
							placeholder="Specify each agreed deliverable on a new line..."
							required
						/>
					</Field>

					{/* Footer Actions */}
					<div className="flex items-center justify-end gap-3 pt-3 border-t-[2.5px] border-black/10 shrink-0">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 rounded-xl text-black/60 hover:text-black font-extrabold text-xs transition-colors cursor-pointer"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={saving || !isValid}
							className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-[#EE2C2C] hover:bg-[#d42525] text-white font-black text-xs border-[2.5px] border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer select-none disabled:opacity-50"
						>
							<svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
								<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
								<path d="M7 11V7a5 5 0 0 1 10 0v4" />
							</svg>
							<span>{saving ? "Saving…" : deal ? "Save Changes" : "Submit & Lock Deal"}</span>
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}

// ─── Space Deal Details Modal (View/Approve/Request Changes) ───────────────────

export function SpaceDealDetailsModal({
	interestId,
	deal,
	role,
	onClose,
	onUpdated,
}: {
	interestId: string
	deal: SpaceDeal
	role: SpaceChatRole
	onClose: () => void
	onUpdated: (deal: SpaceDeal) => void
}) {
	const [requestingChanges, setRequestingChanges] = useState(false)
	const [note, setNote] = useState("")
	const [busy, setBusy] = useState(false)

	// Counterpart (Brand) can approve / request changes.
	const canApproveOrRequestChanges = role !== "SPACE"
	const dealData = (deal.dealData as any) || {}
	const category = deal.collaborationType as BrandHubInterestType | undefined

	async function handleApprove() {
		setBusy(true)
		try {
			const updated = await approveSpaceDeal(interestId, role)

			toast.success("🎉 Deal approved and locked!")

			// Trigger confetti
			const canvas = document.getElementById("space-chat-confetti-canvas") as HTMLCanvasElement | null
			if (canvas) {
				const myConfetti = confetti.create(canvas, {
					resize: true,
					useWorker: true,
				})
				myConfetti({
					particleCount: 150,
					spread: 80,
					origin: { y: 0.6 },
				})
			}

			onUpdated(updated)
			onClose()
		} catch {
			toast.error("Failed to approve the deal.")
		} finally {
			setBusy(false)
		}
	}

	async function handleRequestChanges() {
		if (!note.trim()) {
			toast.error("Please provide a note explaining what changes are needed.")
			return
		}
		setBusy(true)
		try {
			const updated = await requestSpaceDealChanges(interestId, { note: note.trim() }, role)

			toast.success("Requested changes to the deal.")
			onUpdated(updated)
			onClose()
		} catch {
			toast.error("Failed to request changes.")
		} finally {
			setBusy(false)
		}
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose()
			}}
		>
			<div className="bg-white rounded-[24px] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg flex flex-col max-h-[90vh]">
				{/* Modal Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-black shrink-0 bg-neutral-50 rounded-t-[21px]">
					<div className="flex items-center gap-2">
						<p className="text-lg font-black text-black">Hub Deal Details</p>
						<span
							className={clsx(
								"px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border-2 border-black",
								STATUS_COLOR[deal.status]
							)}
						>
							{STATUS_LABEL[deal.status]}
						</span>
					</div>
					<button
						onClick={onClose}
						className="text-2xl font-black text-black/40 hover:text-black transition-colors"
						aria-label="Close"
					>
						×
					</button>
				</div>

				<div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3.5 text-sm">
					{deal.status === "CHANGES_REQUESTED" && deal.changeRequestNote && (
						<div className="p-3.5 bg-red-50 border-2 border-[#EE2C2C] rounded-2xl flex flex-col gap-1 shadow-xs">
							<div className="flex items-center gap-2">
								<span className="text-xs font-black uppercase tracking-wider text-[#EE2C2C]">
									Changes Requested
								</span>
							</div>
							<p className="text-xs font-semibold text-black/80 whitespace-pre-wrap leading-relaxed">
								{deal.changeRequestNote}
							</p>
						</div>
					)}

					{/* Collaboration Category Pill */}
					{category && (
						<div className="p-3 bg-neutral-50 rounded-xl border-2 border-black flex items-center justify-between">
							<span className="font-bold text-black/60 uppercase text-xs">Collaboration Type</span>
							<span className="font-black text-sm text-[#EE2C2C]">
								{BRAND_HUB_CATEGORY_LABELS[category] || category}
							</span>
						</div>
					)}

					<Row label="Hub Name" value={deal.projectName} />

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<Row
							label="Start Date"
							value={deal.startDate ? new Date(deal.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null}
						/>
						<Row
							label="End Date"
							value={deal.endDate ? new Date(deal.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null}
						/>
					</div>

					{/* Category specific rows */}
					{category === "NAMING_RIGHTS" && (
						<Row label="Project Cost" value={formatAmount(deal.sponsorshipAmount || dealData.projectCost)} />
					)}

					{category === "PHYSICAL_BRANDING" && (
						<>
							<Row label="Branding Inventory" value={dealData.brandingInventory || deal.venue} />
							<Row label="Project Cost" value={formatAmount(deal.sponsorshipAmount || dealData.projectCost)} />
						</>
					)}

					{(category === "SAMPLING_DEMO" || category === "POPUPS_EXPERIENCES") && (
						<>
							<Row label="Cities" value={dealData.cities || deal.venue} />
							<Row label="Sampling Elements" value={dealData.samplingElements || deal.barterElements} />
							<Row label="Sampling Cost" value={formatAmount(deal.sponsorshipAmount || dealData.samplingCost)} />
						</>
					)}

					{/* Fallback for legacy deals with no category */}
					{!category && (
						<>
							{deal.venue && <Row label="Venue / Location" value={deal.venue} />}
							{deal.sponsorshipAmount ? <Row label="Cost Amount" value={formatAmount(deal.sponsorshipAmount)} /> : null}
							{deal.barterElements && <Row label="Barter Elements" value={deal.barterElements} />}
						</>
					)}

					<Row label="Deliverables" value={deal.deliverables} />
					{deal.otherTerms && <Row label="Other Information / Remarks" value={deal.otherTerms} />}

					{/* Changes Request Input box */}
					{requestingChanges && (
						<div className="mt-2 p-3.5 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-col gap-2 shadow-xs">
							<p className="text-xs font-black text-black">What changes are needed?</p>
							<textarea
								rows={3}
								value={note}
								onChange={(e) => setNote(e.target.value)}
								className={`${inputClass} resize-none bg-white`}
								placeholder="e.g. Please update the start date and clarify the branding inventory deliverables."
								autoFocus
							/>
							<div className="flex items-center justify-end gap-2">
								<button
									type="button"
									onClick={() => setRequestingChanges(false)}
									className="px-3 py-1.5 text-xs font-bold text-black/60 hover:text-black cursor-pointer"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={handleRequestChanges}
									disabled={busy || !note.trim()}
									className="px-3.5 py-1.5 rounded-xl bg-[#EE2C2C] text-white font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-50 cursor-pointer"
								>
									{busy ? "Sending…" : "Send Request"}
								</button>
							</div>
						</div>
					)}
				</div>

				{/* Modal Footer */}
				<div className="flex items-center justify-between gap-3 px-6 py-4 border-t-[3px] border-black shrink-0 bg-neutral-50 rounded-b-[21px]">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 rounded-xl text-black/60 hover:text-black font-extrabold text-xs transition-colors cursor-pointer"
					>
						Close
					</button>

					{canApproveOrRequestChanges && deal.status !== "APPROVED" && !requestingChanges && (
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => setRequestingChanges(true)}
								className="px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-100 text-black font-black text-xs border-[2.5px] border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer select-none"
							>
								Request Changes
							</button>
							<button
								type="button"
								onClick={handleApprove}
								disabled={busy}
								className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-black text-xs border-[2.5px] border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer select-none disabled:opacity-50"
							>
								<svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
									<polyline points="20 6 9 17 4 12" />
								</svg>
								<span>{busy ? "Approving…" : "Approve Deal"}</span>
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

// ─── Space Deal Report Modal (Deliverables Report) ────────────────────────────

export function SpaceDealReportModal({
	interestId,
	role,
	deal: initialDeal,
	report: initialReport,
	onClose,
	onReportUpdated,
}: {
	interestId: string
	role: SpaceChatRole
	deal?: SpaceDeal | null
	report?: SpaceDealReport | null
	onClose: () => void
	onReportUpdated?: (report: SpaceDealReport) => void
}) {
	const [loading, setLoading] = useState(true)
	const [report, setReport] = useState<SpaceDealReport | null>(initialReport || null)
	const [deal, setDeal] = useState<SpaceDeal | null>(initialDeal || null)

	// Mode State
	const [isEditing, setIsEditing] = useState(false)

	// Common Report Fields
	const [projectName, setProjectName] = useState("")
	const [startDate, setStartDate] = useState("")
	const [endDate, setEndDate] = useState("")

	// Naming Rights: Deliverables Checklist
	const [deliverablesList, setDeliverablesList] = useState<{ text: string; checked: boolean }[]>([])

	// Proof Photos (Up to 5)
	const [images, setImages] = useState<{ key?: string; url: string; file?: File }[]>([])

	// Video Links & Social Media Links
	const [videoLinks, setVideoLinks] = useState<string[]>([])
	const [socialLinks, setSocialLinks] = useState<string[]>([])

	// Sampling & Demos specific fields:
	const [totalSamplesDistributed, setTotalSamplesDistributed] = useState("")
	const [membersData, setMembersData] = useState("")

	// Reviewer Actions & Status
	const [reportStatus, setReportStatus] = useState<"PENDING" | "APPROVED" | "REVISION_REQUESTED">("PENDING")
	const [revisionNote, setRevisionNote] = useState("")
	const [downloadingPdf, setDownloadingPdf] = useState(false)
	const [pdfUrl, setPdfUrl] = useState<string | null>(null)
	const [viewingImage, setViewingImage] = useState<string | null>(null)
	const [showRevisionInput, setShowRevisionInput] = useState(false)

	const [saving, setSaving] = useState(false)
	const [uploading, setUploading] = useState(false)

	const isSpace = role === "SPACE"
	const isBrand = role === "BRAND"
	const isApproved = isSpaceReportApproved(report)

	const category: BrandHubInterestType =
		(deal?.collaborationType as BrandHubInterestType) || "NAMING_RIGHTS"

	function formatDateForInput(isoString?: string | null): string {
		if (!isoString) return ""
		try {
			const d = new Date(isoString)
			if (isNaN(d.getTime())) return isoString.slice(0, 10)
			return isoString.slice(0, 10)
		} catch {
			return isoString
		}
	}

	function parseDeliverables(raw?: string | null): { text: string; checked: boolean }[] {
		if (!raw) return []
		return raw
			.split(/\r?\n/)
			.map((s) => s.replace(/^[-*•\d.]\s*/, "").trim())
			.filter(Boolean)
			.map((text) => ({ text, checked: false }))
	}

	useEffect(() => {
		const targetDealId = initialDeal?.id
		Promise.all([
			initialReport
				? Promise.resolve(initialReport)
				: getSpaceDealReport(interestId, role, targetDealId).catch(() => null),
			initialDeal
				? Promise.resolve(initialDeal)
				: getSpaceDeal(interestId).catch(() => null),
		])
			.then(([r, d]) => {
				setDeal(d)
				setReport(r)

				const dDeliverables = parseDeliverables(d?.deliverables)
				const existingReportData = (r?.reportData as any) || {}

				if (r) {
					setIsEditing(false)
					let data: any = {}
					try {
						data = typeof r.summary === "string" ? JSON.parse(r.summary) : (r.summary || {})
					} catch {
						data = {}
					}

					setProjectName(data.projectName || r.projectName || existingReportData.projectName || d?.projectName || "")
					setStartDate(data.startDate || r.eventDate || existingReportData.startDate || formatDateForInput(d?.startDate) || "")
					setEndDate(data.endDate || r.endDate || existingReportData.endDate || formatDateForInput(d?.endDate) || "")

					// Checklist
					const rawList: { text: string; checked: boolean }[] =
						Array.isArray(data.deliverables) && data.deliverables.length > 0
							? data.deliverables
							: Array.isArray(r.deliverables) && r.deliverables.length > 0
								? r.deliverables
								: Array.isArray(existingReportData.deliverablesChecklist)
									? existingReportData.deliverablesChecklist
									: dDeliverables

					if (rawList.length === 0) {
						setDeliverablesList(dDeliverables)
					} else {
						const checkMap = new Map(rawList.map((item) => [item.text.trim().toLowerCase(), item.checked]))
						setDeliverablesList(
							dDeliverables.length > 0
								? dDeliverables.map((item) => ({
									text: item.text,
									checked: checkMap.get(item.text.trim().toLowerCase()) ?? false,
								}))
								: rawList
						)
					}

					// Video & Social Links
					setVideoLinks(data.videoLinks || r.videoLinks || existingReportData.videoLinks || [])
					setSocialLinks(data.socialLinks || r.socialLinks || existingReportData.socialLinks || [])

					// Sampling & Demos
					setTotalSamplesDistributed(
						data.totalSamplesDistributed ||
						existingReportData.totalSamplesDistributed ||
						r.guestCount ||
						""
					)
					setMembersData(
						data.membersData ||
						existingReportData.membersData ||
						(typeof r.summary === "string" && !r.summary.startsWith("{") ? r.summary : "") ||
						""
					)

					setReportStatus((r.status || data.status || "PENDING") as "PENDING" | "APPROVED" | "REVISION_REQUESTED")
					setRevisionNote(r.revisionNote || data.revisionNote || "")
					setImages((r.proofKeys || []).map((key, i) => ({ key, url: r.proofUrls?.[i] ?? key })))
				} else {
					setIsEditing(true)
					// Pre-populate from locked deal
					setProjectName(d?.projectName || "")
					setStartDate(formatDateForInput(d?.startDate) || "")
					setEndDate(formatDateForInput(d?.endDate) || "")
					setDeliverablesList(dDeliverables)
				}
			})
			.catch(() => {
				toast.error("Failed to load report data.")
			})
			.finally(() => setLoading(false))
	}, [interestId, role])

	async function handleDownloadPdf() {
		setDownloadingPdf(true)
		try {
			const url = await getSpaceDealReportPdfUrl(interestId, role, deal?.id || initialDeal?.id)
			setPdfUrl(url)
		} catch {
			toast.error("Failed to generate the report PDF.")
		} finally {
			setDownloadingPdf(false)
		}
	}

	async function handleAddImage(file: File) {
		if (!file.type.startsWith("image/")) {
			toast.error("Only image files are accepted.")
			return
		}
		if (images.length >= 5) {
			toast.error("Only up to 5 images are allowed.")
			return
		}
		setUploading(true)
		try {
			const key = await uploadSpaceDealReportImage(file, interestId)
			setImages((prev) => [...prev, { key, url: URL.createObjectURL(file) }])
			toast.success("Photo uploaded successfully!")
		} catch {
			toast.error("Failed to upload image.")
		} finally {
			setUploading(false)
		}
	}

	function removeImage(index: number) {
		setImages((prev) => prev.filter((_, i) => i !== index))
	}

	// Validation
	let isValid = Boolean(projectName.trim() && startDate && endDate)
	if (category === "SAMPLING_DEMO") {
		isValid = Boolean(isValid && totalSamplesDistributed.trim() && membersData.trim())
	}

	async function handleSubmit() {
		if (!isValid) {
			if (!projectName.trim() || !startDate || !endDate) {
				toast.error("Please fill in Hub Name, Start Date, and End Date.")
			} else if (category === "SAMPLING_DEMO" && (!totalSamplesDistributed.trim() || !membersData.trim())) {
				toast.error("Please provide Total Samples Distributed and Members Data.")
			} else {
				toast.error("Please fill in all required report fields.")
			}
			return
		}

		setSaving(true)
		try {
			const cleanVideoLinks = videoLinks.map((v) => v.trim()).filter(Boolean)
			const cleanSocialLinks = socialLinks.map((s) => s.trim()).filter(Boolean)
			const proofKeys = images.map((img) => img.key).filter((k): k is string => !!k)

			const reportDataPayload: any = {
				projectName: projectName.trim(),
				startDate,
				endDate,
				category,
				deliverablesChecklist: category === "NAMING_RIGHTS" ? deliverablesList : undefined,
				totalSamplesDistributed: category === "SAMPLING_DEMO" ? totalSamplesDistributed.trim() : undefined,
				membersData: category === "SAMPLING_DEMO" ? membersData.trim() : undefined,
				videoLinks: cleanVideoLinks,
				socialLinks: cleanSocialLinks,
				proofKeys,
			}

			const summaryData = JSON.stringify({
				projectName: projectName.trim(),
				startDate,
				endDate,
				category,
				deliverables: category === "NAMING_RIGHTS" ? deliverablesList : undefined,
				totalSamplesDistributed: category === "SAMPLING_DEMO" ? totalSamplesDistributed.trim() : undefined,
				membersData: category === "SAMPLING_DEMO" ? membersData.trim() : undefined,
				videoLinks: cleanVideoLinks,
				socialLinks: cleanSocialLinks,
				status: "PENDING",
				revisionNote: "",
			})

			const payload: SpaceDealReportPayload = {
				projectName: projectName.trim() || deal?.projectName,
				eventDate: startDate,
				endDate: endDate,
				venue: deal?.venue || "",
				deliverables: category === "NAMING_RIGHTS" ? deliverablesList : [],
				guestCount: category === "SAMPLING_DEMO" ? totalSamplesDistributed.trim() || undefined : undefined,
				summary: summaryData,
				reportData: reportDataPayload,
				videoLinks: cleanVideoLinks,
				socialLinks: cleanSocialLinks,
				proofKeys,
				status: "PENDING",
				revisionNote: "",
			}

			const saved = await upsertSpaceDealReport(interestId, payload, role)

			toast.success(report ? "Report resubmitted for brand review." : "Report submitted for brand review.")
			setReport(saved)
			setReportStatus("PENDING")
			setRevisionNote("")
			setIsEditing(false)
			onReportUpdated?.(saved)
			onClose()
		} catch {
			toast.error("Failed to save the report.")
		} finally {
			setSaving(false)
		}
	}

	async function handleReviewerAction(status: "APPROVED" | "REVISION_REQUESTED") {
		setSaving(true)
		try {
			const note = status === "REVISION_REQUESTED" ? revisionNote.trim() : ""
			const cleanVideoLinks = videoLinks.map((v) => v.trim()).filter(Boolean)
			const cleanSocialLinks = socialLinks.map((s) => s.trim()).filter(Boolean)
			const proofKeys = images.map((img) => img.key).filter((k): k is string => !!k)

			const reportDataPayload: any = {
				projectName: projectName.trim(),
				startDate,
				endDate,
				category,
				deliverablesChecklist: category === "NAMING_RIGHTS" ? deliverablesList : undefined,
				totalSamplesDistributed: category === "SAMPLING_DEMO" ? totalSamplesDistributed.trim() : undefined,
				membersData: category === "SAMPLING_DEMO" ? membersData.trim() : undefined,
				videoLinks: cleanVideoLinks,
				socialLinks: cleanSocialLinks,
				proofKeys,
			}

			const summaryData = JSON.stringify({
				projectName: projectName.trim(),
				startDate,
				endDate,
				category,
				deliverables: category === "NAMING_RIGHTS" ? deliverablesList : undefined,
				totalSamplesDistributed: category === "SAMPLING_DEMO" ? totalSamplesDistributed.trim() : undefined,
				membersData: category === "SAMPLING_DEMO" ? membersData.trim() : undefined,
				videoLinks: cleanVideoLinks,
				socialLinks: cleanSocialLinks,
				status,
				revisionNote: note,
			})

			const payload: SpaceDealReportPayload = {
				projectName: projectName.trim() || deal?.projectName,
				eventDate: startDate,
				endDate: endDate,
				venue: deal?.venue || "",
				deliverables: category === "NAMING_RIGHTS" ? deliverablesList : [],
				guestCount: category === "SAMPLING_DEMO" ? totalSamplesDistributed.trim() || undefined : undefined,
				summary: summaryData,
				reportData: reportDataPayload,
				videoLinks: cleanVideoLinks,
				socialLinks: cleanSocialLinks,
				proofKeys,
				status,
				revisionNote: note,
			}

			const saved = await upsertSpaceDealReport(interestId, payload, role)

			if (status === "APPROVED") {
				// Trigger confetti
				const canvas = document.getElementById("space-chat-confetti-canvas") as HTMLCanvasElement | null
				if (canvas) {
					const myConfetti = confetti.create(canvas, {
						resize: true,
						useWorker: true,
					})
					myConfetti({
						particleCount: 150,
						spread: 80,
						origin: { y: 0.6 },
					})
				}
			}

			toast.success(status === "APPROVED" ? "🎉 Report approved! Deal is officially closed." : "Revision request sent.")
			setReport(saved)
			setReportStatus(status)
			onReportUpdated?.(saved)
			onClose()
		} catch {
			toast.error("Failed to update report status.")
		} finally {
			setSaving(false)
		}
	}

	const STATUS_BADGES = {
		PENDING: { label: "Pending Review", color: "bg-amber-100 text-amber-900 border-amber-900" },
		APPROVED: { label: "Approved", color: "bg-emerald-100 text-emerald-900 border-emerald-900" },
		REVISION_REQUESTED: { label: "Revision Requested", color: "bg-rose-100 text-rose-900 border-rose-900" },
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose()
			}}
		>
			<div className="bg-white rounded-[24px] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg flex flex-col max-h-[90vh]">
				{/* Modal Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-black shrink-0 bg-neutral-50 rounded-t-[21px]">
					<div className="flex items-center gap-2.5">
						<div>
							<p className="text-lg font-black text-black">Deliverables Report</p>
							<p className="text-xs font-semibold text-black/50">
								{deal?.projectName} · {BRAND_HUB_CATEGORY_LABELS[category] || category}
							</p>
						</div>
						{report && (
							<span
								className={clsx(
									"px-2.5 py-0.5 border-2 rounded-full text-[10px] font-black uppercase tracking-wide",
									STATUS_BADGES[reportStatus]?.color
								)}
							>
								{STATUS_BADGES[reportStatus]?.label}
							</span>
						)}
					</div>
					<div className="flex items-center gap-3 shrink-0">
						{report && (
							<button
								type="button"
								onClick={handleDownloadPdf}
								disabled={downloadingPdf}
								className="text-[10px] font-black uppercase text-black/50 hover:text-black underline underline-offset-2"
							>
								{downloadingPdf ? "…" : "Download PDF"}
							</button>
						)}
						<button
							onClick={onClose}
							className="text-2xl font-black text-black/40 hover:text-black leading-none"
							aria-label="Close"
						>
							×
						</button>
					</div>
				</div>

				{loading ? (
					<div className="px-6 py-10 text-center text-sm font-semibold text-black/40">Loading…</div>
				) : !isSpace && !report ? (
					<div className="px-6 py-10 text-center text-sm font-semibold text-black/40">
						The hub partner hasn&apos;t submitted a deliverables report yet.
					</div>
				) : (
					<>
						<div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
							{/* Revision Note Banner */}
							{reportStatus === "REVISION_REQUESTED" && revisionNote && (
								<div className="bg-red-50 border-2 border-red-300 rounded-xl p-3 text-xs font-semibold text-red-800">
									<p className="font-bold text-red-900 mb-0.5">Revision Requested:</p>
									{revisionNote}
								</div>
							)}

							{/* Common: Hub Name */}
							<Field label="Hub Name" required>
								<input
									value={projectName}
									disabled={!isSpace || !isEditing}
									onChange={(e) => setProjectName(e.target.value)}
									className={inputClass}
									placeholder="Hub Name"
								/>
							</Field>

							{/* Common: Start Date & End Date */}
							<div className="grid grid-cols-2 gap-3">
								<Field label="Start Date" required>
									<input
										type="date"
										value={startDate}
										disabled={!isSpace || !isEditing}
										onChange={(e) => setStartDate(e.target.value)}
										className={inputClass}
									/>
								</Field>
								<Field label="End Date" required>
									<input
										type="date"
										value={endDate}
										min={startDate || undefined}
										disabled={!isSpace || !isEditing}
										onChange={(e) => setEndDate(e.target.value)}
										className={inputClass}
									/>
								</Field>
							</div>

							{/* 1. Naming Rights: Deliverables Checklist */}
							{category === "NAMING_RIGHTS" && deliverablesList.length > 0 && (
								<Field label="Deliverables Checklist" hint="Interactive checklist">
									<div className="flex flex-col gap-2 bg-neutral-50 p-3 rounded-xl border-[2.5px] border-black">
										{deliverablesList.map((item, idx) => (
											<label key={idx} className="flex items-center gap-2.5 cursor-pointer select-none">
												<input
													type="checkbox"
													checked={item.checked}
													disabled={!isSpace || !isEditing}
													onChange={(e) => {
														const updated = [...deliverablesList]
														updated[idx].checked = e.target.checked
														setDeliverablesList(updated)
													}}
													className="rounded border-[2px] border-black text-[#EE2C2C] focus:ring-[#EE2C2C] cursor-pointer"
												/>
												<span className="text-xs font-semibold text-black">{item.text}</span>
											</label>
										))}
									</div>
								</Field>
							)}

							{/* 3. Sampling & Demos: Total Samples Distributed & Members Data */}
							{category === "SAMPLING_DEMO" && (
								<>
									<Field label="Total Samples Distributed" required hint="e.g. 500 units">
										<input
											value={totalSamplesDistributed}
											disabled={!isSpace || !isEditing}
											onChange={(e) => setTotalSamplesDistributed(e.target.value)}
											className={inputClass}
											placeholder="e.g. 500 cans"
											required
										/>
									</Field>
									<Field label="Members Data" required hint="Demographics, feedback, or participant overview">
										<textarea
											rows={3}
											value={membersData}
											disabled={!isSpace || !isEditing}
											onChange={(e) => setMembersData(e.target.value)}
											className={`${inputClass} resize-none`}
											placeholder="e.g. 450 tech workers and designers engaged, 85% positive product feedback"
											required
										/>
									</Field>
								</>
							)}

							{/* Proof Photos: Common to all 4 categories */}
							<Field label="Proof Photos" hint="Up to 5 photos">
								<div className="flex flex-wrap items-center gap-2">
									{images.map((img, i) => (
										<div key={i} className="relative size-16 rounded-lg border-[3px] border-black overflow-hidden shrink-0 bg-neutral-100">
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img
												src={img.url}
												alt="Proof"
												className="size-full object-cover cursor-zoom-in"
												onClick={() => setViewingImage(img.url)}
											/>
											{isSpace && isEditing && (
												<button
													type="button"
													onClick={() => removeImage(i)}
													aria-label="Remove image"
													className="absolute top-0.5 right-0.5 size-4 rounded-full bg-black/75 text-white text-[10px] flex items-center justify-center leading-none cursor-pointer"
												>
													×
												</button>
											)}
										</div>
									))}
									{isSpace && isEditing && images.length < 5 && (
										<label className="size-16 rounded-lg border-[3px] border-dashed border-black/30 flex items-center justify-center shrink-0 cursor-pointer hover:bg-black/5">
											<input
												type="file"
												accept="image/*"
												className="hidden"
												disabled={uploading}
												onChange={(e) => {
													const file = e.target.files?.[0]
													e.target.value = ""
													if (file) handleAddImage(file)
												}}
											/>
											<span className="text-[10px] font-black text-black/40">{uploading ? "…" : "+ Add"}</span>
										</label>
									)}
								</div>
							</Field>

							{/* Video Links: Naming Rights, Physical Branding, Pop-ups & Experiences */}
							{category !== "SAMPLING_DEMO" && (
								<Field label="Video Links" hint="Up to 5 URLs">
									<div className="flex flex-col gap-2">
										{videoLinks.map((link, idx) => (
											<div key={idx} className="flex items-center gap-2">
												<input
													value={link}
													disabled={!isSpace || !isEditing}
													onChange={(e) => {
														const updated = [...videoLinks]
														updated[idx] = e.target.value
														setVideoLinks(updated)
													}}
													placeholder="https://youtube.com/... or Google Drive"
													className={inputClass}
												/>
												{(!isEditing || !isSpace) && link.trim() && (
													<a
														href={link.startsWith("http") ? link : `https://${link}`}
														target="_blank"
														rel="noopener noreferrer"
														className="px-2.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 border-2 border-black text-black font-bold text-xs shrink-0 flex items-center justify-center"
														title="Open link"
													>
														↗
													</a>
												)}
												{isSpace && isEditing && (
													<button
														type="button"
														onClick={() => setVideoLinks((prev) => prev.filter((_, i) => i !== idx))}
														className="px-2 py-1 bg-red-100 border-2 border-black rounded-lg text-red-600 font-bold hover:bg-red-200 shrink-0 cursor-pointer"
													>
														✕
													</button>
												)}
											</div>
										))}
										{isSpace && isEditing && videoLinks.length < 5 && (
											<button
												type="button"
												onClick={() => setVideoLinks((prev) => [...prev, ""])}
												className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-50 text-black font-black text-xs border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer select-none w-fit"
											>
												+ Add Video Link
											</button>
										)}
									</div>
								</Field>
							)}

							{/* Social Media Links: Naming Rights, Physical Branding, Pop-ups & Experiences */}
							{category !== "SAMPLING_DEMO" && (
								<Field label="Social Media Links" hint="Up to 5 URLs">
									<div className="flex flex-col gap-2">
										{socialLinks.map((link, idx) => (
											<div key={idx} className="flex items-center gap-2">
												<input
													value={link}
													disabled={!isSpace || !isEditing}
													onChange={(e) => {
														const updated = [...socialLinks]
														updated[idx] = e.target.value
														setSocialLinks(updated)
													}}
													placeholder="https://instagram.com/... or LinkedIn"
													className={inputClass}
												/>
												{(!isEditing || !isSpace) && link.trim() && (
													<a
														href={link.startsWith("http") ? link : `https://${link}`}
														target="_blank"
														rel="noopener noreferrer"
														className="px-2.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 border-2 border-black text-black font-bold text-xs shrink-0 flex items-center justify-center"
														title="Open link"
													>
														↗
													</a>
												)}
												{isSpace && isEditing && (
													<button
														type="button"
														onClick={() => setSocialLinks((prev) => prev.filter((_, i) => i !== idx))}
														className="px-2 py-1 bg-red-100 border-2 border-black rounded-lg text-red-600 font-bold hover:bg-red-200 shrink-0 cursor-pointer"
													>
														✕
													</button>
												)}
											</div>
										))}
										{isSpace && isEditing && socialLinks.length < 5 && (
											<button
												type="button"
												onClick={() => setSocialLinks((prev) => [...prev, ""])}
												className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-50 text-black font-black text-xs border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer select-none w-fit"
											>
												+ Add Social Link
											</button>
										)}
									</div>
								</Field>
							)}
						</div>

						{/* Space Partner Submit/Edit Actions */}
						{isSpace && !isApproved && (
							<div className="px-6 py-4 border-t-[3px] border-black flex justify-end gap-3 shrink-0 bg-neutral-50 rounded-b-[21px]">
								{isEditing ? (
									<>
										{report && (
											<button
												type="button"
												onClick={() => setIsEditing(false)}
												className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-black font-black text-xs border-[2.5px] border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer select-none"
											>
												Cancel
											</button>
										)}
										<button
											type="button"
											onClick={handleSubmit}
											disabled={!isValid || saving}
											className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-[#FFC940] hover:bg-[#ffbe1a] text-black font-black text-xs border-[2.5px] border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer select-none disabled:opacity-50"
										>
											<svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
												<polyline points="20 6 9 17 4 12" />
											</svg>
											<span>{saving ? "Saving…" : report ? "Resubmit Report" : "Submit Report"}</span>
										</button>
									</>
								) : (
									<button
										type="button"
										onClick={() => setIsEditing(true)}
										className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-[#FFC940] hover:bg-[#ffbe1a] text-black font-black text-xs border-[2.5px] border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer select-none"
									>
										<svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
											<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
										</svg>
										<span>Edit Report</span>
									</button>
								)}
							</div>
						)}

						{/* Brand Review Actions (Approve / Request Revision) */}
						{isBrand && !isApproved && report && (
							<div className="px-6 py-4 border-t-[3px] border-black flex flex-col gap-3 shrink-0 bg-neutral-50 rounded-b-[21px]">
								{showRevisionInput ? (
									<div className="flex flex-col gap-2">
										<textarea
											value={revisionNote}
											onChange={(e) => setRevisionNote(e.target.value)}
											rows={2}
											placeholder="Write your requested revisions/changes here…"
											className={inputClass}
										/>
										<div className="flex justify-end gap-3">
											<button
												type="button"
												onClick={() => setShowRevisionInput(false)}
												className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-black font-black text-xs border-[2.5px] border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer select-none"
											>
												Cancel
											</button>
											<button
												type="button"
												onClick={() => handleReviewerAction("REVISION_REQUESTED")}
												disabled={saving || !revisionNote.trim()}
												className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-[#EE2C2C] hover:bg-[#d42525] text-white font-black text-xs border-[2.5px] border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer select-none disabled:opacity-50"
											>
												<svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
													<path d="M22 2L11 13" />
													<path d="M22 2l-7 20-4-9-9-4 20-7z" />
												</svg>
												<span>Send Request</span>
											</button>
										</div>
									</div>
								) : (
									<div className="flex justify-end gap-3">
										<button
											type="button"
											onClick={() => setShowRevisionInput(true)}
											className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EE2C2C] hover:bg-[#d42525] text-white font-black text-xs border-[2.5px] border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer select-none"
										>
											<svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
												<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
												<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
											</svg>
											<span>Request Revision</span>
										</button>
										<button
											type="button"
											onClick={() => handleReviewerAction("APPROVED")}
											disabled={saving}
											className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-[#FFC940] hover:bg-[#ffbe1a] text-black font-black text-xs border-[2.5px] border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer select-none disabled:opacity-50"
										>
											<svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
												<polyline points="20 6 9 17 4 12" />
											</svg>
											<span>Approve Report</span>
										</button>
									</div>
								)}
							</div>
						)}
					</>
				)}
			</div>

			{pdfUrl && <PdfViewerModal url={pdfUrl} title="Deliverables Report" onClose={() => setPdfUrl(null)} />}
			{viewingImage && <ImageLightbox url={viewingImage} onClose={() => setViewingImage(null)} />}
		</div>
	)
}

export function SpaceDealsArchiveView({
	counterpartName,
	counterpartAvatarUrl,
	counterpartType,
	deals,
	loading,
	onBack,
	onViewDeal,
	onViewReport,
}: {
	counterpartName: string
	counterpartAvatarUrl?: string | null
	counterpartType?: string
	deals: SpaceDeal[]
	loading?: boolean
	onBack: () => void
	onViewDeal: (deal: SpaceDeal) => void
	onViewReport: (deal: SpaceDeal) => void
}) {
	return (
		<div className="flex-1 flex flex-col min-h-0 bg-[#FFFDFC] overflow-hidden">
			{/* Archive Content */}
			<div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 min-h-0">
				{loading ? (
					<div className="m-auto text-center py-12">
						<span className="size-3 rounded-full bg-black animate-ping inline-block mb-3" />
						<p className="text-xs font-bold text-black/50">Loading past deals archive…</p>
					</div>
				) : deals.length === 0 ? (
					<div className="m-auto text-center max-w-sm p-6 bg-white border-[3px] border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
						<div className="size-12 rounded-2xl bg-[#FFC940] border-2 border-black flex items-center justify-center mx-auto mb-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xl">
							📦
						</div>
						<h4 className="text-sm font-black text-black font-heading mb-1">No Completed Deals Yet</h4>
						<p className="text-xs font-semibold text-black/50 leading-relaxed mb-4">
							When you and {counterpartName} finish a collaboration and the deliverables report is approved, it will automatically be archived here.
						</p>
						<button
							type="button"
							onClick={onBack}
							className="px-4 py-2 rounded-xl bg-[#EE2C2C] hover:bg-[#d12525] text-white font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
						>
							Return to Chat
						</button>
					</div>
				) : (
					deals.map((d) => {
						const dealData = (d.dealData as any) || {}
						const amount = d.sponsorshipAmount || dealData.projectCost || dealData.samplingCost
						const formattedStartDate = d.startDate
							? new Date(d.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
							: "—"
						const formattedEndDate = d.endDate
							? new Date(d.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
							: "—"
						const category = (d.collaborationType as BrandHubInterestType) || "NAMING_RIGHTS"
						const categoryLabel = BRAND_HUB_CATEGORY_LABELS[category] || d.collaborationType || "Collaboration"

						return (
							<div
								key={d.id}
								className="bg-white border-[3px] border-black rounded-2xl p-4 sm:p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-3.5 transition-all"
							>
								{/* Card Header */}
								<div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black/10 pb-3">
									<div className="flex items-center gap-2">
										<span
											className={clsx(
												"px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]",
												category === "NAMING_RIGHTS" && "bg-[#FFC940] text-black",
												category === "PHYSICAL_BRANDING" && "bg-[#38BDF8] text-black",
												category === "SAMPLING_DEMO" && "bg-[#EE2C2C] text-white",
												category === "POPUPS_EXPERIENCES" && "bg-[#A78BFA] text-black"
											)}
										>
											{categoryLabel}
										</span>
										<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-900">
											<span className="size-1.5 rounded-full bg-emerald-600" />
											Deal Completed & Archived
										</span>
									</div>
									<span className="text-[11px] font-bold text-black/40">
										Completed {d.report?.createdAt || d.report?.updatedAt ? new Date(d.report?.createdAt || d.report?.updatedAt || "").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
									</span>
								</div>

								{/* Deal Details Grid */}
								<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
									<div className="min-w-0">
										<h4 className="text-sm sm:text-base font-black text-black font-heading truncate">
											{d.projectName}
										</h4>
										<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-black/60 mt-1">
											<span>📅 {formattedStartDate} – {formattedEndDate}</span>
											{amount ? <span>💰 {formatAmount(amount)}</span> : null}
											{dealData.brandingInventory && (
												<span>🏷️ {dealData.brandingInventory}</span>
											)}
											{dealData.cities && (
												<span>📍 {dealData.cities}</span>
											)}
										</div>
									</div>

									{/* Action Buttons */}
									<div className="flex items-center gap-2 shrink-0">
										<button
											type="button"
											onClick={() => onViewDeal(d)}
											className="px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-100 text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
										>
											View Terms
										</button>
										{d.report && (
											<button
												type="button"
												onClick={() => onViewReport(d)}
												className="px-3 py-1.5 rounded-xl bg-[#FFC940] hover:bg-[#ffbe1a] text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
											>
												View Report
											</button>
										)}
									</div>
								</div>
							</div>
						)
					})
				)}
			</div>
		</div>
	)
}
