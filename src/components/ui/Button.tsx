import clsx from "clsx"
import React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary"
	size?: "xs" | "sm" | "md" | "lg"
	radius?: "sm" | "md" | "lg" | "pill"
	leftIcon?: React.ReactNode
	rightIcon?: React.ReactNode
}

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
	xs: "h-7 px-3 gap-1 text-[11px]",
	sm: "h-[var(--size-action-sm)] px-3 gap-1.5 text-label-sm",
	md: "h-[var(--size-action-md)] px-4 gap-2 text-label-sm",
	lg: "h-[var(--size-action-lg)] px-5 gap-2 text-label-md font-medium",
}

const iconSizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
	xs: "size-3",
	sm: "size-4",
	md: "size-5",
	lg: "size-6",
}

const radiusClasses: Record<NonNullable<ButtonProps["radius"]>, string> = {
	sm: "rounded-badge",
	md: "rounded-action",
	lg: "rounded-action",
	pill: "rounded-avatar",
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
	primary: clsx(
		"bg-action-primary text-action-primary-text",
		"hover:bg-action-primary-hover",
		"active:bg-action-primary-pressed",
		"focus-visible:bg-action-primary-pressed focus-visible:outline-none",
		"focus-visible:ring-2 focus-visible:ring-text-inverse focus-visible:ring-offset-2 focus-visible:ring-offset-action-primary",
		"disabled:bg-action-disabled disabled:text-action-disabled-text disabled:cursor-not-allowed",
	),
	secondary: clsx(
		"bg-action-secondary text-action-secondary-text border border-action-secondary-border",
		"hover:bg-action-secondary-hover",
		"focus-visible:border-border-focus focus-visible:text-text-brand focus-visible:outline-none",
		"focus-visible:ring-1 focus-visible:ring-border-focus",
		"disabled:bg-action-disabled disabled:text-action-disabled-text disabled:border-border-default disabled:cursor-not-allowed",
	),
}

export function Button({
	variant = "primary",
	size = "md",
	radius = "md",
	leftIcon,
	rightIcon,
	children,
	className,
	disabled,
	...props
}: ButtonProps) {
	return (
		<button
			disabled={disabled}
			className={clsx(
				"inline-flex items-center justify-center select-none",
				"transition-colors duration-(--duration-120)",
				sizeClasses[size],
				radiusClasses[radius],
				variantClasses[variant],
				className,
			)}
			{...props}
		>
			{leftIcon && (
				<span className={clsx("flex items-center shrink-0", iconSizeClasses[size])}>{leftIcon}</span>
			)}
			{children}
			{rightIcon && (
				<span className={clsx("flex items-center shrink-0", iconSizeClasses[size])}>{rightIcon}</span>
			)}
		</button>
	)
}
