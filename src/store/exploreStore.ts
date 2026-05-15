import { create } from "zustand"
import { getPublicEvents, getInterests, getCategories } from "@/lib/api"
import type { ExploreEvent } from "@/types/attendee"
import type { Interest, Category } from "@/lib/api"

const LIMIT = 20

export type DateRangeKey = "today" | "weekend" | "week" | "next-week" | ""
export type SortKey = "date-asc" | "date-desc" | "price-asc" | "price-desc"
export type PriceKey = "free" | "paid" | ""

export type ExploreFilters = {
	search: string
	city: string
	categoryId: string
	interestSlug: string
	price: PriceKey
	dateRange: DateRangeKey
	sort: SortKey
}

const DEFAULT_FILTERS: ExploreFilters = {
	search: "",
	city: "",
	categoryId: "",
	interestSlug: "",
	price: "",
	dateRange: "",
	sort: "date-asc",
}

function getDateBounds(key: DateRangeKey): { dateFrom?: string; dateTo?: string } {
	if (!key) return {}
	const now = new Date()
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

	switch (key) {
		case "today": {
			const end = new Date(today)
			end.setHours(23, 59, 59, 999)
			return { dateFrom: today.toISOString(), dateTo: end.toISOString() }
		}
		case "weekend": {
			const day = today.getDay()
			const daysToSat = day === 6 ? 0 : day === 0 ? 6 : 6 - day
			const sat = new Date(today)
			sat.setDate(today.getDate() + daysToSat)
			const sun = new Date(sat)
			sun.setDate(sat.getDate() + 1)
			sun.setHours(23, 59, 59, 999)
			return { dateFrom: sat.toISOString(), dateTo: sun.toISOString() }
		}
		case "week": {
			const day = today.getDay()
			const mon = new Date(today)
			mon.setDate(today.getDate() - (day === 0 ? 6 : day - 1))
			const sun = new Date(mon)
			sun.setDate(mon.getDate() + 6)
			sun.setHours(23, 59, 59, 999)
			return { dateFrom: mon.toISOString(), dateTo: sun.toISOString() }
		}
		case "next-week": {
			const day = today.getDay()
			const mon = new Date(today)
			mon.setDate(today.getDate() + (8 - (day === 0 ? 7 : day)))
			const sun = new Date(mon)
			sun.setDate(mon.getDate() + 6)
			sun.setHours(23, 59, 59, 999)
			return { dateFrom: mon.toISOString(), dateTo: sun.toISOString() }
		}
	}
}

function buildParams(filters: ExploreFilters, page: number) {
	const [sortBy, sortOrder] = filters.sort.split("-") as ["date" | "price", "asc" | "desc"]
	return {
		...(filters.search ? { search: filters.search } : {}),
		...(filters.city ? { city: filters.city } : {}),
		...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
		...(filters.interestSlug ? { interestSlugs: [filters.interestSlug] } : {}),
		...(filters.price === "free" ? { isFree: true } : filters.price === "paid" ? { isFree: false } : {}),
		...getDateBounds(filters.dateRange),
		sortBy,
		sortOrder,
		page,
		limit: LIMIT,
	}
}

type ExploreStore = {
	events: ExploreEvent[]
	total: number
	page: number
	loading: boolean
	loadingMore: boolean
	error: string | null
	filters: ExploreFilters
	interests: Interest[]
	categories: Category[]

	fetchEvents(): Promise<void>
	loadMore(): Promise<void>
	setFilter<K extends keyof ExploreFilters>(key: K, value: ExploreFilters[K]): void
	resetFilters(): void
	fetchInterests(): Promise<void>
	fetchCategories(): Promise<void>
}

export const useExploreStore = create<ExploreStore>((set, get) => ({
	events: [],
	total: 0,
	page: 1,
	loading: false,
	loadingMore: false,
	error: null,
	filters: { ...DEFAULT_FILTERS },
	interests: [],
	categories: [],

	setFilter(key, value) {
		set(state => ({ filters: { ...state.filters, [key]: value } }))
	},

	resetFilters() {
		set({ filters: { ...DEFAULT_FILTERS } })
	},

	async fetchEvents() {
		set({ loading: true, error: null })
		try {
			const result = await getPublicEvents(buildParams(get().filters, 1))
			set({ events: result.events, total: result.total, page: 1, loading: false })
		} catch {
			set({ loading: false, error: "Failed to load events." })
		}
	},

	async loadMore() {
		const { page, total, events, loadingMore, loading } = get()
		if (loadingMore || loading || events.length >= total) return
		const nextPage = page + 1
		set({ loadingMore: true })
		try {
			const result = await getPublicEvents(buildParams(get().filters, nextPage))
			set(state => ({
				events: [...state.events, ...result.events],
				total: result.total,
				page: nextPage,
				loadingMore: false,
			}))
		} catch {
			set({ loadingMore: false })
		}
	},

	async fetchInterests() {
		if (get().interests.length) return
		try {
			const interests = await getInterests()
			set({ interests })
		} catch { /* interests filter won't populate, non-critical */ }
	},

	async fetchCategories() {
		if (get().categories.length) return
		try {
			const categories = await getCategories()
			set({ categories })
		} catch { /* category filter won't populate, non-critical */ }
	},
}))
