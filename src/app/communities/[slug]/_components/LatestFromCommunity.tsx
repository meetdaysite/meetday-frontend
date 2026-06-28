"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Icon } from "@/components/ui/Icon"
import LockSvg from "@/icons/outlined/lock.svg"
import ArrowRightSvg from "@/icons/outlined/arrow-right.svg"
import { avatarColor } from "@/lib/avatarColor"
import { getCommunityFeedPosts } from "@/lib/api"
import type { FeedPost } from "@/lib/api"

function timeAgo(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime()
	const mins = Math.floor(diff / 60000)
	if (mins < 1) return "just now"
	if (mins < 60) return `${mins}m ago`
	const hrs = Math.floor(mins / 60)
	if (hrs < 24) return `${hrs}h ago`
	return `${Math.floor(hrs / 24)}d ago`
}

function postPreview(post: FeedPost): string {
	if (post.content) return post.content
	if (post.postType === "PHOTO") return "Shared a photo"
	if (post.postType === "POLL") return "Created a poll"
	return ""
}

function PostCardSkeleton() {
	return (
		<div className="flex flex-col gap-2 p-3 rounded-action border border-border-default bg-surface-page animate-pulse">
			<div className="size-9 rounded-full bg-surface-hover shrink-0" />
			<div className="flex flex-col gap-1.5">
				<div className="h-3 w-2/3 bg-surface-hover rounded" />
				<div className="h-2.5 w-full bg-surface-hover rounded" />
				<div className="h-2.5 w-4/5 bg-surface-hover rounded" />
			</div>
		</div>
	)
}

interface LatestFromCommunityProps {
	communityId: string
	isMember: boolean
	onViewAll?: () => void
}

export function LatestFromCommunity({ communityId, isMember, onViewAll }: LatestFromCommunityProps) {
	const [posts, setPosts] = useState<FeedPost[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		getCommunityFeedPosts(communityId, { limit: 3 })
			.then(res => setPosts(res.items))
			.catch(() => {})
			.finally(() => setLoading(false))
	}, [communityId])

	return (
		<div className="rounded-panel bg-surface-card border border-border-default p-5">
			<div className="flex items-center justify-between gap-2 mb-4">
				<div className="flex items-center gap-2">
					<p className="text-body-md font-semibold text-text-primary">Latest from community</p>
					{!isMember && (
						<span className="flex items-center gap-1 text-[10px] font-medium text-text-info bg-surface-info-soft border border-blue-200 rounded-avatar px-2 py-0.5">
							<Icon as={LockSvg} size="xs" color="info" />
							Preview
						</span>
					)}
				</div>
				{onViewAll && (
					<button
						type="button"
						onClick={onViewAll}
						className="flex items-center gap-1 text-sm text-text-brand font-medium hover:underline shrink-0"
					>
						View all
						<Icon as={ArrowRightSvg} size="xs" color="brand" />
					</button>
				)}
			</div>

			{loading ? (
				<div className="grid grid-cols-3 gap-3">
					{Array.from({ length: 3 }).map((_, i) => <PostCardSkeleton key={i} />)}
				</div>
			) : posts.length === 0 ? (
				<p className="text-label-sm text-text-secondary">No posts yet.</p>
			) : (
				<div className={`grid grid-cols-3 gap-3 ${!isMember ? "pointer-events-none" : ""}`}>
					{posts.map((post, i) => {
						const color = avatarColor(post.author.name)
						return (
							<div
								key={post.id}
								className={`flex flex-col gap-3 p-3 rounded-action border border-border-default bg-surface-page transition-opacity ${!isMember && i >= 1 ? "opacity-40" : ""} ${!isMember && i >= 2 ? "opacity-20" : ""}`}
							>
								<div className="flex items-center gap-2.5">
									{post.author.avatarUrl ? (
										<div className="relative size-9 rounded-full overflow-hidden shrink-0">
											<Image
												src={post.author.avatarUrl}
												alt={post.author.name}
												fill
												sizes="36px"
												className="object-cover"
											/>
										</div>
									) : (
										<div className={`size-9 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold ${color.bg} ${color.text}`}>
											{post.author.name.slice(0, 2).toUpperCase()}
										</div>
									)}
									<div className="min-w-0">
										<p className="text-body-sm font-semibold text-text-primary truncate">
											{post.author.name}
										</p>
										<p className="text-[11px] text-text-muted">{timeAgo(post.createdAt)}</p>
									</div>
								</div>
								<p className="text-label-sm text-text-secondary font-normal leading-snug line-clamp-3">
									{postPreview(post)}
								</p>
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}
