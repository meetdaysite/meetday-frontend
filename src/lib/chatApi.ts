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
	content: string
	deletedAt: string | null
	createdAt: string
	updatedAt: string
	sender: ChatMessageSender
}

export type DmConversation = {
	id: string
	communityId: string
	other: { id: string; firstName: string; lastName: string; avatarUrl: string | null }
	lastMessageAt: string | null
	lastMessagePreview: string | null
	unreadCount: number
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
