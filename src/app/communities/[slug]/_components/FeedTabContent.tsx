"use client"

import { useState } from "react"
import Image from "next/image"
import { Icon } from "@/components/ui/Icon"
import GalleryWideSvg from "@/icons/outlined/gallery-wide.svg"
import Chart2Svg from "@/icons/outlined/chart-2.svg"
import UsersGroup2Svg from "@/icons/outlined/users-group-2.svg"
import DotsSvg from "@/icons/outlined/dots.svg"
import ChatSvg from "@/icons/outlined/chat.svg"
import BookmarkSvg from "@/icons/outlined/bookmark.svg"
import ShareSvg from "@/icons/outlined/share.svg"
import HeartsFilledSvg from "@/icons/filled/hearts.svg"

// ─── Create Post Card ─────────────────────────────────────────────────────────

// TODO: Replace mock avatar with real user avatar from useAuthStore
const MOCK_USER_AVATAR = "https://i.pravatar.cc/40?img=8"

const POST_ACTIONS = [
	{ icon: GalleryWideSvg, label: "Photo / Video", iconBg: "bg-green-100", iconColor: "success" as const },
	{ icon: Chart2Svg, label: "Poll", iconBg: "bg-orange-100", iconColor: "secondary" as const, iconClass: "text-orange-500" },
	{ icon: UsersGroup2Svg, label: "Event Buddy", iconBg: "bg-purple-100", iconColor: "vibe" as const },
	{ icon: DotsSvg, label: "More", iconBg: "bg-surface-hover", iconColor: "secondary" as const },
]

function CreatePostCard() {
	return (
		<div className="rounded-panel bg-surface-card border border-border-default p-4 flex flex-col gap-3">
			{/* Input row */}
			<div className="flex items-center gap-3">
				<div className="relative size-10 rounded-full overflow-hidden shrink-0 border border-border-default bg-surface-hover">
					<Image src={MOCK_USER_AVATAR} alt="You" fill sizes="40px" className="object-cover" />
				</div>
				{/* TODO: Wire to open create-post modal */}
				<button
					type="button"
					className="flex-1 text-left px-4 py-2.5 rounded-full bg-surface-page border border-border-default text-label-sm text-text-muted hover:bg-surface-hover transition-colors"
				>
					What&apos;s on your mind?
				</button>
			</div>

			{/* Action buttons */}
			<div className="flex items-center gap-2 flex-wrap">
				{POST_ACTIONS.map(action => (
					<button
						key={action.label}
						type="button"
						className="flex items-center gap-2 px-3 py-2 rounded-action border border-border-default bg-surface-page hover:bg-surface-hover transition-colors text-label-sm text-text-primary font-medium"
					>
						<div className={`size-6 rounded-action ${action.iconBg} flex items-center justify-center shrink-0`}>
							<Icon as={action.icon} size="xs" color={action.iconColor} className={action.iconClass} />
						</div>
						{action.label}
					</button>
				))}
			</div>
		</div>
	)
}

// ─── Post Card ────────────────────────────────────────────────────────────────

interface PostTag {
	label: string
	className: string
}

interface FeedPost {
	id: string
	author: { name: string; avatarUrl: string }
	timeAgo: string
	tags: PostTag[]
	content: string
	images: string[]
	likeCount: number
	commentCount: number
}

// TODO: Replace with real posts from GET /api/communities/[id]/feed/posts?page=1
const MOCK_FEED_POSTS: FeedPost[] = [
	{
		id: "fp1",
		author: { name: "Megha", avatarUrl: "https://i.pravatar.cc/40?img=5" },
		timeAgo: "5m ago",
		tags: [
			{ label: "🎵 Attended Night Rituals 🎵", className: "bg-surface-vibe-soft text-violet-600 border border-purple-200" },
			{ label: "New Member", className: "bg-green-50 text-green-600 border border-green-200" },
		],
		content: "What a night! The energy, the music, the people — everything was unreal. Already excited for the next one! ✨",
		images: [
			"https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop",
			"https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop",
			"https://images.unsplash.com/photo-1598387993441-a364f854cfbd?w=400&h=300&fit=crop",
			"https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=300&fit=crop",
			"https://images.unsplash.com/photo-1504680177321-2e6a879aac86?w=400&h=300&fit=crop",
		],
		likeCount: 42,
		commentCount: 6,
	},
	{
		id: "fp2",
		author: { name: "Arjun", avatarUrl: "https://i.pravatar.cc/40?img=6" },
		timeAgo: "1h ago",
		tags: [
			{ label: "🎵 Looking for Event Buddy", className: "bg-surface-vibe-soft text-violet-600 border border-purple-200" },
		],
		content: "Anyone else going to After Hours this Saturday? Would be great to meet up before the event! 🎵",
		images: [],
		likeCount: 23,
		commentCount: 18,
	},
]

// Photo grid — 2 big photos top row, 3 smaller bottom row (last shows overflow count)
const PHOTO_OVERFLOW_AFTER = 4

