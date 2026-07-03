import { NextRequest, NextResponse } from "next/server"

const BACKEND = process.env.NEXT_PUBLIC_API_BASE_URL

async function proxy(req: NextRequest, path: string[]): Promise<NextResponse> {
	if (!BACKEND) {
		return NextResponse.json({ success: false, message: "Backend unreachable" }, { status: 502 })
	}

	const segment = path.join("/")
	const backendUrl = new URL(`${BACKEND}/check-in/${segment}`)

	// Forward query params
	req.nextUrl.searchParams.forEach((value, key) => {
		backendUrl.searchParams.set(key, value)
	})

	const isPost = req.method === "POST"
	const body = isPost ? await req.text() : undefined

	let res: Response
	try {
		res = await fetch(backendUrl.toString(), {
			method: req.method,
			headers: { "Content-Type": "application/json" },
			...(body ? { body } : {}),
		})
	} catch {
		return NextResponse.json({ success: false, message: "Backend unreachable" }, { status: 502 })
	}

	const data = await res.json().catch(() => ({}))
	return NextResponse.json(data, { status: res.status })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
	const { path } = await params
	return proxy(req, path)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
	const { path } = await params
	return proxy(req, path)
}
