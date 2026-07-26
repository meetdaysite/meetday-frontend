"use client"

import { useEffect, useRef, useState } from "react"
import clsx from "clsx"
import { DayPicker } from "react-day-picker"
import { Icon } from "@/components/ui/Icon"
import { iconWrapCls } from "@/components/eventForm/shared"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import AltArrowLeftSvg from "@/icons/outlined/alt-arrow-left.svg"
import AltArrowRightSvg from "@/icons/outlined/alt-arrow-right.svg"

export function parseDateInput(value: string): Date | undefined {
	if (!value) return undefined
	const [y, m, d] = value.split("-").map(Number)
	if (!y || !m || !d) return undefined
	return new Date(y, m - 1, d)
}

function formatDateInput(date: Date): string {
	const y = date.getFullYear()
	const m = String(date.getMonth() + 1).padStart(2, "0")
	const d = String(date.getDate()).padStart(2, "0")
	return `${y}-${m}-${d}`
}

// Typed format is DD/MM/YYYY — used both for display and manual entry, so
// what's on screen is always exactly what you'd retype.
function formatDateTyped(date: Date): string {
	const d = String(date.getDate()).padStart(2, "0")
	const m = String(date.getMonth() + 1).padStart(2, "0")
	return `${d}/${m}/${date.getFullYear()}`
}

function maskDateTyped(raw: string): string {
	const digits = raw.replace(/\D/g, "").slice(0, 8)
	if (digits.length <= 2) return digits
	if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
	return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function parseTypedDate(text: string): Date | undefined {
	const m = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
	if (!m) return undefined
	const day = Number(m[1])
	const month = Number(m[2])
	const year = Number(m[3])
	const date = new Date(year, month - 1, day)
	if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return undefined
	return date
}

const dayButtonCls = clsx(
	"size-8 mx-auto flex items-center justify-center rounded-full text-sm text-text-primary transition-colors outline-none",
	"hover:bg-surface-card-muted",
	"group-data-[today=true]:font-semibold group-data-[today=true]:text-text-brand",
	"group-data-[selected=true]:bg-action-primary group-data-[selected=true]:text-action-primary-text group-data-[selected=true]:hover:bg-action-primary-hover",
	"group-data-[outside=true]:text-text-muted",
	"group-data-[disabled=true]:opacity-30 group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:hover:bg-transparent",
)

interface DateFieldProps {
	id?: string
	value: string
	onChange: (v: string) => void
	error?: boolean
	minDate?: Date
	placeholder?: string
}

export function DateField({ id, value, onChange, error = false, minDate, placeholder = "DD/MM/YYYY" }: DateFieldProps) {
	const [open, setOpen] = useState(false)
	const [syncedValue, setSyncedValue] = useState(value)
	const [inputText, setInputText] = useState(() => {
		const selected = parseDateInput(value)
		return selected ? formatDateTyped(selected) : ""
	})
	const rootRef = useRef<HTMLDivElement>(null)
	const selected = parseDateInput(value)

	// Re-syncs from the committed value (typed commits, calendar picks) without an
	// effect — this only adjusts state during render when `value` actually changed,
	// so it never clobbers text the user is mid-typing.
	if (value !== syncedValue) {
		setSyncedValue(value)
		setInputText(selected ? formatDateTyped(selected) : "")
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

	function commitTyped() {
		const parsed = parseTypedDate(inputText)
		if (parsed && (!minDate || parsed >= minDate)) {
			onChange(formatDateInput(parsed))
		} else {
			setInputText(selected ? formatDateTyped(selected) : "")
		}
	}

	return (
		<div ref={rootRef} className="relative">
			<div className={clsx(iconWrapCls(error), open && "border-border-focused bg-surface-canvas")}>
				<button
					type="button"
					onClick={() => setOpen((o) => !o)}
					aria-label="Open calendar"
					className="shrink-0"
				>
					<Icon as={CalendarSvg} size="md" color="secondary" />
				</button>
				<input
					id={id}
					type="text"
					inputMode="numeric"
					value={inputText}
					onChange={(e) => setInputText(maskDateTyped(e.target.value))}
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
				<div className="absolute z-50 mt-1 min-w-70 rounded-action border border-border-default bg-surface-card p-3 shadow-modal">
					<DayPicker
						mode="single"
						selected={selected}
						defaultMonth={selected ?? minDate}
						onSelect={(date) => {
							if (!date) return
							onChange(formatDateInput(date))
							setOpen(false)
						}}
						disabled={minDate ? { before: minDate } : undefined}
						showOutsideDays
						classNames={{
							months: "relative flex flex-col",
							month: "flex flex-col gap-3",
							month_caption: "flex items-center justify-center h-9",
							caption_label: "text-label-sm font-semibold text-text-primary",
							nav: "absolute inset-x-0 top-0 flex items-center justify-between h-9",
							button_previous:
								"size-7 flex items-center justify-center rounded-action text-text-secondary hover:bg-surface-card-muted hover:text-text-primary transition-colors disabled:opacity-30 disabled:pointer-events-none",
							button_next:
								"size-7 flex items-center justify-center rounded-action text-text-secondary hover:bg-surface-card-muted hover:text-text-primary transition-colors disabled:opacity-30 disabled:pointer-events-none",
							chevron: "size-4 fill-current",
							month_grid: "w-full border-collapse mt-1",
							weekday: "text-caption font-medium text-text-tertiary pb-2 w-9 text-center",
							day: "group p-0.5 text-center",
							day_button: dayButtonCls,
						}}
						components={{
							Chevron: (props) =>
								props.orientation === "left" ? (
									<AltArrowLeftSvg className={props.className} />
								) : (
									<AltArrowRightSvg className={props.className} />
								),
						}}
					/>
				</div>
			)}
		</div>
	)
}
