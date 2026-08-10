"use client"

import { create } from "zustand"
import {
	signInWithPopup,
	signInWithCustomToken,
	GoogleAuthProvider,
	type User,
	signOut as firebaseSignOut,
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import { ApiError } from "@/lib/errors"
import { useBookingStore } from "./bookingStore"
import { useAttendeeProfileStore } from "./attendeeProfileStore"
import { useAttendeeSessionStore } from "./attendeeSessionStore"
import { useAuthSessionStore } from "./authSessionStore"
import { useHostStore } from "./hostStore"
import { useDashboardStore } from "./dashboardStore"
import { useNotificationStore } from "./notificationStore"

// Phone number currently awaiting OTP verification. Module-level (not persisted) — a hard
// page refresh loses it, same recovery behavior as the old Firebase confirmationResult had.
let _pendingPhone: string | null = null

// Audited allow-list of identity-scoped keys (see localStorage/sessionStorage.setItem
// call sites app-wide). Deliberately excludes non-identity UI prefs like
// "events-view-mode", which should survive a logout.
const LOCAL_STORAGE_KEYS_TO_CLEAR = [
	"attendee_vibes",
	"attendee_about",
	"meetday_create_draft",
	"meetday_create_draft_id",
	"meetday_last_active",
]
const SESSION_STORAGE_KEYS_TO_CLEAR = ["auth-session", "attendee-session", "meetday-booking"]

const AUTH_ERROR_MESSAGES: Record<string, string> = {
	"auth/invalid-phone-number": "Please enter a valid phone number.",
	"auth/missing-phone-number": "Please enter a phone number.",
	"auth/invalid-verification-code": "That code isn't correct. Please try again.",
	"auth/code-expired": "This code has expired. Please request a new one.",
	"auth/too-many-requests": "Too many attempts. Please wait a while before trying again.",
	"auth/user-disabled": "This account has been disabled. Please contact support.",
	"auth/network-request-failed": "Network error. Please check your connection and try again.",
	"auth/popup-closed-by-user": "Sign-in was cancelled.",
}

// Firebase/provider errors (e.g. raw REST error bodies like BILLING_NOT_ENABLED) must
// never reach the user verbatim — map known codes to friendly text, generic otherwise.
// Our own backend's OTP errors already carry a human-readable message (see ApiError below).
function toFriendlyAuthError(error: unknown): Error {
	if (error instanceof ApiError) return new Error(error.message)
	const code = (error as { code?: string } | null)?.code
	if (code && AUTH_ERROR_MESSAGES[code]) return new Error(AUTH_ERROR_MESSAGES[code])
	return new Error("Something went wrong. Please try again.")
}

// Our own OTP endpoints are unauthenticated (@Public) — call them directly with fetch rather
// than the shared apiClient, to avoid a circular import with axios.ts (which imports this store).
async function postPublic<T>(path: string, body: unknown): Promise<T> {
	const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${path}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	})
	const json = await res.json().catch(() => ({}))
	if (!res.ok) {
		const message = Array.isArray(json?.message) ? String(json.message[0]) : String(json?.message ?? "Something went wrong. Please try again.")
		throw new ApiError(message, res.status, json)
	}
	return json.data as T
}

type AuthStore = {
	user: User | null
	authLoading: boolean
	setUser: (user: User | null) => void
	setAuthLoading: (v: boolean) => void
	sendOtp: (phone: string, recaptchaContainerId: string) => Promise<void>
	confirmOtp: (code: string) => Promise<string>
	hasPendingOtp: () => boolean
	signInWithGoogle: () => Promise<{ idToken: string; email: string | null; displayName: string | null }>
	signOut: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
	user: null,
	authLoading: true,
	setUser: (user) => set({ user }),
	setAuthLoading: (authLoading) => set({ authLoading }),

	sendOtp: async (phone) => {
		// A different user is already signed in — drop their session and app state
		// before starting a fresh OTP flow, so no stale profile data survives the switch.
		const currentUser = auth.currentUser
		if (currentUser && currentUser.phoneNumber && currentUser.phoneNumber !== phone) {
			await get().signOut()
		}

		_pendingPhone = null
		try {
			await postPublic("/auth/phone-otp/send", { phone })
			_pendingPhone = phone
		} catch (err) {
			throw toFriendlyAuthError(err)
		}
	},

	confirmOtp: async (code) => {
		if (!_pendingPhone) throw new Error("Your session expired. Please request a new code.")
		try {
			const { customToken } = await postPublic<{ customToken: string }>("/auth/phone-otp/verify", {
				phone: _pendingPhone,
				otp: code,
			})
			const credential = await signInWithCustomToken(auth, customToken)
			_pendingPhone = null
			return await credential.user.getIdToken()
		} catch (err) {
			throw toFriendlyAuthError(err)
		}
	},

	// The pending phone lives in a module-level variable, not persisted state — it's lost on
	// a hard page refresh. Verify pages check this on mount to detect that and recover instead
	// of letting confirmOtp throw into a dead end.
	hasPendingOtp: () => _pendingPhone !== null,

	signInWithGoogle: async () => {
		const provider = new GoogleAuthProvider()
		// Force the account chooser every time — without this, Chrome/Google can silently
		// re-use a cached/remembered session (no explicit account pick), which is confusing
		// when testing with multiple accounts and can sign in as the wrong one unnoticed.
		provider.setCustomParameters({ prompt: "select_account" })
		const credential = await signInWithPopup(auth, provider)
		const idToken = await credential.user.getIdToken()
		return { idToken, email: credential.user.email, displayName: credential.user.displayName }
	},

	signOut: async () => {
		await firebaseSignOut(auth)
		useBookingStore.getState().reset()
		useAttendeeProfileStore.getState().clearProfile()
		useAttendeeSessionStore.getState().clearSession()
		useAuthSessionStore.getState().clearSession()
		useHostStore.getState().clearProfile()
		useDashboardStore.getState().reset()
		useNotificationStore.getState().reset()
		try {
			for (const key of LOCAL_STORAGE_KEYS_TO_CLEAR) localStorage.removeItem(key)
		} catch { /* ignore */ }
		try {
			for (const key of SESSION_STORAGE_KEYS_TO_CLEAR) sessionStorage.removeItem(key)
		} catch { /* ignore */ }
	},
}))
