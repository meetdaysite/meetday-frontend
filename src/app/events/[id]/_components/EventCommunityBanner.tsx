import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import MapPointSvg from "@/icons/outlined/map-point.svg"
import UserSvg from "@/icons/outlined/users-group-2.svg"
import EyeSvg from "@/icons/outlined/eye-open.svg"

// TODO: Replace with real type once community API is integrated
interface EventCommunity {
	id: string
	name: string
	description: string
	memberCount: number
	upcomingCount: number
	city: string
	coverImageUrl: string
	isManaged: boolean
	visibility: "Public" | "Private"
}

function fmtCount(n: number): string {
	if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
	return String(n)
}

// TODO: Remove mock and derive from event.community once the API returns community data
const MOCK_COMMUNITY: EventCommunity = {
	id: "mock-community-1",
	name: "Meetday Nightlife Circle",
	description:
		"A Public Meetday community for music lovers, rooftop regulars, late-night explorers, and people who enjoy high-energy IRL experiences.",
	memberCount: 1800,
	upcomingCount: 14,
	city: "Kolkata",
	coverImageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=160&h=160&fit=crop",
	isManaged: true,
	visibility: "Public",
}

// TODO: Accept `community` prop from event data once GET /api/events/[id] returns community info.
// TODO: Only render this component when event.community is not null.
export function EventCommunityBanner() {
	const community = MOCK_COMMUNITY

	return (
		<div className="rounded-action bg-surface-card border border-border-default p-5 flex flex-col gap-3">
			<div>
				<p className="text-body-md font-medium text-text-primary">
					The event belongs to a community.
				</p>
				<p className="text-label-sm text-text-secondary font-normal mt-0.5">
					Stay connected before, during and after the experience.
				</p>
			</div>

			<div className="rounded-action border border-border-default p-4 flex items-stretch gap-4">
				{/* Cover image — full height of the padded container */}
				<div className="relative w-20 shrink-0 self-stretch rounded-md overflow-hidden">
					<Image
						src={community.coverImageUrl}
						alt={community.name}
						fill
						sizes="80px"
						className="object-cover"
					/>
				</div>

				{/* Info */}
				<div className="flex-1 min-w-0 flex flex-col gap-1.5">
					<div className="flex items-center gap-2 flex-wrap">
						<p className="font-semibold text-body-md text-text-primary">{community.name}</p>
						<div className="flex items-center gap-1">
							{community.isManaged && (
								<span className="text-[11px] font-medium bg-surface-info-soft text-text-info border border-blue-200 rounded-avatar px-2 py-0.5">
									Meetday Managed
								</span>
							)}
							<span className="text-[11px] font-medium bg-surface-info-soft text-text-info border border-blue-200 rounded-avatar px-2 py-0.5">
								{community.visibility}
							</span>
						</div>
					</div>

					<p className="text-label-sm font-normal text-text-secondary leading-snug line-clamp-2">
						{community.description}
					</p>

					<div className="flex items-center gap-3 flex-wrap mt-0.5">
						<div className="flex items-center gap-1 text-label-sm text-text-secondary">
							<Icon as={UserSvg} size="sm" color="secondary" />
							<span>{fmtCount(community.memberCount)} members</span>
						</div>
						<span className="text-border-strong">|</span>
						<div className="flex items-center gap-1 text-label-sm text-text-secondary">
							<Icon as={CalendarSvg} size="sm" color="secondary" />
							<span>{community.upcomingCount} upcoming experiences</span>
						</div>
						<span className="text-border-strong">|</span>
						<div className="flex items-center gap-1 text-label-sm text-text-secondary">
							<Icon as={MapPointSvg} size="sm" color="secondary" />
							<span>{community.city}</span>
						</div>
					</div>
				</div>

				{/* CTA */}
				{/* TODO: Replace "meetday-music-nights" with community.id once API returns community data */}
				<div className="shrink-0 flex flex-col justify-end">
					<Link href={`/communities/${community.id}`}>
						<Button
							variant="primary"
							size="sm"
							radius="pill"
							className="bg-neutral-900"
							leftIcon={<Icon as={EyeSvg} size="sm" color="inverse" />}
						>
							View Community
						</Button>
					</Link>
				</div>
			</div>
		</div>
	)
}
