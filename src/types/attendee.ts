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
}

export interface ExploreEventsResponse {
	events: ExploreEvent[]
	total: number
	page: number
	limit: number
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
