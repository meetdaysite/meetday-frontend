"use client"

import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import SearchSvg from "@/icons/outlined/search.svg"
import Image from "next/image"
import { useEffect, useState, useRef } from "react"
import AltArrowDownSvg from "@/icons/outlined/alt-arrow-down.svg"
import AltArrowUpSvg from "@/icons/outlined/alt-arrow-up.svg"
import ChatSvg from "@/icons/outlined/chat.svg"
import type { CommunityMember, CommunityRole, MemberBadge, MemberDetailCard } from "@/lib/api"
import { getCommunityMemberDetail, getCommunityMembers } from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"
import { useAttendeeProfileStore } from "@/store/attendeeProfileStore"
import type { DrawerMember } from "./MemberProfileDrawer"
import { MemberProfileDrawer } from "./MemberProfileDrawer"
import { Skeleton } from "@/components/ui/Skeleton"

// ─── Feature flags ─────────────────────────────────────────────────────────────
// Set SHOW_FEATURED_MEMBERS to true once the featured members API endpoint is available
const SHOW_FEATURED_MEMBERS = false

// ─── API role config ───────────────────────────────────────────────────────────

const API_ROLE_CONFIG: Record<CommunityRole, { label: string; textClass: string }> = {
	OWNER: { label: "Owner", textClass: "text-violet-600" },
	MANAGER: { label: "Manager", textClass: "text-amber-600" },
	HOST: { label: "Host", textClass: "text-blue-600" },
	MODERATOR: { label: "Moderator", textClass: "text-teal-600" },
	MEMBER: { label: "Member", textClass: "text-blue-600" },
}

function ApiRoleBadge({ role }: { role: CommunityRole }) {
	const config = API_ROLE_CONFIG[role] ?? API_ROLE_CONFIG.MEMBER
	return <span className={`text-[11px] font-normal text-text-secondary`}>{config.label}</span>
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

// ─── Filter / sort options ─────────────────────────────────────────────────────

const FILTER_OPTIONS = [
	{ id: "all", label: "All Members" },
	{ id: "online", label: "• Online Now" }, // TODO: requires online status field in API
	{ id: "new", label: "New Members" },
	{ id: "active", label: "Most Active" },
	{ id: "attended", label: "Attended Experiences" },
	{ id: "hosts", label: "Hosts" },
]

const SORT_OPTIONS = [
	{ value: "recentlyActive", label: "Recently Active" },
	{ value: "newest", label: "Newest" },
	{ value: "mostActive", label: "Most Active" },
	{ value: "alphabetical", label: "Alphabetical" },
] as const
type SortOption = (typeof SORT_OPTIONS)[number]["value"]

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
		<div className="flex items-center gap-3 px-3 py-2.5 rounded-action border border-border-default bg-surface-page">
			<Skeleton.Avatar size="sm" className="size-9" />
			<div className="flex flex-col gap-1.5 flex-1">
				<Skeleton.Text className="w-24" />
				<Skeleton.Block className="h-4 w-14 rounded-full" />
			</div>
			<Skeleton.Block className="h-6 w-16 rounded-full shrink-0" />
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

export function MembersTabContent({ communityId, onOpenDM }: { communityId: string; onOpenDM?: (conversationId: string) => void }) {
	const backendUserId = useAttendeeProfileStore(s => s.profile?.id ?? null)

	const [activeFilter, setActiveFilter] = useState("all")
	const [sort, setSort] = useState<SortOption>("recentlyActive")
	const [sortOpen, setSortOpen] = useState(false)
	const [search, setSearch] = useState("")
	const [debouncedSearch, setDebouncedSearch] = useState("")
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
		if (debounceRef.current) clearTimeout(debounceRef.current)
		debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300)
	}, [search])

	useEffect(() => {
		void Promise.resolve().then(() => {
			setLoading(true)
			setError(null)
		})
		getCommunityMembers(communityId, {
			page: 1,
			limit: LIMIT,
			filter: activeFilter,
			sort,
			search: debouncedSearch || undefined,
		})
			.then(res => {
				setMembers(res.data)
				setTotal(res.total)
				setPage(1)
			})
			.catch(err => setError(getApiErrorMessage(err)))
			.finally(() => setLoading(false))
	}, [communityId, activeFilter, sort, debouncedSearch])

	const handleLoadMore = () => {
		const nextPage = page + 1
		setLoadingMore(true)
		getCommunityMembers(communityId, {
			page: nextPage,
			limit: LIMIT,
			filter: activeFilter,
			sort,
			search: debouncedSearch || undefined,
		})
			.then(res => {
				setMembers(prev => [...prev, ...res.data])
				setTotal(res.total)
				setPage(nextPage)
			})
			.catch(err => setError(getApiErrorMessage(err)))
			.finally(() => setLoadingMore(false))
	}

	const hasMore = members.length < total

	return (
		<>
			<div className="rounded-action bg-surface-card border border-border-default p-5 flex flex-col gap-5  shadow-md">
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
						<div className="flex items-center gap-2 px-3 py-2 rounded-action border border-border-default bg-surface-page w-64">
							<Icon as={SearchSvg} size="sm" color="muted" />
							<input
								type="text"
								value={search}
								onChange={e => setSearch(e.target.value)}
								placeholder="Search members by name or keyword..."
								className="flex-1 text-[11px] text-text-primary placeholder:text-text-muted bg-transparent outline-none"
							/>
						</div>
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
							Sort by:{" "}
							<span className="text-text-primary font-semibold">
								{SORT_OPTIONS.find(o => o.value === sort)?.label}
							</span>
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
										key={opt.value}
										type="button"
										onClick={() => {
											setSort(opt.value)
											setSortOpen(false)
										}}
										className={`w-full px-3 py-2 text-left text-label-sm transition-colors ${
											sort === opt.value
												? "text-text-brand font-semibold bg-surface-brand-soft"
												: "text-text-primary hover:bg-surface-hover"
										}`}
									>
										{opt.label}
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
									getCommunityMembers(communityId, {
										page: 1,
										limit: LIMIT,
										filter: activeFilter,
										sort,
									})
										.then(res => {
											setMembers(res.data)
											setTotal(res.total)
											setPage(1)
										})
										.catch(err => setError(getApiErrorMessage(err)))
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
				onOpenDM={onOpenDM}
			/>
		</>
	)
}
