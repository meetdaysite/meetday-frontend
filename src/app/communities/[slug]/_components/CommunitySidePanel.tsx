"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import UsersGroupSvg from "@/icons/outlined/users-group-2.svg"
import ChatSvg from "@/icons/outlined/chat.svg"
import ChatDotsSvg from "@/icons/outlined/chat-dots.svg"
import BellSvg from "@/icons/outlined/bell.svg"
import PulseSvg from "@/icons/outlined/pulse.svg"
import SmileCircleSvg from "@/icons/outlined/smile-circle.svg"
import BoltSvg from "@/icons/outlined/bolt.svg"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import ArrowRightSvg from "@/icons/outlined/arrow-right.svg"
import AltArrowDownSvg from "@/icons/outlined/alt-arrow-down.svg"
import LockSvg from "@/icons/outlined/lock.svg"
import CheckSvg from "@/icons/outlined/check.svg"
import BookmarkSvg from "@/icons/outlined/bookmark.svg"
import StarOutlinedSvg from "@/icons/outlined/star.svg"
import VerifiedSvg from "@/icons/filled/verified-check.svg"
import HeartsFilledSvg from "@/icons/filled/hearts.svg"
import HeartSvg from "@/icons/outlined/heart.svg"
import FireSvg from "@/icons/outlined/fire.svg"
import { avatarColor } from "@/lib/avatarColor"
import { getCommunityStats, getCommunityHosts, getCommunityMembers, getCommunityEvents, getCommunityTrendingTopics, getCommunityPopularPosts, getCommunityBookmarkedPosts, getCategories, getInterests, getSavedEvents } from "@/lib/api"
import type { CommunityStats, CommunityHost, CommunityMember, CommunityEvent, TrendingTopic, FeedPost, Category, Interest } from "@/lib/api"
import type { SavedEvent } from "@/types/attendee"
import { Skeleton } from "@/components/ui/Skeleton"

// ─── Shared host avatar helper ─────────────────────────────────────────────────

function HostAvatar({ avatarUrl, name }: { avatarUrl: string | null; name: string }) {
	const initials = name.slice(0, 2).toUpperCase()
	if (!avatarUrl) {
		return (
			<div className="size-9 rounded-full bg-surface-brand-soft border border-border-default flex items-center justify-center shrink-0">
				<span className="text-[9px] font-bold text-text-brand">{initials}</span>
			</div>
		)
	}
	return (
		<div className="relative size-9 rounded-full overflow-hidden shrink-0 border border-border-default bg-surface-hover">
			<Image src={avatarUrl} alt={name} fill sizes="36px" className="object-cover" />
		</div>
	)
}

// ─── Why Join Card ────────────────────────────────────────────────────────────

const WHY_JOIN_ITEMS = [
	{ icon: ChatSvg, title: "Community chat room", description: "Talk, connect and vibe with members." },
	{
		icon: BellSvg,
		title: "Official announcements",
		description: "Get the latest updates and experience drops.",
	},
	{ icon: PulseSvg, title: "General feed", description: "Share moments, ask, discuss and interact." },
	{
		icon: CalendarSvg,
		title: "Upcoming experiences",
		description: "Discover and book the best experiences first.",
	},
	{
		icon: UsersGroupSvg,
		title: "People with similar vibes",
		description: "Meet people who share your energy.",
	},
	{
		icon: SmileCircleSvg,
		title: "Post-event connections",
		description: "Revisit memories and stay connected.",
	},
]

function WhyJoinCard({ isMember, onJoinClick }: { isMember: boolean; onJoinClick: () => void }) {
	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<div className="flex items-center gap-2 mb-4">
				<span className="text-body-md font-semibold text-text-primary">
					{isMember ? "What you have access to" : "Why join this community?"}
				</span>
			</div>

			<div className="flex flex-col gap-3">
				{WHY_JOIN_ITEMS.map(item => (
					<div key={item.title} className="flex items-start gap-2.5">
						<div className="size-7 rounded-full bg-surface-info-soft border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
							<Icon as={item.icon} size="sm" color="info" />
						</div>
						<div>
							<p className="text-label-sm font-semibold text-text-primary">{item.title}</p>
							<p className="text-[11px] text-text-secondary font-normal mt-0.5">
								{item.description}
							</p>
						</div>
					</div>
				))}
			</div>

			{!isMember && (
				<Button
					variant="primary"
					size="md"
					radius="pill"
					className="w-full mt-5"
					leftIcon={<Icon as={BoltSvg} size="sm" color="inverse" />}
					onClick={onJoinClick}
				>
					Join Community
				</Button>
			)}
		</div>
	)
}

// ─── People In Community Card ─────────────────────────────────────────────────

