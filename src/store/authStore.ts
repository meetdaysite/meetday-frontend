"use client"

import { create } from "zustand"
import {
	signInWithPopup,
	signInWithPhoneNumber,
	GoogleAuthProvider,
	RecaptchaVerifier,
	type ConfirmationResult,
	type User,
	signOut as firebaseSignOut,
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useBookingStore } from "./bookingStore"
import { useAttendeeProfileStore } from "./attendeeProfileStore"
import { useAttendeeSessionStore } from "./attendeeSessionStore"
import { useAuthSessionStore } from "./authSessionStore"
import { useHostStore } from "./hostStore"
import { useDashboardStore } from "./dashboardStore"
import { useNotificationStore } from "./notificationStore"

let _confirmation: ConfirmationResult | null = null
let _recaptcha: RecaptchaVerifier | null = null

// Audited allow-list of identity-scoped keys (see localStorage/sessionStorage.setItem
// call sites app-wide). Deliberately excludes non-identity UI prefs like
// "events-view-mode", which should survive a logout.
const LOCAL_STORAGE_KEYS_TO_CLEAR = [
	"attendee_vibes",
	"attendee_about",
	"meetday_create_draft",
	"meetday_create_draft_id",
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
function toFriendlyAuthError(error: unknown): Error {
	const code = (error as { code?: string } | null)?.code
	if (code && AUTH_ERROR_MESSAGES[code]) return new Error(AUTH_ERROR_MESSAGES[code])
	return new Error("Something went wrong. Please try again.")
}

// RecaptchaVerifier.clear() doesn't reliably tear down an invisible widget that
// partially rendered before an error — emptying the container DOM node guarantees
// the next attempt (without a page reload) gets a genuinely fresh widget.
function resetRecaptcha(containerId: string) {
	if (_recaptcha) {
		try {
			_recaptcha.clear()
		} catch {
			/* widget may already be torn down */
		}
		_recaptcha = null
	}
	if (typeof document !== "undefined") {
		const container = document.getElementById(containerId)
		if (container) container.innerHTML = ""
	}
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

	sendOtp: async (phone, recaptchaContainerId) => {
		// A different user is already signed in — drop their session and app state
		// before starting a fresh OTP flow, so no stale profile data survives the switch.
		const currentUser = auth.currentUser
		if (currentUser && currentUser.phoneNumber && currentUser.phoneNumber !== phone) {
			await get().signOut()
		}

		resetRecaptcha(recaptchaContainerId)
		_recaptcha = new RecaptchaVerifier(auth, recaptchaContainerId, { size: "invisible" })

		try {
			_confirmation = await signInWithPhoneNumber(auth, phone, _recaptcha)
		} catch (err) {
			const error = err as { code?: string; message?: string }
			console.log("Firebase error:", error);
			console.log("Code:", error.code);
			console.log("Message:", error.message);

			resetRecaptcha(recaptchaContainerId);
			throw toFriendlyAuthError(err);
		}
	},

	confirmOtp: async (code) => {
		if (!_confirmation) throw new Error("Your session expired. Please request a new code.")
		try {
			const credential = await _confirmation.confirm(code)
			return await credential.user.getIdToken()
		} catch (err) {
			throw toFriendlyAuthError(err)
		}
	},

	// The pending confirmation lives in a module-level variable, not persisted state —
	// it's lost on a hard page refresh. Verify pages check this on mount to detect that
	// and recover instead of letting confirmOtp throw into a dead end.
	hasPendingOtp: () => _confirmation !== null,

	signInWithGoogle: async () => {
		const provider = new GoogleAuthProvider()
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
