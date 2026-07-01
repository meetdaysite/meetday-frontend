"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Icon } from "@/components/ui/Icon"
import { Skeleton } from "@/components/ui/Skeleton"
import AltArrowLeftSvg from "@/icons/outlined/alt-arrow-left.svg"
import { useBookingStore } from "@/store/bookingStore"
import { useAuthStore } from "@/store/authStore"
import { EventPreviewBar } from "./_components/EventPreviewBar"
import { TicketSelector } from "./_components/TicketSelector"
import { OrderSummary } from "./_components/OrderSummary"
import { getPublicEventDetails } from "@/lib/api"
import { getPricingConfig, validateCoupon, getAvailableOffers } from "@/lib/ordersApi"
import { getApiErrorMessage } from "@/lib/errors"
import { toast } from "sonner"
import type { PublicEventDetails } from "@/types/attendee"
import type { PricingConfig, AvailableOffer } from "@/lib/ordersApi"

interface PageProps {
	params: Promise<{ id: string }>
}

function SelectTicketContent({
	event,
	pricingConfig,
	availableOffers,
}: {
	event: PublicEventDetails
	pricingConfig: PricingConfig
	availableOffers: AvailableOffer[]
}) {
	const router = useRouter()
	const {
		eventId: storedEventId,
		quantities,
		promoCode,
		promoApplied,
		promoDiscount,
		promoError,
		setEventId,
		setQuantity,
		setPromoCode,
		setPromoApplied,
		setPromoError,
		clearPromo,
		initAttendeeSlots,
	} = useBookingStore()

	useEffect(() => {
		if (storedEventId && storedEventId !== event.id) {
			clearPromo()
		}
		setEventId(event.id)
		event.tickets.forEach((t) => setQuantity(t.id, 1))
	}, [event.id, setEventId]) // eslint-disable-line react-hooks/exhaustive-deps

	const totalTickets = Object.values(quantities).reduce((a, b) => a + b, 0)
	const allFree = event.isFree || (
		event.tickets.length > 0 &&
		event.tickets.every(t => t.isFree || parseFloat(t.price) === 0)
	)

	const handleContinue = () => {
		event.tickets.forEach((t) => {
			const qty = quantities[t.id] ?? 1
			if (qty > 0) initAttendeeSlots(t.id, qty)
		})
		router.push(`/events/${event.id}/book/attendee`)
	}

	const buildItems = () =>
		event.tickets
			.filter((t) => (quantities[t.id] ?? 0) > 0)
			.map((t) => ({ ticketId: t.id, quantity: quantities[t.id] }))

	const applyPromoCode = async (code: string) => {
		try {
			const result = await validateCoupon({ eventId: event.id, couponCode: code, items: buildItems() })
			setPromoApplied(result.discountAmount)
			toast.success(`Promo code applied! You saved ₹${result.discountAmount}.`)
		} catch (err) {
			setPromoError(getApiErrorMessage(err))
		}
	}

	const handlePromoApply = async () => {
		if (!promoCode.trim()) return
		await applyPromoCode(promoCode.trim())
	}

	const handleOfferSelect = async (code: string) => {
		setPromoCode(code)
		await applyPromoCode(code)
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
							allFree={allFree}
							promoCode={promoCode}
							promoApplied={promoApplied}
							promoError={promoError}
							availableOffers={availableOffers}
							onQuantityChange={setQuantity}
							onPromoCodeChange={setPromoCode}
							onPromoApply={handlePromoApply}
							onPromoClear={clearPromo}
							onOfferSelect={handleOfferSelect}
						/>
					</div>

					{/* Right: order summary (desktop only) */}
					<aside className="hidden lg:flex flex-col gap-4 w-80 shrink-0 sticky top-6">
						<OrderSummary
							tickets={event.tickets}
							quantities={quantities}
							pricingConfig={pricingConfig}
							promoDiscount={promoDiscount}
							onContinue={handleContinue}
							continueLabel="Continue"
							continueDisabled={totalTickets === 0}
							eventId={event.id}
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
	const { authLoading } = useAuthStore()
	const [event, setEvent] = useState<PublicEventDetails | null>(null)
	const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null)
	const [availableOffers, setAvailableOffers] = useState<AvailableOffer[]>([])

	// Public fetches — no auth needed
	useEffect(() => {
		Promise.all([getPublicEventDetails(id), getPricingConfig(id)]).then(([e, pc]) => {
			if (e) setEvent(e)
			setPricingConfig(pc)
		})
	}, [id])

	// Authenticated fetch — wait for Firebase to resolve auth state
	useEffect(() => {
		if (authLoading) return
		getAvailableOffers(id)
			.then(setAvailableOffers)
			.catch(() => setAvailableOffers([]))
	}, [id, authLoading])

	if (!event || !pricingConfig) {
		return (
			<main className="flex-1 py-6 md:py-8 pb-12">
				<div className="max-w-384 mx-auto px-(--space-page-x-mobile) md:px-(--space-page-x-tablet) lg:px-(--space-page-x-desktop)">
					<div className="flex gap-8 items-start">
						<div className="flex-1 min-w-0 flex flex-col gap-5">
							<Skeleton.Text className="w-28 animate-pulse" />
							<div className="flex flex-col gap-2 animate-pulse">
								<Skeleton.Text className="h-8 w-52" />
								<Skeleton.Text className="w-64" />
							</div>
							<div className="rounded-action bg-surface-card border border-border-default p-4 flex gap-5 animate-pulse">
								<Skeleton.Block className="w-40 rounded-action shrink-0 min-h-25" />
								<div className="flex-1 flex flex-col gap-3 py-0.5">
									<div className="flex flex-col gap-2">
										<Skeleton.Text className="h-5 w-3/4" />
										<Skeleton.Text className="w-1/2" />
										<Skeleton.Text className="w-2/3" />
									</div>
									<div className="h-px bg-border-default w-full" />
									<Skeleton.Text className="w-36" />
								</div>
							</div>
							{[...Array(2)].map((_, i) => (
								<div key={i} className="rounded-action border border-border-default p-4 flex flex-col gap-3 animate-pulse">
									<div className="flex items-start justify-between gap-4">
										<div className="flex flex-col gap-1.5 flex-1">
											<Skeleton.Text className="h-5 w-32" />
											<Skeleton.Text className="w-48" />
										</div>
										<Skeleton.Text className="h-6 w-16 rounded-badge shrink-0" />
									</div>
									<div className="flex items-center justify-between">
										<Skeleton.Text className="h-7 w-20" />
										<div className="flex items-center gap-3">
											<Skeleton.Block className="size-8 rounded-full" />
											<Skeleton.Text className="w-4 h-5" />
											<Skeleton.Block className="size-8 rounded-full" />
										</div>
									</div>
								</div>
							))}
						</div>
						<aside className="hidden lg:flex flex-col w-80 shrink-0">
							<Skeleton.Block className="h-64 rounded-action" />
						</aside>
					</div>
				</div>
			</main>
		)
	}

	return <SelectTicketContent event={event} pricingConfig={pricingConfig} availableOffers={availableOffers} />
}
