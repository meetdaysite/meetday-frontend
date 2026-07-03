"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import CloseSvg from "@/icons/outlined/close.svg"
import DangerTriangleSvg from "@/icons/outlined/danger-triangle.svg"
import { deleteAccount } from "@/lib/api"
import { ApiError, getApiErrorMessage } from "@/lib/errors"

type AccountDeletionRole = "attendee" | "host"

const ROLE_CONTENT: Record<AccountDeletionRole, {
	heading: string
	bullets: string[]
	warning?: string
	closing: string
}> = {
	attendee: {
		heading: "Sorry to see you go.",
		bullets: [
			"Your name, email, phone, and photo are permanently erased",
			"All your connections and activity are removed",
			"Your login is disabled immediately — rejoining requires a new account",
			"Your past bookings and payments are kept for up to 8 years as required by RBI and GST regulations.",
		],
		closing: "We hope Meetday brought you some great moments. You're always welcome back.",
	},
	host: {
		heading: "Thank you for everything you've created.",
		bullets: [
			"Your profile, KYC data, and personal info are permanently erased",
			"Your login is disabled immediately — you won't be able to manage events or receive payouts",
			"Your host subscription is cancelled",
			"Your past events, orders, and financial records are kept for up to 8 years as required by RBI and GST regulations.",
		],
		warning: "Cancel all upcoming events and wait for all pending payouts to settle.",
		closing: "The experiences you created, and the people you brought together — those remain. Thank you for being a host on Meetday.",
	},
}

interface DeleteAccountModalProps {
	open: boolean
	role: AccountDeletionRole
	onClose: () => void
	onDeleted: () => void
}

export function DeleteAccountModal({ open, role, onClose, onDeleted }: DeleteAccountModalProps) {
	const [reason, setReason] = useState("")
	const [submitting, setSubmitting] = useState(false)
	const [blockers, setBlockers] = useState<string[] | null>(null)

	useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden"
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setReason("")
			setBlockers(null)
		}
		return () => {
			document.body.style.overflow = ""
		}
	}, [open])

	if (!open) return null

	const content = ROLE_CONTENT[role]

	const handleDelete = async () => {
		if (submitting) return
		setSubmitting(true)
		setBlockers(null)
		try {
			const result = await deleteAccount(reason.trim() || undefined)
			toast.success(result.message)
			onDeleted()
		} catch (err) {
			const body = err instanceof ApiError ? (err.data as { message?: unknown } | undefined) : undefined
			if (Array.isArray(body?.message)) {
				setBlockers(body.message.map(String))
			} else {
				toast.error(getApiErrorMessage(err))
			}
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
			onClick={(e) => {
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
						<h2 className="text-body-lg font-extrabold text-text-primary">Delete your account?</h2>
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
					<p className="text-body-sm font-semibold text-text-primary">{content.heading}</p>

					<ul className="flex flex-col gap-2">
						{content.bullets.map((bullet) => (
							<li key={bullet} className="flex items-start gap-2.5">
								<span className="mt-2 size-1.5 rounded-full bg-text-muted shrink-0" />
								<span className="text-body-sm text-text-primary leading-relaxed">{bullet}</span>
							</li>
						))}
					</ul>

					{content.warning && (
						<div className="rounded-action bg-amber-50 border border-amber-100 p-3">
							<p className="text-label-sm text-amber-800 leading-snug">
								<span className="font-semibold">Before you can delete: </span>
								{content.warning}
							</p>
						</div>
					)}

					{blockers && (
						<div className="rounded-action bg-status-error-bg border border-red-200 p-3 flex flex-col gap-1.5">
							<p className="text-label-sm font-semibold text-status-error-text">Can&apos;t delete your account yet:</p>
							<ul className="flex flex-col gap-1">
								{blockers.map((blocker) => (
									<li key={blocker} className="text-label-sm text-status-error-text leading-snug">
										• {blocker}
									</li>
								))}
							</ul>
						</div>
					)}

					<div className="flex flex-col gap-1.5">
						<label className="text-label-sm font-semibold text-text-primary">Reason (optional)</label>
						<textarea
							placeholder="Tell us why you're leaving…"
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							disabled={submitting}
							rows={3}
							maxLength={500}
							className="w-full rounded-input border border-border-default bg-surface-canvas px-4 py-3 text-sm text-text-primary placeholder:text-text-muted resize-none outline-none transition-colors hover:border-border-strong focus:border-border-focused disabled:bg-action-disabled disabled:cursor-not-allowed"
						/>
					</div>

					<div className="flex flex-col gap-1 pt-1">
						<p className="text-label-sm font-semibold text-status-error-text">This cannot be undone.</p>
						<p className="text-caption text-text-secondary leading-relaxed">{content.closing}</p>
					</div>
				</div>

				{/* Footer */}
				<div className="p-5 border-t border-border-default shrink-0 flex gap-2">
					<Button
						variant="primary"
						size="md"
						radius="pill"
						className="w-full bg-red-500 hover:bg-red-600 border-red-500"
						disabled={submitting}
						onClick={handleDelete}
					>
						{submitting ? "Deleting…" : "Delete my account"}
					</Button>
					<Button variant="secondary" size="md" radius="pill" className="w-full" disabled={submitting} onClick={onClose}>
						Keep my account
					</Button>
				</div>
			</div>
		</div>
	)
}
