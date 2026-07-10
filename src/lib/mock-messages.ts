export type MessageSender = "host" | "attendee"

export interface ChatMessage {
	id: string
	from: MessageSender
	text: string
	time: string // "H:MM AM/PM" — replace with ISO timestamp when wiring API
}

export interface Conversation {
	id: string
	attendeeName: string
	attendeeEmail: string
	eventTitle: string
	lastMessage: string
	timeAgo: string // replace with ISO timestamp when wiring API
	unread: number
	messages: ChatMessage[]
}

export const MOCK_CONVERSATIONS: Conversation[] = [
	{
		id: "c1",
		attendeeName: "Jordan Hayes",
		attendeeEmail: "jordan@email.com",
		eventTitle: "Summer Music Festival",
		lastMessage: "Is parking available?",
		timeAgo: "2h ago",
		unread: 1,
		messages: [
			{ id: "m1", from: "attendee", text: "Hi! Is parking available near the venue?", time: "2:15 PM" },
			{ id: "m2", from: "host", text: "Yes! There's a paid parking lot on 2nd Street, about 5 min walk.", time: "2:30 PM" },
		],
	},
	{
		id: "c2",
		attendeeName: "Priya Nair",
		attendeeEmail: "priya.n@email.com",
		eventTitle: "Summer Music Festival",
		lastMessage: "Can I upgrade to VIP?",
		timeAgo: "5h ago",
		unread: 0,
		messages: [
			{ id: "m3", from: "attendee", text: "Hey, is it still possible to upgrade my ticket to VIP?", time: "10:02 AM" },
			{ id: "m4", from: "host", text: "Hi Priya! Yes, you can upgrade via the ticket portal until 48 hours before the event.", time: "10:18 AM" },
			{ id: "m5", from: "attendee", text: "Can I upgrade to VIP?", time: "10:20 AM" },
		],
	},
	{
		id: "c3",
		attendeeName: "Marcus Tran",
		attendeeEmail: "mtran@email.com",
		eventTitle: "Summer Music Festival",
		lastMessage: "Thanks! See you there.",
		timeAgo: "1d ago",
		unread: 0,
		messages: [
			{ id: "m6", from: "attendee", text: "What time do doors open?", time: "Yesterday" },
			{ id: "m7", from: "host", text: "Doors open at 4 PM, main stage kicks off at 5 PM!", time: "Yesterday" },
			{ id: "m8", from: "attendee", text: "Thanks! See you there.", time: "Yesterday" },
		],
	},
]
