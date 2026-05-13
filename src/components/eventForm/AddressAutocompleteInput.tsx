"use client"

import { useEffect, useRef } from "react"
import { setOptions, importLibrary } from "@googlemaps/js-api-loader"
import { Icon } from "@/components/ui/Icon"
import { iconWrapCls } from "@/components/eventForm/shared"
import MapPointRotateSvg from "@/icons/outlined/map-point-rotate.svg"

export interface PlaceFields {
	fullAddress: string
	venueName: string
	city: string
	latitude: number | null
	longitude: number | null
}

interface Props {
	value: string
	currentVenueName: string
	error: boolean
	onChange: (v: string) => void
	onPlaceSelect: (fields: PlaceFields) => void
	onBlur?: () => void
}

setOptions({ apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "" })

export function AddressAutocompleteInput({ value, currentVenueName, error, onChange, onPlaceSelect, onBlur }: Props) {
	const inputRef = useRef<HTMLInputElement>(null)
	const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

	useEffect(() => {
		if (!inputRef.current || autocompleteRef.current) return

		importLibrary("places").then(({ Autocomplete }) => {
			if (!inputRef.current || autocompleteRef.current) return

			autocompleteRef.current = new Autocomplete(inputRef.current, {
				types: ["geocode", "establishment"],
				fields: ["formatted_address", "name", "geometry", "address_components"],
			})

			autocompleteRef.current.addListener("place_changed", () => {
				const place = autocompleteRef.current!.getPlace()
				const cityComp = place.address_components?.find((c) => c.types.includes("locality"))

				onPlaceSelect({
					fullAddress: place.formatted_address ?? inputRef.current?.value ?? "",
					venueName: place.name ?? "",
					city: cityComp?.long_name ?? "",
					latitude: place.geometry?.location?.lat() ?? null,
					longitude: place.geometry?.location?.lng() ?? null,
				})
			})
		})
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return (
		<div className={iconWrapCls(error)}>
			<Icon as={MapPointRotateSvg} size="md" color="secondary" />
			<input
				ref={inputRef}
				type="text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onBlur={onBlur}
				placeholder="123 Main St, Bandra West, Mumbai"
				className="flex-1 bg-transparent text-sm placeholder:text-text-muted text-text-primary outline-none"
				autoComplete="off"
			/>
		</div>
	)
}
