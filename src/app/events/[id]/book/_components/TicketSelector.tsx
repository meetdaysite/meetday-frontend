"use client"

import { useState } from "react"
import { TextField } from "@/components/ui/TextField"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import TagPriceSvg from "@/icons/outlined/tag-price.svg"
import { TicketCard } from "./TicketCard"
import type { PublicTicket } from "@/types/attendee"

interface TicketSelectorProps {
	tickets: PublicTicket[]
	quantities: Record<string, number>
	promoCode: string
	promoApplied: boolean
	promoError: string | null
	onQuantityChange: (ticketId: string, qty: number) => void
	onPromoCodeChange: (code: string) => void
	onPromoApply: () => void
	onPromoClear: () => void
}

export function TicketSelector({
	tickets,
	quantities,
	promoCode,
	promoApplied,
	promoError,
	onQuantityChange,
	onPromoCodeChange,
	onPromoApply,
	onPromoClear,
}: TicketSelectorProps) {
	const [promoLoading, setPromoLoading] = useState(false)

	const handleApply = async () => {
		if (!promoCode.trim()) return
		setPromoLoading(true)
		await onPromoApply()
		setPromoLoading(false)
	}

	return (
		<div className="flex flex-col gap-4">
			<h2 className="text-body-md font-bold text-text-primary">Select your tickets</h2>

			{/* Ticket cards */}
			<div className="flex flex-col gap-3">
				{tickets.map((ticket, index) => (
					<TicketCard
						key={ticket.id}
						ticket={ticket}
						tierIndex={index}
						quantity={quantities[ticket.id] ?? 0}
						onQuantityChange={(qty) => onQuantityChange(ticket.id, qty)}
					/>
				))}
			</div>

			{/* Promo code card */}
			<div className="rounded-action border border-border-subtle bg-surface-card p-4 flex items-start gap-4">
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
								helperText={
									promoError
										? promoError
										: promoApplied
											? "Promo code applied!"
											: undefined
								}
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
				</div>
			</div>
		</div>
	)
}
