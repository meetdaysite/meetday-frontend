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
		throw Object.assign(new Error(body?.message ?? res.statusText), { status: res.status })
	}
	const json = await res.json()
	return json.data as T
}

async function post(path: string, body: Record<string, string>): Promise<void> {
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
		throw Object.assign(new Error(b?.message ?? res.statusText), { status: res.status })
	}
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type ScannerSession = {
	id: string
	eventId: string
	staffName: string
	staffEmail: string
	label?: string | null
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

// API returns { checkedInThisGate, totalRemaining } — normalized on read
export type LiveStatsResponse = {
	checkedIn: number
	remaining: number
	noShows: number
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

// Matches GET /check-in/lookup response shape
export type LookupResult = {
	bookingId: string
	ticketCode: string
	name: string
	eventTitle: string
	ticketType: string
	remainingSeats: number
	checkedInCount: number
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function verifySession(token: string): Promise<VerifySessionResponse> {
	// API returns flat: { sessionId, staffName, label, event: {...} }
	const raw = await get<{
		sessionId: string
		staffName: string
		label: string | null
		event: ScannerEvent
	}>("/check-in/verify-session", { token })

	return {
		session: {
			id: raw.sessionId,
			eventId: raw.event.id,
			staffName: raw.staffName,
			staffEmail: "",
			label: raw.label,
			isActive: true,
			expiresAt: "",
		},
		event: raw.event,
	}
}

export async function getLiveStats(token: string): Promise<LiveStatsResponse> {
	// API returns { checkedInThisGate, totalRemaining } — map to component field names
	const raw = await get<{ checkedInThisGate: number; totalRemaining: number }>(
		"/check-in/live-stats",
		{ token },
	)
	return {
		checkedIn: raw.checkedInThisGate,
		remaining: raw.totalRemaining,
		noShows: 0,
	}
}

export async function scanTicket(ticketCode: string, scannerToken: string): Promise<ScanResult> {
	// API returns { success, message } — no data payload. 404 = ticket not found.
	await post("/check-in/scan", { ticketCode, scannerToken })
	return {
		status: "APPROVED",
		ticketTier: "",
		ticketCodeSuffix: ticketCode.slice(-8).toUpperCase(),
		gate: "",
		checkedInAt: new Date().toISOString(),
		entriesAdmitted: 1,
	}
}

export async function lookupBooking(
	token: string,
	query: { bookingId: string } | { ticketCode: string },
): Promise<LookupResult[]> {
	// API returns a single booking object, not an array
	const raw = await get<LookupResult>("/check-in/lookup", { token, ...query })
	return [raw]
}

export async function manualCheckIn(ticketCode: string, scannerToken: string): Promise<ScanResult> {
	// API returns { success, message } — no data payload
	await post("/check-in/manual-check-in", { ticketCode, scannerToken })
	return {
		status: "APPROVED",
		ticketTier: "",
		ticketCodeSuffix: ticketCode.slice(-8).toUpperCase(),
		gate: "",
		checkedInAt: new Date().toISOString(),
		entriesAdmitted: 1,
	}
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
