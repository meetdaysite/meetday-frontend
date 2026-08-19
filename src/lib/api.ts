import apiClient from "./axios"
import type { Event, EventDraftPayload, EventsListResponse, ApiEventStatus, EventRevision, UpdatePublishedEventPayload } from "@/types/event"

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
	// One login can hold host, brand, and admin access at once — these report what this
	// identity actually has, independent of the single primary `role` above.
	hasHostAccess: boolean
	hasBrandAccess: boolean
	adminRole: string | null
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

export async function deleteAccount(reason?: string): Promise<{ message: string }> {
	const { data } = await apiClient.delete<{ message: string }>("/users/me", {
		data: reason ? { reason } : {},
	})
	return data
}

// ─── Host profile ─────────────────────────────────────────────────────────────

export type HostProfile = {
	id: string
	userId: string
	hostType: "INDIVIDUAL" | "BUSINESS"
	displayName?: string
	legalName?: string
	communityName?: string | null
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
		website?: string
	}
	portfolioLinks?: string[]
	pan?: string
	kycStatus: "NOT_SUBMITTED" | "PENDING" | "VERIFIED" | "FAILED"
	kycVerifiedAt?: string | null
	kycFailureReason?: string | null
	panVerificationStatus: "NOT_SUBMITTED" | "PENDING" | "VERIFIED" | "FAILED"
	panVerificationReference?: string
	bankVerificationStatus: "NOT_SUBMITTED" | "PENDING" | "VERIFIED" | "FAILED"
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
	phone?: string | null
	email?: string | null
}

