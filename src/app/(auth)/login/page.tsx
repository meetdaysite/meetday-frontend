"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthShell } from "@/components/auth/AuthShell"
import { AuthTabs } from "@/components/auth/AuthTabs"
import { SocialSignIn } from "@/components/auth/SocialSignIn"
import { Button } from "@/components/ui/Button"
import { PhoneField } from "@/components/auth/PhoneField"
import { useAuth } from "@/context/AuthContext"
import { fetchUserDetails, UserNotFoundError } from "@/lib/api"
import { DEFAULT_COUNTRY, type Country } from "@/lib/countries"
import type { AuthSession } from "@/context/AuthContext"

export default function LoginPage() {
	const [phone, setPhone] = useState("")
	const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY)
	const [error, setError] = useState("")
	const [loading, setLoading] = useState(false)
	const { sendOtp, signInWithGoogle } = useAuth()
	const router = useRouter()

	async function handleSendOtp(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		if (!phone || phone.length < 10) return
		setError("")
		setLoading(true)
		try {
			await sendOtp(`${country.dialCode}${phone}`, "recaptcha-container")
			const session: AuthSession = { intent: "login", phone: `${country.dialCode}${phone}` }
			sessionStorage.setItem("authSession", JSON.stringify(session))
			router.push("/verify")
		} catch {
			setError("Failed to send OTP. Please check the number and try again.")
		} finally {
			setLoading(false)
		}
	}

	async function handleGoogleSignIn() {
		setError("")
		setLoading(true)
		try {
			const { idToken } = await signInWithGoogle()
			await fetchUserDetails(idToken)
			router.push("/dashboard")
		} catch (e) {
			if (e instanceof UserNotFoundError) {
				setError("Account not found. Please sign up.")
			} else {
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

				{error && <p className="text-caption text-text-danger">{error}</p>}

				<Button
					type="submit"
					variant="primary"
					size="md"
					radius="pill"
					className="w-full mt-1"
					disabled={phone.length < 10 || loading}
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
					New to meetday?{" "}
					<Link href="/signup" className="font-medium text-text-link hover:underline">
						Create an account
					</Link>
				</p>
			</form>
		</AuthShell>
	)
}
