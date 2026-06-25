"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import GalleryWideSvg from "@/icons/outlined/gallery-wide.svg"
import Chart2Svg from "@/icons/outlined/chart-2.svg"
import UsersGroup2Svg from "@/icons/outlined/users-group-2.svg"
import DotsSvg from "@/icons/outlined/dots.svg"
import PlaneSvg from "@/icons/outlined/plane.svg"
import SmileCircleSvg from "@/icons/outlined/smile-circle.svg"
import ChatDotsSvg from "@/icons/outlined/chat-dots.svg"
import BookmarkSvg from "@/icons/outlined/bookmark.svg"
import BookmarkFilledSvg from "@/icons/filled/bookmark.svg"
import HeartSvg from "@/icons/outlined/heart.svg"
import HeartFilledSvg from "@/icons/filled/heart.svg"
import PinSvg from "@/icons/outlined/pin.svg"
import PinFilledSvg from "@/icons/filled/pin.svg"
import CloseSvg from "@/icons/outlined/close.svg"
import TrashBinSvg from "@/icons/outlined/trash-bin.svg"
import PenSvg from "@/icons/outlined/pen.svg"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { PostDetailModal } from "./PostDetailModal"
import { EditPostModal } from "./EditPostModal"
import {
	getCommunityFeedPosts,
	createCommunityFeedPost,
	getUploadUrl,
	bookmarkFeedPost,
	unbookmarkFeedPost,
	addFeedPostReaction,
	removeFeedPostReaction,
	pinFeedPost,
	unpinFeedPost,
	viewFeedPost,
	voteFeedPoll,
	getFeedPostComments,
	addFeedPostComment,
	deleteFeedPostComment,
} from "@/lib/api"
import type { FeedPost, FeedComment, CommunityRole } from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import { useAttendeeProfileStore } from "@/store/attendeeProfileStore"
import { avatarColor } from "@/lib/avatarColor"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime()
	const m = Math.floor(diff / 60000)
	if (m < 1) return "just now"
	if (m < 60) return `${m}m ago`
	const h = Math.floor(m / 60)
	if (h < 24) return `${h}h ago`
	return `${Math.floor(h / 24)}d ago`
}

const CATEGORY_LABELS: Record<string, string> = {
	MEMORIES: "Memories",
	RECOMMENDATION: "Recommendation",
	QUESTION: "Question",
	POLL: "Poll",
}

// ─── Create Post Card ─────────────────────────────────────────────────────────

const EMOJI_TRAY = [
	"😀",
	"😂",
	"🥹",
	"😍",
	"🤩",
	"😎",
	"🥳",
	"😅",
	"🙌",
	"👍",
	"❤️",
	"🔥",
	"✨",
	"🎉",
	"😮",
	"😢",
]
const MAX_IMAGES = 5
const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp"

const POST_ACTIONS = [
	{
		icon: GalleryWideSvg,
		label: "Photo / Video",
		iconBg: "bg-green-100",
		iconColor: "success" as const,
		key: "photo",
	},
	{
		icon: Chart2Svg,
		label: "Poll",
		iconBg: "bg-orange-100",
		iconColor: "secondary" as const,
		iconClass: "text-orange-500",
		key: "poll",
	},
	{
		icon: UsersGroup2Svg,
		label: "Event Buddy",
		iconBg: "bg-purple-100",
		iconColor: "vibe" as const,
		key: "buddy",
	},
	{
		icon: DotsSvg,
		label: "More",
		iconBg: "bg-surface-hover",
		iconColor: "secondary" as const,
		key: "more",
	},
]

async function uploadImageToS3(file: File, communityId: string): Promise<string> {
	const contentType = file.type || "image/jpeg"
	const { url, key } = await getUploadUrl({
		context: "COMMUNITY_FEED_MEDIA",
		contentType,
		resourceId: communityId,
	})
	const res = await fetch(url, {
		method: "PUT",
		body: file,
		headers: { "Content-Type": contentType },
	})
	if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
	return key
}

