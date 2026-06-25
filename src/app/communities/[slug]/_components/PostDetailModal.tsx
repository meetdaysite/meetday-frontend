"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { Icon } from "@/components/ui/Icon"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import CloseSvg from "@/icons/outlined/close.svg"
import PlaneSvg from "@/icons/outlined/plane.svg"
import ChatDotsSvg from "@/icons/outlined/chat-dots.svg"
import HeartSvg from "@/icons/outlined/heart.svg"
import HeartFilledSvg from "@/icons/filled/heart.svg"
import BookmarkSvg from "@/icons/outlined/bookmark.svg"
import BookmarkFilledSvg from "@/icons/filled/bookmark.svg"
import PinSvg from "@/icons/outlined/pin.svg"
import PinFilledSvg from "@/icons/filled/pin.svg"
import TrashBinSvg from "@/icons/outlined/trash-bin.svg"
import {
	getCommunityFeedPost,
	addFeedPostReaction,
	removeFeedPostReaction,
	bookmarkFeedPost,
	unbookmarkFeedPost,
	pinFeedPost,
	unpinFeedPost,
	voteFeedPoll,
	viewFeedPost,
	getFeedPostComments,
	addFeedPostComment,
	deleteFeedPostComment,
} from "@/lib/api"
import type { FeedPost, FeedComment, CommunityRole } from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"
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

const MOD_ROLES: CommunityRole[] = ["OWNER", "MANAGER", "HOST", "MODERATOR"]
const REACTION_EMOJI = "❤️"

// ─── Props ────────────────────────────────────────────────────────────────────

