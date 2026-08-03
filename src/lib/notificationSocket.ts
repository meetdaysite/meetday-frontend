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
			socket.io.off("reconnect_attempt")
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
			// "io server disconnect" is the one reason Socket.IO won't auto-reconnect for —
			// everything else is retried automatically, with the token refreshed per attempt below.
			if (reason === "io server disconnect") {
				try {
					const freshToken = await auth.currentUser?.getIdToken(true)
					if (!freshToken) return
					socket!.auth = { token: freshToken }
					socket!.connect()
				} catch {
					/* ignore token refresh error when offline */
				}
			}
		})

		socket.io.on("reconnect_attempt", async () => {
			try {
				const freshToken = await auth.currentUser?.getIdToken(true)
				if (freshToken && socket) socket.auth = { token: freshToken }
			} catch {
				/* ignore token refresh error when offline */
			}
		})

		socket.on("connect_error", () => {
			callbacks.onDisconnect()
		})
	},

	disconnect() {
		if (socket) {
			socket.removeAllListeners()
			socket.io.off("reconnect_attempt")
			socket.disconnect()
			socket = null
		}
	},

	isConnected() {
		return socket?.connected ?? false
	},
}
