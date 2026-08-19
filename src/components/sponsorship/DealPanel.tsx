"use client"

import { useState } from "react"
import clsx from "clsx"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import {
	type SponsorshipDeal,
	type SponsorshipDealPayload,
	createSponsorshipDeal,
	updateSponsorshipDeal,
	approveSponsorshipDeal,
	requestSponsorshipDealChanges,
} from "@/lib/api"

const STATUS_LABEL: Record<SponsorshipDeal["status"], string> = {
	PENDING_APPROVAL: "Pending Approval",
	CHANGES_REQUESTED: "Changes Requested",
	APPROVED: "🔒 Locked",
}

const STATUS_COLOR: Record<SponsorshipDeal["status"], string> = {
	PENDING_APPROVAL: "bg-[#FFC940] text-black",
	CHANGES_REQUESTED: "bg-[#EE2C2C] text-white",
	APPROVED: "bg-black text-white",
}

function formatAmount(amount: string | number) {
	return `₹${Number(amount).toLocaleString("en-IN")}`
}

// Pinned banner shown above the chat input — always reflects the latest deal state so both
// sides see the same thing, regardless of how far back the actual deal-related chat messages are.
export function DealBanner({
	deal,
	role,
	onLock,
	onEdit,
	onView,
}: {
	deal: SponsorshipDeal | null
	role: "HOST" | "BRAND"
	onLock?: () => void
	onEdit?: () => void
	onView: () => void
}) {
	if (!deal) {
		if (role !== "HOST") return null
		return (
			<div className="px-5 py-2.5 border-b-[3px] border-black bg-neutral-50 flex items-center justify-between gap-3 shrink-0">
				<p className="text-xs font-bold text-black/50">Once terms are agreed, submit the final details here.</p>
				<Button size="sm" onClick={onLock}>🔒 Lock the Deal</Button>
			</div>
		)
	}

	return (
		<div className="px-5 py-2.5 border-b-[3px] border-black bg-neutral-50 flex items-center justify-between gap-3 shrink-0">
			<div className="min-w-0 flex items-center gap-2">
				<span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0", STATUS_COLOR[deal.status])}>
					{STATUS_LABEL[deal.status]}
				</span>
				<p className="text-xs font-bold text-black truncate">
					{deal.eventName} · {formatAmount(deal.finalAmount)}
				</p>
			</div>
			<div className="flex items-center gap-2 shrink-0">
				<Button size="sm" variant="secondary" onClick={onView}>View Details</Button>
				{role === "HOST" && deal.status !== "APPROVED" && (
					<Button size="sm" onClick={onEdit}>Edit Deal</Button>
				)}
			</div>
		</div>
	)
}

const EMPTY_FORM: SponsorshipDealPayload = {
	eventName: "",
	eventDate: "",
	eventTime: "",
	venue: "",
	finalAmount: 0,
	deliverables: "",
	otherTerms: "",
	additionalNotes: "",
}

// Host-only form to lock a new deal, or edit an existing (not-yet-approved) one.
export function DealFormModal({
	interestId,
	deal,
	onClose,
	onSaved,
}: {
	interestId: string
	deal: SponsorshipDeal | null
	onClose: () => void
	onSaved: (deal: SponsorshipDeal) => void
}) {
	const [form, setForm] = useState<SponsorshipDealPayload>(
		deal
			? {
					eventName: deal.eventName,
					eventDate: deal.eventDate.slice(0, 10),
					eventTime: deal.eventTime ?? "",
					venue: deal.venue,
					finalAmount: Number(deal.finalAmount),
					deliverables: deal.deliverables,
					otherTerms: deal.otherTerms ?? "",
					additionalNotes: deal.additionalNotes ?? "",
				}
			: EMPTY_FORM,
	)
	const [saving, setSaving] = useState(false)

	const isValid = form.eventName.trim() && form.eventDate && form.venue.trim() && form.finalAmount >= 0 && form.deliverables.trim()

	async function handleSubmit() {
		if (!isValid) return
		setSaving(true)
		try {
			const payload: SponsorshipDealPayload = {
				...form,
				eventDate: new Date(form.eventDate).toISOString(),
			}
			const saved = deal ? await updateSponsorshipDeal(interestId, payload) : await createSponsorshipDeal(interestId, payload)
			toast.success(deal ? "Deal updated." : "Deal locked — waiting on brand approval.")
			onSaved(saved)
			onClose()
		} catch {
			toast.error("Failed to save the deal.")
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
			<div className="bg-white rounded-[24px] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg flex flex-col max-h-[90vh]">
				<div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-black shrink-0">
					<p className="text-lg font-black text-black">{deal ? "Edit Deal" : "🔒 Lock the Deal"}</p>
					<button onClick={onClose} className="text-xl font-black text-black/40 hover:text-black" aria-label="Close">×</button>
				</div>

				<div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
					<Field label="Event / Project Name">
						<input value={form.eventName} onChange={e => setForm(f => ({ ...f, eventName: e.target.value }))} className={inputClass} placeholder="Summer Music Fest" />
					</Field>
					<div className="grid grid-cols-2 gap-3">
						<Field label="Event Date">
							<input type="date" value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} className={inputClass} />
						</Field>
						<Field label="Event Time (optional)">
							<input value={form.eventTime} onChange={e => setForm(f => ({ ...f, eventTime: e.target.value }))} className={inputClass} placeholder="6:00 PM onwards" />
						</Field>
					</div>
					<Field label="Venue">
						<input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} className={inputClass} placeholder="Phoenix Marketcity, Bengaluru" />
					</Field>
					<Field label="Final Sponsorship Price (₹)">
						<input
							type="number"
							min={0}
							value={form.finalAmount}
							onChange={e => setForm(f => ({ ...f, finalAmount: Number(e.target.value) }))}
							className={inputClass}
						/>
					</Field>
					<Field label="Deliverables">
						<textarea value={form.deliverables} onChange={e => setForm(f => ({ ...f, deliverables: e.target.value }))} rows={3} className={inputClass} placeholder="Logo on stage backdrop, 2 Instagram posts, on-site booth…" />
					</Field>
					<Field label="Other Terms / Conditions (optional)">
						<textarea value={form.otherTerms} onChange={e => setForm(f => ({ ...f, otherTerms: e.target.value }))} rows={2} className={inputClass} />
					</Field>
					<Field label="Additional Notes (optional)">
						<textarea value={form.additionalNotes} onChange={e => setForm(f => ({ ...f, additionalNotes: e.target.value }))} rows={2} className={inputClass} />
					</Field>
				</div>

				<div className="px-6 py-4 border-t-[3px] border-black flex justify-end gap-2 shrink-0">
					<Button variant="secondary" onClick={onClose}>Cancel</Button>
					<Button onClick={handleSubmit} disabled={!isValid || saving}>{saving ? "Saving…" : deal ? "Save Changes" : "Submit Deal"}</Button>
				</div>
			</div>
		</div>
	)
}

