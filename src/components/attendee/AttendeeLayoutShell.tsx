"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAccountRole } from "@/context/AuthContext"

export function AttendeeLayoutShell({ children }: { children: React.ReactNode }) {
	const { role } = useAccountRole()
	const isHostAccount = role === "host"
	const router = useRouter()

	useEffect(() => {
		if (isHostAccount) router.replace("/host/dashboard")
	}, [isHostAccount, router])

	// Don't flash attendee content for an account we already know is host-typed
	// while the redirect above is in flight.
	if (isHostAccount) return null

	return <>{children}</>
}
