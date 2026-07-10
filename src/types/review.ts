export type ReviewHighlight = { key: string; label: string }

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
