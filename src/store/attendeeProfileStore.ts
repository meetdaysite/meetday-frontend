"use client"

import { create } from "zustand"
import type { AuthMeData } from "@/lib/api"
import { getAuthMe } from "@/lib/api"

type AttendeeProfileStore = {
	profile: AuthMeData | null
	profileLoading: boolean
	showWelcomeModal: boolean
	fetchProfile: () => Promise<void>
	clearProfile: () => void
	setShowWelcomeModal: (v: boolean) => void
}

export const useAttendeeProfileStore = create<AttendeeProfileStore>((set) => ({
	profile: null,
	profileLoading: false,
	showWelcomeModal: false,

	fetchProfile: async () => {
		set({ profileLoading: true })
		try {
			const profile = await getAuthMe()
			set({ profile, profileLoading: false })
		} catch {
			set({ profile: null, profileLoading: false })
		}
	},

	clearProfile: () => set({ profile: null }),

	setShowWelcomeModal: (showWelcomeModal) => set({ showWelcomeModal }),
}))
