import type { SponsorshipChatThread } from "@/lib/api"
import type { ChatRole, UnifiedRequestItem } from "./ChatHubTypes"

export function mapCampaignRequest(role: ChatRole, thread: SponsorshipChatThread): UnifiedRequestItem {
	const isBrand = role === "BRAND"
	const isHubApplicant = isBrand && thread.counterpartType === "SPACE"
	const fallbackTitle = isBrand
		? isHubApplicant ? "Hub Campaign Application" : "Campaign Application"
		: "Brand Campaign"
	return {
		id: thread.id,
		category: "campaigns",
		kind: "CAMPAIGN",
		direction: isBrand ? "INCOMING" : "OUTGOING",
		status: "REQUESTED",
		counterpartName: thread.counterpartName,
		counterpartAvatarUrl: thread.counterpartAvatarUrl,
		counterpartType: isBrand ? (isHubApplicant ? "SPACE" : "COMMUNITY") : "BRAND",
		title: thread.proposalName || fallbackTitle,
		description: isBrand
			? `This ${isHubApplicant ? "hub" : "community"} applied to your campaign.`
			: `You showed interest in this campaign. Awaiting brand approval.`,
		createdAt: thread.createdAt,
		lastMessagePreview: thread.lastMessagePreview,
		isIncoming: isBrand,
		rawItem: thread,
	}
}
