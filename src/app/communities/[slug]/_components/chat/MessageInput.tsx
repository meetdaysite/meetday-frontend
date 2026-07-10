"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Icon } from "@/components/ui/Icon"
import SmileCircleSvg from "@/icons/outlined/smile-circle.svg"
import PlaneSvg from "@/icons/outlined/plane.svg"

const TYPING_THROTTLE_MS = 2000

const EMOJI_TRAY = ["😀", "😂", "🥹", "😍", "🤩", "😎", "🥳", "😅", "🙌", "👍", "❤️", "🔥", "✨", "🎉", "😮", "😢"]

interface MessageInputProps {
	placeholder?: string
	quickReplies?: string[]
	onSend: (content: string) => void
	onTypingStart: () => void
	onTypingStop: () => void
}

export function MessageInput({
	placeholder = "Say something…",
	quickReplies,
	onSend,
	onTypingStart,
	onTypingStop,
}: MessageInputProps) {
	const [value, setValue] = useState("")
	const [emojiTrayOpen, setEmojiTrayOpen] = useState(false)
	const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const lastTypingEmit = useRef(0)
	const inputRef = useRef<HTMLInputElement>(null)
	const emojiRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!emojiTrayOpen) return
		function handleClick(e: MouseEvent) {
			if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
				setEmojiTrayOpen(false)
			}
		}
		document.addEventListener("mousedown", handleClick)
		return () => document.removeEventListener("mousedown", handleClick)
	}, [emojiTrayOpen])

	const handleTyping = useCallback(() => {
		const now = Date.now()
		if (now - lastTypingEmit.current > TYPING_THROTTLE_MS) {
			onTypingStart()
			lastTypingEmit.current = now
		}
		if (typingTimer.current) clearTimeout(typingTimer.current)
		typingTimer.current = setTimeout(() => {
			onTypingStop()
		}, 2500)
	}, [onTypingStart, onTypingStop])

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setValue(e.target.value)
		if (e.target.value) {
			handleTyping()
		} else {
			onTypingStop()
		}
	}

	const handleEmojiPick = (emoji: string) => {
		const input = inputRef.current
		if (input) {
			const start = input.selectionStart ?? value.length
			const end = input.selectionEnd ?? value.length
			const next = value.slice(0, start) + emoji + value.slice(end)
			setValue(next)
			// Restore cursor after the inserted emoji
			requestAnimationFrame(() => {
				input.focus()
				input.setSelectionRange(start + emoji.length, start + emoji.length)
			})
		} else {
			setValue(v => v + emoji)
		}
		handleTyping()
		setEmojiTrayOpen(false)
	}

	const handleSend = () => {
		const trimmed = value.trim()
		if (!trimmed) return
		onSend(trimmed)
		setValue("")
		onTypingStop()
		if (typingTimer.current) clearTimeout(typingTimer.current)
	}

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault()
			handleSend()
		}
	}

	const handleBlur = () => {
		onTypingStop()
		if (typingTimer.current) clearTimeout(typingTimer.current)
	}

	return (
		<div className="flex flex-col gap-2">
			{quickReplies && quickReplies.length > 0 && (
				<div className="flex items-center gap-1.5 flex-wrap px-1">
					{quickReplies.map(qr => (
						<button
							key={qr}
							type="button"
							onClick={() => { setValue(qr); onTypingStart() }}
							className="px-3 py-1 rounded-full border border-border-default text-label-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
						>
							{qr}
						</button>
					))}
				</div>
			)}

			<div className="relative">
				{emojiTrayOpen && (
					<div
						ref={emojiRef}
						className="absolute bottom-full mb-2 right-0 z-20 flex flex-wrap gap-1 p-2 w-64 bg-surface-card border border-border-default rounded-action shadow-lg"
					>
						{EMOJI_TRAY.map(emoji => (
							<button
								key={emoji}
								type="button"
								onMouseDown={e => { e.preventDefault(); handleEmojiPick(emoji) }}
								className="text-xl leading-none p-1.5 rounded hover:bg-surface-hover transition-colors"
							>
								{emoji}
							</button>
						))}
					</div>
				)}

				<div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-surface-page border border-border-default transition-all focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100">
					<input
						ref={inputRef}
						type="text"
						value={value}
						onChange={handleChange}
						onKeyDown={handleKeyDown}
						onBlur={handleBlur}
						placeholder={placeholder}
						className="flex-1 text-label-sm text-text-primary placeholder:text-text-muted bg-transparent outline-none"
					/>
					<div className="flex items-center gap-2 shrink-0">
						<button
							type="button"
							onClick={() => setEmojiTrayOpen(v => !v)}
							className={`transition-colors ${emojiTrayOpen ? "text-violet-600" : "text-text-muted hover:text-text-primary"}`}
							title="Add emoji"
						>
							<Icon as={SmileCircleSvg} size="sm" color={emojiTrayOpen ? "vibe" : "muted"} />
						</button>
					</div>

					<button
						type="button"
						onClick={handleSend}
						disabled={!value.trim()}
						className="size-8 rounded-full bg-action-primary flex items-center justify-center shrink-0 hover:bg-action-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
					>
						<Icon as={PlaneSvg} size="sm" color="inverse" />
					</button>
				</div>
			</div>
		</div>
	)
}
