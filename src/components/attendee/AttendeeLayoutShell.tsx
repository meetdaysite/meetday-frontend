"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import { useAttendeeProfileStore } from "@/store/attendeeProfileStore"

export function AttendeeLayoutShell({ children }: { children: React.ReactNode }) {
	const { user, authLoading } = useAuthStore()
	const { profile, profileLoading } = useAttendeeProfileStore()
	const router = useRouter()

	// HOST accounts have attendeeProfile: null — redirect them to the host dashboard
	const isHostAccount = !authLoading && !profileLoading && !!user && !!profile && profile.attendeeProfile === null

	useEffect(() => {
		if (isHostAccount) router.replace("/host/dashboard")
	}, [isHostAccount, router])

	// Don't flash attendee content for an account we already know is host-typed
	// while the redirect above is in flight.
	if (isHostAccount) return null

	return <>{children}</>
}
