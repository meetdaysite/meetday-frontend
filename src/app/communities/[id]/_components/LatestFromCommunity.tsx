import Image from "next/image"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import LockSvg from "@/icons/outlined/lock.svg"
import BoltSvg from "@/icons/outlined/suspension-bolt.svg"
import ChatSvg from "@/icons/outlined/chat.svg"

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
	isLoggedIn: boolean
}

export function LatestFromCommunity({ communityName, isLoggedIn }: LatestFromCommunityProps) {
	return (
		<div className="rounded-panel bg-surface-card border border-border-default p-5">
			<div className="flex items-center justify-between gap-2 mb-4">
				<div className="flex items-center gap-2">
					<Icon as={ChatSvg} size="md" color="brand" />
					<p className="text-body-md font-semibold text-text-primary">Latest from community</p>
				</div>
				{!isLoggedIn && (
					<span className="flex items-center gap-1 text-[11px] font-medium text-text-muted border border-border-default rounded-avatar px-2 py-0.5">
						<Icon as={LockSvg} size="sm" color="muted" />
						Preview
					</span>
				)}
			</div>

			{/* Posts list with conditional lock overlay */}
			<div className="relative">
				<div className={`flex flex-col gap-3 ${!isLoggedIn ? "pointer-events-none" : ""}`}>
					{MOCK_POSTS.map((post, i) => (
						<div
							key={post.id}
							className={`flex gap-3 p-3 rounded-action border border-border-default bg-surface-page transition-opacity ${!isLoggedIn && i >= 1 ? "opacity-40" : ""} ${!isLoggedIn && i >= 2 ? "opacity-20" : ""}`}
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
							<div className="flex-1 min-w-0">
								<div className="flex items-baseline gap-2">
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

				{/* Lock overlay when not logged in */}
				{!isLoggedIn && (
					<div className="absolute inset-x-0 bottom-0 h-36 bg-linear-to-t from-surface-card to-transparent flex flex-col items-center justify-end gap-3 pb-2">
						<div className="flex flex-col items-center gap-2 text-center px-4">
							<Icon as={LockSvg} size="lg" color="muted" />
							<p className="text-label-sm text-text-secondary font-normal leading-snug max-w-xs">
								Join <span className="font-semibold text-text-primary">{communityName}</span> to
								unlock conversations, connect with members and get first access to events.
							</p>
						</div>
						{/* TODO: Wire up join action via POST /api/communities/[id]/join */}
						<Button
							variant="primary"
							size="sm"
							radius="pill"
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
