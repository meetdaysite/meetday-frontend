"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"
import Image from "next/image"
import { Icon } from "@/components/ui/Icon"
import AltArrowDownSvg from "@/icons/outlined/alt-arrow-down.svg"
import AltArrowUpSvg from "@/icons/outlined/alt-arrow-up.svg"
import PinFilledSvg from "@/icons/filled/pin.svg"
import LikeSvg from "@/icons/outlined/like.svg"
import LikeFilledSvg from "@/icons/filled/like.svg"
import BookmarkSvg from "@/icons/outlined/bookmark.svg"
import BookmarkFilledSvg from "@/icons/filled/bookmark.svg"
import ShieldCheckSvg from "@/icons/outlined/shield-check.svg"
import {
	getCommunityAnnouncements,
	getAnnouncementBookmarks,
	likeAnnouncement,
	unlikeAnnouncement,
	bookmarkAnnouncement,
	unbookmarkAnnouncement,
} from "@/lib/api"
import type { CommunityAnnouncement } from "@/lib/api"

// ─── Types ────────────────────────────────────────────────────────────────────

type AnnouncementCategory = "EVENT_DROP" | "EVENT_REMINDER" | "COMMUNITY_UPDATE" | "COMMUNITY_REMINDER"
type AuthorRole = "ADMIN" | "HOST"
type ViewMode = "all" | "saved"

interface Announcement {
	id: string
	category: AnnouncementCategory
	title: string
	description: string
	coverImageUrl: string | null
	author: { name: string; avatarUrl: string | null; role: AuthorRole }
	timeAgo: string
	likeCount: number
	likedByMe: boolean
	bookmarkedByMe: boolean
	isPinned: boolean
}

const SORT_OPTIONS = ["Latest", "Oldest", "Most liked"] as const
type SortOption = (typeof SORT_OPTIONS)[number]

// ─── Category badge config ────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<AnnouncementCategory, { label: string; className: string }> = {
	EVENT_DROP: {
		label: "EVENT DROP",
		className: "bg-surface-info-soft text-text-info border border-blue-200",
	},
	EVENT_REMINDER: {
		label: "EVENT REMINDER",
		className: "bg-surface-brand-soft text-text-brand border border-red-200",
	},
	COMMUNITY_UPDATE: {
		label: "COMMUNITY UPDATE",
		className: "bg-surface-info-soft text-text-info border border-blue-200",
	},
	COMMUNITY_REMINDER: {
		label: "COMMUNITY REMINDER",
		className: "bg-green-50 text-green-600 border border-green-200",
	},
}

