"use client"

import { useEffect } from "react"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import CloseSvg from "@/icons/outlined/close.svg"
import ClockCircleSvg from "@/icons/outlined/clock-circle.svg"
import BellSvg from "@/icons/outlined/bell.svg"
import CheckCircleSvg from "@/icons/outlined/check-circle.svg"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JoinPendingCommunity {
	name: string
}

// ─── Component ───────────────────────────────────────────────────────────────

interface JoinPendingModalProps {
	community: JoinPendingCommunity
	open: boolean
	onClose: () => void
}

export function JoinPendingModal({ community, open, onClose }: JoinPendingModalProps) {
	useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden"
		}
		return () => { document.body.style.overflow = "" }
	}, [open])

	if (!open) return null

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
			onClick={e => { if (e.target === e.currentTarget) onClose() }}
		>
			<div className="bg-surface-card rounded-panel border border-border-default shadow-floating w-full max-w-md relative">

				{/* Close button */}
				<button
					type="button"
					onClick={onClose}
					className="absolute top-4 right-4 z-10 flex items-center justify-center size-8 rounded-full bg-surface-hover hover:bg-surface-page border border-border-default transition-colors"
				>
					<Icon as={CloseSvg} size="sm" color="secondary" />
				</button>

				<div className="flex flex-col items-center p-6 gap-5">

					{/* Icon */}
					<div className="flex items-center justify-center size-20 rounded-full bg-amber-50 border border-amber-200 mt-4">
						<Icon as={ClockCircleSvg} size="xl" color="inherit" className="text-amber-500" />
					</div>

					{/* Title */}
					<div className="text-center">
						<h2 className="text-heading-sm font-extrabold text-text-primary leading-tight">
							Request sent to<br />
							<span className="text-amber-500">{community.name}</span>
						</h2>
						<p className="text-label-md text-text-secondary font-normal mt-1.5 leading-relaxed">
							This community requires admin approval. A community admin will review your request and let you know.
						</p>
					</div>

					{/* What happens next */}
					<div className="w-full rounded-action border border-border-default bg-surface-page p-4 flex flex-col gap-3">
						<p className="text-label-sm font-semibold text-text-primary">What happens next</p>
						<div className="flex items-start gap-2.5">
							<div className="size-6 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
								<Icon as={CheckCircleSvg} size="xs" color="inherit" className="text-amber-500" />
							</div>
							<p className="text-label-sm text-text-secondary font-normal leading-snug">
								An admin reviews your join request, usually within 24–48 hours.
							</p>
						</div>
						<div className="flex items-start gap-2.5">
							<div className="size-6 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
								<Icon as={BellSvg} size="xs" color="inherit" className="text-amber-500" />
							</div>
							<p className="text-label-sm text-text-secondary font-normal leading-snug">
								You&apos;ll receive a notification once your request is approved or declined.
							</p>
						</div>
					</div>

					{/* CTA */}
					<Button
						variant="secondary"
						size="lg"
						radius="pill"
						className="w-full pb-2"
						onClick={onClose}
					>
						Got it
					</Button>
				</div>
			</div>
		</div>
	)
}