function PeopleInCommunityCard({ isMember, communityId }: { isMember: boolean; communityId: string }) {
	const [members, setMembers] = useState<CommunityMember[]>([])
	const [total, setTotal] = useState(0)

	useEffect(() => {
		getCommunityMembers(communityId, { limit: 12 })
			.then(res => { setMembers(res.data); setTotal(res.total) })
			.catch(() => {})
	}, [communityId])

	const overflow = total > 12 ? total - 12 : 0

	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<div className="flex items-center justify-between gap-2 mb-4">
				<div className="flex items-center gap-2">
					<span className="text-body-md font-semibold text-text-primary">
						People in this community
					</span>
				</div>
				{!isMember && (
					<span className="flex items-center gap-1 text-[10px] font-medium text-text-info bg-surface-info-soft border border-blue-200 rounded-avatar px-2 py-0.5">
						<Icon as={LockSvg} size="xs" color="info" />
						Preview
					</span>
				)}
			</div>

			<div className="flex flex-wrap gap-1.5 mb-4">
				{members.map((m, i) => {
					const initials = `${m.firstName[0] ?? ""}${m.lastName[0] ?? ""}`.toUpperCase()
					return m.avatarUrl ? (
						<div key={i} className="relative size-8 rounded-full overflow-hidden border border-border-default bg-surface-hover">
							<Image src={m.avatarUrl} alt={`${m.firstName} ${m.lastName}`} fill sizes="32px" className="object-cover" />
						</div>
					) : (
						<div key={i} className="size-8 rounded-full bg-surface-brand-soft border border-border-default flex items-center justify-center">
							<span className="text-[9px] font-bold text-text-brand">{initials}</span>
						</div>
					)
				})}
				{overflow > 0 && (
					<div className="size-8 rounded-full bg-surface-hover border border-border-default flex items-center justify-center">
						<span className="text-[9px] font-semibold text-text-muted">+{overflow}</span>
					</div>
				)}
			</div>
		</div>
	)
}

// ─── Trusted Hosts Card ───────────────────────────────────────────────────────

// Mock kept for reference — replaced by real API data:
// const MOCK_TRUSTED_HOSTS = [
// 	{ id: "h1", name: "Beercruize", avatarUrl: "https://i.pravatar.cc/40?img=20", tagline: "Host", eventCount: "900+ events" },
// 	{ id: "h2", name: "Luna Nights", avatarUrl: "https://i.pravatar.cc/40?img=21", tagline: "Host", eventCount: "60+ events" },
// 	{ id: "h3", name: "Rooftop Collective", avatarUrl: "https://i.pravatar.cc/40?img=22", tagline: "Host", eventCount: "80+ events" },
// ]

function TrustedHostsCard({ hosts }: { hosts: CommunityHost[] | null }) {
	if (!hosts || hosts.length === 0) return null

	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<div className="flex items-center justify-between gap-2 mb-4">
				<span className="text-body-md font-semibold text-text-primary">Trusted hosts</span>
				{/* TODO: Link to /communities/[slug]/hosts once sub-page is built */}
				<Link href="#" className="flex items-center gap-1 text-sm text-text-brand font-medium hover:underline shrink-0">
					View all
					<Icon as={ArrowRightSvg} size="xs" color="brand" />
				</Link>
			</div>

			<div className="flex flex-col gap-3">
				{hosts.map((host, i) => (
					<div key={i} className="flex items-center gap-3">
						<HostAvatar avatarUrl={host.avatarUrl} name={host.brandName} />
						<div className="flex-1 min-w-0">
							<p className="text-label-sm font-semibold text-text-primary truncate">
								{host.brandName}
							</p>
							{/* tagline field not in API */}
							<p className="text-[11px] text-text-secondary">
								Host · {host.eventCount} {host.eventCount === 1 ? "experience" : "experiences"}
							</p>
						</div>
						<Icon as={ArrowRightSvg} size="sm" color="primary" />
					</div>
				))}
			</div>
		</div>
	)
}

// ─── Community Guidelines Card ────────────────────────────────────────────────

// TODO: Replace with real guidelines from GET /api/communities/[id]/guidelines
const MOCK_GUIDELINES = [
	"Respect boundaries and positive energy",
	"No hate speech or discrimination",
	"Keep conversations relevant to the community",
	"No spam or self-promotion without permission",
	"Report misconduct to community admins",
]

function CommunityGuidelinesCard() {
	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<div className="flex items-center gap-2 mb-4">
				<span className="text-body-md font-semibold text-text-primary">Community guidelines</span>
			</div>

			<div className="flex flex-col gap-2">
				{MOCK_GUIDELINES.slice(0, 3).map((g, i) => (
					<div key={i} className="flex items-start gap-2">
						<Icon as={CheckSvg} size="sm" color="success" />
						<span className="text-label-sm text-text-primary font-normal leading-snug">
							{g}
						</span>
					</div>
				))}
			</div>
		</div>
	)
}

// ─── Experiences: Filter Card ─────────────────────────────────────────────────

const DATE_FILTER_OPTIONS = [
	{ label: "All", value: "" },
	{ label: "This Week", value: "this_week" },
	{ label: "This Month", value: "this_month" },
	{ label: "Next Month", value: "next_month" },
]


