"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import { useAuthSessionStore } from "@/store/authSessionStore"
import { useHostStore } from "@/store/hostStore"
import { getAuthMe, getHostProfile, getBrandProfile } from "@/lib/api"
import { ApiError, getApiErrorMessage } from "@/lib/errors"

type AppKind = "host" | "brand"

// Interim login path while real SMS OTP delivery isn't wired up for production — reuses the
// exact same post-auth resolution logic as the phone-OTP verify pages (checkPhone → getAuthMe →
// role check → fetch profile), just keyed off a Google identity instead of a phone number.
export function useGoogleSignIn(intent: "login" | "signup", app: AppKind) {
	const [loading, setLoading] = useState(false)
	const { signInWithGoogle, signOut } = useAuth()
	const setSession = useAuthSessionStore((s) => s.setSession)
	const { setProfile } = useHostStore()
	const router = useRouter()
	const base = `/${app}`
	const expectedRole = app === "host" ? "HOST" : "BRAND"

	async function handleGoogleSignIn() {
		setLoading(true)
		try {
			const { email, displayName } = await signInWithGoogle()
			setSession({ intent, email: email ?? undefined, displayName: displayName ?? undefined })

			let me: Awaited<ReturnType<typeof getAuthMe>> | null = null
			try {
				me = await getAuthMe()
			} catch (err) {
				if (!(err instanceof ApiError && err.statusCode === 404)) throw err
			}

			if (me) {
				if (me.role.name !== expectedRole) {
					await signOut()
					toast.error(
						`This Google account is already registered as a different account type. Please use a different Google account to sign up as a ${app}.`,
					)
					return
				}
				if (intent === "signup") {
					await signOut()
					toast.error("An account already exists for this Google account. Please log in.")
					router.replace(`${base}/login`)
					return
				}
				const profile = app === "host" ? await getHostProfile() : await getBrandProfile()
				setProfile(profile)
				router.push(`${base}/dashboard`)
				return
			}

			if (intent === "login") {
				await signOut()
				toast.error("No account found for this Google account. Please sign up.")
				router.replace(`${base}/signup`)
				return
			}

			router.push(`${base}/onboarding`)
		} catch (err) {
			toast.error(getApiErrorMessage(err))
		} finally {
			setLoading(false)
		}
	}

	return { loading, handleGoogleSignIn }
}
