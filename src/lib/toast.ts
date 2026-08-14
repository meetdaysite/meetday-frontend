import { toast as sonnerToast } from "sonner"
import { useToastStore } from "@/store/toastStore"

export const toast = {
	success: (msg: string) => {
		sonnerToast.success(msg)
		useToastStore.getState().addToast(msg, undefined, "success")
	},
	info: (msg: string) => {
		sonnerToast.info(msg)
		useToastStore.getState().addToast(msg, undefined, "info")
	},
	error: (msg: string) => {
		sonnerToast.error(msg)
		useToastStore.getState().addToast(msg, undefined, "error")
	}
}
