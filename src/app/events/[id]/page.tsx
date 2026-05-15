import { notFound } from "next/navigation"
import Link from "next/link"
import { Icon } from "@/components/ui/Icon"
import AltArrowLeftSvg from "@/icons/outlined/alt-arrow-left.svg"
import { getPublicEventDetails } from "@/lib/api"
import { EventHero } from "./_components/EventHero"
import { EventSummaryRow } from "./_components/EventSummaryRow"
import { GoodToKnow } from "./_components/GoodToKnow"
import { EventGallery } from "./_components/EventGallery"
import { SidePanel } from "./_components/SidePanel"
import { StickyFooter } from "./_components/StickyFooter"

export default async function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params
	const event = await getPublicEventDetails(id)
	if (!event) notFound()

	return (
		<>
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
							{event.specialInstructions && (
								<GoodToKnow instructions={event.specialInstructions} />
							)}
							<EventGallery media={event.media} />
							<StickyFooter />
						</div>

						{/* Right: side panel (desktop only) */}
						<aside className="hidden lg:flex flex-col gap-4 w-80 shrink-0 sticky top-20">
							<SidePanel event={event} />
						</aside>
					</div>
				</div>
			</main>
		</>
	)
}
