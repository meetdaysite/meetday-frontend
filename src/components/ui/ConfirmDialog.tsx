"use client"

import { useState } from "react"
import { Button } from "./Button"

interface ConfirmDialogProps {
	open: boolean
	title: string
	description: string
	confirmLabel?: string
	cancelLabel?: string
	destructive?: boolean
	onClose: () => void
	onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
	open,
	title,
	description,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	destructive = false,
	onClose,
	onConfirm,
}: ConfirmDialogProps) {
	const [loading, setLoading] = useState(false)

	if (!open) return null

	async function handleConfirm() {
		setLoading(true)
		try {
			await onConfirm()
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
			<div className="bg-surface-card rounded-action border border-border-default shadow-floating w-full max-w-sm p-6">
				<h2 className="text-label-lg font-semibold text-text-primary mb-2">{title}</h2>
				<p className="text-body-sm text-text-secondary mb-6">{description}</p>
				<div className="flex gap-3 justify-end">
					<Button variant="secondary" onClick={onClose} disabled={loading} size="sm" radius="md">
						{cancelLabel}
					</Button>
					<Button
						variant="primary"
						onClick={handleConfirm}
						disabled={loading}
						size="sm"
						radius="md"
						className={destructive ? "bg-red-600 hover:bg-red-700 border-red-600" : undefined}
					>
						{loading ? "Deleting…" : confirmLabel}
					</Button>
				</div>
			</div>
		</div>
	)
}