const SORT_OPTIONS: { label: string; sortBy: string; sortOrder: string }[] = [
	{ label: "Date: Soonest", sortBy: "date", sortOrder: "asc" },
	{ label: "Date: Latest", sortBy: "date", sortOrder: "desc" },
	{ label: "Price: Low to High", sortBy: "price", sortOrder: "asc" },
	{ label: "Price: High to Low", sortBy: "price", sortOrder: "desc" },
]

export type ExperienceFilters = {
	dateFilter: string
	categoryId: string
	interestSlugs: string[]
	sortBy: string
	sortOrder: string
}

export const DEFAULT_EXPERIENCE_FILTERS: ExperienceFilters = {
	dateFilter: "",
	categoryId: "",
	interestSlugs: [],
	sortBy: "date",
	sortOrder: "asc",
}

function ExperiencesFilterCard({
	filters,
	onChange,
}: {
	filters: ExperienceFilters
	onChange: (f: ExperienceFilters) => void
}) {
	const [categories, setCategories] = useState<Category[]>([])
	const [interests, setInterests] = useState<Interest[]>([])

	useEffect(() => {
		getCategories().then(setCategories).catch(() => {})
		getInterests().then(setInterests).catch(() => {})
	}, [])

	const hasActiveFilters =
		!!filters.dateFilter ||
		!!filters.categoryId ||
		filters.interestSlugs.length > 0

	const clearAll = () =>
		onChange({ ...filters, dateFilter: "", categoryId: "", interestSlugs: [] })

	const currentSortLabel =
		SORT_OPTIONS.find(s => s.sortBy === filters.sortBy && s.sortOrder === filters.sortOrder)?.label ??
		SORT_OPTIONS[0].label

	const toggleInterestSlug = (slug: string) => {
		const next = filters.interestSlugs.includes(slug)
			? filters.interestSlugs.filter(s => s !== slug)
			: [...filters.interestSlugs, slug]
		onChange({ ...filters, interestSlugs: next })
	}

	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<div className="flex items-center justify-between gap-2 mb-4">
				<span className="text-body-md font-semibold text-text-primary">Filter experiences</span>
				{hasActiveFilters && (
					<button
						type="button"
						onClick={clearAll}
						className="text-sm font-medium text-text-brand hover:underline shrink-0"
					>
						Clear all
					</button>
				)}
			</div>

			{/* Date */}
			<div className="mb-4">
				<p className="text-label-sm font-medium text-text-secondary mb-2">Date</p>
				<div className="flex flex-wrap gap-1.5">
					{DATE_FILTER_OPTIONS.map(opt => (
						<button
							key={opt.value}
							type="button"
							onClick={() => onChange({ ...filters, dateFilter: opt.value })}
							className={`px-3 py-1 rounded-full text-[12px] font-medium border transition-colors ${
								filters.dateFilter === opt.value
									? "bg-action-primary text-white border-action-primary"
									: "bg-transparent text-text-secondary border-border-default hover:border-border-focus"
							}`}
						>
							{opt.label}
						</button>
					))}
				</div>
			</div>

			{/* Category */}
			<div className="mb-4">
				<p className="text-label-sm font-medium text-text-secondary mb-2">Category</p>
				<div className="relative">
					<select
						value={filters.categoryId}
						onChange={e => onChange({ ...filters, categoryId: e.target.value })}
						className="w-full px-3 py-2.5 pr-8 rounded-action border border-border-default bg-surface-page text-label-sm text-text-primary appearance-none cursor-pointer focus:outline-none focus:border-border-focus"
					>
						<option value="">All categories</option>
						{categories.map(c => (
							<option key={c.id} value={c.id}>{c.name}</option>
						))}
					</select>
					<Icon
						as={AltArrowDownSvg}
						size="sm"
						color="secondary"
						className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
					/>
				</div>
			</div>

			{/* Interests (multi-select pills) */}
			{interests.length > 0 && (
				<div className="mb-4">
					<p className="text-label-sm font-medium text-text-secondary mb-2">Interests</p>
					<div className="flex flex-wrap gap-1.5">
						{interests.map(i => (
							<button
								key={i.slug}
								type="button"
								onClick={() => toggleInterestSlug(i.slug)}
								className={`px-3 py-1 rounded-full text-[12px] font-medium border transition-colors ${
									filters.interestSlugs.includes(i.slug)
										? "bg-action-primary text-white border-action-primary"
										: "bg-transparent text-text-secondary border-border-default hover:border-border-focus"
								}`}
							>
								{i.name}
							</button>
						))}
					</div>
				</div>
			)}

			{/* Sort by */}
			<div>
				<p className="text-label-sm font-medium text-text-secondary mb-2">Sort by</p>
				<div className="relative">
					<select
						value={currentSortLabel}
						onChange={e => {
							const opt = SORT_OPTIONS.find(s => s.label === e.target.value)
							if (opt) onChange({ ...filters, sortBy: opt.sortBy, sortOrder: opt.sortOrder })
						}}
						className="w-full px-3 py-2.5 pr-8 rounded-action border border-border-default bg-surface-page text-label-sm text-text-primary appearance-none cursor-pointer focus:outline-none focus:border-border-focus"
					>
						{SORT_OPTIONS.map(s => (
							<option key={s.label}>{s.label}</option>
						))}
					</select>
					<Icon
						as={AltArrowDownSvg}
						size="sm"
						color="secondary"
						className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
					/>
				</div>
			</div>
		</div>
	)
}

