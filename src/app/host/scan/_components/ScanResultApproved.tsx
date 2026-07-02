"use client"

import { useEffect, useState } from "react"
import type { ScanResult } from "@/lib/scannerApi"
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

	return (
		<div className="flex flex-col min-h-screen bg-white">
			{/* Header area */}
			<div className="flex flex-col items-center pt-12 pb-6 px-6 gap-4">
				{/* Animated checkmark */}
				<div
					className={`size-20 rounded-full bg-green-100 flex items-center justify-center transition-all duration-500 ${
						show ? "scale-100 opacity-100" : "scale-50 opacity-0"
					}`}
				>
					<CheckIcon />
				</div>

				<div className="text-center">
					<h1 className="text-2xl font-bold text-green-600">Entry approved</h1>
					<p className="text-[13px] text-neutral-500 mt-1">Attendee successfully checked in</p>
				</div>

				<div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
					<ShieldCheckIcon />
					<span className="text-[12px] font-semibold text-green-700">
						{result.entriesAdmitted} {result.entriesAdmitted === 1 ? "entry" : "entries"} admitted
					</span>
				</div>
			</div>

			{/* Detail rows */}
			<div className="mx-4 bg-neutral-50 rounded-panel border border-neutral-200 shadow-md overflow-hidden">
				<DetailRow icon={<TicketIcon />} label="Ticket tier" value={result.ticketTier} />
				<Divider />
				<DetailRow icon={<QrIcon />} label="Ticket code" value={`QR ending ${result.ticketCodeSuffix}`} />
				<Divider />
				<DetailRow icon={<GateIcon />} label="Gate" value={result.gate} />
				<Divider />
				<DetailRow icon={<ClockIcon />} label="Check-in time" value={result.checkedInAt} />
			</div>

			{/* Privacy notice */}
			<div className="mx-4 mt-4">
				<PrivacyNotice compact />
			</div>

			{/* Actions */}
			<div className="flex flex-col gap-3 px-4 mt-6">
				<button
					onClick={onScanNext}
					className="w-full flex items-center justify-center gap-2 h-14 bg-red-600 text-white text-[15px] font-semibold rounded-2xl active:bg-red-700 transition-colors"
				>
					<ScanIcon />
					Scan next
				</button>
				<button
					onClick={() => {}}
					className="w-full flex items-center justify-center gap-2 h-12 border-2 border-neutral-200 text-neutral-700 text-[14px] font-medium rounded-2xl active:bg-neutral-50 transition-colors"
				>
					<LogIcon />
					View log
				</button>
			</div>

			{/* Live activity would go here — omitted for now */}
			<div className="pb-8" />
		</div>
	)
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
	return (
		<div className="flex items-center gap-3 px-4 py-3.5">
			<div className="size-9 rounded-lg bg-white border border-neutral-200 flex items-center justify-center shrink-0">
				{icon}
			</div>
			<div className="flex-1 min-w-0">
				<p className="text-[11px] text-neutral-400 font-medium">{label}</p>
				<p className="text-[14px] font-semibold text-neutral-900">{value}</p>
			</div>
		</div>
	)
}

function Divider() {
	return <div className="mx-4 h-px bg-neutral-200" />
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function CheckIcon() {
	return (
		<svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-green-600" aria-hidden>
			<path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}
function ShieldCheckIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-green-600" aria-hidden>
			<path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
			<path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}
function TicketIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-neutral-500" aria-hidden>
			<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z" stroke="currentColor" strokeWidth="1.8" />
		</svg>
	)
}
function QrIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-neutral-500" aria-hidden>
			<rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
			<rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
			<rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
			<path d="M14 14h2v2h-2zM18 14h3v2h-3zM14 18h3v3h-3zM19 18v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
		</svg>
	)
}
function GateIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-red-400" aria-hidden>
			<rect x="2" y="7" width="8" height="14" rx="1" stroke="currentColor" strokeWidth="1.8" />
			<rect x="14" y="7" width="8" height="14" rx="1" stroke="currentColor" strokeWidth="1.8" />
			<path d="M10 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
		</svg>
	)
}
function ClockIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-neutral-500" aria-hidden>
			<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
			<path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
function LogIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
			<rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
			<path d="M7 8h10M7 12h10M7 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}
