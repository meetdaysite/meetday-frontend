"use client"

import { useState, useEffect } from "react"
import clsx from "clsx"
import { toast } from "sonner"
import confetti from "canvas-confetti"
import { Button } from "@/components/ui/Button"
// import { VenueAutocompleteInput } from "@/components/eventForm/AddressAutocompleteInput" // venue is now read-only, auto-filled from the proposal
import {
	type SponsorshipDeal,
	type SponsorshipDealPayload,
	type SponsorshipDealReport,
	getSponsorshipDeal,
	createSponsorshipDeal,
	updateSponsorshipDeal,
	approveSponsorshipDeal,
	requestSponsorshipDealChanges,
	getSponsorshipDealReport,
	upsertSponsorshipDealReport,
	getSponsorshipProposalDetail,
	getHostCommunityProfile,
	getPublishedCampaignDetail,
	// getCategories, // Sponsorship Category editing is commented out in the Lock the Deal form
	sendSponsorshipChatMessage,
	initiateSponsorshipDealPayment,
	verifySponsorshipDealPayment,
	getSponsorshipDealReportPdfUrl,
} from "@/lib/api"
import { uploadSponsorshipDealReportImage } from "@/lib/uploadMedia"
import { PdfViewerModal } from "@/components/ui/PdfViewerModal"
import { ImageLightbox } from "@/components/ui/ImageLightbox"

function loadRazorpayScript(): Promise<boolean> {
	return new Promise((resolve) => {
		if (typeof window === "undefined") return resolve(false)
		if (window.Razorpay) return resolve(true)
		const script = document.createElement("script")
		script.src = "https://checkout.razorpay.com/v1/checkout.js"
		script.onload = () => resolve(true)
		script.onerror = () => resolve(false)
		document.body.appendChild(script)
	})
}

// Shared checkout flow — used by both the chat's DealDetailsModal and the Billing page.
export async function payForSponsorshipDeal(
	interestId: string,
	projectName: string,
	onPaid: (deal: SponsorshipDeal) => void,
): Promise<void> {
	const loaded = await loadRazorpayScript()
	if (!loaded) {
		toast.error("Failed to load the payment gateway. Please try again.")
		return
	}
	const order = await initiateSponsorshipDealPayment(interestId)
	const rzp = new window.Razorpay({
		key: order.keyId,
		amount: order.amount,
		currency: order.currency,
		order_id: order.razorpayOrderId,
		name: "Meetday",
		description: `Sponsorship payment · ${projectName}`,
		handler: async (response) => {
			try {
				const updated = await verifySponsorshipDealPayment(interestId, {
					razorpayOrderId: response.razorpay_order_id,
					razorpayPaymentId: response.razorpay_payment_id,
					razorpaySignature: response.razorpay_signature,
				})
				toast.success("Payment successful!")
				onPaid(updated)
			} catch {
				toast.error("Payment went through but verification failed — please contact support.")
			}
		},
		theme: { color: "#EE2C2C" },
	})
	rzp.on("payment.failed", () => toast.error("Payment failed. Please try again."))
	rzp.open()
}

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

// Computed client-side from the raw paymentStatus + expiry so it's always fresh, no polling needed.
export type DealPaymentDisplayStatus = "PENDING" | "PAID" | "EXPIRED"

export function getDealPaymentDisplayStatus(deal: { paymentStatus: "UNPAID" | "PAID"; paymentExpiresAt: string | null }): DealPaymentDisplayStatus {
	if (deal.paymentStatus === "PAID") return "PAID"
	if (deal.paymentExpiresAt && new Date(deal.paymentExpiresAt).getTime() < Date.now()) return "EXPIRED"
	return "PENDING"
}

export const PAYMENT_STATUS_LABEL: Record<DealPaymentDisplayStatus, string> = {
	PENDING: "Pending",
	PAID: "Paid",
	EXPIRED: "Expired",
}

export const PAYMENT_STATUS_COLOR: Record<DealPaymentDisplayStatus, string> = {
	PENDING: "bg-neutral-200 text-black/60",
	PAID: "bg-green-600 text-white",
	EXPIRED: "bg-[#EE2C2C] text-white",
}

