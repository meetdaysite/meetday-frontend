"use client"

import { useEffect, useRef, useState } from "react"

const CATEGORIES: { label: string; icon: string; emojis: string[] }[] = [
	{
		label: "Smileys",
		icon: "😀",
		emojis: [
			"😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩",
			"😘", "😗", "😚", "😙", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨",
			"😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕",
			"🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "😎", "🤓", "🧐", "😕", "😟", "🙁",
			"😮", "😯", "😲", "😳", "🥺", "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞",
			"😓", "😩", "😫", "😤", "😡", "😠", "🤬", "😈", "👿", "💀", "🤡", "👻", "👽", "🤖",
		],
	},
	{
		label: "Gestures",
		icon: "👍",
		emojis: [
			"👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆",
			"🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🙏", "🤝", "💪",
			"🦾", "🖊️", "✍️", "💅", "🤳", "💃", "🕺", "🧑‍🤝‍🧑", "👫", "👬", "👭",
		],
	},
	{
		label: "Animals",
		icon: "🐶",
		emojis: [
			"🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐽", "🐸", "🐵",
			"🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄",
			"🐝", "🐛", "🦋", "🐌", "🐞", "🐜", "🦟", "🦗", "🕷️", "🐢", "🐍", "🦎", "🦖", "🐙", "🦑", "🦀",
			"🐠", "🐟", "🐡", "🐬", "🐳", "🐋", "🦈", "🐊", "🐅", "🐆", "🦓", "🦍", "🐘", "🦏", "🐪", "🐫",
		],
	},
	{
		label: "Food",
		icon: "🍔",
		emojis: [
			"🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥",
			"🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🌽", "🥕", "🧄", "🧅", "🥔", "🍞", "🥐", "🥖",
			"🧀", "🥚", "🍳", "🧈", "🥞", "🧇", "🥓", "🍔", "🍟", "🍕", "🌭", "🥪", "🌮", "🌯", "🥗", "🍿",
			"🧂", "🍱", "🍣", "🍤", "🍙", "🍚", "🍛", "🍜", "🍝", "🍠", "🍢", "🍡", "🍦", "🍧", "🍨", "🍩",
			"🍪", "🎂", "🍰", "🧁", "🥧", "🍫", "🍬", "🍭", "☕", "🍵", "🧃", "🥤", "🍺", "🍻", "🍷", "🥂",
		],
	},
	{
		label: "Activities",
		icon: "⚽",
		emojis: [
			"⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸", "🥊", "🥋", "🎯", "🎳", "⛳",
			"🎣", "🤿", "🎽", "🎿", "🛹", "🎮", "🕹️", "🎲", "🧩", "🎭", "🎨", "🎤", "🎧", "🎸", "🎹", "🥁",
			"🎷", "🎺", "🎻", "🏆", "🥇", "🥈", "🥉", "🏅", "🎖️",
		],
	},
	{
		label: "Travel",
		icon: "✈️",
		emojis: [
			"🚗", "🚕", "🚙", "🚌", "🏎️", "🚓", "🚑", "🚒", "🚚", "🚲", "🛴", "🏍️", "✈️", "🛫", "🛬", "🚀",
			"🛸", "🚁", "⛵", "🚤", "🛳️", "⚓", "🗺️", "🗽", "🗼", "🏰", "🏯", "🎡", "🎢", "🎠", "⛺", "🏕️",
			"🏖️", "🏜️", "🌋", "🏔️", "⛰️", "🌄", "🌅", "🌆", "🌇", "🌃", "🌉", "🌌",
		],
	},
	{
		label: "Objects",
		icon: "💡",
		emojis: [
			"⌚", "📱", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "💿", "📷", "📸", "🎥", "📞", "☎️", "📺", "📻", "🎙️",
			"⏰", "⏱️", "🔋", "🔌", "💡", "🔦", "🕯️", "🧯", "🛢️", "💰", "💵", "💳", "💎", "🔧", "🔨", "🪛",
			"🔩", "⚙️", "🧲", "🔫", "💣", "🔪", "🗡️", "🛡️", "🚪", "🪑", "🛏️", "🛋️", "🚽", "🚿", "🛁", "🧴",
			"🧷", "🧹", "🧺", "🧻", "🧼", "🧽", "🔑", "🗝️", "🔒", "🔓", "📩", "📧", "💌", "📥", "📤", "📦",
		],
	},
	{
		label: "Symbols",
		icon: "❤️",
		emojis: [
			"❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖",
			"💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⭐", "🌟",
			"✨", "⚡", "🔥", "💯", "💢", "💥", "💫", "💦", "💨", "🕳️", "💬", "👁️‍🗨️", "🗨️", "🗯️", "💭", "🔴",
			"🟠", "🟡", "🟢", "🔵", "🟣", "⚪", "⚫", "✅", "❌", "❓", "❗", "‼️", "⁉️", "🚫", "♻️", "🆗",
		],
	},
]

export function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
	const [open, setOpen] = useState(false)
	const [activeCategory, setActiveCategory] = useState(0)
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
				<div className="absolute bottom-full mb-2 left-0 z-50 w-80 rounded-2xl border-[3px] border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
					<div className="flex border-b-[3px] border-black overflow-x-auto shrink-0">
						{CATEGORIES.map((cat, i) => (
							<button
								key={cat.label}
								type="button"
								onClick={() => setActiveCategory(i)}
								title={cat.label}
								className={`shrink-0 w-10 h-10 flex items-center justify-center text-base ${
									activeCategory === i ? "bg-[#FFC940]" : "hover:bg-neutral-50"
								}`}
							>
								{cat.icon}
							</button>
						))}
					</div>
					<div className="max-h-56 overflow-y-auto grid grid-cols-8 gap-1 p-2">
						{CATEGORIES[activeCategory].emojis.map((emoji, i) => (
							<button
								key={`${emoji}-${i}`}
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
				</div>
			)}
		</div>
	)
}
