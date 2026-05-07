import { isAxiosError } from "axios"
import apiClient from "./axios"

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
	firstName: string
	lastName: string
	phone: string
	email: string
	accountType: string
	hostType: string
	displayName: string
	legalName: string
	bio: string
	tagline: string
	pan: string
	categories: string[]
	languages: string[]
	yearsOfExperience: number
	totalEventsHosted: number
	operatingCities: string[]
	instagram: string
	addressLine1: string
	addressLine2: string
	city: string
	state: string
	pincode: string
}

export async function fetchUserDetails(): Promise<UserDetails> {
	try {
		const { data } = await apiClient.get<UserDetails>("/users/me")
		return data
	} catch (e) {
		if (isAxiosError(e) && e.response?.status === 404) throw new UserNotFoundError()
		throw e
	}
}

export async function registerHost(data: HostRegistrationData): Promise<UserDetails> {
	const { data: result } = await apiClient.post<UserDetails>("/hosts/register", data)
	return result
}
