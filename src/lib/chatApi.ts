import apiClient from "./axios"

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChatChannel = {
	id: string
	communityId: string
	name: string
	slug: string
	description: string | null
	isDefault: boolean
	position: number
	welcomeTitle: string | null
	welcomeBody: string | null
	quickReplies: string[]
	createdAt: string
	updatedAt: string
	memberState: {
		lastReadAt: string | null
		bannerDismissedAt: string | null
	} | null
}

export type ChatMessageSender = {
	id: string
	firstName: string
	lastName: string
	avatarUrl: string | null
}

export type RawReaction = {
	userId: string
	emoji: string
}

export type AggregatedReaction = {
	emoji: string
	count: number
	userIds: string[]
}

export type ChatMessage = {
	id: string
	channelId: string
	communityId: string
	senderId: string
	content: string
	isPinned: boolean
	pinnedAt: string | null
	pinnedBy: string | null
	parentMessageId: string | null
	replyCount: number
	deletedAt: string | null
	createdAt: string
	updatedAt: string
	sender: ChatMessageSender
	pinnedByUser: { id: string; firstName: string; lastName: string } | null
	reactions: RawReaction[]
}

export type ChatMessagesResponse = {
	messages: ChatMessage[]
	nextCursor: string | null
}

export type DmMessage = {
	id: string
	conversationId: string
	senderId: string
	ciphertext: string
	nonce: string
	keyEpoch: number
	messageType: "TEXT" | "IMAGE"
	mediaKey: string | null
	mediaSizeBytes: number | null
	deletedAt: string | null
	createdAt: string
	updatedAt: string
	sender: ChatMessageSender
}

export type DecryptedDmMessage = DmMessage & { plaintext: string | null }

export type DmConversation = {
	id: string
	communityId: string
	other: { id: string; firstName: string; lastName: string; avatarUrl: string | null }
	lastMessageAt: string | null
	unreadCount: number
}

export type MemberDeviceKey = {
	deviceId: string
	identityPublicKey: string
	signingPublicKey: string | null
	label: string | null
}

export type DeviceWrap = {
	recipientUserId: string
	recipientDeviceId: string
	epoch: number
	wrappedKey: string
}

export type MasterWrap = {
	userId: string
	epoch: number
	wrappedKey: string
}

export type IntroMessage = {
	ciphertext: string
	nonce: string
	keyEpoch: number
	messageType: "TEXT"
}

export type ReceivedIntro = {
	conversationId: string
	from: { id: string; firstName: string; lastName: string; avatarUrl: string | null }
	message: DmMessage
	sentAt: string
	sharedInterests?: { count: number; tags: Array<{ id: string; name: string }> }
}

export type SentIntro = {
	conversationId: string
	to: { id: string; firstName: string; lastName: string; avatarUrl: string | null }
	sentAt: string
}

export type ConversationKeys = {
	deviceKeys: Array<{ epoch: number; wrappedKey: string }>
	masterKeys: Array<{ epoch: number; wrappedKey: string }>
}

export type DmMessagesResponse = {
	messages: DmMessage[]
	nextCursor: string | null
}

export type PresenceData = {
	onlineCount: number
	onlineUsers: Array<{ id: string; firstName: string; lastName: string; avatarUrl: string | null }>
}

// ─── Channel endpoints ────────────────────────────────────────────────────────

export async function getChatChannels(communityId: string): Promise<ChatChannel[]> {
	const { data } = await apiClient.get<{ success: boolean; data: ChatChannel[] }>(
		`/communities/${communityId}/channels`,
	)
	return data.data
}

export async function getChannelMessages(
	communityId: string,
	channelId: string,
	params?: { cursor?: string; limit?: number },
): Promise<ChatMessagesResponse> {
	const { data } = await apiClient.get<{ success: boolean; data: ChatMessagesResponse }>(
		`/communities/${communityId}/channels/${channelId}/messages`,
		{ params },
	)
	return data.data
}

export async function getMessageReplies(
	communityId: string,
	channelId: string,
	messageId: string,
	params?: { cursor?: string; limit?: number },
): Promise<ChatMessagesResponse> {
	const { data } = await apiClient.get<{ success: boolean; data: ChatMessagesResponse }>(
		`/communities/${communityId}/channels/${channelId}/messages/${messageId}/replies`,
		{ params },
	)
	return data.data
}

export async function getPinnedMessages(
	communityId: string,
	channelId: string,
): Promise<ChatMessage[]> {
	const { data } = await apiClient.get<{ success: boolean; data: ChatMessage[] }>(
		`/communities/${communityId}/channels/${channelId}/pinned`,
	)
	return data.data
}

export async function pinMessage(
	communityId: string,
	channelId: string,
	messageId: string,
): Promise<void> {
	await apiClient.post(
		`/communities/${communityId}/channels/${channelId}/messages/${messageId}/pin`,
	)
}

export async function unpinMessage(
	communityId: string,
	channelId: string,
	messageId: string,
): Promise<void> {
	await apiClient.delete(
		`/communities/${communityId}/channels/${channelId}/messages/${messageId}/pin`,
	)
}

