import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
	const address = req.nextUrl.searchParams.get("address")
	if (!address) return NextResponse.json({ error: "address required" }, { status: 400 })

	const key = process.env.GOOGLE_MAPS_API_KEY
	if (!key) return NextResponse.json({ error: "server misconfigured" }, { status: 500 })

	const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`
	const res = await fetch(url)
	const data = await res.json()

	if (data.status !== "OK" || !data.results?.[0]) {
		return NextResponse.json({ lat: null, lng: null, city: null })
	}

	const result = data.results[0]
	const lat: number = result.geometry.location.lat
	const lng: number = result.geometry.location.lng
	const cityComp = result.address_components?.find((c: { types: string[]; long_name: string }) =>
		c.types.includes("locality"),
	)

	return NextResponse.json({ lat, lng, city: cityComp?.long_name ?? null })
}
