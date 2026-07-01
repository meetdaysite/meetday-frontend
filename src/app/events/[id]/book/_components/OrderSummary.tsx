"use client"

import { useState } from "react"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import ShieldCheckSvg from "@/icons/outlined/shield-check.svg"
import CheckCircleSvg from "@/icons/filled/check-circle.svg"
import TicketSvg from "@/icons/filled/ticket.svg"
import InfoCircleSvg from "@/icons/outlined/info-circle.svg"
import HeadphonesSvg from "@/icons/filled/headphones.svg"
import { SupportTicketModal } from "@/components/attendee/SupportTicketModal"
import type { PublicTicket } from "@/types/attendee"
import type { PricingConfig } from "@/lib/ordersApi"

interface LineItem {
	label: string
	qty: number
	unitPrice: number
	isFree: boolean
}

interface OrderSummaryProps {
	tickets: PublicTicket[]
	quantities: Record<string, number>
	pricingConfig: PricingConfig
	promoDiscount?: number
	onContinue?: () => void
	continueLoading?: boolean
	continueLabel?: string
	continueDisabled?: boolean
	eventId?: string
}

function formatINR(amount: number): string {
	return `₹${amount.toLocaleString("en-IN")}`
}

function computeTotals(items: LineItem[], promoDiscount: number, config: PricingConfig) {
	const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0)
	const paidSubtotal = items.filter(i => !i.isFree).reduce((sum, i) => sum + i.unitPrice * i.qty, 0)
	const discounted = Math.max(0, subtotal - promoDiscount)
	const paidAfterDiscount = Math.max(0, paidSubtotal - promoDiscount)
	const platformFee = config.platformFeeWaived ? 0 : Math.round(paidAfterDiscount * config.platformFeeRate)
	const gst = Math.round((paidAfterDiscount + platformFee) * config.gstRate)
	const total = discounted + platformFee + gst
	return { subtotal, discounted, paidSubtotal, platformFee, gst, total }
}

const TRUST_SIGNALS = [
	{
		icon: CheckCircleSvg,
		title: "Instant Confirmation",
		body: "Your ticket will be confirmed instantly.",
		color: "info" as const,
	},
	{
		icon: InfoCircleSvg,
		title: "Refund clarity",
		body: "Cancel upto 24h before the event for a full credit.",
		color: "info" as const,
	},
	{
		icon: HeadphonesSvg,
		title: "24/7 Customer support",
		body: "Our team is here to help, anytime.",
		color: "info" as const,
	},
]

