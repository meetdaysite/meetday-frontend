import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import ChatSvg from "@/icons/outlined/chat.svg"
import BellSvg from "@/icons/outlined/bell.svg"
import ArrowRightSvg from "@/icons/outlined/arrow-right.svg"

interface WhatToDoItem {
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
	iconColor: React.ComponentPropsWithoutRef<typeof Icon>["color"]
	title: string
	description: string
	buttonLabel: string
	buttonClassName?: string
	onClick?: () => void
}

const ITEMS: WhatToDoItem[] = [
	{
		icon: CalendarSvg,
		iconColor: "success",
		title: "Explore Experiences",
		description: "See upcoming Meetday events happening from this community.",
		buttonLabel: "View Experiences",
		buttonClassName: "bg-emerald-600 text-white hover:bg-emerald-700 border-0",
	},
	{
		icon: ChatSvg,
		iconColor: "brand",
		title: "Preview Chat",
		description: "See what conversations are happening.",
		buttonLabel: "Join to Chat",
		buttonClassName: "bg-action-primary text-white hover:opacity-90 border-0",
	},
	{
		icon: BellSvg,
		iconColor: "warning",
		title: "Announcements",
		description: "Stay updated with official news and event drops.",
		buttonLabel: "Join to Get Updates",
		buttonClassName: "bg-amber-500 text-white hover:bg-amber-600 border-0",
	},
]

export function WhatToDoCard() {
	return (
		<div className="rounded-panel bg-surface-card border border-border-default p-5">
			<p className="text-body-md font-semibold text-text-primary">What do you want to do?</p>
			<p className="text-label-sm text-text-secondary font-normal mt-0.5">
				Discover what&apos;s inside this community.
			</p>

			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
				{ITEMS.map(item => (
					<div
						key={item.title}
						className="flex flex-col gap-3 p-4 rounded-action border border-border-default bg-surface-page"
					>
						<Icon as={item.icon} size="xl" color={item.iconColor} />
						<div className="flex flex-col gap-1">
							<p className="text-body-sm font-semibold text-text-primary">{item.title}</p>
							<p className="text-label-sm text-text-secondary font-normal leading-snug">
								{item.description}
							</p>
						</div>
						<Button
							variant="secondary"
							size="sm"
							radius="pill"
							className={item.buttonClassName}
							rightIcon={<Icon as={ArrowRightSvg} size="sm" color="inverse" />}
						>
							{item.buttonLabel}
						</Button>
					</div>
				))}
			</div>
		</div>
	)
}
