"use client"

import { useEffect, useState } from "react"
import type { ScanResult } from "@/lib/scannerApi"
import { Button } from "@/components/ui/Button"
import { PrivacyNotice } from "./PrivacyNotice"

type ApprovedResult = Extract<ScanResult, { status: "APPROVED" }>

type Props = {
	result: ApprovedResult
	onScanNext: () => void
}

export function ScanResultApproved({ result, onScanNext }: Props) {
	const [show, setShow] = useState(false)

	useEffect(() => {
		const t = setTimeout(() => setShow(true), 50)
		return () => clearTimeout(t)
	}, [])

	const codeSuffix = result.ticketCode.slice(-8).toUpperCase()

	return (
		<div className="flex flex-col min-h-screen bg-surface-canvas">
			{/* Header area */}
			<div className="flex flex-col items-center pt-12 pb-6 px-6 gap-4">
				<div
					className={`size-20 rounded-avatar bg-surface-success-soft flex items-center justify-center transition-all duration-500 ${
						show ? "scale-100 opacity-100" : "scale-50 opacity-0"
					}`}
				>
					<CheckIcon />
				</div>

				<div className="text-center">
					<h1 className="text-heading-sm text-text-success">Entry approved</h1>
					<p className="text-label-sm text-text-tertiary mt-1">Attendee successfully checked in</p>
				</div>
			</div>

			{/* Detail rows */}
			<div className="mx-4 bg-surface-card-muted rounded-action border border-border-default shadow-card overflow-hidden">
				{result.ticketType && (
					<>
						<DetailRow icon={<TicketIcon />} label="Ticket type" value={result.ticketType} />
						<Divider />
					</>
				)}
				<DetailRow icon={<QrIcon />} label="Ticket code" value={`ending ${codeSuffix}`} />
			</div>

			{/* Privacy notice */}
			<div className="mx-4 mt-4">
				<PrivacyNotice compact />
			</div>

			{/* Actions */}
			<div className="flex flex-col gap-3 px-4 mt-6">
				<Button onClick={onScanNext} size="lg" radius="lg" className="w-full" leftIcon={<ScanIcon />}>
					Scan next
				</Button>
			</div>

			<div className="pb-8" />
		</div>
	)
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
	return (
		<div className="flex items-center gap-3 px-4 py-3.5">
			<div className="size-9 rounded-action bg-surface-card border border-border-default flex items-center justify-center shrink-0">
				{icon}
			</div>
			<div className="flex-1 min-w-0">
				<p className="text-caption text-text-muted font-medium">{label}</p>
				<p className="text-label-md text-text-primary font-semibold">{value}</p>
			</div>
		</div>
	)
}

function Divider() {
	return <div className="mx-4 h-px bg-border-subtle" />
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function CheckIcon() {
	return (
		<svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-text-success" aria-hidden>
			<path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}
function TicketIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-text-secondary" aria-hidden>
			<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z" stroke="currentColor" strokeWidth="1.8" />
		</svg>
	)
}
function QrIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-text-secondary" aria-hidden>
			<rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
			<rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
			<rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
			<path d="M14 14h2v2h-2zM18 14h3v2h-3zM14 18h3v3h-3zM19 18v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
		</svg>
	)
}
function ScanIcon() {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
			<path d="M3 9V5a2 2 0 0 1 2-2h4M15 3h4a2 2 0 0 1 2 2v4M3 15v4a2 2 0 0 1 2 2h4M15 21h4a2 2 0 0 1 2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
			<rect x="7" y="7" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
		</svg>
	)
}
