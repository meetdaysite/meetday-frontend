"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import { Checkbox } from "@/components/ui/Checkbox"
import AltArrowLeftSvg from "@/icons/outlined/alt-arrow-left.svg"
import UsersGroupSvg from "@/icons/filled/users-group-2.svg"
import { useBookingStore } from "@/store/bookingStore"
import { createOrder, getOrderDetail, initiatePayment, verifyPayment } from "@/lib/ordersApi"
import { getApiErrorMessage } from "@/lib/errors"
import { getPublicEventDetails } from "@/lib/api"
import type { PublicEventDetails } from "@/types/attendee"
import { EventPreviewBar } from "../_components/EventPreviewBar"
import { BookingStepBadge } from "../_components/BookingStepBadge"
import { OrderSummary } from "../_components/OrderSummary"
import { AttendeeForm } from "../_components/AttendeeForm"

interface PageProps {
	params: Promise<{ id: string }>
}

function AttendeeDetailsContent({ event }: { event: PublicEventDetails }) {
	const router = useRouter()
	const {
		quantities,
		promoCode,
		promoDiscount,
		attendeesByTicket,
		agreedToTerms,
		setAttendeeSlot,
		setAgreedToTerms,
		setPendingOrderId,
		setConfirmedOrder,
	} = useBookingStore()

	const [submitting, setSubmitting] = useState(false)
	const [submitError, setSubmitError] = useState<string | null>(null)

	useEffect(() => {
		if (document.getElementById("razorpay-checkout-js")) return
		const script = document.createElement("script")
		script.id = "razorpay-checkout-js"
		script.src = "https://checkout.razorpay.com/v1/checkout.js"
		script.async = true
		document.head.appendChild(script)
	}, [])

	const selectedTickets = event.tickets.filter((t) => (quantities[t.id] ?? 0) > 0)
	const totalTickets = Object.values(quantities).reduce((a, b) => a + b, 0)

	// Build flat list of all attendee slots; slot at globalIndex 0 is the primary (logged-in user)
	const allSlots: { ticketId: string; ticketName: string; slotIndex: number; globalIndex: number }[] = []
	let globalIndex = 0
	selectedTickets.forEach((ticket) => {
		const qty = quantities[ticket.id] ?? 0
		for (let i = 0; i < qty; i++) {
			allSlots.push({ ticketId: ticket.id, ticketName: ticket.name, slotIndex: i, globalIndex })
			globalIndex++
		}
	})

	// Only additional attendees (not the primary) need details
	const additionalSlots = allSlots.filter((s) => s.globalIndex > 0)

	const isFormValid = additionalSlots.every(({ ticketId, slotIndex }) => {
		const slot = attendeesByTicket[ticketId]?.[slotIndex]
		return slot?.fullName?.trim() && slot?.email?.trim()
	})

	const handleSubmit = async () => {
		if (!isFormValid || !agreedToTerms) return
		setSubmitting(true)
		setSubmitError(null)

		try {
			const firstTicketId = selectedTickets[0]?.id
			const items = selectedTickets.map((ticket) => {
				const slots = attendeesByTicket[ticket.id] ?? []
				// Primary attendee (first slot of the first ticket) is excluded from groupAttendees
				const additionalSlots = ticket.id === firstTicketId ? slots.slice(1) : slots
				return {
					ticketId: ticket.id,
					quantity: quantities[ticket.id],
					groupAttendees: additionalSlots.map((slot) => ({
						fullName: slot.fullName,
						email: slot.email,
					})),
				}
			})

			const order = await createOrder({
				eventId: event.id,
				items,
				couponCode: promoCode || undefined,
			})

			setPendingOrderId(order.id)

			const { razorpayOrderId, amount, currency, keyId } = await initiatePayment(order.id)

			const rzp = new window.Razorpay({
				key: keyId,
				amount,
				currency,
				order_id: razorpayOrderId,
				name: "Meetday",
				description: "Event Ticket",
				handler: async (response) => {
					try {
						await verifyPayment({
							razorpayOrderId: response.razorpay_order_id,
							razorpayPaymentId: response.razorpay_payment_id,
							razorpaySignature: response.razorpay_signature,
							internalOrderId: order.id,
						})
						const confirmed = await getOrderDetail(order.id)
						setConfirmedOrder(confirmed)
						router.push(`/events/${event.id}/book/confirmed?orderId=${order.id}`)
					} catch (err: unknown) {
						setSubmitError(getApiErrorMessage(err))
						setSubmitting(false)
					}
				},
				modal: {
					ondismiss: () => {
						setSubmitting(false)
					},
				},
			})

			rzp.on("payment.failed", (response) => {
				setSubmitError(`Payment failed: ${response.error.description}`)
				setSubmitting(false)
			})

			rzp.open()
		} catch (err: unknown) {
			setSubmitError(getApiErrorMessage(err))
			setSubmitting(false)
		}
	}

	return (
		<main className="flex-1 py-6 md:py-8 pb-12">
			<div className="max-w-384 mx-auto px-(--space-page-x-mobile) md:px-(--space-page-x-tablet) lg:px-(--space-page-x-desktop)">
				{/* Two-column layout wraps the entire page */}
				<div className="flex gap-8 items-start">
					{/* Left: all main content */}
					<div className="flex-1 min-w-0 flex flex-col gap-5">
						<Link
							href={`/events/${event.id}/book`}
							className="inline-flex items-center gap-1.5 text-body-sm text-text-primary hover:text-text-primary transition-colors"
						>
							<Icon as={AltArrowLeftSvg} size="sm" color="primary" />
							Back to ticket selection
						</Link>

						<div>
							<h1 className="text-heading-md font-extrabold text-text-primary">Attendee details</h1>
							<p className="text-body-sm text-text-secondary mt-1">
								{additionalSlots.length > 0
									? "Enter details for the additional people joining this event."
									: "You're the only attendee — no extra details needed."}
							</p>
						</div>

						<BookingStepBadge totalTickets={totalTickets} />
						<EventPreviewBar event={event} />

						{/* Additional attendee forms (primary slot belongs to the logged-in user) */}
						{additionalSlots.map(({ ticketId, ticketName, slotIndex, globalIndex: gIdx }) => (
							<AttendeeForm
								key={`${ticketId}-${slotIndex}`}
								slot={attendeesByTicket[ticketId]?.[slotIndex] ?? { fullName: "", email: "" }}
								displayNumber={gIdx + 1}
								ticketName={ticketName}
								onChange={(data) => {
									const current = attendeesByTicket[ticketId]?.[slotIndex] ?? { fullName: "", email: "" }
									setAttendeeSlot(ticketId, slotIndex, { ...current, ...data })
								}}
							/>
						))}

						{/* Going with friends */}
						<div className="rounded-action border border-border-default bg-surface-card p-4 flex items-center gap-3">
							<div className="size-9 rounded-action bg-surface-vibe-soft flex items-center justify-center shrink-0">
								<Icon as={UsersGroupSvg} size="md" color="vibe" />
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-label-sm font-semibold text-text-primary">Going with friends?</p>
								<p className="text-caption text-text-muted leading-snug">
									Add friends to your booking list and make memories together.
								</p>
							</div>
							{/* Invite — commented until invite feature is live
							<Button variant="secondary" size="sm" radius="md" disabled>
								Invite friends
							</Button>
							*/}
						</div>

						{/* Terms */}
						<div className="flex flex-col gap-2">
							<Checkbox
								checked={agreedToTerms}
								onChange={(v) => setAgreedToTerms(v)}
								label=""
							/>
							<p className="-mt-7 ml-7 text-label-sm text-text-secondary leading-snug">
								I agree to the{" "}
								<span className="text-text-brand cursor-pointer hover:underline">Terms of Service</span>
								{" "}and{" "}
								<span className="text-text-brand cursor-pointer hover:underline">Privacy Policy</span>
							</p>
							<p className="text-caption text-text-muted ml-7">
								Tickets will be shown to the Primary attendee after payment.
							</p>
						</div>

						{/* Error */}
						{submitError && (
							<div className="rounded-action border border-red-200 bg-red-50 px-4 py-3">
								<p className="text-label-sm text-text-danger">{submitError}</p>
							</div>
						)}

						{/* Mobile CTA */}
						<div className="lg:hidden">
							<Button
								variant="primary"
								size="lg"
								radius="md"
								className="w-full"
								onClick={handleSubmit}
								disabled={!isFormValid || !agreedToTerms || submitting}
							>
								{submitting ? "Processing…" : "Continue to Payment"}
							</Button>
						</div>
					</div>

					{/* Right: order summary (desktop only) */}
					<aside className="hidden lg:flex flex-col gap-4 w-80 shrink-0 sticky top-6">
						<OrderSummary
							tickets={event.tickets}
							quantities={quantities}
							promoDiscount={promoDiscount}
							onContinue={handleSubmit}
							continueLabel="Continue to Payment"
							continueLoading={submitting}
							continueDisabled={!isFormValid || !agreedToTerms}
						/>
					</aside>
				</div>
			</div>
		</main>
	)
}

export default function AttendeeDetailsPage({ params }: PageProps) {
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

	return <AttendeeDetailsContent event={event} />
}
