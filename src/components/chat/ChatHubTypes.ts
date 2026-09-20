export type ChatRole = "COMMUNITY" | "BRAND" | "SPACE"

export type ChatCategoryKey = "sponsorships" | "campaigns" | "spaces" | "communities" | "brands"

export type ChatViewMode = "landing" | "active"

export type RequestDirection = "INCOMING" | "OUTGOING"

export type ChatKind =
	| "SPONSORSHIP"
	| "CAMPAIGN"
	| "SPACE_INTEREST"
	| "SPACE_HOST"
	| "COMMUNITY_COLLAB"

export interface CategoryDefinition {
	key: ChatCategoryKey
	label: string
	shortLabel?: string
	description: string
	disabled?: boolean
	badgeCount?: number
	activeCount?: number
	pendingRequestsCount?: number
}

export interface UnifiedRequestItem {
	id: string
	category: ChatCategoryKey
	kind: ChatKind
	direction: RequestDirection
	status: "REQUESTED" | "ACCEPTED" | "DECLINED"
	counterpartName: string
	counterpartAvatarUrl?: string | null
	counterpartType?: "BRAND" | "SPACE" | "COMMUNITY" | "HOST"
	title: string
	subtitle?: string
	description?: string
	createdAt?: string | null
	lastMessagePreview?: string | null
	isIncoming: boolean
	rawItem: any
}

export interface UnifiedActiveThread {
	id: string
	category: ChatCategoryKey
	kind: ChatKind
	counterpartName: string
	counterpartAvatarUrl?: string | null
	counterpartType?: "BRAND" | "SPACE" | "COMMUNITY" | "HOST"
	title: string
	subtitle?: string
	lastMessagePreview?: string | null
	lastMessageAt?: string | null
	createdAt?: string | null
	unreadCount: number
	hasUnreadMention?: boolean
	isDealLocked?: boolean
	isDealClosed?: boolean
	rawThread: any
}
