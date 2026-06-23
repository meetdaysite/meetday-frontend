"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import BoltSvg from "@/icons/outlined/bolt.svg"
import CloseSvg from "@/icons/outlined/close.svg"
import LockSvg from "@/icons/filled/lock.svg"
import CheckCircleSvg from "@/icons/filled/check-circle.svg"
import VerifiedSvg from "@/icons/filled/verified-check.svg"
import ChatSvg from "@/icons/outlined/chat.svg"
import BellSvg from "@/icons/outlined/bell.svg"
import PulseSvg from "@/icons/outlined/pulse.svg"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import UsersGroupSvg from "@/icons/outlined/users-group-2.svg"
import SmileCircleSvg from "@/icons/outlined/smile-circle.svg"
import type { ProfileVisibility } from "@/lib/api"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JoinModalCommunity {
	name: string
	iconUrl: string
	type: string
	access: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const UNLOCK_ITEMS = [
	{ icon: ChatSvg, title: "Community chat room", description: "Talk in real-time with members." },
	{ icon: BellSvg, title: "Official announcements", description: "Get important updates and experience drops." },
	{ icon: PulseSvg, title: "General feed", description: "Share moments, ask, discuss and interact." },
	{ icon: CalendarSvg, title: "Upcoming experiences", description: "Discover and book the best experiences first." },
	{ icon: UsersGroupSvg, title: "People with similar vibes", description: "Meet people who share your energy." },
	{ icon: SmileCircleSvg, title: "Post-event connections", description: "Revisit memories and stay connected." },
]

const VISIBILITY_OPTIONS: {
	key: ProfileVisibility
	label: string
	description: string
	recommended?: boolean
}[] = [
	{
		key: "EVENT_ATTENDEES_ONLY",
		label: "Visible only to people attending the same event",
		description: "Your profile and activity will be visible only to people attending the same events as you.",
		recommended: true,
	},
	{
		key: "COMMUNITY_MEMBERS",
		label: "Visible to community members",
		description: "Your profile and activity will be visible to all members of this community.",
	},
	{
		key: "PRIVATE",
		label: "Private until I attend an event",
		description: "Your profile will be hidden until you attend an event in this community.",
	},
]

const GUIDELINES = [
	{
		title: "Respect boundaries and be kind",
		description: "Treat everyone with respect. No harassment or hate.",
	},
	{
		title: "No spam or hard selling",
		description: "Don't promote or sell anything without permission.",
	},
	{
		title: "Ask for consent before sharing photos",
		description: "Always respect people's privacy.",
	},
	{
		title: "Keep conversations inclusive",
		description: "No discrimination. Everyone is welcome here.",
	},
]

// ─── Component ────────────────────────────────────────────────────────────────

interface JoinCommunityModalProps {
	community: JoinModalCommunity
	open: boolean
	onClose: () => void
	onJoin?: (visibility: ProfileVisibility) => Promise<void>
}

export function JoinCommunityModal({ community, open, onClose, onJoin }: JoinCommunityModalProps) {
	const [visibility, setVisibility] = useState<ProfileVisibility>("EVENT_ATTENDEES_ONLY")
	const [isSubmitting, setIsSubmitting] = useState(false)

	useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden"
		}
		return () => { document.body.style.overflow = "" }
	}, [open])

	// Reset state when modal opens
	useEffect(() => {
		if (open) {
			setVisibility("EVENT_ATTENDEES_ONLY")
			setIsSubmitting(false)
		}
	}, [open])

	if (!open) return null

	const handleJoin = async () => {
		if (!onJoin || isSubmitting) return
		setIsSubmitting(true)
		try {
			await onJoin(visibility)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
			onClick={e => { if (e.target === e.currentTarget && !isSubmitting) onClose() }}
		>
			<div className="bg-surface-card rounded-panel border border-border-default shadow-floating w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col sm:flex-row relative">

				{/* Close button */}
				<button
					type="button"
					onClick={onClose}
					disabled={isSubmitting}
					className="absolute top-4 right-4 z-10 flex items-center justify-center size-8 rounded-full bg-surface-hover hover:bg-surface-page border border-border-default transition-colors disabled:opacity-40"
				>
					<Icon as={CloseSvg} size="md" color="primary" />
				</button>

				{/* ── Left panel ─────────────────────────────────────────────── */}
				<div className="flex flex-col gap-5 p-6 sm:w-72 lg:w-96 shrink-0 overflow-y-auto border-b sm:border-b-0 sm:border-r border-border-default bg-surface-page">

					{/* Community identity */}
					<div className="flex flex-col gap-3">
						<div className="relative size-16 rounded-full overflow-hidden border border-border-default bg-surface-hover shrink-0">
							<Image src={community.iconUrl} alt={community.name} fill sizes="64px" className="object-cover" />
						</div>
						<div>
							<div className="flex items-start gap-1.5 flex-wrap">
								<h2 className="text-body-lg font-extrabold text-text-primary leading-tight">
									Join {community.name}
								</h2>
								{community.type === "MEETDAY_MANAGED_PUBLIC" && <Icon as={VerifiedSvg} size="md" color="brand" className="mt-0.5 shrink-0" />}
							</div>
							<span className="inline-block mt-2 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded-avatar px-2.5 py-0.5">
								{community.access === "PUBLIC" ? "Public" : "Private"} Community
							</span>
						</div>
						<p className="text-label-sm text-text-secondary font-normal leading-relaxed">
							Join this community to access conversations, updates, experiences and real connections.
						</p>
					</div>

					{/* What you'll unlock */}
					<div className="flex flex-col gap-2.5">
						<p className="text-body-md font-semibold text-text-primary">What you&apos;ll unlock</p>
						{UNLOCK_ITEMS.map(item => (
							<div key={item.title} className="flex items-start gap-2.5">
								<div className="size-7 rounded-lg bg-surface-info-soft border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
									<Icon as={item.icon} size="sm" color="info" />
								</div>
								<div>
									<p className="text-label-sm font-semibold text-text-primary">{item.title}</p>
									<p className="text-[11px] text-text-secondary font-normal mt-0.5">{item.description}</p>
								</div>
							</div>
						))}
					</div>

					{/* Safety card */}
					<div className="rounded-action bg-surface-vibe-soft border border-purple-200 p-3 flex items-start gap-2.5">
						<div className="size-7 rounded-lg bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
							<Icon as={LockSvg} size="sm" color="vibe" />
						</div>
						<div>
							<p className="text-label-sm font-semibold text-text-primary">Your safety is our priority</p>
							<p className="text-[11px] text-text-secondary font-normal mt-0.5 leading-snug">
								We moderate all conversations and content to keep this community safe, respectful and amazing.
							</p>
						</div>
					</div>
				</div>

				{/* ── Right panel ────────────────────────────────────────────── */}
				<div className="flex flex-col flex-1 min-h-0 overflow-y-auto p-6 gap-6">

					{/* Visibility */}
					<div>
						<p className="text-body-md font-semibold text-text-primary">Choose your visibility</p>
						<p className="text-label-sm text-text-secondary font-normal mt-0.5">
							Select how your profile appears in this community.
						</p>

						<div className="flex flex-col gap-2.5 mt-4">
							{VISIBILITY_OPTIONS.map(opt => {
								const isSelected = visibility === opt.key
								return (
									<button
										key={opt.key}
										type="button"
										disabled={isSubmitting}
										onClick={() => setVisibility(opt.key)}
										className={`w-full text-left rounded-action border p-3.5 flex items-start gap-3 transition-colors disabled:opacity-60 ${
											isSelected
												? "border-action-primary bg-red-50"
												: "border-border-default bg-surface-page hover:bg-surface-hover"
										}`}
									>
										{/* Radio dot */}
										<span className={`mt-0.5 size-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
											isSelected ? "border-action-primary" : "border-border-default"
										}`}>
											{isSelected && <span className="size-2 rounded-full bg-action-primary" />}
										</span>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 flex-wrap">
												<span className={`text-label-sm font-semibold ${isSelected ? "text-action-primary" : "text-text-primary"}`}>
													{opt.label}
												</span>
												{opt.recommended && (
													<span className="text-[10px] font-semibold text-action-primary bg-red-100 border border-red-200 rounded-avatar px-1.5 py-0.5">
														Recommended
													</span>
												)}
											</div>
											<p className="text-[11px] text-text-secondary font-normal mt-0.5 leading-snug">
												{opt.description}
											</p>
										</div>
									</button>
								)
							})}
						</div>
					</div>

					{/* Community guidelines */}
					<div>
						<p className="text-body-md font-semibold text-text-primary">Community guidelines</p>
						<p className="text-label-sm text-text-secondary font-normal mt-0.5">
							We expect everyone to help keep this community positive.
						</p>

						<div className="flex flex-col gap-3 mt-4">
							{GUIDELINES.map(g => (
								<div key={g.title} className="flex items-start gap-2.5">
									<Icon as={CheckCircleSvg} size="md" color="inherit" className="text-action-primary shrink-0 mt-0.5" />
									<div>
										<p className="text-label-sm font-semibold text-text-primary">{g.title}</p>
										<p className="text-[11px] text-text-secondary font-normal mt-0.5">{g.description}</p>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Actions */}
					<div className="flex gap-2 mt-auto pt-2">
						<Button
							variant="primary"
							size="md"
							radius="pill"
							className="w-full"
							leftIcon={<Icon as={BoltSvg} size="sm" color="inverse" />}
							disabled={isSubmitting}
							onClick={handleJoin}
						>
							{isSubmitting ? "Joining…" : "Join Community"}
						</Button>
						<Button
							variant="secondary"
							size="md"
							radius="pill"
							className="w-full"
							disabled={isSubmitting}
							onClick={onClose}
						>
							Maybe Later
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
