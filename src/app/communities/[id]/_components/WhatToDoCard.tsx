import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import CalendarSvg from "@/icons/filled/calendar.svg"
import ChatSvg from "@/icons/filled/chat.svg"
import BellSvg from "@/icons/filled/bell.svg"
import ArrowRightSvg from "@/icons/outlined/arrow-right.svg"

interface WhatToDoItem {
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
	title: string
	description: string
	buttonLabel: string
	memberButtonLabel: string
	cardBg: string
	iconWrapperBg: string
	iconColor: React.ComponentPropsWithoutRef<typeof Icon>["color"]
	buttonClassName: string
}

const ITEMS: WhatToDoItem[] = [
	{
		icon: CalendarSvg,
		title: "Explore Experiences",
		description: "See upcoming music-led experiences from this community.",
		buttonLabel: "View Experiences",
		memberButtonLabel: "View Experiences",
		cardBg: "bg-green-50 border-green-100",
		iconWrapperBg: "bg-green-100",
		iconColor: "success",
		buttonClassName: "bg-emerald-600 text-white hover:bg-emerald-700 border-0",
	},
	{
		icon: ChatSvg,
		title: "Preview Chat",
		description: "See what conversations are happening.",
		buttonLabel: "Join to Chat",
		memberButtonLabel: "Open Chat",
		cardBg: "bg-surface-vibe-soft border-purple-100",
		iconWrapperBg: "bg-purple-100",
		iconColor: "vibe",
		buttonClassName: "bg-violet-600 text-white hover:bg-violet-700 border-0",
	},
	{
		icon: BellSvg,
		// TODO: Replace with a filled bell/megaphone icon once available
		title: "Announcements",
		description: "Stay updated with official news and event drops.",
		buttonLabel: "Join to Get Updates",
		memberButtonLabel: "See Announcements",
		cardBg: "bg-surface-info-soft border-blue-100",
		iconWrapperBg: "bg-blue-100",
		iconColor: "info",
		buttonClassName: "bg-blue-600 text-white hover:bg-blue-700 border-0",
	},
]

export function WhatToDoCard({ isMember }: { isMember: boolean }) {
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
						className={`flex flex-col gap-3 p-4 rounded-action border ${item.cardBg}`}
					>
						{/* 2-col: icon (left) + text (right) */}
						<div className="grid grid-cols-[auto_1fr] gap-3 items-start">
							{/* Icon with colored bg */}
							<div
								className={`size-10 rounded-lg ${item.iconWrapperBg} flex items-center justify-center shrink-0`}
							>
								<Icon as={item.icon} size="md" color={item.iconColor} />
							</div>
							{/* Title + description */}
							<div className="flex flex-col gap-1 pt-0.5">
								<p className="text-body-sm font-semibold text-text-primary leading-tight">
									{item.title}
								</p>
								<p className="text-label-sm text-text-secondary font-normal leading-snug">
									{item.description}
								</p>
							</div>
						</div>

						{/* Button */}
						<Button
							variant="secondary"
							size="sm"
							radius="pill"
							className={item.buttonClassName}
							rightIcon={<Icon as={ArrowRightSvg} size="sm" color="inverse" />}
						>
							{isMember ? item.memberButtonLabel : item.buttonLabel}
						</Button>
					</div>
				))}
			</div>
		</div>
	)
}
