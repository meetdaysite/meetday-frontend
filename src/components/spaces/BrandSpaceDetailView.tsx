"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import clsx from "clsx"
import type { Category, PastEvent, BrandWorkedWith } from "@/lib/api"

export type SpaceDetailData = {
	id: string
	spaceProfileId?: string
	name: string
	about?: string | null
	logoUrl?: string | null
	posterUrl?: string | null
	numberOfVenues?: string | null
	venueCapacity?: string | null
	communitySize?: string | null
	experiencesPerYear?: string | null
	activeLocations?: string[]
	centreShowcaseUrls?: string[]
	videoLink?: string | null
	businessName?: string | null
	operatingCities?: string[]
	socialLinks?: {
		instagram?: string
		linkedin?: string
		youtube?: string
		website?: string
	} | null
	categories?: Category[]
	pastEvents?: PastEvent[]
	brandsWorkedWith?: BrandWorkedWith[]
	popupDays?: string | null
	popupPrice?: string | null
	brandingDays?: string | null
	brandingPrice?: string | null
}

function formatExternalUrl(url?: string | null) {
	if (!url) return null
	const trimmed = url.trim()
	if (!trimmed) return null
	return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export interface BrandSpaceDetailViewProps {
	space: SpaceDetailData
	onBack?: () => void
	backLabel?: string
	isBrandPreview?: boolean
	onCollaborateClick?: () => void
}

export function BrandSpaceDetailView({
	space,
	onBack,
	backLabel = "Back to Profile",
	isBrandPreview = false,
	onCollaborateClick,
}: BrandSpaceDetailViewProps) {
	const [isPosterEnlarged, setIsPosterEnlarged] = useState(false)
	const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null)
	const [selectedExperienceIndex, setSelectedExperienceIndex] = useState<number | null>(null)
	const [viewAllExperiencesMode, setViewAllExperiencesMode] = useState(false)

	// Flatten all images across all past experiences with their parent event metadata
	const flatExperienceImages: Array<{
		url: string
		eventIndex: number
		eventNumber: number
		imgIdx: number
		totalImages: number
		name?: string
		description?: string
	}> = []

	if (space.pastEvents && Array.isArray(space.pastEvents)) {
		space.pastEvents.forEach((event, eventIdx) => {
			if (event.imageUrls && Array.isArray(event.imageUrls)) {
				event.imageUrls.forEach((url, imgIdx) => {
					flatExperienceImages.push({
						url,
						eventIndex: eventIdx,
						eventNumber: eventIdx + 1,
						imgIdx,
						totalImages: event.imageUrls?.length ?? 1,
						name: event.name ?? undefined,
						description: event.description ?? undefined,
					})
				})
			}
		})
	}

	const handlePrevExperience = () => {
		if (selectedExperienceIndex !== null && flatExperienceImages.length > 0) {
			setSelectedExperienceIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : flatExperienceImages.length - 1))
		}
	}

	const handleNextExperience = () => {
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
									— This is exactly how brands and communities see your Community Hub profile on Meetday.
								</span>
							</div>
							<span className="text-[10px] font-black uppercase tracking-wider bg-black text-[#FFC940] px-2.5 py-1 rounded-lg shrink-0">
								Brand View
							</span>
						</div>
					)}

					{onBack && (
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
					)}
				</div>

				<div className="flex flex-col gap-6 overflow-y-auto flex-1 min-h-0 w-full pb-6 px-1">
					{viewAllExperiencesMode ? (
						<>
							<div className="flex justify-between items-center mb-2">
								<div>
									<h2 className="text-2xl font-heading font-black text-black">All Past Experiences</h2>
									<p className="text-sm font-semibold text-black/50">From {space.name}</p>
								</div>
								<button
									type="button"
									onClick={() => setViewAllExperiencesMode(false)}
									className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-black/5 border-2 border-black rounded-xl font-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
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
												<Image src={img.url} alt={img.name || `Event #${img.eventNumber}`} fill className="object-cover" unoptimized />
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
								<div className="flex items-center justify-between gap-3 mb-3">
									<h2 className="text-xl font-heading font-black text-black">Community Hub Details</h2>
									{isBrandPreview ? (
										<div className="flex items-center gap-2">
											<span className="text-xs font-bold text-black/50 hidden sm:inline">Brand Interaction CTA:</span>
											<button
												type="button"
												disabled
												className="shrink-0 text-xs font-black px-4 py-2.5 rounded-xl uppercase tracking-wider border-2 border-black bg-[#EE2C2C] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] opacity-90 cursor-not-allowed select-none"
												title="This is the collaborate button brands will see"
											>
												Collaborate
											</button>
										</div>
									) : (
										<button
											type="button"
											onClick={onCollaborateClick}
											className="shrink-0 text-xs font-black px-4 py-2.5 rounded-xl uppercase tracking-wider border-2 border-black bg-[#EE2C2C] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all select-none cursor-pointer"
										>
											Collaborate
										</button>
									)}
								</div>

								{/* Grid to place details card and poster side-by-side */}
								<div className={clsx("grid gap-6 items-start", space.posterUrl ? "grid-cols-1 lg:grid-cols-[1fr_320px]" : "grid-cols-1")}>
									{/* Horizontally Spread Community Hub Profile Card */}
									<div className="border-[3px] border-black p-4 sm:p-6 rounded-[28px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white flex flex-col gap-6 items-start w-full max-w-full min-w-0">
										{/* Top Row: Logo on the left, Name & stacked stats on the right */}
										<div className="flex flex-row items-start gap-4 sm:gap-6 w-full text-left">
											{/* Hub Logo */}
											<div className="relative size-24 rounded-2xl overflow-hidden border-2 border-black bg-slate-50 shrink-0">
												{space.logoUrl ? (
													<Image src={space.logoUrl} alt={space.name} fill className="object-cover" unoptimized />
												) : (
													<div className="w-full h-full bg-[#FFCE29] flex items-center justify-center text-black font-heading font-black text-2xl">
														{space.name ? space.name.substring(0, 2).toUpperCase() : "HB"}
													</div>
												)}
											</div>

											{/* Name & stacked stats */}
											<div className="flex flex-col justify-between sm:justify-start min-h-[96px] sm:min-h-0 min-w-0 flex-1">
												<h3 className="text-xl sm:text-2xl font-heading font-black text-black leading-tight">
													{space.name}
												</h3>
												{space.businessName && (
													<p className="text-xs font-bold text-black/50 mt-0.5">
														Hosted by {space.businessName}
													</p>
												)}

												<div className="flex flex-wrap items-center gap-2 sm:gap-x-4 mt-2 sm:mt-3">
													{space.numberOfVenues && (
														<div className="flex items-center gap-1.5">
															<span className="inline-block bg-[#F5C343] text-black border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-[10px] sm:text-xs font-black px-2 py-0.5 sm:px-3 sm:py-1 rounded-md uppercase tracking-wider">
																{space.numberOfVenues}
															</span>
															<span className="text-[10px] sm:text-xs font-black text-black/60 uppercase tracking-wider">
																Venues
															</span>
														</div>
													)}
													{space.venueCapacity && (
														<div className="flex items-center gap-1.5">
															<span className="inline-block bg-[#F5C343] text-black border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-[10px] sm:text-xs font-black px-2 py-0.5 sm:px-3 sm:py-1 rounded-md uppercase tracking-wider">
																{space.venueCapacity}
															</span>
															<span className="text-[10px] sm:text-xs font-black text-black/60 uppercase tracking-wider">
																Capacity
															</span>
														</div>
													)}
													{space.communitySize && (
														<div className="flex items-center gap-1.5">
															<span className="inline-block bg-[#F5C343] text-black border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-[10px] sm:text-xs font-black px-2 py-0.5 sm:px-3 sm:py-1 rounded-md uppercase tracking-wider">
																{space.communitySize}
															</span>
															<span className="text-[10px] sm:text-xs font-black text-black/60 uppercase tracking-wider">
																Members
															</span>
														</div>
													)}
													{space.experiencesPerYear && (
														<div className="flex items-center gap-1.5">
															<span className="inline-block bg-[#F5C343] text-black border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-[10px] sm:text-xs font-black px-2 py-0.5 sm:px-3 sm:py-1 rounded-md uppercase tracking-wider">
																{space.experiencesPerYear}
															</span>
															<span className="text-[10px] sm:text-xs font-black text-black/60 uppercase tracking-wider">
																Exp / Yr
															</span>
														</div>
													)}
												</div>
											</div>
										</div>

										{/* About Section */}
										{space.about && (
											<div className="flex flex-col gap-1.5 w-full">
												<span className="text-xs font-bold text-black/50">About The Hub</span>
												<p className="text-sm font-semibold text-black/75 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-black/5 whitespace-pre-wrap w-full">
													{space.about}
												</p>
											</div>
										)}

										{/* Experience Categories */}
										{space.categories && space.categories.length > 0 && (
											<div className="flex flex-col gap-2 w-full">
												<span className="text-xs font-bold text-black/50">Hub Categories</span>
												<div className="flex flex-wrap gap-1.5 mt-1">
													{space.categories.map((cat) => (
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

										{/* Branding & Activation Offerings */}
										{((space.popupDays && space.popupPrice) || (space.brandingDays && space.brandingPrice)) && (
											<div className="flex flex-col gap-2 w-full border-t border-black/10 pt-4">
												<span className="text-xs font-bold text-black/50">Branding and Activation Offerings</span>
												<div className="flex flex-wrap gap-3">
													{space.popupDays && space.popupPrice && (
														<div className="flex flex-col gap-1 border border-black/10 rounded-xl px-4 py-2.5 bg-slate-50">
															<span className="text-xs font-bold text-black">Pop-up Activation</span>
															<span className="text-xs font-bold text-[#6C32D1]">
																{space.popupDays} days · ₹{space.popupPrice}
															</span>
														</div>
													)}
													{space.brandingDays && space.brandingPrice && (
														<div className="flex flex-col gap-1 border border-black/10 rounded-xl px-4 py-2.5 bg-slate-50">
															<span className="text-xs font-bold text-black">Brand Display Space</span>
															<span className="text-xs font-bold text-[#6C32D1]">
																{space.brandingDays} days · ₹{space.brandingPrice}
															</span>
														</div>
													)}
												</div>
											</div>
										)}

										{/* Locations and Digital Presence Row */}
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full border-t border-black/10 pt-4">
											{/* Active Locations / Operating Cities */}
											<div className="flex flex-col gap-2">
												<span className="text-xs font-bold text-black/50">Active Locations</span>
												{space.activeLocations && space.activeLocations.length > 0 ? (
													<div className="flex flex-wrap gap-1.5">
														{space.activeLocations.map((loc) => (
															<span
																key={loc}
																className="px-3 py-1 bg-slate-50 text-black/70 border border-black/10 rounded-lg text-xs font-bold uppercase tracking-wider"
															>
																{loc}
															</span>
														))}
													</div>
												) : space.operatingCities && space.operatingCities.length > 0 ? (
													<div className="flex flex-wrap gap-1.5">
														{space.operatingCities.map((city) => (
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

											{/* Digital Presence */}
											<div className="flex flex-col gap-2">
												<span className="text-xs font-bold text-black/50">Digital Presence</span>
												<div className="flex flex-wrap gap-1.5">
													{space.socialLinks?.instagram && (
														<a
															href={formatExternalUrl(space.socialLinks.instagram)!}
															target="_blank"
															rel="noreferrer"
															className="px-3 py-1 bg-slate-50 text-[#EE2C2C] border border-black/10 hover:border-black/30 hover:bg-black/5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors inline-block"
														>
															Instagram
														</a>
													)}
													{space.socialLinks?.linkedin && (
														<a
															href={formatExternalUrl(space.socialLinks.linkedin)!}
															target="_blank"
															rel="noreferrer"
															className="px-3 py-1 bg-slate-50 text-[#EE2C2C] border border-black/10 hover:border-black/30 hover:bg-black/5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors inline-block"
														>
															LinkedIn
														</a>
													)}
													{space.socialLinks?.youtube && (
														<a
															href={formatExternalUrl(space.socialLinks.youtube)!}
															target="_blank"
															rel="noreferrer"
															className="px-3 py-1 bg-slate-50 text-[#EE2C2C] border border-black/10 hover:border-black/30 hover:bg-black/5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors inline-block"
														>
															YouTube
														</a>
													)}
													{space.socialLinks?.website && (
														<a
															href={formatExternalUrl(space.socialLinks.website)!}
															target="_blank"
															rel="noreferrer"
															className="px-3 py-1 bg-slate-50 text-[#EE2C2C] border border-black/10 hover:border-black/30 hover:bg-black/5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors inline-block"
														>
															Website
														</a>
													)}
													{space.videoLink && (
														<a
															href={formatExternalUrl(space.videoLink)!}
															target="_blank"
															rel="noreferrer"
															className="px-3 py-1 bg-[#6C32D1] text-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-[#6C32D1]/90 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors inline-block"
														>
															▶ Watch Video
														</a>
													)}
													{!space.socialLinks?.instagram &&
														!space.socialLinks?.linkedin &&
														!space.socialLinks?.youtube &&
														!space.socialLinks?.website &&
														!space.videoLink && (
															<span className="text-xs font-semibold text-black/40">Not specified</span>
														)}
												</div>
											</div>
										</div>

										{/* Associated Brands */}
										{space.brandsWorkedWith &&
											space.brandsWorkedWith.filter((b) => b.logoUrl || b.brandName).length > 0 && (
												<div className="flex flex-col gap-2 w-full border-t border-black/10 pt-4">
													<span className="text-xs font-bold text-black/50">Associated Brands</span>
													<div className="flex flex-wrap gap-2.5">
														{space.brandsWorkedWith
															.filter((b) => b.logoUrl || b.brandName)
															.map((brand, idx) => {
																const href = formatExternalUrl(brand.url)
																const content = (
																	<div className="group relative" title={brand.brandName || (href ? brand.url ?? undefined : "Brand")}>
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

									{/* Poster (Highlight Poster) beside the details card */}
									{space.posterUrl && (
										<div className="border-[3px] border-black p-5 rounded-[28px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white flex flex-col gap-3 items-start shrink-0 w-full lg:w-[320px]">
											<span className="text-xs font-bold text-black/50 uppercase tracking-wider">Highlight Poster</span>
											<div
												onClick={() => setIsPosterEnlarged(true)}
												className="relative w-full aspect-[4/5] rounded-[20px] border-2 border-black overflow-hidden bg-slate-900 cursor-pointer group flex items-center justify-center"
											>
												<Image
													src={space.posterUrl}
													alt={`${space.name} poster`}
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

							{/* Centre Showcase Section */}
							{space.centreShowcaseUrls && space.centreShowcaseUrls.length > 0 && (
								<div className="flex flex-col gap-4 mt-6 w-full px-1">
									<div className="flex items-center gap-2">
										<h2 className="text-xl font-heading font-black text-black">Centre Showcase</h2>
										<span className="px-2 py-0.5 bg-[#FFC940] border-2 border-black text-black text-[10px] font-black uppercase rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
											{space.centreShowcaseUrls.length} Photo{space.centreShowcaseUrls.length > 1 ? "s" : ""}
										</span>
									</div>
									<div className="flex flex-row overflow-x-auto gap-4 pb-4 w-full scrollbar-thin scrollbar-thumb-black/20 shrink-0">
										{space.centreShowcaseUrls.map((url, idx) => (
											<div
												key={idx}
												onClick={() => setEnlargedImageUrl(url)}
												className="relative w-56 h-40 rounded-[20px] border-[3px] border-black overflow-hidden bg-slate-50 cursor-pointer group shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
											>
												<Image src={url} alt={`Centre showcase ${idx + 1}`} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
												<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
													<span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 text-black border-2 border-black px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
														Zoom 🔍
													</span>
												</div>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Past Experiences Section */}
							{flatExperienceImages.length > 0 && (
								<div className="flex flex-col gap-4 mt-6 w-full px-1">
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
									<div className="flex flex-row overflow-x-auto gap-5 pb-4 w-full scrollbar-thin scrollbar-thumb-black/20 shrink-0">
										{flatExperienceImages.slice(0, 5).map((img, idx) => (
											<div
												key={idx}
												onClick={() => setSelectedExperienceIndex(idx)}
												className="flex flex-col gap-2.5 items-center justify-between p-3 shrink-0 cursor-pointer bg-white border-[3px] border-black rounded-[24px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[2px] hover:translate-x-[2px] transition-all duration-150 w-48 hover:bg-slate-50/50"
											>
												<div className="relative w-full aspect-[4/5] rounded-[16px] border-2 border-black overflow-hidden bg-slate-50">
													<Image src={img.url} alt={img.name || `Experience #${img.eventNumber}`} fill className="object-cover" unoptimized />
													{img.totalImages > 1 && (
														<span className="absolute top-2 right-2 text-[9px] font-black text-black/40 bg-white/70 backdrop-blur-sm px-1.5 py-0.5 rounded border border-black/10 select-none">
															Image {img.imgIdx + 1}
														</span>
													)}
												</div>
												<span className="text-[11px] font-black text-black text-center mt-1 truncate w-full px-1">
													{img.name || `Experience #${img.eventNumber}`}
												</span>
											</div>
										))}
									</div>
								</div>
							)}
						</>
					)}
				</div>
			</div>

			{/* Modal: Fullscreen Poster View */}
			{isPosterEnlarged && space.posterUrl && (
				<div
					onClick={() => setIsPosterEnlarged(false)}
					className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
				>
					<div
						onClick={(e) => e.stopPropagation()}
						className="relative max-w-2xl max-h-[90vh] w-full bg-white border-[3px] border-black rounded-[28px] p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-3 overflow-hidden"
					>
						<button
							type="button"
							onClick={() => setIsPosterEnlarged(false)}
							className="absolute top-4 right-4 size-9 bg-white hover:bg-black/5 border-2 border-black rounded-full flex items-center justify-center font-black text-sm z-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
						>
							✕
						</button>
						<div className="relative w-full h-[70vh] rounded-[20px] overflow-hidden bg-slate-900 border-2 border-black mt-2">
							<Image src={space.posterUrl} alt={`${space.name} poster`} fill className="object-contain" unoptimized />
						</div>
						<p className="text-xs font-black text-black/60 uppercase tracking-wider">{space.name} Poster</p>
					</div>
				</div>
			)}

			{/* Modal: Enlarged Centre Showcase Photo View */}
			{enlargedImageUrl && (
				<div
					onClick={() => setEnlargedImageUrl(null)}
					className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
				>
					<div
						onClick={(e) => e.stopPropagation()}
						className="relative max-w-3xl max-h-[90vh] w-full bg-white border-[3px] border-black rounded-[28px] p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-3 overflow-hidden"
					>
						<button
							type="button"
							onClick={() => setEnlargedImageUrl(null)}
							className="absolute top-4 right-4 size-9 bg-white hover:bg-black/5 border-2 border-black rounded-full flex items-center justify-center font-black text-sm z-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
						>
							✕
						</button>
						<div className="relative w-full h-[70vh] rounded-[20px] overflow-hidden bg-slate-900 border-2 border-black mt-2">
							<Image src={enlargedImageUrl} alt="Centre showcase photo" fill className="object-contain" unoptimized />
						</div>
						<p className="text-xs font-black text-black/60 uppercase tracking-wider">Centre Showcase Photo</p>
					</div>
				</div>
			)}

			{/* Modal: Past Experience Image Slideshow */}
			{selectedExperienceIndex !== null && flatExperienceImages[selectedExperienceIndex] && (
				<div
					onClick={() => setSelectedExperienceIndex(null)}
					className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
				>
					<div
						onClick={(e) => e.stopPropagation()}
						className="relative max-w-3xl max-h-[90vh] w-full bg-white border-[3px] border-black rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4 overflow-y-auto"
					>
						{/* Close button */}
						<button
							type="button"
							onClick={() => setSelectedExperienceIndex(null)}
							className="absolute top-4 right-4 size-9 bg-white hover:bg-black/5 border-2 border-black rounded-full flex items-center justify-center font-black text-sm z-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
						>
							✕
						</button>

						{/* Header info */}
						<div className="flex items-center gap-3 pr-10">
							<span className="px-2.5 py-1 bg-[#F5C343] text-black border-2 border-black rounded-lg text-xs font-black uppercase tracking-wider shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
								Experience #{flatExperienceImages[selectedExperienceIndex].eventNumber}
							</span>
							<h3 className="font-heading font-black text-lg text-black truncate">
								{flatExperienceImages[selectedExperienceIndex].name || `Experience #${flatExperienceImages[selectedExperienceIndex].eventNumber}`}
							</h3>
						</div>

						{/* Big Image with Prev/Next buttons */}
						<div className="relative w-full h-[55vh] rounded-[20px] overflow-hidden bg-slate-900 border-2 border-black flex items-center justify-center">
							<Image
								src={flatExperienceImages[selectedExperienceIndex].url}
								alt={flatExperienceImages[selectedExperienceIndex].name || "Past experience"}
								fill
								className="object-contain"
								unoptimized
							/>

							{flatExperienceImages.length > 1 && (
								<>
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation()
											handlePrevExperience()
										}}
										className="absolute left-3 top-1/2 -translate-y-1/2 size-10 bg-white/90 hover:bg-white border-2 border-black rounded-full flex items-center justify-center font-black text-base shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-all cursor-pointer select-none"
										aria-label="Previous image"
									>
										‹
									</button>
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation()
											handleNextExperience()
										}}
										className="absolute right-3 top-1/2 -translate-y-1/2 size-10 bg-white/90 hover:bg-white border-2 border-black rounded-full flex items-center justify-center font-black text-base shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-all cursor-pointer select-none"
										aria-label="Next image"
									>
										›
									</button>
								</>
							)}

							{/* Counter chip */}
							<span className="absolute bottom-3 right-3 text-[10px] font-black text-white bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/20 select-none">
								{selectedExperienceIndex + 1} / {flatExperienceImages.length}
							</span>
						</div>

						{/* Description if present */}
						{flatExperienceImages[selectedExperienceIndex].description && (
							<p className="text-xs font-semibold text-black/70 leading-relaxed bg-slate-50 p-3 rounded-xl border border-black/5 whitespace-pre-wrap">
								{flatExperienceImages[selectedExperienceIndex].description}
							</p>
						)}
					</div>
				</div>
			)}
		</div>
	)
}
