"use client"

import { useEffect, useState, useCallback, useMemo, useRef, Suspense } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"
import type {
	ChatRole,
	ChatCategoryKey,
	ChatViewMode,
	CategoryDefinition,
	UnifiedRequestItem,
	UnifiedActiveThread,
	RequestDirection,
} from "./ChatHubTypes"
import { ChatHubLandingView } from "./ChatHubLandingView"
import { ChatHubActiveView } from "./ChatHubActiveView"
import { useNotificationStore } from "@/store/notificationStore"
import { useHostStore } from "@/store/hostStore"
import { useBrandStore } from "@/store/brandStore"
import { useSpaceStore } from "@/store/spaceStore"

// APIs
import {
	getMySponsorshipChats,
	acceptSponsorshipChatRequest,
	type SponsorshipChatThread,
	getMySpaceChats,
	getMySpaceHostChats,
	acceptSpaceChatRequest,
	declineSpaceChatRequest,
	acceptSpaceHostChatRequest,
	declineSpaceHostChatRequest,
	type SpaceChatThread,
	type SpaceHostChatThread,
	getMyCommunityCollaborationChats,
	getMyBrandCommunityCollaborationChats,
	acceptBrandCommunityCollaborationRequest,
	declineBrandCommunityCollaborationRequest,
	acceptCommunityCollaborationRequest,
	declineCommunityCollaborationRequest,
	type CommunityCollaborationThread,
	type BrandCommunityCollaborationThread,
} from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"

const DATA_POLL_MS = 6000

interface ChatHubProps {
	role: ChatRole
	defaultCategory?: ChatCategoryKey
}

