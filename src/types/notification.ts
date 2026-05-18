export type NotificationType =
	| "event_approved"
	| "event_rejected"
	| "event_under_review"
	| "event_review_requested"
	| "event_cancelled"
	| "booking_confirmed"
	| "booking_cancelled"
	| "subscription_upgraded"
	| "subscription_expiring"
	| (string & {}) // extensible for future types (BRANDS etc.)

export type Notification = {
	id: string
	type: NotificationType
	title: string
	body: string
	metadata: Record<string, unknown>
	isRead: boolean
	createdAt: string
}

export type NotificationsResponse = {
	notifications: Notification[]
	total: number
	page: number
	limit: number
	unreadCount: number
}

export type NotificationsParams = {
	page?: number
	limit?: number
	isRead?: boolean
}
