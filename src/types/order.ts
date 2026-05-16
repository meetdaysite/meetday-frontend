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

export type OrderStatus = "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED"

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
	totalAmount: number
	platformFee: number
	tax: number
	couponCode?: string
	couponDiscount?: number
	bookingRef?: string
	createdAt: string
	paymentMethod?: string
	amountPaid?: number
}
