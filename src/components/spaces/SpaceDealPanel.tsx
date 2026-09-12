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

const STATUS_LABEL: Record<SpaceDealStatus, string> = {
	PENDING_APPROVAL: "Pending Approval",
	CHANGES_REQUESTED: "Changes Requested",
	APPROVED: "🔒 Locked",
}

const STATUS_COLOR: Record<SpaceDealStatus, string> = {
	PENDING_APPROVAL: "bg-[#FFC940] text-black",
	CHANGES_REQUESTED: "bg-[#EE2C2C] text-white",
	APPROVED: "bg-black text-white",
}

function formatAmount(amount: string | number) {
	return `₹${Number(amount || 0).toLocaleString("en-IN")}`
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

	if (!deal) {
		if (!isSpace) return null
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

	const isClosed = isSpaceReportApproved(report)

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
					{deal.projectName} · {formatAmount(deal.sponsorshipAmount)}
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

const EMPTY_FORM: SpaceDealPayload = {
	projectName: "",
	goals: "",
	venue: "",
	time: "",
	targetAudience: "",
	startDate: "",
	endDate: "",
	sponsorshipAmount: 0,
	barterElements: "",
	deliverables: "",
	otherTerms: "",
}

export function SpaceDealFormModal({
	interestId,
	deal,
	role,
	onClose,
	onSaved,
}: {
	interestId: string
	thread?: SpaceChatThread | null
	deal: SpaceDeal | null
	role?: SpaceChatRole
	onClose: () => void
	onSaved: (deal: SpaceDeal) => void
}) {
	const [form, setForm] = useState<SpaceDealPayload>(
		deal
			? {
					projectName: deal.projectName || "",
					goals: Array.isArray(deal.goals) ? deal.goals.join(", ") : (deal.goals ?? ""),
					venue: deal.venue || "",
					time: deal.time ?? "",
					targetAudience: Array.isArray(deal.targetAudience) ? deal.targetAudience.join(", ") : (deal.targetAudience ?? ""),
					startDate: deal.startDate ? deal.startDate.slice(0, 10) : "",
					endDate: deal.endDate ? deal.endDate.slice(0, 10) : "",
					sponsorshipAmount: Number(deal.sponsorshipAmount || 0),
					barterElements: deal.barterElements ?? "",
					deliverables: deal.deliverables ?? "",
					otherTerms: deal.otherTerms ?? "",
				}
			: EMPTY_FORM
	)
	const [saving, setSaving] = useState(false)

	const isValid =
		form.projectName.trim() &&
		(typeof form.goals === "string" ? form.goals.trim() : (form.goals && form.goals.length > 0)) &&
		form.venue.trim() &&
		form.startDate &&
		form.sponsorshipAmount !== undefined &&
		!isNaN(Number(form.sponsorshipAmount)) &&
		Number(form.sponsorshipAmount) >= 0 &&
		form.deliverables.trim()

	async function handleSubmit() {
		if (!isValid) return
		setSaving(true)
		try {
			const rawAmount = Number(form.sponsorshipAmount)
			const sponsorshipAmount = isNaN(rawAmount) || rawAmount < 0 ? 0 : rawAmount
			const payload: SpaceDealPayload = {
				...form,
				sponsorshipAmount,
				startDate: new Date(form.startDate).toISOString(),
				endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
			}
			const saved = deal
				? await updateSpaceDeal(interestId, payload, role)
				: await createSpaceDeal(interestId, payload, role)

			toast.success(deal ? "Deal updated." : "Deal locked — waiting for counterpart approval.")
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
				<div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-black shrink-0">
					<p className="text-lg font-black text-black">
						{deal ? "Edit Space Deal" : "🔒 Lock Space Deal"}
					</p>
					<button
						onClick={onClose}
						className="text-xl font-black text-black/40 hover:text-black transition-colors"
						aria-label="Close"
					>
						×
					</button>
				</div>

				<div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3.5">
					<Field label="Campaign Name" required>
						<input
							value={form.projectName}
							onChange={(e) => setForm((f) => ({ ...f, projectName: e.target.value }))}
							className={inputClass}
							placeholder="e.g. Summer Space Activation"
						/>
					</Field>

					<Field label="Campaign Goals" required hint="e.g. *Brand Activation, *Event, *Branding">
						<input
							value={typeof form.goals === "string" ? form.goals : (form.goals?.join(", ") ?? "")}
							onChange={(e) => setForm((f) => ({ ...f, goals: e.target.value }))}
							className={inputClass}
							placeholder="e.g. Brand Activation, Event, Branding"
						/>
					</Field>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<Field label="City / Region" required>
							<input
								value={form.venue}
								onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
								className={inputClass}
								placeholder="e.g. Bengaluru, Indiranagar"
							/>
						</Field>
						<Field label="Time" hint="Optional">
							<input
								value={form.time}
								onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
								className={inputClass}
								placeholder="e.g. 6:00 PM onwards"
							/>
						</Field>
					</div>

					<Field label="Target Audience" hint="Optional">
						<input
							value={typeof form.targetAudience === "string" ? form.targetAudience : (form.targetAudience?.join(", ") ?? "")}
							onChange={(e) => setForm((f) => ({ ...f, targetAudience: e.target.value }))}
							className={inputClass}
							placeholder="e.g. Tech Founders, Creators, College Students"
						/>
					</Field>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<Field label="Start Date" required>
							<input
								type="date"
								value={form.startDate}
								onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
								className={inputClass}
							/>
						</Field>
						<Field label="End Date" hint="Optional / Multi-day">
							<input
								type="date"
								value={form.endDate}
								min={form.startDate || undefined}
								onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
								className={inputClass}
							/>
						</Field>
					</div>

					<Field label="Cash Amount (₹)" required hint="Agreed monetary amount in INR (≥ 0)">
						<input
							type="number"
							min="0"
							value={form.sponsorshipAmount === 0 ? "" : form.sponsorshipAmount}
							onChange={(e) => setForm((f) => ({ ...f, sponsorshipAmount: e.target.value === "" ? 0 : Number(e.target.value) }))}
							className={inputClass}
							placeholder="₹ 0"
						/>
					</Field>

					<Field label="Barter Elements" hint="Optional">
						<input
							value={form.barterElements}
							onChange={(e) => setForm((f) => ({ ...f, barterElements: e.target.value }))}
							className={inputClass}
							placeholder="e.g. Gifting, vouchers, sample products, etc."
						/>
					</Field>

					<Field label="Key Deliverables" required hint="Agreed deliverables">
						<textarea
							rows={3}
							value={form.deliverables}
							onChange={(e) => setForm((f) => ({ ...f, deliverables: e.target.value }))}
							className={`${inputClass} resize-none`}
							placeholder="e.g. Dedicated space access for 50 attendees, banner display, projector setup, etc."
						/>
					</Field>

					<Field label="Other Information / Remarks" hint="Optional">
						<textarea
							rows={2}
							value={form.otherTerms}
							onChange={(e) => setForm((f) => ({ ...f, otherTerms: e.target.value }))}
							className={`${inputClass} resize-none`}
							placeholder="Payment terms, milestones, or any other agreed conditions."
						/>
					</Field>
				</div>

				<div className="flex items-center justify-end gap-3 px-6 py-4 border-t-[3px] border-black shrink-0 bg-neutral-50">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 rounded-xl text-black/60 hover:text-black font-extrabold text-xs transition-colors cursor-pointer"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleSubmit}
						disabled={!isValid || saving}
						className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-[#EE2C2C] hover:bg-[#d42525] text-white font-black text-xs border-[2.5px] border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer select-none disabled:opacity-50"
					>
						<svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
							<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
							<path d="M7 11V7a5 5 0 0 1 10 0v4" />
						</svg>
						<span>{saving ? "Saving…" : deal ? "Save Changes" : "Submit & Lock Deal"}</span>
					</button>
				</div>
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

	// Counterpart (Brand or Community) can approve / request changes.
	const canApproveOrRequestChanges = role !== "SPACE"

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
				<div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-black shrink-0">
					<div className="flex items-center gap-2">
						<p className="text-lg font-black text-black">Space Deal Details</p>
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
						className="text-xl font-black text-black/40 hover:text-black transition-colors"
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

					<Row label="Campaign / Space Name" value={deal.projectName} />
					{deal.goals && <Row label="Campaign Goals" value={typeof deal.goals === "string" ? deal.goals : deal.goals.join(", ")} />}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<Row label="City / Region" value={deal.venue} />
						{deal.time && <Row label="Time" value={deal.time} />}
					</div>
					{deal.targetAudience && (
						<Row
							label="Target Audience"
							value={typeof deal.targetAudience === "string" ? deal.targetAudience : deal.targetAudience.join(", ")}
						/>
					)}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<Row
							label="Start Date"
							value={deal.startDate ? new Date(deal.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null}
						/>
						{deal.endDate && (
							<Row
								label="End Date"
								value={new Date(deal.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
							/>
						)}
					</div>
					<Row label="Cash Amount" value={formatAmount(deal.sponsorshipAmount)} />
					{deal.barterElements && <Row label="Barter Elements" value={deal.barterElements} />}
					<Row label="Key Deliverables" value={deal.deliverables} />
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
								placeholder="e.g. Please adjust the event start time to 7:00 PM and specify projector access in deliverables."
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

				<div className="flex items-center justify-between gap-3 px-6 py-4 border-t-[3px] border-black shrink-0 bg-neutral-50">
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
	onClose,
	onReportUpdated,
}: {
	interestId: string
	role: SpaceChatRole
	onClose: () => void
	onReportUpdated?: (report: SpaceDealReport) => void
}) {
	const [loading, setLoading] = useState(true)
	const [report, setReport] = useState<SpaceDealReport | null>(null)
	const [deal, setDeal] = useState<SpaceDeal | null>(null)

	// Editing Mode State
	const [isEditing, setIsEditing] = useState(false)

	// Report Fields
	const [projectName, setProjectName] = useState("")
	const [date, setDate] = useState("")
	const [venue, setVenue] = useState("")
	const [time, setTime] = useState("")
	const [guestCount, setGuestCount] = useState("")
	const [ageRange, setAgeRange] = useState("")
	const [deliverablesList, setDeliverablesList] = useState<{ text: string; checked: boolean }[]>([])
	const [videoLinks, setVideoLinks] = useState<string[]>([])
	const [socialLinks, setSocialLinks] = useState<string[]>([])
	const [images, setImages] = useState<{ key?: string; url: string; file?: File }[]>([])

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

	function formatDateForInput(isoString?: string | null): string {
		if (!isoString) return ""
		try {
			const d = new Date(isoString)
			if (isNaN(d.getTime())) return isoString
			return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
		} catch {
			return isoString
		}
	}

	function parseDeliverables(raw?: string | null): { text: string; checked: boolean }[] {
		if (!raw) return []
		return raw
			.split(/\r?\n|,/)
			.map((s) => s.replace(/^[-*•\d.]\s*/, "").trim())
			.filter(Boolean)
			.map((text) => ({ text, checked: false }))
	}

	useEffect(() => {
		Promise.all([
			getSpaceDealReport(interestId, role).catch(() => null),
			getSpaceDeal(interestId).catch(() => null),
		])
			.then(([r, d]) => {
				setDeal(d)
				setReport(r)
				if (r) {
					setIsEditing(false)
					try {
						const data = typeof r.summary === "string" ? JSON.parse(r.summary) : (r.summary || {})
						setProjectName(data.projectName || r.projectName || d?.projectName || "")
						setDate(data.date || r.eventDate || formatDateForInput(d?.startDate) || "")
						setVenue(data.venue || r.venue || d?.venue || "")
						setTime(data.time || r.time || d?.time || "")
						setGuestCount(data.guestCount || r.guestCount || "")
						setAgeRange(data.ageRange || r.ageRange || (Array.isArray(d?.targetAudience) ? d.targetAudience.join(", ") : (d?.targetAudience ?? "")))
						setDeliverablesList(data.deliverables || (Array.isArray(r.deliverables) ? r.deliverables : parseDeliverables(d?.deliverables)))
						setVideoLinks(data.videoLinks || r.videoLinks || [])
						setSocialLinks(data.socialLinks || r.socialLinks || [])
						setReportStatus((r.status || data.status || "PENDING") as "PENDING" | "APPROVED" | "REVISION_REQUESTED")
						setRevisionNote(r.revisionNote || data.revisionNote || "")
					} catch {
						setProjectName(r.projectName || d?.projectName || "")
						setDate(r.eventDate || formatDateForInput(d?.startDate) || "")
						setVenue(r.venue || d?.venue || "")
						setTime(r.time || d?.time || "")
						setGuestCount(r.guestCount || "")
						setAgeRange(r.ageRange || (Array.isArray(d?.targetAudience) ? d.targetAudience.join(", ") : (d?.targetAudience ?? "")))
						setDeliverablesList(Array.isArray(r.deliverables) ? r.deliverables : parseDeliverables(d?.deliverables))
						setReportStatus((r.status || "PENDING") as "PENDING" | "APPROVED" | "REVISION_REQUESTED")
						setRevisionNote(r.revisionNote || "")
					}
					setImages((r.proofKeys || []).map((key, i) => ({ key, url: r.proofUrls?.[i] ?? "" })))
				} else {
					setIsEditing(true)
					// Pre-populate from locked deal
					setProjectName(d?.projectName || "")
					setDate(formatDateForInput(d?.startDate) || "")
					setVenue(d?.venue || "")
					setTime(d?.time || "")
					setAgeRange(Array.isArray(d?.targetAudience) ? d.targetAudience.join(", ") : (d?.targetAudience ?? ""))
					setDeliverablesList(parseDeliverables(d?.deliverables))
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
			const url = await getSpaceDealReportPdfUrl(interestId, role)
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
		} catch {
			toast.error("Failed to upload image.")
		} finally {
			setUploading(false)
		}
	}

	function removeImage(index: number) {
		setImages((prev) => prev.filter((_, i) => i !== index))
	}

	const isValid = projectName.trim().length > 0 && date.trim().length > 0 && venue.trim().length > 0

	async function handleSubmit() {
		if (!isValid) {
			toast.error("Please fill in Project Name, Date, and Venue.")
			return
		}
		setSaving(true)
		try {
			const summaryData = JSON.stringify({
				projectName: projectName.trim(),
				date: date.trim(),
				venue: venue.trim(),
				time: time.trim(),
				guestCount: guestCount.trim(),
				ageRange: ageRange.trim(),
				deliverables: deliverablesList,
				videoLinks: videoLinks.filter(Boolean),
				socialLinks: socialLinks.filter(Boolean),
				status: "PENDING",
				revisionNote: "",
			})

			const saved = await upsertSpaceDealReport(
				interestId,
				{
					projectName: projectName.trim(),
					eventDate: date.trim(),
					venue: venue.trim(),
					time: time.trim(),
					guestCount: guestCount.trim(),
					ageRange: ageRange.trim(),
					deliverables: deliverablesList,
					videoLinks: videoLinks.filter(Boolean),
					socialLinks: socialLinks.filter(Boolean),
					status: "PENDING",
					revisionNote: "",
					summary: summaryData,
					notes: "",
					proofKeys: images.map((img) => img.key).filter((k): k is string => !!k),
				},
				role
			)

			toast.success(report ? "Report resubmitted for review." : "Report submitted for review.")
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
			const summaryData = JSON.stringify({
				projectName: projectName.trim(),
				date: date.trim(),
				venue: venue.trim(),
				time: time.trim(),
				guestCount: guestCount.trim(),
				ageRange: ageRange.trim(),
				deliverables: deliverablesList,
				videoLinks: videoLinks.filter(Boolean),
				socialLinks: socialLinks.filter(Boolean),
				status,
				revisionNote: note,
			})

			const saved = await upsertSpaceDealReport(
				interestId,
				{
					projectName: projectName.trim(),
					eventDate: date.trim(),
					venue: venue.trim(),
					time: time.trim(),
					guestCount: guestCount.trim(),
					ageRange: ageRange.trim(),
					deliverables: deliverablesList,
					videoLinks: videoLinks.filter(Boolean),
					socialLinks: socialLinks.filter(Boolean),
					status,
					revisionNote: note,
					summary: summaryData,
					notes: note,
					proofKeys: images.map((img) => img.key).filter((k): k is string => !!k),
				},
				role
			)

			if (status === "APPROVED") {
				// Trigger confetti sparkle animation locally in the chat canvas
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

			toast.success(status === "APPROVED" ? "Report approved, deal is closed!" : "Revision request sent.")
			setReport(saved)
			setReportStatus(status)
			onReportUpdated?.(saved)
			onClose()
		} catch {
			toast.error("Failed to update status.")
		} finally {
			setSaving(false)
		}
	}

	const STATUS_BADGES = {
		PENDING: { label: "Pending Approval", color: "bg-amber-50 text-amber-700 border-amber-300" },
		APPROVED: { label: "Approved", color: "bg-green-50 text-green-700 border-green-300" },
		REVISION_REQUESTED: { label: "Revision Requested", color: "bg-red-50 text-red-700 border-red-300" },
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose()
			}}
		>
			<div className="bg-white rounded-[24px] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg flex flex-col max-h-[90vh]">
				<div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-black shrink-0 bg-neutral-50 rounded-t-[21px]">
					<div className="flex items-center gap-3">
						<p className="text-lg font-black text-black">Deliverables Report</p>
						{report && (
							<span className={clsx("px-2 py-0.5 border-2 rounded-full text-[9px] font-black uppercase tracking-wide", STATUS_BADGES[reportStatus]?.color)}>
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
						<button onClick={onClose} className="text-xl font-black text-black/40 hover:text-black" aria-label="Close">
							×
						</button>
					</div>
				</div>

				{loading ? (
					<div className="px-6 py-10 text-center text-sm font-semibold text-black/40">Loading…</div>
				) : !isSpace && !report ? (
					<div className="px-6 py-10 text-center text-sm font-semibold text-black/40">
						The space partner hasn&apos;t submitted a deliverables report yet.
					</div>
				) : (
					<>
						<div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
							{reportStatus === "REVISION_REQUESTED" && revisionNote && (
								<div className="bg-red-50 border-2 border-red-300 rounded-xl p-3 text-xs font-semibold text-red-800">
									<p className="font-bold text-red-900 mb-0.5">Revision Requested:</p>
									{revisionNote}
								</div>
							)}

							<div className="grid grid-cols-2 gap-3">
								<Field label="Project Name" required>
									<input
										value={projectName}
										maxLength={255}
										disabled={!isSpace || !isEditing}
										onChange={(e) => setProjectName(e.target.value)}
										className={inputClass}
										placeholder="Project Name"
									/>
								</Field>
								<Field label="Date" required>
									<input
										value={date}
										maxLength={255}
										disabled={!isSpace || !isEditing}
										onChange={(e) => setDate(e.target.value)}
										className={inputClass}
										placeholder="e.g. Oct 24, 2026"
									/>
								</Field>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<Field label="Venue" required>
									<input
										value={venue}
										maxLength={1000}
										disabled={!isSpace || !isEditing}
										onChange={(e) => setVenue(e.target.value)}
										className={inputClass}
										placeholder="Venue"
									/>
								</Field>
								<Field label="Time" hint="Optional">
									<input
										value={time}
										maxLength={100}
										disabled={!isSpace || !isEditing}
										onChange={(e) => setTime(e.target.value)}
										className={inputClass}
										placeholder="e.g. 9 AM - 5 PM"
									/>
								</Field>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<Field label="Guest Count" hint="Optional">
									<input
										value={guestCount}
										maxLength={50}
										disabled={!isSpace || !isEditing}
										onChange={(e) => setGuestCount(e.target.value)}
										className={inputClass}
										placeholder="e.g. 500+"
									/>
								</Field>
								<Field label="Age (Range)" hint="Optional">
									<input
										value={ageRange}
										maxLength={50}
										disabled={!isSpace || !isEditing}
										onChange={(e) => setAgeRange(e.target.value)}
										className={inputClass}
										placeholder="e.g. 18-25"
									/>
								</Field>
							</div>

							{deliverablesList.length > 0 && (
								<Field label="Deliverables Met" hint="Interactive checklist">
									<div className="flex flex-col gap-2 bg-neutral-50 p-3 rounded-xl border-[3px] border-black">
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

							<Field label="Social Links" hint="Up to 5 URLs">
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
						</div>

						{isSpace && reportStatus !== "APPROVED" && (
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

						{!isSpace && reportStatus !== "APPROVED" && (
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
