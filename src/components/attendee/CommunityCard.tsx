import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import UserSvg from "@/icons/outlined/user.svg"

export interface Community {
	id: string
	name: string
	memberCount: number
	upcomingCount: number
	coverImageUrl: string
	memberAvatars: string[]
	extraMemberCount: number
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
		// TODO: Replace "meetday-music-nights" with community.id once API returns real IDs
		<Link href={`/communities/${community.id}`} className="w-full rounded-2xl overflow-hidden border border-border-default bg-surface-card block">
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
					<p className="text-[11px] font-medium text-text-secondary mt-0.5">Meetday Managed • Public</p>
				</div>
				<div className="flex items-center gap-2">
					<div className="flex items-center gap-1 text-[11px] text-text-secondary font-medium">
						<Icon as={UserSvg} size="sm" color="secondary" />
						<span>{fmtCount(community.memberCount)} members</span>
					</div>
					<div className="flex items-center gap-1 text-[11px] text-text-secondary font-medium">
						<Icon as={CalendarSvg} size="sm" color="secondary" />
						<span>{community.upcomingCount} upcoming</span>
					</div>
				</div>
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center">
						{community.memberAvatars.map((src, i) => (
							<div
								key={i}
								className="relative w-6 h-6 rounded-full overflow-hidden border-2 border-border-default -ml-1.5 first:ml-0"
								style={{ zIndex: community.memberAvatars.length - i }}
							>
								<Image src={src} alt="" fill sizes="20px" className="object-cover" />
							</div>
						))}
						<span className="ml-1 text-xs font-medium text-text-secondary">
							+{community.extraMemberCount}
						</span>
					</div>
					{/* TODO: Wire up join/leave toggle via POST /api/communities/[id]/join */}
					<Button
						variant="secondary"
						size="xs"
						radius="sm"
						className="text-text-brand font-medium border-border-focus hover:bg-surface-brand-soft hover:cursor-pointer"
					>
						Join
					</Button>
				</div>
			</div>
		</Link>
	)
}
