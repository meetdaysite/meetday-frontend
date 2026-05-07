"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"
import {
	onAuthStateChanged,
	signInWithPopup,
	signInWithPhoneNumber,
	GoogleAuthProvider,
	RecaptchaVerifier,
	ConfirmationResult,
	User,
	signOut as firebaseSignOut,
} from "firebase/auth"
import { auth } from "@/lib/firebase"

// Stored in sessionStorage under key "authSession"
export type AuthSession = {
	intent: "login" | "signup"
	phone?: string   // set for phone flow
	email?: string   // set for Google flow
	displayName?: string // from Google profile
}

type AuthContextValue = {
	user: User | null
	authLoading: boolean
	sendOtp: (phone: string, recaptchaContainerId: string) => Promise<void>
	confirmOtp: (code: string) => Promise<string>
	signInWithGoogle: () => Promise<{ idToken: string; email: string | null; displayName: string | null }>
	signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null)
	const [authLoading, setAuthLoading] = useState(true)
	const confirmationRef = useRef<ConfirmationResult | null>(null)
	const recaptchaRef = useRef<RecaptchaVerifier | null>(null)

	useEffect(() => {
		return onAuthStateChanged(auth, u => {
			setUser(u)
			setAuthLoading(false)
		})
	}, [])

	async function sendOtp(phone: string, recaptchaContainerId: string): Promise<void> {
		// Clear any previous verifier to avoid "already rendered" errors
		if (recaptchaRef.current) {
			recaptchaRef.current.clear()
			recaptchaRef.current = null
		}
		recaptchaRef.current = new RecaptchaVerifier(auth, recaptchaContainerId, { size: "invisible" })
		confirmationRef.current = await signInWithPhoneNumber(auth, phone, recaptchaRef.current)
	}

	async function confirmOtp(code: string): Promise<string> {
		if (!confirmationRef.current) throw new Error("No OTP sent — call sendOtp first")
		const credential = await confirmationRef.current.confirm(code)
		return credential.user.getIdToken()
	}

	async function signInWithGoogle(): Promise<{ idToken: string; email: string | null; displayName: string | null }> {
		const provider = new GoogleAuthProvider()
		const credential = await signInWithPopup(auth, provider)
		const idToken = await credential.user.getIdToken()
		return { idToken, email: credential.user.email, displayName: credential.user.displayName }
	}

	async function signOut(): Promise<void> {
		await firebaseSignOut(auth)
		sessionStorage.removeItem("authSession")
	}

	return (
		<AuthContext.Provider value={{ user, authLoading, sendOtp, confirmOtp, signInWithGoogle, signOut }}>
			{children}
		</AuthContext.Provider>
	)
}

export function useAuth() {
	const ctx = useContext(AuthContext)
	if (!ctx) throw new Error("useAuth must be used within AuthProvider")
	return ctx
}
