export type ApiEventStatus =
	| "DRAFT"
	| "UNDER_REVIEW"
	| "PUBLISHED"
	| "CANCELLED"
	| "REJECTED"
	| "COMPLETED"

// Real-time label for the badge the user sees — distinct from the persisted
// `status`, which can lag up to ~30 min behind (e.g. still "PUBLISHED" while
// displayStatus is already "LIVE" or "COMPLETED"). Render badges from this;
// gate actions (cancel/edit/etc.) on `status`.
export type DisplayEventStatus =
	| "DRAFT"
	| "UNDER_REVIEW"
	| "PUBLISHED"
	| "LIVE"
	| "COMPLETED"
	| "CANCELLED"

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
	key?: string  // storage key — present in both API responses and save payloads
	url?: string  // pre-signed URL — present in API responses, absent in payloads
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
	endDate?: string
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

export interface UpdatePublishedEventPayload {
	categoryId?: string
	title?: string
	description?: string
	eventType?: string
	languages?: string[]
	tags?: string[]
	whatToExpect?: string[]
	whoShouldAttend?: string[]
	specialInstructions?: string
	media?: EventMedia[]
	venueName?: string
	fullAddress?: string
	city?: string
	latitude?: number
	longitude?: number
}

export type EventRevisionChanges = UpdatePublishedEventPayload

export interface EventRevision {
	id: string
	eventId: string
	status: "PENDING"
	touchesVenue: boolean
	submittedBy: string
	changes: EventRevisionChanges
	adminRemark: string | null
	reviewedBy: string | null
	reviewedAt: string | null
	createdAt: string
	updatedAt: string
}

export interface Event {
	id: string
	status: ApiEventStatus
	displayStatus?: DisplayEventStatus
	hostId: string
	createdAt: string
	updatedAt: string
	submittedAt?: string
	rejectionReason?: string
	cancellationReason?: string
	adminRejectionRemark?: string | null
	pendingRevision?: EventRevision | null
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
	endDate?: string | null
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
