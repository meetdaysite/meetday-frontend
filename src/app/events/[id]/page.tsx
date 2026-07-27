"use client"

import { use, useEffect, useState } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Icon } from "@/components/ui/Icon"
import { Skeleton } from "@/components/ui/Skeleton"
import AltArrowLeftSvg from "@/icons/outlined/alt-arrow-left.svg"
import { getPublicEventDetails } from "@/lib/api"
import { getMyOrders } from "@/lib/ordersApi"
import { useAuthStore } from "@/store/authStore"
import { EventCommunityBanner } from "./_components/EventCommunityBanner"
import { EventHero } from "./_components/EventHero"
import { EventSummaryRow } from "./_components/EventSummaryRow"
import { GoodToKnow } from "./_components/GoodToKnow"
import { EventGallery } from "./_components/EventGallery"
import { SidePanel } from "./_components/SidePanel"
import { StickyFooter } from "./_components/StickyFooter"
import type { PublicEventDetails } from "@/types/attendee"

interface PageProps {
	params: Promise<{ id: string }>
}

export default function EventDetailsPage({ params }: PageProps) {
	const { id } = use(params)
	const { authLoading, user } = useAuthStore()
	const [event, setEvent] = useState<PublicEventDetails | null | undefined>(undefined)
	const [reviewOrderId, setReviewOrderId] = useState<string | null>(null)

	useEffect(() => {
		if (authLoading) return
		getPublicEventDetails(id).then((res) => {
			console.log("[EventDetailsPage] event details:", res)
			setEvent(res)
		})
	}, [id, authLoading])

	// Once the event has ended, check whether the current viewer has a
	// confirmed order for it so the "Leave a Review" CTA has somewhere to go.
	useEffect(() => {
		if (authLoading || !user || event?.displayStatus !== "COMPLETED") return
		getMyOrders()
			.then((orders) => {
				const match = orders.find((o) => o.event.id === id && o.status === "CONFIRMED")
				setReviewOrderId(match?.id ?? null)
			})
			.catch(() => setReviewOrderId(null))
	}, [id, authLoading, user, event?.displayStatus])

	if (authLoading || event === undefined) {
		return (
			<main className="flex-1 py-6 md:py-8 pb-12">
				<div className="max-w-384 mx-auto px-(--space-page-x-mobile) md:px-(--space-page-x-tablet) lg:px-(--space-page-x-desktop)">
					<Skeleton.Text className="w-28 mb-6 animate-pulse" />
					<div className="flex gap-8 items-start">
						<div className="flex-1 min-w-0 flex flex-col gap-5">
							<Skeleton.Block className="w-full h-72 md:h-96 rounded-action" />
							<div className="flex flex-wrap gap-3 animate-pulse">
								<Skeleton.Block className="h-9 w-28 rounded-badge" />
								<Skeleton.Block className="h-9 w-32 rounded-badge" />
								<Skeleton.Block className="h-9 w-24 rounded-badge" />
							</div>
							<div className="flex flex-col gap-2 animate-pulse">
								<Skeleton.Text className="w-full" />
								<Skeleton.Text className="w-5/6" />
								<Skeleton.Text className="w-4/5" />
								<Skeleton.Text className="w-3/4" />
							</div>
						</div>
						<aside className="hidden lg:flex flex-col gap-4 w-100 shrink-0">
							<Skeleton.Block className="h-80 rounded-action" />
						</aside>
					</div>
				</div>
			</main>
		)
	}

	if (!event) notFound()

	return (
		<main className="flex-1 py-6 md:py-8 pb-12">
			<div className="max-w-384 mx-auto px-(--space-page-x-mobile) md:px-(--space-page-x-tablet) lg:px-(--space-page-x-desktop)">
				{/* Back */}
				<Link
					href="/explore"
					className="inline-flex items-center gap-1.5 text-body-sm text-text-primary hover:text-text-primary transition-colors mb-6"
				>
					<Icon as={AltArrowLeftSvg} size="sm" color="primary" />
					Back to Events
				</Link>

				{/* Two-column layout */}
				<div className="flex gap-8 items-start">
					{/* Left: main content */}
					<div className="flex-1 min-w-0 flex flex-col gap-5">
						<EventHero event={event} />
						<EventSummaryRow event={event} />
						{event.communities?.length > 0 && (
							<EventCommunityBanner communities={event.communities} />
						)}
						{event.specialInstructions && (
							<GoodToKnow instructions={event.specialInstructions} />
						)}
						<EventGallery media={event.media} />
						<StickyFooter
							eventId={event.id}
							isSaved={event.isSaved}
							displayStatus={event.displayStatus}
							reviewOrderId={reviewOrderId}
						/>
					</div>

					{/* Right: side panel (desktop only) */}
					<aside className="hidden lg:flex flex-col gap-4 w-100 shrink-0 sticky top-20">
						<SidePanel event={event} />
					</aside>
				</div>
			</div>
		</main>
	)
}
