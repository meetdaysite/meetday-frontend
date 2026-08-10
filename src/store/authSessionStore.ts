import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { useEffect, useState } from "react"

type AuthSession = {
	intent: "login" | "signup" | null
	phone?: string
	email?: string
	displayName?: string
}

type AuthSessionStore = AuthSession & {
	setSession: (session: Omit<AuthSession, "intent"> & { intent: "login" | "signup" }) => void
	clearSession: () => void
}

export const useAuthSessionStore = create<AuthSessionStore>()(
	persist(
		(set) => ({
			intent: null,
			phone: undefined,
			email: undefined,
			displayName: undefined,
			setSession: (session) => set(session),
			clearSession: () => set({ intent: null, phone: undefined, email: undefined, displayName: undefined }),
		}),
		{
			name: "auth-session",
			storage: createJSONStorage(() => sessionStorage),
		},
	),
)

// The store hydrates from sessionStorage asynchronously after first mount — reading
// phone/email before hydration finishes can read stale (empty) defaults and incorrectly
// bounce an in-progress signup/login flow. `hasHydrated()` alone is not reliable here (it can
// report true a tick before the actual data is merged in) — force a fresh rehydrate() and wait
// for its promise instead, guaranteeing the read is up to date.
export function useAuthSessionHydrated(): boolean {
	const [hydrated, setHydrated] = useState(false)

	useEffect(() => {
		let cancelled = false
		Promise.resolve(useAuthSessionStore.persist.rehydrate()).then(() => {
			if (!cancelled) setHydrated(true)
		})
		return () => {
			cancelled = true
		}
	}, [])

	return hydrated
}
