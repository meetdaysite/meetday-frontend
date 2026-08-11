"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ApiError, getApiErrorMessage } from "@/lib/errors"
import clsx from "clsx"
import { LogoutConfirmDialog } from "@/components/ui/LogoutConfirmDialog"
import { useAuthStore } from "@/store/authStore"
import { useHostStore } from "@/store/hostStore"
import { useNotificationStore } from "@/store/notificationStore"
import { useAttendeeProfileStore } from "@/store/attendeeProfileStore"
import { getBrandProfile, reapplyAsHost, type BrandProfile } from "@/lib/api"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { BrandSidebar } from "@/components/brand/BrandSidebar"
import { CompleteKycScreen } from "@/components/brand/CompleteKycScreen"
import { Icon } from "@/components/ui/Icon"
import ClockCircleSvg from "@/icons/outlined/clock-circle.svg"
import CloseCircleSvg from "@/icons/outlined/close-circle.svg"
import CheckCircleSvg from "@/icons/outlined/check-circle.svg"

function HamburgerIcon() {
	return (
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
			<path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}

function CheckIcon({ done }: { done: boolean }) {
	if (done) return <Icon as={CheckCircleSvg} size="sm" color="success" className="shrink-0" />
	return <Icon as={ClockCircleSvg} size="sm" color="muted" className="shrink-0" />
}

// A burst of profile fetches right after registration can trip the backend's rate limiter
// (429) — retry a couple of times with backoff before surfacing the scary "Failed to load
// profile" screen for what's really just a transient blip.
async function getBrandProfileWithRetry(): Promise<BrandProfile> {
	const delays = [500, 1500]
	for (const delay of delays) {
		try {
			return await getBrandProfile()
		} catch (e) {
			if (!(e instanceof ApiError && e.statusCode === 429)) throw e
			await new Promise(r => setTimeout(r, delay))
		}
	}
	return getBrandProfile()
}

function UnderReviewScreen({
	status,
	profile,
	onSignOut,
}: {
	status: "pending" | "rejected"
	profile: BrandProfile
	onSignOut: () => void
}) {
	const isPending = status === "pending"
	const setProfile = useHostStore((s) => s.setProfile)
	const [reapplying, setReapplying] = useState(false)

	async function handleReapply() {
		setReapplying(true)
		try {
			await reapplyAsHost()
			const fresh = await getBrandProfile()
			setProfile(fresh)
			toast.success("You can now resubmit your verification details.")
		} catch (e) {
			toast.error(getApiErrorMessage(e))
		} finally {
			setReapplying(false)
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-surface-page px-4">
			<div className="w-full max-w-md flex flex-col items-center gap-6 py-12">
				{/* Icon */}
				<div
					className={clsx(
						"size-20 rounded-full flex items-center justify-center",
						isPending ? "bg-surface-warning-soft" : "bg-status-error-bg",
					)}
				>
					{isPending ? (
						<Icon as={ClockCircleSvg} size="2xl" color="warning" />
					) : (
						<Icon as={CloseCircleSvg} size="2xl" color="inherit" className="text-status-error-text" />
					)}
				</div>

				<div className="text-center">
					<h1 className="text-heading-sm text-text-primary font-bold">
						{isPending ? "Account Under Review" : "Application Not Approved"}
					</h1>
					<p className="text-body-sm text-text-secondary mt-2 max-w-md mx-auto">
						{isPending
							? "Your profile has been submitted. Our team will review your application within 2–3 business days."
							: "Your application was not approved. You can review the reason below and reapply."}
					</p>
					{!isPending && profile.rejectionReason && (
						<p className="text-body-sm text-status-error-text bg-status-error-bg border border-status-error-text/20 rounded-action px-4 py-3 mt-4 max-w-md mx-auto text-left">
							{profile.rejectionReason}
						</p>
					)}
				</div>

				{!isPending && (
					<Button variant="primary" size="sm" onClick={handleReapply} disabled={reapplying}>
						{reapplying ? "Submitting…" : "Reapply"}
					</Button>
				)}

				{isPending && (
					<div className="w-full rounded-action border border-border-default overflow-hidden">
						{[
							{ label: "Profile submitted", done: true },
							{ label: "PAN verification", done: profile.panVerificationStatus === "VERIFIED" },
							{ label: "Bank account verification", done: profile.bankVerificationStatus === "VERIFIED" },
							{ label: "Admin approval", done: profile.approvalStatus === "APPROVED" },
						].map((item, i, arr) => (
							<div
								key={item.label}
								className={clsx(
									"flex items-center gap-3 px-4 py-3",
									i < arr.length - 1 && "border-b border-border-default",
									!item.done && "opacity-50",
								)}
							>
								<CheckIcon done={item.done} />
								<span className="text-body-sm text-text-primary font-semibold flex-1">
									{item.label}
								</span>
								{!item.done && (
									<span className="text-caption font-medium text-text-warning bg-surface-warning-soft border border-yellow-200 px-2.5 py-0.5 rounded-avatar">
										Pending
									</span>
								)}
							</div>
						))}
					</div>
				)}

				{isPending && (
					<p className="text-body-sm text-text-secondary text-center">
						You&apos;ll receive an email once your account is approved.
					</p>
				)}

				<button
					onClick={onSignOut}
					className="text-label-sm font-medium text-text-secondary hover:text-text-primary transition-colors underline underline-offset-2"
				>
					Sign out
				</button>
			</div>
		</div>
	)
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
				<div className="flex flex-col gap-3">
					<Skeleton.Announcement />
					<Skeleton.Announcement />
					<Skeleton.Announcement />
				</div>
			</div>
		</div>
	)
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	const [sidebarOpen, setSidebarOpen] = useState(false)
	const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
	const [profileError, setProfileError] = useState(false)
	const { user, authLoading, signOut } = useAuthStore()
	const { profile, setProfile, clearProfile } = useHostStore()
	const initNotifications = useNotificationStore(s => s.init)
	const router = useRouter()

	async function handleSignOut() {
		clearProfile()
		router.replace("/")
		await signOut()
	}

	useEffect(() => {
		if (authLoading) return

		if (!user) {
			router.replace("/brand/login")
			return
		}

		// Profile already in store (navigated from login/onboarding) — nothing to fetch
		if (profile) return

		// Page refresh — profile not in memory, fetch it
		let cancelled = false
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setProfileError(false)
		getBrandProfileWithRetry()
			.then(p => {
				if (cancelled) return
				setProfile(p)
			})
			.catch(async e => {
				if (cancelled) return
				if (e instanceof ApiError && (e.statusCode === 404 || e.statusCode === 403)) {
					// 404: never registered at all. 403: this identity is registered (e.g. as HOST or
					// an admin) but hasn't completed BRAND signup yet — one login can hold host, brand,
					// and admin access at once, so send them to onboarding to attach a brand profile
					// instead of signing them out. If they're a genuine attendee, send them there instead.
					// Wait for the attendee-profile fetch to actually settle first — reading it
					// immediately here raced a still-in-flight fetch and could send a genuine attendee
					// to /brand/onboarding instead of /attendee.
					await useAttendeeProfileStore.getState().waitUntilLoaded()
					if (cancelled) return
					const meProfile = useAttendeeProfileStore.getState().profile
					if (meProfile?.attendeeProfile != null) {
						router.replace("/attendee")
					} else {
						router.replace("/brand/onboarding")
					}
				} else {
					// Don't redirect to /login — the user is still authenticated in Firebase,
					// which would cause an immediate bounce back to /dashboard and an infinite loop.
					setProfileError(true)
				}
			})
		return () => {
			cancelled = true
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user, authLoading])

	// Init notifications once the brand profile is confirmed APPROVED
	useEffect(() => {
		if (profile?.approvalStatus === "APPROVED") {
			initNotifications()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [profile?.approvalStatus])

	// Show loading while Firebase resolves auth or while profile is being fetched
	if (authLoading || (!profile && !!user && !profileError)) return <LoadingScreen />

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
					<div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-12 px-6 sm:px-10 lg:px-16 py-8">
						<div className="w-full lg:w-3/5 flex items-center justify-center order-first lg:order-last">
							<Image
								src="/assets/errors/500.png"
								alt="Failed to load profile"
								width={800}
								height={800}
								priority
								className="w-full h-auto"
							/>
						</div>
						<div className="w-full lg:w-2/5 flex flex-col items-center lg:items-start gap-4 text-center lg:text-left">
							<p className="text-[6rem] sm:text-[8rem] lg:text-[12rem] font-bold leading-none tracking-tight text-text-brand">
								500
							</p>
							<div className="-mt-2">
								<h1 className="text-heading-sm font-bold text-text-primary">
									Failed to load profile
								</h1>
								<p className="text-body-sm text-text-secondary mt-2 max-w-sm">
									We couldn&apos;t load your brand profile. Check your connection and try
									again.
								</p>
							</div>
							<div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-2">
								<Button
									onClick={() => {
										setProfileError(false)
									}}
								>
									Try again
								</Button>
								<button
									onClick={handleSignOut}
									className="inline-flex items-center gap-2 h-(--size-action-md) px-4 text-label-sm font-medium rounded-action bg-action-secondary text-action-secondary-text border border-action-secondary-border hover:bg-action-secondary-hover transition-colors duration-(--duration-120)"
								>
									Sign out
								</button>
							</div>
						</div>
					</div>
				</main>
			</div>
		)
	}

	const approvalStatus = profile?.approvalStatus

	// KYC must be complete before an application can be sent for admin approval —
	// a PENDING profile with unverified PAN/bank means the applicant dropped off
	// mid-onboarding and needs to finish that step first.
	/*
	if (profile && approvalStatus === "PENDING" && profile.kycStatus !== "VERIFIED") {
		return (
			<>
				<CompleteKycScreen profile={profile} onSignOut={() => setShowLogoutConfirm(true)} />
				<LogoutConfirmDialog
					open={showLogoutConfirm}
					onClose={() => setShowLogoutConfirm(false)}
					onConfirm={handleSignOut}
				/>
			</>
		)
	}

	if (profile && (approvalStatus === "PENDING" || approvalStatus === "REJECTED")) {
		return (
			<>
				<UnderReviewScreen
					status={approvalStatus === "PENDING" ? "pending" : "rejected"}
					profile={profile}
					onSignOut={() => setShowLogoutConfirm(true)}
				/>
				<LogoutConfirmDialog
					open={showLogoutConfirm}
					onClose={() => setShowLogoutConfirm(false)}
					onConfirm={handleSignOut}
				/>
			</>
		)
	}
	*/

	return (
		<div className="min-h-screen flex bg-surface-page">
			<BrandSidebar
				isOpen={sidebarOpen}
				onClose={() => setSidebarOpen(false)}
				onSignOut={() => setShowLogoutConfirm(true)}
			/>

			<div className="flex-1 flex flex-col min-w-0">
				{/* Mobile top bar */}
				<header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-surface-card border-b border-border-default">
					<Image
						src="/assets/brand_logo.svg"
						alt="Meetday"
						width={100}
						height={28}
						className="h-7 w-auto"
					/>
					<button
						onClick={() => setSidebarOpen(true)}
						className="text-text-primary p-1.5 rounded-action hover:bg-surface-card-muted transition-colors"
						aria-label="Open navigation menu"
					>
						<HamburgerIcon />
					</button>
				</header>

				<main className="flex-1">
					<div className="w-full max-w-7xl mx-auto">{children}</div>
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
