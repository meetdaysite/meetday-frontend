"use client"

import type { AggregatedReactionWithMine } from "@/store/chatStore"

interface ReactionBarProps {
	reactions: AggregatedReactionWithMine[]
	onToggle: (emoji: string, mine: boolean) => void
}

export function ReactionBar({ reactions, onToggle }: ReactionBarProps) {
	if (reactions.length === 0) return null

	return (
		<div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
			{reactions.map(r => (
				<button
					key={r.emoji}
					type="button"
					onClick={() => onToggle(r.emoji, r.mine)}
					className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] transition-colors border ${
						r.mine
							? "bg-surface-vibe-soft border-purple-200 text-violet-700"
							: "bg-surface-page border-border-default text-text-secondary hover:bg-surface-hover"
					}`}
					title={r.mine ? "Remove reaction" : "Add reaction"}
				>
					{r.emoji} {r.count}
				</button>
			))}
		</div>
	)
}
