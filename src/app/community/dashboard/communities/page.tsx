"use client"

import { useEffect, useState, Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
	getCommunityCollaborationCommunities,
	getMyCommunityCollaborationChats,
	markCommunityCollaborationInterest,
	type BrandCommunity,
	type CommunityCollaborationThread,
} from "@/lib/api"
import { useHostStore } from "@/store/hostStore"
import { getApiErrorMessage } from "@/lib/errors"
import { toast } from "@/lib/toast"
import { Skeleton } from "@/components/ui/Skeleton"
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
					<div className="w-full h-full bg-[#FFCE29] flex items-center justify-center text-black font-heading font-black text-3xl">
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

function CommunityCommunitiesBrowseContent() {
	const searchParams = useSearchParams()
	const urlCommunityId = searchParams ? searchParams.get("communityId") : null
	const { profile } = useHostStore()

	const [communities, setCommunities] = useState<BrandCommunity[] | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [selected, setSelected] = useState<BrandCommunity | null>(null)
	const [collaborationThreads, setCollaborationThreads] = useState<CommunityCollaborationThread[]>([])
	const [sendingId, setSendingId] = useState<string | null>(null)
	const [isPosterEnlarged, setIsPosterEnlarged] = useState(false)
	const [selectedExperienceIndex, setSelectedExperienceIndex] = useState<number | null>(null)
	const [viewAllExperiencesMode, setViewAllExperiencesMode] = useState(false)

	useEffect(() => {
		if (urlCommunityId && communities && communities.length > 0) {
			const found = communities.find(
				(c) =>
					c.id === urlCommunityId ||
					c.hostProfileId === urlCommunityId ||
					c.name.toLowerCase().trim() === urlCommunityId.toLowerCase().trim()
			)
			if (found) setSelected(found)
		}
	}, [urlCommunityId, communities])

	const fetchConnectedThreads = () => {
		getMyCommunityCollaborationChats()
			.then((threads) => {
				setCollaborationThreads(threads || [])
			})
			.catch(() => {})
	}

	useEffect(() => {
		fetchConnectedThreads()
	}, [])

	useEffect(() => {
		let cancelled = false
		getCommunityCollaborationCommunities()
			.then((r) => {
				if (!cancelled) {
					// Exclude caller's own community profile (as hostProfileId or community name)
					const ownHostProfileId = profile?.id
					const ownDisplayName = profile?.displayName?.trim().toLowerCase()
					const filtered = (r.communities || []).filter((c) => {
						if (ownHostProfileId && c.hostProfileId === ownHostProfileId) return false
						if (ownDisplayName && c.name?.trim().toLowerCase() === ownDisplayName) return false
						return true
					})
					setCommunities(filtered)
				}
			})
			.catch((e) => {
				if (!cancelled) setError(getApiErrorMessage(e))
			})
		return () => {
			cancelled = true
		}
	}, [profile?.id, profile?.displayName])

	async function handleCollaborate() {
		if (!selected || sendingId) return
		setSendingId(selected.id)
		try {
			await markCommunityCollaborationInterest(selected.id)
			toast.success("Collaboration request sent! We've notified the community.")
			fetchConnectedThreads()
		} catch (e) {
			toast.error(getApiErrorMessage(e))
		} finally {
			setSendingId(null)
		}
	}

	const flatExperienceImages = selected
		? (selected.pastEvents || []).flatMap((event, eventIdx) => {
				const urls = event.imageUrls || []
				return urls.map((url, imgIdx) => ({
					url,
					eventNumber: eventIdx + 1,
					name: event.name,
					description: event.description,
					imgIdx,
					totalImages: urls.length,
				}))
		  })
		: []

	const currentExp =
		selectedExperienceIndex !== null && flatExperienceImages[selectedExperienceIndex]
			? flatExperienceImages[selectedExperienceIndex]
			: null

	function handlePrevExperience(e?: React.MouseEvent) {
		e?.stopPropagation()
		if (selectedExperienceIndex !== null && flatExperienceImages.length > 0) {
			setSelectedExperienceIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : flatExperienceImages.length - 1))
		}
	}

	function handleNextExperience(e?: React.MouseEvent) {
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedExperienceIndex, flatExperienceImages.length])

	return (
		<div className="flex flex-col min-h-full bg-white">
			<div className="flex justify-between items-center px-8 py-4 border-b border-black/10 shrink-0">
				<p className="text-sm font-semibold text-black/50 mx-auto">
					Welcome to <span className="text-[#EE2C2C] font-bold">Meetday</span>
				</p>
			</div>

			<div className="px-4 lg:px-6 py-6 max-w-6xl w-full mx-auto flex-grow flex flex-col gap-6 min-h-0">
				{selected ? (
					<>
						<div>
							<button
								type="button"
								onClick={() => {
									setSelected(null)
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
											<p className="text-sm font-semibold text-black/50">From {selected.name}</p>
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
											<h2 className="text-xl font-heading font-black text-black">Community Details</h2>
											{(() => {
												const existingThread = selected
													? collaborationThreads.find(
															(t) =>
																t.counterpartCommunityId === selected.id ||
																t.counterpartHostProfileId === selected.hostProfileId ||
																t.communityId === selected.id ||
																t.hostId === selected.hostProfileId ||
																t.requesterCommunityId === selected.id ||
																t.targetCommunityId === selected.id
													  )
													: undefined
												const hasExistingChannel = Boolean(existingThread)

												if (hasExistingChannel) {
													return (
														<div className="flex flex-col items-end gap-1.5">
															<p className="text-xs font-bold text-black/60 text-right">
																A communication channel already exists with this community.
															</p>
															<Link
																href={`/community/dashboard/community-chats?threadId=${existingThread!.id}`}
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
														onClick={handleCollaborate}
														disabled={sendingId === selected.id}
														className="shrink-0 text-xs font-black px-4 py-2.5 rounded-xl uppercase tracking-wider border-2 border-black bg-[#EE2C2C] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-50 transition-all select-none"
													>
														{sendingId === selected.id ? "Sending…" : "Collaborate"}
													</button>
												)
											})()}
										</div>

										<div className={clsx("grid gap-6 items-start", selected.secondaryImageUrl ? "grid-cols-1 lg:grid-cols-[1fr_320px]" : "grid-cols-1")}>
											<div className="border-[3px] border-black p-4 sm:p-6 rounded-[28px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white flex flex-col gap-6 items-start w-full max-w-full min-w-0">
												<div className="flex flex-row items-start gap-4 sm:gap-6 w-full text-left">
													<div className="relative size-24 rounded-2xl overflow-hidden border-2 border-black bg-slate-50 shrink-0">
														{selected.logoUrl ? (
															<Image src={selected.logoUrl} alt={selected.name} fill className="object-cover" unoptimized />
														) : (
															<div className="w-full h-full bg-[#FFCE29] flex items-center justify-center text-black font-heading font-black text-2xl">
																{selected.name.substring(0, 2).toUpperCase()}
															</div>
														)}
													</div>

													<div className="flex flex-col justify-between sm:justify-start min-h-[96px] sm:min-h-0 min-w-0 flex-1">
														<h3 className="text-xl sm:text-2xl font-heading font-black text-black leading-tight">
															{selected.name}
														</h3>

														<div className="flex flex-wrap items-center gap-2 sm:gap-x-4 mt-2 sm:mt-3">
															<div className="flex items-center gap-1.5">
																<span className="inline-block bg-[#F5C343] text-black border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-[10px] sm:text-xs font-black px-2 py-0.5 sm:px-3 sm:py-1 rounded-md uppercase tracking-wider">
																	{selected.size}
																</span>
																<span className="text-[10px] sm:text-xs font-black text-black/60 uppercase tracking-wider">
																	Members
																</span>
															</div>
															<div className="flex items-center gap-1.5">
																<span className="inline-block bg-[#F5C343] text-black border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-[10px] sm:text-xs font-black px-2 py-0.5 sm:px-3 sm:py-1 rounded-md uppercase tracking-wider">
																	{selected.avgGuestCount}
																</span>
																<span className="text-[10px] sm:text-xs font-black text-black/60 uppercase tracking-wider">
																	Avg Guests
																</span>
															</div>
															<div className="flex items-center gap-1.5">
																<span className="inline-block bg-[#F5C343] text-black border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-[10px] sm:text-xs font-black px-2 py-0.5 sm:px-3 sm:py-1 rounded-md uppercase tracking-wider">
																	{selected.experiencesPerYear}
																</span>
																<span className="text-[10px] sm:text-xs font-black text-black/60 uppercase tracking-wider">
																	Exp / Yr
																</span>
															</div>
														</div>
													</div>
												</div>

												{selected.about && (
													<div className="flex flex-col gap-1.5 w-full">
														<span className="text-xs font-bold text-black/50">About the community</span>
														<p className="text-sm font-semibold text-black/75 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-black/5 whitespace-pre-wrap w-full">
															{selected.about}
														</p>
													</div>
												)}

												{selected.categories?.length > 0 && (
													<div className="flex flex-col gap-2 w-full">
														<span className="text-xs font-bold text-black/50">Categories</span>
														<div className="flex flex-wrap gap-1.5 mt-1">
															{selected.categories.map((cat) => (
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

												<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full border-t border-black/10 pt-4">
													<div className="flex flex-col gap-2">
														<span className="text-xs font-bold text-black/50">Operating Cities</span>
														{selected.operatingCities && selected.operatingCities.length > 0 ? (
															<div className="flex flex-wrap gap-1.5">
																{selected.operatingCities.map((city) => (
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

													<div className="flex flex-col gap-2">
														<span className="text-xs font-bold text-black/50">Digital Presence</span>
														<div className="flex flex-wrap gap-1.5">
															{selected.socialLinks?.instagram && (
																<a
																	href={formatExternalUrl(selected.socialLinks.instagram)!}
																	target="_blank"
																	rel="noreferrer"
																	className="px-3 py-1 bg-slate-50 text-[#EE2C2C] border border-black/10 hover:border-black/30 hover:bg-black/5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors inline-block"
																>
																	Instagram
																</a>
															)}
															{selected.socialLinks?.linkedin && (
																<a
																	href={formatExternalUrl(selected.socialLinks.linkedin)!}
																	target="_blank"
																	rel="noreferrer"
																	className="px-3 py-1 bg-slate-50 text-[#EE2C2C] border border-black/10 hover:border-black/30 hover:bg-black/5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors inline-block"
																>
																	LinkedIn
																</a>
															)}
															{selected.socialLinks?.youtube && (
																<a
																	href={formatExternalUrl(selected.socialLinks.youtube)!}
																	target="_blank"
																	rel="noreferrer"
																	className="px-3 py-1 bg-slate-50 text-[#EE2C2C] border border-black/10 hover:border-black/30 hover:bg-black/5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors inline-block"
																>
																	YouTube
																</a>
															)}
															{selected.socialLinks?.website && (
																<a
																	href={formatExternalUrl(selected.socialLinks.website)!}
																	target="_blank"
																	rel="noreferrer"
																	className="px-3 py-1 bg-slate-50 text-[#EE2C2C] border border-black/10 hover:border-black/30 hover:bg-black/5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors inline-block"
																>
																	Website
																</a>
															)}
															{!selected.socialLinks?.instagram &&
																!selected.socialLinks?.linkedin &&
																!selected.socialLinks?.youtube &&
																!selected.socialLinks?.website && (
																	<span className="text-xs font-semibold text-black/40">Not specified</span>
																)}
														</div>
													</div>
												</div>

												{selected.brandsWorkedWith &&
													selected.brandsWorkedWith.filter((b) => b.logoUrl || b.brandName).length > 0 && (
														<div className="flex flex-col gap-2 w-full border-t border-black/10 pt-4">
															<span className="text-xs font-bold text-black/50">Associated Brands</span>
															<div className="flex flex-wrap gap-2.5">
																{selected.brandsWorkedWith
																	.filter((b) => b.logoUrl || b.brandName)
																	.map((brand, idx) => (
																		<div key={idx} className="group relative" title={brand.brandName || "Brand"}>
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
																			{brand.brandName && (
																				<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
																					<span className="px-2.5 py-1 bg-black text-white text-[11px] font-bold rounded-lg whitespace-nowrap shadow-md">
																						{brand.brandName}
																					</span>
																					<div className="w-2 h-2 bg-black rotate-45 -mt-1" />
																				</div>
																			)}
																		</div>
																	))}
															</div>
														</div>
													)}
											</div>

											{selected.secondaryImageUrl && (
												<div className="border-[3px] border-black p-5 rounded-[28px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white flex flex-col gap-3 items-start shrink-0 w-full lg:w-[320px]">
													<span className="text-xs font-bold text-black/50 uppercase tracking-wider">Highlight Photo</span>
													<div
														onClick={() => setIsPosterEnlarged(true)}
														className="relative w-full aspect-[4/5] rounded-[20px] border-2 border-black overflow-hidden bg-slate-50 cursor-pointer group"
													>
														<Image
															src={selected.secondaryImageUrl}
															alt={`${selected.name} highlight`}
															fill
															className="object-cover transition-transform duration-300 group-hover:scale-105"
															unoptimized
														/>
														<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
															<span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 text-black border-2 border-black px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
																Zoom 🔍
															</span>
														</div>
													</div>
												</div>
											)}
										</div>
									</div>

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
					<>
						<div>
							<h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-black leading-tight">
								Communities
							</h1>
							<p className="text-sm font-semibold text-black/50 mt-2">
								Browse onboarded communities and collaborate with them.
							</p>
						</div>

						<div className="w-full">
							{error && <p className="text-sm font-bold text-red-600">{error}</p>}

							{!communities && !error && (
								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 pt-2 px-2 pb-4">
									{[...Array(10)].map((_, i) => (
										<Skeleton key={i} className="aspect-square rounded-[24px]" />
									))}
								</div>
							)}

							{communities && communities.length === 0 && (
								<p className="text-sm font-bold text-black/50">No communities available yet.</p>
							)}

							{communities && communities.length > 0 && (
								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 pt-2 px-2 pb-4">
									{communities.map((c) => (
										<CommunityCard key={c.id} community={c} onClick={() => setSelected(c)} />
									))}
								</div>
							)}
						</div>
					</>
				)}
			</div>

			{/* Zoomed Highlight Photo Modal */}
			{isPosterEnlarged && selected?.secondaryImageUrl && (
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
							aria-label="Close enlarged photo"
						>
							✕
						</button>
						<span className="text-xs font-bold text-black/50 uppercase tracking-wider">Community Highlight Photo</span>
						<div className="relative w-full aspect-[4/5] rounded-[20px] border-2 border-black overflow-hidden bg-slate-50">
							<Image src={selected.secondaryImageUrl} alt="Enlarged highlight photo" fill className="object-cover" unoptimized />
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
						<div className="flex items-center justify-between gap-4 w-full shrink-0 border-b-2 border-black/15 pb-3.5">
							<div className="flex flex-col gap-0.5 min-w-0">
								<span className="text-xs font-black text-[#EE2C2C] uppercase tracking-wider">
									Experience #{currentExp.eventNumber}
								</span>
								<h3 className="text-lg sm:text-xl font-heading font-black text-black truncate">
									{currentExp.name || `Past Experience #${currentExp.eventNumber}`}
								</h3>
							</div>
							<div className="flex items-center gap-2 shrink-0">
								{flatExperienceImages.length > 1 && (
									<span className="text-xs font-black text-black/60 bg-black/5 px-2.5 py-1 rounded-lg border border-black/10 select-none">
										{selectedExperienceIndex! + 1} / {flatExperienceImages.length}
									</span>
								)}
								<button
									onClick={() => setSelectedExperienceIndex(null)}
									className="size-8 bg-white hover:bg-black/5 border-2 border-black rounded-full flex items-center justify-center text-black font-extrabold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all active:translate-y-[1px] cursor-pointer"
									aria-label="Close preview"
								>
									✕
								</button>
							</div>
						</div>

						<div className="flex-1 min-h-0 flex flex-col md:flex-row gap-5 overflow-hidden items-stretch">
							<div className="relative flex-1 min-h-[260px] md:min-h-0 w-full rounded-[22px] border-2 border-black overflow-hidden bg-black/5 flex items-center justify-center">
								<Image
									src={currentExp.url}
									alt={currentExp.name || `Experience #${currentExp.eventNumber}`}
									fill
									className="object-contain"
									unoptimized
								/>
								{flatExperienceImages.length > 1 && (
									<>
										<button
											onClick={handlePrevExperience}
											className="absolute left-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/95 hover:bg-white border-2 border-black text-black font-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-105 active:scale-95 transition-transform z-10 cursor-pointer"
											aria-label="Previous image"
										>
											‹
										</button>
										<button
											onClick={handleNextExperience}
											className="absolute right-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/95 hover:bg-white border-2 border-black text-black font-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-105 active:scale-95 transition-transform z-10 cursor-pointer"
											aria-label="Next image"
										>
											›
										</button>
									</>
								)}
							</div>

							<div className="md:w-[320px] lg:w-[360px] shrink-0 flex flex-col justify-between gap-4 border-2 border-black rounded-[22px] p-4 sm:p-5 bg-slate-50/70 overflow-y-auto">
								<div className="flex flex-col gap-3">
									<div className="flex flex-col gap-1">
										<span className="text-[10px] font-black uppercase tracking-wider text-black/50">Experience Title</span>
										<h4 className="text-base font-black text-black leading-snug">
											{currentExp.name || `Past Experience #${currentExp.eventNumber}`}
										</h4>
									</div>
									{currentExp.description ? (
										<div className="flex flex-col gap-1">
											<span className="text-[10px] font-black uppercase tracking-wider text-black/50">Description</span>
											<p className="text-xs sm:text-sm font-semibold text-black/80 whitespace-pre-wrap leading-relaxed">
												{currentExp.description}
											</p>
										</div>
									) : (
										<p className="text-xs font-semibold text-black/40 italic">No description provided.</p>
									)}
								</div>

								{flatExperienceImages.length > 1 && (
									<div className="border-t border-black/10 pt-3 flex flex-col gap-2">
										<span className="text-[10px] font-black uppercase tracking-wider text-black/50">Other Photos</span>
										<div className="flex gap-2 overflow-x-auto pb-1">
											{flatExperienceImages.map((thumb, tIdx) => (
												<button
													key={tIdx}
													onClick={() => setSelectedExperienceIndex(tIdx)}
													className={clsx(
														"relative size-12 shrink-0 rounded-lg border-2 overflow-hidden cursor-pointer transition-all",
														tIdx === selectedExperienceIndex
															? "border-[#EE2C2C] ring-2 ring-[#EE2C2C]/30 scale-105"
															: "border-black/30 hover:border-black opacity-70 hover:opacity-100"
													)}
												>
													<Image src={thumb.url} alt="" fill className="object-cover" unoptimized />
												</button>
											))}
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default function CommunityCommunitiesPage() {
	return (
		<Suspense fallback={null}>
			<CommunityCommunitiesBrowseContent />
		</Suspense>
	)
}
