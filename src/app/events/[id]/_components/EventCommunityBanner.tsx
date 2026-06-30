import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import MapPointSvg from "@/icons/outlined/map-point.svg"
import UserSvg from "@/icons/outlined/users-group-2.svg"
import EyeSvg from "@/icons/outlined/eye-open.svg"
import type { PublicEventCommunity } from "@/types/attendee"

function fmtCount(n: number): string {
	if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
	return String(n)
}

function CommunityCard({ community }: { community: PublicEventCommunity }) {
	const isManaged = community.type.includes("MEETDAY_MANAGED")
	const isPublic = community.access === "PUBLIC"

	return (
		<div className="rounded-action border border-border-default p-4 flex items-stretch gap-4">
			<div className="relative w-20 shrink-0 self-stretch rounded-md overflow-hidden">
				<Image
					src={community.coverImageUrl}
					alt={community.name}
					fill
					sizes="80px"
					className="object-cover"
				/>
			</div>

			<div className="flex-1 min-w-0 flex flex-col gap-1.5">
				<div className="flex items-center gap-2 flex-wrap">
					<p className="font-semibold text-body-md text-text-primary">{community.name}</p>
					<div className="flex items-center gap-1">
						{isManaged && (
							<span className="text-[11px] font-medium bg-surface-info-soft text-text-info border border-blue-200 rounded-avatar px-2 py-0.5">
								Meetday Managed
							</span>
						)}
						<span className="text-[11px] font-medium bg-surface-info-soft text-text-info border border-blue-200 rounded-avatar px-2 py-0.5">
							{isPublic ? "Public" : "Private"}
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
						<span>{community.upcomingExperiencesCount} upcoming experiences</span>
					</div>
					<span className="text-border-strong">|</span>
					<div className="flex items-center gap-1 text-label-sm text-text-secondary">
						<Icon as={MapPointSvg} size="sm" color="secondary" />
						<span>{community.city}</span>
					</div>
				</div>
			</div>

			<div className="shrink-0 flex flex-col justify-end">
				<Link href={`/communities/${community.slug}`}>
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
	)
}

interface EventCommunityBannerProps {
	communities: PublicEventCommunity[]
}

export function EventCommunityBanner({ communities }: EventCommunityBannerProps) {
	if (communities.length === 0) return null

	const label =
		communities.length === 1
			? "The event belongs to a community."
			: `This event is part of ${communities.length} communities.`

	return (
		<div className="rounded-action bg-surface-card border border-border-default p-5 flex flex-col gap-3">
			<div>
				<p className="text-body-md font-medium text-text-primary">{label}</p>
				<p className="text-label-sm text-text-secondary font-normal mt-0.5">
					Stay connected before, during and after the experience.
				</p>
			</div>

			<div className="flex flex-col gap-3">
				{communities.map(community => (
					<CommunityCard key={community.id} community={community} />
				))}
			</div>
		</div>
	)
}
