import clsx from "clsx"

interface SwitchProps {
	checked: boolean
	onChange: (checked: boolean) => void
	label?: string
	disabled?: boolean
	id?: string
}

export function Switch({ checked, onChange, label, disabled, id }: SwitchProps) {
	const button = (
		<button
			id={id}
			type="button"
			role="switch"
			aria-checked={checked}
			disabled={disabled}
			onClick={() => onChange(!checked)}
			className={clsx(
				"relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-(--duration-120) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focused focus-visible:ring-offset-1",
				disabled ? "cursor-not-allowed bg-action-disabled" : checked ? "bg-action-primary" : "bg-neutral-200",
			)}
		>
			<span
				className={clsx(
					"pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm transition-transform duration-(--duration-120)",
					checked ? "translate-x-5" : "translate-x-0",
				)}
			/>
		</button>
	)

	if (!label) return button

	return (
		<label className={clsx("inline-flex items-center gap-2.5", disabled ? "cursor-not-allowed" : "cursor-pointer")}>
			{button}
			<span className={clsx("text-label-sm font-medium", disabled ? "text-action-disabled-text" : "text-text-primary")}>
				{label}
			</span>
		</label>
	)
}
