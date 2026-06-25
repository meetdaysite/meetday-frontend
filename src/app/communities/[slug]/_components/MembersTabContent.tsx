"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import SearchSvg from "@/icons/outlined/search.svg"
import WidgetsSvg from "@/icons/outlined/widgets.svg"
// import MapPointSvg from "@/icons/outlined/map-point.svg"       // city — not in API
// import CalendarSvg from "@/icons/outlined/calendar.svg"        // eventsAttended — not in API
import ChatSvg from "@/icons/outlined/chat.svg"
import AltArrowDownSvg from "@/icons/outlined/alt-arrow-down.svg"
import AltArrowUpSvg from "@/icons/outlined/alt-arrow-up.svg"
import { getCommunityMembers, getCommunityMemberDetail } from "@/lib/api"
import type { CommunityMember, MemberBadge, MemberDetailCard } from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"
import { MemberProfileDrawer } from "./MemberProfileDrawer"
import type { DrawerMember } from "./MemberProfileDrawer"
import { useAttendeeProfileStore } from "@/store/attendeeProfileStore"

// ─── Feature flags ─────────────────────────────────────────────────────────────
// Set SHOW_FEATURED_MEMBERS to true once the featured members API endpoint is available
const SHOW_FEATURED_MEMBERS = false

// ─── API role config ───────────────────────────────────────────────────────────

type ApiRole = "OWNER" | "ADMIN" | "MEMBER"

const API_ROLE_CONFIG: Record<ApiRole, { label: string; pillClass: string; dotClass: string }> = {
	OWNER: {
		label: "Owner",
		pillClass: "bg-violet-50 text-violet-700 border-violet-200",
		dotClass: "bg-violet-500",
	},
	ADMIN: { label: "Admin", pillClass: "bg-teal-50 text-teal-700 border-teal-200", dotClass: "bg-teal-500" },
	MEMBER: {
		label: "Member",
		pillClass: "bg-surface-page text-text-secondary border-border-default",
		dotClass: "bg-gray-400",
	},
}

function ApiRoleBadge({ role }: { role: ApiRole }) {
	const config = API_ROLE_CONFIG[role] ?? API_ROLE_CONFIG.MEMBER
	return (
		<span
			className={`w-fit items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${config.pillClass}`}
		>
			{config.label}
		</span>
	)
}

// ─── Avatar with initials fallback ────────────────────────────────────────────

function MemberAvatar({
	avatarUrl,
	name,
	size = 10,
}: {
	avatarUrl: string | null
	name: string
	size?: number
}) {
	const initials = name
		.split(" ")
		.map(n => n[0])
		.slice(0, 2)
		.join("")
		.toUpperCase()
	const sizeClass = `size-${size}`

	if (!avatarUrl) {
		return (
			<div
				className={`${sizeClass} rounded-full bg-surface-brand-soft border border-border-default flex items-center justify-center shrink-0`}
			>
				<span className="text-[10px] font-bold text-text-brand">{initials}</span>
			</div>
		)
	}

	return (
		<div
			className={`relative ${sizeClass} rounded-full overflow-hidden border border-border-default bg-surface-hover shrink-0`}
		>
			<Image src={avatarUrl} alt={name} fill sizes={`${size * 4}px`} className="object-cover" />
		</div>
	)
}

// ─── Mock types & data for featured section (hidden behind SHOW_FEATURED_MEMBERS) ──

// NOTE: These types and mock data are kept for when the featured members API is ready.
// The featured section is hidden via SHOW_FEATURED_MEMBERS = false above.

