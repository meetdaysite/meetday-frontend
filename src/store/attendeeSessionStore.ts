import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

type AttendeeSession = {
	intent: "login" | "signup" | null
	phone?: string
	firstName?: string
	lastName?: string
	email?: string
}

type AttendeeSessionStore = AttendeeSession & {
	setSession: (session: Omit<AttendeeSession, "intent"> & { intent: "login" | "signup" }) => void
	clearSession: () => void
}

export const useAttendeeSessionStore = create<AttendeeSessionStore>()(
	persist(
		(set) => ({
			intent: null,
			phone: undefined,
			firstName: undefined,
			lastName: undefined,
			email: undefined,
			setSession: (session) => set(session),
			clearSession: () =>
				set({ intent: null, phone: undefined, firstName: undefined, lastName: undefined, email: undefined }),
		}),
		{
			name: "attendee-session",
			storage: createJSONStorage(() => sessionStorage),
		},
	),
)
