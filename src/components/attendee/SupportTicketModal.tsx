"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Dropdown } from "@/components/ui/Dropdown"
import { TextField } from "@/components/ui/TextField"
import { Icon } from "@/components/ui/Icon"
import CloseSvg from "@/icons/outlined/close.svg"
import HeadphonesSvg from "@/icons/filled/headphones.svg"
import { createSupportTicket, CATEGORY_LABELS, type SupportCategory, type SupportEntityType } from "@/lib/supportApi"
import { getApiErrorMessage } from "@/lib/errors"

const CATEGORY_OPTIONS = (Object.entries(CATEGORY_LABELS) as [SupportCategory, string][]).map(
	([value, label]) => ({ value, label }),
)

interface SupportTicketModalProps {
	open: boolean
	onClose: () => void
	entityType?: SupportEntityType
	entityId?: string
}

export function SupportTicketModal({ open, onClose, entityType, entityId }: SupportTicketModalProps) {
	const [subject, setSubject] = useState("")
	const [body, setBody] = useState("")
	const [category, setCategory] = useState<SupportCategory>("EVENT_ISSUE")
	const [submitting, setSubmitting] = useState(false)

	useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden"
		}
		return () => {
			document.body.style.overflow = ""
		}
	}, [open])

	// Reset form when modal opens
	useEffect(() => {
		if (open) {
			setSubject("")
			setBody("")
			setCategory("EVENT_ISSUE")
		}
	}, [open])

	if (!open) return null

	const isValid = subject.trim().length > 0 && body.trim().length > 0

	const handleSubmit = async () => {
		if (!isValid || submitting) return
		setSubmitting(true)
		try {
			await createSupportTicket({
				subject: subject.trim(),
				body: body.trim(),
				category,
				entityType,
				entityId,
			})
			toast.success("Support ticket submitted. We'll get back to you shortly.")
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
			onClick={(e) => {
				if (e.target === e.currentTarget && !submitting) onClose()
			}}
		>
			<div className="bg-surface-card rounded-action border border-border-default shadow-floating w-full max-w-md relative">
				{/* Close */}
				<button
					type="button"
					onClick={onClose}
					disabled={submitting}
					className="absolute top-4 right-4 flex items-center justify-center size-8 rounded-full bg-surface-hover hover:bg-surface-page border border-border-default transition-colors disabled:opacity-40"
				>
					<Icon as={CloseSvg} size="sm" color="secondary" />
				</button>

				{/* Header */}
				<div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-border-default">
					<div className="size-9 rounded-action bg-surface-info-soft flex items-center justify-center shrink-0">
						<Icon as={HeadphonesSvg} size="md" color="info" />
					</div>
					<div>
						<h2 className="text-body-md font-extrabold text-text-primary">Contact Support</h2>
						<p className="text-caption text-text-muted">We typically respond within 24 hours.</p>
					</div>
				</div>

				{/* Form */}
				<div className="flex flex-col gap-4 p-6">
					<Dropdown
						label="Category"
						options={CATEGORY_OPTIONS}
						value={category}
						onChange={(v) => setCategory(v as SupportCategory)}
						size="md"
						disabled={submitting}
					/>

					<TextField
						label="Subject"
						placeholder="Briefly describe your issue"
						value={subject}
						onChange={(e) => setSubject(e.target.value)}
						size="md"
						disabled={submitting}
						maxLength={150}
					/>

					<div className="flex flex-col gap-1.5">
						<label className="text-label-sm font-semibold text-text-primary">Message</label>
						<textarea
							placeholder="Describe your issue in detail…"
							value={body}
							onChange={(e) => setBody(e.target.value)}
							disabled={submitting}
							rows={5}
							maxLength={2000}
							className="w-full rounded-input border border-border-default bg-surface-canvas px-4 py-3 text-sm text-text-primary placeholder:text-text-muted resize-none outline-none transition-colors hover:border-border-strong focus:border-border-focused disabled:bg-action-disabled disabled:cursor-not-allowed"
						/>
						<p className="text-caption text-text-muted text-right">{body.length}/2000</p>
					</div>

					<div className="flex gap-2 pt-1">
						<Button
							variant="primary"
							size="md"
							radius="pill"
							className="w-full"
							disabled={!isValid || submitting}
							onClick={handleSubmit}
						>
							{submitting ? "Submitting…" : "Submit Ticket"}
						</Button>
						<Button
							variant="secondary"
							size="md"
							radius="pill"
							className="w-full"
							disabled={submitting}
							onClick={onClose}
						>
							Cancel
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
