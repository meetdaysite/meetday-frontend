import { create } from "zustand"
import { getHostDashboard } from "@/lib/api"
import type { DashboardData, DashboardPeriod } from "@/types/dashboard"

type DashboardStore = {
	data: DashboardData | null
	period: DashboardPeriod
	isLoading: boolean
	error: string | null
	fetchDashboard: (period?: DashboardPeriod) => Promise<void>
	setPeriod: (period: DashboardPeriod) => void
	reset: () => void
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
	data: null,
	period: "THIS_MONTH",
	isLoading: false,
	error: null,

	fetchDashboard: async (period) => {
		const p = period ?? get().period
		set({ isLoading: true, error: null })
		try {
			const data = await getHostDashboard(p)
			set({ data, period: p, isLoading: false })
		} catch (err) {
			set({
				isLoading: false,
				error: err instanceof Error ? err.message : "Failed to load dashboard",
			})
		}
	},

	setPeriod: (period) => {
		set({ period })
		get().fetchDashboard(period)
	},

	reset: () => set({ data: null, period: "THIS_MONTH", isLoading: false, error: null }),
}))
