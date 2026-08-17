"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import clsx from "clsx"
import { Skeleton } from "@/components/ui/Skeleton"
import PdfViewer from "@/components/pdf/PdfViewer"
import { CommunityProfileDetailsPanel } from "@/components/community/CommunityProfileDetailsPanel"
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton"
import { useGoogleSignIn } from "@/hooks/useGoogleSignIn"
import { useAuthStore } from "@/store/authStore"
import { getPublishedSponsorshipDetail, type PublishedSponsorshipDetail } from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"

// How long an anonymous visitor gets to preview the shared proposal before the
// login gate blurs the page — long enough to feel like a real page, not a paywall trap.
const PREVIEW_MS = 2000

export default function SharedProposalPage() {
	const params = useParams<{ id: string }>()
	const router = useRouter()
	const { user, authLoading } = useAuthStore()
	const [proposal, setProposal] = useState<PublishedSponsorshipDetail | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [showAuthGate, setShowAuthGate] = useState(false)
	const [authMode, setAuthMode] = useState<"signup" | "login">("signup")
	const redirectPath = `/brand/dashboard/proposal/${params.id}`
	const { loading: googleLoading, handleGoogleSignIn } = useGoogleSignIn(authMode, "brand", redirectPath, { seamless: true })

	// Already signed in — skip the preview/gate entirely and go straight to the real dashboard view.
	useEffect(() => {
		if (!authLoading && user) {
			router.replace(`/brand/dashboard/proposal/${params.id}`)
		}
	}, [authLoading, user, params.id, router])

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

	useEffect(() => {
		if (authLoading || user) return
		const timer = setTimeout(() => setShowAuthGate(true), PREVIEW_MS)
		return () => clearTimeout(timer)
	}, [authLoading, user])

	const hostName = proposal
		? proposal.hostProfile?.displayName ||
			[proposal.hostProfile?.user?.firstName, proposal.hostProfile?.user?.lastName].filter(Boolean).join(" ") ||
			"Host"
		: ""

	return (
		<div className="flex flex-col min-h-screen bg-white">
			<div className="flex justify-between items-center px-8 py-4 border-b border-black/10 shrink-0">
				<Image src="/assets/brand_logo.svg" alt="Meetday" width={110} height={28} className="h-7 w-auto" />
			</div>

			<div
				className={clsx(
					"flex-1 w-full relative bg-white transition-[filter] duration-300",
					proposal?.community ? "md:grid md:grid-cols-[65%_35%]" : "flex flex-col",
					showAuthGate && "blur-sm select-none pointer-events-none",
				)}
			>
				<div
					className={clsx(
						"px-4 lg:px-6 py-6 lg:py-8 flex-1 flex flex-col gap-6 w-full",
						proposal?.community ? "max-w-3xl mx-auto" : "max-w-2xl mx-auto",
					)}
				>
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
							<div className="flex flex-row items-start gap-4 pb-4 border-b border-black/10">
								{proposal.imageUrl && (
									<div className="relative size-16 sm:size-36 shrink-0 rounded-xl overflow-hidden border border-border-default shadow-sm bg-slate-50">
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img src={proposal.imageUrl} alt={proposal.name || "Proposal"} className="size-full object-cover" />
									</div>
								)}
								<div className="flex-1 min-w-0">
									<h1 className="text-xl sm:text-3xl font-heading font-black text-black leading-tight">
										{proposal.name || "Untitled Proposal"}
									</h1>
									<p className="text-sm font-semibold text-black/50 mt-1">Hosted by {hostName}</p>
								</div>
							</div>

							<div className="flex flex-col gap-6">
								<div className="bg-surface-card-muted border border-border-default rounded-action p-4 w-full grid grid-cols-2 gap-4">
									{proposal.eventDate && (
										<div>
											<p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">Start</p>
											<div className="mt-1">
												<span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black bg-[#EE2C2C] text-white border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
													{new Date(proposal.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
												</span>
											</div>
										</div>
									)}
									{proposal.guestCount && (
										<div>
											<p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">Guests</p>
											<div className="mt-1">
												<span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black bg-[#EE2C2C] text-white border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
													{proposal.guestCount} Guests
												</span>
											</div>
										</div>
									)}
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

								{proposal.about && (
									<div className="bg-surface-card border border-border-default rounded-action p-5">
										<h4 className="text-sm font-bold text-text-primary mb-2">About the Project</h4>
										<p className="text-body-sm text-text-secondary leading-relaxed whitespace-pre-wrap break-words">{proposal.about}</p>
									</div>
								)}

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

								{proposal.docUrl && (
									<div className="flex flex-col gap-3">
										<h4 className="text-sm font-bold text-text-primary">Document Preview</h4>
										<div className="border border-border-default rounded-action overflow-hidden bg-surface-card shadow-sm h-[80vh] md:h-[750px] relative">
											<PdfViewer url={proposal.docUrl} />
										</div>
									</div>
								)}

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

				{!isLoading && proposal?.community && (
					<div className="hidden md:flex flex-col border-l border-black/10 w-full bg-white">
						<CommunityProfileDetailsPanel
							community={{ ...proposal.community, approvalStatus: "APPROVED" } as any}
							operatingCities={proposal.hostProfile?.operatingCities}
							socialLinks={proposal.hostProfile?.socialLinks ?? undefined}
							hideStatus={true}
						/>
					</div>
				)}
			</div>

			{showAuthGate && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
					<div className="w-full max-w-sm bg-white border-[3px] border-black rounded-[28px] p-6 flex flex-col gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
						<h2 className="text-lg font-heading font-black text-black leading-tight">Sign in to keep viewing</h2>
						<p className="text-xs font-semibold text-black/60 leading-relaxed">
							This sponsorship proposal was shared with you on Meetday. Sign in to see the full details and
							express interest.
						</p>
						<div className="flex gap-1 p-1 bg-black/5 border-[2px] border-black rounded-xl">
							{(["signup", "login"] as const).map((option) => (
								<button
									key={option}
									type="button"
									onClick={() => setAuthMode(option)}
									className={clsx(
										"flex-1 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors",
										authMode === option ? "bg-black text-white" : "text-black/50 hover:text-black",
									)}
								>
									{option === "signup" ? "Sign Up" : "Login"}
								</button>
							))}
						</div>
						<GoogleSignInButton onClick={handleGoogleSignIn} loading={googleLoading} />
					</div>
				</div>
			)}
		</div>
	)
}
