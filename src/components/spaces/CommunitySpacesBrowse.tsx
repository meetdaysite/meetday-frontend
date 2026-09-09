"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Skeleton } from "@/components/ui/Skeleton"
import { getCommunitySpacesBrowse, type BrowseSpaceCommunity } from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"

function formatExternalUrl(url?: string | null) {
	if (!url) return null
	const trimmed = url.trim()
	if (!trimmed) return null
	return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function SpaceCard({ space, onClick }: { space: BrowseSpaceCommunity; onClick: () => void }) {
	return (
		<div
			onClick={onClick}
			className="group cursor-pointer flex flex-col bg-white border-[3px] border-black rounded-[24px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all overflow-hidden h-full animate-in fade-in zoom-in-95 duration-150"
		>
			<div className="relative w-full aspect-square bg-slate-50 shrink-0 border-b-[3px] border-black">
				{space.logoUrl ? (
					<Image src={space.logoUrl} alt={space.name} fill className="object-cover group-hover:scale-[1.02] transition-transform duration-300" unoptimized />
				) : (
					<div className="w-full h-full bg-slate-100 flex items-center justify-center text-black/30 font-black text-3xl">
						{space.name.substring(0, 2).toUpperCase()}
					</div>
				)}
			</div>
			<div className="p-4 flex flex-col items-start gap-2 w-full text-left">
				<p className="text-sm font-black text-black line-clamp-2 leading-tight group-hover:text-[#EE2C2C] transition-colors">{space.name}</p>
				<div className="flex items-center gap-1.5 mt-auto flex-wrap">
					<span className="inline-block bg-[#F5C343] text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
						{space.communitySize}
					</span>
					<span className="text-[10px] font-black text-black/50 uppercase tracking-wider">Members</span>
				</div>
			</div>
		</div>
	)
}

function SpaceDetailModal({ space, onClose }: { space: BrowseSpaceCommunity; onClose: () => void }) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
			<div
				onClick={(e) => e.stopPropagation()}
				className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white border-[3px] border-black rounded-[24px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col gap-5"
			>
				<div className="flex items-start justify-between gap-4">
					<div className="flex items-center gap-3">
						{space.logoUrl && (
							<div className="relative size-16 rounded-full overflow-hidden border-2 border-black shrink-0">
								<Image src={space.logoUrl} alt={space.name} fill className="object-cover" unoptimized />
							</div>
						)}
						<div>
							<h2 className="text-xl font-black text-black">{space.name}</h2>
							{space.businessName && <p className="text-xs font-bold text-black/50">{space.businessName}</p>}
						</div>
					</div>
					<button onClick={onClose} className="shrink-0 size-8 rounded-full border-2 border-black flex items-center justify-center font-black hover:bg-black hover:text-white transition-colors">
						×
					</button>
				</div>

				{space.posterUrl && (
					<div className="relative w-full aspect-[4/5] max-h-64 rounded-xl overflow-hidden border-2 border-black">
						<Image src={space.posterUrl} alt={`${space.name} poster`} fill className="object-cover" unoptimized />
					</div>
				)}

				<p className="text-sm text-black/80 whitespace-pre-wrap">{space.about}</p>

				<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
					{[
						{ label: "Venues", value: space.numberOfVenues },
						{ label: "Capacity", value: space.venueCapacity },
						{ label: "Community", value: space.communitySize },
						{ label: "Exp/Year", value: space.experiencesPerYear },
					].map((stat) => (
						<div key={stat.label} className="flex flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-black bg-slate-50 py-2">
							<span className="text-sm font-black text-black">{stat.value}</span>
							<span className="text-[9px] font-black uppercase tracking-wider text-black/50">{stat.label}</span>
						</div>
					))}
				</div>

				{space.categories.length > 0 && (
					<div className="flex flex-wrap gap-1.5">
						{space.categories.map((c) => (
							<span key={c.id} className="rounded-full bg-black/5 border border-black/20 px-2.5 py-1 text-xs font-bold text-black/70">
								{c.name}
							</span>
						))}
					</div>
				)}

				{space.activeLocations.length > 0 && (
					<div>
						<p className="text-[10px] font-black uppercase tracking-wider text-black/40 mb-1.5">Active Locations</p>
						<div className="flex flex-wrap gap-1.5">
							{space.activeLocations.map((loc) => (
								<span key={loc} className="rounded-full bg-black/5 border border-black/20 px-2.5 py-1 text-xs font-bold text-black/70">
									{loc}
								</span>
							))}
						</div>
					</div>
				)}

				{space.videoLink && (
					<a href={formatExternalUrl(space.videoLink) ?? undefined} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[#6C32D1] underline">
						Watch video
					</a>
				)}

				{space.centreShowcaseUrls.length > 0 && (
					<div>
						<p className="text-[10px] font-black uppercase tracking-wider text-black/40 mb-1.5">Centre Showcase</p>
						<div className="flex flex-wrap gap-2">
							{space.centreShowcaseUrls.map((url, i) => (
								// eslint-disable-next-line @next/next/no-img-element
								<img key={i} src={url} alt={`${space.name} showcase ${i + 1}`} className="size-20 rounded-lg object-cover border-2 border-black" />
							))}
						</div>
					</div>
				)}

				{space.brandsWorkedWith && space.brandsWorkedWith.length > 0 && (
					<div>
						<p className="text-[10px] font-black uppercase tracking-wider text-black/40 mb-1.5">Associated Brands</p>
						<div className="flex flex-wrap gap-2">
							{space.brandsWorkedWith.map((brand, i) => {
								const href = formatExternalUrl(brand.url)
								const content = (
									<div className="flex items-center gap-2 rounded-lg border-2 border-black bg-slate-50 px-2.5 py-1.5">
										{brand.logoUrl ? (
											// eslint-disable-next-line @next/next/no-img-element
											<img src={brand.logoUrl} alt={brand.brandName || "Brand"} className="size-6 rounded object-cover" />
										) : (
											<span className="size-6 rounded bg-black/10 flex items-center justify-center text-[10px] font-black">
												{(brand.brandName || "B").charAt(0).toUpperCase()}
											</span>
										)}
										<span className="text-xs font-bold text-black">{brand.brandName || "Brand"}</span>
									</div>
								)
								return href ? (
									<a key={i} href={href} target="_blank" rel="noopener noreferrer">
										{content}
									</a>
								) : (
									<div key={i}>{content}</div>
								)
							})}
						</div>
					</div>
				)}

				{space.pastEvents && space.pastEvents.length > 0 && (
					<div>
						<p className="text-[10px] font-black uppercase tracking-wider text-black/40 mb-1.5">Past Events</p>
						<div className="flex flex-col gap-2">
							{space.pastEvents.map((event, i) => (
								<div key={i} className="rounded-lg border-2 border-black bg-slate-50 p-3">
									{event.name && <p className="text-sm font-black text-black">{event.name}</p>}
									{event.description && <p className="text-xs text-black/70 mt-1 whitespace-pre-wrap">{event.description}</p>}
									{event.imageUrls.length > 0 && (
										<div className="flex gap-2 mt-2">
											{event.imageUrls.map((url, j) => (
												// eslint-disable-next-line @next/next/no-img-element
												<img key={j} src={url} alt={event.name || "Past event"} className="size-16 rounded-md object-cover border-2 border-black" />
											))}
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export function CommunitySpacesBrowse() {
	const [spaces, setSpaces] = useState<BrowseSpaceCommunity[] | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [selected, setSelected] = useState<BrowseSpaceCommunity | null>(null)

	useEffect(() => {
		let cancelled = false
		getCommunitySpacesBrowse()
			.then((r) => {
				if (!cancelled) setSpaces(r.spaces)
			})
			.catch((e) => {
				if (!cancelled) setError(getApiErrorMessage(e))
			})
		return () => {
			cancelled = true
		}
	}, [])

	return (
		<div className="p-6 lg:p-8 flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-black text-black">Community Spaces</h1>
				<p className="text-sm text-black/60 mt-1">Discover co-working spaces, gyms, and venues onboarded to Meetday.</p>
			</div>

			{error && <p className="text-sm font-bold text-red-600">{error}</p>}

			{!spaces && !error && (
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
					{[...Array(8)].map((_, i) => (
						<Skeleton.Block key={i} className="aspect-square rounded-[24px]" />
					))}
				</div>
			)}

			{spaces && spaces.length === 0 && <p className="text-sm text-black/50">No community spaces available yet.</p>}

			{spaces && spaces.length > 0 && (
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
					{spaces.map((space) => (
						<SpaceCard key={space.id} space={space} onClick={() => setSelected(space)} />
					))}
				</div>
			)}

			{selected && <SpaceDetailModal space={selected} onClose={() => setSelected(null)} />}
		</div>
	)
}
