import { toast as sonnerToast } from "sonner"
import { useToastStore } from "@/store/toastStore"

export const toast = {
	success: (msg: string, desc?: string) => {
		sonnerToast.success(msg, desc ? { description: desc } : undefined)
		useToastStore.getState().addToast(msg, desc, "success")
	},
	info: (msg: string, desc?: string) => {
		sonnerToast.info(msg, desc ? { description: desc } : undefined)
		useToastStore.getState().addToast(msg, desc, "info")
	},
	warning: (msg: string, desc?: string) => {
		sonnerToast.warning(msg, desc ? { description: desc } : undefined)
		useToastStore.getState().addToast(msg, desc, "info")
	},
	error: (msg: string, desc?: string) => {
		sonnerToast.error(msg, desc ? { description: desc } : undefined)
		useToastStore.getState().addToast(msg, desc, "error")
	},
}

