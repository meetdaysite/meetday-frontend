import { create } from "zustand"
import { auth } from "@/lib/firebase"
import { showNotificationToast } from "@/components/ui/NotificationToast"
import { notificationSocket } from "@/lib/notificationSocket"
import {
	getNotifications,
	getUnreadCount,
	markNotificationRead,
	markAllNotificationsRead,
} from "@/lib/api"
import type { Notification } from "@/types/notification"

const PAGE_LIMIT = 20

type NotificationStore = {
	notifications: Notification[]
	unreadCount: number
	total: number
	page: number
	hasMore: boolean
	isLoading: boolean
	isConnected: boolean

	init: () => Promise<void>
	loadMore: () => Promise<void>
	markRead: (id: string) => Promise<void>
	markAllRead: () => Promise<void>
	refreshUnreadCount: () => Promise<void>
	reset: () => void
	_prepend: (notif: Notification) => void
}

let visibilityHandler: (() => void) | null = null
let pollInterval: NodeJS.Timeout | null = null

export const useNotificationStore = create<NotificationStore>((set, get) => ({
	notifications: [],
	unreadCount: 0,
	total: 0,
	page: 1,
	hasMore: false,
	isLoading: false,
	isConnected: false,

	init: async () => {
		// Only block duplicate in-flight inits, not reconnects after disconnect
		if (get().isLoading) return

		set({ isLoading: true })

		try {
			const res = await getNotifications({ page: 1, limit: PAGE_LIMIT })
			set({
				notifications: res.notifications,
				unreadCount: res.unreadCount,
				total: res.total,
				page: 1,
				hasMore: res.notifications.length < res.total,
				isLoading: false,
			})
		} catch {
			set({ isLoading: false })
		}

		// Connect WebSocket — isConnected is driven by actual socket events
		const token = await auth.currentUser?.getIdToken()
		console.log("[notif:init] uid:", auth.currentUser?.uid, "token?", !!token)
		if (!token) return

		notificationSocket.connect(token, {
			onConnect: () => { console.log("[notif:ws] connected"); set({ isConnected: true }) },
			onDisconnect: () => { console.log("[notif:ws] disconnected"); set({ isConnected: false }) },
			onNotification: (payload) => {
				console.log("[notif:ws] notification received", payload)
				get()._prepend({
					id: payload.id,
					type: payload.type,
					title: payload.title,
					body: payload.body,
					metadata: payload.metadata,
					isRead: false,
					createdAt: payload.createdAt,
				})
			},
		})

		// Refresh badge on tab focus (backend caches for 30s, safe to poll)
		if (visibilityHandler) {
			document.removeEventListener("visibilitychange", visibilityHandler)
		}
		visibilityHandler = () => {
			if (document.visibilityState === "visible") get().refreshUnreadCount()
		}
		document.addEventListener("visibilitychange", visibilityHandler)

		// Set up fallback polling interval for loading notifications automatically
		if (pollInterval) {
			clearInterval(pollInterval)
		}
		pollInterval = setInterval(async () => {
			try {
				const res = await getNotifications({ page: 1, limit: PAGE_LIMIT })
				// Merge or overwrite page 1
				set((s) => {
					// Merge local state with fresh data (preserving any read/unread mutations done in current session)
					const merged = [...res.notifications]
					// Filter out elements already handled
					return {
						notifications: merged,
						unreadCount: res.unreadCount,
						total: res.total,
						hasMore: merged.length < res.total,
					}
				})
			} catch {
				// silent fallback
			}
		}, 8000)
	},

	loadMore: async () => {
		const { isLoading, hasMore, page, notifications } = get()
		if (isLoading || !hasMore) return

		set({ isLoading: true })
		try {
			const nextPage = page + 1
			const res = await getNotifications({ page: nextPage, limit: PAGE_LIMIT })
			
			// Filter out any incoming notifications that are already in our local state to avoid duplicates
			const newNotifs = res.notifications.filter(
				(newN) => !notifications.some((existingN) => existingN.id === newN.id)
			)

			set({
				notifications: [...notifications, ...newNotifs],
				total: res.total,
				page: nextPage,
				hasMore: notifications.length + res.notifications.length < res.total,
				isLoading: false,
			})
		} catch {
			set({ isLoading: false })
		}
	},

	markRead: async (id) => {
		set((s) => ({
			notifications: s.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
			unreadCount: Math.max(0, s.unreadCount - 1),
		}))
		try {
			await markNotificationRead(id)
		} catch {
			set((s) => ({
				notifications: s.notifications.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
				unreadCount: s.unreadCount + 1,
			}))
		}
	},

	markAllRead: async () => {
		const prevNotifications = get().notifications
		const prevCount = get().unreadCount
		set((s) => ({
			notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
			unreadCount: 0,
		}))
		try {
			await markAllNotificationsRead()
		} catch {
			set({ notifications: prevNotifications, unreadCount: prevCount })
		}
	},

	refreshUnreadCount: async () => {
		try {
			const count = await getUnreadCount()
			set({ unreadCount: count })
		} catch {
			// Non-critical — badge stays stale
		}
	},

	_prepend: (notif) => {
		// Check if notification already exists by id to prevent duplicates (e.g. socket emitting twice, or concurrent loads)
		const exists = get().notifications.some((n) => n.id === notif.id)
		if (exists) return

		set((s) => ({
			notifications: [notif, ...s.notifications],
			unreadCount: s.unreadCount + 1,
			total: s.total + 1,
		}))
		showNotificationToast(notif)
	},

	reset: () => {
		notificationSocket.disconnect()
		if (visibilityHandler) {
			document.removeEventListener("visibilitychange", visibilityHandler)
			visibilityHandler = null
		}
		if (pollInterval) {
			clearInterval(pollInterval)
			pollInterval = null
		}
		set({
			notifications: [],
			unreadCount: 0,
			total: 0,
			page: 1,
			hasMore: false,
			isLoading: false,
			isConnected: false,
		})
	},
}))
