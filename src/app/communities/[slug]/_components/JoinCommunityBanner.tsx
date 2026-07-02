"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import BoltSvg from "@/icons/outlined/bolt.svg"
import UsersGroupSvg from "@/icons/filled/users-group-2.svg"

interface JoinCommunityBannerProps {
	communityName: string
	isLoggedIn: boolean
	onJoinClick: () => void
}

export function JoinCommunityBanner({ communityName, isLoggedIn, onJoinClick }: JoinCommunityBannerProps) {
	const router = useRouter()

	const handleJoin = () => {
		if (!isLoggedIn) {
			router.push(`/attendee/login?redirect=${encodeURIComponent(window.location.pathname)}`)
			return
		}
		onJoinClick()
	}

	return (
		<div className="rounded-action bg-surface-brand-soft border border-border-focus p-6 flex flex-col sm:flex-row items-center gap-4">
			<div className="flex items-center justify-center size-12 rounded-full bg-action-primary shrink-0">
				<Icon as={UsersGroupSvg} size="md" color="inverse" />
			</div>

			<div className="flex-1 min-w-0 text-center sm:text-left">
				<p className="text-body-md font-semibold text-text-primary">
					{isLoggedIn ? "Join " : "Log in to join "}
					<span className="text-text-brand">{communityName}</span> to unlock everything
				</p>
				<p className="text-label-sm text-text-secondary font-normal mt-0.5 leading-snug">
					Connect with members, unlock conversations, and get first access to events.
				</p>
			</div>

			<Button
				variant="primary"
				size="md"
				radius="pill"
				className="shrink-0"
				leftIcon={<Icon as={BoltSvg} size="sm" color="inverse" />}
				onClick={handleJoin}
			>
				{isLoggedIn ? "Join Community" : "Log in to Join"}
			</Button>
		</div>
	)
}
