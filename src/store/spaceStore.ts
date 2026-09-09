import { create } from "zustand"
import type { SpaceProfile } from "@/lib/api"

type SpaceStore = {
	profile: SpaceProfile | null
	setProfile: (profile: SpaceProfile) => void
	clearProfile: () => void
}

export const useSpaceStore = create<SpaceStore>((set) => ({
	profile: null,
	setProfile: (profile) => set({ profile }),
	clearProfile: () => set({ profile: null }),
}))
