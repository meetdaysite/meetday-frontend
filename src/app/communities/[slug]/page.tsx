"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { notFound } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Icon } from "@/components/ui/Icon"
import AltArrowLeftSvg from "@/icons/outlined/alt-arrow-left.svg"
import LockSvg from "@/icons/outlined/lock.svg"
import BoltSvg from "@/icons/outlined/bolt.svg"
import { Button } from "@/components/ui/Button"
import { useAuthStore } from "@/store/authStore"
import { getCommunityBySlug, joinCommunity } from "@/lib/api"
import type { CommunityDetailResponse, ProfileVisibility } from "@/lib/api"
import { CommunityHero } from "./_components/CommunityHero"
import type { CommunityDetails } from "./_components/CommunityHero"
import { WhatToDoCard } from "./_components/WhatToDoCard"
import { UpcomingExperiences, ExperiencesGrid } from "./_components/UpcomingExperiences"
import { LatestFromCommunity } from "./_components/LatestFromCommunity"
import { JoinCommunityBanner } from "./_components/JoinCommunityBanner"
import { CommunitySidePanel } from "./_components/CommunitySidePanel"
import { ChatTabContent } from "./_components/ChatTabContent"
import { AnnouncementsTabContent } from "./_components/AnnouncementsTabContent"
import { FeedTabContent } from "./_components/FeedTabContent"
import { MembersTabContent } from "./_components/MembersTabContent"
import { JoinCommunityModal } from "./_components/JoinCommunityModal"
import { JoinSuccessModal } from "./_components/JoinSuccessModal"
import { JoinPendingModal } from "./_components/JoinPendingModal"

// ─── Tab definition ────────────────────────────────────────────────────────────

type TabKey = "overview" | "experiences" | "chat" | "announcements" | "feed" | "members"

interface Tab {
	key: TabKey
	label: string
	requiresAuth: boolean
	settingKey?: keyof CommunityDetailResponse["settings"]
}

const ALL_TABS: Tab[] = [
	{ key: "overview", label: "Overview", requiresAuth: false },
	{ key: "experiences", label: "Experiences", requiresAuth: false, settingKey: "experiencesTabEnabled" },
	{ key: "chat", label: "Chat", requiresAuth: true, settingKey: "chatEnabled" },
	{ key: "announcements", label: "Announcements", requiresAuth: true, settingKey: "announcementsEnabled" },
	{ key: "feed", label: "Feed", requiresAuth: true, settingKey: "feedEnabled" },
	{ key: "members", label: "Members", requiresAuth: true, settingKey: "memberDirectoryEnabled" },
]

// ─── Locked tab placeholder ────────────────────────────────────────────────────

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

// ─── Tab content renderer ──────────────────────────────────────────────────────

function TabContent({
	activeTab,
	visibleTabs,
	community,
	isLoggedIn,
	isMember,
	onJoinClick,
}: {
	activeTab: TabKey
	visibleTabs: Tab[]
	community: CommunityDetails
	isLoggedIn: boolean
	isMember: boolean
	onJoinClick: () => void
}) {
	const tab = visibleTabs.find(t => t.key === activeTab)!
	const isLocked = tab.requiresAuth && (!isLoggedIn || !isMember)

	if (isLocked) {
		return (
			<LockedTabContent
				tabLabel={tab.label}
				communityName={community.name}
				isLoggedIn={isLoggedIn}
				onJoinClick={onJoinClick}
			/>
		)
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
				{/* TODO: Replace with paginated API call — GET /api/communities/[slug]/events */}
				<ExperiencesGrid />
			</div>
		)
	}

	if (activeTab === "chat") return <ChatTabContent communityName={community.name} />
	if (activeTab === "announcements") return <AnnouncementsTabContent />
	if (activeTab === "feed") return <FeedTabContent />
	if (activeTab === "members") return <MembersTabContent />

	return (
		<div className="rounded-panel bg-surface-card border border-border-default p-10 flex items-center justify-center">
			<p className="text-body-sm text-text-muted">Content coming soon.</p>
		</div>
	)
}

// ─── Loading skeleton ──────────────────────────────────────────────────────────

