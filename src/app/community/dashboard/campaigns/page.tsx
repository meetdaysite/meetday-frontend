"use client"

import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import { Icon } from "@/components/ui/Icon"
import { getPublishedCampaigns, type Campaign } from "@/lib/api"
import clsx from "clsx"

import RocketSvg from "@/icons/outlined/rocket.svg"
import MapPinSvg from "@/icons/outlined/map-point.svg"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import DollarSvg from "@/icons/outlined/dollar.svg"
import UsersSvg from "@/icons/outlined/users-group.svg"

export default function ExploreCampaignsPage() {
	const router = useRouter()
	const [campaigns, setCampaigns] = useState<Campaign[]>([])
	const [loading, setLoading] = useState(true)
	const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
	const [searchQuery, setSearchQuery] = useState("")

	useEffect(() => {
		setLoading(true)
		getPublishedCampaigns()
			.then((data) => {
				setCampaigns(data)
				if (data.length > 0) {
					setSelectedCampaign(data[0])
				}
			})
			.catch((err) => {
				console.error("Failed to load campaigns", err)
				toast.error("Failed to load campaigns")
			})
			.finally(() => {
				setLoading(false)
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

	return (
		<div className="flex flex-col h-full bg-white text-black overflow-hidden">
			<DashboardTopBar />

			<div className="flex-1 min-h-0 w-full overflow-hidden relative bg-white md:grid md:grid-cols-[55%_45%]">
				{/* Left Panel: Campaigns List */}
				<div className="p-6 overflow-y-auto h-full flex flex-col gap-6 border-r-[3px] border-black">
					<div>
						<h1 className="text-3xl font-heading font-black tracking-tight text-black leading-tight">
							Brand Campaigns
						</h1>
						<p className="text-sm font-semibold text-black/50 mt-1.5">
							Explore and match with active campaign briefs from brands looking for sponsorships
						</p>
					</div>

					{/* Search */}
					<div className="relative">
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search by campaign name, brand, location or goal..."
							className="w-full h-11 px-4 rounded-xl border-[3px] border-black bg-white text-black placeholder:text-black/40 outline-none font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:shadow-none focus:translate-x-[3px] focus:translate-y-[3px] transition-all"
						/>
					</div>

					{loading ? (
						<div className="border-[3px] border-dashed border-black/30 rounded-[20px] p-12 text-center bg-transparent mt-2">
							<p className="text-sm font-semibold text-black/50">Loading campaigns...</p>
						</div>
					) : filteredCampaigns.length === 0 ? (
						<div className="border-[3px] border-dashed border-black/30 rounded-[20px] p-12 flex flex-col items-center justify-center text-center gap-4 bg-transparent mt-2">
							<p className="font-heading font-black text-black/40 text-lg">
								No campaigns found
							</p>
							<p className="text-sm font-semibold text-black/30 max-w-sm">
								There are currently no matching approved campaigns running. Check back later!
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 gap-4">
							{filteredCampaigns.map((c) => {
								const isSelected = selectedCampaign?.id === c.id
								return (
									<div
										key={c.id}
										onClick={() => setSelectedCampaign(c)}
										className={clsx(
											"group text-left relative cursor-pointer bg-white border-[3px] border-black rounded-[20px] p-4 transition-all flex flex-col justify-between gap-4",
											isSelected
												? "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-amber-50"
												: "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px]"
										)}
									>
										<div className="flex flex-col gap-1 min-w-0">
											<div className="flex items-center justify-between gap-2">
												<h3 className="font-heading font-black text-base text-black truncate group-hover:text-[#EE2C2C] transition-colors">
													{c.name}
												</h3>
												<span className="text-[9px] font-black px-2 py-0.5 border-2 border-black rounded-full uppercase tracking-wider bg-[#FFC940] text-black">
													{c.offerType}
												</span>
											</div>
											<p className="text-[11px] font-bold text-[#EE2C2C] uppercase tracking-wide">
												Brand: {c.brandProfile?.brandName ?? "—"}
											</p>
											<p className="text-[11px] font-bold text-black/50">
												Goal: {c.goal} • {c.locations.join(", ")}
											</p>
											{c.description && (
												<p className="text-[11px] font-semibold text-black/70 mt-1 line-clamp-2">
													{c.description}
												</p>
											)}
										</div>

										<div className="flex justify-between items-center mt-2 shrink-0 border-t border-black/10 pt-3">
											<span className="text-xs font-black px-2.5 py-1 bg-slate-100 border border-black rounded-lg">
												{c.budgetCurrency} {Number(c.budgetAmount).toLocaleString()}
											</span>
											<span className="text-[10px] font-bold text-black/40">
												Dates: {new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}
											</span>
										</div>
									</div>
								)
							})}
						</div>
					)}
				</div>

				{/* Right Panel: Campaign Detail View */}
				<div className="p-6 bg-slate-50 overflow-y-auto h-full flex flex-col gap-6">
					{selectedCampaign ? (
						<div className="flex flex-col gap-6 animate-in slide-in-from-right duration-200">
							<div className="border-b border-black/10 pb-4">
								<h2 className="font-heading font-black text-lg text-black">Campaign Details</h2>
							</div>

							<div className="flex flex-col gap-5">
								<div className="flex flex-col gap-1">
									<h3 className="font-heading font-black text-xl text-black leading-snug">
										{selectedCampaign.name}
									</h3>
									<p className="text-xs font-extrabold text-[#EE2C2C] uppercase tracking-wider">
										By {selectedCampaign.brandProfile?.brandName ?? "—"}
									</p>
								</div>

								<div className="bg-white border-[3px] border-black rounded-[24px] p-5 flex flex-col gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
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
													<span key={i} className="text-[10px] font-black bg-[#6C32D1] text-white px-2.5 py-0.5 border border-black rounded-full shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
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
												{new Date(selectedCampaign.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} - {new Date(selectedCampaign.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
											</p>
										</div>
									</div>

									<div className="flex items-start gap-3">
										<Icon as={DollarSvg} size="sm" className="mt-0.5 text-black shrink-0" />
										<div>
											<p className="text-[9px] text-black/40 font-bold uppercase tracking-wider">Budget & Offer Type</p>
											<p className="text-xs font-black text-[#EE2C2C] mt-0.5">
												{selectedCampaign.budgetCurrency} {Number(selectedCampaign.budgetAmount).toLocaleString()} ({selectedCampaign.offerType})
											</p>
										</div>
									</div>

									{selectedCampaign.barterElements && (
										<div>
											<p className="text-[9px] text-black/40 font-bold uppercase tracking-wider">Barter Elements</p>
											<p className="text-xs font-semibold text-black/70 mt-1 whitespace-pre-wrap">
												{selectedCampaign.barterElements}
											</p>
										</div>
									)}
								</div>

								{selectedCampaign.description && (
									<div>
										<p className="text-[10px] text-black/40 font-bold uppercase tracking-wider mb-1.5">Description / More details</p>
										<p className="text-xs font-semibold text-black/70 leading-relaxed whitespace-pre-wrap bg-white border-2 border-black rounded-xl p-4">
											{selectedCampaign.description}
										</p>
									</div>
								)}

								<div className="mt-4 pt-4 border-t border-black/10">
									<p className="text-[10px] font-bold text-black/40 uppercase mb-2">Interested in matching?</p>
									<a
										href={selectedCampaign.brandProfile ? `mailto:${selectedCampaign.brandProfile.user.email}?subject=Interested in Campaign: ${encodeURIComponent(selectedCampaign.name)}` : "#"}
										className="w-full py-3 bg-[#EE2C2C] text-white border-[3px] border-black rounded-2xl font-black text-center text-xs tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all block uppercase"
									>
										Contact Brand
									</a>
								</div>
							</div>
						</div>
					) : (
						<div className="h-full flex flex-col items-center justify-center text-center text-black/40 p-6">
							<Icon as={RocketSvg} size="lg" className="mb-2" />
							<p className="text-sm font-semibold">Select a campaign to view details</p>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