interface PostDetailModalProps {
	postId: string
	communityId: string
	currentUserRole: CommunityRole | null
	onClose: () => void
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ModalSkeleton() {
	return (
		<div className="flex flex-col gap-4 animate-pulse">
			<div className="flex items-center gap-3">
				<div className="size-10 rounded-full bg-surface-hover shrink-0" />
				<div className="flex flex-col gap-1.5 flex-1">
					<div className="h-3 w-32 bg-surface-hover rounded" />
					<div className="h-2.5 w-20 bg-surface-hover rounded" />
				</div>
			</div>
			<div className="flex flex-col gap-2">
				<div className="h-3 w-full bg-surface-hover rounded" />
				<div className="h-3 w-4/5 bg-surface-hover rounded" />
				<div className="h-3 w-2/3 bg-surface-hover rounded" />
			</div>
			<div className="h-48 w-full bg-surface-hover rounded-action" />
		</div>
	)
}

// ─── Post Detail Modal ─────────────────────────────────────────────────────────

export function PostDetailModal({ postId, communityId, currentUserRole, onClose }: PostDetailModalProps) {
	const [post, setPost] = useState<FeedPost | null>(null)
	const [loading, setLoading] = useState(true)

	// Interaction state (initialised from fetched post)
	const [reacted, setReacted] = useState(false)
	const [bookmarked, setBookmarked] = useState(false)
	const [pinned, setPinned] = useState(false)
	const [myVote, setMyVote] = useState<string | null>(null)
	const [pollOptions, setPollOptions] = useState<
		FeedPost["poll"] extends null ? never : NonNullable<FeedPost["poll"]>["options"]
	>([])
	const [totalVotes, setTotalVotes] = useState(0)
	const [reactionCount, setReactionCount] = useState(0)
	const [commentCount, setCommentCount] = useState(0)

	// Comments
	const [comments, setComments] = useState<FeedComment[]>([])
	const [commentsNextCursor, setCommentsNextCursor] = useState<string | null>(null)
	const [commentsLoading, setCommentsLoading] = useState(false)
	const [commentText, setCommentText] = useState("")
	const [submittingComment, setSubmittingComment] = useState(false)
	const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
	const commentInputRef = useRef<HTMLInputElement>(null)

	// Debounce refs
	const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const committedReaction = useRef(false)
	const bookmarkTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const committedBookmark = useRef(false)
	const pinTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const committedPin = useRef(false)

	const profileId = useAttendeeProfileStore(s => s.profile?.id ?? null)
	const profile = useAttendeeProfileStore(s => s.profile)
	const isMod = currentUserRole !== null && MOD_ROLES.includes(currentUserRole)

	// Fetch post
	useEffect(() => {
		void Promise.resolve().then(() => setLoading(true))
		getCommunityFeedPost(communityId, postId)
			.then(p => {
				setPost(p)
				setReacted(p.reactedByMe)
				setBookmarked(p.bookmarkedByMe)
				setPinned(p.isPinned)
				setMyVote(p.poll?.myVote ?? null)
				setPollOptions(p.poll?.options ?? [])
				setTotalVotes(p.poll?.totalVotes ?? 0)
				setReactionCount(p.counts.reactions)
				setCommentCount(p.counts.comments)
				committedReaction.current = p.reactedByMe
				committedBookmark.current = p.bookmarkedByMe
				committedPin.current = p.isPinned
			})
			.catch((err) => toast.error(getApiErrorMessage(err)))
			.finally(() => setLoading(false))
	}, [communityId, postId])

	// Track view
	useEffect(() => {
		if (!post) return
		viewFeedPost(communityId, postId).catch(() => {})
	}, [communityId, postId, post])

	// Load comments on mount (once post is ready)
	const loadComments = useCallback(
		async (cursor?: string) => {
			setCommentsLoading(true)
			try {
				const res = await getFeedPostComments(communityId, postId, { cursor, limit: 20 })
				setComments(prev => (cursor ? [...prev, ...res.comments] : res.comments))
				setCommentsNextCursor(res.nextCursor)
			} catch (err) {
				toast.error(getApiErrorMessage(err))
			} finally {
				setCommentsLoading(false)
			}
		},
		[communityId, postId],
	)

	useEffect(() => {
		if (post) void Promise.resolve().then(() => loadComments())
	}, [post, loadComments])

	// Auto-focus input
	useEffect(() => {
		if (!loading) setTimeout(() => commentInputRef.current?.focus(), 150)
	}, [loading])

	// Close on Escape
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose()
		}
		document.addEventListener("keydown", handler)
		return () => document.removeEventListener("keydown", handler)
	}, [onClose])

	// ── Handlers ────────────────────────────────────────────────────────────────

	const handleReaction = () => {
		if (!post) return
		const next = !reacted
		setReacted(next)
		setReactionCount(c => c + (next ? 1 : -1))
		if (reactionTimer.current) clearTimeout(reactionTimer.current)
		reactionTimer.current = setTimeout(async () => {
			try {
				if (next) await addFeedPostReaction(communityId, postId, REACTION_EMOJI)
				else await removeFeedPostReaction(communityId, postId, REACTION_EMOJI)
				committedReaction.current = next
			} catch (err) {
				setReacted(committedReaction.current)
				setReactionCount(c => c + (committedReaction.current ? 1 : -1))
				toast.error(getApiErrorMessage(err))
			}
		}, 500)
	}

	const handleBookmark = () => {
		if (!post) return
		const next = !bookmarked
		setBookmarked(next)
		if (bookmarkTimer.current) clearTimeout(bookmarkTimer.current)
		bookmarkTimer.current = setTimeout(async () => {
			try {
				if (next) await bookmarkFeedPost(communityId, postId)
				else await unbookmarkFeedPost(communityId, postId)
				committedBookmark.current = next
				window.dispatchEvent(new CustomEvent("feed:bookmark-changed", { detail: { communityId } }))
			} catch (err) {
				setBookmarked(committedBookmark.current)
				toast.error(getApiErrorMessage(err))
			}
		}, 500)
	}

	const handlePin = () => {
		if (!post || !isMod) return
		const next = !pinned
		setPinned(next)
		if (pinTimer.current) clearTimeout(pinTimer.current)
		pinTimer.current = setTimeout(async () => {
			try {
				if (next) await pinFeedPost(communityId, postId)
				else await unpinFeedPost(communityId, postId)
				committedPin.current = next
			} catch (err) {
				setPinned(committedPin.current)
				toast.error(getApiErrorMessage(err))
			}
		}, 500)
	}

	const handlePollVote = async (optionId: string) => {
		if (myVote === optionId || !post) return
		const prevVote = myVote
		const prevOptions = pollOptions
		const prevTotal = totalVotes
		setMyVote(optionId)
		setPollOptions(opts =>
			opts.map(o => ({
				...o,
				voteCount:
					o.id === optionId ? o.voteCount + 1 : o.id === prevVote ? o.voteCount - 1 : o.voteCount,
			})),
		)
		if (!prevVote) setTotalVotes(t => t + 1)
		try {
			await voteFeedPoll(communityId, postId, optionId)
		} catch (err) {
			setMyVote(prevVote)
			setPollOptions(prevOptions)
			setTotalVotes(prevTotal)
			toast.error(getApiErrorMessage(err))
		}
	}

	const handleAddComment = async () => {
		const content = commentText.trim()
		if (!content || submittingComment) return
		setSubmittingComment(true)
		try {
			const created = await addFeedPostComment(communityId, postId, content)
			setComments(prev => [created, ...prev])
			setCommentCount(c => c + 1)
			setCommentText("")
		} catch (err) {
			toast.error(getApiErrorMessage(err))
		} finally {
			setSubmittingComment(false)
		}
	}

	const handleDeleteComment = async (commentId: string) => {
		setComments(prev => prev.filter(c => c.id !== commentId))
		setCommentCount(c => c - 1)
		try {
			await deleteFeedPostComment(communityId, postId, commentId)
		} catch (err) {
			toast.error(getApiErrorMessage(err))
			loadComments()
		}
	}

	// ── Render ──────────────────────────────────────────────────────────────────

	const authorInitials =
		post?.author.name
			.split(" ")
			.map(n => n[0])
			.slice(0, 2)
			.join("")
			.toUpperCase() ?? ""
	const authorColor = avatarColor(post?.author.name ?? "")

	return (
		<>
			<div
				className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
				onClick={e => {
					if (e.target === e.currentTarget) onClose()
				}}
			>
				<div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-surface-card rounded-panel border border-border-default shadow-floating overflow-hidden">
					{/* Sticky header */}
					<div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border-default shrink-0">
						{loading || !post ? (
							<div className="flex items-center gap-3 flex-1 animate-pulse">
								<div className="size-10 rounded-full bg-surface-hover shrink-0" />
								<div className="flex flex-col gap-1.5">
									<div className="h-3 w-28 bg-surface-hover rounded" />
									<div className="h-2.5 w-20 bg-surface-hover rounded" />
								</div>
							</div>
						) : (
							<div className="flex items-center gap-3 flex-1 min-w-0">
								{post.author.avatarUrl ? (
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
								)}
								<div className="min-w-0">
									<div className="flex items-center gap-1.5 flex-wrap">
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
										<span className="text-[11px] text-text-muted">
											{timeAgo(post.createdAt)}
										</span>
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
						)}
						<button
							type="button"
							onClick={onClose}
							className="p-1.5 rounded-action text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors shrink-0"
						>
							<Icon as={CloseSvg} size="sm" color="inherit" />
						</button>
					</div>

					{/* Scrollable body */}
					<div className="flex-1 overflow-y-auto no-scrollbar">
						{loading || !post ? (
							<div className="px-5 py-5">
								<ModalSkeleton />
							</div>
						) : (
							<>
								{/* Content + media + poll */}
								<div className="px-5 pt-4 pb-3 flex flex-col gap-3">
									{post.content && (
										<p className="text-label-sm text-text-primary font-normal leading-relaxed">
											{post.content}
										</p>
									)}

									{/* Media */}
									{post.mediaUrls.length === 1 && (
										<div className="rounded-action overflow-hidden">
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img
												src={post.mediaUrls[0]}
												alt=""
												className="max-h-72 w-auto max-w-full object-contain rounded-action"
											/>
										</div>
									)}
									{post.mediaUrls.length > 1 && (
										<div className="flex flex-col gap-1 rounded-action overflow-hidden">
											<div className="flex gap-1 h-40">
												{post.mediaUrls.slice(0, 2).map((src, i) => (
													<div key={i} className="relative flex-1 bg-surface-hover">
														<Image
															src={src}
															alt=""
															fill
															sizes="400px"
															className="object-cover"
														/>
													</div>
												))}
											</div>
											{post.mediaUrls.length > 2 && (
												<div className="flex gap-1 h-28">
													{post.mediaUrls.slice(2, 5).map((src, i, arr) => {
														const isLast = i === arr.length - 1
														const overflow = post.mediaUrls.length - 5
														return (
															<div
																key={i}
																className="relative flex-1 bg-surface-hover"
															>
																<Image
																	src={src}
																	alt=""
																	fill
																	sizes="200px"
																	className="object-cover"
																/>
																{isLast && overflow > 0 && (
																	<div className="absolute inset-0 bg-black/55 flex items-center justify-center">
																		<span className="text-white text-body-md font-bold">
																			+{overflow}
																		</span>
																	</div>
																)}
															</div>
														)
													})}
												</div>
											)}
										</div>
									)}

									{/* Poll */}
									{post.poll && (
										<div className="flex flex-col gap-2">
											{pollOptions.map(opt => {
												const pct =
													totalVotes > 0
														? Math.round((opt.voteCount / totalVotes) * 100)
														: 0
												const isVoted = myVote === opt.id
												return (
													<button
														key={opt.id}
														type="button"
														onClick={() => handlePollVote(opt.id)}
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
											<span className="text-[11px] text-text-muted">
												{totalVotes} votes
											</span>
										</div>
									)}

									{/* Actions */}
									<div className="flex items-center justify-between gap-3 pt-2">
										<div className="flex items-center gap-4">
											<button
												type="button"
												onClick={handleReaction}
												className={`flex items-center gap-1.5 text-label-sm font-medium transition-colors ${reacted ? "text-red-500" : "text-text-secondary hover:text-text-brand"}`}
											>
												<Icon
													as={reacted ? HeartFilledSvg : HeartSvg}
													size="sm"
													color="inherit"
												/>
												{reactionCount}
											</button>
											<span className="flex items-center gap-1.5 text-label-sm font-medium text-text-brand">
												<Icon as={ChatDotsSvg} size="sm" color="brand" />
												{commentCount}
											</span>
										</div>
										<div className="flex items-center gap-3">
											<button
												type="button"
												onClick={handleBookmark}
												className={`transition-colors ${bookmarked ? "text-text-brand" : "text-text-muted hover:text-text-brand"}`}
											>
												<Icon
													as={bookmarked ? BookmarkFilledSvg : BookmarkSvg}
													size="sm"
													color="inherit"
												/>
											</button>
											{isMod && (
												<button
													type="button"
													onClick={handlePin}
													title={pinned ? "Unpin post" : "Pin post"}
													className={`transition-colors ${pinned ? "text-text-brand" : "text-text-muted hover:text-text-brand"}`}
												>
													<Icon
														as={pinned ? PinFilledSvg : PinSvg}
														size="sm"
														color="inherit"
													/>
												</button>
											)}
										</div>
									</div>
								</div>

								{/* Comments */}
								<div className="border-t border-border-default px-5 pt-4 pb-5 flex flex-col gap-3">
									{/* Input */}
									<div className="flex items-center gap-2">
										{profile?.avatarUrl ? (
											<div className="relative size-8 rounded-full overflow-hidden shrink-0 border border-border-default bg-surface-hover">
												<Image
													src={profile.avatarUrl}
													alt=""
													fill
													sizes="32px"
													className="object-cover"
												/>
											</div>
										) : (
											<div
												className={`size-8 rounded-full ${avatarColor(profile?.firstName ?? "?").bg} border ${avatarColor(profile?.firstName ?? "?").border} flex items-center justify-center shrink-0`}
											>
												<span
													className={`text-[9px] font-bold ${avatarColor(profile?.firstName ?? "?").text}`}
												>
													{(profile?.firstName?.[0] ?? "").toUpperCase()}
													{(profile?.lastName?.[0] ?? "").toUpperCase()}
												</span>
											</div>
										)}
										<div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-full bg-surface-page border border-border-default focus-within:border-border-focus transition-colors">
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

									{/* Comment list */}
									{commentsLoading && comments.length === 0 ? (
										<div className="flex flex-col gap-3">
											{[1, 2, 3].map(i => (
												<div key={i} className="flex gap-2 animate-pulse">
													<div className="size-8 rounded-full bg-surface-hover shrink-0" />
													<div className="flex-1 flex flex-col gap-1.5">
														<div className="h-2.5 w-24 bg-surface-hover rounded" />
														<div className="h-14 w-full bg-surface-hover rounded-2xl" />
													</div>
												</div>
											))}
										</div>
									) : comments.length === 0 ? (
										<p className="text-label-sm text-text-muted text-center py-3">
											No comments yet. Be the first!
										</p>
									) : (
										<div className="flex flex-col gap-3">
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
													<div
														key={comment.id}
														className="flex items-start gap-2 group"
													>
														{comment.author.avatarUrl ? (
															<div className="relative size-8 rounded-full overflow-hidden shrink-0 border border-border-default bg-surface-hover">
																<Image
																	src={comment.author.avatarUrl}
																	alt={comment.author.name}
																	fill
																	sizes="32px"
																	className="object-cover"
																/>
															</div>
														) : (
															<div
																className={`size-8 rounded-full ${color.bg} border ${color.border} flex items-center justify-center shrink-0`}
															>
																<span
																	className={`text-[9px] font-bold ${color.text}`}
																>
																	{initials}
																</span>
															</div>
														)}
														<div className="flex-1 min-w-0">
															<div className="inline-block bg-surface-hover rounded-2xl rounded-tl-sm px-3 py-2 max-w-full">
																<p className="text-[11px] font-semibold text-text-primary">
																	{comment.author.name}
																</p>
																<p className="text-label-sm text-text-primary leading-snug wrap-break-word">
																	{comment.content}
																</p>
															</div>
															<p className="text-[10px] text-text-muted mt-0.5 ml-1">
																{timeAgo(comment.createdAt)}
															</p>
														</div>
														{canDelete && (
															<button
																type="button"
																onClick={() => setDeleteTargetId(comment.id)}
																className="opacity-0 group-hover:opacity-100 p-1 rounded text-text-muted hover:text-red-500 transition-all shrink-0 mt-1"
																title="Delete comment"
															>
																<Icon
																	as={TrashBinSvg}
																	size="xs"
																	color="inherit"
																/>
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
							</>
						)}
					</div>
				</div>
			</div>

			<ConfirmDialog
				open={deleteTargetId !== null}
				title="Delete comment?"
				description="This will permanently remove your comment."
				confirmLabel="Delete"
				destructive
				onClose={() => setDeleteTargetId(null)}
				onConfirm={async () => {
					if (deleteTargetId) await handleDeleteComment(deleteTargetId)
					setDeleteTargetId(null)
				}}
			/>
		</>
	)
}
