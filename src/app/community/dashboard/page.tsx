"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "@/lib/toast"
import { Icon } from "@/components/ui/Icon"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import { useDashboardStore } from "@/store/dashboardStore"
import { useHostStore } from "@/store/hostStore"
import type { DisplayEventStatus } from "@/types/event"
import { formatEventDateRange } from "@/lib/eventForm"
import { Skeleton } from "@/components/ui/Skeleton"
import { getProposals, type StoredProposal } from "./proposal/page"
import { getHostCommunityProfile, getMySponsorshipChats, getSponsorshipDeal, getSponsorshipDealReport, getPublishedCampaigns, type SponsorshipDeal, type Campaign } from "@/lib/api"
import { DealDetailsModal, DealReportModal } from "@/components/sponsorship/DealPanel"
import clsx from "clsx"

import CalendarOutSvg from "@/icons/outlined/calendar.svg"
import DocumentTextSvg from "@/icons/outlined/document-text.svg"
import AltArrowRightSvg from "@/icons/outlined/alt-arrow-right.svg"

const STATUS_CONFIG: Record<DisplayEventStatus, { label: string; className: string }> = {
	DRAFT: { label: "Draft", className: "bg-surface-card-muted text-text-secondary" },
	UNDER_REVIEW: { label: "Under Review", className: "bg-status-trending-bg text-status-trending-text" },
	PUBLISHED: { label: "Published", className: "bg-status-success-bg text-status-success-text" },
	LIVE: { label: "Live Now", className: "bg-red-100 text-red-700" },
	COMPLETED: { label: "Completed", className: "bg-surface-inverse text-text-inverse" },
	CANCELLED: { label: "Cancelled", className: "bg-status-error-bg text-status-error-text" },
}

