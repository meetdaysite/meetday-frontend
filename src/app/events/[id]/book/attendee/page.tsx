"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import { Checkbox } from "@/components/ui/Checkbox"
import { Skeleton } from "@/components/ui/Skeleton"
import AltArrowLeftSvg from "@/icons/outlined/alt-arrow-left.svg"
import { useBookingStore } from "@/store/bookingStore"
import { createOrder, confirmFreeOrder, getOrderDetail, initiatePayment, verifyPayment, getPricingConfig } from "@/lib/ordersApi"
import { getApiErrorMessage } from "@/lib/errors"
import { getPublicEventDetails } from "@/lib/api"
import type { PublicEventDetails } from "@/types/attendee"
import type { PricingConfig } from "@/lib/ordersApi"
import { EventPreviewBar } from "../_components/EventPreviewBar"
import { BookingStepBadge } from "../_components/BookingStepBadge"
import { OrderSummary } from "../_components/OrderSummary"
import { AttendeeForm } from "../_components/AttendeeForm"

interface PageProps {
	params: Promise<{ id: string }>
}

function AttendeeDetailsContent({ event, pricingConfig }: { event: PublicEventDetails; pricingConfig: PricingConfig }) {
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

	const selectedTickets = event.tickets.filter(t => (quantities[t.id] ?? 0) > 0)
	const totalTickets = Object.values(quantities).reduce((a, b) => a + b, 0)
	const isPaidOrder = selectedTickets.some(t => !t.isFree)

	// Build flat list of all attendee slots; slot at globalIndex 0 is the primary (logged-in user)
	const allSlots: { ticketId: string; ticketName: string; slotIndex: number; globalIndex: number }[] = []
	let globalIndex = 0
	selectedTickets.forEach(ticket => {
		const qty = quantities[ticket.id] ?? 0
		for (let i = 0; i < qty; i++) {
			allSlots.push({ ticketId: ticket.id, ticketName: ticket.name, slotIndex: i, globalIndex })
			globalIndex++
		}
	})

	// Only additional attendees (not the primary) need details
	const additionalSlots = allSlots.filter(s => s.globalIndex > 0)

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
			const items = selectedTickets.map(ticket => {
				const slots = attendeesByTicket[ticket.id] ?? []
				// Primary attendee (first slot of the first ticket) is excluded from groupAttendees
				const additionalSlots = ticket.id === firstTicketId ? slots.slice(1) : slots
				return {
					ticketId: ticket.id,
					quantity: quantities[ticket.id],
					groupAttendees: additionalSlots.map(slot => ({
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

			if (order.totalAmount === 0) {
				await confirmFreeOrder(order.id)
				const confirmed = await getOrderDetail(order.id)
				setConfirmedOrder(confirmed)
				router.push(`/events/${event.id}/book/confirmed?orderId=${order.id}`)
				return
			}

			const { razorpayOrderId, amount, currency, keyId } = await initiatePayment(order.id)

			const rzp = new window.Razorpay({
				key: keyId,
				amount,
				currency,
				order_id: razorpayOrderId,
				name: "Meetday",
				description: event.title,
				handler: async response => {
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

			rzp.on("payment.failed", response => {
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
							<h1 className="text-heading-md font-extrabold text-text-primary">
								Attendee details
							</h1>
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
								onChange={data => {
									const current = attendeesByTicket[ticketId]?.[slotIndex] ?? {
										fullName: "",
										email: "",
									}
									setAttendeeSlot(ticketId, slotIndex, { ...current, ...data })
								}}
							/>
						))}

						{/* Terms */}
						<div className="flex flex-col gap-2">
							<Checkbox checked={agreedToTerms} onChange={v => setAgreedToTerms(v)} label="" />
							<p className="-mt-7 ml-7 text-label-sm text-text-secondary leading-snug">
								I agree to the{" "}
								<span className="text-text-brand cursor-pointer hover:underline">
									Terms of Service
								</span>{" "}
								and{" "}
								<span className="text-text-brand cursor-pointer hover:underline">
									Privacy Policy
								</span>
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
								{submitting ? "Processing…" : isPaidOrder ? "Continue to Payment" : "Confirm Booking"}
							</Button>
						</div>
					</div>

					{/* Right: order summary (desktop only) */}
					<aside className="hidden lg:flex flex-col gap-4 w-80 shrink-0 sticky top-6">
						<OrderSummary
							tickets={event.tickets}
							quantities={quantities}
							pricingConfig={pricingConfig}
							promoDiscount={promoDiscount}
							onContinue={handleSubmit}
							continueLabel={isPaidOrder ? "Continue to Payment" : "Confirm Booking"}
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
	const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null)

	useEffect(() => {
		Promise.all([getPublicEventDetails(id), getPricingConfig(id)]).then(([e, pc]) => {
			if (e) setEvent(e)
			setPricingConfig(pc)
		})
	}, [id])

	if (!event || !pricingConfig) {
		return (
			<main className="flex-1 py-6 md:py-8 pb-12">
				<div className="max-w-384 mx-auto px-(--space-page-x-mobile) md:px-(--space-page-x-tablet) lg:px-(--space-page-x-desktop)">
					<div className="flex gap-8 items-start">
						<div className="flex-1 min-w-0 flex flex-col gap-5">
							<Skeleton.Text className="w-44 animate-pulse" />
							<div className="flex flex-col gap-2 animate-pulse">
								<Skeleton.Text className="h-8 w-48" />
								<Skeleton.Text className="w-64" />
							</div>
							<Skeleton.Block className="h-6 w-36 rounded-badge animate-pulse" />
							<div className="rounded-action bg-surface-card border border-border-default p-4 flex gap-5 animate-pulse">
								<Skeleton.Block className="w-40 rounded-action shrink-0 min-h-25" />
								<div className="flex-1 flex flex-col gap-3 py-0.5">
									<div className="flex flex-col gap-2">
										<Skeleton.Text className="h-5 w-3/4" />
										<Skeleton.Text className="w-1/2" />
									</div>
									<div className="h-px bg-border-default w-full" />
									<Skeleton.Text className="w-36" />
								</div>
							</div>
							<div className="rounded-action border border-border-default p-4 flex flex-col gap-4 animate-pulse">
								<Skeleton.Text className="h-5 w-40" />
								{[...Array(2)].map((_, i) => (
									<div key={i} className="flex flex-col gap-1.5">
										<Skeleton.Text className="w-20 h-4" />
										<Skeleton.Block className="h-10 rounded-action" />
									</div>
								))}
							</div>
							<div className="flex gap-3 items-start animate-pulse">
								<Skeleton.Block className="size-4 rounded shrink-0 mt-0.5" />
								<Skeleton.Text className="w-56" />
							</div>
						</div>
						<aside className="hidden lg:flex flex-col w-80 shrink-0">
							<Skeleton.Block className="h-64 rounded-action" />
						</aside>
					</div>
				</div>
			</main>
		)
	}

	return <AttendeeDetailsContent event={event} pricingConfig={pricingConfig} />
}
