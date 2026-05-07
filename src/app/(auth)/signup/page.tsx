"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthShell } from "@/components/auth/AuthShell"
import { AuthTabs } from "@/components/auth/AuthTabs"
import { SocialSignIn } from "@/components/auth/SocialSignIn"
import { Button } from "@/components/ui/Button"
import { Checkbox } from "@/components/ui/Checkbox"
import { PhoneField } from "@/components/auth/PhoneField"
import { useAuth } from "@/context/AuthContext"
import { fetchUserDetails, UserNotFoundError } from "@/lib/api"
import { DEFAULT_COUNTRY, type Country } from "@/lib/countries"
import type { AuthSession } from "@/context/AuthContext"

export default function SignupPage() {
	const [phone, setPhone] = useState("")
	const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY)
	const [agreed, setAgreed] = useState(false)
	const [error, setError] = useState("")
	const [loading, setLoading] = useState(false)
	const { sendOtp, signInWithGoogle } = useAuth()
	const router = useRouter()

	async function handleSendOtp(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		if (!phone || phone.length < 10 || !agreed) return
		setError("")
		setLoading(true)
		try {
			await sendOtp(`${country.dialCode}${phone}`, "recaptcha-container")
			const session: AuthSession = { intent: "signup", phone: `${country.dialCode}${phone}` }
			sessionStorage.setItem("authSession", JSON.stringify(session))
			router.push("/verify")
		} catch {
			setError("Failed to send OTP. Please check the number and try again.")
		} finally {
			setLoading(false)
		}
	}

	async function handleGoogleSignIn() {
		if (!agreed) {
			setError("Please agree to the Terms of Service and Privacy Policy.")
			return
		}
		setError("")
		setLoading(true)
		try {
			const { idToken, email, displayName } = await signInWithGoogle()
			try {
				await fetchUserDetails(idToken)
				// User already exists
				setError("Account already exists. Please log in.")
			} catch (e) {
				if (e instanceof UserNotFoundError) {
					const session: AuthSession = { intent: "signup", email: email ?? undefined, displayName: displayName ?? undefined }
					sessionStorage.setItem("authSession", JSON.stringify(session))
					router.push("/onboarding")
				} else {
					throw e
				}
			}
		} catch (e) {
			if (!(e instanceof UserNotFoundError)) {
				setError("Google sign-in failed. Please try again.")
			}
		} finally {
			setLoading(false)
		}
	}

	return (
		<AuthShell phoneImage="/assets/phone_image_login.svg" pointsImage="/assets/points_login.svg">
			<div id="recaptcha-container" />
			<AuthTabs />

			<div className="mb-6">
				<h1 className="text-heading-sm text-text-primary mb-1">
					Start hosting on <span className="text-text-brand">meetday</span>
				</h1>
				<p className="text-body-sm text-text-secondary">
					Create events, grow your community, and build a host presence people trust
				</p>
			</div>

			<form className="flex flex-col gap-4" onSubmit={handleSendOtp}>
				<PhoneField
					label="Phone number"
					value={phone}
					onChange={setPhone}
					country={country}
					onCountryChange={setCountry}
					disabled={loading}
				/>

				<label className="flex items-start gap-2.5 cursor-pointer">
					<Checkbox checked={agreed} onChange={setAgreed} size="sm" />
					<span className="text-body-sm text-text-secondary leading-snug">
						I agree to the{" "}
						<Link href="/terms" className="font-medium text-text-link hover:underline">
							Terms of service
						</Link>{" "}
						and{" "}
						<Link href="/privacy" className="font-medium text-text-link hover:underline">
							Privacy Policy
						</Link>
					</span>
				</label>

				{error && <p className="text-caption text-text-danger">{error}</p>}

				<Button
					type="submit"
					variant="primary"
					size="md"
					radius="pill"
					className="w-full mt-1"
					disabled={phone.length < 10 || !agreed || loading}
				>
					Send OTP
				</Button>

				<div className="flex items-center gap-3 my-1">
					<div className="flex-1 h-px bg-border-default" />
					<span className="text-caption text-text-muted">or</span>
					<div className="flex-1 h-px bg-border-default" />
				</div>

				<SocialSignIn layout="stacked" onGoogleSignIn={handleGoogleSignIn} disabled={loading} />

				<p className="text-center text-body-sm text-text-secondary mt-1">
					Already have an account?{" "}
					<Link href="/login" className="font-medium text-text-link hover:underline">
						Log in
					</Link>
				</p>
			</form>
		</AuthShell>
	)
}
