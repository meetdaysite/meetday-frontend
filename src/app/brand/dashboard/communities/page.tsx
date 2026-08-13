"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Skeleton } from "@/components/ui/Skeleton"
import { getBrandCommunities, type BrandCommunity } from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"

function CommunityCard({ community }: { community: BrandCommunity }) {
	return (
		<div className="flex items-center gap-4 rounded-[20px] border-[3px] border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
			<div className="relative size-14 rounded-full overflow-hidden border-2 border-black bg-slate-50 shrink-0">
				{community.logoUrl ? (
					<Image src={community.logoUrl} alt={community.name} fill className="object-cover" unoptimized />
				) : null}
			</div>
			<div className="min-w-0 flex-1">
				<p className="text-base font-black text-black truncate">{community.name}</p>
				<p className="text-xs font-bold text-black/50 mt-0.5">
					{community.size} members · {community.experiencesPerYear} experiences/year
				</p>
				{community.categories.length > 0 && (
					<div className="flex flex-wrap gap-1.5 mt-2">
						{community.categories.map((c) => (
							<span key={c.id} className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-[#6C32D1] text-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
								{c.name}
							</span>
						))}
					</div>
				)}
			</div>
		</div>
	)
}

export default function BrandCommunitiesPage() {
	const [communities, setCommunities] = useState<BrandCommunity[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let cancelled = false
		getBrandCommunities()
			.then((res) => {
				if (!cancelled) setCommunities(res.communities)
			})
			.catch((e) => {
				if (!cancelled) setError(getApiErrorMessage(e))
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false)
			})
		return () => {
			cancelled = true
		}
	}, [])

	return (
		<div className="flex flex-col min-h-full bg-white">
			{/* Top Nav / Subheader */}
			<div className="flex justify-between items-center px-8 py-4 border-b border-black/10 shrink-0">
				<p className="text-sm font-semibold text-black/50 mx-auto">
					Welcome to <span className="text-[#EE2C2C] font-bold">Meetday</span>
				</p>
			</div>

			<div className="px-4 lg:px-6 py-6 max-w-6xl w-full mx-auto flex-1 flex flex-col gap-6">
				<div>
					<h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-black leading-tight">
						Communities
					</h1>
					<p className="text-sm font-semibold text-black/50 mt-2">
						Communities onboarded on Meetday, available for sponsorship.
					</p>
				</div>

				<div className="w-full">
					{isLoading ? (
						<div className="flex flex-col gap-4">
							{Array.from({ length: 5 }).map((_, i) => (
								<Skeleton key={i} className="h-24 border-[3px] border-black rounded-[20px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
							))}
						</div>
					) : error ? (
						<p className="text-sm font-bold text-red-600">{error}</p>
					) : communities.length === 0 ? (
						<p className="text-sm font-bold text-black/50">No communities onboarded yet.</p>
					) : (
						<div className="flex flex-col gap-4">
							{communities.map((community) => (
								<CommunityCard key={community.id} community={community} />
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
