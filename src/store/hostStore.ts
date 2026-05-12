import { create } from "zustand"
import type { HostProfile } from "@/lib/api"

type HostStore = {
	profile: HostProfile | null
	setProfile: (profile: HostProfile) => void
	clearProfile: () => void
}

export const useHostStore = create<HostStore>((set) => ({
	profile: null,
	setProfile: (profile) => set({ profile }),
	clearProfile: () => set({ profile: null }),
}))
