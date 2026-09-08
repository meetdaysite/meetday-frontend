"use client"

import { useState, useRef, useEffect, KeyboardEvent } from "react"
import clsx from "clsx"

const POPULAR_INDIAN_CITIES = [
	"Delhi",
	"Gurugram",
	"Noida",
	"Bengaluru",
	"Mumbai",
	"Hyderabad",
	"Pune",
	"Kolkata",
	"Chennai",
	"Jaipur",
	"Goa",
	"Ahmedabad",
	"Chandigarh",
	"Kochi",
	"Indore",
	"Lucknow",
]

interface CityTagPickerProps {
	label?: string
	selectedCities: string[]
	onChange: (cities: string[]) => void
	error?: string
	disabled?: boolean
	placeholder?: string
}

export function CityTagPicker({
	label = "Cities",
	selectedCities,
	onChange,
	error,
	disabled = false,
	placeholder = "Search or type a city and press Enter...",
}: CityTagPickerProps) {
	const [input, setInput] = useState("")
	const [isOpen, setIsOpen] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	const filteredSuggestions = POPULAR_INDIAN_CITIES.filter(
		city =>
			city.toLowerCase().includes(input.trim().toLowerCase()) &&
			!selectedCities.some(sc => sc.toLowerCase() === city.toLowerCase()),
	)

	function addCity(cityName: string) {
		const trimmed = cityName.trim()
		if (!trimmed) return
		// Prevent duplicates (case-insensitive)
		if (selectedCities.some(sc => sc.toLowerCase() === trimmed.toLowerCase())) {
			setInput("")
			return
		}
		// Capitalize first letter of each word
		const formatted = trimmed
			.split(" ")
			.map(w => w.charAt(0).toUpperCase() + w.slice(1))
			.join(" ")

		onChange([...selectedCities, formatted])
		setInput("")
		setIsOpen(false)
		inputRef.current?.focus()
	}

	function removeCity(cityToRemove: string) {
		if (disabled) return
		onChange(selectedCities.filter(c => c !== cityToRemove))
	}

	function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter") {
			e.preventDefault()
			if (filteredSuggestions.length > 0 && input.trim()) {
				// If there's an exact or top match
				addCity(filteredSuggestions[0])
			} else if (input.trim()) {
				addCity(input)
			}
		} else if (e.key === "Backspace" && !input && selectedCities.length > 0) {
			removeCity(selectedCities[selectedCities.length - 1])
		}
	}

	// Close suggestion menu on outside click
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setIsOpen(false)
			}
		}
		document.addEventListener("mousedown", handleClickOutside)
		return () => document.removeEventListener("mousedown", handleClickOutside)
	}, [])

	return (
		<div className="flex flex-col gap-1.5 w-full" ref={containerRef}>
			{label && (
				<label className="text-label-sm font-semibold text-text-primary">
					{label} <span className="text-red-500">*</span>
				</label>
			)}

			<div
				className={clsx(
					"min-h-[46px] p-2 bg-surface-card border rounded-action flex flex-wrap items-center gap-1.5 transition-all cursor-text",
					error
						? "border-red-500 ring-1 ring-red-500"
						: isOpen
						? "border-border-focus ring-2 ring-border-focus"
						: "border-border-default hover:border-text-secondary",
					disabled && "opacity-50 cursor-not-allowed bg-slate-50",
				)}
				onClick={() => {
					if (!disabled) {
						inputRef.current?.focus()
						setIsOpen(true)
					}
				}}
			>
				{/* Selected City Chips */}
				{selectedCities.map(city => (
					<span
						key={city}
						className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EE2C2C] text-white text-xs font-bold rounded-full shadow-sm animate-in fade-in zoom-in-95 duration-100"
					>
						<span className="text-white font-bold">{city}</span>
						{!disabled && (
							<button
								type="button"
								onClick={e => {
									e.stopPropagation()
									removeCity(city)
								}}
								className="size-3.5 rounded-full hover:bg-white/30 flex items-center justify-center text-white transition-colors text-[11px] font-black"
								aria-label={`Remove ${city}`}
							>
								✕
							</button>
						)}
					</span>
				))}

				{/* City Text Input */}
				<input
					ref={inputRef}
					type="text"
					value={input}
					disabled={disabled}
					onChange={e => {
						setInput(e.target.value)
						setIsOpen(true)
					}}
					onFocus={() => setIsOpen(true)}
					onKeyDown={handleKeyDown}
					placeholder={selectedCities.length === 0 ? placeholder : "Add city..."}
					className="flex-1 min-w-[140px] bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-muted p-1"
				/>
			</div>

			{/* Suggestion Dropdown */}
			{isOpen && !disabled && filteredSuggestions.length > 0 && (
				<div className="relative w-full z-50">
					<div className="absolute top-1 left-0 right-0 max-h-48 overflow-y-auto bg-white border border-border-default rounded-xl shadow-lg divide-y divide-black/5 py-1">
						<div className="px-3 py-1 text-[10px] font-bold text-black/40 uppercase tracking-wider">
							Popular Cities
						</div>
						{filteredSuggestions.map(suggestion => (
							<button
								key={suggestion}
								type="button"
								onClick={() => addCity(suggestion)}
								className="w-full text-left px-3 py-2 text-sm text-black hover:bg-slate-100 font-medium transition-colors flex items-center justify-between"
							>
								<span className="font-semibold text-black">{suggestion}</span>
								<span className="text-xs text-[#EE2C2C] font-bold">+ Add</span>
							</button>
						))}
					</div>
				</div>
			)}

			{error && <p className="text-xs font-semibold text-red-500 mt-0.5">{error}</p>}
		</div>
	)
}
