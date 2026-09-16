"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import clsx from "clsx"
import { toast } from "sonner"
import { Icon } from "@/components/ui/Icon"
import { useHostStore } from "@/store/hostStore"
import { getHostCommunityProfile, getMySponsorshipProposals, getMySponsorshipChats, getMySpaceChats, getMySpaceHostChats, getMyCommunityCollaborationChats } from "@/lib/api"
import { useNotificationStore } from "@/store/notificationStore"
import { useToastStore } from "@/store/toastStore"
import type { ComponentType, SVGProps } from "react"

import WidgetsSvg from "@/icons/outlined/widgets.svg"
import CalendarOutSvg from "@/icons/outlined/calendar.svg"
import HeadphonesSvg from "@/icons/filled/headphones.svg"
import DocumentTextSvg from "@/icons/outlined/document-text.svg"
import BellSvg from "@/icons/outlined/bell.svg"
import BellFillSvg from "@/icons/filled/bell.svg"
import ChatOutSvg from "@/icons/outlined/chat.svg"
import ChatFillSvg from "@/icons/filled/chat.svg"

import WidgetSvg from "@/icons/filled/widget.svg"
import CalendarFillSvg from "@/icons/filled/calendar.svg"
import RocketSvg from "@/icons/outlined/rocket.svg"
import LockOutSvg from "@/icons/outlined/lock.svg"
import LockFillSvg from "@/icons/filled/lock.svg"
import UsersGroupOutSvg from "@/icons/outlined/users-group-2.svg"
import UsersGroupFillSvg from "@/icons/filled/users-group-2.svg"

type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>

type TopNavItem = {
	label: string
	href: string
	outlined: SvgIcon
	filled: SvgIcon
	disabled?: boolean
}

const NAV_ITEMS_TOP: TopNavItem[] = [
	{ label: "Dashboard", href: "/community/dashboard", outlined: WidgetsSvg, filled: WidgetSvg },
	{ label: "Communities", href: "/community/dashboard/communities", outlined: UsersGroupOutSvg, filled: UsersGroupFillSvg },
	{ label: "Experience Proposals", href: "/community/dashboard/proposal", outlined: DocumentTextSvg, filled: DocumentTextSvg },
	{ label: "Brand Campaigns", href: "/community/dashboard/campaigns", outlined: RocketSvg, filled: RocketSvg, disabled: true },
	{ label: "Community Spaces", href: "/community/dashboard/community-spaces", outlined: CalendarOutSvg, filled: CalendarFillSvg },
	{ label: "Locked Deals", href: "/community/dashboard/deals", outlined: LockOutSvg, filled: LockFillSvg },
]

type BottomNavItem = {
	label: string
	href: string
	outlined: SvgIcon
	filled: SvgIcon
}

const NAV_ITEMS_BOTTOM: BottomNavItem[] = [
	{ label: "Support Chat", href: "/community/dashboard/support", outlined: HeadphonesSvg, filled: HeadphonesSvg },
	{ label: "Notifications", href: "/community/dashboard/messages", outlined: BellSvg, filled: BellFillSvg },
]

interface SidebarProps {
	isOpen: boolean
	onClose: () => void
}

