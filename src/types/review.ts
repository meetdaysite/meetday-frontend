export const REVIEW_HIGHLIGHTS = [
	"Great Music",
	"Good Crowd",
	"Nice Venue",
	"Helpful Host",
	"Smooth Entry",
	"Felt Safe",
] as const

export type ReviewHighlight = (typeof REVIEW_HIGHLIGHTS)[number]

export interface ReviewPayload {
	eventId: string
	orderId: string
	rating: number
	hostRating?: number
	hostBody?: string
	highlights: string[]
	body?: string
	photoKeys: string[]
}
