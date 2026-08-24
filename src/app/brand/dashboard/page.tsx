"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { Icon } from "@/components/ui/Icon"
import { useBrandStore } from "@/store/brandStore"
import { Skeleton } from "@/components/ui/Skeleton"
import {
	getAllPublishedSponsorships,
	getBrandCommunities,
	getSponsorshipBilling,
	getMySponsorshipChats,
	getSponsorshipDeal,
	getSponsorshipDealReport,
	getMyCampaigns,
	type PublishedSponsorshipProposal,
	type BrandCommunity,
	type SponsorshipDealBillingRow,
	type SponsorshipDeal,
	type Campaign,
} from "@/lib/api"
import clsx from "clsx"

import CalendarOutSvg from "@/icons/outlined/calendar.svg"
import DocumentTextSvg from "@/icons/outlined/document-text.svg"
import UsersGroupSvg from "@/icons/outlined/users-group-2.svg"
import { CommunityCard } from "./communities/page"
import { DealDetailsModal, DealReportModal } from "@/components/sponsorship/DealPanel"


export default function BrandDashboardWelcomePage() {
	const router = useRouter()
	const { profile } = useBrandStore()
	const displayName = profile?.brandName || "Brand"

	const [proposals, setProposals] = useState<PublishedSponsorshipProposal[]>([])
	const [communities, setCommunities] = useState<BrandCommunity[]>([])
	const [lockedDeals, setLockedDeals] = useState<(SponsorshipDealBillingRow & { communityLogo?: string | null; hasReport?: boolean })[]>([])

	// Modal states for Lock Deal and Report forms
	const [selectedDeal, setSelectedDeal] = useState<{ deal: SponsorshipDeal; interestId: string } | null>(null)
	const [selectedInterestIdForReport, setSelectedInterestIdForReport] = useState<string | null>(null)
	const [loadingDealDetailId, setLoadingDealDetailId] = useState<string | null>(null)
	const [loadingProposals, setLoadingProposals] = useState(true)
	const [loadingCommunities, setLoadingCommunities] = useState(true)
	const [loadingLockedDeals, setLoadingLockedDeals] = useState(true)
	const [campaigns, setCampaigns] = useState<Campaign[]>([])
	const [loadingCampaigns, setLoadingCampaigns] = useState(true)

	useEffect(() => {
		setLoadingProposals(true)
		getAllPublishedSponsorships()
			.then((res) => {
				setProposals(res.proposals || [])
			})
			.catch((err) => {
				console.error("Failed to fetch proposals for dashboard", err)
			})
			.finally(() => {
				setLoadingProposals(false)
			})

		setLoadingCommunities(true)
		getBrandCommunities()
			.then((res) => {
				setCommunities(res.communities || [])
			})
			.catch((err) => {
				console.error("Failed to fetch communities for dashboard", err)
			})
			.finally(() => {
				setLoadingCommunities(false)
			})

		setLoadingLockedDeals(true)
		Promise.all([
			getSponsorshipBilling().catch(() => []),
			getMySponsorshipChats().catch(() => []), // fetch all chats to map logos reliably
		])
			.then(async ([billing, chats]) => {
				const mappedPromises = billing.map(async (b) => {
					const chat = chats.find((c) => c.id === b.sponsorshipInterestId)
					let hasReport = false
					try {
						const rep = await getSponsorshipDealReport(b.sponsorshipInterestId)
						if (rep) {
							hasReport = true
						}
					} catch {}
					return {
						...b,
						communityLogo: chat ? chat.counterpartAvatarUrl : null,
						hasReport,
					}
				})
				const resolved = await Promise.all(mappedPromises)
				setLockedDeals(resolved)
			})
			.catch((err) => {
				console.error("Failed to fetch billing/locked deals for brand dashboard", err)
			})
			.finally(() => {
				setLoadingLockedDeals(false)
			})

		setLoadingCampaigns(true)
		getMyCampaigns()
			.then((res) => {
				const approved = (res || []).filter((c) => c.status === "PUBLISHED")
				setCampaigns(approved)
			})
			.catch((err) => {
				console.error("Failed to fetch campaigns for dashboard", err)
			})
			.finally(() => {
				setLoadingCampaigns(false)
			})
	}, [])

	return (
		<div className="flex flex-col min-h-full bg-white">
			{/* Top Nav / Subheader */}
			<div className="flex justify-between items-center px-8 py-4 border-b border-black/10 shrink-0">
				<p className="text-sm font-semibold text-black/50 mx-auto">
					Welcome to <span className="text-[#EE2C2C] font-bold">Meetday</span>
				</p>
			</div>

			<div className="px-4 lg:px-6 py-4 max-w-6xl mx-auto w-full flex-1 flex flex-col gap-6">
				{/* Welcome Header */}
				<div className="text-center mt-2">
					<h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-black leading-tight">
						Hey {displayName}, <span className="text-[#EE2C2C]">what are we sponsoring today?</span>
					</h1>
					<p className="text-sm font-semibold text-black/50 mt-2 max-w-2xl mx-auto">
						Browse sponsorship opportunities or check out communities!
					</p>
				</div>

				{/* Two CTAs grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
					{/* CTA 1: Browse Proposals */}
					<div className="bg-white border-[3px] border-black rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col relative h-full min-h-[220px] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
						<div className="flex items-center justify-between w-full mb-4">
							<h2 className="text-lg font-heading font-black text-black">
								Browse Proposals
							</h2>
							<span className="bg-[#1E1B4B] text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider badge-zoom-pulse">
								LIVE
							</span>
						</div>
						<p className="text-xs font-semibold text-black/50 mb-8 flex-grow leading-relaxed">
							Browse active sponsorship proposals from top communities and secure offline marketing opportunities.
						</p>
						<Link
							href="/brand/dashboard/proposals"
							className="w-full py-3 bg-[#FFC940] text-black border-[3px] border-black rounded-2xl font-black text-center text-xs tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:bg-[#EE2C2C] hover:text-white transition-all flex items-center justify-center gap-2 select-none"
						>
							START EXPLORING
							<span className="text-base font-bold">➔</span>
						</Link>
					</div>

					{/* CTA 2: Create Campaign */}
					<div className="bg-white border-[3px] border-black rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col relative h-full min-h-[220px] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
						<div className="flex items-center justify-between w-full mb-4">
							<h2 className="text-lg font-heading font-black text-black">
								Create a Campaign
							</h2>
							<span className="bg-[#1E1B4B] text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider badge-zoom-pulse">
								LIVE
							</span>
						</div>
						<p className="text-xs font-semibold text-black/50 mb-8 flex-grow leading-relaxed">
							Post a sponsorship brief detailing your requirements for offline marketing and invite communities to apply.
						</p>
						<Link
							href="/brand/dashboard/campaigns"
							className="w-full py-3 bg-[#FFC940] text-black border-[3px] border-black rounded-2xl font-black text-center text-xs tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:bg-[#EE2C2C] hover:text-white transition-all flex items-center justify-center gap-2 select-none"
						>
							CREATE BRIEF
							<span className="text-base font-bold">➔</span>
						</Link>
					</div>
				</div>

				<style>{`
					@keyframes zoom-pulse {
						0%, 100% {
							transform: scale(1);
						}
						50% {
							transform: scale(1.15);
						}
					}
					.badge-zoom-pulse {
						animation: zoom-pulse 2s infinite ease-in-out;
						display: inline-block;
					}
				`}</style>

				<hr className="border-black/10 my-2" />

				{/* Overview Section */}
				<div className="flex flex-col gap-10 pb-8">
					{/* Row 0: Approved Campaigns */}
					{campaigns.length > 0 && (
						<div className="flex flex-col w-full">
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full mb-4 gap-2 sm:gap-0">
								<div>
									<h2 className="text-xl font-heading font-black text-black">My Active Campaigns</h2>
									<p className="text-xs font-semibold text-black/50 mt-1">Your approved and running campaigns.</p>
								</div>
								<Link href="/brand/dashboard/campaigns" className="text-xs font-black text-[#6C32D1] hover:text-[#6C32D1]/80 inline-flex items-center gap-1 self-start sm:self-auto">
									Manage Campaigns &gt;
								</Link>
							</div>

							<div className="flex flex-row overflow-x-auto gap-4 pb-4 w-full">
								{campaigns.map((c) => {
									const displayDates = `${new Date(c.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} - ${new Date(c.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
									return (
										<Link
											key={c.id}
											href={`/brand/dashboard/campaigns?campaignId=${c.id}`}
											className="group relative cursor-pointer bg-white border-[3px] border-black rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all p-4 w-[320px] shrink-0 flex flex-col justify-between"
										>
											<div className="flex flex-col gap-1 min-w-0">
												<div className="flex items-center justify-between gap-2">
													<h3 className="font-heading font-black text-base text-black truncate group-hover:text-[#EE2C2C] transition-colors">
														{c.name}
													</h3>
													<span className="text-[7px] font-black px-1.5 py-0.5 border-[2px] border-black rounded-full uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] bg-green-400 text-black shrink-0">
														Active
													</span>
												</div>
												<p className="text-[11px] font-bold text-black/50">
													Goal: {c.goal}
												</p>
												<p className="text-[11px] font-semibold text-black/70 mt-1 line-clamp-2 leading-relaxed">
													{c.description || "No description provided."}
												</p>
											</div>

											<div className="flex justify-between items-center mt-4 pt-3 border-t-2 border-black/5">
												<span className="text-[10px] font-black bg-[#6C32D1] text-white px-2 py-0.5 border border-black rounded-full shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
													{displayDates}
												</span>
												<span className="text-xs font-black text-[#EE2C2C]">
													{c.budgetCurrency} {Number(c.budgetAmount).toLocaleString()}
												</span>
											</div>
										</Link>
									)
								})}
							</div>
						</div>
					)}

					{/* Row 1: Proposals */}
					<div className="flex flex-col w-full">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full mb-4 gap-2 sm:gap-0">
							<div>
								<h2 className="text-xl font-heading font-black text-black">Proposals</h2>
								<p className="text-xs font-semibold text-black/50 mt-1">Browse active sponsorship proposals.</p>
							</div>
							<Link href="/brand/dashboard/proposals" className="text-xs font-black text-[#6C32D1] hover:text-[#6C32D1]/80 inline-flex items-center gap-1 self-start sm:self-auto">
								View All Proposals &gt;
							</Link>
						</div>

						{loadingProposals ? (
							<div className="flex flex-col divide-y divide-black/10 border-[3px] border-black rounded-[24px] bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
								{Array.from({ length: 2 }).map((_, i) => (
									<div key={i} className="flex items-center gap-4 px-5 h-20 animate-pulse bg-white">
										<div className="size-12 rounded-xl bg-black/5 shrink-0" />
										<div className="flex-1 flex flex-col gap-1.5 min-w-0">
											<div className="h-4 bg-black/5 rounded w-32" />
											<div className="h-3 bg-black/5 rounded w-20" />
										</div>
									</div>
								))}
							</div>
						) : proposals.length === 0 ? (
							<div className="w-full border-[3px] border-dashed border-black/30 rounded-[24px] bg-white py-12 flex flex-col items-center justify-center text-center gap-2">
								<p className="text-sm font-black text-black/80">No active sponsorships yet</p>
								<p className="text-[11px] font-semibold text-black/40">Check back later for new sponsorship opportunities.</p>
							</div>
						) : (
							<div className="flex flex-row overflow-x-auto gap-4 pb-4 w-full">
								{proposals.map((prop) => {
									const imgUrl = prop.imageUrl || null
									const displayDate = prop.eventDate ? new Date(prop.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""

									return (
										<Link
											key={prop.id}
											href={`/brand/dashboard/proposal/${prop.id}`}
											className="group relative cursor-pointer bg-white border-[3px] border-black rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all overflow-hidden flex flex-row w-[380px] shrink-0"
										>
											{/* Image / Logo */}
											<div className="relative w-[120px] aspect-square shrink-0 overflow-hidden bg-slate-50 border-r-[3px] border-black rounded-l-[17px]">
												{imgUrl ? (
													// eslint-disable-next-line @next/next/no-img-element
													<img
														src={imgUrl}
														alt={prop.name || "Proposal"}
														className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 rounded-l-[14px]"
													/>
												) : (
													<div className="w-full h-full bg-slate-100 flex items-center justify-center text-black/40 font-black text-sm">
														{prop.name ? prop.name.substring(0, 2).toUpperCase() : "MD"}
													</div>
												)}

												{/* Status Badge */}
												<span className="absolute top-2 left-2 text-[7px] font-black px-1.5 py-0.5 border-[2px] border-black rounded-full uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] bg-green-400 text-black">
													Published
												</span>
											</div>

											{/* Content & Footer info */}
											<div className="flex-1 p-3 flex flex-col justify-between min-w-0">
												<div className="flex flex-col gap-1">
													<h3 className="font-heading font-black text-base text-black truncate group-hover:text-[#EE2C2C] transition-colors">
														{prop.name}
													</h3>
													<p className="text-[11px] font-bold text-black/50 truncate">
														{prop.city} • {prop.venue}
													</p>
													<p className="text-[11px] font-semibold text-black/70 line-clamp-2 mt-0.5 leading-normal">
														{prop.about}
													</p>
												</div>

												<div className="flex flex-wrap gap-1.5 mt-2">
													{displayDate && (
														<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-[#6C32D1] text-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
															{displayDate}
														</span>
													)}
													<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-[#EE2C2C] text-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
														{prop.guestCount} Guests
													</span>
												</div>
											</div>
										</Link>
									)
								})}
							</div>
						)}
					</div>

					{/* Row 2: Communities */}
					<div className="flex flex-col w-full">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full mb-4 gap-2 sm:gap-0">
							<div>
								<h2 className="text-xl font-heading font-black text-black">Active Communities</h2>
								<p className="text-xs font-semibold text-black/50 mt-1">Discover communities on Meetday.</p>
							</div>
							<Link href="/brand/dashboard/communities" className="text-xs font-black text-[#6C32D1] hover:text-[#6C32D1]/80 inline-flex items-center gap-1 self-start sm:self-auto">
								View All Communities &gt;
							</Link>
						</div>

						{loadingCommunities ? (
							<div className="flex flex-col divide-y divide-black/10 border-[3px] border-black rounded-[24px] bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
								{Array.from({ length: 2 }).map((_, i) => (
									<div key={i} className="flex items-center gap-4 px-5 h-20 animate-pulse bg-white">
										<div className="size-12 rounded-xl bg-black/5 shrink-0" />
										<div className="flex-1 flex flex-col gap-1.5 min-w-0">
											<div className="h-4 bg-black/5 rounded w-32" />
											<div className="h-3 bg-black/5 rounded w-20" />
										</div>
									</div>
								))}
							</div>
						) : communities.length === 0 ? (
							<div className="w-full border-[3px] border-dashed border-black/30 rounded-[24px] bg-white py-12 flex flex-col items-center justify-center text-center gap-2">
								<p className="text-sm font-black text-black/80">No communities active yet</p>
								<p className="text-[11px] font-semibold text-black/40">Check back later for newly onboarded communities.</p>
							</div>
						) : (
							<div className="flex flex-row overflow-x-auto gap-6 pb-6 pt-2 px-2 w-full custom-scrollbar">
								{communities.map((comm) => (
									<Link key={comm.id} href={`/brand/dashboard/communities?communityId=${comm.id}`} className="block shrink-0 w-[180px]">
										<CommunityCard community={comm} />
									</Link>
								))}
							</div>
						)}
					</div>

					{/* Row 3: Locked Deals & Reports */}
					<div className="flex flex-col w-full">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full mb-4 gap-2 sm:gap-0">
							<div>
								<h2 className="text-xl font-heading font-black text-black">Locked Deals & Reports</h2>
								<p className="text-xs font-semibold text-black/50 mt-1">View locked deal terms and submitted deliverables reports.</p>
							</div>
							<Link href="/brand/dashboard/billing" className="text-xs font-black text-[#6C32D1] hover:text-[#6C32D1]/80 inline-flex items-center gap-1 self-start sm:self-auto">
								View Billing &gt;
							</Link>
						</div>

						{loadingLockedDeals ? (
							<div className="flex flex-col divide-y divide-black/10 border-[3px] border-black rounded-[24px] bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
								{Array.from({ length: 2 }).map((_, i) => (
									<div key={i} className="flex items-center gap-4 px-5 h-20 animate-pulse bg-white">
										<div className="size-12 rounded-xl bg-black/5 shrink-0" />
										<div className="flex-1 flex flex-col gap-1.5 min-w-0">
											<div className="h-4 bg-black/5 rounded w-32" />
											<div className="h-3 bg-black/5 rounded w-20" />
										</div>
									</div>
								))}
							</div>
						) : lockedDeals.length === 0 ? (
							<div className="w-full border-[3px] border-dashed border-black/30 rounded-[24px] bg-white py-12 flex flex-col items-center justify-center text-center gap-2">
								<p className="text-sm font-black text-black/80">No locked deals yet</p>
								<p className="text-[11px] font-semibold text-black/40">Once a deal is locked in chat, it will show up here.</p>
							</div>
						) : (
							<div className="flex flex-row overflow-x-auto gap-4 pb-4 w-full">
								{lockedDeals.map((deal) => {
									const isPaid = deal.paymentStatus === "PAID"
									return (
										<div
											key={deal.id}
											onClick={(e) => {
												const target = e.target as HTMLElement
												if (target.closest("button") || target.closest("a")) return
												router.push(`/brand/dashboard/chats?interestId=${deal.sponsorshipInterestId}`)
											}}
											className="group relative cursor-pointer bg-white border-[3px] border-black rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all p-4 w-[300px] shrink-0 flex flex-col justify-between"
										>
											<div>
												<div className="flex items-center justify-between gap-2 mb-2">
													<div className="flex items-center gap-2.5 min-w-0">
														<div className="w-8 h-8 rounded-full border-[2px] border-black overflow-hidden bg-neutral-100 flex items-center justify-center shrink-0">
															{deal.communityLogo ? (
																// eslint-disable-next-line @next/next/no-img-element
																<img
																	src={deal.communityLogo}
																	alt={deal.communityName}
																	className="w-full h-full object-cover"
																/>
															) : (
																<span className="font-bold text-xs text-black/60">
																	{deal.communityName.charAt(0).toUpperCase()}
																</span>
															)}
														</div>
														<span className="font-heading font-black text-base text-black truncate max-w-[150px]">
															{deal.communityName}
														</span>
													</div>
													{isPaid && (
														<span className="px-2 py-0.5 border-2 border-black rounded-full text-[8px] font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] bg-green-400 text-black">
															PAID
														</span>
													)}
												</div>
												<p className="text-xs text-black/50 font-semibold truncate mt-2">
													Project: {deal.proposalName}
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
																	setSelectedDeal({ deal: dealObj, interestId: deal.sponsorshipInterestId })
																} else {
																	toast.error("Deal terms are not active yet.")
																}
															} catch {
																toast.error("Failed to load deal terms.")
															} finally {
																setLoadingDealDetailId(null)
															}
														}}
														className="py-1.5 px-2 bg-[#FFC940] text-black border-2 border-black rounded-xl text-[10px] font-black tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all select-none text-center"
													>
														{loadingDealDetailId === deal.id ? "..." : "Locked Deal"}
													</button>
													{deal.hasReport && (
														<button
															type="button"
															onClick={() => {
																setSelectedInterestIdForReport(deal.sponsorshipInterestId)
															}}
															className="py-1.5 px-2 bg-white text-black border-2 border-black rounded-xl text-[10px] font-black tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all select-none text-center"
														>
															Report
														</button>
													)}
												</div>
											</div>
										</div>
									)
								})}
							</div>
						)}
					</div>
				</div>
			</div>

			{selectedDeal && (
				<DealDetailsModal
					interestId={selectedDeal.interestId}
					deal={selectedDeal.deal}
					role="BRAND"
					onClose={() => setSelectedDeal(null)}
					onUpdated={(updatedDeal) => {
						setSelectedDeal({ deal: updatedDeal, interestId: selectedDeal.interestId })
					}}
				/>
			)}

			{selectedInterestIdForReport && (
				<DealReportModal
					interestId={selectedInterestIdForReport}
					role="BRAND"
					onClose={() => setSelectedInterestIdForReport(null)}
				/>
			)}
		</div>
	)
}
