"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import clsx from "clsx"
import { Icon } from "@/components/ui/Icon"
import { useSpaceStore } from "@/store/spaceStore"
import type { ComponentType, SVGProps } from "react"

import WidgetsSvg from "@/icons/outlined/widgets.svg"
import WidgetSvg from "@/icons/filled/widget.svg"

type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>

type NavItem = {
	label: string
	href: string
	outlined: SvgIcon
	filled: SvgIcon
	exact?: boolean
}

const PRIMARY_NAV: NavItem[] = [
	{ label: "Dashboard", href: "/spaces/dashboard", outlined: WidgetsSvg, filled: WidgetSvg, exact: true },
]

interface SpaceSidebarProps {
	isOpen: boolean
	onClose: () => void
	onSignOut?: () => void
}

function SpaceSidebarContent({ onClose }: { onClose: () => void }) {
	const pathname = usePathname()
	const { profile } = useSpaceStore()
	const businessName = profile?.businessName || "Space Partner"
	const avatarUrl = profile?.user?.avatarUrl

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
				{PRIMARY_NAV.map(({ label, href, outlined: Outlined, filled: Filled, exact }) => {
					const isActive = exact ? pathname === href : pathname.startsWith(href)
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
						</Link>
					)
				})}
			</div>

			{/* Bottom Section: Space Partner Card / Pill */}
			<div className="px-4 pb-4 flex flex-col gap-2 mt-auto shrink-0">
				<Link
					href="/spaces/dashboard/profile"
					onClick={onClose}
					className="flex items-center gap-2.5 px-4 py-2.5 bg-[#FFC940] text-black border-[3px] border-black rounded-2xl font-semibold text-sm tracking-wide shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all relative overflow-hidden"
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
