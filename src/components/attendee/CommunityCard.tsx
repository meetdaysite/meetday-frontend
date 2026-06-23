import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import UserSvg from "@/icons/outlined/user.svg"
import CheckSvg from "@/icons/outlined/check.svg"

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
		<Link href={`/communities/${community.slug}`} className="w-full rounded-2xl overflow-hidden border border-border-default bg-surface-card block">
			<div className="relative h-36 w-full overflow-hidden">
				<Image
					src={community.coverImageUrl}
					alt={community.name}
					fill
					sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 20vw"
					className="object-cover"
				/>
			</div>
			<div className="p-3 flex flex-col gap-3">
				<div>
					<p className="font-semibold text-lg text-text-primary leading-tight">{community.name}</p>
					<p className="text-[11px] font-medium text-text-secondary mt-0.5">
						{TYPE_LABEL[community.type] ?? community.type}
						{/* • {community.access} */}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<div className="flex items-center gap-1 text-[11px] text-text-secondary font-medium">
						<Icon as={UserSvg} size="sm" color="secondary" />
						<span>{fmtCount(community.memberCount)} members</span>
					</div>
					<div className="flex items-center gap-1 text-[11px] text-text-secondary font-medium">
						<Icon as={CalendarSvg} size="sm" color="secondary" />
						<span>{community.experienceCount} upcoming</span>
					</div>
				</div>
				<div className="flex justify-end">
					{community.isMember ? (
						<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200">
							<Icon as={CheckSvg} size="xs" color="success" />
							Joined
						</span>
					) : (
						<Button
							variant="secondary"
							size="xs"
							radius="sm"
							className="text-text-brand font-medium border-border-focus hover:bg-surface-brand-soft hover:cursor-pointer"
						>
							Join
						</Button>
					)}
				</div>
			</div>
		</Link>
	)
}