function PostPhotoGrid({ images }: { images: string[] }) {
	if (images.length === 0) return null

	const visible = images.slice(0, PHOTO_OVERFLOW_AFTER + 1)
	const overflow = images.length - PHOTO_OVERFLOW_AFTER

	return (
		<div className="flex flex-col gap-1 rounded-action overflow-hidden mt-2">
			{/* Row 1: first 2 photos */}
			<div className="flex gap-1 h-36">
				{visible.slice(0, 2).map((src, i) => (
					<div key={i} className="relative flex-1 bg-surface-hover">
						<Image src={src} alt="" fill sizes="300px" className="object-cover" />
					</div>
				))}
			</div>
			{/* Row 2: remaining photos (up to 3) */}
			{visible.length > 2 && (
				<div className="flex gap-1 h-24">
					{visible.slice(2).map((src, i) => {
						const isLast = i === visible.slice(2).length - 1
						const showOverlay = isLast && overflow > 0
						return (
							<div key={i} className="relative flex-1 bg-surface-hover">
								<Image src={src} alt="" fill sizes="200px" className="object-cover" />
								{showOverlay && (
									<div className="absolute inset-0 bg-black/55 flex items-center justify-center">
										<span className="text-white text-body-md font-bold">+{overflow}</span>
									</div>
								)}
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}

function PostCard({ post }: { post: FeedPost }) {
	const [liked, setLiked] = useState(false)
	const [bookmarked, setBookmarked] = useState(false)

	return (
		<div className="rounded-panel bg-surface-card border border-border-default p-4 flex flex-col gap-3">
			{/* Header */}
			<div className="flex items-start justify-between gap-3">
				<div className="flex items-center gap-2.5">
					<div className="relative size-10 rounded-full overflow-hidden shrink-0 border border-border-default bg-surface-hover">
						<Image src={post.author.avatarUrl} alt={post.author.name} fill sizes="40px" className="object-cover" />
					</div>
					<div>
						<span className="text-label-sm font-bold text-text-primary">{post.author.name}</span>
						<span className="text-[11px] text-text-muted ml-2">{post.timeAgo}</span>
						{/* Tags */}
						<div className="flex items-center gap-1.5 mt-1 flex-wrap">
							{post.tags.map((tag, i) => (
								<span key={i} className={`text-[10px] font-semibold rounded-avatar px-2 py-0.5 ${tag.className}`}>
									{tag.label}
								</span>
							))}
						</div>
					</div>
				</div>
				{/* TODO: Wire to post options menu (edit/delete/report) */}
				<button type="button" className="text-text-muted hover:text-text-primary transition-colors shrink-0 mt-0.5">
					<Icon as={DotsSvg} size="sm" color="muted" />
				</button>
			</div>

			{/* Content */}
			<p className="text-label-sm text-text-primary font-normal leading-relaxed">
				{post.content}
			</p>

			{/* Photo grid */}
			<PostPhotoGrid images={post.images} />

			{/* Actions */}
			<div className="flex items-center justify-between gap-3 pt-1 border-t border-border-default">
				<div className="flex items-center gap-4">
					{/* TODO: Wire to POST /api/feed/posts/[id]/like */}
					<button
						type="button"
						onClick={() => setLiked(l => !l)}
						className={`flex items-center gap-1.5 text-label-sm font-medium transition-colors ${liked ? "text-red-500" : "text-text-secondary hover:text-text-primary"}`}
					>
						<Icon as={HeartsFilledSvg} size="sm" color={liked ? "brand" : "secondary"} />
						{post.likeCount + (liked ? 1 : 0)}
					</button>
					{/* TODO: Wire to open comments panel */}
					<button
						type="button"
						className="flex items-center gap-1.5 text-label-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
					>
						<Icon as={ChatSvg} size="sm" color="secondary" />
						{post.commentCount}
					</button>
				</div>

				<div className="flex items-center gap-3">
					{/* TODO: Wire to POST /api/feed/posts/[id]/bookmark */}
					<button
						type="button"
						onClick={() => setBookmarked(b => !b)}
						className={`transition-colors ${bookmarked ? "text-text-brand" : "text-text-muted hover:text-text-primary"}`}
					>
						<Icon as={BookmarkSvg} size="sm" color={bookmarked ? "brand" : "muted"} />
					</button>
					{/* TODO: Wire to native share or copy-link */}
					<button type="button" className="text-text-muted hover:text-text-primary transition-colors">
						<Icon as={ShareSvg} size="sm" color="muted" />
					</button>
				</div>
			</div>
		</div>
	)
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FeedTabContent() {
	return (
		<div className="flex flex-col gap-4">
			<CreatePostCard />
			{/* TODO: Replace with paginated API call — GET /api/communities/[id]/feed/posts?page=1 */}
			{MOCK_FEED_POSTS.map(post => (
				<PostCard key={post.id} post={post} />
			))}
		</div>
	)
}