export type UpdateHostProfilePayload = {
	avatarUrl?: string | null
	displayName?: string
	communityName?: string | null
	email?: string
	hostType?: "INDIVIDUAL" | "BUSINESS"
	hostBio?: string
	tagline?: string
	gender?: string
	pan?: string
	legalName?: string
	gstin?: string | null
	languages?: string[]
	portfolioLinks?: string[]
	yearsOfExperience?: number
	totalEventsPreviouslyHosted?: number
	operatingCities?: string[]
	categoryIds?: string[]
	socialLinks?: {
		youtube?: string
		instagram?: string
		linkedin?: string
		website?: string
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

export type CompanyType = "BRAND" | "AGENCY"

export type BrandProfile = {
	id: string
	userId: string
	brandName: string
	socialLinks?: {
		instagram?: string
		linkedin?: string
		youtube?: string
		website?: string
	}
	workEmail?: string | null
	contactPhone?: string | null
	logoKey?: string | null
	logoUrl?: string | null
	companyType?: CompanyType | null
	aboutCompany?: string | null
	industry?: string | null
	categories: Category[]
	isProfileComplete: boolean
	approvalStatus?: "PENDING" | "APPROVED" | "REJECTED"
	phone?: string | null
	email?: string | null
	firstName?: string
	lastName?: string
	createdAt?: string
	updatedAt?: string
}

export type UpdateBrandProfilePayload = {
	brandName?: string
	categoryIds?: string[]
	socialLinks?: {
		instagram?: string
		linkedin?: string
		youtube?: string
		website?: string
	}
	workEmail?: string
	contactPhone?: string
	logoKey?: string
	companyType?: CompanyType
	aboutCompany?: string
	industry?: string
}

export async function getBrandProfile(): Promise<BrandProfile> {
	const { data } = await apiClient.get<{ success: boolean; data: BrandProfile }>("/brands/me")
	return data.data
}

export async function updateBrandProfile(payload: UpdateBrandProfilePayload): Promise<BrandProfile> {
	const { data } = await apiClient.patch<{ success: boolean; data: BrandProfile }>("/brands/me", payload)
	return data.data
}

export type BrandCommunity = {
	id: string
	hostProfileId: string
	name: string
	about: string
	logoUrl: string | null
	size: string
	avgGuestCount: string
	experiencesPerYear: string
	operatingCities: string[]
	socialLinks?: {
		instagram?: string
		linkedin?: string
		youtube?: string
		website?: string
	} | null
	categories: Category[]
	secondaryImageKey?: string | null
	secondaryImageUrl?: string | null
}

export async function getBrandCommunities(): Promise<{ communities: BrandCommunity[]; total: number }> {
	const { data } = await apiClient.get<{ success: boolean; data: { communities: BrandCommunity[]; total: number } }>(
		"/sponsorships/communities",
	)
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
	communityName?: string
	hostBio?: string
	tagline?: string
	gender?: string
	legalName?: string
	pan?: string
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

// Brands are a separate, minimal account type on the backend — just contact identity + brand name.
export type BrandRegisterPayload = {
	firstName: string
	lastName: string
	email: string
	phone?: string
	accountType: "BRAND"
	brandName?: string
	categoryIds?: string[]
	socialLinks?: {
		instagram?: string
		linkedin?: string
		youtube?: string
		website?: string
	}
}

export async function registerBrand(payload: BrandRegisterPayload): Promise<void> {
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

// ─── Reapply ──────────────────────────────────────────────────────────────────

export type ReapplyResult = {
	id: string
	kycStatus: "NOT_SUBMITTED" | "PENDING" | "VERIFIED" | "FAILED"
	panVerificationStatus: "NOT_SUBMITTED" | "PENDING" | "VERIFIED" | "FAILED"
	bankVerificationStatus: "NOT_SUBMITTED" | "PENDING" | "VERIFIED" | "FAILED"
	approvalStatus: "PENDING" | "APPROVED" | "REJECTED"
	kycFailureReason: string | null
	rejectionReason: string | null
}

// Allowed only when kycStatus is FAILED or approvalStatus is REJECTED — resets
// KYC/approval state so the host can resubmit via the KYC verify endpoints.
export async function reapplyAsHost(): Promise<ReapplyResult> {
	const { data } = await apiClient.post<{ success: boolean; data: ReapplyResult }>("/hosts/reapply")
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

export type { Event, EventDraftPayload, EventsListResponse, ApiEventStatus, EventRevision, UpdatePublishedEventPayload }

export async function createEventDraft(payload: EventDraftPayload = {}): Promise<Event> {
	const { data } = await apiClient.post<{ success: boolean; data: Event }>("/events", payload)
	return data.data
}

export async function getMyEvents(params?: {
	status?: ApiEventStatus
	page?: number
	limit?: number
}): Promise<EventsListResponse> {
	let response: EventsListResponse = { events: [], total: 0, page: params?.page || 1, limit: params?.limit || 10 }
	try {
		const { data } = await apiClient.get<{ success: boolean; data: EventsListResponse }>(
			"/events/me",
			{ params },
		)
		response = data.data
	} catch (err) {
		/* ignore and fallback to local mocks */
	}

	try {
		const stored = localStorage.getItem("mock_created_events")
		if (stored) {
			const mockEventsMap: Record<string, Event> = JSON.parse(stored)
			const mockEventsList = Object.values(mockEventsMap)
			const filteredMock = params?.status
				? mockEventsList.filter(e => e.status === params.status)
				: mockEventsList

			// Merge so locally created events show up at the top
			response.events = [...filteredMock, ...response.events.filter(e => !mockEventsMap[e.id])]
			response.total = response.total + filteredMock.length
		}
	} catch {
		/* ignore */
	}

	return response
}

export async function getMyEventDetail(id: string): Promise<Event> {
	try {
		const { data } = await apiClient.get<{ success: boolean; data: Event }>(`/events/me/${id}`)
		return data.data
	} catch (err) {
		try {
			const stored = localStorage.getItem("mock_created_events")
			if (stored) {
				const mockEventsMap: Record<string, Event> = JSON.parse(stored)
				if (mockEventsMap[id]) {
					return mockEventsMap[id]
				}
			}
		} catch {
			/* ignore */
		}
		throw err
	}
}

export async function updateEventDraft(id: string, payload: EventDraftPayload): Promise<Event> {
	const { data } = await apiClient.patch<{ success: boolean; data: Event }>(
		`/events/${id}`,
		payload,
	)
	return data.data
}

export async function reviseEvent(id: string, payload: UpdatePublishedEventPayload): Promise<EventRevision> {
	const { data } = await apiClient.patch<{ success: boolean; data: EventRevision }>(
		`/events/${id}/revision`,
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

// ─── Sponsorship proposals ────────────────────────────────────────────────────

export type SponsorshipStatus = "DRAFT" | "UNDER_REVIEW" | "REJECTED" | "PUBLISHED"

export type SponsorTier = {
	name: string
	price: string
}

export type SponsorshipProposalPayload = {
	name?: string
	about?: string
	imageKey?: string
	eventDate?: string
	eventEndDate?: string
	venue?: string
	venues?: string[]
	venueCities?: string[]
	city?: string
	audienceProfile?: string[]
	ageGroup?: string
	guestCount?: string
	docKey?: string
	videoUrl?: string
	docName?: string
	docType?: string
	docSize?: number
	sponsorTiers?: SponsorTier[]
}

export type SponsorshipProposal = {
	id: string
	hostProfileId: string
	name: string | null
	about: string | null
	imageKey: string | null
	imageUrl?: string | null
	eventDate: string | null
	eventEndDate: string | null
	venue: string | null
	venues: string[]
	venueCities: string[]
	city: string | null
	audienceProfile: string[]
	ageGroup: string | null
	guestCount: string | null
	docKey: string | null
	docUrl?: string | null
	docName: string | null
	docType: string | null
	docSize: number | null
	videoUrl: string | null
	sponsorTiers: SponsorTier[]
	status: SponsorshipStatus
	pendingRevision: (SponsorshipProposalPayload & { imageUrl?: string | null; docUrl?: string | null }) | null
	adminRejectionRemark: string | null
	submittedAt: string | null
	createdAt: string
	updatedAt: string
}

export type SponsorshipProposalsListResponse = {
	proposals: SponsorshipProposal[]
	total: number
	page: number
	limit: number
}

export async function createSponsorshipProposal(
	payload: SponsorshipProposalPayload = {},
): Promise<SponsorshipProposal> {
	const { data } = await apiClient.post<{ success: boolean; data: SponsorshipProposal }>(
		"/sponsorships",
		payload,
	)
	return data.data
}

export async function updateSponsorshipProposal(
	id: string,
	payload: SponsorshipProposalPayload,
): Promise<SponsorshipProposal> {
	const { data } = await apiClient.patch<{ success: boolean; data: SponsorshipProposal }>(
		`/sponsorships/${id}`,
		payload,
	)
	return data.data
}

export async function getMySponsorshipProposals(params?: {
	status?: SponsorshipStatus
	page?: number
	limit?: number
}): Promise<SponsorshipProposalsListResponse> {
	const { data } = await apiClient.get<{ success: boolean; data: SponsorshipProposalsListResponse }>(
		"/sponsorships/me",
		{ params },
	)
	return data.data
}

export async function getSponsorshipProposalDetail(id: string): Promise<SponsorshipProposal> {
	const { data } = await apiClient.get<{ success: boolean; data: SponsorshipProposal }>(
		`/sponsorships/${id}`,
	)
	return data.data
}

export async function submitSponsorshipProposal(id: string): Promise<SponsorshipProposal> {
	const { data } = await apiClient.patch<{ success: boolean; data: SponsorshipProposal }>(
		`/sponsorships/${id}/submit`,
	)
	return data.data
}

export async function deleteSponsorshipProposal(id: string): Promise<void> {
	await apiClient.delete(`/sponsorships/${id}`)
}

// ─── Brand: browse published sponsorship proposals ────────────────────────────

export type PublishedSponsorshipProposal = SponsorshipProposal & {
	hostProfile: {
		id: string
		displayName?: string
		user: { firstName: string; lastName: string }
		categories: Category[]
	}
}

export type PublishedSponsorshipsResponse = {
	proposals: PublishedSponsorshipProposal[]
	total: number
}

export async function getAllPublishedSponsorships(
	categoryId?: string,
): Promise<PublishedSponsorshipsResponse> {
	const { data } = await apiClient.get<{ success: boolean; data: PublishedSponsorshipsResponse }>(
		"/sponsorships/published",
		{ params: categoryId ? { categoryId } : undefined },
	)
	return data.data
}

export type SponsorshipCommunityProfile = {
	id: string
	name: string
	about: string
	logoUrl: string | null
	size: string
	avgGuestCount: string
	experiencesPerYear: string
	categories: Category[]
}

export type PublishedSponsorshipDetail = SponsorshipProposal & {
	hostProfile: {
		id: string
		displayName?: string
		operatingCities?: string[]
		socialLinks?: {
			instagram?: string
			linkedin?: string
			youtube?: string
			website?: string
		} | null
		user: { firstName: string; lastName: string }
	}
	community: SponsorshipCommunityProfile | null
}

export async function getPublishedSponsorshipDetail(id: string): Promise<PublishedSponsorshipDetail> {
	const { data } = await apiClient.get<{ success: boolean; data: PublishedSponsorshipDetail }>(
		`/sponsorships/published/${id}`,
	)
	return data.data
}

export async function markSponsorshipInterest(
	id: string,
): Promise<{ message: string; alreadyInterested: boolean }> {
	const { data } = await apiClient.post<{
		success: boolean
		data: { message: string; alreadyInterested: boolean }
	}>(`/sponsorships/published/${id}/interest`)
	return data.data
}

// ─── TriChat: Host ↔ Brand (+ Admin) chat tied to a sponsorship interest ────────

export type SponsorshipChatStatus = "REQUESTED" | "ACCEPTED"
export type ChatSenderType = "HOST" | "BRAND" | "ADMIN"

export type SponsorshipChatThread = {
	id: string
	proposalId: string
	proposalName: string
	chatStatus: SponsorshipChatStatus
	createdAt: string
	chatAcceptedAt: string | null
	lastMessageAt: string | null
	lastMessagePreview: string | null
	counterpartName: string
	unreadCount: number
	counterpartAvatarUrl?: string | null
}

export type SponsorshipChatMessage = {
	id: string
	senderType: ChatSenderType
	senderId: string
	messageType?: "TEXT" | "SYSTEM"
	content: string
	mediaUrl?: string | null
	createdAt: string
	wasRedacted?: boolean
	hostReadAt?: string | null
	brandReadAt?: string | null
}

export async function getMySponsorshipChats(status?: SponsorshipChatStatus): Promise<SponsorshipChatThread[]> {
	const { data } = await apiClient.get<{ success: boolean; data: SponsorshipChatThread[] }>(
		"/sponsorships/chats",
		{ params: status ? { status } : undefined },
	)
	return data.data
}

export async function getSponsorshipChatMessages(
	interestId: string,
): Promise<{ messages: SponsorshipChatMessage[]; chatStatus: SponsorshipChatStatus }> {
	const { data } = await apiClient.get<{
		success: boolean
		data: { messages: SponsorshipChatMessage[]; chatStatus: SponsorshipChatStatus }
	}>(`/sponsorships/chats/${interestId}/messages`)
	return data.data
}

export async function sendSponsorshipChatMessage(
	interestId: string,
	payload: { content?: string; mediaKey?: string },
): Promise<SponsorshipChatMessage> {
	const { data } = await apiClient.post<{ success: boolean; data: SponsorshipChatMessage }>(
		`/sponsorships/chats/${interestId}/messages`,
		payload,
	)
	return data.data
}

export async function acceptSponsorshipChatRequest(
	interestId: string,
): Promise<{ message: string; chatStatus: SponsorshipChatStatus }> {
	const { data } = await apiClient.post<{
		success: boolean
		data: { message: string; chatStatus: SponsorshipChatStatus }
	}>(`/sponsorships/chats/${interestId}/accept`)
	return data.data
}

// ─── Deal Lock: negotiated final terms, host fills in, brand approves ─────────

export type SponsorshipDealStatus = "PENDING_APPROVAL" | "CHANGES_REQUESTED" | "APPROVED"

export type SponsorshipDeal = {
	id: string
	sponsorshipInterestId: string
	eventName: string
	eventDate: string
	eventTime: string | null
	venue: string
	finalAmount: string | number
	deliverables: string
	otherTerms: string | null
	additionalNotes: string | null
	status: SponsorshipDealStatus
	version: number
	changeRequestNote: string | null
	approvedAt: string | null
	createdAt: string
	updatedAt: string
}

export type SponsorshipDealPayload = {
	eventName: string
	eventDate: string
	eventTime?: string
	venue: string
	finalAmount: number
	deliverables: string
	otherTerms?: string
	additionalNotes?: string
}

export async function getSponsorshipDeal(interestId: string): Promise<SponsorshipDeal | null> {
	const { data } = await apiClient.get<{ success: boolean; data: SponsorshipDeal | null }>(
		`/sponsorships/chats/${interestId}/deal`,
	)
	return data.data
}

export async function createSponsorshipDeal(
	interestId: string,
	payload: SponsorshipDealPayload,
): Promise<SponsorshipDeal> {
	const { data } = await apiClient.post<{ success: boolean; data: SponsorshipDeal }>(
		`/sponsorships/chats/${interestId}/deal`,
		payload,
	)
	return data.data
}

export async function updateSponsorshipDeal(
	interestId: string,
	payload: SponsorshipDealPayload,
): Promise<SponsorshipDeal> {
	const { data } = await apiClient.patch<{ success: boolean; data: SponsorshipDeal }>(
		`/sponsorships/chats/${interestId}/deal`,
		payload,
	)
	return data.data
}

export async function approveSponsorshipDeal(interestId: string): Promise<SponsorshipDeal> {
	const { data } = await apiClient.post<{ success: boolean; data: SponsorshipDeal }>(
		`/sponsorships/chats/${interestId}/deal/approve`,
	)
	return data.data
}

export async function requestSponsorshipDealChanges(
	interestId: string,
	payload: { note?: string },
): Promise<SponsorshipDeal> {
	const { data } = await apiClient.post<{ success: boolean; data: SponsorshipDeal }>(
		`/sponsorships/chats/${interestId}/deal/request-changes`,
		payload,
	)
	return data.data
}

// ─── "Talk to Meetday" general support chat — one thread per user, separate from TriChat ──

export type MeetdayChatMessage = {
	id: string
	senderType: "USER" | "ADMIN"
	senderId: string
	content: string
	mediaUrl?: string | null
	createdAt: string
	wasRedacted?: boolean
	hostReadAt?: string | null
	brandReadAt?: string | null
}

export async function getMyMeetdayChat(): Promise<{ messages: MeetdayChatMessage[] }> {
	const { data } = await apiClient.get<{ success: boolean; data: { messages: MeetdayChatMessage[] } }>(
		"/meetday-chat/messages",
	)
	return data.data
}

export async function sendMeetdayChatMessage(payload: { content?: string; mediaKey?: string }): Promise<MeetdayChatMessage> {
	const { data } = await apiClient.post<{ success: boolean; data: MeetdayChatMessage }>(
		"/meetday-chat/messages",
		payload,
	)
	return data.data
}

// ─── Host community profile (shown to sponsors) ───────────────────────────────

export type HostCommunityProfilePayload = {
	name: string
	about: string
	logoKey: string
	size: string
	avgGuestCount: string
	experiencesPerYear: string
	categoryIds: string[]
	secondaryImageKey?: string
	pastEvents?: PastEventPayload[]
}

export type PastEventPayload = {
	name?: string
	description?: string
	imageKeys?: string[]
}

export type PastEvent = {
	name: string | null
	description: string | null
	imageKeys: string[]
	imageUrls: string[]
}

export type HostCommunityProfile = {
	id: string
	hostProfileId: string
	name: string
	about: string
	logoKey: string
	logoUrl: string
	secondaryImageKey?: string | null
	secondaryImageUrl?: string | null
	size: string
	avgGuestCount: string
	experiencesPerYear: string
	categories: Category[]
	pastEvents?: PastEvent[]
	approvalStatus: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED"
	adminRejectionRemark: string | null
	pendingRevision?: Record<string, unknown> | null
	activatedAt: string
	createdAt: string
	updatedAt: string
}

export async function getHostCommunityProfile(): Promise<HostCommunityProfile | null> {
	const { data } = await apiClient.get<{ success: boolean; data: HostCommunityProfile | null }>(
		"/hosts/community",
	)
	return data.data
}

export async function activateHostCommunityProfile(
	payload: HostCommunityProfilePayload,
): Promise<HostCommunityProfile> {
	const { data } = await apiClient.post<{ success: boolean; data: HostCommunityProfile }>(
		"/hosts/community",
		payload,
	)
	return data.data
}

export async function deactivateHostCommunityProfile(): Promise<void> {
	await apiClient.delete("/hosts/community")
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

import type { ExploreEventsResponse, PublicEventDetails, SavedEventsResponse } from "@/types/attendee"

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
		const { data } = await apiClient.get<{ success: boolean; data: PublicEventDetails }>(`/events/${id}/public`)
		return data.data ?? null
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

export async function getSavedEvents(params?: { page?: number; limit?: number }): Promise<SavedEventsResponse> {
	const { data } = await apiClient.get<{ success: boolean; data: SavedEventsResponse }>("/events/saved", { params })
	return data.data
}

export async function saveEvent(eventId: string): Promise<void> {
	await apiClient.post(`/events/${eventId}/save`)
}

export async function unsaveEvent(eventId: string): Promise<void> {
	await apiClient.delete(`/events/${eventId}/save`)
}

import type { VibeMatchResponse, CrowdPulseResponse } from "@/types/attendee"

export async function getEventVibeMatch(eventId: string): Promise<VibeMatchResponse> {
	const { data } = await apiClient.post<{ success: boolean; data: VibeMatchResponse }>(
		`/events/${eventId}/vibe-match`,
		{},
	)
	return data.data
}

export async function getEventCrowdPulse(eventId: string): Promise<CrowdPulseResponse> {
	const { data } = await apiClient.get<{ success: boolean; data: CrowdPulseResponse }>(
		`/events/${eventId}/crowd-pulse`,
	)
	return data.data
}

// ─── Attendee profile ─────────────────────────────────────────────────────────

import type { AttendeeProfile } from "@/types/attendee"

export async function getAttendeeProfile(): Promise<AttendeeProfile> {
	const { data } = await apiClient.get<{ success: boolean; data: AttendeeProfile }>("/attendee/profile/me")
	return data.data
}

// Fields mirror the POST/PATCH /attendee/profile request body. Response shapes for
// these two endpoints aren't strictly typed yet — kept generic (AttendeeProfile) pending
// backend confirmation of the full enum lists for ageRange/gender/privacy.
export type UpdateAttendeeProfilePayload = {
	username?: string
	bio?: string
	city?: string
	ageRange?: string
	gender?: string
	profession?: string
	vibeType?: AttendeeVibeType
	socialStyle?: AttendeeSocialStyle
	privacy?: string
	avatarKey?: string
}

export async function updateAttendeeProfile(payload: UpdateAttendeeProfilePayload): Promise<AttendeeProfile> {
	const { data } = await apiClient.patch<{ success: boolean; data: AttendeeProfile }>(
		"/attendee/profile",
		payload,
	)
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

export type AttendeeInterestAffinity = {
	interestId: string
	name: string
	slug: string
	image: string
	affinity: "LIKED" | "OPEN_TO" | "DISLIKED"
}

export async function getAttendeeInterests(): Promise<AttendeeInterestAffinity[]> {
	const { data } = await apiClient.get<{ success: boolean; data: { interests: AttendeeInterestAffinity[]; total: number } }>(
		"/attendee/interests",
	)
	return data.data.interests
}

export async function updateAttendeeInterests(interests: AttendeeInterest[]): Promise<AttendeeInterestAffinity[]> {
	const { data } = await apiClient.put<{ success: boolean; data: { interests: AttendeeInterestAffinity[]; total: number } }>(
		"/attendee/interests",
		{ interests },
	)
	return data.data.interests
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
	isMember: boolean
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
	isMember: boolean
	isSaved: boolean
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

export async function leaveCommunity(communityId: string): Promise<{ success: boolean }> {
	const { data } = await apiClient.delete<{ success: boolean; data: { success: boolean } }>(
		`/communities/${communityId}/leave`,
	)
	return data.data
}

export async function saveCommunity(communityId: string): Promise<{ saved: boolean }> {
	const { data } = await apiClient.post<{ success: boolean; data: { saved: boolean } }>(
		`/communities/${communityId}/save`,
	)
	return data.data
}

export async function unsaveCommunity(communityId: string): Promise<{ saved: boolean }> {
	const { data } = await apiClient.delete<{ success: boolean; data: { saved: boolean } }>(
		`/communities/${communityId}/save`,
	)
	return data.data
}

export interface SavedCommunity extends PublicCommunity {
	isSaved: true
}

export interface CommunitiesPageResponse {
	data: PublicCommunity[]
	total: number
	page: number
	limit: number
}

export async function getJoinedCommunities(params?: {
	page?: number
	limit?: number
}): Promise<CommunitiesPageResponse> {
	const { data } = await apiClient.get<{ success: boolean; data: CommunitiesPageResponse }>(
		"/communities/joined",
		{ params },
	)
	return data.data
}

export async function getSavedCommunities(params?: {
	page?: number
	limit?: number
}): Promise<CommunitiesPageResponse> {
	const { data } = await apiClient.get<{ success: boolean; data: CommunitiesPageResponse }>(
		"/communities/saved",
		{ params },
	)
	return data.data
}

export type CommunityRole = "OWNER" | "MANAGER" | "HOST" | "MODERATOR" | "MEMBER"

export type CommunityMember = {
	userId: string
	firstName: string
	lastName: string
	avatarUrl: string | null
	role: CommunityRole
	badge?: MemberBadge | null
	isOnline?: boolean
	isMe?: boolean
	joinedAt: string
	city?: string | null
	interestTags?: { id: string; name: string }[]
	eventsAttendedCount?: number
}

export type CommunityMembersResponse = {
	data: CommunityMember[]
	total: number
	page: number
	limit: number
}

export async function getCommunityMembers(
	communityId: string,
	params?: { page?: number; limit?: number; filter?: string; sort?: string; search?: string },
): Promise<CommunityMembersResponse> {
	const { data } = await apiClient.get<{ success: boolean; data: CommunityMembersResponse }>(
		`/communities/${communityId}/members`,
		{ params },
	)
	return data.data
}

export type MemberBadge = "NEW_MEMBER" | "TOP_CONTRIBUTOR" | "ACTIVE_MEMBER"

export type MemberDetailCard = {
	userId: string
	firstName: string
	lastName: string
	avatarUrl: string | null
	role: CommunityRole
	badge: MemberBadge | null
	isOnline: boolean
	joinedAt: string
	dmStatus: "none" | "intro_sent" | "intro_received" | "connected"
	city: string | null
	restricted: boolean
	// present when restricted === false
	vibe?: string | null
	sharedInterests?: Array<{ id: string; name: string }>
	sharedExperiences?: Array<{
		id: string
		title: string
		date: string
		imageUrl: string
		status: "going" | "interested"
	}>
	communityActivity?: {
		joinedAgo: string
		experiencesAttended: number
		posts: number
		chatReplies: number
	}
	conversationId?: string | null
}

export async function getCommunityMemberDetail(
	communityId: string,
	userId: string,
): Promise<MemberDetailCard> {
	const { data } = await apiClient.get<{ success: boolean; data: MemberDetailCard }>(
		`/communities/${communityId}/members/${userId}`,
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
	userId: string
	firstName: string
	lastName: string
	avatarUrl: string | null
	displayName: string | null
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
	params?: {
		upcoming?: boolean
		page?: number
		limit?: number
		dateFilter?: string
		eventType?: string
		categoryId?: string
		interestSlugs?: string[]
		sortBy?: string
		sortOrder?: string
	},
): Promise<CommunityEventsResponse> {
	const { data } = await apiClient.get<{ success: boolean; data: CommunityEventsResponse }>(
		`/communities/${slug}/events`,
		{ params },
	)
	return data.data
}

export type CommunityAnnouncement = {
	id: string
	communityId: string
	authorId: string
	authorRole: "ADMIN" | "HOST" | string
	category: "EVENT_DROP" | "EVENT_REMINDER" | "COMMUNITY_UPDATE" | "COMMUNITY_REMINDER"
	title: string
	body: string
	imageKey: string | null
	isPinned: boolean
	pinnedAt: string | null
	likeCount: number
	bookmarkCount: number
	publishedAt: string
	deletedAt: string | null
	createdAt: string
	updatedAt: string
	author: {
		id: string
		name: string
		avatarUrl: string | null
		isBrand: boolean
	}
	likedByMe: boolean
	bookmarkedByMe: boolean
	imageUrl: string | null
}

export type CommunityAnnouncementsResponse = {
	items: CommunityAnnouncement[]
	nextCursor: string | null
}

export async function getAnnouncementUnreadCount(communityId: string): Promise<number> {
	const { data } = await apiClient.get<{ success: boolean; data: { count: number } }>(
		`/communities/${communityId}/announcements/unread-count`,
	)
	return data.data.count
}

export async function likeAnnouncement(communityId: string, announcementId: string): Promise<void> {
	await apiClient.post(`/communities/${communityId}/announcements/${announcementId}/like`)
}

export async function unlikeAnnouncement(communityId: string, announcementId: string): Promise<void> {
	await apiClient.delete(`/communities/${communityId}/announcements/${announcementId}/like`)
}

export async function bookmarkAnnouncement(communityId: string, announcementId: string): Promise<void> {
	await apiClient.post(`/communities/${communityId}/announcements/${announcementId}/bookmark`)
}

export async function unbookmarkAnnouncement(communityId: string, announcementId: string): Promise<void> {
	await apiClient.delete(`/communities/${communityId}/announcements/${announcementId}/bookmark`)
}

export async function getAnnouncementBookmarks(
	communityId: string,
	params?: { cursor?: string; limit?: number },
): Promise<CommunityAnnouncementsResponse> {
	const { data } = await apiClient.get<{ success: boolean; data: CommunityAnnouncement[] }>(
		`/communities/${communityId}/announcements/bookmarks`,
		{ params },
	)
	return { items: data.data, nextCursor: null }
}

export async function markAnnouncementsRead(communityId: string): Promise<void> {
	await apiClient.post(`/communities/${communityId}/announcements/mark-read`)
}

export async function getCommunityAnnouncements(
	communityId: string,
	params?: { cursor?: string; limit?: number },
): Promise<CommunityAnnouncementsResponse> {
	const { data } = await apiClient.get<{ success: boolean; data: CommunityAnnouncementsResponse }>(
		`/communities/${communityId}/announcements`,
		{ params },
	)
	return data.data
}

// ─── Storage ──────────────────────────────────────────────────────────────────

export type UploadUrlPayload = {
	context: "EVENT_MEDIA" | "USER_AVATAR" | "HOST_DOCUMENT" | "REVIEW_PHOTO" | "COMMUNITY_DM_MEDIA" | "COMMUNITY_FEED_MEDIA" | "SPONSORSHIP_MEDIA" | "SPONSORSHIP_DOCUMENT" | "SPONSORSHIP_CHAT_MEDIA" | "MEETDAY_CHAT_MEDIA" | "COMMUNITY_PAST_EVENT_MEDIA"
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

// ─── Community Feed ───────────────────────────────────────────────────────────

export type FeedPostType = "TEXT" | "PHOTO" | "POLL"
export type FeedPostCategory = "GENERAL" | "MEMORIES" | "RECOMMENDATION" | "QUESTION" | "POLL"

export type CreateFeedPostPayload = {
	postType: FeedPostType
	category: FeedPostCategory
	content?: string
	mediaKeys?: string[]
	topic?: string
	eventId?: string
	pollOptions?: string[]
}

export type FeedPollOption = {
	id: string
	text: string
	voteCount: number
}

export type FeedPost = {
	id: string
	communityId: string
	postType: FeedPostType
	category: FeedPostCategory
	topic: string | null
	content: string | null
	mediaUrls: string[]
	author: {
		id: string
		name: string
		avatarUrl: string | null
		badge: string | null
	}
	event: {
		id: string
		title: string
		eventDate: string
		city: string
	} | null
	poll: {
		totalVotes: number
		myVote: string | null
		options: FeedPollOption[]
	} | null
	isPinned: boolean
	counts: {
		reactions: number
		comments: number
		shares: number
		views: number
		bookmarks: number
	}
	reactedByMe: boolean
	myReactions: string[]
	bookmarkedByMe: boolean
	sharedByMe: boolean
	createdAt: string
}

export async function createCommunityFeedPost(
	communityId: string,
	payload: CreateFeedPostPayload,
): Promise<FeedPost> {
	const { data } = await apiClient.post<{ success: boolean; data: FeedPost }>(
		`/communities/${communityId}/feed/posts`,
		payload,
	)
	return data.data
}

export type UpdateFeedPostPayload = {
	content?: string
	mediaKeys?: string[]
	category?: FeedPostCategory
	topic?: string
}

export async function updateCommunityFeedPost(
	communityId: string,
	postId: string,
	payload: UpdateFeedPostPayload,
): Promise<FeedPost> {
	const { data } = await apiClient.patch<{ success: boolean; data: FeedPost }>(
		`/communities/${communityId}/feed/posts/${postId}`,
		payload,
	)
	return data.data
}

export type FeedPostsParams = {
	cursor?: string
	limit?: number
	category?: FeedPostCategory
	topic?: string
}

export type FeedPostsResponse = {
	items: FeedPost[]
	nextCursor: string | null
}

export async function getCommunityFeedPosts(
	communityId: string,
	params?: FeedPostsParams,
): Promise<FeedPostsResponse> {
	const { data } = await apiClient.get<{ success: boolean; data: FeedPostsResponse }>(
		`/communities/${communityId}/feed/posts`,
		{ params },
	)
	return data.data
}

export async function getCommunityFeedPost(communityId: string, postId: string): Promise<FeedPost> {
	const { data } = await apiClient.get<{ success: boolean; data: FeedPost }>(
		`/communities/${communityId}/feed/posts/${postId}`,
	)
	return data.data
}

export type TrendingTopic = {
	topic: string
	postCount: number
}

export async function getCommunityTrendingTopics(
	communityId: string,
	params?: { windowDays?: number; limit?: number },
): Promise<TrendingTopic[]> {
	const { data } = await apiClient.get<{ success: boolean; data: TrendingTopic[] }>(
		`/communities/${communityId}/feed/trending-topics`,
		{ params },
	)
	return data.data
}

export async function getCommunityPopularPosts(
	communityId: string,
	params?: { windowDays?: number; limit?: number },
): Promise<FeedPost[]> {
	const { data } = await apiClient.get<{ success: boolean; data: FeedPost[] }>(
		`/communities/${communityId}/feed/popular`,
		{ params },
	)
	return data.data
}

export async function viewFeedPost(communityId: string, postId: string): Promise<void> {
	await apiClient.post(`/communities/${communityId}/feed/posts/${postId}/view`)
}

// ─── Feed Comments ─────────────────────────────────────────────────────────────

export type FeedComment = {
	id: string
	postId: string
	content: string
	createdAt: string
	author: { id: string; name: string; avatarUrl: string | null }
}

export type FeedCommentsResponse = {
	comments: FeedComment[]
	nextCursor: string | null
}

export async function getFeedPostComments(
	communityId: string,
	postId: string,
	params?: { cursor?: string; limit?: number },
): Promise<FeedCommentsResponse> {
	const { data } = await apiClient.get<{ success: boolean; data: FeedCommentsResponse }>(
		`/communities/${communityId}/feed/posts/${postId}/comments`,
		{ params },
	)
	return data.data
}

export async function addFeedPostComment(
	communityId: string,
	postId: string,
	content: string,
): Promise<FeedComment> {
	const { data } = await apiClient.post<{ success: boolean; data: FeedComment }>(
		`/communities/${communityId}/feed/posts/${postId}/comments`,
		{ content },
	)
	return data.data
}

export async function deleteFeedPostComment(
	communityId: string,
	postId: string,
	commentId: string,
): Promise<void> {
	await apiClient.delete(`/communities/${communityId}/feed/posts/${postId}/comments/${commentId}`)
}

export async function voteFeedPoll(communityId: string, postId: string, optionId: string): Promise<void> {
	await apiClient.post(`/communities/${communityId}/feed/posts/${postId}/poll/vote`, { optionId })
}

export async function pinFeedPost(communityId: string, postId: string): Promise<void> {
	await apiClient.post(`/communities/${communityId}/feed/posts/${postId}/pin`)
}

export async function unpinFeedPost(communityId: string, postId: string): Promise<void> {
	await apiClient.delete(`/communities/${communityId}/feed/posts/${postId}/pin`)
}

export async function addFeedPostReaction(communityId: string, postId: string, emoji: string): Promise<void> {
	await apiClient.post(`/communities/${communityId}/feed/posts/${postId}/reactions`, { emoji })
}

export async function removeFeedPostReaction(communityId: string, postId: string, emoji: string): Promise<void> {
	await apiClient.delete(`/communities/${communityId}/feed/posts/${postId}/reactions`, { data: { emoji } })
}

export async function bookmarkFeedPost(communityId: string, postId: string): Promise<void> {
	await apiClient.post(`/communities/${communityId}/feed/posts/${postId}/bookmark`)
}

export async function unbookmarkFeedPost(communityId: string, postId: string): Promise<void> {
	await apiClient.delete(`/communities/${communityId}/feed/posts/${postId}/bookmark`)
}

export async function getCommunityBookmarkedPosts(communityId: string): Promise<FeedPost[]> {
	const { data } = await apiClient.get<{ success: boolean; data: FeedPost[] }>(
		`/communities/${communityId}/feed/bookmarks`,
	)
	return data.data
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

// ─── AI Copilot — sponsorship proposals ────────────────────────────────────────

export type ProposalCopilotSponsorTier = {
	name: string
	price: string
}

export type ProposalCopilotDraft = {
	name: string
	about: string
	audience_profile: string[]
	age_group: string
	guest_count: string
	sponsor_tiers: ProposalCopilotSponsorTier[]
	tier_reasoning: string | null
	confidence_score: number
	ai_suggestions_used: string[]
}

export async function generateProposalDraft(prompt: string): Promise<ProposalCopilotDraft> {
	const { data } = await apiClient.post<{ success: boolean; data: ProposalCopilotDraft }>(
		"/sponsorships/copilot/generate-draft",
		{ prompt },
	)
	return data.data
}

// ─── Host communities â€“ overview ─────────────────────────────────────────────

export type HostCommunityOverviewCommunity = {
	id: string
	slug: string
	name: string
	description: string
	type: string
	access: HostCommunityAccess
	isVerified: boolean
	primaryCity: string
	communityCities: string[]
	coverImageUrl: string
	iconUrl: string
	interestTags: { id: string; name: string; slug: string }[]
	category: { id: string; name: string }
}

export type HostCommunityOverviewAudience = {
	matchScore: number | null
	matchLabel: "Great match!" | "High engagement" | null
	matchDescription: string | null
	memberCount: number
	memberGrowthPct: number
	topAgeGroup: { label: string; pct: number } | null
	genderSplit: {
		male: number
		female: number
		nonBinary: number
		malePct: number
		femalePct: number
		nonBinaryPct: number
	} | null
	topCities: string[]
	cityCount: number
}

export type HostCommunityRole = "OWNER" | "MANAGER" | "HOST" | "MODERATOR" | "MEMBER"

export type HostCommunityOverviewHostContext = {
	isMember: boolean
	isPending: boolean
	role: HostCommunityRole | null
	permissions: {
		canSubmitExperiences: boolean
		canReplyToComments: boolean
		canViewAnalytics: boolean
		canReceiveUpdates: boolean
	}
}

export type HostCommunityOverviewStats = {
	totalViews: number
	experiencesPublished: number
	monthlyActiveMembers: number
	avgEngagementRate: number
}

export type HostCommunityUpcomingExperience = {
	id: string
	title: string
	eventDate: string
	startTime: string
	city: string
	coverImageUrl: string
	interestedCount: number
}

export type HostCommunityOverviewResponse = {
	community: HostCommunityOverviewCommunity
	audience: HostCommunityOverviewAudience
	hostContext: HostCommunityOverviewHostContext
	stats: HostCommunityOverviewStats
	upcomingExperiences: HostCommunityUpcomingExperience[]
}

export async function getHostCommunityOverview(communityId: string): Promise<HostCommunityOverviewResponse> {
	const { data } = await apiClient.get<{ success: boolean; data: HostCommunityOverviewResponse }>(
		`/communities/${communityId}/host/overview`,
	)
	return data.data
}

// ─── Host communities â€“ feed ─────────────────────────────────────────────────

export async function getHostCommunityFeedPosts(
	communityId: string,
	params?: FeedPostsParams,
): Promise<FeedPostsResponse> {
	const { data } = await apiClient.get<{ success: boolean; data: FeedPostsResponse }>(
		`/communities/${communityId}/host/feed/posts`,
		{ params },
	)
	return data.data
}

// ─── Host communities â€“ event attachment ─────────────────────────────────────

export type AddHostCommunityEventResponse = {
	success: boolean
	communityId: string
	eventId: string
}

export async function addHostCommunityEvent(
	communityId: string,
	eventId: string,
): Promise<AddHostCommunityEventResponse> {
	const { data } = await apiClient.post<{ success: boolean; data: AddHostCommunityEventResponse }>(
		`/communities/${communityId}/host/events`,
		{ eventId },
	)
	return data.data
}

// ─── Host communities â€“ feed sidebar ─────────────────────────────────────────

export type HostCommunityFeedSidebarResponse = {
	about: {
		description: string
		interestTags: { id: string; name: string; slug: string }[]
	}
	stats: {
		membersCount: number
		experiencesThisMonth: number
		monthlyViews: number
		monthlyComments: number
		monthlyShares: number
		audienceMatchPct: number | null
	}
	upcomingExperiences: HostCommunityUpcomingExperience[]
	trendingDiscussions: {
		id: string
		content: string
		category: FeedPostCategory
		commentCount: number
	}[]
}

export async function getHostCommunityFeedSidebar(communityId: string): Promise<HostCommunityFeedSidebarResponse> {
	const { data } = await apiClient.get<{ success: boolean; data: HostCommunityFeedSidebarResponse }>(
		`/communities/${communityId}/host/feed/sidebar`,
	)
	return data.data
}

// ─── Host communities â€“ eligible events ──────────────────────────────────────

export type HostCommunityEligibleEvent = {
	id: string
	title: string
	eventDate: string
	city: string
	coverImageUrl: string
	category: { id: string; name: string }
}

export type HostCommunityEligibleEventsParams = {
	search?: string
	page?: number
	limit?: number
}

export type HostCommunityEligibleEventsResponse = {
	data: HostCommunityEligibleEvent[]
	total: number
	page: number
	limit: number
}

export async function getHostCommunityEligibleEvents(
	communityId: string,
	params?: HostCommunityEligibleEventsParams,
): Promise<HostCommunityEligibleEventsResponse> {
	const { data } = await apiClient.get<{ success: boolean; data: HostCommunityEligibleEventsResponse }>(
		`/communities/${communityId}/host/eligible-events`,
		{ params },
	)
	return data.data
}

// ─── Host communities â€“ experiences ──────────────────────────────────────────

export type HostCommunityExperienceSource = "MANUAL" | "AUTO"

export type HostCommunityExperience = {
	id: string
	title: string
	description: string
	eventDate: string
	startTime: string
	city: string
	coverImageUrl: string
	communityEventId: string
	addedAt: string
	source: HostCommunityExperienceSource
	stats: {
		views: number
		interestedCount: number
		goingCount: number
	}
}

export type HostCommunityExperiencesParams = {
	page?: number
	limit?: number
}

export type HostCommunityExperiencesResponse = {
	data: HostCommunityExperience[]
	total: number
	page: number
	limit: number
}

export async function getHostCommunityExperiences(
	communityId: string,
	params?: HostCommunityExperiencesParams,
): Promise<HostCommunityExperiencesResponse> {
	const { data } = await apiClient.get<{ success: boolean; data: HostCommunityExperiencesResponse }>(
		`/communities/${communityId}/host/experiences`,
		{ params },
	)
	return data.data
}

// ─── Host communities â€“ announcements ────────────────────────────────────────

export type HostAnnouncementStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED"

export type HostCommunityAnnouncement = {
	id: string
	communityId: string
	authorId: string
	authorRole: string
	category: "EVENT_DROP" | "EVENT_REMINDER" | "COMMUNITY_UPDATE" | "COMMUNITY_REMINDER"
	title: string
	body: string
	imageKey: string | null
	imageUrl: string | null
	status: HostAnnouncementStatus
	scheduledAt: string | null
	isPinned: boolean
	pinnedAt: string | null
	likeCount: number
	bookmarkCount: number
	reachCount: number
	publishedAt: string | null
	deletedAt: string | null
	createdAt: string
	updatedAt: string
	author: {
		id: string
		name: string
		avatarUrl: string | null
		isBrand: boolean
	}
	likedByMe: boolean
	bookmarkedByMe: boolean
}

export type HostCommunityAnnouncementsParams = {
	status?: HostAnnouncementStatus
	page?: number
	limit?: number
}

export type HostCommunityAnnouncementsResponse = {
	items: HostCommunityAnnouncement[]
	total: number
	page: number
	limit: number
	totalPages: number
}

export type HostAnnouncementStats = {
	published: number
	scheduled: number
	drafts: number
	totalReach: {
		value: number
		changePercent: number | null
		windowDays: number
	}
}

export async function getHostCommunityAnnouncementStats(
	communityId: string,
): Promise<HostAnnouncementStats> {
	const { data } = await apiClient.get<{ success: boolean; data: HostAnnouncementStats }>(
		`/communities/${communityId}/host/announcements/stats`,
	)
	return data.data
}

export type CreateHostAnnouncementPayload = {
	category: "EVENT_DROP" | "EVENT_REMINDER" | "COMMUNITY_UPDATE" | "COMMUNITY_REMINDER"
	title: string
	body: string
	imageKey?: string | null
	status: HostAnnouncementStatus
	scheduledAt?: string | null
}

export async function createHostCommunityAnnouncement(
	communityId: string,
	payload: CreateHostAnnouncementPayload,
): Promise<HostCommunityAnnouncement> {
	const { data } = await apiClient.post<{ success: boolean; data: HostCommunityAnnouncement }>(
		`/communities/${communityId}/host/announcements`,
		payload,
	)
	return data.data
}

export async function pinHostCommunityAnnouncement(
	communityId: string,
	announcementId: string,
): Promise<HostCommunityAnnouncement> {
	const { data } = await apiClient.post<{ success: boolean; data: HostCommunityAnnouncement }>(
		`/communities/${communityId}/host/announcements/${announcementId}/pin`,
	)
	return data.data
}

export async function unpinHostCommunityAnnouncement(
	communityId: string,
	announcementId: string,
): Promise<HostCommunityAnnouncement> {
	const { data } = await apiClient.delete<{ success: boolean; data: HostCommunityAnnouncement }>(
		`/communities/${communityId}/host/announcements/${announcementId}/pin`,
	)
	return data.data
}

export async function deleteHostCommunityAnnouncement(
	communityId: string,
	announcementId: string,
): Promise<{ success: boolean }> {
	const { data } = await apiClient.delete<{ success: boolean; data: { success: boolean } }>(
		`/communities/${communityId}/host/announcements/${announcementId}`,
	)
	return data.data
}

export type UpdateHostAnnouncementPayload = Partial<CreateHostAnnouncementPayload>

export async function updateHostCommunityAnnouncement(
	communityId: string,
	announcementId: string,
	payload: UpdateHostAnnouncementPayload,
): Promise<HostCommunityAnnouncement> {
	const { data } = await apiClient.patch<{ success: boolean; data: HostCommunityAnnouncement }>(
		`/communities/${communityId}/host/announcements/${announcementId}`,
		payload,
	)
	return data.data
}

export async function getHostCommunityAnnouncements(
	communityId: string,
	params?: HostCommunityAnnouncementsParams,
): Promise<HostCommunityAnnouncementsResponse> {
	const { data } = await apiClient.get<{ success: boolean; data: HostCommunityAnnouncementsResponse }>(
		`/communities/${communityId}/host/announcements`,
		{ params },
	)
	return data.data
}

// ─── Host communities â€“ audience ─────────────────────────────────────────────

export type AudienceAgeRange = "UNDER_18" | "AGE_18_24" | "AGE_25_34" | "AGE_35_44" | "AGE_45_54" | "AGE_55_PLUS"

export type HostCommunityAudienceStats = {
	totalMembers: number
	totalMemberGrowthPct: number
	newMembersThisMonth: number
	newMemberGrowthPct: number
	engagementRate: number
	engagementRateDelta: number
	avgExperienceRating: number
	avgExperienceRatingDelta: number
}

export type HostCommunityAudienceDemographics = {
	ageDistribution: {
		range: AudienceAgeRange
		label: string
		count: number
		pct: number
	}[]
	genderSplit: {
		male: number
		female: number
		nonBinary: number
		malePct: number
		femalePct: number
		nonBinaryPct: number
	}
}

export type HostCommunityAudienceResponse = {
	stats: HostCommunityAudienceStats
	demographics: HostCommunityAudienceDemographics
	topCities: { city: string; count: number; pct: number }[]
	interests: { id: string; name: string; slug: string; memberPct: number }[]
	activity: {
		eventViews: { total: number; growthPct: number }
		comments: { total: number; growthPct: number }
		shares: { total: number; growthPct: number }
	}
	highlights: string[]
}

export async function getHostCommunityAudience(communityId: string): Promise<HostCommunityAudienceResponse> {
	const { data } = await apiClient.get<{ success: boolean; data: HostCommunityAudienceResponse }>(
		`/communities/${communityId}/host/audience`,
	)
	return data.data
}

// ─── Host communities â€“ activity ─────────────────────────────────────────────

export type HostCommunityActivity = {
	communitiesJoined: number
	accessRequests: number
	pendingReviews: number
	experiencesInCommunities: number
	totalCommunityViews: number
}

export async function getHostCommunityActivity(): Promise<HostCommunityActivity> {
	const { data } = await apiClient.get<{ success: boolean; data: HostCommunityActivity }>(
		"/communities/host/activity",
	)
	return data.data
}

// ─── Host communities â€“ browse ────────────────────────────────────────────────

export type HostCommunityAudienceSize = "SMALL" | "MEDIUM" | "LARGE" | "VERY_LARGE"
export type HostCommunityAccess = "PUBLIC" | "APPROVAL_REQUIRED" | "INVITE_ONLY"
export type HostCommunityBrowseTab = "ALL" | "PUBLIC" | "APPROVAL_REQUIRED" | "INVITE_ONLY" | "MY_COMMUNITIES"

export type HostBrowseCommunitiesParams = {
	search?: string
	categoryId?: string
	city?: string
	audienceSize?: HostCommunityAudienceSize
	access?: HostCommunityAccess
	tab?: HostCommunityBrowseTab
	page?: number
	limit?: number
}

export type HostBrowseCommunity = {
	id: string
	slug: string
	name: string
	description: string
	type: string
	access: HostCommunityAccess
	primaryCity: string
	communityCities: string[]
	coverImageUrl: string
	iconUrl: string
	memberCount: number
	experienceCount: number
	category: { id: string; name: string }
	isVerified: boolean
	experiencesThisMonth: number
	avgHostRating: number | null
	matchScore: number | null
	matchLabel: "Great match!" | "High engagement" | null
	isMember: boolean
	isPending: boolean
}

export type HostBrowseCommunitiesResponse = {
	data: HostBrowseCommunity[]
	total: number
	page: number
	limit: number
	totalPages: number
}

export async function getHostBrowseCommunities(
	params?: HostBrowseCommunitiesParams,
): Promise<HostBrowseCommunitiesResponse> {
	const { data } = await apiClient.get<{ success: boolean; data: HostBrowseCommunitiesResponse }>(
		"/communities/host/browse",
		{ params },
	)
	return data.data
}


