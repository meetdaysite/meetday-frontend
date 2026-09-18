"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ApiError } from "@/lib/errors"
import { useAuthStore } from "@/store/authStore"
import { useSpaceStore } from "@/store/spaceStore"
import { getSpaceProfile } from "@/lib/api"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { SpaceSidebar } from "@/components/space/SpaceSidebar"

function HamburgerIcon() {
	return (
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
			<path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}

function LoadingScreen() {
	return (
		<div className="min-h-screen flex bg-surface-page animate-pulse">
			<aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-border-default p-4 gap-6">
				<Skeleton.Block className="h-8 w-28" />
				{[...Array(3)].map((_, i) => (
					<div key={i} className="flex items-center gap-3 px-2">
						<Skeleton.Block className="size-5 rounded shrink-0" />
						<Skeleton.Text className="flex-1" />
					</div>
				))}
			</aside>
			<div className="flex-1 p-6 lg:p-8 flex flex-col gap-6">
				<Skeleton.Text className="h-8 w-48" />
				<Skeleton.Block className="h-48 rounded-action" />
			</div>
		</div>
	)
}

export default function SpaceDashboardLayout({ children }: { children: React.ReactNode }) {
	const [sidebarOpen, setSidebarOpen] = useState(false)
	const [profileError, setProfileError] = useState(false)
	const [needsSignup, setNeedsSignup] = useState(false)
	const { user, authLoading, signOut } = useAuthStore()
	const { profile, setProfile, clearProfile } = useSpaceStore()
	const router = useRouter()

	async function handleSignOut() {
		clearProfile()
		router.replace("/")
		await signOut()
	}

	useEffect(() => {
		if (authLoading) return
		if (!user) {
			router.replace("/space/login")
			return
		}
		if (profile) return

		let cancelled = false
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setProfileError(false)
		setNeedsSignup(false)
		getSpaceProfile()
			.then((p) => {
				if (!cancelled) setProfile(p)
			})
			.catch((e) => {
				if (cancelled) return
				if (e instanceof ApiError && (e.statusCode === 404 || e.statusCode === 403)) {
					setNeedsSignup(true)
				} else {
					setProfileError(true)
				}
			})
		return () => {
			cancelled = true
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user, authLoading])

	if (authLoading || (!profile && !!user && !profileError && !needsSignup)) return <LoadingScreen />

	if (needsSignup) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-surface-page px-4">
				<div className="w-full max-w-md flex flex-col items-center gap-6 py-12 text-center">
					<h1 className="text-heading-sm text-text-primary font-bold">Complete your Hub Partner signup</h1>
					<p className="text-body-sm text-text-secondary max-w-sm">
						You&apos;re signed in, but this account hasn&apos;t set up a Hub Partner profile yet.
					</p>
					<Button
						variant="primary"
						onClick={async () => {
							clearProfile()
							await signOut()
							router.replace("/space/signup")
						}}
					>
						Complete signup
					</Button>
					<button
						onClick={handleSignOut}
						className="text-label-sm font-medium text-text-secondary hover:text-text-primary transition-colors underline underline-offset-2"
					>
						Sign out
					</button>
				</div>
			</div>
		)
	}

	if (profileError) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-surface-page px-4">
				<div className="w-full max-w-md flex flex-col items-center gap-4 py-12 text-center">
					<h1 className="text-heading-sm font-bold text-text-primary">Failed to load profile</h1>
					<p className="text-body-sm text-text-secondary">We couldn&apos;t load your profile. Check your connection and try again.</p>
					<div className="flex items-center gap-3">
						<Button onClick={() => setProfileError(false)}>Try again</Button>
						<button
							onClick={handleSignOut}
							className="inline-flex items-center gap-2 h-(--size-action-md) px-4 text-label-sm font-medium rounded-action bg-action-secondary text-action-secondary-text border border-action-secondary-border hover:bg-action-secondary-hover transition-colors duration-(--duration-120)"
						>
							Sign out
						</button>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen flex bg-[#EE2C2C] p-4 gap-4 overflow-hidden">
			<SpaceSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

			<div className="flex-1 flex flex-col min-w-0 bg-white rounded-[36px] overflow-hidden h-[calc(100vh-2rem)]">
				<header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-surface-card border-b border-border-default">
					<Link href="/space/dashboard">
						<Image src="/assets/brand_logo.svg" alt="Meetday" width={100} height={28} className="h-7 w-auto cursor-pointer" />
					</Link>
					<button
						onClick={() => setSidebarOpen(true)}
						className="text-text-primary p-1.5 rounded-action hover:bg-surface-card-muted transition-colors"
						aria-label="Open navigation menu"
					>
						<HamburgerIcon />
					</button>
				</header>

				<main className="flex-1 overflow-y-auto mr-2 my-2">
					<div className="w-full max-w-7xl mx-auto h-full">{children}</div>
				</main>
			</div>
		</div>
	)
}
