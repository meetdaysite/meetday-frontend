import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

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
