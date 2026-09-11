"use client"

import { useState } from "react"
import clsx from "clsx"
import confetti from "canvas-confetti"
import { toast } from "sonner"
import {
	type SpaceDeal,
	type SpaceDealPayload,
	type SpaceDealStatus,
	type SpaceChatThread,
	type SpaceChatRole,
	createSpaceDeal,
	updateSpaceDeal,
	approveSpaceDeal,
	requestSpaceDealChanges,
} from "@/lib/api"

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
}: {
	deal: SpaceDeal | null
	role: SpaceChatRole
	onLock?: () => void
	onEdit?: () => void
	onView: () => void
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

	return (
		<div className="px-3 sm:px-5 py-2.5 sm:py-3 border-b-[3px] border-black bg-neutral-50 flex items-center justify-between gap-2 sm:gap-3 shrink-0 min-w-0">
			<div className="min-w-0 flex-1 flex items-center gap-2 overflow-hidden">
				<span
					className={clsx(
						"px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] inline-flex items-center gap-1.5",
						STATUS_COLOR[deal.status]
					)}
				>
					{STATUS_LABEL[deal.status]}
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
