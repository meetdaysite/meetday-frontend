import { Icon } from "@/components/ui/Icon"
import TicketSvg from "@/icons/outlined/ticket.svg"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import UsersGroupSvg from "@/icons/outlined/users-group.svg"
import type { PublicTicket } from "@/types/attendee"

function formatSaleDate(dateStr?: string): string {
	if (!dateStr) return ""
	return new Date(dateStr).toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
	})
}

export function TicketsSection({
	tickets,
	isFree,
}: {
	tickets: PublicTicket[]
	isFree: boolean
}) {
	return (
		<section>
			<h2 className="text-title-md text-text-primary mb-4">Tickets</h2>

			{tickets.length === 0 ? (
				<div className="p-6 rounded-card bg-surface-card border border-border-subtle text-center">
					<p className="text-body-md text-text-muted">No ticket information available yet.</p>
				</div>
			) : (
				<div className="flex flex-col gap-3">
					{tickets.map(ticket => (
						<div
							key={ticket.id}
							className="p-5 rounded-card bg-surface-card border border-border-subtle flex flex-col gap-4"
						>
							{/* Name + price */}
							<div className="flex items-start justify-between gap-3">
								<div className="flex items-center gap-2">
									<Icon as={TicketSvg} size="sm" color="brand" />
									<span className="text-label-md font-semibold text-text-primary">
										{ticket.name}
									</span>
								</div>
								<span className="text-title-md font-bold text-text-brand shrink-0">
									{isFree ? "Free" : `₹${ticket.price}`}
								</span>
							</div>

							{ticket.description && (
								<p className="text-body-sm text-text-secondary">{ticket.description}</p>
							)}

							{/* Meta */}
							<div className="flex flex-wrap gap-4 pt-3 border-t border-border-subtle">
								<div className="flex items-center gap-1.5">
									<Icon as={UsersGroupSvg} size="sm" color="muted" />
									<span className="text-body-sm text-text-secondary">
										{ticket.totalCapacity} capacity · max {ticket.maxPerPerson} per person
									</span>
								</div>
								{ticket.saleStartDate && (
									<div className="flex items-center gap-1.5">
										<Icon as={CalendarSvg} size="sm" color="muted" />
										<span className="text-body-sm text-text-secondary">
											Sale ends {formatSaleDate(ticket.saleEndDate)}
										</span>
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</section>
	)
}
