"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ApiError } from "@/lib/errors"
import { LogoutConfirmDialog } from "@/components/ui/LogoutConfirmDialog"
import { useAuthStore } from "@/store/authStore"
import { useSpaceStore } from "@/store/spaceStore"
import { useNotificationStore } from "@/store/notificationStore"
import { getSpaceProfile, type SpaceProfile } from "@/lib/api"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { SpaceSidebar } from "@/components/spaces/SpaceSidebar"

function HamburgerIcon() {
	return (
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
			<path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}

async function getSpaceProfileWithRetry(): Promise<SpaceProfile> {
	const delays = [500, 1500]
	for (const delay of delays) {
		try {
			return await getSpaceProfile()
		} catch (e) {
			if (!(e instanceof ApiError && e.statusCode === 429)) throw e
			await new Promise((r) => setTimeout(r, delay))
		}
	}
	return getSpaceProfile()
}

function LoadingScreen() {
	return (
		<div className="min-h-screen flex bg-surface-page animate-pulse">
			<aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-border-default p-4 gap-6">
				<Skeleton.Block className="h-8 w-28" />
				{[...Array(6)].map((_, i) => (
					<div key={i} className="flex items-center gap-3 px-2">
						<Skeleton.Block className="size-5 rounded shrink-0" />
						<Skeleton.Text className="flex-1" />
					</div>
				))}
			</aside>
			<div className="flex-1 p-6 lg:p-8 flex flex-col gap-6">
				<div className="flex flex-col gap-2">
					<Skeleton.Text className="h-8 w-48" />
					<Skeleton.Text className="w-72" />
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<Skeleton.StatCard />
					<Skeleton.StatCard />
					<Skeleton.StatCard />
				</div>
				<Skeleton.Block className="h-48 rounded-action" />
			</div>
		</div>
	)
}

export default function SpacesDashboardLayout({ children }: { children: React.ReactNode }) {
	const [sidebarOpen, setSidebarOpen] = useState(false)
	const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
	const [profileError, setProfileError] = useState(false)
	const [needsSignup, setNeedsSignup] = useState(false)
	const { user, authLoading, signOut } = useAuthStore()
	const { profile, setProfile, clearProfile } = useSpaceStore()
	const initNotifications = useNotificationStore(s => s.init)
	const router = useRouter()

	async function handleSignOut() {
		clearProfile()
		router.replace("/spaces")
		await signOut()
	}

	useEffect(() => {
		if (authLoading) return

		if (!user) {
			router.replace("/spaces/login")
			return
		}

		if (profile) return

		let cancelled = false
		setProfileError(false)
		setNeedsSignup(false)

		getSpaceProfileWithRetry()
			.then((p) => {
				if (cancelled) return
				setProfile(p)
			})
			.catch(async (e) => {
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
	}, [user, authLoading, profile, setProfile, router])

	// Init notifications once the space profile is resolved
	useEffect(() => {
		if (profile) {
			initNotifications()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [profile])

	if (authLoading || (!profile && !!user && !profileError && !needsSignup)) return <LoadingScreen />

	if (needsSignup) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-surface-page px-4">
				<div className="w-full max-w-md flex flex-col items-center gap-6 py-12 text-center">
					<h1 className="text-heading-sm text-text-primary font-bold">Complete your Hub Partner registration</h1>
					<p className="text-body-sm text-text-secondary max-w-sm">
						You&apos;re signed in, but this account hasn&apos;t set up a Hub Partner profile yet. Finish onboarding to access the Hubs dashboard.
					</p>
					<Button
						variant="primary"
						onClick={async () => {
							clearProfile()
							await signOut()
							router.replace("/spaces/signup")
						}}
					>
						Complete Registration
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
			<div className="min-h-screen flex flex-col bg-surface-page overflow-hidden">
				<header className="shrink-0 px-6 sm:px-10 lg:px-16 py-5">
					<Image
						src="/assets/brand_logo.svg"
						alt="Meetday"
						width={120}
						height={32}
						className="h-8 w-auto"
					/>
				</header>
				<main className="flex-1 flex items-center justify-center">
					<div className="w-full max-w-md flex flex-col items-center gap-4 text-center px-6">
						<h1 className="text-heading-sm font-bold text-text-primary">
							Failed to load hub profile
						</h1>
						<p className="text-body-sm text-text-secondary">
							We couldn&apos;t load your hub partner profile. Check your connection and try again.
						</p>
						<div className="flex gap-3 mt-2">
							<Button onClick={() => setProfileError(false)}>Try again</Button>
							<Button variant="secondary" onClick={handleSignOut}>Sign out</Button>
						</div>
					</div>
				</main>
			</div>
		)
	}

	return (
		<div className="min-h-screen flex bg-[#EE2C2C] p-4 gap-4 overflow-hidden">
			<SpaceSidebar
				isOpen={sidebarOpen}
				onClose={() => setSidebarOpen(false)}
			/>

			<div className="flex-1 flex flex-col min-w-0 bg-white rounded-[36px] overflow-hidden h-[calc(100vh-2rem)]">
				{/* Mobile Top Bar */}
				<header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-black/10">
					<Link href="/spaces/dashboard">
						<Image
							src="/assets/brand_logo.svg"
							alt="Meetday"
							width={100}
							height={28}
							className="h-7 w-auto cursor-pointer"
						/>
					</Link>
					<button
						onClick={() => setSidebarOpen(true)}
						className="text-black p-1.5 rounded-action hover:bg-slate-100 transition-colors"
						aria-label="Open navigation menu"
					>
						<HamburgerIcon />
					</button>
				</header>

				{/* Main Content Area */}
				<main className="flex-1 overflow-y-auto mr-2 my-2">
					<div className="w-full max-w-7xl mx-auto h-full">{children}</div>
				</main>
			</div>

			<LogoutConfirmDialog
				open={showLogoutConfirm}
				onClose={() => setShowLogoutConfirm(false)}
				onConfirm={handleSignOut}
			/>
		</div>
	)
}
