"use client"

import { useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useAuthStore } from "@/store/authStore"
import { useAttendeeProfileStore } from "@/store/attendeeProfileStore"
import { useBookingStore } from "@/store/bookingStore"
import { useHostStore } from "@/store/hostStore"
import { useDashboardStore } from "@/store/dashboardStore"
import { useNotificationStore } from "@/store/notificationStore"
import { toast as sonnerToast } from "sonner"
import { useToastStore } from "@/store/toastStore"

if (typeof window !== "undefined") {
	const originalSuccess = sonnerToast.success
	const originalError = sonnerToast.error
	const originalInfo = sonnerToast.info

	sonnerToast.success = (message: any, data: any) => {
		const msg = typeof message === "string" ? message : message?.toString() || ""
		useToastStore.getState().addToast(msg, undefined, "success")
		return originalSuccess(message, data)
	}

	sonnerToast.error = (message: any, data: any) => {
		const msg = typeof message === "string" ? message : message?.toString() || ""
		useToastStore.getState().addToast(msg, undefined, "error")
		return originalError(message, data)
	}

	sonnerToast.info = (message: any, data: any) => {
		const msg = typeof message === "string" ? message : message?.toString() || ""
		useToastStore.getState().addToast(msg, undefined, "info")
		return originalInfo(message, data)
	}
}

export { useAuthStore as useAuth } from "@/store/authStore"

export type AccountRole = "host" | "attendee" | "unknown"

// Single source of truth for host-vs-attendee — HOST accounts have attendeeProfile: null
// on the /auth/me response. `role` only ever resolves to "host"/"attendee" once both
// Firebase auth and the profile fetch have settled; it stays "unknown" while loading
// or when no one is signed in.
export function useAccountRole(): { role: AccountRole; roleLoading: boolean } {
	const authLoading = useAuthStore((s) => s.authLoading)
	const user = useAuthStore((s) => s.user)
	const profile = useAttendeeProfileStore((s) => s.profile)
	const profileLoading = useAttendeeProfileStore((s) => s.profileLoading)

	const roleLoading = authLoading || (!!user && profileLoading)
	const role: AccountRole =
		!roleLoading && user && profile ? (profile.attendeeProfile === null ? "host" : "attendee") : "unknown"

	return { role, roleLoading }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		return onAuthStateChanged(auth, (u) => {
			useAuthStore.getState().setUser(u)
			useAuthStore.getState().setAuthLoading(false)
			if (u) {
				useAttendeeProfileStore.getState().fetchProfile()
			} else {
				// Firebase's auth persistence broadcasts sign-out to every open tab, so this
				// branch also runs in tabs that didn't initiate the logout — reset the same
				// in-memory stores signOut() resets, so a passive tab doesn't keep showing
				// stale profile/dashboard data after another tab logs out.
				useAttendeeProfileStore.getState().clearProfile()
				useBookingStore.getState().reset()
				useHostStore.getState().clearProfile()
				useDashboardStore.getState().reset()
				useNotificationStore.getState().reset()
			}
		})
	}, [])

	useEffect(() => {
		const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes
		const CHECK_INTERVAL = 10000 // 10 seconds
		const STORAGE_KEY = "meetday_last_active"

		// Helper to update last active timestamp (throttled to once every 10 seconds)
		let lastUpdated = 0
		function updateActivity() {
			const now = Date.now()
			if (now - lastUpdated > 10000) {
				localStorage.setItem(STORAGE_KEY, String(now))
				lastUpdated = now
			}
		}

		// Initialize if logged in and not set
		const user = useAuthStore.getState().user
		if (user && !localStorage.getItem(STORAGE_KEY)) {
			localStorage.setItem(STORAGE_KEY, String(Date.now()))
		}

		// Add event listeners for user activity
		const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"]
		events.forEach(event => {
			window.addEventListener(event, updateActivity)
		})

		// Interval to check inactivity
		const interval = setInterval(() => {
			const currentUser = useAuthStore.getState().user
			if (!currentUser) {
				localStorage.removeItem(STORAGE_KEY)
				return
			}

			const lastActiveStr = localStorage.getItem(STORAGE_KEY)
			if (lastActiveStr) {
				const lastActive = parseInt(lastActiveStr, 10)
				if (Date.now() - lastActive > INACTIVITY_TIMEOUT) {
					localStorage.removeItem(STORAGE_KEY)
					useAuthStore.getState().signOut().then(() => {
						window.location.href = "/community"
					})
				}
			} else {
				localStorage.setItem(STORAGE_KEY, String(Date.now()))
			}
		}, CHECK_INTERVAL)

		return () => {
			events.forEach(event => {
				window.removeEventListener(event, updateActivity)
			})
			clearInterval(interval)
		}
	}, [])

	return <>{children}</>
}