export function ChatHub({ role, defaultCategory }: ChatHubProps) {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()

	const { notifications, markThreadRead } = useNotificationStore()
	const hostProfile = useHostStore((s) => s.profile)
	const brandProfile = useBrandStore((s) => s.profile)
	const spaceProfile = useSpaceStore((s) => s.profile)

	const ownName = useMemo(() => {
		if (role === "COMMUNITY") return hostProfile?.displayName || "You"
		if (role === "BRAND") return brandProfile?.brandName || "You"
		return spaceProfile?.businessName || "You"
	}, [role, hostProfile, brandProfile, spaceProfile])

	// Initial default category by role
	const initialCat: ChatCategoryKey = useMemo(() => {
		if (defaultCategory) return defaultCategory
		if (role === "BRAND") return "campaigns"
		return "sponsorships"
	}, [defaultCategory, role])

	// State
	const [viewMode, setViewMode] = useState<ChatViewMode>("landing")
	const [activeCategory, setActiveCategory] = useState<ChatCategoryKey>(initialCat)
	const [activeQueue, setActiveQueue] = useState<RequestDirection>("INCOMING")
	const [categoryFilter, setCategoryFilter] = useState<string>("ALL")
	const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
	const [respondingId, setRespondingId] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)

	// Raw data stores
	const [sponsorshipAccepted, setSponsorshipAccepted] = useState<SponsorshipChatThread[]>([])
	const [sponsorshipRequested, setSponsorshipRequested] = useState<SponsorshipChatThread[]>([])
	const [spaceThreads, setSpaceThreads] = useState<SpaceChatThread[]>([])
	const [spaceHostThreads, setSpaceHostThreads] = useState<SpaceHostChatThread[]>([])
	const [communityCollabThreads, setCommunityCollabThreads] = useState<CommunityCollaborationThread[]>([])
	const [brandCommunityThreads, setBrandCommunityThreads] = useState<BrandCommunityCollaborationThread[]>([])

	// ─── Fetch All Data ──────────────────────────────────────────────────────────

	const fetchSeq = useRef(0)

	const fetchAllChatData = useCallback(async (quiet = false) => {
		const seq = ++fetchSeq.current
		if (!quiet && fetchSeq.current === 1) setLoading(true)

		try {
			const apiRole = role === "COMMUNITY" ? "HOST" : role === "BRAND" ? "BRAND" : "SPACE"
			const spaceRole = role === "SPACE" ? "SPACE" : role === "BRAND" ? "BRAND" : "COMMUNITY"
			const spaceHostRole = role === "SPACE" ? "SPACE" : "HOST"

			const promises: [
				Promise<SponsorshipChatThread[]>,
				Promise<SponsorshipChatThread[]>,
				Promise<SpaceChatThread[]>,
				Promise<SpaceHostChatThread[]>,
				Promise<CommunityCollaborationThread[]>,
			] = [
				getMySponsorshipChats("ACCEPTED", apiRole).catch(() => []),
				getMySponsorshipChats("REQUESTED", apiRole).catch(() => []),
				getMySpaceChats(undefined, spaceRole).catch(() => []),
				role === "COMMUNITY" || role === "SPACE"
					? getMySpaceHostChats(undefined, spaceHostRole).catch(() => [])
					: Promise.resolve([]),
				role === "COMMUNITY"
					? getMyCommunityCollaborationChats().catch(() => [])
					: Promise.resolve([]),
			]

			const [sAccepted, sReq, spThreads, spHostThreads, cCollab] = await Promise.all(promises)
			const brandCommunity = role === "BRAND" || role === "COMMUNITY"
					? await getMyBrandCommunityCollaborationChats(undefined, role === "BRAND" ? "BRAND" : "COMMUNITY").catch(() => [])
				: []

			if (seq !== fetchSeq.current) return

			setSponsorshipAccepted(sAccepted || [])
			setSponsorshipRequested(sReq || [])
			setSpaceThreads(spThreads || [])
			setSpaceHostThreads(spHostThreads || [])
			setCommunityCollabThreads(cCollab || [])
			setBrandCommunityThreads(brandCommunity || [])
		} catch {
			// silent poll refresh
		} finally {
			if (seq === fetchSeq.current) setLoading(false)
		}
	}, [role])

	useEffect(() => {
		fetchAllChatData()
		const interval = setInterval(() => fetchAllChatData(true), DATA_POLL_MS)
		return () => clearInterval(interval)
	}, [fetchAllChatData])

	// ─── URL Deep Links & Query Sync ──────────────────────────────────────────

	useEffect(() => {
		const typeParam = searchParams.get("type")
		const catParam = searchParams.get("category")
		const interestIdParam = searchParams.get("interestId") || searchParams.get("threadId")
		const viewParam = searchParams.get("view")

		if (interestIdParam) {
			setSelectedThreadId(interestIdParam)
			setViewMode("active")
		} else if (viewParam === "active" || catParam) {
			setViewMode("active")
		}

		if (catParam) {
			setActiveCategory(catParam as ChatCategoryKey)
		} else if (typeParam) {
			if (typeParam === "campaign") setActiveCategory("campaigns")
			else if (typeParam === "sponsorship") setActiveCategory("sponsorships")
			else if (typeParam === "brand") setActiveCategory(role === "SPACE" ? "brands" : "sponsorships")
			else if (typeParam === "community") setActiveCategory("communities")
		}
	}, [searchParams, role])

	// Clear unread count when thread is opened
	useEffect(() => {
		if (selectedThreadId) {
			markThreadRead(selectedThreadId)
		}
	}, [selectedThreadId, markThreadRead])

	// ─── Aggregate Active Threads ──────────────────────────────────────────────

	const activeThreadsByCategory = useMemo(() => {
		const result: Record<ChatCategoryKey, UnifiedActiveThread[]> = {
			sponsorships: [],
			campaigns: [],
			spaces: [],
			communities: [],
			brands: [],
		}

		// 1. Sponsorships & Campaigns (from getMySponsorshipChats ACCEPTED)
		sponsorshipAccepted.forEach((t) => {
			const isCampaign = !!t.campaignId
			const catKey: ChatCategoryKey = isCampaign ? "campaigns" : "sponsorships"
			const unread = Math.max(t.unreadCount || 0, 0)

			result[catKey].push({
				id: t.id,
				category: catKey,
				kind: isCampaign ? "CAMPAIGN" : "SPONSORSHIP",
				counterpartName: t.counterpartName,
				counterpartAvatarUrl: t.counterpartAvatarUrl,
				counterpartType: t.counterpartType || (role === "BRAND" ? "COMMUNITY" : "BRAND"),
				title: t.proposalName || (isCampaign ? "Campaign Chat" : "Sponsorship"),
				subtitle: t.counterpartName,
				lastMessagePreview: t.lastMessagePreview,
				lastMessageAt: t.lastMessageAt,
				createdAt: t.createdAt,
				unreadCount: unread,
				hasUnreadMention: t.hasUnreadMention,
				isDealLocked: t.isDealLocked,
				isDealClosed: t.isDealClosed,
				rawThread: t,
			})
		})

		// 2. Space Threads (from getMySpaceChats)
		spaceThreads.forEach((t) => {
			if (t.chatStatus !== "ACCEPTED") return

			if (role === "SPACE") {
				// In Space role: split into Communities and Brands
				const catKey: ChatCategoryKey = t.requesterType === "BRAND" ? "brands" : "communities"
				result[catKey].push({
					id: t.id,
					category: catKey,
					kind: "SPACE_INTEREST",
					counterpartName: t.counterpartName,
					counterpartAvatarUrl: t.counterpartAvatarUrl,
					counterpartType: t.requesterType,
					title: t.counterpartName || "Hub Booking",
					subtitle: t.counterpartName,
					lastMessagePreview: t.lastMessagePreview,
					lastMessageAt: t.lastMessageAt,
					createdAt: t.createdAt,
					unreadCount: t.unreadCount || 0,
					rawThread: t,
				})
			} else {
				// In Community / Brand role: goes into "spaces"
				result.spaces.push({
					id: t.id,
					category: "spaces",
					kind: "SPACE_INTEREST",
					counterpartName: t.counterpartName,
					counterpartAvatarUrl: t.counterpartAvatarUrl,
					counterpartType: "SPACE",
					title: t.counterpartName || "Hub Booking",
					subtitle: t.counterpartName,
					lastMessagePreview: t.lastMessagePreview,
					lastMessageAt: t.lastMessageAt,
					createdAt: t.createdAt,
					unreadCount: t.unreadCount || 0,
					rawThread: t,
				})
			}
		})

		// 3. Space Host Threads (Space <-> Community)
		spaceHostThreads.forEach((t) => {
			if (t.chatStatus !== "ACCEPTED") return

			if (role === "SPACE") {
				result.communities.push({
					id: t.id,
					category: "communities",
					kind: "SPACE_HOST",
					counterpartName: t.counterpartName,
					counterpartAvatarUrl: t.counterpartAvatarUrl,
					counterpartType: "COMMUNITY",
					title: t.counterpartName || "Hub Partnership",
					subtitle: t.counterpartName,
					lastMessagePreview: t.lastMessagePreview,
					lastMessageAt: t.lastMessageAt,
					createdAt: t.createdAt,
					unreadCount: t.unreadCount || 0,
					rawThread: t,
				})
			} else {
				// Host sees under "spaces"
				result.spaces.push({
					id: t.id,
					category: "spaces",
					kind: "SPACE_HOST",
					counterpartName: t.counterpartName,
					counterpartAvatarUrl: t.counterpartAvatarUrl,
					counterpartType: "SPACE",
					title: t.counterpartName || "Hub Partnership",
					subtitle: t.counterpartName,
					lastMessagePreview: t.lastMessagePreview,
					lastMessageAt: t.lastMessageAt,
					createdAt: t.createdAt,
					unreadCount: t.unreadCount || 0,
					rawThread: t,
				})
			}
		})


		// 4. Community Collaboration Threads (Community <-> Community)
		communityCollabThreads.forEach((t) => {
			if (t.chatStatus !== "ACCEPTED") return
			result.communities.push({
				id: t.id,
				category: "communities",
				kind: "COMMUNITY_COLLAB",
				counterpartName: t.counterpartName,
				counterpartAvatarUrl: t.counterpartAvatarUrl,
				counterpartType: "COMMUNITY",
				title: "Community Collaboration",
				subtitle: t.counterpartName,
				lastMessagePreview: t.lastMessagePreview,
				lastMessageAt: t.lastMessageAt,
				createdAt: t.createdAt,
				unreadCount: t.unreadCount || 0,
				rawThread: t,
			})
		})

		brandCommunityThreads.forEach((t) => {
			if (t.chatStatus !== "ACCEPTED") return
			const category: ChatCategoryKey = role === "BRAND" ? "communities" : "brands"
			result[category].push({
				id: t.id,
				category,
				kind: "COMMUNITY_COLLAB",
				counterpartName: t.counterpartName,
				counterpartAvatarUrl: t.counterpartAvatarUrl,
				counterpartType: role === "BRAND" ? "COMMUNITY" : "BRAND",
				title: role === "BRAND" ? "Community Collaboration" : "Brand Collaboration",
				subtitle: t.counterpartName,
				lastMessagePreview: t.lastMessagePreview,
				lastMessageAt: t.lastMessageAt,
				createdAt: t.createdAt,
				unreadCount: t.unreadCount || 0,
				rawThread: t,
			})
		})

		// Sort each active category list by recency
		const sortByDate = (a: UnifiedActiveThread, b: UnifiedActiveThread) => {
			const tA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0)
			const tB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0)
			return tB - tA
		}

		Object.keys(result).forEach((k) => {
			result[k as ChatCategoryKey].sort(sortByDate)
		})

		return result
	}, [sponsorshipAccepted, spaceThreads, spaceHostThreads, communityCollabThreads, brandCommunityThreads, role])

	// ─── Aggregate Unified Requests (Incoming & Sent) ──────────────────────────

	const allUnifiedRequests = useMemo(() => {
		const list: UnifiedRequestItem[] = []

		if (role === "COMMUNITY") {
			// 1. Sponsorship Requests:
			// - Incoming: Brand interested in Host proposal
			sponsorshipRequested.forEach((t) => {
				if (!t.campaignId) {
					list.push({
						id: t.id,
						category: "sponsorships",
						kind: "SPONSORSHIP",
						direction: "INCOMING",
						status: "REQUESTED",
						counterpartName: t.counterpartName,
						counterpartAvatarUrl: t.counterpartAvatarUrl,
						counterpartType: "BRAND",
						title: t.proposalName || "Sponsorship Proposal",
						description: "This brand is interested in your proposal.",
						createdAt: t.createdAt,
						lastMessagePreview: t.lastMessagePreview,
						isIncoming: true,
						rawItem: t,
					})
				} else {
					// - Sent: Host applied to Brand Campaign
					list.push({
						id: t.id,
						category: "campaigns",
						kind: "CAMPAIGN",
						direction: "OUTGOING",
						status: "REQUESTED",
						counterpartName: t.counterpartName,
						counterpartAvatarUrl: t.counterpartAvatarUrl,
						counterpartType: "BRAND",
						title: t.proposalName || "Brand Campaign",
						description: "You showed interest in this campaign. Awaiting brand approval.",
						createdAt: t.createdAt,
						lastMessagePreview: t.lastMessagePreview,
						isIncoming: false,
						rawItem: t,
					})
				}
			})

			// 2. Spaces Requests:
			// - Sent: Community sent inquiry to Space
			spaceThreads.forEach((t) => {
				if (t.chatStatus === "REQUESTED") {
					list.push({
						id: t.id,
						category: "spaces",
						kind: "SPACE_INTEREST",
						direction: "OUTGOING",
						status: "REQUESTED",
						counterpartName: t.counterpartName,
						counterpartAvatarUrl: t.counterpartAvatarUrl,
						counterpartType: "SPACE",
						title: t.counterpartName || "Hub Booking",
						description: "You sent a booking inquiry to this hub.",
						createdAt: t.createdAt,
						lastMessagePreview: t.lastMessagePreview,
						isIncoming: false,
						rawItem: t,
					})
				}
			})

			// - Incoming: Space reached out to Community
			spaceHostThreads.forEach((t) => {
				if (t.chatStatus === "REQUESTED") {
					list.push({
						id: t.id,
						category: "spaces",
						kind: "SPACE_HOST",
						direction: "INCOMING",
						status: "REQUESTED",
						counterpartName: t.counterpartName,
						counterpartAvatarUrl: t.counterpartAvatarUrl,
						counterpartType: "SPACE",
						title: t.counterpartName || "Hub Partnership",
						description: "This hub partner wants to host your community events.",
						createdAt: t.createdAt,
						lastMessagePreview: t.lastMessagePreview,
						isIncoming: true,
						rawItem: t,
					})
				}
			})

			// 3. Communities Requests:
			communityCollabThreads.forEach((t) => {
				if (t.chatStatus === "REQUESTED") {
					const isIncoming = t.direction === "INCOMING"
					list.push({
						id: t.id,
						category: "communities",
						kind: "COMMUNITY_COLLAB",
						direction: isIncoming ? "INCOMING" : "OUTGOING",
						status: "REQUESTED",
						counterpartName: t.counterpartName,
						counterpartAvatarUrl: t.counterpartAvatarUrl,
						counterpartType: "COMMUNITY",
						title: "Community Collaboration",
						description: isIncoming
							? "This community sent you a collaboration request."
							: "You sent a collaboration request to this community.",
						createdAt: t.createdAt,
						lastMessagePreview: t.lastMessagePreview,
						isIncoming,
						rawItem: t,
					})
				}
			})

			brandCommunityThreads.forEach((t) => {
				if (t.chatStatus !== "REQUESTED") return
				const isIncoming = role === "COMMUNITY"
				list.push({
					id: t.id,
					category: "brands",
					kind: "COMMUNITY_COLLAB",
					direction: isIncoming ? "INCOMING" : "OUTGOING",
					status: "REQUESTED",
					counterpartName: t.counterpartName,
					counterpartAvatarUrl: t.counterpartAvatarUrl,
					counterpartType: "BRAND",
					title: "Brand Collaboration",
					description: isIncoming ? "This brand wants to collaborate with your community." : "You sent a collaboration request to this community.",
					createdAt: t.createdAt,
					lastMessagePreview: t.lastMessagePreview,
					isIncoming,
					rawItem: t,
				})
			})
		} else if (role === "SPACE") {
			// 1. Sponsorships:
			sponsorshipRequested.forEach((t) => {
				list.push({
					id: t.id,
					category: "sponsorships",
					kind: "SPONSORSHIP",
					direction: "INCOMING",
					status: "REQUESTED",
					counterpartName: t.counterpartName,
					counterpartAvatarUrl: t.counterpartAvatarUrl,
					counterpartType: "BRAND",
					title: t.proposalName || "Hub Sponsorship",
					description: "This brand is interested in your hub sponsorship proposal.",
					createdAt: t.createdAt,
					lastMessagePreview: t.lastMessagePreview,
					isIncoming: true,
					rawItem: t,
				})
			})

			// 2. Communities and Brands space inquiries (Incoming to Space)
			spaceThreads.forEach((t) => {
				if (t.chatStatus === "REQUESTED") {
					const catKey: ChatCategoryKey = t.requesterType === "BRAND" ? "brands" : "communities"
					list.push({
						id: t.id,
						category: catKey,
						kind: "SPACE_INTEREST",
						direction: "INCOMING",
						status: "REQUESTED",
						counterpartName: t.counterpartName,
						counterpartAvatarUrl: t.counterpartAvatarUrl,
						counterpartType: t.requesterType,
						title: t.counterpartName || "Hub Inquiry",
						description: `${t.counterpartName} requested to book or partner with your hub.`,
						createdAt: t.createdAt,
						lastMessagePreview: t.lastMessagePreview,
						isIncoming: true,
						rawItem: t,
					})
				}
			})

			// 3. Sent to Communities (Space host outreach outgoing)
			spaceHostThreads.forEach((t) => {
				if (t.chatStatus === "REQUESTED") {
					list.push({
						id: t.id,
						category: "communities",
						kind: "SPACE_HOST",
						direction: "OUTGOING",
						status: "REQUESTED",
						counterpartName: t.counterpartName,
						counterpartAvatarUrl: t.counterpartAvatarUrl,
						counterpartType: "COMMUNITY",
						title: t.counterpartName || "Hub Outreach",
						description: "You sent a partnership invitation to this community.",
						createdAt: t.createdAt,
						lastMessagePreview: t.lastMessagePreview,
						isIncoming: false,
						rawItem: t,
					})
				}
			})
		} else if (role === "BRAND") {
			// 1. Campaigns (Incoming requests from communities) & Sponsorships (Sent requests by Brand)
			sponsorshipRequested.forEach((t) => {
				if (t.campaignId) {
					// Incoming to Brand
					list.push({
						id: t.id,
						category: "campaigns",
						kind: "CAMPAIGN",
						direction: "INCOMING",
						status: "REQUESTED",
						counterpartName: t.counterpartName,
						counterpartAvatarUrl: t.counterpartAvatarUrl,
						counterpartType: "COMMUNITY",
						title: t.proposalName || "Campaign Application",
						description: "This community applied to your campaign.",
						createdAt: t.createdAt,
						lastMessagePreview: t.lastMessagePreview,
						isIncoming: true,
						rawItem: t,
					})
				} else {
					// Sent by Brand
					list.push({
						id: t.id,
						category: "sponsorships",
						kind: "SPONSORSHIP",
						direction: "OUTGOING",
						status: "REQUESTED",
						counterpartName: t.counterpartName,
						counterpartAvatarUrl: t.counterpartAvatarUrl,
						counterpartType: "COMMUNITY",
						title: t.proposalName || "Sponsorship Interest",
						description: "You expressed interest in this proposal. Awaiting community acceptance.",
						createdAt: t.createdAt,
						lastMessagePreview: t.lastMessagePreview,
						isIncoming: false,
						rawItem: t,
					})
				}
			})

			// 2. Spaces (Sent requests by Brand)
			spaceThreads.forEach((t) => {
				if (t.chatStatus === "REQUESTED") {
					list.push({
						id: t.id,
						category: "spaces",
						kind: "SPACE_INTEREST",
						direction: "OUTGOING",
						status: "REQUESTED",
						counterpartName: t.counterpartName,
						counterpartAvatarUrl: t.counterpartAvatarUrl,
						counterpartType: "SPACE",
						title: t.counterpartName || "Hub Inquiry",
						description: "You sent an inquiry to this hub partner.",
						createdAt: t.createdAt,
						lastMessagePreview: t.lastMessagePreview,
						isIncoming: false,
						rawItem: t,
					})
				}
			})

			// 3. Community collaboration requests sent by Brand
			brandCommunityThreads.forEach((t) => {
				if (t.chatStatus === "REQUESTED") {
					list.push({
						id: t.id,
						category: "communities",
						kind: "COMMUNITY_COLLAB",
						direction: "OUTGOING",
						status: "REQUESTED",
						counterpartName: t.counterpartName,
						counterpartAvatarUrl: t.counterpartAvatarUrl,
						counterpartType: "COMMUNITY",
						title: "Community Collaboration",
						description: "You sent a collaboration request to this community.",
						createdAt: t.createdAt,
						lastMessagePreview: t.lastMessagePreview,
						isIncoming: false,
						rawItem: t,
					})
				}
			})
		}


		return list.sort((a, b) => {
			const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0
			const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0
			return tB - tA
		})
		}, [role, sponsorshipRequested, spaceThreads, spaceHostThreads, communityCollabThreads, brandCommunityThreads])

	// Counts
	const incomingRequestsCount = useMemo(() => {
		return allUnifiedRequests.filter((r) => r.direction === "INCOMING").length
	}, [allUnifiedRequests])

	const sentRequestsCount = useMemo(() => {
		return allUnifiedRequests.filter((r) => r.direction === "OUTGOING").length
	}, [allUnifiedRequests])

	// ─── Categories Definition List by Role ────────────────────────────────────

	const categories: CategoryDefinition[] = useMemo(() => {
		if (role === "COMMUNITY") {
			const spUnread = activeThreadsByCategory.sponsorships.reduce((sum, t) => sum + t.unreadCount, 0)
			const cpUnread = activeThreadsByCategory.campaigns.reduce((sum, t) => sum + t.unreadCount, 0)
			const spcUnread = activeThreadsByCategory.spaces.reduce((sum, t) => sum + t.unreadCount, 0)
			const comUnread = activeThreadsByCategory.communities.reduce((sum, t) => sum + t.unreadCount, 0)
			const brUnread = activeThreadsByCategory.brands.reduce((sum, t) => sum + t.unreadCount, 0)

			const spPending = allUnifiedRequests.filter((r) => r.category === "sponsorships" && r.direction === "INCOMING").length
			const cpPending = allUnifiedRequests.filter((r) => r.category === "campaigns" && r.direction === "OUTGOING").length
			const spcPending = allUnifiedRequests.filter((r) => r.category === "spaces" && r.direction === "INCOMING").length
			const comPending = allUnifiedRequests.filter((r) => r.category === "communities" && r.direction === "INCOMING").length
			const brPending = allUnifiedRequests.filter((r) => r.category === "brands" && r.direction === "INCOMING").length

			return [
				{
					key: "sponsorships",
					label: "Sponsorships",
					description: "Talk to brands interested in your experience proposals.",
					badgeCount: spUnread,
					activeCount: activeThreadsByCategory.sponsorships.length,
					pendingRequestsCount: spPending,
				},
				/* {
					key: "campaigns",
					label: "Campaigns",
					description: "Talk to brands about campaigns you applied to.",
					badgeCount: cpUnread,
					activeCount: activeThreadsByCategory.campaigns.length,
					pendingRequestsCount: cpPending,
				}, */
				{
					key: "spaces",
					label: "Hubs",
					description: "Collaborate with community hubs & venues for events.",
					badgeCount: spcUnread,
					activeCount: activeThreadsByCategory.spaces.length,
					pendingRequestsCount: spcPending,
				},
				{
					key: "communities",
					label: "Communities",
					description: "Partner, cross-promote, and co-host with other communities.",
					badgeCount: comUnread,
					activeCount: activeThreadsByCategory.communities.length,
					pendingRequestsCount: comPending,
				},
				{
					key: "brands",
					label: "Brands",
					description: "Manage collaboration requests from brands.",
					badgeCount: brUnread,
					activeCount: activeThreadsByCategory.brands.length,
					pendingRequestsCount: brPending,
				},
			]
		} else if (role === "SPACE") {
			const spUnread = activeThreadsByCategory.sponsorships.reduce((sum, t) => sum + t.unreadCount, 0)
			const comUnread = activeThreadsByCategory.communities.reduce((sum, t) => sum + t.unreadCount, 0)
			const brUnread = activeThreadsByCategory.brands.reduce((sum, t) => sum + t.unreadCount, 0)

			const spPending = allUnifiedRequests.filter((r) => r.category === "sponsorships" && r.direction === "INCOMING").length
			const comPending = allUnifiedRequests.filter((r) => r.category === "communities" && r.direction === "INCOMING").length
			const brPending = allUnifiedRequests.filter((r) => r.category === "brands" && r.direction === "INCOMING").length

			return [
				{
					key: "sponsorships",
					label: "Sponsorships",
					description: "Talk to brands interested in hub sponsorship proposals.",
					badgeCount: spUnread,
					activeCount: activeThreadsByCategory.sponsorships.length,
					pendingRequestsCount: spPending,
				},
				/* {
					key: "campaigns",
					label: "Campaigns",
					description: "Brand campaign venue partnerships.",
					disabled: true,
					badgeCount: 0,
					activeCount: 0,
					pendingRequestsCount: 0,
				}, */
				{
					key: "communities",
					label: "Communities",
					description: "Collaborate with host communities & event organizers.",
					badgeCount: comUnread,
					activeCount: activeThreadsByCategory.communities.length,
					pendingRequestsCount: comPending,
				},
				{
					key: "brands",
					label: "Brands",
					description: "Manage hub bookings and inquiries from brands.",
					badgeCount: brUnread,
					activeCount: activeThreadsByCategory.brands.length,
					pendingRequestsCount: brPending,
				},
			]
		} else {
			// BRAND role
			const cpUnread = activeThreadsByCategory.campaigns.reduce((sum, t) => sum + t.unreadCount, 0)
			const spUnread = activeThreadsByCategory.sponsorships.reduce((sum, t) => sum + t.unreadCount, 0)
			const spcUnread = activeThreadsByCategory.spaces.reduce((sum, t) => sum + t.unreadCount, 0)
			const comUnread = activeThreadsByCategory.communities.reduce((sum, t) => sum + t.unreadCount, 0)

			const cpPending = allUnifiedRequests.filter((r) => r.category === "campaigns" && r.direction === "INCOMING").length
			const spPending = allUnifiedRequests.filter((r) => r.category === "sponsorships" && r.direction === "OUTGOING").length
			const spcPending = allUnifiedRequests.filter((r) => r.category === "spaces" && r.direction === "OUTGOING").length
			const comPending = allUnifiedRequests.filter((r) => r.category === "communities" && r.direction === "OUTGOING").length

			return [
				{
					key: "campaigns",
					label: "Campaigns",
					description: "Manage community creators applied to your campaigns.",
					badgeCount: cpUnread,
					activeCount: activeThreadsByCategory.campaigns.length,
					pendingRequestsCount: cpPending,
				},
				{
					key: "sponsorships",
					label: "Sponsorships",
					description: "Talk to communities about experience proposals you requested.",
					badgeCount: spUnread,
					activeCount: activeThreadsByCategory.sponsorships.length,
					pendingRequestsCount: spPending,
				},
				{
					key: "communities",
					label: "Communities",
					description: "Manage collaboration requests from communities.",
					badgeCount: comUnread,
					activeCount: activeThreadsByCategory.communities.length,
					pendingRequestsCount: comPending,
				},
				{
					key: "spaces",
					label: "Hubs",
					description: "Explore and book verified venues & community hubs.",
					badgeCount: spcUnread,
					activeCount: activeThreadsByCategory.spaces.length,
					pendingRequestsCount: spcPending,
				},
			]
		}
	}, [role, activeThreadsByCategory, allUnifiedRequests])

	// ─── Accept / Decline Request Handlers ─────────────────────────────────────

	const handleAcceptRequest = async (req: UnifiedRequestItem) => {
		setRespondingId(req.id)
		try {
			if (req.kind === "SPONSORSHIP" || req.kind === "CAMPAIGN") {
				await acceptSponsorshipChatRequest(req.id)
			} else if (req.kind === "SPACE_INTEREST") {
				const spaceRole = role === "SPACE" ? "SPACE" : role === "BRAND" ? "BRAND" : "COMMUNITY"
				await acceptSpaceChatRequest(req.id, spaceRole)
			} else if (req.kind === "SPACE_HOST") {
				const spaceHostRole = role === "SPACE" ? "SPACE" : "HOST"
				await acceptSpaceHostChatRequest(req.id, spaceHostRole)
			} else if (req.kind === "COMMUNITY_COLLAB") {
				if (req.rawItem?.collaborationType === "BRAND_COMMUNITY") await acceptBrandCommunityCollaborationRequest(req.id, role === "BRAND" ? "BRAND" : "COMMUNITY")
				else await acceptCommunityCollaborationRequest(req.id)
			}

			toast.success("Request accepted — chat is now open!")
			await fetchAllChatData(true)
			// Automatically open in Step 2 Active Chat View
			setActiveCategory(req.category)
			setSelectedThreadId(req.id)
			setViewMode("active")
		} catch (err) {
			toast.error(getApiErrorMessage(err) || "Failed to accept request.")
		} finally {
			setRespondingId(null)
		}
	}

	const handleDeclineRequest = async (req: UnifiedRequestItem) => {
		setRespondingId(req.id)
		try {
			if (req.kind === "SPACE_INTEREST") {
				const spaceRole = role === "SPACE" ? "SPACE" : role === "BRAND" ? "BRAND" : "COMMUNITY"
				await declineSpaceChatRequest(req.id, spaceRole)
			} else if (req.kind === "SPACE_HOST") {
				const spaceHostRole = role === "SPACE" ? "SPACE" : "HOST"
				await declineSpaceHostChatRequest(req.id, spaceHostRole)
			} else if (req.kind === "COMMUNITY_COLLAB") {
				if (req.rawItem?.collaborationType === "BRAND_COMMUNITY") await declineBrandCommunityCollaborationRequest(req.id, role === "BRAND" ? "BRAND" : "COMMUNITY")
				else await declineCommunityCollaborationRequest(req.id)
			}
			toast.success("Request declined.")
			await fetchAllChatData(true)
		} catch (err) {
			toast.error(getApiErrorMessage(err) || "Failed to decline request.")
		} finally {
			setRespondingId(null)
		}
	}

	// ─── View Mode Switchers ───────────────────────────────────────────────────

	const handleSelectCategory = (cat: ChatCategoryKey) => {
		setActiveCategory(cat)
		setSelectedThreadId(null)
		setViewMode("active")
	}

	const handleBackToLanding = () => {
		setViewMode("landing")
		setSelectedThreadId(null)
	}

	const handleOpenRequestsHub = () => {
		setActiveQueue("INCOMING")
		setCategoryFilter("ALL")
		setViewMode("landing")
	}

	return (
		<div className="flex flex-col flex-1 min-h-0 bg-white h-full">
			{/* Brand Topbar Greeting */}
			<div className="hidden sm:flex justify-between items-center px-8 py-3.5 border-b border-black/10 shrink-0">
				<p className="text-sm font-semibold text-black/50 mx-auto">
					Welcome to <span className="text-[#EE2C2C] font-bold">Meetday</span>
				</p>
			</div>

			<div className="flex-1 min-h-0 px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 max-w-7xl w-full mx-auto flex flex-col h-full">
				{viewMode === "landing" ? (
					<ChatHubLandingView
						role={role}
						categories={categories}
						onSelectCategory={handleSelectCategory}
						requests={allUnifiedRequests}
						activeQueue={activeQueue}
						setActiveQueue={setActiveQueue}
						categoryFilter={categoryFilter}
						setCategoryFilter={setCategoryFilter}
						incomingCount={incomingRequestsCount}
						sentCount={sentRequestsCount}
						onAcceptRequest={handleAcceptRequest}
						onDeclineRequest={handleDeclineRequest}
						respondingId={respondingId}
						loading={loading}
					/>
				) : (
					<ChatHubActiveView
						role={role}
						activeCategory={activeCategory}
						categories={categories}
						onSelectCategory={setActiveCategory}
						onBackToLanding={handleBackToLanding}
						onOpenRequestsHub={handleOpenRequestsHub}
						pendingRequestsTotalCount={incomingRequestsCount}
						activeThreads={activeThreadsByCategory[activeCategory] || []}
						selectedThreadId={selectedThreadId}
						onSelectThreadId={setSelectedThreadId}
						loadingThreads={loading}
						ownName={ownName}
						onRefreshThreads={() => fetchAllChatData(true)}
					/>
				)}
			</div>
		</div>
	)
}
