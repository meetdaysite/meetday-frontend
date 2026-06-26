import axios from "axios"
import { useAuthStore } from "@/store/authStore"
import { ApiError } from "./errors"

const apiClient = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
	headers: { "Content-Type": "application/json" },
})

apiClient.interceptors.request.use(async (config) => {
	const user = useAuthStore.getState().user
	if (user) {
		const token = await user.getIdToken()
		config.headers.Authorization = `Bearer ${token}`
	}
	return config
})

apiClient.interceptors.response.use(
	(response) => response,
	(error) => {
		const status: number = error.response?.status ?? 0
		const body = error.response?.data

		let message: string
		if (body?.message) {
			message = Array.isArray(body.message) ? String(body.message[0]) : String(body.message)
		} else if (body?.error) {
			message = String(body.error)
		} else if (error.response?.statusText) {
			message = error.response.statusText
		} else {
			message = error.message ?? "Something went wrong. Please try again."
		}

		throw new ApiError(message, status, body)
	},
)

export default apiClient
