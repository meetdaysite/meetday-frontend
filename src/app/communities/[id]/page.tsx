"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Icon } from "@/components/ui/Icon"
import AltArrowLeftSvg from "@/icons/outlined/alt-arrow-left.svg"
import LockSvg from "@/icons/outlined/lock.svg"
import BoltSvg from "@/icons/outlined/bolt.svg"
import { Button } from "@/components/ui/Button"
import { CommunityHero } from "./_components/CommunityHero"
import { WhatToDoCard } from "./_components/WhatToDoCard"
import { UpcomingExperiences, ExperiencesGrid } from "./_components/UpcomingExperiences"
import { LatestFromCommunity } from "./_components/LatestFromCommunity"
import { JoinCommunityBanner } from "./_components/JoinCommunityBanner"
import { CommunitySidePanel } from "./_components/CommunitySidePanel"
import { JoinCommunityModal } from "./_components/JoinCommunityModal"
import { JoinSuccessModal } from "./_components/JoinSuccessModal"
import type { CommunityDetails } from "./_components/CommunityHero"

// ─── Auth flags for testing ───────────────────────────────────────────────────
// TODO: Replace with real auth state from useAuthStore once API is integrated
const MOCK_LOGGED_IN = true
// TODO: Replace with real membership check from GET /api/communities/[id]/membership
const MOCK_IS_MEMBER = false

// ─── Mock community data ──────────────────────────────────────────────────────
// TODO: Replace with API call — GET /api/communities/[id]/public
const MOCK_COMMUNITY: CommunityDetails = {
	id: "meetday-music-nights",
	name: "Meetday Music Nights",
	description:
		"A public Meetday community for music lovers, live performance regulars, late-night explorers, and people who enjoy real-world music experiences.",
	isManaged: true,
	visibility: "Public",
	memberCount: 18000,
	upcomingCount: 12,
	city: "Kolkata",
	coverImageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=400&fit=crop",
	logoUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=200&h=200&fit=crop",
}

// ─── Tabs definition ──────────────────────────────────────────────────────────

type TabKey = "overview" | "experiences" | "chat" | "announcements" | "feed" | "members"

interface Tab {
	key: TabKey
	label: string
	requiresAuth: boolean
}

const TABS: Tab[] = [
	{ key: "overview", label: "Overview", requiresAuth: false },
	{ key: "experiences", label: "Experiences", requiresAuth: false },
	{ key: "chat", label: "Chat", requiresAuth: true },
	{ key: "announcements", label: "Announcements", requiresAuth: true },
	{ key: "feed", label: "Feed", requiresAuth: true },
	{ key: "members", label: "Members", requiresAuth: true },
]

// ─── Locked tab placeholder ───────────────────────────────────────────────────

function LockedTabContent({
	tabLabel,
	communityName,
	isLoggedIn,
	onJoinClick,
}: {
	tabLabel: string
	communityName: string
	isLoggedIn: boolean
	onJoinClick: () => void
}) {
	const router = useRouter()

	const handleJoin = () => {
		if (!isLoggedIn) {
			router.push(`/attendee/login?redirect=${encodeURIComponent(window.location.pathname)}`)
			return
		}
		onJoinClick()
	}

	return (
		<div className="rounded-panel bg-surface-brand-soft border border-border-focus p-6 flex flex-col sm:flex-row items-center gap-4">
			<div className="flex items-center justify-center size-12 rounded-full bg-action-primary shrink-0">
				<Icon as={LockSvg} size="md" color="inverse" />
			</div>
			<div className="flex-1 min-w-0 text-center sm:text-left">
				<p className="text-body-md font-semibold text-text-primary">
					{tabLabel} is members-only
				</p>
				<p className="text-label-sm text-text-secondary font-normal mt-0.5 leading-snug">
					{isLoggedIn ? "Join " : "Log in and join "}
					<span className="font-semibold text-text-brand">{communityName}</span>{" "}
					to access {tabLabel.toLowerCase()} and connect with the community.
				</p>
			</div>
			<Button
				variant="primary"
				size="md"
				radius="pill"
				className="shrink-0"
				leftIcon={<Icon as={BoltSvg} size="sm" color="inverse" />}
				onClick={handleJoin}
			>
				{isLoggedIn ? "Join Community" : "Log in to Join"}
			</Button>
		</div>
	)
}

// ─── Tab content renderer ─────────────────────────────────────────────────────

