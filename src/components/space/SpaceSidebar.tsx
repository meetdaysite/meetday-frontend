"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import clsx from "clsx"
import { Icon } from "@/components/ui/Icon"
import WidgetsSvg from "@/icons/outlined/widgets.svg"
import WidgetSvg from "@/icons/filled/widget.svg"

const NAV_ITEMS = [
	{ label: "Profile", href: "/space/dashboard/profile", outlined: WidgetsSvg, filled: WidgetSvg },
]

export function SpaceSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
	const pathname = usePathname()

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
						{NAV_ITEMS.map(({ label, href, outlined: Outlined, filled: Filled }) => {
							const isActive = pathname === href || pathname.startsWith(href)
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
				</div>
			</aside>
		</>
	)
}
