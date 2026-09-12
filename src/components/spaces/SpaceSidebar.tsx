"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useSearchParams } from "next/navigation"
import clsx from "clsx"
import { Icon } from "@/components/ui/Icon"
import { useSpaceStore } from "@/store/spaceStore"
import { useToastStore } from "@/store/toastStore"
import { useNotificationStore } from "@/store/notificationStore"
import { useState, useEffect, type ComponentType, type SVGProps } from "react"
import { getMySpaceChats } from "@/lib/api"

import WidgetsSvg from "@/icons/outlined/widgets.svg"
import WidgetSvg from "@/icons/filled/widget.svg"
import LockOutSvg from "@/icons/outlined/lock.svg"
import LockFillSvg from "@/icons/filled/lock.svg"
import ChatOutSvg from "@/icons/outlined/chat.svg"
import ChatFillSvg from "@/icons/filled/chat.svg"
import HeadphonesSvg from "@/icons/filled/headphones.svg"
import DocumentTextSvg from "@/icons/outlined/document-text.svg"
import BellSvg from "@/icons/outlined/bell.svg"
import BellFillSvg from "@/icons/filled/bell.svg"

type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>

type NavItem = {
	label: string
	href: string
	outlined: SvgIcon
	filled: SvgIcon
	exact?: boolean
	chatType?: "community" | "brand"
}

const PRIMARY_NAV: NavItem[] = [
	{ label: "Dashboard", href: "/spaces/dashboard", outlined: WidgetsSvg, filled: WidgetSvg, exact: true },
	{ label: "Proposals", href: "/spaces/dashboard/proposals", outlined: DocumentTextSvg, filled: DocumentTextSvg },
	{ label: "Locked Deals", href: "/spaces/dashboard/deals", outlined: LockOutSvg, filled: LockFillSvg },
	{ label: "Community Chats", href: "/spaces/dashboard/chats?type=community", chatType: "community", outlined: ChatOutSvg, filled: ChatFillSvg },
	{ label: "Brand Chats", href: "/spaces/dashboard/chats?type=brand", chatType: "brand", outlined: ChatOutSvg, filled: ChatFillSvg },
]

const SECONDARY_NAV: NavItem[] = [
	{ label: "Support Chat", href: "/spaces/dashboard/support", outlined: HeadphonesSvg, filled: HeadphonesSvg },
	{ label: "Notifications", href: "/spaces/dashboard/notifications", outlined: BellSvg, filled: BellFillSvg },
]

interface SpaceSidebarProps {
	isOpen: boolean
	onClose: () => void
	onSignOut?: () => void
}

