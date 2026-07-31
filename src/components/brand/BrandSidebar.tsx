"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import clsx from "clsx"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import type { ComponentType, SVGProps } from "react"

import UserSvg from "@/icons/outlined/user.svg"
import CalendarOutSvg from "@/icons/outlined/calendar.svg"
import UsersGroupOutSvg from "@/icons/outlined/users-group.svg"
import UsersGroupFillSvg from "@/icons/filled/users-group.svg"
import TicketOutSvg from "@/icons/outlined/ticket.svg"
import TicketFillSvg from "@/icons/filled/ticket.svg"
import DocumentTextSvg from "@/icons/outlined/document-text.svg"
import CalendarFillSvg from "@/icons/filled/calendar.svg"

type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>

const NAV_ITEMS: { label: string; href: string; outlined: SvgIcon; filled: SvgIcon; dot?: boolean }[] = [
	{ label: "Events", href: "/brand/dashboard/events", outlined: CalendarOutSvg, filled: CalendarFillSvg },
	{ label: "Communities", href: "/brand/dashboard/communities", outlined: UsersGroupOutSvg, filled: UsersGroupFillSvg },
	{ label: "Proposals", href: "/brand/dashboard/proposal", outlined: DocumentTextSvg, filled: DocumentTextSvg },
	{ label: "Profile", href: "/brand/dashboard/profile", outlined: UserSvg, filled: UserSvg },
	{ label: "Support", href: "/brand/dashboard/support", outlined: TicketOutSvg, filled: TicketFillSvg },
]

interface BrandSidebarProps {
	isOpen: boolean
	onClose: () => void
}

function BrandSidebarContent({ onClose }: { onClose: () => void }) {
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

			<div className="px-4 pb-5">
				<Link href="/brand/dashboard/create" onClick={onClose}>
					<Button variant="primary" size="md" radius="md" className="w-full">
						Create campaign
					</Button>
				</Link>
			</div>

			<nav className="flex-1 px-3 flex flex-col gap-0.5">
				{NAV_ITEMS.map(({ label, href, outlined: Outlined, filled: Filled, dot }) => {
					const isActive = pathname.startsWith(href)
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
							{dot && <span className="size-2 rounded-full bg-red-500 shrink-0" />}
						</Link>
					)
				})}
			</nav>
		</div>
	)
}

export function BrandSidebar({ isOpen, onClose }: BrandSidebarProps) {
	return (
		<>
			<aside className="hidden lg:flex flex-col w-60 shrink-0 h-screen sticky top-0 bg-surface-card border-r border-border-default overflow-y-auto">
				<BrandSidebarContent onClose={onClose} />
			</aside>

			{isOpen && (
				<>
					<div
						className="fixed inset-0 bg-black/40 z-40 lg:hidden"
						onClick={onClose}
						aria-hidden
					/>
					<aside className="fixed inset-y-0 left-0 w-72 bg-surface-card z-50 lg:hidden overflow-y-auto shadow-panel">
						<BrandSidebarContent onClose={onClose} />
					</aside>
				</>
			)}
		</>
	)
}