const ROLE_CONFIG: Record<AuthorRole, string> = {
	ADMIN: "bg-red-100 text-red-600",
	HOST: "bg-amber-100 text-amber-600",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeAgo(dateString: string): string {
	const diffMs = Date.now() - new Date(dateString).getTime()
	const diffMinutes = Math.floor(diffMs / 60000)
	const diffHours = Math.floor(diffMinutes / 60)
	const diffDays = Math.floor(diffHours / 24)
	const diffWeeks = Math.floor(diffDays / 7)
	if (diffMinutes < 60) return `${diffMinutes}m ago`
	if (diffHours < 24) return `${diffHours}h ago`
	if (diffDays < 7) return `${diffDays}d ago`
	return `${diffWeeks}w ago`
}

function toAuthorRole(role: string): AuthorRole {
	if (role === "HOST") return "HOST"
	return "ADMIN"
}

function mapAnnouncement(item: CommunityAnnouncement): Announcement {
	return {
		id: item.id,
		category: item.category as AnnouncementCategory,
		title: item.title,
		description: item.body,
		coverImageUrl: item.imageUrl,
		author: {
			name: item.author.name,
			avatarUrl: item.author.avatarUrl,
			role: toAuthorRole(item.authorRole),
		},
		timeAgo: formatTimeAgo(item.publishedAt),
		likeCount: item.likeCount,
		likedByMe: item.likedByMe,
		bookmarkedByMe: item.bookmarkedByMe,
		isPinned: item.isPinned,
	}
}

function sortAnnouncements(items: Announcement[], sort: SortOption): Announcement[] {
	const copy = [...items]
	if (sort === "Oldest") return copy.reverse()
	if (sort === "Most liked") return copy.sort((a, b) => b.likeCount - a.likeCount)
	return copy
}

// ─── Announcement Card ────────────────────────────────────────────────────────

function AnnouncementCard({
	announcement,
	communityId,
	onUnbookmark,
}: {
	announcement: Announcement
	communityId: string
	onUnbookmark?: () => void
}) {
	const [liked, setLiked] = useState(announcement.likedByMe)
	const [likeCount, setLikeCount] = useState(announcement.likeCount)
	const [bookmarked, setBookmarked] = useState(announcement.bookmarkedByMe)
	const category = CATEGORY_CONFIG[announcement.category]

	// Debounce refs — track intended final state so rapid clicks collapse into one request
	const likeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const intendedLikeRef = useRef(announcement.likedByMe)
	const bookmarkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const intendedBookmarkRef = useRef(announcement.bookmarkedByMe)

	useEffect(() => () => {
		if (likeTimerRef.current) clearTimeout(likeTimerRef.current)
		if (bookmarkTimerRef.current) clearTimeout(bookmarkTimerRef.current)
	}, [])

	return (
		<div className="rounded-panel bg-surface-card border border-border-default flex gap-4 p-4 relative">
			{/* Cover image */}
			<div className="w-32 shrink-0 rounded-action overflow-hidden self-stretch min-h-27.5">
				{announcement.coverImageUrl ? (
					<div className="relative w-full h-full">
						<Image
							src={announcement.coverImageUrl}
							alt={announcement.title}
							fill
							sizes="128px"
							className="object-cover"
						/>
					</div>
				) : (
					<div className="w-full h-full bg-red-50 flex items-center justify-center">
						<Icon as={ShieldCheckSvg} size="xl" color="brand" />
					</div>
				)}
			</div>

			{/* Content */}
			<div className="flex-1 min-w-0 flex flex-col gap-1.5 pr-6">
				{/* Category badge */}
				<span className={`self-start text-[10px] font-bold rounded-avatar px-2 py-0.5 ${category.className}`}>
					{category.label}
				</span>

				{/* Title */}
				<h3 className="text-body-md font-bold text-text-primary leading-snug">
					{announcement.title}
				</h3>

				{/* Description */}
				<p className="text-label-sm text-text-secondary font-normal leading-snug">
					{announcement.description}
				</p>

				{/* Bottom row: author + actions */}
				<div className="flex items-center justify-between gap-3 mt-auto pt-1">
					{/* Author */}
					<div className="flex items-center gap-2 min-w-0">
						<div className="relative size-6 rounded-full overflow-hidden shrink-0 border border-border-default bg-surface-hover">
							{announcement.author.avatarUrl ? (
								<Image
									src={announcement.author.avatarUrl}
									alt={announcement.author.name}
									fill
									sizes="24px"
									className="object-cover"
								/>
							) : (
								<div className="w-full h-full flex items-center justify-center bg-surface-brand-soft text-[9px] font-bold text-text-brand">
									{announcement.author.name.charAt(0).toUpperCase()}
								</div>
							)}
						</div>
						<span className="text-[11px] font-semibold text-text-primary truncate">
							{announcement.author.name}
						</span>
						<span className={`text-[10px] font-bold rounded-avatar px-1.5 py-0.5 shrink-0 ${ROLE_CONFIG[announcement.author.role]}`}>
							{announcement.author.role}
						</span>
						<span className="text-[11px] text-text-muted shrink-0">· {announcement.timeAgo}</span>
					</div>

					{/* Actions */}
					<div className="flex items-center gap-3 shrink-0">
						<button
							type="button"
							onClick={() => {
								const next = !intendedLikeRef.current
								intendedLikeRef.current = next
								setLiked(next)
								setLikeCount(c => c + (next ? 1 : -1))
								if (likeTimerRef.current) clearTimeout(likeTimerRef.current)
								likeTimerRef.current = setTimeout(async () => {
									const intended = intendedLikeRef.current
									try {
										if (intended) await likeAnnouncement(communityId, announcement.id)
										else await unlikeAnnouncement(communityId, announcement.id)
									} catch {
										setLiked(!intended)
										setLikeCount(c => c + (intended ? -1 : 1))
									}
								}, 500)
							}}
							className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${liked ? "text-text-brand" : "text-text-secondary hover:text-text-brand"}`}
						>
							<Icon as={liked ? LikeFilledSvg : LikeSvg} size="sm" color="inherit" />
							{likeCount}
						</button>
						<button
							type="button"
							onClick={() => {
								const next = !intendedBookmarkRef.current
								intendedBookmarkRef.current = next
								setBookmarked(next)
								if (bookmarkTimerRef.current) clearTimeout(bookmarkTimerRef.current)
								bookmarkTimerRef.current = setTimeout(async () => {
									const intended = intendedBookmarkRef.current
									try {
										if (intended) {
											await bookmarkAnnouncement(communityId, announcement.id)
											toast.success("Announcement saved")
										} else {
											await unbookmarkAnnouncement(communityId, announcement.id)
											toast("Removed from saved")
											onUnbookmark?.()
										}
									} catch {
										setBookmarked(!intended)
										intendedBookmarkRef.current = !intended
										toast.error("Something went wrong. Please try again.")
									}
								}, 500)
							}}
							className={`transition-colors ${bookmarked ? "text-text-brand" : "text-text-muted hover:text-text-brand"}`}
						>
							<Icon as={bookmarked ? BookmarkFilledSvg : BookmarkSvg} size="sm" color="inherit" />
						</button>
					</div>
				</div>
			</div>

			{/* Pin icon — top right, only for pinned announcements */}
			{announcement.isPinned && (
				<div className="absolute top-4 right-4 text-text-brand">
					<Icon as={PinFilledSvg} size="sm" color="brand" />
				</div>
			)}
		</div>
	)
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function AnnouncementSkeleton() {
	return (
		<div className="rounded-panel bg-surface-card border border-border-default flex gap-4 p-4 animate-pulse">
			<div className="w-32 shrink-0 rounded-action bg-surface-hover min-h-27.5" />
			<div className="flex-1 flex flex-col gap-2">
				<div className="h-4 w-24 bg-surface-hover rounded" />
				<div className="h-5 w-3/4 bg-surface-hover rounded" />
				<div className="h-4 w-full bg-surface-hover rounded" />
				<div className="h-4 w-5/6 bg-surface-hover rounded" />
			</div>
		</div>
	)
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AnnouncementsTabContent({ communityId }: { communityId: string }) {
	const [view, setView] = useState<ViewMode>("all")
	const [sort, setSort] = useState<SortOption>("Latest")
	const [sortOpen, setSortOpen] = useState(false)

	// All view
	const [allItems, setAllItems] = useState<Announcement[]>([])
	const [nextCursor, setNextCursor] = useState<string | null>(null)
	const [allLoading, setAllLoading] = useState(true)
	const [allLoadingMore, setAllLoadingMore] = useState(false)
	const [allError, setAllError] = useState<string | null>(null)

	// Saved view
	const [savedItems, setSavedItems] = useState<Announcement[]>([])
	const [savedNextCursor, setSavedNextCursor] = useState<string | null>(null)
	const [savedLoading, setSavedLoading] = useState(false)
	const [savedLoaded, setSavedLoaded] = useState(false)
	const [savedLoadingMore, setSavedLoadingMore] = useState(false)
	const [savedError, setSavedError] = useState<string | null>(null)

	const fetchAll = useCallback(async () => {
		setAllLoading(true)
		setAllError(null)
		try {
			const res = await getCommunityAnnouncements(communityId, { limit: 20 })
			setAllItems(res.items.map(mapAnnouncement))
			setNextCursor(res.nextCursor)
		} catch {
			setAllError("Failed to load announcements.")
		} finally {
			setAllLoading(false)
		}
	}, [communityId])

	const fetchSaved = useCallback(async () => {
		setSavedLoading(true)
		setSavedError(null)
		try {
			const res = await getAnnouncementBookmarks(communityId, { limit: 20 })
			setSavedItems(res.items.map(mapAnnouncement))
			setSavedNextCursor(res.nextCursor)
			setSavedLoaded(true)
		} catch {
			setSavedError("Failed to load saved announcements.")
		} finally {
			setSavedLoading(false)
		}
	}, [communityId])

	useEffect(() => {
		fetchAll()
	}, [fetchAll])

	useEffect(() => {
		if (view === "saved" && !savedLoaded) {
			fetchSaved()
		}
	}, [view, savedLoaded, fetchSaved])

	const handleLoadMoreAll = async () => {
		if (!nextCursor || allLoadingMore) return
		setAllLoadingMore(true)
		try {
			const res = await getCommunityAnnouncements(communityId, { cursor: nextCursor, limit: 20 })
			setAllItems(prev => [...prev, ...res.items.map(mapAnnouncement)])
			setNextCursor(res.nextCursor)
		} catch {
			// silent — user can retry
		} finally {
			setAllLoadingMore(false)
		}
	}

	const handleLoadMoreSaved = async () => {
		if (!savedNextCursor || savedLoadingMore) return
		setSavedLoadingMore(true)
		try {
			const res = await getAnnouncementBookmarks(communityId, { cursor: savedNextCursor, limit: 20 })
			setSavedItems(prev => [...prev, ...res.items.map(mapAnnouncement)])
			setSavedNextCursor(res.nextCursor)
		} catch {
			// silent — user can retry
		} finally {
			setSavedLoadingMore(false)
		}
	}

	const handleUnbookmarkInSaved = (id: string) => {
		setSavedItems(prev => prev.filter(a => a.id !== id))
	}

	const isAllView = view === "all"
	const loading = isAllView ? allLoading : savedLoading
	const error = isAllView ? allError : savedError
	const displayItems = sortAnnouncements(isAllView ? allItems : savedItems, sort)
	const hasMore = isAllView ? !!nextCursor : !!savedNextCursor
	const loadingMore = isAllView ? allLoadingMore : savedLoadingMore

	return (
		<div className="rounded-panel bg-surface-card border border-border-default p-5 flex flex-col gap-4">
			{/* Header */}
			<div className="flex items-start justify-between gap-4">
				<div>
					<h2 className="text-body-lg font-bold text-text-primary">Announcements</h2>
					<p className="text-label-sm text-text-secondary font-normal mt-0.5">
						Official updates and important information from the community team.
					</p>
				</div>

				{/* Sort dropdown */}
				<div className="relative shrink-0">
					<button
						type="button"
						onClick={() => setSortOpen(o => !o)}
						className="flex items-center gap-1.5 text-label-sm text-text-secondary font-medium hover:text-text-primary transition-colors"
					>
						Sort:{" "}
						<span className="text-text-brand font-semibold">{sort}</span>
						<Icon as={sortOpen ? AltArrowUpSvg : AltArrowDownSvg} size="xs" color="brand" />
					</button>

					{sortOpen && (
						<div className="absolute right-0 top-full mt-1.5 w-36 rounded-action bg-surface-card border border-border-default shadow-md z-10 overflow-hidden">
							{SORT_OPTIONS.map(opt => (
								<button
									key={opt}
									type="button"
									onClick={() => { setSort(opt); setSortOpen(false) }}
									className={`w-full px-3 py-2 text-left text-label-sm transition-colors ${
										sort === opt
											? "text-text-brand font-semibold bg-surface-brand-soft"
											: "text-text-primary hover:bg-surface-hover"
									}`}
								>
									{opt}
								</button>
							))}
						</div>
					)}
				</div>
			</div>

			{/* All / Saved toggle */}
			<div className="flex items-center gap-2">
				{(["all", "saved"] as const).map(v => (
					<button
						key={v}
						type="button"
						onClick={() => setView(v)}
						className={`px-3 py-1.5 rounded-full text-[12px] font-medium border whitespace-nowrap transition-colors ${
							view === v
								? "border-text-primary text-text-primary bg-transparent"
								: "border-border-default text-text-secondary hover:text-text-primary hover:border-border-focus"
						}`}
					>
						{v === "all" ? "All" : "Saved"}
					</button>
				))}
			</div>

			{/* Announcement cards */}
			<div className="flex flex-col gap-3">
				{loading ? (
					<>
						<AnnouncementSkeleton />
						<AnnouncementSkeleton />
						<AnnouncementSkeleton />
					</>
				) : error ? (
					<div className="py-8 text-center text-label-sm text-text-secondary">{error}</div>
				) : displayItems.length === 0 ? (
					<div className="py-8 text-center text-label-sm text-text-secondary">
						{isAllView ? "No announcements yet." : "No saved announcements."}
					</div>
				) : (
					displayItems.map(a => (
						<AnnouncementCard
							key={a.id}
							announcement={a}
							communityId={communityId}
							onUnbookmark={!isAllView ? () => handleUnbookmarkInSaved(a.id) : undefined}
						/>
					))
				)}
			</div>

			{/* Load more */}
			{!loading && hasMore && (
				<button
					type="button"
					onClick={isAllView ? handleLoadMoreAll : handleLoadMoreSaved}
					disabled={loadingMore}
					className="flex items-center justify-center gap-1.5 w-full py-3 text-label-sm text-text-secondary font-medium hover:text-text-primary transition-colors disabled:opacity-50"
				>
					{loadingMore ? "Loading…" : "Load older announcements"}
					{!loadingMore && <Icon as={AltArrowDownSvg} size="xs" color="secondary" />}
				</button>
			)}
		</div>
	)
}
