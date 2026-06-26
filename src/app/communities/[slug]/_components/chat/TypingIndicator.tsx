"use client"

interface TypingIndicatorProps {
	displayNames: string[]
}

export function TypingIndicator({ displayNames }: TypingIndicatorProps) {
	if (displayNames.length === 0) return null

	let label: string
	if (displayNames.length === 1) {
		label = `${displayNames[0]} is typing…`
	} else if (displayNames.length === 2) {
		label = `${displayNames[0]} and ${displayNames[1]} are typing…`
	} else {
		label = "Several people are typing…"
	}

	return (
		<div className="flex items-center gap-1.5 px-1 py-0.5">
			<span className="flex gap-0.5 items-end h-3">
				{[0, 1, 2].map(i => (
					<span
						key={i}
						className="size-1.5 rounded-full bg-text-muted animate-bounce"
						style={{ animationDelay: `${i * 0.15}s` }}
					/>
				))}
			</span>
			<span className="text-[11px] text-text-muted italic">{label}</span>
		</div>
	)
}
