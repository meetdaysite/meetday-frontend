import axios from "axios"
import { useAuthStore } from "@/store/authStore"

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

export default apiClient
