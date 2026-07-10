// Uses /api/scan proxy so phone browsers on local WiFi hit the same host
// as the Next.js server, which then proxies server-side to the backend.
const PROXY = "/api/scan"

type Envelope<T> = { success: boolean; message?: string; data: T }

async function request<T>(
	path: string,
	options: { method?: "GET" | "POST"; params?: Record<string, string>; body?: Record<string, string> } = {},
): Promise<T> {
	const segment = path.replace(/^\/check-in\//, "")
	const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
	const url = new URL(`${PROXY}/${segment}`, origin)
	Object.entries(options.params ?? {}).forEach(([k, v]) => url.searchParams.set(k, v))

	const res = await fetch(url.toString(), {
		method: options.method ?? "GET",
		...(options.body
			? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(options.body) }
			: {}),
	})

	const json = (await res.json().catch(() => ({}))) as Partial<Envelope<T>>
	if (!res.ok) {
		throw Object.assign(new Error(json?.message ?? res.statusText), { status: res.status })
	}
	return json.data as T
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type ScannerSession = {
	id: string
	staffName: string
	label: string | null
}

export type ScannerEvent = {
	id: string
	title: string
	eventDate: string
	startTime: string
	endTime: string
	venueName: string
	city: string
}

export type VerifySessionResponse = {
	session: ScannerSession
	event: ScannerEvent
}

export type LiveStatsResponse = {
	checkedIn: number
	remaining: number
}

export type CheckInLookupItem = {
	orderItemId: string
	ticketType: string
	totalEntries: number
	checkedInCount: number
}

// Matches GET /check-in/lookup response shape — a single booking, not a list.
export type LookupResult = {
	bookingCode: string
	orderStatus: string
	items: CheckInLookupItem[]
}

export type CheckInEntry = {
	position: number
	isCheckedIn: boolean
}

export type CheckInOrderView = {
	bookingCode: string
	ticketType: string
	totalEntries: number
	checkedInCount: number
	entries: CheckInEntry[]
}

// Confirmed response shape for POST /check-in/scan (and assumed identical for
// /check-in/manual-check-in, which follows the same "like /scan" contract).
export type CheckInActionResult = {
	alreadyCheckedIn: boolean
	checkedInAt: string | null
	order: CheckInOrderView | null
}

// `ticketCode` on each variant echoes the code the client sent for the scan —
// it's not server data, just a reminder of what was scanned/entered.
export type ScanResult =
	| { status: "DUPLICATE"; ticketCode: string; checkedInAt: string | null }
	| {
			status: "GROUP_PARTIAL"
			ticketCode: string
			ticketType: string
			bookingCode: string
			totalEntries: number
			checkedInCount: number
			entries: CheckInEntry[]
	  }
	| { status: "APPROVED"; ticketCode: string; ticketType: string | null; bookingCode: string | null }
	| { status: "INVALID"; message?: string }

export function toScanResult(ticketCode: string, data: CheckInActionResult): ScanResult {
	if (data.alreadyCheckedIn) {
		return { status: "DUPLICATE", ticketCode, checkedInAt: data.checkedInAt }
	}
	const order = data.order
	if (order && order.totalEntries > 1) {
		return {
			status: "GROUP_PARTIAL",
			ticketCode,
			ticketType: order.ticketType,
			bookingCode: order.bookingCode,
			totalEntries: order.totalEntries,
			checkedInCount: order.checkedInCount,
			entries: order.entries,
		}
	}
	return { status: "APPROVED", ticketCode, ticketType: order?.ticketType ?? null, bookingCode: order?.bookingCode ?? null }
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function verifySession(token: string): Promise<VerifySessionResponse> {
	// API returns flat: { sessionId, staffName, label, event: {...} }
	const raw = await request<{
		sessionId: string
		staffName: string
		label: string | null
		event: ScannerEvent
	}>("/check-in/verify-session", { params: { token } })

	return {
		session: { id: raw.sessionId, staffName: raw.staffName, label: raw.label },
		event: raw.event,
	}
}

export async function getLiveStats(token: string): Promise<LiveStatsResponse> {
	// API returns { checkedInThisGate, totalRemaining } — map to component field names
	const raw = await request<{ checkedInThisGate: number; totalRemaining: number }>("/check-in/live-stats", {
		params: { token },
	})
	return { checkedIn: raw.checkedInThisGate, remaining: raw.totalRemaining }
}

export async function lookupBooking(
	token: string,
	query: { bookingId: string } | { ticketCode: string },
): Promise<LookupResult> {
	return request<LookupResult>("/check-in/lookup", { params: { token, ...query } })
}

export async function scanTicket(ticketCode: string, scannerToken: string): Promise<CheckInActionResult> {
	return request<CheckInActionResult>("/check-in/scan", {
		method: "POST",
		body: { ticketCode, scannerToken },
	})
}

// Not currently called anywhere: /check-in/lookup only returns order-item-level
// aggregates (orderItemId/ticketType/totalEntries/checkedInCount), so there is
// no attendeeId available in the UI today to satisfy this endpoint's contract.
// Kept for when the lookup response exposes individual attendees.
export async function manualCheckIn(attendeeId: string, scannerToken: string): Promise<CheckInActionResult> {
	return request<CheckInActionResult>("/check-in/manual-check-in", {
		method: "POST",
		body: { attendeeId, scannerToken },
	})
}

// ─── QR content parser ────────────────────────────────────────────────────────

export function parseQrContent(raw: string): string {
	// Format: MEETDAY:{orderId}:{ticketId}:{ticketCode} — ticketCode is always the last segment.
	if (raw.startsWith("MEETDAY:")) {
		const parts = raw.split(":")
		return parts[parts.length - 1] ?? raw
	}
	return raw
}
