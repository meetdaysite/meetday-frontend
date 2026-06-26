import { io, type Socket } from "socket.io-client"
import { auth } from "@/lib/firebase"

export type NotificationPayload = {
	id: string
	type: string
	title: string
	body: string
	metadata: Record<string, unknown>
	createdAt: string
}

type SocketCallbacks = {
	onNotification: (payload: NotificationPayload) => void
	onConnect: () => void
	onDisconnect: () => void
}

let socket: Socket | null = null

function getOrigin(): string {
	const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? ""
	return baseUrl.replace(/\/api(\/v\d+)?$/, "")
}

export const notificationSocket = {
	connect(initialToken: string, callbacks: SocketCallbacks) {
		if (socket) {
			socket.removeAllListeners()
			socket.disconnect()
			socket = null
		}

		socket = io(`${getOrigin()}/notifications`, {
			auth: { token: initialToken },
			transports: ["polling", "websocket"],
		})

		socket.on("connect", () => callbacks.onConnect())

		socket.on("notification", (payload: NotificationPayload) => {
			callbacks.onNotification(payload)
		})

		socket.on("disconnect", async (reason) => {
			callbacks.onDisconnect()
			if (reason === "io server disconnect" || reason === "transport close") {
				const freshToken = await auth.currentUser?.getIdToken(true)
				if (!freshToken) return
				socket!.auth = { token: freshToken }
				socket!.connect()
			}
		})

		socket.on("connect_error", () => {
			callbacks.onDisconnect()
		})
	},

	disconnect() {
		if (socket) {
			socket.removeAllListeners()
			socket.disconnect()
			socket = null
		}
	},

	isConnected() {
		return socket?.connected ?? false
	},
}