function SpaceSidebarContent({ onClose }: { onClose: () => void }) {
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const { profile } = useSpaceStore()
	const { toasts, removeToast } = useToastStore()
	const { unreadCount, init: initNotifs, notifications } = useNotificationStore()
	const businessName = profile?.businessName || "Space Partner"
	const avatarUrl = profile?.user?.avatarUrl
	const [unreadCommunityChatsCount, setUnreadCommunityChatsCount] = useState(0)
	const [unreadBrandChatsCount, setUnreadBrandChatsCount] = useState(0)
	const unreadSupportCount = notifications.filter(n =>
		!n.isRead &&
		n.title === "Meetday" &&
		!n.metadata?.threadId &&
		!n.metadata?.thread_id &&
		!n.metadata?.interestId &&
		!n.metadata?.interest_id &&
		!n.metadata?.chatId &&
		!n.metadata?.chat_id &&
		!n.metadata?.spaceInterestId &&
		!n.metadata?.sponsorshipInterestId
	).length

	useEffect(() => {
		initNotifs()
	}, [initNotifs])

	useEffect(() => {
		if (!profile?.id) return
		const updateCount = () => {
			getMySpaceChats(undefined, "SPACE")
				.then((threads) => {
					const commCount = threads
						.filter(t => t.requesterType === "COMMUNITY")
						.reduce((sum, t) => sum + (t.unreadCount || 0), 0)
					const brandCount = threads
						.filter(t => t.requesterType === "BRAND")
						.reduce((sum, t) => sum + (t.unreadCount || 0), 0)
					setUnreadCommunityChatsCount(commCount)
					setUnreadBrandChatsCount(brandCount)
				})
				.catch(() => {})
		}
		updateCount()
		const interval = setInterval(updateCount, 8000)
		return () => clearInterval(interval)
	}, [profile?.id])

	return (
		<div className="flex flex-col h-full bg-[#EE2C2C] text-white overflow-hidden select-none">
			{/* Brand Logo */}
			<div className="px-6 pt-5 pb-3 flex items-center justify-center shrink-0">
				<Link href="/spaces/dashboard">
					<Image
						src="/assets/brand_logo.svg"
						alt="Meetday"
						width={130}
						height={36}
						priority
						style={{ filter: "brightness(0) invert(1)" }}
						className="h-8 w-auto cursor-pointer"
					/>
				</Link>
			</div>

			{/* Navigation Top Items */}
			<div className="px-4 flex flex-col gap-1 mt-1 shrink-0">
				{PRIMARY_NAV.map(({ label, href, outlined: Outlined, filled: Filled, exact, chatType }) => {
					let isActive = false
					if (chatType === "brand") {
						isActive = pathname.startsWith("/spaces/dashboard/chats") && searchParams.get("type") === "brand"
					} else if (chatType === "community") {
						isActive = pathname.startsWith("/spaces/dashboard/chats") && searchParams.get("type") !== "brand"
					} else if (exact) {
						isActive = pathname === href
					} else {
						isActive = pathname.startsWith(href)
					}

					const badgeCount = chatType === "community"
						? unreadCommunityChatsCount
						: chatType === "brand"
						? unreadBrandChatsCount
						: 0

					return (
						<Link
							key={href}
							href={href}
							onClick={onClose}
							className={clsx(
								"flex items-center gap-2.5 px-4 py-2 rounded-2xl transition-all text-sm font-normal",
								isActive
									? "bg-[#D12525] text-white"
									: "text-white/90 hover:bg-[#D12525]/50 hover:text-white",
							)}
						>
							<Icon
								as={isActive ? Filled : Outlined}
								size="md"
								className="text-white shrink-0"
							/>
							<span className="flex-1 whitespace-nowrap">{label}</span>
							{badgeCount > 0 && (
								<span className="shrink-0 min-w-[20px] h-[20px] px-1.5 rounded-full bg-[#FFC940] text-black text-[10px] font-black flex items-center justify-center">
									{badgeCount > 9 ? "9+" : badgeCount}
								</span>
							)}
						</Link>
					)
				})}
			</div>

			{/* Middle Scrollable Section for Toasts */}
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
			</div>

			{/* Navigation Bottom Items */}
			<div className="px-4 pb-4 flex flex-col gap-1 mt-auto shrink-0">
				{SECONDARY_NAV.map(({ label, href, outlined: Outlined, filled: Filled }) => {
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
									className="text-white shrink-0"
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

				{/* Bottom Space Partner Button / Pill */}
				<Link
					href="/spaces/dashboard/profile"
					onClick={onClose}
					className="mt-2 flex items-center gap-2.5 px-4 py-2.5 bg-[#FFC940] text-black border-[3px] border-black rounded-2xl font-semibold text-sm tracking-wide shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all relative overflow-hidden"
				>
					{avatarUrl ? (
						<div className="relative size-7 rounded-full overflow-hidden border-2 border-black bg-white shrink-0">
							<Image
								src={avatarUrl}
								alt={businessName}
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
					<span className="flex-1 truncate font-bold">{businessName}</span>
					<div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/20 skew-x-[25deg] pointer-events-none" />
				</Link>
			</div>
		</div>
	)
}

export function SpaceSidebar({ isOpen, onClose }: SpaceSidebarProps) {
	return (
		<>
			{/* Desktop Sidebar */}
			<aside className="hidden lg:flex flex-col w-64 shrink-0 h-[calc(100vh-2rem)] bg-[#EE2C2C] overflow-hidden">
				<SpaceSidebarContent onClose={onClose} />
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
						<SpaceSidebarContent onClose={onClose} />
					</aside>
				</>
			)}
		</>
	)
}
