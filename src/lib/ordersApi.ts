import apiClient from "./axios"
import type { CancelTicketsResult, CreateOrderPayload, FullOrderDetail, MyOrderListItem, MyOrdersResponse, OrderDetail } from "@/types/order"

export interface ValidateCouponPayload {
	eventId: string
	couponCode: string
	items: { ticketId: string; quantity: number }[]
}

export interface ValidateCouponResult {
	valid: boolean
	couponCode: string
	discountType: "PERCENTAGE" | "FLAT"
	discountValue: number
	subtotal: number
	discountAmount: number
	netSubtotal: number
}

export async function validateCoupon(payload: ValidateCouponPayload): Promise<ValidateCouponResult> {
	const { data } = await apiClient.post<{ success: boolean; data: ValidateCouponResult }>(
		"/orders/validate-coupon",
		payload,
	)
	return data.data
}

export interface PricingConfig {
	platformFeeRate: number
	gstRate: number
	platformFeeWaived: boolean
	hostFeePromoApplied: boolean
}

export async function getPricingConfig(eventId: string): Promise<PricingConfig> {
	const { data } = await apiClient.get<{ success: boolean; data: PricingConfig }>(`/events/${eventId}/pricing-config`)
	return data.data
}

export async function confirmFreeOrder(orderId: string): Promise<void> {
	await apiClient.post(`/orders/${orderId}/confirm-free`)
}

export async function createOrder(payload: CreateOrderPayload): Promise<OrderDetail> {
	const { data } = await apiClient.post<{ success: boolean; data: OrderDetail }>("/orders", payload)
	return data.data
}

export async function mockConfirmOrder(orderId: string): Promise<void> {
	await apiClient.post(`/orders/${orderId}/mock-confirm`)
}

export interface InitiatePaymentResponse {
	razorpayOrderId: string
	amount: number
	currency: string
	keyId: string
}

export async function initiatePayment(orderId: string): Promise<InitiatePaymentResponse> {
	const { data } = await apiClient.post<{ success: boolean; data: InitiatePaymentResponse }>("/payments/initiate", { orderId })
	return data.data
}

export interface VerifyPaymentPayload {
	razorpayOrderId: string
	razorpayPaymentId: string
	razorpaySignature: string
	internalOrderId: string
}

export async function verifyPayment(payload: VerifyPaymentPayload): Promise<void> {
	await apiClient.post("/payments/verify", payload)
}

export async function getOrderDetail(orderId: string): Promise<OrderDetail> {
	const { data } = await apiClient.get<{ success: boolean; data: OrderDetail }>(`/orders/${orderId}`)
	return data.data
}

export async function cancelOrder(orderId: string): Promise<CancelTicketsResult> {
	const { data } = await apiClient.post<{ success: boolean; data: CancelTicketsResult }>(`/orders/${orderId}/cancel`)
	return data.data
}

export interface CancelTicketsPayload {
	items: { orderItemId: string; quantity: number; attendeeIds: string[] }[]
}

export async function cancelOrderTickets(orderId: string, payload: CancelTicketsPayload): Promise<CancelTicketsResult> {
	const { data } = await apiClient.post<{ success: boolean; data: CancelTicketsResult }>(
		`/orders/${orderId}/cancel-tickets`,
		payload,
	)
	return data.data
}

export async function getFullOrderDetail(orderId: string): Promise<FullOrderDetail> {
	const { data } = await apiClient.get<{ success: boolean; data: FullOrderDetail }>(`/orders/${orderId}`)
	return data.data
}

export async function getMyOrders(): Promise<MyOrderListItem[]> {
	const { data } = await apiClient.get<{ success: boolean; data: MyOrdersResponse }>("/orders/me")
	return data.data.orders ?? []
}

export interface AvailableOffer {
	code: string
	description: string
	discountType: "PERCENTAGE" | "FLAT"
	discountValue: number
	maxDiscountAmount: number | null
	minOrderValue: number | null
	validUntil: string | null
}

export async function getAvailableOffers(eventId: string): Promise<AvailableOffer[]> {
	const { data } = await apiClient.get<{ success: boolean; data: AvailableOffer[] }>(
		`/events/${eventId}/available-offers`,
	)
	return data.data
}
