"use client"

import type { ScanResult, VerifySessionResponse } from "@/lib/scannerApi"
import { Button } from "@/components/ui/Button"

type DuplicateResult = Extract<ScanResult, { status: "DUPLICATE" }>

type Props = {
	result: DuplicateResult
	sessionData: VerifySessionResponse
	onScanNext: () => void
}

export function ScanResultDuplicate({ result, sessionData, onScanNext }: Props) {
	const codeSuffix = result.ticketCode.slice(-8).toUpperCase()

	return (
		<div className="flex flex-col min-h-screen bg-surface-canvas">
			{/* Status strip */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
				<div className="flex items-center gap-2 px-3 py-1.5 bg-surface-success-soft border border-green-200 rounded-avatar">
					<span className="size-1.5 rounded-avatar bg-text-success" />
					<span className="text-caption font-medium text-text-success">Link active</span>
				</div>
				<div className="flex items-center gap-1.5">
					<LockIcon />
					<span className="text-caption text-text-muted">Secure check-in link</span>
				</div>
			</div>

			<div className="flex-1 flex flex-col gap-5 px-4 py-5 overflow-y-auto">
				{/* Warning banner */}
				<div className="flex items-start gap-3 p-4 bg-surface-warning-soft border border-border-warning rounded-action shadow-card">
					<div className="size-10 rounded-action bg-surface-card flex items-center justify-center shrink-0">
						<WarningIcon />
					</div>
					<div>
						<p className="text-label-md text-text-warning font-bold">Already checked in</p>
						<p className="text-caption text-text-warning mt-0.5 leading-snug">
							This QR has already been used. Ask the attendee to contact the host desk if
							needed.
						</p>
					</div>
				</div>

				{/* Detail rows */}
				<div className="bg-surface-card-muted rounded-action border border-border-default shadow-card overflow-hidden">
					<DetailRow icon={<QrIcon />} label="Ticket code" value={`ending ${codeSuffix}`} />
					<Divider />
					{result.checkedInAt && (
						<>
							<DetailRow
								icon={<ClockIcon />}
								label="First scanned at"
								value={result.checkedInAt}
							/>
							<Divider />
						</>
					)}
					<DetailRow icon={<CalendarIcon />} label="Event" value={sessionData.event.title} />
				</div>

				{/* Actions */}
				<div className="flex flex-col gap-3">
					<Button
						onClick={onScanNext}
						size="lg"
						radius="lg"
						className="w-full"
						leftIcon={<ScanIcon />}
					>
						Scan next
					</Button>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-center gap-1.5 pb-4">
					<ShieldIcon />
					<span className="text-caption text-text-muted">
						Secure connection · Do not share this link
					</span>
				</div>
			</div>
		</div>
	)
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
	return (
		<div className="flex items-center gap-3 px-4 py-3.5">
			<div className="size-9 rounded-action bg-surface-card border border-border-default flex items-center justify-center shrink-0">
				{icon}
			</div>
			<div>
				<p className="text-caption text-text-muted font-medium">{label}</p>
				<p className="text-label-md text-text-primary font-semibold">{value}</p>
			</div>
		</div>
	)
}

function Divider() {
	return <div className="mx-4 h-px bg-border-subtle" />
}

function WarningIcon() {
	return (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-text-warning" aria-hidden>
			<path
				d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinejoin="round"
			/>
			<path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}
function QrIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			className="text-text-secondary"
			aria-hidden
		>
			<rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
			<rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
			<rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
		</svg>
	)
}
function ClockIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			className="text-text-secondary"
			aria-hidden
		>
			<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
			<path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
		</svg>
	)
}
function CalendarIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			className="text-text-secondary"
			aria-hidden
		>
			<rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
			<path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
		</svg>
	)
}
function LockIcon() {
	return (
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-text-muted" aria-hidden>
			<rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
			<path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}
function ScanIcon() {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
			<path
				d="M3 9V5a2 2 0 0 1 2-2h4M15 3h4a2 2 0 0 1 2 2v4M3 15v4a2 2 0 0 1 2 2h4M15 21h4a2 2 0 0 1 2-2v-4"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
			<rect x="7" y="7" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
		</svg>
	)
}
function ShieldIcon() {
	return (
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-text-muted" aria-hidden>
			<path
				d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinejoin="round"
			/>
		</svg>
	)
}
