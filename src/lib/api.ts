const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

export class UserNotFoundError extends Error {
	constructor() {
		super("User not found")
		this.name = "UserNotFoundError"
	}
}

export type UserDetails = {
	id: string
	phone?: string
	email?: string
	firstName?: string
	lastName?: string
}

export type HostRegistrationData = {
	// Personal
	firstName: string
	lastName: string
	phone: string
	email: string
	// Account
	accountType: string
	hostType: string
	// Host profile
	displayName: string
	legalName: string
	bio: string
	tagline: string
	pan: string
	// Categories & languages
	categories: string[]
	languages: string[]
	// Experience
	yearsOfExperience: number
	totalEventsHosted: number
	// Operating cities
	operatingCities: string[]
	// Social
	instagram: string
	// Address
	addressLine1: string
	addressLine2: string
	city: string
	state: string
	pincode: string
}

async function authedFetch(path: string, idToken: string, init?: RequestInit) {
	const res = await fetch(`${API_BASE}${path}`, {
		...init,
		headers: {
			Authorization: `Bearer ${idToken}`,
			"Content-Type": "application/json",
			...init?.headers,
		},
	})
	return res
}

export async function fetchUserDetails(idToken: string): Promise<UserDetails> {
	const res = await authedFetch("/users/me", idToken)
	if (res.status === 404) throw new UserNotFoundError()
	if (!res.ok) throw new Error("Failed to fetch user details")
	return res.json()
}

export async function registerHost(idToken: string, data: HostRegistrationData): Promise<UserDetails> {
	const res = await authedFetch("/hosts/register", idToken, {
		method: "POST",
		body: JSON.stringify(data),
	})
	if (!res.ok) throw new Error("Registration failed")
	return res.json()
}
