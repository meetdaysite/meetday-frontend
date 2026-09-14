"use client"

import { useEffect, useState, Suspense } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Skeleton } from "@/components/ui/Skeleton"
import {
	getBrandCommunities,
	getAllPublishedSponsorships,
	type BrandCommunity,
	type PublishedSponsorshipProposal,
} from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"
import { BrandCommunityDetailView } from "@/components/community/BrandCommunityDetailView"
import clsx from "clsx"

function formatExternalUrl(url?: string | null) {
	if (!url) return null
	const trimmed = url.trim()
	if (!trimmed) return null
	return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export function CommunityCard({ community, onClick }: { community: BrandCommunity; onClick?: () => void }) {
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
					<span className="text-[10px] font-black text-black/50 uppercase tracking-wider">
						Members
					</span>
				</div>
			</div>
		</div>
	)
}

function ProposalCard({
	proposal,
	onClick,
}: {
	proposal: PublishedSponsorshipProposal
	onClick: () => void
}) {
	const hostName =
		proposal.hostProfile?.displayName ||
		[proposal.hostProfile?.user?.firstName, proposal.hostProfile?.user?.lastName].filter(Boolean).join(" ") ||
		"Host"
	const displayDate = proposal.eventDate ? new Date(proposal.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""

	return (
		<button
			type="button"
			onClick={onClick}
			className="group text-left relative cursor-pointer bg-white border-[3px] border-black rounded-[20px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all overflow-hidden flex flex-row w-full h-[150px]"
		>
			{/* Image / Logo */}
			<div className="relative w-[150px] h-full shrink-0 overflow-hidden bg-slate-50 border-r-[3px] border-black rounded-l-[17px]">
				{proposal.imageUrl ? (
					<Image
						src={proposal.imageUrl}
						alt={proposal.name || "Proposal"}
						fill
						className="object-cover group-hover:scale-[1.02] transition-transform duration-300 rounded-l-[14px]"
						unoptimized
					/>
				) : (
					<div className="w-full h-full bg-slate-100 flex items-center justify-center text-black/40 font-black text-sm">
						{proposal.name ? proposal.name.substring(0, 2).toUpperCase() : "MD"}
					</div>
				)}
			</div>

			{/* Content & Footer info */}
			<div className="flex-1 p-3 flex flex-col justify-between min-w-0">
				<div className="flex flex-col gap-1">
					<h3 className="font-heading font-black text-base text-black truncate group-hover:text-[#EE2C2C] transition-colors">
						{proposal.name}
					</h3>
					<p className="text-[11px] font-bold text-black/50 truncate">
						Hosted by {hostName} {proposal.city && `• ${proposal.city}`}
					</p>
					{proposal.about && (
						<p className="text-[11px] font-semibold text-black/70 line-clamp-2 mt-0.5 leading-normal">
							{proposal.about}
						</p>
					)}
				</div>

				<div className="flex items-center justify-between gap-1.5 mt-2">
					<div className="flex flex-wrap items-center gap-1.5 min-w-0">
						{displayDate && (
							<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-[#6C32D1] text-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
								{displayDate}
							</span>
						)}
						{proposal.guestCount && (
							<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-[#EE2C2C] text-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
								{proposal.guestCount} Guests
							</span>
						)}
					</div>
					<div className="flex items-center gap-1 shrink-0 ml-auto">
						{(proposal.sponsorshipType === "CASH" || proposal.sponsorshipType === "BOTH" || !proposal.sponsorshipType) && (
							<span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] bg-emerald-100 text-emerald-900 uppercase">
								Cash
							</span>
						)}
						{(proposal.sponsorshipType === "BARTER" || proposal.sponsorshipType === "BOTH") && (
							<span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] bg-[#FFC940] text-black uppercase">
								Barter
							</span>
						)}
					</div>
				</div>
			</div>
		</button>
	)
}

function BrandCommunitiesContent() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const urlCommunityId = searchParams ? searchParams.get("communityId") : null
	const [communities, setCommunities] = useState<BrandCommunity[]>([])
	const [proposals, setProposals] = useState<PublishedSponsorshipProposal[]>([])
	const [selectedCommunity, setSelectedCommunity] = useState<BrandCommunity | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (urlCommunityId && communities.length > 0) {
			const found = communities.find(
				(c) =>
					c.id === urlCommunityId ||
					c.hostProfileId === urlCommunityId ||
					c.name.toLowerCase().trim() === urlCommunityId.toLowerCase().trim()
			)
			if (found) setSelectedCommunity(found)
		}
	}, [urlCommunityId, communities])

	useEffect(() => {
		let cancelled = false
		setIsLoading(true)
		Promise.all([getBrandCommunities(), getAllPublishedSponsorships()])
			.then(async ([commRes, propRes]) => {
				if (!cancelled) {
					const proposalsWithDetails = await Promise.all(
						propRes.proposals.map(async (p) => {
							try {
								const detail = await import('@/lib/api').then(m => m.getPublishedSponsorshipDetail(p.id));
								return { ...p, communityId: detail.community?.id || null, community: detail.community } as PublishedSponsorshipProposal & { communityId?: string | null, community?: any };
							} catch (e) {
								return p as PublishedSponsorshipProposal & { communityId?: string | null, community?: any };
							}
						})
					);
					
					if (!cancelled) {
						setCommunities(commRes.communities)
						setProposals(proposalsWithDetails)
						
						if (typeof window !== "undefined") {
							const sp = new URLSearchParams(window.location.search);
							const cid = sp.get("communityId");
							if (cid) {
								const found = commRes.communities.find(
									c => c.id === cid || c.hostProfileId === cid || c.name.toLowerCase().trim() === cid.toLowerCase().trim()
								)
								if (found) setSelectedCommunity(found)
							}
						}
					}
				}
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

	const activeProposals = selectedCommunity
		? (proposals as (PublishedSponsorshipProposal & { communityId?: string | null, community?: any })[]).filter((p) => {
				if (p.communityId) {
					return p.communityId === selectedCommunity.id;
				}
				const cHostId = selectedCommunity.hostProfileId || selectedCommunity.id;
				const matchesId = p.hostProfileId === cHostId || p.hostProfile?.id === cHostId;
				
				const propName = p.hostProfile?.displayName?.toLowerCase().trim() || "";
				const commName = selectedCommunity.name?.toLowerCase().trim() || "";
				const matchesName = propName === commName || (commName.length > 3 && propName.includes(commName)) || (propName.length > 3 && commName.includes(propName));
				
				return matchesId || matchesName;
		  })
		: []
	if (selectedCommunity) {
		return (
			<BrandCommunityDetailView
				community={selectedCommunity}
				activeProposals={activeProposals}
				otherProposals={proposals}
				onBack={() => {
					setSelectedCommunity(null)
					router.replace("/brand/dashboard/communities")
				}}
				backLabel="Back to Communities"
				onProposalClick={(id) => router.push(`/brand/dashboard/proposal/${id}`)}
			/>
		)
	}

	return (
		<div className="flex flex-col min-h-full bg-white">
			{/* Top Nav / Subheader */}
			<div className="flex justify-between items-center px-8 py-4 border-b border-black/10 shrink-0">
				<p className="text-sm font-semibold text-black/50 mx-auto">
					Welcome to <span className="text-[#EE2C2C] font-bold">Meetday</span>
				</p>
			</div>

			<div className="px-4 lg:px-6 py-6 max-w-6xl w-full mx-auto flex-grow flex flex-col gap-6 min-h-0">
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
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 pt-2 px-2 pb-4">
							{communities.map((community) => (
								<CommunityCard
									key={community.id}
									community={community}
									onClick={() => setSelectedCommunity(community)}
								/>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default function BrandCommunitiesPage() {
	return (
		<Suspense fallback={<div className="p-8 text-center text-sm font-semibold text-black/50">Loading communities...</div>}>
			<BrandCommunitiesContent />
		</Suspense>
	)
}