export function OrderSummary({
	tickets,
	quantities,
	pricingConfig,
	promoDiscount = 0,
	onContinue,
	continueLoading = false,
	continueLabel = "Continue",
	continueDisabled = false,
	eventId,
}: OrderSummaryProps) {
	const [supportOpen, setSupportOpen] = useState(false)
	const lineItems: LineItem[] = tickets
		.filter((t) => (quantities[t.id] ?? 0) > 0)
		.map((t) => ({
			label: t.name,
			qty: quantities[t.id],
			unitPrice: parseFloat(t.price),
			isFree: t.isFree,
		}))

	const { subtotal, discounted: _discounted, paidSubtotal, platformFee, gst, total } = computeTotals(lineItems, promoDiscount, pricingConfig)
	const totalTickets = Object.values(quantities).reduce((a, b) => a + b, 0)
	const allFree = paidSubtotal === 0

	return (
		<div className="rounded-panel bg-surface-card border border-border-default p-5 flex flex-col gap-5 shadow-md">
			{/* Header */}
			<div className="flex items-center justify-between">
				<span className="text-title-md font-bold text-text-primary">Order Summary</span>
				<div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-badge bg-surface-info-soft border border-blue-200">
					<span className="text-label-sm font-medium text-text-info">
						{totalTickets} Ticket{totalTickets !== 1 ? "s" : ""}
					</span>
				</div>
			</div>

			{/* Line items */}
			<div className="flex flex-col gap-3">
				{lineItems.length === 0 ? (
					<p className="text-body-sm text-text-muted text-center py-2">No tickets selected</p>
				) : (
					lineItems.map((item) => (
						<div key={item.label} className="flex items-start gap-2.5">
							<div className="size-8 rounded-badge bg-red-50 flex items-center justify-center shrink-0 border border-red-200">
								<Icon as={TicketSvg} size="sm" color="brand" />
							</div>
							<div className="flex-1 min-w-0 leading-tight">
								<div className="flex items-start justify-between gap-2">
									<span className="text-label-sm font-medium text-text-primary leading-snug">{item.label}</span>
									<span className="text-label-sm font-semibold text-text-primary shrink-0">
										{item.isFree ? (
											<span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-badge">FREE</span>
										) : (
											formatINR(item.unitPrice * item.qty)
										)}
									</span>
								</div>
								<span className="text-caption font-medium text-text-secondary">
									{item.qty} × {item.isFree ? "Free" : formatINR(item.unitPrice)}
								</span>
							</div>
						</div>
					))
				)}
			</div>

			<div className="border-t border-border-default" />

			{/* Fee breakdown */}
			<div className="flex flex-col gap-2">
				<div className="flex items-center justify-between">
					<span className="text-label-sm text-text-secondary">Subtotal</span>
					<span className="text-label-sm text-text-primary">{formatINR(subtotal)}</span>
				</div>
				{promoDiscount > 0 && (
					<div className="flex items-center justify-between">
						<span className="text-label-sm text-text-secondary">Promo Discount</span>
						<span className="text-label-sm text-icon-success">−{formatINR(promoDiscount)}</span>
					</div>
				)}
				{!allFree && (
					<>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-1">
								<span className="text-label-sm text-text-secondary">Platform Fee</span>
								<Icon as={InfoCircleSvg} size="xs" color="secondary" />
							</div>
							<span className="text-label-sm text-text-primary">
								{pricingConfig.platformFeeWaived ? (
									<span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-badge">WAIVED</span>
								) : (
									formatINR(platformFee)
								)}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-1">
								<span className="text-label-sm text-text-secondary">Taxes & Fees</span>
								<Icon as={InfoCircleSvg} size="xs" color="secondary" />
							</div>
							<span className="text-label-sm text-text-primary">{formatINR(gst)}</span>
						</div>
					</>
				)}
			</div>

			<div className="border-t border-border-default" />

			{/* Total */}
			<div className="flex flex-col gap-0.5">
				<div className="flex items-baseline justify-between">
					<span className="text-body-md font-bold text-text-primary">Total</span>
					<span className="text-heading-sm font-extrabold text-text-brand">
						{allFree ? "Free" : formatINR(total)}
					</span>
				</div>
				{!allFree && (
					<p className="text-caption text-text-muted text-right">Inclusive of all taxes</p>
				)}
			</div>

			{/* CTA */}
			{onContinue && (
				<Button
					variant="primary"
					size="lg"
					radius="md"
					className="w-full"
					onClick={onContinue}
					disabled={continueDisabled || continueLoading || totalTickets === 0}
				>
					{continueLoading ? "Processing…" : `${continueLabel} →`}
				</Button>
			)}

			{/* Secure badge */}
			<div className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-action bg-green-50 border border-green-200">
				<Icon as={ShieldCheckSvg} size="lg" color="success" />
				<span className="text-label-sm font-medium text-icon-success">Secure payments. 100% safe and encrypted</span>
			</div>

			{/* Trust signals */}
			<div className="flex flex-col gap-3 pt-1">
				{TRUST_SIGNALS.map((signal) => (
					<div key={signal.title} className="flex items-start gap-2.5">
						<div className="p-2 bg-surface-info-soft rounded-full">
							<Icon as={signal.icon} size="md" color={signal.color} className="mt-0.5 shrink-0" />
						</div>
						<div className="min-w-0">
							<p className="text-label-sm font-medium text-text-primary leading-snug">{signal.title}</p>
							{signal.body && (
								<p className="text-caption text-text-muted leading-snug">{signal.body}</p>
							)}
						</div>
					</div>
				))}
			</div>

			{/* Support */}
			<div className="border-t border-border-default pt-3">
				<p className="text-caption text-text-muted">
					Need help?{" "}
					<button
						type="button"
						onClick={() => setSupportOpen(true)}
						className="text-text-brand hover:underline font-medium bg-transparent border-0 p-0 cursor-pointer"
					>
						Contact support →
					</button>
				</p>
			</div>

			<SupportTicketModal
				open={supportOpen}
				onClose={() => setSupportOpen(false)}
				entityType={eventId ? "EVENT" : undefined}
				entityId={eventId}
			/>
		</div>
	)
}
