export function PrivacyNotice({ compact = false }: { compact?: boolean }) {
	return (
		<div className="flex items-start gap-3 p-3 bg-surface-info-soft rounded-action border border-blue-200 shadow-card">
			<ShieldIcon className="shrink-0 mt-0.5 text-text-info" size={compact ? 16 : 18} />
			<div>
				<p className="text-label-sm text-text-info font-semibold">Privacy first</p>
				{!compact && (
					<p className="text-caption text-text-info leading-snug mt-0.5">
						Attendee personal details are hidden. You will only see entry verification status.
					</p>
				)}
				{compact && (
					<p className="text-caption text-text-info leading-snug">
						Attendee personal details are hidden.
					</p>
				)}
			</div>
		</div>
	)
}

function ShieldIcon({ className, size = 18 }: { className?: string; size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
			<path
				d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z"
				stroke="currentColor"
				strokeWidth="1.8"
				strokeLinejoin="round"
			/>
			<path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}
