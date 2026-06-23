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

export type AuthMeData = {
	id: string
	email: string | null
	firstName: string | null
	lastName: string | null
	phone: string | null
	avatarUrl: string | null
	isActive: boolean
	role: { name: string }
	attendeeProfile: unknown | null
	createdAt: string
	updatedAt: string
}

export async function getAuthMe(): Promise<AuthMeData> {
	const { data } = await apiClient.get<{ success: boolean; data: AuthMeData }>("/auth/me")
	return data.data
}

export async function checkPhone(phone: string): Promise<{ exists: boolean }> {
	const { data } = await apiClient.get<{ success: boolean; data: { exists: boolean } }>(
		"/auth/check-phone",
		{ params: { phone } },
	)
	return data.data
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
	hostBio?: string
	tagline?: string
	gender?: string
	legalName: string
	pan: string
	languages?: string[]
	address?: {
		addressLine1: string
		addressLine2?: string
		city: string
		state: string
		pincode: string
		country?: string
	}
	socialLinks?: {
		instagram?: string
		linkedin?: string
		youtube?: string
		website?: string
	}
	portfolioLinks?: string[]
	categoryIds: string[]
	yearsOfExperience: number
	totalEventsPreviouslyHosted: number
	operatingCities: string[]
}

export async function registerHost(payload: RegisterPayload): Promise<void> {
	await apiClient.post("/auth/register", payload)
}

// ─── Attendee registration ────────────────────────────────────────────────────

export type AttendeeInterest = {
	interestId: string
	affinity: "LIKED" | "OPEN_TO" | "DISLIKED"
}

export type AttendeeVibeType = "LIFE_OF_PARTY" | "CHILL_OBSERVING" | "HERE_TO_CONNECT" | "OPEN_TO_WHATEVER"
export type AttendeeSocialStyle = "SOLO_EXPLORER" | "OPEN_TO_MEETING" | "BRINGING_GANG"

export type AttendeeRegisterPayload = {
	firstName: string
	lastName: string
	email: string
	phone?: string
	vibeType?: AttendeeVibeType
	socialStyle?: AttendeeSocialStyle
	interests?: AttendeeInterest[]
}

