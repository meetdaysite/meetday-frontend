"use client"

import { useEffect } from "react"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import CloseSvg from "@/icons/outlined/close.svg"
import UsersGroupSvg from "@/icons/outlined/users-group-2.svg"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import MapPointSvg from "@/icons/outlined/map-point.svg"
import ChatSvg from "@/icons/outlined/chat.svg"
import BellSvg from "@/icons/outlined/bell.svg"
import PenSvg from "@/icons/outlined/pen.svg"
import ArrowRightSvg from "@/icons/outlined/arrow-right.svg"
import ConfettiSvg from "@/icons/filled/confetti.svg"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JoinSuccessCommunity {
	name: string
	memberCount: number
	experienceCount: number
	primaryCity: string
}

// ─── Data ────────────────────────────────────────────────────────────────────

const GET_STARTED_ACTIONS = [
	{
		key: "chat",
		icon: ChatSvg,
		iconBg: "bg-green-50",
		iconColor: "success" as const,
		title: "Open Chat Room",
		description: "Introduce yourself, ask, and connect with members.",
		// TODO: Link to /communities/[id]/chat once chat tab is built
		href: "#",
	},
	{
		key: "announcements",
		icon: BellSvg,
		iconBg: "bg-purple-50",
		iconColor: "vibe" as const,
		title: "See Announcements",
		description: "Stay updated with the latest experience drops and community updates.",
		// TODO: Link to /communities/[id]/announcements once tab is built
		href: "#",
	},
	{
		key: "feed",
		icon: PenSvg,
		iconBg: "bg-red-50",
		iconColor: "inherit" as const,
		iconClassName: "text-red-400",
		title: "Create a Feed Post",
		description: "Share your thoughts, photos, or ask something to the community.",
		// TODO: Link to /communities/[id]/feed?compose=true once feed tab is built
		href: "#",
	},
	{
		key: "experiences",
		icon: CalendarSvg,
		iconBg: "bg-blue-50",
		iconColor: "info" as const,
		title: "Explore Experiences",
		description: "Discover and book the best music experiences with your community.",
		// TODO: Link to /communities/[id]/experiences once tab is built
		href: "#",
	},
]

function fmtCount(n: number): string {
	if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
	return String(n)
}

// ─── Component ───────────────────────────────────────────────────────────────

interface JoinSuccessModalProps {
	community: JoinSuccessCommunity
	open: boolean
	onClose: () => void
}

export function JoinSuccessModal({ community, open, onClose }: JoinSuccessModalProps) {
	useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden"
		}
		return () => { document.body.style.overflow = "" }
	}, [open])

	if (!open) return null

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
			onClick={e => { if (e.target === e.currentTarget) onClose() }}
		>
			<div className="bg-surface-card rounded-panel border border-border-default shadow-floating w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">

				{/* Close button */}
				<button
					type="button"
					onClick={onClose}
					className="absolute top-4 right-4 z-10 flex items-center justify-center size-8 rounded-full bg-surface-hover hover:bg-surface-page border border-border-default transition-colors"
				>
					<Icon as={CloseSvg} size="sm" color="secondary" />
				</button>

				<div className="flex flex-col items-center p-6 gap-5">

					{/* Hero icon */}
					<div className="flex items-center justify-center size-20 rounded-full bg-green-50 border border-green-200 mt-4">
						<Icon as={ConfettiSvg} size="xl" color="success" />
					</div>

					{/* Title */}
					<div className="text-center">
						<h2 className="text-heading-sm font-extrabold text-text-primary leading-tight">
							Welcome to<br /><span className="text-text-brand">{community.name}</span>
						</h2>
						<p className="text-label-md text-text-secondary font-normal mt-1.5">
							You&apos;re now part of the community.
						</p>
					</div>

					{/* Stats strip */}
					<div className="w-full rounded-action bg-green-50 border border-green-100 px-4 py-3 grid grid-cols-3 divide-x divide-green-100">
						<div className="flex items-center justify-center gap-2.5 pr-3">
							<Icon as={UsersGroupSvg} size="lg" color="success" className="shrink-0" />
							<div>
								<p className="text-body-sm font-bold text-text-primary">{fmtCount(community.memberCount)}</p>
								<p className="text-[11px] text-text-secondary">Members</p>
							</div>
						</div>
						<div className="flex items-center justify-center gap-2.5 px-3">
							<Icon as={CalendarSvg} size="lg" color="success" className="shrink-0" />
							<div>
								<p className="text-body-sm font-bold text-text-primary">{community.experienceCount}</p>
								<p className="text-[11px] text-text-secondary">Upcoming experiences</p>
							</div>
						</div>
						<div className="flex items-center justify-center gap-2.5 pl-3">
							<Icon as={MapPointSvg} size="lg" color="success" className="shrink-0" />
							<div>
								<p className="text-body-sm font-bold text-text-primary">{community.primaryCity}</p>
								<p className="text-[11px] text-text-secondary">Location</p>
							</div>
						</div>
					</div>

					{/* Get started */}
					<div className="w-full flex flex-col gap-3">
						<div className="grid grid-cols-2 gap-2.5">
							{GET_STARTED_ACTIONS.map(action => (
								<a
									key={action.key}
									href={action.href}
									className="flex flex-col gap-2.5 p-3.5 rounded-action border border-border-default bg-surface-page hover:bg-surface-hover transition-colors group"
								>
									<div className={`size-9 rounded-lg ${action.iconBg} flex items-center justify-center shrink-0`}>
										<Icon
											as={action.icon}
											size="md"
											color={action.iconColor}
											className={"iconClassName" in action ? action.iconClassName : undefined}
										/>
									</div>
									<div className="flex-1">
										<p className="text-label-md font-semibold text-text-primary">{action.title}</p>
										<p className="text-[11px] text-text-secondary font-normal mt-0.5 leading-snug">
											{action.description}
										</p>
									</div>
									<div className="flex justify-end">
										<Icon as={ArrowRightSvg} size="sm" color="primary" />
									</div>
								</a>
							))}
						</div>
					</div>

					{/* Actions */}
					<div className="w-full flex gap-2 pb-2">
						{/* TODO: Navigate to /communities/[id] (community home) after joining */}
						<Button
							variant="primary"
							size="lg"
							radius="pill"
							className="w-full"
							rightIcon={<Icon as={ArrowRightSvg} size="sm" color="inverse" />}
							onClick={onClose}
						>
							Go to Community Home
						</Button>
						{/* TODO: Navigate to /communities/[id]/experiences after joining */}
						<Button
							variant="secondary"
							size="lg"
							radius="pill"
							className="w-full"
							rightIcon={<Icon as={ArrowRightSvg} size="sm" color="secondary" />}
							onClick={onClose}
						>
							Explore Experiences
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
