"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import { useAttendeeProfileStore } from "@/store/attendeeProfileStore"

export function AttendeeLayoutShell({ children }: { children: React.ReactNode }) {
	const { user, authLoading } = useAuthStore()
	const { profile, profileLoading } = useAttendeeProfileStore()
	const router = useRouter()

	useEffect(() => {
		if (authLoading || profileLoading) return
		if (!user || !profile) return
		// HOST accounts have attendeeProfile: null — redirect them to the host dashboard
		if (profile.attendeeProfile === null) {
			router.replace("/dashboard")
		}
	}, [user, authLoading, profile, profileLoading, router])

	return <>{children}</>
}
