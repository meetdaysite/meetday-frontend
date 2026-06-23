"use client"

import { useState, useRef, useCallback } from "react"
import { Icon } from "@/components/ui/Icon"
import SmileCircleSvg from "@/icons/outlined/smile-circle.svg"
// File attachment is commented out — no CHAT_MEDIA upload context exists on the backend yet.
// import FileTextSvg from "@/icons/outlined/file-text.svg"
import PlaneSvg from "@/icons/outlined/plane.svg"

const TYPING_THROTTLE_MS = 2000

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
	const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const lastTypingEmit = useRef(0)

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

			<div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-surface-page border border-border-default">
				<input
					type="text"
					value={value}
					onChange={handleChange}
					onKeyDown={handleKeyDown}
					onBlur={handleBlur}
					placeholder={placeholder}
					className="flex-1 text-label-sm text-text-primary placeholder:text-text-muted bg-transparent outline-none"
				/>
				<div className="flex items-center gap-2 shrink-0">
					{/* Emoji picker — UI placeholder, not yet wired to a picker library */}
					<button
						type="button"
						className="text-text-muted hover:text-text-primary transition-colors"
						title="Add emoji (coming soon)"
					>
						<Icon as={SmileCircleSvg} size="sm" color="muted" />
					</button>

					{/*
						File attachment disabled — backend has no CHAT_MEDIA upload context yet.
						When backend adds support, uncomment and wire to uploadMedia + send URL as message.

					<button type="button" className="text-text-muted hover:text-text-primary transition-colors" title="Attach file (coming soon)">
						<Icon as={FileTextSvg} size="sm" color="muted" />
					</button>
					*/}
				</div>

				<button
					type="button"
					onClick={handleSend}
					disabled={!value.trim()}
					className="size-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0 hover:bg-violet-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
				>
					<Icon as={PlaneSvg} size="sm" color="inverse" />
				</button>
			</div>
		</div>
	)
}
