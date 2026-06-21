import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import UsersGroupSvg from "@/icons/outlined/users-group-2.svg"
// import StarSvg from "@/icons/filled/star.svg"
// import ShieldCheckSvg from "@/icons/filled/shield-check.svg"
// import CheckCircleSvg from "@/icons/filled/check-circle.svg"
import ChatSvg from "@/icons/outlined/chat.svg"
import BellSvg from "@/icons/outlined/bell.svg"
import PulseSvg from "@/icons/outlined/pulse.svg"
import SmileCircleSvg from "@/icons/outlined/smile-circle.svg"
import BoltSvg from "@/icons/outlined/bolt.svg"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import ArrowRightSvg from "@/icons/outlined/arrow-right.svg"
import LockSvg from "@/icons/outlined/lock.svg"
import CheckSvg from "@/icons/outlined/check.svg"
// import UserSvg from "@/icons/outlined/user.svg"

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

function WhyJoinCard({ onJoinClick }: { onJoinClick: () => void }) {
	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<div className="flex items-center gap-2 mb-4">
				<span className="text-body-md font-semibold text-text-primary">Why join this community?</span>
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

function PeopleInCommunityCard({ isLoggedIn }: { isLoggedIn: boolean }) {
	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<div className="flex items-center justify-between gap-2 mb-4">
				<div className="flex items-center gap-2">
					{/* <Icon as={UsersGroupSvg} size="md" color="brand" /> */}
					<span className="text-body-md font-semibold text-text-primary">
						People in this community
					</span>
				</div>
				{!isLoggedIn && (
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
					{/* <Icon as={ShieldCheckSvg} size="md" color="success" /> */}
					<span className="text-body-md font-semibold text-text-primary">Trusted hosts</span>
				</div>
				{/* TODO: Link to /communities/[id]/hosts once sub-page is built */}
				<Link href="#" className="text-sm text-text-brand font-medium hover:underline shrink-0">
					View all 4
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
				{/* <Icon as={CheckCircleSvg} size="md" color="info" /> */}
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

// ─── Composed Side Panel ──────────────────────────────────────────────────────

export function CommunitySidePanel({ isLoggedIn, onJoinClick }: { isLoggedIn: boolean; onJoinClick: () => void }) {
	return (
		<>
			<WhyJoinCard onJoinClick={onJoinClick} />
			<PeopleInCommunityCard isLoggedIn={isLoggedIn} />
			<TrustedHostsCard />
			<CommunityGuidelinesCard />
		</>
	)
}
