"use client"

import clsx from "clsx"
import { useEffect, useRef, useState } from "react"
import * as flags from "country-flag-icons/react/3x2"
import { COUNTRIES, DEFAULT_COUNTRY, type Country } from "@/lib/countries"
import AltArrowDownSvg from "@/icons/outlined/alt-arrow-down.svg"

// ─── CountrySelect ────────────────────────────────────────────────────────────
// Inline country + dial code picker that lives inside PhoneField's border.
// Shares the same list/item visual language as Dropdown.

interface CountrySelectProps {
	value: Country
	onChange: (country: Country) => void
	disabled?: boolean
}

function Flag({ code, className }: { code: string; className?: string }) {
	const FlagComponent = flags[code as keyof typeof flags]
	if (!FlagComponent) return null
	return <FlagComponent className={className} />
}

function ChevronDown({ className }: { className?: string }) {
	return <AltArrowDownSvg className={className} aria-hidden />
}

export function CountrySelect({ value, onChange, disabled }: CountrySelectProps) {
	const [open, setOpen] = useState(false)
	const [search, setSearch] = useState("")
	const containerRef = useRef<HTMLDivElement>(null)
	const searchRef = useRef<HTMLInputElement>(null)

	const filtered = search.trim()
		? COUNTRIES.filter(
			c =>
				c.name.toLowerCase().includes(search.toLowerCase()) ||
				c.dialCode.includes(search),
		  )
		: COUNTRIES

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

	// Focus search when list opens
	useEffect(() => {
		if (open) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setSearch("")
			setTimeout(() => searchRef.current?.focus(), 0)
		}
	}, [open])

	function select(country: Country) {
		onChange(country)
		setOpen(false)
	}

	return (
		<div className="relative shrink-0" ref={containerRef}>
			{/* Trigger */}
			<button
				type="button"
				disabled={disabled}
				onClick={() => !disabled && setOpen(v => !v)}
				onKeyDown={e => e.key === "Escape" && setOpen(false)}
				aria-haspopup="listbox"
				aria-expanded={open}
				className={clsx(
					"flex items-center gap-1.5 pl-4 pr-2.5 h-full",
					"border-r border-border-default",
					"transition-colors duration-(--duration-120)",
					disabled
						? "cursor-not-allowed text-icon-muted"
						: "cursor-pointer hover:bg-surface-hover text-text-primary",
				)}
			>
				<Flag code={value.code} className="size-4 rounded-sm object-cover" />
				<span className="text-sm text-text-primary tabular-nums">{value.dialCode}</span>
				<ChevronDown
					className={clsx(
						"size-3.5 text-icon-secondary transition-transform duration-(--duration-120)",
						open && "rotate-180",
					)}
				/>
			</button>

			{/* List */}
			{open && (
				<div
					role="listbox"
					className={clsx(
						"absolute z-50 top-full left-0 mt-1",
						"w-64 bg-surface-card border border-border-default rounded-action shadow-modal",
						"flex flex-col",
					)}
				>
					{/* Search */}
					<div className="px-3 py-2 border-b border-border-default">
						<input
							ref={searchRef}
							type="text"
							placeholder="Search country or code…"
							value={search}
							onChange={e => setSearch(e.target.value)}
							onKeyDown={e => e.key === "Escape" && setOpen(false)}
							className={clsx(
								"w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none",
							)}
						/>
					</div>

					{/* Options */}
					<ul className="max-h-56 overflow-y-auto py-1">
						{filtered.length === 0 ? (
							<li className="px-3.5 py-3 text-sm text-text-muted">No results</li>
						) : (
							filtered.map(country => {
								const isSelected = country.code === value.code
								return (
									<li
										key={country.code}
										role="option"
										aria-selected={isSelected}
										onClick={() => select(country)}
										className={clsx(
											"flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer",
											"transition-colors duration-(--duration-120)",
											isSelected ? "bg-surface-hover" : "hover:bg-surface-hover",
										)}
									>
										<Flag code={country.code} className="size-5 rounded-sm shrink-0 object-cover" />
										<span className={clsx("flex-1 text-sm truncate", isSelected ? "text-text-brand font-medium" : "text-text-primary")}>
											{country.name}
										</span>
										<span className="text-sm text-text-muted tabular-nums shrink-0">{country.dialCode}</span>
									</li>
								)
							})
						)}
					</ul>
				</div>
			)}
		</div>
	)
}

// ─── PhoneField ───────────────────────────────────────────────────────────────

interface PhoneFieldProps {
	label?: string
	value: string
	onChange: (value: string) => void
	country?: Country
	onCountryChange?: (country: Country) => void
	disabled?: boolean
	error?: string
}

export function PhoneField({
	label,
	value,
	onChange,
	country = DEFAULT_COUNTRY,
	onCountryChange,
	disabled,
	error,
}: PhoneFieldProps) {
	function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
		const raw = e.target.value.replace(/\D/g, "").slice(0, 15)
		onChange(raw)
	}

	return (
		<div className="flex flex-col gap-1.5">
			{label && (
				<label className={clsx("text-label-md", disabled ? "text-action-disabled-text" : "text-text-primary")}>
					{label}
				</label>
			)}

			<div
				className={clsx(
					"group flex items-center rounded-input border transition-colors duration-(--duration-120)",
					"h-(--size-input-md)",
					disabled
						? "border-border-default bg-action-disabled cursor-not-allowed"
						: error
							? "border-border-brand bg-surface-brand-soft focus-within:border-border-focus"
							: "border-border-default bg-surface-canvas hover:border-border-strong focus-within:border-border-focused",
				)}
			>
				<CountrySelect
					value={country}
					onChange={onCountryChange ?? (() => {})}
					disabled={disabled}
				/>

				<input
					type="tel"
					inputMode="numeric"
					placeholder="98765 43210"
					value={value}
					onChange={handleChange}
					disabled={disabled}
					className={clsx(
						"min-w-0 flex-1 bg-transparent outline-none px-4 text-sm",
						"placeholder:text-text-muted",
						disabled ? "text-action-disabled-text cursor-not-allowed" : "text-text-primary",
					)}
				/>
			</div>

			{error && <p className="text-caption text-text-danger">{error}</p>}
		</div>
	)
}
