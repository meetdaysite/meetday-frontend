import { Icon } from "@/components/ui/Icon"
import UsersGroupSvg from "@/icons/outlined/users-group.svg"
import type { PublicEventDetails } from "@/types/attendee"

export function EventAbout({ event }: { event: PublicEventDetails }) {
	const hasTags = event.tags.length > 0
	const hasMeta = !!(event.eventType || event.ageRestriction || event.languages.length > 0)

	if (!hasTags && !hasMeta) return null

	return (
		<div className="flex flex-col gap-4">
			{hasTags && (
				<div className="flex flex-wrap gap-2">
					{event.tags.map(tag => (
						<span
							key={tag}
							className="px-3 py-1 rounded-chip bg-surface-card-muted text-text-secondary text-label-sm"
						>
							#{tag}
						</span>
					))}
				</div>
			)}

			{hasMeta && (
				<div className="flex flex-wrap gap-3">
					{event.eventType && (
						<span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-chip bg-surface-card border border-border-subtle text-label-sm text-text-secondary">
							{event.eventType}
						</span>
					)}
					{event.ageRestriction && (
						<span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-chip bg-surface-card border border-border-subtle text-label-sm text-text-secondary">
							<Icon as={UsersGroupSvg} size="sm" color="muted" />
							{event.ageRestriction}
						</span>
					)}
					{event.languages.length > 0 && (
						<span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-chip bg-surface-card border border-border-subtle text-label-sm text-text-secondary">
							{event.languages.join(", ")}
						</span>
					)}
				</div>
			)}
		</div>
	)
}
