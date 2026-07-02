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
	// Resolves once any in-flight fetch settles (immediately if none is in flight).
	// Lets non-reactive callers (e.g. a .catch() outside React) read `profile` without
	// racing an in-progress request for the current user.
	waitUntilLoaded: () => Promise<void>
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
		set({ profile: null, profileLoading: false })
	},

	setShowWelcomeModal: (showWelcomeModal) => set({ showWelcomeModal }),

	waitUntilLoaded: () => {
		if (!useAttendeeProfileStore.getState().profileLoading) return Promise.resolve()
		return new Promise<void>((resolve) => {
			const unsub = useAttendeeProfileStore.subscribe((state) => {
				if (!state.profileLoading) {
					unsub()
					resolve()
				}
			})
		})
	},
}))
