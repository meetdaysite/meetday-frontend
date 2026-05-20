"use client"

import { useState } from "react"
import { Button } from "./Button"

interface LogoutConfirmDialogProps {
	open: boolean
	onClose: () => void
	onConfirm: () => Promise<void>
}

export function LogoutConfirmDialog({ open, onClose, onConfirm }: LogoutConfirmDialogProps) {
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
				<h2 className="text-label-lg font-semibold text-text-primary mb-2">Sign out?</h2>
				<p className="text-body-sm text-text-secondary mb-6">
					You&apos;ll need to sign in again to manage your events and profile.
				</p>
				<div className="flex gap-3 justify-end">
					<Button variant="secondary" onClick={onClose} disabled={loading} size="sm" radius="md">
						Cancel
					</Button>
					<Button
						variant="primary"
						onClick={handleConfirm}
						disabled={loading}
						size="sm"
						radius="md"
					>
						{loading ? "Signing out..." : "Sign Out"}
					</Button>
				</div>
			</div>
		</div>
	)
}
