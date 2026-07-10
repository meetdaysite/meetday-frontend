import clsx from "clsx"
import React, { useEffect, useRef, useState } from "react"

interface CheckboxProps {
	checked?: boolean
	defaultChecked?: boolean
	onChange?: (checked: boolean, e: React.ChangeEvent<HTMLInputElement>) => void
	indeterminate?: boolean
	label?: string
	size?: "sm" | "md" | "lg"
	disabled?: boolean
	id?: string
	className?: string
	icon?: React.ReactNode
}

const sizeConfig = {
	sm: { box: "size-4", radius: "rounded-[var(--radius-4)]", icon: "size-2.5", label: "text-xs", gap: "gap-2" },
	md: { box: "size-5", radius: "rounded-[var(--radius-6)]", icon: "size-3",   label: "text-sm", gap: "gap-2" },
	lg: { box: "size-6", radius: "rounded-[var(--radius-6)]", icon: "size-3.5", label: "text-base", gap: "gap-2.5" },
}

function CheckIcon({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 12 12" fill="none" className={className} aria-hidden>
			<path
				d="M2 6l3 3 5-5"
				stroke="currentColor"
				strokeWidth={1.75}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

function MinusIcon({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 12 12" fill="none" className={className} aria-hidden>
			<path d="M2.5 6h7" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" />
		</svg>
	)
}

export function Checkbox({
	checked,
	defaultChecked,
	onChange,
	indeterminate = false,
	label,
	size = "md",
	disabled,
	id,
	className,
	icon,
}: CheckboxProps) {
	const inputRef = useRef<HTMLInputElement>(null)
	const config = sizeConfig[size]
	const inputId = id ?? (label ? `checkbox-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined)

	// Mirror native input state for icon rendering
	const isControlled = checked !== undefined
	const [localChecked, setLocalChecked] = useState(defaultChecked ?? false)
	const isChecked = isControlled ? checked : localChecked

	useEffect(() => {
		if (inputRef.current) inputRef.current.indeterminate = indeterminate
	}, [indeterminate])

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!isControlled) setLocalChecked(e.target.checked)
		onChange?.(e.target.checked, e)
	}

	const showCheck = isChecked && !indeterminate
	const showMinus = indeterminate
	const showCustomIcon = !isChecked && !indeterminate && !!icon

	return (
		<label
			className={clsx(
				"group inline-flex items-center",
				config.gap,
				disabled ? "cursor-not-allowed" : "cursor-pointer",
				className,
			)}
		>
			<input
				ref={inputRef}
				type="checkbox"
				id={inputId}
				checked={isControlled ? checked : undefined}
				defaultChecked={!isControlled ? defaultChecked : undefined}
				disabled={disabled}
				onChange={handleChange}
				className="peer sr-only"
			/>

			{/* Visual box */}
			<div
				className={clsx(
					"relative flex shrink-0 items-center justify-center border-2",
					"transition-colors duration-(--duration-120)",
					config.box,
					config.radius,
					disabled
						? "bg-action-disabled border-action-disabled-border"
						: indeterminate
							? "bg-icon-muted border-icon-muted"
							: isChecked
								? "bg-action-primary border-action-primary"
								: "bg-surface-canvas border-border-default group-hover:border-border-focus",
					"peer-focus-visible:ring-2 peer-focus-visible:ring-border-focus peer-focus-visible:ring-offset-1",
				)}
			>
				{showCheck && (
					<CheckIcon
						className={clsx(
							config.icon,
							disabled ? "text-action-disabled-text" : "text-text-inverse",
						)}
					/>
				)}

				{showMinus && (
					<MinusIcon
						className={clsx(
							config.icon,
							disabled ? "text-action-disabled-text" : "text-text-inverse",
						)}
					/>
				)}

				{showCustomIcon && (
					<span className={clsx("flex items-center justify-center", config.icon, "text-text-brand")}>
						{icon}
					</span>
				)}
			</div>

			{label && (
				<span
					className={clsx(
						config.label,
						"leading-none select-none",
						disabled ? "text-action-disabled-text" : "text-text-primary",
					)}
				>
					{label}
				</span>
			)}
		</label>
	)
}
