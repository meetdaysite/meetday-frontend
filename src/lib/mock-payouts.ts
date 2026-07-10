export type PayoutStatus = "Paid" | "Processing" | "Failed"
export type PayoutMethod = "Bank Transfer" | "PayPal" | "Stripe"

export interface MockPayout {
	id: string
	eventTitle: string
	eventId: number
	amount: number
	date: string
	method: PayoutMethod
	status: PayoutStatus
	reference: string
}

export const MOCK_PAYOUTS: MockPayout[] = [
	{
		id: "pay-001",
		eventTitle: "Night Market Experience",
		eventId: 4,
		amount: 18120,
		date: "2025-06-03",
		method: "Bank Transfer",
		status: "Paid",
		reference: "TXN-8A3F2C",
	},
	{
		id: "pay-002",
		eventTitle: "Summer Music Festival",
		eventId: 1,
		amount: 12400,
		date: "2025-05-15",
		method: "Bank Transfer",
		status: "Paid",
		reference: "TXN-7D1E9B",
	},
	{
		id: "pay-003",
		eventTitle: "Summer Music Festival",
		eventId: 1,
		amount: 8240,
		date: "2025-04-28",
		method: "Bank Transfer",
		status: "Processing",
		reference: "TXN-6C4A8D",
	},
	{
		id: "pay-004",
		eventTitle: "Tech Innovators Summit",
		eventId: 2,
		amount: 9450,
		date: "2025-04-10",
		method: "Bank Transfer",
		status: "Paid",
		reference: "TXN-5B3F7E",
	},
	{
		id: "pay-005",
		eventTitle: "Wellness Retreat",
		eventId: 3,
		amount: 4200,
		date: "2025-03-22",
		method: "Bank Transfer",
		status: "Paid",
		reference: "TXN-4A2D6C",
	},
	{
		id: "pay-006",
		eventTitle: "Night Market Experience",
		eventId: 4,
		amount: 6500,
		date: "2025-03-05",
		method: "Bank Transfer",
		status: "Paid",
		reference: "TXN-3E1C5B",
	},
	{
		id: "pay-007",
		eventTitle: "Tech Innovators Summit",
		eventId: 2,
		amount: 3780,
		date: "2025-02-18",
		method: "Bank Transfer",
		status: "Failed",
		reference: "TXN-2D0B4A",
	},
	{
		id: "pay-008",
		eventTitle: "Wellness Retreat",
		eventId: 3,
		amount: 2950,
		date: "2025-02-01",
		method: "Bank Transfer",
		status: "Paid",
		reference: "TXN-1C9A3F",
	},
	{
		id: "pay-009",
		eventTitle: "Summer Music Festival",
		eventId: 1,
		amount: 11200,
		date: "2025-01-14",
		method: "Bank Transfer",
		status: "Paid",
		reference: "TXN-0B8E2D",
	},
	{
		id: "pay-010",
		eventTitle: "Night Market Experience",
		eventId: 4,
		amount: 7890,
		date: "2025-01-02",
		method: "Bank Transfer",
		status: "Paid",
		reference: "TXN-9A7D1C",
	},
]

export const PAYOUT_TOTALS = {
	totalEarned: 258130,
	totalPaidOut: 30520,
	processing: 8240,
}
