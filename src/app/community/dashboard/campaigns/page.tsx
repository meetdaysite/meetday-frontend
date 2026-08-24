"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Icon } from "@/components/ui/Icon"
import { getPublishedCampaigns, markCampaignInterest, getMySponsorshipChats, type Campaign } from "@/lib/api"
import { useHostStore } from "@/store/hostStore"
import clsx from "clsx"

import RocketSvg from "@/icons/outlined/rocket.svg"
import MapPinSvg from "@/icons/outlined/map-point.svg"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import DollarSvg from "@/icons/outlined/dollar.svg"
import UsersSvg from "@/icons/outlined/users-group.svg"

export default function ExploreCampaignsPage() {
	const router = useRouter()
	const { profile } = useHostStore()
	const [campaigns, setCampaigns] = useState<Campaign[]>([])
	const [loading, setLoading] = useState(true)
	const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
	const [searchQuery, setSearchQuery] = useState("")
	const [submittingInterest, setSubmittingInterest] = useState(false)
	const [interestedCampaignIds, setInterestedCampaignIds] = useState<Set<string>>(new Set())

	const isHostApproved = profile?.approvalStatus === "APPROVED"

	async function handleExpressInterest() {
		if (!selectedCampaign) return
		if (!isHostApproved) {
			toast.error("Your community profile must be approved by the admin to express interest.")
			return
		}
		setSubmittingInterest(true)
		try {
			const res = await markCampaignInterest(selectedCampaign.id)
			if (res.alreadyInterested) {
				toast.info("You have already expressed interest in this campaign.")
			} else {
				toast.success("Interest expressed successfully! A chat thread has been created.")
			}
			setInterestedCampaignIds(prev => {
				const next = new Set(prev)
				next.add(selectedCampaign.id)
				return next
			})
			if (res.interestId) {
				router.push(`/community/dashboard/chats?interestId=${res.interestId}`)
			} else {
				router.push("/community/dashboard/chats")
			}
		} catch (err) {
			console.error(err)
			toast.error("Failed to express interest. Please try again.")
		} finally {
			setSubmittingInterest(false)
		}
	}

	useEffect(() => {
		setLoading(true)
		getPublishedCampaigns()
			.then((data) => setCampaigns(data))
			.catch((err) => {
				console.error("Failed to load campaigns", err)
				toast.error("Failed to load campaigns")
			})
			.finally(() => setLoading(false))

		Promise.all([
			getMySponsorshipChats("REQUESTED").catch(() => []),
			getMySponsorshipChats("ACCEPTED").catch(() => []),
		]).then(([req, acc]) => {
			const ids = new Set<string>()
			const all = [...req, ...acc]
			all.forEach(t => {
				if (t.campaignId) {
					ids.add(t.campaignId)
				}
			})
			setInterestedCampaignIds(ids)
		}).catch(err => {
			console.error("Failed to load existing chat interests", err)
		})
	}, [])

	const filteredCampaigns = useMemo(() => {
		const query = searchQuery.toLowerCase().trim()
		if (!query) return campaigns
		return campaigns.filter(c =>
			c.name.toLowerCase().includes(query) ||
			(c.brandProfile?.brandName ?? "").toLowerCase().includes(query) ||
			c.locations.some(loc => loc.toLowerCase().includes(query)) ||
			c.goal.toLowerCase().includes(query)
		)
	}, [campaigns, searchQuery])

	const isSplitLayout = !!selectedCampaign

	return (
		<div className="flex flex-col min-h-screen">
			{/* Top Nav / Subheader */}
			<div className="flex justify-between items-center px-8 py-4 border-b border-black/10 shrink-0">
				<p className="text-sm font-semibold text-black/50 mx-auto">
					Welcome to <span className="text-[#EE2C2C] font-bold">Meetday</span>
				</p>
			</div>

			<div className={clsx(
				"flex-1 min-h-0 w-full overflow-hidden relative bg-white",
				isSplitLayout ? "md:grid md:grid-cols-[58%_42%]" : "flex flex-col"
			)}>
				{/* Left: List */}
				<div className={clsx(
					"px-4 lg:px-6 py-6 flex-1 flex flex-col gap-6 overflow-y-auto h-full transition-all duration-300",
					isSplitLayout ? "max-w-none" : "max-w-6xl mx-auto w-full"
				)}>
					<div>
						<h1 className="text-3xl font-heading font-black tracking-tight text-black leading-tight">
							Brand Campaigns
						</h1>
						<p className="text-sm font-semibold text-black/50 mt-1.5">
							Explore and match with active campaign briefs from brands looking for sponsorships
						</p>
					</div>

					{/* Search */}
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search by campaign name, brand, location or goal..."
						className="w-full h-11 px-4 rounded-xl border-[3px] border-black bg-white text-black placeholder:text-black/40 outline-none font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:shadow-none focus:translate-x-[3px] focus:translate-y-[3px] transition-all"
					/>

					{loading ? (
						<div className="border-[3px] border-dashed border-black/30 rounded-[20px] p-12 text-center">
							<p className="text-sm font-semibold text-black/50">Loading campaigns...</p>
						</div>
					) : filteredCampaigns.length === 0 ? (
						<div className="border-[3px] border-dashed border-black/30 rounded-[20px] p-12 flex flex-col items-center justify-center text-center gap-4">
							<Icon as={RocketSvg} size="lg" className="text-black/20" />
							<p className="font-heading font-black text-black/40 text-lg">No campaigns found</p>
							<p className="text-sm font-semibold text-black/30 max-w-sm">
								There are no active campaigns right now. Check back later!
							</p>
						</div>
					) : (
						<div className={clsx(
							"grid gap-6",
							isSplitLayout ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
						)}>
							{filteredCampaigns.map((c) => {
								const isSelected = selectedCampaign?.id === c.id
								return (
									<button
										key={c.id}
										type="button"
										onClick={() => setSelectedCampaign(isSelected ? null : c)}
										className="group text-left relative cursor-pointer bg-white border-[3px] border-black rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all overflow-hidden flex flex-row w-full h-[150px]"
									>
										{/* Image / Logo on the left */}
										<div className="relative w-[150px] h-full shrink-0 overflow-hidden bg-slate-50 border-r-[3px] border-black rounded-l-[17px]">
											{c.brandProfile?.logoUrl ? (
												<img
													src={c.brandProfile.logoUrl}
													alt={c.name || "Campaign"}
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
													{new Date(c.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – {new Date(c.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
												</span>
												<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-[#EE2C2C] text-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
													{c.offerType === "BARTER" ? "BARTER" : `${c.budgetCurrency} ${Number(c.budgetAmount).toLocaleString()}`}
												</span>
											</div>
										</div>
									</button>
								)
							})}
						</div>
					)}
				</div>

				{/* Right: Details Panel — mirrors CommunityProfileDetailsPanel style */}
				{selectedCampaign && (
					<div className="hidden md:flex flex-col border-l-[3px] border-black bg-white h-full overflow-y-auto animate-in fade-in duration-150">
						{/* Panel Header */}
						<div className="flex justify-between items-center px-6 py-4 border-b border-black/10 shrink-0">
							<h2 className="text-xl font-heading font-black text-black">Campaign Details</h2>
							<button
								type="button"
								onClick={() => setSelectedCampaign(null)}
								className="text-black/60 hover:text-black size-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors font-bold text-sm"
							>
								✕
							</button>
						</div>

						{/* Panel Content */}
						<div className="flex flex-col gap-5 p-6">
							{/* Brand identity */}
							<div className="flex items-center gap-3">
								<div className="size-11 rounded-xl bg-[#EE2C2C] border-[3px] border-black flex items-center justify-center shrink-0 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
									{selectedCampaign.brandProfile?.logoUrl ? (
										<img src={selectedCampaign.brandProfile.logoUrl} alt={selectedCampaign.brandProfile.brandName} className="w-full h-full object-cover" />
									) : (
										<span className="text-white font-black text-base">
											{(selectedCampaign.brandProfile?.brandName ?? "B")[0].toUpperCase()}
										</span>
									)}
								</div>
								<div>
									<p className="text-[9px] font-bold text-black/40 uppercase tracking-wider">Brand</p>
									<p className="font-heading font-black text-base text-black leading-tight">
										{selectedCampaign.brandProfile?.brandName ?? "—"}
									</p>
								</div>
							</div>

							{/* Campaign Name */}
							<div className="border-t border-black/10 pt-4">
								<h3 className="font-heading font-black text-xl text-black leading-snug">
									{selectedCampaign.name}
								</h3>
							</div>

							{/* Details card */}
							<div className="bg-white border-[3px] border-black rounded-[20px] p-4 flex flex-col gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
								<div className="flex items-start gap-3">
									<Icon as={RocketSvg} size="sm" className="mt-0.5 text-black shrink-0" />
									<div>
										<p className="text-[9px] text-black/40 font-bold uppercase tracking-wider">Campaign Goal</p>
										<p className="text-xs font-extrabold text-black mt-0.5">{selectedCampaign.goal}</p>
									</div>
								</div>

								<div className="flex items-start gap-3">
									<Icon as={MapPinSvg} size="sm" className="mt-0.5 text-black shrink-0" />
									<div>
										<p className="text-[9px] text-black/40 font-bold uppercase tracking-wider">Target Locations</p>
										<div className="flex flex-wrap gap-1 mt-1">
											{selectedCampaign.locations.map((loc, i) => (
												<span key={i} className="text-[10px] font-black bg-[#EE2C2C] text-white px-2 py-0.5 border border-black rounded-full shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
													{loc}
												</span>
											))}
										</div>
									</div>
								</div>

								<div className="flex items-start gap-3">
									<Icon as={UsersSvg} size="sm" className="mt-0.5 text-black shrink-0" />
									<div>
										<p className="text-[9px] text-black/40 font-bold uppercase tracking-wider">Target Audience</p>
										<div className="flex flex-wrap gap-1.5 mt-1">
											{selectedCampaign.audience.map((aud, i) => (
												<span key={i} className="text-[10px] font-black bg-[#6C32D1] text-white px-2 py-0.5 border border-black rounded-full shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
													{aud}
												</span>
											))}
										</div>
									</div>
								</div>

								<div className="flex items-start gap-3">
									<Icon as={CalendarSvg} size="sm" className="mt-0.5 text-black shrink-0" />
									<div>
										<p className="text-[9px] text-black/40 font-bold uppercase tracking-wider">Run Dates</p>
										<p className="text-xs font-black text-black mt-0.5">
											{new Date(selectedCampaign.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} – {new Date(selectedCampaign.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
										</p>
									</div>
								</div>

								<div className="flex items-start gap-3">
									<Icon as={DollarSvg} size="sm" className="mt-0.5 text-black shrink-0" />
									<div>
										<p className="text-[9px] text-black/40 font-bold uppercase tracking-wider">Budget &amp; Offer Type</p>
										<p className="text-xs font-black text-[#EE2C2C] mt-0.5">
											{selectedCampaign.budgetCurrency} {Number(selectedCampaign.budgetAmount).toLocaleString()} ({selectedCampaign.offerType})
										</p>
									</div>
								</div>

								{selectedCampaign.barterElements && (
									<div>
										<p className="text-[9px] text-black/40 font-bold uppercase tracking-wider">Barter Elements</p>
										<p className="text-xs font-semibold text-black/70 mt-1 whitespace-pre-wrap">{selectedCampaign.barterElements}</p>
									</div>
								)}
							</div>

							{selectedCampaign.description && (
								<div>
									<p className="text-[10px] text-black/40 font-bold uppercase tracking-wider mb-1.5">Description / More Details</p>
									<p className="text-xs font-semibold text-black/70 leading-relaxed whitespace-pre-wrap bg-white border-2 border-black rounded-xl p-4">
										{selectedCampaign.description}
									</p>
								</div>
							)}

							{/* CTA */}
							<div className="pt-2 border-t border-black/10">
								<p className="text-[10px] font-bold text-black/40 uppercase mb-2">Interested in matching?</p>
								{(() => {
									const isAlreadyInterested = selectedCampaign ? interestedCampaignIds.has(selectedCampaign.id) : false
									return (
										<button
											type="button"
											disabled={submittingInterest || isAlreadyInterested || !isHostApproved}
											onClick={handleExpressInterest}
											className={clsx(
												"w-full py-3 border-[3px] border-black rounded-2xl font-black text-center text-xs tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all block uppercase select-none",
												isAlreadyInterested
													? "bg-green-600 text-white cursor-not-allowed shadow-none translate-x-0 translate-y-0"
													: isHostApproved
														? "bg-[#EE2C2C] text-white hover:bg-[#D12525]"
														: "bg-neutral-200 text-black/40 cursor-not-allowed shadow-none translate-x-0 translate-y-0"
											)}
										>
											{isAlreadyInterested
												? "BRAND NOTIFIED ✓"
												: submittingInterest
													? "SUBMITTING..."
													: "I'M INTERESTED ➔"}
										</button>
									)
								})()}
								{!isHostApproved && (
									<p className="text-[10px] font-bold text-red-500 mt-2">
										* You must have an approved community profile to express interest.
									</p>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
