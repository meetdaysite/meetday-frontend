"use client"

import Link from "next/link"
import { AuthShell } from "@/components/auth/AuthShell"
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton"
import { useGoogleSignIn } from "@/hooks/useGoogleSignIn"

export default function SpacesLoginPage() {
	const { loading: googleLoading, handleGoogleSignIn } = useGoogleSignIn("login", "spaces")

	return (
		<AuthShell size="small" phoneImage="/assets/phone_image_login.svg" pointsImage="/assets/points_login.svg">
			<Link 
				href="/spaces" 
				className="inline-flex items-center gap-1.5 text-xs font-bold text-black/50 hover:text-black transition-colors mb-4"
			>
				<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
				</svg>
				Back to hubs
			</Link>

			<div className="mb-6">
				<h1 className="font-heading text-3xl font-black text-black mb-1">
					Hub Partner Login
				</h1>
				<p className="text-body-sm text-text-secondary mt-2">
					Welcome back! Sign in with Google to manage your venue hubs.
				</p>
			</div>

			<div className="mt-5">
				<GoogleSignInButton onClick={handleGoogleSignIn} loading={googleLoading} />
			</div>

			<p className="text-center text-body-sm text-text-secondary mt-6">
				New to Hubs?{" "}
				<Link href="/spaces/signup" className="font-semibold text-text-link hover:underline">
					Create an account
				</Link>
			</p>

			{/* Bottom Section: Indicator Dots */}
			<div className="flex gap-2 justify-center items-center mt-8 mb-2">
				<span className="w-2 h-2 bg-black/15 rounded-full" />
				<span className="w-5 h-2 bg-[#EE2C2C] rounded-full transition-all" />
				<span className="w-2 h-2 bg-black/15 rounded-full" />
				<span className="w-2 h-2 bg-black/15 rounded-full" />
			</div>
		</AuthShell>
	)
}
