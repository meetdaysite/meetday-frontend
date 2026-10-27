"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import PdfViewer from "@/components/pdf/PdfViewer"
import { CommunityProfileDetailsPanel } from "@/components/community/CommunityProfileDetailsPanel"
import {
	getPublishedSponsorshipDetail,
	markSponsorshipInterest,
	getBrandProfile,
	type PublishedSponsorshipDetail,
} from "@/lib/api"
import { ApiError, getApiErrorMessage } from "@/lib/errors"
import { useBrandStore } from "@/store/brandStore"
import clsx from "clsx"

export default function ProposalDetailPage() {
	const params = useParams<{ id: string }>()
	const router = useRouter()
	const { profile: brandProfile, setProfile } = useBrandStore()
	const [proposal, setProposal] = useState<PublishedSponsorshipDetail | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [isInterested, setIsInterested] = useState(false)
	const [isSubmittingInterest, setIsSubmittingInterest] = useState(false)
	const [showIncompleteProfileModal, setShowIncompleteProfileModal] = useState(false)
	const [isImageZoomed, setIsImageZoomed] = useState(false)

	useEffect(() => {
		getBrandProfile()
			.then(setProfile)
			.catch(() => {})
	}, [setProfile])

	useEffect(() => {
		let cancelled = false
		setIsLoading(true)
		getPublishedSponsorshipDetail(params.id)
			.then((data) => {
				if (!cancelled) {
					setProposal(data)
					if (data.alreadyInterested) {
						setIsInterested(true)
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
	}, [params.id])

	async function handleInterested() {
		setIsSubmittingInterest(true)
		try {
			const res = await markSponsorshipInterest(params.id)
			setIsInterested(true)
			toast.success(res.alreadyInterested ? "You've already expressed interest" : "Interest sent to the host and admin team!")
		} catch (e) {
			if (e instanceof ApiError && e.statusCode === 400) {
				setShowIncompleteProfileModal(true)
			} else {
				toast.error(getApiErrorMessage(e))
			}
		} finally {
			setIsSubmittingInterest(false)
		}
	}

	const hostName = proposal
		? proposal.hostProfile?.displayName ||
			[proposal.hostProfile?.user?.firstName, proposal.hostProfile?.user?.lastName].filter(Boolean).join(" ") ||
			"Host"
		: ""

	return (
		<div className="flex flex-col min-h-full bg-white">
			{/* Top Nav / Subheader */}
			<div className="flex justify-between items-center px-8 py-4 border-b border-black/10 shrink-0">
				<p className="text-sm font-semibold text-black/50 mx-auto">
					Welcome to <span className="text-[#EE2C2C] font-bold">Meetday</span>
				</p>
			</div>

			<div className={clsx(
				"flex-1 min-h-0 w-full overflow-hidden relative bg-white",
				proposal?.community ? "md:grid md:grid-cols-[65%_35%]" : "flex flex-col"
			)}>
				{/* Left Column: Proposal Details */}
				<div className={clsx(
					"px-4 lg:px-6 py-6 lg:py-8 flex-1 flex flex-col gap-6 overflow-y-auto h-full min-h-0 transition-all duration-300 relative",
					proposal?.community ? "max-w-3xl w-full mx-auto" : "max-w-2xl mx-auto w-full"
				)}>
					<button
						type="button"
						onClick={() => router.push("/brand/dashboard/proposals")}
						className="flex items-center gap-1.5 text-xs font-bold text-black/50 hover:text-black transition-colors mb-2 self-start"
					>
						<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
						</svg>
						Back to Active Sponsorships
					</button>

					{isLoading ? (
						<div className="flex flex-col gap-6">
							<Skeleton className="h-48 rounded-xl border border-border-default" />
							<Skeleton className="h-8 w-2/3 rounded-action" />
							<Skeleton className="h-32 rounded-xl" />
						</div>
					) : error || !proposal ? (
						<p className="text-sm font-bold text-red-600">{error ?? "Proposal not found."}</p>
					) : (
						<>
							<style>{`
								@keyframes pop-animation {
									0%, 100% { transform: scale(1); }
									50% { transform: scale(1.04); }
								}
								.btn-pop {
									animation: pop-animation 2s infinite ease-in-out;
								}
							`}</style>

							{/* Title Section — side by side: logo left, name right; I'm Interested button at end right-aligned just above line separator */}
							<div className="flex flex-col gap-4 pb-6 border-b border-black/10">
								<div className="flex flex-row items-start gap-4 sm:gap-6">
									{proposal.imageUrl && (
										<div
											onClick={() => setIsImageZoomed(true)}
											className="relative group w-28 sm:w-44 md:w-52 aspect-[4/5] shrink-0 rounded-2xl overflow-hidden border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] bg-slate-50 cursor-pointer hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
											title="Click to view full poster"
										>
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img src={proposal.imageUrl} alt={proposal.name || "Proposal"} className="size-full object-cover group-hover:scale-105 transition-transform duration-200" />
											<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
												<span className="text-white text-xs sm:text-sm font-bold bg-black/60 px-2.5 py-1 rounded-lg border border-white/30 backdrop-blur-xs">🔍 Click to Zoom</span>
											</div>
										</div>
									)}
									<div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
										<div>
											<h1 className="text-xl sm:text-3xl font-heading font-black text-black leading-tight">
												{proposal.name || "Untitled Proposal"}
											</h1>
											<p className="text-sm font-semibold text-black/50 mt-1">Hosted by {hostName}</p>
										</div>

										{/* I'm Interested Button on desktop/tablet right-aligned just above the line separator */}
										<div className="hidden sm:flex flex-col items-end self-end mt-4">
											<button
												type="button"
												disabled={isInterested || isSubmittingInterest || brandProfile?.approvalStatus !== "APPROVED"}
												onClick={handleInterested}
												className={clsx(
													"py-2.5 px-6 bg-[#EE2C2C] text-white border-[3px] border-black rounded-2xl font-black text-center text-xs tracking-wider transition-all select-none whitespace-nowrap",
													!isInterested && !isSubmittingInterest && brandProfile?.approvalStatus === "APPROVED" ? "btn-pop shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]" : "opacity-60 cursor-not-allowed"
												)}
											>
												{isInterested ? "Community Notified ✓" : isSubmittingInterest ? "Sending…" : "I am Interested"}
											</button>
											{brandProfile && brandProfile.approvalStatus !== "APPROVED" && (
												<span className="block mt-1 text-[11px] font-black text-[#EE2C2C] uppercase tracking-wider text-right">
													Waiting for profile approval
												</span>
											)}
										</div>
									</div>
								</div>

								{/* Mobile view: I'm Interested button right-aligned right above the line separator */}
								<div className="sm:hidden flex flex-col items-end pt-2">
									<button
										type="button"
										disabled={isInterested || isSubmittingInterest || brandProfile?.approvalStatus !== "APPROVED"}
										onClick={handleInterested}
										className={clsx(
											"w-full py-3 px-6 bg-[#EE2C2C] text-white border-[3px] border-black rounded-2xl font-black text-center text-xs tracking-wider transition-all select-none whitespace-nowrap",
											!isInterested && !isSubmittingInterest && brandProfile?.approvalStatus === "APPROVED" ? "btn-pop shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]" : "opacity-60 cursor-not-allowed"
										)}
									>
										{isInterested ? "Community Notified ✓" : isSubmittingInterest ? "Sending…" : "I am Interested"}
									</button>
									{brandProfile && brandProfile.approvalStatus !== "APPROVED" && (
										<span className="block mt-1 text-[11px] font-black text-[#EE2C2C] uppercase tracking-wider text-right">
											Waiting for profile approval
										</span>
									)}
								</div>
							</div>

								{/* Rest of Left Column content */}
								<div className="flex flex-col gap-6">
									{/* Top Row: Metadata */}
									<div className="flex flex-col gap-6 items-stretch">

									<div className="flex-1 bg-surface-card-muted border border-border-default rounded-action p-4 w-full flex flex-col justify-between gap-4">
								<div className="grid grid-cols-2 gap-4">
									{/* Start Date */}
									{(() => {
										const startDisplay = proposal.eventDate ? new Date(proposal.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
										return startDisplay ? (
											<div>
												<p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">Start</p>
												<div className="mt-1">
													<span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black bg-[#EE2C2C] text-white border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
														{startDisplay}
													</span>
												</div>
											</div>
										) : null;
									})()}

									{/* End Date */}
									{(() => {
										const startDisplay = proposal.eventDate ? new Date(proposal.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
										const endDisplay = proposal.eventEndDate ? new Date(proposal.eventEndDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
										return endDisplay && endDisplay !== startDisplay ? (
											<div>
												<p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">End</p>
												<div className="mt-1">
													<span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black bg-[#EE2C2C] text-white border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
														{endDisplay}
													</span>
												</div>
											</div>
										) : null;
									})()}

									{/* Venue & City — full width second row */}
									<div className="col-span-2">
										<p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">Venue &amp; City</p>
										<div className="flex flex-col gap-2 mt-1">
											{(proposal.venues && proposal.venues.length > 0 ? proposal.venues : [proposal.venue || ""])
												.map((v, idx) => {
													const c = proposal.venueCities?.[idx] || (idx === 0 ? proposal.city : undefined)
													if (!v || !v.trim()) return null
													return (
														<div key={idx} className="flex flex-row flex-wrap items-center gap-2">
															{c && (
																<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-[#EE2C2C] text-white border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap">
																	{c}
																</span>
															)}
															<span className="text-xs font-semibold text-text-secondary">{v}</span>
														</div>
													)
												})}
										</div>
									</div>
								</div>

										{/* Divider */}
										<hr className="border-border-default/15" />

										{/* Row 2: Guests, Age Group — 2 cols on all screens */}
										<div className="grid grid-cols-2 gap-4">
											{proposal.guestCount && (
												<div>
													<p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">Guests</p>
													<div className="flex mt-1">
														<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-[#EE2C2C] text-white border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
															{proposal.guestCount} Guests
														</span>
													</div>
												</div>
											)}
											{proposal.ageGroup && (
												<div>
													<p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">Age Group</p>
													<div className="flex mt-1">
														<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-[#EE2C2C] text-white border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
															{proposal.ageGroup} Years
														</span>
													</div>
												</div>
											)}
										</div>

										{/* Divider */}
										<hr className="border-border-default/15" />

										{/* Row 3: Audience */}
										{proposal.audienceProfile && (
											<div>
												<p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">Audience</p>
												<div className="flex flex-wrap gap-1.5 mt-1">
													{(() => {
														const list = proposal.audienceProfile || [];
														return list.map((aud, i) => {
															if (!aud) return null;
															return (
																<span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-[#F5C343] text-black border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider">
																	{aud}
																</span>
															)
														}).filter(Boolean);
													})()}
												</div>
											</div>
										)}
									</div>
								</div>

								{/* About Experience */}
								{proposal.about && (
									<div className="bg-surface-card border border-border-default rounded-action p-5">
										<h4 className="text-sm font-bold text-text-primary mb-2">About the Project</h4>
										<p className="text-body-sm text-text-secondary leading-relaxed whitespace-pre-wrap break-words">{proposal.about}</p>
									</div>
								)}

								{/* Sponsorship Type & Tiers */}
								{proposal.sponsorshipType === "BARTER" ? (
									<div className="bg-surface-card border border-border-default rounded-action p-5 flex flex-col gap-2">
										<div className="flex items-center gap-2">
											<h4 className="text-sm font-bold text-text-primary">Sponsorship Type</h4>
											<span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#FFC940] text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase">
												Barter
											</span>
										</div>
										<p className="text-body-sm text-text-secondary">This community is open to product, service, or venue barter collaborations.</p>
									</div>
								) : proposal.sponsorshipType === "BOTH" ? (
									<div className="bg-surface-card border border-border-default rounded-action p-5 flex flex-col gap-3">
										<div className="flex items-center justify-between flex-wrap gap-2">
											<h4 className="text-sm font-bold text-text-primary">Sponsor Pricing Tiers &amp; Barter</h4>
											<div className="flex items-center gap-1.5">
												<span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase">
													Cash
												</span>
												<span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#FFC940] text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase">
													Barter
												</span>
											</div>
										</div>
										{proposal.sponsorTiers?.length > 0 && (
											<div className="flex flex-wrap gap-3">
												{proposal.sponsorTiers.map((tier, idx) => (
													<div key={idx} className="flex flex-col gap-1 border border-border-default/45 rounded-xl px-4 py-2 bg-surface-card-muted">
														<div className="flex gap-2 text-sm">
															<span className="text-text-secondary font-medium">{tier.name}:</span>
															<span className="text-text-brand font-semibold">
																{tier.price?.toString().startsWith("₹") ? tier.price : `₹${tier.price}`}
															</span>
														</div>
													</div>
												))}
											</div>
										)}
									</div>
								) : proposal.sponsorTiers?.length > 0 ? (
									<div className="bg-surface-card border border-border-default rounded-action p-5 flex flex-col gap-3">
										<div className="flex items-center justify-between flex-wrap gap-2">
											<h4 className="text-sm font-bold text-text-primary">Sponsor Pricing Tiers</h4>
											<span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase">
												Cash
											</span>
										</div>
										<div className="flex flex-wrap gap-3">
											{proposal.sponsorTiers.map((tier, idx) => (
												<div key={idx} className="flex flex-col gap-1 border border-border-default/45 rounded-xl px-4 py-2 bg-surface-card-muted">
													<div className="flex gap-2 text-sm">
														<span className="text-text-secondary font-medium">{tier.name}:</span>
														<span className="text-text-brand font-semibold">
															{tier.price?.toString().startsWith("₹") ? tier.price : `₹${tier.price}`}
														</span>
													</div>
												</div>
											))}
										</div>
									</div>
								) : null}

								{/* Document Preview */}
								{proposal.docUrl && (
									<div className="flex flex-col gap-3">
										<h4 className="text-sm font-bold text-text-primary">Document Preview</h4>
										<div className="border border-border-default rounded-action overflow-hidden bg-surface-card shadow-sm h-[80vh] md:h-[750px] relative">
											<PdfViewer url={proposal.docUrl} />
										</div>
									</div>
								)}

								{/* Video Link */}
								{proposal.videoUrl && (
									<div className="bg-surface-card border border-border-default rounded-action p-5 flex flex-col gap-2">
										<h4 className="text-sm font-bold text-text-primary">Proposal Video</h4>
										<a
											href={proposal.videoUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="text-sm font-bold text-[#EE2C2C] hover:underline break-all"
										>
											Watch Video ↗
										</a>
									</div>
								)}

								{/* Mobile-only Community Profile Panel */}
								{proposal.community && (
									<div className="md:hidden mt-4">
										<CommunityProfileDetailsPanel
											community={{ ...proposal.community, approvalStatus: "APPROVED" } as any}
											operatingCities={proposal.hostProfile?.operatingCities}
											socialLinks={proposal.hostProfile?.socialLinks ?? undefined}
											hideStatus={true}
										/>
									</div>
								)}
							</div>
						</>
					)}
				</div>

				{/* Right Column: Community Profile details */}
				{!isLoading && proposal?.community && (
					<div className="hidden md:flex flex-col border-l border-black/10 overflow-y-auto h-full min-h-0 shrink-0 w-full bg-white">
						<CommunityProfileDetailsPanel
							community={{ ...proposal.community, approvalStatus: "APPROVED" } as any}
							operatingCities={proposal.hostProfile?.operatingCities}
							socialLinks={proposal.hostProfile?.socialLinks ?? undefined}
							hideStatus={true}
						/>
					</div>
				)}
			</div>

			{showIncompleteProfileModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
					<div className="w-full max-w-sm bg-white border-[3px] border-black rounded-[28px] p-6 flex flex-col gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
						<h2 className="text-lg font-heading font-black text-black leading-tight">Please complete your profile</h2>
						<p className="text-xs font-semibold text-black/60 leading-relaxed">
							Add your brand name, categories, and social links before expressing interest in a proposal.
						</p>
						<div className="flex items-center gap-3 justify-end mt-2">
							<Button variant="secondary" size="sm" onClick={() => setShowIncompleteProfileModal(false)}>
								Cancel
							</Button>
							<Link href="/brand/dashboard/profile/edit">
								<Button size="sm">Complete Profile</Button>
							</Link>
						</div>
					</div>
				</div>
			)}

			{/* Zoomed Event Poster Lightbox */}
			{isImageZoomed && proposal?.imageUrl && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
					onClick={() => setIsImageZoomed(false)}
				>
					<div
						className="bg-white rounded-[24px] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-lg w-full max-h-[90vh] flex flex-col p-5 gap-3 relative animate-in fade-in zoom-in-95 duration-150"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between border-b-2 border-black pb-2">
							<h3 className="font-heading font-black text-base text-black truncate pr-2">
								{proposal.name || "Event Poster"}
							</h3>
							<button
								type="button"
								onClick={() => setIsImageZoomed(false)}
								className="w-8 h-8 rounded-full border-2 border-black bg-white hover:bg-slate-100 flex items-center justify-center text-lg font-black text-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] shrink-0"
							>
								×
							</button>
						</div>
						<div className="relative rounded-2xl border-2 border-black overflow-hidden bg-neutral-100 flex items-center justify-center max-h-[70vh]">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={proposal.imageUrl}
								alt={proposal.name || "Event Poster Zoomed"}
								className="w-full h-auto max-h-[68vh] object-contain"
							/>
						</div>
						<div className="flex justify-end pt-1">
							<button
								type="button"
								onClick={() => setIsImageZoomed(false)}
								className="px-5 py-2 bg-[#FFC940] hover:bg-[#ffbf20] text-black border-2 border-black rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