// import type { DrawerMember } from "./MemberProfileDrawer"
// type MemberRole = "Top Contributor" | "New Member" | "Active Member"
// interface Member extends DrawerMember {
//   tags: string[]
//   eventsAttended: number
//   cardBg?: string
// }
// const MOCK_FEATURED_MEMBERS: Member[] = [
//   { id: "f1", name: "Arjun", avatarUrl: "https://i.pravatar.cc/40?img=6", role: "Top Contributor",
//     city: "Kolkata", tags: ["Techno", "Rooftop", "Late Nights"], eventsAttended: 8, online: true, cardBg: "bg-violet-50",
//     isVerified: true, vibe: "Night Owl", sharedInterests: ["Tech House", "Rooftops", "Late Nights"],
//     sharedExperiences: [
//       { id: "e1", title: "Night Rituals", date: "May 23", imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=300&h=200&fit=crop", status: "going" },
//       { id: "e2", title: "After Hours", date: "May 31", imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&h=200&fit=crop", status: "going" },
//     ], communityActivity: { joinedAgo: "2 months ago", experiencesAttended: 12, posts: 4, chatReplies: 28 } },
//   { id: "f2", name: "Megha", avatarUrl: "https://i.pravatar.cc/40?img=5", role: "New Member",
//     city: "Kolkata", tags: ["House", "Festivals", "Photography"], eventsAttended: 2, online: true, cardBg: "bg-emerald-50",
//     vibe: "Weekend Warrior", sharedInterests: ["House", "Festivals"], sharedExperiences: [
//       { id: "e1", title: "Night Rituals", date: "May 23", imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=300&h=200&fit=crop", status: "going" },
//     ], communityActivity: { joinedAgo: "3 weeks ago", experiencesAttended: 2, posts: 1, chatReplies: 5 } },
//   { id: "f3", name: "Rishav", avatarUrl: "https://i.pravatar.cc/40?img=17", role: "Top Contributor",
//     city: "Kolkata", tags: ["Tech House", "Travel", "Coffee"], eventsAttended: 12, online: true, cardBg: "bg-orange-50",
//     isVerified: true, vibe: "Night Owl", sharedInterests: ["Tech House", "Travel"], sharedExperiences: [
//       { id: "e2", title: "After Hours", date: "May 31", imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&h=200&fit=crop", status: "going" },
//     ], communityActivity: { joinedAgo: "6 months ago", experiencesAttended: 18, posts: 12, chatReplies: 64 } },
//   { id: "f4", name: "Ishita", avatarUrl: "https://i.pravatar.cc/40?img=4", role: "New Member",
//     city: "Kolkata", tags: ["Indie", "Art", "Live Music"], eventsAttended: 1, cardBg: "bg-yellow-50",
//     vibe: "Social Butterfly", sharedInterests: ["Live Music"],
//     communityActivity: { joinedAgo: "1 week ago", experiencesAttended: 1, posts: 0, chatReplies: 3 } },
//   { id: "f5", name: "Karan", avatarUrl: "https://i.pravatar.cc/40?img=11", role: "Active Member",
//     city: "Kolkata", tags: ["Techno", "Cycling", "Workshops"], eventsAttended: 6, cardBg: "bg-purple-50",
//     vibe: "Night Owl", sharedInterests: ["Techno"], sharedExperiences: [
//       { id: "e3", title: "Neon Nights", date: "Jun 06", imageUrl: "https://images.unsplash.com/photo-1598387993441-a364f854cfbd?w=300&h=200&fit=crop", status: "going" },
//     ], communityActivity: { joinedAgo: "1 month ago", experiencesAttended: 6, posts: 3, chatReplies: 19 } },
// ]

// ─── Filter / sort options ─────────────────────────────────────────────────────

const FILTER_OPTIONS = [
	{ id: "all", label: "All Members" },
	{ id: "online", label: "• Online Now" }, // TODO: requires online status field in API
	{ id: "new", label: "New Members" },
	{ id: "active", label: "Most Active" },
	{ id: "attended", label: "Attended Experiences" },
	{ id: "hosts", label: "Hosts" },
]

const SORT_OPTIONS = ["Recently Active", "Most Events", "New Members", "Alphabetical"] as const
type SortOption = (typeof SORT_OPTIONS)[number]

// ─── Member list row ───────────────────────────────────────────────────────────

