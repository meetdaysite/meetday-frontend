import Link from "next/link"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import UsersGroupSvg from "@/icons/filled/users-group-2.svg"
import ChatSvg from "@/icons/outlined/chat.svg"
import GalleryWideSvg from "@/icons/outlined/gallery-wide.svg"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import ChecklistSvg from "@/icons/outlined/checklist-2.svg"
import ShareSvg from "@/icons/outlined/share.svg"
import ArrowRightSvg from "@/icons/outlined/arrow-right.svg"
import type { PublicEventCommunity } from "@/types/attendee"

const FEATURES = [
	{ icon: ChatSvg, label: "Chat with attendees" },
	{ icon: GalleryWideSvg, label: "Share moments" },
	{ icon: CalendarSvg, label: "Event updates" },
	{ icon: ChecklistSvg, label: "Plan together" },
	{ icon: ShareSvg, label: "Stay connected" },
]

function fmtCount(n: number): string {
	if (n >= 1000) return `${(n / 1000).toFixed(1)}K+`
	return String(n)
}

function CommunityRow({ community }: { community: PublicEventCommunity }) {
	return (
		<div className="rounded-action bg-surface-vibe-soft border border-purple-200 p-3.5 flex flex-col gap-3">
			<div className="flex items-center gap-3 min-w-0">
				<div className="size-10 rounded-full bg-white flex items-center justify-center shrink-0">
					<Icon as={UsersGroupSvg} size="md" color="vibe" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="text-body-sm font-bold text-text-primary leading-tight truncate">
						{community.name}
					</p>
					<p className="text-caption text-text-secondary mt-0.5">
						{fmtCount(community.memberCount)} members already inside
					</p>
				</div>
			</div>

			<Link href={`/communities/${community.slug}`}>
				<Button
					variant="secondary"
					size="sm"
					radius="pill"
					className="w-full bg-white text-text-vibe border-purple-200 hover:bg-purple-50"
					rightIcon={<Icon as={ArrowRightSvg} size="sm" color="inherit" />}
				>
					Go to Community
				</Button>
			</Link>
		</div>
	)
}

interface EventCommunitiesSectionProps {
	communities: PublicEventCommunity[]
}

export function EventCommunitiesSection({ communities }: EventCommunitiesSectionProps) {
	if (communities.length === 0) return null

	return (
		<div className="rounded-action border border-border-default bg-surface-card p-5 shadow-md flex flex-col gap-4">
			<div>
				<p className="text-body-lg font-semibold text-text-primary">
					{communities.length === 1 ? "This event is part of a community" : `This event is part of ${communities.length} communities`}
				</p>
				<p className="text-label-sm text-text-secondary mt-1 leading-snug">
					Connect, chat, plan and stay updated with other attendees before, during and after the event.
				</p>
				<div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
					{FEATURES.map(f => (
						<div key={f.label} className="flex items-center gap-1.5">
							<Icon as={f.icon} size="xs" color="vibe" />
							<span className="text-caption text-text-secondary">{f.label}</span>
						</div>
					))}
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
				{communities.map(community => (
					<CommunityRow key={community.id} community={community} />
				))}
			</div>
		</div>
	)
}