function CommunityPageSkeleton() {
	return (
		<main className="flex-1 py-6 md:py-8 pb-12">
			<div className="max-w-384 mx-auto px-(--space-page-x-mobile) md:px-(--space-page-x-tablet) lg:px-(--space-page-x-desktop)">
				<div className="h-4 w-36 bg-surface-hover rounded animate-pulse mb-6" />
				<div className="flex gap-8 items-start">
					<div className="flex-1 min-w-0 flex flex-col gap-5">
						<div className="h-64 rounded-panel bg-surface-hover animate-pulse" />
						<div className="flex gap-1">
							{Array.from({ length: 4 }).map((_, i) => (
								<div key={i} className="h-9 w-24 rounded-full bg-surface-hover animate-pulse" />
							))}
						</div>
						<div className="h-48 rounded-panel bg-surface-hover animate-pulse" />
					</div>
					<div className="hidden lg:flex flex-col gap-4 w-100 shrink-0">
						<div className="h-72 rounded-panel bg-surface-hover animate-pulse" />
					</div>
				</div>
			</div>
		</main>
	)
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CommunityDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = use(params)

	const user = useAuthStore(s => s.user)
	const authLoading = useAuthStore(s => s.authLoading)

	const [apiData, setApiData] = useState<CommunityDetailResponse | null | "loading">("loading")
	const [isMember, setIsMember] = useState(false)
	const [activeTab, setActiveTab] = useState<TabKey>("overview")
	const [joinModalOpen, setJoinModalOpen] = useState(false)
	const [successModalOpen, setSuccessModalOpen] = useState(false)
	const [pendingModalOpen, setPendingModalOpen] = useState(false)

	useEffect(() => {
		getCommunityBySlug(slug).then(res => setApiData(res))
	}, [slug])

	useEffect(() => {
		if (apiData && apiData !== "loading" && !authLoading && user) {
			setIsMember(apiData.members.some(m => m.userId === user.uid))
		}
	}, [apiData, authLoading, user])

	if (apiData === "loading") return <CommunityPageSkeleton />
	if (!apiData) notFound()

	const isLoggedIn = !!user

	const community: CommunityDetails = {
		id: apiData.id,
		slug: apiData.slug,
		name: apiData.name,
		description: apiData.description,
		type: apiData.type,
		access: apiData.access,
		memberCount: apiData.memberCount,
		experienceCount: apiData.experienceCount,
		primaryCity: apiData.primaryCity,
		coverImageUrl: apiData.coverImageUrl,
		iconUrl: apiData.iconUrl,
	}

	// Filter tabs by settings flags
	const visibleTabs = ALL_TABS.filter(tab => {
		if (!tab.settingKey) return true
		return apiData.settings[tab.settingKey as keyof typeof apiData.settings] === true
	})

	const safeActiveTab: TabKey = visibleTabs.some(t => t.key === activeTab) ? activeTab : "overview"

	const activeTabDef = visibleTabs.find(t => t.key === safeActiveTab)!
	const isActiveTabLocked = activeTabDef.requiresAuth && (!isLoggedIn || !isMember)

	const openJoinModal = () => setJoinModalOpen(true)

	const handleJoin = async (profileVisibility: ProfileVisibility) => {
		const res = await joinCommunity(apiData.id, profileVisibility)
		setJoinModalOpen(false)
		if (res.status === "ACTIVE") {
			setIsMember(true)
			setSuccessModalOpen(true)
		} else {
			setPendingModalOpen(true)
		}
	}

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
						<CommunityHero community={community} isMember={isMember} onJoinClick={openJoinModal} />

						{/* Tabs row */}
						<div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
							{visibleTabs.map(tab => {
								const locked = tab.requiresAuth && (!isLoggedIn || !isMember)
								const isActive = safeActiveTab === tab.key

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
												<Icon as={LockSvg} size="xs" color="info" className="size-2" />
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
						<TabContent
							activeTab={safeActiveTab}
							visibleTabs={visibleTabs}
							community={community}
							isLoggedIn={isLoggedIn}
							isMember={isMember}
							onJoinClick={openJoinModal}
						/>

						{/* Join banner — hidden once member or tab is already locked */}
						{!isMember && !isActiveTabLocked && (
							<JoinCommunityBanner
								communityName={community.name}
								isLoggedIn={isLoggedIn}
								onJoinClick={openJoinModal}
							/>
						)}
					</div>

					{/* Right: side panel (desktop only) */}
					<aside className="hidden lg:flex flex-col gap-4 w-100 shrink-0 sticky top-20">
						<CommunitySidePanel
							activeTab={safeActiveTab}
							isMember={isMember}
							onJoinClick={openJoinModal}
						/>
					</aside>
				</div>
			</div>

			<JoinCommunityModal
				community={{
					name: community.name,
					iconUrl: community.iconUrl,
					type: community.type,
					access: community.access,
				}}
				open={joinModalOpen}
				onClose={() => setJoinModalOpen(false)}
				onJoin={async (profileVisibility) => {
					try {
						await handleJoin(profileVisibility)
					} catch {
						toast.error("Failed to join community. Please try again.")
					}
				}}
			/>

			<JoinSuccessModal
				community={{
					name: community.name,
					memberCount: community.memberCount,
					experienceCount: community.experienceCount,
					primaryCity: community.primaryCity,
				}}
				open={successModalOpen}
				onClose={() => setSuccessModalOpen(false)}
			/>

			<JoinPendingModal
				community={{ name: community.name }}
				open={pendingModalOpen}
				onClose={() => setPendingModalOpen(false)}
			/>
		</main>
	)
}