function ApiMemberCard({
	member,
	onOpenDrawer,
}: {
	member: CommunityMember
	onOpenDrawer: (m: CommunityMember) => void
}) {
	const fullName = `${member.firstName} ${member.lastName}`

	return (
		<div
			className="flex items-center gap-3 px-3 py-2.5 rounded-action border border-border-default bg-surface-page cursor-pointer hover:bg-surface-hover transition-colors"
			onClick={() => onOpenDrawer(member)}
		>
			<MemberAvatar avatarUrl={member.avatarUrl} name={fullName} size={9} />

			<div className="flex flex-col gap-0.5 min-w-0 flex-1">
				<p className="text-label-sm font-bold text-text-primary truncate">{fullName}</p>
				<ApiRoleBadge role={member.role} />
			</div>

			<button
				type="button"
				onClick={e => {
					e.stopPropagation()
					onOpenDrawer(member)
				}}
				className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full border border-action-primary text-action-primary text-[11px] font-semibold hover:bg-surface-brand-soft transition-colors"
			>
				<Icon as={ChatSvg} size="xs" color="brand" />
				Say Hi
			</button>
		</div>
	)
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function MemberCardSkeleton() {
	return (
		<div className="flex items-center gap-3 px-3 py-2.5 rounded-action border border-border-default bg-surface-page animate-pulse">
			<div className="size-9 rounded-full bg-surface-hover shrink-0" />
			<div className="flex flex-col gap-1.5 flex-1">
				<div className="h-3 w-24 bg-surface-hover rounded" />
				<div className="h-4 w-14 bg-surface-hover rounded-full" />
			</div>
			<div className="h-6 w-16 bg-surface-hover rounded-full shrink-0" />
		</div>
	)
}

// ─── Detail mapping helpers ────────────────────────────────────────────────────

function badgeToRole(badge: MemberBadge | null): DrawerMember["role"] {
	if (badge === "TOP_CONTRIBUTOR") return "Top Contributor"
	if (badge === "ACTIVE_MEMBER") return "Active Member"
	return "New Member"
}

function mapDetailToDrawer(d: MemberDetailCard): DrawerMember {
	return {
		id: d.userId,
		name: `${d.firstName} ${d.lastName}`,
		avatarUrl: d.avatarUrl,
		role: badgeToRole(d.badge),
		city: d.city ?? "",
		online: d.isOnline,
		vibe: d.vibe ?? undefined,
		dmStatus: d.dmStatus,
		conversationId: d.conversationId ?? undefined,
		sharedInterests: d.sharedInterests?.map(i => i.name),
		sharedExperiences: d.sharedExperiences,
		communityActivity: d.communityActivity,
	}
}

// ─── Main component ────────────────────────────────────────────────────────────

const LIMIT = 20

export function MembersTabContent({ communityId }: { communityId: string }) {
	const backendUserId = useAttendeeProfileStore(s => s.profile?.id ?? null)

	const [activeFilter, setActiveFilter] = useState("all")
	const [sort, setSort] = useState<SortOption>("Recently Active")
	const [sortOpen, setSortOpen] = useState(false)

	const [members, setMembers] = useState<CommunityMember[]>([])
	const [total, setTotal] = useState(0)
	const [page, setPage] = useState(1)
	const [loading, setLoading] = useState(true)
	const [loadingMore, setLoadingMore] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const [selectedMember, setSelectedMember] = useState<DrawerMember | null>(null)
	const [drawerLoading, setDrawerLoading] = useState(false)

	const handleOpenDrawer = async (m: CommunityMember) => {
		// Open drawer immediately with list-level data so there's no blank wait
		setSelectedMember({
			id: m.userId,
			name: `${m.firstName} ${m.lastName}`,
			avatarUrl: m.avatarUrl,
			role: badgeToRole(null),
			city: "",
			dmStatus: "none",
		})
		setDrawerLoading(true)
		try {
			const detail = await getCommunityMemberDetail(communityId, m.userId)
			setSelectedMember(mapDetailToDrawer(detail))
		} catch {
			// Keep the stub — drawer is already open with basic info
		} finally {
			setDrawerLoading(false)
		}
	}

	useEffect(() => {
		setLoading(true)
		setError(null)
		getCommunityMembers(communityId, { page: 1, limit: LIMIT })
			.then(res => {
				setMembers(res.data)
				setTotal(res.total)
				setPage(1)
			})
			.catch((err) => setError(getApiErrorMessage(err)))
			.finally(() => setLoading(false))
	}, [communityId])

	const handleLoadMore = () => {
		const nextPage = page + 1
		setLoadingMore(true)
		getCommunityMembers(communityId, { page: nextPage, limit: LIMIT })
			.then(res => {
				setMembers(prev => [...prev, ...res.data])
				setTotal(res.total)
				setPage(nextPage)
			})
			.catch((err) => setError(getApiErrorMessage(err)))
			.finally(() => setLoadingMore(false))
	}

	const hasMore = members.length < total

	return (
		<>
			<div className="rounded-panel bg-surface-card border border-border-default p-5 flex flex-col gap-5">
				{/* Header */}
				<div className="flex items-start justify-between gap-4">
					<div>
						<h2 className="text-body-lg font-bold text-text-primary">Members</h2>
						<p className="text-label-sm text-text-secondary font-normal mt-0.5">
							{total > 0
								? `${total} member${total === 1 ? "" : "s"} in this community.`
								: "Connect with people in the community."}
						</p>
					</div>

					{/* Search + Filters */}
					<div className="flex items-center gap-2 shrink-0">
						{/* TODO: Wire search to GET /api/communities/[id]/members?q=[query] once API supports it */}
						<div className="flex items-center gap-2 px-3 py-2 rounded-action border border-border-default bg-surface-page w-64">
							<Icon as={SearchSvg} size="sm" color="muted" />
							<input
								type="text"
								placeholder="Search members by name or keyword..."
								className="flex-1 text-[11px] text-text-primary placeholder:text-text-muted bg-transparent outline-none"
								readOnly
							/>
						</div>
						{/* TODO: Wire filters to open filters panel */}
						<button
							type="button"
							className="flex items-center gap-2 px-3 py-2 rounded-action border border-border-default bg-surface-page text-label-sm text-text-primary font-medium hover:bg-surface-hover transition-colors"
						>
							<Icon as={WidgetsSvg} size="sm" color="secondary" />
							Filters
						</button>
					</div>
				</div>

				{/* Filter chips + Sort */}
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1">
						{FILTER_OPTIONS.map(opt => (
							<button
								key={opt.id}
								type="button"
								onClick={() => setActiveFilter(opt.id)}
								className={`px-3 py-1.5 rounded-full text-[12px] font-medium border whitespace-nowrap transition-colors shrink-0 ${
									activeFilter === opt.id
										? "border-text-primary text-text-primary bg-transparent"
										: "border-border-default text-text-secondary hover:text-text-primary hover:border-border-focus"
								}`}
							>
								{opt.label}
							</button>
						))}
					</div>

					{/* Sort dropdown */}
					<div className="relative shrink-0">
						<button
							type="button"
							onClick={() => setSortOpen(o => !o)}
							className="flex items-center gap-1.5 text-label-sm text-text-secondary font-medium hover:text-text-primary transition-colors whitespace-nowrap"
						>
							Sort by: <span className="text-text-primary font-semibold">{sort}</span>
							<Icon
								as={sortOpen ? AltArrowUpSvg : AltArrowDownSvg}
								size="xs"
								color="secondary"
							/>
						</button>

						{sortOpen && (
							<div className="absolute right-0 top-full mt-1.5 w-44 rounded-action bg-surface-card border border-border-default shadow-md z-10 overflow-hidden">
								{SORT_OPTIONS.map(opt => (
									<button
										key={opt}
										type="button"
										onClick={() => {
											setSort(opt)
											setSortOpen(false)
										}}
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

				{/* Featured members — hidden until featured members API is available */}
				{SHOW_FEATURED_MEMBERS && (
					<div>
						<p className="text-body-sm font-semibold text-text-primary mb-3">Featured members</p>
						{/* TODO: Render FeaturedMemberCard grid here once GET /api/communities/{id}/members?featured=true is available */}
					</div>
				)}

				{/* All members */}
				<div>
					<p className="text-body-sm font-semibold text-text-primary mb-2">All members</p>

					{loading ? (
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
							{Array.from({ length: 8 }).map((_, i) => (
								<MemberCardSkeleton key={i} />
							))}
						</div>
					) : error ? (
						<div className="py-8 flex flex-col items-center gap-3 text-center">
							<p className="text-label-sm text-text-secondary">{error}</p>
							<Button
								variant="secondary"
								size="sm"
								onClick={() => {
									setLoading(true)
									setError(null)
									getCommunityMembers(communityId, { page: 1, limit: LIMIT })
										.then(res => {
											setMembers(res.data)
											setTotal(res.total)
											setPage(1)
										})
										.catch((err) => setError(getApiErrorMessage(err)))
										.finally(() => setLoading(false))
								}}
							>
								Retry
							</Button>
						</div>
					) : members.length === 0 ? (
						<div className="py-8 text-center">
							<p className="text-label-sm text-text-secondary">
								The member directory for this community is private.
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-3">
							{members.map(member => (
								<ApiMemberCard
									key={member.userId}
									member={member}
									onOpenDrawer={handleOpenDrawer}
								/>
							))}
						</div>
					)}
				</div>

				{/* Load more */}
				{!loading && !error && hasMore && (
					<button
						type="button"
						disabled={loadingMore}
						onClick={handleLoadMore}
						className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-action border border-border-default text-label-sm text-text-brand font-semibold hover:bg-surface-brand-soft transition-colors disabled:opacity-50"
					>
						{loadingMore ? "Loading…" : "Load more members"}
						{!loadingMore && <Icon as={AltArrowDownSvg} size="xs" color="brand" />}
					</button>
				)}
			</div>

			<MemberProfileDrawer
				member={selectedMember}
				communityId={communityId}
				currentUserId={backendUserId}
				detailLoading={drawerLoading}
				onClose={() => {
					setSelectedMember(null)
					setDrawerLoading(false)
				}}
			/>
		</>
	)
}
