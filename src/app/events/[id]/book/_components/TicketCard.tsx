"use client"

import clsx from "clsx"
import { Icon } from "@/components/ui/Icon"
import CheckSvg from "@/icons/outlined/check.svg"
import TicketSvg from "@/icons/filled/ticket.svg"
import CrownSvg from "@/icons/filled/crown-line.svg"
import BoltSvg from "@/icons/filled/bolt-circle.svg"
import type { PublicTicket } from "@/types/attendee"

const TIER_STYLES = [
	{
		iconBg: "bg-red-50",
		iconColor: "text-action-primary",
		selectedBorder: "border-action-primary",
		checkColor: "text-action-primary",
		icon: TicketSvg,
	},
	{
		iconBg: "bg-blue-50",
		iconColor: "text-blue-500",
		selectedBorder: "border-blue-400",
		checkColor: "text-blue-500",
		icon: BoltSvg,
	},
	{
		iconBg: "bg-amber-50",
		iconColor: "text-text-warning",
		selectedBorder: "border-amber-400",
		checkColor: "text-text-warning",
		icon: CrownSvg,
	},
]

function parseFeatures(description?: string): string[] {
	if (!description) return []
	return description
		.split(/\n|•|-/)
		.map((s) => s.trim())
		.filter(Boolean)
}

interface TicketCardProps {
	ticket: PublicTicket
	tierIndex: number
	quantity: number
	onQuantityChange: (newQty: number) => void
}

export function TicketCard({ ticket, tierIndex, quantity, onQuantityChange }: TicketCardProps) {
	const style = TIER_STYLES[tierIndex % TIER_STYLES.length]
	const features = parseFeatures(ticket.description)
	const price = parseFloat(ticket.price)
	const originalPrice = ticket.originalPrice ? parseFloat(ticket.originalPrice) : null
	const discountPct = originalPrice && originalPrice > price
		? Math.round((1 - price / originalPrice) * 100)
		: null
	const available = ticket.availableCount ?? ticket.totalCapacity
	const isLowStock = available <= 50
	const isSelected = quantity > 0
	const maxQty = ticket.maxPerPerson ?? 10

	const decrement = () => onQuantityChange(Math.max(0, quantity - 1))
	const increment = () => onQuantityChange(Math.min(maxQty, quantity + 1))

	return (
		<div
			className={clsx(
				`rounded-card border bg-surface-card p-4 flex items-center gap-4 transition-all duration-(--duration-180) border-l-4 border-l-${style.selectedBorder} hover:shadow-(--shadow-card-hover)`,
				isSelected
					? `border ${style.selectedBorder} shadow-(--shadow-card-hover)`
					: "border border-border-brand shadow-(--shadow-card)",
			)}
		>
			{/* Tier icon */}
			<div className={clsx("size-12 shrink-0 rounded-action flex items-center justify-center", style.iconBg)}>
				<style.icon className={clsx("size-6", style.iconColor)} aria-hidden />
			</div>

			{/* Name + description */}
			<div className="w-36 shrink-0 flex flex-col gap-0.5 pt-0.5">
				<h4 className="text-body-lg font-bold text-text-primary leading-snug">{ticket.name}</h4>
				{ticket.description && features.length === 0 && (
					<p className="text-label-sm text-text-secondary leading-snug line-clamp-3">
						{ticket.description}
					</p>
				)}
			</div>

			{/* Features list */}
			{features.length > 0 && (
				<ul className="flex-1 min-w-0 flex flex-col gap-1 pt-0.5">
					{features.map((feat, i) => (
						<li key={i} className="flex items-start gap-1.5">
							<Icon as={CheckSvg} size="sm" color="success" className="mt-0.5 shrink-0" />
							<span className="text-label-sm font-normal text-text-secondary leading-snug">{feat}</span>
						</li>
					))}
				</ul>
			)}
			{features.length === 0 && <div className="flex-1" />}

			<div className="self-stretch w-px bg-border-subtle shrink-0" />

			{/* Price */}
			<div className="shrink-0 flex flex-col items-end gap-1 px-10">
				<p className="text-body-md font-extrabold text-text-brand">
					₹{price.toLocaleString("en-IN")}
				</p>
				{originalPrice && discountPct && (
					<div className="flex items-center gap-1.5">
						<span className="text-label-sm text-text-muted line-through">
							₹{originalPrice.toLocaleString("en-IN")}
						</span>
						<span className="text-[10px] font-bold text-action-primary bg-red-50 px-1.5 py-0.5 rounded-badge">
							{discountPct}% OFF
						</span>
					</div>
				)}
			</div>

			<div className="self-stretch w-px bg-border-subtle shrink-0" />

			{/* Availability + stepper */}
			<div className="shrink-0 flex flex-col items-center gap-2 pl-10">
				<span
					className={clsx(
						"text-[10px] font-semibold",
						isLowStock ? "text-action-primary" : "text-text-muted",
					)}
				>
					{available.toLocaleString("en-IN")} Left
				</span>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={decrement}
						disabled={quantity === 0}
						aria-label="Decrease quantity"
						className={clsx(
							"size-7 rounded-full border flex items-center justify-center text-lg font-medium transition-colors duration-(--duration-120)",
							quantity === 0
								? "border-border-subtle text-text-muted cursor-not-allowed"
								: "border-border-default text-text-primary hover:border-border-strong hover:bg-surface-canvas",
						)}
					>
						−
					</button>
					<span className="w-5 text-center text-body-md font-bold text-text-primary tabular-nums">
						{quantity}
					</span>
					<button
						type="button"
						onClick={increment}
						disabled={quantity >= maxQty}
						aria-label="Increase quantity"
						className={clsx(
							"size-7 rounded-full border flex items-center justify-center text-lg font-medium transition-colors duration-(--duration-120)",
							quantity >= maxQty
								? "border-border-subtle text-text-muted cursor-not-allowed"
								: "border-border-default text-text-primary",
						)}
					>
						+
					</button>
				</div>
			</div>
		</div>
	)
}
