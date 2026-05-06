import clsx from "clsx"
import React from "react"

interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
	label?: string
	hint?: string
	helperText?: string
	error?: boolean
	leftIcon?: React.ReactNode
	rightIcon?: React.ReactNode
	size?: "sm" | "md" | "lg"
}

const sizeClasses: Record<NonNullable<TextFieldProps["size"]>, string> = {
	sm: "h-[var(--size-action-sm)] px-3 gap-2 text-xs",
	md: "h-[var(--size-input-md)] px-4 gap-2 text-sm",
	lg: "h-[var(--size-input-lg)] px-4 gap-3 text-base",
}

const iconSizeClasses: Record<NonNullable<TextFieldProps["size"]>, string> = {
	sm: "size-4",
	md: "size-5",
	lg: "size-6",
}

export function TextField({
	label,
	hint,
	helperText,
	error = false,
	leftIcon,
	rightIcon,
	size = "md",
	disabled,
	className,
	id,
	...props
}: TextFieldProps) {
	const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-")

	return (
		<div className={clsx("flex flex-col gap-1.5", className)}>
			{(label || hint) && (
				<div className="flex items-center justify-between gap-2">
					{label && (
						<label
							htmlFor={inputId}
							className={clsx(
								"text-label-md",
								disabled ? "text-action-disabled-text" : "text-text-primary",
							)}
						>
							{label}
						</label>
					)}
					{hint && <span className="text-caption text-text-muted">{hint}</span>}
				</div>
			)}

			<div
				className={clsx(
					"flex items-center rounded-input border transition-colors duration-(--duration-120)",
					sizeClasses[size],
					// disabled — checked first via has-[:disabled] so it takes precedence on hover
					"has-disabled:border-border-subtle has-disabled:bg-action-disabled has-disabled:cursor-not-allowed",
					error
						? [
								"border-border-brand bg-surface-brand-soft",
								"hover:border-border-focus",
								"focus-within:border-border-focus",
							]
						: [
								"border-border-default bg-surface-canvas",
								"hover:border-border-strong",
								"focus-within:border-border-focused",
							],
				)}
			>
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

				<input
					id={inputId}
					disabled={disabled}
					className={clsx(
						"min-w-0 flex-1 bg-transparent outline-none",
						"placeholder:text-text-muted",
						disabled ? "text-action-disabled-text cursor-not-allowed" : "text-text-primary",
					)}
					{...props}
				/>

				{rightIcon && (
					<span
						className={clsx(
							"flex items-center justify-center shrink-0 transition-colors duration-(--duration-120)",
							iconSizeClasses[size],
							disabled ? "text-icon-muted" : error ? "text-icon-brand" : "text-icon-muted",
						)}
					>
						{rightIcon}
					</span>
				)}
			</div>

			{helperText && (
				<p className={clsx("text-caption", error ? "text-text-danger" : "text-text-tertiary")}>
					{helperText}
				</p>
			)}
		</div>
	)
}
