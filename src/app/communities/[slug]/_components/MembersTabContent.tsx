"use client"

import { useState } from "react"
import Image from "next/image"
import { Icon } from "@/components/ui/Icon"
import SearchSvg from "@/icons/outlined/search.svg"
import WidgetsSvg from "@/icons/outlined/widgets.svg"
import StarSvg from "@/icons/outlined/star.svg"
import MapPointSvg from "@/icons/outlined/map-point.svg"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import ChatSvg from "@/icons/outlined/chat.svg"
import BookmarkSvg from "@/icons/outlined/bookmark.svg"
import DotsSvg from "@/icons/outlined/dots.svg"
import AltArrowDownSvg from "@/icons/outlined/alt-arrow-down.svg"
import AltArrowUpSvg from "@/icons/outlined/alt-arrow-up.svg"
import { MemberProfileDrawer } from "./MemberProfileDrawer"
import type { DrawerMember } from "./MemberProfileDrawer"

// ─── Types & mock data ────────────────────────────────────────────────────────

type MemberRole = "Top Contributor" | "New Member" | "Active Member"

interface Member extends DrawerMember {
	tags: string[]
	eventsAttended: number
	cardBg?: string
}

const ROLE_CONFIG: Record<MemberRole, { textClass: string; iconColor: "vibe" | "success" }> = {
	"Top Contributor": { textClass: "text-violet-600", iconColor: "vibe" },
	"New Member": { textClass: "text-violet-600", iconColor: "vibe" },
	"Active Member": { textClass: "text-teal-600", iconColor: "success" },
}

