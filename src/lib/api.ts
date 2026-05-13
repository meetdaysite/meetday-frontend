import { isAxiosError } from "axios"
import apiClient from "./axios"
import type { Event, EventDraftPayload, EventsListResponse, ApiEventStatus } from "@/types/event"

// ─── Errors ───────────────────────────────────────────────────────────────────

export class UserNotFoundError extends Error {
	constructor() {
		super("User not found")
		this.name = "UserNotFoundError"
	}
}

// ─── Shared types ─────────────────────────────────────────────────────────────

export type UserDetails = {
	id: string
	phone?: string
	email?: string
	firstName?: string
	lastName?: string
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function checkPhone(phone: string): Promise<{ exists: boolean }> {
	const { data } = await apiClient.get<{ success: boolean; data: { exists: boolean } }>(
		"/auth/check-phone",
		{ params: { phone } },
	)
	return data.data
}

// Kept for Google sign-in paths (login/signup pages)
export async function fetchUserDetails(): Promise<UserDetails> {
	try {
		const { data } = await apiClient.get<{ success: boolean; data: UserDetails }>("/users/me")
		return data.data
	} catch (e) {
		if (isAxiosError(e) && e.response?.status === 404) throw new UserNotFoundError()
		throw e
	}
}

export type UpdateUserPayload = {
	firstName?: string
	lastName?: string
}

export async function updateUserDetails(payload: UpdateUserPayload): Promise<UserDetails> {
	const { data } = await apiClient.patch<{ success: boolean; data: UserDetails }>("/users/me", payload)
	return data.data
}

// ─── Host profile ─────────────────────────────────────────────────────────────

export type HostProfile = {
	id: string
	userId: string
	hostType: "INDIVIDUAL" | "BUSINESS"
	displayName?: string
	legalName?: string
	avatarUrl?: string | null
	gender?: string
	gstin?: string | null
	hostBio?: string | null
	tagline?: string
	languages?: string[]
	socialLinks?: {
		youtube?: string
		instagram?: string
		linkedin?: string
		portfolio?: string
	}
	portfolioLinks?: string[]
	pan?: string
	kycStatus: "PENDING" | "VERIFIED" | "FAILED"
	kycVerifiedAt?: string | null
	kycFailureReason?: string | null
	panVerificationStatus: "PENDING" | "VERIFIED" | "FAILED"
	panVerificationReference?: string
	bankVerificationStatus: "PENDING" | "VERIFIED" | "FAILED"
	approvalStatus: "PENDING" | "APPROVED" | "REJECTED"
	approvedAt?: string | null
	approvedBy?: string | null
	rejectionReason?: string | null
	currentPlan?: "DISCOVER" | "COMMUNITY" | "SELL"
	totalEventsHosted?: number
	averageRating?: number | null
	totalReviews?: number
	yearsOfExperience?: number
	totalEventsPreviouslyHosted?: number
	operatingCities?: string[]
	categories?: Array<{
		hostProfileId: string
		categoryId: string
		category: {
			id: string
			name: string
			description: string
			isActive: boolean
		}
	}>
	address?: {
		id?: string
		addressLine1: string
		addressLine2?: string
		city: string
		state: string
		pincode: string
		country?: string
	}
}

export type UpdateHostProfilePayload = {
	avatarUrl?: string
	displayName?: string
	hostBio?: string
	tagline?: string
	gender?: string
	yearsOfExperience?: number
	totalEventsPreviouslyHosted?: number
	operatingCities?: string[]
	categoryIds?: string[]
	socialLinks?: {
		youtube?: string
		instagram?: string
		linkedin?: string
		portfolio?: string
	}
	address?: {
		addressLine1: string
		addressLine2?: string
		city: string
		state: string
		pincode: string
		country?: string
	}
}

export async function getHostProfile(): Promise<HostProfile> {
	const { data } = await apiClient.get<{ success: boolean; data: HostProfile }>("/hosts/me")
	return data.data
}

export async function updateHostProfile(payload: UpdateHostProfilePayload): Promise<HostProfile> {
	const { data } = await apiClient.patch<{ success: boolean; data: HostProfile }>("/hosts/profile", payload)
	return data.data
}

// ─── Registration ─────────────────────────────────────────────────────────────

export type RegisterPayload = {
	firstName: string
	lastName: string
	email: string
	phone?: string
	accountType: "HOST"
	hostType: "INDIVIDUAL" | "BUSINESS"
	displayName?: string
	bio?: string
	tagline?: string
	gender?: string
	legalName: string
	pan: string
	address?: {
		addressLine1: string
		addressLine2?: string
		city: string
		state: string
		pincode: string
	}
	socialLinks?: {
		instagram?: string
		linkedin?: string
		youtube?: string
		portfolio?: string
	}
	categoryIds: string[]
	yearsOfExperience: number
	totalEventsPreviouslyHosted: number
	operatingCities: string[]
}

export async function registerHost(payload: RegisterPayload): Promise<void> {
	await apiClient.post("/auth/register", payload)
}

// ─── KYC ──────────────────────────────────────────────────────────────────────

export type PanVerifyResult = {
	referenceId: string
	panVerificationStatus: "VERIFIED" | "FAILED" | "PENDING"
	failureReason: string | null
}

export async function verifyPan(): Promise<PanVerifyResult> {
	const { data } = await apiClient.post<{ success: boolean; data: PanVerifyResult }>(
		"/hosts/kyc/pan/verify",
	)
	return data.data
}

export type BankVerifyPayload = {
	bankAccount: {
		accountNumber: string
		ifscCode: string
		accountHolderName: string
		bankName: string
	}
}

export type BankKycResult = {
	panReferenceId: string
	pennyDropReference: string | null
	kycStatus: "PENDING" | "VERIFIED" | "FAILED"
	panVerificationStatus: "PENDING" | "VERIFIED" | "FAILED"
	bankVerificationStatus: "PENDING" | "VERIFIED" | "FAILED"
	kycFailureReason: string | null
}

export async function verifyBankAccount(payload: BankVerifyPayload): Promise<BankKycResult> {
	const { data } = await apiClient.post<{ success: boolean; data: BankKycResult }>(
		"/hosts/kyc/bank/verify",
		payload,
	)
	return data.data
}

// ─── Categories ───────────────────────────────────────────────────────────────

export type Category = {
	id: string
	name: string
	description: string
}

export async function getCategories(): Promise<Category[]> {
	const { data } = await apiClient.get<{ success: boolean; data: Category[] }>("/categories")
	return data.data
}

// ─── Subscription plans ───────────────────────────────────────────────────────

export type SubscriptionPlan = {
	id: string
	plan: "DISCOVER" | "COMMUNITY" | "SELL"
	yearlyPrice: number | null
	monthlyPrice: number | null
	platformFeeRate: number
	isActive: boolean
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
	const { data } = await apiClient.get<{ success: boolean; data: SubscriptionPlan[] }>(
		"/hosts/subscription/plans",
	)
	return data.data
}

// ─── Events ───────────────────────────────────────────────────────────────────

export type { Event, EventDraftPayload, EventsListResponse, ApiEventStatus }

export async function createEventDraft(payload: EventDraftPayload = {}): Promise<Event> {
	const { data } = await apiClient.post<{ success: boolean; data: Event }>("/events", payload)
	return data.data
}

export async function getMyEvents(params?: {
	status?: ApiEventStatus
	page?: number
	limit?: number
}): Promise<EventsListResponse> {
	const { data } = await apiClient.get<{ success: boolean; data: EventsListResponse }>(
		"/events/me",
		{ params },
	)
	return data.data
}

export async function getMyEventDetail(id: string): Promise<Event> {
	const { data } = await apiClient.get<{ success: boolean; data: Event }>(`/events/me/${id}`)
	return data.data
}

export async function updateEventDraft(id: string, payload: EventDraftPayload): Promise<Event> {
	const { data } = await apiClient.patch<{ success: boolean; data: Event }>(
		`/events/${id}`,
		payload,
	)
	return data.data
}

export async function submitEventForReview(id: string): Promise<Event> {
	const { data } = await apiClient.patch<{ success: boolean; data: Event }>(
		`/events/${id}/submit`,
	)
	return data.data
}

export async function deleteEventDraft(id: string): Promise<void> {
	await apiClient.delete(`/events/${id}`)
}

export async function cancelEvent(id: string, cancellationReason: string): Promise<Event> {
	const { data } = await apiClient.patch<{ success: boolean; data: Event }>(
		`/events/${id}/cancel`,
		{ cancellationReason },
	)
	return data.data
}

// ─── Storage ──────────────────────────────────────────────────────────────────

export type UploadUrlPayload = {
	context: "EVENT_MEDIA" | "USER_AVATAR" | "HOST_DOCUMENT"
	contentType: string
	resourceId?: string
	mediaType?: string
}

export type UploadUrlResponse = {
	url: string
	key: string
}

export async function getUploadUrl(payload: UploadUrlPayload): Promise<UploadUrlResponse> {
	const { data } = await apiClient.post<{ success: boolean; data: { uploadUrl: string; key: string } }>(
		"/storage/upload-url",
		payload,
	)
	return { url: data.data.uploadUrl, key: data.data.key }
}
