"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Icon } from "@/components/ui/Icon"
import AltArrowLeftSvg from "@/icons/outlined/alt-arrow-left.svg"
import { useBookingStore } from "@/store/bookingStore"
import { EventPreviewBar } from "./_components/EventPreviewBar"
import { TicketSelector } from "./_components/TicketSelector"
import { OrderSummary } from "./_components/OrderSummary"
import { getPublicEventDetails } from "@/lib/api"
import type { PublicEventDetails } from "@/types/attendee"

interface PageProps {
	params: Promise<{ id: string }>
}

function SelectTicketContent({ event }: { event: PublicEventDetails }) {
	const router = useRouter()
	const {
		quantities,
		promoCode,
		promoApplied,
		promoDiscount,
		promoError,
		setEventId,
		setQuantity,
		setPromoCode,
		setPromoError,
		clearPromo,
		initAttendeeSlots,
	} = useBookingStore()

	useEffect(() => {
		setEventId(event.id)
		event.tickets.forEach((t) => setQuantity(t.id, 1))
	}, [event.id, setEventId]) // eslint-disable-line react-hooks/exhaustive-deps

	const totalTickets = Object.values(quantities).reduce((a, b) => a + b, 0)

	const handleContinue = () => {
		event.tickets.forEach((t) => {
			const qty = quantities[t.id] ?? 1
			if (qty > 0) initAttendeeSlots(t.id, qty)
		})
		router.push(`/events/${event.id}/book/attendee`)
	}

	const handlePromoApply = async () => {
		// TODO: wire up to coupon validation API when available
		if (promoCode.trim().length < 3) {
			setPromoError("Invalid promo code.")
			return
		}
		setPromoError("Promo code not recognised.")
	}

	return (
		<main className="flex-1 py-6 md:py-8 pb-12">
			<div className="max-w-384 mx-auto px-(--space-page-x-mobile) md:px-(--space-page-x-tablet) lg:px-(--space-page-x-desktop)">
				{/* Two-column layout wraps the entire page */}
				<div className="flex gap-8 items-start">
					{/* Left: all main content */}
					<div className="flex-1 min-w-0 flex flex-col gap-5">
						<Link
							href={`/events/${event.id}`}
							className="inline-flex items-center gap-1.5 text-body-sm text-text-primary hover:text-text-primary transition-colors"
						>
							<Icon as={AltArrowLeftSvg} size="sm" color="primary" />
							Back to Events
						</Link>

						<div>
							<h1 className="text-heading-md font-extrabold text-text-primary">
								Choose your <span className="text-text-brand">ticket</span>
							</h1>
							<p className="text-body-sm text-text-secondary mt-1">
								Select the perfect access for an unforgettable night.
							</p>
						</div>

						<EventPreviewBar event={event} />
						<TicketSelector
							tickets={event.tickets}
							quantities={quantities}
							promoCode={promoCode}
							promoApplied={promoApplied}
							promoError={promoError}
							onQuantityChange={setQuantity}
							onPromoCodeChange={setPromoCode}
							onPromoApply={handlePromoApply}
							onPromoClear={clearPromo}
						/>
					</div>

					{/* Right: order summary (desktop only) */}
					<aside className="hidden lg:flex flex-col gap-4 w-80 shrink-0 sticky top-6">
						<OrderSummary
							tickets={event.tickets}
							quantities={quantities}
							promoDiscount={promoDiscount}
							onContinue={handleContinue}
							continueLabel="Continue"
							continueDisabled={totalTickets === 0}
						/>
					</aside>
				</div>

				{/* Mobile sticky footer */}
				{totalTickets > 0 && (
					<div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-surface-card border-t border-border-default">
						<button
							type="button"
							onClick={handleContinue}
							className="w-full h-(--size-action-lg) rounded-action bg-action-primary text-action-primary-text text-label-md font-medium"
						>
							Continue — {totalTickets} ticket{totalTickets !== 1 ? "s" : ""}
						</button>
					</div>
				)}
			</div>
		</main>
	)
}

export default function SelectTicketPage({ params }: PageProps) {
	const { id } = use(params)
	const [event, setEvent] = useState<PublicEventDetails | null>(null)

	useEffect(() => {
		getPublicEventDetails(id).then((e) => {
			if (e) setEvent(e)
		})
	}, [id])

	if (!event) {
		return (
			<main className="flex-1 flex items-center justify-center py-24">
				<div className="size-8 rounded-full border-2 border-action-primary border-t-transparent animate-spin" />
			</main>
		)
	}

	return <SelectTicketContent event={event} />
}
