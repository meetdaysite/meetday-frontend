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

// Guards against out-of-order responses: if the signed-in user changes while a
// fetch is in flight (e.g. re-login as a different user), an older, slower
// request could otherwise resolve later and overwrite the newer, correct profile.
let fetchToken = 0

export const useAttendeeProfileStore = create<AttendeeProfileStore>((set) => ({
	profile: null,
	profileLoading: false,
	showWelcomeModal: false,

	fetchProfile: async () => {
		const token = ++fetchToken
		set({ profileLoading: true })
		try {
			const profile = await getAuthMe()
			if (token !== fetchToken) return
			set({ profile, profileLoading: false })
		} catch {
			if (token !== fetchToken) return
			set({ profile: null, profileLoading: false })
		}
	},

	clearProfile: () => {
		fetchToken++
		set({ profile: null })
	},

	setShowWelcomeModal: (showWelcomeModal) => set({ showWelcomeModal }),
}))
