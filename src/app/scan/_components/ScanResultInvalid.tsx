"use client"

type Props = {
	message?: string
	onScanNext: () => void
}

export function ScanResultInvalid({ message, onScanNext }: Props) {
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

			<div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-10">
				{/* Icon */}
				<div className="size-20 rounded-full bg-red-50 flex items-center justify-center">
					<XIcon />
				</div>

				{/* Text */}
				<div className="text-center">
					<p className="text-[20px] font-bold text-neutral-900 mb-2">Invalid ticket</p>
					<p className="text-[14px] text-neutral-500 leading-snug">
						{message ?? "This QR code could not be verified. Ask the attendee to show their original confirmation email."}
					</p>
				</div>

				{/* Action */}
				<button
					onClick={onScanNext}
					className="w-full flex items-center justify-center gap-2 h-14 bg-red-600 text-white text-[15px] font-semibold rounded-2xl active:bg-red-700 transition-colors"
				>
					<ScanIcon />
					Scan next
				</button>
			</div>

			{/* Footer */}
			<div className="flex items-center justify-center gap-1.5 pb-8">
				<ShieldIcon />
				<span className="text-[11px] text-neutral-400">Secure connection · Do not share this link</span>
			</div>
		</div>
	)
}

function XIcon() {
	return (
		<svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-red-500" aria-hidden>
			<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
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
function LockIcon() {
	return (
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-neutral-400" aria-hidden>
			<rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
			<path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
