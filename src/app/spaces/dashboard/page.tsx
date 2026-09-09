"use client"

import { useState, useEffect } from "react"
import { useSpaceStore } from "@/store/spaceStore"
import { getSpaceCommunityProfile, type SpaceCommunityProfile } from "@/lib/api"
import Link from "next/link"

export default function SpacesDashboardPage() {
	const { profile } = useSpaceStore()
	const businessName = profile?.businessName || "Space Partner"
	const [community, setCommunity] = useState<SpaceCommunityProfile | null>(null)
	const [loadingCommunity, setLoadingCommunity] = useState(true)

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

				{/* CTA Cards Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto mt-2">
					{/* CTA 1: Activate / Manage Community Space Profile (Links to Profile with Drawer open) */}
					<div className="bg-white border-[3px] border-black rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col relative h-full min-h-[220px] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
						<div className="flex items-center justify-between w-full mb-4">
							<h2 className="text-lg font-heading font-black text-black">
								{hasCommunityProfile ? "Community Spaces Profile" : "Activate Community Space Profile"}
							</h2>
							<span className="bg-[#1E1B4B] text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider badge-zoom-pulse">
								{hasCommunityProfile ? "ACTIVE" : "LIVE"}
							</span>
						</div>
						<p className="text-xs font-semibold text-black/50 mb-8 flex-grow leading-relaxed">
							{hasCommunityProfile
								? "Manage your space amenities, capacity, showcase photos, and public listing for community organizers and brands."
								: "Set up your venue details, highlight posters, capacity, and showcase images to start receiving offline event and community partnerships."}
						</p>
						<Link
							href="/spaces/dashboard/profile?open=community"
							className="w-full py-3 bg-[#FFC940] text-black border-[3px] border-black rounded-2xl font-black text-center text-xs tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:bg-[#EE2C2C] hover:text-white transition-all flex items-center justify-center gap-2 select-none"
						>
							{hasCommunityProfile ? "VIEW DETAILS" : "ACTIVATE PROFILE"}
							<span className="text-base font-bold">➔</span>
						</Link>
					</div>

					{/* CTA 2: My Account & Identity */}
					<div className="bg-white border-[3px] border-black rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col relative h-full min-h-[220px] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
						<div className="flex items-center justify-between w-full mb-4">
							<h2 className="text-lg font-heading font-black text-black">
								Account & Settings
							</h2>
							<span className="bg-[#1E1B4B] text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider badge-zoom-pulse">
								READY
							</span>
						</div>
						<p className="text-xs font-semibold text-black/50 mb-8 flex-grow leading-relaxed">
							Manage your account settings, notification preferences, operating cities, and space partner identity.
						</p>
						<Link
							href="/spaces/dashboard/profile"
							className="w-full py-3 bg-[#FFC940] text-black border-[3px] border-black rounded-2xl font-black text-center text-xs tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:bg-[#EE2C2C] hover:text-white transition-all flex items-center justify-center gap-2 select-none"
						>
							MANAGE ACCOUNT
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
			</div>
		</div>
	)
}
