"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useAuthStore } from "@/store/authStore"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	const router = useRouter()
	const user = useAuthStore((s) => s.user)
	const authLoading = useAuthStore((s) => s.authLoading)

	useEffect(() => {
		if (!authLoading && user) router.replace("/dashboard")
	}, [authLoading, user, router])

	return (
		<div className="relative min-h-screen flex flex-col">
			<Image
				src="/assets/auth_bg.svg"
				alt=""
				fill
				className="object-cover object-center opacity-40 pointer-events-none select-none"
				priority
				aria-hidden
			/>

			<header className="relative w-full shrink-0 bg-surface-page z-10">
				<div className="flex h-16 items-center max-w-screen-2xl mx-auto px-6 lg:px-10">
					<Link href="/" className="inline-flex items-center">
						<Image src="/assets/brand_logo.svg" alt="Meetday" width={120} height={32} priority />
					</Link>
				</div>
			</header>

			<main className="relative flex flex-1 w-full max-w-screen-2xl mx-auto">
				{authLoading || user ? (
					<div className="flex flex-1 items-center justify-center">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden className="animate-spin text-text-muted">
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