function CreatePostCard({
	communityId,
	onPosted,
}: {
	communityId: string
	onPosted: (post: FeedPost) => void
}) {
	const user = useAuthStore(s => s.user)
	const profile = useAttendeeProfileStore(s => s.profile)

	const photoURL = profile?.avatarUrl ?? user?.photoURL ?? null
	const firstName = profile?.firstName ?? user?.displayName?.split(" ")[0] ?? ""
	const lastName = profile?.lastName ?? user?.displayName?.split(" ")[1] ?? ""
	const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "?"
	const color = avatarColor(firstName || "?")

	const [content, setContent] = useState("")
	const [imageFiles, setImageFiles] = useState<File[]>([])
	const [imagePreviews, setImagePreviews] = useState<string[]>([])
	const [emojiTrayOpen, setEmojiTrayOpen] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const emojiRef = useRef<HTMLDivElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	// Close emoji tray on outside click
	useEffect(() => {
		if (!emojiTrayOpen) return
		const handle = (e: MouseEvent) => {
			if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setEmojiTrayOpen(false)
		}
		document.addEventListener("mousedown", handle)
		return () => document.removeEventListener("mousedown", handle)
	}, [emojiTrayOpen])

	// Revoke preview URLs on unmount / change
	useEffect(() => {
		return () => imagePreviews.forEach(url => URL.revokeObjectURL(url))
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [imageFiles])

	const handleEmojiPick = (emoji: string) => {
		const ta = textareaRef.current
		if (ta) {
			const start = ta.selectionStart ?? content.length
			const end = ta.selectionEnd ?? content.length
			const next = content.slice(0, start) + emoji + content.slice(end)
			setContent(next)
			requestAnimationFrame(() => {
				ta.focus()
				ta.setSelectionRange(start + emoji.length, start + emoji.length)
			})
		} else {
			setContent(c => c + emoji)
		}
		setEmojiTrayOpen(false)
	}

	const handleFiles = (files: FileList | null) => {
		if (!files) return
		const remaining = MAX_IMAGES - imageFiles.length
		const toAdd = Array.from(files)
			.filter(f => f.type.startsWith("image/"))
			.slice(0, remaining)
		setImageFiles(prev => [...prev, ...toAdd])
		setImagePreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))])
	}

	const removeImage = (index: number) => {
		URL.revokeObjectURL(imagePreviews[index])
		setImageFiles(prev => prev.filter((_, i) => i !== index))
		setImagePreviews(prev => prev.filter((_, i) => i !== index))
	}

	const canSubmit = (content.trim().length > 0 || imageFiles.length > 0) && !isSubmitting

	const handleSubmit = async () => {
		if (!canSubmit) return
		setIsSubmitting(true)
		try {
			let mediaKeys: string[] = []
			if (imageFiles.length > 0) {
				mediaKeys = await Promise.all(imageFiles.map(f => uploadImageToS3(f, communityId)))
			}
			const post = await createCommunityFeedPost(communityId, {
				postType: imageFiles.length > 0 ? "PHOTO" : "TEXT",
				category: "GENERAL",
				content: content.trim() || undefined,
				mediaKeys: mediaKeys.length > 0 ? mediaKeys : undefined,
			})
			toast.success("Post shared!")
			setContent("")
			setImageFiles([])
			setImagePreviews([])
			onPosted(post)
		} catch {
			toast.error("Failed to post. Please try again.")
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className="rounded-panel bg-surface-card border border-border-default p-4 flex flex-col gap-3">
			{/* Input row */}
			<div className="flex items-start gap-3">
				{/* Avatar */}
				{photoURL ? (
					<div className="relative size-10 rounded-full overflow-hidden shrink-0 border border-border-default bg-surface-hover mt-0.5">
						<Image src={photoURL} alt="You" fill sizes="40px" className="object-cover" />
					</div>
				) : (
					<div
						className={`size-10 rounded-full ${color.bg} border ${color.border} flex items-center justify-center shrink-0 mt-0.5`}
					>
						<span className={`text-label-xs font-bold ${color.text}`}>{initials}</span>
					</div>
				)}

				{/* Textarea + emoji tray */}
				<div className="relative flex-1">
					{emojiTrayOpen && (
						<div
							ref={emojiRef}
							className="absolute bottom-full mb-2 right-0 z-20 flex flex-wrap gap-1 p-2 w-64 bg-surface-card border border-border-default rounded-action shadow-lg"
						>
							{EMOJI_TRAY.map(emoji => (
								<button
									key={emoji}
									type="button"
									onMouseDown={e => {
										e.preventDefault()
										handleEmojiPick(emoji)
									}}
									className="text-xl leading-none p-1.5 rounded hover:bg-surface-hover transition-colors"
								>
									{emoji}
								</button>
							))}
						</div>
					)}

					<div className="flex items-end gap-2 px-4 py-2.5 rounded-2xl bg-surface-page border border-border-default transition-all">
						<textarea
							ref={textareaRef}
							rows={2}
							value={content}
							onChange={e => setContent(e.target.value)}
							placeholder="What's on your mind?"
							className="flex-1 resize-none bg-transparent text-label-sm text-text-primary placeholder:text-text-muted outline-none leading-relaxed"
						/>
						<button
							type="button"
							onClick={() => setEmojiTrayOpen(v => !v)}
							className={`shrink-0 mb-0.5 transition-colors ${emojiTrayOpen ? "text-violet-600" : "text-text-muted hover:text-text-primary"}`}
							title="Add emoji"
						>
							<Icon as={SmileCircleSvg} size="sm" color={emojiTrayOpen ? "vibe" : "muted"} />
						</button>
					</div>
				</div>
			</div>

			{/* Image previews */}
			{imagePreviews.length > 0 && (
				<div className="grid grid-cols-4 gap-2 ml-13">
					{imagePreviews.map((src, i) => (
						<div
							key={i}
							className="relative aspect-square rounded-action overflow-hidden bg-surface-hover group"
						>
							<Image src={src} alt="" fill sizes="120px" className="object-cover" />
							<button
								type="button"
								onClick={() => removeImage(i)}
								className="absolute top-1 right-1 size-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
							>
								<Icon as={CloseSvg} size="xs" color="inverse" />
							</button>
						</div>
					))}
				</div>
			)}

			{/* Actions row */}
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2 flex-wrap">
					{POST_ACTIONS.map(action => (
						<button
							key={action.key}
							type="button"
							onClick={action.key === "photo" ? () => fileInputRef.current?.click() : undefined}
							disabled={action.key === "photo" && imageFiles.length >= MAX_IMAGES}
							className="flex items-center gap-2 px-3 py-2 rounded-action border border-border-default bg-surface-page hover:bg-surface-hover transition-colors text-label-sm text-text-primary font-medium disabled:opacity-40 disabled:cursor-not-allowed"
						>
							<div
								className={`size-6 rounded-action ${action.iconBg} flex items-center justify-center shrink-0`}
							>
								<Icon
									as={action.icon}
									size="xs"
									color={action.iconColor}
									className={action.iconClass}
								/>
							</div>
							{action.label}
						</button>
					))}
					<input
						ref={fileInputRef}
						type="file"
						accept={ACCEPTED_IMAGE_TYPES}
						multiple
						className="hidden"
						onChange={e => handleFiles(e.target.files)}
					/>
				</div>
				<Button
					variant="primary"
					size="sm"
					radius="pill"
					disabled={!canSubmit}
					onClick={handleSubmit}
					leftIcon={<Icon as={PlaneSvg} size="xs" color={!canSubmit ? "secondary" : "inverse"} />}
				>
					{isSubmitting ? "Posting…" : "Post"}
				</Button>
			</div>
		</div>
	)
}

