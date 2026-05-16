import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import CheckCircleSvg from "@/icons/filled/check-circle.svg"
import RocketSvg from "@/icons/filled/rocket.svg"
import GiftSvg from "@/icons/outlined/gift.svg"
import MessageSvg from "@/icons/outlined/message.svg"

const WHAT_HAPPENS = [
	{
		text: "You'll receive an email with your full ticket. Check your inbox (and spam folder just in case).",
	},
	{
		text: "We'll remind you before the event. Expect a reminder on before 24h with all the details.",
	},
	{
		text: "Show up and vibe! Bring your energy, we'll handle the rest.",
	},
]

function AvatarStack({ count = 4, color = "brand" }: { count?: number; color?: "brand" | "warning" }) {
	const gradients = [
		"from-purple-400 to-pink-400",
		"from-blue-400 to-cyan-400",
		"from-green-400 to-teal-400",
		"from-orange-400 to-red-400",
	]
	return (
		<div className="flex items-center gap-1.5">
			<div className="flex -space-x-2">
				{[...Array(count)].map((_, i) => (
					<div
						key={i}
						className={`size-7 rounded-full bg-linear-to-br ${gradients[i % gradients.length]} border-2 border-surface-card`}
						style={{ zIndex: count - i }}
					/>
				))}
			</div>
			<span className="text-caption text-text-muted">+24</span>
		</div>
	)
}

export function ConfirmedRightPanel() {
	return (
		<div className="flex flex-col gap-4">
			{/* What happens next */}
			<div className="rounded-panel bg-surface-card border border-border-subtle p-5 flex flex-col gap-4">
				<div className="flex items-center gap-2">
					<Icon as={RocketSvg} size="md" color="brand" />
					<span className="text-title-md font-bold text-text-primary">What happens next?</span>
				</div>
				<div className="flex flex-col gap-3">
					{WHAT_HAPPENS.map((step, i) => (
						<div key={i} className="flex items-start gap-3">
							<div className="size-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
								<Icon as={CheckCircleSvg} size="sm" color="info" />
							</div>
							<p className="text-label-sm text-text-secondary leading-snug pt-0.5">{step.text}</p>
						</div>
					))}
				</div>
			</div>

			{/* Join event chat */}
			<div className="rounded-panel bg-surface-card border border-border-subtle p-5 flex flex-col gap-3">
				<div className="flex items-center gap-3">
					<div className="size-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
						<Icon as={MessageSvg} size="md" color="primary" />
					</div>
					<div>
						<p className="text-body-sm font-bold text-text-primary">Join event chat</p>
						<p className="text-caption text-text-muted leading-snug">
							Connect with other attendees, share plans and get hyped before the event.
						</p>
					</div>
				</div>
				<div className="flex items-center justify-between">
					<AvatarStack />
					<Button variant="secondary" size="sm" radius="md" className="text-text-brand border-border-brand">
						Join the chat →
					</Button>
				</div>
			</div>

			{/* Invite friend, get rewarded */}
			<div className="rounded-panel bg-surface-card border border-border-subtle p-5 flex flex-col gap-3">
				<div className="flex items-center gap-3">
					<div className="size-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
						<Icon as={GiftSvg} size="md" color="info" />
					</div>
					<div>
						<p className="text-body-sm font-bold text-text-primary">Invite friend, get rewarded</p>
						<p className="text-caption text-text-muted leading-snug">
							Invite your crew and unlock meetday rewards when they join.
						</p>
					</div>
				</div>
				<div className="flex items-center justify-between">
					<AvatarStack color="warning" />
					<Button variant="secondary" size="sm" radius="md" leftIcon={<Icon as={GiftSvg} size="sm" color="inherit" />}>
						Invite friends
					</Button>
				</div>
			</div>
		</div>
	)
}
