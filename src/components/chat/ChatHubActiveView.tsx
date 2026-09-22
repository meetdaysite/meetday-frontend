"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import clsx from "clsx"
import { toast } from "sonner"
import type {
	ChatRole,
	ChatCategoryKey,
	CategoryDefinition,
	UnifiedActiveThread,
} from "./ChatHubTypes"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import { ImageLightbox } from "@/components/ui/ImageLightbox"
import { EmojiPicker } from "@/components/ui/EmojiPicker"
import { MentionPicker, type MentionSuggestion } from "@/components/chat/MentionPicker"
import { SystemMessageBubble } from "@/components/chat/SystemMessageBubble"
import { LinkifiedText } from "@/components/ui/LinkifiedText"
import GallerySvg from "@/icons/outlined/gallery-wide.svg"
import AltArrowLeftSvg from "@/icons/outlined/alt-arrow-left.svg"
import SearchSvg from "@/icons/outlined/search.svg"
import LockSvg from "@/icons/outlined/lock.svg"
import FileTextSvg from "@/icons/outlined/file-text.svg"
import { playMessageChime } from "@/lib/notificationSound"
import confetti from "canvas-confetti"

// Sponsorship / Campaign APIs & Modals
import {
	getSponsorshipChatMessages,
	sendSponsorshipChatMessage,
	editSponsorshipChatMessage,
	deleteSponsorshipChatMessage,
	getSponsorshipDeal,
	getSponsorshipDealReport,
	type SponsorshipDeal,
} from "@/lib/api"
import {
	DealBanner,
	DealFormModal,
	DealDetailsModal,
	DealReportModal,
} from "@/components/sponsorship/DealPanel"
import { uploadSponsorshipChatImage, isPdfMediaUrl } from "@/lib/uploadMedia"

// Space APIs & Modals
import {
	getSpaceChatMessages,
	sendSpaceChatMessage,
	getSpaceDeal,
	getSpaceDealReport,
	getSpaceHostChatMessages,
	sendSpaceHostChatMessage,
	getSpaceHostDeal,
	getSpaceHostDealReport,
	type SpaceDeal,
	type SpaceDealReport,
	type SpaceHostDeal,
	type SpaceHostDealReport,
} from "@/lib/api"
import {
	SpaceDealBanner,
	SpaceDealFormModal,
	SpaceDealDetailsModal,
	SpaceDealReportModal,
} from "@/components/spaces/SpaceDealPanel"
import {
	SpaceHostDealBanner,
	SpaceHostDealFormModal,
	SpaceHostDealDetailsModal,
	SpaceHostDealReportModal,
} from "@/components/spaces/SpaceHostDealPanel"
import { uploadSpaceChatImage, uploadSpaceHostChatImage } from "@/lib/uploadMedia"

// Community Collaboration APIs
import {
	getCommunityCollaborationChatMessages,
	sendCommunityCollaborationMessage,
	getBrandCommunityCollaborationChatMessages,
	sendBrandCommunityCollaborationMessage,
} from "@/lib/api"
import { uploadCommunityCollaborationChatImage } from "@/lib/uploadMedia"
import { useChatTyping } from "@/hooks/useChatTyping"

const MESSAGES_POLL_MS = 4000

function timeAgo(iso: string | null | undefined): string {
	if (!iso) return ""
	const diffMs = Date.now() - new Date(iso).getTime()
	const mins = Math.floor(diffMs / 60000)
	if (mins < 1) return "now"
	if (mins < 60) return `${mins}m`
	const hours = Math.floor(mins / 60)
	if (hours < 24) return `${hours}h`
	return `${Math.floor(hours / 24)}d`
}

function getCategoryHeading(cat: ChatCategoryKey, role: ChatRole): { title: string; subtitle: string } {
	switch (cat) {
		case "sponsorships":
			return {
				title: "Sponsorship Chats",
				subtitle:
					role === "BRAND"
						? "Talk to communities about proposals you've expressed interest in."
						: role === "SPACE"
						? "Talk to brands interested in your hub sponsorship proposals."
						: "Talk to brands interested in your proposals.",
			}
		case "campaigns":
			return {
				title: "Campaign Chats",
				subtitle:
					role === "BRAND"
						? "Talk to communities interested in your campaigns."
						: "Talk to brands about campaigns you've applied to.",
			}
		case "spaces":
			return {
				title: "Hubs Chats",
				subtitle:
					role === "BRAND"
						? "Manage venue inquiries and collaborate with hub partners."
						: "Collaborate with Community Hubs and manage your requests.",
			}
		case "communities":
			return {
				title: "Community Chats",
				subtitle:
					role === "SPACE"
						? "Collaborate with host communities & event organizers."
						: "Collaborate with other communities and manage partnership chats.",
			}
		case "brands":
			return {
				title: "Brand Chats",
				subtitle: "Manage hub bookings and inquiries from brands.",
			}
		default:
			return {
				title: "Chats",
				subtitle: "Manage your active conversations.",
			}
	}
}

function getCategoryTabStyles(key: ChatCategoryKey, isSelected: boolean): string {
	if (!isSelected) {
		return "text-black/60 hover:text-black hover:bg-black/5"
	}
	switch (key) {
		case "sponsorships":
		case "communities":
			return "bg-[#FFC940] text-black shadow-sm font-black"
		case "campaigns":
		case "brands":
			return "bg-[#EE2C2C] text-white shadow-sm font-black"
		case "spaces":
		default:
			return "bg-black text-white shadow-sm font-black"
	}
}

function getCategoryTabBadgeStyles(key: ChatCategoryKey, isSelected: boolean): string {
	if (!isSelected) {
		return "bg-[#EE2C2C] text-white border-white"
	}
	switch (key) {
		case "sponsorships":
		case "communities":
			return "bg-black text-white border-transparent"
		case "campaigns":
		case "brands":
			return "bg-white text-[#EE2C2C] border-transparent"
		case "spaces":
		default:
			return "bg-[#EE2C2C] text-white border-transparent"
	}
}

interface ChatHubActiveViewProps {
	role: ChatRole
	activeCategory: ChatCategoryKey
	categories: CategoryDefinition[]
	onSelectCategory: (cat: ChatCategoryKey) => void
	onBackToLanding: () => void
	onOpenRequestsHub?: () => void
	pendingRequestsTotalCount?: number
	activeThreads: UnifiedActiveThread[]
	selectedThreadId: string | null
	onSelectThreadId: (id: string | null) => void
	loadingThreads: boolean
	ownName: string
	onRefreshThreads?: () => void
}

