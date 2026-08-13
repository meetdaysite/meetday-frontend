import { create } from "zustand"
import type { BrandProfile } from "@/lib/api"

type BrandStore = {
	profile: BrandProfile | null
	setProfile: (profile: BrandProfile) => void
	clearProfile: () => void
}

export const useBrandStore = create<BrandStore>((set) => ({
	profile: null,
	setProfile: (profile) => set({ profile }),
	clearProfile: () => set({ profile: null }),
}))
