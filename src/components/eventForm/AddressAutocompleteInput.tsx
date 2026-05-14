"use client"

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react"
import { setOptions, importLibrary } from "@googlemaps/js-api-loader"
import { Icon } from "@/components/ui/Icon"
import { iconWrapCls, inpCls } from "@/components/eventForm/shared"
import MapPointRotateSvg from "@/icons/outlined/map-point-rotate.svg"

export interface PlaceFields {
	fullAddress: string
	venueName: string
	city: string
	latitude: number | null
	longitude: number | null
}

interface BaseProps {
	id?: string
	value: string
	error: boolean
	onChange: (v: string) => void
	onPlaceSelect: (fields: PlaceFields) => void
	onBlur?: () => void
	placeholder?: string
}

interface AddressProps extends BaseProps {
	currentVenueName?: string
}

type PlaceSuggestion = {
	label: string
	mainText: string
	secondaryText: string
	prediction: google.maps.places.PlacePrediction
}

const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
let googleMapsOptionsSet = false

async function ensurePlacesLibrary() {
	if (!googleMapsApiKey) return false
	if (!googleMapsOptionsSet) {
		setOptions({ key: googleMapsApiKey })
		googleMapsOptionsSet = true
	}
	await importLibrary("places")
	return true
}

function cityFromComponents(components?: google.maps.places.AddressComponent[]) {
	return (
		components?.find((c) => c.types.includes("locality"))?.longText ??
		components?.find((c) => c.types.includes("administrative_area_level_3"))?.longText ??
		components?.find((c) => c.types.includes("administrative_area_level_2"))?.longText ??
		""
	)
}

function PlaceAutocompleteInput({
	id,
	value,
	error,
	onChange,
	onPlaceSelect,
	onBlur,
	placeholder,
	withIcon,
}: BaseProps & { withIcon: boolean }) {
	const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
	const [open, setOpen] = useState(false)
	const [highlightedIndex, setHighlightedIndex] = useState(0)
	const listboxId = useId()
	const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null)
	const requestIdRef = useRef(0)
	const rootRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!googleMapsApiKey || value.trim().length < 3) {
			const resetTimer = window.setTimeout(() => {
				setSuggestions([])
				setOpen(false)
			}, 0)
			return () => window.clearTimeout(resetTimer)
		}

		const requestId = ++requestIdRef.current
		const timer = window.setTimeout(async () => {
			try {
				const loaded = await ensurePlacesLibrary()
				if (!loaded || requestId !== requestIdRef.current) return

				sessionTokenRef.current ??= new google.maps.places.AutocompleteSessionToken()
				const { suggestions: nextSuggestions } =
					await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
						input: value,
						includedRegionCodes: ["in"],
						region: "in",
						sessionToken: sessionTokenRef.current,
					})

				if (requestId !== requestIdRef.current) return

				const placeSuggestions = nextSuggestions
					.map((suggestion) => suggestion.placePrediction)
					.filter((prediction): prediction is google.maps.places.PlacePrediction => prediction !== null)
					.map((prediction) => ({
						label: prediction.text.text,
						mainText: prediction.mainText?.text ?? prediction.text.text,
						secondaryText: prediction.secondaryText?.text ?? "",
						prediction,
					}))

				setSuggestions(placeSuggestions)
				setHighlightedIndex(0)
				setOpen(placeSuggestions.length > 0)
			} catch {
				setSuggestions([])
				setOpen(false)
			}
		}, 250)

		return () => window.clearTimeout(timer)
	}, [value])

	useEffect(() => {
		function handlePointerDown(event: PointerEvent) {
			if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
		}

		document.addEventListener("pointerdown", handlePointerDown)
		return () => document.removeEventListener("pointerdown", handlePointerDown)
	}, [])

	async function selectSuggestion(suggestion: PlaceSuggestion) {
		setOpen(false)
		setSuggestions([])

		const place = suggestion.prediction.toPlace()
		await place.fetchFields({
			fields: ["addressComponents", "displayName", "formattedAddress", "location"],
		})

		sessionTokenRef.current = null
		onPlaceSelect({
			fullAddress: place.formattedAddress ?? suggestion.label,
			venueName: place.displayName ?? suggestion.mainText,
			city: cityFromComponents(place.addressComponents),
			latitude: place.location?.lat() ?? null,
			longitude: place.location?.lng() ?? null,
		})
	}

	function handleBlur() {
		window.setTimeout(() => {
			setOpen(false)
			onBlur?.()
		}, 120)
	}

	function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
		if (!open || suggestions.length === 0) return

		if (event.key === "ArrowDown") {
			event.preventDefault()
			setHighlightedIndex((i) => (i + 1) % suggestions.length)
		} else if (event.key === "ArrowUp") {
			event.preventDefault()
			setHighlightedIndex((i) => (i - 1 + suggestions.length) % suggestions.length)
		} else if (event.key === "Enter") {
			event.preventDefault()
			selectSuggestion(suggestions[highlightedIndex])
		} else if (event.key === "Escape") {
			setOpen(false)
		}
	}

	const input = (
		<input
			id={id}
			type="text"
			value={value}
			onChange={(e) => onChange(e.target.value)}
			onFocus={() => setOpen(suggestions.length > 0)}
			onBlur={handleBlur}
			onKeyDown={handleKeyDown}
			placeholder={placeholder}
			className={
				withIcon
					? "flex-1 bg-transparent text-sm placeholder:text-text-muted text-text-primary outline-none"
					: inpCls(error)
			}
			autoComplete="off"
			role="combobox"
			aria-expanded={open}
			aria-autocomplete="list"
			aria-controls={listboxId}
		/>
	)

	return (
		<div ref={rootRef} className="relative">
			{withIcon ? (
				<div className={iconWrapCls(error)}>
					<Icon as={MapPointRotateSvg} size="md" color="secondary" />
					{input}
				</div>
			) : (
				input
			)}

			{open && suggestions.length > 0 && (
				<div id={listboxId} role="listbox" className="absolute z-50 mt-1 w-full overflow-hidden rounded-input border border-border-default bg-surface-card shadow-floating">
					{suggestions.map((suggestion, index) => (
						<button
							key={suggestion.prediction.placeId}
							type="button"
							role="option"
							aria-selected={index === highlightedIndex}
							onMouseDown={(event) => event.preventDefault()}
							onClick={() => selectSuggestion(suggestion)}
							className={`flex w-full flex-col gap-0.5 px-4 py-2.5 text-left transition-colors ${
								index === highlightedIndex ? "bg-surface-card-muted" : "hover:bg-surface-card-muted"
							}`}
						>
							<span className="text-sm font-medium text-text-primary">{suggestion.mainText}</span>
							{suggestion.secondaryText && (
								<span className="text-caption text-text-tertiary">{suggestion.secondaryText}</span>
							)}
						</button>
					))}
				</div>
			)}
		</div>
	)
}

export function VenueAutocompleteInput(props: BaseProps) {
	return (
		<PlaceAutocompleteInput
			{...props}
			withIcon={false}
			placeholder={props.placeholder ?? "e.g. Zilker Park"}
		/>
	)
}

export function AddressAutocompleteInput(props: AddressProps) {
	return (
		<PlaceAutocompleteInput
			{...props}
			withIcon
			placeholder={props.placeholder ?? "123 Main St, Bandra West, Mumbai"}
		/>
	)
}