// Pinned banner shown above the chat input — always reflects the latest deal state so both
// sides see the same thing, regardless of how far back the actual deal-related chat messages are.
export function DealBanner({
	deal,
	role,
	onLock,
	onEdit,
	onView,
	onReport,
	hasReport,
	isCampaign = false,
}: {
	deal: SponsorshipDeal | null
	role: "HOST" | "BRAND"
	onLock?: () => void
	onEdit?: () => void
	onView: () => void
	onReport?: () => void
	hasReport?: boolean
	isCampaign?: boolean
}) {
	const canLockOrEdit = isCampaign ? role === "BRAND" : role === "HOST"

	if (!deal) {
		if (!canLockOrEdit) return null
		return (
			<div className="px-4 sm:px-5 py-2.5 sm:py-3 border-b-[3px] border-black bg-[#FFFBEB] flex items-center justify-between gap-3 shrink-0">
				<div className="flex items-center gap-2">
					<span className="size-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
					<p className="text-xs font-bold text-black/60">Once terms are agreed, submit the final details here.</p>
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
		<div className="px-4 sm:px-5 py-2.5 sm:py-3 border-b-[3px] border-black bg-neutral-50 flex items-center justify-between gap-3 shrink-0">
			<div className="min-w-0 flex items-center gap-2">
				<span className={clsx("px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]", STATUS_COLOR[deal.status])}>
					{STATUS_LABEL[deal.status]}
				</span>
				{deal.status === "APPROVED" && (
					<span className={clsx("px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]", PAYMENT_STATUS_COLOR[getDealPaymentDisplayStatus(deal)])}>
						{PAYMENT_STATUS_LABEL[getDealPaymentDisplayStatus(deal)]}
					</span>
				)}
				<p className="text-xs font-black text-black truncate">
					{deal.projectName} · {formatAmount(deal.sponsorshipAmount)}
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
				{canLockOrEdit && deal.status !== "APPROVED" && (
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
							role === "HOST" && (
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
	campaignId,
	deal,
	onClose,
	onSaved,
}: {
	interestId: string
	proposalId?: string
	campaignId?: string
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
	// const [allCategories, setAllCategories] = useState<{ id: string; name: string }[]>([]) // Sponsorship Category editing is commented out below

	// useEffect(() => {
	// 	// Load all categories for the dropdown selection
	// 	getCategories().then(setAllCategories).catch(() => [])
	// }, [])

	useEffect(() => {
		if (deal) return

		if (proposalId) {
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
		} else if (campaignId) {
			console.log("[DealFormModal] Fetching campaign detail for campaignId:", campaignId)
			Promise.all([
				getPublishedCampaignDetail(campaignId).catch((err) => { console.error("[DealFormModal] getPublishedCampaignDetail failed:", err?.response?.status, err?.message); return null }),
				getHostCommunityProfile().catch((err) => { console.error("[DealFormModal] getHostCommunityProfile failed:", err?.message); return null }),
			]).then(([campaign, community]) => {
				console.log("[DealFormModal] campaign:", campaign, "community:", community)
				if (campaign) {
					let resolvedCategory = ""
					if (community?.categories?.length) {
						resolvedCategory = community.categories.map((c: any) => c.name).join(", ")
					}
					setForm((f) => ({
						...f,
						projectName: campaign.name || "",
						startDate: campaign.startDate ? campaign.startDate.slice(0, 10) : "",
						endDate: campaign.endDate ? campaign.endDate.slice(0, 10) : "",
						venue: campaign.locations?.length ? campaign.locations.join(", ") : "",
						sponsorshipCategory: resolvedCategory,
					}))
				}
			})
		}
	}, [proposalId, campaignId, deal])

	// const formCategories = form.sponsorshipCategory ? form.sponsorshipCategory.split(", ").filter(Boolean) : []

	// const addCategory = (name: string) => {
	// 	if (!formCategories.includes(name)) {
	// 		const updated = [...formCategories, name].join(", ")
	// 		setForm(f => ({ ...f, sponsorshipCategory: updated }))
	// 	}
	// }

	// const removeCategory = (name: string) => {
	// 	const updated = formCategories.filter(c => c !== name).join(", ")
	// 	setForm(f => ({ ...f, sponsorshipCategory: updated }))
	// }

	// const availableToAdd = allCategories.filter(c => !formCategories.includes(c.name))

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
						<input value={form.projectName} disabled readOnly title="Edit this in the proposal to update it here" className={`${inputClass} bg-neutral-100 text-black/50 cursor-not-allowed`} placeholder="Summer Music Fest" />
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
								<input
									value={form.venue}
									readOnly
									title="Click to open in Google Maps · Edit this in the proposal to update it"
									onClick={(e) => {
										e.currentTarget.blur()
										if (form.venue.trim()) {
											window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.venue)}`, "_blank", "noopener,noreferrer")
										}
									}}
									className={`${inputClass} bg-neutral-100 text-black/50 cursor-pointer hover:bg-neutral-200`}
									placeholder="Phoenix Marketcity, Bengaluru"
								/>
							</Field>
						</div>
					</div>

					{/* Sponsorship Category editing removed from this form — categories are managed on the host community profile
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
					*/}

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

				<div className="px-6 py-4 border-t-[3px] border-black flex justify-end gap-3 shrink-0 bg-neutral-50 rounded-b-[21px]">
					<button
						type="button"
						onClick={onClose}
						className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-black font-black text-xs border-[2.5px] border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer select-none"
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
	const [paying, setPaying] = useState(false)

	async function handlePayNow() {
		setPaying(true)
		try {
			await payForSponsorshipDeal(interestId, deal.projectName, onUpdated)
		} catch {
			toast.error("Failed to start payment.")
		} finally {
			setPaying(false)
		}
	}

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
					{deal.time && <Row label="Time" value={deal.time} />}
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

					{deal.status === "APPROVED" && (() => {
						const displayStatus = getDealPaymentDisplayStatus(deal)
						return (
							<div className={clsx(
								"rounded-xl border-[3px] p-3 flex flex-col gap-2",
								displayStatus === "PAID" ? "border-green-600 bg-green-50" : displayStatus === "EXPIRED" ? "border-[#EE2C2C] bg-[#EE2C2C]/5" : "border-black bg-neutral-50",
							)}>
								<div className="flex items-center justify-between gap-3">
									<div className="flex items-center gap-2">
										<p className="text-[10px] font-black uppercase text-black/40">Payment</p>
										<span className={clsx("px-2 py-0.5 rounded-full text-[9px] font-black uppercase", PAYMENT_STATUS_COLOR[displayStatus])}>
											{PAYMENT_STATUS_LABEL[displayStatus]}
										</span>
									</div>
									{role === "BRAND" && displayStatus !== "PAID" && (
										<button
											type="button"
											onClick={handlePayNow}
											disabled={paying}
											className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#EE2C2C] hover:bg-[#d42525] text-white font-black text-xs border-[2.5px] border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer select-none disabled:opacity-50"
										>
											<svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
												<rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
												<line x1="1" y1="10" x2="23" y2="10" />
											</svg>
											<span>{paying ? "…" : `Pay ${formatAmount(deal.totalAmount ?? deal.sponsorshipAmount)}`}</span>
										</button>
									)}
								</div>
								<div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
									<Row label="Sponsorship Amount" value={formatAmount(deal.sponsorshipAmount)} />
									{deal.platformFeeAmount != null && <Row label="Platform Fee (5%)" value={formatAmount(deal.platformFeeAmount)} />}
									{deal.transactionFeeAmount != null && <Row label="Transaction Fee (3%)" value={formatAmount(deal.transactionFeeAmount)} />}
									{deal.taxAmount != null && <Row label="GST" value={formatAmount(deal.taxAmount)} />}
									<Row label="Total Amount" value={formatAmount(deal.totalAmount ?? deal.sponsorshipAmount)} />
								</div>
								{displayStatus === "PAID" && deal.paidAt && (
									<p className="text-[11px] font-semibold text-black/40">Paid on {new Date(deal.paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
								)}
								{displayStatus !== "PAID" && deal.paymentExpiresAt && (
									<p className="text-[11px] font-semibold text-black/40">
										{displayStatus === "EXPIRED" ? "Was due by " : "Due by "}
										{new Date(deal.paymentExpiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
									</p>
								)}
							</div>
						)
					})()}

					{role === "BRAND" && deal.status !== "APPROVED" && requestingChanges && (
						<div className="pt-2 border-t border-black/10">
							<label className="text-[11px] font-black uppercase text-black/40 mb-1 block">What needs to change? (optional)</label>
							<textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className={inputClass} placeholder="e.g. Can we revisit the final amount?" />
						</div>
					)}
				</div>

				{role === "BRAND" && deal.status !== "APPROVED" && (
					<div className="px-6 py-4 border-t-[3px] border-black flex justify-end gap-3 shrink-0 bg-neutral-50 rounded-b-[21px]">
						{requestingChanges ? (
							<>
								<button
									type="button"
									onClick={() => setRequestingChanges(false)}
									disabled={busy}
									className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-black font-black text-xs border-[2.5px] border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer select-none disabled:opacity-50"
								>
									Back
								</button>
								<button
									type="button"
									onClick={handleRequestChanges}
									disabled={busy}
									className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-[#EE2C2C] hover:bg-[#d42525] text-white font-black text-xs border-[2.5px] border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer select-none disabled:opacity-50"
								>
									<svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
										<path d="M22 2L11 13" />
										<path d="M22 2l-7 20-4-9-9-4 20-7z" />
									</svg>
									<span>{busy ? "…" : "Send Request"}</span>
								</button>
							</>
						) : (
							<>
								<button
									type="button"
									onClick={() => setRequestingChanges(true)}
									disabled={busy}
									className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-neutral-50 text-[#EE2C2C] font-black text-xs border-[2.5px] border-[#EE2C2C] shadow-[2.5px_2.5px_0px_0px_#EE2C2C] hover:shadow-[1px_1px_0px_0px_#EE2C2C] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer select-none disabled:opacity-50"
								>
									<svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
										<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
										<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
									</svg>
									<span>Request Changes</span>
								</button>
								<button
									type="button"
									onClick={handleApprove}
									disabled={busy}
									className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-[#FFC940] hover:bg-[#ffbe1a] text-black font-black text-xs border-[2.5px] border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer select-none disabled:opacity-50"
								>
									<svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
										<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
										<path d="M7 11V7a5 5 0 0 1 10 0v4" />
									</svg>
									<span>{busy ? "…" : "Approve & Lock Deal"}</span>
								</button>
							</>
						)}
					</div>
				)}
			</div>
		</div>
	)
}

// Host-only: submit (or resubmit) the deliverables report once the deal is locked. Brand sees
// it read-only via the same modal.
export function DealReportModal({
	interestId,
	role,
	onClose,
}: {
	interestId: string
	role: "HOST" | "BRAND"
	onClose: () => void
}) {
	const [loading, setLoading] = useState(true)
	const [report, setReport] = useState<SponsorshipDealReport | null>(null)
	const [deal, setDeal] = useState<SponsorshipDeal | null>(null)

	// Editing Mode State
	const [isEditing, setIsEditing] = useState(false)

	// Fields
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

	// Brand Actions & Status
	const [reportStatus, setReportStatus] = useState<"PENDING" | "APPROVED" | "REVISION_REQUESTED">("PENDING")
	const [revisionNote, setRevisionNote] = useState("")
	const [downloadingPdf, setDownloadingPdf] = useState(false)
	const [pdfUrl, setPdfUrl] = useState<string | null>(null)
	const [viewingImage, setViewingImage] = useState<string | null>(null)
	const [showRevisionInput, setShowRevisionInput] = useState(false)

	const [saving, setSaving] = useState(false)
	const [uploading, setUploading] = useState(false)

	useEffect(() => {
		Promise.all([
			getSponsorshipDealReport(interestId).catch(() => null),
			getSponsorshipDeal(interestId).catch(() => null),
		]).then(([r, d]) => {
			setDeal(d)
			setReport(r)
			if (r) {
				setIsEditing(false)
				try {
					const data = JSON.parse(r.summary)
					setProjectName(data.projectName || d?.projectName || "")
					setDate(data.date || d?.startDate || "")
					setVenue(data.venue || d?.venue || "")
					setTime(data.time || d?.time || "")
					setGuestCount(data.guestCount || "")
					setAgeRange(data.ageRange || "")
					setDeliverablesList(data.deliverables || [])
					setVideoLinks(data.videoLinks || [])
					setSocialLinks(data.socialLinks || [])
					setReportStatus(data.status || "PENDING")
					setRevisionNote(data.revisionNote || "")
				} catch {
					// Fallback to plain summary if not JSON
					setProjectName(d?.projectName || "")
					setDate(d?.startDate || "")
					setVenue(d?.venue || "")
					setTime(d?.time || "")
					const items = d?.deliverables ? d.deliverables.split(/,|\n/).map(s => s.trim()).filter(Boolean) : []
					setDeliverablesList(items.map(text => ({ text, checked: false })))
				}
				setImages(r.proofKeys.map((key, i) => ({ key, url: r.proofUrls[i] ?? "" })))
			} else {
				setIsEditing(true)
				// Pre-populate from deal
				setProjectName(d?.projectName || "")
				setDate(d?.startDate || "")
				setVenue(d?.venue || "")
				setTime(d?.time || "")
				const items = d?.deliverables ? d.deliverables.split(/,|\n/).map(s => s.trim()).filter(Boolean) : []
				setDeliverablesList(items.map(text => ({ text, checked: false })))
			}
		}).catch(() => {
			toast.error("Failed to load report data.")
		}).finally(() => setLoading(false))
	}, [interestId])

	async function handleDownloadPdf() {
		setDownloadingPdf(true)
		try {
			const url = await getSponsorshipDealReportPdfUrl(interestId)
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
			const key = await uploadSponsorshipDealReportImage(file, interestId)
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
				status: reportStatus || "PENDING",
				revisionNote: ""
			})

			const saved = await upsertSponsorshipDealReport(interestId, {
				summary: summaryData,
				notes: "",
				proofKeys: images.map((img) => img.key).filter((k): k is string => !!k),
			})
			toast.success(report ? "Report saved." : "Report submitted.")
			setReport(saved)
			setIsEditing(false)
			onClose()
		} catch {
			toast.error("Failed to save the report.")
		} finally {
			setSaving(false)
		}
	}

	async function handleBrandAction(status: "APPROVED" | "REVISION_REQUESTED") {
		setSaving(true)
		try {
			const summaryData = JSON.stringify({
				projectName,
				date,
				venue,
				time,
				guestCount,
				ageRange,
				deliverables: deliverablesList,
				videoLinks,
				socialLinks,
				status,
				revisionNote: status === "REVISION_REQUESTED" ? revisionNote.trim() : ""
			})

			const saved = await upsertSponsorshipDealReport(interestId, {
				summary: summaryData,
				notes: status === "REVISION_REQUESTED" ? revisionNote.trim() : "",
				proofKeys: images.map((img) => img.key).filter((k): k is string => !!k),
			})
			if (status === "APPROVED") {
				await sendSponsorshipChatMessage(interestId, { content: "report approved, deal is closed", messageType: "SYSTEM" }).catch(() => null)
			}
			toast.success(status === "APPROVED" ? "Report approved, deal is closed!" : "Revision request sent.")
			setReport(saved)
			setReportStatus(status)
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
		REVISION_REQUESTED: { label: "Revision Requested", color: "bg-red-50 text-red-700 border-red-300" }
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
			<div className="bg-white rounded-[24px] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg flex flex-col max-h-[90vh]">
				<div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-black shrink-0 bg-neutral-50 rounded-t-[21px]">
					<div className="flex items-center gap-3">
						<p className="text-lg font-black text-black">📝 Deliverables Report</p>
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
						<button onClick={onClose} className="text-xl font-black text-black/40 hover:text-black" aria-label="Close">×</button>
					</div>
				</div>

				{loading ? (
					<div className="px-6 py-10 text-center text-sm font-semibold text-black/40">Loading…</div>
				) : role === "BRAND" && !report ? (
					<div className="px-6 py-10 text-center text-sm font-semibold text-black/40">
						The community hasn&apos;t submitted a deliverables report yet.
					</div>
				) : (
					<>
						<div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
							{reportStatus === "REVISION_REQUESTED" && revisionNote && (
								<div className="bg-red-50 border-2 border-red-300 rounded-xl p-3 text-xs font-semibold text-red-800">
									<p className="font-bold text-red-900 mb-0.5">Revision Requested By Brand:</p>
									{revisionNote}
								</div>
							)}

							<div className="grid grid-cols-2 gap-3">
								<Field label="Project Name">
									<input
										value={projectName}
										disabled={role === "BRAND" || !isEditing}
										onChange={(e) => setProjectName(e.target.value)}
										className={inputClass}
										placeholder="Project Name"
									/>
								</Field>
								<Field label="Date">
									<input
										value={date}
										disabled={role === "BRAND" || !isEditing}
										onChange={(e) => setDate(e.target.value)}
										className={inputClass}
										placeholder="e.g. Oct 24, 2026"
									/>
								</Field>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<Field label="Venue">
									<input
										value={venue}
										disabled={role === "BRAND" || !isEditing}
										onChange={(e) => setVenue(e.target.value)}
										className={inputClass}
										placeholder="Venue"
									/>
								</Field>
								<Field label="Time">
									<input
										value={time}
										disabled={role === "BRAND" || !isEditing}
										onChange={(e) => setTime(e.target.value)}
										className={inputClass}
										placeholder="Time"
									/>
								</Field>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<Field label="Guest Count">
									<input
										value={guestCount}
										disabled={role === "BRAND" || !isEditing}
										onChange={(e) => setGuestCount(e.target.value)}
										className={inputClass}
										placeholder="Guest Count"
									/>
								</Field>
								<Field label="Age (Range)">
									<input
										value={ageRange}
										disabled={role === "BRAND" || !isEditing}
										onChange={(e) => setAgeRange(e.target.value)}
										className={inputClass}
										placeholder="e.g. 18-25"
									/>
								</Field>
							</div>

							{deliverablesList.length > 0 && (
								<Field label="Deliverables met (tick mark)">
									<div className="flex flex-col gap-2 bg-neutral-50 p-3 rounded-xl border-[3px] border-black">
										{deliverablesList.map((item, idx) => (
											<label key={idx} className="flex items-center gap-2.5 cursor-pointer select-none">
												<input
													type="checkbox"
													checked={item.checked}
													disabled={role === "BRAND" || !isEditing}
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

							<Field label="Proof Photos (Upto 5)">
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
											{role === "HOST" && isEditing && (
												<button
													type="button"
													onClick={() => removeImage(i)}
													aria-label="Remove image"
													className="absolute top-0.5 right-0.5 size-4 rounded-full bg-black/75 text-white text-[10px] flex items-center justify-center leading-none"
												>
													×
												</button>
											)}
										</div>
									))}
									{role === "HOST" && isEditing && images.length < 5 && (
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

							<Field label="Video Links (Upto 5)">
								<div className="flex flex-col gap-2">
									{videoLinks.map((link, idx) => (
										<div key={idx} className="flex items-center gap-2">
											<input
												value={link}
												disabled={role === "BRAND" || !isEditing}
												onChange={(e) => {
													const updated = [...videoLinks]
													updated[idx] = e.target.value
													setVideoLinks(updated)
												}}
												placeholder="https://youtube.com/..."
												className={inputClass}
											/>
											{role === "HOST" && isEditing && (
												<button
													type="button"
													onClick={() => setVideoLinks((prev) => prev.filter((_, i) => i !== idx))}
													className="px-2 py-1 bg-red-100 border-2 border-black rounded-lg text-red-600 font-bold hover:bg-red-200 shrink-0"
												>
													✕
												</button>
											)}
										</div>
									))}
									{role === "HOST" && isEditing && videoLinks.length < 5 && (
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

							<Field label="Social Links (Upto 5)">
								<div className="flex flex-col gap-2">
									{socialLinks.map((link, idx) => (
										<div key={idx} className="flex items-center gap-2">
											<input
												value={link}
												disabled={role === "BRAND" || !isEditing}
												onChange={(e) => {
													const updated = [...socialLinks]
													updated[idx] = e.target.value
													setSocialLinks(updated)
												}}
												placeholder="https://instagram.com/..."
												className={inputClass}
											/>
											{role === "HOST" && isEditing && (
												<button
													type="button"
													onClick={() => setSocialLinks((prev) => prev.filter((_, i) => i !== idx))}
													className="px-2 py-1 bg-red-100 border-2 border-black rounded-lg text-red-600 font-bold hover:bg-red-200 shrink-0"
												>
													✕
												</button>
											)}
										</div>
									))}
									{role === "HOST" && isEditing && socialLinks.length < 5 && (
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

						{role === "HOST" && reportStatus !== "APPROVED" && (
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
											className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-black text-xs border-[2.5px] border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer select-none disabled:opacity-50"
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

						{role === "BRAND" && reportStatus !== "APPROVED" && (
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
												onClick={() => handleBrandAction("REVISION_REQUESTED")}
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
											className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-neutral-50 text-[#EE2C2C] font-black text-xs border-[2.5px] border-[#EE2C2C] shadow-[2.5px_2.5px_0px_0px_#EE2C2C] hover:shadow-[1px_1px_0px_0px_#EE2C2C] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer select-none"
										>
											<svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
												<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
												<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
											</svg>
											<span>Request Revision</span>
										</button>
										<button
											type="button"
											onClick={() => handleBrandAction("APPROVED")}
											disabled={saving}
											className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-black text-xs border-[2.5px] border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer select-none disabled:opacity-50"
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
