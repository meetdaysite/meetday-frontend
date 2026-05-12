import { isAxiosError } from "axios"
import apiClient from "./axios"

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
		const { data } = await apiClient.get<UserDetails>("/users/me")
		return data
	} catch (e) {
		if (isAxiosError(e) && e.response?.status === 404) throw new UserNotFoundError()
		throw e
	}
}

// ─── Host profile ─────────────────────────────────────────────────────────────

export type HostProfile = {
	id: string
	userId: string
	hostType: "INDIVIDUAL" | "BUSINESS"
	displayName?: string
	legalName?: string
	kycStatus: "PENDING" | "VERIFIED" | "FAILED"
	panVerificationStatus: "PENDING" | "VERIFIED" | "FAILED"
	bankVerificationStatus: "PENDING" | "VERIFIED" | "FAILED"
	approvalStatus: "PENDING" | "APPROVED" | "REJECTED"
	currentPlan?: "DISCOVER" | "COMMUNITY" | "SELL"
	yearsOfExperience?: number
	totalEventsPreviouslyHosted?: number
	operatingCities?: string[]
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
