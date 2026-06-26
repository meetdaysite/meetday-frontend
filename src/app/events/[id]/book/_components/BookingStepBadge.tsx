import { Icon } from "@/components/ui/Icon"
import TicketSvg from "@/icons/filled/ticket.svg"
import CheckCircleSvg from "@/icons/outlined/check-circle.svg"

interface BookingStepBadgeProps {
	totalTickets: number
}

export function BookingStepBadge({ totalTickets }: BookingStepBadgeProps) {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-badge bg-surface-brand-soft border border-border-brand">
				<Icon as={TicketSvg} size="sm" color="brand" />
				<span className="text-label-sm font-medium text-text-brand">
					{totalTickets} Ticket{totalTickets !== 1 ? "s" : ""} Selected
				</span>
			</div>
			<div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-badge bg-surface-card border border-border-default">
				<Icon as={CheckCircleSvg} size="sm" color="success" />
				<span className="text-label-sm text-text-secondary">
					All Attendee Details Required Before Payment
				</span>
			</div>
		</div>
	)
}
