"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import clsx from "clsx"
import type { Category, PastEvent, BrandWorkedWith } from "@/lib/api"

export type CommunityDetailData = {
	id: string
	hostProfileId?: string
	name: string
	about?: string | null
	logoUrl?: string | null
	size?: string | null
	avgGuestCount?: string | null
	experiencesPerYear?: string | null
	operatingCities?: string[] | null
	socialLinks?: {
		instagram?: string
		linkedin?: string
		youtube?: string
		website?: string
	} | null
	categories?: Category[]
	secondaryImageUrl?: string | null
	pastEvents?: PastEvent[]
	brandsWorkedWith?: BrandWorkedWith[]
}

export type CommunityDetailProposal = {
	id: string
	name?: string | null
	about?: string | null
	imageUrl?: string | null
	city?: string | null
	eventDate?: string | null
	eventEndDate?: string | null
	guestCount?: string | null
	sponsorshipType?: "CASH" | "BARTER" | "BOTH" | null
	hostProfile?: {
		displayName?: string | null
		user?: {
			firstName?: string | null
			lastName?: string | null
		} | null
	} | null
}

function formatExternalUrl(url?: string | null) {
	if (!url) return null
	const trimmed = url.trim()
	if (!trimmed) return null
	return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export function ProposalCard({
	proposal,
	onClick,
}: {
	proposal: CommunityDetailProposal
	onClick?: () => void
}) {
	const hostName =
		proposal.hostProfile?.displayName ||
		[proposal.hostProfile?.user?.firstName, proposal.hostProfile?.user?.lastName].filter(Boolean).join(" ") ||
		"Host"
	const displayDate = proposal.eventDate
		? new Date(proposal.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
		: ""

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

interface BrandCommunityDetailViewProps {
	community: CommunityDetailData
	activeProposals?: CommunityDetailProposal[]
	otherProposals?: CommunityDetailProposal[]
	onBack: () => void
	backLabel?: string
	isBrandPreview?: boolean
	onProposalClick?: (proposalId: string) => void
}

export function BrandCommunityDetailView({
	community,
	activeProposals = [],
	otherProposals = [],
	onBack,
	backLabel = "Back to Communities",
	isBrandPreview = false,
	onProposalClick,
}: BrandCommunityDetailViewProps) {
	const [isPosterEnlarged, setIsPosterEnlarged] = useState(false)
	const [selectedExperienceIndex, setSelectedExperienceIndex] = useState<number | null>(null)
	const [viewAllExperiencesMode, setViewAllExperiencesMode] = useState(false)

	const flatExperienceImages = (community.pastEvents || []).flatMap((event, eventIdx) => {
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
			<div className="hidden sm:flex justify-between items-center px-8 py-4 border-b border-black/10 shrink-0">
				<p className="text-sm font-semibold text-black/50 mx-auto">
					Welcome to <span className="text-[#EE2C2C] font-bold">Meetday</span>
				</p>
			</div>

			<div className="px-4 lg:px-6 py-6 max-w-6xl w-full mx-auto flex-grow flex flex-col gap-6 min-h-0">
				{/* Top Bar with Back Button & Optional Brand Preview notice */}
				<div className="flex flex-col gap-3">
					{isBrandPreview && (
						<div className="flex items-center justify-between bg-[#FFF9E5] border-[2.5px] border-black rounded-2xl px-4 py-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
							<div className="flex items-center gap-2.5">
								<span className="inline-block size-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
								<span className="text-xs font-black text-black">Brand Preview Mode</span>
								<span className="text-xs font-semibold text-black/60 hidden sm:inline">
									— This is exactly how brands see your community profile and active curated experiences on Meetday.
								</span>
							</div>
							<span className="text-[10px] font-black uppercase tracking-wider bg-black text-[#FFC940] px-2.5 py-1 rounded-lg shrink-0">
								Brand View
							</span>
						</div>
					)}

					<div>
						<button
							type="button"
							onClick={onBack}
							className="flex items-center gap-1.5 text-xs font-bold text-black/50 hover:text-black transition-colors mb-2 cursor-pointer"
						>
							<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
							</svg>
							{backLabel}
						</button>
					</div>
				</div>

				<div className="flex flex-col gap-6 overflow-y-auto flex-1 min-h-0 w-full pb-6 px-1">
					{viewAllExperiencesMode ? (
						<>
							<div className="flex justify-between items-center mb-2">
								<div>
									<h2 className="text-2xl font-heading font-black text-black">All Past Experiences</h2>
									<p className="text-sm font-semibold text-black/50">From {community.name}</p>
								</div>
								<button
									type="button"
									onClick={() => setViewAllExperiencesMode(false)}
									className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-black/5 border-2 border-black rounded-xl font-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all active:translate-y-[1px] cursor-pointer"
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

								{/* Grid to place details card and poster side-by-side */}
								<div
									className={clsx(
										"grid gap-6 items-start",
										community.secondaryImageUrl
											? "grid-cols-1 lg:grid-cols-[1fr_320px]"
											: "grid-cols-1"
									)}
								>
									{/* Horizontally Spread Community Profile Card */}
									<div className="border-[3px] border-black p-4 sm:p-6 rounded-[28px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white flex flex-col gap-6 items-start w-full max-w-full min-w-0">
										{/* Top Row: Logo on the left, Name & stacked stats on the right */}
										<div className="flex flex-row items-start gap-4 sm:gap-6 w-full text-left">
											<div className="relative size-24 rounded-2xl overflow-hidden border-2 border-black bg-slate-50 shrink-0">
												{community.logoUrl ? (
													<Image src={community.logoUrl} alt={community.name} fill className="object-cover" unoptimized />
												) : (
													<div className="w-full h-full bg-slate-100 flex items-center justify-center text-black/40 font-black text-lg">
														{community.name.substring(0, 2).toUpperCase()}
													</div>
												)}
											</div>

											<div className="flex flex-col justify-between sm:justify-start min-h-[96px] sm:min-h-0 min-w-0 flex-1">
												<h3 className="text-xl sm:text-2xl font-heading font-black text-black leading-tight">
													{community.name}
												</h3>

												<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-x-5 mt-2 sm:mt-3">
													<div className="flex items-center gap-2">
														<span className="inline-block bg-[#F5C343] text-black border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-[10px] sm:text-xs font-black px-2 py-0.5 sm:px-3 sm:py-1 rounded-md uppercase tracking-wider">
															{community.size || "—"}
														</span>
														<span className="text-[10px] sm:text-xs font-black text-black/60 uppercase tracking-wider">
															Members
														</span>
													</div>
													<div className="flex items-center gap-2">
														<span className="inline-block bg-[#F5C343] text-black border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-[10px] sm:text-xs font-black px-2 py-0.5 sm:px-3 sm:py-1 rounded-md uppercase tracking-wider">
															{community.avgGuestCount || "—"}
														</span>
														<span className="text-[10px] sm:text-xs font-black text-black/60 uppercase tracking-wider">
															Avg Guests
														</span>
													</div>
													<div className="flex items-center gap-2">
														<span className="inline-block bg-[#F5C343] text-black border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-[10px] sm:text-xs font-black px-2 py-0.5 sm:px-3 sm:py-1 rounded-md uppercase tracking-wider">
															{community.experiencesPerYear || "—"}
														</span>
														<span className="text-[10px] sm:text-xs font-black text-black/60 uppercase tracking-wider">
															Events / Yr
														</span>
													</div>
												</div>
											</div>
										</div>

										{/* About Section */}
										{community.about && (
											<div className="flex flex-col gap-1.5 w-full">
												<span className="text-xs font-bold text-black/50">About The Community</span>
												<p className="text-sm font-semibold text-black/75 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-black/5 whitespace-pre-wrap w-full">
													{community.about}
												</p>
											</div>
										)}

										{/* Experience Categories */}
										{community.categories && community.categories.length > 0 && (
											<div className="flex flex-col gap-2 w-full">
												<span className="text-xs font-bold text-black/50">Experience Categories</span>
												<div className="flex flex-wrap gap-1.5 mt-1">
													{community.categories.map((cat) => (
														<span
															key={cat.id}
															className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black bg-[#EE2C2C] text-white border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider"
														>
															{cat.name}
														</span>
													))}
												</div>
											</div>
										)}

										{/* Cities and Social Links Row */}
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full border-t border-black/10 pt-4">
											{/* Operating Cities Section */}
											<div className="flex flex-col gap-2">
												<span className="text-xs font-bold text-black/50">Operating Cities</span>
												{community.operatingCities && community.operatingCities.length > 0 ? (
													<div className="flex flex-wrap gap-1.5">
														{community.operatingCities.map((city) => (
															<span
																key={city}
																className="px-3 py-1 bg-slate-50 text-black/70 border border-black/10 rounded-lg text-xs font-bold uppercase tracking-wider"
															>
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
												{community.socialLinks &&
												Object.keys(community.socialLinks).length > 0 &&
												Object.values(community.socialLinks).some(Boolean) ? (
													<div className="flex flex-wrap gap-1.5">
														{community.socialLinks.instagram && (
															<a
																href={
																	community.socialLinks.instagram.startsWith("http")
																		? community.socialLinks.instagram
																		: `https://${community.socialLinks.instagram}`
																}
																target="_blank"
																rel="noreferrer"
																className="px-3 py-1 bg-slate-50 text-[#EE2C2C] border border-black/10 hover:border-black/30 hover:bg-black/5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors inline-block"
															>
																Instagram
															</a>
														)}
														{community.socialLinks.linkedin && (
															<a
																href={
																	community.socialLinks.linkedin.startsWith("http")
																		? community.socialLinks.linkedin
																		: `https://${community.socialLinks.linkedin}`
																}
																target="_blank"
																rel="noreferrer"
																className="px-3 py-1 bg-slate-50 text-[#EE2C2C] border border-black/10 hover:border-black/30 hover:bg-black/5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors inline-block"
															>
																LinkedIn
															</a>
														)}
														{community.socialLinks.youtube && (
															<a
																href={
																	community.socialLinks.youtube.startsWith("http")
																		? community.socialLinks.youtube
																		: `https://${community.socialLinks.youtube}`
																}
																target="_blank"
																rel="noreferrer"
																className="px-3 py-1 bg-slate-50 text-[#EE2C2C] border border-black/10 hover:border-black/30 hover:bg-black/5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors inline-block"
															>
																YouTube
															</a>
														)}
														{community.socialLinks.website && (
															<a
																href={
																	community.socialLinks.website.startsWith("http")
																		? community.socialLinks.website
																		: `https://${community.socialLinks.website}`
																}
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
										{community.brandsWorkedWith &&
											community.brandsWorkedWith.filter((b) => b.logoUrl || b.brandName).length > 0 && (
												<div className="flex flex-col gap-2 w-full border-t border-black/10 pt-4">
													<span className="text-xs font-bold text-black/50">Associated Brands</span>
													<div className="flex flex-wrap gap-2.5">
														{community.brandsWorkedWith
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
																				<img
																					src={brand.logoUrl}
																					alt={brand.brandName || "Brand logo"}
																					className="size-full object-cover"
																				/>
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
																	<a key={idx} href={href} target="_blank" rel="noopener noreferrer" className="inline-block">
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
									{community.secondaryImageUrl && (
										<div className="border-[3px] border-black p-5 rounded-[28px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white flex flex-col gap-3 items-start shrink-0 w-full lg:w-[320px]">
											<span className="text-xs font-bold text-black/50 uppercase tracking-wider">Community Poster</span>
											<div
												onClick={() => setIsPosterEnlarged(true)}
												className="relative w-full aspect-[4/5] rounded-[20px] border-2 border-black overflow-hidden bg-slate-900 cursor-pointer group flex items-center justify-center"
											>
												<Image
													src={community.secondaryImageUrl}
													alt="Community Poster"
													fill
													className="object-contain transition-transform duration-300 group-hover:scale-105"
													unoptimized
												/>
												<div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
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
												className="text-xs font-black text-[#6C32D1] hover:underline cursor-pointer"
											>
												View All &gt;
											</button>
										)}
									</div>

									<div className="flex flex-row overflow-x-auto gap-4 py-2 custom-scrollbar w-full">
										{flatExperienceImages.slice(0, 10).map((img, idx) => (
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
												className="flex flex-col items-center justify-center shrink-0 w-48 h-[278px] rounded-[24px] border-[3px] border-dashed border-black hover:bg-black/5 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[2px] hover:translate-x-[2px] text-xs font-black uppercase text-black cursor-pointer"
											>
												<span>+ View All</span>
												<span className="text-[10px] font-bold text-black/55 mt-1">
													({flatExperienceImages.length} images)
												</span>
											</button>
										)}
									</div>
								</div>
							)}

							{/* Active Proposals Section */}
							<div className="flex flex-col gap-4 mt-6">
								<h2 className="text-xl font-heading font-black text-black">Active Proposals</h2>
								{activeProposals.length === 0 ? (
									<div className="flex flex-col gap-6">
										<p className="text-sm font-semibold text-black/50 bg-slate-50 border-2 border-black border-dashed rounded-2xl p-6 text-center">
											No active proposals from this community yet.
										</p>
										{otherProposals.length > 0 && (
											<div className="mt-4 flex flex-col gap-4">
												<h3 className="text-lg font-heading font-black text-black/60">Other Published Proposals</h3>
												<div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60 grayscale-[50%]">
													{otherProposals.map((proposal) => (
														<ProposalCard
															key={proposal.id}
															proposal={proposal}
															onClick={() => onProposalClick?.(proposal.id)}
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
												onClick={() => onProposalClick?.(proposal.id)}
											/>
										))}
									</div>
								)}
							</div>
						</>
					)}
				</div>
			</div>

			{/* Poster Image Enlargement Modal */}
			{isPosterEnlarged && community.secondaryImageUrl && (
				<div
					className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200"
					onClick={() => setIsPosterEnlarged(false)}
				>
					<div
						className="relative max-w-2xl w-full max-h-[90vh] flex flex-col items-center justify-center p-2"
						onClick={(e) => e.stopPropagation()}
					>
						<button
							type="button"
							onClick={() => setIsPosterEnlarged(false)}
							aria-label="Close enlarged poster"
							className="absolute -top-4 -right-4 z-10 size-10 rounded-full bg-white text-black border-2 border-black flex items-center justify-center font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
						>
							✕
						</button>
						<div className="relative w-full aspect-[4/5] max-h-[85vh] rounded-[24px] border-[3px] border-black overflow-hidden bg-slate-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
							<Image
								src={community.secondaryImageUrl}
								alt="Enlarged poster"
								fill
								className="object-contain"
								unoptimized
							/>
						</div>
					</div>
				</div>
			)}

			{/* Experience Detail Popup Modal - Extra Large, Proportional, Adaptive Layout */}
			{currentExp && (
				<div 
					onClick={() => setSelectedExperienceIndex(null)}
					className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 cursor-zoom-out"
				>
					<div 
						onClick={(e) => e.stopPropagation()}
						className="relative max-w-[96vw] xl:max-w-7xl 2xl:max-w-[1440px] w-full bg-white border-[3px] border-black rounded-[28px] sm:rounded-[32px] p-4 sm:p-6 md:p-7 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4 max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150 cursor-default"
					>
						{/* Top Header with title and controls */}
						<div className="flex items-center justify-between gap-4 w-full shrink-0 border-b-2 border-black/15 pb-3.5">
							<div className="flex flex-col gap-0.5 min-w-0">
								<span className="text-xs font-black text-[#EE2C2C] uppercase tracking-wider">
									Experience #{currentExp.eventNumber}
								</span>
								<h3 className="text-lg sm:text-2xl md:text-3xl font-heading font-black text-black truncate">
									{currentExp.name || `Experience #${currentExp.eventNumber}`}
								</h3>
							</div>

							<div className="flex items-center gap-3 shrink-0">
								{flatExperienceImages.length > 1 && (
									<span className="px-3.5 py-1.5 bg-black text-white text-xs sm:text-sm font-black rounded-full border border-black select-none">
										{(selectedExperienceIndex ?? 0) + 1} / {flatExperienceImages.length}
									</span>
								)}
								<button
									type="button"
									onClick={() => setSelectedExperienceIndex(null)}
									className="size-10 sm:size-11 rounded-full bg-white hover:bg-neutral-100 border-[2.5px] border-black flex items-center justify-center text-black font-black text-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer select-none active:scale-95"
									aria-label="Close details"
								>
									✕
								</button>
							</div>
						</div>

						{/* Content Area: If description exists -> side-by-side grid; if no description -> full-width large hero image */}
						{currentExp.description ? (
							<div className="flex-1 min-h-0 p-2 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch overflow-y-auto lg:overflow-visible">
								{/* Left: Image Showcase */}
								<div className="lg:col-span-7 xl:col-span-7 relative w-full h-[340px] sm:h-[420px] lg:h-full min-h-0 max-h-[66vh] rounded-[22px] sm:rounded-[24px] border-[3px] border-black bg-neutral-950/5 overflow-hidden flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] shrink-0">
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img 
										src={currentExp.url} 
										alt={currentExp.name || "Experience Image"} 
										className="w-full h-full object-contain p-2.5 select-none" 
									/>

									{/* Navigation Arrows inside image container */}
									{flatExperienceImages.length > 1 && (
										<>
											<button
												type="button"
												onClick={handlePrevExperience}
												aria-label="Previous image"
												className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-10 size-11 sm:size-12 rounded-full bg-white/95 hover:bg-[#FFC940] text-black border-[2.5px] border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer select-none"
											>
												<svg className="size-5 sm:size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
													<polyline points="15 18 9 12 15 6" />
												</svg>
											</button>

											<button
												type="button"
												onClick={handleNextExperience}
												aria-label="Next image"
												className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-10 size-11 sm:size-12 rounded-full bg-white/95 hover:bg-[#FFC940] text-black border-[2.5px] border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer select-none"
											>
												<svg className="size-5 sm:size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
													<polyline points="9 18 15 12 9 6" />
												</svg>
											</button>

											{/* Image Index Pill overlay */}
											<div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs font-black px-3.5 py-1 rounded-full backdrop-blur-xs select-none pointer-events-none border border-white/20 shadow-xs">
												Photo {currentExp.imgIdx + 1} of {currentExp.totalImages}
											</div>
										</>
									)}
								</div>

								{/* Right: Description Column */}
								<div className="lg:col-span-5 xl:col-span-5 flex flex-col min-h-0 h-full">
									<div className="bg-[#FFC940] text-black p-5 sm:p-6 rounded-[22px] sm:rounded-[24px] border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col h-full min-h-0">
										<p className="text-xs sm:text-sm font-black uppercase tracking-wider text-black/70 mb-2.5 shrink-0">
											About This Experience
										</p>
										<div className="flex-1 min-h-0 overflow-y-auto pr-1">
											<p className="whitespace-pre-wrap font-bold text-sm sm:text-base leading-relaxed text-black">
												{currentExp.description}
											</p>
										</div>
									</div>
								</div>
							</div>
						) : (
							/* Full-Width Hero Image when no description is present */
							<div className="flex-1 min-h-0 w-full flex items-center justify-center p-2">
								<div className="relative w-full h-full max-h-[66vh] md:max-h-[70vh] min-h-0 rounded-[22px] sm:rounded-[24px] border-[3px] border-black bg-neutral-950/5 overflow-hidden flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img 
										src={currentExp.url} 
										alt={currentExp.name || "Experience Image"} 
										className="w-full h-full max-h-[66vh] md:max-h-[70vh] object-contain p-2.5 sm:p-4 select-none" 
									/>

									{/* Navigation Arrows inside image container */}
									{flatExperienceImages.length > 1 && (
										<>
											<button
												type="button"
												onClick={handlePrevExperience}
												aria-label="Previous image"
												className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-10 size-11 sm:size-12 rounded-full bg-white/95 hover:bg-[#FFC940] text-black border-[2.5px] border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer select-none"
											>
												<svg className="size-5 sm:size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
													<polyline points="15 18 9 12 15 6" />
												</svg>
											</button>

											<button
												type="button"
												onClick={handleNextExperience}
												aria-label="Next image"
												className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-10 size-11 sm:size-12 rounded-full bg-white/95 hover:bg-[#FFC940] text-black border-[2.5px] border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer select-none"
											>
												<svg className="size-5 sm:size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
													<polyline points="9 18 15 12 9 6" />
												</svg>
											</button>

											{/* Image Index Pill overlay */}
											<div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs font-black px-3.5 py-1 rounded-full backdrop-blur-xs select-none pointer-events-none border border-white/20 shadow-xs">
												Photo {currentExp.imgIdx + 1} of {currentExp.totalImages}
											</div>
										</>
									)}
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	)
}
