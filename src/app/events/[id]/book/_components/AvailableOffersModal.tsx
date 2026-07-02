"use client"

import { useEffect } from "react"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import CloseSvg from "@/icons/outlined/close.svg"
import TagPriceSvg from "@/icons/outlined/tag-price.svg"
import ClockCircleSvg from "@/icons/outlined/clock-circle.svg"
import type { AvailableOffer } from "@/lib/ordersApi"

interface AvailableOffersModalProps {
	open: boolean
	onClose: () => void
	offers: AvailableOffer[]
	onApply: (code: string) => void
	applyingCode: string | null
}

function formatDiscount(offer: AvailableOffer): string {
	if (offer.discountType === "PERCENTAGE") {
		return `${offer.discountValue}% off`
	}
	return `₹${offer.discountValue} off`
}

function formatCap(offer: AvailableOffer): string | null {
	if (offer.discountType === "PERCENTAGE" && offer.maxDiscountAmount) {
		return `up to ₹${offer.maxDiscountAmount}`
	}
	return null
}

function formatExpiry(validUntil: string): string {
	return new Date(validUntil).toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
	})
}

export function AvailableOffersModal({
	open,
	onClose,
	offers,
	onApply,
	applyingCode,
}: AvailableOffersModalProps) {
	useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden"
		}
		return () => {
			document.body.style.overflow = ""
		}
	}, [open])

	if (!open) return null

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
			onClick={(e) => {
				if (e.target === e.currentTarget && !applyingCode) onClose()
			}}
		>
			<div className="bg-surface-card rounded-action border border-border-default shadow-floating w-full max-w-sm relative">
				{/* Close */}
				<button
					type="button"
					onClick={onClose}
					disabled={!!applyingCode}
					className="absolute top-4 right-4 flex items-center justify-center size-8 rounded-full bg-surface-hover hover:bg-surface-page border border-border-default transition-colors disabled:opacity-40"
				>
					<Icon as={CloseSvg} size="sm" color="secondary" />
				</button>

				{/* Header */}
				<div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-border-default">
					<div className="size-9 rounded-action bg-surface-brand-soft flex items-center justify-center shrink-0">
						<Icon as={TagPriceSvg} size="md" color="brand" />
					</div>
					<div>
						<h2 className="text-body-md font-extrabold text-text-primary">Available Offers</h2>
						<p className="text-caption text-text-muted">
							{offers.length} offer{offers.length !== 1 ? "s" : ""} available for this event
						</p>
					</div>
				</div>

				{/* Offer list */}
				<div className="flex flex-col divide-y divide-border-default max-h-96 overflow-y-auto">
					{offers.map((offer) => {
						const cap = formatCap(offer)
						const isApplying = applyingCode === offer.code
						return (
							<div key={offer.code} className="flex items-start gap-4 p-5">
								<div className="flex-1 min-w-0 flex flex-col gap-1.5">
									{/* Code + discount badge */}
									<div className="flex items-center gap-2 flex-wrap">
										<span className="font-mono text-label-sm font-bold text-text-brand bg-surface-brand-soft border border-red-200 rounded-action px-2.5 py-0.5 tracking-wider">
											{offer.code}
										</span>
										<span className="text-caption font-semibold text-icon-success bg-surface-success-soft border border-green-200 rounded-avatar px-2 py-0.5">
											{formatDiscount(offer)}
											{cap && ` ${cap}`}
										</span>
									</div>

									{/* Description */}
									<p className="text-label-sm text-text-secondary leading-snug">
										{offer.description}
									</p>

									{/* Meta row */}
									<div className="flex items-center gap-3 flex-wrap">
										{offer.minOrderValue && (
											<span className="text-caption text-text-muted">
												Min. order ₹{offer.minOrderValue}
											</span>
										)}
										{offer.validUntil && (
											<span className="flex items-center gap-1 text-caption text-text-muted">
												<Icon as={ClockCircleSvg} size="xs" color="muted" />
												Expires {formatExpiry(offer.validUntil)}
											</span>
										)}
									</div>
								</div>

								<Button
									variant="secondary"
									size="sm"
									radius="md"
									className="shrink-0"
									disabled={!!applyingCode}
									onClick={() => onApply(offer.code)}
								>
									{isApplying ? "Applying…" : "Apply"}
								</Button>
							</div>
						)
					})}
				</div>
			</div>
		</div>
	)
}
