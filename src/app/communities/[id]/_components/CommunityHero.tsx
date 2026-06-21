import Image from "next/image"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import UsersGroupSvg from "@/icons/filled/users-group-2.svg"
import VerifiedSvg from "@/icons/filled/verified-check.svg"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import MapPointSvg from "@/icons/outlined/map-point.svg"
import BookmarkSvg from "@/icons/outlined/bookmark.svg"
import BoltSvg from "@/icons/outlined/bolt.svg"

// TODO: Replace with real type once community API is integrated
export interface CommunityDetails {
	id: string
	name: string
	description: string
	isManaged: boolean
	visibility: "Public" | "Private"
	memberCount: number
	upcomingCount: number
	city: string
	coverImageUrl: string
	logoUrl: string
}

function fmtCount(n: number): string {
	if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
	return String(n)
}

// TODO: Accept `isJoined` prop and toggle button label/action accordingly
// TODO: Wire join action to POST /api/communities/[id]/join
// TODO: Wire save action to POST /api/communities/[id]/save
export function CommunityHero({ community }: { community: CommunityDetails }) {
	return (
		<div className="rounded-panel overflow-hidden bg-neutral-950 border border-neutral-800 relative">
			{/* Ambient glow */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute -left-12 top-4 size-56 rounded-full bg-purple-600/25 blur-3xl" />
				<div className="absolute right-16 bottom-0 size-56 rounded-full bg-pink-600/20 blur-3xl" />
				<div className="absolute left-1/2 top-0 size-40 rounded-full bg-blue-600/15 blur-2xl" />
			</div>

			{/* Cover image strip */}
			<div className="relative h-28 w-full overflow-hidden">
				<Image
					src={community.coverImageUrl}
					alt=""
					fill
					sizes="(max-width: 1280px) 100vw, 900px"
					className="object-cover opacity-40"
					priority
				/>
				<div className="absolute inset-0 bg-linear-to-b from-transparent to-neutral-950" />
			</div>

			{/* Content area */}
			<div className="relative z-10 px-6 pb-6 flex flex-col gap-5">
				{/* Row 1: logo (left) + info (right) */}
				<div className="grid grid-cols-[auto_1fr] gap-5 items-start -mt-10">
					{/* Left: community logo */}
					<div className="relative size-32 rounded-full shrink-0 border-4 border-neutral-950 overflow-hidden bg-neutral-800">
						<Image
							src={community.logoUrl}
							alt={community.name}
							fill
							sizes="128px"
							className="object-cover"
						/>
					</div>

					{/* Right: badges + name + description + stats */}
					<div className="flex flex-col gap-2 pt-2">
						{/* Badges */}
						<div className="flex gap-2 flex-wrap">
							<span className="text-[11px] font-medium bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-avatar px-2.5 py-0.5">
								{community.visibility} Community
							</span>
							{community.isManaged && (
								<span className="text-[11px] font-medium bg-teal-600/20 text-teal-300 border border-teal-500/30 rounded-avatar px-2.5 py-0.5">
									Managed by Meetday
								</span>
							)}
						</div>

						{/* Name */}
						<div className="flex items-center gap-2">
							<h1 className="text-xl font-extrabold text-white leading-tight">{community.name}</h1>
							{community.isManaged && <Icon as={VerifiedSvg} size="md" color="brand" />}
						</div>

						{/* Description */}
						<p className="text-label-sm text-white/70 leading-relaxed font-normal">
							{community.description}
						</p>

						{/* Stats */}
						<div className="flex flex-wrap gap-x-4 gap-y-1.5">
							<div className="flex items-center gap-1.5 text-label-sm text-white/75">
								<Icon as={UsersGroupSvg} size="sm" color="inverse" />
								<span>{fmtCount(community.memberCount)} members</span>
							</div>
							<div className="flex items-center gap-1.5 text-label-sm text-white/75">
								<Icon as={CalendarSvg} size="sm" color="inverse" />
								<span>{community.upcomingCount} upcoming experiences</span>
							</div>
							<div className="flex items-center gap-1.5 text-label-sm text-white/75">
								<Icon as={MapPointSvg} size="sm" color="inverse" />
								<span>{community.city}</span>
							</div>
						</div>
					</div>
				</div>

				{/* Row 2: action buttons */}
				<div className="flex gap-2">
					<Button
						variant="primary"
						size="md"
						radius="pill"
						leftIcon={<Icon as={BoltSvg} size="sm" color="inverse" />}
					>
						Join Community
					</Button>
					<Button
						variant="secondary"
						size="md"
						radius="pill"
						leftIcon={<Icon as={BookmarkSvg} size="sm" color="inverse" />}
						className="border-white/20 text-white bg-white/5 hover:bg-white/10"
					>
						Save
					</Button>
				</div>
			</div>
		</div>
	)
}