// TODO: Replace with real data from GET /api/communities/[id]/members?featured=true
const MOCK_FEATURED_MEMBERS: Member[] = [
	{
		id: "f1", name: "Arjun", avatarUrl: "https://i.pravatar.cc/40?img=6", role: "Top Contributor",
		city: "Kolkata", tags: ["Techno", "Rooftop", "Late Nights"], eventsAttended: 8, online: true, cardBg: "bg-violet-50",
		isVerified: true, vibe: "Night Owl",
		sharedInterests: ["Tech House", "Rooftops", "Late Nights"],
		sharedExperiences: [
			{ id: "e1", title: "Night Rituals", date: "May 23", imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=300&h=200&fit=crop", status: "going" },
			{ id: "e2", title: "After Hours", date: "May 31", imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&h=200&fit=crop", status: "going" },
			{ id: "e3", title: "Neon Nights", date: "Jun 06", imageUrl: "https://images.unsplash.com/photo-1598387993441-a364f854cfbd?w=300&h=200&fit=crop", status: "interested" },
		],
		communityActivity: { joinedAgo: "2 months ago", experiencesAttended: 12, posts: 4, chatReplies: 28 },
	},
	{
		id: "f2", name: "Megha", avatarUrl: "https://i.pravatar.cc/40?img=5", role: "New Member",
		city: "Kolkata", tags: ["House", "Festivals", "Photography"], eventsAttended: 2, online: true, cardBg: "bg-emerald-50",
		vibe: "Weekend Warrior",
		sharedInterests: ["House", "Festivals"],
		sharedExperiences: [
			{ id: "e1", title: "Night Rituals", date: "May 23", imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=300&h=200&fit=crop", status: "going" },
		],
		communityActivity: { joinedAgo: "3 weeks ago", experiencesAttended: 2, posts: 1, chatReplies: 5 },
	},
	{
		id: "f3", name: "Rishav", avatarUrl: "https://i.pravatar.cc/40?img=17", role: "Top Contributor",
		city: "Kolkata", tags: ["Tech House", "Travel", "Coffee"], eventsAttended: 12, online: true, cardBg: "bg-orange-50",
		isVerified: true, vibe: "Night Owl",
		sharedInterests: ["Tech House", "Travel"],
		sharedExperiences: [
			{ id: "e2", title: "After Hours", date: "May 31", imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&h=200&fit=crop", status: "going" },
			{ id: "e3", title: "Neon Nights", date: "Jun 06", imageUrl: "https://images.unsplash.com/photo-1598387993441-a364f854cfbd?w=300&h=200&fit=crop", status: "interested" },
		],
		communityActivity: { joinedAgo: "6 months ago", experiencesAttended: 18, posts: 12, chatReplies: 64 },
	},
	{
		id: "f4", name: "Ishita", avatarUrl: "https://i.pravatar.cc/40?img=4", role: "New Member",
		city: "Kolkata", tags: ["Indie", "Art", "Live Music"], eventsAttended: 1, online: false, cardBg: "bg-yellow-50",
		vibe: "Social Butterfly",
		sharedInterests: ["Live Music"],
		communityActivity: { joinedAgo: "1 week ago", experiencesAttended: 1, posts: 0, chatReplies: 3 },
	},
	{
		id: "f5", name: "Karan", avatarUrl: "https://i.pravatar.cc/40?img=11", role: "Active Member",
		city: "Kolkata", tags: ["Techno", "Cycling", "Workshops"], eventsAttended: 6, online: true, cardBg: "bg-purple-50",
		vibe: "Night Owl",
		sharedInterests: ["Techno"],
		sharedExperiences: [
			{ id: "e3", title: "Neon Nights", date: "Jun 06", imageUrl: "https://images.unsplash.com/photo-1598387993441-a364f854cfbd?w=300&h=200&fit=crop", status: "going" },
		],
		communityActivity: { joinedAgo: "1 month ago", experiencesAttended: 6, posts: 3, chatReplies: 19 },
	},
]

// TODO: Replace with real data from GET /api/communities/[id]/members?page=1
const MOCK_ALL_MEMBERS: Member[] = [
	{
		id: "m1", name: "Dev", avatarUrl: "https://i.pravatar.cc/40?img=13", role: "Active Member",
		city: "Kolkata", tags: ["Drum & Bass", "Gaming", "Vinyl"], eventsAttended: 7,
		vibe: "Night Owl",
		communityActivity: { joinedAgo: "2 months ago", experiencesAttended: 7, posts: 2, chatReplies: 11 },
	},
	{
		id: "m2", name: "Ananya", avatarUrl: "https://i.pravatar.cc/40?img=44", role: "New Member",
		city: "Kolkata", tags: ["Bollywood", "Dance", "Fashion"], eventsAttended: 1,
		vibe: "Social Butterfly",
		communityActivity: { joinedAgo: "2 weeks ago", experiencesAttended: 1, posts: 0, chatReplies: 2 },
	},
	{
		id: "m3", name: "Vikram", avatarUrl: "https://i.pravatar.cc/40?img=13", role: "New Member",
		city: "Kolkata", tags: ["Rock", "Guitar", "Live Music"], eventsAttended: 3,
		communityActivity: { joinedAgo: "1 month ago", experiencesAttended: 3, posts: 1, chatReplies: 8 },
	},
]

const FILTER_OPTIONS = [
	{ id: "all", label: "All Members" },
	{ id: "online", label: "• Online Now" },
	{ id: "new", label: "New Members" },
	{ id: "active", label: "Most Active" },
	{ id: "attended", label: "Attended Experiences" },
	{ id: "hosts", label: "Hosts" },
]

const SORT_OPTIONS = ["Recently Active", "Most Events", "New Members", "Alphabetical"] as const
type SortOption = (typeof SORT_OPTIONS)[number]

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: MemberRole }) {
	const config = ROLE_CONFIG[role]
	return (
		<span className={`flex items-center gap-1 text-[11px] font-semibold ${config.textClass}`}>
			<Icon as={StarSvg} size="xs" color={config.iconColor} />
			{role}
		</span>
	)
}

// ─── Featured Member Card ─────────────────────────────────────────────────────

function FeaturedMemberCard({ member, onSelect }: { member: Member; onSelect: (m: Member) => void }) {
	const [bookmarked, setBookmarked] = useState(false)

	return (
		<div
			className="rounded-panel border border-border-default bg-surface-card overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-shadow"
			onClick={() => onSelect(member)}
		>
			{/* Accent top — avatar only */}
			<div className={`${member.cardBg} flex items-center justify-center pt-5 pb-4`}>
				<div className="relative">
					<div className="relative size-16 rounded-full overflow-hidden border-2 border-white bg-surface-hover">
						<Image src={member.avatarUrl} alt={member.name} fill sizes="64px" className="object-cover" />
					</div>
					{member.online && (
						<span className="absolute bottom-0.5 right-0.5 size-3 rounded-full bg-green-500 border-2 border-white" />
					)}
				</div>
			</div>

			{/* White content section */}
			<div className="flex flex-col items-center gap-2 px-3 pt-3 pb-4">
				{/* Name */}
				<p className="text-label-sm font-bold text-text-primary">{member.name}</p>

				{/* Role */}
				<RoleBadge role={member.role} />

				{/* City */}
				<div className="flex items-center gap-1 text-[11px] text-text-secondary">
					<Icon as={MapPointSvg} size="xs" color="secondary" />
					{member.city}
				</div>

				{/* Interest tags */}
				<div className="flex flex-wrap gap-1 justify-center">
					{member.tags.map(tag => (
						<span key={tag} className="text-[10px] text-text-muted border border-border-default rounded-full px-2 py-0.5">
							{tag}
						</span>
					))}
				</div>

				{/* Events attended */}
				<div className="flex items-center gap-1 text-[11px] text-text-secondary">
					<Icon as={CalendarSvg} size="xs" color="secondary" />
					Attended {member.eventsAttended} {member.eventsAttended === 1 ? "event" : "events"}
				</div>

				{/* Actions */}
				<div className="flex items-center gap-2 w-full mt-1">
					{/* TODO: Wire to POST /api/users/[id]/message */}
					<button
						type="button"
						onClick={e => { e.stopPropagation(); onSelect(member) }}
						className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full border border-purple-200 bg-surface-vibe-soft text-violet-600 text-[11px] font-semibold hover:bg-purple-100 transition-colors"
					>
						<Icon as={ChatSvg} size="xs" color="vibe" />
						Message
					</button>
					{/* TODO: Wire to POST /api/users/[id]/bookmark */}
					<button
						type="button"
						onClick={e => { e.stopPropagation(); setBookmarked(b => !b) }}
						className="p-1.5 rounded-full border border-border-default bg-surface-page hover:bg-surface-hover transition-colors"
					>
						<Icon as={BookmarkSvg} size="xs" color={bookmarked ? "brand" : "muted"} />
					</button>
				</div>
			</div>
		</div>
	)
}

// ─── All Members List Row ─────────────────────────────────────────────────────

function MemberListRow({ member, onSelect }: { member: Member; onSelect: (m: Member) => void }) {
	const [bookmarked, setBookmarked] = useState(false)

	return (
		<div
			className="flex items-center gap-4 py-3 border-b border-border-default last:border-0 cursor-pointer hover:bg-surface-hover rounded-action px-2 -mx-2 transition-colors"
			onClick={() => onSelect(member)}
		>
			{/* Avatar */}
			<div className="relative size-10 rounded-full overflow-hidden shrink-0 border border-border-default bg-surface-hover">
				<Image src={member.avatarUrl} alt={member.name} fill sizes="40px" className="object-cover" />
			</div>

			{/* Name */}
			<p className="text-label-sm font-bold text-text-primary w-20 shrink-0">{member.name}</p>

			{/* Role */}
			<div className="w-32 shrink-0">
				<RoleBadge role={member.role} />
			</div>

			{/* City */}
			<p className="text-label-sm text-text-secondary w-20 shrink-0">{member.city}</p>

			{/* Tags */}
			<div className="flex items-center gap-1.5 flex-1 min-w-0 flex-wrap">
				{member.tags.map(tag => (
					<span key={tag} className="text-[10px] text-text-muted border border-border-default rounded-full px-2 py-0.5 whitespace-nowrap">
						{tag}
					</span>
				))}
			</div>

			{/* Events */}
			<div className="flex items-center gap-1.5 text-[11px] text-text-secondary shrink-0 w-32">
				<Icon as={CalendarSvg} size="xs" color="secondary" />
				Attended {member.eventsAttended} {member.eventsAttended === 1 ? "event" : "events"}
			</div>

			{/* Actions */}
			<div className="flex items-center gap-2 shrink-0">
				{/* TODO: Wire to POST /api/users/[id]/message */}
				<button
					type="button"
					onClick={e => { e.stopPropagation(); onSelect(member) }}
					className="text-text-muted hover:text-text-primary transition-colors"
				>
					<Icon as={ChatSvg} size="sm" color="muted" />
				</button>
				{/* TODO: Wire to POST /api/users/[id]/bookmark */}
				<button
					type="button"
					onClick={e => { e.stopPropagation(); setBookmarked(b => !b) }}
					className="text-text-muted hover:text-text-primary transition-colors"
				>
					<Icon as={BookmarkSvg} size="sm" color={bookmarked ? "brand" : "muted"} />
				</button>
				{/* TODO: Wire to member options menu (view profile, block, report) */}
				<button
					type="button"
					onClick={e => e.stopPropagation()}
					className="text-text-muted hover:text-text-primary transition-colors"
				>
					<Icon as={DotsSvg} size="sm" color="muted" />
				</button>
			</div>
		</div>
	)
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MembersTabContent() {
	const [activeFilter, setActiveFilter] = useState("all")
	const [sort, setSort] = useState<SortOption>("Recently Active")
	const [sortOpen, setSortOpen] = useState(false)
	const [selectedMember, setSelectedMember] = useState<Member | null>(null)

	return (
		<>
		<div className="rounded-panel bg-surface-card border border-border-default p-5 flex flex-col gap-5">
			{/* Header */}
			<div className="flex items-start justify-between gap-4">
				<div>
					<h2 className="text-body-lg font-bold text-text-primary">Members</h2>
					<p className="text-label-sm text-text-secondary font-normal mt-0.5">
						Connect with people in the community.
					</p>
				</div>

				{/* Search + Filters */}
				<div className="flex items-center gap-2 shrink-0">
					{/* TODO: Wire search to GET /api/communities/[id]/members?q=[query] */}
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
						Sort by:{" "}
						<span className="text-text-primary font-semibold">{sort}</span>
						<Icon as={sortOpen ? AltArrowUpSvg : AltArrowDownSvg} size="xs" color="secondary" />
					</button>

					{sortOpen && (
						<div className="absolute right-0 top-full mt-1.5 w-44 rounded-action bg-surface-card border border-border-default shadow-md z-10 overflow-hidden">
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

			{/* Featured members */}
			{/* TODO: Replace with real featured members from GET /api/communities/[id]/members?featured=true */}
			<div>
				<p className="text-body-sm font-semibold text-text-primary mb-3">Featured members</p>
				<div className="grid grid-cols-5 gap-3">
					{MOCK_FEATURED_MEMBERS.map(member => (
						<FeaturedMemberCard key={member.id} member={member} onSelect={setSelectedMember} />
					))}
				</div>
			</div>

			{/* All members list */}
			{/* TODO: Replace with paginated data from GET /api/communities/[id]/members?sort=[sort]&filter=[filter]&page=1 */}
			<div>
				<p className="text-body-sm font-semibold text-text-primary mb-2">All members</p>
				<div>
					{MOCK_ALL_MEMBERS.map(member => (
						<MemberListRow key={member.id} member={member} onSelect={setSelectedMember} />
					))}
				</div>
			</div>

			{/* Load more */}
			{/* TODO: Implement pagination — fetch next page on click */}
			<button
				type="button"
				className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-action border border-border-default text-label-sm text-text-brand font-semibold hover:bg-surface-brand-soft transition-colors"
			>
				Load more members
				<Icon as={AltArrowDownSvg} size="xs" color="brand" />
			</button>
		</div>

		<MemberProfileDrawer
			member={selectedMember}
			onClose={() => setSelectedMember(null)}
		/>
		</>
	)
}
