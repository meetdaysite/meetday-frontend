"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSpaceStore } from "@/store/spaceStore"
import { getSpaceCommunityProfile, type SpaceCommunityProfile } from "@/lib/api"
import { BrandSpaceDetailView, type SpaceDetailData } from "@/components/spaces/BrandSpaceDetailView"
import { Skeleton } from "@/components/ui/Skeleton"
import Link from "next/link"

function SpaceBrandPreviewContent() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const from = searchParams?.get("from")
	const { profile } = useSpaceStore()

	const [community, setCommunity] = useState<SpaceCommunityProfile | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let cancelled = false
		setLoading(true)

		getSpaceCommunityProfile()
			.then((res) => {
				if (!cancelled) setCommunity(res)
			})
			.catch(() => {})
			.finally(() => {
				if (!cancelled) setLoading(false)
			})

		return () => {
			cancelled = true
		}
	}, [])

	const backLabel = from === "proposal" ? "Back to Proposals" : "Back to Profile"
	const backHref = from === "proposal" ? "/spaces/dashboard/proposals" : "/spaces/dashboard/profile"

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
				<h2 className="text-2xl font-heading font-black text-black">No Community Hub Profile Found</h2>
				<p className="text-sm font-semibold text-black/60 max-w-md">
					Please complete and save your community hub profile before viewing the brand preview.
				</p>
				<Link
					href="/spaces/dashboard/profile"
					className="px-5 py-2.5 bg-[#FFC940] hover:bg-[#ffbe1a] text-black border-2 border-black rounded-xl font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
				>
					Go to Profile
				</Link>
			</div>
		)
	}

	const spaceDetailData: SpaceDetailData = {
		id: community.id,
		spaceProfileId: community.spaceProfileId,
		name: community.name,
		about: community.about,
		logoUrl: community.logoUrl,
		posterUrl: community.posterUrl,
		numberOfVenues: community.numberOfVenues,
		venueCapacity: community.venueCapacity,
		communitySize: community.communitySize,
		experiencesPerYear: community.experiencesPerYear,
		activeLocations: community.activeLocations || [],
		centreShowcaseUrls: community.centreShowcaseUrls || [],
		videoLink: community.videoLink,
		businessName: profile?.businessName || null,
		operatingCities: profile?.operatingCities || [],
		socialLinks: profile?.socialLinks || null,
		categories: community.categories || [],
		pastEvents: community.pastEvents || [],
		brandsWorkedWith: community.brandsWorkedWith || [],
		popupDays: community.popupDays,
		popupPrice: community.popupPrice,
		brandingDays: community.brandingDays,
		brandingPrice: community.brandingPrice,
	}

	return (
		<BrandSpaceDetailView
			space={spaceDetailData}
			onBack={handleBack}
			backLabel={backLabel}
			isBrandPreview={true}
		/>
	)
}

export default function SpaceBrandPreviewPage() {
	return (
		<Suspense fallback={<div className="p-8 text-center text-sm font-semibold text-black/50">Loading preview...</div>}>
			<SpaceBrandPreviewContent />
		</Suspense>
	)
}