export function ChatHubActiveView({
	role,
	activeCategory,
	categories,
	onSelectCategory,
	onBackToLanding,
	activeThreads,
	selectedThreadId,
	onSelectThreadId,
	loadingThreads,
	ownName,
	onRefreshThreads,
}: ChatHubActiveViewProps) {
	const [searchQuery, setSearchQuery] = useState("")

	const headingInfo = useMemo(() => {
		return getCategoryHeading(activeCategory, role)
	}, [activeCategory, role])

	// Filter threads by search query
	const filteredThreads = useMemo(() => {
		if (!searchQuery.trim()) return activeThreads
		const q = searchQuery.toLowerCase()
		return activeThreads.filter((t) => {
			return (
				t.counterpartName.toLowerCase().includes(q) ||
				t.title.toLowerCase().includes(q) ||
				(t.subtitle || "").toLowerCase().includes(q) ||
				(t.lastMessagePreview || "").toLowerCase().includes(q)
			)
		})
	}, [activeThreads, searchQuery])

	const selectedThread = useMemo(() => {
		return activeThreads.find((t) => t.id === selectedThreadId) || null
	}, [activeThreads, selectedThreadId])

	return (
		<div className="flex-1 min-h-0 flex flex-col gap-3 sm:gap-4 h-full">
			
			{/* Top Area: Back to Chats & Requests Hub in standard grey + Dynamic Heading & Category Navtab */}
			<div className={clsx("flex-col gap-2 shrink-0", selectedThreadId ? "hidden sm:flex" : "flex")}>
				{/* Grey Back Link (consistent with back to browsing) */}
				<div>
					<button
						type="button"
						onClick={onBackToLanding}
						className="flex items-center gap-1.5 text-xs font-bold text-black/50 hover:text-black transition-colors mb-1 cursor-pointer select-none"
					>
						<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
						</svg>
						<span>Back to Chats & Requests Hub</span>
					</button>
				</div>

				{/* Page Heading & Navtab Row */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<h1 className="text-2xl sm:text-3xl font-heading font-black text-black tracking-tight">
							{headingInfo.title}
						</h1>
						<p className="text-xs sm:text-sm font-semibold text-black/50 mt-0.5">
							{headingInfo.subtitle}
						</p>
					</div>

					{/* Category Navtab Switcher */}
					<div className="inline-flex items-center p-1 bg-black/5 rounded-2xl border-2 border-black/10 self-start sm:self-auto shrink-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
						{categories.map((cat) => {
							const isSelected = activeCategory === cat.key
							const hasUnread = (cat.badgeCount || 0) > 0
							const isDisabled = !!cat.disabled

							if (isDisabled) return null

							return (
								<button
									key={cat.key}
									type="button"
									onClick={() => {
										onSelectCategory(cat.key)
										onSelectThreadId(null)
									}}
									className={clsx(
										"px-3.5 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none",
										getCategoryTabStyles(cat.key, isSelected)
									)}
								>
									<span>{cat.label}</span>
									{hasUnread && (
										<span
											className={clsx(
												"min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-black flex items-center justify-center border",
												getCategoryTabBadgeStyles(cat.key, isSelected)
											)}
										>
											{cat.badgeCount! > 9 ? "9+" : cat.badgeCount}
										</span>
									)}
								</button>
							)
						})}
					</div>
				</div>
			</div>

			{/* ═════════════════════════════════════════════════════════════
			    MAIN WORKSPACE: Left Column (Active Chats) | Right Window (Chat)
			   ═════════════════════════════════════════════════════════════ */}
			<div className="flex-1 min-h-[440px] border-[3px] border-black rounded-[24px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col sm:flex-row bg-white">
				
				{/* Left Column: Active Chats List */}
				<div
					className={clsx(
						"w-full sm:w-80 md:w-80 shrink-0 sm:min-w-[320px] sm:max-w-[320px] border-b-[3px] sm:border-b-0 sm:border-r-[3px] border-black flex flex-col bg-white",
						selectedThreadId ? "hidden sm:flex" : "flex"
					)}
				>
					{/* Search Header */}
					<div className="p-3 border-b-2 border-black/10 bg-neutral-50 shrink-0">
						<div className="relative">
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search conversations…"
								className="w-full pl-8 pr-3 py-1.5 text-xs font-semibold rounded-xl border-2 border-black/15 focus:border-black outline-none bg-white transition-colors"
							/>
							<Icon
								as={SearchSvg}
								size="xs"
								className="text-black/40 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
							/>
							{searchQuery && (
								<button
									type="button"
									onClick={() => setSearchQuery("")}
									className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black/40 hover:text-black font-bold text-xs"
								>
									✕
								</button>
							)}
						</div>
					</div>

					{/* Conversations List */}
					<div className="flex-1 overflow-y-auto">
						{loadingThreads && activeThreads.length === 0 ? (
							<p className="text-xs font-semibold text-black/40 text-center py-8">Loading conversations…</p>
						) : filteredThreads.length === 0 ? (
							<div className="py-12 px-4 text-center">
								<p className="text-xs font-semibold text-black/40">
									{searchQuery ? "No matching conversations found." : "No active conversations in this category yet."}
								</p>
								<p className="text-[11px] font-semibold text-black/30 mt-1">
									Accepted inquiries will automatically show up here.
								</p>
							</div>
						) : (
							filteredThreads.map((t) => {
								const isSelected = selectedThreadId === t.id
								const unread = isSelected ? 0 : t.unreadCount

								return (
									<button
										key={t.id}
										type="button"
										onClick={() => onSelectThreadId(t.id)}
										className={clsx(
											"w-full text-left px-4 py-3 border-b border-black/10 transition-colors flex items-center gap-3 cursor-pointer",
											isSelected ? "bg-[#FFC940]/25 border-l-4 border-l-[#EE2C2C]" : "hover:bg-neutral-50"
										)}
									>
										{/* Avatar */}
										<div className="relative shrink-0">
											<div className="w-10 h-10 rounded-full border border-black/15 overflow-hidden bg-neutral-100 flex items-center justify-center font-heading font-black text-sm text-black/60 shadow-xs">
												{t.counterpartAvatarUrl ? (
													<img
														src={t.counterpartAvatarUrl}
														alt={t.counterpartName}
														className="w-full h-full object-cover"
													/>
												) : (
													t.counterpartName.charAt(0).toUpperCase()
												)}
											</div>

											{/* Unread badge & mention */}
											{unread > 0 && (
												<div className="absolute -top-1.5 -right-2 flex items-center gap-0.5 z-10">
													{t.hasUnreadMention && (
														<span
															className="size-4.5 rounded-full bg-black text-[#FFC940] text-[10px] font-black flex items-center justify-center border-2 border-white shadow-sm"
															title="You were mentioned"
														>
															@
														</span>
													)}
													<span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#EE2C2C] text-white text-[9px] font-black flex items-center justify-center border-2 border-white shadow-sm">
														{unread > 9 ? "9+" : unread}
													</span>
												</div>
											)}
										</div>

										{/* Thread summary */}
										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between gap-2">
												<div className="flex items-center gap-1.5 min-w-0">
													<p className="text-sm font-black text-black truncate leading-tight">
														{t.counterpartName}
													</p>
													{t.isDealClosed ? (
														<span
															className="shrink-0 inline-flex items-center justify-center size-4 rounded-full bg-[#10B981] text-white"
															title="Deal Closed"
														>
															<svg
																className="size-2.5"
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																strokeWidth={3.5}
																strokeLinecap="round"
																strokeLinejoin="round"
															>
																<polyline points="20 6 9 17 4 12" />
															</svg>
														</span>
													) : t.isDealLocked ? (
														<span className="shrink-0 inline-flex items-center text-black/60" title="Deal Locked">
															<Icon as={LockSvg} size="xs" />
														</span>
													) : null}
												</div>
												<span className="text-[10px] font-semibold text-black/30 shrink-0">
													{timeAgo(t.lastMessageAt || t.createdAt)}
												</span>
											</div>

											{/* Proposal / Context name */}
											<p className="text-[11px] font-semibold text-black/50 truncate mt-0.5">
												{t.title}
											</p>

											{/* Last message preview */}
											{t.lastMessagePreview && (
												<p className="text-[11px] text-black/40 truncate mt-1">
													{t.lastMessagePreview}
												</p>
											)}
										</div>
									</button>
								)
							})
						)}
					</div>
				</div>

				{/* Right Main Window: Active Conversation */}
				<div
					className={clsx(
						"flex-1 min-w-0 min-h-0 flex flex-col bg-white",
						selectedThreadId ? "flex" : "hidden sm:flex"
					)}
				>
					{!selectedThread ? (
						<div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-neutral-50/50">
							<h3 className="text-base font-heading font-black text-black">
								Select a conversation
							</h3>
							<p className="text-xs font-semibold text-black/40 max-w-xs mt-1">
								Choose a conversation from the left to read messages, negotiate terms, or share updates.
							</p>
						</div>
					) : (
						<ActiveConversationPane
							key={selectedThread.id}
							thread={selectedThread}
							role={role}
							ownName={ownName}
							onBack={() => onSelectThreadId(null)}
							onRefreshThreads={onRefreshThreads}
						/>
					)}
				</div>
			</div>
		</div>
	)
}

// ══════════════════════════════════════════════════════════════════════════
// Active Conversation Pane (Sub-component Handling Messages & Deals)
// ══════════════════════════════════════════════════════════════════════════

interface ActiveConversationPaneProps {
	thread: UnifiedActiveThread
	role: ChatRole
	ownName: string
	onBack: () => void
	onRefreshThreads?: () => void
}

function ActiveConversationPane({
	thread,
	role,
	ownName,
	onBack,
	onRefreshThreads,
}: ActiveConversationPaneProps) {
	const [messages, setMessages] = useState<any[]>([])
	const [loading, setLoading] = useState(true)
	const [input, setInput] = useState("")
	const [sending, setSending] = useState(false)
	const [uploadingImage, setUploadingImage] = useState(false)
	const [viewingImage, setViewingImage] = useState<string | null>(null)
	const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
	const [replyingTo, setReplyingTo] = useState<any | null>(null)
	const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)

	// Deals & reports state
	const [sponsorshipDeal, setSponsorshipDeal] = useState<SponsorshipDeal | null>(null)
	const [sponsorshipReport, setSponsorshipReport] = useState<any | null>(null)
	const [sponsorshipModal, setSponsorshipModal] = useState<"form" | "details" | "report" | null>(null)

	const [spaceDeal, setSpaceDeal] = useState<SpaceDeal | null>(null)
	const [spaceReport, setSpaceReport] = useState<SpaceDealReport | null>(null)
	const [spaceModal, setSpaceModal] = useState<"form" | "details" | "report" | null>(null)

	const [spaceHostDeal, setSpaceHostDeal] = useState<SpaceHostDeal | null>(null)
	const [spaceHostReport, setSpaceHostReport] = useState<SpaceHostDealReport | null>(null)
	const [spaceHostModal, setSpaceHostModal] = useState<"form" | "details" | "report" | null>(null)

	// Community Collab sender role tracker
	const [collabMySenderType, setCollabMySenderType] = useState<"REQUESTER" | "TARGET" | null>(
		thread.rawThread?.mySenderType || null
	)

	// Mentions
	const [mentionQuery, setMentionQuery] = useState("")
	const [isMentionOpen, setIsMentionOpen] = useState(false)

	const bottomRef = useRef<HTMLDivElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const highlightTimerRef = useRef<NodeJS.Timeout | null>(null)
	const prevMsgCountRef = useRef(0)

	const roleForTyping = role === "SPACE" ? "SPACE" : role === "BRAND" ? "BRAND" : "HOST"
	const { typingSenderType, notifyTyping, notifyStopTyping } = useChatTyping(thread.id, roleForTyping)

	const mentionSuggestions: MentionSuggestion[] = useMemo(() => [
		{
			id: "counterpart",
			name: thread.counterpartName,
			tag: thread.counterpartName.replace(/\s+/g, ""),
			role: thread.counterpartType || "User",
			avatarUrl: thread.counterpartAvatarUrl,
		},
		{
			id: "meetday",
			name: "Meetday Support",
			tag: "Meetday",
			role: "Admin",
		},
	], [thread])

	// ─── Fetch Messages & Deals ──────────────────────────────────────────────

	const loadMessagesAndDeals = useCallback(async () => {
		try {
			if (thread.kind === "SPONSORSHIP" || thread.kind === "CAMPAIGN") {
				const apiRole = role === "COMMUNITY" ? "HOST" : role === "BRAND" ? "BRAND" : "SPACE"
				const [msgRes, dealRes] = await Promise.all([
					getSponsorshipChatMessages(thread.id, apiRole),
					getSponsorshipDeal(thread.id).catch(() => null),
				])
				const repRes = dealRes ? await getSponsorshipDealReport(thread.id).catch(() => null) : null

				if (prevMsgCountRef.current > 0 && msgRes.messages.length > prevMsgCountRef.current) {
					const newest = msgRes.messages[msgRes.messages.length - 1]
					if (newest && newest.senderType !== apiRole) {
						playMessageChime()
					}
				}
				prevMsgCountRef.current = msgRes.messages.length

				setMessages(msgRes.messages)
				setSponsorshipDeal(dealRes)
				setSponsorshipReport(repRes)
			} else if (thread.kind === "SPACE_INTEREST") {
				const apiRole = role === "COMMUNITY" ? "COMMUNITY" : role === "BRAND" ? "BRAND" : "SPACE"
				const [msgRes, dealRes] = await Promise.all([
					getSpaceChatMessages(thread.id, apiRole),
					getSpaceDeal(thread.id).catch(() => null),
				])
				const repRes = dealRes ? await getSpaceDealReport(thread.id, apiRole).catch(() => null) : null

				if (prevMsgCountRef.current > 0 && msgRes.messages.length > prevMsgCountRef.current) {
					const newest = msgRes.messages[msgRes.messages.length - 1]
					if (newest && (newest.senderType as string) !== (apiRole as string)) {
						playMessageChime()
					}
				}
				prevMsgCountRef.current = msgRes.messages.length

				setMessages(msgRes.messages)
				setSpaceDeal(dealRes)
				setSpaceReport(repRes)
			} else if (thread.kind === "SPACE_HOST") {
				const spaceHostRole = role === "SPACE" ? "SPACE" : "HOST"
				const [msgRes, dealRes] = await Promise.all([
					getSpaceHostChatMessages(thread.id, spaceHostRole),
					getSpaceHostDeal(thread.id).catch(() => null),
				])
				const repRes = dealRes ? await getSpaceHostDealReport(thread.id, spaceHostRole).catch(() => null) : null

				if (prevMsgCountRef.current > 0 && msgRes.messages.length > prevMsgCountRef.current) {
					const newest = msgRes.messages[msgRes.messages.length - 1]
					if (newest && (newest.senderType as string) !== (spaceHostRole as string)) {
						playMessageChime()
					}
				}
				prevMsgCountRef.current = msgRes.messages.length

				setMessages(msgRes.messages)
				setSpaceHostDeal(dealRes)
				setSpaceHostReport(repRes)
			} else if (thread.kind === "COMMUNITY_COLLAB") {
				const res = thread.rawThread?.collaborationType === "BRAND_COMMUNITY"
					? await getBrandCommunityCollaborationChatMessages(thread.id, role === "BRAND" ? "BRAND" : "COMMUNITY")
					: await getCommunityCollaborationChatMessages(thread.id)
				if (res.mySenderType) {
					setCollabMySenderType(res.mySenderType)
				}
				const newMessages = res.messages || []
				if (prevMsgCountRef.current > 0 && newMessages.length > prevMsgCountRef.current) {
					const newest = newMessages[newMessages.length - 1]
					if (newest && newest.senderType !== res.mySenderType) {
						playMessageChime()
					}
				}
				prevMsgCountRef.current = newMessages.length
				setMessages(newMessages)
			}
		} catch {
			// silent poll refresh
		} finally {
			setLoading(false)
		}
	}, [thread.id, thread.kind, role])

	useEffect(() => {
		prevMsgCountRef.current = 0
		setLoading(true)
		setCollabMySenderType(thread.rawThread?.mySenderType || null)
		loadMessagesAndDeals()
		const interval = setInterval(loadMessagesAndDeals, MESSAGES_POLL_MS)
		return () => clearInterval(interval)
	}, [loadMessagesAndDeals, thread.rawThread?.mySenderType])

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [messages.length])

	// ─── Confetti on Deal Complete ───────────────────────────────────────────

	useEffect(() => {
		const dealApproved =
			sponsorshipDeal?.status === "APPROVED" ||
			spaceDeal?.status === "APPROVED" ||
			spaceHostDeal?.status === "APPROVED"
		if (dealApproved && !localStorage.getItem(`confetti-fired-${thread.id}`)) {
			localStorage.setItem(`confetti-fired-${thread.id}`, "true")
			const canvas = document.getElementById("active-chat-confetti-canvas") as HTMLCanvasElement | null
			if (canvas) {
				const myConfetti = confetti.create(canvas, { resize: true, useWorker: true })
				myConfetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } })
			}
		}
	}, [sponsorshipDeal, spaceDeal, spaceHostDeal, thread.id])

	// ─── Message Input & Send Handlers ───────────────────────────────────────

	const handleInputChange = (val: string) => {
		setInput(val)
		if (val.trim()) notifyTyping()
		else notifyStopTyping()

		const lastAt = val.lastIndexOf("@")
		if (lastAt !== -1 && (lastAt === 0 || /\s/.test(val[lastAt - 1]))) {
			const q = val.slice(lastAt + 1)
			if (!/\s/.test(q)) {
				setMentionQuery(q)
				setIsMentionOpen(true)
				return
			}
		}
		setIsMentionOpen(false)
	}

	const handleMentionSelect = (tag: string) => {
		const lastAt = input.lastIndexOf("@")
		if (lastAt !== -1) {
			setInput(input.slice(0, lastAt) + `@${tag} `)
		} else {
			setInput((prev) => prev + `@${tag} `)
		}
		setIsMentionOpen(false)
	}

	const handleJumpToMessage = useCallback((messageId: string) => {
		const el = document.getElementById(`active-msg-${messageId}`)
		if (el) {
			el.scrollIntoView({ behavior: "smooth", block: "center" })
			if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
			setHighlightedMessageId(messageId)
			highlightTimerRef.current = setTimeout(() => setHighlightedMessageId(null), 2000)
		}
	}, [])

	async function handleSend() {
		if (!input.trim() || sending) return

		// Editing message
		if (editingMessageId) {
			setSending(true)
			try {
				if (thread.kind === "SPONSORSHIP" || thread.kind === "CAMPAIGN") {
					const updated = await editSponsorshipChatMessage(thread.id, editingMessageId, input.trim())
					setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
				}
				setEditingMessageId(null)
				setInput("")
			} catch {
				toast.error("Failed to edit message.")
			} finally {
				setSending(false)
			}
			return
		}

		setSending(true)
		try {
			if (thread.kind === "SPONSORSHIP" || thread.kind === "CAMPAIGN") {
				const asRole = role === "COMMUNITY" ? "HOST" : role === "BRAND" ? "BRAND" : "SPACE"
				const msg = await sendSponsorshipChatMessage(thread.id, {
					content: input.trim(),
					replyToId: replyingTo?.id,
					asRole,
				})
				setMessages((prev) => [...prev, msg])
			} else if (thread.kind === "SPACE_INTEREST") {
				const asRole = role === "COMMUNITY" ? "COMMUNITY" : role === "BRAND" ? "BRAND" : "SPACE"
				await sendSpaceChatMessage(thread.id, { content: input.trim(), replyToId: replyingTo?.id }, asRole)
				const data = await getSpaceChatMessages(thread.id, asRole)
				setMessages(data.messages)
			} else if (thread.kind === "SPACE_HOST") {
				const spaceHostRole = role === "SPACE" ? "SPACE" : "HOST"
				await sendSpaceHostChatMessage(thread.id, { content: input.trim(), replyToId: replyingTo?.id }, spaceHostRole)
				const data = await getSpaceHostChatMessages(thread.id, spaceHostRole)
				setMessages(data.messages)
			} else if (thread.kind === "COMMUNITY_COLLAB") {
				const send = thread.rawThread?.collaborationType === "BRAND_COMMUNITY"
					? sendBrandCommunityCollaborationMessage
					: sendCommunityCollaborationMessage
				const msg = await send(thread.id, {
					content: input.trim(),
					replyToId: replyingTo?.id,
				}, role === "BRAND" ? "BRAND" : "COMMUNITY")
				setMessages((prev) => [...prev, msg])
			}

			setInput("")
			setReplyingTo(null)
			notifyStopTyping()
			onRefreshThreads?.()
		} catch (err: any) {
			toast.error(err?.message || "Failed to send message.")
		} finally {
			setSending(false)
		}
	}

	async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		e.target.value = ""
		if (!file) return

		const isPdf = file.type === "application/pdf"
		if (!file.type.startsWith("image/") && !isPdf) {
			toast.error("Only images or PDF files are allowed.")
			return
		}

		setUploadingImage(true)
		try {
			if (thread.kind === "SPONSORSHIP" || thread.kind === "CAMPAIGN") {
				const asRole = role === "COMMUNITY" ? "HOST" : role === "BRAND" ? "BRAND" : "SPACE"
				const mediaKey = await uploadSponsorshipChatImage(file, thread.id)
				const msg = await sendSponsorshipChatMessage(thread.id, {
					mediaKey,
					replyToId: replyingTo?.id,
					asRole,
				})
				setMessages((prev) => [...prev, msg])
			} else if (thread.kind === "SPACE_INTEREST") {
				const asRole = role === "COMMUNITY" ? "COMMUNITY" : role === "BRAND" ? "BRAND" : "SPACE"
				const mediaKey = await uploadSpaceChatImage(file, thread.id)
				await sendSpaceChatMessage(thread.id, { mediaKey, replyToId: replyingTo?.id }, asRole)
				const data = await getSpaceChatMessages(thread.id, asRole)
				setMessages(data.messages)
			} else if (thread.kind === "SPACE_HOST") {
				const spaceHostRole = role === "SPACE" ? "SPACE" : "HOST"
				const mediaKey = await uploadSpaceHostChatImage(file, thread.id)
				await sendSpaceHostChatMessage(thread.id, { mediaKey, replyToId: replyingTo?.id }, spaceHostRole)
				const data = await getSpaceHostChatMessages(thread.id, spaceHostRole)
				setMessages(data.messages)
			} else if (thread.kind === "COMMUNITY_COLLAB") {
				const mediaKey = await uploadCommunityCollaborationChatImage(file, thread.id)
				const send = thread.rawThread?.collaborationType === "BRAND_COMMUNITY"
					? sendBrandCommunityCollaborationMessage
					: sendCommunityCollaborationMessage
				const msg = await send(thread.id, {
					mediaKey,
					replyToId: replyingTo?.id,
				}, role === "BRAND" ? "BRAND" : "COMMUNITY")
				setMessages((prev) => [...prev, msg])
			}

			setReplyingTo(null)
			onRefreshThreads?.()
		} catch {
			toast.error("Failed to upload attachment.")
		} finally {
			setUploadingImage(false)
		}
	}

	async function handleDelete(m: any) {
		if (!window.confirm("Delete this message? This cannot be undone.")) return
		try {
			if (thread.kind === "SPONSORSHIP" || thread.kind === "CAMPAIGN") {
				await deleteSponsorshipChatMessage(thread.id, m.id)
				setMessages((prev) =>
					prev.map((x) =>
						x.id === m.id
							? { ...x, deletedAt: new Date().toISOString(), content: "", mediaUrl: null }
							: x
					)
				)
			}
		} catch {
			toast.error("Failed to delete message.")
		}
	}

	// ─── Render ──────────────────────────────────────────────────────────────

	return (
		<div className="flex-1 min-w-0 min-h-0 flex flex-col relative h-full bg-white">
			<canvas
				id="active-chat-confetti-canvas"
				className="pointer-events-none absolute inset-0 w-full h-full z-30"
			/>

			{/* Conversation Header */}
			<div className="px-4 sm:px-5 py-3 border-b-[3px] border-black bg-white flex items-center justify-between shrink-0 gap-2">
				<div className="flex items-center gap-3 min-w-0 flex-1">
					<button
						type="button"
						onClick={onBack}
						className="sm:hidden p-1.5 -ml-1 text-black/70 hover:text-black hover:bg-neutral-100 rounded-full shrink-0 transition-colors"
						aria-label="Back to chat list"
					>
						<Icon as={AltArrowLeftSvg} size="sm" />
					</button>

					<div className="size-9 rounded-full border border-black/15 overflow-hidden shrink-0 relative bg-neutral-100 flex items-center justify-center font-heading font-black text-xs text-black/60 shadow-xs">
						{thread.counterpartAvatarUrl ? (
							<img
								src={thread.counterpartAvatarUrl}
								alt={thread.counterpartName}
								className="w-full h-full object-cover"
							/>
						) : (
							thread.counterpartName.charAt(0).toUpperCase()
						)}
					</div>

					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2">
							<p className="text-xs sm:text-sm font-black text-black truncate leading-tight">
								{thread.counterpartName}
							</p>
							{thread.counterpartType && (
								<span className="px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase bg-black/10 text-black/60">
									{thread.counterpartType}
								</span>
							)}
						</div>
						<p className="text-[10px] sm:text-[11px] font-semibold text-black/40 truncate">
							{thread.title}
						</p>
					</div>
				</div>
			</div>

			{/* Deal Banner (For Sponsorships & Spaces) */}
			{(thread.kind === "SPONSORSHIP" || thread.kind === "CAMPAIGN") && (
				<DealBanner
					deal={sponsorshipDeal}
					role={role === "COMMUNITY" ? "HOST" : role === "BRAND" ? "BRAND" : "SPACE"}
					onLock={() => setSponsorshipModal("form")}
					onEdit={() => setSponsorshipModal("form")}
					onView={() => setSponsorshipModal("details")}
					onReport={() => setSponsorshipModal("report")}
					hasReport={!!sponsorshipReport}
					report={sponsorshipReport}
					isCampaign={thread.kind === "CAMPAIGN"}
				/>
			)}

			{thread.kind === "SPACE_INTEREST" && (
				<SpaceDealBanner
					deal={spaceDeal}
					role={role === "COMMUNITY" ? "COMMUNITY" : role === "BRAND" ? "BRAND" : "SPACE"}
					onLock={() => setSpaceModal("form")}
					onEdit={() => setSpaceModal("form")}
					onView={() => setSpaceModal("details")}
					onReport={() => setSpaceModal("report")}
					hasReport={Boolean(spaceReport)}
					report={spaceReport}
				/>
			)}

			{thread.kind === "SPACE_HOST" && (
				<SpaceHostDealBanner
					deal={spaceHostDeal}
					role={role === "SPACE" ? "SPACE" : "HOST"}
					onLock={() => setSpaceHostModal("form")}
					onEdit={() => setSpaceHostModal("form")}
					onView={() => setSpaceHostModal("details")}
					onReport={() => setSpaceHostModal("report")}
					hasReport={Boolean(spaceHostReport)}
					report={spaceHostReport}
				/>
			)}

			{/* Message Feed Scroll Area */}
			<div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 flex flex-col gap-3 min-h-0">
				{loading ? (
					<p className="text-xs font-semibold text-black/40 text-center py-8">Loading messages…</p>
				) : messages.length === 0 ? (
					<div className="m-auto text-center max-w-xs">
						<p className="text-sm font-heading font-black text-black">Active Conversation Started</p>
						<p className="text-xs font-semibold text-black/40 mt-1">
							Say hello to {thread.counterpartName} and start collaborating!
						</p>
					</div>
				) : (
					messages.map((m) => {
						const isSystem =
							m.messageType === "SYSTEM" ||
							(m.senderType as string) === "SYSTEM" ||
							m.content?.startsWith("[System]") ||
							(typeof m.content === "string" &&
								(m.content.toLowerCase().includes("deal is locked") ||
									m.content.toLowerCase().includes("deal is closed") ||
									m.content.toLowerCase().includes("report approved") ||
									m.content.toLowerCase().includes("deliverables report was submitted")))

						if (isSystem) {
							return <SystemMessageBubble key={m.id} content={m.content ?? ""} />
						}

						const isMine =
							thread.kind === "COMMUNITY_COLLAB"
								? m.senderType === (collabMySenderType || thread.rawThread?.mySenderType || (thread.rawThread?.direction === "OUTGOING" ? "REQUESTER" : "TARGET"))
								: thread.kind === "SPACE_HOST"
								? m.senderType === (role === "SPACE" ? "SPACE" : "HOST")
								: thread.kind === "SPACE_INTEREST"
								? (role === "SPACE" ? m.senderType === "SPACE" : role === "BRAND" ? m.senderType === "BRAND" : (m.senderType === "COMMUNITY" || (m.senderType as string) === "HOST"))
								: (role === "COMMUNITY" && (m.senderType === "HOST" || m.senderType === "COMMUNITY")) ||
								  (role === "BRAND" && m.senderType === "BRAND") ||
								  (role === "SPACE" && m.senderType === "SPACE")

						const isAdmin =
							(m.senderType as string) === "ADMIN" ||
							(m.senderType as string) === "BOT" ||
							(m.senderType as string) === "SYSTEM"

						const isBrandCommunityMessage = thread.kind === "COMMUNITY_COLLAB" && thread.rawThread?.collaborationType === "BRAND_COMMUNITY"
						const isBrand =
							!isAdmin &&
							(isBrandCommunityMessage
								? m.senderType === "REQUESTER"
								: m.senderType === "BRAND" ||
									(!m.senderType && isMine && role === "BRAND") ||
									(!m.senderType &&
										!isMine &&
										((role === "COMMUNITY" && (thread.kind === "SPONSORSHIP" || thread.kind === "CAMPAIGN")) ||
											(role === "SPACE" &&
												(thread.kind === "SPONSORSHIP" ||
													(thread.kind === "SPACE_INTEREST" &&
														(thread.category === "brands" || thread.rawThread?.brandId)))))))

						const isSpaceMsg =
							!isAdmin &&
							(m.senderType === "SPACE" ||
								(!m.senderType && isMine && role === "SPACE") ||
								(!m.senderType &&
									!isMine &&
									((role === "COMMUNITY" && (thread.kind === "SPACE_HOST" || thread.kind === "SPACE_INTEREST")) ||
										(role === "BRAND" && thread.kind === "SPACE_INTEREST"))))

						const isCommunity = !isAdmin && !isBrand && !isSpaceMsg
						const isCommunityCollabReceived = thread.kind === "COMMUNITY_COLLAB" && !isMine
						const isDarkBubble = isBrand || isSpaceMsg || isCommunityCollabReceived
						const isDeleted = Boolean(m.deletedAt)

						return (
							<div
								key={m.id}
								id={`active-msg-${m.id}`}
								className={clsx(
									"flex flex-col max-w-[85%] sm:max-w-[75%] md:max-w-[70%] transition-all duration-300 rounded-2xl p-1",
									isMine ? "self-end items-end" : "self-start items-start",
									highlightedMessageId === m.id && "ring-4 ring-[#EE2C2C] bg-[#FFC940]/30 shadow-lg scale-[1.02]"
								)}
							>
								{/* Header label & actions */}
								<div className="flex items-center gap-2 mb-0.5 px-1">
									<span className="text-[10px] font-black uppercase tracking-wide text-black/35">
										{isMine ? "You" : isAdmin ? "Admin" : thread.counterpartName}
									</span>
									{!isDeleted && (
										<button
											type="button"
											onClick={() => {
												setEditingMessageId(null)
												setReplyingTo(m)
											}}
											className="text-[10px] font-bold text-black/35 hover:text-black cursor-pointer"
										>
											Reply
										</button>
									)}
									{isMine && !isDeleted && (
										<>
											<button
												type="button"
												onClick={() => {
													setReplyingTo(null)
													setEditingMessageId(m.id)
													setInput(m.content)
												}}
												className="text-[10px] font-bold text-black/35 hover:text-black cursor-pointer"
											>
												Edit
											</button>
											<button
												type="button"
												onClick={() => handleDelete(m)}
												className="text-[10px] font-bold text-black/35 hover:text-[#EE2C2C] cursor-pointer"
											>
												Delete
											</button>
										</>
									)}
								</div>

								{/* Message Bubble Content */}
								{isDeleted ? (
									<div className="px-3.5 py-2 rounded-2xl text-sm font-semibold italic text-black/40 bg-neutral-100 border border-dashed border-black/15">
										This message was deleted
									</div>
								) : (
									<div
										className={clsx(
											"rounded-2xl p-2.5 sm:p-3 text-sm font-semibold break-words flex flex-col shadow-xs",
											isMine ? "rounded-br-sm" : "rounded-bl-sm",
											isBrand && "bg-[#EE2C2C] text-white",
											isSpaceMsg && "bg-black text-white",
											isCommunity && (isCommunityCollabReceived ? "bg-[#854D0E] text-white" : "bg-[#FFC940] text-black"),
											isAdmin && "bg-neutral-100 text-black border border-black/10"
										)}
									>
										{/* Reply snippet preview */}
										{m.replyTo && (
											<button
												type="button"
												onClick={() => handleJumpToMessage(m.replyTo.id)}
												className={clsx(
													"w-full text-left mb-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer block border-l-4 shadow-xs",
													isDarkBubble
														? "bg-white/15 hover:bg-white/20 text-white border-white/70"
														: isCommunity
														? "bg-black/10 hover:bg-black/15 text-black border-black/40"
														: "bg-black/5 hover:bg-black/10 text-black border-black/30"
												)}
												title="Click to jump to message"
											>
												<p
													className={clsx(
														"text-[9px] font-black uppercase tracking-wider",
														isDarkBubble ? "text-white/70" : "text-black/60"
													)}
												>
													↩ Replying to {
														m.replyTo.senderType?.toUpperCase() === "ADMIN"
															? "Admin"
															: m.replyTo.senderType?.toUpperCase() === "BOT"
															? "Meetday"
															: m.replyTo.sender?.firstName || m.replyTo.senderType || "message"
													}
												</p>
												{m.replyTo.content && (
													<p
														className={clsx(
															"text-xs font-medium break-words whitespace-pre-wrap leading-relaxed mt-0.5",
															isDarkBubble ? "text-white/90" : "text-black/80"
														)}
													>
														{m.replyTo.content}
													</p>
												)}
											</button>
										)}

										{/* Attachment Media */}
										{m.mediaUrl && (
											isPdfMediaUrl(m.mediaUrl) ? (
												<a
													href={m.mediaUrl}
													target="_blank"
													rel="noopener noreferrer"
													className={clsx(
														"flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border-[3px] border-black mb-1 text-sm font-bold",
														isDarkBubble
															? "bg-white text-black hover:bg-neutral-100"
															: "bg-white hover:bg-neutral-50 text-black"
													)}
												>
													<Icon as={FileTextSvg} size="sm" />
													<span>View PDF Attachment</span>
												</a>
											) : (
												/* eslint-disable-next-line @next/next/no-img-element */
												<img
													src={m.mediaUrl}
													alt="Attachment"
													onClick={() => setViewingImage(m.mediaUrl)}
													className="max-w-[260px] max-h-[260px] rounded-2xl border-[3px] border-black object-cover cursor-pointer mb-1 hover:opacity-95 transition-opacity"
												/>
											)
										)}

										{/* Text content */}
										{m.content && (
											<div className="px-1 py-0.5">
												<LinkifiedText
													text={m.content}
													linkClassName={clsx(
														"underline font-bold",
														isDarkBubble
															? "text-white hover:text-white/80"
															: isCommunity
															? "text-black hover:text-black/80"
															: "text-[#EE2C2C] hover:text-[#EE2C2C]/80"
													)}
												/>
												{m.editedAt && (
													<span
														className={clsx(
															"ml-1.5 text-[10px] font-semibold",
															isDarkBubble ? "text-white/60" : "text-black/50"
														)}
													>
														(edited)
													</span>
												)}
											</div>
										)}
									</div>
								)}

								{/* Timestamp footer */}
								<div className={clsx("flex items-center gap-1 mt-0.5 text-[9px] font-bold text-black/35 px-1", isMine ? "justify-end" : "justify-start")}>
									<span>
										{(() => {
											try {
												return new Date(m.createdAt).toLocaleTimeString([], {
													hour: "2-digit",
													minute: "2-digit",
												})
											} catch {
												return ""
											}
										})()}
									</span>
								</div>
							</div>
						)
					})
				)}
				<div ref={bottomRef} />
			</div>

			{/* Message Composer Bar */}
			<div className="border-t-[3px] border-black shrink-0 bg-white flex flex-col">
				{/* Typing indicator */}
				{typingSenderType && (
					<p className="px-4 pt-2 text-[11px] font-bold text-black/40 italic">
						{thread.counterpartName} is typing…
					</p>
				)}

				{/* Editing status */}
				{editingMessageId && (
					<div className="px-4 pt-2 flex items-center justify-between">
						<span className="text-[10px] font-black uppercase text-black/40">
							Editing message
						</span>
						<button
							type="button"
							onClick={() => {
								setEditingMessageId(null)
								setInput("")
							}}
							className="text-[10px] font-bold text-[#EE2C2C] cursor-pointer"
						>
							Cancel
						</button>
					</div>
				)}

				{/* Replying banner */}
				{replyingTo && !editingMessageId && (
					<div className="px-4 pt-2 flex items-center justify-between gap-2 border-b border-black/10 pb-2">
						<div className="min-w-0 pl-2 border-l-2 border-[#EE2C2C]">
							<p className="text-[10px] font-black uppercase text-black/40">
								Replying to {
									replyingTo.senderType?.toUpperCase() === "ADMIN"
										? "Admin"
										: replyingTo.senderType?.toUpperCase() === "BOT"
										? "Meetday"
										: replyingTo.sender?.firstName || thread.counterpartName
								}
							</p>
							<p className="text-[11px] font-semibold text-black/50 truncate">
								{replyingTo.content?.trim() ? replyingTo.content : "Photo"}
							</p>
						</div>
						<button
							type="button"
							onClick={() => setReplyingTo(null)}
							className="text-[10px] font-bold text-[#EE2C2C] shrink-0 cursor-pointer"
						>
							Cancel
						</button>
					</div>
				)}

				<div className="relative p-2.5 sm:p-3 flex items-center gap-2 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
					{/* Mention Picker */}
					<MentionPicker
						suggestions={mentionSuggestions}
						query={mentionQuery}
						isOpen={isMentionOpen}
						onSelect={handleMentionSelect}
						onClose={() => setIsMentionOpen(false)}
					/>

					{/* File Input */}
					<input
						type="file"
						accept="image/*,application/pdf"
						ref={fileInputRef}
						onChange={handleImagePick}
						className="hidden"
					/>

					<button
						type="button"
						onClick={() => fileInputRef.current?.click()}
						disabled={uploadingImage || !!editingMessageId}
						className="shrink-0 size-9 rounded-xl border-[3px] border-black flex items-center justify-center hover:bg-neutral-50 disabled:opacity-50 cursor-pointer"
						aria-label="Attach file"
					>
						<Icon as={GallerySvg} size="sm" />
					</button>

					<EmojiPicker onSelect={(emoji) => setInput((prev) => prev + emoji)} />

					<input
						value={input}
						onChange={(e) => handleInputChange(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey && !isMentionOpen) {
								e.preventDefault()
								handleSend()
							}
							if (e.key === "Escape" && editingMessageId) {
								setEditingMessageId(null)
								setInput("")
							}
						}}
						placeholder="Write a message… (type @ to mention)"
						className="flex-1 min-w-0 rounded-2xl border-[3px] border-black bg-white px-3.5 sm:px-4 py-2 text-sm font-semibold outline-none focus:bg-neutral-50"
					/>

					<Button
						onClick={handleSend}
						disabled={sending || uploadingImage || !input.trim()}
						className="shrink-0 whitespace-nowrap"
					>
						{sending ? "…" : "Send"}
					</Button>
				</div>
			</div>

			{/* Lightbox Modal */}
			{viewingImage && (
				<ImageLightbox url={viewingImage} onClose={() => setViewingImage(null)} />
			)}

			{/* Sponsorship Modals */}
			{sponsorshipModal === "form" && (
				<DealFormModal
					interestId={thread.id}
					deal={sponsorshipDeal}
					onClose={() => setSponsorshipModal(null)}
					onSaved={(saved) => {
						setSponsorshipDeal(saved)
						setSponsorshipModal(null)
						loadMessagesAndDeals()
					}}
				/>
			)}
			{sponsorshipModal === "details" && sponsorshipDeal && (
				<DealDetailsModal
					interestId={thread.id}
					deal={sponsorshipDeal}
					role={role === "COMMUNITY" ? "HOST" : role === "BRAND" ? "BRAND" : "SPACE"}
					onClose={() => setSponsorshipModal(null)}
					onUpdated={(updated) => {
						setSponsorshipDeal(updated)
						loadMessagesAndDeals()
					}}
				/>
			)}
			{sponsorshipModal === "report" && (
				<DealReportModal
					interestId={thread.id}
					role={role === "COMMUNITY" ? "HOST" : role === "BRAND" ? "BRAND" : "SPACE"}
					onClose={() => setSponsorshipModal(null)}
				/>
			)}

			{/* Space Modals */}
			{spaceModal === "form" && (
				<SpaceDealFormModal
					interestId={thread.id}
					deal={spaceDeal}
					role={role === "COMMUNITY" ? "COMMUNITY" : role === "BRAND" ? "BRAND" : "SPACE"}
					thread={thread.rawThread}
					onClose={() => setSpaceModal(null)}
					onSaved={(saved) => {
						setSpaceDeal(saved)
						setSpaceModal(null)
						loadMessagesAndDeals()
					}}
				/>
			)}
			{spaceModal === "details" && spaceDeal && (
				<SpaceDealDetailsModal
					interestId={thread.id}
					deal={spaceDeal}
					role={role === "COMMUNITY" ? "COMMUNITY" : role === "BRAND" ? "BRAND" : "SPACE"}
					onClose={() => setSpaceModal(null)}
					onUpdated={(updated) => {
						setSpaceDeal(updated)
						loadMessagesAndDeals()
					}}
				/>
			)}
			{spaceModal === "report" && (
				<SpaceDealReportModal
					interestId={thread.id}
					role={role === "COMMUNITY" ? "COMMUNITY" : role === "BRAND" ? "BRAND" : "SPACE"}
					onClose={() => setSpaceModal(null)}
					onReportUpdated={(updated) => {
						setSpaceReport(updated)
						loadMessagesAndDeals()
					}}
				/>
			)}

			{/* Space Host Modals */}
			{spaceHostModal === "form" && (
				<SpaceHostDealFormModal
					interestId={thread.id}
					deal={spaceHostDeal}
					role={role === "SPACE" ? "SPACE" : "HOST"}
					thread={thread.rawThread}
					onClose={() => setSpaceHostModal(null)}
					onSaved={(saved) => {
						setSpaceHostDeal(saved)
						setSpaceHostModal(null)
						loadMessagesAndDeals()
					}}
				/>
			)}
			{spaceHostModal === "details" && spaceHostDeal && (
				<SpaceHostDealDetailsModal
					interestId={thread.id}
					deal={spaceHostDeal}
					role={role === "SPACE" ? "SPACE" : "HOST"}
					onClose={() => setSpaceHostModal(null)}
					onUpdated={(updated) => {
						setSpaceHostDeal(updated)
						loadMessagesAndDeals()
					}}
				/>
			)}
			{spaceHostModal === "report" && (
				<SpaceHostDealReportModal
					interestId={thread.id}
					role={role === "SPACE" ? "SPACE" : "HOST"}
					onClose={() => setSpaceHostModal(null)}
					onReportUpdated={(updated) => {
						setSpaceHostReport(updated)
						loadMessagesAndDeals()
					}}
				/>
			)}
		</div>
	)
}
