"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import clsx from "clsx"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import {
	getHostCommunityOverview,
	getHostCommunityAudience,
	getHostCommunityExperiences,
	getHostCommunityFeedSidebar,
	getHostCommunityAnnouncementStats,
	getHostCommunityAnnouncements,
	pinHostCommunityAnnouncement,
	unpinHostCommunityAnnouncement,
	deleteHostCommunityAnnouncement,
	joinCommunity,
	leaveCommunity,
	type HostCommunityOverviewResponse,
	type HostCommunityAudienceResponse,
	type HostCommunityExperience,
	type HostCommunityExperiencesResponse,
	type HostCommunityFeedSidebarResponse,
	type HostCommunityAccess,
	type HostCommunityUpcomingExperience,
	type HostAnnouncementStats,
	type HostCommunityAnnouncement,
	type HostAnnouncementStatus,
} from "@/lib/api"
import { toast } from "sonner"
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	Cell,
	PieChart,
	Pie,
	Legend,
} from "recharts"
import { getApiErrorMessage } from "@/lib/errors"
import { PublishExperienceModal } from "./_components/PublishExperienceModal"
import { LeaveCommunityModal } from "./_components/LeaveCommunityModal"
import { JoinCommunityConfirmModal } from "./_components/JoinCommunityConfirmModal"
import { FeedTabContent } from "./_components/FeedTabContent"
import { Skeleton } from "@/components/ui/Skeleton"
import { Tabs } from "@/components/ui/Tabs"

import BoltSvg from "@/icons/outlined/bolt.svg"
import ArrowLeftSvg from "@/icons/outlined/arrow-left.svg"
import ArrowRightSvg from "@/icons/outlined/arrow-right.svg"
import DotsSvg from "@/icons/outlined/dots.svg"
import EyeOpenSvg from "@/icons/outlined/eye-open.svg"
import TrashBinSvg from "@/icons/outlined/trash-bin.svg"
// import SearchSvg from "@/icons/outlined/search.svg"
import TrendUpSvg from "@/icons/outlined/trend-up.svg"
import FileTextSvg from "@/icons/outlined/file-text.svg"
import ClockCircleSvg from "@/icons/outlined/clock-circle.svg"
import AltArrowRightSvg from "@/icons/outlined/alt-arrow-right.svg"
import UsersGroupSvg from "@/icons/outlined/users-group.svg"
import UsersGroup2Svg from "@/icons/outlined/users-group-2.svg"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import MapPointSvg from "@/icons/outlined/map-point.svg"
import StarSvg from "@/icons/outlined/star.svg"
import LockSvg from "@/icons/outlined/lock.svg"
import CheckCircleSvg from "@/icons/outlined/check-circle.svg"
import CloseCircleSvg from "@/icons/outlined/close-circle.svg"
import Chart2Svg from "@/icons/outlined/chart-2.svg"
import PlaneSvg from "@/icons/outlined/plane.svg"
import ShieldCheckSvg from "@/icons/outlined/shield-check.svg"
import VerifiedSvg from "@/icons/filled/verified-check.svg"
import PinSvg from "@/icons/outlined/pin.svg"
import PinFilledSvg from "@/icons/filled/pin.svg"
import PenSvg from "@/icons/outlined/pen.svg"
import LikeSvg from "@/icons/outlined/like.svg"
import BookmarkSvg from "@/icons/outlined/bookmark.svg"
import BellSvg from "@/icons/outlined/bell.svg"
import ChatSvg from "@/icons/outlined/chat.svg"

// ─── Constants ────────────────────────────────────────────────────────────────

function fmtCount(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
	if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
	return String(n)
}

const ACCESS_CONFIG: Record<
	HostCommunityAccess,
	{ label: string; heroBadge: string; sideBadge: string; description: string }
> = {
	PUBLIC: {
		label: "Public",
		heroBadge: "bg-blue-600/20 text-blue-300 border-blue-500/30",
		sideBadge: "bg-blue-50 text-blue-700 border border-blue-200",
		description: "Anyone can discover and join this community.",
	},
	APPROVAL_REQUIRED: {
		label: "Approval Required",
		heroBadge: "bg-orange-600/20 text-orange-300 border-orange-500/30",
		sideBadge: "bg-orange-50 text-orange-700 border border-orange-200",
		description: "Members need approval to join.",
	},
	INVITE_ONLY: {
		label: "Invite Only",
		heroBadge: "bg-neutral-600/30 text-neutral-300 border-neutral-500/30",
		sideBadge: "bg-neutral-100 text-neutral-700 border border-neutral-200",
		description: "Members can only join via invitation.",
	},
}

const PERMISSION_LABELS: Record<string, string> = {
	canSubmitExperiences: "Submit experiences for review",
	canReplyToComments: "Reply to comments on your experiences",
	canViewAnalytics: "View your experience analytics",
	canReceiveUpdates: "Receive community updates",
}

const PERMISSION_DESCRIPTIONS: Record<string, string> = {
	canSubmitExperiences: "You can submit your experiences to be reviewed by admins.",
	canReplyToComments: "Engage with the community on your published experiences.",
	canViewAnalytics: "Track performance and insights for your experiences.",
	canReceiveUpdates: "Stay updated with announcements and opportunities.",
}

const PUBLISH_STEPS = [
	{
		n: 1,
		label: "Submit",
		description: "Submit your experience for review.",
		Icon: FileTextSvg,
		bg: "bg-orange-100",
		iconColor: "text-orange-600",
	},
	{
		n: 2,
		label: "Under Review",
		description: "Admins review for relevance and quality.",
		Icon: ClockCircleSvg,
		bg: "bg-blue-100",
		iconColor: "text-blue-600",
	},
	{
		n: 3,
		label: "Approved",
		description: "Once approved, it goes live in the community.",
		Icon: CheckCircleSvg,
		bg: "bg-green-100",
		iconColor: "text-green-600",
	},
	{
		n: 4,
		label: "Perform",
		description: "Track performance and engage with members.",
		Icon: TrendUpSvg,
		bg: "bg-purple-100",
		iconColor: "text-purple-600",
	},
] as const

const TAG_COLORS = [
	"bg-purple-50 text-purple-700 border-purple-200",
	"bg-teal-50 text-teal-700 border-teal-200",
	"bg-green-50 text-green-700 border-green-200",
	"bg-orange-50 text-orange-700 border-orange-200",
	"bg-blue-50 text-blue-700 border-blue-200",
	"bg-pink-50 text-pink-700 border-pink-200",
]

const TABS = [
	{ value: "OVERVIEW", label: "Overview" },
	{ value: "FEED", label: "Feed" },
	{ value: "AUDIENCE", label: "Audience" },
	{ value: "EXPERIENCES", label: "Experiences" },
	{ value: "ANNOUNCEMENTS", label: "Announcements" },
	{ value: "HOST_PERMISSIONS", label: "Host Permissions" },
]

// ─── Announcement constants ───────────────────────────────────────────────────

type AnnouncementCategory = "EVENT_DROP" | "EVENT_REMINDER" | "COMMUNITY_UPDATE" | "COMMUNITY_REMINDER"