// ─── Experiences: Saved Experiences Card ──────────────────────────────────────

function SavedExperiencesCard() {
	const [events, setEvents] = useState<SavedEvent[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		getSavedEvents({ limit: 3 })
			.then(res => setEvents(res.data))
			.catch(() => {})
			.finally(() => setLoading(false))
	}, [])

	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<div className="flex items-center justify-between gap-2 mb-4">
				<span className="text-body-md font-semibold text-text-primary">Saved experiences</span>
				<Link
					href="/attendee/my-events"
					className="flex items-center gap-1 text-sm text-text-brand font-medium hover:underline shrink-0"
				>
					View all
					<Icon as={ArrowRightSvg} size="xs" color="brand" />
				</Link>
			</div>

			{loading ? (
				<div className="flex flex-col gap-3">
					{Array.from({ length: 2 }).map((_, i) => (
						<Skeleton.SavedItem key={i} />
					))}
				</div>
			) : events.length === 0 ? (
				<p className="text-label-sm text-text-secondary">No saved experiences yet.</p>
			) : (
				<div className="flex flex-col gap-3">
					{events.map(event => (
						<div key={event.id} className="flex items-center gap-3">
							<div className="relative size-12 rounded-action overflow-hidden shrink-0 border border-border-default bg-surface-hover">
								<Image
									src={event.coverImageUrl}
									alt={event.title}
									fill
									sizes="48px"
									className="object-cover"
								/>
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-label-sm font-semibold text-text-primary truncate">
									{event.title}
								</p>
								<p className="text-[11px] text-text-secondary mt-0.5">
									{event.eventDate} · {event.startTime}
								</p>
							</div>
							<Icon as={BookmarkSvg} size="sm" color="brand" />
						</div>
					))}
				</div>
			)}
		</div>
	)
}

// ─── Experiences: Community Hosts Card ───────────────────────────────────────

// Mock kept for reference — replaced by real API data:
// const MOCK_EXPERIENCE_HOSTS = [
// 	{ id: "eh1", name: "Beatcurate", avatarUrl: "https://i.pravatar.cc/40?img=20", eventCount: "120+ events" },
// 	{ id: "eh2", name: "Luna Nights", avatarUrl: "https://i.pravatar.cc/40?img=21", eventCount: "80+ events" },
// 	{ id: "eh3", name: "Rooftop Collective", avatarUrl: "https://i.pravatar.cc/40?img=22", eventCount: "60+ events" },
// ]

function ExperiencesCommunityHostsCard({ hosts }: { hosts: CommunityHost[] | null }) {
	if (!hosts || hosts.length === 0) return null

	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<div className="flex items-center justify-between gap-2 mb-4">
				<span className="text-body-md font-semibold text-text-primary">Community hosts</span>
				{/* TODO: Link to /communities/[slug]/hosts once sub-page is built */}
				<Link
					href="#"
					className="flex items-center gap-1 text-sm text-text-brand font-medium hover:underline shrink-0"
				>
					View all
					<Icon as={ArrowRightSvg} size="xs" color="brand" />
				</Link>
			</div>

			<div className="flex flex-col gap-3">
				{hosts.map((host, i) => (
					<div key={i} className="flex items-center gap-3">
						<HostAvatar avatarUrl={host.avatarUrl} name={host.brandName} />
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-1">
								<p className="text-label-sm font-semibold text-text-primary truncate">
									{host.brandName}
								</p>
								<Icon as={VerifiedSvg} size="xs" color="brand" className="shrink-0" />
							</div>
							{/* tagline field not in API */}
							<p className="text-[11px] text-text-secondary">
								Host · {host.eventCount} {host.eventCount === 1 ? "experience" : "experiences"}
							</p>
						</div>
						<Icon as={ArrowRightSvg} size="sm" color="primary" />
					</div>
				))}
			</div>
		</div>
	)
}

// ─── Experiences: Suggest Experience Card ────────────────────────────────────


// ─── Chat: Upcoming Experiences Card ─────────────────────────────────────────

function fmtEventDate(date: string) {
	return new Date(date + "T00:00:00").toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })
}

function fmtEventTime(time: string) {
	const [h, m] = time.split(":")
	const d = new Date()
	d.setHours(parseInt(h, 10), parseInt(m, 10))
	return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })
}

