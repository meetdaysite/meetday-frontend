"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import StarCircleSvg from "@/icons/filled/star-circle.svg"
import PulseSvg from "@/icons/filled/pulse.svg"
import ShieldCheckSvg from "@/icons/filled/shield-check.svg"
import EyeSvg from "@/icons/outlined/eye-open.svg"
import BoltSvg from "@/icons/outlined/bolt.svg"
import UsersGroupSvg from "@/icons/filled/users-group-2.svg"
import type { PublicEventDetails, PublicEventCommunity, PublicRefundPolicy, VibeMatchResponse, CrowdPulseResponse } from "@/types/attendee"
import { useAuthStore } from "@/store/authStore"
import { getEventVibeMatch, getEventCrowdPulse } from "@/lib/api"
import { Skeleton } from "@/components/ui/Skeleton"

// crowdStyle → bar fill % as specified by the API contract
const CROWD_STYLE_FILL: Record<string, number> = {
	"Party Energy": 80,
	"Trendy & Social": 65,
	"Laid-back & Chill": 35,
	"Mixed Crowd": 50,
}

// ─── Vibe Match ───────────────────────────────────────────────────────────────

function VibeMatchCard({ eventId }: { eventId: string }) {
	const router = useRouter()
	const { user, authLoading } = useAuthStore()
	const [match, setMatch] = useState<VibeMatchResponse | null>(null)
	const [fetching, setFetching] = useState(false)

	useEffect(() => {
		if (authLoading || !user) return
		setFetching(true)
		getEventVibeMatch(eventId)
			.then(setMatch)
			.catch(() => {})
			.finally(() => setFetching(false))
	}, [eventId, authLoading, user])

	const isLoading = authLoading || fetching

	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default shadow-md">
			<div className="flex items-center gap-2 mb-4">
				<Icon as={StarCircleSvg} size="md" color="vibe" />
				<span className="text-body-md font-medium text-text-primary">Your Vibe Match</span>
			</div>

			{isLoading ? (
				<div className="flex flex-col gap-3">
					<div className="flex items-baseline gap-2">
						<Skeleton.Block className="h-9 w-16" />
						<Skeleton.Text className="w-20" />
					</div>
					<Skeleton.Block className="h-2 rounded-full" />
					<Skeleton.Block className="h-12 rounded-badge" />
				</div>
			) : match ? (
				<div className="flex flex-col gap-3">
					<div className="flex items-baseline gap-2">
						<span className="text-3xl font-extrabold text-text-vibe">
							{match.score !== null ? `${match.score}%` : "—"}
						</span>
						<span className="text-label-sm text-text-muted">
							{match.label ?? "match score"}
						</span>
					</div>
					<div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
						<div
							className="h-full rounded-full bg-text-vibe transition-all duration-500"
							style={{ width: `${match.score ?? 0}%` }}
						/>
					</div>
					{match.summary && (
						<p className="text-body-sm text-text-secondary leading-relaxed">{match.summary}</p>
					)}
				</div>
			) : user ? (
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

function CommunityAccessCard({ community }: { community: PublicEventCommunity }) {
	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default shadow-md flex flex-col gap-3">
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
				{/* TODO: Wire up join action via POST /api/communities/[slug]/join */}
				<Button
					variant="primary"
					size="sm"
					radius="pill"
					className="flex-1"
					leftIcon={<Icon as={BoltSvg} size="sm" color="inverse" />}
				>
					Join Community
				</Button>
				<Link href={`/communities/${community.slug}`} className="flex-1">
					<Button
						variant="primary"
						size="sm"
						radius="pill"
						className="w-full bg-neutral-900"
						leftIcon={<Icon as={EyeSvg} size="sm" color="inverse" />}
					>
						View Community
					</Button>
				</Link>
			</div>
		</div>
	)
}

// ─── Crowd Pulse ──────────────────────────────────────────────────────────────

function CrowdPulseCard({ eventId }: { eventId: string }) {
	const [pulse, setPulse] = useState<CrowdPulseResponse | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		getEventCrowdPulse(eventId)
			.then(setPulse)
			.catch(() => {})
			.finally(() => setLoading(false))
	}, [eventId])

	const dims = pulse
		? [
			{
				label: "Energy",
				value: pulse.energy,
				fill: pulse.energyScore,
				barCls: "bg-gradient-to-r from-orange-400 to-red-500",
				textCls: "text-red-500",
			},
			{
				label: "Crowd style",
				value: pulse.crowdStyle,
				fill: pulse.crowdStyle != null ? (CROWD_STYLE_FILL[pulse.crowdStyle] ?? 50) : null,
				barCls: "bg-gradient-to-r from-violet-400 to-purple-600",
				textCls: "text-purple-600",
			},
			{
				label: "Social friendliness",
				value: pulse.socialFriendliness,
				fill: pulse.socialScore,
				barCls: "bg-gradient-to-r from-blue-400 to-indigo-500",
				textCls: "text-blue-500",
			},
		]
		: null

	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default shadow-md">
			<div className="flex items-center gap-2 mb-4">
				<Icon as={PulseSvg} size="md" color={!loading && pulse ? "primary" : "muted"} />
				<span className="text-body-md font-medium text-text-primary">Crowd Pulse</span>
			</div>

			{loading ? (
				<div className="flex flex-col gap-3.5">
					{["Energy", "Crowd style", "Social friendliness"].map(dim => (
						<div key={dim} className="flex flex-col gap-1.5">
							<Skeleton.Text className="w-28" />
							<Skeleton.Block className="h-1.5 rounded-full" />
						</div>
					))}
				</div>
			) : dims ? (
				<div className="flex flex-col gap-3.5">
					{dims.map(({ label, value, fill, barCls, textCls }) => (
						<div key={label} className="flex flex-col gap-1.5">
							<div className="flex items-center justify-between">
								<span className="text-label-sm text-text-muted">{label}</span>
								{value && (
									<span className={`text-label-sm font-semibold ${textCls}`}>{value}</span>
								)}
							</div>
							<div className="h-3 rounded-full bg-neutral-100 overflow-hidden">
								<div
									className={`h-full rounded-full transition-all duration-500 ${barCls} ${pulse!.isEstimate ? "opacity-60" : ""}`}
									style={{ width: fill !== null ? `${fill}%` : pulse!.isEstimate ? "40%" : "0%" }}
								/>
							</div>
						</div>
					))}

					<p className="text-caption text-text-muted text-center mt-0.5 italic">
						{pulse!.isEstimate
							? "The vibe is still cooking — check back as more people join!"
							: `Based on ${pulse!.totalAttendees.toLocaleString()} attendee${pulse!.totalAttendees !== 1 ? "s" : ""}`
						}
					</p>
				</div>
			) : (
				<div className="flex flex-col gap-3.5">
					{["Energy", "Crowd style", "Social friendliness"].map(dim => (
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
		<div className="p-5 rounded-panel bg-surface-card border border-border-default shadow-md">
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
	const primaryCommunity = event.communities?.[0] ?? null

	return (
		<>
			<VibeMatchCard eventId={event.id} />
			{primaryCommunity && <CommunityAccessCard community={primaryCommunity} />}
			<CrowdPulseCard eventId={event.id} />
			{event.refundPolicy && <RefundCard policy={event.refundPolicy} />}
		</>
	)
}