function SidebarContent({ onClose }: { onClose: () => void }) {
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const router = useRouter()
	const { profile } = useHostStore()
	const { toasts, removeToast } = useToastStore()
	const [showIncompleteCard, setShowIncompleteCard] = useState(true)
	const [showKycCard, setShowKycCard] = useState(true)
	const [community, setCommunity] = useState<any>(null)
	const [proposals, setProposals] = useState<any[]>([])
	const [dismissedList, setDismissedList] = useState<any[]>([])
	const [unreadSponsorshipChatsCount, setUnreadSponsorshipChatsCount] = useState(0)
	const [unreadCampaignChatsCount, setUnreadCampaignChatsCount] = useState(0)
	const [unreadSpaceChatsCount, setUnreadSpaceChatsCount] = useState(0)
	const [unreadCommunityRequestsCount, setUnreadCommunityRequestsCount] = useState(0)
	const [unreadCommunityChatsCount, setUnreadCommunityChatsCount] = useState(0)
	const [unreadSupportCount, setUnreadSupportCount] = useState(0)
	const [chatsOpen, setChatsOpen] = useState(false)

	const isChatsRoute = pathname.startsWith("/community/dashboard/chats") || pathname.startsWith("/community/dashboard/space-chats")
	const isCampaignChat = pathname.startsWith("/community/dashboard/chats") && searchParams.get("type") === "campaign"
	const isSponsorshipChat = pathname.startsWith("/community/dashboard/chats") && searchParams.get("type") !== "campaign" && searchParams.get("type") !== "community"
	const isCommunityChat = pathname.startsWith("/community/dashboard/chats") && searchParams.get("type") === "community"
	const isSpacesChat = pathname.startsWith("/community/dashboard/space-chats")
	const totalChatsBadge = unreadSponsorshipChatsCount + unreadCampaignChatsCount + unreadSpaceChatsCount + unreadCommunityRequestsCount + unreadCommunityChatsCount

	const { notifications, unreadCount, init: initNotifs, markRead } = useNotificationStore()
	const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>([])

	useEffect(() => {
		if (profile?.id) {
			getHostCommunityProfile()
				.then(setCommunity)
				.catch(() => {})
			getMySponsorshipProposals()
				.then(res => setProposals(res.proposals || []))
				.catch(() => {})
		}
	}, [profile?.id])

	useEffect(() => {
		if (!profile?.id) return

		const updateCount = () => {
			Promise.all([
				getMySponsorshipChats("ACCEPTED", "HOST").catch(err => { console.error("accepted error:", err); return [] }),
				getMySponsorshipChats("REQUESTED", "HOST").catch(err => { console.error("requested error:", err); return [] }),
			]).then(([accepted, requested]) => {
				const all = [...accepted, ...requested]

				const isChatNotification = (n: (typeof notifications)[0]) => {
					if (
						n.type === "campaign_approved" ||
						n.type === "campaign_rejected" ||
						n.type === "sponsorship_approved" ||
						n.type === "sponsorship_rejected" ||
						n.type === "proposal_approved" ||
						n.type === "proposal_rejected" ||
						n.type === "host_approved" ||
						n.type === "host_rejected" ||
						n.type === "brand_approved" ||
						n.type === "brand_rejected" ||
						n.type === "event_approved" ||
						n.type === "event_rejected"
					) {
						return false
					}
					return (
						n.type.startsWith("sponsorship_") ||
						n.type === "chat_message" ||
						n.type === "meetday_chat_message" ||
						n.type === "brand_interested_in_sponsorship" ||
						n.type === "sponsorship_interest" ||
						n.type === "sponsorship_interest_created" ||
						n.type === "host_interested_in_campaign" ||
						n.type === "host_interest_confirmed"
					)
				}

				const countForThreads = (list: typeof all) => {
					return list.reduce((sum, t) => {
						const notifCount = notifications.filter(n => {
							if (n.isRead || !isChatNotification(n)) return false
							const m = (n.metadata as any) || {}
							const tId = m.threadId || m.thread_id || m.interestId || m.interest_id || m.chatId || m.chat_id || m.sponsorshipInterestId
							return tId === t.id
						}).length
						return sum + Math.max(t.unreadCount || 0, notifCount)
					}, 0)
				}

				const sponsorshipThreads = all.filter(t => !t.campaignId)
				const campaignThreads = all.filter(t => !!t.campaignId)

				const sponsorshipThreadCount = countForThreads(sponsorshipThreads)
				const campaignThreadCount = countForThreads(campaignThreads)

				const standaloneSponsorshipNotifs = notifications.filter(n => {
					if (n.isRead || !isChatNotification(n)) return false
					const m = (n.metadata as any) || {}
					const tId = m.threadId || m.thread_id || m.interestId || m.interest_id || m.chatId || m.chat_id || m.sponsorshipInterestId
					if (tId && all.some(t => t.id === tId)) return false
					const isCampaignNotif = n.type === "host_interested_in_campaign" || n.type === "host_interest_confirmed"
					if (isCampaignNotif) return false
					return true
				}).length

				const standaloneCampaignNotifs = notifications.filter(n => {
					if (n.isRead || !isChatNotification(n)) return false
					const m = (n.metadata as any) || {}
					const tId = m.threadId || m.thread_id || m.interestId || m.interest_id || m.chatId || m.chat_id || m.sponsorshipInterestId
					if (tId && all.some(t => t.id === tId)) return false
					const isCampaignNotif = n.type === "host_interested_in_campaign" || n.type === "host_interest_confirmed"
					return isCampaignNotif
				}).length

				const supportUnread = notifications.filter(n => 
					!n.isRead && 
					n.title === "Meetday" && 
					!n.metadata?.threadId && 
					!n.metadata?.thread_id && 
					!n.metadata?.interestId && 
					!n.metadata?.interest_id && 
					!n.metadata?.chatId && 
					!n.metadata?.chat_id && 
					!n.metadata?.sponsorshipInterestId
				).length

				setUnreadSponsorshipChatsCount(sponsorshipThreadCount + standaloneSponsorshipNotifs)
				setUnreadCampaignChatsCount(campaignThreadCount + standaloneCampaignNotifs)
				setUnreadSupportCount(supportUnread)
			}).catch(err => console.error("Promise.all error:", err))
		}

		updateCount()
		const interval = setInterval(updateCount, 8000)
		return () => clearInterval(interval)
	}, [profile?.id, notifications])

	useEffect(() => {
		if (!profile?.id) return
		const updateCommunityCount = () => {
			getMyCommunityCollaborationChats("ACCEPTED").catch(() => []).then(threads => {
				setUnreadCommunityChatsCount(threads.reduce((sum, thread) => sum + (thread.unreadCount || 0), 0))
			})
		}
		updateCommunityCount()
		const interval = setInterval(updateCommunityCount, 8000)
		return () => clearInterval(interval)
	}, [profile?.id])

	useEffect(() => {
		initNotifs()
	}, [initNotifs])

	// Spaces Chats badge — same fold-in pattern as sponsorship/campaign, but for space_* notifications
	// (chat messages, deal lock/update/approve, interest accepted) not yet reflected in a thread's own unreadCount.
	useEffect(() => {
		if (!profile?.id) return

		const updateSpaceCount = () => {
			getMySpaceChats(undefined, "COMMUNITY").catch(() => []).then((threads) => {
				const isSpaceChatNotification = (n: (typeof notifications)[0]) =>
					n.type === "space_chat_message" ||
					n.type === "space_deal_locked" ||
					n.type === "space_deal_updated" ||
					n.type === "space_deal_approved" ||
					n.type === "space_deal_changes_requested" ||
					n.type === "space_interest_accepted"

				const threadCount = threads.reduce((sum, t) => {
					const notifCount = notifications.filter(n => {
						if (n.isRead || !isSpaceChatNotification(n)) return false
						const m = (n.metadata as Record<string, unknown>) || {}
						const tId = m.spaceInterestId || m.interestId || m.threadId
						return tId === t.id
					}).length
					return sum + Math.max(t.unreadCount || 0, notifCount)
				}, 0)

				const standaloneCount = notifications.filter(n => {
					if (n.isRead || !isSpaceChatNotification(n)) return false
					const m = (n.metadata as Record<string, unknown>) || {}
					const tId = m.spaceInterestId || m.interestId || m.threadId
					return !tId || !threads.some(t => t.id === tId)
				}).length

				setUnreadSpaceChatsCount(threadCount + standaloneCount)
			}).catch(() => {})
		}

		updateSpaceCount()
		const interval = setInterval(updateSpaceCount, 8000)
		return () => clearInterval(interval)
	}, [profile?.id, notifications])

	// Space Partner partnership Requests badge (Space -> Community, reverse direction of Spaces Chats).
	useEffect(() => {
		if (!profile?.id) return
		const updateCount = () => {
			getMySpaceHostChats(undefined, "HOST")
				.then((threads) => {
					setUnreadCommunityRequestsCount(threads.reduce((sum, t) => sum + (t.unreadCount || 0), 0))
				})
				.catch(() => {})
		}
		updateCount()
		const interval = setInterval(updateCount, 8000)
		return () => clearInterval(interval)
	}, [profile?.id])

	const activeNotifs = notifications.filter(n => !n.isRead && !dismissedNotifIds.includes(n.id))
	const latestNotif = activeNotifs[0]

	// Calculate remaining profile steps dynamically
	const steps = [
		{ name: "Legal Name", done: !!profile?.legalName },
		{ name: "Display Name", done: !!profile?.displayName },
		{ name: "Bio", done: !!profile?.hostBio },
		{ name: "Operating Cities", done: !!(profile?.operatingCities && profile.operatingCities.length > 0) },
		{ name: "PAN/Bank Verification", done: profile?.kycStatus === "VERIFIED" },
	]
	const completedCount = steps.filter(s => s.done).length
	const stepsRemaining = steps.length - completedCount

	const communityName = profile?.displayName || "Community"
	const avatarUrl = profile?.avatarUrl

	// Construct sidebar notifications
	const sidebarNotifs = []

	// 1. Community profile verification status
	if (profile?.approvalStatus === "REJECTED") {
		sidebarNotifs.push({
			id: 'community-profile-rejected-' + profile.id,
			type: "error",
			title: "Verification Rejected",
			desc: profile.rejectionReason || "Your community verification application was not approved.",
			action: "REAPPLY",
			link: "/community/dashboard/profile"
		})
	} else if (profile?.approvalStatus === "PENDING" && profile?.kycStatus === "VERIFIED") {
		sidebarNotifs.push({
			id: 'community-profile-pending-' + profile.id,
			type: "warning",
			title: "Verification Pending",
			desc: "Your community verification is under review. This usually takes 2-3 business days.",
		})
	}

	// 2. Community profile status
	if (community) {
		if (community.approvalStatus === "REJECTED") {
			sidebarNotifs.push({
				id: 'community-rejected-' + community.id,
				type: "error",
				title: "Community Rejected",
				desc: community.adminRejectionRemark || "Your community profile details were rejected.",
				action: "EDIT DETAILS",
				link: "/community/dashboard/profile"
			})
		} else if (community.approvalStatus === "PENDING") {
			sidebarNotifs.push({
				id: 'community-pending-' + community.id,
				type: "warning",
				title: "Community Under Review",
				desc: "Your community profile is currently under review by the admin team.",
			})
		}
	}

	// 3. Proposals status
	proposals.forEach(p => {
		if (p.status === "REJECTED") {
			sidebarNotifs.push({
				id: 'proposal-rejected-' + p.id,
				type: "error",
				title: "Proposal Rejected",
				desc: '"' + p.name + '" was rejected. ' + (p.adminRejectionRemark || ""),
				action: "VIEW PROPOSAL",
				link: '/community/dashboard/proposal?proposalId=' + p.id
			})
		} else if (p.status === "UNDER_REVIEW") {
			sidebarNotifs.push({
				id: 'proposal-review-' + p.id,
				type: "warning",
				title: "Proposal Under Review",
				desc: '"' + p.name + '" is currently under review.',
				action: "VIEW",
				link: '/community/dashboard/proposal?proposalId=' + p.id
			})
		}
	})

	// Filter out dismissed notifications
	const visibleNotifs = sidebarNotifs.filter(n => !dismissedList.includes(n.id))

	return (
		<div className="flex flex-col h-full bg-[#EE2C2C] text-white overflow-hidden">
			
			{/* Brand Logo */}
			<div className="px-6 pt-5 pb-3 flex items-center justify-center shrink-0">
				<Link href="/community/dashboard">
					<Image
						src="/assets/brand_logo.svg"
						alt="Meetday"
						width={130}
						height={36}
						style={{ filter: "brightness(0) invert(1)" }}
						className="h-8 w-auto cursor-pointer"
					/>
				</Link>
			</div>

			{/* Navigation Top Items */}
			<div className="px-4 flex flex-col gap-1 mt-1 shrink-0">
				{NAV_ITEMS_TOP.map(({ label, href, outlined: Outlined, filled: Filled, disabled }) => {
					const isActive = href === "/community/dashboard" ? pathname === href : pathname.startsWith(href)
					if (disabled) {
						return (
							<button
								key={href}
								type="button"
								onClick={() => toast.info(`${label} is coming soon — stay tuned!`)}
								className="flex items-center gap-2.5 px-4 py-2 rounded-2xl text-sm font-normal text-white/50 cursor-not-allowed"
							>
								<Icon as={Outlined} size="md" className="text-white/50 shrink-0" />
								<span className="flex-1 text-left whitespace-nowrap">{label}</span>
								<span className="text-[9px] font-black uppercase tracking-wider bg-white/15 px-1.5 py-0.5 rounded shrink-0">Soon</span>
							</button>
						)
					}
					return (
						<Link
							key={href}
							href={href}
							onClick={onClose}
							className={clsx(
								"flex items-center gap-2.5 px-4 py-2 rounded-2xl transition-all text-sm font-normal",
								isActive
									? "bg-[#D12525] text-white"
									: "text-white/90 hover:bg-[#D12525]/50 hover:text-white"
							)}
						>
							<Icon
								as={isActive ? Filled : Outlined}
								size="md"
								className="text-white shrink-0"
							/>
							<span className="flex-1 whitespace-nowrap">{label}</span>
						</Link>
					)
				})}
			</div>

			{/* Middle Scrollable Section for Notifications/Alerts */}
			<div className="flex-1 overflow-y-auto px-4 py-2 my-2 flex flex-col gap-3 min-h-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
				<div className="mt-auto" />
				{/* Come & Go Toast Notifications */}
				{toasts.map(t => {
					const bgColor = t.type === "error" ? "bg-[#FFD2D2]" : t.type === "success" ? "bg-[#D4EDDA] border-green-600" : "bg-[#FFF3CD] border-amber-600"
					const textColor = t.type === "error" ? "text-[#EE2C2C]" : t.type === "success" ? "text-green-800" : "text-amber-800"
					return (
						<div key={t.id} className={clsx("border-[3px] border-black rounded-[24px] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black relative flex flex-col gap-1.5 animate-in slide-in-from-bottom duration-300", bgColor)}>
							<button 
								onClick={() => removeToast(t.id)}
								className="absolute top-3 right-3 text-black/60 hover:text-black font-extrabold text-sm"
								aria-label="Dismiss toast"
							>
								✕
							</button>
							<div className="pr-4">
								<h3 className={clsx("font-heading font-black text-sm leading-tight", textColor)}>{t.title}</h3>
								{t.desc && (
									<p className="text-[11px] font-semibold text-black/75 mt-0.5 leading-snug break-words">
										{t.desc}
									</p>
								)}
							</div>
						</div>
					)
				})}

				{/* Incomplete Profile Card / Verification Status */}
				{visibleNotifs.map(n => {
					const bgColor = n.type === "error" ? "bg-[#FFD2D2]" : "bg-[#FFEAA7]"
					const titleColor = n.type === "error" ? "text-[#EE2C2C]" : "text-[#b27b00]"
					return (
						<div key={n.id} className={clsx("border-[3px] border-black rounded-[24px] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black relative flex flex-col gap-2", bgColor)}>
							<button 
								onClick={() => setDismissedList(prev => [...prev, n.id])}
								className="absolute top-3 right-3 text-black/60 hover:text-black font-extrabold text-sm"
								aria-label="Dismiss notification"
							>
								✕
							</button>
							<div>
								<h3 className={clsx("font-heading font-black text-sm leading-tight", titleColor)}>{n.title}</h3>
								<p className="text-[11px] font-semibold text-black/75 mt-1 leading-snug break-words">
									{n.desc}
								</p>
							</div>
							{n.action && n.link && (
								<Link
									href={n.link}
									onClick={onClose}
									className="w-full py-1.5 bg-[#FFC940] text-black border-[3px] border-black rounded-xl font-black text-center text-[10px] tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all block uppercase"
								>
									{n.action}
								</Link>
							)}
						</div>
					)
				})}

				{showIncompleteCard && !community && (
					<div className="bg-white border-[3px] border-black rounded-[24px] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black relative flex flex-col gap-2">
						<button 
							onClick={() => setShowIncompleteCard(false)}
							className="absolute top-3 right-3 text-black/60 hover:text-black font-extrabold text-sm"
							aria-label="Close incomplete profile alert"
						>
							✕
						</button>
						<div>
							<h3 className="font-heading font-bold text-base text-black leading-tight">Incomplete Profile</h3>
							<p className="text-[11px] font-semibold text-black/50 mt-0.5 leading-snug">
								Create your community profile to be eligible for sponsorships.
							</p>
						</div>

						<Link
							href="/community/dashboard/profile?open=community"
							onClick={onClose}
							className="w-full py-2 bg-[#FFC940] text-black border-[3px] border-black rounded-2xl font-bold text-center text-xs tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all block"
						>
							COMPLETE NOW
						</Link>
					</div>
				)}


			</div>

			{/* Navigation Bottom Items */}
			<div className="px-4 pb-4 flex flex-col gap-1 mt-auto shrink-0">
				{/* Chats Menu with Sponsorship, Campaign, Community, and Spaces Chats */}
				<div className="flex flex-col">
					<button
						type="button"
						onClick={() => setChatsOpen((prev) => !prev)}
						className={clsx(
							"w-full flex items-center justify-between px-4 py-2 rounded-2xl transition-all text-sm font-normal select-none text-left cursor-pointer",
							isChatsRoute
								? "bg-[#D12525] text-white"
								: "text-white/90 hover:bg-[#D12525]/50 hover:text-white"
						)}
					>
						<div className="flex items-center gap-2.5 min-w-0">
							<Icon
								as={isChatsRoute ? ChatFillSvg : ChatOutSvg}
								size="md"
								className="text-white shrink-0"
							/>
							<span className="whitespace-nowrap">Chats</span>
						</div>
						<div className="flex items-center gap-1.5 shrink-0">
							{!chatsOpen && totalChatsBadge > 0 && (
								<span className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-[#FFC940] text-black text-[10px] font-black flex items-center justify-center">
									{totalChatsBadge > 9 ? "9+" : totalChatsBadge}
								</span>
							)}
							<svg
								className={clsx("size-3.5 text-white/70 transition-transform duration-200", chatsOpen && "rotate-180")}
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={2.5}
							>
								<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
							</svg>
						</div>
					</button>

					{chatsOpen && (
						<div className="flex flex-col gap-1 pl-3 my-1 border-l-2 border-white/20 ml-5">
							<Link
								href="/community/dashboard/chats?type=sponsorship"
								onClick={onClose}
								className={clsx(
									"flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-xs sm:text-sm font-normal",
									isSponsorshipChat
										? "bg-[#D12525] text-white font-medium"
										: "text-white/80 hover:bg-[#D12525]/40 hover:text-white"
								)}
							>
								<span className="flex-1 whitespace-nowrap">Sponsorship Chats</span>
								{unreadSponsorshipChatsCount > 0 && (
									<span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FFC940] text-black text-[10px] font-black flex items-center justify-center">
										{unreadSponsorshipChatsCount > 9 ? "9+" : unreadSponsorshipChatsCount}
									</span>
								)}
							</Link>

							<Link
								href="/community/dashboard/chats?type=campaign"
								onClick={onClose}
								className={clsx(
									"flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-xs sm:text-sm font-normal",
									isCampaignChat
										? "bg-[#D12525] text-white font-medium"
										: "text-white/80 hover:bg-[#D12525]/40 hover:text-white"
								)}
							>
								<span className="flex-1 whitespace-nowrap">Campaign Chats</span>
								{unreadCampaignChatsCount > 0 && (
									<span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FFC940] text-black text-[10px] font-black flex items-center justify-center">
										{unreadCampaignChatsCount > 9 ? "9+" : unreadCampaignChatsCount}
									</span>
								)}
							</Link>

							<Link
								href="/community/dashboard/space-chats"
								onClick={onClose}
								className={clsx(
									"flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-xs sm:text-sm font-normal",
									isSpacesChat
										? "bg-[#D12525] text-white font-medium"
										: "text-white/80 hover:bg-[#D12525]/40 hover:text-white"
								)}
							>
								<span className="flex-1 whitespace-nowrap">Spaces Chats</span>
								{(unreadSpaceChatsCount + unreadCommunityRequestsCount) > 0 && (
									<span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FFC940] text-black text-[10px] font-black flex items-center justify-center">
										{(unreadSpaceChatsCount + unreadCommunityRequestsCount) > 9 ? "9+" : (unreadSpaceChatsCount + unreadCommunityRequestsCount)}
									</span>
								)}
							</Link>

							<Link
								href="/community/dashboard/chats?type=community"
								onClick={onClose}
								className={clsx(
									"flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-xs sm:text-sm font-normal",
									isCommunityChat
										? "bg-[#D12525] text-white font-medium"
										: "text-white/80 hover:bg-[#D12525]/40 hover:text-white"
								)}
							>
								<span className="flex-1 whitespace-nowrap">Community Chats</span>
								{unreadCommunityChatsCount > 0 && (
									<span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FFC940] text-black text-[10px] font-black flex items-center justify-center">
										{unreadCommunityChatsCount > 9 ? "9+" : unreadCommunityChatsCount}
									</span>
								)}
							</Link>
						</div>
					)}
				</div>

				{NAV_ITEMS_BOTTOM.map(({ label, href, outlined: Outlined, filled: Filled }) => {
					const isActive = pathname.startsWith(href)
					const isNotifications = label === "Notifications"
					const badgeCount = isNotifications ? unreadCount : label === "Support Chat" ? unreadSupportCount : 0

					return (
						<Link
							key={href}
							href={href}
							onClick={onClose}
							className={clsx(
								"flex items-center gap-2.5 px-4 py-2 rounded-2xl transition-all text-sm font-normal",
								isActive
									? "bg-[#D12525] text-white"
									: "text-white/90 hover:bg-[#D12525]/50 hover:text-white"
							)}
						>
							<div className="relative shrink-0">
								<Icon
									as={isActive ? Filled : Outlined}
									size="md"
									className="text-white"
								/>
								{isNotifications && unreadCount > 0 && (
									<span className="absolute -top-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full ring-2 ring-[#EE2C2C] bg-[#FFC940]" />
								)}
							</div>
							<span className="flex-1 whitespace-nowrap">{label}</span>
							{badgeCount > 0 && (
								<span className="shrink-0 min-w-[20px] h-[20px] px-1.5 rounded-full bg-[#FFC940] text-black text-[10px] font-black flex items-center justify-center">
									{badgeCount > 9 ? "9+" : badgeCount}
								</span>
							)}
						</Link>
					)
				})}

				{/* Bottom Host Button / Pill */}
				<Link
					href="/community/dashboard/profile"
					onClick={onClose}
					className="mt-2 flex items-center gap-2.5 px-4 py-2.5 bg-[#FFC940] text-black border-[3px] border-black rounded-2xl font-semibold text-sm tracking-wide shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all select-none relative overflow-hidden"
				>
					{/* Host icon circle */}
					{avatarUrl ? (
						<div className="relative size-7 rounded-full overflow-hidden border-2 border-black bg-white shrink-0">
							<Image
								src={avatarUrl}
								alt={communityName}
								fill
								sizes="28px"
								className="object-cover"
							/>
						</div>
					) : (
						<div className="size-7 rounded-full bg-white border-2 border-black flex items-center justify-center shrink-0">
							<svg className="size-4 text-black" viewBox="0 0 24 24" fill="currentColor">
								<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
							</svg>
						</div>
					)}
					<span className="flex-1 truncate">{communityName}</span>
					{/* Golden accent overlay styling */}
					<div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/20 skew-x-[25deg] pointer-events-none" />
				</Link>
			</div>

		</div>
	)
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
	return (
		<>
			{/* Desktop Sidebar */}
			<aside className="hidden lg:flex flex-col w-64 shrink-0 h-[calc(100vh-2rem)] bg-[#EE2C2C] overflow-hidden">
				<SidebarContent onClose={onClose} />
			</aside>

			{/* Mobile Sidebar overlay & drawer */}
			{isOpen && (
				<>
					<div
						className="fixed inset-0 bg-black/40 z-40 lg:hidden"
						onClick={onClose}
						aria-hidden
					/>
					<aside className="fixed inset-y-0 left-0 w-72 bg-[#EE2C2C] z-50 lg:hidden overflow-hidden shadow-panel">
						<SidebarContent onClose={onClose} />
					</aside>
				</>
			)}
		</>
	)
}