function TabContent({
	activeTab,
	community,
	isLoggedIn,
	isMember,
	onJoinClick,
}: {
	activeTab: TabKey
	community: CommunityDetails
	isLoggedIn: boolean
	isMember: boolean
	onJoinClick: () => void
}) {
	const tab = TABS.find(t => t.key === activeTab)!
	const isLocked = tab.requiresAuth && (!isLoggedIn || !isMember)

	if (isLocked) {
		return <LockedTabContent tabLabel={tab.label} communityName={community.name} isLoggedIn={isLoggedIn} onJoinClick={onJoinClick} />
	}

	if (activeTab === "overview") {
		return (
			<>
				<WhatToDoCard isMember={isMember} />
				<UpcomingExperiences communityId={community.id} />
				<LatestFromCommunity communityName={community.name} isMember={isMember} />
			</>
		)
	}

	if (activeTab === "experiences") {
		return (
			<div className="rounded-panel bg-surface-card border border-border-default p-5">
				<p className="text-body-md font-semibold text-text-primary mb-4">
					All experiences from this community
				</p>
				{/* TODO: Replace with paginated API call — GET /api/communities/[id]/events */}
				<ExperiencesGrid />
			</div>
		)
	}

	// Other authenticated tabs — content designs pending
	return (
		<div className="rounded-panel bg-surface-card border border-border-default p-10 flex items-center justify-center">
			<p className="text-body-sm text-text-muted">Content coming soon.</p>
		</div>
	)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CommunityDetailsPage() {
	// TODO: Read `id` from params and fetch community — GET /api/communities/[id]/public
	const community = MOCK_COMMUNITY
	const isLoggedIn = MOCK_LOGGED_IN
	// TODO: Replace with real membership state from GET /api/communities/[id]/membership
	const [isMember, setIsMember] = useState(MOCK_IS_MEMBER)

	const [activeTab, setActiveTab] = useState<TabKey>("overview")
	const [joinModalOpen, setJoinModalOpen] = useState(false)
	const [successModalOpen, setSuccessModalOpen] = useState(false)
	const activeTabDef = TABS.find(t => t.key === activeTab)!
	const isActiveTabLocked = activeTabDef.requiresAuth && (!isLoggedIn || !isMember)

	const openJoinModal = () => setJoinModalOpen(true)

	return (
		<main className="flex-1 py-6 md:py-8 pb-12">
			<div className="max-w-384 mx-auto px-(--space-page-x-mobile) md:px-(--space-page-x-tablet) lg:px-(--space-page-x-desktop)">
				{/* Back */}
				<Link
					href="/communities"
					className="inline-flex items-center gap-1.5 text-body-sm text-text-primary hover:text-text-primary transition-colors mb-6"
				>
					<Icon as={AltArrowLeftSvg} size="sm" color="primary" />
					Back to Communities
				</Link>

				{/* Two-column layout */}
				<div className="flex gap-8 items-start">
					{/* Left: main content */}
					<div className="flex-1 min-w-0 flex flex-col gap-5">
						<CommunityHero community={community} isMember={isMember} />

						{/* Tabs row */}
						<div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
							{TABS.map(tab => {
								const locked = tab.requiresAuth && (!isLoggedIn || !isMember)
								const isActive = activeTab === tab.key

								return (
									<button
										key={tab.key}
										type="button"
										onClick={() => setActiveTab(tab.key)}
										className={`relative flex items-center gap-1.5 px-4 py-2.5 text-body-sm font-medium whitespace-nowrap transition-colors ${
											isActive
												? "text-text-brand"
												: "text-text-secondary hover:text-text-primary"
										}`}
									>
										{tab.label}
										{locked && (
											<span className="flex items-center gap-0.5 text-[10px] font-medium text-text-info border border-icon-info bg-surface-info rounded-avatar px-1 py-1">
												<Icon
													as={LockSvg}
													size="xs"
													color="info"
													className="size-2"
												/>
											</span>
										)}
										{isActive && (
											<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-text-brand rounded-full" />
										)}
									</button>
								)
							})}
						</div>

						{/* Tab content */}
						<TabContent activeTab={activeTab} community={community} isLoggedIn={isLoggedIn} isMember={isMember} onJoinClick={openJoinModal} />


						{/* Join banner — hidden once user is a member */}
						{!isMember && !isActiveTabLocked && <JoinCommunityBanner communityName={community.name} isLoggedIn={isLoggedIn} onJoinClick={openJoinModal} />}
					</div>

					{/* Right: side panel (desktop only) */}
					<aside className="hidden lg:flex flex-col gap-4 w-100 shrink-0 sticky top-20">
						<CommunitySidePanel isMember={isMember} onJoinClick={openJoinModal} />
					</aside>
				</div>
			</div>

			<JoinCommunityModal
				community={community}
				open={joinModalOpen}
				onClose={() => setJoinModalOpen(false)}
				onJoin={() => {
					// TODO: POST /api/communities/[id]/join with selected visibility before setting member state
					setIsMember(true)
					setJoinModalOpen(false)
					setSuccessModalOpen(true)
				}}
			/>

			<JoinSuccessModal
				community={community}
				open={successModalOpen}
				onClose={() => setSuccessModalOpen(false)}
			/>
		</main>
	)
}
