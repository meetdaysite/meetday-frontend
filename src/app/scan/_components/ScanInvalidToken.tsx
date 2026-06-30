export function ScanInvalidToken({ message }: { message?: string }) {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white">
			<div className="max-w-sm w-full flex flex-col items-center text-center gap-6">
				<div className="size-20 rounded-full bg-red-50 flex items-center justify-center">
					<LockIcon />
				</div>
				<div>
					<h1 className="text-xl font-bold text-neutral-900 mb-2">
						{message === "expired" ? "Link expired" : "Invalid link"}
					</h1>
					<p className="text-sm text-neutral-500 leading-relaxed">
						{message === "expired"
							? "This scanner link has expired. Ask the event host to send a new invite."
							: "This scanner link is invalid or has already been deactivated. Contact your event host."}
					</p>
				</div>
				<div className="flex items-center gap-2 px-4 py-3 bg-neutral-50 rounded-panel border border-neutral-200 shadow-md">
					<ShieldIcon />
					<p className="text-xs text-neutral-500">Secure connection · Do not share this link</p>
				</div>
			</div>
		</div>
	)
}

function LockIcon() {
	return (
		<svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-red-400" aria-hidden>
			<rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
			<path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
			<circle cx="12" cy="16" r="1.5" fill="currentColor" />
		</svg>
	)
}

function ShieldIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-neutral-400 shrink-0" aria-hidden>
			<path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
			<path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}