function ChatUpcomingExperiencesCard({ communitySlug, onViewAll }: { communitySlug: string; onViewAll?: () => void }) {
	const [events, setEvents] = useState<CommunityEvent[]>([])

	useEffect(() => {
		getCommunityEvents(communitySlug, { upcoming: true, limit: 3 })
			.then(res => setEvents(res.data))
			.catch(() => {})
	}, [communitySlug])

	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<div className="flex items-center justify-between gap-2 mb-4">
				<span className="text-body-md font-semibold text-text-primary">
					Upcoming Experiences
				</span>
				<button
					type="button"
					onClick={onViewAll}
					className="flex items-center gap-1 text-sm text-text-brand font-medium hover:underline shrink-0"
				>
					View all
					<Icon as={ArrowRightSvg} size="xs" color="brand" />
				</button>
			</div>

			{events.length === 0 ? (
				<p className="text-label-sm text-text-muted text-center py-4">No upcoming experiences.</p>
			) : (
				<div className="flex flex-col gap-4">
					{events.map(event => (
						<div key={event.id} className="flex items-start gap-3">
							<div className="relative size-14 rounded-action overflow-hidden shrink-0 border border-border-default bg-surface-hover">
								{event.coverImageUrl && (
									<Image src={event.coverImageUrl} alt={event.title} fill sizes="56px" className="object-cover" />
								)}
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-label-sm font-semibold text-text-primary leading-tight truncate">
									{event.title}
								</p>
								<p className="text-[11px] text-text-secondary mt-0.5">
									{fmtEventDate(event.eventDate)} · {fmtEventTime(event.startTime)}
								</p>
								<p className="text-[11px] text-text-muted mt-0.5 truncate">{event.venueName}</p>
								{event.attendeeCount > 0 && (
									<p className="text-[11px] text-text-secondary mt-1">{event.attendeeCount} going</p>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}




// ─── Members: Community At a Glance Card ─────────────────────────────────────

// Mock kept for reference — replaced by real stats API data:
// const COMMUNITY_GLANCE_STATS = [
// 	{ icon: UsersGroupSvg, value: "1.6k", label: "Total members", iconBg: "bg-blue-100", iconColor: "info" },
// 	{ icon: PulseFilledSvg, value: "18", label: "Online now", iconBg: "bg-green-100", iconColor: "success" },   // no API field
// 	{ icon: StarOutlinedSvg, value: "42", label: "New this week", iconBg: "bg-purple-100", iconColor: "vibe" },
// 	{ icon: HeartsFilledSvg, value: "238", label: "Most active this week", iconBg: "bg-red-100", iconColor: "brand" }, // no API field
// ]

function fmtCount(n: number) {
	if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
	return String(n)
}

function MembersCommunityAtAGlanceCard({ stats }: { stats: CommunityStats | null }) {
	const items = [
		{ icon: UsersGroupSvg, value: stats ? fmtCount(stats.memberCount) : "—", label: "Total members", iconBg: "bg-blue-100", iconColor: "info" as const },
		{ icon: StarOutlinedSvg, value: stats ? String(stats.newMembersThisWeek) : "—", label: "New this week", iconBg: "bg-purple-100", iconColor: "vibe" as const },
		{ icon: HeartsFilledSvg, value: stats ? String(stats.hostCount) : "—", label: "Hosts", iconBg: "bg-red-100", iconColor: "brand" as const },
		// "Online now" — no API field: { icon: PulseFilledSvg, value: "—", label: "Online now", iconBg: "bg-green-100", iconColor: "success" }
		// "Most active this week" — no API field: { icon: HeartsFilledSvg, value: "—", label: "Most active", ... }
	]

	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<div className="flex items-center justify-between gap-2 mb-4">
				<span className="text-body-md font-semibold text-text-primary">Community at a glance</span>
			</div>

			<div className="grid grid-cols-2 gap-2">
				{items.map(stat => (
					<div
						key={stat.label}
						className="p-3 rounded-action bg-surface-page border border-border-default flex items-start gap-2.5"
					>
						<div className={`size-8 rounded-full ${stat.iconBg} flex items-center justify-center shrink-0`}>
							<Icon as={stat.icon} size="sm" color={stat.iconColor} />
						</div>
						<div className="min-w-0">
							<p className="text-body-sm font-bold text-text-primary">{stat.value}</p>
							<p className="text-[11px] text-text-secondary leading-tight mt-0.5">{stat.label}</p>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

// ─── Members: Top Hosts Card ──────────────────────────────────────────────────

function MembersTopHostsCard({ hosts }: { hosts: CommunityHost[] | null }) {
	if (!hosts || hosts.length === 0) return null

	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<div className="flex items-center justify-between gap-2 mb-4">
				<span className="text-body-md font-semibold text-text-primary">Top hosts</span>
				<Link href="#" className="flex items-center gap-1 text-sm text-text-brand font-medium hover:underline shrink-0">
					View all
					<Icon as={ArrowRightSvg} size="xs" color="brand" />
				</Link>
			</div>

			<div className="flex flex-col gap-3">
				{hosts.map((host, i) => (
					<div key={i} className="flex items-center gap-3">
						<HostAvatar avatarUrl={host.avatarUrl} name={host.brandName} />
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-1">
								<p className="text-label-sm font-semibold text-text-primary truncate">{host.brandName}</p>
								<Icon as={VerifiedSvg} size="xs" color="brand" className="shrink-0" />
							</div>
							{/* tagline field not in API */}
							<p className="text-[11px] text-text-secondary">
								Host · {host.eventCount} {host.eventCount === 1 ? "experience" : "experiences"}
							</p>
						</div>
						<Icon as={ArrowRightSvg} size="sm" color="primary" />
					</div>
				))}
			</div>
		</div>
	)
}

// ─── Members: New Members Card ────────────────────────────────────────────────

function joinedAgo(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime()
	const days = Math.floor(diff / 86400000)
	if (days < 1) return "today"
	if (days === 1) return "yesterday"
	if (days < 7) return `${days} days ago`
	const weeks = Math.floor(days / 7)
	if (weeks === 1) return "1 week ago"
	if (weeks < 5) return `${weeks} weeks ago`
	return `${Math.floor(days / 30)} months ago`
}

function NewMembersCard({ communityId }: { communityId: string }) {
	const [members, setMembers] = useState<CommunityMember[]>([])

	useEffect(() => {
		getCommunityMembers(communityId, { sort: "newest", limit: 10 })
			.then(res => setMembers(res.data))
			.catch(() => {})
	}, [communityId])

	if (members.length === 0) return null

	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<div className="mb-4">
				<span className="text-body-md font-semibold text-text-primary">New members</span>
			</div>

			<div className="flex flex-col gap-3">
				{members.map(member => {
					const fullName = `${member.firstName} ${member.lastName}`
					const color = avatarColor(fullName)
					return (
						<div key={member.userId} className="flex items-center gap-3">
							{member.avatarUrl ? (
								<div className="relative size-9 rounded-full overflow-hidden shrink-0 border border-border-default bg-surface-hover">
									<Image src={member.avatarUrl} alt={fullName} fill sizes="36px" className="object-cover" />
								</div>
							) : (
								<div className={`size-9 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold ${color.bg} ${color.text}`}>
									{fullName.slice(0, 2).toUpperCase()}
								</div>
							)}
							<div className="flex-1 min-w-0">
								<p className="text-label-sm font-semibold text-text-primary truncate">{fullName}</p>
								<p className="text-[11px] text-text-secondary">Joined {joinedAgo(member.joinedAt)}</p>
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}


// ─── Announcements: Trusted Hosts Card ───────────────────────────────────────

function AnnouncementsTrustedHostsCard({ hosts }: { hosts: CommunityHost[] | null }) {
	const visible = hosts?.slice(0, 2)
	if (!visible || visible.length === 0) return null

	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<div className="flex items-center justify-between gap-2 mb-4">
				<span className="text-body-md font-semibold text-text-primary">Trusted hosts</span>
				<Link href="#" className="flex items-center gap-1 text-sm text-text-brand font-medium hover:underline shrink-0">
					View all
					<Icon as={ArrowRightSvg} size="xs" color="brand" />
				</Link>
			</div>

			<div className="flex flex-col gap-3">
				{visible.map((host, i) => (
					<div key={i} className="flex items-center gap-3">
						<HostAvatar avatarUrl={host.avatarUrl} name={host.brandName} />
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-1">
								<p className="text-label-sm font-semibold text-text-primary truncate">
									{host.brandName}
								</p>
								<Icon as={VerifiedSvg} size="xs" color="brand" className="shrink-0" />
							</div>
							{/* tagline field not in API */}
							<p className="text-[11px] text-text-secondary">
								Host · {host.eventCount} {host.eventCount === 1 ? "experience" : "experiences"}
							</p>
						</div>
						<Icon as={ArrowRightSvg} size="sm" color="primary" />
					</div>
				))}
			</div>
		</div>
	)
}


// ─── Feed: Popular Posts Card ─────────────────────────────────────────────────

const WINDOW_OPTIONS = [
	{ label: "This week", days: 7 },
	{ label: "This month", days: 30 },
]

function PopularPostsCard({ communityId }: { communityId: string }) {
	const [windowDays, setWindowDays] = useState(7)
	const [posts, setPosts] = useState<FeedPost[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		void Promise.resolve().then(() => setLoading(true))
		getCommunityPopularPosts(communityId, { windowDays, limit: 5 })
			.then(setPosts)
			.catch(() => setPosts([]))
			.finally(() => setLoading(false))
	}, [communityId, windowDays])

	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			{/* Header */}
			<div className="flex items-center justify-between gap-2 mb-3">
				<span className="text-body-md font-semibold text-text-primary">Popular Posts</span>
				{/* Window toggle */}
				<div className="flex items-center gap-0.5 bg-surface-page border border-border-default rounded-full p-0.5">
					{WINDOW_OPTIONS.map(opt => (
						<button
							key={opt.days}
							type="button"
							onClick={() => setWindowDays(opt.days)}
							className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
								windowDays === opt.days
									? "bg-action-primary text-white"
									: "text-text-secondary hover:text-text-primary"
							}`}
						>
							{opt.label}
						</button>
					))}
				</div>
			</div>

			{loading ? (
				<div className="flex flex-col gap-3">
					{[1, 2, 3].map(i => (
						<Skeleton.ListItem key={i} lines={3} />
					))}
				</div>
			) : posts.length === 0 ? (
				<p className="text-label-sm text-text-muted text-center py-3">No popular posts yet.</p>
			) : (
				<div className="flex flex-col divide-y divide-border-default">
					{posts.map(post => {
						const authorInitials = post.author.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
						const color = avatarColor(post.author.name)
						return (
							<div key={post.id} className="flex items-start gap-2.5 py-3 first:pt-0 last:pb-0">
								{/* Author avatar */}
								{post.author.avatarUrl ? (
									<div className="relative size-7 rounded-full overflow-hidden shrink-0 border border-border-default bg-surface-hover">
										<Image src={post.author.avatarUrl} alt={post.author.name} fill sizes="28px" className="object-cover" />
									</div>
								) : (
									<div className={`size-7 rounded-full ${color.bg} border ${color.border} flex items-center justify-center shrink-0`}>
										<span className={`text-[9px] font-bold ${color.text}`}>{authorInitials}</span>
									</div>
								)}

								<div className="flex-1 min-w-0">
									<p className="text-[11px] font-semibold text-text-primary">{post.author.name}</p>
									{post.content && (
										<p className="text-[11px] text-text-secondary leading-snug mt-0.5 line-clamp-2">
											{post.content}
										</p>
									)}
									<div className="flex items-center gap-3 mt-1.5">
										<span className="flex items-center gap-1 text-[10px] text-text-muted">
											<Icon as={HeartSvg} size="xs" color="muted" />
											{post.counts.reactions}
										</span>
										<span className="flex items-center gap-1 text-[10px] text-text-muted">
											<Icon as={ChatDotsSvg} size="xs" color="muted" />
											{post.counts.comments}
										</span>
									</div>
								</div>
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}

// ─── Feed: Saved Posts Card ───────────────────────────────────────────────────

function SavedPostsCard({ communityId }: { communityId: string }) {
	const [posts, setPosts] = useState<FeedPost[]>([])
	const [loading, setLoading] = useState(true)

	const fetchPosts = useCallback(() => {
		getCommunityBookmarkedPosts(communityId)
			.then(setPosts)
			.catch(() => setPosts([]))
			.finally(() => setLoading(false))
	}, [communityId])

	useEffect(() => { fetchPosts() }, [fetchPosts])

	useEffect(() => {
		const handler = (e: Event) => {
			if ((e as CustomEvent<{ communityId: string }>).detail?.communityId === communityId) fetchPosts()
		}
		window.addEventListener("feed:bookmark-changed", handler)
		return () => window.removeEventListener("feed:bookmark-changed", handler)
	}, [communityId, fetchPosts])

	if (!loading && posts.length === 0) return null

	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<div className="flex items-center justify-between gap-2 mb-3">
				<div className="flex items-center gap-2">
					<Icon as={BookmarkSvg} size="sm" color="brand" />
					<span className="text-body-md font-semibold text-text-primary">Saved Posts</span>
				</div>
				<span className="text-[11px] text-text-muted font-medium">
					{!loading ? `${posts.length} saved` : ""}
				</span>
			</div>

			{loading ? (
				<div className="flex flex-col gap-3">
					{[1, 2].map(i => (
						<Skeleton.ListItem key={i} avatarSize="xs" />
					))}
				</div>
			) : (
				<div className="flex flex-col divide-y divide-border-default">
					{posts.map(post => {
						const authorInitials = post.author.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
						const color = avatarColor(post.author.name)
						return (
							<div key={post.id} className="flex items-start gap-2.5 py-3 first:pt-0 last:pb-0">
								{post.author.avatarUrl ? (
									<div className="relative size-7 rounded-full overflow-hidden shrink-0 border border-border-default bg-surface-hover">
										<Image src={post.author.avatarUrl} alt={post.author.name} fill sizes="28px" className="object-cover" />
									</div>
								) : (
									<div className={`size-7 rounded-full ${color.bg} border ${color.border} flex items-center justify-center shrink-0`}>
										<span className={`text-[9px] font-bold ${color.text}`}>{authorInitials}</span>
									</div>
								)}
								<div className="flex-1 min-w-0">
									<p className="text-[11px] font-semibold text-text-primary">{post.author.name}</p>
									{post.content && (
										<p className="text-[11px] text-text-secondary leading-snug mt-0.5 line-clamp-2">
											{post.content}
										</p>
									)}
									{post.mediaUrls.length > 0 && !post.content && (
										<p className="text-[11px] text-text-muted italic mt-0.5">Photo post</p>
									)}
									{post.poll && !post.content && (
										<p className="text-[11px] text-text-muted italic mt-0.5">Poll · {post.poll.totalVotes} votes</p>
									)}
								</div>
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}

// ─── Feed: Trending Topics Card ───────────────────────────────────────────────

const TOPICS_PREVIEW = 5

function TrendingTopicsCard({ communityId }: { communityId: string }) {
	const [topics, setTopics] = useState<TrendingTopic[]>([])
	const [expanded, setExpanded] = useState(false)

	useEffect(() => {
		getCommunityTrendingTopics(communityId, { limit: 10 }).then(setTopics).catch(() => {})
	}, [communityId])

	if (topics.length === 0) return null

	const visible = expanded ? topics : topics.slice(0, TOPICS_PREVIEW)
	const hasMore = topics.length > TOPICS_PREVIEW

	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<div className="flex items-center justify-between gap-2 mb-4">
				<span className="text-body-md font-semibold text-text-primary">Trending Topics</span>
				{hasMore && (
					<button
						type="button"
						onClick={() => setExpanded(e => !e)}
						className="flex items-center gap-1 text-sm text-text-brand font-medium hover:underline shrink-0"
					>
						{expanded ? "Show less" : "See all"}
						<Icon as={ArrowRightSvg} size="xs" color="brand" className={expanded ? "rotate-180" : ""} />
					</button>
				)}
			</div>

			<div className="flex flex-col gap-2.5">
				{visible.map((t, _i) => (
					<div key={t.topic} className="flex items-center gap-3">
						<Icon as={FireSvg} size="sm" color="brand" className="shrink-0" />
						<span className="flex-1 text-label-sm font-normal text-text-primary truncate">
							{t.topic}
						</span>
						<span className="text-[11px] text-text-muted font-medium shrink-0 tabular-nums">
							{t.postCount} {t.postCount === 1 ? "post" : "posts"}
						</span>
					</div>
				))}
			</div>
		</div>
	)
}

// ─── Composed Side Panel ──────────────────────────────────────────────────────

export function CommunitySidePanel({
	activeTab,
	isMember,
	onJoinClick,
	communitySlug,
	communityId,
	onTabChange,
	experienceFilters,
	onExperienceFilterChange,
}: {
	activeTab: string
	isMember: boolean
	onJoinClick: () => void
	communitySlug: string
	communityId: string
	onTabChange?: (tab: string) => void
	experienceFilters?: ExperienceFilters
	onExperienceFilterChange?: (f: ExperienceFilters) => void
}) {
	const [stats, setStats] = useState<CommunityStats | null>(null)
	const [hosts, setHosts] = useState<CommunityHost[] | null>(null)

	useEffect(() => {
		if (!isMember) return
		getCommunityStats(communitySlug).then(setStats).catch(() => {})
		getCommunityHosts(communitySlug).then(setHosts).catch(() => {})
	}, [communitySlug, isMember])

	if (activeTab === "experiences") {
		const filters = experienceFilters ?? DEFAULT_EXPERIENCE_FILTERS
		return (
			<>
				<ExperiencesFilterCard filters={filters} onChange={onExperienceFilterChange ?? (() => {})} />
				<SavedExperiencesCard />
				<ExperiencesCommunityHostsCard hosts={hosts} />
			</>
		)
	}

	if (activeTab === "chat") {
		return (
			<>
				<ChatUpcomingExperiencesCard communitySlug={communitySlug} onViewAll={() => onTabChange?.("experiences")} />
				<CommunityGuidelinesCard />
			</>
		)
	}

	if (activeTab === "members") {
		return (
			<>
				<MembersCommunityAtAGlanceCard stats={stats} />
				<MembersTopHostsCard hosts={hosts} />
				<NewMembersCard communityId={communityId} />
			</>
		)
	}

	if (activeTab === "feed") {
		return (
			<>
				<TrendingTopicsCard communityId={communityId} />
				<PopularPostsCard communityId={communityId} />
				<SavedPostsCard communityId={communityId} />
				<CommunityGuidelinesCard />
			</>
		)
	}

	if (activeTab === "announcements") {
		return (
			<>
				<ChatUpcomingExperiencesCard communitySlug={communitySlug} onViewAll={() => onTabChange?.("experiences")} />
				<AnnouncementsTrustedHostsCard hosts={hosts} />
				<CommunityGuidelinesCard />
			</>
		)
	}

	// Default: overview
	return (
		<>
			<WhyJoinCard isMember={isMember} onJoinClick={onJoinClick} />
			<PeopleInCommunityCard isMember={isMember} communityId={communityId} />
			<TrustedHostsCard hosts={hosts} />
			<CommunityGuidelinesCard />
		</>
	)
}
