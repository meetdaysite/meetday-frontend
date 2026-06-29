"use client"

import { use, useState, useEffect } from "react"
import { useRouter, notFound } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Icon } from "@/components/ui/Icon"
import { Skeleton } from "@/components/ui/Skeleton"
import AltArrowLeftSvg from "@/icons/outlined/alt-arrow-left.svg"
import LockSvg from "@/icons/outlined/lock.svg"
import BoltSvg from "@/icons/outlined/bolt.svg"
import { Button } from "@/components/ui/Button"
import { useAuthStore } from "@/store/authStore"
import { useAttendeeProfileStore } from "@/store/attendeeProfileStore"
import { getCommunityBySlug, joinCommunity, leaveCommunity, getAnnouncementUnreadCount, markAnnouncementsRead, getCommunityMembers } from "@/lib/api"
import { getTotalUnreadDMCount } from "@/lib/chatApi"
import { getApiErrorMessage } from "@/lib/errors"
import type { CommunityDetailResponse, ProfileVisibility, CommunityRole } from "@/lib/api"
import { CommunityHero } from "./_components/CommunityHero"
import type { CommunityDetails } from "./_components/CommunityHero"
import { WhatToDoCard } from "./_components/WhatToDoCard"
import { UpcomingExperiences } from "./_components/UpcomingExperiences"
import { ExperiencesTabContent } from "./_components/ExperiencesTabContent"
import { LatestFromCommunity } from "./_components/LatestFromCommunity"
import { JoinCommunityBanner } from "./_components/JoinCommunityBanner"
import { CommunitySidePanel } from "./_components/CommunitySidePanel"
import type { ExperienceFilters } from "./_components/CommunitySidePanel"
import { DEFAULT_EXPERIENCE_FILTERS } from "./_components/CommunitySidePanel"
import { ChatTabContent } from "./_components/ChatTabContent"
import { AnnouncementsTabContent } from "./_components/AnnouncementsTabContent"
import { FeedTabContent } from "./_components/FeedTabContent"
import { MembersTabContent } from "./_components/MembersTabContent"
import { JoinCommunityModal } from "./_components/JoinCommunityModal"
import { JoinSuccessModal } from "./_components/JoinSuccessModal"
import { JoinPendingModal } from "./_components/JoinPendingModal"
import { LeaveConfirmModal } from "./_components/LeaveConfirmModal"

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
	currentUserId,
	currentUserRole,
	onJoinClick,
	onTabChange,
	experienceFilters,
	pendingDmConversationId,
	onPendingDmHandled,
	onOpenDM,
}: {
	activeTab: TabKey
	visibleTabs: Tab[]
	community: CommunityDetails
	isLoggedIn: boolean
	isMember: boolean
	currentUserId: string | null
	currentUserRole: CommunityRole | null
	onJoinClick: () => void
	onTabChange: (tab: TabKey) => void
	experienceFilters: ExperienceFilters
	pendingDmConversationId: string | null
	onPendingDmHandled: () => void
	onOpenDM: (conversationId: string) => void
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
				<WhatToDoCard isMember={isMember} onTabChange={onTabChange} onJoinClick={onJoinClick} />
				<UpcomingExperiences communitySlug={community.slug} onViewAll={() => onTabChange("experiences")} />
				<LatestFromCommunity communityId={community.id} isMember={isMember} onViewAll={() => onTabChange("feed")} />
			</>
		)
	}

	if (activeTab === "experiences") return <ExperiencesTabContent communitySlug={community.slug} filters={experienceFilters} />

	if (activeTab === "chat") return (
		<ChatTabContent
			communityName={community.name}
			communityId={community.id}
			currentUserId={currentUserId}
			currentUserRole={currentUserRole}
			pendingDmConversationId={pendingDmConversationId}
			onPendingDmHandled={onPendingDmHandled}
			onGoToMembers={() => onTabChange("members")}
		/>
	)
	if (activeTab === "announcements") return <AnnouncementsTabContent communityId={community.id} />
	if (activeTab === "feed") return <FeedTabContent communityId={community.id} currentUserRole={currentUserRole} />
	if (activeTab === "members") return <MembersTabContent communityId={community.id} onOpenDM={onOpenDM} />

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
				<Skeleton.Text className="w-36 mb-6" />
				<div className="flex gap-8 items-start">
					<div className="flex-1 min-w-0 flex flex-col gap-5">
						<Skeleton.Block className="h-64 rounded-panel" />
						<div className="flex gap-1">
							{Array.from({ length: 4 }).map((_, i) => (
								<Skeleton.Block key={i} className="h-9 w-24 rounded-full" />
							))}
						</div>
						<Skeleton.Block className="h-48 rounded-panel" />
					</div>
					<div className="hidden lg:flex flex-col gap-4 w-100 shrink-0">
						<Skeleton.Block className="h-72 rounded-panel" />
					</div>
				</div>
			</div>
		</main>
	)
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CommunityDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = use(params)

	const router = useRouter()
	const user = useAuthStore(s => s.user)
	const authLoading = useAuthStore(s => s.authLoading)
	const profileId = useAttendeeProfileStore(s => s.profile?.id ?? null)

	const [apiData, setApiData] = useState<CommunityDetailResponse | null | "loading">("loading")
	const [isMemberOverride, setIsMemberOverride] = useState<boolean | null>(null)
	const [currentUserRole, setCurrentUserRole] = useState<CommunityRole | null>(null)
	const [activeTab, setActiveTab] = useState<TabKey>("overview")
	const [experienceFilters, setExperienceFilters] = useState<ExperienceFilters>(DEFAULT_EXPERIENCE_FILTERS)
	const [announcementUnreadCount, setAnnouncementUnreadCount] = useState(0)
	const [chatDMUnreadCount, setChatDMUnreadCount] = useState(0)
	const [pendingDmConversationId, setPendingDmConversationId] = useState<string | null>(null)
	const [joinModalOpen, setJoinModalOpen] = useState(false)
	const [successModalOpen, setSuccessModalOpen] = useState(false)
	const [pendingModalOpen, setPendingModalOpen] = useState(false)
	const [leaveModalOpen, setLeaveModalOpen] = useState(false)

	useEffect(() => {
		if (authLoading) return
		getCommunityBySlug(slug).then(res => setApiData(res))
	}, [slug, authLoading])

	useEffect(() => {
		if (!user || !apiData || apiData === "loading" || !apiData.isMember) return
		getAnnouncementUnreadCount(apiData.id)
			.then(count => setAnnouncementUnreadCount(count))
			.catch(() => {/* silent */})
		getTotalUnreadDMCount(apiData.id)
			.then(count => setChatDMUnreadCount(count))
			.catch(() => {/* silent */})
	}, [user, apiData])

	// Fetch current user's role from members list — community detail members array may be partial
	useEffect(() => {
		if (!profileId || !apiData || apiData === "loading" || !apiData.isMember) return
		getCommunityMembers(apiData.id, { limit: 100 })
			.then(res => {
				const me = res.data.find(m => m.userId === profileId)
				setCurrentUserRole((me?.role as CommunityRole) ?? null)
			})
			.catch(() => setCurrentUserRole(null))
	}, [profileId, apiData])

	if (apiData === "loading") return <CommunityPageSkeleton />
	if (!apiData) notFound()

	const isLoggedIn = !!user
	const isMember = isMemberOverride ?? apiData.isMember

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

	const openJoinModal = () => {
		if (!isLoggedIn) {
			router.push(`/attendee/login?redirect=${encodeURIComponent(window.location.pathname)}`)
			return
		}
		setJoinModalOpen(true)
	}

	const handleLeave = async () => {
		await leaveCommunity(apiData.id)
		setIsMemberOverride(false)
		setLeaveModalOpen(false)
	}

	const handleJoin = async (profileVisibility: ProfileVisibility) => {
		const res = await joinCommunity(apiData.id, profileVisibility)
		setJoinModalOpen(false)
		if (res.status === "ACTIVE") {
			setIsMemberOverride(true)
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
						<CommunityHero community={community} isMember={isMember} isSaved={apiData.isSaved} onJoinClick={openJoinModal} onLeaveClick={() => setLeaveModalOpen(true)} />

						{/* Tabs row */}
						<div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
							{visibleTabs.map(tab => {
								const locked = tab.requiresAuth && (!isLoggedIn || !isMember)
								const isActive = safeActiveTab === tab.key
								const showAnnouncementBadge = tab.key === "announcements" && !locked && announcementUnreadCount > 0
								const showChatBadge = tab.key === "chat" && !locked && chatDMUnreadCount > 0

								return (
									<button
										key={tab.key}
										type="button"
										onClick={() => {
											setActiveTab(tab.key)
											if (tab.key === "chat" && chatDMUnreadCount > 0) {
												setChatDMUnreadCount(0)
											}
											if (tab.key === "announcements" && announcementUnreadCount > 0) {
												setAnnouncementUnreadCount(0)
												markAnnouncementsRead(apiData.id).catch(() => {/* silent */})
											}
										}}
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
										{showAnnouncementBadge && (
											<span className="flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold bg-action-primary text-text-inverse rounded-full leading-none">
												{announcementUnreadCount > 99 ? "99+" : announcementUnreadCount}
											</span>
										)}
										{showChatBadge && (
											<span className="size-2 rounded-full bg-action-primary shrink-0" />
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
							currentUserId={user?.uid ?? null}
							currentUserRole={currentUserRole}
							onJoinClick={openJoinModal}
							onTabChange={setActiveTab}
							experienceFilters={experienceFilters}
							pendingDmConversationId={pendingDmConversationId}
							onPendingDmHandled={() => setPendingDmConversationId(null)}
							onOpenDM={(conversationId) => {
								setPendingDmConversationId(conversationId)
								setActiveTab("chat")
							}}
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
							communitySlug={community.slug}
							communityId={community.id}
							onTabChange={tab => setActiveTab(tab as TabKey)}
							experienceFilters={experienceFilters}
							onExperienceFilterChange={setExperienceFilters}
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
					} catch (err) {
						toast.error(getApiErrorMessage(err))
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

			<LeaveConfirmModal
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
		</main>
	)
}
