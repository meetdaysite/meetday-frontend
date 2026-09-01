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
	const [isPosterEnlarged, setIsPosterEnlarged] = useState(false)
	const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null)
	const [selectedExperienceIndex, setSelectedExperienceIndex] = useState<number | null>(null)
	const [viewAllExperiencesMode, setViewAllExperiencesMode] = useState(false)

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

	const flatExperienceImages = selectedCommunity
		? (selectedCommunity.pastEvents || []).flatMap((event, eventIdx) => {
				const urls = event.imageUrls || []
				return urls.map((url, imgIdx) => ({
					url,
					eventNumber: eventIdx + 1,
					name: event.name,
					description: event.description,
					imageUrls: event.imageUrls,
					imgIdx,
					totalImages: urls.length,
				}))
		  })
		: []

	const currentExp =
		selectedExperienceIndex !== null && flatExperienceImages[selectedExperienceIndex]
			? flatExperienceImages[selectedExperienceIndex]
			: null

	const handlePrevExperience = (e?: React.MouseEvent) => {
		e?.stopPropagation()
		if (selectedExperienceIndex !== null && flatExperienceImages.length > 0) {
			setSelectedExperienceIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : flatExperienceImages.length - 1))
		}
	}

	const handleNextExperience = (e?: React.MouseEvent) => {
		e?.stopPropagation()
		if (selectedExperienceIndex !== null && flatExperienceImages.length > 0) {
			setSelectedExperienceIndex((prev) => (prev !== null && prev < flatExperienceImages.length - 1 ? prev + 1 : 0))
		}
	}

	useEffect(() => {
		if (selectedExperienceIndex === null) return
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === "ArrowLeft") handlePrevExperience()
			if (e.key === "ArrowRight") handleNextExperience()
			if (e.key === "Escape") setSelectedExperienceIndex(null)
		}
		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	}, [selectedExperienceIndex, flatExperienceImages.length])

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

						<div className="flex flex-col gap-6 overflow-y-auto flex-1 min-h-0 w-full pb-6 px-1">
							{viewAllExperiencesMode ? (
								<>
									<div className="flex justify-between items-center mb-2">
										<div>
											<h2 className="text-2xl font-heading font-black text-black">All Past Experiences</h2>
											<p className="text-sm font-semibold text-black/50">From {selectedCommunity.name}</p>
										</div>
										<button
											type="button"
											onClick={() => setViewAllExperiencesMode(false)}
											className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-black/5 border-2 border-black rounded-xl font-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all active:translate-y-[1px]"
										>
											✕ Close
										</button>
									</div>

									<div className="border-[3px] border-black p-6 rounded-[28px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white w-full">
										<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
											{flatExperienceImages.map((img, idx) => (
												<div 
													key={idx}
													onClick={() => setSelectedExperienceIndex(idx)}
													className="flex flex-col gap-2.5 items-center justify-between p-3 shrink-0 cursor-pointer bg-white border-[3px] border-black rounded-[24px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[2px] hover:translate-x-[2px] transition-all duration-150 hover:bg-slate-50/50"
												>
													<div className="relative w-full aspect-[4/5] rounded-[16px] border-2 border-black overflow-hidden bg-slate-50">
														<Image 
															src={img.url} 
															alt={img.name || `Event #${img.eventNumber}`} 
															fill
															className="object-cover" 
															unoptimized
														/>
														{img.totalImages > 1 && (
															<span className="absolute top-2 right-2 text-[9px] font-black text-black/40 bg-white/70 backdrop-blur-sm px-1.5 py-0.5 rounded border border-black/10 select-none">
																Image {img.imgIdx + 1}
															</span>
														)}
													</div>
													<span className="text-[11px] font-black text-black text-center mt-1 truncate w-full px-1">
														{img.name || `Event #${img.eventNumber}`}
													</span>
												</div>
											))}
										</div>
									</div>
								</>
							) : (
								<>
									<div>
								<h2 className="text-xl font-heading font-black text-black mb-3">Community Profile Details</h2>
								
								{/* Grid to place details card and poster side-by-side (collapses to full width if no poster) */}
								<div className={clsx(
									"grid gap-6 items-start",
									(selectedCommunity.secondaryImageUrl || (activeProposals.length > 0 && activeProposals[0].community?.secondaryImageUrl))
										? "grid-cols-1 lg:grid-cols-[1fr_320px]"
										: "grid-cols-1"
								)}>
									{/* Horizontally Spread Community Profile Card */}
									<div className="border-[3px] border-black p-4 sm:p-6 rounded-[28px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white flex flex-col gap-6 items-start w-full max-w-full min-w-0">
									
									{/* Top Row: Logo on the left, Name & stacked stats on the right (left-aligned) */}
									<div className="flex flex-row items-start gap-4 sm:gap-6 w-full text-left">
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

										{/* Name & stacked stats, occupying same height space as Logo */}
										<div className="flex flex-col justify-between sm:justify-start min-h-[96px] sm:min-h-0 min-w-0 flex-1">
											<h3 className="text-xl sm:text-2xl font-heading font-black text-black leading-tight">
												{selectedCommunity.name}
											</h3>
											
											<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-x-5 mt-2 sm:mt-3">
												<div className="flex items-center gap-2">
													<span className="inline-block bg-[#F5C343] text-black border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-[10px] sm:text-xs font-black px-2 py-0.5 sm:px-3 sm:py-1 rounded-md uppercase tracking-wider">
														{selectedCommunity.size}
													</span>
													<span className="text-[10px] sm:text-xs font-black text-black/60 uppercase tracking-wider">
														Members
													</span>
												</div>
												<div className="flex items-center gap-2">
													<span className="inline-block bg-[#F5C343] text-black border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-[10px] sm:text-xs font-black px-2 py-0.5 sm:px-3 sm:py-1 rounded-md uppercase tracking-wider">
														{selectedCommunity.avgGuestCount}
													</span>
													<span className="text-[10px] sm:text-xs font-black text-black/60 uppercase tracking-wider">
														Avg Guests
													</span>
												</div>
												<div className="flex items-center gap-2">
													<span className="inline-block bg-[#F5C343] text-black border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-[10px] sm:text-xs font-black px-2 py-0.5 sm:px-3 sm:py-1 rounded-md uppercase tracking-wider">
														{selectedCommunity.experiencesPerYear}
													</span>
													<span className="text-[10px] sm:text-xs font-black text-black/60 uppercase tracking-wider">
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

									{/* Cities and Social Links Row (Responsive) */}
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full border-t border-black/10 pt-4">
										{/* Operating Cities Section */}
										<div className="flex flex-col gap-2">
											<span className="text-xs font-bold text-black/50">Operating Cities</span>
											{selectedCommunity.operatingCities && selectedCommunity.operatingCities.length > 0 ? (
												<div className="flex flex-wrap gap-1.5">
													{selectedCommunity.operatingCities.map((city) => (
														<span key={city} className="px-3 py-1 bg-slate-50 text-black/70 border border-black/10 rounded-lg text-xs font-bold uppercase tracking-wider">
															{city}
														</span>
													))}
												</div>
											) : (
												<span className="text-xs font-semibold text-black/40">Not specified</span>
											)}
										</div>

										{/* Social Links Section */}
										<div className="flex flex-col gap-2">
											<span className="text-xs font-bold text-black/50">Digital Presence</span>
											{selectedCommunity.socialLinks && Object.keys(selectedCommunity.socialLinks).length > 0 && Object.values(selectedCommunity.socialLinks).some(Boolean) ? (
												<div className="flex flex-wrap gap-1.5">
													{selectedCommunity.socialLinks.instagram && (
														<a
															href={selectedCommunity.socialLinks.instagram.startsWith('http') ? selectedCommunity.socialLinks.instagram : `https://${selectedCommunity.socialLinks.instagram}`}
															target="_blank"
															rel="noreferrer"
															className="px-3 py-1 bg-slate-50 text-[#EE2C2C] border border-black/10 hover:border-black/30 hover:bg-black/5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors inline-block"
														>
															Instagram
														</a>
													)}
													{selectedCommunity.socialLinks.linkedin && (
														<a
															href={selectedCommunity.socialLinks.linkedin.startsWith('http') ? selectedCommunity.socialLinks.linkedin : `https://${selectedCommunity.socialLinks.linkedin}`}
															target="_blank"
															rel="noreferrer"
															className="px-3 py-1 bg-slate-50 text-[#EE2C2C] border border-black/10 hover:border-black/30 hover:bg-black/5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors inline-block"
														>
															LinkedIn
														</a>
													)}
													{selectedCommunity.socialLinks.youtube && (
														<a
															href={selectedCommunity.socialLinks.youtube.startsWith('http') ? selectedCommunity.socialLinks.youtube : `https://${selectedCommunity.socialLinks.youtube}`}
															target="_blank"
															rel="noreferrer"
															className="px-3 py-1 bg-slate-50 text-[#EE2C2C] border border-black/10 hover:border-black/30 hover:bg-black/5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors inline-block"
														>
															YouTube
														</a>
													)}
													{selectedCommunity.socialLinks.website && (
														<a
															href={selectedCommunity.socialLinks.website.startsWith('http') ? selectedCommunity.socialLinks.website : `https://${selectedCommunity.socialLinks.website}`}
															target="_blank"
															rel="noreferrer"
															className="px-3 py-1 bg-slate-50 text-[#EE2C2C] border border-black/10 hover:border-black/30 hover:bg-black/5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors inline-block"
														>
															Website
														</a>
													)}
												</div>
											) : (
												<span className="text-xs font-semibold text-black/40">Not specified</span>
											)}
										</div>
									</div>

									{/* Associated Brands */}
									{selectedCommunity.brandsWorkedWith && selectedCommunity.brandsWorkedWith.filter((b) => b.logoUrl || b.brandName).length > 0 && (
										<div className="flex flex-col gap-2 w-full border-t border-black/10 pt-4">
											<span className="text-xs font-bold text-black/50">Associated Brands</span>
											<div className="flex flex-wrap gap-2.5">
												{selectedCommunity.brandsWorkedWith
													.filter((b) => b.logoUrl || b.brandName)
													.map((brand, idx) => {
														const href = formatExternalUrl(brand.url)
														const content = (
															<div
																className="group relative"
																title={brand.brandName || (href ? brand.url ?? undefined : "Brand")}
															>
																<div className="size-12 aspect-square rounded-xl border-2 border-black bg-white overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:scale-115 transition-all duration-200 flex items-center justify-center cursor-pointer">
																	{brand.logoUrl ? (
																		// eslint-disable-next-line @next/next/no-img-element
																		<img src={brand.logoUrl} alt={brand.brandName || "Brand logo"} className="size-full object-cover" />
																	) : (
																		<span className="text-xs font-black text-black">
																			{(brand.brandName || "B").charAt(0).toUpperCase()}
																		</span>
																	)}
																</div>
																{(brand.brandName || brand.url) && (
																	<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
																		<span className="px-2.5 py-1 bg-black text-white text-[11px] font-bold rounded-lg whitespace-nowrap shadow-md">
																			{brand.brandName || brand.url}
																		</span>
																		<div className="w-2 h-2 bg-black rotate-45 -mt-1" />
																	</div>
																)}
															</div>
														)

														return href ? (
															<a
																key={idx}
																href={href}
																target="_blank"
																rel="noopener noreferrer"
																className="inline-block"
															>
																{content}
															</a>
														) : (
															<div key={idx} className="inline-block">
																{content}
															</div>
														)
													})}
											</div>
										</div>
									)}

								</div>

								{/* Poster (Secondary Image) beside the details card */}
								{(selectedCommunity.secondaryImageUrl || (activeProposals.length > 0 && activeProposals[0].community?.secondaryImageUrl)) && (
									<div className="border-[3px] border-black p-5 rounded-[28px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white flex flex-col gap-3 items-start shrink-0 w-full lg:w-[320px]">
										<span className="text-xs font-bold text-black/50 uppercase tracking-wider">Community Poster</span>
										<div 
											onClick={() => setIsPosterEnlarged(true)}
											className="relative w-full aspect-[4/5] rounded-[20px] border-2 border-black overflow-hidden bg-slate-50 cursor-pointer group"
										>
											<Image 
												src={selectedCommunity.secondaryImageUrl || activeProposals[0].community?.secondaryImageUrl} 
												alt="Community Poster" 
												fill 
												className="object-cover transition-transform duration-300 group-hover:scale-105" 
												unoptimized 
											/>
											<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
												<span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 text-black border-2 border-black px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
													Zoom Poster 🔍
												</span>
											</div>
										</div>
									</div>
								)}
							</div>
							</div>

							{/* Past Experiences Section */}
							{flatExperienceImages.length > 0 && (
								<div className="flex flex-col gap-4 mt-8 w-full px-1">
									<div className="flex items-center justify-between w-full">
										<div className="flex items-center gap-2">
											<h2 className="text-xl font-heading font-black text-black">Past Experiences</h2>
											<span className="px-2 py-0.5 bg-[#FFC940] border-2 border-black text-black text-[10px] font-black uppercase rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
												{flatExperienceImages.length} Image{flatExperienceImages.length > 1 ? "s" : ""}
											</span>
										</div>
										{flatExperienceImages.length > 5 && (
											<button
												type="button"
												onClick={() => setViewAllExperiencesMode(true)}
												className="text-xs font-black text-[#6C32D1] hover:underline"
											>
												View All &gt;
											</button>
										)}
									</div>
									<div className="flex flex-row overflow-x-auto gap-5 pb-4 w-full scrollbar-thin scrollbar-thumb-black/20 shrink-0">
										{flatExperienceImages.slice(0, 5).map((img, idx) => (
											<div 
												key={idx}
												onClick={() => setSelectedExperienceIndex(idx)}
												className="flex flex-col gap-2.5 items-center justify-between p-3 shrink-0 cursor-pointer bg-white border-[3px] border-black rounded-[24px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[2px] hover:translate-x-[2px] transition-all duration-150 w-48 hover:bg-slate-50/50"
											>
												<div className="relative w-full aspect-[4/5] rounded-[16px] border-2 border-black overflow-hidden bg-slate-50">
													<Image 
														src={img.url} 
														alt={img.name || `Event #${img.eventNumber}`} 
														fill
														className="object-cover"
														unoptimized
													/>
													{img.totalImages > 1 && (
														<span className="absolute top-2 right-2 text-[9px] font-black text-black/40 bg-white/70 backdrop-blur-sm px-1.5 py-0.5 rounded border border-black/10 select-none">
															Image {img.imgIdx + 1}
														</span>
													)}
												</div>
												<span className="text-[11px] font-black text-black text-center mt-1 truncate w-full px-1">
													{img.name || `Event #${img.eventNumber}`}
												</span>
											</div>
										))}
										{flatExperienceImages.length > 5 && (
											<button
												type="button"
												onClick={() => setViewAllExperiencesMode(true)}
												className="flex flex-col items-center justify-center shrink-0 w-48 h-[278px] rounded-[24px] border-[3px] border-dashed border-black hover:bg-black/5 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[2px] hover:translate-x-[2px] text-xs font-black uppercase text-black"
											>
												<span>+ View All</span>
												<span className="text-[10px] font-bold text-black/55 mt-1">({flatExperienceImages.length} images)</span>
											</button>
										)}
									</div>
								</div>
							)}

							{/* Active Proposals Section below */}
							<div className="flex flex-col gap-4 mt-6">
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
							</>
							)}
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

			{/* Zoomed Poster Modal */}
			{isPosterEnlarged && (selectedCommunity?.secondaryImageUrl || (activeProposals.length > 0 && activeProposals[0].community?.secondaryImageUrl)) && (
				<div 
					onClick={() => setIsPosterEnlarged(false)}
					className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-in fade-in duration-150 cursor-zoom-out"
				>
					<div 
						onClick={(e) => e.stopPropagation()}
						className="relative max-w-lg w-full bg-white border-[3px] border-black rounded-[28px] p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-3 items-start animate-in zoom-in-95 duration-150 cursor-default"
					>
						<button
							onClick={() => setIsPosterEnlarged(false)}
							className="absolute top-4 right-4 z-10 size-8 bg-white hover:bg-black/5 border-2 border-black rounded-full flex items-center justify-center text-black font-extrabold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all active:translate-y-[1px]"
							aria-label="Close enlarged poster"
						>
							✕
						</button>
						<span className="text-xs font-bold text-black/50 uppercase tracking-wider">Community Poster</span>
						<div className="relative w-full aspect-[4/5] rounded-[20px] border-2 border-black overflow-hidden bg-slate-50">
							<Image
								src={selectedCommunity?.secondaryImageUrl || activeProposals[0].community?.secondaryImageUrl}
								alt="Enlarged Community Poster"
								fill
								className="object-cover"
								unoptimized
							/>
						</div>
					</div>
				</div>
			)}
			{/* Zoomed Event Image Modal */}
			{enlargedImageUrl && (
				<div 
					onClick={() => setEnlargedImageUrl(null)}
					className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 cursor-zoom-out"
				>
					<div 
						onClick={(e) => e.stopPropagation()}
						className="relative max-w-2xl w-full bg-white border-[3px] border-black rounded-[28px] p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-3 items-start animate-in zoom-in-95 duration-150 cursor-default"
					>
						<button
							onClick={() => setEnlargedImageUrl(null)}
							className="absolute top-4 right-4 z-10 size-8 bg-white hover:bg-black/5 border-2 border-black rounded-full flex items-center justify-center text-black font-extrabold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all active:translate-y-[1px]"
							aria-label="Close enlarged image"
						>
							✕
						</button>
						<span className="text-xs font-bold text-black/50 uppercase tracking-wider">Event Image Preview</span>
						<div className="relative w-full aspect-[16/10] rounded-[20px] border-2 border-black overflow-hidden bg-slate-50">
							<Image
								src={enlargedImageUrl}
								alt="Enlarged Event Image"
								fill
								className="object-cover"
								unoptimized
							/>
						</div>
					</div>
				</div>
			)}
			{/* Experience Detail Popup Modal - Enriched, Extra Large, Dynamic Image-Fitted Border */}
			{currentExp && (
				<div 
					onClick={() => setSelectedExperienceIndex(null)}
					className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 md:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 cursor-zoom-out"
				>
					<div 
						onClick={(e) => e.stopPropagation()}
						className="relative max-w-[96vw] xl:max-w-7xl 2xl:max-w-[1500px] w-full bg-white border-[3px] border-black rounded-[28px] p-4 sm:p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4 max-h-[97vh] overflow-hidden animate-in zoom-in-95 duration-150 cursor-default"
					>
						{/* Top Header with title and controls */}
						<div className="flex items-center justify-between gap-4 w-full shrink-0">
							<div className="flex flex-col gap-0.5 min-w-0">
								<span className="text-[10px] sm:text-xs font-black text-[#EE2C2C] uppercase tracking-wider">
									Experience #{currentExp.eventNumber}
								</span>
								<h3 className="text-xl sm:text-2xl font-heading font-black text-black truncate">
									{currentExp.name || `Experience #${currentExp.eventNumber}`}
								</h3>
							</div>

							<div className="flex items-center gap-3 shrink-0">
								{flatExperienceImages.length > 1 && (
									<span className="px-3 py-1 bg-black text-white text-xs font-black rounded-full border border-black select-none">
										{(selectedExperienceIndex ?? 0) + 1} / {flatExperienceImages.length}
									</span>
								)}
								<button
									type="button"
									onClick={() => setSelectedExperienceIndex(null)}
									className="size-9 rounded-full bg-white hover:bg-neutral-100 border-[2.5px] border-black flex items-center justify-center text-black font-black text-base shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer select-none active:scale-95"
									aria-label="Close details"
								>
									✕
								</button>
							</div>
						</div>

						{/* Description box if present */}
						{currentExp.description && (
							<div className="bg-[#FFC940] text-black p-3.5 sm:p-4 rounded-[18px] border-2 border-black font-semibold text-xs sm:text-sm leading-relaxed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-left shrink-0 max-h-28 overflow-y-auto">
								<p className="whitespace-pre-wrap">{currentExp.description}</p>
							</div>
						)}

						{/* Image Area: border fits tightly around the image while arrows stay pinned to sides */}
						<div className="relative flex-1 min-h-[400px] max-h-[78vh] w-full flex items-center justify-center p-2">
							{/* Card containing only the image - sizes dynamically to image dimensions */}
							<div className="relative inline-flex items-center justify-center max-w-full max-h-[76vh] rounded-[22px] border-[3px] border-black overflow-hidden bg-slate-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img 
									src={currentExp.url} 
									alt={currentExp.name || "Experience Image"} 
									className="max-h-[76vh] max-w-full w-auto h-auto object-contain block select-none" 
								/>
							</div>

							{/* Previous Image Button (Left Arrow) - Stays pinned at left side of popup */}
							{flatExperienceImages.length > 1 && (
								<button
									type="button"
									onClick={handlePrevExperience}
									aria-label="Previous image"
									className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 size-10 sm:size-12 rounded-full bg-white hover:bg-[#FFC940] text-black border-[2.5px] border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer select-none"
								>
									<svg className="size-5 sm:size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
										<polyline points="15 18 9 12 15 6" />
									</svg>
								</button>
							)}

							{/* Next Image Button (Right Arrow) - Stays pinned at right side of popup */}
							{flatExperienceImages.length > 1 && (
								<button
									type="button"
									onClick={handleNextExperience}
									aria-label="Next image"
									className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 size-10 sm:size-12 rounded-full bg-white hover:bg-[#FFC940] text-black border-[2.5px] border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer select-none"
								>
									<svg className="size-5 sm:size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
										<polyline points="9 18 15 12 9 6" />
									</svg>
								</button>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
