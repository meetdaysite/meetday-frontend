"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/Skeleton"
import {
	getBrandCommunities,
	getAllPublishedSponsorships,
	type BrandCommunity,
	type PublishedSponsorshipProposal,
} from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"

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

				{/* Status Badge */}
				<span className="absolute top-2 left-2 text-[7px] font-black px-1.5 py-0.5 border-[2px] border-black rounded-full uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] bg-green-400 text-black">
					Published
				</span>
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

				<div className="flex flex-wrap gap-1.5 mt-2">
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
			</div>
		</button>
	)
}

export default function BrandCommunitiesPage() {
	const router = useRouter()
	const [communities, setCommunities] = useState<BrandCommunity[]>([])
	const [proposals, setProposals] = useState<PublishedSponsorshipProposal[]>([])
	const [selectedCommunity, setSelectedCommunity] = useState<BrandCommunity | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

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
							const searchParams = new URLSearchParams(window.location.search);
							const cid = searchParams.get("communityId");
							if (cid) {
								const found = commRes.communities.find(c => c.id === cid)
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

	return (
		<div className="flex flex-col min-h-full bg-white">
			{/* Top Nav / Subheader */}
			<div className="flex justify-between items-center px-8 py-4 border-b border-black/10 shrink-0">
				<p className="text-sm font-semibold text-black/50 mx-auto">
					Welcome to <span className="text-[#EE2C2C] font-bold">Meetday</span>
				</p>
			</div>

			<div className="px-4 lg:px-6 py-6 max-w-6xl w-full mx-auto flex-grow flex flex-col gap-6 min-h-0">
				{selectedCommunity ? (
					<>
						<div>
							<button
								type="button"
								onClick={() => setSelectedCommunity(null)}
								className="flex items-center gap-1.5 text-xs font-bold text-black/50 hover:text-black transition-colors mb-4"
							>
								<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
								</svg>
								Back to Communities
							</button>
						</div>

						<div className="flex flex-col gap-6 overflow-y-auto h-[calc(100vh-14rem)] pb-6 px-1">
							
							<div>
								<h2 className="text-xl font-heading font-black text-black mb-3">Community Profile Details</h2>
								
								{/* Horizontally Spread Community Profile Card */}
								<div className="border-[3px] border-black p-6 rounded-[28px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white flex flex-col gap-6 items-start">
									
									{/* Top Row: Logo & Name/Members (occupy the same height) */}
									<div className="flex items-center gap-6 w-full">
										{/* Community Logo */}
										<div className="relative size-24 rounded-2xl overflow-hidden border-2 border-black bg-slate-50 shrink-0">
											{selectedCommunity.logoUrl ? (
												<Image src={selectedCommunity.logoUrl} alt={selectedCommunity.name} fill className="object-cover" unoptimized />
											) : (
												<div className="w-full h-full bg-slate-100 flex items-center justify-center text-black/40 font-black text-lg">
													{selectedCommunity.name.substring(0, 2).toUpperCase()}
												</div>
											)}
										</div>

										{/* Name & Members badge (occupying same height as logo) */}
										<div className="flex flex-col justify-center h-24 min-w-0">
											<h3 className="text-2xl font-heading font-black text-black leading-tight truncate">
												{selectedCommunity.name}
											</h3>
											
											<div className="flex flex-wrap items-center gap-x-5 gap-y-3 mt-3">
												<div className="flex items-center gap-2">
													<span className="inline-block bg-[#F5C343] text-black border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-xs font-black px-3 py-1 rounded-md uppercase tracking-wider">
														{selectedCommunity.size}
													</span>
													<span className="text-xs font-black text-black/60 uppercase tracking-wider">
														Members
													</span>
												</div>
												<div className="flex items-center gap-2">
													<span className="inline-block bg-[#F5C343] text-black border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-xs font-black px-3 py-1 rounded-md uppercase tracking-wider">
														{selectedCommunity.avgGuestCount}
													</span>
													<span className="text-xs font-black text-black/60 uppercase tracking-wider">
														Avg Guests
													</span>
												</div>
												<div className="flex items-center gap-2">
													<span className="inline-block bg-[#F5C343] text-black border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-xs font-black px-3 py-1 rounded-md uppercase tracking-wider">
														{selectedCommunity.experiencesPerYear}
													</span>
													<span className="text-xs font-black text-black/60 uppercase tracking-wider">
														Events / Yr
													</span>
												</div>
											</div>
										</div>
									</div>

									{/* About Section (starts from absolute left below logo) */}
									{(selectedCommunity.about || (activeProposals.length > 0 && activeProposals[0].community?.about)) && (
										<div className="flex flex-col gap-1.5 w-full">
											<span className="text-xs font-bold text-black/50">About the community</span>
											<p className="text-sm font-semibold text-black/75 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-black/5 whitespace-pre-wrap w-full">
												{selectedCommunity.about || (activeProposals.length > 0 && activeProposals[0].community?.about)}
											</p>
										</div>
									)}


									{/* Experience Categories */}
									{selectedCommunity.categories.length > 0 && (
										<div className="flex flex-col gap-2 w-full">
											<span className="text-xs font-bold text-black/50">Experience Categories</span>
											<div className="flex flex-wrap gap-1.5 mt-1">
												{selectedCommunity.categories.map((cat) => (
													<span key={cat.id} className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black bg-[#EE2C2C] text-white border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider">
														{cat.name}
													</span>
												))}
											</div>
										</div>
									)}

									{/* Operating Cities Section */}
									{selectedCommunity.operatingCities && selectedCommunity.operatingCities.length > 0 && (
										<div className="flex flex-col gap-2 w-full">
											<span className="text-xs font-bold text-black/50">Operating Cities</span>
											<div className="flex flex-wrap gap-1.5">
												{selectedCommunity.operatingCities.map((city) => (
													<span key={city} className="px-3 py-1 bg-slate-50 text-black/70 border border-black/10 rounded-lg text-xs font-bold uppercase tracking-wider">
														{city}
													</span>
												))}
											</div>
										</div>
									)}

									{/* Social Links */}
									{selectedCommunity.socialLinks && Object.keys(selectedCommunity.socialLinks).length > 0 && Object.values(selectedCommunity.socialLinks).some(Boolean) && (
										<div className="flex flex-col gap-2.5 border-t border-black/10 pt-4 w-full">
											<span className="text-xs font-bold text-black/50">Digital Presence</span>
											<div className="flex flex-col gap-2">
												{selectedCommunity.socialLinks.instagram && (
													<div className="flex justify-between items-center text-sm font-semibold">
														<span className="text-black/40">Instagram</span>
														<a href={selectedCommunity.socialLinks.instagram.startsWith('http') ? selectedCommunity.socialLinks.instagram : `https://${selectedCommunity.socialLinks.instagram}`} target="_blank" rel="noreferrer" className="text-green-600 hover:text-green-700 hover:underline font-bold">
															View
														</a>
													</div>
												)}
												{selectedCommunity.socialLinks.linkedin && (
													<div className="flex justify-between items-center text-sm font-semibold">
														<span className="text-black/40">LinkedIn</span>
														<a href={selectedCommunity.socialLinks.linkedin.startsWith('http') ? selectedCommunity.socialLinks.linkedin : `https://${selectedCommunity.socialLinks.linkedin}`} target="_blank" rel="noreferrer" className="text-green-600 hover:text-green-700 hover:underline font-bold">
															View
														</a>
													</div>
												)}
												{selectedCommunity.socialLinks.youtube && (
													<div className="flex justify-between items-center text-sm font-semibold">
														<span className="text-black/40">YouTube</span>
														<a href={selectedCommunity.socialLinks.youtube.startsWith('http') ? selectedCommunity.socialLinks.youtube : `https://${selectedCommunity.socialLinks.youtube}`} target="_blank" rel="noreferrer" className="text-green-600 hover:text-green-700 hover:underline font-bold">
															View
														</a>
													</div>
												)}
												{selectedCommunity.socialLinks.website && (
													<div className="flex justify-between items-center text-sm font-semibold">
														<span className="text-black/40">Website</span>
														<a href={selectedCommunity.socialLinks.website.startsWith('http') ? selectedCommunity.socialLinks.website : `https://${selectedCommunity.socialLinks.website}`} target="_blank" rel="noreferrer" className="text-green-600 hover:text-green-700 hover:underline font-bold">
															View
														</a>
													</div>
												)}
											</div>
										</div>
									)}

								</div>
							</div>

							{/* Active Proposals Section below */}
							<div className="flex flex-col gap-4 mt-4">
								<h2 className="text-xl font-heading font-black text-black">Active Proposals</h2>
								{activeProposals.length === 0 ? (
									<div className="flex flex-col gap-6">
										<p className="text-sm font-semibold text-black/50 bg-slate-50 border-2 border-black border-dashed rounded-2xl p-6 text-center">
											No active proposals from this community yet.
										</p>
										{proposals.length > 0 && (
											<div className="mt-4 flex flex-col gap-4">
												<h3 className="text-lg font-heading font-black text-black/60">Other Published Proposals</h3>
												<div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60 grayscale-[50%]">
													{proposals.map((proposal) => (
														<ProposalCard
															key={proposal.id}
															proposal={proposal}
															onClick={() => router.push(`/brand/dashboard/proposal/${proposal.id}`)}
														/>
													))}
												</div>
											</div>
										)}
									</div>
								) : (
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										{activeProposals.map((proposal) => (
											<ProposalCard
												key={proposal.id}
												proposal={proposal}
												onClick={() => router.push(`/brand/dashboard/proposal/${proposal.id}`)}
											/>
										))}
									</div>
								)}
							</div>
						</div>
					</>
				) : (
					<>
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
					</>
				)}
			</div>
		</div>
	)
}
