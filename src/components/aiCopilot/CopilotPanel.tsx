"use client"

import clsx from "clsx"
import { Icon } from "@/components/ui/Icon"
import type { CopilotDraft } from "@/lib/api"
import AiAvatarSvg from "@/assets/ai-avatar.svg"
import MagicStick3Svg from "@/icons/duotone/magic-stick-3.svg"
import StarsSvg from "@/icons/duotone/stars.svg"
import InfoSvg from "@/icons/duotone/info.svg"
import CalendarSvg from "@/icons/duotone/calendar.svg"
import ClockCircleSvg from "@/icons/duotone/clock-circle.svg"
import TagPriceSvg from "@/icons/duotone/tag-price.svg"
import TicketStarSvg from "@/icons/duotone/ticket-star.svg"
import NotesSvg from "@/icons/duotone/notes.svg"
import CheckCircleSvg from "@/icons/duotone/check-circle.svg"
import LockSvg from "@/icons/duotone/lock.svg"
import type { ComponentType, SVGProps } from "react"

export type CopilotPanelState =
	| { mode: "prompt" }
	| { mode: "generated"; draft: CopilotDraft; prompt: string }

export type EventSummaryData = {
	coverUrl: string
	title: string
	eventDate: string
	venueName: string
	ticketCount: number
	totalCapacity: number
}

// ─── Confidence bar ────────────────────────────────────────────────────────────

function ConfidenceBar({ score }: { score: number }) {
	const pct = Math.round(score * 100)
	const label =
		pct >= 70
			? "High confidence in this draft"
			: pct >= 50
				? "Moderate confidence — review carefully"
				: "Low confidence — review all fields"
	const textColor = pct >= 70 ? "text-text-success" : pct >= 50 ? "text-text-warning" : "text-text-danger"
	const barColor = pct >= 70 ? "bg-icon-success" : pct >= 50 ? "bg-text-warning" : "bg-text-danger"

	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-center justify-between gap-2">
				<span className="text-caption text-text-secondary">Confidence score</span>
				<span className={clsx("text-label-sm font-bold", textColor)}>{pct}%</span>
			</div>
			<div className="h-1.5 rounded-full bg-surface-card-muted overflow-hidden">
				<div
					className={clsx("h-full rounded-full transition-all", barColor)}
					style={{ width: `${pct}%` }}
				/>
			</div>
			<p className="text-caption text-text-muted">{label}</p>
		</div>
	)
}

// ─── Check icon ───────────────────────────────────────────────────────────────

function CheckIcon() {
	return <Icon as={CheckCircleSvg} size="sm" color="success" className="shrink-0 mt-0.5" />
}

// ─── Suggestion row ───────────────────────────────────────────────────────────

function SuggestionRow({
	icon,
	title,
	desc,
}: {
	icon: ComponentType<SVGProps<SVGSVGElement>>
	title: string
	desc: string
}) {
	return (
		<div className="flex gap-3">
			<div className="size-8 rounded-action bg-surface-vibe-soft flex items-center justify-center shrink-0">
				<Icon as={icon} size="sm" color="vibe" />
			</div>
			<div>
				<p className="text-label-sm font-semibold text-text-primary">{title}</p>
				<p className="text-caption text-text-secondary mt-0.5">{desc}</p>
			</div>
		</div>
	)
}

// ─── Prompt mode content ──────────────────────────────────────────────────────

function PromptContent() {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-3.5">
				<SuggestionRow
					icon={MagicStick3Svg}
					title="Smart Listing Assistant"
					desc="Turn your idea into a complete event draft in seconds."
				/>
				<SuggestionRow
					icon={NotesSvg}
					title="Suggested title & description"
					desc="Engaging content tailored to your idea and audience."
				/>
				<SuggestionRow
					icon={TagPriceSvg}
					title="Suggested Category & event type"
					desc="Automatically matched to your event nature."
				/>
				<SuggestionRow
					icon={StarsSvg}
					title="Suggested tags/keywords"
					desc="Improve discoverability with relevant tags."
				/>
				<SuggestionRow
					icon={TicketStarSvg}
					title="Pricing & timing suggestions"
					desc="AI-backed recommendations to help you plan better."
				/>
			</div>
			<div className="mt-1 p-3 rounded-action bg-surface-warning-soft flex items-center gap-2">
				<Icon as={LockSvg} size="lg" color="warning" className="shrink-0" />
				<p className="text-caption text-text-warning">
					Your prompt is private and only used to generate your event draft.
				</p>
			</div>
		</div>
	)
}

// ─── Step 1 generated content ─────────────────────────────────────────────────

