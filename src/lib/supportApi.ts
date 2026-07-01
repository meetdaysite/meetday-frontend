import apiClient from "./axios"

export type SupportCategory =
	| "PAYMENT_ISSUE"
	| "REFUND_REQUEST"
	| "EVENT_ISSUE"
	| "ACCOUNT_ISSUE"
	| "COMMUNITY_ISSUE"
	| "HOST_ISSUE"
	| "OTHER"

export type SupportEntityType = "ORDER" | "EVENT" | "USER" | "HOST" | "COMMUNITY"
export type SupportPriority = "HIGH" | "NORMAL" | "LOW"
export type SupportTicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"

export const CATEGORY_LABELS: Record<SupportCategory, string> = {
	PAYMENT_ISSUE: "Payment Issue",
	REFUND_REQUEST: "Refund Request",
	EVENT_ISSUE: "Event Issue",
	ACCOUNT_ISSUE: "Account Issue",
	COMMUNITY_ISSUE: "Community Issue",
	HOST_ISSUE: "Host Issue",
	OTHER: "Other",
}

interface PersonRef {
	id: string
	firstName: string
	lastName: string
}

export interface SupportTicket {
	id: string
	ticketNumber: string
	subject: string
	body: string
	category: SupportCategory
	priority: SupportPriority
	status: SupportTicketStatus
	entityType: SupportEntityType | null
	entityId: string | null
	resolution: string | null
	resolvedAt: string | null
	createdAt: string
	updatedAt: string
	reporter: PersonRef & { email: string }
	assignee: PersonRef | null
	resolver: PersonRef | null
}

export interface PaginatedTickets {
	total: number
	page: number
	limit: number
	items: SupportTicket[]
}

interface CreateSupportTicketInput {
	subject: string
	body: string
	category: SupportCategory
	entityType?: SupportEntityType
	entityId?: string
}

export interface ListMyTicketsParams {
	status?: SupportTicketStatus
	page?: number
	limit?: number
}

function derivePriority(category: SupportCategory, entityType?: SupportEntityType, entityId?: string): SupportPriority {
	if (entityType === "ORDER" || entityType === "HOST") return "HIGH"
	if (category === "PAYMENT_ISSUE" || category === "REFUND_REQUEST" || category === "HOST_ISSUE") return "HIGH"
	if (category === "OTHER" && !entityId) return "LOW"
	return "NORMAL"
}

export async function createSupportTicket(input: CreateSupportTicketInput): Promise<SupportTicket> {
	const priority = derivePriority(input.category, input.entityType, input.entityId)
	const { data } = await apiClient.post<{ success: boolean; data: SupportTicket }>("/support-tickets", {
		...input,
		priority,
	})
	return data.data
}

export async function listMyTickets(params?: ListMyTicketsParams): Promise<PaginatedTickets> {
	const { data } = await apiClient.get<{ success: boolean; data: PaginatedTickets }>("/support-tickets/me", { params })
	return data.data
}

export async function getMyTicket(id: string): Promise<SupportTicket> {
	const { data } = await apiClient.get<{ success: boolean; data: SupportTicket }>(`/support-tickets/me/${id}`)
	return data.data
}
