"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import clsx from "clsx"
import { Icon } from "@/components/ui/Icon"
import { useBrandStore } from "@/store/brandStore"
import { useToastStore } from "@/store/toastStore"
import { useState, useEffect, type ComponentType, type SVGProps } from "react"
import { getMySponsorshipChats } from "@/lib/api"
import { useNotificationStore } from "@/store/notificationStore"

import UserSvg from "@/icons/outlined/user.svg"
import WidgetsSvg from "@/icons/outlined/widgets.svg"
import WidgetFillSvg from "@/icons/filled/widget.svg"
import HeadphonesSvg from "@/icons/filled/headphones.svg"
import UsersGroupSvg from "@/icons/outlined/users-group-2.svg"
import DocumentTextSvg from "@/icons/outlined/document-text.svg"
import BellSvg from "@/icons/outlined/bell.svg"
import ChatOutSvg from "@/icons/outlined/chat.svg"
import ChatFillSvg from "@/icons/filled/chat.svg"
import DollarSvg from "@/icons/outlined/dollar.svg"

type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>

type NavItem = { label: string; href: string; outlined: SvgIcon; filled: SvgIcon; exact?: boolean }

const PRIMARY_NAV: NavItem[] = [
	{ label: "Dashboard", href: "/brand/dashboard", outlined: WidgetsSvg, filled: WidgetFillSvg, exact: true },
	{ label: "Campaigns", href: "/brand/dashboard/campaigns", outlined: DocumentTextSvg, filled: DocumentTextSvg },
	{ label: "Proposals", href: "/brand/dashboard/proposals", outlined: DocumentTextSvg, filled: DocumentTextSvg },
	{ label: "Communities", href: "/brand/dashboard/communities", outlined: UsersGroupSvg, filled: UsersGroupSvg },
]

const SECONDARY_NAV: NavItem[] = [
	{ label: "Chats", href: "/brand/dashboard/chats", outlined: ChatOutSvg, filled: ChatFillSvg },
	{ label: "Billing", href: "/brand/dashboard/billing", outlined: DollarSvg, filled: DollarSvg },
	{ label: "Support Chat", href: "/brand/dashboard/support", outlined: HeadphonesSvg, filled: HeadphonesSvg },
	{ label: "Notifications", href: "/brand/dashboard/notifications", outlined: BellSvg, filled: BellSvg },
]

function LogoutSvg(props: SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 24 24" fill="none" {...props}>
			<path
				d="M15 17.5V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1.5M9 12h11m0 0-3.5-3.5M20 12l-3.5 3.5"
				stroke="currentColor"
				strokeWidth="1.7"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

interface BrandSidebarProps {
	isOpen: boolean
	onClose: () => void
	onSignOut: () => void
}

function BrandSidebarContent({ onClose, onSignOut }: { onClose: () => void; onSignOut: () => void }) {
	const pathname = usePathname()
	const { profile } = useBrandStore()
	const { toasts, removeToast } = useToastStore()
	const brandName = profile?.brandName || "Brand"
	const avatarUrl = profile?.logoUrl
	const [unreadChatsCount, setUnreadChatsCount] = useState(0)
	const [unreadSupportCount, setUnreadSupportCount] = useState(0)

	const { notifications, init: initNotifs } = useNotificationStore()

	useEffect(() => {
		initNotifs()
	}, [initNotifs])

	useEffect(() => {
		if (!profile?.id) return

		const updateCount = () => {
			getMySponsorshipChats()
				.then(chats => {
					if (Array.isArray(chats)) {
						const count = chats.reduce((sum, t) => sum + (t.unreadCount || 0), 0)
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
						setUnreadChatsCount(count)
						setUnreadSupportCount(supportUnread)
					}
				})
				.catch(() => {})
		}

		updateCount()
		const interval = setInterval(updateCount, 8000)
		return () => clearInterval(interval)
	}, [profile?.id, notifications])

	return (
		<div className="flex flex-col h-full bg-[#EE2C2C] text-white overflow-hidden">
			{/* Brand Logo */}
			<div className="px-6 pt-5 pb-3 flex items-center justify-center shrink-0">
				<Link href="/brand/dashboard">
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
				{PRIMARY_NAV.map(({ label, href, outlined: Outlined, filled: Filled, exact }) => {
					let isActive = exact ? pathname === href : pathname.startsWith(href)
					if (label === "Proposals" && pathname.startsWith("/brand/dashboard/proposal")) {
						isActive = true
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

			{/* Middle Scrollable Section for Toasts/Notifications */}
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
							<span className="flex-1">{label}</span>
							{label === "Chats" && unreadChatsCount > 0 && (
								<span className="shrink-0 min-w-[20px] h-[20px] px-1.5 rounded-full bg-[#FFC940] text-black text-[10px] font-black flex items-center justify-center">
									{unreadChatsCount > 9 ? "9+" : unreadChatsCount}
								</span>
							)}
							{label === "Support Chat" && unreadSupportCount > 0 && (
								<span className="shrink-0 min-w-[20px] h-[20px] px-1.5 rounded-full bg-[#FFC940] text-black text-[10px] font-black flex items-center justify-center">
									{unreadSupportCount > 9 ? "9+" : unreadSupportCount}
								</span>
							)}
						</Link>
					)
				})}

				{/* Bottom Brand Button / Pill */}
				<Link
					href="/brand/dashboard/profile"
					onClick={onClose}
					className="mt-2 flex items-center gap-2.5 px-4 py-2.5 bg-[#FFC940] text-black border-[3px] border-black rounded-2xl font-semibold text-sm tracking-wide shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all select-none relative overflow-hidden"
				>
					{/* Avatar circle */}
					{avatarUrl ? (
						<div className="relative size-7 rounded-full overflow-hidden border-2 border-black bg-white shrink-0">
							<Image
								src={avatarUrl}
								alt={brandName}
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
					<span className="flex-1 truncate">{brandName}</span>
					{/* Golden accent overlay styling */}
					<div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/20 skew-x-[25deg] pointer-events-none" />
				</Link>
			</div>
		</div>
	)
}

export function BrandSidebar({ isOpen, onClose, onSignOut }: BrandSidebarProps) {
	return (
		<>
			<aside className="hidden lg:flex flex-col w-64 shrink-0 h-[calc(100vh-2rem)] bg-[#EE2C2C] overflow-hidden">
				<BrandSidebarContent onClose={onClose} onSignOut={onSignOut} />
			</aside>

			{isOpen && (
				<>
					<div
						className="fixed inset-0 bg-black/40 z-40 lg:hidden"
						onClick={onClose}
						aria-hidden
					/>
					<aside className="fixed inset-y-0 left-0 w-72 bg-[#EE2C2C] z-50 lg:hidden overflow-hidden shadow-panel">
						<BrandSidebarContent onClose={onClose} onSignOut={onSignOut} />
					</aside>
				</>
			)}
		</>
	)
}
