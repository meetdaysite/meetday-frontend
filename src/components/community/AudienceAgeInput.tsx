"use client"

import React, { useEffect, useState } from "react"
import clsx from "clsx"

interface AudienceAgeInputProps {
	value: string
	onChange: (val: string) => void
	inline?: boolean
	disabled?: boolean
	labelClass?: string
	inputClass?: string
}

/**
 * Parses raw stored string into { minAge, maxAge, isAndAbove }.
 * Supports formats like "18-25", "18 - 25", "21+", "21 and above", "21 & above", or just "21".
 */
export function parseAudienceAge(val: string): { minAge: string; maxAge: string; isAndAbove: boolean } {
	const trimmed = (val || "").trim()
	if (!trimmed) {
		return { minAge: "", maxAge: "", isAndAbove: false }
	}

	// Match "X and above" or "X & above" or "X+"
	const andAboveMatch = trimmed.match(/^(\d+)\s*(?:\+|and\s+above|&\s*above)$/i)
	if (andAboveMatch) {
		return { minAge: andAboveMatch[1], maxAge: "", isAndAbove: true }
	}

	// Match "X to Y" or "X-Y" or "X - Y"
	const rangeMatch = trimmed.match(/^(\d+)\s*(?:-|to)\s*(\d+)$/i)
	if (rangeMatch) {
		return { minAge: rangeMatch[1], maxAge: rangeMatch[2], isAndAbove: false }
	}

	// Single number fallback
	const singleMatch = trimmed.match(/^(\d+)$/)
	if (singleMatch) {
		return { minAge: singleMatch[1], maxAge: "", isAndAbove: false }
	}

	return { minAge: "", maxAge: "", isAndAbove: false }
}

export function formatAudienceAge(minAge: string, maxAge: string, isAndAbove: boolean): string {
	const min = minAge.trim()
	const max = maxAge.trim()

	if (!min) return ""
	if (isAndAbove) {
		return `${min} and above`
	}
	if (max) {
		return `${min}-${max}`
	}
	return `${min}`
}

export function AudienceAgeInput({
	value,
	onChange,
	inline = false,
	disabled = false,
	labelClass,
	inputClass,
}: AudienceAgeInputProps) {
	const parsed = parseAudienceAge(value)
	const [minAge, setMinAge] = useState(parsed.minAge)
	const [maxAge, setMaxAge] = useState(parsed.maxAge)
	const [isAndAbove, setIsAndAbove] = useState(parsed.isAndAbove)

	// Keep internal state synced if parent changes value externally
	useEffect(() => {
		const next = parseAudienceAge(value)
		setMinAge(next.minAge)
		setMaxAge(next.maxAge)
		setIsAndAbove(next.isAndAbove)
	}, [value])

	function triggerChange(nextMin: string, nextMax: string, nextAndAbove: boolean) {
		const formatted = formatAudienceAge(nextMin, nextMax, nextAndAbove)
		onChange(formatted)
	}

	const baseInputClass =
		inputClass ||
		clsx(
			"h-10 px-3 rounded-xl bg-white text-black outline-none text-sm transition-colors w-full placeholder:text-black/30 font-medium",
			inline ? "border border-black/15 focus:border-black/35" : "border-2 border-black"
		)

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between">
				<label className={labelClass || "text-xs font-bold text-black"}>
					Audience Age
				</label>
				<span className="text-[10px] text-black/40 font-semibold">Range (e.g. 18 to 25) or (e.g. 21 and above)</span>
			</div>

			<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
				{/* Min Age Input */}
				<div className="flex-1 flex items-center gap-1.5">
					<input
						type="number"
						min="0"
						max="120"
						placeholder="Min age (e.g. 18)"
						value={minAge}
						disabled={disabled}
						onChange={(e) => {
							const val = e.target.value
							setMinAge(val)
							triggerChange(val, maxAge, isAndAbove)
						}}
						className={baseInputClass}
					/>
				</div>

				{!isAndAbove && (
					<>
						<span className="text-xs font-bold text-black/40 text-center self-center px-1">to</span>

						{/* Max Age Input */}
						<div className="flex-1 flex items-center gap-1.5">
							<input
								type="number"
								min={minAge || "0"}
								max="120"
								placeholder="Max age (e.g. 25)"
								value={maxAge}
								disabled={disabled}
								onChange={(e) => {
									const val = e.target.value
									setMaxAge(val)
									triggerChange(minAge, val, isAndAbove)
								}}
								className={baseInputClass}
							/>
						</div>
					</>
				)}

				{/* "and above" toggle button */}
				<button
					type="button"
					disabled={disabled}
					onClick={() => {
						const nextAndAbove = !isAndAbove
						setIsAndAbove(nextAndAbove)
						if (nextAndAbove) {
							setMaxAge("")
						}
						triggerChange(minAge, nextAndAbove ? "" : maxAge, nextAndAbove)
					}}
					className={clsx(
						"h-10 px-3.5 rounded-xl text-xs font-bold transition-all border shrink-0 flex items-center justify-center gap-1.5 select-none",
						isAndAbove
							? "bg-[#FFC940] text-black border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
							: inline
								? "bg-slate-50 text-black/70 border-black/15 hover:border-black/35"
								: "bg-white text-black/70 border-2 border-black hover:bg-slate-50"
					)}
				>
					<span className={clsx("w-2 h-2 rounded-full", isAndAbove ? "bg-black" : "bg-black/20")} />
					and above
				</button>
			</div>

			{/* Formatted preview text */}
			{value && (
				<p className="text-[11px] font-bold text-black/60">
					Selected: <span className="text-black font-extrabold">{value}</span>
				</p>
			)}
		</div>
	)
}
