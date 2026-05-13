"use client"

import { useState, type ReactNode } from "react"
import clsx from "clsx"
import { Icon } from "@/components/ui/Icon"
import AddCircleSvg from "@/icons/outlined/add-circle.svg"

export function inpCls(err: boolean) {
	return clsx(
		"h-[var(--size-input-md)] w-full px-4 rounded-input border text-text-primary placeholder:text-text-muted text-sm transition-colors duration-(--duration-120) focus:outline-none",
		err
			? "border-border-brand bg-surface-brand-soft hover:border-border-focus focus:border-border-focus"
			: "border-border-default bg-surface-canvas hover:border-border-strong focus:border-border-focused",
	)
}

export function iconWrapCls(err: boolean) {
	return clsx(
		"flex items-center gap-2 h-[var(--size-input-md)] px-4 rounded-input border transition-colors duration-(--duration-120)",
		err
			? "border-border-brand bg-surface-brand-soft hover:border-border-focus focus-within:border-border-focus"
			: "border-border-default bg-surface-canvas hover:border-border-strong focus-within:border-border-focused",
	)
}

export function taCls(err: boolean) {
	return clsx(
		"w-full px-4 py-3 rounded-input border text-text-primary placeholder:text-text-muted text-sm transition-colors duration-(--duration-120) focus:outline-none resize-none",
		err
			? "border-border-brand bg-surface-brand-soft hover:border-border-focus focus:border-border-focus"
			: "border-border-default bg-surface-canvas hover:border-border-strong focus:border-border-focused",
	)
}

export function FieldLabel({ children, required, hint }: { children: ReactNode; required?: boolean; hint?: string }) {
	return (
		<div className="flex items-center justify-between gap-2">
			<label className="text-label-sm font-semibold text-text-primary">
				{children}
				{required && <span className="text-text-brand ml-0.5">*</span>}
			</label>
			{hint && <span className="text-caption text-text-muted">{hint}</span>}
		</div>
	)
}

export function ErrMsg({ msg }: { msg?: string }) {
	if (!msg) return null
	return <p className="text-caption text-text-danger">{msg}</p>
}

export function MiniSpinner() {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="animate-spin shrink-0">
			<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
			<path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}

export function PillInput({
	values,
	onChange,
	placeholder,
}: {
	values: string[]
	onChange: (v: string[]) => void
	placeholder: string
}) {
	const [input, setInput] = useState("")

	function add() {
		const t = input.trim()
		if (t && !values.includes(t)) onChange([...values, t])
		setInput("")
	}

	return (
		<>
			<div className="flex gap-2">
				<input
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add() } }}
					placeholder={placeholder}
					className="flex-1 h-(--size-input-md) px-4 rounded-input border border-border-default bg-surface-canvas text-text-primary placeholder:text-text-muted text-sm hover:border-border-strong focus:border-border-focused focus:outline-none transition-colors"
				/>
				<button
					type="button"
					onClick={add}
					className="flex items-center gap-1.5 px-4 h-(--size-input-md) bg-surface-inverse text-text-inverse rounded-action text-label-sm font-medium hover:opacity-90 transition-opacity shrink-0"
				>
					<Icon as={AddCircleSvg} size="sm" color="inverse" />
					Add
				</button>
			</div>
			{values.length > 0 && (
				<div className="flex flex-wrap gap-1.5 mt-1">
					{values.map((v) => (
						<span key={v} className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-card-muted rounded-badge text-caption text-text-primary">
							{v}
							<button
								type="button"
								onClick={() => onChange(values.filter((x) => x !== v))}
								className="text-text-tertiary hover:text-text-primary leading-none"
								aria-label={`Remove ${v}`}
							>
								×
							</button>
						</span>
					))}
				</div>
			)}
		</>
	)
}
