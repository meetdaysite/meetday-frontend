"use client"

import Link from "next/link"
import { AuthShell } from "@/components/auth/AuthShell"
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton"
import { useGoogleSignIn } from "@/hooks/useGoogleSignIn"

export default function SpaceSignupPage() {
	const { loading: googleLoading, handleGoogleSignIn } = useGoogleSignIn("signup", "space")

	return (
		<AuthShell size="small" phoneImage="/assets/phone_image_login.svg" pointsImage="/assets/points_login.svg">
			<Link
				href="/"
				className="inline-flex items-center gap-1.5 text-xs font-bold text-black/50 hover:text-black transition-colors mb-4"
			>
				<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
				</svg>
				Back to welcome
			</Link>

			<div className="mb-6">
				<h1 className="font-heading text-3xl font-black text-black">Create Account</h1>
				<p className="text-body-sm text-text-secondary mt-2">
					List your venue or space — sign up with Google to get started!
				</p>
			</div>

			<div className="mt-5">
				<GoogleSignInButton onClick={handleGoogleSignIn} loading={googleLoading} />
			</div>

			<p className="text-center text-body-sm text-text-secondary mt-4">
				Already have an account?{" "}
				<Link href="/space/login" className="font-semibold text-text-link hover:underline">
					Log in
				</Link>
			</p>
		</AuthShell>
	)
}