export async function registerAttendee(payload: AttendeeRegisterPayload): Promise<void> {
	await apiClient.post("/auth/register", { ...payload, accountType: "USER" })
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

// ─── Scanner sessions ─────────────────────────────────────────────────────────

export type CreateScannerSessionPayload = {
	name: string
	email: string
	phone?: string
	label?: string
}

export type ScannerSession = {
	id: string
	eventId: string
	staffName: string
	staffEmail: string
	staffPhone?: string
	label?: string
	isActive: boolean
	expiresAt: string
	createdAt: string
	scannerUrl: string
}

export async function createScannerSession(
	eventId: string,
	payload: CreateScannerSessionPayload,
): Promise<ScannerSession> {
	const { data } = await apiClient.post<{ success: boolean; data: ScannerSession }>(
		`/events/${eventId}/scanner-sessions`,
		payload,
	)
	return data.data
}

export async function getScannerSessions(eventId: string): Promise<ScannerSession[]> {
	const { data } = await apiClient.get<{ success: boolean; data: ScannerSession[] }>(
		`/events/${eventId}/scanner-sessions`,
	)
	return data.data
}

export async function deactivateScannerSession(eventId: string, sessionId: string): Promise<void> {
	await apiClient.patch(`/events/${eventId}/scanner-sessions/${sessionId}/deactivate`)
}

export type CheckInStats = {
	totalAttendees: number
	checkedIn: number
	remaining: number
	bySession: Array<{ sessionId: string; label: string | null; checkedIn: number }>
}

export async function getCheckInStats(eventId: string): Promise<CheckInStats> {
	const { data } = await apiClient.get<{ success: boolean; data: CheckInStats }>(
		`/events/${eventId}/check-in-stats`,
	)
	return data.data
}

export type EventAttendee = {
	firstName: string
	lastName: string
	ticketType: string
	bookingDate: string
	bookingId: string
	amountPaid: string
	isCheckedIn: boolean
	checkedInAt: string | null
}

export type EventAttendeesResponse = {
	attendees: EventAttendee[]
	total: number
	page: number
	limit: number
}

export async function getEventAttendees(
	eventId: string,
	page = 1,
	limit = 20,
): Promise<EventAttendeesResponse> {
	const { data } = await apiClient.get<{ success: boolean; data: EventAttendeesResponse }>(
		`/events/me/${eventId}/attendees`,
		{ params: { page, limit } },
	)
	return data.data
}

// ─── Public events ────────────────────────────────────────────────────────────

import type { ExploreEventsResponse, PublicEventDetails } from "@/types/attendee"

export type PublicEventsParams = {
	city?: string
	categoryId?: string
	interestSlugs?: string[]
	isFree?: boolean
	dateFrom?: string
	dateTo?: string
	search?: string
	sortBy?: "date" | "price"
	sortOrder?: "asc" | "desc"
	page?: number
	limit?: number
}

export async function getPublicEventDetails(id: string): Promise<PublicEventDetails | null> {
	try {
		const res = await fetch(
			`${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${id}/public`,
			{ next: { revalidate: 60 } },
		)
		if (!res.ok) return null
		const json = await res.json()
		return (json.data as PublicEventDetails) ?? null
	} catch {
		return null
	}
}

export async function getPublicEvents(params?: PublicEventsParams): Promise<ExploreEventsResponse> {
	const { interestSlugs, ...rest } = params ?? {}
	const { data } = await apiClient.get<{ success: boolean; data: ExploreEventsResponse }>("/events", {
		params: { ...rest, ...(interestSlugs?.length ? { interestSlugs } : {}) },
		paramsSerializer: { indexes: null },
	})
	return data.data
}

// ─── Attendee profile ─────────────────────────────────────────────────────────

import type { AttendeeProfile } from "@/types/attendee"

export async function getAttendeeProfile(): Promise<AttendeeProfile> {
	const { data } = await apiClient.get<{ success: boolean; data: AttendeeProfile }>("/attendee/profile/me")
	return data.data
}

// ─── Interests ────────────────────────────────────────────────────────────────

export type Interest = {
	id: string
	name: string
	slug: string
	description: string
	image: string
}

export async function getInterests(): Promise<Interest[]> {
	const { data } = await apiClient.get<{ success: boolean; data: Interest[] }>("/interests")
	return data.data
}

// ─── Host dashboard ───────────────────────────────────────────────────────────

import type { DashboardData, DashboardPeriod } from "@/types/dashboard"

export async function getHostDashboard(period?: DashboardPeriod): Promise<DashboardData> {
	const { data } = await apiClient.get<{ success: boolean; data: DashboardData }>(
		"/hosts/me/dashboard",
		{ params: period ? { period } : undefined },
	)
	return data.data
}

// ─── Notifications ────────────────────────────────────────────────────────────

import type { Notification, NotificationsResponse, NotificationsParams } from "@/types/notification"

export async function getNotifications(params?: NotificationsParams): Promise<NotificationsResponse> {
	const { data } = await apiClient.get<{ success: boolean; data: NotificationsResponse }>(
		"/notifications",
		{ params },
	)
	return data.data
}

export async function getUnreadCount(): Promise<number> {
	const { data } = await apiClient.get<{ success: boolean; data: { unreadCount: number } }>(
		"/notifications/unread-count",
	)
	return data.data.unreadCount
}

export async function markNotificationRead(id: string): Promise<void> {
	await apiClient.patch(`/notifications/${id}/read`)
}

export async function markAllNotificationsRead(): Promise<void> {
	await apiClient.patch("/notifications/read-all")
}

export type { Notification, NotificationsResponse }

// ─── Public communities ───────────────────────────────────────────────────────

export type PublicCommunity = {
	id: string
	name: string
	slug: string
	description: string
	type: string
	access: string
	primaryCity: string
	communityCities: string[]
	memberCount: number
	experienceCount: number
	category: { id: string; name: string }
	coverImageUrl: string
	iconUrl: string
}

export type PublicCommunitiesParams = {
	city?: string
	categoryId?: string
	search?: string
	page?: number
	limit?: number
}

export type PublicCommunitiesResponse = {
	data: PublicCommunity[]
	total: number
	page: number
	limit: number
}

export async function getPublicCommunities(params?: PublicCommunitiesParams): Promise<PublicCommunitiesResponse> {
	const { data } = await apiClient.get<{ success: boolean; data: PublicCommunitiesResponse }>(
		"/communities",
		{ params },
	)
	return data.data
}

export type CommunityDetailResponse = {
	id: string
	slug: string
	name: string
	description: string
	type: string
	status: string
	access: string
	memberVisibility: string
	categoryId: string
	primaryCity: string
	communityCities: string[]
	interestTags: string[]
	coverImageKey: string
	iconKey: string
	autoAddMatchingEvents: boolean
	memberCount: number
	experienceCount: number
	createdBy: string
	publishedAt: string | null
	deletedAt: string | null
	createdAt: string
	updatedAt: string
	settings: {
		id: string
		communityId: string
		chatEnabled: boolean
		feedEnabled: boolean
		announcementsEnabled: boolean
		memberDirectoryEnabled: boolean
		experiencesTabEnabled: boolean
		feedPosting: string
		chat: string
		spamDetection: boolean
		toxicContentDetection: boolean
		linkFiltering: boolean
		duplicateContentDetection: boolean
		reportThreshold: number
		dmPolicy: string
		photoSharing: string
		createdAt: string
		updatedAt: string
	}
	category: { id: string; name: string }
	interests: Array<{
		communityId: string
		interestId: string
		interest: { id: string; name: string; slug: string }
	}>
	members: Array<{
		id: string
		communityId: string
		userId: string
		role: string
		status: string
		joinedAt: string
		user: { id: string; firstName: string; lastName: string; email: string; avatarUrl: string | null }
	}>
	events: Array<{
		id: string
		communityId: string
		eventId: string
		source: string
		addedAt: string
		event: { id: string; title: string; city: string; eventDate: string; status: string }
	}>
	coverImageUrl: string
	iconUrl: string
}

export async function getCommunityBySlug(slug: string): Promise<CommunityDetailResponse | null> {
	try {
		const { data } = await apiClient.get<{ success: boolean; data: CommunityDetailResponse }>(
			`/communities/${slug}`,
		)
		return data.data
	} catch {
		return null
	}
}

export async function getRecommendedCommunities(params?: PublicCommunitiesParams): Promise<PublicCommunitiesResponse> {
	const { data } = await apiClient.get<{ success: boolean; data: PublicCommunitiesResponse }>(
		"/communities/recommended",
		{ params },
	)
	return data.data
}

export type ProfileVisibility = "EVENT_ATTENDEES_ONLY" | "COMMUNITY_MEMBERS" | "PRIVATE"

export type JoinCommunityResponse = {
	status: "ACTIVE" | "PENDING"
	profileVisibility: ProfileVisibility
	community: {
		id: string
		name: string
		slug: string
		memberCount: number
		experienceCount: number
		primaryCity: string
		iconUrl: string
	}
}

export async function joinCommunity(
	communityId: string,
	profileVisibility: ProfileVisibility,
): Promise<JoinCommunityResponse> {
	const { data } = await apiClient.post<{ success: boolean; data: JoinCommunityResponse }>(
		`/communities/${communityId}/join`,
		{ profileVisibility, guidelinesAccepted: true },
	)
	return data.data
}

export async function leaveCommunity(communityId: string): Promise<void> {
	await apiClient.delete(`/communities/${communityId}/leave`)
}

export type CommunityMember = {
	userId: string
	firstName: string
	lastName: string
	avatarUrl: string | null
	role: "OWNER" | "ADMIN" | "MEMBER"
	joinedAt: string
}

export type CommunityMembersResponse = {
	data: CommunityMember[]
	total: number
	page: number
	limit: number
}

export async function getCommunityMembers(
	communityId: string,
	params?: { page?: number; limit?: number },
): Promise<CommunityMembersResponse> {
	const { data } = await apiClient.get<{ success: boolean; data: CommunityMembersResponse }>(
		`/communities/${communityId}/members`,
		{ params },
	)
	return data.data
}

export type CommunityEvent = {
	id: string
	title: string
	eventDate: string
	startTime: string
	endTime: string
	city: string
	venueName: string
	fullAddress: string
	isFree: boolean
	minPrice: number
	attendeeCount: number
	status: string
	eventType: string | null
	tags: string[]
	coverImageUrl: string
	source: string
	host: {
		id: string
		displayName: string
		userId: string
		firstName: string
		lastName: string
		avatarUrl: string | null
	}
}

export type CommunityEventsResponse = {
	data: CommunityEvent[]
	total: number
	page: number
	limit: number
}

export type CommunityStats = {
	memberCount: number
	experienceCount: number
	pendingCount: number
	newMembersThisWeek: number
	hostCount: number
}

export async function getCommunityStats(slug: string): Promise<CommunityStats> {
	const { data } = await apiClient.get<{ success: boolean; data: CommunityStats }>(
		`/communities/${slug}/stats`,
	)
	return data.data
}

export type CommunityHost = {
	brandName: string
	avatarUrl: string | null
	eventCount: number
}

export async function getCommunityHosts(slug: string): Promise<CommunityHost[]> {
	const { data } = await apiClient.get<{ success: boolean; data: CommunityHost[] }>(
		`/communities/${slug}/hosts`,
	)
	return data.data
}

export async function getCommunityEvents(
	slug: string,
	params?: { upcoming?: boolean; page?: number; limit?: number },
): Promise<CommunityEventsResponse> {
	const { data } = await apiClient.get<{ success: boolean; data: CommunityEventsResponse }>(
		`/communities/${slug}/events`,
		{ params },
	)
	return data.data
}

// ─── Storage ──────────────────────────────────────────────────────────────────

export type UploadUrlPayload = {
	context: "EVENT_MEDIA" | "USER_AVATAR" | "HOST_DOCUMENT" | "REVIEW_PHOTO"
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

// ─── AI Copilot ───────────────────────────────────────────────────────────────

export type CopilotTicketTier = {
	name: string
	price: number
	currency: string
	total_capacity: number | null
	max_per_person: number
	description: string
	insight: string
}

export type CopilotDraft = {
	title: string
	description: string
	what_to_expect: string[]
	who_should_attend: string[]
	category: string
	category_id: string
	event_type: string
	event_format: string
	language: string
	tags: string[]
	ticket_tiers: CopilotTicketTier[]
	tier_count_reasoning: string
	category_reasoning: string
	suggested_day: string
	suggested_time_of_day: string
	suggested_start_time: string
	suggested_end_time: string
	time_suggestion_reason: string
	confidence_score: number
	ai_suggestions_used: string[]
}

export async function generateEventDraft(prompt: string): Promise<CopilotDraft> {
	const { data } = await apiClient.post<{ success: boolean; data: CopilotDraft }>(
		"/events/copilot/generate-draft",
		{ prompt },
	)
	return data.data
}
