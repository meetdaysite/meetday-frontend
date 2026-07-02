"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import { Checkbox } from "@/components/ui/Checkbox"
import CloseSvg from "@/icons/outlined/close.svg"
import DangerTriangleSvg from "@/icons/outlined/danger-triangle.svg"
import ShieldCheckSvg from "@/icons/filled/shield-check.svg"
import { cancelOrder, cancelOrderTickets } from "@/lib/ordersApi"
import { getApiErrorMessage } from "@/lib/errors"
import type { CancelTicketsResult, FullOrderDetail } from "@/types/order"
import type { PublicRefundPolicy } from "@/types/attendee"

function refundPolicySummary(policy?: PublicRefundPolicy | null): string {
	if (!policy) return "Refund eligibility is validated automatically based on the event's refund policy."
	if (policy.type === "NO_REFUND") return "This event is non-refundable — cancelling won't trigger a refund."
	if (policy.type === "FULL") {
		return policy.cutoffHours
			? `You'll get a full refund if you cancel at least ${policy.cutoffHours}h before the event.`
			: "Full refunds are available for this event."
	}
	return policy.cutoffHours && policy.refundPercent
		? `You'll get a ${policy.refundPercent}% refund if you cancel at least ${policy.cutoffHours}h before the event.`
		: "Partial refunds are available for this event."
}

interface CancelTicketModalProps {
	order: FullOrderDetail
	refundPolicy?: PublicRefundPolicy | null
	open: boolean
	onClose: () => void
	onCancelled: (result: CancelTicketsResult) => void
}

export function CancelTicketModal({ order, refundPolicy, open, onClose, onCancelled }: CancelTicketModalProps) {
	const attendees = useMemo(
		() => order.items.flatMap(item => item.attendees.map(a => ({ ...a, ticketName: item.ticket.name }))),
		[order.items],
	)
	const cancellable = attendees.filter(a => !a.checkedInAt)

	const [selected, setSelected] = useState<Set<string>>(new Set())
	const [submitting, setSubmitting] = useState(false)

	useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden"
			setSelected(new Set())
		}
		return () => {
			document.body.style.overflow = ""
		}
	}, [open])

	if (!open) return null

	const allSelected = cancellable.length > 0 && selected.size === cancellable.length

	const toggleAll = () => {
		setSelected(allSelected ? new Set() : new Set(cancellable.map(a => a.id)))
	}

	const toggleOne = (id: string) => {
		setSelected(prev => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}

	const handleConfirm = async () => {
		if (selected.size === 0 || submitting) return
		setSubmitting(true)
		try {
			const result = allSelected
				? await cancelOrder(order.id)
				: await cancelOrderTickets(order.id, {
						items: order.items
							.map(item => {
								const attendeeIds = item.attendees.filter(a => selected.has(a.id)).map(a => a.id)
								return attendeeIds.length > 0
									? { orderItemId: item.id, quantity: attendeeIds.length, attendeeIds }
									: null
							})
							.filter((x): x is NonNullable<typeof x> => x !== null),
					})
			toast.success(result.message ?? "Cancellation initiated.")
			onCancelled(result)
			onClose()
		} catch (err) {
			toast.error(getApiErrorMessage(err))
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
			onClick={e => {
				if (e.target === e.currentTarget && !submitting) onClose()
			}}
		>
			<div className="bg-surface-card rounded-action border border-border-default shadow-floating w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col relative">
				{/* Header */}
				<div className="flex items-center justify-between p-5 border-b border-border-default shrink-0">
					<div className="flex items-center gap-2.5">
						<div className="flex items-center justify-center size-9 rounded-full bg-red-50 border border-red-200 shrink-0">
							<Icon as={DangerTriangleSvg} size="md" color="inherit" className="text-red-500" />
						</div>
						<h2 className="text-body-lg font-extrabold text-text-primary">Cancel tickets</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						disabled={submitting}
						className="flex items-center justify-center size-8 rounded-full bg-surface-hover hover:bg-surface-page border border-border-default transition-colors disabled:opacity-40"
					>
						<Icon as={CloseSvg} size="sm" color="secondary" />
					</button>
				</div>

				{/* Body */}
				<div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
					<div className="rounded-action bg-surface-info-soft border border-blue-200 p-3 flex items-start gap-2.5">
						<Icon as={ShieldCheckSvg} size="sm" color="info" className="mt-0.5 shrink-0" />
						<p className="text-label-sm text-text-secondary leading-snug">{refundPolicySummary(refundPolicy)}</p>
					</div>

					{cancellable.length > 1 && (
						<Checkbox checked={allSelected} onChange={toggleAll} label={`Select all (${cancellable.length})`} size="sm" />
					)}

					<div className="flex flex-col gap-2.5">
						{attendees.map(a => {
							const checkedIn = !!a.checkedInAt
							return (
								<div
									key={a.id}
									className={`flex items-center justify-between gap-3 rounded-action border border-border-default p-3 ${
										checkedIn ? "bg-surface-page opacity-60" : ""
									}`}
								>
									<div className="min-w-0">
										<p className="text-label-sm font-semibold text-text-primary truncate">{a.fullName}</p>
										<p className="text-caption text-text-muted">{a.ticketName}</p>
									</div>
									{checkedIn ? (
										<span className="text-[10px] font-semibold text-text-muted shrink-0">Checked in</span>
									) : (
										<Checkbox checked={selected.has(a.id)} onChange={() => toggleOne(a.id)} size="sm" />
									)}
								</div>
							)
						})}
					</div>
				</div>

				{/* Footer */}
				<div className="p-5 border-t border-border-default shrink-0 flex gap-2">
					<Button
						variant="primary"
						size="md"
						radius="pill"
						className="w-full bg-red-500 hover:bg-red-600 border-red-500"
						disabled={selected.size === 0 || submitting}
						onClick={handleConfirm}
					>
						{submitting
							? "Cancelling…"
							: selected.size > 0
								? `Cancel ${selected.size} ticket${selected.size !== 1 ? "s" : ""}`
								: "Cancel tickets"}
					</Button>
					<Button variant="secondary" size="md" radius="pill" className="w-full" disabled={submitting} onClick={onClose}>
						Back
					</Button>
				</div>
			</div>
		</div>
	)
}
