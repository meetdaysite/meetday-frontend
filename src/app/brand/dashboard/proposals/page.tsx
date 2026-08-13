"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import { useBrandStore } from "@/store/brandStore"
import { Skeleton } from "@/components/ui/Skeleton"
import {
	getAllPublishedSponsorships,
	getCategories,
	type Category,
	type PublishedSponsorshipProposal,
} from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"
import clsx from "clsx"

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

	return (
		<button
			type="button"
			onClick={onClick}
			className="text-left rounded-action border border-border-default bg-surface-card overflow-hidden flex flex-col hover:border-border-strong transition-colors duration-(--duration-120)"
		>
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
					<span>{formatDateRange(proposal.eventDate, proposal.eventEndDate)}</span>
					{proposal.city && <span>{proposal.city}</span>}
				</div>
				{proposal.hostProfile?.categories?.length > 0 && (
					<div className="flex flex-wrap gap-2 mt-1">
						{proposal.hostProfile.categories.map((c) => (
							<span key={c.id} className="px-2 py-0.5 rounded-full bg-surface-card-muted text-text-muted text-caption">
								{c.name}
							</span>
						))}
					</div>
				)}
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
		</button>
	)
}

export default function ProposalsPage() {
	const router = useRouter()
	const { profile } = useBrandStore()
	const [categories, setCategories] = useState<Category[]>([])
	const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
	const [proposals, setProposals] = useState<PublishedSponsorshipProposal[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		getCategories()
			.then(setCategories)
			.catch(() => {
				// non-fatal — filters just won't render
			})
	}, [])

	useEffect(() => {
		let cancelled = false
		setIsLoading(true)
		getAllPublishedSponsorships(selectedCategoryId ?? undefined)
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
	}, [selectedCategoryId])

	// Only show category tabs for categories that actually have at least one published proposal,
	// computed from the unfiltered "All" list the first time it loads.
	const categoriesWithProposals = useMemo(() => {
		if (selectedCategoryId !== null) return categories
		const idsInUse = new Set(proposals.flatMap((p) => p.hostProfile?.categories?.map((c) => c.id) ?? []))
		return categories.filter((c) => idsInUse.has(c.id))
	}, [categories, proposals, selectedCategoryId])

	const displayName = profile?.brandName || "Brand"

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

			<div className="px-6 lg:px-8 pb-4 flex flex-wrap gap-2">
				<button
					type="button"
					onClick={() => setSelectedCategoryId(null)}
					className={clsx(
						"px-3.5 py-1.5 rounded-full text-label-sm font-medium border transition-colors duration-(--duration-120)",
						selectedCategoryId === null
							? "bg-action-primary text-action-primary-text border-action-primary"
							: "bg-surface-card text-text-secondary border-border-default hover:border-border-strong",
					)}
				>
					All
				</button>
				{categoriesWithProposals.map((c) => (
					<button
						key={c.id}
						type="button"
						onClick={() => setSelectedCategoryId(c.id)}
						className={clsx(
							"px-3.5 py-1.5 rounded-full text-label-sm font-medium border transition-colors duration-(--duration-120)",
							selectedCategoryId === c.id
								? "bg-action-primary text-action-primary-text border-action-primary"
								: "bg-surface-card text-text-secondary border-border-default hover:border-border-strong",
						)}
					>
						{c.name}
					</button>
				))}
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
					<p className="text-body-sm text-text-secondary">No sponsorship proposals found for this filter.</p>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{proposals.map((proposal) => (
							<ProposalCard
								key={proposal.id}
								proposal={proposal}
								onClick={() => router.push(`/brand/dashboard/proposal/${proposal.id}`)}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	)
}
