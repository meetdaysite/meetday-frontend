"use client"

import { useState } from "react"
import Image from "next/image"
import { Icon } from "@/components/ui/Icon"
import AltArrowDownSvg from "@/icons/outlined/alt-arrow-down.svg"
import AltArrowUpSvg from "@/icons/outlined/alt-arrow-up.svg"
import PinSvg from "@/icons/outlined/pin.svg"
import LikeSvg from "@/icons/outlined/like.svg"
import BookmarkSvg from "@/icons/outlined/bookmark.svg"
import ShareSvg from "@/icons/outlined/share.svg"
import ShieldCheckSvg from "@/icons/outlined/shield-check.svg"

// ─── Types & mock data ────────────────────────────────────────────────────────

type AnnouncementCategory = "EVENT_DROP" | "EVENT_REMINDER" | "COMMUNITY_UPDATE" | "COMMUNITY_REMINDER"
type AuthorRole = "ADMIN" | "HOST"

interface Announcement {
	id: string
	category: AnnouncementCategory
	title: string
	description: string
	coverImageUrl: string | null
	author: { name: string; avatarUrl: string; role: AuthorRole }
	timeAgo: string
	likeCount: number
}

// TODO: Replace with real data from GET /api/communities/[id]/announcements?sort=latest
const MOCK_ANNOUNCEMENTS: Announcement[] = [
	{
		id: "a1",
		category: "EVENT_DROP",
		title: "Neon Nights Early Access Opens Tomorrow!",
		description:
			"Early access tickets for Neon Nights go live tomorrow at 12 PM. Get ready for an unforgettable night at Warehouse Kolkata.",
		coverImageUrl:
			"https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=200&fit=crop",
		author: {
			name: "Meetday Team",
			avatarUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=40&h=40&fit=crop",
			role: "ADMIN",
		},
		timeAgo: "20m ago",
		likeCount: 45,
	},
	{
		id: "a2",
		category: "EVENT_REMINDER",
		title: "After Hours is This Saturday!",
		description:
			"Doors open at 7 PM. Don't forget to bring a valid ID. See you at Park Street, Kolkata.",
		coverImageUrl:
			"https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=200&fit=crop",
		author: {
			name: "Meetday Team",
			avatarUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=40&h=40&fit=crop",
			role: "ADMIN",
		},
		timeAgo: "3h ago",
		likeCount: 32,
	},
	{
		id: "a3",
		category: "COMMUNITY_UPDATE",
		title: "Night Rituals Photo Album is Live 📸",
		description: "Relive the magic! Check out the full album from Night Rituals.",
		coverImageUrl:
			"https://images.unsplash.com/photo-1598387993441-a364f854cfbd?w=400&h=200&fit=crop",
		author: {
			name: "Community Manager",
			avatarUrl: "https://i.pravatar.cc/40?img=12",
			role: "HOST",
		},
		timeAgo: "1d ago",
		likeCount: 28,
	},
	{
		id: "a4",
		category: "COMMUNITY_REMINDER",
		title: "Community Guidelines Update",
		description:
			"We've updated a few guidelines to keep our community safe, inclusive and fun for everyone.",
		coverImageUrl: null,
		author: {
			name: "Meetday Team",
			avatarUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=40&h=40&fit=crop",
			role: "ADMIN",
		},
		timeAgo: "2d ago",
		likeCount: 19,
	},
]

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

// ─── Announcement Card ────────────────────────────────────────────────────────

function AnnouncementCard({ announcement }: { announcement: Announcement }) {
	const [liked, setLiked] = useState(false)
	const [bookmarked, setBookmarked] = useState(false)
	const category = CATEGORY_CONFIG[announcement.category]

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
							<Image
								src={announcement.author.avatarUrl}
								alt={announcement.author.name}
								fill
								sizes="24px"
								className="object-cover"
							/>
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
						{/* TODO: Wire to POST /api/announcements/[id]/like */}
						<button
							type="button"
							onClick={() => setLiked(l => !l)}
							className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${liked ? "text-text-brand" : "text-text-secondary hover:text-text-primary"}`}
						>
							<Icon as={LikeSvg} size="sm" color={liked ? "brand" : "secondary"} />
							{announcement.likeCount + (liked ? 1 : 0)}
						</button>
						{/* TODO: Wire to POST /api/announcements/[id]/bookmark */}
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

			{/* Pin icon — top right */}
			{/* TODO: Wire to POST /api/announcements/[id]/pin (admin only) */}
			<button
				type="button"
				className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
			>
				<Icon as={PinSvg} size="sm" color="muted" />
			</button>
		</div>
	)
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AnnouncementsTabContent() {
	const [sort, setSort] = useState<SortOption>("Latest")
	const [sortOpen, setSortOpen] = useState(false)

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

			{/* Announcement cards */}
			{/* TODO: Replace with paginated API call — GET /api/communities/[id]/announcements?sort=[sort]&page=[page] */}
			<div className="flex flex-col gap-3">
				{MOCK_ANNOUNCEMENTS.map(a => (
					<AnnouncementCard key={a.id} announcement={a} />
				))}
			</div>

			{/* Load more */}
			{/* TODO: Implement pagination — fetch next page on click */}
			<button
				type="button"
				className="flex items-center justify-center gap-1.5 w-full py-3 text-label-sm text-text-secondary font-medium hover:text-text-primary transition-colors"
			>
				Load older announcements
				<Icon as={AltArrowDownSvg} size="xs" color="secondary" />
			</button>
		</div>
	)
}
