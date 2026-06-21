import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import BoltSvg from "@/icons/outlined/bolt.svg"
import UsersGroupSvg from "@/icons/filled/users-group-2.svg"

interface JoinCommunityBannerProps {
	communityName: string
}

// TODO: Wire join action to POST /api/communities/[id]/join
// TODO: Only show this banner when user is not already a member
export function JoinCommunityBanner({ communityName }: JoinCommunityBannerProps) {
	return (
		<div className="rounded-panel bg-surface-brand-soft border border-border-focus p-6 flex flex-col sm:flex-row items-center gap-4">
			<div className="flex items-center justify-center size-12 rounded-full bg-action-primary shrink-0">
				<Icon as={UsersGroupSvg} size="md" color="inverse" />
			</div>

			<div className="flex-1 min-w-0 text-center sm:text-left">
				<p className="text-body-md font-semibold text-text-primary">
					Join{" "}
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
			>
				Join Community
			</Button>
		</div>
	)
}