const ANN_CATEGORY_CONFIG: Record<AnnouncementCategory, { label: string; className: string }> = {
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

const ANN_STATUS_CONFIG: Record<HostAnnouncementStatus, { label: string; className: string }> = {
	PUBLISHED: { label: "Published", className: "bg-green-50 text-green-700 border border-green-200" },
	SCHEDULED: { label: "Scheduled", className: "bg-blue-50 text-blue-700 border border-blue-200" },
	DRAFT: { label: "Draft", className: "bg-neutral-100 text-neutral-600 border border-neutral-200" },
}

// const ANN_STATUS_FILTERS: { label: string; value: "ALL" | HostAnnouncementStatus }[] = [
// 	{ label: "All", value: "ALL" },
// 	{ label: "Published", value: "PUBLISHED" },
// 	{ label: "Scheduled", value: "SCHEDULED" },
// 	{ label: "Drafts", value: "DRAFT" },
// ]

function formatAnnTimestamp(ann: HostCommunityAnnouncement, now: number): string {
	if (ann.status === "SCHEDULED" && ann.scheduledAt) {
		const d = new Date(ann.scheduledAt)
		return `Scheduled · ${d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} at ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
	}
	const ref = ann.publishedAt ?? ann.createdAt
	const diffMs = now - new Date(ref).getTime()
	const m = Math.floor(diffMs / 60000)
	const h = Math.floor(m / 60)
	const d = Math.floor(h / 24)
	const w = Math.floor(d / 7)
	if (m < 60) return `${m}m ago`
	if (h < 24) return `${h}h ago`
	if (d < 7) return `${d}d ago`
	return `${w}w ago`
}

// ─── Announcement card ────────────────────────────────────────────────────────

function HostAnnouncementCard({
	ann,
	now,
	openDropdownId,
	onToggleDropdown,
	onPin,
	onUnpin,
	onDelete,
}: {
	ann: HostCommunityAnnouncement
	now: number
	openDropdownId: string | null
	onToggleDropdown: (id: string, e: React.MouseEvent) => void
	onPin: (ann: HostCommunityAnnouncement) => void
	onUnpin: (ann: HostCommunityAnnouncement) => void
	onDelete: (ann: HostCommunityAnnouncement) => void
}) {
	const catCfg = ANN_CATEGORY_CONFIG[ann.category as AnnouncementCategory]
	const statusCfg = ANN_STATUS_CONFIG[ann.status]
	const timestamp = formatAnnTimestamp(ann, now)

	const isDraft = ann.status === "DRAFT"

	return (
		<div
			className={clsx(
				"flex rounded-action border bg-surface-card overflow-hidden relative",
				isDraft ? "border-dashed border-neutral-300" : "border-border-default",
			)}
		>
			{/* Cover image */}
			<div className="w-36 shrink-0 relative bg-neutral-100">
				{ann.imageUrl ? (
					<Image src={ann.imageUrl} alt={ann.title} fill sizes="144px" className="object-cover" />
				) : (
					<div className="w-full h-full flex items-center justify-center">
						<Icon as={BellSvg} size="xl" color="brand" />
					</div>
				)}
			</div>

			{/* Content */}
			<div className="flex-1 p-4 flex flex-col gap-1.5 min-w-0">
				{/* Badges row */}
				<div className="flex items-center gap-2 flex-wrap">
					{catCfg && (
						<span
							className={clsx(
								"text-[10px] font-bold rounded-avatar px-2 py-0.5",
								catCfg.className,
							)}
						>
							{catCfg.label}
						</span>
					)}
					<span
						className={clsx(
							"text-[10px] font-semibold rounded-avatar px-2 py-0.5 border",
							statusCfg.className,
						)}
					>
						{statusCfg.label}
					</span>
				</div>

				{/* Title */}
				<p
					className={clsx(
						"text-body-md font-bold text-text-primary leading-snug",
						isDraft && "opacity-70",
					)}
				>
					{ann.title}
				</p>

				{/* Body */}
				<p className="text-label-sm text-text-secondary leading-snug line-clamp-2">{ann.body}</p>

				{/* Author + timestamp */}
				<div className="flex items-center gap-2 mt-auto pt-1">
					<div className="relative size-5 rounded-full overflow-hidden shrink-0 bg-surface-brand-soft border border-border-default">
						{ann.author.avatarUrl ? (
							<Image
								src={ann.author.avatarUrl}
								alt={ann.author.name}
								fill
								sizes="20px"
								className="object-cover"
							/>
						) : (
							<span className="w-full h-full flex items-center justify-center text-[8px] font-bold text-text-brand">
								{ann.author.name.charAt(0).toUpperCase()}
							</span>
						)}
					</div>
					<span className="text-[11px] font-semibold text-text-primary truncate">
						{ann.author.name}
					</span>
					<span className="text-[11px] text-text-muted shrink-0">· {timestamp}</span>

					{/* Stats */}
					<div className="ml-auto flex items-center gap-3 shrink-0 text-text-secondary">
						<span className="flex items-center gap-1 text-[11px]">
							<EyeOpenSvg className="size-3.5" aria-hidden />
							{fmtCount(ann.reachCount)}
						</span>
						<span className="flex items-center gap-1 text-[11px]">
							<LikeSvg className="size-3.5" aria-hidden />
							{ann.likeCount}
						</span>
						<span className="flex items-center gap-1 text-[11px]">
							<BookmarkSvg className="size-3.5" aria-hidden />
							{ann.bookmarkCount}
						</span>
					</div>
				</div>
			</div>

			{/* Pin indicator */}
			{ann.isPinned && (
				<div className="absolute top-3 right-10 text-text-brand">
					<Icon as={PinFilledSvg} size="sm" color="brand" />
				</div>
			)}

			{/* Kebab menu */}
			<div data-kebab className="absolute top-3 right-3" onClick={e => e.stopPropagation()}>
				<button
					onClick={e => onToggleDropdown(ann.id, e)}
					className="flex items-center justify-center size-7 rounded-full hover:bg-surface-card-muted text-text-secondary transition-colors"
					aria-label="Announcement options"
				>
					<DotsSvg className="size-4" aria-hidden />
				</button>
				{openDropdownId === ann.id && (
					<div className="absolute right-0 top-8 z-50 w-52 bg-surface-card border border-border-default rounded-action shadow-floating py-1">
						<button
							onClick={() => {
								onToggleDropdown(ann.id, { stopPropagation: () => {} } as React.MouseEvent)
								toast.info("Edit announcement — coming soon")
							}}
							className="flex items-center gap-3 w-full px-4 py-2.5 text-label-sm text-text-primary hover:bg-surface-hover transition-colors"
						>
							<PenSvg className="size-4 shrink-0" aria-hidden />
							Edit
						</button>
						<button
							onClick={() => (ann.isPinned ? onUnpin(ann) : onPin(ann))}
							className="flex items-center gap-3 w-full px-4 py-2.5 text-label-sm text-text-primary hover:bg-surface-hover transition-colors"
						>
							<Icon as={ann.isPinned ? PinSvg : PinSvg} size="sm" color="secondary" />
							{ann.isPinned ? "Unpin" : "Pin to top"}
						</button>
						<div className="my-1 border-t border-border-subtle" />
						<button
							onClick={() => onDelete(ann)}
							className="flex items-center gap-3 w-full px-4 py-2.5 text-label-sm text-red-600 hover:bg-red-50 transition-colors"
						>
							<TrashBinSvg className="size-4 shrink-0" aria-hidden />
							Delete
						</button>
					</div>
				)}
			</div>
		</div>
	)
}

// ─── Pagination helpers ───────────────────────────────────────────────────────

function buildPageNumbers(current: number, total: number): (number | "…")[] {
	if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
	const pages: (number | "…")[] = []
	if (current <= 4) {
		pages.push(1, 2, 3, 4, 5, "…", total)
	} else if (current >= total - 3) {
		pages.push(1, "…", total - 4, total - 3, total - 2, total - 1, total)
	} else {
		pages.push(1, "…", current - 1, current, current + 1, "…", total)
	}
	return pages
}

function PageButton({
	children,
	onClick,
	active,
	disabled,
	"aria-label": ariaLabel,
}: {
	children: React.ReactNode
	onClick?: () => void
	active?: boolean
	disabled?: boolean
	"aria-label"?: string
}) {
	return (
		<button
			onClick={onClick}
			disabled={disabled}
			aria-label={ariaLabel}
			aria-current={active ? "page" : undefined}
			className={clsx(
				"flex items-center justify-center min-w-8 h-8 px-2 rounded-action text-caption font-medium transition-colors",
				active
					? "bg-surface-inverse text-text-inverse"
					: disabled
						? "text-text-muted cursor-not-allowed opacity-40"
						: "text-text-secondary hover:bg-surface-card-muted hover:text-text-primary",
			)}
		>
			{children}
		</button>
	)
}

// ─── Experience card ──────────────────────────────────────────────────────────

function ExperienceCard({
	exp,
	openDropdownId,
	onToggleDropdown,
	onRemove,
}: {
	exp: HostCommunityExperience
	openDropdownId: string | null
	onToggleDropdown: (id: string, e: React.MouseEvent) => void
	onRemove: (exp: HostCommunityExperience) => void
}) {
	const d = new Date(exp.eventDate)
	const dateLabel = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

	return (
		<div className="flex rounded-card border border-border-default bg-surface-card overflow-hidden">
			{/* Cover image */}
			<div className="relative w-44 shrink-0 bg-neutral-100">
				<Image src={exp.coverImageUrl} alt={exp.title} fill sizes="176px" className="object-cover" />
			</div>

			{/* Content */}
			<div className="flex-1 p-5 flex flex-col gap-2 min-w-0">
				{/* Title row */}
				<div className="flex items-start justify-between gap-3">
					<div className="flex items-center gap-2 flex-wrap min-w-0">
						<p className="text-body-md font-semibold text-text-primary truncate">{exp.title}</p>
						{exp.source === "MANUAL" && (
							<span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-badge bg-orange-50 text-orange-700 border border-orange-200 uppercase tracking-wide">
								Manually linked
							</span>
						)}
					</div>
					{/* Kebab menu */}
					<div data-kebab className="shrink-0 relative" onClick={e => e.stopPropagation()}>
						<button
							onClick={e => onToggleDropdown(exp.id, e)}
							className="flex items-center justify-center size-8 rounded-full hover:bg-surface-card-muted transition-colors text-text-secondary"
							aria-label="Experience options"
						>
							<DotsSvg className="size-4" aria-hidden />
						</button>
						{openDropdownId === exp.id && (
							<div className="absolute right-0 top-9 z-50 w-52 bg-surface-card border border-border-default rounded-action shadow-floating py-1">
								<Link
									href={`/community/dashboard/events/${exp.id}`}
									className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-label-sm text-text-primary hover:bg-surface-card-muted transition-colors"
								>
									<EyeOpenSvg className="size-4 shrink-0" aria-hidden />
									View Details
								</Link>
								<div className="my-1 border-t border-border-default" />
								<button
									onClick={e => {
										e.stopPropagation()
										onRemove(exp)
									}}
									className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-label-sm text-red-600 hover:bg-red-50 transition-colors"
								>
									<TrashBinSvg className="size-4 shrink-0" aria-hidden />
									Remove from Community
								</button>
							</div>
						)}
					</div>
				</div>

				{/* Description */}
				<p className="text-label-sm text-text-secondary leading-relaxed line-clamp-2">
					{exp.description}
				</p>

				{/* Date / time / city */}
				<div className="flex flex-wrap gap-x-4 gap-y-1 mt-0.5">
					<span className="flex items-center gap-1.5 text-caption text-text-secondary">
						<CalendarSvg className="size-3.5 shrink-0" aria-hidden />
						{dateLabel}
					</span>
					<span className="flex items-center gap-1.5 text-caption text-text-secondary">
						<CloseCircleSvg
							className="size-3.5 shrink-0 opacity-0 pointer-events-none"
							aria-hidden
						/>
						{exp.startTime}
					</span>
					<span className="flex items-center gap-1.5 text-caption text-text-secondary">
						<MapPointSvg className="size-3.5 shrink-0" aria-hidden />
						{exp.city}
					</span>
				</div>

				{/* Stats + CTA */}
				<div className="flex items-center justify-between mt-auto pt-2">
					<div className="flex items-center gap-5">
						<div className="flex items-center gap-1.5 text-caption text-text-secondary">
							<EyeOpenSvg className="size-3.5 shrink-0" aria-hidden />
							<span>{exp.stats.views.toLocaleString()} views</span>
						</div>
						<div className="flex items-center gap-1.5 text-caption text-text-secondary">
							<StarSvg className="size-3.5 shrink-0" aria-hidden />
							<span>{exp.stats.interestedCount.toLocaleString()} interested</span>
						</div>
						<div className="flex items-center gap-1.5 text-caption text-text-secondary">
							<CheckCircleSvg className="size-3.5 shrink-0" aria-hidden />
							<span>{exp.stats.goingCount.toLocaleString()} going</span>
						</div>
					</div>
					<Link href={`/community/dashboard/events/${exp.id}`}>
						<Button variant="secondary" size="sm" radius="md">
							View Details
						</Button>
					</Link>
				</div>
			</div>
		</div>
	)
}

// ─── Top Cities Modal ─────────────────────────────────────────────────────────

function TopCitiesModal({ cities, onClose }: { cities: string[]; onClose: () => void }) {
	useEffect(() => {
		const prev = document.body.style.overflow
		document.body.style.overflow = "hidden"
		return () => {
			document.body.style.overflow = prev
		}
	}, [])

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
			onClick={onClose}
		>
			<div
				className="bg-surface-card rounded-action border border-border-default shadow-floating w-full max-w-sm max-h-[80vh] flex flex-col overflow-hidden"
				onClick={e => e.stopPropagation()}
			>
				<div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
					<p className="text-body-md font-semibold text-text-primary">Top Cities</p>
					<button
						onClick={onClose}
						className="size-8 flex items-center justify-center rounded-full hover:bg-surface-card-muted transition-colors"
						aria-label="Close"
					>
						<Icon as={CloseCircleSvg} size="sm" color="secondary" />
					</button>
				</div>
				<div className="overflow-y-auto flex-1 px-5 py-3">
					{cities.length === 0 ? (
						<p className="text-label-sm text-text-secondary text-center py-8">
							No city data available yet.
						</p>
					) : (
						cities.map((city, i) => (
							<div
								key={city}
								className="flex items-center gap-3 py-2.5 border-b border-border-subtle last:border-0"
							>
								<span className="text-caption text-text-tertiary w-5 text-right shrink-0 font-medium">
									{i + 1}
								</span>
								<Icon as={MapPointSvg} size="sm" color="secondary" />
								<span className="text-label-sm text-text-primary">{city}</span>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	)
}

// ─── Join / request access banner ────────────────────────────────────────────

function HostCommunityJoinBanner({
	communityName,
	access,
	isPending,
	joining,
	onJoin,
}: {
	communityName: string
	access: HostCommunityAccess
	isPending: boolean
	joining: boolean
	onJoin: () => void
}) {
	if (isPending) {
		return (
			<div className="rounded-action bg-surface-card-muted border border-border-default p-6 flex flex-col sm:flex-row items-center gap-4">
				<div className="flex items-center justify-center size-12 rounded-full bg-surface-card border border-border-default shrink-0">
					<Icon as={LockSvg} size="md" color="secondary" />
				</div>
				<div className="flex-1 min-w-0 text-center sm:text-left">
					<p className="text-body-md font-semibold text-text-primary">Request pending approval</p>
					<p className="text-label-sm text-text-secondary mt-0.5 leading-snug">
						Your request to join{" "}
						<span className="font-semibold text-text-primary">{communityName}</span> is awaiting
						admin review.
					</p>
				</div>
			</div>
		)
	}

	if (access === "INVITE_ONLY") {
		return (
			<div className="rounded-action bg-surface-card-muted border border-border-default p-6 flex flex-col sm:flex-row items-center gap-4">
				<div className="flex items-center justify-center size-12 rounded-full bg-surface-card border border-border-default shrink-0">
					<Icon as={LockSvg} size="md" color="secondary" />
				</div>
				<div className="flex-1 min-w-0 text-center sm:text-left">
					<p className="text-body-md font-semibold text-text-primary">Invite only community</p>
					<p className="text-label-sm text-text-secondary mt-0.5 leading-snug">
						You need an invitation from an admin to join{" "}
						<span className="font-semibold text-text-primary">{communityName}</span>.
					</p>
				</div>
			</div>
		)
	}

	return (
		<div className="rounded-action bg-surface-brand-soft border border-border-focus p-6 flex flex-col sm:flex-row items-center gap-4">
			<div className="flex items-center justify-center size-12 rounded-full bg-action-primary shrink-0">
				<Icon as={BoltSvg} size="md" color="inverse" />
			</div>
			<div className="flex-1 min-w-0 text-center sm:text-left">
				<p className="text-body-md font-semibold text-text-primary">
					{access === "PUBLIC" ? "Join " : "Request access to "}
					<span className="text-text-brand">{communityName}</span> to unlock everything
				</p>
				<p className="text-label-sm text-text-secondary mt-0.5 leading-snug">
					Members get the community feed, announcements, audience insights, and can publish
					experiences.
				</p>
			</div>
			<Button
				variant="primary"
				size="md"
				radius="pill"
				className="shrink-0"
				disabled={joining}
				onClick={onJoin}
			>
				{access === "PUBLIC"
					? joining
						? "Joining…"
						: "Join Community"
					: joining
						? "Requesting…"
						: "Request Access"}
			</Button>
		</div>
	)
}

// ─── Locked tab placeholder ───────────────────────────────────────────────────

function HostLockedTabContent({
	tabLabel,
	communityName,
	access,
	isPending,
	joining,
	onJoin,
}: {
	tabLabel: string
	communityName: string
	access: HostCommunityAccess
	isPending: boolean
	joining: boolean
	onJoin: () => void
}) {
	const ctaLabel = isPending
		? null
		: access === "INVITE_ONLY"
			? null
			: access === "PUBLIC"
				? joining
					? "Joining…"
					: "Join Community"
				: joining
					? "Requesting…"
					: "Request Access"

	const description = isPending
		? "Your request to join is awaiting admin review."
		: access === "INVITE_ONLY"
			? "You need an invitation from an admin to access this section."
			: `Join ${communityName} to access ${tabLabel.toLowerCase()} and more.`

	return (
		<div className="px-4 sm:px-6 lg:px-8 pt-2 pb-6">
			<div className="rounded-action bg-surface-brand-soft border border-border-focus p-6 flex flex-col sm:flex-row items-center gap-4">
				<div className="flex items-center justify-center size-12 rounded-full bg-action-primary shrink-0">
					<Icon as={LockSvg} size="md" color="inverse" />
				</div>
				<div className="flex-1 min-w-0 text-center sm:text-left">
					<p className="text-body-md font-semibold text-text-primary">{tabLabel} is members-only</p>
					<p className="text-label-sm text-text-secondary mt-0.5 leading-snug">{description}</p>
				</div>
				{ctaLabel && (
					<Button
						variant="primary"
						size="md"
						radius="pill"
						className="shrink-0"
						disabled={joining}
						onClick={onJoin}
					>
						{ctaLabel}
					</Button>
				)}
			</div>
		</div>
	)
}

// ─── Upcoming Experience Card ─────────────────────────────────────────────────

function UpcomingExperienceCard({ exp }: { exp: HostCommunityUpcomingExperience }) {
	const d = new Date(exp.eventDate)
	const month = d.toLocaleDateString("en-IN", { month: "short" }).toUpperCase()
	const day = d.getDate()

	return (
		<Link
			href={`/community/dashboard/events/${exp.id}`}
			className="relative shrink-0 w-52 rounded-action overflow-hidden group border border-border-default  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
			style={{ aspectRatio: "3/4" }}
		>
			<Image
				src={exp.coverImageUrl}
				alt={exp.title}
				fill
				sizes="208px"
				className="object-cover transition-transform duration-500 group-hover:scale-105"
			/>
			<div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/60 to-black/10" />
			<div className="absolute inset-x-0 top-0 h-16 bg-linear-to-b from-black/50 to-transparent" />

			<div className="relative z-10 flex flex-col h-full p-4">
				<div>
					<p className="text-white text-body-md font-medium leading-tight drop-shadow">{month}</p>
					<p className="text-white text-body-sm leading-tight">{day}</p>
				</div>

				<div className="flex-1" />

				<div className="flex flex-col gap-2">
					<p className="text-white font-black text-lg uppercase leading-tight tracking-tight line-clamp-2 drop-">
						{exp.title}
					</p>
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-1.5 text-white/80 text-xs">
							<MapPointSvg className="size-3 shrink-0" aria-hidden />
							<span className="truncate">{exp.city}</span>
						</div>
						<div className="flex items-center gap-1.5 text-white/80 text-xs">
							<UsersGroup2Svg className="size-3 shrink-0" aria-hidden />
							<span>{exp.interestedCount} interested</span>
						</div>
					</div>
				</div>
			</div>
		</Link>
	)
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
	return (
		<div className="flex flex-col min-h-screen">
			<DashboardTopBar />
			<div className="flex-1 bg-surface-page px-4 sm:px-6 lg:px-8 py-6">
				<Skeleton.Text className="w-36 mb-5" />
				<Skeleton.Block className="rounded-action h-60 mb-1" />
				<Skeleton.Block className="h-11 mb-6" />
				<div className="flex gap-6 items-start">
					<div className="flex-1 min-w-0 flex flex-col gap-6">
						<Skeleton.Block className="h-36 rounded-action" />
						<div className="grid grid-cols-2 gap-4">
							{Array.from({ length: 4 }).map((_, i) => (
								<Skeleton.Block key={i} className="h-28 rounded-action" />
							))}
						</div>
						<Skeleton.Block className="h-72 rounded-action" />
					</div>
					<div className="w-100 shrink-0 flex flex-col gap-4">
						<Skeleton.Block className="h-36 rounded-action" />
						<Skeleton.Block className="h-24 rounded-action" />
						<Skeleton.Block className="h-40 rounded-action" />
						<Skeleton.Block className="h-44 rounded-action" />
					</div>
				</div>
			</div>
		</div>
	)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HostCommunityDetailPage() {
	const { id } = useParams<{ id: string }>()
	const [data, setData] = useState<HostCommunityOverviewResponse | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [refreshKey, setRefreshKey] = useState(0)
	const [activeTab, setActiveTab] = useState("OVERVIEW")
	const [citiesModalOpen, setCitiesModalOpen] = useState(false)

	// Audience tab state (lazy-loaded)
	const [audienceData, setAudienceData] = useState<HostCommunityAudienceResponse | null>(null)
	const [audienceLoading, setAudienceLoading] = useState(true)
	const [audienceError, setAudienceError] = useState<string | null>(null)
	const audienceFetched = useRef(false)

	// Experiences tab state (re-fetches on page change)
	const [expData, setExpData] = useState<HostCommunityExperiencesResponse | null>(null)
	const [expLoading, setExpLoading] = useState(true)
	const [expError, setExpError] = useState<string | null>(null)
	const [expPage, setExpPage] = useState(1)
	const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)

	// Sidebar data (lazy-loaded once, shared across tabs that use it)
	const [sidebarData, setSidebarData] = useState<HostCommunityFeedSidebarResponse | null>(null)
	const [sidebarLoading, setSidebarLoading] = useState(true)
	const sidebarFetched = useRef(false)

	// Modal state
	const [publishModalOpen, setPublishModalOpen] = useState(false)
	const [expRefreshKey, setExpRefreshKey] = useState(0)

	// Join / request access state
	const [joining, setJoining] = useState(false)
	const [joinModalOpen, setJoinModalOpen] = useState(false)

	// Leave community state
	const [leaveModalOpen, setLeaveModalOpen] = useState(false)

	// Announcements tab state
	const [annItems, setAnnItems] = useState<HostCommunityAnnouncement[]>([])
	const [annTotal, setAnnTotal] = useState(0)
	const [annTotalPages, setAnnTotalPages] = useState(1)
	const [annPage, setAnnPage] = useState(1)
	// const [annStatus, setAnnStatus] = useState<HostAnnouncementStatus | undefined>(undefined)
	const [annLoading, setAnnLoading] = useState(true)
	const [annError, setAnnError] = useState<string | null>(null)
	const [annStats, setAnnStats] = useState<HostAnnouncementStats | null>(null)
	const [annStatsLoading, setAnnStatsLoading] = useState(true)
	const annStatsFetched = useRef(false)
	const [annDropdownId, setAnnDropdownId] = useState<string | null>(null)
	const [annNow] = useState(() => Date.now())

	useEffect(() => {
		let cancelled = false
		async function load() {
			setLoading(true)
			setError(null)
			try {
				const res = await getHostCommunityOverview(id)
				if (!cancelled) setData(res)
			} catch (err) {
				if (!cancelled) setError(getApiErrorMessage(err))
			} finally {
				if (!cancelled) setLoading(false)
			}
		}
		load()
		return () => {
			cancelled = true
		}
	}, [id, refreshKey])

	// Experiences: re-fetch when tab is active or page changes
	useEffect(() => {
		if (activeTab !== "EXPERIENCES" || !data?.hostContext.isMember) return
		let cancelled = false
		async function load() {
			setExpLoading(true)
			setExpError(null)
			try {
				const res = await getHostCommunityExperiences(id, { page: expPage, limit: 10 })
				if (!cancelled) setExpData(res)
			} catch (err) {
				if (!cancelled) setExpError(getApiErrorMessage(err))
			} finally {
				if (!cancelled) setExpLoading(false)
			}
		}
		load()
		return () => {
			cancelled = true
		}
	}, [activeTab, id, expPage, expRefreshKey, data?.hostContext.isMember])

	// Sidebar: lazy-load once when any tab that uses it opens
	useEffect(() => {
		if (
			(activeTab !== "EXPERIENCES" &&
				activeTab !== "HOST_PERMISSIONS" &&
				activeTab !== "ANNOUNCEMENTS" &&
				activeTab !== "FEED") ||
			!data?.hostContext.isMember ||
			sidebarFetched.current
		)
			return
		sidebarFetched.current = true
		let cancelled = false
		setSidebarLoading(true)
		getHostCommunityFeedSidebar(id)
			.then(res => {
				if (!cancelled) setSidebarData(res)
			})
			.catch(() => {})
			.finally(() => {
				if (!cancelled) setSidebarLoading(false)
			})
		return () => {
			cancelled = true
		}
	}, [activeTab, id, data?.hostContext.isMember])

	// Kebab: close when clicking outside (experiences)
	useEffect(() => {
		if (!openDropdownId) return
		function handleClick(e: MouseEvent) {
			if (!(e.target as Element).closest("[data-kebab]")) setOpenDropdownId(null)
		}
		document.addEventListener("mousedown", handleClick)
		return () => document.removeEventListener("mousedown", handleClick)
	}, [openDropdownId])

	// Announcements kebab: close when clicking outside
	useEffect(() => {
		if (!annDropdownId) return
		function handleClick(e: MouseEvent) {
			if (!(e.target as Element).closest("[data-kebab]")) setAnnDropdownId(null)
		}
		document.addEventListener("mousedown", handleClick)
		return () => document.removeEventListener("mousedown", handleClick)
	}, [annDropdownId])

	// Announcements list: re-fetch when tab opens, page changes, or filter changes
	useEffect(() => {
		if (activeTab !== "ANNOUNCEMENTS" || !data?.hostContext.isMember) return
		let cancelled = false
		async function load() {
			setAnnLoading(true)
			setAnnError(null)
			try {
				const res = await getHostCommunityAnnouncements(id, {
					page: annPage,
					limit: 10,
					// status: annStatus,
				})
				if (!cancelled) {
					setAnnItems(res.items)
					setAnnTotal(res.total)
					setAnnTotalPages(res.totalPages)
				}
			} catch (err) {
				if (!cancelled) setAnnError(getApiErrorMessage(err))
			} finally {
				if (!cancelled) setAnnLoading(false)
			}
		}
		load()
		return () => {
			cancelled = true
		}
	}, [activeTab, id, annPage, data?.hostContext.isMember])

	// Announcements stats: lazy-load once
	useEffect(() => {
		if (activeTab !== "ANNOUNCEMENTS" || !data?.hostContext.isMember || annStatsFetched.current) return
		annStatsFetched.current = true
		let cancelled = false
		setAnnStatsLoading(true)
		getHostCommunityAnnouncementStats(id)
			.then(res => {
				if (!cancelled) setAnnStats(res)
			})
			.catch(() => {})
			.finally(() => {
				if (!cancelled) setAnnStatsLoading(false)
			})
		return () => {
			cancelled = true
		}
	}, [activeTab, id, data?.hostContext.isMember])

	// Lazy-load audience data the first time the Audience tab is opened
	useEffect(() => {
		if (activeTab !== "AUDIENCE" || !data?.hostContext.isMember || audienceFetched.current) return
		audienceFetched.current = true
		let cancelled = false
		setAudienceLoading(true)
		setAudienceError(null)
		getHostCommunityAudience(id)
			.then(res => {
				if (!cancelled) setAudienceData(res)
			})
			.catch(err => {
				if (!cancelled) setAudienceError(getApiErrorMessage(err))
			})
			.finally(() => {
				if (!cancelled) setAudienceLoading(false)
			})
		return () => {
			cancelled = true
		}
	}, [activeTab, id, data?.hostContext.isMember])

	if (loading) return <LoadingSkeleton />

	if (error || !data) {
		return (
			<div className="flex flex-col min-h-screen">
				<DashboardTopBar />
				<div className="flex flex-col items-center justify-center flex-1 gap-4">
					<p className="text-heading-sm font-semibold text-text-primary">
						{error ?? "Community not found"}
					</p>
					<div className="flex gap-4">
						<button
							onClick={() => setRefreshKey(k => k + 1)}
							className="text-label-sm text-text-brand hover:underline"
						>
							Try again
						</button>
						<Link
							href="/community/dashboard/communities"
							className="text-label-sm text-text-secondary hover:underline"
						>
							← Back to Communities
						</Link>
					</div>
				</div>
			</div>
		)
	}

	const { community, audience, hostContext, stats, upcomingExperiences } = data
	const accessCfg = ACCESS_CONFIG[community.access]

	async function handleJoinOrRequest() {
		if (joining) return
		setJoining(true)
		try {
			const res = await joinCommunity(id, "COMMUNITY_MEMBERS")
			toast.success(
				res.status === "ACTIVE" ? `You've joined ${community.name}` : "Request sent — pending approval",
			)
			setJoinModalOpen(false)
			setRefreshKey(k => k + 1)
		} catch (err) {
			toast.error(getApiErrorMessage(err))
		} finally {
			setJoining(false)
		}
	}

	async function handleLeave() {
		await leaveCommunity(id)
		toast.success(`You've left ${community.name}`)
		setLeaveModalOpen(false)
		setRefreshKey(k => k + 1)
	}

	const cityLabel = community.communityCities.length > 1 ? "All Cities" : community.primaryCity
	const activePermissions = Object.entries(hostContext.permissions)
		.filter(([, v]) => v)
		.map(([k]) => k)

	return (
		<div className="flex flex-col min-h-screen">
			<DashboardTopBar />

			<div className="flex-1 bg-surface-page">
				{/* ── Hero area ────────────────────────────────────────────── */}
				<div className="px-4 sm:px-6 lg:px-8 pt-6">
					<Link
						href="/community/dashboard/communities"
						className="inline-flex items-center gap-1.5 text-label-sm text-text-secondary hover:text-text-primary transition-colors mb-5"
					>
						<ArrowLeftSvg className="size-4" aria-hidden />
						Back to Communities
					</Link>

					<div className="rounded-action overflow-hidden bg-neutral-950 border border-neutral-800 relative min-h-64">
						{/* Cover image */}
						<Image
							src={community.coverImageUrl}
							alt=""
							fill
							sizes="(max-width: 1280px) 100vw, 900px"
							className="object-cover opacity-40"
							priority
						/>
						{/* Gradient */}
						<div className="absolute inset-0 bg-linear-to-b from-neutral-950/40 via-neutral-950/60 to-neutral-950/95 pointer-events-none" />
						{/* Glows */}
						<div className="absolute inset-0 overflow-hidden pointer-events-none">
							<div className="absolute -left-12 top-4 size-56 rounded-full bg-purple-600/25 blur-3xl" />
							<div className="absolute right-16 bottom-0 size-56 rounded-full bg-pink-600/20 blur-3xl" />
							<div className="absolute left-1/2 top-0 size-40 rounded-full bg-blue-600/15 blur-2xl" />
						</div>

						<div className="relative z-10 px-8 pt-10 pb-8 flex items-start gap-6">
							{/* Left: icon + info */}
							<div className="grid grid-cols-[auto_1fr] gap-5 items-start flex-1 min-w-0">
								{/* Community icon */}
								<div className="relative size-28 rounded-full shrink-0 border-4 border-neutral-950 overflow-hidden bg-neutral-800">
									<Image
										src={community.iconUrl}
										alt={community.name}
										fill
										sizes="112px"
										className="object-cover"
									/>
								</div>

								{/* Info */}
								<div className="flex flex-col gap-2 pt-2">
									{/* Access badge */}
									<div>
										<span
											className={clsx(
												"text-[11px] font-medium border rounded-avatar px-2.5 py-0.5 uppercase tracking-wide",
												accessCfg.heroBadge,
											)}
										>
											{accessCfg.label} Community
										</span>
									</div>

									{/* Name + verified */}
									<div className="flex items-center gap-2 flex-wrap">
										<h1 className="text-xl font-extrabold text-white leading-tight">
											{community.name}
										</h1>
										{community.isVerified && (
											<Icon as={VerifiedSvg} size="md" color="brand" />
										)}
									</div>

									{/* Description */}
									<p className="text-label-sm text-white/70 leading-relaxed font-normal line-clamp-2">
										{community.description}
									</p>

									{/* Stats */}
									<div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-1">
										<div className="flex items-center gap-1.5 text-label-sm text-white/75">
											<Icon as={MapPointSvg} size="sm" color="inverse" />
											<span>{cityLabel}</span>
										</div>
										<div className="flex items-center gap-1.5 text-label-sm text-white/75">
											<Icon as={UsersGroup2Svg} size="sm" color="inverse" />
											<span>{fmtCount(audience.memberCount)} Members</span>
										</div>
										<div className="flex items-center gap-1.5 text-label-sm text-white/75">
											<Icon as={CalendarSvg} size="sm" color="inverse" />
											<span>{stats.experiencesPublished} Experiences published</span>
										</div>
									</div>
								</div>
							</div>

							{/* Right: Audience Match card */}
							{audience.matchScore != null && (
								<div className="shrink-0 w-52 bg-white rounded-action p-4 shadow-floating">
									<p className="text-label-sm font-semibold text-text-primary mb-1">
										Audience Match
									</p>
									<p className="text-[2.25rem] font-black text-text-brand leading-none mb-1">
										{audience.matchScore}%
									</p>
									{audience.matchLabel && (
										<p className="text-label-sm font-semibold text-green-600 mb-1.5">
											{audience.matchLabel}
										</p>
									)}
									{audience.matchDescription && (
										<p className="text-caption text-text-secondary leading-relaxed">
											{audience.matchDescription}
										</p>
									)}
									<button
										onClick={() => setActiveTab("AUDIENCE")}
										className="mt-3 text-label-sm text-text-brand font-medium inline-flex items-center gap-1 hover:underline"
									>
										View details
										<AltArrowRightSvg className="size-3.5" aria-hidden />
									</button>
								</div>
							)}
						</div>
					</div>

					{/* ── Join / request access banner ─────────────────────── */}
					{!hostContext.isMember && (
						<div className="pt-5">
							<HostCommunityJoinBanner
								communityName={community.name}
								access={community.access}
								isPending={hostContext.isPending}
								joining={joining}
								onJoin={() => setJoinModalOpen(true)}
							/>
						</div>
					)}
				</div>

				{/* ── Tab navigation ───────────────────────────────────────── */}
				<div className="px-4 sm:px-6 lg:px-8 py-4">
					<Tabs items={TABS} value={activeTab} onChange={setActiveTab} variant="pill" fullWidth />
				</div>

				{/* ── Overview tab ─────────────────────────────────────────── */}
				{activeTab === "OVERVIEW" && (
					<div className="px-4 sm:px-6 lg:px-8 pt-2 pb-6">
						<div className="flex gap-6 items-start">
							{/* Main content */}
							<div className="flex-1 min-w-0 flex flex-col gap-6">
								{/* About */}
								<div className="rounded-action bg-surface-card border border-border-default  p-5">
									<p className="text-body-md font-semibold text-text-primary mb-3">
										About this community
									</p>
									<p className="text-body-sm text-text-secondary leading-relaxed mb-4">
										{community.description}
									</p>
									{community.interestTags.length > 0 ? (
										<div className="flex flex-wrap gap-2">
											{community.interestTags.map((tag, i) => (
												<span
													key={tag.id}
													className={clsx(
														"px-3 py-1 rounded-avatar text-label-sm font-medium border",
														TAG_COLORS[i % TAG_COLORS.length],
													)}
												>
													{tag.name}
												</span>
											))}
										</div>
									) : (
										<p className="text-caption text-text-tertiary">
											No interest tags added yet.
										</p>
									)}
								</div>

								{/* Metrics grid */}
								{hostContext.isMember && (
								<div className="grid grid-cols-2 gap-4">
									{/* Members */}
									<div className="rounded-action bg-surface-card border border-border-default  p-5">
										<div className="flex items-center gap-2 mb-3">
											<div className="size-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
												<Icon as={UsersGroup2Svg} size="sm" color="brand" />
											</div>
											<span className="text-label-sm text-text-secondary font-medium">
												Members
											</span>
										</div>
										<p className="text-[1.75rem] font-black text-text-primary leading-none">
											{fmtCount(audience.memberCount)}
										</p>
										<p
											className={clsx(
												"text-caption font-medium mt-1.5",
												audience.memberGrowthPct >= 0
													? "text-text-success"
													: "text-status-error-text",
											)}
										>
											{audience.memberGrowthPct >= 0 ? "↑" : "↓"}{" "}
											{Math.abs(audience.memberGrowthPct).toFixed(1)}% vs last month
										</p>
									</div>

									{/* Top Age Group */}
									<div className="rounded-action bg-surface-card border border-border-default  p-5">
										<div className="flex items-center gap-2 mb-3">
											<div className="size-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
												<Icon
													as={UsersGroupSvg}
													size="sm"
													className="text-teal-600"
												/>
											</div>
											<span className="text-label-sm text-text-secondary font-medium">
												Top Age Group
											</span>
										</div>
										{audience.topAgeGroup ? (
											<>
												<p className="text-[1.75rem] font-black text-text-primary leading-none">
													{audience.topAgeGroup.label}
												</p>
												<p className="text-caption text-text-secondary mt-1.5">
													{audience.topAgeGroup.pct}% of members
												</p>
											</>
										) : (
											<p className="text-label-sm text-text-tertiary mt-1">
												Age data not available yet.
											</p>
										)}
									</div>

									{/* Gender Distribution */}
									<div className="rounded-action bg-surface-card border border-border-default  p-5">
										<div className="flex items-center gap-2 mb-3">
											<div className="size-8 rounded-full bg-violet-50 flex items-center justify-center shrink-0">
												<Icon as={StarSvg} size="sm" color="vibe" />
											</div>
											<span className="text-label-sm text-text-secondary font-medium">
												Gender Distribution
											</span>
										</div>
										{audience.genderSplit ? (
											<>
												<div className="grid grid-cols-2 gap-3">
													<div>
														<p className="text-[1.75rem] font-black text-text-primary leading-none">
															{audience.genderSplit.malePct}%
														</p>
														<p className="text-caption text-text-secondary mt-1.5">
															Male
														</p>
													</div>
													<div>
														<p className="text-[1.75rem] font-black text-text-primary leading-none">
															{audience.genderSplit.femalePct}%
														</p>
														<p className="text-caption text-text-secondary mt-1.5">
															Female
														</p>
													</div>
												</div>
												{audience.genderSplit.nonBinaryPct > 0 && (
													<div className="mt-2.5 flex items-center justify-between">
														<span className="text-caption text-text-secondary">
															Non-binary
														</span>
														<span className="text-caption font-medium text-text-primary">
															{audience.genderSplit.nonBinaryPct}%
														</span>
													</div>
												)}
											</>
										) : (
											<p className="text-label-sm text-text-tertiary leading-relaxed mt-1">
												Demographic data will appear once members complete their
												profiles.
											</p>
										)}
									</div>

									{/* Top Cities */}
									<div className="rounded-action bg-surface-card border border-border-default  p-5">
										<div className="flex items-center gap-2 mb-3">
											<div className="size-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
												<Icon as={MapPointSvg} size="sm" color="info" />
											</div>
											<span className="text-label-sm text-text-secondary font-medium">
												Top Cities
											</span>
										</div>
										<p className="text-[1.75rem] font-black text-text-primary leading-none">
											{audience.cityCount}
										</p>
										{/* <button
											onClick={() => setCitiesModalOpen(true)}
											className="mt-1.5 text-caption text-text-brand font-medium inline-flex items-center gap-1 hover:underline"
										>
											View all cities
											<AltArrowRightSvg className="size-3" aria-hidden />
										</button> */}
									</div>
								</div>
								)}

								{/* Upcoming Experiences */}
								<div>
									<div className="flex items-center justify-between mb-4">
										<p className="text-body-md font-semibold text-text-primary">
											Upcoming experiences in this community
										</p>
										{upcomingExperiences.length > 0 && (
											<button
												onClick={() => setActiveTab("EXPERIENCES")}
												className="text-label-sm text-text-brand font-medium inline-flex items-center gap-1 hover:underline shrink-0"
											>
												View all
												<AltArrowRightSvg className="size-3.5" aria-hidden />
											</button>
										)}
									</div>

									{upcomingExperiences.length === 0 ? (
										<div className="rounded-action bg-surface-card border border-border-default  p-10 flex flex-col items-center text-center">
											<div className="size-12 rounded-full bg-surface-brand-soft flex items-center justify-center mb-3">
												<Icon as={CalendarSvg} size="md" color="brand" />
											</div>
											<p className="text-body-md font-semibold text-text-primary mb-1">
												No upcoming experiences
											</p>
											<p className="text-label-sm text-text-secondary max-w-xs">
												Experiences published to this community will appear here.
											</p>
										</div>
									) : (
										<div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
											{upcomingExperiences.map(exp => (
												<UpcomingExperienceCard key={exp.id} exp={exp} />
											))}
										</div>
									)}
								</div>
							</div>

							{/* Right sidebar */}
							<div className="w-100 shrink-0 flex flex-col gap-4 sticky top-6">
								{/* Community Access */}
								<div className="rounded-action bg-surface-card border border-border-default  p-5">
									<div className="flex items-center justify-between mb-2">
										<div className="flex items-center gap-2">
											<Icon as={ShieldCheckSvg} size="lg" color="success" />
											<p className="text-body-md font-semibold text-text-primary">
												Community Access
											</p>
										</div>
										<span
											className={clsx(
												"text-caption font-semibold px-2.5 py-0.5 rounded-badge",
												accessCfg.sideBadge,
											)}
										>
											{accessCfg.label}
										</span>
									</div>
									<p className="text-label-sm text-text-secondary mb-3">
										{accessCfg.description}
									</p>

									{hostContext.permissions.canSubmitExperiences && (
										<div className="flex items-start gap-2 bg-green-50 border border-green-100 rounded-action px-3 py-2.5">
											<div>
												<p className="text-label-sm font-semibold text-green-800">
													You can publish experiences
												</p>
												<p className="text-caption text-green-700 mt-0.5 leading-relaxed">
													Submit your experiences for review and reach this
													community.
												</p>
											</div>
										</div>
									)}
								</div>

								{/* Action buttons */}
								<div className="flex flex-col gap-2">
									{hostContext.isMember ? (
										<>
											<Button
												variant="primary"
												size="md"
												radius="md"
												className="w-full"
												disabled={!hostContext.permissions.canSubmitExperiences}
												leftIcon={<Icon as={PlaneSvg} size="sm" color="inherit" />}
												onClick={() => setPublishModalOpen(true)}
											>
												Publish an Experience
											</Button>
											{hostContext.role !== "OWNER" && (
												<Button
													variant="secondary"
													size="md"
													radius="md"
													className="w-full text-red-600 hover:bg-red-50 border-red-200"
													onClick={() => setLeaveModalOpen(true)}
												>
													Leave Community
												</Button>
											)}
										</>
									) : (
										community.access !== "INVITE_ONLY" && (
											<Button
												variant="primary"
												size="md"
												radius="md"
												className="w-full"
												disabled={joining || hostContext.isPending}
												onClick={() => setJoinModalOpen(true)}
											>
												{hostContext.isPending
													? "Requested"
													: community.access === "PUBLIC"
														? joining
															? "Joining…"
															: "Join Community"
														: joining
															? "Requesting…"
															: "Request Access"}
											</Button>
										)
									)}
								</div>

								{/* Community Stats */}
								{hostContext.isMember && (
									<div className="rounded-action bg-surface-card border border-border-default  p-5">
										<div className="flex items-center gap-2 mb-4">
											<Icon as={Chart2Svg} size="lg" color="info" />
											<p className="text-body-md font-semibold text-text-primary">
												Community Stats
											</p>
										</div>
										<div className="flex flex-col divide-y divide-border-subtle">
											<div className="flex items-center justify-between py-2.5 first:pt-0">
												<span className="text-label-sm text-text-secondary">
													Total Community Views
												</span>
												<span className="text-label-sm font-semibold text-text-primary">
													{stats.totalViews.toLocaleString()}
												</span>
											</div>
											<div className="flex items-center justify-between py-2.5">
												<span className="text-label-sm text-text-secondary">
													Experiences Published
												</span>
												<span className="text-label-sm font-semibold text-text-primary">
													{stats.experiencesPublished}
												</span>
											</div>
											<div className="flex items-center justify-between py-2.5">
												<span className="text-label-sm text-text-secondary">
													Monthly Active Members
												</span>
												<span className="text-label-sm font-semibold text-text-primary">
													{stats.monthlyActiveMembers.toLocaleString()}
												</span>
											</div>
											<div className="flex items-center justify-between py-2.5 last:pb-0">
												<span className="text-label-sm text-text-secondary">
													Avg. Engagement Rate
												</span>
												<span className="text-label-sm font-semibold text-text-primary">
													{stats.avgEngagementRate}%
												</span>
											</div>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				)}

				{/* ── Feed tab ─────────────────────────────────────────────── */}
				{activeTab === "FEED" && hostContext.isMember && (
					<div className="px-4 sm:px-6 lg:px-8 pt-2 pb-6">
						<div className="flex gap-6 items-start">
							{/* Main content */}
							<div className="flex-1 min-w-0">
								<FeedTabContent communityId={id} />
							</div>

							{/* Right sidebar */}
							<div className="w-100 shrink-0 flex flex-col gap-4 sticky top-6">
								{/* About */}
								<div className="rounded-action bg-surface-card border border-border-default  p-5">
									<p className="text-body-md font-semibold text-text-primary mb-3">
										About this community
									</p>
									{sidebarLoading ? (
										<div className="flex flex-col gap-2">
											<Skeleton.Text className="w-full" />
											<Skeleton.Text className="w-4/5" />
										</div>
									) : sidebarData ? (
										<>
											<p className="text-body-sm text-text-secondary leading-relaxed mb-4">
												{sidebarData.about.description}
											</p>
											{sidebarData.about.interestTags.length > 0 ? (
												<div className="flex flex-wrap gap-2">
													{sidebarData.about.interestTags.map((tag, i) => (
														<span
															key={tag.id}
															className={clsx(
																"px-3 py-1 rounded-avatar text-label-sm font-medium border",
																TAG_COLORS[i % TAG_COLORS.length],
															)}
														>
															{tag.name}
														</span>
													))}
												</div>
											) : (
												<p className="text-caption text-text-tertiary">
													No interest tags added yet.
												</p>
											)}
										</>
									) : (
										<p className="text-caption text-text-tertiary">
											Community info unavailable.
										</p>
									)}
								</div>

								{/* Community Stats */}
								<div className="rounded-action bg-surface-card border border-border-default  p-5">
									<div className="flex items-center gap-2 mb-3">
										<Icon as={Chart2Svg} size="lg" color="info" />
										<p className="text-body-md font-semibold text-text-primary">
											Community Stats
										</p>
									</div>
									{sidebarLoading ? (
										<div className="flex flex-col gap-2.5">
											{Array.from({ length: 6 }).map((_, i) => (
												<Skeleton.Row key={i} />
											))}
										</div>
									) : sidebarData ? (
										<div className="flex flex-col divide-y divide-border-subtle">
											{[
												{
													label: "Members",
													value: sidebarData.stats.membersCount.toLocaleString(),
												},
												{
													label: "Experiences this month",
													value: String(sidebarData.stats.experiencesThisMonth),
												},
												{
													label: "Monthly Views",
													value: sidebarData.stats.monthlyViews.toLocaleString(),
												},
												{
													label: "Monthly Comments",
													value: sidebarData.stats.monthlyComments.toLocaleString(),
												},
												{
													label: "Monthly Shares",
													value: sidebarData.stats.monthlyShares.toLocaleString(),
												},
												...(sidebarData.stats.audienceMatchPct != null
													? [
															{
																label: "Audience Match",
																value: `${sidebarData.stats.audienceMatchPct}%`,
															},
														]
													: []),
											].map(({ label, value }) => (
												<div
													key={label}
													className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
												>
													<span className="text-label-sm text-text-secondary">
														{label}
													</span>
													<span className="text-label-sm font-semibold text-text-primary">
														{value}
													</span>
												</div>
											))}
										</div>
									) : (
										<p className="text-caption text-text-tertiary">Stats unavailable.</p>
									)}
								</div>

								{/* Upcoming Experiences */}
								{sidebarData && sidebarData.upcomingExperiences.length > 0 && (
									<div className="rounded-action bg-surface-card border border-border-default  p-5">
										<p className="text-body-md font-semibold text-text-primary mb-3">
											Upcoming Experiences
										</p>
										<div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
											{sidebarData.upcomingExperiences.map(exp => (
												<UpcomingExperienceCard key={exp.id} exp={exp} />
											))}
										</div>
									</div>
								)}

								{/* Trending Discussions */}
								{sidebarData && sidebarData.trendingDiscussions.length > 0 && (
									<div className="rounded-action bg-surface-card border border-border-default  p-5">
										<p className="text-body-md font-semibold text-text-primary mb-3">
											Trending Discussions
										</p>
										<div className="flex flex-col divide-y divide-border-subtle">
											{sidebarData.trendingDiscussions.map(post => (
												<div key={post.id} className="py-2.5 first:pt-0 last:pb-0">
													<p className="text-label-sm text-text-primary leading-snug line-clamp-2">
														{post.content}
													</p>
													<div className="flex items-center gap-2 mt-1">
														{post.category !== "GENERAL" && (
															<span className="text-[10px] font-semibold bg-surface-vibe-soft text-violet-600 border border-purple-200 rounded-avatar px-2 py-0.5">
																{post.category}
															</span>
														)}
														<span className="text-caption text-text-tertiary">
															{post.commentCount} comments
														</span>
													</div>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				)}

				{/* ── Audience tab ─────────────────────────────────────────── */}
				{activeTab === "AUDIENCE" && hostContext.isMember && (
					<div className="px-4 sm:px-6 lg:px-8 pt-2 pb-6">
						{audienceLoading && (
							<div className="flex gap-6 items-start">
								<div className="flex-1 min-w-0 flex flex-col gap-6">
									<div className="grid grid-cols-4 gap-4">
										{Array.from({ length: 4 }).map((_, i) => (
											<Skeleton.Block key={i} className="h-28 rounded-action" />
										))}
									</div>
									<div className="grid grid-cols-2 gap-4">
										<Skeleton.Block className="h-64 rounded-action" />
										<Skeleton.Block className="h-64 rounded-action" />
									</div>
									<Skeleton.Block className="h-48 rounded-action" />
									<Skeleton.Block className="h-32 rounded-action" />
									<Skeleton.Block className="h-32 rounded-action" />
								</div>
								<div className="w-100 shrink-0 flex flex-col gap-4">
									<Skeleton.Block className="h-40 rounded-action" />
									<Skeleton.Block className="h-40 rounded-action" />
									<Skeleton.Block className="h-24 rounded-action" />
								</div>
							</div>
						)}

						{audienceError && (
							<div className="flex flex-col items-center justify-center py-20 gap-3">
								<p className="text-body-md font-semibold text-text-primary">
									{audienceError}
								</p>
								<button
									onClick={() => {
										audienceFetched.current = false
										setAudienceError(null)
										setAudienceLoading(true)
										getHostCommunityAudience(id)
											.then(setAudienceData)
											.catch(e => setAudienceError(getApiErrorMessage(e)))
											.finally(() => setAudienceLoading(false))
									}}
									className="text-label-sm text-text-brand hover:underline"
								>
									Try again
								</button>
							</div>
						)}

						{audienceData && !audienceLoading && (
							<div className="flex gap-6 items-start">
								{/* ── Main content ─────────────────────────── */}
								<div className="flex-1 min-w-0 flex flex-col gap-6">
									{/* Stats grid */}
									<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
										{(
											[
												{
													label: "Total Members",
													value: fmtCount(audienceData.stats.totalMembers),
													delta: audienceData.stats.totalMemberGrowthPct,
													suffix: "% vs last month",
													iconBg: "bg-red-50",
													icon: (
														<Icon as={UsersGroup2Svg} size="sm" color="brand" />
													),
												},
												{
													label: "New Members",
													value: fmtCount(audienceData.stats.newMembersThisMonth),
													delta: audienceData.stats.newMemberGrowthPct,
													suffix: "% vs last month",
													iconBg: "bg-green-50",
													icon: (
														<Icon as={UsersGroupSvg} size="sm" color="success" />
													),
												},
												{
													label: "Engagement Rate",
													value: `${audienceData.stats.engagementRate}%`,
													delta: audienceData.stats.engagementRateDelta,
													suffix: "% change",
													iconBg: "bg-purple-50",
													icon: <Icon as={Chart2Svg} size="sm" color="vibe" />,
												},
												{
													label: "Avg. Experience Rating",
													value:
														audienceData.stats.avgExperienceRating != null
															? audienceData.stats.avgExperienceRating.toFixed(
																	1,
																)
															: "—",
													delta: audienceData.stats.avgExperienceRatingDelta ?? 0,
													suffix: " change",
													iconBg: "bg-yellow-50",
													icon: <Icon as={StarSvg} size="sm" color="warning" />,
												},
											] as const
										).map(card => (
											<div
												key={card.label}
												className="rounded-action bg-surface-card border border-border-default  p-5"
											>
												<div className="flex items-center gap-2 mb-3">
													<div
														className={clsx(
															"size-8 rounded-full flex items-center justify-center shrink-0",
															card.iconBg,
														)}
													>
														{card.icon}
													</div>
													<span className="text-label-sm text-text-secondary font-medium">
														{card.label}
													</span>
												</div>
												<p className="text-[1.75rem] font-black text-text-primary leading-none">
													{card.value}
												</p>
												{card.value !== "—" && (
													<p
														className={clsx(
															"text-caption font-medium mt-1.5",
															card.delta >= 0
																? "text-text-success"
																: "text-status-error-text",
														)}
													>
														{card.delta >= 0 ? "↑" : "↓"}{" "}
														{Math.abs(card.delta).toFixed(1)}
														{card.suffix}
													</p>
												)}
											</div>
										))}
									</div>

									{/* Demographics */}
									<div className="grid grid-cols-2 gap-4">
										{/* Age Distribution */}
										<div className="rounded-action bg-surface-card border border-border-default  p-5">
											<p className="text-body-md font-semibold text-text-primary mb-4">
												Age Distribution
											</p>
											{audienceData.demographics.ageDistribution.length === 0 ? (
												<div className="flex flex-col items-center justify-center py-8 text-center">
													<Icon as={UsersGroup2Svg} size="lg" color="secondary" />
													<p className="text-label-sm text-text-secondary mt-2">
														No age data yet
													</p>
												</div>
											) : (
												<ResponsiveContainer width="100%" height={220}>
													<BarChart
														data={audienceData.demographics.ageDistribution}
														layout="vertical"
														margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
													>
														<XAxis type="number" domain={[0, 100]} hide />
														<YAxis
															type="category"
															dataKey="label"
															width={64}
															tick={{ fontSize: 11, fill: "#6b7280" }}
															axisLine={false}
															tickLine={false}
														/>
														<Tooltip
															formatter={v => [`${v}%`, "Members"]}
															cursor={{ fill: "#f3f4f6" }}
															contentStyle={{
																fontSize: 12,
																borderRadius: 8,
																border: "1px solid #e5e7eb",
															}}
														/>
														<Bar
															dataKey="pct"
															radius={[0, 4, 4, 0]}
															maxBarSize={20}
															minPointSize={3}
														>
															{audienceData.demographics.ageDistribution.map(
																(d, i) => (
																	<Cell
																		key={i}
																		fill={
																			d.pct === 0
																				? "#e5e7eb"
																				: "#ee2727"
																		}
																		fillOpacity={
																			d.pct === 0 ? 1 : 0.15 + i * 0.12
																		}
																	/>
																),
															)}
														</Bar>
													</BarChart>
												</ResponsiveContainer>
											)}
										</div>

										{/* Gender Distribution */}
										<div className="rounded-action bg-surface-card border border-border-default  p-5">
											<p className="text-body-md font-semibold text-text-primary mb-4">
												Gender Distribution
											</p>
											{!audienceData.demographics.genderSplit ? (
												<div className="flex flex-col items-center justify-center py-8 text-center">
													<Icon as={StarSvg} size="lg" color="secondary" />
													<p className="text-label-sm text-text-secondary mt-2 max-w-40 leading-relaxed">
														Demographic data will appear once members complete
														their profiles.
													</p>
												</div>
											) : (
												<>
													<ResponsiveContainer width="100%" height={180}>
														<PieChart>
															<Pie
																data={[
																	{
																		name: "Male",
																		value: audienceData.demographics
																			.genderSplit.malePct,
																	},
																	{
																		name: "Female",
																		value: audienceData.demographics
																			.genderSplit.femalePct,
																	},
																	...(audienceData.demographics.genderSplit
																		.nonBinaryPct > 0
																		? [
																				{
																					name: "Non-binary",
																					value: audienceData
																						.demographics
																						.genderSplit
																						.nonBinaryPct,
																				},
																			]
																		: []),
																]}
																cx="50%"
																cy="50%"
																innerRadius={52}
																outerRadius={80}
																paddingAngle={2}
																dataKey="value"
															>
																<Cell fill="#3b82f6" />
																<Cell fill="#ec4899" />
																<Cell fill="#a3a3a3" />
															</Pie>
															<Tooltip
																formatter={v => [`${v}%`]}
																contentStyle={{
																	fontSize: 12,
																	borderRadius: 8,
																	border: "1px solid #e5e7eb",
																}}
															/>
															<Legend
																iconType="circle"
																iconSize={8}
																wrapperStyle={{ fontSize: 12 }}
															/>
														</PieChart>
													</ResponsiveContainer>
													<div className="flex justify-around mt-2">
														{[
															{
																label: "Male",
																pct: audienceData.demographics.genderSplit
																	.malePct,
																color: "bg-blue-500",
															},
															{
																label: "Female",
																pct: audienceData.demographics.genderSplit
																	.femalePct,
																color: "bg-pink-500",
															},
															...(audienceData.demographics.genderSplit
																.nonBinaryPct > 0
																? [
																		{
																			label: "Non-binary",
																			pct: audienceData.demographics
																				.genderSplit.nonBinaryPct,
																			color: "bg-neutral-400",
																		},
																	]
																: []),
														].map(g => (
															<div
																key={g.label}
																className="flex flex-col items-center gap-1"
															>
																<span className="text-[1.1rem] font-black text-text-primary">
																	{g.pct}%
																</span>
																<div className="flex items-center gap-1.5">
																	<span
																		className={clsx(
																			"size-2 rounded-full shrink-0",
																			g.color,
																		)}
																	/>
																	<span className="text-caption text-text-secondary">
																		{g.label}
																	</span>
																</div>
															</div>
														))}
													</div>
												</>
											)}
										</div>
									</div>

									{/* Top Cities */}
									<div className="rounded-action bg-surface-card border border-border-default  p-5">
										<p className="text-body-md font-semibold text-text-primary mb-4">
											Top Cities
										</p>
										{audienceData.topCities.length === 0 ? (
											<div className="flex flex-col items-center justify-center py-8 text-center">
												<Icon as={MapPointSvg} size="lg" color="secondary" />
												<p className="text-label-sm text-text-secondary mt-2">
													No city data yet.
												</p>
											</div>
										) : (
											<div className="flex flex-col gap-3">
												{audienceData.topCities.map(c => (
													<div key={c.city} className="flex items-center gap-3">
														<span className="text-label-sm text-text-primary w-28 shrink-0 truncate">
															{c.city}
														</span>
														<div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
															<div
																className="h-full bg-action-primary rounded-full"
																style={{ width: `${c.pct}%` }}
															/>
														</div>
														<span className="text-caption text-text-secondary w-12 text-right shrink-0">
															{c.count.toLocaleString()} ({c.pct}%)
														</span>
													</div>
												))}
											</div>
										)}
									</div>

									{/* Audience Interests */}
									<div className="rounded-action bg-surface-card border border-border-default  p-5">
										<p className="text-body-md font-semibold text-text-primary mb-4">
											Audience Interests
										</p>
										{audienceData.interests.length === 0 ? (
											<p className="text-label-sm text-text-tertiary">
												No interest data yet.
											</p>
										) : (
											<div className="flex flex-wrap gap-2">
												{audienceData.interests.map((interest, i) => (
													<span
														key={interest.id}
														className={clsx(
															"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-avatar text-label-sm font-medium border",
															TAG_COLORS[i % TAG_COLORS.length],
														)}
													>
														{interest.name}
														<span className="opacity-60 text-caption font-normal">
															{interest.memberPct}%
														</span>
													</span>
												))}
											</div>
										)}
									</div>

									{/* Member Activity */}
									<div className="rounded-action bg-surface-card border border-border-default  p-5">
										<p className="text-body-md font-semibold text-text-primary mb-4">
											Member Activity
										</p>
										<div className="grid grid-cols-3 gap-4">
											{(
												[
													{
														label: "Event Views",
														icon: (
															<Icon as={CalendarSvg} size="sm" color="brand" />
														),
														iconBg: "bg-red-50",
														...audienceData.activity.eventViews,
													},
													{
														label: "Comments",
														icon: <Icon as={ChatSvg} size="sm" color="vibe" />,
														iconBg: "bg-purple-50",
														...audienceData.activity.comments,
													},
													{
														label: "Shares",
														icon: (
															<Icon as={PlaneSvg} size="sm" color="success" />
														),
														iconBg: "bg-green-50",
														...audienceData.activity.shares,
													},
												] as const
											).map(m => (
												<div key={m.label} className="flex flex-col gap-2">
													<div className="flex items-center gap-2">
														<div
															className={clsx(
																"size-7 rounded-full flex items-center justify-center shrink-0",
																m.iconBg,
															)}
														>
															{m.icon}
														</div>
														<span className="text-label-sm text-text-secondary">
															{m.label}
														</span>
													</div>
													<p className="text-[1.5rem] font-black text-text-primary leading-none">
														{fmtCount(m.total)}
													</p>
													<p
														className={clsx(
															"text-caption font-medium",
															m.growthPct >= 0
																? "text-text-success"
																: "text-status-error-text",
														)}
													>
														{m.growthPct >= 0 ? "↑" : "↓"}{" "}
														{Math.abs(m.growthPct).toFixed(1)}%
													</p>
												</div>
											))}
										</div>
									</div>
								</div>

								{/* ── Right sidebar ────────────────────────── */}
								<div className="w-100 shrink-0 flex flex-col gap-4 sticky top-6">
									{/* About This Community */}
									<div className="rounded-action bg-surface-card border border-border-default  p-5">
										<p className="text-body-md font-semibold text-text-primary mb-3">
											About this community
										</p>
										<p className="text-body-sm text-text-secondary leading-relaxed mb-4">
											{community.description}
										</p>
										{community.interestTags.length > 0 ? (
											<div className="flex flex-wrap gap-2">
												{community.interestTags.map((tag, i) => (
													<span
														key={tag.id}
														className={clsx(
															"px-3 py-1 rounded-avatar text-label-sm font-medium border",
															TAG_COLORS[i % TAG_COLORS.length],
														)}
													>
														{tag.name}
													</span>
												))}
											</div>
										) : (
											<p className="text-caption text-text-tertiary">
												No interest tags added yet.
											</p>
										)}
									</div>

									{/* Audience Highlights */}
									{audienceData.highlights.length > 0 && (
										<div className="rounded-action bg-surface-card border border-border-default  p-5">
											<p className="text-body-md font-semibold text-text-primary mb-3">
												Audience Highlights
											</p>
											<div className="flex flex-col gap-2.5">
												{audienceData.highlights.map(h => (
													<div key={h} className="flex items-start gap-2.5">
														<Icon
															as={CheckCircleSvg}
															size="sm"
															className="text-green-600 shrink-0 mt-0.5"
														/>
														<span className="text-label-sm text-text-primary leading-snug">
															{h}
														</span>
													</div>
												))}
											</div>
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				)}

				{/* ── Experiences tab ──────────────────────────────────────── */}
				{activeTab === "EXPERIENCES" && hostContext.isMember && (
					<div className="px-4 sm:px-6 lg:px-8 pt-2 pb-6">
						<div className="flex gap-6 items-start">
							{/* Main content */}
							<div className="flex-1 min-w-0 flex flex-col gap-4">
								{/* Toolbar */}
								<div className="flex items-center justify-end gap-3">
									{/* <div className="relative flex-1">
										<SearchSvg
											className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-secondary pointer-events-none"
											aria-hidden
										/>
										<input
											type="text"
											placeholder="Search experiences… (coming soon)"
											disabled
											className="w-full h-(--size-action-md) pl-9 pr-4 rounded-action border border-border-default bg-surface-card-muted text-label-sm text-text-muted placeholder:text-text-muted cursor-not-allowed"
										/>
									</div> */}
									<Button
										variant="primary"
										size="md"
										radius="md"
										leftIcon={<Icon as={PlaneSvg} size="sm" color="inherit" />}
										onClick={() => setPublishModalOpen(true)}
									>
										Publish Experience
									</Button>
								</div>

								{/* Loading */}
								{expLoading && (
									<div className="flex flex-col gap-4">
										{Array.from({ length: 4 }).map((_, i) => (
											<div
												key={i}
												className="flex rounded-card border border-border-default bg-surface-card overflow-hidden h-36"
											>
												<Skeleton.Block className="w-44 shrink-0 rounded-none" />
												<div className="flex-1 p-5 flex flex-col gap-2.5">
													<Skeleton.Text className="h-5 w-2/3" />
													<Skeleton.Text className="w-full" />
													<Skeleton.Text className="w-4/5" />
													<div className="mt-auto flex justify-between items-center">
														<div className="flex gap-4">
															<Skeleton.Text className="w-16" />
															<Skeleton.Text className="w-16" />
															<Skeleton.Text className="w-14" />
														</div>
														<Skeleton.Block className="h-8 w-24 rounded-action" />
													</div>
												</div>
											</div>
										))}
									</div>
								)}

								{/* Error */}
								{expError && !expLoading && (
									<div className="rounded-action bg-surface-card border border-border-default  p-10 flex flex-col items-center text-center">
										<p className="text-body-md font-semibold text-text-primary mb-2">
											{expError}
										</p>
										<button
											onClick={() => setExpPage(p => p)}
											className="text-label-sm text-text-brand hover:underline"
										>
											Try again
										</button>
									</div>
								)}

								{/* Empty state */}
								{!expLoading && !expError && expData && expData.data.length === 0 && (
									<div className="rounded-action bg-surface-card border border-border-default  p-12 flex flex-col items-center text-center">
										<div className="size-14 rounded-full bg-surface-brand-soft flex items-center justify-center mb-4">
											<Icon as={CalendarSvg} size="lg" color="brand" />
										</div>
										<p className="text-body-md font-semibold text-text-primary mb-1">
											No experiences linked yet
										</p>
										<p className="text-label-sm text-text-secondary mb-5 max-w-xs">
											Publish or link experiences to this community so members can
											discover and attend them.
										</p>
										<Button
											variant="primary"
											size="md"
											radius="md"
											leftIcon={<Icon as={PlaneSvg} size="sm" color="inherit" />}
											onClick={() => setPublishModalOpen(true)}
										>
											Publish an Experience
										</Button>
									</div>
								)}

								{/* Experience cards */}
								{!expLoading && !expError && expData && expData.data.length > 0 && (
									<>
										<div className="flex flex-col gap-4">
											{expData.data.map(exp => (
												<ExperienceCard
													key={exp.id}
													exp={exp}
													openDropdownId={openDropdownId}
													onToggleDropdown={(id, e) => {
														e.stopPropagation()
														setOpenDropdownId(prev => (prev === id ? null : id))
													}}
													onRemove={exp => {
														setOpenDropdownId(null)
														toast.info(
															`Remove from community will be available soon.`,
															{
																description: exp.title,
															},
														)
													}}
												/>
											))}
										</div>

										{/* Pagination */}
										{(() => {
											const totalPages = Math.ceil(expData.total / expData.limit)
											if (totalPages <= 1) return null
											const pages = buildPageNumbers(expPage, totalPages)
											return (
												<div className="flex items-center justify-center gap-1 pt-2">
													<PageButton
														aria-label="Previous page"
														disabled={expPage <= 1}
														onClick={() => setExpPage(p => p - 1)}
													>
														<ArrowLeftSvg className="size-3.5" aria-hidden />
													</PageButton>
													{pages.map((item, i) =>
														item === "…" ? (
															<span
																key={`ellipsis-${i}`}
																className="w-8 text-center text-caption text-text-muted"
															>
																…
															</span>
														) : (
															<PageButton
																key={item}
																active={(item as number) === expPage}
																onClick={() => setExpPage(item as number)}
															>
																{item}
															</PageButton>
														),
													)}
													<PageButton
														aria-label="Next page"
														disabled={expPage >= totalPages}
														onClick={() => setExpPage(p => p + 1)}
													>
														<ArrowRightSvg className="size-3.5" aria-hidden />
													</PageButton>
												</div>
											)
										})()}
									</>
								)}
							</div>

							{/* Right sidebar */}
							<div className="w-100 shrink-0 flex flex-col gap-4 sticky top-6">
								{/* Community Stats from sidebar API */}
								<div className="rounded-action bg-surface-card border border-border-default  p-5">
									<div className="flex items-center gap-2 mb-3">
										<Icon as={Chart2Svg} size="lg" color="info" />
										<p className="text-body-md font-semibold text-text-primary">
											Community Stats
										</p>
									</div>
									{sidebarLoading ? (
										<div className="flex flex-col gap-2.5">
											{Array.from({ length: 6 }).map((_, i) => (
												<Skeleton.Row key={i} />
											))}
										</div>
									) : sidebarData ? (
										<div className="flex flex-col divide-y divide-border-subtle">
											{[
												{
													label: "Members",
													value: sidebarData.stats.membersCount.toLocaleString(),
												},
												{
													label: "Experiences this month",
													value: String(sidebarData.stats.experiencesThisMonth),
												},
												{
													label: "Monthly Views",
													value: sidebarData.stats.monthlyViews.toLocaleString(),
												},
												{
													label: "Monthly Comments",
													value: sidebarData.stats.monthlyComments.toLocaleString(),
												},
												{
													label: "Monthly Shares",
													value: sidebarData.stats.monthlyShares.toLocaleString(),
												},
												...(sidebarData.stats.audienceMatchPct != null
													? [
															{
																label: "Audience Match",
																value: `${sidebarData.stats.audienceMatchPct}%`,
															},
														]
													: []),
											].map(({ label, value }) => (
												<div
													key={label}
													className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
												>
													<span className="text-label-sm text-text-secondary">
														{label}
													</span>
													<span className="text-label-sm font-semibold text-text-primary">
														{value}
													</span>
												</div>
											))}
										</div>
									) : (
										<p className="text-caption text-text-tertiary">Stats unavailable.</p>
									)}
								</div>
							</div>
						</div>
					</div>
				)}

				{/* ── Host Permissions tab ─────────────────────────────────── */}
				{activeTab === "HOST_PERMISSIONS" && hostContext.isMember && (
					<div className="px-4 sm:px-6 lg:px-8 pt-2 pb-6">
						<div className="flex gap-6 items-start">
							{/* Main content */}
							<div className="flex-1 min-w-0 flex flex-col gap-6">
								{/* Permission cards grid */}
								<div className="rounded-action bg-surface-card border border-border-default  p-6">
									<p className="text-heading-sm font-bold text-text-primary mb-1">
										Host Permissions in this Community
									</p>
									<p className="text-label-sm text-text-secondary mb-5">
										These are the actions you&apos;re allowed to perform.
									</p>

									{activePermissions.length === 0 ? (
										<div className="flex flex-col items-center justify-center py-10 text-center">
											<div className="size-12 rounded-full bg-surface-card-muted flex items-center justify-center mb-3">
												<Icon as={LockSvg} size="md" color="secondary" />
											</div>
											<p className="text-body-md font-semibold text-text-primary mb-1">
												No permissions assigned
											</p>
											<p className="text-label-sm text-text-secondary max-w-xs">
												Contact the community admin to request host access.
											</p>
										</div>
									) : (
										<div className="grid grid-cols-2 gap-4">
											{activePermissions.map(key => (
												<div
													key={key}
													className="flex items-start gap-3 p-4 rounded-action border border-border-default bg-surface-page"
												>
													<div className="size-8 rounded-full bg-green-50 flex items-center justify-center shrink-0 mt-0.5">
														<Icon
															as={CheckCircleSvg}
															size="sm"
															className="text-green-600"
														/>
													</div>
													<div className="flex flex-col gap-0.5 min-w-0">
														<p className="text-label-sm font-semibold text-text-primary leading-snug">
															{PERMISSION_LABELS[key] ?? key}
														</p>
														<p className="text-caption text-text-secondary leading-relaxed">
															{PERMISSION_DESCRIPTIONS[key] ?? ""}
														</p>
													</div>
												</div>
											))}
										</div>
									)}
								</div>

								{/* Review notice banner */}
								<div className="flex items-center gap-3 px-5 py-4 rounded-action border border-border-default bg-surface-page">
									<div className="size-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
										<Icon as={ShieldCheckSvg} size="sm" className="text-blue-600" />
									</div>
									<p className="text-label-sm text-text-secondary leading-relaxed">
										All experiences are reviewed by Meetday admins before they go live in
										the community.
									</p>
								</div>

								{/* Publishing workflow */}
								<div className="rounded-action bg-surface-card border border-border-default  p-6">
									<p className="text-body-md font-semibold text-text-primary mb-6">
										How publishing works in this community
									</p>
									<div className="grid grid-cols-4 gap-4">
										{PUBLISH_STEPS.map((step, i) => (
											<div
												key={step.n}
												className="flex flex-col items-center text-center relative"
											>
												{/* Arrow connector */}
												{i < PUBLISH_STEPS.length - 1 && (
													<div className="absolute left-[calc(50%+28px)] top-6 -translate-y-1/2 w-[calc(100%-56px)] flex items-center justify-center pointer-events-none">
														<AltArrowRightSvg
															className="size-4 text-border-default"
															aria-hidden
														/>
													</div>
												)}
												<div
													className={clsx(
														"size-14 rounded-full flex items-center justify-center mb-3 shrink-0",
														step.bg,
													)}
												>
													<step.Icon
														className={clsx("size-6", step.iconColor)}
														aria-hidden
													/>
												</div>
												<p className="text-caption text-text-tertiary mb-0.5">
													{step.n}.
												</p>
												<p className="text-label-sm font-semibold text-text-primary mb-1">
													{step.label}
												</p>
												<p className="text-caption text-text-secondary leading-relaxed">
													{step.description}
												</p>
											</div>
										))}
									</div>
								</div>

								{/* Bottom CTA */}
								<div className="flex items-center justify-between gap-6 px-6 py-5 rounded-action border border-border-default bg-surface-brand-soft">
									<div className="flex items-center gap-4">
										<div className="size-10 rounded-full bg-action-primary/10 flex items-center justify-center shrink-0">
											<Icon as={PlaneSvg} size="md" color="brand" />
										</div>
										<div>
											<p className="text-body-md font-semibold text-text-primary">
												Ready to share your experience with this community?
											</p>
											<p className="text-label-sm text-text-secondary mt-0.5">
												Submit an experience for review and reach{" "}
												{fmtCount(audience.memberCount)}+ members.
											</p>
										</div>
									</div>
									<Button
										variant="primary"
										size="md"
										radius="md"
										disabled={!hostContext.permissions.canSubmitExperiences}
										rightIcon={<Icon as={AltArrowRightSvg} size="sm" color="inherit" />}
										onClick={() => setPublishModalOpen(true)}
										className="shrink-0"
									>
										Publish an Experience
									</Button>
								</div>
							</div>

							{/* Right sidebar */}
							<div className="w-100 shrink-0 flex flex-col gap-4 sticky top-6">
								{/* Community Access */}
								<div className="rounded-action bg-surface-card border border-border-default  p-5">
									<div className="flex items-center justify-between mb-2">
										<div className="flex items-center gap-2">
											<Icon as={ShieldCheckSvg} size="lg" color="success" />
											<p className="text-body-md font-semibold text-text-primary">
												Community Access
											</p>
										</div>
										<span
											className={clsx(
												"text-caption font-semibold px-2.5 py-0.5 rounded-badge",
												accessCfg.sideBadge,
											)}
										>
											{accessCfg.label}
										</span>
									</div>
									<p className="text-label-sm text-text-secondary">
										{accessCfg.description}
									</p>
								</div>

								{/* About This Community */}
								<div className="rounded-action bg-surface-card border border-border-default  p-5">
									<p className="text-body-md font-semibold text-text-primary mb-3">
										About this community
									</p>
									<p className="text-body-sm text-text-secondary leading-relaxed mb-4">
										{community.description}
									</p>
									{community.interestTags.length > 0 ? (
										<div className="flex flex-wrap gap-2">
											{community.interestTags.map((tag, i) => (
												<span
													key={tag.id}
													className={clsx(
														"px-3 py-1 rounded-avatar text-label-sm font-medium border",
														TAG_COLORS[i % TAG_COLORS.length],
													)}
												>
													{tag.name}
												</span>
											))}
										</div>
									) : (
										<p className="text-caption text-text-tertiary">
											No interest tags added yet.
										</p>
									)}
								</div>

								{/* Community Stats from sidebar API */}
								<div className="rounded-action bg-surface-card border border-border-default  p-5">
									<div className="flex items-center gap-2 mb-3">
										<Icon as={Chart2Svg} size="lg" color="info" />
										<p className="text-body-md font-semibold text-text-primary">
											Community Stats
										</p>
									</div>
									{sidebarLoading ? (
										<div className="flex flex-col gap-2.5">
											{Array.from({ length: 5 }).map((_, i) => (
												<Skeleton.Row key={i} />
											))}
										</div>
									) : sidebarData ? (
										<div className="flex flex-col divide-y divide-border-subtle">
											{[
												{
													label: "Members",
													value: sidebarData.stats.membersCount.toLocaleString(),
												},
												{
													label: "Experiences this month",
													value: String(sidebarData.stats.experiencesThisMonth),
												},
												{
													label: "Monthly Views",
													value: sidebarData.stats.monthlyViews.toLocaleString(),
												},
												{
													label: "Monthly Comments",
													value: sidebarData.stats.monthlyComments.toLocaleString(),
												},
												{
													label: "Monthly Shares",
													value: sidebarData.stats.monthlyShares.toLocaleString(),
												},
												...(sidebarData.stats.audienceMatchPct != null
													? [
															{
																label: "Audience Match",
																value: `${sidebarData.stats.audienceMatchPct}%`,
															},
														]
													: []),
											].map(({ label, value }) => (
												<div
													key={label}
													className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
												>
													<span className="text-label-sm text-text-secondary">
														{label}
													</span>
													<span className="text-label-sm font-semibold text-text-primary">
														{value}
													</span>
												</div>
											))}
										</div>
									) : (
										<p className="text-caption text-text-tertiary">Stats unavailable.</p>
									)}
								</div>
							</div>
						</div>
					</div>
				)}

				{/* ── Announcements tab ────────────────────────────────────── */}
				{activeTab === "ANNOUNCEMENTS" && hostContext.isMember && (
					<div className="px-4 sm:px-6 lg:px-8 pt-2 pb-6">
						<div className="flex gap-6 items-start">
							{/* Main content */}
							<div className="flex-1 min-w-0 flex flex-col gap-4">
								{/* Page header */}
								<div className="flex items-center justify-between gap-4">
									<div>
										<p className="text-heading-sm font-bold text-text-primary">
											Announcements
										</p>
										<p className="text-label-sm text-text-secondary mt-0.5">
											{annTotal > 0
												? `${annTotal} announcement${annTotal !== 1 ? "s" : ""}`
												: "No announcements yet"}
										</p>
									</div>
									{/* <Button
										variant="primary"
										size="md"
										radius="md"
										leftIcon={<Icon as={BellSvg} size="sm" color="inherit" />}
										onClick={() => toast.info("Create Announcement — coming soon")}
									>
										Create Announcement
									</Button> */}
								</div>

								{/* Stat cards */}
								<div className="grid grid-cols-4 gap-3">
									{annStatsLoading || !annStats ? (
										Array.from({ length: 4 }).map((_, i) => (
											<Skeleton.Block
												key={i}
												className="rounded-action bg-surface-card border border-border-default p-4 h-24"
											/>
										))
									) : (
										<>
											<div className="rounded-action bg-surface-card border border-border-default  p-4 flex flex-col gap-2">
												<div className="size-8 rounded-full flex items-center justify-center bg-green-50">
													<CheckCircleSvg
														className="size-4 text-green-600"
														aria-hidden
													/>
												</div>
												<p className="text-heading-sm font-bold text-text-primary">
													{annStats.published}
												</p>
												<p className="text-caption text-text-secondary">Published</p>
											</div>
											<div className="rounded-action bg-surface-card border border-border-default  p-4 flex flex-col gap-2">
												<div className="size-8 rounded-full flex items-center justify-center bg-blue-50">
													<ClockCircleSvg
														className="size-4 text-blue-600"
														aria-hidden
													/>
												</div>
												<p className="text-heading-sm font-bold text-text-primary">
													{annStats.scheduled}
												</p>
												<p className="text-caption text-text-secondary">Scheduled</p>
											</div>
											<div className="rounded-action bg-surface-card border border-border-default  p-4 flex flex-col gap-2">
												<div className="size-8 rounded-full flex items-center justify-center bg-neutral-100">
													<FileTextSvg
														className="size-4 text-neutral-500"
														aria-hidden
													/>
												</div>
												<p className="text-heading-sm font-bold text-text-primary">
													{annStats.drafts}
												</p>
												<p className="text-caption text-text-secondary">Drafts</p>
											</div>
											<div className="rounded-action bg-surface-card border border-border-default  p-4 flex flex-col gap-2">
												<div className="size-8 rounded-full flex items-center justify-center bg-purple-50">
													<EyeOpenSvg
														className="size-4 text-purple-600"
														aria-hidden
													/>
												</div>
												<div className="flex items-end gap-1.5">
													<p className="text-heading-sm font-bold text-text-primary">
														{fmtCount(annStats.totalReach.value)}
													</p>
													{annStats.totalReach.changePercent != null && (
														<span
															className={clsx(
																"text-caption font-semibold mb-0.5",
																annStats.totalReach.changePercent >= 0
																	? "text-green-600"
																	: "text-red-500",
															)}
														>
															{annStats.totalReach.changePercent >= 0
																? "+"
																: ""}
															{annStats.totalReach.changePercent}%
														</span>
													)}
												</div>
												<p className="text-caption text-text-secondary">
													Total Reach
												</p>
											</div>
										</>
									)}
								</div>

								{/* Status filter pills */}
								{/* <Tabs
									items={ANN_STATUS_FILTERS}
									value={annStatus ?? "ALL"}
									onChange={v => {
										setAnnStatus(v === "ALL" ? undefined : v)
										setAnnPage(1)
									}}
									variant="pill"
								/> */}

								{/* Loading */}
								{annLoading && (
									<div className="flex flex-col gap-3">
										{Array.from({ length: 3 }).map((_, i) => (
											<Skeleton.Announcement key={i} />
										))}
									</div>
								)}

								{/* Error */}
								{annError && !annLoading && (
									<div className="rounded-action bg-surface-card border border-border-default  p-10 flex flex-col items-center text-center">
										<p className="text-body-md font-semibold text-text-primary mb-2">
											{annError}
										</p>
										<button
											onClick={() => setAnnPage(p => p)}
											className="text-label-sm text-text-brand hover:underline"
										>
											Try again
										</button>
									</div>
								)}

								{/* Empty state */}
								{!annLoading && !annError && annItems.length === 0 && (
									<div className="rounded-action bg-surface-card border border-border-default  p-12 flex flex-col items-center text-center">
										<div className="size-14 rounded-full bg-surface-brand-soft flex items-center justify-center mb-4">
											<Icon as={BellSvg} size="lg" color="brand" />
										</div>
										<p className="text-body-md font-semibold text-text-primary mb-1">
											No announcements yet
										</p>
									</div>
								)}

								{/* Announcement cards */}
								{!annLoading && !annError && annItems.length > 0 && (
									<>
										<div className="flex flex-col gap-3">
											{annItems.map(ann => (
												<HostAnnouncementCard
													key={ann.id}
													ann={ann}
													now={annNow}
													openDropdownId={annDropdownId}
													onToggleDropdown={(annId, e) => {
														e.stopPropagation()
														setAnnDropdownId(prev =>
															prev === annId ? null : annId,
														)
													}}
													onPin={async a => {
														setAnnDropdownId(null)
														try {
															const updated =
																await pinHostCommunityAnnouncement(id, a.id)
															setAnnItems(prev =>
																prev.map(x => (x.id === a.id ? updated : x)),
															)
															toast.success("Announcement pinned")
														} catch (err) {
															toast.error(getApiErrorMessage(err))
														}
													}}
													onUnpin={async a => {
														setAnnDropdownId(null)
														try {
															const updated =
																await unpinHostCommunityAnnouncement(id, a.id)
															setAnnItems(prev =>
																prev.map(x => (x.id === a.id ? updated : x)),
															)
															toast.success("Announcement unpinned")
														} catch (err) {
															toast.error(getApiErrorMessage(err))
														}
													}}
													onDelete={async a => {
														setAnnDropdownId(null)
														try {
															await deleteHostCommunityAnnouncement(id, a.id)
															setAnnItems(prev =>
																prev.filter(x => x.id !== a.id),
															)
															setAnnTotal(t => Math.max(0, t - 1))
															setAnnStats(s =>
																s
																	? {
																			...s,
																			published:
																				a.status === "PUBLISHED"
																					? Math.max(
																							0,
																							s.published - 1,
																						)
																					: s.published,
																			scheduled:
																				a.status === "SCHEDULED"
																					? Math.max(
																							0,
																							s.scheduled - 1,
																						)
																					: s.scheduled,
																			drafts:
																				a.status === "DRAFT"
																					? Math.max(
																							0,
																							s.drafts - 1,
																						)
																					: s.drafts,
																		}
																	: s,
															)
															toast.success("Announcement deleted")
														} catch (err) {
															toast.error(getApiErrorMessage(err))
														}
													}}
												/>
											))}
										</div>

										{/* Pagination */}
										{annTotalPages > 1 &&
											(() => {
												const pages = buildPageNumbers(annPage, annTotalPages)
												return (
													<div className="flex items-center justify-center gap-1 pt-2">
														<PageButton
															aria-label="Previous page"
															disabled={annPage <= 1}
															onClick={() => setAnnPage(p => p - 1)}
														>
															<ArrowLeftSvg className="size-3.5" aria-hidden />
														</PageButton>
														{pages.map((item, i) =>
															item === "…" ? (
																<span
																	key={`ellipsis-${i}`}
																	className="w-8 text-center text-caption text-text-muted"
																>
																	…
																</span>
															) : (
																<PageButton
																	key={item}
																	active={(item as number) === annPage}
																	onClick={() => setAnnPage(item as number)}
																>
																	{item}
																</PageButton>
															),
														)}
														<PageButton
															aria-label="Next page"
															disabled={annPage >= annTotalPages}
															onClick={() => setAnnPage(p => p + 1)}
														>
															<ArrowRightSvg className="size-3.5" aria-hidden />
														</PageButton>
													</div>
												)
											})()}
									</>
								)}
							</div>

							{/* Right sidebar */}
							<div className="w-100 shrink-0 flex flex-col gap-4 sticky top-6">
								{/* About This Community */}
								<div className="rounded-action bg-surface-card border border-border-default  p-5">
									<p className="text-body-md font-semibold text-text-primary mb-3">
										About this community
									</p>
									<p className="text-body-sm text-text-secondary leading-relaxed mb-4">
										{community.description}
									</p>
									{community.interestTags.length > 0 && (
										<div className="flex flex-wrap gap-2">
											{community.interestTags.map((tag, i) => (
												<span
													key={tag.id}
													className={clsx(
														"px-3 py-1 rounded-avatar text-label-sm font-medium border",
														TAG_COLORS[i % TAG_COLORS.length],
													)}
												>
													{tag.name}
												</span>
											))}
										</div>
									)}
								</div>

								{/* Community Stats */}
								<div className="rounded-action bg-surface-card border border-border-default  p-5">
									<div className="flex items-center gap-2 mb-3">
										<Icon as={Chart2Svg} size="lg" color="info" />
										<p className="text-body-md font-semibold text-text-primary">
											Community Stats
										</p>
									</div>
									{sidebarLoading ? (
										<div className="flex flex-col gap-2.5">
											{Array.from({ length: 4 }).map((_, i) => (
												<Skeleton.Row key={i} />
											))}
										</div>
									) : sidebarData ? (
										<div className="flex flex-col divide-y divide-border-subtle">
											{[
												{
													label: "Members",
													value: sidebarData.stats.membersCount.toLocaleString(),
												},
												{
													label: "Experiences this month",
													value: String(sidebarData.stats.experiencesThisMonth),
												},
												{
													label: "Monthly Views",
													value: sidebarData.stats.monthlyViews.toLocaleString(),
												},
												{
													label: "Monthly Comments",
													value: sidebarData.stats.monthlyComments.toLocaleString(),
												},
												{
													label: "Monthly Shares",
													value: sidebarData.stats.monthlyShares.toLocaleString(),
												},
											].map(({ label, value }) => (
												<div
													key={label}
													className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
												>
													<span className="text-label-sm text-text-secondary">
														{label}
													</span>
													<span className="text-label-sm font-semibold text-text-primary">
														{value}
													</span>
												</div>
											))}
										</div>
									) : (
										<p className="text-caption text-text-tertiary">Stats unavailable.</p>
									)}
								</div>
							</div>
						</div>
					</div>
				)}

				{/* ── Locked tab placeholder (non-members) ─────────────────── */}
				{activeTab !== "OVERVIEW" && !hostContext.isMember && (
					<HostLockedTabContent
						tabLabel={TABS.find(t => t.value === activeTab)?.label ?? "This section"}
						communityName={community.name}
						access={community.access}
						isPending={hostContext.isPending}
						joining={joining}
						onJoin={handleJoinOrRequest}
					/>
				)}

				{/* ── Stub for unimplemented tabs ──────────────────────────── */}
				{hostContext.isMember &&
					activeTab !== "OVERVIEW" &&
					activeTab !== "AUDIENCE" &&
					activeTab !== "EXPERIENCES" &&
					activeTab !== "HOST_PERMISSIONS" &&
					activeTab !== "ANNOUNCEMENTS" &&
					activeTab !== "FEED" && (
						<div className="flex flex-col items-center justify-center py-24 px-8">
							<div className="size-12 rounded-full bg-surface-card border border-border-default flex items-center justify-center mb-3">
								<Icon as={LockSvg} size="md" color="secondary" />
							</div>
							<p className="text-body-md font-semibold text-text-primary mb-1">Coming soon</p>
							<p className="text-label-sm text-text-secondary">
								This section is under development.
							</p>
						</div>
					)}
			</div>

			{citiesModalOpen && (
				<TopCitiesModal cities={audience.topCities} onClose={() => setCitiesModalOpen(false)} />
			)}

			<PublishExperienceModal
				communityId={id}
				open={publishModalOpen}
				onClose={() => setPublishModalOpen(false)}
				onSuccess={() => {
					setExpRefreshKey(k => k + 1)
					setRefreshKey(k => k + 1)
				}}
			/>

			<LeaveCommunityModal
				communityName={community.name}
				open={leaveModalOpen}
				onClose={() => setLeaveModalOpen(false)}
				onConfirm={async () => {
					try {
						await handleLeave()
					} catch (err) {
						toast.error(getApiErrorMessage(err))
					}
				}}
			/>

			<JoinCommunityConfirmModal
				communityName={community.name}
				isRequestOnly={community.access === "APPROVAL_REQUIRED"}
				open={joinModalOpen}
				onClose={() => setJoinModalOpen(false)}
				onConfirm={handleJoinOrRequest}
			/>
		</div>
	)
}
