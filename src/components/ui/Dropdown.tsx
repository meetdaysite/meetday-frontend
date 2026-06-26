"use client"

import clsx from "clsx"
import React, { useEffect, useId, useRef, useState } from "react"
import AltArrowDownSvg from "@/icons/outlined/alt-arrow-down.svg"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DropdownOption {
	value: string
	label: string
	leftElement?: React.ReactNode
	description?: string
	disabled?: boolean
}

interface DropdownProps {
	options: DropdownOption[]
	value?: string
	defaultValue?: string
	onChange?: (value: string) => void
	placeholder?: string
	label?: string
	hint?: string
	helperText?: string
	error?: boolean
	leftIcon?: React.ReactNode
	size?: "sm" | "md" | "lg"
	disabled?: boolean
	className?: string
	id?: string
}

// ─── Size tokens (mirrors TextField) ─────────────────────────────────────────

const triggerSizeClasses: Record<NonNullable<DropdownProps["size"]>, string> = {
	sm: "h-[var(--size-action-sm)] px-3 gap-2 text-xs",
	md: "h-[var(--size-input-md)] px-4 gap-2 text-sm",
	lg: "h-[var(--size-input-lg)] px-4 gap-3 text-base",
}

const iconSizeClasses: Record<NonNullable<DropdownProps["size"]>, string> = {
	sm: "size-4",
	md: "size-5",
	lg: "size-6",
}

const chevronSizeClasses: Record<NonNullable<DropdownProps["size"]>, string> = {
	sm: "size-3.5",
	md: "size-4",
	lg: "size-4.5",
}

const itemSizeClasses: Record<NonNullable<DropdownProps["size"]>, string> = {
	sm: "px-3 py-2 text-xs gap-2",
	md: "px-3.5 py-2.5 text-sm gap-2.5",
	lg: "px-4 py-3 text-base gap-3",
}

const leftElSizeClasses: Record<NonNullable<DropdownProps["size"]>, string> = {
	sm: "size-4",
	md: "size-5",
	lg: "size-6",
}

// ─── Chevron icon ─────────────────────────────────────────────────────────────

function ChevronDown({ className }: { className?: string }) {
	return <AltArrowDownSvg className={className} aria-hidden />
}

// ─── Check icon ───────────────────────────────────────────────────────────────

