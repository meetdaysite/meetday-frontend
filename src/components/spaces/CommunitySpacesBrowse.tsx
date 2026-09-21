"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Skeleton } from "@/components/ui/Skeleton"
import { getCommunitySpacesBrowse, getMySpaceChats, getMySpaceHostChats, markSpaceInterest, type BrowseSpaceCommunity, type SpaceChatThread, type SpaceHostChatThread } from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"
import { toast } from "@/lib/toast"
import clsx from "clsx"

function formatExternalUrl(url?: string | null) {
	if (!url) return null
	const trimmed = url.trim()
	if (!trimmed) return null
	return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export function SpaceCard({ space, onClick }: { space: BrowseSpaceCommunity; onClick?: () => void }) {
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
						{space.venueCapacity ? `${space.venueCapacity} Capacity` : `${space.communitySize} Members`}
					</span>
					{space.numberOfVenues && (
						<span className="text-[10px] font-black text-black/50 uppercase tracking-wider">
							{space.numberOfVenues} Venues
						</span>
					)}
				</div>
			</div>
		</div>
	)
}

export function CommunitySpacesBrowse({ viewerRole }: { viewerRole?: "BRAND" | "COMMUNITY" } = {}) {
	const searchParams = useSearchParams()
	const urlSpaceId = searchParams?.get("spaceId")
	const [spaces, setSpaces] = useState<BrowseSpaceCommunity[] | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [selectedSpace, setSelectedSpace] = useState<BrowseSpaceCommunity | null>(null)
	const [isPosterEnlarged, setIsPosterEnlarged] = useState(false)
	const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null)
	const [selectedExperienceIndex, setSelectedExperienceIndex] = useState<number | null>(null)
	const [viewAllExperiencesMode, setViewAllExperiencesMode] = useState(false)
	const [spaceChatThreads, setSpaceChatThreads] = useState<SpaceChatThread[]>([])
	const [spaceHostChatThreads, setSpaceHostChatThreads] = useState<SpaceHostChatThread[]>([])
	const [sendingInterestId, setSendingInterestId] = useState<string | null>(null)

	useEffect(() => {
		if (urlSpaceId && spaces && spaces.length > 0) {
			const found = spaces.find((s) => s.id === urlSpaceId)
			if (found) {
				setSelectedSpace(found)
			}
		}
	}, [urlSpaceId, spaces])

	const fetchConnectedThreads = () => {
		if (!selectedSpace) return
		getMySpaceChats(undefined, viewerRole)
			.then((threads) => {
				setSpaceChatThreads(threads)
			})
			.catch(() => {})
		getMySpaceHostChats(undefined, "HOST")
			.then((threads) => {
				setSpaceHostChatThreads(threads)
			})
			.catch(() => {})
	}

	useEffect(() => {
		fetchConnectedThreads()
	}, [selectedSpace, viewerRole])

	async function handleMarkInterest() {
		if (!selectedSpace || sendingInterestId) return
		setSendingInterestId(selectedSpace.id)
		try {
			await markSpaceInterest(selectedSpace.id, undefined, viewerRole)
			toast.success("Interest sent! We've notified the hub.")
			fetchConnectedThreads()
		} catch (e) {
			toast.error(getApiErrorMessage(e))
		} finally {
			setSendingInterestId(null)
		}
	}

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

	const flatExperienceImages = selectedSpace
		? (selectedSpace.pastEvents || []).flatMap((event, eventIdx) => {
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
			<div className="hidden sm:flex justify-between items-center px-8 py-4 border-b border-black/10 shrink-0">
				<p className="text-sm font-semibold text-black/50 mx-auto">
					Welcome to <span className="text-[#EE2C2C] font-bold">Meetday</span>
				</p>
			</div>

			<div className="px-4 lg:px-6 py-6 max-w-6xl w-full mx-auto flex-grow flex flex-col gap-6 min-h-0">
				{selectedSpace ? (
					<>
						{/* Back to Browsing Button */}
						<div>
							<button
								type="button"
								onClick={() => {
									setSelectedSpace(null)
									setViewAllExperiencesMode(false)
								}}
								className="flex items-center gap-1.5 text-xs font-bold text-black/50 hover:text-black transition-colors mb-4 cursor-pointer"
							>
								<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
								</svg>
								Back to Browsing
							</button>
						</div>

						<div className="flex flex-col gap-6 overflow-y-auto flex-1 min-h-0 w-full pb-6 px-1">
							{viewAllExperiencesMode ? (
								<>
									<div className="flex justify-between items-center mb-2">
										<div>
											<h2 className="text-2xl font-heading font-black text-black">All Past Experiences</h2>
											<p className="text-sm font-semibold text-black/50">From {selectedSpace.name}</p>
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
												{(() => {
													const existingSpaceThread = spaceChatThreads.find((t) => t.spaceCommunityProfileId === selectedSpace.id)
													const existingSpaceHostThread = spaceHostChatThreads.find((t) => t.spaceProfileId === selectedSpace.spaceProfileId)
													const existingThread = existingSpaceThread || existingSpaceHostThread
													const hasExistingChannel = Boolean(existingThread)

													if (hasExistingChannel) {
														const redirectHref =
															viewerRole === "BRAND"
																? `/brand/dashboard/space-chats?threadId=${existingThread!.id}`
																: `/community/dashboard/space-chats?threadId=${existingThread!.id}`

														return (
															<div className="flex flex-col items-end gap-1.5">
																<p className="text-xs font-bold text-black/60 text-right">
																	A communication channel already exists with this hub.
																</p>
																<Link
																	href={redirectHref}
																	className="shrink-0 text-xs font-black px-4 py-2.5 rounded-xl uppercase tracking-wider border-2 border-black bg-[#FFC940] hover:bg-[#ffbe1a] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all inline-flex items-center gap-1.5 select-none"
																>
																	<span>Go to Channel</span>
																	<svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
																		<path d="M5 12h14m-7-7 7 7-7 7" />
																	</svg>
																</Link>
															</div>
														)
													}

													return (
														<button
															type="button"
															onClick={handleMarkInterest}
															disabled={sendingInterestId === selectedSpace.id}
															className="shrink-0 text-xs font-black px-4 py-2.5 rounded-xl uppercase tracking-wider border-2 border-black bg-[#EE2C2C] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-50 transition-all select-none"
														>
															{sendingInterestId === selectedSpace.id ? "Sending…" : "Collaborate"}
														</button>
													)
												})()}
										</div>

										{/* Grid to place details card and poster side-by-side (collapses to full width if no poster) */}
										<div className={clsx("grid gap-6 items-start", selectedSpace.posterUrl ? "grid-cols-1 lg:grid-cols-[1fr_320px]" : "grid-cols-1")}>
											{/* Horizontally Spread Community Hub Profile Card */}
											<div className="border-[3px] border-black p-4 sm:p-6 rounded-[28px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white flex flex-col gap-6 items-start w-full max-w-full min-w-0">
												{/* Top Row: Logo on the left, Name & stacked stats on the right */}
												<div className="flex flex-row items-start gap-4 sm:gap-6 w-full text-left">
													{/* Hub Logo */}
													<div className="relative size-24 rounded-2xl overflow-hidden border-2 border-black bg-slate-50 shrink-0">
														{selectedSpace.logoUrl ? (
															<Image src={selectedSpace.logoUrl} alt={selectedSpace.name} fill className="object-cover" unoptimized />
														) : (
															<div className="w-full h-full bg-[#FFCE29] flex items-center justify-center text-black font-heading font-black text-2xl">
																{selectedSpace.name.substring(0, 2).toUpperCase()}
															</div>
														)}
													</div>

													{/* Name & stacked stats */}
													<div className="flex flex-col justify-between sm:justify-start min-h-[96px] sm:min-h-0 min-w-0 flex-1">
														<h3 className="text-xl sm:text-2xl font-heading font-black text-black leading-tight">
															{selectedSpace.name}
														</h3>
														{selectedSpace.businessName && (
															<p className="text-xs font-bold text-black/50 mt-0.5">
																Hosted by {selectedSpace.businessName}
															</p>
														)}

														<div className="flex flex-wrap items-center gap-2 sm:gap-x-4 mt-2 sm:mt-3">
															<div className="flex items-center gap-1.5">
																<span className="inline-block bg-[#F5C343] text-black border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-[10px] sm:text-xs font-black px-2 py-0.5 sm:px-3 sm:py-1 rounded-md uppercase tracking-wider">
																	{selectedSpace.numberOfVenues}
																</span>
																<span className="text-[10px] sm:text-xs font-black text-black/60 uppercase tracking-wider">
																	Venues
																</span>
															</div>
															<div className="flex items-center gap-1.5">
																<span className="inline-block bg-[#F5C343] text-black border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-[10px] sm:text-xs font-black px-2 py-0.5 sm:px-3 sm:py-1 rounded-md uppercase tracking-wider">
																	{selectedSpace.venueCapacity}
																</span>
																<span className="text-[10px] sm:text-xs font-black text-black/60 uppercase tracking-wider">
																	Capacity
																</span>
															</div>
															<div className="flex items-center gap-1.5">
																<span className="inline-block bg-[#F5C343] text-black border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-[10px] sm:text-xs font-black px-2 py-0.5 sm:px-3 sm:py-1 rounded-md uppercase tracking-wider">
																	{selectedSpace.communitySize}
																</span>
																<span className="text-[10px] sm:text-xs font-black text-black/60 uppercase tracking-wider">
																	Members
																</span>
															</div>
															<div className="flex items-center gap-1.5">
																<span className="inline-block bg-[#F5C343] text-black border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-[10px] sm:text-xs font-black px-2 py-0.5 sm:px-3 sm:py-1 rounded-md uppercase tracking-wider">
																	{selectedSpace.experiencesPerYear}
																</span>
																<span className="text-[10px] sm:text-xs font-black text-black/60 uppercase tracking-wider">
																	Exp / Yr
																</span>
															</div>
														</div>
													</div>
												</div>

												{/* About Section */}
												{selectedSpace.about && (
													<div className="flex flex-col gap-1.5 w-full">
														<span className="text-xs font-bold text-black/50">About The Hub</span>
														<p className="text-sm font-semibold text-black/75 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-black/5 whitespace-pre-wrap w-full">
															{selectedSpace.about}
														</p>
													</div>
												)}

												{/* Experience Categories */}
												{selectedSpace.categories.length > 0 && (
													<div className="flex flex-col gap-2 w-full">
														<span className="text-xs font-bold text-black/50">Hub Categories</span>
														<div className="flex flex-wrap gap-1.5 mt-1">
															{selectedSpace.categories.map((cat) => (
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

												{/* Locations and Digital Presence Row */}
												<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full border-t border-black/10 pt-4">
													{/* Active Locations / Operating Cities */}
													<div className="flex flex-col gap-2">
														<span className="text-xs font-bold text-black/50">Active Locations</span>
														{selectedSpace.activeLocations && selectedSpace.activeLocations.length > 0 ? (
															<div className="flex flex-wrap gap-1.5">
																{selectedSpace.activeLocations.map((loc) => (
																	<span
																		key={loc}
																		className="px-3 py-1 bg-slate-50 text-black/70 border border-black/10 rounded-lg text-xs font-bold uppercase tracking-wider"
																	>
																		{loc}
																	</span>
																))}
															</div>
														) : selectedSpace.operatingCities && selectedSpace.operatingCities.length > 0 ? (
															<div className="flex flex-wrap gap-1.5">
																{selectedSpace.operatingCities.map((city) => (
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
															{selectedSpace.socialLinks?.instagram && (
																<a
																	href={formatExternalUrl(selectedSpace.socialLinks.instagram)!}
																	target="_blank"
																	rel="noreferrer"
																	className="px-3 py-1 bg-slate-50 text-[#EE2C2C] border border-black/10 hover:border-black/30 hover:bg-black/5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors inline-block"
																>
																	Instagram
																</a>
															)}
															{selectedSpace.socialLinks?.linkedin && (
																<a
																	href={formatExternalUrl(selectedSpace.socialLinks.linkedin)!}
																	target="_blank"
																	rel="noreferrer"
																	className="px-3 py-1 bg-slate-50 text-[#EE2C2C] border border-black/10 hover:border-black/30 hover:bg-black/5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors inline-block"
																>
																	LinkedIn
																</a>
															)}
															{selectedSpace.socialLinks?.youtube && (
																<a
																	href={formatExternalUrl(selectedSpace.socialLinks.youtube)!}
																	target="_blank"
																	rel="noreferrer"
																	className="px-3 py-1 bg-slate-50 text-[#EE2C2C] border border-black/10 hover:border-black/30 hover:bg-black/5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors inline-block"
																>
																	YouTube
																</a>
															)}
															{selectedSpace.socialLinks?.website && (
																<a
																	href={formatExternalUrl(selectedSpace.socialLinks.website)!}
																	target="_blank"
																	rel="noreferrer"
																	className="px-3 py-1 bg-slate-50 text-[#EE2C2C] border border-black/10 hover:border-black/30 hover:bg-black/5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors inline-block"
																>
																	Website
																</a>
															)}
															{selectedSpace.videoLink && (
																<a
																	href={formatExternalUrl(selectedSpace.videoLink)!}
																	target="_blank"
																	rel="noreferrer"
																	className="px-3 py-1 bg-[#6C32D1] text-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-[#6C32D1]/90 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors inline-block"
																>
																	▶ Watch Video
																</a>
															)}
															{!selectedSpace.socialLinks?.instagram &&
																!selectedSpace.socialLinks?.linkedin &&
																!selectedSpace.socialLinks?.youtube &&
																!selectedSpace.socialLinks?.website &&
																!selectedSpace.videoLink && (
																	<span className="text-xs font-semibold text-black/40">Not specified</span>
																)}
														</div>
													</div>
												</div>

												{/* Associated Brands */}
												{selectedSpace.brandsWorkedWith &&
													selectedSpace.brandsWorkedWith.filter((b) => b.logoUrl || b.brandName).length > 0 && (
														<div className="flex flex-col gap-2 w-full border-t border-black/10 pt-4">
															<span className="text-xs font-bold text-black/50">Associated Brands</span>
															<div className="flex flex-wrap gap-2.5">
																{selectedSpace.brandsWorkedWith
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

											{/* Poster (Secondary Image) beside the details card */}
											{selectedSpace.posterUrl && (
												<div className="border-[3px] border-black p-5 rounded-[28px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white flex flex-col gap-3 items-start shrink-0 w-full lg:w-[320px]">
													<span className="text-xs font-bold text-black/50 uppercase tracking-wider">Highlight Poster</span>
													<div
														onClick={() => setIsPosterEnlarged(true)}
														className="relative w-full aspect-[4/5] rounded-[20px] border-2 border-black overflow-hidden bg-slate-900 cursor-pointer group flex items-center justify-center"
													>
														<Image
															src={selectedSpace.posterUrl}
															alt={`${selectedSpace.name} poster`}
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
									{selectedSpace.centreShowcaseUrls && selectedSpace.centreShowcaseUrls.length > 0 && (
										<div className="flex flex-col gap-4 mt-6 w-full px-1">
											<div className="flex items-center gap-2">
												<h2 className="text-xl font-heading font-black text-black">Centre Showcase</h2>
												<span className="px-2 py-0.5 bg-[#FFC940] border-2 border-black text-black text-[10px] font-black uppercase rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
													{selectedSpace.centreShowcaseUrls.length} Photo{selectedSpace.centreShowcaseUrls.length > 1 ? "s" : ""}
												</span>
											</div>
											<div className="flex flex-row overflow-x-auto gap-4 pb-4 w-full scrollbar-thin scrollbar-thumb-black/20 shrink-0">
												{selectedSpace.centreShowcaseUrls.map((url, idx) => (
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
									)}
								</>
							)}
						</div>
					</>
				) : (
					/* Browsing Grid */
					<>
						<div>
							<h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-black leading-tight">
								Community Hubs
							</h1>
							<p className="text-sm font-semibold text-black/50 mt-2">
								Discover co-working hubs, venues, and partner hubs onboarded to Meetday.
							</p>
						</div>

						<div className="w-full">
							{error && <p className="text-sm font-bold text-red-600">{error}</p>}

							{!spaces && !error && (
								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 pt-2 px-2 pb-4">
									{[...Array(10)].map((_, i) => (
										<Skeleton.Block key={i} className="aspect-square rounded-[24px]" />
									))}
								</div>
							)}

							{spaces && spaces.length === 0 && (
								<div className="border-[3px] border-dashed border-black/30 rounded-[20px] p-12 flex flex-col items-center justify-center text-center gap-4 bg-transparent mt-2 w-full">
									<p className="font-heading font-black text-black/40 text-lg">
										No community hubs found
									</p>
									<p className="text-sm font-semibold text-black/30 max-w-md">
										Discover co-working spaces, partner venues, and community hubs onboarded to Meetday for offline activations and events. Newly listed hubs will appear here.
									</p>
									<button
										type="button"
										onClick={() => {
											setSpaces(null)
											setError(null)
											getCommunitySpacesBrowse()
												.then((r) => setSpaces(r.spaces))
												.catch((e) => setError(getApiErrorMessage(e)))
										}}
										className="bg-[#EE2C2C] text-white text-[9px] font-black px-4 py-2.5 rounded-lg uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[#1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all select-none cursor-pointer"
									>
										Refresh Hubs
									</button>
								</div>
							)}

							{spaces && spaces.length > 0 && (
								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 pt-2 px-2 pb-4">
									{spaces.map((space) => (
										<SpaceCard key={space.id} space={space} onClick={() => setSelectedSpace(space)} />
									))}
								</div>
							)}
						</div>
					</>
				)}
			</div>

			{/* Zoomed Poster Modal */}
			{isPosterEnlarged && selectedSpace?.posterUrl && (
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
							className="absolute top-4 right-4 z-10 size-8 bg-white hover:bg-black/5 border-2 border-black rounded-full flex items-center justify-center text-black font-extrabold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all active:translate-y-[1px] cursor-pointer"
							aria-label="Close enlarged poster"
						>
							✕
						</button>
						<span className="text-xs font-bold text-black/50 uppercase tracking-wider">Community Hub Poster</span>
						<div className="relative w-full aspect-[4/5] rounded-[20px] border-2 border-black overflow-hidden bg-slate-900 flex items-center justify-center">
							<Image src={selectedSpace.posterUrl} alt="Enlarged Community Hub Poster" fill className="object-contain" unoptimized />
						</div>
					</div>
				</div>
			)}

			{/* Zoomed Showcase/Event Image Modal */}
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
							className="absolute top-4 right-4 z-10 size-8 bg-white hover:bg-black/5 border-2 border-black rounded-full flex items-center justify-center text-black font-extrabold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all active:translate-y-[1px] cursor-pointer"
							aria-label="Close enlarged image"
						>
							✕
						</button>
						<span className="text-xs font-bold text-black/50 uppercase tracking-wider">Photo Preview</span>
						<div className="relative w-full aspect-[16/10] rounded-[20px] border-2 border-black overflow-hidden bg-slate-50">
							<Image src={enlargedImageUrl} alt="Enlarged Photo" fill className="object-cover" unoptimized />
						</div>
					</div>
				</div>
			)}

			{/* Experience Detail Popup Modal */}
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

						{/* Content Area */}
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
							<div className="flex-1 min-h-0 w-full flex items-center justify-center p-2">
								<div className="relative w-full h-full max-h-[66vh] md:max-h-[70vh] min-h-0 rounded-[22px] sm:rounded-[24px] border-[3px] border-black bg-neutral-950/5 overflow-hidden flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={currentExp.url}
										alt={currentExp.name || "Experience Image"}
										className="w-full h-full max-h-[66vh] md:max-h-[70vh] object-contain p-2.5 sm:p-4 select-none"
									/>

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
