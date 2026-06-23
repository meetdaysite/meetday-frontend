"use client"

import { useState, useEffect } from "react"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import CloseSvg from "@/icons/outlined/close.svg"
import DangerTriangleSvg from "@/icons/outlined/danger-triangle.svg"

interface LeaveConfirmModalProps {
	communityName: string
	open: boolean
	onClose: () => void
	onConfirm: () => Promise<void>
}

export function LeaveConfirmModal({ communityName, open, onClose, onConfirm }: LeaveConfirmModalProps) {
	const [isSubmitting, setIsSubmitting] = useState(false)

	useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden"
			setIsSubmitting(false)
		}
		return () => { document.body.style.overflow = "" }
	}, [open])

	if (!open) return null

	const handleConfirm = async () => {
		setIsSubmitting(true)
		try {
			await onConfirm()
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
			onClick={e => { if (e.target === e.currentTarget && !isSubmitting) onClose() }}
		>
			<div className="bg-surface-card rounded-panel border border-border-default shadow-floating w-full max-w-sm relative">

				<button
					type="button"
					onClick={onClose}
					disabled={isSubmitting}
					className="absolute top-4 right-4 flex items-center justify-center size-8 rounded-full bg-surface-hover hover:bg-surface-page border border-border-default transition-colors disabled:opacity-40"
				>
					<Icon as={CloseSvg} size="sm" color="secondary" />
				</button>

				<div className="flex flex-col items-center p-6 gap-4">

					<div className="flex items-center justify-center size-14 rounded-full bg-red-50 border border-red-200 mt-2">
						<Icon as={DangerTriangleSvg} size="lg" color="inherit" className="text-red-500" />
					</div>

					<div className="text-center">
						<h2 className="text-body-lg font-extrabold text-text-primary">
							Leave {communityName}?
						</h2>
						<p className="text-label-sm text-text-secondary font-normal mt-1.5 leading-relaxed">
							You&apos;ll lose access to all members-only content — chat, feed, announcements, and the member directory. You can rejoin anytime.
						</p>
					</div>

					<div className="flex gap-2 w-full mt-1 pb-1">
						<Button
							variant="primary"
							size="md"
							radius="pill"
							className="w-full bg-red-500 hover:bg-red-600 border-red-500"
							disabled={isSubmitting}
							onClick={handleConfirm}
						>
							{isSubmitting ? "Leaving…" : "Leave Community"}
						</Button>
						<Button
							variant="secondary"
							size="md"
							radius="pill"
							className="w-full"
							disabled={isSubmitting}
							onClick={onClose}
						>
							Stay
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
