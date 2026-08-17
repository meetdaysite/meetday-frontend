"use client"

import { useState, useEffect } from "react"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import CloseSvg from "@/icons/outlined/close.svg"
import BoltSvg from "@/icons/outlined/bolt.svg"

interface JoinCommunityConfirmModalProps {
	communityName: string
	isRequestOnly: boolean
	open: boolean
	onClose: () => void
	onConfirm: () => Promise<void>
}

export function JoinCommunityConfirmModal({
	communityName,
	isRequestOnly,
	open,
	onClose,
	onConfirm,
}: JoinCommunityConfirmModalProps) {
	const [isSubmitting, setIsSubmitting] = useState(false)

	useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden"
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
			<div className="bg-surface-card rounded-action border border-border-default shadow-floating w-full max-w-sm relative">

				<button
					type="button"
					onClick={onClose}
					disabled={isSubmitting}
					className="absolute top-4 right-4 flex items-center justify-center size-8 rounded-full bg-surface-hover hover:bg-surface-page border border-border-default transition-colors disabled:opacity-40"
				>
					<Icon as={CloseSvg} size="sm" color="secondary" />
				</button>

				<div className="flex flex-col items-center p-6 gap-4">

					<div className="flex items-center justify-center size-14 rounded-full bg-surface-brand-soft border border-red-200 mt-2">
						<Icon as={BoltSvg} size="lg" color="brand" />
					</div>

					<div className="text-center">
						<h2 className="text-body-lg font-extrabold text-text-primary">
							{isRequestOnly ? `Request access to ${communityName}?` : `Join ${communityName}?`}
						</h2>
						<p className="text-label-sm text-text-secondary font-normal mt-1.5 leading-relaxed">
							{isRequestOnly
								? "An admin will need to approve your request before you can access the members-only feed, announcements, and audience insights."
								: "You'll get access to the members-only feed, announcements, audience insights, and can publish experiences to this community."}
						</p>
					</div>

					<div className="flex gap-2 w-full mt-1 pb-1">
						<Button
							variant="primary"
							size="md"
							radius="pill"
							className="w-full"
							disabled={isSubmitting}
							onClick={handleConfirm}
						>
							{isSubmitting
								? isRequestOnly
									? "Requesting…"
									: "Joining…"
								: isRequestOnly
									? "Request Access"
									: "Join Community"}
						</Button>
						<Button
							variant="secondary"
							size="md"
							radius="pill"
							className="w-full"
							disabled={isSubmitting}
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