export async function deleteChannelMessage(
	communityId: string,
	channelId: string,
	messageId: string,
): Promise<void> {
	await apiClient.delete(
		`/communities/${communityId}/channels/${channelId}/messages/${messageId}`,
	)
}

export async function dismissWelcomeBanner(
	communityId: string,
	channelId: string,
): Promise<void> {
	await apiClient.delete(
		`/communities/${communityId}/channels/${channelId}/banner/dismiss`,
	)
}

// ─── Presence ─────────────────────────────────────────────────────────────────

export async function getCommunityPresence(communityId: string): Promise<PresenceData> {
	const { data } = await apiClient.get<{ success: boolean; data: PresenceData }>(
		`/communities/${communityId}/presence`,
	)
	return data.data
}

// ─── DM endpoints ─────────────────────────────────────────────────────────────

export async function getDMConversations(communityId: string): Promise<DmConversation[]> {
	const { data } = await apiClient.get<{ success: boolean; data: DmConversation[] }>(
		`/communities/${communityId}/dms`,
	)
	return data.data
}

export async function getTotalUnreadDMCount(communityId: string): Promise<number> {
	const { data } = await apiClient.get<{ success: boolean; data: { count: number } }>(
		`/communities/${communityId}/dms/unread-count`,
	)
	return data.data.count
}

export async function getDMMessages(
	communityId: string,
	conversationId: string,
	params?: { cursor?: string; limit?: number },
): Promise<DmMessagesResponse> {
	const { data } = await apiClient.get<{ success: boolean; data: DmMessagesResponse }>(
		`/communities/${communityId}/dms/${conversationId}/messages`,
		{ params },
	)
	return data.data
}

// ─── E2EE DM endpoints ───────────────────────────────────────────────────────

export async function getMemberDeviceKeys(
	communityId: string,
	userId: string,
): Promise<MemberDeviceKey[]> {
	const { data } = await apiClient.get<{ success: boolean; data: MemberDeviceKey[] }>(
		`/communities/${communityId}/members/${userId}/keys`,
	)
	return data.data
}

export async function sendIntro(
	communityId: string,
	payload: {
		targetUserId: string
		message: IntroMessage
		keys: { deviceWraps: DeviceWrap[]; masterWraps: MasterWrap[] }
	},
): Promise<{ conversationId: string; message: DmMessage }> {
	const { data } = await apiClient.post<{
		success: boolean
		data: { conversationId: string; message: DmMessage }
	}>(`/communities/${communityId}/dms/intros`, payload)
	return data.data
}

export async function getReceivedIntros(communityId: string): Promise<ReceivedIntro[]> {
	const { data } = await apiClient.get<{ success: boolean; data: ReceivedIntro[] }>(
		`/communities/${communityId}/dms/intros`,
	)
	return data.data
}

export async function getSentIntros(communityId: string): Promise<SentIntro[]> {
	const { data } = await apiClient.get<{ success: boolean; data: SentIntro[] }>(
		`/communities/${communityId}/dms/intros/sent`,
	)
	return data.data
}

export async function acceptIntro(
	communityId: string,
	conversationId: string,
): Promise<{ conversationId: string }> {
	const { data } = await apiClient.post<{ success: boolean; data: { conversationId: string } }>(
		`/communities/${communityId}/dms/intros/${conversationId}/accept`,
	)
	return data.data
}

export async function rejectIntro(communityId: string, conversationId: string): Promise<void> {
	await apiClient.post(`/communities/${communityId}/dms/intros/${conversationId}/reject`)
}

export async function uploadConversationKeys(
	communityId: string,
	conversationId: string,
	payload: { deviceWraps?: DeviceWrap[]; masterWraps?: MasterWrap[] },
): Promise<void> {
	await apiClient.post(
		`/communities/${communityId}/dms/${conversationId}/keys`,
		payload,
	)
}

export async function fetchConversationKeys(
	communityId: string,
	conversationId: string,
	deviceId: string,
): Promise<ConversationKeys> {
	const { data } = await apiClient.get<{ success: boolean; data: ConversationKeys }>(
		`/communities/${communityId}/dms/${conversationId}/keys`,
		{ params: { deviceId } },
	)
	return data.data
}

// ─── Reaction aggregation helper ──────────────────────────────────────────────

export function aggregateRawReactions(
	raw: RawReaction[],
	currentUserId: string | null,
): (AggregatedReaction & { mine: boolean })[] {
	const map = new Map<string, { count: number; userIds: string[] }>()
	for (const r of raw) {
		const entry = map.get(r.emoji) ?? { count: 0, userIds: [] }
		entry.count++
		entry.userIds.push(r.userId)
		map.set(r.emoji, entry)
	}
	return Array.from(map.entries()).map(([emoji, { count, userIds }]) => ({
		emoji,
		count,
		userIds,
		mine: currentUserId ? userIds.includes(currentUserId) : false,
	}))
}
