"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import { Skeleton } from "@/components/ui/Skeleton"
import { getBrandCommunities, type BrandCommunity } from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"

function CommunityCard({ community }: { community: BrandCommunity }) {
	return (
		<div className="flex items-center gap-4 rounded-action border border-border-default bg-surface-card p-4">
			<div className="relative size-14 rounded-full overflow-hidden bg-surface-card-muted shrink-0">
				{community.logoUrl ? (
					<Image src={community.logoUrl} alt={community.name} fill className="object-cover" unoptimized />
				) : null}
			</div>
			<div className="min-w-0 flex-1">
				<p className="text-label-md font-semibold text-text-primary truncate">{community.name}</p>
				<p className="text-caption text-text-muted mt-0.5">
					{community.size} members · {community.experiencesPerYear} experiences/year
				</p>
				{community.categories.length > 0 && (
					<div className="flex flex-wrap gap-1.5 mt-2">
						{community.categories.map((c) => (
							<span key={c.id} className="px-2 py-0.5 rounded-full bg-surface-card-muted text-text-muted text-caption">
								{c.name}
							</span>
						))}
					</div>
				)}
			</div>
		</div>
	)
}

export default function BrandCommunitiesPage() {
	const [communities, setCommunities] = useState<BrandCommunity[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let cancelled = false
		getBrandCommunities()
			.then((res) => {
				if (!cancelled) setCommunities(res.communities)
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

	return (
		<div className="flex flex-col">
			<DashboardTopBar />

			<div className="px-6 lg:px-8 pt-8 pb-6">
				<h1 className="text-heading-sm lg:text-heading-md font-semibold text-text-primary leading-tight">
					Communities
				</h1>
				<p className="text-body-sm text-text-secondary mt-2">
					Communities onboarded on Meetday, available for sponsorship.
				</p>
			</div>

			<div className="px-6 lg:px-8 pb-8">
				{isLoading ? (
					<div className="flex flex-col gap-3">
						{Array.from({ length: 5 }).map((_, i) => (
							<Skeleton key={i} className="h-20 rounded-action" />
						))}
					</div>
				) : error ? (
					<p className="text-body-sm text-status-error-text">{error}</p>
				) : communities.length === 0 ? (
					<p className="text-body-sm text-text-secondary">No communities onboarded yet.</p>
				) : (
					<div className="flex flex-col gap-3">
						{communities.map((community) => (
							<CommunityCard key={community.id} community={community} />
						))}
					</div>
				)}
			</div>
		</div>
	)
}
