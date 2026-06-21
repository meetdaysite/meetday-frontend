import Image from "next/image"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import LockSvg from "@/icons/outlined/lock.svg"
import BoltSvg from "@/icons/outlined/bolt.svg"
// import ChatSvg from "@/icons/outlined/chat.svg"

// TODO: Replace with real type once community chat/feed API is integrated
interface CommunityPost {
	id: string
	authorName: string
	authorAvatarUrl: string
	content: string
	timeAgo: string
}

// TODO: Replace with API call — GET /api/communities/[id]/posts?limit=5&preview=true
const MOCK_POSTS: CommunityPost[] = [
	{
		id: "p1",
		authorName: "Megha",
		authorAvatarUrl: "https://i.pravatar.cc/40?img=5",
		content: "What a vibe at Night Rituals 🔥",
		timeAgo: "2h ago",
	},
	{
		id: "p2",
		authorName: "Alan",
		authorAvatarUrl: "https://i.pravatar.cc/40?img=11",
		content: "Anyone attending After Hours this weekend?",
		timeAgo: "5h ago",
	},
	{
		id: "p3",
		authorName: "Rohan",
		authorAvatarUrl: "https://i.pravatar.cc/40?img=17",
		content: "Looking for rooftop recommendations in Kolkata!",
		timeAgo: "8h ago",
	},
]

interface LatestFromCommunityProps {
	communityName: string
	isMember: boolean
}

export function LatestFromCommunity({ communityName, isMember }: LatestFromCommunityProps) {
	return (
		<div className="rounded-panel bg-surface-card border border-border-default p-5">
			<div className="flex items-center justify-between gap-2 mb-4">
				<div className="flex items-center gap-2">
					{/* <Icon as={ChatSvg} size="md" color="brand" /> */}
					<p className="text-body-md font-semibold text-text-primary">Latest from community</p>
				</div>
				{!isMember && (
					<span className="flex items-center gap-1 text-[10px] font-medium text-text-info bg-surface-info-soft border border-blue-200 rounded-avatar px-2 py-0.5">
						<Icon as={LockSvg} size="xs" color="info" />
						Preview
					</span>
				)}
			</div>

			{/* Posts list */}
			<div>
				<div className={`grid grid-cols-3 gap-3 ${!isMember ? "pointer-events-none" : ""}`}>
					{MOCK_POSTS.map((post, i) => (
						<div
							key={post.id}
							className={`flex flex-col gap-2 p-3 rounded-action border border-border-default bg-surface-page transition-opacity ${!isMember && i >= 1 ? "opacity-40" : ""} ${!isMember && i >= 2 ? "opacity-20" : ""}`}
						>
							<div className="relative size-9 rounded-full overflow-hidden shrink-0">
								<Image
									src={post.authorAvatarUrl}
									alt={post.authorName}
									fill
									sizes="36px"
									className="object-cover"
								/>
							</div>
							<div>
								<div className="flex items-baseline gap-1.5 flex-wrap">
									<span className="text-label-sm font-semibold text-text-primary">
										{post.authorName}
									</span>
									<span className="text-[11px] text-text-muted">{post.timeAgo}</span>
								</div>
								<p className="text-label-sm text-text-secondary font-normal mt-0.5 leading-snug">
									{post.content}
								</p>
							</div>
						</div>
					))}
				</div>

				{/* Lock banner when not logged in */}
				{!isMember && (
					<div className="mt-3 rounded-panel bg-surface-brand-soft border border-border-focus p-4 flex flex-col sm:flex-row items-center gap-4">
						<div className="flex items-center justify-center size-10 rounded-full bg-action-primary shrink-0">
							<Icon as={LockSvg} size="sm" color="inverse" />
						</div>
						<p className="flex-1 min-w-0 text-label-sm text-text-secondary font-normal leading-snug text-center sm:text-left">
							Join{" "}
							<span className="font-semibold text-text-brand">{communityName}</span>{" "}
							to unlock conversations, connect with members and get first access to events.
						</p>
						{/* TODO: Wire up join action via POST /api/communities/[id]/join */}
						<Button
							variant="primary"
							size="sm"
							radius="pill"
							className="shrink-0"
							leftIcon={<Icon as={BoltSvg} size="sm" color="inverse" />}
						>
							Join Community
						</Button>
					</div>
				)}
			</div>
		</div>
	)
}
