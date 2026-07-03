export interface CreateOrderItem {
	ticketId: string
	quantity: number
	groupAttendees: { fullName: string; email: string }[]
}

export interface CreateOrderPayload {
	eventId: string
	items: CreateOrderItem[]
	couponCode?: string
}

export type OrderStatus = "PENDING_PAYMENT" | "CONFIRMED" | "PARTIALLY_REFUNDED" | "CANCELLED" | "REFUNDED"

export interface CancelTicketsResult {
	message: string
	refundId: string
	refundAmountPaise: number
}

export interface OrderItemDetail {
	ticketId: string
	ticketName: string
	quantity: number
	unitPrice: number
	subtotal: number
	qrCodes?: string[]
	groupAttendees: { fullName: string; email: string }[]
}

export interface OrderDetail {
	id: string
	status: OrderStatus
	eventId: string
	items: OrderItemDetail[]
	totalAmount: string | number
	platformFee: number
	tax: number
	couponCode?: string
	couponDiscount?: number
	bookingRef?: string
	createdAt: string
	paymentMethod?: string
	amountPaid?: number
}

// ─── My orders list (GET /api/v1/orders/me) ───────────────────────────────

export interface MyOrderListItem {
	id: string
	status: OrderStatus
	subtotal: string
	platformFee: string
	taxAmount: string
	discountAmount: string
	totalAmount: string
	confirmedAt: string | null
	cancelledAt: string | null
	createdAt: string
	event: {
		id: string
		title: string
		eventDate: string
		startTime: string
		venueName: string
		city: string
	}
	items: Array<{
		id: string
		quantity: number
		// Not present on every /orders/me response (confirmed absent on CONFIRMED orders
		// with no cancellations) — only reliably populated once a partial cancellation
		// has happened. Treat as absent-means-zero, never assume it's always sent.
		cancelledCount?: number
		unitPrice: string
		ticket: { id: string; name: string }
		_count: { attendees: number }
	}>
}

export interface MyOrdersResponse {
	orders: MyOrderListItem[]
	total: number
	page: number
	limit: number
}

// ─── Full order detail (GET /api/v1/orders/:id) ────────────────────────────

export interface OrderAttendee {
	id: string
	orderItemId: string
	fullName: string
	email: string
	isLead: boolean
	ticketCode: string
	checkedInAt: string | null
	cancelledAt: string | null
}

export interface OrderItemFull {
	id: string
	orderId: string
	ticketId: string
	quantity: number
	cancelledCount?: number
	unitPrice: string
	ticket: {
		id: string
		name: string
		description?: string
	}
	attendees: OrderAttendee[]
}

export interface OrderEventSummary {
	id: string
	title: string
	eventDate: string
	startTime: string
	endTime: string
	venueName: string
	fullAddress: string
	city: string
}

export interface FullOrderDetail {
	id: string
	bookingId: string
	userId: string
	eventId: string
	status: OrderStatus
	subtotal: string
	platformFee: string
	taxAmount: string
	totalAmount: string
	couponId: string | null
	discountAmount: string
	confirmedAt: string | null
	cancelledAt: string | null
	cancellationReason: string | null
	createdAt: string
	updatedAt: string
	event: OrderEventSummary
	coupon: null
	items: OrderItemFull[]
}
