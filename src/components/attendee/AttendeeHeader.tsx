"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import clsx from "clsx"

interface NavLink {
	label: string
	href: string
	deferred?: boolean
}

const NAV_LINKS: NavLink[] = [
	{ label: "Find Events", href: "/explore" },
	{ label: "People", href: "#", deferred: true },
	{ label: "Groups", href: "#", deferred: true },
	{ label: "Rewards", href: "#", deferred: true },
	{ label: "About", href: "#" },
]

export function AttendeeHeader() {
	const [mobileOpen, setMobileOpen] = useState(false)
	const pathname = usePathname()

	return (
		<header className="sticky top-0 z-40 w-full bg-surface-canvas/95 backdrop-blur-md border-b border-border-subtle">
			<div className="flex h-16 items-center max-w-7xl mx-auto px-(--space-page-x-mobile) md:px-(--space-page-x-tablet) lg:px-(--space-page-x-desktop)">
				{/* Logo */}
				<Link href="/attendee" className="inline-flex items-center shrink-0 mr-6 lg:mr-10">
					<Image src="/assets/brand_logo.svg" alt="Meetday" width={110} height={30} priority />
				</Link>

				{/* Desktop nav */}
				<nav className="hidden lg:flex items-center gap-0.5 flex-1" aria-label="Main navigation">
					{NAV_LINKS.map((link) => {
						const isActive = pathname === link.href
						return (
							<Link
								key={link.label}
								href={link.href}
								className={clsx(
									"relative px-3 py-2 text-label-md rounded-action transition-colors",
									isActive
										? "text-text-primary"
										: "text-text-secondary hover:text-text-primary hover:bg-surface-card-muted",
									link.deferred && "opacity-50 pointer-events-none select-none",
								)}
								aria-current={isActive ? "page" : undefined}
								tabIndex={link.deferred ? -1 : undefined}
							>
								{link.label}
								{isActive && (
									<span className="absolute bottom-0 left-3 right-3 h-0.5 bg-text-brand rounded-full" />
								)}
							</Link>
						)
					})}
				</nav>

				{/* Desktop right actions */}
				<div className="hidden lg:flex items-center gap-2 ml-auto">
					<button
						className="p-2 rounded-action text-text-secondary hover:text-text-primary hover:bg-surface-card-muted transition-colors"
						aria-label="Events calendar"
					>
						<CalendarIcon />
					</button>

					<Link
						href="/attendee/login"
						className="px-3 py-2 text-label-md text-text-secondary hover:text-text-primary transition-colors rounded-action hover:bg-surface-card-muted"
					>
						Login
					</Link>

					<Link
						href="/attendee/signup"
						className="inline-flex items-center justify-center h-(--size-action-sm) px-4 text-label-sm font-medium bg-action-primary text-action-primary-text rounded-action hover:bg-action-primary-hover active:bg-action-primary-pressed transition-colors"
					>
						Sign up
					</Link>
				</div>

				{/* Mobile hamburger */}
				<button
					className="lg:hidden ml-auto p-2 rounded-action text-text-primary hover:bg-surface-card-muted transition-colors"
					onClick={() => setMobileOpen((v) => !v)}
					aria-label={mobileOpen ? "Close menu" : "Open menu"}
					aria-expanded={mobileOpen}
				>
					{mobileOpen ? <CloseIcon /> : <HamburgerIcon />}
				</button>
			</div>

			{/* Mobile drawer */}
			{mobileOpen && (
				<div className="lg:hidden border-t border-border-subtle bg-surface-canvas px-4 pb-4 pt-2 flex flex-col gap-1">
					{NAV_LINKS.map((link) => (
						<Link
							key={link.label}
							href={link.href}
							className={clsx(
								"px-3 py-2.5 text-body-md rounded-action transition-colors",
								link.deferred
									? "opacity-40 pointer-events-none text-text-secondary"
									: "text-text-primary hover:bg-surface-card-muted",
							)}
							onClick={() => setMobileOpen(false)}
							tabIndex={link.deferred ? -1 : undefined}
						>
							{link.label}
						</Link>
					))}

					<div className="flex gap-3 mt-3 pt-3 border-t border-border-subtle">
						<Link
							href="/attendee/login"
							className="flex-1 text-center py-2.5 text-label-md text-text-secondary border border-border-default rounded-action hover:bg-surface-card-muted transition-colors"
							onClick={() => setMobileOpen(false)}
						>
							Login
						</Link>
						<Link
							href="/attendee/signup"
							className="flex-1 text-center py-2.5 text-label-md bg-action-primary text-action-primary-text rounded-action hover:bg-action-primary-hover transition-colors"
							onClick={() => setMobileOpen(false)}
						>
							Sign up
						</Link>
					</div>
				</div>
			)}
		</header>
	)
}

// ---------------------------------------------------------------------------
// Icon helpers
// ---------------------------------------------------------------------------

function CalendarIcon() {
	return (
		<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
			<rect x="2.5" y="3.5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
			<path d="M2.5 8h15" stroke="currentColor" strokeWidth="1.5" />
			<path d="M6.5 1.5v3M13.5 1.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
		</svg>
	)
}

function HamburgerIcon() {
	return (
		<svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
			<path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
		</svg>
	)
}

function CloseIcon() {
	return (
		<svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
			<path d="M17 5L5 17M5 5l12 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
		</svg>
	)
}