function CheckIcon({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
			<path
				d="M3 8l3.5 3.5L13 4.5"
				stroke="currentColor"
				strokeWidth={1.75}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Dropdown({
	options,
	value: controlledValue,
	defaultValue,
	onChange,
	placeholder = "Select an option",
	label,
	hint,
	helperText,
	error = false,
	leftIcon,
	size = "md",
	disabled = false,
	className,
	id,
}: DropdownProps) {
	const uid = useId()
	const inputId = id ?? uid
	const listboxId = `${uid}-listbox`

	const isControlled = controlledValue !== undefined
	const [localValue, setLocalValue] = useState(defaultValue ?? "")
	const selectedValue = isControlled ? controlledValue : localValue

	const [open, setOpen] = useState(false)
	const [focusedIndex, setFocusedIndex] = useState(-1)
	const containerRef = useRef<HTMLDivElement>(null)
	const listRef = useRef<HTMLUListElement>(null)

	const selectedOption = options.find(o => o.value === selectedValue)
	const enabledOptions = options.filter(o => !o.disabled)

	// Close on outside click
	useEffect(() => {
		if (!open) return
		function handleMouseDown(e: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setOpen(false)
			}
		}
		document.addEventListener("mousedown", handleMouseDown)
		return () => document.removeEventListener("mousedown", handleMouseDown)
	}, [open])

	// Reset focused index when closing
	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		if (!open) setFocusedIndex(-1)
	}, [open])

	function select(option: DropdownOption) {
		if (option.disabled) return
		if (!isControlled) setLocalValue(option.value)
		onChange?.(option.value)
		setOpen(false)
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (disabled) return

		switch (e.key) {
			case "Enter":
			case " ":
				e.preventDefault()
				if (!open) {
					setOpen(true)
					setFocusedIndex(options.findIndex(o => o.value === selectedValue && !o.disabled))
				} else if (focusedIndex >= 0) {
					select(options[focusedIndex])
				}
				break
			case "Escape":
				setOpen(false)
				break
			case "ArrowDown":
				e.preventDefault()
				if (!open) { setOpen(true); break }
				setFocusedIndex(i => {
					const next = enabledOptions.indexOf(enabledOptions.find((_, idx) =>
						options.indexOf(enabledOptions[idx]) > i
					) ?? enabledOptions[0])
					return options.indexOf(enabledOptions[Math.max(0, next)])
				})
				break
			case "ArrowUp":
				e.preventDefault()
				if (!open) { setOpen(true); break }
				setFocusedIndex(i => {
					const prev = [...enabledOptions].reverse().find((_, idx) =>
						options.indexOf([...enabledOptions].reverse()[idx]) < i
					)
					return prev ? options.indexOf(prev) : options.indexOf(enabledOptions[enabledOptions.length - 1])
				})
				break
		}
	}

	return (
		<div className={clsx("flex flex-col gap-1.5", className)} ref={containerRef}>
			{/* Label row */}
			{(label || hint) && (
				<div className="flex items-center justify-between gap-2">
					{label && (
						<label
							htmlFor={inputId}
							className={clsx("text-label-sm font-semibold", disabled ? "text-action-disabled-text" : "text-text-primary")}
						>
							{label}
						</label>
					)}
					{hint && <span className="text-caption text-text-muted">{hint}</span>}
				</div>
			)}

			{/* Trigger */}
			<div className="relative">
				<button
					type="button"
					id={inputId}
					role="combobox"
					aria-expanded={open}
					aria-controls={listboxId}
					aria-haspopup="listbox"
					disabled={disabled}
					onClick={() => !disabled && setOpen(v => !v)}
					onKeyDown={handleKeyDown}
					className={clsx(
						"group w-full flex items-center rounded-input border transition-colors duration-(--duration-120)",
						triggerSizeClasses[size],
						disabled
							? "border-border-default bg-action-disabled cursor-not-allowed"
							: error
								? "border-border-brand bg-surface-brand-soft hover:border-border-focus focus-visible:border-border-focus focus-visible:outline-none"
								: open
									? "border-border-focused bg-surface-canvas"
									: "border-border-default bg-surface-canvas hover:border-border-strong focus-visible:border-border-focused focus-visible:outline-none",
					)}
				>
					{/* Left icon */}
					{leftIcon && (
						<span
							className={clsx(
								"flex items-center justify-center shrink-0 transition-colors duration-(--duration-120)",
								iconSizeClasses[size],
								disabled ? "text-icon-muted" : error ? "text-icon-brand" : "text-icon-secondary",
							)}
						>
							{leftIcon}
						</span>
					)}

					{/* Selected label / placeholder */}
					<span className={clsx("flex-1 text-left truncate", selectedOption ? "text-text-primary" : "text-text-muted")}>
						{selectedOption ? selectedOption.label : placeholder}
					</span>

					{/* Chevron */}
					<ChevronDown
						className={clsx(
							"shrink-0 transition-transform duration-(--duration-120)",
							chevronSizeClasses[size],
							disabled ? "text-icon-muted" : "text-icon-secondary",
							open && "rotate-180",
						)}
					/>
				</button>

				{/* Dropdown list */}
				{open && (
					<ul
						ref={listRef}
						id={listboxId}
						role="listbox"
						aria-label={label}
						className={clsx(
							"absolute z-50 left-0 right-0 mt-1",
							"bg-surface-card border border-border-default rounded-action shadow-modal",
							"max-h-60 overflow-y-auto py-1",
						)}
					>
						{options.map((option, index) => {
							const isSelected = option.value === selectedValue
							const isFocused = index === focusedIndex

							return (
								<li
									key={option.value}
									role="option"
									aria-selected={isSelected}
									aria-disabled={option.disabled}
									onClick={() => select(option)}
									onMouseEnter={() => !option.disabled && setFocusedIndex(index)}
									className={clsx(
										"flex items-center cursor-pointer select-none transition-colors duration-(--duration-120)",
										itemSizeClasses[size],
										option.disabled
											? "opacity-40 cursor-not-allowed"
											: isFocused || isSelected
												? "bg-surface-hover"
												: "hover:bg-surface-hover",
									)}
								>
									{/* Left element (flag, icon, etc.) */}
									{option.leftElement && (
										<span className={clsx("shrink-0 flex items-center", leftElSizeClasses[size])}>
											{option.leftElement}
										</span>
									)}

									{/* Label + description */}
									<span className="flex-1 min-w-0">
										<span className={clsx("block truncate", isSelected ? "text-text-brand font-medium" : "text-text-primary")}>
											{option.label}
										</span>
										{option.description && (
											<span className="block text-caption text-text-muted truncate">{option.description}</span>
										)}
									</span>

									{/* Selected checkmark */}
									{isSelected && (
										<CheckIcon className={clsx("shrink-0 text-text-brand", leftElSizeClasses[size])} />
									)}
								</li>
							)
						})}
					</ul>
				)}
			</div>

			{/* Helper text */}
			{helperText && (
				<p className={clsx("text-caption", error ? "text-text-danger" : "text-text-tertiary")}>
					{helperText}
				</p>
			)}
		</div>
	)
}
