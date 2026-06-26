"use client"

import { Icon } from "@/components/ui/Icon"
import CloseSvg from "@/icons/outlined/close.svg"

interface WelcomeBannerProps {
	channelName: string
	welcomeTitle: string
	welcomeBody: string | null
	onDismiss: () => void
}

export function WelcomeBanner({ channelName, welcomeTitle, welcomeBody, onDismiss }: WelcomeBannerProps) {
	return (
		<div className="flex items-start justify-between gap-3 px-4 py-3 rounded-action bg-surface-vibe-soft border border-purple-100 mb-3">
			<p className="text-label-sm text-text-primary font-normal leading-snug">
				<span className="mr-1">👋</span>
				<span className="font-bold">{welcomeTitle}</span>
				{welcomeBody && (
					<span className="text-text-secondary ml-1">{welcomeBody}</span>
				)}
				{!welcomeBody && (
					<span className="text-text-secondary ml-1">
						Welcome to <span className="font-semibold">#{channelName}</span>. This is the beginning of the channel.
					</span>
				)}
			</p>
			<button
				type="button"
				onClick={onDismiss}
				className="text-text-muted hover:text-text-primary transition-colors shrink-0 mt-0.5"
				aria-label="Dismiss welcome banner"
			>
				<Icon as={CloseSvg} size="sm" color="muted" />
			</button>
		</div>
	)
}
