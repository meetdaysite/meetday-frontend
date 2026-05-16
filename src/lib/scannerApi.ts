// Uses /api/scan proxy so phone browsers on local WiFi hit the same host
// as the Next.js server, which then proxies server-side to the backend.
const PROXY = "/api/scan"

async function get<T>(path: string, params: Record<string, string>): Promise<T> {
	const segment = path.replace(/^\/check-in\//, "")
	const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
	const url = new URL(`${PROXY}/${segment}`, origin)
	Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
	const res = await fetch(url.toString())
	if (!res.ok) {
		const body = await res.json().catch(() => ({}))
		// console.error("[scannerApi] GET error →", res.status, res.statusText, body)
		throw Object.assign(new Error(body?.message ?? res.statusText), { status: res.status })
	}
	const json = await res.json()
	return json.data as T
}

async function post<T>(path: string, body: Record<string, string>): Promise<T> {
	const segment = path.replace(/^\/check-in\//, "")
	const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
	const url = new URL(`${PROXY}/${segment}`, origin)
	const res = await fetch(url.toString(), {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	})
	if (!res.ok) {
		const b = await res.json().catch(() => ({}))
		// console.error("[scannerApi] POST error →", res.status, res.statusText, b)
		throw Object.assign(new Error(b?.message ?? res.statusText), { status: res.status })
	}
	const json = await res.json()
	return json.data as T
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type ScannerSession = {
	id: string
	eventId: string
	staffName: string
	staffEmail: string
	label?: string
	isActive: boolean
	expiresAt: string
}

export type ScannerEvent = {
	id: string
	title: string
	eventDate: string
	startTime: string
	endTime: string
	venueName: string
	city: string
	coverUrl?: string
}

export type VerifySessionResponse = {
	session: ScannerSession
	event: ScannerEvent
}

export type LiveStatsResponse = {
	checkedIn: number
	remaining: number
	noShows: number
	total: number
	lastUpdated: string
}

export type ScanResultStatus = "APPROVED" | "GROUP_PARTIAL" | "DUPLICATE" | "INVALID"

export type AuditLogEntry = {
	time: string
	message: string
	type: "VERIFIED" | "DUPLICATE"
}

export type GroupEntry = {
	index: number
	status: "CHECKED_IN" | "WAITING"
}

export type ScanResult =
	| {
			status: "APPROVED"
			ticketTier: string
			ticketCodeSuffix: string
			gate: string
			checkedInAt: string
			entriesAdmitted: number
	  }
	| {
			status: "GROUP_PARTIAL"
			ticketType: string
			bookingCode: string
			totalEntries: number
			checkedIn: number
			remaining: number
			entries: GroupEntry[]
	  }
	| {
			status: "DUPLICATE"
			ticketCodeSuffix: string
			gate: string
			firstScannedAt: string
			eventName: string
			auditLog: AuditLogEntry[]
	  }
	| { status: "INVALID"; message?: string }

export type LookupAttendee = {
	attendeeId: string
	status: "NOT_CHECKED_IN" | "CHECKED_IN" | "CANCELLED"
}

export type LookupResult = {
	bookingId: string
	ticketType: string
	quantity: number
	status: "NOT_CHECKED_IN" | "CHECKED_IN" | "CANCELLED"
	attendees: LookupAttendee[]
}

export type LookupResponse = {
	results: LookupResult[]
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function verifySession(token: string): Promise<VerifySessionResponse> {
	const raw = await get<Record<string, unknown>>("/check-in/verify-session", { token })
	// If API returns { session, event } already, use as-is
	if (raw && typeof raw.session === "object" && raw.session !== null) {
		return raw as unknown as VerifySessionResponse
	}
	// Otherwise API returns flat: session fields at top level, event nested
	const { event, ...sessionFields } = raw
	return {
		session: sessionFields as unknown as ScannerSession,
		event: event as ScannerEvent,
	}
}

export async function getLiveStats(token: string): Promise<LiveStatsResponse> {
	return get<LiveStatsResponse>("/check-in/live-stats", { token })
}

export async function scanTicket(ticketCode: string, scannerToken: string): Promise<ScanResult> {
	const raw = await post<Record<string, unknown>>("/check-in/scan", { ticketCode, scannerToken })
	return normalizeScanResult(raw)
}

type RawOrder = {
	bookingCode: string
	ticketType: string
	totalEntries: number
	checkedInCount: number
	entries: Array<{ position: number; isCheckedIn: boolean }>
}

function normalizeScanResult(raw: Record<string, unknown>): ScanResult {
	// Already checked in → DUPLICATE
	if (raw.alreadyCheckedIn === true) {
		return {
			status: "DUPLICATE",
			ticketCodeSuffix: "",
			gate: "",
			firstScannedAt: (raw.checkedInAt as string) ?? "",
			eventName: "",
			auditLog: [],
		}
	}

	const order = raw.order as RawOrder | undefined

	// Group booking with remaining entries → GROUP_PARTIAL
	if (order && order.totalEntries > 1 && order.checkedInCount < order.totalEntries) {
		return {
			status: "GROUP_PARTIAL",
			ticketType: order.ticketType,
			bookingCode: order.bookingCode,
			totalEntries: order.totalEntries,
			checkedIn: order.checkedInCount,
			remaining: order.totalEntries - order.checkedInCount,
			entries: order.entries.map((e) => ({
				index: e.position,
				status: e.isCheckedIn ? "CHECKED_IN" : "WAITING",
			})),
		}
	}

	// Default → APPROVED
	return {
		status: "APPROVED",
		ticketTier: order?.ticketType ?? "",
		ticketCodeSuffix: "",
		gate: "",
		checkedInAt: (raw.checkedInAt as string) ?? "",
		entriesAdmitted: order?.checkedInCount ?? 1,
	}
}

export async function lookupBooking(
	token: string,
	query: { bookingId: string } | { ticketCode: string },
): Promise<LookupResponse> {
	return get<LookupResponse>("/check-in/lookup", { token, ...query })
}

export async function manualCheckIn(attendeeId: string, scannerToken: string): Promise<ScanResult> {
	return post<ScanResult>("/check-in/manual-check-in", { attendeeId, scannerToken })
}

// ─── QR content parser ────────────────────────────────────────────────────────

export function parseQrContent(raw: string): string {
	// Format: MEETDAY:{orderId}:{ticketCode}:{email}
	if (raw.startsWith("MEETDAY:")) {
		const parts = raw.split(":")
		// parts[2] is ticketCode UUID (no colons in UUID)
		return parts[2] ?? raw
	}
	return raw
}
