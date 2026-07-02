import Image from "next/image"
import Link from "next/link"
import { Icon } from "@/components/ui/Icon"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import CheckSvg from "@/icons/outlined/check.svg"
import UserSvg from "@/icons/outlined/user.svg"

export type CommunityType = "MEETDAY_MANAGED_PUBLIC" | "HOST_LED" | "PRIVATE_INVITE_ONLY"

export interface Community {
	id: string
	slug: string
	name: string
	type: string
	memberCount: number
	experienceCount: number
	coverImageUrl: string
	isMember?: boolean
}

const TYPE_LABEL: Record<string, string> = {
	MEETDAY_MANAGED_PUBLIC: "Meetday Managed",
	HOST_LED: "Host Led",
	PRIVATE_INVITE_ONLY: "Private • Invite Only",
}

function fmtCount(n: number): string {
	if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
	return String(n)
}

interface CommunityCardProps {
	community: Community
}

export function CommunityCard({ community }: CommunityCardProps) {
	return (
		<Link href={`/communities/${community.slug}`} className="w-full rounded-action overflow-hidden border border-border-default bg-surface-card flex flex-col shadow-md">
			<div className="relative h-36 w-full overflow-hidden shrink-0">
				<Image
					src={community.coverImageUrl}
					alt={community.name}
					fill
					sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 20vw"
					className="object-cover"
				/>
			</div>
			<div className="p-3 flex flex-col flex-1">
				<div className="flex-1">
					<p className="font-semibold text-lg text-text-primary leading-tight">{community.name}</p>
					<p className="text-[11px] font-medium text-text-secondary mt-0.5">
						{TYPE_LABEL[community.type] ?? community.type}
					</p>
				</div>
				<div className="flex items-center gap-2 mt-3">
					<div className="flex items-center gap-1 text-[11px] text-text-secondary font-medium">
						<Icon as={UserSvg} size="sm" color="secondary" />
						<span>{fmtCount(community.memberCount)} members</span>
					</div>
					<div className="flex items-center gap-1 text-[11px] text-text-secondary font-medium">
						<Icon as={CalendarSvg} size="sm" color="secondary" />
						<span>{community.experienceCount} upcoming</span>
					</div>
				</div>
				{community.isMember ? (
					<span className="inline-flex items-center gap-1 self-end mt-3 px-2.5 py-1 rounded-avatar text-[11px] font-semibold bg-surface-success-soft text-text-success border border-green-200">
						<Icon as={CheckSvg} size="xs" color="success" />
						Joined
					</span>
				) : (
					<span className="inline-flex items-center justify-center self-end mt-3 px-3 py-1 rounded-avatar text-[11px] font-semibold text-text-brand border border-border-brand bg-transparent">
						Join
					</span>
				)}
			</div>
		</Link>
	)
}
