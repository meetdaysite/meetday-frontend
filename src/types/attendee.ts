import type { ApiEventStatus, DisplayEventStatus } from "@/types/event"

export interface VibeCategory {
	id: string
	label: string
	image: string
	gradient: string
}

export interface ExploreEvent {
	id: string
	title: string
	eventType: string
	eventDate: string
	startTime: string
	venueName: string
	tags: string[]
	category: { id: string; name: string }
	coverImageUrl: string
	startingPrice: number
	displayStatus?: DisplayEventStatus
}

export interface ExploreEventsResponse {
	events: ExploreEvent[]
	total: number
	page: number
	limit: number
}

export interface SavedEvent extends ExploreEvent {
	isSaved: true
}

export interface SavedEventsResponse {
	data: SavedEvent[]
	total: number
	page: number
	limit: number
}

// ─── Vibe match (POST /events/:id/vibe-match) ───────────────────────────────

export interface VibeMatchResponse {
	score: number | null
	label: string | null
	summary: string | null
}

// ─── Crowd pulse (GET /events/:id/crowd-pulse) ───────────────────────────────

export interface CrowdPulseResponse {
	energyScore: number | null
	socialScore: number | null
	crowdStyle: string | null
	energy: string | null
	socialFriendliness: string | null
	isEstimate: boolean
	confidence: number
	totalAttendees: number
}

// ─── Public event details (GET /events/:id/public) ───────────────────────────

export interface PublicHostProfile {
	id: string
	displayName: string
	tagline: string
	averageRating: number | null
	totalReviews: number
	totalEventsHosted: number
}

export interface PublicTicket {
	id: string
	name: string
	price: string
	isFree: boolean
	totalCapacity: number
	maxPerPerson: number
	description?: string
	saleStartDate?: string
	saleEndDate?: string
	originalPrice?: string
	availableCount?: number
}

export interface PublicRefundPolicy {
	id: string
	eventId: string
	type: "FULL" | "PARTIAL" | "NO_REFUND"
	cutoffHours?: number
	refundPercent?: number
	refundTo?: "ORIGINAL_PAYMENT" | "CREDITS"
}

export interface PublicEventMedia {
	id: string
	eventId: string
	url: string
	type: "COVER" | "GALLERY" | "VIDEO"
	order: number
	createdAt: string
}

export interface PublicEventCommunity {
	id: string
	slug: string
	name: string
	description: string
	type: string
	access: "PUBLIC" | "PRIVATE"
	city: string
	memberCount: number
	upcomingExperiencesCount: number
	coverImageUrl: string
	iconUrl: string
}

export interface PublicEventDetails {
	id: string
	status: ApiEventStatus
	displayStatus: DisplayEventStatus
	title: string
	description: string
	eventType: string
	languages: string[]
	tags: string[]
	eventDate: string
	startTime: string
	endTime: string
	venueName: string
	fullAddress: string
	city: string
	latitude: number | null
	longitude: number | null
	whatToExpect: string[]
	whoShouldAttend: string[]
	vibeSummary: string | null
	crowdPulse: CrowdPulseResponse | null
	isFree: boolean
	ageRestriction: string
	specialInstructions: string | null
	category: { id: string; name: string }
	hostProfile: PublicHostProfile
	tickets: PublicTicket[]
	refundPolicy: PublicRefundPolicy | null
	media: PublicEventMedia[]
	communities: PublicEventCommunity[]
	startingPrice: number
	reviewSummary: {
		averageRating: number | null
		reviewCount: number
		recentReviews: unknown[]
	}
	isSaved: boolean
}

export interface AttendeeProfile {
	id: string
	userId: string
	username: string | null
	bio: string | null
	city: string | null
	ageRange: string | null
	gender: string | null
	profession: string | null
	vibeType: string | null
	socialStyle: string | null
	privacy: string
	createdAt: string
	updatedAt: string
	avatarUrl: string | null
}

export interface AttendeeEventCard {
	id: string
	title: string
	category: string
	date: string
	time: string
	venue: string
	city: string
	cover: string
	/** null = free */
	price: number | null
	hostName: string
	attendeeCount: number
	capacity: number
	isTrending?: boolean
	isNew?: boolean
	tags?: string[]
	genre?: string
}
