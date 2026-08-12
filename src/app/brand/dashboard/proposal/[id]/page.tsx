"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { Icon } from "@/components/ui/Icon"
import {
	getPublishedSponsorshipDetail,
	markSponsorshipInterest,
	type PublishedSponsorshipDetail,
} from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"
import AltArrowRightSvg from "@/icons/outlined/alt-arrow-right.svg"

function formatDate(value: string | null): string {
	if (!value) return "Date TBD"
	try {
		return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
	} catch {
		return value
	}
}

function formatDateRange(start: string | null, end: string | null): string {
	if (!start) return "Date TBD"
	if (!end || end === start) return formatDate(start)
	return `${formatDate(start)} - ${formatDate(end)}`
}

export default function ProposalDetailPage() {
	const params = useParams<{ id: string }>()
	const router = useRouter()
	const [proposal, setProposal] = useState<PublishedSponsorshipDetail | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [isInterested, setIsInterested] = useState(false)
	const [isSubmittingInterest, setIsSubmittingInterest] = useState(false)

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
			toast.error(getApiErrorMessage(e))
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
		<div className="flex flex-col">
			<DashboardTopBar />

			<div className="px-6 lg:px-8 pt-6 pb-8 max-w-4xl mx-auto w-full">
				<button
					type="button"
					onClick={() => router.push("/brand/dashboard")}
					className="flex items-center gap-1 text-label-sm text-text-secondary hover:text-text-primary mb-6"
				>
					<Icon as={AltArrowRightSvg} size="sm" className="rotate-180" />
					Back to dashboard
				</button>

				{isLoading ? (
					<div className="flex flex-col gap-4">
						<Skeleton className="h-64 rounded-action" />
						<Skeleton className="h-8 w-2/3 rounded-action" />
						<Skeleton className="h-24 rounded-action" />
					</div>
				) : error || !proposal ? (
					<p className="text-body-sm text-status-error-text">{error ?? "Proposal not found."}</p>
				) : (
					<div className="flex flex-col gap-8">
						<div className="relative w-full aspect-[16/9] rounded-action overflow-hidden bg-surface-card-muted">
							{proposal.imageUrl ? (
								<Image src={proposal.imageUrl} alt={proposal.name ?? "Sponsorship proposal"} fill className="object-cover" unoptimized />
							) : (
								<div className="w-full h-full flex items-center justify-center text-text-muted text-caption">No image</div>
							)}
						</div>

						<div className="flex flex-col gap-2">
							<h1 className="text-heading-sm font-semibold text-text-primary">{proposal.name || "Untitled proposal"}</h1>
							<p className="text-body-sm text-text-secondary">Hosted by {hostName}</p>
							<div className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-text-muted mt-1">
								<span>{formatDateRange(proposal.eventDate, proposal.eventEndDate)}</span>
								{proposal.venues && proposal.venues.length > 0 ? (
									<span>{proposal.venues.join(", ")}</span>
								) : (
									proposal.venue && <span>{proposal.venue}</span>
								)}
								{proposal.city && <span>{proposal.city}</span>}
								{proposal.guestCount && <span>{proposal.guestCount} guests</span>}
							</div>
						</div>

						{proposal.about && (
							<div className="flex flex-col gap-2">
								<h2 className="text-label-md font-semibold text-text-primary">About this experience</h2>
								<p className="text-body-sm text-text-secondary whitespace-pre-line break-words">{proposal.about}</p>
							</div>
						)}

						{proposal.sponsorTiers?.length > 0 && (
							<div className="flex flex-col gap-2">
								<h2 className="text-label-md font-semibold text-text-primary">Sponsorship tiers</h2>
								<div className="flex flex-wrap gap-3">
									{proposal.sponsorTiers.map((tier, i) => (
										<div key={i} className="px-4 py-2 rounded-action border border-border-default bg-surface-card min-w-[120px] max-w-full break-words">
											<p className="text-label-sm font-semibold text-text-primary break-words">{tier.name}</p>
											<p className="text-body-sm text-text-secondary break-words">{tier.price}</p>
										</div>
									))}
								</div>
							</div>
						)}

						{proposal.docUrl && (
							<div className="flex flex-col gap-2">
								<h2 className="text-label-md font-semibold text-text-primary">Pitch document</h2>
								<p className="text-caption text-text-muted">Preview only — downloading isn&apos;t available.</p>
								<div className="w-full h-[70vh] rounded-action overflow-hidden border border-border-default">
									<iframe src={proposal.docUrl} title="Pitch document" className="w-full h-full" />
								</div>
							</div>
						)}

						{proposal.community && (
							<div className="flex flex-col gap-3 p-5 rounded-action border border-border-default bg-surface-card overflow-hidden">
								<h2 className="text-label-md font-semibold text-text-primary">Community profile</h2>
								<div className="flex items-center gap-3">
									{proposal.community.logoUrl && (
										<div className="relative w-12 h-12 rounded-full overflow-hidden bg-surface-card-muted shrink-0">
											<Image src={proposal.community.logoUrl} alt={proposal.community.name} fill className="object-cover" unoptimized />
										</div>
									)}
									<div className="min-w-0 flex-1">
										<p className="text-label-sm font-semibold text-text-primary break-words">{proposal.community.name}</p>
										<p className="text-caption text-text-muted break-words">
											{proposal.community.size} members · {proposal.community.experiencesPerYear} experiences/year
										</p>
									</div>
								</div>
								{proposal.community.about && (
									<p className="text-body-sm text-text-secondary break-words">{proposal.community.about}</p>
								)}
								{proposal.community.categories?.length > 0 && (
									<div className="flex flex-wrap gap-2">
										{proposal.community.categories.map((c) => (
											<span key={c.id} className="px-2 py-0.5 rounded-full bg-surface-card-muted text-text-muted text-caption break-words">
												{c.name}
											</span>
										))}
									</div>
								)}
							</div>
						)}

						<div className="sticky bottom-6">
							<Button
								size="lg"
								disabled={isInterested || isSubmittingInterest}
								onClick={handleInterested}
								className="w-full sm:w-auto"
							>
								{isInterested ? "You're interested ✓" : isSubmittingInterest ? "Sending…" : "I am Interested"}
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
