"use client"

import type { AggregatedReactionWithMine } from "@/store/chatStore"

interface ReactionBarProps {
	reactions: AggregatedReactionWithMine[]
	onToggle: (emoji: string, mine: boolean) => void
}

export function ReactionBar({ reactions, onToggle }: ReactionBarProps) {
	if (reactions.length === 0) return null

	return (
		<div className="flex items-center gap-1 mt-2 flex-wrap">
			{reactions.map(r => (
				<button
					key={r.emoji}
					type="button"
					onClick={() => onToggle(r.emoji, r.mine)}
					className={`inline-flex items-center gap-1 h-6 px-2 rounded-full text-[11px] font-medium transition-colors border ${
						r.mine
							? "bg-violet-50 border-violet-300 text-violet-700 hover:bg-violet-100"
							: "bg-gray-50 border-gray-200 text-text-secondary hover:bg-gray-100 hover:border-gray-300"
					}`}
					title={r.mine ? "Remove reaction" : "Add reaction"}
				>
					<span>{r.emoji}</span>
					<span className="tabular-nums">{r.count}</span>
				</button>
			))}
		</div>
	)
}
