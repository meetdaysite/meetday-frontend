"use client"

import { useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useAuthStore } from "@/store/authStore"
import { useAttendeeProfileStore } from "@/store/attendeeProfileStore"

export { useAuthStore as useAuth } from "@/store/authStore"

export function AuthProvider({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		return onAuthStateChanged(auth, (u) => {
			useAuthStore.getState().setUser(u)
			useAuthStore.getState().setAuthLoading(false)
			if (u) {
				useAttendeeProfileStore.getState().fetchProfile()
			} else {
				useAttendeeProfileStore.getState().clearProfile()
			}
		})
	}, [])

	return <>{children}</>
}
