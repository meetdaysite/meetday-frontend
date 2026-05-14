"use client"

import { useState } from "react"

interface LogoutConfirmDialogProps {
	open: boolean
	onClose: () => void
	onConfirm: () => Promise<void>
}

function MiniSpinner() {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="animate-spin shrink-0">
			<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
			<path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
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
			<div className="bg-surface-card rounded-card border border-border-default shadow-floating w-full max-w-sm p-6">
				<h2 className="text-label-lg font-semibold text-text-primary mb-2">Sign out?</h2>
				<p className="text-body-sm text-text-secondary mb-6">
					You&apos;ll need to sign in again to manage your events and profile.
				</p>
				<div className="flex gap-3 justify-end">
					<button
						type="button"
						onClick={onClose}
						disabled={loading}
						className="px-4 py-2 text-label-sm font-medium text-text-primary border border-border-default rounded-action hover:bg-surface-card-muted transition-colors disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleConfirm}
						disabled={loading}
						className="flex items-center gap-2 px-4 py-2 text-label-sm font-semibold text-white bg-surface-inverse hover:opacity-90 rounded-action transition-opacity disabled:opacity-60"
					>
						{loading && <MiniSpinner />}
						Sign Out
					</button>
				</div>
			</div>
		</div>
	)
}
