"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import clsx from "clsx"

const tabs = [
	{ label: "Log in", href: "/auth/login" },
	{ label: "Sign up", href: "/auth/signup" },
]

export function AuthTabs() {
	const pathname = usePathname()

	return (
		<div className="flex border-b border-border-default mb-6">
			{tabs.map(tab => {
				const active = pathname.startsWith(tab.href)
				return (
					<Link
						key={tab.href}
						href={tab.href}
						className={clsx(
							"flex-1 py-3 text-center text-label-md transition-colors duration-(--duration-120)",
							active
								? "text-text-primary border-b-2 border-action-primary -mb-px"
								: "text-text-muted hover:text-text-secondary",
						)}
					>
						{tab.label}
					</Link>
				)
			})}
		</div>
	)
}
