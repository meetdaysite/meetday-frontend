"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import { useHostStore } from "@/store/hostStore"
import { Skeleton } from "@/components/ui/Skeleton"
import { getAllPublishedSponsorships, type PublishedSponsorshipProposal } from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"

function formatDate(value: string | null): string {
	if (!value) return "Date TBD"
	try {
		return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
	} catch {
		return value
	}
}

function ProposalCard({ proposal }: { proposal: PublishedSponsorshipProposal }) {
	const hostName =
		proposal.hostProfile?.displayName ||
		[proposal.hostProfile?.user?.firstName, proposal.hostProfile?.user?.lastName].filter(Boolean).join(" ") ||
		"Host"

	return (
		<div className="rounded-action border border-border-default bg-surface-card overflow-hidden flex flex-col">
			<div className="relative w-full aspect-[16/9] bg-surface-card-muted">
				{proposal.imageUrl ? (
					<Image src={proposal.imageUrl} alt={proposal.name ?? "Sponsorship proposal"} fill className="object-cover" unoptimized />
				) : (
					<div className="w-full h-full flex items-center justify-center text-text-muted text-caption">No image</div>
				)}
			</div>
			<div className="p-4 flex flex-col gap-2 flex-1">
				<h3 className="text-label-md font-semibold text-text-primary line-clamp-1">
					{proposal.name || "Untitled proposal"}
				</h3>
				<p className="text-caption text-text-muted">Hosted by {hostName}</p>
				{proposal.about && (
					<p className="text-body-sm text-text-secondary line-clamp-2">{proposal.about}</p>
				)}
				<div className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-text-muted mt-1">
					<span>{formatDate(proposal.eventDate)}</span>
					{proposal.city && <span>{proposal.city}</span>}
				</div>
				{proposal.sponsorTiers?.length > 0 && (
					<div className="flex flex-wrap gap-2 mt-2">
						{proposal.sponsorTiers.map((tier, i) => (
							<span
								key={i}
								className="px-2.5 py-1 rounded-full bg-surface-brand-soft text-text-brand text-caption font-medium"
							>
								{tier.name}
							</span>
						))}
					</div>
				)}
			</div>
		</div>
	)
}

export default function DashboardPage() {
	const { profile } = useHostStore()
	const [proposals, setProposals] = useState<PublishedSponsorshipProposal[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let cancelled = false
		setIsLoading(true)
		getAllPublishedSponsorships()
			.then((res) => {
				if (!cancelled) setProposals(res.proposals)
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

	const displayName = profile?.displayName || "Brand"

	return (
		<div className="flex flex-col">
			<DashboardTopBar />

			<div className="px-6 lg:px-8 pt-8 pb-6">
				<h1 className="text-heading-sm lg:text-heading-md font-semibold text-text-primary leading-tight">
					Welcome back, <span className="text-text-brand">{displayName}.</span>
				</h1>
				<p className="text-body-sm text-text-secondary mt-2">
					Browse sponsorship opportunities published by hosts across Meetday.
				</p>
			</div>

			<div className="px-6 lg:px-8 pb-8">
				{isLoading ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{Array.from({ length: 6 }).map((_, i) => (
							<Skeleton key={i} className="h-64 rounded-action" />
						))}
					</div>
				) : error ? (
					<p className="text-body-sm text-status-error-text">{error}</p>
				) : proposals.length === 0 ? (
					<p className="text-body-sm text-text-secondary">No sponsorship proposals have been published yet.</p>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{proposals.map((proposal) => (
							<ProposalCard key={proposal.id} proposal={proposal} />
						))}
					</div>
				)}
			</div>
		</div>
	)
}
