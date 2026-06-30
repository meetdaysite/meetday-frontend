"use client"

import type { ScanResult } from "@/lib/scannerApi"

type DuplicateResult = Extract<ScanResult, { status: "DUPLICATE" }>

type Props = {
	result: DuplicateResult
	onScanNext: () => void
}

export function ScanResultDuplicate({ result, onScanNext }: Props) {
	return (
		<div className="flex flex-col min-h-screen bg-white">
			{/* Status strip */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
				<div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full">
					<span className="size-1.5 rounded-full bg-green-500" />
					<span className="text-[12px] font-medium text-green-700">Link active</span>
				</div>
				<div className="flex items-center gap-1.5">
					<LockIcon />
					<span className="text-[12px] text-neutral-400">Secure check-in link</span>
				</div>
			</div>

			<div className="flex-1 flex flex-col gap-5 px-4 py-5 overflow-y-auto">
				{/* Warning banner */}
				<div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-panel shadow-md">
					<div className="size-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
						<WarningIcon />
					</div>
					<div>
						<p className="text-[15px] font-bold text-orange-700">Already checked in</p>
						<p className="text-[12px] text-orange-600 mt-0.5 leading-snug">
							This QR has already been used. Ask the attendee to contact the host desk if needed.
						</p>
					</div>
				</div>

				{/* Detail rows */}
				<div className="bg-neutral-50 rounded-panel border border-neutral-200 shadow-md overflow-hidden">
					<DetailRow icon={<QrIcon />} label="Ticket code" value={`QR ending ${result.ticketCodeSuffix}`} />
					<Divider />
					<DetailRow icon={<GateIcon />} label="Gate scanned" value={result.gate} />
					<Divider />
					<DetailRow icon={<ClockIcon />} label="First scanned at" value={result.firstScannedAt} />
					<Divider />
					<DetailRow icon={<CalendarIcon />} label="Event" value={result.eventName} />
				</div>

				{/* Audit log */}
				<div className="border border-neutral-200 rounded-panel shadow-md overflow-hidden">
					<div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-200">
						<span className="text-[13px] font-semibold text-neutral-800">Audit log</span>
						<div className="flex items-center gap-1">
							<LockSmIcon />
							<span className="text-[11px] text-neutral-400">Secure</span>
						</div>
					</div>
					<div className="flex flex-col divide-y divide-neutral-100">
						{result.auditLog.map((entry, i) => (
							<div key={i} className="flex items-start justify-between gap-3 px-4 py-3">
								<div className="flex items-start gap-2.5">
									<div className={`mt-0.5 size-4 rounded-full flex items-center justify-center shrink-0 ${
										entry.type === "VERIFIED" ? "bg-green-100" : "bg-red-100"
									}`}>
										{entry.type === "VERIFIED"
											? <CheckTinyIcon className="text-green-600" />
											: <XTinyIcon className="text-red-600" />
										}
									</div>
									<div>
										<p className="text-[11px] font-semibold text-neutral-500">{entry.time}</p>
										<p className="text-[12px] text-neutral-700">{entry.message}</p>
									</div>
								</div>
								<span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
									entry.type === "VERIFIED"
										? "bg-green-100 text-green-700"
										: "bg-red-100 text-red-600"
								}`}>
									{entry.type === "VERIFIED" ? "Verified earlier" : "Duplicate attempt detected"}
								</span>
							</div>
						))}
					</div>
				</div>

				{/* Actions */}
				<div className="flex flex-col gap-3">
					<button
						onClick={onScanNext}
						className="w-full flex items-center justify-center gap-2 h-14 bg-red-600 text-white text-[15px] font-semibold rounded-2xl active:bg-red-700 transition-colors"
					>
						<ScanIcon />
						Scan next
					</button>
					<button
						onClick={() => {}}
						className="w-full flex items-center justify-center gap-2 h-12 border-2 border-red-200 text-red-600 text-[14px] font-medium rounded-2xl active:bg-red-50 transition-colors"
					>
						<HeadphonesIcon />
						Need supervisor help
					</button>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-center gap-1.5 pb-4">
					<ShieldIcon />
					<span className="text-[11px] text-neutral-400">Secure connection · Do not share this link</span>
				</div>
			</div>
		</div>
	)
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
	return (
		<div className="flex items-center gap-3 px-4 py-3.5">
			<div className="size-9 rounded-lg bg-white border border-neutral-200 flex items-center justify-center shrink-0">
				{icon}
			</div>
			<div>
				<p className="text-[11px] text-neutral-400 font-medium">{label}</p>
				<p className="text-[14px] font-semibold text-neutral-900">{value}</p>
			</div>
		</div>
	)
}

function Divider() {
	return <div className="mx-4 h-px bg-neutral-200" />
}

function WarningIcon() {
	return (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-orange-500" aria-hidden>
			<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
			<path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}
function QrIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-neutral-500" aria-hidden>
			<rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
			<rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
			<rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
		</svg>
	)
}
function GateIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-red-400" aria-hidden>
			<rect x="2" y="7" width="8" height="14" rx="1" stroke="currentColor" strokeWidth="1.8" />
			<rect x="14" y="7" width="8" height="14" rx="1" stroke="currentColor" strokeWidth="1.8" />
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
function CalendarIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-neutral-500" aria-hidden>
			<rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
			<path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
		</svg>
	)
}
function LockIcon() {
	return (
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-neutral-400" aria-hidden>
			<rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
			<path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}
function LockSmIcon() {
	return (
		<svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-neutral-400" aria-hidden>
			<rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
			<path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}
function CheckTinyIcon({ className }: { className?: string }) {
	return (
		<svg width="10" height="10" viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
			<path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}
function XTinyIcon({ className }: { className?: string }) {
	return (
		<svg width="10" height="10" viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
			<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
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
function HeadphonesIcon() {
	return (
		<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
			<path d="M3 18v-6a9 9 0 0 1 18 0v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
			<path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" stroke="currentColor" strokeWidth="2" />
		</svg>
	)
}
function ShieldIcon() {
	return (
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-neutral-400" aria-hidden>
			<path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
		</svg>
	)
}
