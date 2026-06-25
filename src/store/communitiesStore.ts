import { create } from "zustand"
import { getPublicCommunities, getCategories } from "@/lib/api"
import type { PublicCommunity, Category } from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"

const LIMIT = 12

type CommunitiesFilters = {
	search: string
	city: string
	categoryId: string
}

const DEFAULT_FILTERS: CommunitiesFilters = {
	search: "",
	city: "",
	categoryId: "",
}

type CommunitiesStore = {
	communities: PublicCommunity[]
	total: number
	page: number
	loading: boolean
	loadingMore: boolean
	error: string | null
	filters: CommunitiesFilters
	categories: Category[]

	fetchCommunities: () => Promise<void>
	loadMore: () => Promise<void>
	setFilter: <K extends keyof CommunitiesFilters>(key: K, value: CommunitiesFilters[K]) => void
	resetFilters: () => void
	fetchCategories: () => Promise<void>
}

export const useCommunitiesStore = create<CommunitiesStore>((set, get) => ({
	communities: [],
	total: 0,
	page: 1,
	loading: false,
	loadingMore: false,
	error: null,
	filters: { ...DEFAULT_FILTERS },
	categories: [],

	async fetchCommunities() {
		const { filters } = get()
		set({ loading: true, error: null, page: 1 })
		try {
			const res = await getPublicCommunities({
				search: filters.search || undefined,
				city: filters.city || undefined,
				categoryId: filters.categoryId || undefined,
				page: 1,
				limit: LIMIT,
			})
			set({ communities: res.data, total: res.total, page: 1, loading: false })
		} catch (err) {
			set({ error: getApiErrorMessage(err), loading: false })
		}
	},

	async loadMore() {
		const { filters, page, communities } = get()
		const nextPage = page + 1
		set({ loadingMore: true })
		try {
			const res = await getPublicCommunities({
				search: filters.search || undefined,
				city: filters.city || undefined,
				categoryId: filters.categoryId || undefined,
				page: nextPage,
				limit: LIMIT,
			})
			set({ communities: [...communities, ...res.data], total: res.total, page: nextPage, loadingMore: false })
		} catch {
			set({ loadingMore: false })
		}
	},

	setFilter(key, value) {
		set(s => ({ filters: { ...s.filters, [key]: value } }))
	},

	resetFilters() {
		set({ filters: { ...DEFAULT_FILTERS } })
	},

	async fetchCategories() {
		if (get().categories.length > 0) return
		try {
			const cats = await getCategories()
			set({ categories: cats })
		} catch {
			// silently ignore — categories are optional for filtering
		}
	},
}))
