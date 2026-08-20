"use client"

import { useState, useEffect } from "react"
import clsx from "clsx"
import { toast } from "sonner"
import confetti from "canvas-confetti"
import { Button } from "@/components/ui/Button"
import { VenueAutocompleteInput } from "@/components/eventForm/AddressAutocompleteInput"
import {
	type SponsorshipDeal,
	type SponsorshipDealPayload,
	createSponsorshipDeal,
	updateSponsorshipDeal,
	approveSponsorshipDeal,
	requestSponsorshipDealChanges,
	getSponsorshipProposalDetail,
	getHostCommunityProfile,
	getCategories,
	sendSponsorshipChatMessage,
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
					{deal.projectName} · {formatAmount(deal.sponsorshipAmount)}
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
	projectName: "",
	startDate: "",
	endDate: "",
	time: "",
	venue: "",
	sponsorshipAmount: 0,
	deliverables: "",
	sponsorshipCategory: "",
	barterElements: "",
}

// Host-only form to lock a new deal, or edit an existing (not-yet-approved) one.
export function DealFormModal({
	interestId,
	proposalId,
	deal,
	onClose,
	onSaved,
}: {
	interestId: string
	proposalId?: string
	deal: SponsorshipDeal | null
	onClose: () => void
	onSaved: (deal: SponsorshipDeal) => void
}) {
	const [form, setForm] = useState<SponsorshipDealPayload>(
		deal
			? {
					projectName: deal.projectName,
					startDate: deal.startDate.slice(0, 10),
					time: deal.time ?? "",
					venue: deal.venue,
					sponsorshipAmount: Number(deal.sponsorshipAmount),
					deliverables: deal.deliverables,
					endDate: deal.endDate ?? "",
					sponsorshipCategory: deal.sponsorshipCategory ?? "",
					barterElements: deal.barterElements ?? "",
				}
			: EMPTY_FORM,
	)
	const [saving, setSaving] = useState(false)
	const [allCategories, setAllCategories] = useState<{ id: string; name: string }[]>([])

	useEffect(() => {
		// Load all categories for the dropdown selection
		getCategories().then(setAllCategories).catch(() => [])
	}, [])

	useEffect(() => {
		if (proposalId && !deal) {
			Promise.all([
				getSponsorshipProposalDetail(proposalId).catch(() => null),
				getHostCommunityProfile().catch(() => null),
			]).then(([proposal, community]) => {
				if (proposal) {
					let resolvedCategory = ""
					if (community?.categories?.length) {
						resolvedCategory = community.categories.map((c: any) => c.name).join(", ")
					}
					setForm((f) => ({
						...f,
						projectName: proposal.name || "",
						startDate: proposal.eventDate ? proposal.eventDate.slice(0, 10) : "",
						endDate: proposal.eventEndDate ? proposal.eventEndDate.slice(0, 10) : "",
						venue: proposal.venue || "",
						sponsorshipCategory: resolvedCategory,
					}))
				}
			})
		}
	}, [proposalId, deal])

	const formCategories = form.sponsorshipCategory ? form.sponsorshipCategory.split(", ").filter(Boolean) : []

	const addCategory = (name: string) => {
		if (!formCategories.includes(name)) {
			const updated = [...formCategories, name].join(", ")
			setForm(f => ({ ...f, sponsorshipCategory: updated }))
		}
	}

	const removeCategory = (name: string) => {
		const updated = formCategories.filter(c => c !== name).join(", ")
		setForm(f => ({ ...f, sponsorshipCategory: updated }))
	}

	const availableToAdd = allCategories.filter(c => !formCategories.includes(c.name))

	const isValid = form.projectName.trim() && form.startDate && form.endDate?.trim() && form.venue.trim() && form.deliverables.trim()

	async function handleSubmit() {
		if (!isValid) return
		setSaving(true)
		try {
			const payload: SponsorshipDealPayload = {
				...form,
				startDate: new Date(form.startDate).toISOString(),
				endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
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
					<Field label="Project Name">
						<input value={form.projectName} onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))} className={inputClass} placeholder="Summer Music Fest" />
					</Field>
					<div className="grid grid-cols-2 gap-3">
						<Field label="Start Date">
							<input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={inputClass} />
						</Field>
						<Field label="End Date">
							<input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className={inputClass} />
						</Field>
					</div>

					<div className="grid grid-cols-12 gap-3">
						<div className="col-span-4">
							<Field label="Time">
								<input value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className={inputClass} placeholder="6:00 PM" />
							</Field>
						</div>
						<div className="col-span-8">
							<Field label="Venue">
								<VenueAutocompleteInput
									value={form.venue}
									error={false}
									onChange={v => setForm(f => ({ ...f, venue: v }))}
									onPlaceSelect={fields => setForm(f => ({ ...f, venue: fields.fullAddress }))}
									placeholder="Phoenix Marketcity, Bengaluru"
								/>
							</Field>
						</div>
					</div>

					<Field label="Sponsorship Category">
						<div className="flex flex-col gap-2">
							<div className="flex flex-wrap gap-1.5 items-center p-2.5 border-[3px] border-black rounded-xl bg-white min-h-[42px]">
								{formCategories.map(cat => (
									<span key={cat} className="flex items-center gap-1 px-2 py-0.5 bg-[#FFC940] text-black border border-black rounded-md text-xs font-bold shrink-0">
										{cat}
										<button type="button" onClick={() => removeCategory(cat)} className="hover:text-red-500 font-black ml-0.5">×</button>
									</span>
								))}
								{availableToAdd.length > 0 && (
									<select
										onChange={e => {
											if (e.target.value) {
												addCategory(e.target.value)
												e.target.value = ""
											}
										}}
										className="text-xs font-bold bg-neutral-100 border border-black/15 rounded px-1.5 py-0.5 cursor-pointer outline-none hover:bg-neutral-200"
									>
										<option value="">+ Add</option>
										{availableToAdd.map(c => (
											<option key={c.id} value={c.name}>{c.name}</option>
										))}
									</select>
								)}
							</div>
							<div className="flex gap-2">
								<input
									type="text"
									id="custom-category-input"
									placeholder="Or type custom category..."
									onKeyDown={e => {
										if (e.key === "Enter") {
											e.preventDefault()
											const val = e.currentTarget.value.trim()
											if (val) {
												addCategory(val)
												e.currentTarget.value = ""
											}
										}
									}}
									className="flex-1 rounded-xl border-[3px] border-black bg-white px-3 py-1 text-xs font-semibold outline-none focus:bg-neutral-50"
								/>
								<button
									type="button"
									onClick={() => {
										const inputEl = document.getElementById("custom-category-input") as HTMLInputElement
										const val = inputEl?.value.trim()
										if (val) {
											addCategory(val)
											inputEl.value = ""
										}
									}}
									className="px-3 py-1 bg-black text-white rounded-xl text-xs font-bold hover:bg-neutral-800 border-[3px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
								>
									Add
								</button>
							</div>
						</div>
					</Field>

					<div className="grid grid-cols-2 gap-3">
						<Field label="Sponsorship Amount (₹)">
							<input
								type="number"
								min={0}
								value={form.sponsorshipAmount}
								onChange={e => setForm(f => ({ ...f, sponsorshipAmount: Number(e.target.value) }))}
								className={inputClass}
							/>
						</Field>
						<Field label="Barter Elements">
							<input value={form.barterElements} onChange={e => setForm(f => ({ ...f, barterElements: e.target.value }))} className={inputClass} placeholder="Gifting, Free drinks" />
						</Field>
					</div>
					<Field label="Deliverables">
						<textarea value={form.deliverables} onChange={e => setForm(f => ({ ...f, deliverables: e.target.value }))} rows={4} className={inputClass} placeholder="Logo on stage backdrop, 2 Instagram posts, on-site booth…" />
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
			
			// Trigger confetti locally in the chat canvas
			const canvas = document.getElementById("chat-confetti-canvas") as HTMLCanvasElement | null
			if (canvas) {
				const myConfetti = confetti.create(canvas, {
					resize: true,
					useWorker: true
				})
				myConfetti({
					particleCount: 150,
					spread: 80,
					origin: { y: 0.6 }
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
					<Row label="Project Name" value={deal.projectName} />
					<div className="grid grid-cols-2 gap-3">
						<Row label="Start Date" value={deal.startDate ? new Date(deal.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"} />
						<Row label="End Date" value={deal.endDate ? (deal.endDate.includes("-") ? new Date(deal.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : deal.endDate) : "—"} />
					</div>
					<div className="grid grid-cols-2 gap-3">
						{deal.time && <Row label="Time" value={deal.time} />}
						{deal.sponsorshipCategory && <Row label="Sponsorship Category" value={deal.sponsorshipCategory} />}
					</div>
					<div className="grid grid-cols-2 gap-3">
						<Row label="Sponsorship Amount" value={formatAmount(deal.sponsorshipAmount)} />
						{deal.barterElements && <Row label="Barter Elements" value={deal.barterElements} />}
					</div>
					<Row label="Venue" value={deal.venue} />
					<Row label="Deliverables" value={deal.deliverables} multiline />
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
