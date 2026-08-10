import { toast as sonnerToast } from "sonner"
import { useToastStore } from "@/store/toastStore"

export const toast = {
	success: (msg: string) => {
		useToastStore.getState().addToast(msg, undefined, "success")
	},
	info: (msg: string) => {
		useToastStore.getState().addToast(msg, undefined, "info")
	},
	error: (msg: string) => {
		sonnerToast.error(msg)
	}
}
