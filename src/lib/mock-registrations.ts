export type CheckInStatus = "checked-in" | "pending"

export interface MockRegistration {
	id: string
	attendeeName: string
	attendeeEmail: string
	eventId: string
	eventTitle: string
	ticketType: string
	date: string // "YYYY-MM-DD"
	paid: number
	checkIn: CheckInStatus
}

export const MOCK_REGISTRATIONS: MockRegistration[] = [
	{ id: "r1",  attendeeName: "Jordan Hayes",   attendeeEmail: "jordan@email.com",    eventId: "summer-music-festival",  eventTitle: "Summer Music Festival",  ticketType: "General Admission",   date: "2025-04-02", paid: 149, checkIn: "checked-in" },
	{ id: "r2",  attendeeName: "Priya Nair",      attendeeEmail: "priya.n@email.com",   eventId: "summer-music-festival",  eventTitle: "Summer Music Festival",  ticketType: "VIP Pass",            date: "2025-04-03", paid: 349, checkIn: "pending" },
	{ id: "r3",  attendeeName: "Marcus Tran",     attendeeEmail: "mtran@email.com",     eventId: "summer-music-festival",  eventTitle: "Summer Music Festival",  ticketType: "General Admission",   date: "2025-04-05", paid: 149, checkIn: "checked-in" },
	{ id: "r4",  attendeeName: "Sofia Ramos",     attendeeEmail: "sofia.r@email.com",   eventId: "summer-music-festival",  eventTitle: "Summer Music Festival",  ticketType: "Early Bird",          date: "2025-03-12", paid: 99,  checkIn: "pending" },
	{ id: "r5",  attendeeName: "Connor Walsh",    attendeeEmail: "cwalsh@email.com",    eventId: "summer-music-festival",  eventTitle: "Summer Music Festival",  ticketType: "VIP Pass",            date: "2025-04-08", paid: 349, checkIn: "pending" },
	{ id: "r6",  attendeeName: "Aaliyah Brooks",  attendeeEmail: "abrooks@email.com",   eventId: "summer-music-festival",  eventTitle: "Summer Music Festival",  ticketType: "General Admission",   date: "2025-04-11", paid: 149, checkIn: "checked-in" },
	{ id: "r7",  attendeeName: "Kevin Nguyen",    attendeeEmail: "kng@email.com",       eventId: "summer-music-festival",  eventTitle: "Summer Music Festival",  ticketType: "Early Bird",          date: "2025-03-18", paid: 99,  checkIn: "pending" },
	{ id: "r8",  attendeeName: "Tanya Osei",      attendeeEmail: "t.osei@email.com",    eventId: "night-market-experience", eventTitle: "Night Market Experience", ticketType: "General Entry",      date: "2025-05-01", paid: 15,  checkIn: "checked-in" },
	{ id: "r9",  attendeeName: "Liam O'Brien",    attendeeEmail: "liamob@email.com",    eventId: "night-market-experience", eventTitle: "Night Market Experience", ticketType: "VIP Tasting Bundle", date: "2025-05-03", paid: 65,  checkIn: "checked-in" },
	{ id: "r10", attendeeName: "Zara Patel",      attendeeEmail: "zara.p@email.com",    eventId: "night-market-experience", eventTitle: "Night Market Experience", ticketType: "General Entry",      date: "2025-05-04", paid: 15,  checkIn: "checked-in" },
	{ id: "r11", attendeeName: "Jake Morrison",   attendeeEmail: "jmorrison@email.com", eventId: "night-market-experience", eventTitle: "Night Market Experience", ticketType: "General Entry",      date: "2025-05-05", paid: 15,  checkIn: "pending" },
	{ id: "r12", attendeeName: "Elena Vasquez",   attendeeEmail: "evasquez@email.com",  eventId: "night-market-experience", eventTitle: "Night Market Experience", ticketType: "VIP Tasting Bundle", date: "2025-05-06", paid: 65,  checkIn: "checked-in" },
]