export default function DashboardWelcomePage() {
	const router = useRouter()
	const { data, isLoading, fetchDashboard } = useDashboardStore()
	const { profile } = useHostStore()
	const hostId = profile?.id || ""
	const displayName = profile?.displayName || "Host"

	const [proposals, setProposals] = useState<StoredProposal[]>([])
	const [lockedDeals, setLockedDeals] = useState<(SponsorshipDeal & { proposalName?: string | null; brandName: string; brandLogo: string | null | undefined; sponsorshipInterestId: string; hasReport: boolean })[]>([])
	const [loadingProposals, setLoadingProposals] = useState(true)
	const [loadingLockedDeals, setLoadingLockedDeals] = useState(true)
	const [hasCommunityProfile, setHasCommunityProfile] = useState<boolean>(false)
	const [loadingCommunity, setLoadingCommunity] = useState(true)
	const [campaigns, setCampaigns] = useState<Campaign[]>([])
	const [loadingCampaigns, setLoadingCampaigns] = useState(true)

	// Modal states for Locked Deal and Report views
	const [selectedDeal, setSelectedDeal] = useState<{ deal: SponsorshipDeal; interestId: string } | null>(null)
	const [selectedInterestIdForReport, setSelectedInterestIdForReport] = useState<string | null>(null)
	const [loadingDealDetailId, setLoadingDealDetailId] = useState<string | null>(null)

	useEffect(() => {
		if (profile?.id) {
			setLoadingCommunity(true)
			getHostCommunityProfile()
				.then((res) => {
					setHasCommunityProfile(!!res)
				})
				.catch(() => {
					setHasCommunityProfile(false)
				})
				.finally(() => {
					setLoadingCommunity(false)
				})
		}
	}, [profile?.id])

	useEffect(() => {
		fetchDashboard()
	}, [fetchDashboard])

	useEffect(() => {
		if (!hostId) return
		setLoadingProposals(true)
		getProposals(hostId)
			.then((list) => {
				const sorted = [...list].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
				setProposals(sorted)
			})
			.catch((err) => {
				console.error("Failed to fetch proposals for dashboard", err)
			})
			.finally(() => {
				setLoadingProposals(false)
			})
	}, [hostId])

	useEffect(() => {
		if (!hostId) return
		setLoadingLockedDeals(true)
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
							return {
								...deal,
								proposalName: thread.proposalName,
								brandName: thread.counterpartName,
								brandLogo: thread.counterpartAvatarUrl,
								sponsorshipInterestId: thread.id,
								hasReport,
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
				setLoadingLockedDeals(false)
			})
	}, [hostId])

	useEffect(() => {
		setLoadingCampaigns(true)
		getPublishedCampaigns()
			.then((res) => {
				setCampaigns(res || [])
			})
			.catch((err) => {
				console.error("Failed to fetch campaigns for community dashboard", err)
			})
			.finally(() => {
				setLoadingCampaigns(false)
			})
	}, [])

	const recentEvents = data?.recentEvents ?? []
	const approvedSponsorships = proposals.filter((p) => p.status === "PUBLISHED")
	const upcomingEvents = recentEvents.filter((e) => e.status === "PUBLISHED" || e.status === "LIVE")

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
						Hey {displayName}, <span className="text-[#EE2C2C]">what are we building today?</span>
					</h1>
					<p className="text-sm font-semibold text-black/50 mt-2 max-w-2xl mx-auto">
						Start something new or pick up where you left off!
					</p>
				</div>

				{/* Two CTAs grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
					{/* CTA 1: Raise Sponsorship */}
					<div className="bg-white border-[3px] border-black rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col relative h-full min-h-[220px] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
						<div className="flex items-center justify-between w-full mb-4">
							<h2 className="text-lg font-heading font-black text-black">
								Raise Sponsorship
							</h2>
							<span className="bg-[#1E1B4B] text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider badge-zoom-pulse">
								LIVE
							</span>
						</div>
						<p className="text-xs font-semibold text-black/50 mb-8 flex-grow leading-relaxed">
							Build custom proposals, pitch relevant brand sponsors, and secure brand backing to scale your upcoming experiences.
						</p>
						<Link
							href="/community/dashboard/proposal"
							className="w-full py-3 bg-[#FFC940] text-black border-[3px] border-black rounded-2xl font-black text-center text-xs tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:bg-[#EE2C2C] hover:text-white transition-all flex items-center justify-center gap-2 select-none"
						>
							CREATE PROPOSAL
							<span className="text-base font-bold">➔</span>
						</Link>
					</div>

					{/* CTA 2: Explore Campaigns */}
					<div className="bg-white border-[3px] border-black rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col relative h-full min-h-[220px] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
						<div className="flex items-center justify-between w-full mb-4">
							<h2 className="text-lg font-heading font-black text-black">
								Explore Campaigns
							</h2>
							<span className="bg-[#1E1B4B] text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider badge-zoom-pulse">
								ACTIVE
							</span>
						</div>
						<p className="text-xs font-semibold text-black/50 mb-8 flex-grow leading-relaxed">
							Browse active marketing and sponsorship campaign briefs posted by brands, review requirements, and contact them to collaborate.
						</p>
						<Link
							href="/community/dashboard/campaigns"
							className="w-full py-3 bg-[#FFC940] text-black border-[3px] border-black rounded-2xl font-black text-center text-xs tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:bg-[#EE2C2C] hover:text-white transition-all flex items-center justify-center gap-2 select-none"
						>
							EXPLORE CAMPAIGNS
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
					{/* Row 0: Active Brand Campaigns */}
					<div className="flex flex-col w-full">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full mb-4 gap-2 sm:gap-0">
							<div>
								<h2 className="text-xl font-heading font-black text-black">Active Brand Campaigns</h2>
								<p className="text-xs font-semibold text-black/50 mt-1">Explore campaign briefs from brands looking for sponsors.</p>
							</div>
							<Link href="/community/dashboard/campaigns" className="text-xs font-black text-[#6C32D1] hover:text-[#6C32D1]/80 inline-flex items-center gap-1 self-start sm:self-auto">
								View All Campaigns &gt;
							</Link>
						</div>

						{loadingCampaigns ? (
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
						) : campaigns.length === 0 ? (
							<div className="w-full border-[3px] border-dashed border-black/30 rounded-[24px] bg-white py-12 flex flex-col items-center justify-center text-center gap-2">
								<p className="text-sm font-black text-black/80">No active campaigns yet</p>
								<p className="text-[11px] font-semibold text-black/40">Check back later for brand sponsorship campaigns.</p>
							</div>
						) : (
							<div className="flex flex-row overflow-x-auto gap-4 pb-4 w-full">
								{campaigns.map((c) => {
									const displayDates = `${new Date(c.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} - ${new Date(c.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
									return (
										<Link
											key={c.id}
											href={`/community/dashboard/campaigns?campaignId=${c.id}`}
											className="group relative cursor-pointer bg-white border-[3px] border-black rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all overflow-hidden flex flex-row w-[380px] max-w-[85vw] shrink-0"
										>
											{/* Image / Logo */}
											<div className="relative w-[120px] aspect-square shrink-0 overflow-hidden bg-slate-50 border-r-[3px] border-black rounded-l-[17px]">
												{c.brandProfile?.logoUrl ? (
													// eslint-disable-next-line @next/next/no-img-element
													<img
														src={c.brandProfile.logoUrl}
														alt={c.name}
														className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 rounded-l-[14px]"
													/>
												) : (
													<div className="w-full h-full bg-slate-100 flex items-center justify-center text-black/40 font-black text-sm">
														{c.brandProfile?.brandName ? c.brandProfile.brandName.substring(0, 2).toUpperCase() : "MD"}
													</div>
												)}

												{/* Offer Type Badge */}
												<span className="absolute top-2 left-2 text-[7px] font-black px-1.5 py-0.5 border-[2px] border-black rounded-full uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] bg-[#FFC940] text-black">
													{c.offerType}
												</span>
											</div>

											{/* Content & Footer info */}
											<div className="flex-1 p-3 flex flex-col justify-between min-w-0">
												<div className="flex flex-col gap-1">
													<h3 className="font-heading font-black text-base text-black truncate group-hover:text-[#EE2C2C] transition-colors leading-snug">
														{c.name}
													</h3>
													<p className="text-[11px] font-bold text-black/50 truncate">
														Brand: {c.brandProfile?.brandName ?? "Brand"} {c.locations?.length > 0 && `• ${c.locations.slice(0, 2).join(", ")}`}{c.locations?.length > 2 ? ` +${c.locations.length - 2}` : ""}
													</p>
													{c.description && (
														<p className="text-[11px] font-semibold text-black/70 line-clamp-2 mt-0.5 leading-normal">
															{c.description}
														</p>
													)}
												</div>

												<div className="flex flex-wrap gap-1.5 mt-2">
													<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-[#6C32D1] text-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
														{displayDates}
													</span>
													<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-[#EE2C2C] text-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
														{c.offerType === "BARTER" ? "BARTER" : `${c.budgetCurrency} ${Number(c.budgetAmount).toLocaleString()}`}
													</span>
												</div>
											</div>
										</Link>
									)
								})}
							</div>
						)}
					</div>

					{/* Row 1: Approved Sponsorships */}
					<div className="flex flex-col w-full">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full mb-4 gap-2 sm:gap-0">
							<div>
								<h2 className="text-xl font-heading font-black text-black">Sponsorship Proposals</h2>
								<p className="text-xs font-semibold text-black/50 mt-1">View your approved proposals.</p>
							</div>
							<Link href="/community/dashboard/proposal" className="text-xs font-black text-[#6C32D1] hover:text-[#6C32D1]/80 inline-flex items-center gap-1 self-start sm:self-auto">
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
						) : approvedSponsorships.length === 0 ? (
							<div className="w-full border-[3px] border-dashed border-black/30 rounded-[24px] bg-white py-12 flex flex-col items-center justify-center text-center gap-2">
								<p className="text-sm font-black text-black/80">No approved sponsorships yet</p>
								<p className="text-[11px] font-semibold text-black/40">Submit your first proposal for admin approval to get sponsored.</p>
							</div>
						) : (
							<div className="flex flex-row overflow-x-auto gap-4 pb-4 w-full">
								{approvedSponsorships.map((prop) => {
									const imgUrl = typeof prop.image === "string" ? prop.image : prop.image ? URL.createObjectURL(prop.image) : null
									const parts = prop.date ? prop.date.split("-") : []
									const displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : prop.date

									return (
										<Link
											key={prop.id}
											href={`/community/dashboard/proposal?proposalId=${prop.id}`}
											className="group relative cursor-pointer bg-white border-[3px] border-black rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all overflow-hidden flex flex-row w-[380px] max-w-[85vw] shrink-0"
										>
											{/* Image / Logo */}
											<div className="relative w-[120px] aspect-square shrink-0 overflow-hidden bg-slate-50 border-r-[3px] border-black rounded-l-[17px]">
												{imgUrl ? (
													// eslint-disable-next-line @next/next/no-img-element
													<img
														src={imgUrl}
														alt={prop.name}
														className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 rounded-l-[14px]"
														onLoad={() => imgUrl.startsWith("blob:") && URL.revokeObjectURL(imgUrl)}
													/>
												) : (
													<div className="w-full h-full bg-slate-100 flex items-center justify-center text-black/40 font-black text-sm">
														{prop.name.substring(0, 2).toUpperCase()}
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

					{/* Row 2: Locked Deals & Reports */}
					<div className="flex flex-col w-full">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full mb-4 gap-2 sm:gap-0">
							<div>
								<h2 className="text-xl font-heading font-black text-black">Locked Deals & Reports</h2>
								<p className="text-xs font-semibold text-black/50 mt-1">View locked deal terms and submitted deliverables reports.</p>
							</div>
							<Link href="/community/dashboard/chats" className="text-xs font-black text-[#6C32D1] hover:text-[#6C32D1]/80 inline-flex items-center gap-1 self-start sm:self-auto">
								Go to Chats &gt;
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
								<p className="text-[11px] font-semibold text-black/40">Lock terms with a brand sponsor in your chat dashboard to start earning.</p>
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
												router.push(`/community/dashboard/chats?interestId=${deal.sponsorshipInterestId}`)
											}}
											className="group relative cursor-pointer bg-white border-[3px] border-black rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all p-4 w-[300px] shrink-0 flex flex-col justify-between"
										>
											<div>
												<div className="flex items-center justify-between gap-2 mb-2">
													<div className="flex items-center gap-2.5 min-w-0">
														<div className="w-8 h-8 rounded-full border-[2px] border-black overflow-hidden bg-neutral-100 flex items-center justify-center shrink-0">
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
														<span className="font-heading font-black text-base text-black truncate max-w-[150px]">
															{deal.brandName}
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
					role="HOST"
					onClose={() => setSelectedDeal(null)}
					onUpdated={(updatedDeal) => {
						setSelectedDeal({ deal: updatedDeal, interestId: selectedDeal.interestId })
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
