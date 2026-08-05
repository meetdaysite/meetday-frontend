"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useAuthStore } from "@/store/authStore"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	const router = useRouter()
	const pathname = usePathname()
	const user = useAuthStore((s) => s.user)
	const authLoading = useAuthStore((s) => s.authLoading)
	// The verify page briefly has a signed-in Firebase user before it's confirmed
	// whether that account/intent is actually valid (checkPhone can still sign the
	// user back out). Don't race that logic with an auto-redirect to dashboard here —
	// let the verify page own its own destination.
	const isVerifyPage = pathname?.endsWith("/verify") ?? false

	useEffect(() => {
		if (isVerifyPage) return
		if (!authLoading && user) router.replace("/host/dashboard")
	}, [authLoading, user, isVerifyPage, router])

	return (
		<div className="relative min-h-screen bg-[#EE2C2C] flex flex-col font-sans selection:bg-white selection:text-[#EE2C2C]">
			<main className="relative flex flex-1 w-full max-w-screen-2xl mx-auto z-10">
				{authLoading || (user && !isVerifyPage) ? (
					<div className="flex flex-1 items-center justify-center">
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden className="animate-spin text-white">
							<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
							<path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
						</svg>
					</div>
				) : (
					children
				)}
			</main>
		</div>
	)
}
