"use client"

import { useEffect, useRef, useState } from "react"

const EMOJIS = [
	"😀", "😂", "😅", "😊", "😍", "😘", "😜", "🤔",
	"😎", "🙂", "😢", "😭", "😡", "😱", "🥺", "😴",
	"👍", "👎", "👏", "🙏", "💪", "🤝", "👋", "🙌",
	"❤️", "🔥", "🎉", "💯", "✅", "❌", "⭐", "🚀",
	"😇", "🤗", "😬", "🥳", "🙈", "😳", "🤩", "😤",
]

export function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
	const [open, setOpen] = useState(false)
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!open) return
		function onClickOutside(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
		}
		document.addEventListener("mousedown", onClickOutside)
		return () => document.removeEventListener("mousedown", onClickOutside)
	}, [open])

	return (
		<div className="relative shrink-0" ref={ref}>
			<button
				type="button"
				onClick={() => setOpen(o => !o)}
				className="shrink-0 size-9 rounded-xl border-[3px] border-black flex items-center justify-center hover:bg-neutral-50 text-base leading-none"
				aria-label="Insert emoji"
			>
				🙂
			</button>
			{open && (
				<div className="absolute bottom-full mb-2 left-0 z-50 w-64 max-h-56 overflow-y-auto grid grid-cols-8 gap-1 p-2 rounded-2xl border-[3px] border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
					{EMOJIS.map(emoji => (
						<button
							key={emoji}
							type="button"
							onClick={() => {
								onSelect(emoji)
								setOpen(false)
							}}
							className="text-lg hover:bg-neutral-100 rounded-lg p-1"
						>
							{emoji}
						</button>
					))}
				</div>
			)}
		</div>
	)
}