function Step1GeneratedContent({ draft, prompt }: { draft: CopilotDraft; prompt: string }) {
	return (
		<div className="flex flex-col gap-5">
			<div className="flex flex-col gap-1.5">
				<p className="text-caption font-semibold text-text-tertiary uppercase tracking-wider">
					Source prompt
				</p>
				<p className="text-caption text-text-secondary italic bg-surface-card-muted rounded-action px-3 py-2 leading-relaxed">
					&ldquo;{prompt}&rdquo;
				</p>
			</div>

			<div className="flex flex-col gap-2">
				<p className="text-caption font-semibold text-text-tertiary uppercase tracking-wider">
					AI Suggestions Used
				</p>
				<div className="flex flex-col gap-1.5">
					{draft.ai_suggestions_used.map(s => (
						<div key={s} className="flex items-start gap-2">
							<CheckIcon />
							<p className="text-caption text-text-secondary">{s}</p>
						</div>
					))}
				</div>
			</div>

			<ConfidenceBar score={draft.confidence_score} />

			<p className="text-caption text-text-muted">You can modify any details before saving.</p>
		</div>
	)
}

// ─── Step 2 content ───────────────────────────────────────────────────────────

function Step2Content({ draft }: { draft: CopilotDraft }) {
	return (
		<div className="flex flex-col gap-4">
			<p className="text-caption text-text-secondary">
				Here&apos;s what I suggested for Date &amp; Location
			</p>

			<div className="flex flex-col gap-3">
				<div className="flex gap-3">
					<div className="size-8 rounded-action bg-surface-vibe-soft flex items-center justify-center shrink-0">
						<Icon as={CalendarSvg} size="sm" color="vibe" />
					</div>
					<div>
						<p className="text-label-sm font-semibold text-text-primary">{draft.suggested_day}</p>
						<p className="text-caption text-text-secondary">
							Recommended day for this event type
						</p>
					</div>
				</div>

				<div className="flex gap-3">
					<div className="size-8 rounded-action bg-surface-vibe-soft flex items-center justify-center shrink-0">
						<Icon as={ClockCircleSvg} size="sm" color="vibe" />
					</div>
					<div>
						<p className="text-label-sm font-semibold text-text-primary">
							{draft.suggested_start_time} – {draft.suggested_end_time}
						</p>
						<p className="text-caption text-text-secondary">{draft.time_suggestion_reason}</p>
					</div>
				</div>
			</div>

			<div className="p-3 rounded-action bg-surface-vibe-soft">
				<div className="flex gap-2">
					<Icon as={InfoSvg} size="sm" color="vibe" className="shrink-0 mt-0.5" />
					<p className="text-caption text-text-vibe">
						AI suggestions are based on event trends and timing data.
					</p>
				</div>
			</div>
		</div>
	)
}

// ─── Step 3 content ───────────────────────────────────────────────────────────

