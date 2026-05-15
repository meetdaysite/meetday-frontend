import { Icon } from "@/components/ui/Icon"
import StarCircleSvg from "@/icons/filled/star-circle.svg"
import PulseSvg from "@/icons/filled/pulse.svg"
import ShieldCheckSvg from "@/icons/filled/shield-check.svg"
import type { PublicEventDetails, PublicRefundPolicy } from "@/types/attendee"

// ─── Vibe Match ───────────────────────────────────────────────────────────────

function VibeMatchCard({ vibeSummary }: { vibeSummary: string | null }) {
	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-subtle">
			<div className="flex items-center gap-2 mb-4">
				<Icon as={StarCircleSvg} size="md" color="vibe" />
				<span className="text-body-md font-medium text-text-primary">Your Vibe Match</span>
			</div>

			{vibeSummary ? (
				<p className="text-body-sm text-text-secondary leading-relaxed">{vibeSummary}</p>
			) : (
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
							Sign in to see how well this event matches your vibe
						</p>
					</div>
				</div>
			)}
		</div>
	)
}

// ─── Crowd Pulse ──────────────────────────────────────────────────────────────

const CROWD_DIMS = ["Energy", "Crowd style", "Social friendliness"]

function CrowdPulseCard({ crowdPulse }: { crowdPulse: unknown }) {
	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-subtle">
			<div className="flex items-center gap-2 mb-4">
				<Icon as={PulseSvg} size="md" color="muted" />
				<span className="text-body-md font-medium text-text-primary">Crowd Pulse</span>
			</div>

			{crowdPulse ? (
				// Placeholder for when real data arrives
				<p className="text-body-sm text-text-secondary">Data available.</p>
			) : (
				<div className="flex flex-col gap-3.5">
					{CROWD_DIMS.map(dim => (
						<div key={dim} className="flex flex-col gap-1.5">
							<span className="text-label-sm text-text-muted">{dim}</span>
							<div className="h-1.5 rounded-full bg-neutral-100" />
						</div>
					))}
					<p className="text-caption text-text-muted text-center mt-0.5">
						Crowd data coming soon
					</p>
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

	const destination =
		policy.refundTo === "ORIGINAL_PAYMENT" ? "to original payment method" : "as credits"

	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-subtle">
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
			<CrowdPulseCard crowdPulse={event.crowdPulse} />
			{event.refundPolicy && <RefundCard policy={event.refundPolicy} />}
		</>
	)
}
