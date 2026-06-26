"use client"

import clsx from "clsx"
import { ClipboardEvent, KeyboardEvent, useRef } from "react"

interface OtpInputProps {
	length?: number
	value: string
	onChange: (value: string) => void
}

export function OtpInput({ length = 6, value, onChange }: OtpInputProps) {
	const inputRefs = useRef<(HTMLInputElement | null)[]>([])
	const digits = value.split("").concat(Array(length).fill("")).slice(0, length)

	const focus = (index: number) => inputRefs.current[index]?.focus()

	const handleChange = (index: number, char: string) => {
		if (!/^\d?$/.test(char)) return
		const next = digits.slice()
		next[index] = char
		onChange(next.join(""))
		if (char && index < length - 1) focus(index + 1)
	}

	const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Backspace" && !digits[index] && index > 0) {
			focus(index - 1)
		}
	}

	const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
		e.preventDefault()
		const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length)
		onChange(pasted.padEnd(length, "").slice(0, length))
		focus(Math.min(pasted.length, length - 1))
	}

	return (
		<div className="flex gap-2.5">
			{digits.map((digit, i) => (
				<input
					key={i}
					ref={el => {
						inputRefs.current[i] = el
					}}
					type="text"
					inputMode="numeric"
					maxLength={1}
					value={digit}
					onChange={e => handleChange(i, e.target.value)}
					onKeyDown={e => handleKeyDown(i, e)}
					onPaste={handlePaste}
					className={clsx(
						"w-12 h-12 rounded-input border text-center text-lg font-semibold",
						"outline-none transition-colors duration-(--duration-120)",
						"bg-surface-canvas text-text-primary placeholder:text-text-muted",
						digit ? "border-action-primary" : "border-border-default focus:border-border-focused",
					)}
					aria-label={`OTP digit ${i + 1}`}
				/>
			))}
		</div>
	)
}
