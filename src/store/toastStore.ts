import { create } from "zustand"

export interface TransientToast {
	id: string
	title: string
	desc?: string
	type: "success" | "info" | "error"
}

interface ToastStore {
	toasts: TransientToast[]
	addToast: (title: string, desc?: string, type?: "success" | "info" | "error") => void
	removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
	toasts: [],
	addToast: (title, desc, type = "success") => {
		const id = Math.random().toString(36).substring(7)
		set((state) => ({
			toasts: [...state.toasts, { id, title, desc, type }],
		}))
		// Auto-remove after 4 seconds (come and go notification)
		setTimeout(() => {
			set((state) => ({
				toasts: state.toasts.filter((t) => t.id !== id),
			}))
		}, 4000)
	},
	removeToast: (id) =>
		set((state) => ({
			toasts: state.toasts.filter((t) => t.id !== id),
		})),
}))
