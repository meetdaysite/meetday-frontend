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
import BellSvg from "@/icons/outlined/bell.svg"
import BellFillSvg from "@/icons/filled/bell.svg"
import { getMySpaceChats } from "@/lib/api"

type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>

type NavItem = {
	label: string
	href: string
	outlined: SvgIcon
	filled: SvgIcon
	exact?: boolean
}

const TOP_NAV_ITEMS: NavItem[] = [
	{ label: "Profile", href: "/space/dashboard/profile", outlined: WidgetsSvg, filled: WidgetSvg },
]

export function SpaceSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const [unreadCommunityChatsCount, setUnreadCommunityChatsCount] = useState(0)
	const [unreadBrandChatsCount, setUnreadBrandChatsCount] = useState(0)
	const [chatsOpen, setChatsOpen] = useState(false)

	const isChatsRoute = pathname.startsWith("/space/dashboard/chats")
	const isBrandChat = isChatsRoute && searchParams.get("type") === "brand"
	const isCommunityChat = isChatsRoute && searchParams.get("type") !== "brand"
	const totalChatsBadge = unreadCommunityChatsCount + unreadBrandChatsCount

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
						{TOP_NAV_ITEMS.map(({ label, href, outlined: Outlined, filled: Filled, exact }) => {
							const isActive = exact ? pathname === href : pathname.startsWith(href)

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
								</Link>
							)
						})}
					</div>

					<div className="flex-1 min-h-0" />

					<div className="px-4 pb-4 flex flex-col gap-1 mt-auto shrink-0">
						{/* Chats Menu */}
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
										href="/space/dashboard/chats?type=community"
										onClick={onClose}
										className={clsx(
											"flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-xs sm:text-sm font-normal",
											isCommunityChat
												? "bg-[#D12525] text-white font-medium"
												: "text-white/80 hover:bg-[#D12525]/40 hover:text-white"
										)}
									>
										<span className="flex-1 whitespace-nowrap">Community Chat</span>
										{unreadCommunityChatsCount > 0 && (
											<span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FFC940] text-black text-[10px] font-black flex items-center justify-center">
												{unreadCommunityChatsCount > 9 ? "9+" : unreadCommunityChatsCount}
											</span>
										)}
									</Link>

									<Link
										href="/space/dashboard/chats?type=brand"
										onClick={onClose}
										className={clsx(
											"flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-xs sm:text-sm font-normal",
											isBrandChat
												? "bg-[#D12525] text-white font-medium"
												: "text-white/80 hover:bg-[#D12525]/40 hover:text-white"
										)}
									>
										<span className="flex-1 whitespace-nowrap">Brand Chat</span>
										{unreadBrandChatsCount > 0 && (
											<span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FFC940] text-black text-[10px] font-black flex items-center justify-center">
												{unreadBrandChatsCount > 9 ? "9+" : unreadBrandChatsCount}
											</span>
										)}
									</Link>
								</div>
							)}
						</div>

						{/* Notifications */}
						<Link
							href="/spaces/dashboard/notifications"
							onClick={onClose}
							className={clsx(
								"flex items-center gap-2.5 px-4 py-2 rounded-2xl transition-all text-sm font-normal",
								pathname.startsWith("/spaces/dashboard/notifications")
									? "bg-[#D12525] text-white"
									: "text-white/90 hover:bg-[#D12525]/50 hover:text-white"
							)}
						>
							<Icon as={pathname.startsWith("/spaces/dashboard/notifications") ? BellFillSvg : BellSvg} size="md" className="text-white shrink-0" />
							<span className="flex-1 whitespace-nowrap">Notifications</span>
						</Link>
					</div>
				</div>
			</aside>
		</>
	)
}
