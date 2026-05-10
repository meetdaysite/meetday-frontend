"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import clsx from "clsx"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import type { ComponentType, SVGProps } from "react"

import WidgetsSvg from "@/icons/outlined/widgets.svg"
import DocumentTextSvg from "@/icons/outlined/document-text.svg"
import CalendarOutSvg from "@/icons/outlined/calendar.svg"
import CashOutOutSvg from "@/icons/outlined/cash-out.svg"
import Chart2OutSvg from "@/icons/outlined/chart-2.svg"
import SettingsOutSvg from "@/icons/outlined/settings.svg"
import GiftSvg from "@/icons/outlined/gift.svg"
import AltArrowRightSvg from "@/icons/outlined/alt-arrow-right.svg"

import WidgetSvg from "@/icons/filled/widget.svg"
import CalendarFillSvg from "@/icons/filled/calendar.svg"
import CashOutFillSvg from "@/icons/filled/cash-out.svg"
import Chart2FillSvg from "@/icons/filled/chart-2.svg"
import SettingsFillSvg from "@/icons/filled/settings.svg"

type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>

const NAV_ITEMS: { label: string; href: string; outlined: SvgIcon; filled: SvgIcon }[] = [
	{ label: "Dashboard", href: "/dashboard", outlined: WidgetsSvg, filled: WidgetSvg },
	{ label: "Drafts", href: "/dashboard/drafts", outlined: DocumentTextSvg, filled: DocumentTextSvg },
	{ label: "My Events", href: "/dashboard/events", outlined: CalendarOutSvg, filled: CalendarFillSvg },
	{ label: "Payouts", href: "/dashboard/payouts", outlined: CashOutOutSvg, filled: CashOutFillSvg },
	{ label: "Insights", href: "/dashboard/insights", outlined: Chart2OutSvg, filled: Chart2FillSvg },
	{ label: "Settings", href: "/dashboard/settings", outlined: SettingsOutSvg, filled: SettingsFillSvg },
]

interface SidebarProps {
	isOpen: boolean
	onClose: () => void
}

function SidebarContent({ onClose }: { onClose: () => void }) {
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
				<Button variant="primary" size="md" radius="pill" className="w-full">
					+ Create new experience
				</Button>
			</div>

			<nav className="flex-1 px-3 flex flex-col gap-0.5">
				{NAV_ITEMS.map(({ label, href, outlined: Outlined, filled: Filled }) => {
					const isActive = pathname === href
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
							<span className="text-label-md">{label}</span>
						</Link>
					)
				})}
			</nav>

			<div className="px-4 pb-6 mt-4 flex flex-col gap-4">
				<div className="bg-surface-brand-soft border border-border-brand rounded-card p-4">
					<p className="text-label-sm font-semibold text-text-brand flex items-center gap-1.5">
						<span className="size-2 rounded-full bg-red-500 shrink-0" />
						Host Pro Plan
					</p>
					<p className="text-caption text-text-secondary mt-0.5 mb-2">18 of 50 events created</p>
					<div className="h-1.5 w-full rounded-full bg-border-brand overflow-hidden mb-3">
						<div className="h-full w-[36%] rounded-full bg-action-primary" />
					</div>
					<button className="w-full text-label-sm text-text-primary font-medium border border-border-default rounded-action py-1.5 hover:bg-surface-card-muted transition-colors">
						View Plan
					</button>
				</div>

				<div className="flex items-start justify-between gap-3 bg-orange-50 border border-orange-100 rounded-card px-4 py-3">
					<div>
						<p className="text-label-sm font-semibold text-text-primary">Refer & Earn</p>
						<p className="text-caption text-text-secondary mt-0.5 mb-2">Invite others and earn when they publish.</p>
						<button className="inline-flex items-center gap-1 text-label-sm text-text-brand font-medium">
							Invite Now
							<AltArrowRightSvg className="size-3.5" aria-hidden />
						</button>
					</div>
					<Icon as={GiftSvg} size="lg" color="warning" className="shrink-0 mt-0.5" />
				</div>
			</div>
		</div>
	)
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
	return (
		<>
			<aside className="hidden lg:flex flex-col w-60 shrink-0 h-screen sticky top-0 bg-surface-card border-r border-border-subtle overflow-y-auto">
				<SidebarContent onClose={onClose} />
			</aside>

			{isOpen && (
				<>
					<div
						className="fixed inset-0 bg-black/40 z-40 lg:hidden"
						onClick={onClose}
						aria-hidden
					/>
					<aside className="fixed inset-y-0 left-0 w-72 bg-surface-card z-50 lg:hidden overflow-y-auto shadow-panel">
						<SidebarContent onClose={onClose} />
					</aside>
				</>
			)}
		</>
	)
}