// Read-only detail view for both sides. Brand gets Approve / Request Changes actions here.
export function DealDetailsModal({
	interestId,
	deal,
	role,
	onClose,
	onUpdated,
}: {
	interestId: string
	deal: SponsorshipDeal
	role: "HOST" | "BRAND"
	onClose: () => void
	onUpdated: (deal: SponsorshipDeal) => void
}) {
	const [requestingChanges, setRequestingChanges] = useState(false)
	const [note, setNote] = useState("")
	const [busy, setBusy] = useState(false)

	async function handleApprove() {
		setBusy(true)
		try {
			const updated = await approveSponsorshipDeal(interestId)
			toast.success("🎉 Deal approved and locked!")
			onUpdated(updated)
			onClose()
		} catch {
			toast.error("Failed to approve the deal.")
		} finally {
			setBusy(false)
		}
	}

	async function handleRequestChanges() {
		setBusy(true)
		try {
			const updated = await requestSponsorshipDealChanges(interestId, { note: note.trim() || undefined })
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
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
			<div className="bg-white rounded-[24px] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg flex flex-col max-h-[90vh]">
				<div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-black shrink-0">
					<div className="flex items-center gap-2">
						<p className="text-lg font-black text-black">Deal Details</p>
						<span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-black uppercase", STATUS_COLOR[deal.status])}>
							{STATUS_LABEL[deal.status]}
						</span>
					</div>
					<button onClick={onClose} className="text-xl font-black text-black/40 hover:text-black" aria-label="Close">×</button>
				</div>

				<div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3 text-sm">
					<Row label="Event / Project Name" value={deal.eventName} />
					<Row label="Event Date" value={new Date(deal.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} />
					{deal.eventTime && <Row label="Event Time" value={deal.eventTime} />}
					<Row label="Venue" value={deal.venue} />
					<Row label="Final Sponsorship Price" value={formatAmount(deal.finalAmount)} />
					<Row label="Deliverables" value={deal.deliverables} multiline />
					{deal.otherTerms && <Row label="Other Terms / Conditions" value={deal.otherTerms} multiline />}
					{deal.additionalNotes && <Row label="Additional Notes" value={deal.additionalNotes} multiline />}
					{deal.changeRequestNote && (
						<div className="rounded-xl border-[3px] border-[#EE2C2C] bg-[#EE2C2C]/5 p-3">
							<p className="text-[10px] font-black uppercase text-[#EE2C2C] mb-1">Changes Requested</p>
							<p className="text-xs font-semibold text-black">{deal.changeRequestNote}</p>
						</div>
					)}
					<p className="text-[11px] font-semibold text-black/30">Version {deal.version}</p>

					{role === "BRAND" && deal.status !== "APPROVED" && requestingChanges && (
						<div className="pt-2 border-t border-black/10">
							<label className="text-[11px] font-black uppercase text-black/40 mb-1 block">What needs to change? (optional)</label>
							<textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className={inputClass} placeholder="e.g. Can we revisit the final amount?" />
						</div>
					)}
				</div>

				{role === "BRAND" && deal.status !== "APPROVED" && (
					<div className="px-6 py-4 border-t-[3px] border-black flex justify-end gap-2 shrink-0">
						{requestingChanges ? (
							<>
								<Button variant="secondary" onClick={() => setRequestingChanges(false)} disabled={busy}>Back</Button>
								<Button onClick={handleRequestChanges} disabled={busy}>{busy ? "…" : "Send Request"}</Button>
							</>
						) : (
							<>
								<Button variant="secondary" onClick={() => setRequestingChanges(true)} disabled={busy}>Request Changes</Button>
								<Button onClick={handleApprove} disabled={busy}>{busy ? "…" : "Approve Deal"}</Button>
							</>
						)}
					</div>
				)}
			</div>
		</div>
	)
}

const inputClass = "w-full rounded-xl border-[3px] border-black bg-white px-3 py-2 text-sm font-semibold outline-none focus:bg-neutral-50"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<label className="flex flex-col gap-1">
			<span className="text-[11px] font-black uppercase text-black/40">{label}</span>
			{children}
		</label>
	)
}

function Row({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
	return (
		<div>
			<p className="text-[10px] font-black uppercase text-black/40">{label}</p>
			<p className={clsx("font-semibold text-black", multiline ? "whitespace-pre-wrap" : "")}>{value}</p>
		</div>
	)
}
