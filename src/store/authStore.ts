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

let _confirmation: ConfirmationResult | null = null
let _recaptcha: RecaptchaVerifier | null = null

type AuthStore = {
	user: User | null
	authLoading: boolean
	setUser: (user: User | null) => void
	setAuthLoading: (v: boolean) => void
	sendOtp: (phone: string, recaptchaContainerId: string) => Promise<void>
	confirmOtp: (code: string) => Promise<string>
	signInWithGoogle: () => Promise<{ idToken: string; email: string | null; displayName: string | null }>
	signOut: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
	user: null,
	authLoading: true,
	setUser: (user) => set({ user }),
	setAuthLoading: (authLoading) => set({ authLoading }),

	sendOtp: async (phone, recaptchaContainerId) => {
		if (_recaptcha) {
			_recaptcha.clear()
			_recaptcha = null
		}
		_recaptcha = new RecaptchaVerifier(auth, recaptchaContainerId, { size: "invisible" })
		_confirmation = await signInWithPhoneNumber(auth, phone, _recaptcha)
	},

	confirmOtp: async (code) => {
		if (!_confirmation) throw new Error("No OTP sent — call sendOtp first")
		const credential = await _confirmation.confirm(code)
		return credential.user.getIdToken()
	},

	signInWithGoogle: async () => {
		const provider = new GoogleAuthProvider()
		const credential = await signInWithPopup(auth, provider)
		const idToken = await credential.user.getIdToken()
		return { idToken, email: credential.user.email, displayName: credential.user.displayName }
	},

	signOut: async () => {
		await firebaseSignOut(auth)
	},
}))
