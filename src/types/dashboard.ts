export type DashboardPeriod = "THIS_MONTH" | "LAST_30_DAYS" | "THIS_YEAR" | "ALL_TIME"

export type EventCounts = {
	draft: number
	underReview: number
	published: number
	completed: number
	cancelled: number
}

export type OverviewStats = {
	period: DashboardPeriod
	totalEvents: number
	totalEventsDelta: number | null
	liveRegistrations: number
	liveRegistrationsDelta: number | null
	revenue: number
	revenueDelta: number | null
	avgSatisfaction: number | null
	avgSatisfactionDelta: number | null
}

export type DashboardRecentEvent = {
	id: string
	title: string
	coverImageUrl: string | null
	city: string | null
	eventDate: string | null
	endDate: string | null
	endTime: string | null
	status: string
	registrations: number
	revenue: number
}

export type DashboardData = {
	eventCounts: EventCounts
	overview: OverviewStats
	recentEvents: DashboardRecentEvent[]
}
