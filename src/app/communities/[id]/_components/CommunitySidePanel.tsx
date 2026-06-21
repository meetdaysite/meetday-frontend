"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import UsersGroupSvg from "@/icons/outlined/users-group-2.svg"
import ChatSvg from "@/icons/outlined/chat.svg"
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
import ShieldCheckSvg from "@/icons/outlined/shield-check.svg"
import CloseCircleSvg from "@/icons/outlined/close-circle.svg"
import CameraRotateSvg from "@/icons/outlined/camera-rotate.svg"
import DangerTriangleSvg from "@/icons/outlined/danger-triangle.svg"
import InfoCircleSvg from "@/icons/outlined/info-circle.svg"
import StarOutlinedSvg from "@/icons/outlined/star.svg"
import VerifiedSvg from "@/icons/filled/verified-check.svg"
import StarFilledSvg from "@/icons/filled/star.svg"
import BoltFilledSvg from "@/icons/filled/bolt.svg"
import ShieldCheckFilledSvg from "@/icons/filled/shield-check.svg"
import PulseFilledSvg from "@/icons/filled/pulse.svg"
import HeartsFilledSvg from "@/icons/filled/hearts.svg"
import BulbSvg from "@/icons/outlined/bulb.svg"

// ─── Why Join Card ────────────────────────────────────────────────────────────

