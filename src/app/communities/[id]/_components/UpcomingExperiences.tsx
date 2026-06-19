import Link from "next/link"
import { Icon } from "@/components/ui/Icon"
import ArrowRightSvg from "@/icons/outlined/arrow-right.svg"
import { EventCard } from "@/components/attendee/EventCard"
import type { ExploreEvent } from "@/types/attendee"

// TODO: Replace with API call — GET /api/communities/[id]/events?upcoming=true&limit=8
export const MOCK_COMMUNITY_EVENTS: ExploreEvent[] = [
	{
		id: "ce-1",
		title: "NIGHT RITUALS",
		eventType: "UPCOMING",
		eventDate: "2026-05-23",
		startTime: "10:00 PM",
		venueName: "Park Street Basement",
		tags: ["nightlife", "electronic"],
		category: { id: "nightlife", name: "Nightlife" },
		coverImageUrl:
			"https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=600&fit=crop",
		startingPrice: 599,
	},
	{
		id: "ce-2",
		title: "WELLNESS SESSIONS",
		eventType: "POPULAR",
		eventDate: "2026-06-04",
		startTime: "07:00 AM",
		venueName: "Riverside Terrace",
		tags: ["wellness", "morning"],
		category: { id: "wellness", name: "Wellness" },
		coverImageUrl:
			"https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=600&fit=crop",
		startingPrice: 0,
	},
	{
		id: "ce-3",
		title: "SUNSET SESSIONS",
		eventType: "HOT",
		eventDate: "2026-05-24",
		startTime: "06:00 PM",
		venueName: "Rooftop 22, NYC",
		tags: ["music", "rooftop"],
		category: { id: "music", name: "Music" },
		coverImageUrl:
			"https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=600&fit=crop",
		startingPrice: 799,
	},
	{
		id: "ce-4",
		title: "ART AFTER DARK",
		eventType: "UPCOMING",
		eventDate: "2026-06-06",
		startTime: "08:00 PM",
		venueName: "Gallery Row, Kolkata",
		tags: ["art", "culture"],
		category: { id: "arts", name: "Arts & Culture" },
		coverImageUrl:
			"https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=600&fit=crop",
		startingPrice: 399,
	},
	{
		id: "ce-5",
		title: "RUN CLUB VIBES",
		eventType: "POPULAR",
		eventDate: "2026-06-07",
		startTime: "06:00 AM",
		venueName: "Victoria Memorial Grounds",
		tags: ["fitness", "community"],
		category: { id: "fitness", name: "Fitness" },
		coverImageUrl:
			"https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&h=600&fit=crop",
		startingPrice: 0,
	},
	{
		id: "ce-6",
		title: "JAZZ & SPIRITS",
		eventType: "UPCOMING",
		eventDate: "2026-06-14",
		startTime: "08:30 PM",
		venueName: "The Jazz Room",
		tags: ["jazz", "cocktails"],
		category: { id: "music", name: "Music" },
		coverImageUrl:
			"https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&h=600&fit=crop",
		startingPrice: 699,
	},
]

interface UpcomingExperiencesProps {
	events?: ExploreEvent[]
	communityId: string
}

export function UpcomingExperiences({ events = MOCK_COMMUNITY_EVENTS, communityId }: UpcomingExperiencesProps) {
	return (
		<div className="rounded-panel bg-surface-card border border-border-default p-5">
			<div className="flex items-center justify-between gap-2 mb-4">
				<div>
					<p className="text-body-md font-semibold text-text-primary">
						Upcoming experiences from this community
					</p>
				</div>
				{/* TODO: Link to /communities/[id]/events once sub-page is built */}
				<Link
					href={`/communities/${communityId}/events`}
					className="text-sm text-text-brand font-medium hover:underline shrink-0 flex items-center gap-1"
				>
					View all
					<Icon as={ArrowRightSvg} size="sm" className="inline-block" color="brand" />
				</Link>
			</div>

			{/* Horizontal scroll row */}
			<div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
				{events.map(event => (
					<div key={event.id} className="w-40 shrink-0">
						<EventCard event={event} />
					</div>
				))}
			</div>
		</div>
	)
}

// Full grid for the Experiences tab
export function ExperiencesGrid({ events = MOCK_COMMUNITY_EVENTS }: { events?: ExploreEvent[] }) {
	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
			{events.map(event => (
				<EventCard key={event.id} event={event} />
			))}
		</div>
	)
}
