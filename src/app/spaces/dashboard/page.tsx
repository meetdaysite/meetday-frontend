"use client"

import { useSpaceStore } from "@/store/spaceStore"
import Link from "next/link"

export default function SpacesDashboardPage() {
	const { profile } = useSpaceStore()
	const businessName = profile?.businessName || "Space Partner"

	return (
		<div className="flex flex-col gap-6 w-full">
			{/* Header Greeting */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 pb-6">
				<div>
					<div className="flex items-center gap-2">
						<span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-[#FFCE29] text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
							Spaces Dashboard
						</span>
					</div>
					<h1 className="font-heading text-3xl sm:text-4xl font-black text-black tracking-tight mt-2">
						Welcome, {businessName}!
					</h1>
					<p className="text-sm font-semibold text-black/60 mt-1">
						Manage your venue profiles, availability, and community booking inquiries.
					</p>
				</div>

				<Link
					href="/spaces/dashboard/profile"
					className="w-fit px-4 py-2 bg-[#FFC940] text-black border-[2.5px] border-black rounded-2xl font-bold text-xs tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
				>
					View Profile
				</Link>
			</div>

			{/* Operating Cities Summary Card */}
			{profile && profile.operatingCities?.length > 0 && (
				<div className="bg-[#FFFDF9] border-[2.5px] border-black rounded-[24px] p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
					<span className="text-xs font-black uppercase text-[#EE2C2C] tracking-wider block mb-2">
						Operating Cities
					</span>
					<div className="flex flex-wrap gap-2">
						{profile.operatingCities.map((city) => (
							<span
								key={city}
								className="px-3 py-1 bg-[#EE2C2C] text-white text-xs font-bold rounded-full shadow-sm"
							>
								{city}
							</span>
						))}
					</div>
				</div>
			)}

			{/* Placeholder Content Area */}
			<div className="border-[3px] border-dashed border-black/20 rounded-[28px] p-12 flex flex-col items-center justify-center text-center gap-4 bg-slate-50/50 mt-4 min-h-[300px]">
				<div className="size-16 rounded-full bg-[#FFD9D9] border-2 border-black flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
					📍
				</div>
				<div className="max-w-md">
					<h2 className="font-heading text-xl font-black text-black">
						Spaces Features Launching Soon
					</h2>
					<p className="text-sm font-medium text-black/60 mt-1 leading-relaxed">
						Venue catalog listings, calendar availability, and direct RFP matching with community organizers will appear here.
					</p>
				</div>
			</div>
		</div>
	)
}