const WHY_JOIN_ITEMS = [
	{ icon: ChatSvg, title: "Community chat room", description: "Talk, connect and vibe with members." },
	{
		icon: BellSvg,
		title: "Official announcements",
		description: "Get the latest updates and event drops.",
	},
	{ icon: PulseSvg, title: "General feed", description: "Share moments, ask, discuss and interact." },
	{
		icon: CalendarSvg,
		title: "Upcoming experiences",
		description: "Discover and book the best events first.",
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

// TODO: Replace with real member data from GET /api/communities/[id]/members?preview=true
const MOCK_MEMBER_AVATARS = [
	"https://i.pravatar.cc/40?img=1",
	"https://i.pravatar.cc/40?img=2",
	"https://i.pravatar.cc/40?img=3",
	"https://i.pravatar.cc/40?img=4",
	"https://i.pravatar.cc/40?img=5",
	"https://i.pravatar.cc/40?img=6",
	"https://i.pravatar.cc/40?img=7",
	"https://i.pravatar.cc/40?img=8",
	"https://i.pravatar.cc/40?img=9",
	"https://i.pravatar.cc/40?img=10",
	"https://i.pravatar.cc/40?img=11",
	"https://i.pravatar.cc/40?img=12",
]

const MEMBER_STATS = [
	{ label: "Actively online", value: "62%" },
	{ label: "Regular Attendees", value: "53%" },
	{ label: "Night Explorers", value: "96%" },
	{ label: "Event rate", value: "96%" },
]

function PeopleInCommunityCard({ isMember }: { isMember: boolean }) {
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

			{/* Avatar grid */}
			<div className="flex flex-wrap gap-1.5 mb-4">
				{MOCK_MEMBER_AVATARS.map((src, i) => (
					<div
						key={i}
						className="relative size-8 rounded-full overflow-hidden border border-border-default"
					>
						<Image src={src} alt="" fill sizes="32px" className="object-cover" />
					</div>
				))}
				<div className="size-8 rounded-full bg-surface-hover border border-border-default flex items-center justify-center">
					<span className="text-[9px] font-semibold text-text-muted">+2</span>
				</div>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-2 gap-2">
				{MEMBER_STATS.map(stat => (
					<div
						key={stat.label}
						className="p-2.5 rounded-action bg-neutral-50 border border-border-default"
					>
						<p className="text-body-sm font-bold text-text-primary">{stat.value}</p>
						<p className="text-[11px] text-text-secondary mt-0.5">{stat.label}</p>
					</div>
				))}
			</div>
		</div>
	)
}

// ─── Trusted Hosts Card ───────────────────────────────────────────────────────

// TODO: Replace with real host data from GET /api/communities/[id]/hosts
interface TrustedHost {
	id: string
	name: string
	avatarUrl: string
	tagline: string
	eventCount: string
}

const MOCK_TRUSTED_HOSTS: TrustedHost[] = [
	{
		id: "h1",
		name: "Beercruize",
		avatarUrl: "https://i.pravatar.cc/40?img=20",
		tagline: "Host",
		eventCount: "900+ events",
	},
	{
		id: "h2",
		name: "Luna Nights",
		avatarUrl: "https://i.pravatar.cc/40?img=21",
		tagline: "Host",
		eventCount: "60+ events",
	},
	{
		id: "h3",
		name: "Rooftop Collective",
		avatarUrl: "https://i.pravatar.cc/40?img=22",
		tagline: "Host",
		eventCount: "80+ events",
	},
]

function TrustedHostsCard() {
	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<div className="flex items-center justify-between gap-2 mb-4">
				<div className="flex items-center gap-2">
					<span className="text-body-md font-semibold text-text-primary">Trusted hosts</span>
				</div>
				{/* TODO: Link to /communities/[id]/hosts once sub-page is built */}
				<Link href="#" className="flex items-center gap-1 text-sm text-text-brand font-medium hover:underline shrink-0">
					View all
					<Icon as={ArrowRightSvg} size="xs" color="brand" />
				</Link>
			</div>

			<div className="flex flex-col gap-3">
				{MOCK_TRUSTED_HOSTS.map(host => (
					<div key={host.id} className="flex items-center gap-3">
						<div className="relative size-9 rounded-full overflow-hidden shrink-0 border border-border-default bg-surface-hover">
							<Image
								src={host.avatarUrl}
								alt={host.name}
								fill
								sizes="36px"
								className="object-cover"
							/>
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-label-sm font-semibold text-text-primary truncate">
								{host.name}
							</p>
							<p className="text-[11px] text-text-secondary">
								{host.tagline} · {host.eventCount}
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

// TODO: Replace with real filter options from GET /api/experiences/filters
const DATE_FILTER_OPTIONS = ["All", "This Week", "This Month", "Next Month"]
// TODO: Replace with real experience types from GET /api/experiences/types
const TYPE_FILTER_OPTIONS = ["All", "Rooftop", "Club", "Live", "Festival"]
// TODO: Replace with real genre list from GET /api/experiences/genres
const GENRE_OPTIONS = ["All Genres", "Electronic", "Hip-Hop", "Jazz", "Classical", "Afrobeats"]
// TODO: Replace with real sort options
const SORT_OPTIONS = ["Date: Soonest", "Date: Latest", "Popularity", "Price: Low to High"]

function ExperiencesFilterCard() {
	const [selectedDate, setSelectedDate] = useState("All")
	const [selectedType, setSelectedType] = useState("All")
	const [selectedGenre, setSelectedGenre] = useState("All Genres")
	const [selectedSort, setSelectedSort] = useState("Date: Soonest")

	const hasActiveFilters =
		selectedDate !== "All" || selectedType !== "All" || selectedGenre !== "All Genres"

	const clearAll = () => {
		setSelectedDate("All")
		setSelectedType("All")
		setSelectedGenre("All Genres")
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
							key={opt}
							type="button"
							onClick={() => setSelectedDate(opt)}
							className={`px-3 py-1 rounded-full text-[12px] font-medium border transition-colors ${
								selectedDate === opt
									? "bg-action-primary text-white border-action-primary"
									: "bg-transparent text-text-secondary border-border-default hover:border-border-focus"
							}`}
						>
							{opt}
						</button>
					))}
				</div>
			</div>

			{/* Experience type */}
			<div className="mb-4">
				<p className="text-label-sm font-medium text-text-secondary mb-2">Experience type</p>
				<div className="flex flex-wrap gap-1.5">
					{TYPE_FILTER_OPTIONS.map(opt => (
						<button
							key={opt}
							type="button"
							onClick={() => setSelectedType(opt)}
							className={`px-3 py-1 rounded-full text-[12px] font-medium border transition-colors ${
								selectedType === opt
									? "bg-action-primary text-white border-action-primary"
									: "bg-transparent text-text-secondary border-border-default hover:border-border-focus"
							}`}
						>
							{opt}
						</button>
					))}
				</div>
			</div>

			{/* Music genre */}
			<div className="mb-4">
				<p className="text-label-sm font-medium text-text-secondary mb-2">Music genre</p>
				<div className="relative">
					<select
						value={selectedGenre}
						onChange={e => setSelectedGenre(e.target.value)}
						className="w-full px-3 py-2.5 pr-8 rounded-action border border-border-default bg-surface-page text-label-sm text-text-primary appearance-none cursor-pointer focus:outline-none focus:border-border-focus"
					>
						{GENRE_OPTIONS.map(g => (
							<option key={g}>{g}</option>
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

			{/* Sort by */}
			<div>
				<p className="text-label-sm font-medium text-text-secondary mb-2">Sort by</p>
				<div className="relative">
					<select
						value={selectedSort}
						onChange={e => setSelectedSort(e.target.value)}
						className="w-full px-3 py-2.5 pr-8 rounded-action border border-border-default bg-surface-page text-label-sm text-text-primary appearance-none cursor-pointer focus:outline-none focus:border-border-focus"
					>
						{SORT_OPTIONS.map(s => (
							<option key={s}>{s}</option>
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

// TODO: Replace with real saved events from GET /api/users/me/saved-events?communityId=[id]
const MOCK_SAVED_EXPERIENCES = [
	{
		id: "se1",
		name: "After Hours",
		coverUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=80&h=80&fit=crop",
		date: "Sat, 31 May",
		time: "9:00 PM",
	},
]

function SavedExperiencesCard() {
	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<div className="flex items-center justify-between gap-2 mb-4">
				<span className="text-body-md font-semibold text-text-primary">Saved experiences</span>
				{/* TODO: Link to /attendee/saved-events once page is built */}
				<Link
					href="#"
					className="flex items-center gap-1 text-sm text-text-brand font-medium hover:underline shrink-0"
				>
					View all
					<Icon as={ArrowRightSvg} size="xs" color="brand" />
				</Link>
			</div>

			<div className="flex flex-col gap-3">
				{MOCK_SAVED_EXPERIENCES.map(event => (
					<div key={event.id} className="flex items-center gap-3">
						<div className="relative size-12 rounded-action overflow-hidden shrink-0 border border-border-default bg-surface-hover">
							<Image
								src={event.coverUrl}
								alt={event.name}
								fill
								sizes="48px"
								className="object-cover"
							/>
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-label-sm font-semibold text-text-primary truncate">
								{event.name}
							</p>
							<p className="text-[11px] text-text-secondary mt-0.5">
								{event.date} · {event.time}
							</p>
						</div>
						<Icon as={BookmarkSvg} size="sm" color="brand" />
					</div>
				))}
			</div>
		</div>
	)
}

// ─── Experiences: Community Hosts Card ───────────────────────────────────────

// TODO: Replace with real host data from GET /api/communities/[id]/hosts
const MOCK_EXPERIENCE_HOSTS = [
	{
		id: "eh1",
		name: "Beatcurate",
		avatarUrl: "https://i.pravatar.cc/40?img=20",
		eventCount: "120+ events",
	},
	{
		id: "eh2",
		name: "Luna Nights",
		avatarUrl: "https://i.pravatar.cc/40?img=21",
		eventCount: "80+ events",
	},
	{
		id: "eh3",
		name: "Rooftop Collective",
		avatarUrl: "https://i.pravatar.cc/40?img=22",
		eventCount: "60+ events",
	},
]

function ExperiencesCommunityHostsCard() {
	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<div className="flex items-center justify-between gap-2 mb-4">
				<span className="text-body-md font-semibold text-text-primary">Community hosts</span>
				{/* TODO: Link to /communities/[id]/hosts once sub-page is built */}
				<Link
					href="#"
					className="flex items-center gap-1 text-sm text-text-brand font-medium hover:underline shrink-0"
				>
					View all
					<Icon as={ArrowRightSvg} size="xs" color="brand" />
				</Link>
			</div>

			<div className="flex flex-col gap-3">
				{MOCK_EXPERIENCE_HOSTS.map(host => (
					<div key={host.id} className="flex items-center gap-3">
						<div className="relative size-9 rounded-full overflow-hidden shrink-0 border border-border-default bg-surface-hover">
							<Image
								src={host.avatarUrl}
								alt={host.name}
								fill
								sizes="36px"
								className="object-cover"
							/>
						</div>
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-1">
								<p className="text-label-sm font-semibold text-text-primary truncate">
									{host.name}
								</p>
								<Icon as={VerifiedSvg} size="xs" color="brand" className="shrink-0" />
							</div>
							<p className="text-[11px] text-text-secondary">Host · {host.eventCount}</p>
						</div>
						<Icon as={ArrowRightSvg} size="sm" color="primary" />
					</div>
				))}
			</div>
		</div>
	)
}

// ─── Experiences: Suggest Experience Card ────────────────────────────────────

function SuggestExperienceCard() {
	return (
		<div className="p-5 rounded-panel bg-surface-vibe-soft border border-purple-200">
			<div className="flex items-start gap-3">
				<div className="size-9 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
					<Icon as={BulbSvg} size="md" color="vibe" />
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-label-sm font-semibold text-text-primary leading-snug">
						Can&apos;t find what you&apos;re looking for?
					</p>
					<p className="text-[11px] text-text-secondary font-normal mt-1 leading-snug">
						Tell us what you want to experience next.
					</p>
					{/* TODO: Link to /communities/[id]/suggest-experience once feature is built */}
					<Link
						href="#"
						className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-violet-600 hover:underline"
					>
						Suggest an experience
						<Icon as={ArrowRightSvg} size="xs" color="vibe" />
					</Link>
				</div>
			</div>
		</div>
	)
}

// ─── Chat: Upcoming Experiences Card ─────────────────────────────────────────

// TODO: Replace with real data from GET /api/communities/[id]/events?limit=3&upcoming=true
const MOCK_CHAT_UPCOMING = [
	{
		id: "cu1",
		name: "Night Rituals",
		coverUrl: "https://images.unsplash.com/photo-1598387993441-a364f854cfbd?w=80&h=80&fit=crop",
		date: "Fri, 24 May",
		time: "8:00 PM",
		venue: "Skyline Rooftop, Park Street",
		goingCount: "120+",
		attendeeAvatars: [
			"https://i.pravatar.cc/40?img=3",
			"https://i.pravatar.cc/40?img=7",
			"https://i.pravatar.cc/40?img=12",
			"https://i.pravatar.cc/40?img=18",
		],
	},
	{
		id: "cu2",
		name: "After Hours",
		coverUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=80&h=80&fit=crop",
		date: "Sat, 31 May",
		time: "9:00 PM",
		venue: "Park Street, Kolkata",
		goingCount: "86",
		attendeeAvatars: [
			"https://i.pravatar.cc/40?img=5",
			"https://i.pravatar.cc/40?img=9",
			"https://i.pravatar.cc/40?img=14",
			"https://i.pravatar.cc/40?img=22",
		],
	},
	{
		id: "cu3",
		name: "Neon Nights",
		coverUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=80&h=80&fit=crop",
		date: "Fri, 06 Jun",
		time: "10:00 PM",
		venue: "Warehouse Kolkata",
		goingCount: "70",
		attendeeAvatars: [
			"https://i.pravatar.cc/40?img=2",
			"https://i.pravatar.cc/40?img=8",
			"https://i.pravatar.cc/40?img=15",
			"https://i.pravatar.cc/40?img=20",
		],
	},
]

function ChatUpcomingExperiencesCard() {
	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<div className="flex items-center justify-between gap-2 mb-4">
				<span className="text-body-md font-semibold text-text-primary">
					Upcoming Experiences
				</span>
				{/* TODO: Link to /communities/[id]/experiences once tab page is built */}
				<Link href="#" className="flex items-center gap-1 text-sm text-text-brand font-medium hover:underline shrink-0">
					View all
					<Icon as={ArrowRightSvg} size="xs" color="brand" />
				</Link>
			</div>

			<div className="flex flex-col gap-4">
				{MOCK_CHAT_UPCOMING.map(event => (
					<div key={event.id} className="flex items-start gap-3">
						<div className="relative size-14 rounded-action overflow-hidden shrink-0 border border-border-default bg-surface-hover">
							<Image
								src={event.coverUrl}
								alt={event.name}
								fill
								sizes="56px"
								className="object-cover"
							/>
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-label-sm font-semibold text-text-primary leading-tight">
								{event.name}
							</p>
							<p className="text-[11px] text-text-secondary mt-0.5">
								{event.date} · {event.time}
							</p>
							<p className="text-[11px] text-text-muted mt-0.5 truncate">{event.venue}</p>
							<div className="flex items-center gap-1.5 mt-1.5">
								<div className="flex -space-x-1.5">
									{event.attendeeAvatars.map((src, i) => (
										<div
											key={i}
											className="relative size-5 rounded-full overflow-hidden border border-surface-card bg-surface-hover shrink-0"
										>
											<Image src={src} alt="" fill sizes="20px" className="object-cover" />
										</div>
									))}
								</div>
								<span className="text-[11px] text-text-secondary">
									{event.goingCount} going
								</span>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

// ─── Chat: Most Active This Week Card ────────────────────────────────────────

// TODO: Replace with real data from GET /api/communities/[id]/members/most-active?period=week&limit=4
const MOCK_MOST_ACTIVE = [
	{
		rank: 1,
		name: "Arjun",
		avatarUrl: "https://i.pravatar.cc/40?img=6",
		messages: 42,
		starVariant: "gold" as const,
	},
	{
		rank: 2,
		name: "Megha",
		avatarUrl: "https://i.pravatar.cc/40?img=5",
		messages: 38,
		starVariant: "silver" as const,
	},
	{
		rank: 3,
		name: "Rishav",
		avatarUrl: "https://i.pravatar.cc/40?img=17",
		messages: 28,
		starVariant: "bronze" as const,
	},
	{
		rank: 4,
		name: "Karan",
		avatarUrl: "https://i.pravatar.cc/40?img=11",
		messages: 24,
		starVariant: null,
	},
]

function MostActiveThisWeekCard() {
	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<div className="flex items-center gap-2 mb-4">
				<span className="text-body-md font-semibold text-text-primary">
					Most Active This Week
				</span>
				<Icon as={InfoCircleSvg} size="xs" color="muted" />
			</div>

			<div className="flex flex-col gap-3">
				{MOCK_MOST_ACTIVE.map(member => (
					<div key={member.rank} className="flex items-center gap-3">
						<span className="text-[11px] font-bold text-text-muted w-3 shrink-0 text-center">
							{member.rank}
						</span>
						<div className="relative size-8 rounded-full overflow-hidden shrink-0 border border-border-default bg-surface-hover">
							<Image
								src={member.avatarUrl}
								alt={member.name}
								fill
								sizes="32px"
								className="object-cover"
							/>
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-label-sm font-semibold text-text-primary">{member.name}</p>
							<p className="text-[11px] text-text-secondary">{member.messages} messages</p>
						</div>
						{member.starVariant === "gold" && (
							<Icon as={StarFilledSvg} size="sm" color="success" className="text-amber-400 shrink-0" />
						)}
						{member.starVariant === "silver" && (
							<Icon as={StarOutlinedSvg} size="sm" color="muted" className="shrink-0" />
						)}
						{member.starVariant === "bronze" && (
							<Icon as={StarFilledSvg} size="sm" color="success" className="text-orange-400 shrink-0" />
						)}
					</div>
				))}
			</div>
		</div>
	)
}

// ─── Chat: Community Guidelines Card ─────────────────────────────────────────

// TODO: Replace with real guidelines from GET /api/communities/[id]/guidelines
const CHAT_GUIDELINES = [
	"Be respectful and kind",
	"No spam or self-promotion",
	"Ask before sharing photos",
	"Keep conversations inclusive",
	"Report anything uncomfortable",
]

function ChatCommunityGuidelinesCard() {
	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<div className="flex items-center justify-between gap-2 mb-4">
				<span className="text-body-md font-semibold text-text-primary">
					Community Guidelines
				</span>
				{/* TODO: Link to /communities/[id]/guidelines once page is built */}
				<Link href="#" className="flex items-center gap-1 text-sm text-text-brand font-medium hover:underline shrink-0">
					View all
					<Icon as={ArrowRightSvg} size="xs" color="brand" />
				</Link>
			</div>

			<div className="flex flex-col gap-2.5">
				{CHAT_GUIDELINES.map((g, i) => (
					<div key={i} className="flex items-center gap-2.5">
						<Icon as={CheckSvg} size="sm" color="success" className="shrink-0" />
						<span className="text-label-sm text-text-primary font-normal leading-snug">
							{g}
						</span>
					</div>
				))}
			</div>
		</div>
	)
}

// ─── Feed: Trending Topics Card ──────────────────────────────────────────────

// TODO: Replace with real data from GET /api/communities/[id]/feed/trending-topics?limit=5
const MOCK_TRENDING_TOPICS = [
	{ id: "t1", name: "After Hours", posts: 32 },
	{ id: "t2", name: "Neon Nights", posts: 28 },
	{ id: "t3", name: "Night Rituals", posts: 26 },
	{ id: "t4", name: "Best Rooftop Spots", posts: 18 },
	{ id: "t5", name: "Event Recommendations", posts: 16 },
]

function FeedTrendingTopicsCard() {
	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<div className="flex items-center justify-between gap-2 mb-4">
				<span className="text-body-md font-semibold text-text-primary">Trending topics</span>
				{/* TODO: Link to /communities/[id]/feed/topics once page is built */}
				<Link href="#" className="flex items-center gap-1 text-sm text-text-brand font-medium hover:underline shrink-0">
					View all
					<Icon as={ArrowRightSvg} size="xs" color="brand" />
				</Link>
			</div>

			<div className="flex flex-col gap-3">
				{MOCK_TRENDING_TOPICS.map(topic => (
					<div key={topic.id} className="flex items-center gap-2.5">
						<div className="size-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
							<Icon as={BoltFilledSvg} size="sm" color="brand" className="text-orange-500" />
						</div>
						<span className="flex-1 text-label-sm font-medium text-text-primary truncate">
							{topic.name}
						</span>
						<span className="text-[11px] text-text-muted shrink-0">{topic.posts} posts</span>
					</div>
				))}
			</div>
		</div>
	)
}

// ─── Feed: Most Active Members Card ──────────────────────────────────────────

// TODO: Replace with real data from GET /api/communities/[id]/members/most-active?period=week&limit=4
const MOCK_FEED_ACTIVE_MEMBERS = [
	{ rank: 1, name: "Arjun", avatarUrl: "https://i.pravatar.cc/40?img=6", messages: 42 },
	{ rank: 2, name: "Megha", avatarUrl: "https://i.pravatar.cc/40?img=5", messages: 38 },
	{ rank: 3, name: "Rishav", avatarUrl: "https://i.pravatar.cc/40?img=17", messages: 28 },
	{ rank: 4, name: "Karan", avatarUrl: "https://i.pravatar.cc/40?img=11", messages: 24 },
]

const RANK_BADGE: Record<number, { bg: string; text: string }> = {
	1: { bg: "bg-amber-400", text: "text-white" },
	2: { bg: "bg-violet-400", text: "text-white" },
	3: { bg: "bg-orange-400", text: "text-white" },
}

function FeedMostActiveMembersCard() {
	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<div className="flex items-center justify-between gap-2 mb-4">
				<span className="text-body-md font-semibold text-text-primary">Most active members</span>
				{/* TODO: Link to /communities/[id]/members once page is built */}
				<Link href="#" className="flex items-center gap-1 text-sm text-text-brand font-medium hover:underline shrink-0">
					View all
					<Icon as={ArrowRightSvg} size="xs" color="brand" />
				</Link>
			</div>

			<div className="flex flex-col gap-3">
				{MOCK_FEED_ACTIVE_MEMBERS.map(member => {
					const badge = RANK_BADGE[member.rank]
					return (
						<div key={member.rank} className="flex items-center gap-3">
							<div className="relative size-9 rounded-full overflow-hidden shrink-0 border border-border-default bg-surface-hover">
								<Image
									src={member.avatarUrl}
									alt={member.name}
									fill
									sizes="36px"
									className="object-cover"
								/>
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-label-sm font-semibold text-text-primary">{member.name}</p>
								<p className="text-[11px] text-text-secondary">{member.messages} messages</p>
							</div>
							{badge ? (
								<div className={`size-6 rounded-full ${badge.bg} flex items-center justify-center shrink-0`}>
									<span className={`text-[10px] font-bold ${badge.text}`}>{member.rank}</span>
								</div>
							) : (
								<span className="text-[12px] font-bold text-text-muted w-6 text-center shrink-0">
									{member.rank}
								</span>
							)}
						</div>
					)
				})}
			</div>
		</div>
	)
}

// ─── Feed: Popular This Week Card ─────────────────────────────────────────────

// TODO: Replace with real data from GET /api/communities/[id]/feed/posts?sort=popular&period=week&limit=3
const MOCK_POPULAR_POSTS = [
	{
		id: "pp1",
		title: "Photos from Night Rituals",
		coverUrl: "https://images.unsplash.com/photo-1598387993441-a364f854cfbd?w=80&h=80&fit=crop",
		likes: 128,
		comments: 24,
	},
	{
		id: "pp2",
		title: "After Hours Set Times Out!",
		coverUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=80&h=80&fit=crop",
		likes: 96,
		comments: 15,
	},
	{
		id: "pp3",
		title: "Neon Nights Early Access",
		coverUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=80&h=80&fit=crop",
		likes: 84,
		comments: 11,
	},
]

function FeedPopularThisWeekCard() {
	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<div className="flex items-center justify-between gap-2 mb-4">
				<span className="text-body-md font-semibold text-text-primary">Popular this week</span>
				{/* TODO: Link to /communities/[id]/feed?sort=popular once page is built */}
				<Link href="#" className="flex items-center gap-1 text-sm text-text-brand font-medium hover:underline shrink-0">
					View all
					<Icon as={ArrowRightSvg} size="xs" color="brand" />
				</Link>
			</div>

			<div className="flex flex-col gap-3">
				{MOCK_POPULAR_POSTS.map(post => (
					<div key={post.id} className="flex items-center gap-3">
						<div className="relative size-12 rounded-action overflow-hidden shrink-0 border border-border-default bg-surface-hover">
							<Image
								src={post.coverUrl}
								alt={post.title}
								fill
								sizes="48px"
								className="object-cover"
							/>
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-label-sm font-semibold text-text-primary leading-tight line-clamp-2">
								{post.title}
							</p>
							<p className="text-[11px] text-text-secondary mt-0.5">
								{post.likes} likes · {post.comments} comments
							</p>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

// ─── Feed: Community Guidelines Card ─────────────────────────────────────────

function FeedCommunityGuidelinesCard() {
	return (
		<div className="p-5 rounded-panel bg-surface-vibe-soft border border-purple-200">
			<div className="flex items-start gap-3">
				<div className="size-9 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
					<Icon as={ShieldCheckFilledSvg} size="sm" color="vibe" />
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-label-sm font-semibold text-text-primary leading-snug">
						Community guidelines
					</p>
					<p className="text-[11px] text-text-secondary font-normal mt-1 leading-snug">
						Let&apos;s keep this space positive and respectful.
					</p>
					{/* TODO: Link to /communities/[id]/guidelines once page is built */}
					<Link
						href="#"
						className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-violet-600 hover:underline"
					>
						View guidelines
						<Icon as={ArrowRightSvg} size="xs" color="vibe" />
					</Link>
				</div>
			</div>
		</div>
	)
}

// ─── Members: Community At a Glance Card ─────────────────────────────────────

// TODO: Replace with real stats from GET /api/communities/[id]/stats
const COMMUNITY_GLANCE_STATS = [
	{ icon: UsersGroupSvg, value: "1.6k", label: "Total members", iconBg: "bg-blue-100", iconColor: "info" as const },
	{ icon: PulseFilledSvg, value: "18", label: "Online now", iconBg: "bg-green-100", iconColor: "success" as const },
	{ icon: StarOutlinedSvg, value: "42", label: "New this week", iconBg: "bg-purple-100", iconColor: "vibe" as const },
	{ icon: HeartsFilledSvg, value: "238", label: "Most active this week", iconBg: "bg-red-100", iconColor: "brand" as const },
]

function MembersCommunityAtAGlanceCard() {
	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<div className="flex items-center justify-between gap-2 mb-4">
				<span className="text-body-md font-semibold text-text-primary">Community at a glance</span>
				{/* TODO: Link to /communities/[id]/members/stats once page is built */}
				<Link href="#" className="flex items-center gap-1 text-sm text-text-brand font-medium hover:underline shrink-0">
					View all
					<Icon as={ArrowRightSvg} size="xs" color="brand" />
				</Link>
			</div>

			<div className="grid grid-cols-2 gap-2">
				{COMMUNITY_GLANCE_STATS.map(stat => (
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

function MembersTopHostsCard() {
	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<div className="flex items-center justify-between gap-2 mb-4">
				<span className="text-body-md font-semibold text-text-primary">Top hosts</span>
				{/* TODO: Link to /communities/[id]/hosts once sub-page is built */}
				<Link href="#" className="flex items-center gap-1 text-sm text-text-brand font-medium hover:underline shrink-0">
					View all
					<Icon as={ArrowRightSvg} size="xs" color="brand" />
				</Link>
			</div>

			<div className="flex flex-col gap-3">
				{MOCK_EXPERIENCE_HOSTS.map(host => (
					<div key={host.id} className="flex items-center gap-3">
						<div className="relative size-9 rounded-full overflow-hidden shrink-0 border border-border-default bg-surface-hover">
							<Image src={host.avatarUrl} alt={host.name} fill sizes="36px" className="object-cover" />
						</div>
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-1">
								<p className="text-label-sm font-semibold text-text-primary truncate">{host.name}</p>
								<Icon as={VerifiedSvg} size="xs" color="brand" className="shrink-0" />
							</div>
							<p className="text-[11px] text-text-secondary">Host · {host.eventCount}</p>
						</div>
						<Icon as={ArrowRightSvg} size="sm" color="primary" />
					</div>
				))}
			</div>
		</div>
	)
}

// ─── Members: New Members Card ────────────────────────────────────────────────

// TODO: Replace with real data from GET /api/communities/[id]/members?sort=newest&limit=3
const MOCK_NEW_MEMBERS = [
	{ id: "nm1", name: "Vikram", avatarUrl: "https://i.pravatar.cc/40?img=13", joinedAgo: "2 days ago" },
	{ id: "nm2", name: "Tanya", avatarUrl: "https://i.pravatar.cc/40?img=4", joinedAgo: "3 days ago" },
	{ id: "nm3", name: "Rohan", avatarUrl: "https://i.pravatar.cc/40?img=17", joinedAgo: "4 days ago" },
]

function NewMembersCard() {
	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<div className="flex items-center justify-between gap-2 mb-4">
				<span className="text-body-md font-semibold text-text-primary">New members</span>
				{/* TODO: Link to /communities/[id]/members?sort=newest once page is built */}
				<Link href="#" className="flex items-center gap-1 text-sm text-text-brand font-medium hover:underline shrink-0">
					View all
					<Icon as={ArrowRightSvg} size="xs" color="brand" />
				</Link>
			</div>

			<div className="flex flex-col gap-3">
				{MOCK_NEW_MEMBERS.map(member => (
					<div key={member.id} className="flex items-center gap-3">
						<div className="relative shrink-0">
							<div className="relative size-9 rounded-full overflow-hidden border border-border-default bg-surface-hover">
								<Image src={member.avatarUrl} alt={member.name} fill sizes="36px" className="object-cover" />
							</div>
							<span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-green-500 border-2 border-surface-card" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-label-sm font-semibold text-text-primary">{member.name}</p>
							<p className="text-[11px] text-text-secondary">Joined {member.joinedAgo}</p>
						</div>
						<Icon as={ArrowRightSvg} size="sm" color="primary" />
					</div>
				))}
			</div>
		</div>
	)
}

// ─── Members: Tips for Connecting Card ───────────────────────────────────────

function TipsForConnectingCard() {
	return (
		<div className="p-5 rounded-panel bg-surface-vibe-soft border border-purple-200">
			<div className="flex items-start gap-3">
				<div className="size-9 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
					<Icon as={ShieldCheckSvg} size="sm" color="vibe" />
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-label-sm font-semibold text-text-primary leading-snug">
						Tips for connecting
					</p>
					<p className="text-[11px] text-text-secondary font-normal mt-1 leading-snug">
						Be respectful, introduce yourself, and find people with similar vibes.
					</p>
					{/* TODO: Link to /communities/[id]/guidelines once page is built */}
					<Link
						href="#"
						className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-violet-600 hover:underline"
					>
						Community guidelines
						<Icon as={ArrowRightSvg} size="xs" color="vibe" />
					</Link>
				</div>
			</div>
		</div>
	)
}

// ─── Announcements: Trusted Hosts Card ───────────────────────────────────────

// TODO: Replace with real host data from GET /api/communities/[id]/hosts?limit=2
const MOCK_ANNOUNCEMENTS_HOSTS = MOCK_EXPERIENCE_HOSTS.slice(0, 2)

function AnnouncementsTrustedHostsCard() {
	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<div className="flex items-center justify-between gap-2 mb-4">
				<span className="text-body-md font-semibold text-text-primary">Trusted hosts</span>
				{/* TODO: Link to /communities/[id]/hosts once sub-page is built */}
				<Link href="#" className="flex items-center gap-1 text-sm text-text-brand font-medium hover:underline shrink-0">
					View all
					<Icon as={ArrowRightSvg} size="xs" color="brand" />
				</Link>
			</div>

			<div className="flex flex-col gap-3">
				{MOCK_ANNOUNCEMENTS_HOSTS.map(host => (
					<div key={host.id} className="flex items-center gap-3">
						<div className="relative size-9 rounded-full overflow-hidden shrink-0 border border-border-default bg-surface-hover">
							<Image
								src={host.avatarUrl}
								alt={host.name}
								fill
								sizes="36px"
								className="object-cover"
							/>
						</div>
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-1">
								<p className="text-label-sm font-semibold text-text-primary truncate">
									{host.name}
								</p>
								<Icon as={VerifiedSvg} size="xs" color="brand" className="shrink-0" />
							</div>
							<p className="text-[11px] text-text-secondary">Host · {host.eventCount}</p>
						</div>
						<Icon as={ArrowRightSvg} size="sm" color="primary" />
					</div>
				))}
			</div>
		</div>
	)
}

// ─── Announcements: Stay Informed Card ───────────────────────────────────────

function StayInformedCard() {
	return (
		<div className="p-5 rounded-panel bg-surface-vibe-soft border border-purple-200">
			<div className="flex items-start gap-3">
				<div className="size-9 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
					<Icon as={BellSvg} size="sm" color="vibe" />
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-label-sm font-semibold text-text-primary leading-snug">
						Stay informed
					</p>
					<p className="text-[11px] text-text-secondary font-normal mt-1 leading-snug">
						You can manage announcement notifications anytime.
					</p>
					{/* TODO: Link to /attendee/notifications/settings once page is built */}
					<Link
						href="#"
						className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-violet-600 hover:underline"
					>
						Manage notifications
						<Icon as={ArrowRightSvg} size="xs" color="vibe" />
					</Link>
				</div>
			</div>
		</div>
	)
}

// ─── Composed Side Panel ──────────────────────────────────────────────────────

export function CommunitySidePanel({
	activeTab,
	isMember,
	onJoinClick,
}: {
	activeTab: string
	isMember: boolean
	onJoinClick: () => void
}) {
	if (activeTab === "experiences") {
		return (
			<>
				<ExperiencesFilterCard />
				<SavedExperiencesCard />
				<ExperiencesCommunityHostsCard />
				<SuggestExperienceCard />
			</>
		)
	}

	if (activeTab === "chat") {
		return (
			<>
				<ChatUpcomingExperiencesCard />
				<MostActiveThisWeekCard />
				<ChatCommunityGuidelinesCard />
			</>
		)
	}

	if (activeTab === "members") {
		return (
			<>
				<MembersCommunityAtAGlanceCard />
				<MembersTopHostsCard />
				<NewMembersCard />
				<TipsForConnectingCard />
			</>
		)
	}

	if (activeTab === "feed") {
		return (
			<>
				<FeedTrendingTopicsCard />
				<FeedMostActiveMembersCard />
				<FeedPopularThisWeekCard />
				<FeedCommunityGuidelinesCard />
			</>
		)
	}

	if (activeTab === "announcements") {
		return (
			<>
				<ChatUpcomingExperiencesCard />
				<AnnouncementsTrustedHostsCard />
				<ChatCommunityGuidelinesCard />
				<StayInformedCard />
			</>
		)
	}

	// Default: overview (and all other tabs) show the standard panel
	return (
		<>
			<WhyJoinCard isMember={isMember} onJoinClick={onJoinClick} />
			<PeopleInCommunityCard isMember={isMember} />
			<TrustedHostsCard />
			<CommunityGuidelinesCard />
		</>
	)
}
