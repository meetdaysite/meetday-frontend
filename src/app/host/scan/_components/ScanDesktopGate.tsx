export function ScanDesktopGate() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white">
			<div className="max-w-sm w-full flex flex-col items-center text-center gap-6">
				<div className="size-20 rounded-full bg-neutral-100 flex items-center justify-center">
					<PhoneIcon />
				</div>
				<div>
					<h1 className="text-xl font-bold text-neutral-900 mb-2">Open on your phone</h1>
					<p className="text-sm text-neutral-500 leading-relaxed">
						This scanner link is designed for mobile devices. Open it on your phone at the venue to start checking in attendees.
					</p>
				</div>
				<div className="w-full p-4 bg-neutral-50 rounded-action border border-neutral-200 shadow-md">
					<p className="text-xs text-neutral-400 mb-2 font-medium uppercase tracking-wide">Current URL</p>
					<p className="text-xs text-neutral-600 font-mono break-all select-all">
						{typeof window !== "undefined" ? window.location.href : ""}
					</p>
				</div>
				<p className="text-xs text-neutral-400">
					Copy the URL above and open it on your phone browser.
				</p>
			</div>
		</div>
	)
}

function PhoneIcon() {
	return (
		<svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-neutral-400" aria-hidden>
			<rect x="5" y="2" width="14" height="20" rx="3" stroke="currentColor" strokeWidth="2" />
			<path d="M12 18h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
		</svg>
	)
}
