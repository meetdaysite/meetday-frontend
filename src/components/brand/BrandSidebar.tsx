"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import clsx from "clsx"
import { Icon } from "@/components/ui/Icon"
import type { ComponentType, SVGProps } from "react"

import UserSvg from "@/icons/outlined/user.svg"
import WidgetsSvg from "@/icons/outlined/widgets.svg"
import WidgetFillSvg from "@/icons/filled/widget.svg"
import TicketOutSvg from "@/icons/outlined/ticket.svg"
import TicketFillSvg from "@/icons/filled/ticket.svg"

type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>

const NAV_ITEMS: { label: string; href: string; outlined: SvgIcon; filled: SvgIcon; exact?: boolean }[] = [
	{ label: "Dataroom", href: "/brand/dashboard", outlined: WidgetsSvg, filled: WidgetFillSvg, exact: true },
	{ label: "Profile", href: "/brand/dashboard/profile", outlined: UserSvg, filled: UserSvg },
	{ label: "Support", href: "/brand/dashboard/support", outlined: TicketOutSvg, filled: TicketFillSvg },
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

	return (
		<div className="flex flex-col h-full">
			<div className="px-5 pt-6 pb-5">
				<Image
					src="/assets/brand_logo.svg"
					alt="Meetday"
					width={120}
					height={32}
					className="h-8 w-auto"
				/>
			</div>

			<nav className="flex-1 px-3 flex flex-col gap-0.5">
				{NAV_ITEMS.map(({ label, href, outlined: Outlined, filled: Filled, exact }) => {
					const isActive = exact ? pathname === href : pathname.startsWith(href)
					return (
						<Link
							key={href}
							href={href}
							onClick={onClose}
							className={clsx(
								"flex items-center gap-3 px-3 py-2.5 rounded-action transition-colors",
								isActive
									? "bg-surface-brand-soft text-text-brand"
									: "text-text-secondary hover:bg-surface-card-muted hover:text-text-primary",
							)}
						>
							<Icon
								as={isActive ? Filled : Outlined}
								size="md"
								color={isActive ? "brand" : "secondary"}
							/>
							<span className="text-label-md flex-1">{label}</span>
						</Link>
					)
				})}
			</nav>

			<div className="px-3 pb-5 pt-2 border-t border-border-default">
				<button
					type="button"
					onClick={() => {
						onClose()
						onSignOut()
					}}
					className="w-full flex items-center gap-3 px-3 py-2.5 rounded-action text-text-secondary hover:bg-surface-card-muted hover:text-text-primary transition-colors"
				>
					<LogoutSvg className="size-5 shrink-0" />
					<span className="text-label-md flex-1 text-left">Sign out</span>
				</button>
			</div>
		</div>
	)
}

export function BrandSidebar({ isOpen, onClose, onSignOut }: BrandSidebarProps) {
	return (
		<>
			<aside className="hidden lg:flex flex-col w-60 shrink-0 h-screen sticky top-0 bg-surface-card border-r border-border-default overflow-y-auto">
				<BrandSidebarContent onClose={onClose} onSignOut={onSignOut} />
			</aside>

			{isOpen && (
				<>
					<div
						className="fixed inset-0 bg-black/40 z-40 lg:hidden"
						onClick={onClose}
						aria-hidden
					/>
					<aside className="fixed inset-y-0 left-0 w-72 bg-surface-card z-50 lg:hidden overflow-y-auto shadow-panel">
						<BrandSidebarContent onClose={onClose} onSignOut={onSignOut} />
					</aside>
				</>
			)}
		</>
	)
}