function Step3Content() {
	const tips = [
		"Events with strong cover images get more clicks",
		"Add at least 4 gallery images to showcase your event",
		"Show the vibe, not just the venue",
		"Use bright, high-quality images",
		"Keep text on images minimal",
	]

	return (
		<div className="flex flex-col gap-4">
			<div className="p-3 rounded-action bg-surface-warning-soft">
				<p className="text-caption font-semibold text-text-warning">
					Copilot doesn&apos;t generate media
				</p>
				<p className="text-caption text-text-secondary mt-1">
					Cover images, gallery photos, and videos must be uploaded manually.
				</p>
			</div>

			<div className="flex flex-col gap-2">
				<p className="text-caption font-semibold text-text-tertiary uppercase tracking-wider">
					Best practices
				</p>
				<div className="flex flex-col gap-1.5">
					{tips.map(tip => (
						<div key={tip} className="flex items-start gap-2">
							<CheckIcon />
							<p className="text-caption text-text-secondary">{tip}</p>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

// ─── Step 4 content ───────────────────────────────────────────────────────────

function Step4Content({ draft }: { draft: CopilotDraft }) {
	return (
		<div className="flex flex-col gap-4">
			<p className="text-caption text-text-secondary">Smart pricing &amp; capacity insights</p>

			<div className="flex flex-col gap-4">
				{draft.ticket_tiers.map((tier, i) => (
					<div key={i} className="flex flex-col gap-1.5">
						<div className="flex items-center gap-2">
							<div className="size-6 rounded-full bg-surface-vibe-soft flex items-center justify-center shrink-0">
								<Icon as={TicketStarSvg} size="sm" color="vibe" />
							</div>
							<p className="text-label-sm font-semibold text-text-primary">{tier.name}</p>
						</div>
						<p className="text-caption text-text-secondary pl-8">{tier.insight}</p>
					</div>
				))}
			</div>

			{draft.tier_count_reasoning && (
				<div className="p-3 rounded-action bg-surface-vibe-soft">
					<p className="text-caption text-text-vibe">{draft.tier_count_reasoning}</p>
				</div>
			)}
		</div>
	)
}

// ─── Event summary (step 5) ───────────────────────────────────────────────────

function EventSummaryPanel({ summary }: { summary: EventSummaryData }) {
	return (
		<div className="flex flex-col gap-3 pt-4 border-t border-border-subtle">
			<p className="text-label-sm font-semibold text-text-primary">Event Summary</p>
			{summary.coverUrl && (
				<div className="w-full aspect-video rounded-action bg-surface-card-muted overflow-hidden">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={summary.coverUrl} alt="Cover" className="w-full h-full object-cover" loading="lazy" />
				</div>
			)}
			<div className="flex flex-col divide-y divide-border-subtle">
				{[
					{ label: "Title", value: summary.title || "—" },
					{ label: "Date", value: summary.eventDate || "—" },
					{ label: "Location", value: summary.venueName || "—" },
				].map(({ label, value }) => (
					<div key={label} className="flex items-start justify-between gap-3 py-2 first:pt-0 last:pb-0">
						<span className="text-caption text-text-tertiary shrink-0">{label}</span>
						<span className="text-caption font-semibold text-text-primary text-right">{value}</span>
					</div>
				))}
			</div>
			<div className="border-t border-border-subtle pt-2 flex flex-col gap-1.5">
				<div className="flex items-start justify-between gap-3">
					<span className="text-caption text-text-tertiary shrink-0">Ticket Types</span>
					<span className="text-caption font-semibold text-text-primary">
						{summary.ticketCount > 0 ? `${summary.ticketCount} type${summary.ticketCount > 1 ? "s" : ""}` : "—"}
					</span>
				</div>
				<div className="flex items-start justify-between gap-3">
					<span className="text-caption text-text-tertiary shrink-0">Total Capacity</span>
					<span className="text-caption font-semibold text-text-primary">
						{summary.ticketCount > 0 ? summary.totalCapacity.toLocaleString("en-IN") : "—"}
					</span>
				</div>
			</div>
		</div>
	)
}

// ─── Step 5 content ───────────────────────────────────────────────────────────

function Step5Content({ draft, summary }: { draft: CopilotDraft; summary?: EventSummaryData }) {
	return (
		<div className="flex flex-col gap-5">
			<ConfidenceBar score={draft.confidence_score} />

			<div className="flex flex-col gap-2">
				<p className="text-caption font-semibold text-text-tertiary uppercase tracking-wider">
					AI Suggestions Used
				</p>
				<div className="flex flex-col gap-1.5">
					{draft.ai_suggestions_used.map(s => (
						<div key={s} className="flex items-start gap-2">
							<CheckIcon />
							<p className="text-caption text-text-secondary">{s}</p>
						</div>
					))}
				</div>
			</div>

			{summary && <EventSummaryPanel summary={summary} />}
		</div>
	)
}

// ─── Step subtitle ────────────────────────────────────────────────────────────

function getStepSubtitle(step: number): string {
	switch (step) {
		case 1:
			return "Here's how your draft was created"
		case 2:
			return "Here's what I suggested for Date & Location"
		case 3:
			return "Tips for better media"
		case 4:
			return "Smart pricing & capacity insights"
		case 5:
			return "Your event is almost ready"
		default:
			return ""
	}
}

// ─── CopilotPanel ─────────────────────────────────────────────────────────────

export function CopilotPanel({
	copilot,
	currentStep,
	summary,
}: {
	copilot: CopilotPanelState
	currentStep: number
	summary?: EventSummaryData
}) {
	return (
		<aside className="hidden xl:flex flex-col w-72 shrink-0 border-l border-border-subtle bg-surface-card overflow-y-auto">
			{copilot.mode === "prompt" ? (
				<div className="p-5 flex flex-col gap-4">
					<p className="text-label-md font-semibold text-text-primary">
						What Copilot will help with
					</p>
					<PromptContent />
				</div>
			) : (
				<>
					<div className="flex items-center gap-2.5 px-5 py-4 border-b border-border-subtle shrink-0">
						<Icon as={AiAvatarSvg} size="xl" color="vibe" className="shrink-0" aria-hidden />
						<div className="min-w-0">
							<p className="text-label-sm font-semibold text-text-primary">
								Meetday AI Copilot
							</p>
							<p className="text-caption text-text-tertiary truncate">
								{getStepSubtitle(currentStep)}
							</p>
						</div>
					</div>
					<div className="flex-1 overflow-y-auto p-5">
						{currentStep === 1 && (
							<Step1GeneratedContent draft={copilot.draft} prompt={copilot.prompt} />
						)}
						{currentStep === 2 && <Step2Content draft={copilot.draft} />}
						{currentStep === 3 && <Step3Content />}
						{currentStep === 4 && <Step4Content draft={copilot.draft} />}
						{currentStep === 5 && <Step5Content draft={copilot.draft} summary={summary} />}
					</div>
				</>
			)}
		</aside>
	)
}
