"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import clsx from "clsx"
import { Icon } from "@/components/ui/Icon"
import { iconWrapCls } from "@/components/eventForm/shared"
import ClockCircleSvg from "@/icons/outlined/clock-circle.svg"

// Typed format is "h:mm AM/PM" — used both for display and manual entry, so
// what's on screen is always exactly what you'd retype.
function formatTimeTyped(value: string): string | null {
	const [h, m] = value.split(":").map(Number)
	if (!Number.isFinite(h) || !Number.isFinite(m)) return null
	const period = h >= 12 ? "PM" : "AM"
	const hour12 = h % 12 === 0 ? 12 : h % 12
	return `${hour12}:${String(m).padStart(2, "0")} ${period}`
}

function maskTimeTyped(raw: string): string {
	const cleaned = raw.toUpperCase().replace(/[^0-9AP]/g, "")
	const digits = cleaned.replace(/[AP]/g, "").slice(0, 4)
	const periodChar = cleaned.match(/[AP]/)?.[0]
	let out = digits.length <= 2 ? digits : `${digits.slice(0, 2)}:${digits.slice(2)}`
	if (periodChar) out += ` ${periodChar}M`
	return out
}

function parseTypedTime(text: string): string | undefined {
	const m = text.match(/^(\d{1,2}):(\d{2})\s(AM|PM)$/)
	if (!m) return undefined
	let h = Number(m[1])
	const mi = Number(m[2])
	if (h < 1 || h > 12 || mi > 59) return undefined
	if (m[3] === "PM" && h !== 12) h += 12
	if (m[3] === "AM" && h === 12) h = 0
	return `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`
}

function buildTimeOptions(stepMinutes: number) {
	const options: { value: string; label: string }[] = []
	for (let mins = 0; mins < 24 * 60; mins += stepMinutes) {
		const value = `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`
		options.push({ value, label: formatTimeTyped(value)! })
	}
	return options
}

interface TimeFieldProps {
	id?: string
	value: string
	onChange: (v: string) => void
	error?: boolean
	placeholder?: string
	stepMinutes?: number
}

export function TimeField({ id, value, onChange, error = false, placeholder = "hh:mm AM/PM", stepMinutes = 15 }: TimeFieldProps) {
	const [open, setOpen] = useState(false)
	const [syncedValue, setSyncedValue] = useState(value)
	const [inputText, setInputText] = useState(() => formatTimeTyped(value) ?? "")
	const rootRef = useRef<HTMLDivElement>(null)
	const listRef = useRef<HTMLUListElement>(null)
	const options = useMemo(() => buildTimeOptions(stepMinutes), [stepMinutes])

	// Re-syncs from the committed value (typed commits, list picks) without an
	// effect — this only adjusts state during render when `value` actually changed,
	// so it never clobbers text the user is mid-typing.
	if (value !== syncedValue) {
		setSyncedValue(value)
		setInputText(formatTimeTyped(value) ?? "")
	}

	useEffect(() => {
		if (!open) return

		function handlePointerDown(event: PointerEvent) {
			if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
		}
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") setOpen(false)
		}

		document.addEventListener("pointerdown", handlePointerDown)
		document.addEventListener("keydown", handleKeyDown)
		return () => {
			document.removeEventListener("pointerdown", handlePointerDown)
			document.removeEventListener("keydown", handleKeyDown)
		}
	}, [open])

	useEffect(() => {
		if (!open) return
		listRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: "center" })
	}, [open])

	function commitTyped() {
		const parsed = parseTypedTime(inputText)
		if (parsed) {
			onChange(parsed)
		} else {
			setInputText(formatTimeTyped(value) ?? "")
		}
	}

	return (
		<div ref={rootRef} className="relative">
			<div className={clsx(iconWrapCls(error), open && "border-border-focused bg-surface-canvas")}>
				<button
					type="button"
					onClick={() => setOpen((o) => !o)}
					aria-label="Open time list"
					className="shrink-0"
				>
					<Icon as={ClockCircleSvg} size="md" color="secondary" />
				</button>
				<input
					id={id}
					type="text"
					inputMode="numeric"
					value={inputText}
					onChange={(e) => setInputText(maskTimeTyped(e.target.value))}
					onFocus={() => setOpen(true)}
					onBlur={commitTyped}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							commitTyped()
							setOpen(false)
						}
					}}
					placeholder={placeholder}
					className="flex-1 min-w-0 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
				/>
			</div>

			{open && (
				<ul
					ref={listRef}
					role="listbox"
					className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-action border border-border-default bg-surface-card py-1 shadow-modal"
				>
					{options.map((option) => {
						const isSelected = option.value === value
						return (
							<li
								key={option.value}
								role="option"
								aria-selected={isSelected}
								data-selected={isSelected || undefined}
								onMouseDown={(e) => e.preventDefault()}
								onClick={() => { onChange(option.value); setOpen(false) }}
								className={clsx(
									"px-3.5 py-2.5 text-sm cursor-pointer select-none transition-colors duration-(--duration-120)",
									isSelected ? "bg-surface-card-muted text-text-brand font-medium" : "text-text-primary hover:bg-surface-card-muted",
								)}
							>
								{option.label}
							</li>
						)
					})}
				</ul>
			)}
		</div>
	)
}
