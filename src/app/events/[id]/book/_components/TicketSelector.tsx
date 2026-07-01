"use client"

import { useState } from "react"
import { TextField } from "@/components/ui/TextField"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import TagPriceSvg from "@/icons/outlined/tag-price.svg"
import { TicketCard } from "./TicketCard"
import { AvailableOffersModal } from "./AvailableOffersModal"
import type { PublicTicket } from "@/types/attendee"
import type { AvailableOffer } from "@/lib/ordersApi"

interface TicketSelectorProps {
	tickets: PublicTicket[]
	quantities: Record<string, number>
	allFree: boolean
	promoCode: string
	promoApplied: boolean
	promoError: string | null
	availableOffers: AvailableOffer[]
	onQuantityChange: (ticketId: string, qty: number) => void
	onPromoCodeChange: (code: string) => void
	onPromoApply: () => void
	onPromoClear: () => void
	onOfferSelect: (code: string) => Promise<void>
}

export function TicketSelector({
	tickets,
	quantities,
	allFree,
	promoCode,
	promoApplied,
	promoError,
	availableOffers,
	onQuantityChange,
	onPromoCodeChange,
	onPromoApply,
	onPromoClear,
	onOfferSelect,
}: TicketSelectorProps) {
	const [promoLoading, setPromoLoading] = useState(false)
	const [offersOpen, setOffersOpen] = useState(false)
	const [applyingCode, setApplyingCode] = useState<string | null>(null)

	const handleApply = async () => {
		if (!promoCode.trim()) return
		setPromoLoading(true)
		await onPromoApply()
		setPromoLoading(false)
	}

	const handleOfferApply = async (code: string) => {
		setApplyingCode(code)
		await onOfferSelect(code)
		setApplyingCode(null)
		setOffersOpen(false)
	}

	return (
		<div className="flex flex-col gap-4">
			<h2 className="text-body-md font-bold text-text-primary">Select your tickets</h2>

			{/* Ticket cards */}
			<div className="flex flex-col gap-3">
				{tickets.length === 0 ? (
					<div className="rounded-action border border-border-default bg-surface-card p-6 flex flex-col items-center gap-2 text-center">
						<p className="text-body-sm font-medium text-text-primary">Tickets coming soon</p>
						<p className="text-label-sm text-text-muted">The organiser hasn&apos;t published ticket tiers yet. Check back shortly.</p>
					</div>
				) : (
					tickets.map((ticket, index) => (
						<TicketCard
							key={ticket.id}
							ticket={ticket}
							tierIndex={index}
							quantity={quantities[ticket.id] ?? 1}
							onQuantityChange={(qty) => onQuantityChange(ticket.id, qty)}
						/>
					))
				)}
			</div>

			{/* Promo code card — hidden for fully free events */}
			{!allFree && <div className="rounded-panel border border-border-default bg-surface-card p-4 flex items-start gap-4 shadow-md">
				<div className="size-10 shrink-0 rounded-action bg-surface-brand-soft flex items-center justify-center">
					<Icon as={TagPriceSvg} size="md" color="brand" />
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-body-sm font-semibold text-text-primary mb-0.5">Have a promo code?</p>
					<p className="text-label-sm text-text-muted mb-3">Enter code to get your discount</p>
					<div className="flex items-start gap-2">
						<div className="flex-1">
							<TextField
								placeholder="Enter code"
								value={promoCode}
								onChange={(e) => {
									onPromoCodeChange(e.target.value.toUpperCase())
									if (promoApplied) onPromoClear()
								}}
								error={!!promoError}
								helperText={promoError ?? undefined}
								disabled={promoApplied}
							/>
						</div>
						<Button
							variant="secondary"
							size="md"
							radius="md"
							onClick={handleApply}
							disabled={!promoCode.trim() || promoLoading}
							className="shrink-0"
						>
							{promoApplied ? "Applied" : promoLoading ? "Checking…" : "Apply"}
						</Button>
					</div>

					{availableOffers.length > 0 && !promoApplied && (
						<button
							type="button"
							onClick={() => setOffersOpen(true)}
							className="mt-2.5 flex items-center gap-1.5 text-caption font-medium text-text-brand hover:underline"
						>
							<Icon as={TagPriceSvg} size="xs" color="brand" />
							{availableOffers.length} offer{availableOffers.length !== 1 ? "s" : ""} available for this event
						</button>
					)}
				</div>
			</div>}

			<AvailableOffersModal
				open={offersOpen}
				onClose={() => setOffersOpen(false)}
				offers={availableOffers}
				onApply={handleOfferApply}
				applyingCode={applyingCode}
			/>
		</div>
	)
}
