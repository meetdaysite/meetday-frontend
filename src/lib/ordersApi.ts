import apiClient from "./axios"
import type { CreateOrderPayload, OrderDetail } from "@/types/order"

export async function createOrder(payload: CreateOrderPayload): Promise<OrderDetail> {
	const { data } = await apiClient.post<{ success: boolean; data: OrderDetail }>("/orders", payload)
	return data.data
}

export async function mockConfirmOrder(orderId: string): Promise<void> {
	await apiClient.post(`/orders/${orderId}/mock-confirm`)
}

export async function getOrderDetail(orderId: string): Promise<OrderDetail> {
	const { data } = await apiClient.get<{ success: boolean; data: OrderDetail }>(`/orders/${orderId}`)
	return data.data
}

export async function cancelOrder(orderId: string): Promise<void> {
	await apiClient.post(`/orders/${orderId}/cancel`)
}
