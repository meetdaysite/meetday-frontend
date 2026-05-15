"use client"

import { Button } from "@/components/ui/Button"
import ShareCircleSvg from "@/icons/filled/share-circle.svg"
import ShieldCheckSvg from "@/icons/filled/shield-check.svg"
import UserGroup from "@/icons/filled/users-group-2.svg"
import VerifiedCheckSvg from "@/icons/filled/verified-check.svg"
import { useEffect } from "react"
import { Icon } from "../ui/Icon"

interface Props {
	open: boolean
	onClose: () => void
}

const FEATURES = [
	{
		icon: <Icon as={ShieldCheckSvg} color="success" className="w-7 h-7"/>,
		iconBg: "bg-surface-success-soft",
		title: "Safe & Verified",
		body: "Every profile is verified for a safe and trusted community",
	},
	{
		icon: <Icon as={UserGroup} color="brand" className="w-7 h-7"/>,
		iconBg: "bg-surface-brand-soft",
		title: "Vibe-based matching",
		body: "We match you with events, people, and groups you'll genuinely vibe with",
	},
	{
		icon: <Icon as={ShareCircleSvg} color="info" className="w-7 h-7"/>,
		iconBg: "bg-surface-info-soft",
		title: "Curated discover feed",
		body: "Personalised recommendations to help you discover what you'll love",
	},
]

export function RegistrationSuccessModal({ open, onClose }: Props) {
	useEffect(() => {
		if (!open) return
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") onClose()
		}
		document.addEventListener("keydown", onKey)
		return () => document.removeEventListener("keydown", onKey)
	}, [open, onClose])

	if (!open) return null

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4"
			style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
			onClick={onClose}
		>
			<div
				className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 flex flex-col gap-6"
				onClick={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-labelledby="welcome-modal-title"
			>
				{/* Heading */}
				<div className="text-center">
					<Icon as={VerifiedCheckSvg}  color="brand" className="mx-auto mb-4 w-18 h-18" />
					<h2 id="welcome-modal-title" className="text-2xl font-bold text-text-primary leading-tight">
						Welcome to Meetday
					</h2>
					<p className="text-body-sm text-text-secondary mt-2 leading-relaxed">
						Your account is verified. Start discovering events, people, and groups that match your vibe.
					</p>
				</div>

				{/* Feature list */}
				<ul className="flex flex-col gap-4">
					{FEATURES.map((f) => (
						<li key={f.title} className="flex items-start gap-3 bg-surface-canvas rounded-lg p-4 border border-border-default shadow-sm">
							<span className={`mt-0.5 shrink-0 ${f.iconBg} p-4 rounded-full`}>{f.icon}</span>
							<div>
								<p className="text-body-md font-semibold text-text-primary">{f.title}</p>
								<p className="text-caption text-text-secondary mt-0.5 leading-snug">{f.body}</p>
							</div>
						</li>
					))}
				</ul>

				{/* CTA */}
				<Button
					variant="secondary"
					size="lg"
					radius="pill"
					className="w-full bg-neutral-900 text-white hover:bg-neutral-800 border-neutral-900 hover:border-neutral-800"
					onClick={onClose}
				>
					Start exploring
				</Button>
			</div>
		</div>
	)
}
