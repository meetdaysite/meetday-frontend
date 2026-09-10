"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import { useAuthSessionStore } from "@/store/authSessionStore"
import { useHostStore } from "@/store/hostStore"
import { useBrandStore } from "@/store/brandStore"
import { getAuthMe, getHostProfile, getBrandProfile } from "@/lib/api"
import { ApiError, getApiErrorMessage } from "@/lib/errors"

type AppKind = "host" | "brand"

// Interim login path while real SMS OTP delivery isn't wired up for production — reuses the
// exact same post-auth resolution logic as the phone-OTP verify pages (checkPhone → getAuthMe →
// role check → fetch profile), just keyed off a Google identity instead of a phone number.
export function useGoogleSignIn(
	intent: "login" | "signup",
	app: AppKind,
	redirectTo?: string,
	// Skips the "wrong account state" error+redirect-away branches below — instead of bouncing
	// to an external /login or /signup page, silently does whichever of the two is actually
	// correct for this Google identity. Meant for embedded/modal sign-in (e.g. a shared link)
	// where navigating away would lose the page the user was on.
	options?: { seamless?: boolean },
) {
	const [loading, setLoading] = useState(false)
	const { signInWithGoogle, signOut } = useAuth()
	const setSession = useAuthSessionStore((s) => s.setSession)
	const setHostProfile = useHostStore((s) => s.setProfile)
	const setBrandProfile = useBrandStore((s) => s.setProfile)
	const router = useRouter()
	const base = app === "host" ? "/community" : `/${app}`
	const seamless = options?.seamless ?? false

	async function handleGoogleSignIn() {
		setLoading(true)
		try {
			const { email, displayName } = await signInWithGoogle()
			setSession({ intent, email: email ?? undefined, displayName: displayName ?? undefined, redirectTo })

			let me: Awaited<ReturnType<typeof getAuthMe>> | null = null
			try {
				me = await getAuthMe()
			} catch (err) {
				if (!(err instanceof ApiError && err.statusCode === 404)) throw err
			}

			const displayApp = app === "host" ? "community" : app

			if (me) {
				// One login can hold host, brand, and admin access at once — a different primary
				// `role` no longer means "wrong account", only the absence of this app's profile does.
				const hasAccess = app === "host" ? me.hasHostAccess : me.hasBrandAccess

				if (!hasAccess) {
					if (intent === "login" && !seamless) {
						await signOut()
						toast.error(`No ${displayApp} account found for this Google account yet. Please sign up.`)
						router.replace(`${base}/signup`)
						return
					}
					// Signing up (or seamless login with no existing account): this identity may already
					// exist as the other app/an admin but has no profile here yet — let them through to
					// onboarding to attach one.
					router.push(`${base}/onboarding`)
					return
				}

				if (intent === "signup" && !seamless) {
					await signOut()
					toast.error(`A ${displayApp} account already exists for this Google account. Please log in.`)
					router.replace(`${base}/login`)
					return
				}
				const profile = app === "host" ? await getHostProfile() : await getBrandProfile()
				if (app === "host") setHostProfile(profile as Awaited<ReturnType<typeof getHostProfile>>)
				else setBrandProfile(profile as Awaited<ReturnType<typeof getBrandProfile>>)
				// A custom redirectTo (e.g. back to a shared link) does a hard navigation — a client-side
				// router.push to a route the caller may already be sitting on can silently no-op, leaving
				// the pre-login UI (blur/gate) stuck until the user manually reloads.
				if (redirectTo) window.location.href = redirectTo
				else router.push(`${base}/dashboard`)
				return
			}

			if (intent === "login" && !seamless) {
				await signOut()
				toast.error(`No ${displayApp} account found for this Google account. Please sign up.`)
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
