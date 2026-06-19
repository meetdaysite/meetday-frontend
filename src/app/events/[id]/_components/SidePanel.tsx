"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import StarCircleSvg from "@/icons/filled/star-circle.svg"
import PulseSvg from "@/icons/filled/pulse.svg"
import ShieldCheckSvg from "@/icons/filled/shield-check.svg"
import EyeSvg from "@/icons/outlined/eye-open.svg"
import BoltSvg from "@/icons/outlined/bolt.svg"
import UsersGroupSvg from "@/icons/filled/users-group-2.svg"
import type { PublicEventDetails, PublicRefundPolicy } from "@/types/attendee"
import { useAuthStore } from "@/store/authStore"

// ─── Vibe Match ───────────────────────────────────────────────────────────────

function VibeMatchCard({ vibeSummary }: { vibeSummary: string | null }) {
	const router = useRouter()
	const user = useAuthStore(s => s.user)

	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<div className="flex items-center gap-2 mb-4">
				<Icon as={StarCircleSvg} size="md" color="vibe" />
				<span className="text-body-md font-medium text-text-primary">Your Vibe Match</span>
			</div>

			{vibeSummary ? (
				<p className="text-body-sm text-text-secondary leading-relaxed">{vibeSummary}</p>
			) : user ? (
				// Authenticated but no vibe data yet
				<div className="flex flex-col gap-3">
					<div className="flex items-baseline gap-2">
						<span className="text-3xl font-extrabold text-text-muted">—</span>
						<span className="text-label-sm text-text-muted">match score</span>
					</div>
					<div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
						<div className="h-full w-0 rounded-full bg-text-vibe" />
					</div>
					<div className="p-3 rounded-badge bg-surface-vibe-soft">
						<p className="text-body-sm text-text-vibe text-center leading-snug">
							Your vibe match is being calculated
						</p>
					</div>
				</div>
			) : (
				// Unauthenticated
				<div className="flex flex-col gap-3">
					<div className="flex items-baseline gap-2">
						<span className="text-3xl font-extrabold text-text-muted">—</span>
						<span className="text-label-sm text-text-muted">match score</span>
					</div>
					<div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
						<div className="h-full w-0 rounded-full bg-text-vibe" />
					</div>
					<button
						type="button"
						onClick={() =>
							router.push(
								`/attendee/login?redirect=${encodeURIComponent(window.location.pathname)}`,
							)
						}
						className="p-3 rounded-badge bg-surface-vibe-soft w-full hover:bg-violet-100 transition-colors"
					>
						<p className="text-body-sm text-text-vibe text-center leading-snug">
							Sign in to see how well this event matches your vibe
						</p>
					</button>
				</div>
			)}
		</div>
	)
}

// ─── Community Access ─────────────────────────────────────────────────────────

// TODO: Replace with real type once community API is integrated
interface SidePanelCommunity {
	name: string
	description: string
}

// TODO: Remove mock and derive from event.community once GET /api/events/[id] returns community data
const MOCK_COMMUNITY: SidePanelCommunity = {
	name: "Meetday Nightlife Circle",
	description:
		"Join the public community to discover more nightlife experiences, meet people with similar energy and return to future rooms",
}

// TODO: Accept `community` prop and only render when event.community is not null
function CommunityAccessCard() {
	const community = MOCK_COMMUNITY

	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default flex flex-col gap-3">
			<div className="grid grid-cols-[auto_1fr] gap-3 items-start">
				<Icon as={UsersGroupSvg} size="2xl" color="brand" />
				<div className="flex flex-col">
					<span className="text-body-md font-medium text-text-primary">Community access</span>
					<p className="text-label-sm text-text-primary font-normal">
						This event is part of{" "}
						<span className="font-medium">{community.name}</span>.
					</p>
				</div>
			</div>

			<p className="text-label-sm text-text-secondary font-normal">{community.description}</p>

			<div className="flex gap-2 mt-1">
				{/* TODO: Wire up join action via POST /api/communities/[id]/join */}
				<Button
					variant="primary"
					size="sm"
					radius="pill"
					className="flex-1"
					leftIcon={<Icon as={BoltSvg} size="sm" color="inverse" />}
				>
					Join Community
				</Button>
				{/* TODO: Link to /communities/[community.id] once community detail page is built */}
				<Button
					variant="primary"
					size="sm"
					radius="pill"
					className="flex-1 bg-neutral-900"
					leftIcon={<Icon as={EyeSvg} size="sm" color="inverse" />}
				>
					View Community
				</Button>
			</div>
		</div>
	)
}

// ─── Crowd Pulse ──────────────────────────────────────────────────────────────

const CROWD_DIMS = ["Energy", "Crowd style", "Social friendliness"]

function CrowdPulseCard({ crowdPulse }: { crowdPulse: unknown }) {
	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<div className="flex items-center gap-2 mb-4">
				<Icon as={PulseSvg} size="md" color="muted" />
				<span className="text-body-md font-medium text-text-primary">Crowd Pulse</span>
			</div>

			{crowdPulse ? (
				<p className="text-body-sm text-text-secondary">Data available.</p>
			) : (
				<div className="flex flex-col gap-3.5">
					{CROWD_DIMS.map(dim => (
						<div key={dim} className="flex flex-col gap-1.5">
							<span className="text-label-sm text-text-muted">{dim}</span>
							<div className="h-1.5 rounded-full bg-neutral-100" />
						</div>
					))}
					<p className="text-caption text-text-muted text-center mt-0.5">Crowd data coming soon</p>
				</div>
			)}
		</div>
	)
}

// ─── Refund Policy ────────────────────────────────────────────────────────────

function RefundCard({ policy }: { policy: PublicRefundPolicy }) {
	let summary: string
	if (policy.type === "NO_REFUND") {
		summary = "No refunds available for this event."
	} else if (policy.type === "FULL") {
		summary = policy.cutoffHours
			? `Full refund if cancelled ${policy.cutoffHours}+ hours before the event.`
			: "Full refunds available."
	} else {
		summary =
			policy.cutoffHours && policy.refundPercent
				? `${policy.refundPercent}% refund if cancelled ${policy.cutoffHours}+ hours before the event.`
				: "Partial refund available."
	}

	const destination = policy.refundTo === "ORIGINAL_PAYMENT" ? "to original payment method" : "as credits"

	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<div className="flex items-center gap-2 mb-3">
				<Icon
					as={ShieldCheckSvg}
					size="md"
					color={policy.type === "NO_REFUND" ? "muted" : "success"}
				/>
				<span className="text-body-md font-medium text-text-primary">Refund Policy</span>
			</div>
			<p className="text-body-sm text-text-secondary leading-relaxed">{summary}</p>
			{policy.type !== "NO_REFUND" && (
				<p className="text-caption text-text-muted mt-1.5">Refunded {destination}.</p>
			)}
		</div>
	)
}

// ─── Composed panel ───────────────────────────────────────────────────────────

export function SidePanel({ event }: { event: PublicEventDetails }) {
	return (
		<>
			<VibeMatchCard vibeSummary={event.vibeSummary} />
			{/* TODO: Replace `true` with `!!event.community` once API returns community data */}
			{true && <CommunityAccessCard />}
			<CrowdPulseCard crowdPulse={event.crowdPulse} />
			{event.refundPolicy && <RefundCard policy={event.refundPolicy} />}
		</>
	)
}
