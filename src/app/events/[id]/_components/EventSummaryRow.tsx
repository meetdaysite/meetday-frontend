import { Icon } from "@/components/ui/Icon"
import CheckCircleSvg from "@/icons/filled/check-circle.svg"
import PulseSvg from "@/icons/filled/pulse.svg"
import UserCheckSvg from "@/icons/filled/user-check.svg"
import UsersGroupSvg from "@/icons/filled/users-group-2.svg"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import CheckSvg from "@/icons/outlined/check.svg"
import StarSvg from "@/icons/outlined/star.svg"
import UserSvg from "@/icons/outlined/user.svg"
import type { PublicEventDetails } from "@/types/attendee"

function ColHeader({
	icon,
	title,
	iconColor,
}: {
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
	title: string
	iconColor: React.ComponentPropsWithoutRef<typeof Icon>["color"]
}) {
	return (
		<div className="flex items-center gap-2">
			<Icon as={icon} size="md" color={iconColor} />
			<span className="text-body-md font-medium text-text-primary">{title}</span>
		</div>
	)
}

function CompactList({ items, fallback }: { items: string[]; fallback: string }) {
	if (items.length === 0) {
		return <p className="text-body-sm text-text-muted">{fallback}</p>
	}
	return (
		<ul className="flex flex-col gap-2">
			{items.map((item, i) => (
				<li key={i} className="flex items-start gap-2">
					<Icon as={CheckSvg} size="sm" color="success" className="mt-0.5 shrink-0" />
					<span className="text-label-sm text-text-secondary font-normal leading-normal">
						{item}
					</span>
				</li>
			))}
		</ul>
	)
}

export function EventSummaryRow({ event }: { event: PublicEventDetails }) {
	const host = event.hostProfile
	const hasRating = host.averageRating !== null && host.totalReviews > 0

	return (
		<div className="rounded-action bg-surface-card border border-border-subtle overflow-hidden grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border-subtle">
			{/* Col 1 — About */}
			<div className="p-5 flex flex-col gap-3">
				<ColHeader icon={PulseSvg} title="Vibe Summary" iconColor="brand" />
				<p className="text-label-sm font-normal text-text-secondary leading-normal line-clamp-5">
					{event.description || "No description available."}
				</p>
			</div>

			{/* Col 2 — What to expect */}
			<div className="p-5 flex flex-col gap-3">
				<ColHeader icon={CheckCircleSvg} title="What to expect" iconColor="success" />
				<CompactList items={event.whatToExpect} fallback="Details coming soon" />
			</div>

			{/* Col 3 — Who should attend */}
			<div className="p-5 flex flex-col gap-3">
				<ColHeader icon={UsersGroupSvg} title="Who should attend" iconColor="vibe" />
				<CompactList items={event.whoShouldAttend} fallback="Open to everyone" />
			</div>

			{/* Col 4 — About the host */}
			<div className="p-5 flex flex-col gap-3">
				<ColHeader icon={UserCheckSvg} title="Host Trust Signals" iconColor="info" />
				<div className="flex items-center gap-2.5">
					<div className="size-12 rounded-avatar bg-surface-brand-soft flex items-center justify-center shrink-0">
						<Icon as={UserSvg} size="lg" color="brand" />
					</div>
					<div className="min-w-0 flex flex-col gap-0.5">
						<p className="text-label-md font-semibold text-text-primary truncate">
							{host.displayName}
						</p>
						<div className="flex items-center gap-1.5">
							<Icon as={StarSvg} size="sm" color={hasRating ? "warning" : "muted"} />
							<span className="text-[10px] text-text-secondary">
								{hasRating
									? `${host.averageRating?.toFixed(1)} · ${host.totalReviews} review${host.totalReviews !== 1 ? "s" : ""}`
									: "No reviews yet"}
							</span>
						</div>
						<div className="flex items-center gap-1.5">
							<Icon as={CalendarSvg} size="sm" color="muted" />
							<span className="text-[10px] text-text-secondary">
								{host.totalEventsHosted > 0
									? `${host.totalEventsHosted} event${host.totalEventsHosted !== 1 ? "s" : ""} hosted`
									: "First event"}
							</span>
						</div>
					</div>
				</div>
				<div className="flex flex-col gap-1.5"></div>
			</div>
		</div>
	)
}
