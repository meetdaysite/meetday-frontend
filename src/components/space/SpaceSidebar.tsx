"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect, type ComponentType, type SVGProps } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import clsx from "clsx"
import { Icon } from "@/components/ui/Icon"
import WidgetsSvg from "@/icons/outlined/widgets.svg"
import WidgetSvg from "@/icons/filled/widget.svg"
import ChatOutSvg from "@/icons/outlined/chat.svg"
import ChatFillSvg from "@/icons/filled/chat.svg"
import { getMySpaceChats } from "@/lib/api"

type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>

type NavItem = {
	label: string
	href: string
	outlined: SvgIcon
	filled: SvgIcon
	exact?: boolean
	chatType?: "community" | "brand"
}

const NAV_ITEMS: NavItem[] = [
	{ label: "Profile", href: "/space/dashboard/profile", outlined: WidgetsSvg, filled: WidgetSvg },
	{ label: "Community Chats", href: "/space/dashboard/chats?type=community", chatType: "community", outlined: ChatOutSvg, filled: ChatFillSvg },
	{ label: "Brand Chats", href: "/space/dashboard/chats?type=brand", chatType: "brand", outlined: ChatOutSvg, filled: ChatFillSvg },
]

export function SpaceSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const [unreadCommunityChatsCount, setUnreadCommunityChatsCount] = useState(0)
	const [unreadBrandChatsCount, setUnreadBrandChatsCount] = useState(0)

	useEffect(() => {
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
	}, [])

	return (
		<>
			{isOpen && (
				<div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />
			)}
			<aside
				className={clsx(
					"fixed lg:static inset-y-0 left-0 z-50 w-60 shrink-0 rounded-[28px] overflow-hidden transition-transform lg:translate-x-0",
					isOpen ? "translate-x-0" : "-translate-x-full",
				)}
			>
				<div className="flex flex-col h-full bg-[#EE2C2C] text-white overflow-hidden">
					<div className="px-6 pt-5 pb-3 flex items-center justify-center shrink-0">
						<Link href="/space/dashboard">
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

					<div className="px-4 flex flex-col gap-1 mt-1 shrink-0">
						{NAV_ITEMS.map(({ label, href, outlined: Outlined, filled: Filled, exact, chatType }) => {
							let isActive = false
							if (chatType === "brand") {
								isActive = pathname.startsWith("/space/dashboard/chats") && searchParams.get("type") === "brand"
							} else if (chatType === "community") {
								isActive = pathname.startsWith("/space/dashboard/chats") && searchParams.get("type") !== "brand"
							} else if (exact) {
								isActive = pathname === href
							} else {
								isActive = pathname === href || pathname.startsWith(href)
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
										isActive ? "bg-[#D12525] text-white" : "text-white/90 hover:bg-[#D12525]/50 hover:text-white",
									)}
								>
									<Icon as={isActive ? Filled : Outlined} size="md" className="text-white shrink-0" />
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
				</div>
			</aside>
		</>
	)
}
