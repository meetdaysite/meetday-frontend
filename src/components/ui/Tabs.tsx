"use client"

import clsx from "clsx"

export interface TabItem<T extends string = string> {
	value: T
	label: string
	/** Shown as a badge next to the label when defined. */
	count?: number
}

interface TabsProps<T extends string> {
	items: TabItem<T>[]
	value: T
	onChange: (value: T) => void
	/**
	 * - `pill` — segmented control with a filled active pill (section/browse tabs)
	 * - `pill-outline` — outlined chips, unfilled active border (secondary status filters)
	 * - `underline` — bottom-border indicator (status filter tabs with counts)
	 */
	variant?: "pill" | "pill-outline" | "underline"
	/** Pill variant only — buttons stretch to fill the row. */
	fullWidth?: boolean
	className?: string
}

export function Tabs<T extends string>({
	items,
	value,
	onChange,
	variant = "underline",
	fullWidth = false,
	className,
}: TabsProps<T>) {
	if (variant === "pill") {
		return (
			<div
				className={clsx(
					"flex items-center gap-1.5 p-1 bg-surface-card border border-border-default rounded-action overflow-x-auto no-scrollbar",
					fullWidth ? "w-full" : "w-fit",
					className,
				)}
			>
				{items.map(item => {
					const isActive = value === item.value
					return (
						<button
							key={item.value}
							type="button"
							onClick={() => onChange(item.value)}
							className={clsx(
								"flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-label-sm font-medium transition-colors whitespace-nowrap",
								fullWidth && "flex-1",
								isActive
									? "bg-neutral-900 text-action-primary-text shadow-card"
									: "text-text-primary hover:text-text-primary",
							)}
						>
							{item.label}
							{item.count !== undefined && (
								<span
									className={clsx(
										"text-caption font-medium",
										isActive
											? "text-white"
											: "text-text-primary",
									)}
								>
									({item.count})
								</span>
							)}
						</button>
					)
				})}
			</div>
		)
	}

	if (variant === "pill-outline") {
		return (
			<div className={clsx("flex items-center gap-1.5 overflow-x-auto no-scrollbar", className)}>
				{items.map(item => (
					<button
						key={item.value}
						type="button"
						onClick={() => onChange(item.value)}
						className={clsx(
							"shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium border whitespace-nowrap transition-colors",
							value === item.value
								? "border-text-primary text-text-primary bg-transparent"
								: "border-border-default text-text-secondary hover:text-text-primary hover:border-border-focus",
						)}
					>
						{item.label}
					</button>
				))}
			</div>
		)
	}

	return (
		<div
			className={clsx(
				"flex items-center gap-1 overflow-x-auto scrollbar-none border-b border-border-default",
				className,
			)}
		>
			{items.map(item => {
				const isActive = value === item.value
				return (
					<button
						key={item.value}
						type="button"
						onClick={() => onChange(item.value)}
						className={clsx(
							"shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-label-sm border-b-2 transition-colors whitespace-nowrap -mb-px",
							isActive
								? "border-text-primary text-text-primary font-semibold"
								: "border-transparent text-text-muted hover:text-text-secondary",
						)}
					>
						{item.label}
						{/* {item.count !== undefined && (
							<span
								className={clsx(
									"text-caption font-medium px-1.5 py-0.5 rounded-full min-w-5 text-center",
									isActive
										? "bg-surface-page text-text-inverse"
										: "bg-surface-card-muted text-text-muted",
								)}
							>
								{item.count}
							</span>
						)} */}
					</button>
				)
			})}
		</div>
	)
}
