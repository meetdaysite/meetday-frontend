"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import clsx from "clsx"
import { Button } from "../ui/Button"
import { useAuthStore } from "@/store/authStore"
import { useAttendeeProfileStore } from "@/store/attendeeProfileStore"

interface NavLink {
	label: string
	href: string
	deferred?: boolean
}

const NAV_LINKS: NavLink[] = [
	{ label: "Browse", href: "/explore" },
	{ label: "My Events", href: "/attendee/my-events" },
]

export function AttendeeHeader() {
	const [mobileOpen, setMobileOpen] = useState(false)
	const [dropdownOpen, setDropdownOpen] = useState(false)
	const dropdownRef = useRef<HTMLDivElement>(null)
	const pathname = usePathname()
	const router = useRouter()

	const user = useAuthStore((s) => s.user)
	const signOut = useAuthStore((s) => s.signOut)
	const profile = useAttendeeProfileStore((s) => s.profile)

	// Close dropdown on outside click
	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
				setDropdownOpen(false)
			}
		}
		if (dropdownOpen) document.addEventListener("mousedown", handleClickOutside)
		return () => document.removeEventListener("mousedown", handleClickOutside)
	}, [dropdownOpen])

	async function handleSignOut() {
		setDropdownOpen(false)
		await signOut()
		router.push("/attendee/login")
	}

	// Derive display name from /auth/me firstName/lastName, fallback to Firebase
	const firstName = profile?.firstName ?? ""
	const lastName = profile?.lastName ?? ""
	const displayName = [firstName, lastName].filter(Boolean).join(" ") || user?.displayName || user?.phoneNumber || ""
	const initial = firstName ? firstName.charAt(0).toUpperCase() : (displayName.charAt(0).toUpperCase() || "A")

	return (
		<header className="sticky top-0 z-40 w-full bg-surface-canvas/95 backdrop-blur-md border-b border-border-subtle">
			<div className="relative flex h-16 items-center max-w-384 mx-auto px-(--space-page-x-mobile) md:px-(--space-page-x-tablet) lg:px-(--space-page-x-desktop)">
				{/* Logo */}
				<Link href="/attendee" className="inline-flex items-center shrink-0 mr-6 lg:mr-10">
					<Image src="/assets/brand_logo.svg" alt="Meetday" width={110} height={30} priority style={{ height: "auto" }} />
				</Link>

				{/* Desktop nav */}
				<nav className="hidden lg:flex items-center gap-0.5 absolute left-1/2 -translate-x-1/2" aria-label="Main navigation">
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
					{user ? (
						<div className="relative" ref={dropdownRef}>
							<button
								onClick={() => setDropdownOpen((v) => !v)}
								className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-border-default hover:bg-surface-card-muted transition-colors"
								aria-label="Account menu"
								aria-expanded={dropdownOpen}
							>
								{profile?.avatarUrl ? (
									<Image
										src={profile.avatarUrl}
										alt={displayName}
										width={28}
										height={28}
										className="rounded-full object-cover size-7"
									/>
								) : (
									<span className="size-7 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
										{initial}
									</span>
								)}
								<span className="text-label-sm text-text-primary max-w-24 truncate">
									{firstName + " " + lastName || displayName.split(" ")[0] || "Account"}
								</span>
								<ChevronDownIcon className={clsx("transition-transform duration-150", dropdownOpen && "rotate-180")} />
							</button>

							{dropdownOpen && (
								<div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-border-subtle bg-surface-canvas shadow-floating py-1.5 z-50">
									<button
										className="w-full flex items-center gap-2.5 px-3.5 py-2 text-body-sm text-text-secondary hover:text-text-primary hover:bg-surface-card-muted transition-colors opacity-50 cursor-not-allowed"
										disabled
									>
										<UserIcon />
										Profile
									</button>
									<div className="my-1 border-t border-border-subtle" />
									<button
										onClick={handleSignOut}
										className="w-full flex items-center gap-2.5 px-3.5 py-2 text-body-sm text-text-danger hover:bg-red-50 transition-colors"
									>
										<LogoutIcon />
										Log out
									</button>
								</div>
							)}
						</div>
					) : (
						<>
							<Button
								variant="secondary"
								size="sm"
								radius="pill"
								className="w-20"
								onClick={() => router.push("/attendee/login")}
							>
								Login
							</Button>
							<Button
								variant="primary"
								size="sm"
								radius="pill"
								className="w-20"
								onClick={() => router.push("/attendee/signup")}
							>
								Sign up
							</Button>
						</>
					)}
				</div>

				{/* Mobile hamburger */}
				<Button
					variant="secondary"
					size="sm"
					className="lg:hidden ml-auto border-transparent bg-transparent text-text-primary hover:bg-surface-card-muted hover:border-transparent"
					onClick={() => setMobileOpen((v) => !v)}
					aria-label={mobileOpen ? "Close menu" : "Open menu"}
					aria-expanded={mobileOpen}
				>
					{mobileOpen ? <CloseIcon /> : <HamburgerIcon />}
				</Button>
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
						{user ? (
							<Button
								variant="secondary"
								size="sm"
								className="flex-1 text-text-danger"
								onClick={() => { setMobileOpen(false); handleSignOut() }}
							>
								Log out
							</Button>
						) : (
							<>
								<Button
									variant="secondary"
									size="sm"
									className="flex-1"
									onClick={() => { setMobileOpen(false); router.push("/attendee/login") }}
								>
									Login
								</Button>
								<Button
									variant="primary"
									size="sm"
									className="flex-1"
									onClick={() => { setMobileOpen(false); router.push("/attendee/signup") }}
								>
									Sign up
								</Button>
							</>
						)}
					</div>
				</div>
			)}
		</header>
	)
}

// ---------------------------------------------------------------------------
// Icon helpers
// ---------------------------------------------------------------------------

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

function ChevronDownIcon({ className }: { className?: string }) {
	return (
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className={className}>
			<path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

function UserIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
			<circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
			<path d="M2.5 13.5c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
		</svg>
	)
}

function LogoutIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
			<path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
			<path d="M10 11l3-3-3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M13 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
		</svg>
	)
}
