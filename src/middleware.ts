import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Attendee feature is fully blocked for now — every /attendee/* route bounces to the
// homepage instead of rendering, regardless of auth state or deep link.
export function middleware(request: NextRequest) {
	return NextResponse.redirect(new URL("/", request.url))
}

export const config = {
	matcher: ["/attendee/:path*"],
}
