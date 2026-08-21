"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { getSponsorshipBilling, getSponsorshipDealInvoiceUrl, type SponsorshipDealBillingRow } from "@/lib/api"
import { payForSponsorshipDeal, getDealPaymentDisplayStatus, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_COLOR } from "@/components/sponsorship/DealPanel"
import clsx from "clsx"

function formatAmount(amount: string | number | null) {
	if (amount == null) return "—"
	return `₹${Number(amount).toLocaleString("en-IN")}`
}

function formatDate(value: string | null) {
	if (!value) return "—"
	return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function BreakdownModal({ row, onClose }: { row: SponsorshipDealBillingRow; onClose: () => void }) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
			<div className="bg-white rounded-[24px] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full max-w-sm flex flex-col">
				<div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-black">
					<p className="text-lg font-black text-black">Payment Breakdown</p>
					<button onClick={onClose} className="text-xl font-black text-black/40 hover:text-black" aria-label="Close">×</button>
				</div>
				<div className="px-6 py-4 flex flex-col gap-2 text-sm">
					<div className="flex justify-between"><span className="text-black/50 font-semibold">Sponsorship Amount</span><span className="font-bold">{formatAmount(row.sponsorshipAmount)}</span></div>
					<div className="flex justify-between"><span className="text-black/50 font-semibold">Platform Fee (5%)</span><span className="font-bold">{formatAmount(row.platformFeeAmount)}</span></div>
					<div className="flex justify-between"><span className="text-black/50 font-semibold">GST</span><span className="font-bold">{formatAmount(row.taxAmount)}</span></div>
					<div className="flex justify-between pt-2 border-t-2 border-black/10 mt-1"><span className="font-black">Total Amount</span><span className="font-black">{formatAmount(row.totalAmount)}</span></div>
				</div>
			</div>
		</div>
	)
}

export default function BrandBillingPage() {
	const [rows, setRows] = useState<SponsorshipDealBillingRow[]>([])
	const [loading, setLoading] = useState(true)
	const [payingId, setPayingId] = useState<string | null>(null)
	const [breakdownRow, setBreakdownRow] = useState<SponsorshipDealBillingRow | null>(null)

	function load() {
		setLoading(true)
		getSponsorshipBilling()
			.then(setRows)
			.catch(() => toast.error("Failed to load billing."))
			.finally(() => setLoading(false))
	}

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		load()
	}, [])

	async function handlePay(row: SponsorshipDealBillingRow) {
		setPayingId(row.id)
		try {
			await payForSponsorshipDeal(row.sponsorshipInterestId, row.projectName, () => {
				toast.success("Payment successful!")
				load()
			})
		} catch {
			toast.error("Failed to start payment.")
		} finally {
			setPayingId(null)
		}
	}

	async function handleDownloadInvoice(row: SponsorshipDealBillingRow) {
		try {
			const url = await getSponsorshipDealInvoiceUrl(row.sponsorshipInterestId)
			window.open(url, "_blank")
		} catch {
			toast.error("Invoice not available yet.")
		}
	}

	return (
		<div className="flex flex-col min-h-full bg-white">
			<div className="flex justify-between items-center px-8 py-4 border-b border-black/10 shrink-0">
				<p className="text-sm font-semibold text-black/50 mx-auto">
					Welcome to <span className="text-[#EE2C2C] font-bold">Meetday</span>
				</p>
			</div>

			<div className="px-4 lg:px-6 py-8 flex-1 flex flex-col gap-6 max-w-5xl mx-auto w-full">
				<div>
					<h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-black leading-tight">Billing</h1>
					<p className="text-sm font-semibold text-black/50 mt-1.5">Payments for all your locked sponsorship deals</p>
				</div>

				{loading ? (
					<div className="flex flex-col gap-3">
						{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
					</div>
				) : rows.length === 0 ? (
					<div className="rounded-2xl border-[3px] border-dashed border-black/20 p-8 text-center">
						<p className="text-sm font-bold text-black/50">No locked deals yet — once a deal is locked, it&apos;ll show up here for payment.</p>
					</div>
				) : (
					<div className="flex flex-col gap-3">
						{rows.map((row) => {
							const displayStatus = getDealPaymentDisplayStatus(row)
							return (
								<div key={row.id} className="bg-white border-[3px] border-black rounded-[20px] p-4 flex flex-col md:flex-row md:items-center gap-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 flex-wrap">
											<p className="font-black text-black truncate">{row.communityName}</p>
											<span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0", PAYMENT_STATUS_COLOR[displayStatus])}>
												{PAYMENT_STATUS_LABEL[displayStatus]}
											</span>
										</div>
										<p className="text-xs font-semibold text-black/50 truncate">{row.proposalName}</p>
										<p className="text-[11px] font-semibold text-black/30 mt-0.5">
											Locked on {formatDate(row.approvedAt)}
											{displayStatus !== "PAID" && row.paymentExpiresAt && ` · Due by ${formatDate(row.paymentExpiresAt)}`}
											{displayStatus === "PAID" && row.paidAt && ` · Paid on ${formatDate(row.paidAt)}`}
										</p>
									</div>
									<div className="flex items-center gap-2 shrink-0">
										<Button size="sm" variant="secondary" onClick={() => setBreakdownRow(row)}>View Breakdown</Button>
										{displayStatus === "PAID" ? (
											<Button size="sm" variant="secondary" onClick={() => handleDownloadInvoice(row)}>Download Invoice</Button>
										) : (
											<Button size="sm" onClick={() => handlePay(row)} disabled={payingId === row.id}>
												{payingId === row.id ? "…" : `💳 Pay ${formatAmount(row.totalAmount ?? row.sponsorshipAmount)}`}
											</Button>
										)}
									</div>
								</div>
							)
						})}
					</div>
				)}
			</div>

			{breakdownRow && <BreakdownModal row={breakdownRow} onClose={() => setBreakdownRow(null)} />}
		</div>
	)
}
