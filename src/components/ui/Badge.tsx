import clsx from "clsx"
import type { ReactNode } from "react"

const variants = {
	default: "bg-surface-card-muted text-text-secondary",
	ai: "bg-surface-vibe-soft text-text-vibe",
	success: "bg-surface-success-soft text-text-success",
	warning: "bg-surface-warning-soft text-text-warning",
} as const

type BadgeVariant = keyof typeof variants

export function Badge({
	children,
	variant = "default",
	className,
}: {
	children: ReactNode
	variant?: BadgeVariant
	className?: string
}) {
	return (
		<span className={clsx(
			"inline-flex items-center gap-1 px-2 py-0.5 rounded-badge text-caption font-medium",
			variants[variant],
			className,
		)}>
			{children}
		</span>
	)
}
