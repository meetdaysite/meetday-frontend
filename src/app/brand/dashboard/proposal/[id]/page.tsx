"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import PdfViewer from "@/components/pdf/PdfViewer"
import { CommunityProfileDetailsPanel } from "@/components/host/CommunityProfileDetailsPanel"
import {
	getPublishedSponsorshipDetail,
	markSponsorshipInterest,
	type PublishedSponsorshipDetail,
} from "@/lib/api"
import { ApiError, getApiErrorMessage } from "@/lib/errors"
import clsx from "clsx"

export default function ProposalDetailPage() {
	const params = useParams<{ id: string }>()
	const router = useRouter()
	const [proposal, setProposal] = useState<PublishedSponsorshipDetail | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [isInterested, setIsInterested] = useState(false)
	const [isSubmittingInterest, setIsSubmittingInterest] = useState(false)
	const [showIncompleteProfileModal, setShowIncompleteProfileModal] = useState(false)

	useEffect(() => {
		let cancelled = false
		setIsLoading(true)
		getPublishedSponsorshipDetail(params.id)
			.then((data) => {
				if (!cancelled) setProposal(data)
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
					"px-4 lg:px-6 py-6 lg:py-8 flex-1 flex flex-col gap-6 overflow-y-auto h-[calc(100vh-6rem)] transition-all duration-300 relative",
					proposal?.community ? "max-w-3xl w-full mx-auto" : "max-w-2xl mx-auto w-full"
				)}>
					<button
						type="button"
						onClick={() => router.push("/brand/dashboard/proposals")}
						className="flex items-center gap-1.5 text-xs font-bold text-black/50 hover:text-black transition-colors mb-2 self-start"
					>
						<svg className="w-3.5 h-3.5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
							{/* Sticky Action Button container floating in the top right */}
							<div className="sticky top-0 self-end z-30 h-0 w-0 relative">
								<div className="absolute top-0 right-0">
									<style>{`
										@keyframes pop-animation {
											0%, 100% { transform: scale(1); }
											50% { transform: scale(1.04); }
										}
										.btn-pop {
											animation: pop-animation 2s infinite ease-in-out;
										}
									`}</style>
									<button
										type="button"
										disabled={isInterested || isSubmittingInterest}
										onClick={handleInterested}
										className={clsx(
											"btn-pop py-3 px-6 bg-[#EE2C2C] text-white border-[3px] border-black rounded-2xl font-black text-center text-xs tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] hover:bg-[#EE2C2C] transition-all select-none whitespace-nowrap",
											(isInterested || isSubmittingInterest) && "opacity-50 pointer-events-none"
										)}
									>
										{isInterested ? "You're Interested ✓" : isSubmittingInterest ? "Sending…" : "I am Interested"}
									</button>
								</div>
							</div>

							{/* Title Section (with padding right to clear the sticky button) */}
							<div className="flex flex-col pb-4 border-b border-black/10 pr-44">
								<h1 className="text-3xl font-heading font-black text-black leading-tight">
									{proposal.name || "Untitled Proposal"}
								</h1>
								<p className="text-sm font-semibold text-black/50 mt-1">Hosted by {hostName}</p>
							</div>

							{/* Rest of Left Column content */}
							<div className="flex flex-col gap-6">
								{/* Top Row: Cover Image & Metadata */}
								<div className="flex flex-col md:flex-row gap-6 items-stretch">
									{proposal.imageUrl && (
										<div className="relative size-36 shrink-0 rounded-xl overflow-hidden border border-border-default shadow-sm bg-slate-50">
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img src={proposal.imageUrl} alt={proposal.name || "Proposal"} className="size-full object-cover" />
										</div>
									)}

									<div className="flex-1 bg-surface-card-muted border border-border-default rounded-action p-4 w-full flex flex-col justify-between gap-4">
										{/* Row 1: Date, Venue & City */}
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">Date</p>
												<div className="flex flex-col gap-2 mt-1">
													{(() => {
														const startDisplay = proposal.eventDate ? new Date(proposal.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
														const endDisplay = proposal.eventEndDate ? new Date(proposal.eventEndDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
														return (
															<>
																{startDisplay && (
																	<div className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
																		<span className="w-10 shrink-0">Start:</span>
																		<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-[#EE2C2C] text-white border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
																			{startDisplay}
																		</span>
																	</div>
																)}
																{endDisplay && endDisplay !== startDisplay && (
																	<div className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
																		<span className="w-10 shrink-0">End:</span>
																		<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-[#EE2C2C] text-white border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
																			{endDisplay}
																		</span>
																	</div>
																)}
															</>
														);
													})()}
												</div>
											</div>

											<div>
												<p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">Venue & City</p>
												<div className="flex flex-col gap-2 mt-1">
													{(proposal.venues && proposal.venues.length > 0 ? proposal.venues : [proposal.venue || ""])
														.map((v, idx) => {
															const c = proposal.venueCities?.[idx] || (idx === 0 ? proposal.city : undefined)
															if (!v || !v.trim()) return null
															return (
																<div key={idx} className="flex flex-col items-start gap-1">
																	{c && (
																		<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-[#EE2C2C] text-white border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
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

										{/* Row 2: Guests, Age Group */}
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

								{/* Sponsorship Tiers */}
								{proposal.sponsorTiers?.length > 0 && (
									<div className="bg-surface-card border border-border-default rounded-action p-5 flex flex-col gap-3">
										<h4 className="text-sm font-bold text-text-primary">Sponsor Pricing Tiers</h4>
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
								)}

								{/* Document Preview */}
								{proposal.docUrl && (
									<div className="flex flex-col gap-3">
										<h4 className="text-sm font-bold text-text-primary">Document Preview</h4>
										<div className="border border-border-default rounded-action overflow-hidden bg-surface-card shadow-sm h-[80vh] md:h-[750px] relative">
											<PdfViewer url={proposal.docUrl} />
										</div>
									</div>
								)}

								{/* Mobile-only Community Profile Panel */}
								{proposal.community && (
									<div className="md:hidden mt-4">
										<CommunityProfileDetailsPanel
											community={{ ...proposal.community, approvalStatus: "APPROVED" } as any}
											operatingCities={undefined}
											socialLinks={undefined}
										/>
									</div>
								)}
							</div>
						</>
					)}
				</div>

				{/* Right Column: Community Profile details */}
				{!isLoading && proposal?.community && (
					<div className="hidden md:flex flex-col border-l border-black/10 overflow-y-auto h-[calc(100vh-6rem)] shrink-0 w-full bg-white">
						<CommunityProfileDetailsPanel
							community={{ ...proposal.community, approvalStatus: "APPROVED" } as any}
							operatingCities={undefined}
							socialLinks={undefined}
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
		</div>
	)
}
