"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useHostStore } from "@/store/hostStore"
import { useAuthStore } from "@/store/authStore"
import {
	getHostCommunityProfile,
	getMySponsorshipProposals,
	type HostCommunityProfile,
	type SponsorshipProposal,
} from "@/lib/api"
import {
	BrandCommunityDetailView,
	type CommunityDetailData,
	type CommunityDetailProposal,
} from "@/components/community/BrandCommunityDetailView"
import { Skeleton } from "@/components/ui/Skeleton"
import Link from "next/link"

function BrandPreviewContent() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const from = searchParams?.get("from")
	const { profile } = useHostStore()
	const { user } = useAuthStore()

	const [community, setCommunity] = useState<HostCommunityProfile | null>(null)
	const [proposals, setProposals] = useState<SponsorshipProposal[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let cancelled = false
		setLoading(true)

		Promise.all([
			getHostCommunityProfile().catch(() => null),
			getMySponsorshipProposals({ actorType: "HOST" })
				.then((res) => res.proposals)
				.catch(() => [] as SponsorshipProposal[]),
		])
			.then(([c, p]) => {
				if (!cancelled) {
					setCommunity(c)
					setProposals(p)
				}
			})
			.finally(() => {
				if (!cancelled) setLoading(false)
			})

		return () => {
			cancelled = true
		}
	}, [])

	const backLabel = from === "proposal" ? "Back to Proposals" : "Back to Profile"
	const backHref = from === "proposal" ? "/community/dashboard/proposal" : "/community/dashboard/profile"

	const handleBack = () => {
		router.push(backHref)
	}

	if (loading) {
		return (
			<div className="flex flex-col min-h-full bg-white p-6 max-w-6xl mx-auto w-full gap-6">
				<Skeleton className="h-6 w-36 rounded-lg" />
				<Skeleton className="h-12 w-full rounded-2xl" />
				<Skeleton className="h-64 w-full rounded-[28px]" />
				<Skeleton className="h-48 w-full rounded-[28px]" />
			</div>
		)
	}

	if (!community) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center gap-4">
				<div className="size-16 rounded-full bg-amber-100 border-2 border-black flex items-center justify-center text-2xl font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
					!
				</div>
				<h2 className="text-2xl font-heading font-black text-black">No Community Profile Found</h2>
				<p className="text-sm font-semibold text-black/60 max-w-md">
					Please complete and save your community profile before viewing the brand preview.
				</p>
				<Link
					href="/community/dashboard/profile"
					className="px-5 py-2.5 bg-[#FFC940] hover:bg-[#ffbe1a] text-black border-2 border-black rounded-xl font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
				>
					Go to Profile
				</Link>
			</div>
		)
	}

	const communityDetailData: CommunityDetailData = {
		id: community.id,
		hostProfileId: community.hostProfileId,
		name: community.name,
		about: community.about,
		logoUrl: community.logoUrl,
		size: community.size,
		avgGuestCount: community.avgGuestCount,
		experiencesPerYear: community.experiencesPerYear,
		operatingCities: profile?.operatingCities || [],
		socialLinks: profile?.socialLinks || null,
		categories: community.categories || [],
		secondaryImageUrl: community.secondaryImageUrl,
		pastEvents: community.pastEvents,
		brandsWorkedWith: community.brandsWorkedWith,
	}

	// Show published proposals as active proposals to brands
	const publishedProposals = proposals.filter((p) => p.status === "PUBLISHED" || !p.status)
	const activeProposals: CommunityDetailProposal[] = (publishedProposals.length > 0 ? publishedProposals : proposals).map((p) => ({
		id: p.id,
		name: p.name,
		about: p.about,
		imageUrl: p.imageUrl,
		city: p.city,
		eventDate: p.eventDate,
		eventEndDate: p.eventEndDate,
		guestCount: p.guestCount,
		sponsorshipType: p.sponsorshipType,
		hostProfile: {
			displayName: profile?.displayName || user?.displayName || community.name,
		},
	}))

	return (
		<BrandCommunityDetailView
			community={communityDetailData}
			activeProposals={activeProposals}
			onBack={handleBack}
			backLabel={backLabel}
			isBrandPreview={true}
			onProposalClick={(proposalId) => router.push(`/community/dashboard/proposal?proposalId=${proposalId}`)}
		/>
	)
}

export default function BrandPreviewPage() {
	return (
		<Suspense fallback={<div className="p-8 text-center text-sm font-semibold text-black/50">Loading preview...</div>}>
			<BrandPreviewContent />
		</Suspense>
	)
}
