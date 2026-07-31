export function ScanInvalidToken({ message }: { message?: string }) {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-8 bg-surface-canvas">
			<div className="max-w-sm w-full flex flex-col items-center text-center gap-6">
				<div className="size-20 rounded-avatar bg-surface-brand-soft flex items-center justify-center">
					<LockIcon />
				</div>
				<div>
					<h1 className="text-title-md text-text-primary mb-2">
						{message === "expired" ? "Link expired" : "Invalid link"}
					</h1>
					<p className="text-body-sm text-text-secondary leading-relaxed">
						{message === "expired"
							? "This scanner link has expired or been deactivated. Ask the event host to send a new invite."
							: "This scanner link is invalid or has already been deactivated. Contact your event host."}
					</p>
				</div>
				<div className="flex items-center gap-2 px-4 py-3 bg-surface-card-muted rounded-action border border-border-default shadow-card">
					<ShieldIcon />
					<p className="text-caption text-text-tertiary">Secure connection · Do not share this link</p>
				</div>
			</div>
		</div>
	)
}

function LockIcon() {
	return (
		<svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-text-brand" aria-hidden>
			<rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
			<path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
			<circle cx="12" cy="16" r="1.5" fill="currentColor" />
		</svg>
	)
}

function ShieldIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-text-muted shrink-0" aria-hidden>
			<path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
			<path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}