// ─── Post Card ────────────────────────────────────────────────────────────────

const PHOTO_OVERFLOW_AFTER = 4

function PostPhotoGrid({ urls }: { urls: string[] }) {
	if (urls.length === 0) return null

	if (urls.length === 1) {
		return (
			<div className="mt-2">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={urls[0]}
					alt=""
					className="max-h-52 w-auto max-w-full object-contain rounded-action"
				/>
			</div>
		)
	}

	const visible = urls.slice(0, PHOTO_OVERFLOW_AFTER + 1)
	const overflow = urls.length - PHOTO_OVERFLOW_AFTER

	return (
		<div className="flex flex-col gap-1 rounded-action overflow-hidden mt-2">
			<div className="flex gap-1 h-36">
				{visible.slice(0, 2).map((src, i) => (
					<div key={i} className="relative flex-1 bg-surface-hover">
						<Image src={src} alt="" fill sizes="300px" className="object-cover" />
					</div>
				))}
			</div>
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

const REACTION_EMOJI = "❤️"

const MOD_ROLES: CommunityRole[] = ["OWNER", "MANAGER", "HOST", "MODERATOR"]

function PostCard({
	post: initialPost,
	communityId,
	currentUserRole,
	onOpenDetail,
}: {
	post: FeedPost
	communityId: string
	currentUserRole: CommunityRole | null
	onOpenDetail: () => void
}) {
	const [post, setPost] = useState(initialPost)
	const [reacted, setReacted] = useState(post.reactedByMe)
	const [bookmarked, setBookmarked] = useState(post.bookmarkedByMe)
	const [pinned, setPinned] = useState(post.isPinned)
	const [myVote, setMyVote] = useState<string | null>(post.poll?.myVote ?? null)
	const [pollOptions, setPollOptions] = useState(post.poll?.options ?? [])
	const [totalVotes, setTotalVotes] = useState(post.poll?.totalVotes ?? 0)
	const [commentCount, setCommentCount] = useState(post.counts.comments)
	const [commentsOpen, setCommentsOpen] = useState(false)
	const [comments, setComments] = useState<FeedComment[]>([])
	const [commentsNextCursor, setCommentsNextCursor] = useState<string | null>(null)
	const [commentsLoading, setCommentsLoading] = useState(false)
	const [commentText, setCommentText] = useState("")
	const [submittingComment, setSubmittingComment] = useState(false)
	const [deleteTargetCommentId, setDeleteTargetCommentId] = useState<string | null>(null)
	const [editOpen, setEditOpen] = useState(false)
	const commentInputRef = useRef<HTMLInputElement>(null)
	const profileId = useAttendeeProfileStore(s => s.profile?.id ?? null)
	const profile = useAttendeeProfileStore(s => s.profile)
	const isAuthor = profileId !== null && profileId === post.author.id
	const reactionCount = post.counts.reactions + (reacted !== post.reactedByMe ? (reacted ? 1 : -1) : 0)
	const isMod = currentUserRole !== null && MOD_ROLES.includes(currentUserRole)

	const loadComments = useCallback(
		async (cursor?: string) => {
			setCommentsLoading(true)
			try {
				const res = await getFeedPostComments(communityId, post.id, { cursor, limit: 20 })
				setComments(prev => (cursor ? [...prev, ...res.comments] : res.comments))
				setCommentsNextCursor(res.nextCursor)
			} catch {
				toast.error("Failed to load comments.")
			} finally {
				setCommentsLoading(false)
			}
		},
		[communityId, post.id],
	)

	const handleToggleComments = () => {
		const next = !commentsOpen
		setCommentsOpen(next)
		if (next && comments.length === 0) loadComments()
		if (next) setTimeout(() => commentInputRef.current?.focus(), 100)
	}

	const handleAddComment = async () => {
		const content = commentText.trim()
		if (!content || submittingComment) return
		setSubmittingComment(true)
		try {
			const created = await addFeedPostComment(communityId, post.id, content)
			setComments(prev => [created, ...prev])
			setCommentCount(c => c + 1)
			setCommentText("")
		} catch {
			toast.error("Failed to post comment.")
		} finally {
			setSubmittingComment(false)
		}
	}

	const handleDeleteComment = async (commentId: string) => {
		setComments(prev => prev.filter(c => c.id !== commentId))
		setCommentCount(c => c - 1)
		try {
			await deleteFeedPostComment(communityId, post.id, commentId)
		} catch {
			toast.error("Failed to delete comment.")
			// Reload to restore correct state
			loadComments()
		}
	}

	// Fire view once when post enters viewport
	const cardRef = useRef<HTMLDivElement>(null)
	const viewFired = useRef(false)
	useEffect(() => {
		const el = cardRef.current
		if (!el) return
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting && !viewFired.current) {
					viewFired.current = true
					viewFeedPost(communityId, post.id).catch(() => {})
					observer.disconnect()
				}
			},
			{ threshold: 0.5 },
		)
		observer.observe(el)
		return () => observer.disconnect()
	}, [communityId, post.id])

	const handlePollVote = async (optionId: string) => {
		if (myVote === optionId) return
		const prevVote = myVote
		const prevOptions = pollOptions
		const prevTotal = totalVotes
		// Optimistic update
		setMyVote(optionId)
		setPollOptions(opts =>
			opts.map(o => ({
				...o,
				voteCount:
					o.id === optionId ? o.voteCount + 1 : o.id === prevVote ? o.voteCount - 1 : o.voteCount,
			})),
		)
		setTotalVotes(v => (prevVote ? v : v + 1))
		try {
			await voteFeedPoll(communityId, post.id, optionId)
		} catch {
			setMyVote(prevVote)
			setPollOptions(prevOptions)
			setTotalVotes(prevTotal)
			toast.error("Failed to record vote. Please try again.")
		}
	}

	// Debounced pin — same pattern as bookmark
	const pinTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const committedPin = useRef(post.isPinned)

	const handlePin = () => {
		const next = !pinned
		setPinned(next)
		if (pinTimer.current) clearTimeout(pinTimer.current)
		pinTimer.current = setTimeout(async () => {
			if (next === committedPin.current) return
			try {
				if (next) {
					await pinFeedPost(communityId, post.id)
					toast.success("Post pinned")
				} else {
					await unpinFeedPost(communityId, post.id)
					toast.success("Post unpinned")
				}
				committedPin.current = next
			} catch {
				setPinned(committedPin.current)
				toast.error("Failed to update pin. Please try again.")
			}
		}, 500)
	}

	// Debounced reaction — same pattern as bookmark
	const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const committedReaction = useRef(post.reactedByMe)

	const handleReaction = () => {
		const next = !reacted
		setReacted(next)
		if (reactionTimer.current) clearTimeout(reactionTimer.current)
		reactionTimer.current = setTimeout(async () => {
			if (next === committedReaction.current) return
			try {
				if (next) {
					await addFeedPostReaction(communityId, post.id, REACTION_EMOJI)
				} else {
					await removeFeedPostReaction(communityId, post.id, REACTION_EMOJI)
				}
				committedReaction.current = next
			} catch {
				setReacted(committedReaction.current)
				toast.error("Failed to update reaction. Please try again.")
			}
		}, 500)
	}

	// Debounced bookmark — optimistic UI, single API call after 500ms of inactivity
	const bookmarkTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const committedBookmark = useRef(post.bookmarkedByMe)

	const handleBookmark = () => {
		const next = !bookmarked
		setBookmarked(next)
		if (bookmarkTimer.current) clearTimeout(bookmarkTimer.current)
		bookmarkTimer.current = setTimeout(async () => {
			if (next === committedBookmark.current) return
			try {
				if (next) {
					await bookmarkFeedPost(communityId, post.id)
					toast.success("Post saved to bookmarks")
				} else {
					await unbookmarkFeedPost(communityId, post.id)
					toast.success("Removed from bookmarks")
				}
				committedBookmark.current = next
				window.dispatchEvent(new CustomEvent("feed:bookmark-changed", { detail: { communityId } }))
			} catch {
				setBookmarked(committedBookmark.current)
				toast.error("Failed to update bookmark. Please try again.")
			}
		}, 500)
	}

	return (
		<>
		<div
			ref={cardRef}
			className="rounded-panel bg-surface-card border border-border-default p-4 flex flex-col gap-3"
		>
			{/* Clickable post body */}
			<div className="flex flex-col gap-3 cursor-pointer" onClick={onOpenDetail}>

			{/* Header */}
			<div className="flex items-start justify-between gap-3">
				<div className="flex items-center gap-2.5">
					{(() => {
						const authorInitials = post.author.name
							.split(" ")
							.map(n => n[0])
							.slice(0, 2)
							.join("")
							.toUpperCase()
						const authorColor = avatarColor(post.author.name)
						return post.author.avatarUrl ? (
							<div className="relative size-10 rounded-full overflow-hidden shrink-0 border border-border-default bg-surface-hover">
								<Image
									src={post.author.avatarUrl}
									alt={post.author.name}
									fill
									sizes="40px"
									className="object-cover"
								/>
							</div>
						) : (
							<div
								className={`size-10 rounded-full ${authorColor.bg} border ${authorColor.border} flex items-center justify-center shrink-0`}
							>
								<span className={`text-label-xs font-bold ${authorColor.text}`}>
									{authorInitials}
								</span>
							</div>
						)
					})()}
					<div>
						<div className="flex items-center gap-1.5">
							<span className="text-label-sm font-bold text-text-primary">
								{post.author.name}
							</span>
							{post.author.badge && (
								<span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-avatar px-1.5 py-0.5">
									{post.author.badge.replace(/_/g, " ")}
								</span>
							)}
						</div>
						<div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
							<span className="text-[11px] text-text-muted">{timeAgo(post.createdAt)}</span>
							{pinned && (
								<span className="flex items-center gap-1 text-[10px] font-semibold text-text-brand bg-surface-brand-soft border border-border-focus rounded-avatar px-1.5 py-0.5">
									<Icon as={PinFilledSvg} size="xs" color="brand" />
									Pinned
								</span>
							)}
							{post.category !== "GENERAL" && CATEGORY_LABELS[post.category] && (
								<span className="text-[10px] font-semibold bg-surface-vibe-soft text-violet-600 border border-purple-200 rounded-avatar px-2 py-0.5">
									{CATEGORY_LABELS[post.category]}
								</span>
							)}
							{post.topic && (
								<span className="text-[10px] font-semibold bg-surface-hover text-text-secondary border border-border-default rounded-avatar px-2 py-0.5">
									{post.topic}
								</span>
							)}
							{post.event && (
								<span className="text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 rounded-avatar px-2 py-0.5">
									🎟 {post.event.title}
								</span>
							)}
						</div>
					</div>
				</div>
				{isAuthor && (
					<button
						type="button"
						onClick={e => { e.stopPropagation(); setEditOpen(true) }}
						className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors shrink-0"
						title="Edit post"
					>
						<Icon as={PenSvg} size="sm" color="inherit" />
					</button>
				)}
			</div>

			{/* Content */}
			{post.content && (
				<p className="text-label-sm text-text-primary font-normal leading-relaxed">{post.content}</p>
			)}

			{/* Poll */}
			{post.poll && (
				<div className="flex flex-col gap-2">
					{pollOptions.map(opt => {
						const pct = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0
						const isVoted = myVote === opt.id
						return (
							<button
								key={opt.id}
								type="button"
								onClick={e => { e.stopPropagation(); handlePollVote(opt.id) }}
								className={`relative flex items-center gap-3 px-3 py-2 rounded-action border overflow-hidden bg-surface-page text-left transition-colors hover:border-border-focus ${isVoted ? "border-border-focus" : "border-border-default"}`}
							>
								<div
									className="absolute inset-y-0 left-0 bg-surface-brand-soft transition-all duration-300"
									style={{ width: `${pct}%` }}
								/>
								<span
									className={`relative text-label-sm font-medium flex-1 ${isVoted ? "text-text-brand font-bold" : "text-text-primary"}`}
								>
									{opt.text}
								</span>
								<span
									className={`relative text-[11px] font-medium shrink-0 ${isVoted ? "text-text-brand font-bold" : "text-text-primary"}`}
								>
									{pct}%
								</span>
							</button>
						)
					})}
					<span className="text-[11px] text-text-muted">{totalVotes} votes</span>
				</div>
			)}

			{/* Photos */}
			<PostPhotoGrid urls={post.mediaUrls} />

			</div>{/* end clickable body */}

			{/* Actions */}
			<div className="flex items-center justify-between gap-3 pt-2">
				<div className="flex items-center gap-4">
					<button
						type="button"
						onClick={handleReaction}
						className={`flex items-center gap-1.5 text-label-sm font-medium transition-colors ${reacted ? "text-red-500" : "text-text-secondary hover:text-text-brand"}`}
					>
						<Icon as={reacted ? HeartFilledSvg : HeartSvg} size="sm" color="inherit" />
						{reactionCount}
					</button>
					<button
						type="button"
						onClick={handleToggleComments}
						className={`flex items-center gap-1.5 text-label-sm font-medium transition-colors ${commentsOpen ? "text-text-brand" : "text-text-secondary hover:text-text-brand"}`}
					>
						<Icon as={ChatDotsSvg} size="sm" color="inherit" />
						{commentCount}
					</button>
				</div>

				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={handleBookmark}
						className={`transition-colors ${bookmarked ? "text-text-brand" : "text-text-muted hover:text-text-brand"}`}
					>
						<Icon as={bookmarked ? BookmarkFilledSvg : BookmarkSvg} size="sm" color="inherit" />
					</button>
					{isMod && (
						<button
							type="button"
							onClick={handlePin}
							title={pinned ? "Unpin post" : "Pin post"}
							className={`transition-colors ${pinned ? "text-text-brand" : "text-text-muted hover:text-text-brand"}`}
						>
							<Icon as={pinned ? PinFilledSvg : PinSvg} size="sm" color="inherit" />
						</button>
					)}
				</div>
			</div>
			{/* Comments panel */}
			{commentsOpen && (
				<div className="border-t border-border-default pt-3 flex flex-col gap-3">
					{/* Input */}
					<div className="flex items-center gap-2">
						{profile?.avatarUrl ? (
							<div className="relative size-7 rounded-full overflow-hidden shrink-0 border border-border-default bg-surface-hover">
								<Image
									src={profile.avatarUrl}
									alt=""
									fill
									sizes="28px"
									className="object-cover"
								/>
							</div>
						) : (
							<div
								className={`size-7 rounded-full ${avatarColor(profile?.firstName ?? "?").bg} border ${avatarColor(profile?.firstName ?? "?").border} flex items-center justify-center shrink-0`}
							>
								<span
									className={`text-[9px] font-bold ${avatarColor(profile?.firstName ?? "?").text}`}
								>
									{(profile?.firstName?.[0] ?? "").toUpperCase()}
									{(profile?.lastName?.[0] ?? "").toUpperCase()}
								</span>
							</div>
						)}
						<div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-page border border-border-default focus-within:border-border-focus transition-colors">
							<input
								ref={commentInputRef}
								type="text"
								value={commentText}
								onChange={e => setCommentText(e.target.value)}
								onKeyDown={e => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault()
										handleAddComment()
									}
								}}
								placeholder="Write a comment…"
								className="flex-1 text-label-sm text-text-primary placeholder:text-text-muted bg-transparent outline-none"
							/>
							<button
								type="button"
								onClick={handleAddComment}
								disabled={!commentText.trim() || submittingComment}
								className="size-6 rounded-full bg-action-primary flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-action-primary-hover transition-colors"
							>
								<Icon as={PlaneSvg} size="xs" color="inverse" />
							</button>
						</div>
					</div>

					{/* List */}
					{commentsLoading && comments.length === 0 ? (
						<div className="flex flex-col gap-2.5">
							{[1, 2].map(i => (
								<div key={i} className="flex gap-2 animate-pulse">
									<div className="size-7 rounded-full bg-surface-hover shrink-0" />
									<div className="flex-1 flex flex-col gap-1.5">
										<div className="h-2.5 w-24 bg-surface-hover rounded" />
										<div className="h-3 w-3/4 bg-surface-hover rounded" />
									</div>
								</div>
							))}
						</div>
					) : comments.length === 0 ? (
						<p className="text-label-sm text-text-muted text-center py-2">
							No comments yet. Be the first!
						</p>
					) : (
						<div className="flex flex-col gap-2.5">
							{comments.map(comment => {
								const isOwn = comment.author.id === profileId
								const canDelete = isOwn || isMod
								const initials = comment.author.name
									.split(" ")
									.map(n => n[0])
									.slice(0, 2)
									.join("")
									.toUpperCase()
								const color = avatarColor(comment.author.name)
								return (
									<div key={comment.id} className="flex items-start gap-2 group">
										{comment.author.avatarUrl ? (
											<div className="relative size-7 rounded-full overflow-hidden shrink-0 border border-border-default bg-surface-hover">
												<Image
													src={comment.author.avatarUrl}
													alt={comment.author.name}
													fill
													sizes="28px"
													className="object-cover"
												/>
											</div>
										) : (
											<div
												className={`size-7 rounded-full ${color.bg} border ${color.border} flex items-center justify-center shrink-0`}
											>
												<span className={`text-[9px] font-bold ${color.text}`}>
													{initials}
												</span>
											</div>
										)}
										<div className="flex-1 min-w-0">
											<div className="inline-block bg-surface-hover rounded-2xl rounded-tl-sm px-1 max-w-full">
												<div className="flex items-start gap-1.5">
													<p className="text-[11px] font-semibold text-text-primary">
														{comment.author.name}
													</p>
													<p className="text-[10px] text-text-muted ml-1">
														{timeAgo(comment.createdAt)}
													</p>
												</div>
												<p className="text-label-sm font-normal text-text-primary leading-snug wrap-break-word">
													{comment.content}
												</p>
											</div>
										</div>
										{canDelete && (
											<button
												type="button"
												onClick={() => setDeleteTargetCommentId(comment.id)}
												className="opacity-0 group-hover:opacity-100 p-1 rounded text-text-muted hover:text-red-500 transition-all shrink-0 mt-1"
												title="Delete comment"
											>
												<Icon as={TrashBinSvg} size="xs" color="inherit" />
											</button>
										)}
									</div>
								)
							})}
							{commentsNextCursor && (
								<button
									type="button"
									onClick={() => loadComments(commentsNextCursor)}
									disabled={commentsLoading}
									className="text-label-sm text-text-brand hover:underline disabled:opacity-50 text-center"
								>
									{commentsLoading ? "Loading…" : "Load more comments"}
								</button>
							)}
						</div>
					)}
				</div>
			)}
		</div>

		<ConfirmDialog
			open={deleteTargetCommentId !== null}
			title="Delete comment?"
			description="This will permanently remove your comment."
			confirmLabel="Delete"
			destructive
			onClose={() => setDeleteTargetCommentId(null)}
			onConfirm={async () => {
				if (deleteTargetCommentId) await handleDeleteComment(deleteTargetCommentId)
				setDeleteTargetCommentId(null)
			}}
		/>

		{editOpen && (
			<EditPostModal
				post={post}
				communityId={communityId}
				onClose={() => setEditOpen(false)}
				onSaved={updated => setPost(updated)}
			/>
		)}
		</>
	)
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PostSkeleton() {
	return (
		<div className="rounded-panel bg-surface-card border border-border-default p-4 flex flex-col gap-3 animate-pulse">
			<div className="flex items-center gap-2.5">
				<div className="size-10 rounded-full bg-surface-hover shrink-0" />
				<div className="flex flex-col gap-1.5 flex-1">
					<div className="h-3 w-28 bg-surface-hover rounded" />
					<div className="h-2.5 w-16 bg-surface-hover rounded" />
				</div>
			</div>
			<div className="flex flex-col gap-1.5">
				<div className="h-3 w-full bg-surface-hover rounded" />
				<div className="h-3 w-4/5 bg-surface-hover rounded" />
			</div>
		</div>
	)
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FeedTabContent({
	communityId,
	currentUserRole,
}: {
	communityId: string
	currentUserRole?: CommunityRole | null
}) {
	const [posts, setPosts] = useState<FeedPost[]>([])
	const [nextCursor, setNextCursor] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)
	const [loadingMore, setLoadingMore] = useState(false)
	const [detailPostId, setDetailPostId] = useState<string | null>(null)

	const loadPosts = useCallback(
		async (cursor?: string) => {
			try {
				const res = await getCommunityFeedPosts(communityId, { cursor, limit: 20 })
				if (cursor) {
					setPosts(prev => [...prev, ...res.items])
				} else {
					setPosts(res.items)
				}
				setNextCursor(res.nextCursor)
			} catch {
				toast.error("Failed to load feed.")
			}
		},
		[communityId],
	)

	useEffect(() => {
		let cancelled = false
		async function run() {
			setLoading(true)
			await loadPosts()
			if (!cancelled) setLoading(false)
		}
		run()
		return () => { cancelled = true }
	}, [loadPosts])

	const handleLoadMore = async () => {
		if (!nextCursor || loadingMore) return
		setLoadingMore(true)
		await loadPosts(nextCursor)
		setLoadingMore(false)
	}

	const handlePosted = (post: FeedPost) => {
		setPosts(prev => [post, ...prev])
	}

	return (
		<div className="flex flex-col gap-4">
			<CreatePostCard communityId={communityId} onPosted={handlePosted} />

			{loading ? (
				<>
					<PostSkeleton />
					<PostSkeleton />
				</>
			) : posts.length === 0 ? (
				<div className="rounded-panel bg-surface-card border border-border-default p-10 flex flex-col items-center gap-2 text-center">
					<p className="text-body-md font-semibold text-text-primary">No posts yet</p>
					<p className="text-label-sm text-text-muted font-normal">
						Be the first to share something with the community!
					</p>
				</div>
			) : (
				<>
					{posts.map(post => (
						<PostCard
							key={post.id}
							post={post}
							communityId={communityId}
							currentUserRole={currentUserRole ?? null}
							onOpenDetail={() => setDetailPostId(post.id)}
						/>
					))}
					{nextCursor && (
						<Button
							variant="secondary"
							size="md"
							radius="pill"
							className="self-center"
							onClick={handleLoadMore}
							disabled={loadingMore}
						>
							{loadingMore ? "Loading…" : "Load more"}
						</Button>
					)}
				</>
			)}

			{detailPostId && (
				<PostDetailModal
					postId={detailPostId}
					communityId={communityId}
					currentUserRole={currentUserRole ?? null}
					onClose={() => setDetailPostId(null)}
				/>
			)}
		</div>
	)
}
