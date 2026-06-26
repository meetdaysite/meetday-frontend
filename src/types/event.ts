export type ApiEventStatus =
	| "DRAFT"
	| "UNDER_REVIEW"
	| "PUBLISHED"
	| "CANCELLED"
	| "REJECTED"
	| "COMPLETED"

export interface Ticket {
	id?: string
	name: string
	price: number
	totalCapacity: number
	soldCount?: number
	maxPerPerson: number
	description?: string
	saleStartDate?: string
	saleEndDate?: string
}

export interface RefundPolicy {
	type: "FULL" | "PARTIAL" | "NO_REFUND"
	cutoffHours?: number
	refundPercent?: number
	refundTo?: "ORIGINAL_PAYMENT" | "CREDITS"
}

export interface EventMedia {
	key?: string  // storage key — required when sending in payload, absent in API responses
	url?: string  // pre-signed URL — present in API responses, absent in payload
	type: "COVER" | "GALLERY" | "VIDEO"
	order: number
	id?: string
}

export interface EventDraftPayload {
	categoryId?: string
	title?: string
	description?: string
	eventType?: string
	languages?: string[]
	tags?: string[]
	eventDate?: string
	startTime?: string
	endTime?: string
	venueName?: string
	fullAddress?: string
	city?: string
	latitude?: number
	longitude?: number
	whatToExpect?: string[]
	whoShouldAttend?: string[]
	visibility?: "PUBLIC" | "PRIVATE"
	ageRestriction?: string
	specialInstructions?: string
	isFree?: boolean
	tickets?: Ticket[]
	refundPolicy?: RefundPolicy
	media?: EventMedia[]
}

export interface Event {
	id: string
	status: ApiEventStatus
	hostId: string
	createdAt: string
	updatedAt: string
	submittedAt?: string
	rejectionReason?: string
	cancellationReason?: string
	adminRejectionRemark?: string | null
	// List-response computed fields
	coverImageUrl?: string
	totalCapacity?: number
	startingPrice?: number
	category?: { id: string; name: string }
	// Draft payload fields
	categoryId?: string
	title?: string
	description?: string
	eventType?: string
	languages?: string[]
	tags?: string[]
	eventDate?: string
	startTime?: string
	endTime?: string
	venueName?: string
	fullAddress?: string
	city?: string
	latitude?: number
	longitude?: number
	whatToExpect?: string[]
	whoShouldAttend?: string[]
	visibility?: "PUBLIC" | "PRIVATE"
	ageRestriction?: string
	specialInstructions?: string
	isFree?: boolean
	tickets?: Ticket[]
	refundPolicy?: RefundPolicy
	media?: EventMedia[]
}

export interface EventsListResponse {
	events: Event[]
	total: number
	page: number
	limit: number
}
