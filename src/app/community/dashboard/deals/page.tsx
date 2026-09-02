"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import clsx from "clsx"
import { toast } from "sonner"
import { useHostStore } from "@/store/hostStore"
import {
	getMySponsorshipChats,
	getSponsorshipDeal,
	getSponsorshipDealReport,
	type SponsorshipDeal,
} from "@/lib/api"
import { DealDetailsModal, DealReportModal } from "@/components/sponsorship/DealPanel"

type LockedDealItem = SponsorshipDeal & {
	proposalName: string
	brandName: string
	brandLogo?: string | null
	sponsorshipInterestId: string
	hasReport: boolean
	isCampaign: boolean
	campaignId?: string | null
	proposalId?: string | null
}

export default function CommunityLockedDealsPage() {
	const router = useRouter()
	const { profile } = useHostStore()
	const hostId = profile?.id

	const [lockedDeals, setLockedDeals] = useState<LockedDealItem[]>([])
	const [loading, setLoading] = useState(true)
	const [loadingDealDetailId, setLoadingDealDetailId] = useState<string | null>(null)
	const [selectedDeal, setSelectedDeal] = useState<{ deal: LockedDealItem; interestId: string } | null>(null)
	const [selectedInterestIdForReport, setSelectedInterestIdForReport] = useState<string | null>(null)

	useEffect(() => {
		if (!hostId) return
		setLoading(true)

		getMySponsorshipChats("ACCEPTED", "HOST")
			.then(async (threads) => {
				const dealsPromises = threads.map(async (thread) => {
					try {
						const deal = await getSponsorshipDeal(thread.id)
						if (deal && deal.status === "APPROVED") {
							let hasReport = false
							try {
								const rep = await getSponsorshipDealReport(thread.id)
								if (rep) hasReport = true
							} catch {}
							const isCampaign = Boolean(thread.campaignId)
							return {
								...deal,
								proposalName: thread.proposalName || (isCampaign ? "Campaign Deal" : "Untitled Project"),
								brandName: thread.counterpartName,
								brandLogo: thread.counterpartAvatarUrl,
								sponsorshipInterestId: thread.id,
								hasReport,
								isCampaign,
								campaignId: thread.campaignId,
								proposalId: thread.proposalId ?? thread.sponsorshipProposalId,
							}
						}
					} catch (e) {
						console.error("error fetching deal", e)
					}
					return null
				})
				const resolvedDeals = await Promise.all(dealsPromises)
				setLockedDeals(resolvedDeals.filter((d): d is NonNullable<typeof d> => d !== null))
			})
			.catch((err) => {
				console.error("Failed to fetch accepted chats/deals", err)
			})
			.finally(() => {
				setLoading(false)
			})
	}, [hostId])

	const sponsorshipDeals = lockedDeals.filter((d) => !d.isCampaign)
	const campaignDeals = lockedDeals.filter((d) => d.isCampaign)

	function renderDealCard(deal: LockedDealItem) {
		const isPaid = deal.paymentStatus === "PAID"
		return (
			<div
				key={deal.id}
				onClick={(e) => {
					const target = e.target as HTMLElement
					if (target.closest("button") || target.closest("a")) return
					router.push(`/community/dashboard/chats?type=${deal.isCampaign ? "campaign" : "sponsorship"}&interestId=${deal.sponsorshipInterestId}`)
				}}
				className="group relative cursor-pointer bg-white border-[3px] border-black rounded-[20px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all p-4 sm:p-5 flex flex-col justify-between"
			>
				<div>
					<div className="flex items-center justify-between gap-2 mb-2">
						<div className="flex items-center gap-2.5 min-w-0">
							<div className="w-9 h-9 rounded-full border-[2px] border-black overflow-hidden bg-neutral-100 flex items-center justify-center shrink-0">
								{deal.brandLogo ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img
										src={deal.brandLogo}
										alt={deal.brandName}
										className="w-full h-full object-cover"
									/>
								) : (
									<span className="font-bold text-xs text-black/60">
										{deal.brandName.charAt(0).toUpperCase()}
									</span>
								)}
							</div>
							<div className="min-w-0">
								<span className="font-heading font-black text-sm sm:text-base text-black truncate block">
									{deal.brandName}
								</span>
								<span className="text-[10px] font-bold text-black/50 uppercase">
									{deal.isCampaign ? "Brand Campaign" : "Sponsorship"}
								</span>
							</div>
						</div>
						{isPaid && (
							<span className="px-2 py-0.5 border-2 border-black rounded-full text-[8px] font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] bg-green-400 text-black">
								PAID
							</span>
						)}
					</div>
					<p className="text-xs text-black/60 font-semibold truncate mt-2">
						{deal.isCampaign ? "Campaign: " : "Project: "}
						<span className="text-black font-bold">{deal.projectName || deal.proposalName}</span>
					</p>
				</div>
				<div className="mt-4 pt-3 border-t-2 border-black/5 flex flex-col gap-2">
					<div className="flex justify-between items-center text-xs font-black text-black">
						<span>Amount:</span>
						<span>₹{Number(deal.totalAmount ?? deal.sponsorshipAmount).toLocaleString("en-IN")}</span>
					</div>
					<div className={clsx("grid gap-2 mt-1", deal.hasReport ? "grid-cols-2" : "grid-cols-1")}>
						<button
							type="button"
							disabled={loadingDealDetailId === deal.id}
							onClick={async () => {
								setLoadingDealDetailId(deal.id)
								try {
									const dealObj = await getSponsorshipDeal(deal.sponsorshipInterestId)
									if (dealObj) {
										setSelectedDeal({ deal: { ...deal, ...dealObj }, interestId: deal.sponsorshipInterestId })
									} else {
										toast.error("Deal terms are not active yet.")
									}
								} catch {
									toast.error("Failed to load deal terms.")
								} finally {
									setLoadingDealDetailId(null)
								}
							}}
							className="py-2 px-2 bg-[#FFC940] text-black border-2 border-black rounded-xl text-[10px] font-black tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all select-none text-center cursor-pointer"
						>
							{loadingDealDetailId === deal.id ? "..." : "Locked Deal"}
						</button>
						{deal.hasReport && (
							<button
								type="button"
								onClick={() => {
									setSelectedInterestIdForReport(deal.sponsorshipInterestId)
								}}
								className="py-2 px-2 bg-white text-black border-2 border-black rounded-xl text-[10px] font-black tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all select-none text-center cursor-pointer"
							>
								Report
							</button>
						)}
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="flex flex-col min-h-full bg-white">
			{/* Top Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 lg:px-8 py-5 border-b border-black/10 gap-2">
				<div>
					<h1 className="text-2xl font-heading font-black text-black">Locked Deals</h1>
					<p className="text-xs font-semibold text-black/50 mt-0.5">
						All locked sponsorship agreements, campaign deals, deliverables reports, and payment statuses.
					</p>
				</div>
				<Link
					href="/community/dashboard/chats"
					className="text-xs font-black text-[#6C32D1] hover:text-[#6C32D1]/80 inline-flex items-center gap-1 self-start sm:self-auto"
				>
					Go to Chats &gt;
				</Link>
			</div>

			<div className="px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full flex-1 flex flex-col">
				{loading ? (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{[1, 2].map((col) => (
							<div key={col} className="flex flex-col gap-4">
								<div className="h-7 bg-black/10 rounded-lg w-48 animate-pulse" />
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									{[1, 2].map((i) => (
										<div
											key={i}
											className="border-[3px] border-black rounded-[20px] bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-pulse flex flex-col gap-4"
										>
											<div className="flex items-center gap-3">
												<div className="size-10 rounded-full bg-black/10 shrink-0" />
												<div className="flex-1 flex flex-col gap-1.5">
													<div className="h-4 bg-black/10 rounded w-28" />
													<div className="h-3 bg-black/10 rounded w-20" />
												</div>
											</div>
											<div className="h-4 bg-black/10 rounded w-full" />
											<div className="h-8 bg-black/10 rounded-xl w-full mt-2" />
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				) : lockedDeals.length === 0 ? (
					<div className="my-auto py-16 border-[3px] border-dashed border-black/30 rounded-[28px] bg-white flex flex-col items-center justify-center text-center p-8 gap-3 max-w-md mx-auto w-full">
						<div className="size-14 rounded-full bg-[#FFC940] border-[3px] border-black flex items-center justify-center text-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
							🔒
						</div>
						<h2 className="text-lg font-heading font-black text-black">No locked deals yet</h2>
						<p className="text-xs font-semibold text-black/50 leading-relaxed">
							Once you finalize and lock sponsorship or campaign terms with a brand in your chats, your active agreements and reports will appear here.
						</p>
						<Link
							href="/community/dashboard/chats"
							className="mt-2 py-2.5 px-5 bg-[#FFC940] text-black border-[3px] border-black rounded-2xl text-xs font-black tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
						>
							OPEN CHATS
						</Link>
					</div>
				) : (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
						{/* Column 1: Sponsorship Deals */}
						<div className="flex flex-col gap-4">
							<div className="flex items-center justify-between pb-3 border-b-[3px] border-black">
								<div className="flex items-center gap-2">
									<span className="text-lg">🤝</span>
									<h2 className="text-base font-black text-black">Sponsorship Deals</h2>
									<span className="px-2 py-0.5 rounded-full bg-[#FFC940] text-black text-xs font-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
										{sponsorshipDeals.length}
									</span>
								</div>
							</div>

							{sponsorshipDeals.length === 0 ? (
								<div className="py-12 border-2 border-dashed border-black/20 rounded-[20px] bg-neutral-50 flex flex-col items-center justify-center text-center p-6 gap-2">
									<p className="text-xs font-bold text-black/40">No locked sponsorship proposal deals yet</p>
								</div>
							) : (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									{sponsorshipDeals.map(renderDealCard)}
								</div>
							)}
						</div>

						{/* Column 2: Campaign Deals */}
						<div className="flex flex-col gap-4">
							<div className="flex items-center justify-between pb-3 border-b-[3px] border-black">
								<div className="flex items-center gap-2">
									<span className="text-lg">🚀</span>
									<h2 className="text-base font-black text-black">Campaign Deals</h2>
									<span className="px-2 py-0.5 rounded-full bg-[#EE2C2C] text-white text-xs font-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
										{campaignDeals.length}
									</span>
								</div>
							</div>

							{campaignDeals.length === 0 ? (
								<div className="py-12 border-2 border-dashed border-black/20 rounded-[20px] bg-neutral-50 flex flex-col items-center justify-center text-center p-6 gap-2">
									<p className="text-xs font-bold text-black/40">No locked brand campaign deals yet</p>
								</div>
							) : (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									{campaignDeals.map(renderDealCard)}
								</div>
							)}
						</div>
					</div>
				)}
			</div>

			{selectedDeal && (
				<DealDetailsModal
					interestId={selectedDeal.interestId}
					deal={selectedDeal.deal}
					role="HOST"
					isCampaign={selectedDeal.deal.isCampaign}
					campaignId={selectedDeal.deal.campaignId ?? undefined}
					onClose={() => setSelectedDeal(null)}
					onUpdated={(updatedDeal) => {
						setSelectedDeal({ deal: { ...selectedDeal.deal, ...updatedDeal }, interestId: selectedDeal.interestId })
					}}
				/>
			)}

			{selectedInterestIdForReport && (
				<DealReportModal
					interestId={selectedInterestIdForReport}
					role="HOST"
					onClose={() => setSelectedInterestIdForReport(null)}
				/>
			)}
		</div>
	)
}
