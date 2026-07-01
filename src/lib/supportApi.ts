import apiClient from "./axios"

export type SupportCategory =
	| "PAYMENT_ISSUE"
	| "REFUND_REQUEST"
	| "EVENT_ISSUE"
	| "ACCOUNT_ISSUE"
	| "COMMUNITY_ISSUE"
	| "OTHER"

export type SupportEntityType = "ORDER" | "EVENT" | "USER" | "COMMUNITY"
export type SupportPriority = "HIGH" | "NORMAL" | "LOW"

export interface SupportTicket {
	id: string
	ticketNumber: string
	subject: string
	body: string
	category: SupportCategory
	priority: SupportPriority
	status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
	entityType: SupportEntityType | null
	entityId: string | null
	resolution: string | null
	resolvedAt: string | null
	createdAt: string
	updatedAt: string
}

interface CreateSupportTicketInput {
	subject: string
	body: string
	category: SupportCategory
	entityType?: SupportEntityType
	entityId?: string
}

function derivePriority(category: SupportCategory, entityType?: SupportEntityType): SupportPriority {
	// Any ticket tied to an ORDER is a financial transaction — always HIGH
	if (entityType === "ORDER") return "HIGH"
	if (category === "PAYMENT_ISSUE" || category === "REFUND_REQUEST") return "HIGH"
	if (category === "OTHER") return "LOW"
	return "NORMAL"
}

export async function createSupportTicket(input: CreateSupportTicketInput): Promise<SupportTicket> {
	const priority = derivePriority(input.category, input.entityType)
	const { data } = await apiClient.post<{ success: boolean; data: SupportTicket }>("/support-tickets", {
		...input,
		priority,
	})
	return data.data
}
