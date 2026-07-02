"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"

export default function RootPage() {
	const router = useRouter()
	const user = useAuthStore((s) => s.user)
	const authLoading = useAuthStore((s) => s.authLoading)

	useEffect(() => {
		if (authLoading) return
		router.replace(user ? "/host/dashboard" : "/host/login")
	}, [authLoading, user, router])

	return (
		<div className="flex flex-1 items-center justify-center">
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden className="animate-spin text-text-muted">
				<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
				<path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
			</svg>
		</div>
	)
}
