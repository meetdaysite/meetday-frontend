"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { getBrandCommunities, getMySpaceHostChats, markSpaceHostInterest, type BrandCommunity } from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"
import { toast } from "@/lib/toast"
import { Skeleton } from "@/components/ui/Skeleton"

function CommunityCard({ community, onClick }: { community: BrandCommunity; onClick: () => void }) {
	return (
		<div
			onClick={onClick}
			className="group cursor-pointer flex flex-col bg-white border-[3px] border-black rounded-[24px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all overflow-hidden h-full animate-in fade-in zoom-in-95 duration-150"
		>
			<div className="relative w-full aspect-square bg-slate-50 shrink-0 border-b-[3px] border-black">
				{community.logoUrl ? (
					<Image src={community.logoUrl} alt={community.name} fill className="object-cover group-hover:scale-[1.02] transition-transform duration-300" unoptimized />
				) : (
					<div className="w-full h-full bg-slate-100 flex items-center justify-center text-black/30 font-black text-3xl">
						{community.name.substring(0, 2).toUpperCase()}
					</div>
				)}
			</div>
			<div className="p-4 flex flex-col items-start gap-2 w-full text-left">
				<p className="text-sm font-black text-black line-clamp-2 leading-tight group-hover:text-[#EE2C2C] transition-colors">{community.name}</p>
				<div className="flex items-center gap-1.5 mt-auto">
					<span className="inline-block bg-[#F5C343] text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
						{community.size}
					</span>
					<span className="text-[10px] font-black text-black/50 uppercase tracking-wider">Members</span>
				</div>
			</div>
		</div>
	)
}

export default function SpaceCommunitiesBrowsePage() {
	const [communities, setCommunities] = useState<BrandCommunity[] | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [selected, setSelected] = useState<BrandCommunity | null>(null)
	const [interestedHostIds, setInterestedHostIds] = useState<Set<string>>(new Set())
	const [sendingId, setSendingId] = useState<string | null>(null)

	useEffect(() => {
		let cancelled = false
		getBrandCommunities()
			.then((r) => {
				if (!cancelled) setCommunities(r.communities)
			})
			.catch((e) => {
				if (!cancelled) setError(getApiErrorMessage(e))
			})
		return () => {
			cancelled = true
		}
	}, [])

	useEffect(() => {
		let cancelled = false
		getMySpaceHostChats(undefined, "SPACE")
			.then((threads) => {
				if (cancelled) return
				setInterestedHostIds(new Set(threads.map((t) => t.hostProfileId)))
			})
			.catch(() => {})
		return () => {
			cancelled = true
		}
	}, [])

	async function handleMarkInterest() {
		if (!selected || sendingId) return
		setSendingId(selected.hostProfileId)
		try {
			await markSpaceHostInterest(selected.hostProfileId)
			setInterestedHostIds((prev) => new Set(prev).add(selected.hostProfileId))
			toast.success("Interest sent! We've notified the community.")
		} catch (e) {
			toast.error(getApiErrorMessage(e))
		} finally {
			setSendingId(null)
		}
	}

	const alreadyInterested = selected ? interestedHostIds.has(selected.hostProfileId) : false

	return (
		<div className="flex flex-col flex-1 min-h-0 bg-white">
			<div className="flex justify-between items-center px-8 py-4 border-b border-black/10 shrink-0">
				<p className="text-sm font-semibold text-black/50 mx-auto">
					Welcome to <span className="text-[#EE2C2C] font-bold">Meetday</span>
				</p>
			</div>

			<div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-6xl w-full mx-auto flex flex-col gap-4">
				<div>
					<h1 className="text-2xl sm:text-3xl font-heading font-black text-black">Communities</h1>
					<p className="text-xs sm:text-sm font-semibold text-black/50 mt-1">
						Browse onboarded communities and express interest in partnering with them.
					</p>
				</div>

				{error ? (
					<p className="text-sm font-semibold text-[#EE2C2C]">{error}</p>
				) : !communities ? (
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
						{Array.from({ length: 8 }).map((_, i) => (
							<Skeleton key={i} className="aspect-[4/5] rounded-[24px]" />
						))}
					</div>
				) : communities.length === 0 ? (
					<p className="text-sm font-semibold text-black/40 text-center py-12">No communities are onboarded yet.</p>
				) : (
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
						{communities.map((c) => (
							<CommunityCard key={c.id} community={c} onClick={() => setSelected(c)} />
						))}
					</div>
				)}
			</div>

			{selected && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
					onClick={(e) => {
						if (e.target === e.currentTarget) setSelected(null)
					}}
				>
					<div className="bg-white rounded-[24px] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg flex flex-col max-h-[90vh]">
						<div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-black shrink-0">
							<p className="text-lg font-black text-black truncate pr-4">{selected.name}</p>
							<button
								onClick={() => setSelected(null)}
								className="text-xl font-black text-black/40 hover:text-black transition-colors shrink-0"
								aria-label="Close"
							>
								×
							</button>
						</div>

						<div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3.5">
							<div className="relative w-full aspect-video rounded-2xl border-[3px] border-black overflow-hidden bg-slate-50 shrink-0">
								{selected.logoUrl ? (
									<Image src={selected.logoUrl} alt={selected.name} fill className="object-cover" unoptimized />
								) : (
									<div className="w-full h-full flex items-center justify-center text-black/30 font-black text-3xl">
										{selected.name.substring(0, 2).toUpperCase()}
									</div>
								)}
							</div>

							<p className="text-sm font-semibold text-black/70 whitespace-pre-wrap leading-relaxed">{selected.about}</p>

							<div className="flex flex-wrap items-center gap-1.5">
								<span className="inline-block bg-[#F5C343] text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
									{selected.size} Members
								</span>
								{selected.avgGuestCount && (
									<span className="inline-block bg-neutral-100 border border-black text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
										{selected.avgGuestCount} Avg Guests
									</span>
								)}
								{selected.experiencesPerYear && (
									<span className="inline-block bg-neutral-100 border border-black text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
										{selected.experiencesPerYear} Experiences/Year
									</span>
								)}
							</div>

							{selected.operatingCities?.length > 0 && (
								<p className="text-xs font-bold text-black/50">📍 {selected.operatingCities.join(", ")}</p>
							)}

							{selected.categories?.length > 0 && (
								<div className="flex flex-wrap gap-1.5">
									{selected.categories.map((cat) => (
										<span key={cat.id} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 border border-black/10 text-black/60">
											{cat.name}
										</span>
									))}
								</div>
							)}
						</div>

						<div className="flex items-center justify-end gap-3 px-6 py-4 border-t-[3px] border-black shrink-0 bg-neutral-50">
							<button
								type="button"
								onClick={() => setSelected(null)}
								className="px-4 py-2 rounded-xl text-black/60 hover:text-black font-extrabold text-xs transition-colors cursor-pointer"
							>
								Close
							</button>
							<button
								type="button"
								disabled={alreadyInterested || sendingId === selected.hostProfileId}
								onClick={handleMarkInterest}
								className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-[#EE2C2C] hover:bg-[#d42525] text-white font-black text-xs border-[2.5px] border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{alreadyInterested ? "Interest Sent" : sendingId === selected.hostProfileId ? "Sending…" : "I'm Interested"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
