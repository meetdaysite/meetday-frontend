export interface VibeCategory {
	id: string
	label: string
	image: string
	gradient: string
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
}
