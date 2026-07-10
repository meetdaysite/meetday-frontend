import { Icon } from "@/components/ui/Icon"
import TicketSvg from "@/icons/filled/ticket.svg"
import WarningSvg from "@/icons/filled/verified-check.svg"

interface BookingStepBadgeProps {
	totalTickets: number
}

export function BookingStepBadge({ totalTickets }: BookingStepBadgeProps) {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-badge text-caption font-medium whitespace-nowrap bg-surface-info-soft text-text-info border border-blue-200">
				<Icon as={TicketSvg} size="sm" color="inherit" />
				{totalTickets} Ticket{totalTickets !== 1 ? "s" : ""} Selected
			</span>
			<span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-badge text-caption font-medium whitespace-nowrap bg-surface-brand-soft text-text-brand border border-red-200">
				<Icon as={WarningSvg} size="sm" color="inherit" />
				All Attendee Details Required Before Payment
			</span>
		</div>
	)
}
