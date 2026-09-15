"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSpaceStore } from "@/store/spaceStore"
import {
	getSpaceCommunityProfile,
	getMySpaceChats,
	getSpaceDeal,
	getSpaceDealReport,
	getBrandCommunities,
	type SpaceCommunityProfile,
	type SpaceDeal,
	type SpaceChatThread,
	type BrandCommunity,
} from "@/lib/api"
import { SpaceDealDetailsModal, SpaceDealReportModal } from "@/components/spaces/SpaceDealPanel"
import { CommunityCard } from "@/app/spaces/dashboard/communities/page"
import { toast } from "sonner"
import Link from "next/link"
import clsx from "clsx"

type LockedSpaceDealItem = SpaceDeal & {
	counterpartName: string
	counterpartAvatarUrl?: string | null
	requesterType: "BRAND" | "COMMUNITY"
	thread: SpaceChatThread
	hasReport: boolean
}

export default function SpacesDashboardPage() {
	const router = useRouter()
	const { profile } = useSpaceStore()
	const businessName = profile?.businessName || "Space Partner"
	const [community, setCommunity] = useState<SpaceCommunityProfile | null>(null)
	const [loadingCommunity, setLoadingCommunity] = useState(true)

	const [communities, setCommunities] = useState<BrandCommunity[]>([])
	const [loadingCommunities, setLoadingCommunities] = useState(true)

	const [lockedDeals, setLockedDeals] = useState<LockedSpaceDealItem[]>([])
	const [loadingLockedDeals, setLoadingLockedDeals] = useState(true)
	const [loadingDealDetailId, setLoadingDealDetailId] = useState<string | null>(null)
	const [selectedDeal, setSelectedDeal] = useState<{ deal: SpaceDeal; thread: SpaceChatThread } | null>(null)
	const [selectedReportThread, setSelectedReportThread] = useState<{ deal: SpaceDeal; thread: SpaceChatThread } | null>(null)

	useEffect(() => {
		setLoadingCommunities(true)
		getBrandCommunities()
			.then((res) => {
				setCommunities(res.communities || [])
			})
			.catch((err) => {
				console.error("Failed to fetch communities for spaces dashboard", err)
			})
			.finally(() => {
				setLoadingCommunities(false)
			})
	}, [])

	useEffect(() => {
		getSpaceCommunityProfile()
			.then((res) => {
				setCommunity(res)
			})
			.catch(() => {
				setCommunity(null)
			})
			.finally(() => {
				setLoadingCommunity(false)
			})
	}, [])

	useEffect(() => {
		if (!profile?.id) return
		setLoadingLockedDeals(true)

		getMySpaceChats(undefined, "SPACE")
			.then(async (threads) => {
				const dealsPromises = threads.map(async (thread) => {
					try {
						const deal = await getSpaceDeal(thread.id)
						if (deal && deal.status === "APPROVED") {
							let hasReport = false
							try {
								const rep = await getSpaceDealReport(thread.id, "SPACE")
								if (rep) hasReport = true
							} catch {}
							return {
								...deal,
								counterpartName: thread.counterpartName || "Partner",
								counterpartAvatarUrl: thread.counterpartAvatarUrl,
								requesterType: thread.requesterType,
								thread,
								hasReport,
							}
						}
					} catch (e) {
						console.error("error fetching space deal", e)
					}
					return null
				})
				const resolvedDeals = await Promise.all(dealsPromises)
				setLockedDeals(resolvedDeals.filter((d): d is NonNullable<typeof d> => d !== null))
			})
			.catch((err) => {
				console.error("Failed to fetch space chats/deals", err)
			})
			.finally(() => {
				setLoadingLockedDeals(false)
			})
	}, [profile?.id])

	const hasCommunityProfile = !loadingCommunity && !!community

	return (
		<div className="flex flex-col min-h-full bg-white">
			{/* Top Nav / Subheader */}
			<div className="flex justify-between items-center px-8 py-4 border-b border-black/10 shrink-0">
				<p className="text-sm font-semibold text-black/50 mx-auto">
					Welcome to <span className="text-[#EE2C2C] font-bold">Meetday</span>
				</p>
			</div>

			<div className="px-4 lg:px-6 py-4 max-w-6xl mx-auto w-full flex-1 flex flex-col gap-6">
				{/* Welcome Header (Centrally Aligned) */}
				<div className="text-center mt-2">
					<h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-black leading-tight">
						Hey {businessName}, <span className="text-[#EE2C2C]">what are we building today?</span>
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
							href="/spaces/dashboard/proposals"
							className="w-full py-3 bg-[#FFC940] text-black border-[3px] border-black rounded-2xl font-black text-center text-xs tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:bg-[#EE2C2C] hover:text-white transition-all flex items-center justify-center gap-2 select-none"
						>
							CREATE PROPOSAL
							<span className="text-base font-bold">➔</span>
						</Link>
					</div>

					{/* CTA 2: Brand Campaigns */}
					<div className="bg-white border-[3px] border-black rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col relative h-full min-h-[220px] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
						<div className="flex items-center justify-between w-full mb-4">
							<h2 className="text-lg font-heading font-black text-black">
								Brand Campaigns
							</h2>
							<span className="bg-[#1E1B4B] text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
								SOON
							</span>
						</div>
						<p className="text-xs font-semibold text-black/50 mb-8 flex-grow leading-relaxed">
							Browse active marketing and sponsorship campaign briefs posted by brands, review requirements, and contact them to collaborate.
						</p>
						<button
							type="button"
							disabled
							className="w-full py-3 bg-black/10 text-black/40 border-[3px] border-black/20 rounded-2xl font-black text-center text-xs tracking-wider cursor-not-allowed flex items-center justify-center gap-2 select-none"
						>
							EXPLORE CAMPAIGNS
							<span className="text-[9px] font-black uppercase tracking-wider bg-black/15 px-1.5 py-0.5 rounded ml-1">Soon</span>
						</button>
					</div>
				</div>

				<hr className="border-black/10 my-2" />

				{/* Overview Section */}
				<div className="flex flex-col gap-10 pb-8">
					{/* Active Communities Section */}
					<div className="flex flex-col w-full">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full mb-4 gap-2 sm:gap-0">
							<div>
								<h2 className="text-xl font-heading font-black text-black">Active Communities</h2>
								<p className="text-xs font-semibold text-black/50 mt-1">Discover communities on Meetday.</p>
							</div>
							<Link href="/spaces/dashboard/communities" className="text-xs font-black text-[#6C32D1] hover:text-[#6C32D1]/80 inline-flex items-center gap-1 self-start sm:self-auto">
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
									<Link key={comm.id} href={`/spaces/dashboard/communities?communityId=${comm.id}`} className="block shrink-0 w-[180px]">
										<CommunityCard community={comm} />
									</Link>
								))}
							</div>
						)}
					</div>

					{/* Locked Deals & Reports Overview Section */}
					<div className="flex flex-col w-full">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full mb-4 gap-2 sm:gap-0">
							<div>
								<h2 className="text-xl font-heading font-black text-black">Locked Deals & Reports</h2>
								<p className="text-xs font-semibold text-black/50 mt-1">View locked space deal terms and submitted deliverables reports.</p>
							</div>
							<Link href="/spaces/dashboard/deals" className="text-xs font-black text-[#6C32D1] hover:text-[#6C32D1]/80 inline-flex items-center gap-1 self-start sm:self-auto">
								View All Deals &gt;
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
								<p className="text-[11px] font-semibold text-black/40">Once a deal is locked in chat with a brand or community, it will show up here.</p>
							</div>
						) : (
							<div className="flex flex-row overflow-x-auto gap-4 pb-4 w-full">
								{lockedDeals.map((deal) => {
									const isBrand = deal.requesterType === "BRAND"
									return (
										<div
											key={deal.id}
											onClick={(e) => {
												const target = e.target as HTMLElement
												if (target.closest("button") || target.closest("a")) return
												router.push(`/spaces/dashboard/chats?type=${isBrand ? "brand" : "community"}&threadId=${deal.spaceInterestId}`)
											}}
											className="group relative cursor-pointer bg-white border-[3px] border-black rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all p-4 w-[300px] shrink-0 flex flex-col justify-between"
										>
											<div>
												<div className="flex items-center justify-between gap-2 mb-2">
													<div className="flex items-center gap-2.5 min-w-0">
														<div className="w-8 h-8 rounded-full border-[2px] border-black overflow-hidden bg-neutral-100 flex items-center justify-center shrink-0">
															{deal.counterpartAvatarUrl ? (
																// eslint-disable-next-line @next/next/no-img-element
																<img
																	src={deal.counterpartAvatarUrl}
																	alt={deal.counterpartName}
																	className="w-full h-full object-cover"
																/>
															) : (
																<span className="font-bold text-xs text-black/60">
																	{deal.counterpartName.charAt(0).toUpperCase()}
																</span>
															)}
														</div>
														<span className="font-heading font-black text-base text-black truncate max-w-[150px]">
															{deal.counterpartName}
														</span>
													</div>
													<span className={clsx(
														"px-2 py-0.5 border-2 border-black rounded-full text-[8px] font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]",
														isBrand ? "bg-[#EE2C2C] text-white" : "bg-[#FFC940] text-black"
													)}>
														{isBrand ? "Brand" : "Community"}
													</span>
												</div>
												<p className="text-xs text-black/50 font-semibold truncate mt-2">
													Project: {deal.projectName}
												</p>
											</div>
											<div className="mt-4 pt-3 border-t-2 border-black/5 flex flex-col gap-2">
												<div className="flex justify-between items-center text-xs font-black text-black">
													<span>Amount:</span>
													<span>₹{Number(deal.sponsorshipAmount || 0).toLocaleString("en-IN")}</span>
												</div>
												<div className={clsx("grid gap-2 mt-1", deal.hasReport ? "grid-cols-2" : "grid-cols-1")}>
													<button
														type="button"
														disabled={loadingDealDetailId === deal.id}
														onClick={async () => {
															setLoadingDealDetailId(deal.id)
															try {
																const dealObj = await getSpaceDeal(deal.spaceInterestId)
																if (dealObj) {
																	setSelectedDeal({ deal: dealObj, thread: deal.thread })
																} else {
																	toast.error("Deal terms are not active yet.")
																}
															} catch {
																toast.error("Failed to load deal terms.")
															} finally {
																setLoadingDealDetailId(null)
															}
														}}
														className="py-1.5 px-2 bg-[#FFC940] text-black border-2 border-black rounded-xl text-[10px] font-black tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all select-none text-center cursor-pointer"
													>
														{loadingDealDetailId === deal.id ? "..." : "Locked Deal"}
													</button>
													{deal.hasReport && (
														<button
															type="button"
															onClick={() => {
																setSelectedReportThread({ deal, thread: deal.thread })
															}}
															className="py-1.5 px-2 bg-white text-black border-2 border-black rounded-xl text-[10px] font-black tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all select-none text-center cursor-pointer"
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
			</div>

			{selectedDeal && (
				<SpaceDealDetailsModal
					interestId={selectedDeal.deal.spaceInterestId}
					deal={selectedDeal.deal}
					role="SPACE"
					onClose={() => setSelectedDeal(null)}
					onUpdated={(updated) => {
						setSelectedDeal({ deal: updated, thread: selectedDeal.thread })
					}}
				/>
			)}

			{selectedReportThread && (
				<SpaceDealReportModal
					interestId={selectedReportThread.deal.spaceInterestId}
					role="SPACE"
					onClose={() => setSelectedReportThread(null)}
				/>
			)}
		</div>
	)
}
