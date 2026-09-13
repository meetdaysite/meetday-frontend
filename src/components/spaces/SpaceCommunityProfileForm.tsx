"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "@/lib/toast"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import { useSpaceStore } from "@/store/spaceStore"
import { setOptions, importLibrary } from "@googlemaps/js-api-loader"
import {
	getCategories,
	updateSpaceProfile,
	getSpaceCommunityProfile,
	activateSpaceCommunityProfile,
	getUploadUrl,
	type Category,
	type SpaceCommunityProfile,
} from "@/lib/api"
import UploadSvg from "@/icons/outlined/upload.svg"
import clsx from "clsx"

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

type PlaceSuggestion = {
	label: string
	mainText: string
	secondaryText: string
	prediction: google.maps.places.PlacePrediction
}

async function uploadImageAndGetKey(
	file: File,
	context: "SPONSORSHIP_MEDIA" | "COMMUNITY_PAST_EVENT_MEDIA" | "COMMUNITY_BRAND_LOGO_MEDIA",
): Promise<string> {
	const { url, key } = await getUploadUrl({ context, contentType: file.type })
	await fetch(url, { method: "PUT", headers: { "Content-Type": file.type }, body: file })
	return key
}

type PastEventDraft = { name: string; description: string; images: { key?: string; url: string; file?: File }[] }
const emptyPastEventDraft = (): PastEventDraft => ({ name: "", description: "", images: [] })

type BrandWorkedWithDraft = { brandName: string; url?: string; logoKey?: string; logoUrl?: string; logoFile?: File }
const emptyBrandWorkedWithDraft = (): BrandWorkedWithDraft => ({ brandName: "", url: "" })

const formatHref = (url: string) => {
	const trimmed = url.trim()
	if (/^https?:\/\//i.test(trimmed)) {
		return trimmed
	}
	return `https://${trimmed}`
}

const APPROVAL_BANNER: Record<string, { className: string; text: (p: SpaceCommunityProfile) => React.ReactNode }> = {
	APPROVED: {
		className: "bg-green-50 border-green-600 text-green-800",
		text: () => "Live to Communities & Brands. Editing will send it back for admin re-approval.",
	},
	PENDING: {
		className: "bg-amber-50 border-amber-500 text-amber-800",
		text: () => "Profile under review — awaiting admin approval.",
	},
	REJECTED: {
		className: "bg-red-50 border-red-500 text-red-700",
		text: (p) => (
			<>Rejected by admin{p.adminRejectionRemark ? `: ${p.adminRejectionRemark}` : "."} Update and resubmit for review.</>
		),
	},
	SUSPENDED: {
		className: "bg-black/5 border-black/30 text-black/60",
		text: () => "Suspended by admin. Contact support for details.",
	},
}

export interface SpaceCommunityProfileFormProps {
	onClose?: () => void
	onSaved?: (saved: SpaceCommunityProfile) => void
}

export function SpaceCommunityProfileForm({ onClose, onSaved }: SpaceCommunityProfileFormProps = {}) {
	const spaceProfile = useSpaceStore((s) => s.profile)
	const [categories, setCategories] = useState<Category[]>([])
	const [community, setCommunity] = useState<SpaceCommunityProfile | null>(null)
	const [editing, setEditing] = useState(false)
	const [loaded, setLoaded] = useState(false)

	const [name, setName] = useState("")
	const [about, setAbout] = useState("")
	const [logoFile, setLogoFile] = useState<File | null>(null)
	const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
	const [posterFile, setPosterFile] = useState<File | null>(null)
	const [posterPreviewUrl, setPosterPreviewUrl] = useState<string | null>(null)
	const [posterRemoved, setPosterRemoved] = useState(false)
	const [numberOfVenues, setNumberOfVenues] = useState("")
	const [venueCapacity, setVenueCapacity] = useState("")
	const [communitySize, setCommunitySize] = useState("")
	const [experiencesPerYear, setExperiencesPerYear] = useState("")
	const [categoryIds, setCategoryIds] = useState<string[]>([])
	const [isOtherCategorySelected, setIsOtherCategorySelected] = useState(false)
	const [otherCategoryInput, setOtherCategoryInput] = useState("")
	const [activeLocations, setActiveLocations] = useState<string[]>([])
	const [locationInput, setLocationInput] = useState("")
	const [locationSuggestions, setLocationSuggestions] = useState<PlaceSuggestion[]>([])
	const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false)
	const locationSessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null)
	const locationRequestIdRef = useRef(0)
	const locationDropdownRef = useRef<HTMLDivElement>(null)

	const [centreShowcaseImages, setCentreShowcaseImages] = useState<{ key?: string; url: string; file?: File }[]>([])
	const [videoLink, setVideoLink] = useState("")
	const [instagram, setInstagram] = useState("")
	const [linkedin, setLinkedin] = useState("")
	const [youtube, setYoutube] = useState("")
	const [website, setWebsite] = useState("")
	const [pastEvents, setPastEvents] = useState<PastEventDraft[]>([])
	const [brandsWorkedWith, setBrandsWorkedWith] = useState<BrandWorkedWithDraft[]>([])
	const [popupDays, setPopupDays] = useState("")
	const [popupPrice, setPopupPrice] = useState("")
	const [brandingDays, setBrandingDays] = useState("")
	const [brandingPrice, setBrandingPrice] = useState("")
	const [submitting, setSubmitting] = useState(false)

	const logoInputRef = useRef<HTMLInputElement>(null)
	const posterInputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		getCategories("SPACE").then(setCategories).catch(() => {})
		getSpaceCommunityProfile()
			.then((existing) => {
				if (existing) {
					setCommunity(existing)
					setName(existing.name)
					setAbout(existing.about)
					setNumberOfVenues(existing.numberOfVenues)
					setVenueCapacity(existing.venueCapacity)
					setCommunitySize(existing.communitySize)
					setExperiencesPerYear(existing.experiencesPerYear)
					setCategoryIds(existing.categories.map((c) => c.id))
					setLogoPreviewUrl(existing.logoUrl)
					setPosterPreviewUrl(existing.posterUrl || null)
					setActiveLocations(existing.activeLocations || [])
					setCentreShowcaseImages((existing.centreShowcaseImageKeys ?? []).map((key, i) => ({ key, url: existing.centreShowcaseUrls[i] ?? "" })))
					setVideoLink(existing.videoLink ?? "")
					setPopupDays(existing.popupDays ?? "")
					setPopupPrice(existing.popupPrice ?? "")
					setBrandingDays(existing.brandingDays ?? "")
					setBrandingPrice(existing.brandingPrice ?? "")
					setPastEvents(
						(existing.pastEvents ?? []).map((e) => ({
							name: e.name ?? "",
							description: e.description ?? "",
							images: e.imageKeys.map((key, i) => ({ key, url: e.imageUrls[i] ?? "" })),
						})),
					)
					setBrandsWorkedWith(
						(existing.brandsWorkedWith ?? []).map((b) => ({
							brandName: b.brandName ?? "",
							url: b.url ?? "",
							logoKey: b.logoKey ?? undefined,
							logoUrl: b.logoUrl ?? undefined,
						})),
					)
					setInstagram(spaceProfile?.socialLinks?.instagram ?? "")
					setLinkedin(spaceProfile?.socialLinks?.linkedin ?? "")
					setYoutube(spaceProfile?.socialLinks?.youtube ?? "")
					setWebsite(spaceProfile?.socialLinks?.website ?? "")
				} else {
					setName(spaceProfile?.businessName ?? "")
					setActiveLocations([])
					setInstagram(spaceProfile?.socialLinks?.instagram ?? "")
					setLinkedin(spaceProfile?.socialLinks?.linkedin ?? "")
					setYoutube(spaceProfile?.socialLinks?.youtube ?? "")
					setWebsite(spaceProfile?.socialLinks?.website ?? "")
				}
			})
			.catch(() => {})
			.finally(() => setLoaded(true))
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
				setIsLocationDropdownOpen(false)
			}
		}
		document.addEventListener("mousedown", handleClickOutside)
		return () => document.removeEventListener("mousedown", handleClickOutside)
	}, [])

	useEffect(() => {
		if (!googleMapsApiKey || locationInput.trim().length < 2) {
			const resetTimer = window.setTimeout(() => {
				setLocationSuggestions([])
				setIsLocationDropdownOpen(false)
			}, 0)
			return () => window.clearTimeout(resetTimer)
		}

		const reqId = ++locationRequestIdRef.current
		const timer = window.setTimeout(async () => {
			try {
				const loaded = await ensurePlacesLibrary()
				if (!loaded || reqId !== locationRequestIdRef.current) return

				locationSessionTokenRef.current ??= new google.maps.places.AutocompleteSessionToken()
				const { suggestions: nextSuggestions } =
					await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
						input: locationInput,
						includedRegionCodes: ["in"],
						region: "in",
						sessionToken: locationSessionTokenRef.current,
					})

				if (reqId !== locationRequestIdRef.current) return

				const placeSuggestions = nextSuggestions
					.map((suggestion) => suggestion.placePrediction)
					.filter((prediction): prediction is google.maps.places.PlacePrediction => prediction !== null)
					.map((prediction) => ({
						label: prediction.text.text,
						mainText: prediction.mainText?.text ?? prediction.text.text,
						secondaryText: prediction.secondaryText?.text ?? "",
						prediction,
					}))

				setLocationSuggestions(placeSuggestions)
				setIsLocationDropdownOpen(placeSuggestions.length > 0)
			} catch {
				setLocationSuggestions([])
				setIsLocationDropdownOpen(false)
			}
		}, 250)

		return () => window.clearTimeout(timer)
	}, [locationInput])

	async function selectLocationSuggestion(suggestion: PlaceSuggestion) {
		setIsLocationDropdownOpen(false)
		setLocationSuggestions([])

		try {
			const place = suggestion.prediction.toPlace()
			await place.fetchFields({
				fields: ["addressComponents", "displayName", "formattedAddress"],
			})

			locationSessionTokenRef.current = null

			const venueName = place.displayName ?? suggestion.mainText
			const city = cityFromComponents(place.addressComponents) || suggestion.secondaryText?.split(",")?.[0]?.trim() || ""

			let combined = venueName
			if (city && !venueName.toLowerCase().includes(city.toLowerCase())) {
				combined = `${venueName}, ${city}`
			}

			if (combined.trim()) {
				setActiveLocations((prev) => (prev.includes(combined.trim()) ? prev : [...prev, combined.trim()]))
			}
		} catch {
			const fallback = suggestion.secondaryText
				? `${suggestion.mainText}, ${suggestion.secondaryText}`
				: suggestion.mainText
			if (fallback.trim()) {
				setActiveLocations((prev) => (prev.includes(fallback.trim()) ? prev : [...prev, fallback.trim()]))
			}
		}
		setLocationInput("")
	}

	function addLocation() {
		const trimmed = locationInput.trim()
		if (!trimmed) return
		setActiveLocations((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]))
		setLocationInput("")
		setIsLocationDropdownOpen(false)
	}

	function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		if (!file) return
		if (!file.type.startsWith("image/")) {
			toast.error("Only image files are accepted for the logo.")
			return
		}
		setLogoFile(file)
		setLogoPreviewUrl(URL.createObjectURL(file))
	}

	function handlePosterChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		if (!file) return
		if (!file.type.startsWith("image/")) {
			toast.error("Only image files are accepted for the poster.")
			return
		}
		setPosterFile(file)
		setPosterPreviewUrl(URL.createObjectURL(file))
		setPosterRemoved(false)
	}

	function removePoster() {
		setPosterFile(null)
		setPosterPreviewUrl(null)
		setPosterRemoved(true)
		if (posterInputRef.current) posterInputRef.current.value = ""
	}

	function addCentreShowcaseImage(file: File) {
		if (!file.type.startsWith("image/")) {
			toast.error("Only image files are accepted.")
			return
		}
		setCentreShowcaseImages((prev) => [...prev, { file, url: URL.createObjectURL(file) }])
	}

	function removeCentreShowcaseImage(index: number) {
		setCentreShowcaseImages((prev) => prev.filter((_, i) => i !== index))
	}

	function addPastEvent() {
		setPastEvents((prev) => [...prev, emptyPastEventDraft()])
	}
	function removePastEvent(index: number) {
		setPastEvents((prev) => prev.filter((_, i) => i !== index))
	}
	function updatePastEvent(index: number, field: "name" | "description", value: string) {
		setPastEvents((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)))
	}
	function addPastEventImage(index: number, file: File) {
		if (!file.type.startsWith("image/")) {
			toast.error("Only image files are accepted.")
			return
		}
		setPastEvents((prev) =>
			prev.map((e, i) => {
				if (i !== index) return e
				if (e.images.length >= 2) {
					toast.error("Only up to 2 images per event are allowed.")
					return e
				}
				return { ...e, images: [...e.images, { file, url: URL.createObjectURL(file) }] }
			}),
		)
	}
	function removePastEventImage(eventIndex: number, imageIndex: number) {
		setPastEvents((prev) => prev.map((e, i) => (i === eventIndex ? { ...e, images: e.images.filter((_, j) => j !== imageIndex) } : e)))
	}

	function addBrandWorkedWith() {
		setBrandsWorkedWith((prev) => [...prev, emptyBrandWorkedWithDraft()])
	}
	function removeBrandWorkedWith(index: number) {
		setBrandsWorkedWith((prev) => prev.filter((_, i) => i !== index))
	}
	function updateBrandWorkedWithName(index: number, value: string) {
		setBrandsWorkedWith((prev) => prev.map((b, i) => (i === index ? { ...b, brandName: value } : b)))
	}
	function updateBrandWorkedWithUrl(index: number, value: string) {
		setBrandsWorkedWith((prev) => prev.map((b, i) => (i === index ? { ...b, url: value } : b)))
	}
	function updateBrandWorkedWithLogo(index: number, file: File) {
		if (!file.type.startsWith("image/")) {
			toast.error("Only image files are accepted.")
			return
		}
		setBrandsWorkedWith((prev) => prev.map((b, i) => (i === index ? { ...b, logoFile: file, logoUrl: URL.createObjectURL(file) } : b)))
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (submitting) return

		if (!name.trim()) return toast.error("Name is required.")
		if (!about.trim()) return toast.error("About is required.")
		if (!logoFile && !community?.logoKey) return toast.error("Logo image is required.")
		if (!numberOfVenues.trim()) return toast.error("Number of venues is required.")
		if (!venueCapacity.trim()) return toast.error("Venue capacity is required.")
		if (!communitySize.trim()) return toast.error("Community size is required.")
		if (!experiencesPerYear.trim()) return toast.error("Experiences/year is required.")
		if (categoryIds.length === 0 && (!isOtherCategorySelected || !otherCategoryInput.trim())) {
			return toast.error("At least one category must be selected.")
		}

		setSubmitting(true)
		try {
			const logoKey = logoFile ? await uploadImageAndGetKey(logoFile, "SPONSORSHIP_MEDIA") : community!.logoKey
			const posterKey = posterFile
				? await uploadImageAndGetKey(posterFile, "SPONSORSHIP_MEDIA")
				: posterRemoved
					? null
					: (community?.posterKey || undefined)

			const centreShowcaseImageKeys = await Promise.all(
				centreShowcaseImages.map((img) => (img.key ? img.key : uploadImageAndGetKey(img.file!, "COMMUNITY_PAST_EVENT_MEDIA"))),
			)

			const pastEventsPayload = await Promise.all(
				pastEvents.map(async (event) => ({
					name: event.name.trim() || undefined,
					description: event.description.trim() || undefined,
					imageKeys: await Promise.all(event.images.map((img) => (img.key ? img.key : uploadImageAndGetKey(img.file!, "COMMUNITY_PAST_EVENT_MEDIA")))),
				})),
			)

			const brandsWorkedWithPayload = await Promise.all(
				brandsWorkedWith
					.filter((b) => b.brandName.trim() || b.url?.trim() || b.logoFile || b.logoKey)
					.map(async (b) => ({
						brandName: b.brandName.trim() || undefined,
						url: b.url?.trim() || undefined,
						logoKey: b.logoFile ? await uploadImageAndGetKey(b.logoFile, "COMMUNITY_BRAND_LOGO_MEDIA") : b.logoKey,
					})),
			)

			const saved = await activateSpaceCommunityProfile({
				name: name.trim(),
				about: about.trim(),
				logoKey,
				posterKey,
				numberOfVenues: numberOfVenues.trim(),
				venueCapacity: venueCapacity.trim(),
				communitySize: communitySize.trim(),
				experiencesPerYear: experiencesPerYear.trim(),
				activeLocations,
				centreShowcaseImageKeys,
				videoLink: videoLink.trim() || undefined,
				popupDays: popupDays.trim() || undefined,
				popupPrice: popupPrice.trim() || undefined,
				brandingDays: brandingDays.trim() || undefined,
				brandingPrice: brandingPrice.trim() || undefined,
				categoryIds,
				pastEvents: pastEventsPayload,
				brandsWorkedWith: brandsWorkedWithPayload,
			})

			try {
				await updateSpaceProfile({
					operatingCities: activeLocations,
				})
			} catch {
				/* non-fatal */
			}

			setCommunity(saved)
			setEditing(false)
			if (onSaved) onSaved(saved)
			toast.success(
				saved.approvalStatus === "APPROVED"
					? "Changes submitted — your current profile stays live until an admin approves this edit."
					: community
						? "Profile changes under review."
						: "Profile submitted for admin approval!",
			)
		} catch {
			toast.error("Failed to activate profile.")
		} finally {
			setSubmitting(false)
		}
	}

	if (!loaded) {
		return (
			<div className="p-6">
				<p className="text-sm font-semibold text-black/50">Loading…</p>
			</div>
		)
	}

	const banner = community ? APPROVAL_BANNER[community.approvalStatus] : null

	return (
		<div className="bg-white flex flex-col h-full w-full px-6 py-6 overflow-y-auto">
			{/* Panel Header */}
			<div className="flex justify-between items-center pb-4 mb-4 border-b border-black/10 shrink-0">
				<h2 className="text-xl font-heading font-black text-black">
					{community && !editing ? "Community Spaces Profile" : community ? "Edit Spaces Details" : "Activate Spaces Profile"}
				</h2>
				{onClose && (
					<button
						type="button"
						onClick={onClose}
						className="text-black/60 hover:text-black size-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors font-bold text-sm cursor-pointer"
						aria-label="Close panel"
					>
						✕
					</button>
				)}
			</div>

			{/* Read-Only Details View */}
			{community && !editing ? (
				<div className="flex flex-col gap-6">
					{banner && (
						<div className={clsx("rounded-xl px-3.5 py-2.5 text-xs font-semibold border-2", banner.className)}>
							{banner.text(community)}
						</div>
					)}

					{/* Top Card Header */}
					<div className="flex items-center gap-4">
						<div className="size-16 rounded-xl border-2 border-black overflow-hidden bg-slate-50 flex items-center justify-center shrink-0">
							{community.logoUrl ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img src={community.logoUrl} alt={community.name} className="size-full object-cover" />
							) : (
								<div className="size-full bg-[#FFCE29] flex items-center justify-center text-xl font-heading font-black text-black">
									{community.name.substring(0, 2).toUpperCase()}
								</div>
							)}
						</div>
						<div className="flex flex-col gap-1">
							<h3 className="text-lg font-heading font-black text-black leading-none">{community.name}</h3>
							<div className="flex items-center gap-1.5 mt-1.5">
								<span className="inline-block bg-[#F5C343] text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-[11px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
									{community.venueCapacity ? `${community.venueCapacity} Capacity` : "Venue Space"}
								</span>
							</div>
						</div>
					</div>

					{/* About the space */}
					<div className="flex flex-col gap-1.5">
						<span className="text-xs font-bold text-black/50">About the space</span>
						<p className="text-sm font-semibold text-black/75 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-black/5 whitespace-pre-wrap">
							{community.about}
						</p>
					</div>

					{/* Highlight Poster */}
					{community.posterUrl && (
						<div className="flex flex-col gap-1.5">
							<span className="text-xs font-bold text-black/50">Highlight Poster</span>
							<div className="relative w-full aspect-[4/5] rounded-2xl border-2 border-black overflow-hidden bg-slate-50 max-w-sm">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src={community.posterUrl} alt="Space Poster" className="size-full object-cover" />
							</div>
						</div>
					)}

					{/* Numbers Grid */}
					<div className="grid grid-cols-2 gap-4">
						<div className="p-3.5 bg-slate-50 rounded-2xl border border-black/5 flex flex-col gap-1">
							<span className="text-[10px] font-bold text-black/40 uppercase">Number of Venues</span>
							<span className="text-lg font-heading font-black text-black">{community.numberOfVenues}</span>
						</div>
						<div className="p-3.5 bg-slate-50 rounded-2xl border border-black/5 flex flex-col gap-1">
							<span className="text-[10px] font-bold text-black/40 uppercase">Venue Capacity</span>
							<span className="text-lg font-heading font-black text-black">{community.venueCapacity}</span>
						</div>
						<div className="p-3.5 bg-slate-50 rounded-2xl border border-black/5 flex flex-col gap-1">
							<span className="text-[10px] font-bold text-black/40 uppercase">Community Size</span>
							<span className="text-lg font-heading font-black text-black">{community.communitySize}</span>
						</div>
						<div className="p-3.5 bg-slate-50 rounded-2xl border border-black/5 flex flex-col gap-1">
							<span className="text-[10px] font-bold text-black/40 uppercase">Experiences / Yr</span>
							<span className="text-lg font-heading font-black text-black">{community.experiencesPerYear}</span>
						</div>
					</div>

					{/* Categories */}
					{community.categories.length > 0 && (
						<div className="flex flex-col gap-2">
							<span className="text-xs font-bold text-black/50">Categories</span>
							<div className="flex flex-wrap gap-1.5">
								{community.categories.map((cat) => (
									<span key={cat.id} className="px-2.5 py-1 bg-[#FFC940]/10 text-[#6C32D1] border border-[#6C32D1]/20 rounded-lg text-xs font-bold">
										{cat.name}
									</span>
								))}
							</div>
						</div>
					)}

					{/* Sponsorship Offerings */}
					{((community.popupDays && community.popupPrice) || (community.brandingDays && community.brandingPrice)) && (
						<div className="flex flex-col gap-2">
							<span className="text-xs font-bold text-black/50">Sponsorship Offerings</span>
							<div className="flex flex-wrap gap-3">
								{community.popupDays && community.popupPrice && (
									<div className="flex flex-col gap-1 border border-black/10 rounded-xl px-4 py-2 bg-slate-50">
										<span className="text-xs font-bold text-black">Pop-up</span>
										<span className="text-xs text-black/60">
											{community.popupDays} days · ₹{community.popupPrice}
										</span>
									</div>
								)}
								{community.brandingDays && community.brandingPrice && (
									<div className="flex flex-col gap-1 border border-black/10 rounded-xl px-4 py-2 bg-slate-50">
										<span className="text-xs font-bold text-black">Branding</span>
										<span className="text-xs text-black/60">
											{community.brandingDays} days · ₹{community.brandingPrice}
										</span>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Active Locations */}
					{community.activeLocations && community.activeLocations.length > 0 && (
						<div className="flex flex-col gap-2">
							<span className="text-xs font-bold text-black/50">Active Locations</span>
							<div className="flex flex-wrap gap-1.5">
								{community.activeLocations.map((loc) => (
									<span key={loc} className="px-2.5 py-1 bg-slate-50 text-black/70 border border-black/10 rounded-lg text-xs font-bold">
										{loc}
									</span>
								))}
							</div>
						</div>
					)}

					{/* Centre Showcase */}
					{community.centreShowcaseUrls && community.centreShowcaseUrls.length > 0 && (
						<div className="flex flex-col gap-2">
							<span className="text-xs font-bold text-black/50">Centre Showcase</span>
							<div className="flex gap-2 flex-wrap">
								{community.centreShowcaseUrls.map((url, idx) => (
									<div key={idx} className="relative w-20 h-20 rounded-xl border-2 border-black overflow-hidden shrink-0">
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img src={url} alt={`Centre showcase ${idx + 1}`} className="w-full h-full object-cover" />
									</div>
								))}
							</div>
						</div>
					)}

					{/* Past Events */}
					{community.pastEvents && community.pastEvents.length > 0 && (
						<div className="flex flex-col gap-3">
							<span className="text-xs font-bold text-black/50">Past Experiences</span>
							<div className="flex flex-col gap-3">
								{community.pastEvents.map((event, i) => (
									<div key={i} className="p-4 bg-slate-50 rounded-2xl border border-black/5 flex flex-col gap-2">
										<div className="flex justify-between items-center">
											<span className="text-sm font-bold text-black">{event.name || `Experience #${i + 1}`}</span>
											<span className="text-[10px] font-bold text-black/40 uppercase bg-black/5 px-2 py-0.5 rounded-md">
												Experience #{i + 1}
											</span>
										</div>
										{event.description && (
											<p className="text-sm font-semibold text-black/75 leading-relaxed whitespace-pre-wrap">{event.description}</p>
										)}
										{event.imageUrls && event.imageUrls.length > 0 && (
											<div className="flex gap-2 flex-wrap mt-1">
												{event.imageUrls.map((url, j) => (
													<div key={j} className="relative w-16 h-20 rounded-lg border border-black/10 overflow-hidden bg-white shrink-0">
														{/* eslint-disable-next-line @next/next/no-img-element */}
														<img src={url} alt={event.name || "Past experience"} className="w-full h-full object-cover" />
													</div>
												))}
											</div>
										)}
									</div>
								))}
							</div>
						</div>
					)}

					{/* Associated Brands */}
					{community.brandsWorkedWith && community.brandsWorkedWith.length > 0 && (
						<div className="flex flex-col gap-2">
							<span className="text-xs font-bold text-black/50">Associated Brands</span>
							<div className="flex flex-wrap gap-2.5">
								{community.brandsWorkedWith.map((brand, i) => (
									<div key={i} className="size-12 rounded-xl border border-black/10 overflow-hidden bg-white flex items-center justify-center shadow-sm" title={brand.brandName || undefined}>
										{brand.logoUrl ? (
											// eslint-disable-next-line @next/next/no-img-element
											<img src={brand.logoUrl} alt={brand.brandName || "Brand"} className="size-full object-cover" />
										) : (
											<span className="text-xs font-bold text-black/60">{(brand.brandName || "B").charAt(0).toUpperCase()}</span>
										)}
									</div>
								))}
							</div>
						</div>
					)}

					{/* Digital Presence */}
					{(instagram || linkedin || youtube || website) && (
						<div className="flex flex-col gap-2.5 border-t border-black/10 pt-4">
							<span className="text-xs font-bold text-black/50">Digital Presence</span>
							<div className="flex flex-col gap-2">
								{instagram && (
									<div className="flex justify-between items-center text-sm font-semibold">
										<span className="text-black/40">Instagram</span>
										<a href={formatHref(instagram)} target="_blank" rel="noreferrer" className="text-green-600 hover:text-green-700 hover:underline">
											View
										</a>
									</div>
								)}
								{linkedin && (
									<div className="flex justify-between items-center text-sm font-semibold">
										<span className="text-black/40">LinkedIn</span>
										<a href={formatHref(linkedin)} target="_blank" rel="noreferrer" className="text-green-600 hover:text-green-700 hover:underline">
											View
										</a>
									</div>
								)}
								{youtube && (
									<div className="flex justify-between items-center text-sm font-semibold">
										<span className="text-black/40">YouTube</span>
										<a href={formatHref(youtube)} target="_blank" rel="noreferrer" className="text-green-600 hover:text-green-700 hover:underline">
											View
										</a>
									</div>
								)}
								{website && (
									<div className="flex justify-between items-center text-sm font-semibold">
										<span className="text-black/40">Website</span>
										<a href={formatHref(website)} target="_blank" rel="noreferrer" className="text-green-600 hover:text-green-700 hover:underline">
											View
										</a>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Edit Button Footer */}
					<div className="mt-4 pt-4 border-t border-black/10 shrink-0">
						<button
							type="button"
							onClick={() => setEditing(true)}
							className="w-full py-3 bg-[#FFC940] text-black border-[3px] border-black rounded-2xl font-black text-center text-xs tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all flex items-center justify-center gap-2 select-none cursor-pointer"
						>
							EDIT SPACES PROFILE
						</button>
					</div>
				</div>
			) : (
				/* Form Mode: Create / Edit */
				<form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4">
					{banner && (
						<div className={clsx("rounded-xl px-3.5 py-2.5 text-xs font-semibold border-2", banner.className)}>
							{banner.text(community!)}
						</div>
					)}

					{/* Space Name */}
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-black">Space Name *</label>
						<input
							type="text"
							required
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. WeWork Koramangala"
							className="h-10 px-4 rounded-xl border border-black/15 focus:border-black/35 bg-white text-black outline-none text-sm transition-colors w-full placeholder:text-black/30"
						/>
					</div>

					{/* About Space */}
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-black">About the space *</label>
						<textarea
							required
							value={about}
							onChange={(e) => setAbout(e.target.value)}
							placeholder="Describe the space, its vibe, and what makes it special..."
							rows={3}
							className="p-3 rounded-xl border border-black/15 focus:border-black/35 bg-white text-black outline-none text-sm transition-colors resize-none w-full placeholder:text-black/30"
						/>
					</div>

					{/* Logo */}
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-black">Logo *</label>
						<div className="flex items-center gap-4">
							<div className="size-16 rounded-xl bg-white border-2 border-dashed border-black/30 flex items-center justify-center overflow-hidden shrink-0">
								{logoPreviewUrl ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img src={logoPreviewUrl} alt="Logo preview" className="size-full object-cover" />
								) : (
									<Icon as={UploadSvg} size="md" color="muted" />
								)}
							</div>
							<div className="flex flex-col gap-1">
								<input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
								<Button
									type="button"
									variant="secondary"
									size="xs"
									onClick={() => logoInputRef.current?.click()}
									className="bg-white border-2 border-black text-black text-[10px] font-bold py-1 px-3 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all self-start"
								>
									Choose Image
								</Button>
								<span className="text-[10px] text-black/40 font-medium">1:1 ratio recommended</span>
							</div>
						</div>
					</div>

					{/* Poster */}
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-black">Highlight Poster (4:5, Optional)</label>
						<div className="flex items-center gap-4">
							<div className="w-16 h-20 rounded-xl bg-white border-2 border-dashed border-black/30 flex items-center justify-center overflow-hidden shrink-0 relative">
								{posterPreviewUrl ? (
									<>
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img src={posterPreviewUrl} alt="Poster preview" className="size-full object-cover" />
										<button
											type="button"
											onClick={removePoster}
											className="absolute top-0.5 right-0.5 size-4 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center font-bold"
										>
											×
										</button>
									</>
								) : (
									<Icon as={UploadSvg} size="md" color="muted" />
								)}
							</div>
							<div className="flex flex-col gap-1">
								<input ref={posterInputRef} type="file" accept="image/*" className="hidden" onChange={handlePosterChange} />
								<Button
									type="button"
									variant="secondary"
									size="xs"
									onClick={() => posterInputRef.current?.click()}
									className="bg-white border-2 border-black text-black text-[10px] font-bold py-1 px-3 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all self-start"
								>
									Choose Image
								</Button>
							</div>
						</div>
					</div>

					{/* Stats: Number of Venues & Capacity */}
					<div className="grid grid-cols-2 gap-3">
						<div className="flex flex-col gap-1.5">
							<div className="flex items-center justify-between">
								<label className="text-xs font-bold text-black">Number of Venues *</label>
								<span className="text-[10px] text-black/40 font-medium">event spaces eg: 3</span>
							</div>
							<input
								type="text"
								required
								value={numberOfVenues}
								onChange={(e) => setNumberOfVenues(e.target.value)}
								placeholder="event spaces eg: 3"
								className="h-10 px-4 rounded-xl border border-black/15 focus:border-black/35 bg-white text-black outline-none text-sm transition-colors w-full placeholder:text-black/30"
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-black">Venue Capacity *</label>
							<input
								type="text"
								required
								value={venueCapacity}
								onChange={(e) => setVenueCapacity(e.target.value)}
								placeholder="e.g. 80"
								className="h-10 px-4 rounded-xl border border-black/15 focus:border-black/35 bg-white text-black outline-none text-sm transition-colors w-full placeholder:text-black/30"
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<div className="flex items-center justify-between">
								<label className="text-xs font-bold text-black">Community Size *</label>
								<span className="text-[10px] text-black/40 font-medium">Number of active members in the space</span>
							</div>
							<input
								type="text"
								required
								value={communitySize}
								onChange={(e) => setCommunitySize(e.target.value)}
								placeholder="Number of active members in the space"
								className="h-10 px-4 rounded-xl border border-black/15 focus:border-black/35 bg-white text-black outline-none text-sm transition-colors w-full placeholder:text-black/30"
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-black">Experiences / Year *</label>
							<input
								type="text"
								required
								value={experiencesPerYear}
								onChange={(e) => setExperiencesPerYear(e.target.value)}
								placeholder="e.g. 40"
								className="h-10 px-4 rounded-xl border border-black/15 focus:border-black/35 bg-white text-black outline-none text-sm transition-colors w-full placeholder:text-black/30"
							/>
						</div>
					</div>

					{/* Categories */}
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-black">Categories *</label>
						<div className="flex flex-wrap gap-2">
							{categories.map((cat) => {
								const active = categoryIds.includes(cat.id)
								return (
									<button
										key={cat.id}
										type="button"
										onClick={() => {
											setCategoryIds((prev) =>
												prev.includes(cat.id) ? prev.filter((id) => id !== cat.id) : [...prev, cat.id],
											)
										}}
										className={clsx(
											"px-3 py-1.5 rounded-full text-xs font-bold transition-all border-2 border-black cursor-pointer",
											active
												? "bg-[#FFC940] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
												: "bg-white text-black hover:bg-black/5",
										)}
									>
										{cat.name}
									</button>
								)
							})}
							<button
								type="button"
								onClick={() => setIsOtherCategorySelected((prev) => !prev)}
								className={clsx(
									"px-3 py-1.5 rounded-full text-xs font-bold transition-all border-2 border-black cursor-pointer",
									isOtherCategorySelected
										? "bg-[#FFC940] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
										: "bg-white text-black hover:bg-black/5",
								)}
							>
								Other
							</button>
						</div>
						{isOtherCategorySelected && (
							<input
								type="text"
								value={otherCategoryInput}
								onChange={(e) => setOtherCategoryInput(e.target.value)}
								placeholder="Please specify other category..."
								className="h-10 px-4 rounded-xl border border-black/15 focus:border-black/35 bg-white text-black outline-none text-sm transition-colors w-full placeholder:text-black/30 mt-1"
							/>
						)}
					</div>

					{/* Active Locations */}
					<div className="flex flex-col gap-1.5">
						<div className="flex items-center justify-between">
							<label className="text-xs font-bold text-black">Active Locations</label>
							<span className="text-[10px] text-black/40">Add at least one</span>
						</div>
						<div ref={locationDropdownRef} className="relative">
							<div className="flex items-center gap-2">
								<input
									type="text"
									value={locationInput}
									onChange={(e) => setLocationInput(e.target.value)}
									onFocus={() => {
										if (locationSuggestions.length > 0) setIsLocationDropdownOpen(true)
									}}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault()
											addLocation()
										}
									}}
									placeholder="Search venue name (e.g. WeWork Koramangala)"
									className="flex-1 h-10 px-4 rounded-xl bg-white text-black outline-none text-sm transition-colors border border-black/15 focus:border-black/35 placeholder:text-black/30"
								/>
								<Button
									type="button"
									variant="secondary"
									size="xs"
									onClick={addLocation}
									className="bg-white border-2 border-black text-black text-[10px] font-bold py-1 px-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all cursor-pointer shrink-0"
								>
									Add
								</Button>
							</div>

							{isLocationDropdownOpen && locationSuggestions.length > 0 && (
								<div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] max-h-56 overflow-y-auto">
									{locationSuggestions.map((suggestion, index) => (
										<button
											key={suggestion.prediction.placeId || index}
											type="button"
											onClick={() => selectLocationSuggestion(suggestion)}
											className="flex w-full flex-col gap-0.5 px-3.5 py-2 text-left hover:bg-[#FFC940]/20 transition-colors border-b border-black/5 last:border-b-0 cursor-pointer"
										>
											<span className="text-xs font-bold text-black">{suggestion.mainText}</span>
											{suggestion.secondaryText && (
												<span className="text-[10px] text-black/50">{suggestion.secondaryText}</span>
											)}
										</button>
									))}
								</div>
							)}
						</div>
						{activeLocations.length > 0 && (
							<div className="flex flex-wrap gap-2 mt-1">
								{activeLocations.map((loc, idx) => (
									<span
										key={idx}
										className="flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-black bg-white text-xs font-bold text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
									>
										{loc}
										<button
											type="button"
											onClick={() => setActiveLocations((prev) => prev.filter((_, i) => i !== idx))}
											className="text-black/50 hover:text-black transition-colors leading-none font-bold cursor-pointer"
										>
											×
										</button>
									</span>
								))}
							</div>
						)}
					</div>

					{/* Video Link */}
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-black">Video Link (Optional)</label>
						<input
							type="text"
							value={videoLink}
							onChange={(e) => setVideoLink(e.target.value)}
							placeholder="https://youtube.com/watch?v=..."
							className="h-10 px-4 rounded-xl border border-black/15 focus:border-black/35 bg-white text-black outline-none text-sm transition-colors w-full placeholder:text-black/30"
						/>
					</div>

					{/* Sponsorship Offerings */}
					<div className="flex flex-col gap-3">
						<div className="flex items-center justify-between">
							<label className="text-xs font-bold text-black">Sponsorship Offerings (Optional)</label>
							<span className="text-[10px] text-black/40 font-medium">Shown to brands alongside every proposal</span>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="border border-black/10 rounded-xl p-3.5 bg-slate-50 flex flex-col gap-2">
								<span className="text-xs font-black text-black">Pop-up</span>
								<div className="grid grid-cols-2 gap-2">
									<input
										type="number"
										min="1"
										value={popupDays}
										onChange={(e) => setPopupDays(e.target.value)}
										placeholder="Days"
										className="h-10 px-3 rounded-lg border border-black/15 focus:border-black/35 bg-white text-black outline-none text-sm transition-colors"
									/>
									<div className="relative">
										<span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-black/40 select-none">₹</span>
										<input
											type="text"
											value={popupPrice}
											onChange={(e) => setPopupPrice(e.target.value)}
											placeholder="Price"
											className="w-full h-10 pl-7 pr-3 rounded-lg border border-black/15 focus:border-black/35 bg-white text-black outline-none text-sm transition-colors"
										/>
									</div>
								</div>
							</div>
							<div className="border border-black/10 rounded-xl p-3.5 bg-slate-50 flex flex-col gap-2">
								<span className="text-xs font-black text-black">Branding</span>
								<div className="grid grid-cols-2 gap-2">
									<input
										type="number"
										min="1"
										value={brandingDays}
										onChange={(e) => setBrandingDays(e.target.value)}
										placeholder="Days"
										className="h-10 px-3 rounded-lg border border-black/15 focus:border-black/35 bg-white text-black outline-none text-sm transition-colors"
									/>
									<div className="relative">
										<span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-black/40 select-none">₹</span>
										<input
											type="text"
											value={brandingPrice}
											onChange={(e) => setBrandingPrice(e.target.value)}
											placeholder="Price"
											className="w-full h-10 pl-7 pr-3 rounded-lg border border-black/15 focus:border-black/35 bg-white text-black outline-none text-sm transition-colors"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Centre Showcase */}
					<div className="flex flex-col gap-2">
						<div className="flex items-center justify-between">
							<label className="text-xs font-bold text-black">Centre Showcase (Optional)</label>
							<span className="text-[10px] text-black/40 font-medium">Photographs of the centre</span>
						</div>
						<div className="flex gap-2 flex-wrap">
							{centreShowcaseImages.map((img, idx) => (
								<div key={idx} className="relative w-20 h-20 rounded-xl border-2 border-black overflow-hidden shrink-0">
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img src={img.url} alt={`Centre showcase ${idx + 1}`} className="w-full h-full object-cover" />
									<button
										type="button"
										onClick={() => removeCentreShowcaseImage(idx)}
										className="absolute top-0.5 right-0.5 size-4 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center font-bold cursor-pointer"
									>
										×
									</button>
								</div>
							))}
							<label className="w-20 h-20 rounded-xl border-2 border-dashed border-black/30 flex items-center justify-center cursor-pointer hover:bg-black/5 shrink-0 transition-colors">
								<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && addCentreShowcaseImage(e.target.files[0])} />
								<span className="text-[10px] font-bold text-black/50">+ Add</span>
							</label>
						</div>
					</div>

					{/* Past Events */}
					<div className="flex flex-col gap-2">
						<div className="flex justify-between items-center">
							<label className="text-xs font-bold text-black">Past Experiences (Optional)</label>
							<button type="button" onClick={addPastEvent} className="text-xs font-bold text-[#EE2C2C] hover:underline cursor-pointer">
								+ Add Event
							</button>
						</div>
						{pastEvents.map((event, i) => (
							<div key={i} className="p-3.5 rounded-xl border-2 border-black/10 bg-slate-50/50 flex flex-col gap-2">
								<div className="flex justify-between items-center">
									<span className="text-[10px] font-bold text-black/40 uppercase tracking-wider">Experience #{i + 1}</span>
									<button type="button" onClick={() => removePastEvent(i)} className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer">
										Remove
									</button>
								</div>
								<input
									type="text"
									value={event.name}
									onChange={(e) => updatePastEvent(i, "name", e.target.value)}
									placeholder="Event name"
									className="h-9 px-3 rounded-lg bg-white border border-black/15 text-sm w-full outline-none focus:border-black/35"
								/>
								<textarea
									value={event.description}
									onChange={(e) => updatePastEvent(i, "description", e.target.value)}
									placeholder="Description"
									rows={2}
									className="p-2.5 rounded-lg bg-white border border-black/15 text-sm w-full resize-none outline-none focus:border-black/35"
								/>
								<div className="flex gap-2 flex-wrap items-center">
									{event.images.map((img, imgIdx) => (
										<div key={imgIdx} className="relative w-16 h-20 rounded-lg border-2 border-black overflow-hidden shrink-0">
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img src={img.url} alt={`Event ${i + 1} image ${imgIdx + 1}`} className="w-full h-full object-cover" />
											<button
												type="button"
												onClick={() => removePastEventImage(i, imgIdx)}
												className="absolute top-0.5 right-0.5 size-4 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center font-bold"
											>
												×
											</button>
										</div>
									))}
									{event.images.length < 2 && (
										<label className="w-16 h-20 rounded-lg border-2 border-dashed border-black/30 flex items-center justify-center cursor-pointer hover:bg-black/5 shrink-0 transition-colors">
											<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && addPastEventImage(i, e.target.files[0])} />
											<span className="text-[10px] font-bold text-black/40">+ Add</span>
										</label>
									)}
								</div>
							</div>
						))}
					</div>

					{/* Associated Brands */}
					<div className="flex flex-col gap-2">
						<div className="flex justify-between items-center">
							<label className="text-xs font-bold text-black">Associated Brands (Optional)</label>
							<button type="button" onClick={addBrandWorkedWith} className="text-xs font-bold text-[#EE2C2C] hover:underline cursor-pointer">
								+ Add Brand
							</button>
						</div>
						{brandsWorkedWith.map((brand, i) => (
							<div key={i} className="p-3.5 rounded-xl border-2 border-black/10 bg-slate-50/50 flex flex-col gap-2">
								<div className="flex justify-between items-center">
									<span className="text-[10px] font-bold text-black/40 uppercase tracking-wider">Brand #{i + 1}</span>
									<button type="button" onClick={() => removeBrandWorkedWith(i)} className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer">
										Remove
									</button>
								</div>
								<input
									type="text"
									value={brand.brandName}
									onChange={(e) => updateBrandWorkedWithName(i, e.target.value)}
									placeholder="Brand name"
									className="h-9 px-3 rounded-lg bg-white border border-black/15 text-sm w-full outline-none focus:border-black/35"
								/>
								<input
									type="text"
									value={brand.url || ""}
									onChange={(e) => updateBrandWorkedWithUrl(i, e.target.value)}
									placeholder="Brand URL (optional)"
									className="h-9 px-3 rounded-lg bg-white border border-black/15 text-sm w-full outline-none focus:border-black/35"
								/>
								<label className="flex items-center gap-2 p-2 rounded-lg border border-black/15 cursor-pointer hover:bg-black/5 bg-white w-fit transition-colors">
									<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && updateBrandWorkedWithLogo(i, e.target.files[0])} />
									{brand.logoUrl ? (
										<>
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img src={brand.logoUrl} alt={`${brand.brandName} logo`} className="size-6 rounded object-cover" />
											<span className="text-xs font-bold text-black">Logo selected</span>
										</>
									) : (
										<span className="text-[10px] font-bold text-black/40">+ Upload logo</span>
									)}
								</label>
							</div>
						))}
					</div>

					{/* Social Links */}
					<div className="flex flex-col gap-3">
						<label className="text-xs font-bold text-black">Social Media Links</label>
						<div className="flex flex-col gap-2.5">
							<div className="flex items-center gap-2">
								<span className="text-xs text-black/50 w-20">Instagram</span>
								<input
									type="text"
									value={instagram}
									onChange={(e) => setInstagram(e.target.value)}
									placeholder="instagram.com/handle"
									className="flex-1 h-9 px-3 rounded-xl bg-white text-black outline-none text-sm transition-colors border border-black/15 focus:border-black/35"
								/>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-xs text-black/50 w-20">LinkedIn</span>
								<input
									type="text"
									value={linkedin}
									onChange={(e) => setLinkedin(e.target.value)}
									placeholder="linkedin.com/in/profile"
									className="flex-1 h-9 px-3 rounded-xl bg-white text-black outline-none text-sm transition-colors border border-black/15 focus:border-black/35"
								/>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-xs text-black/50 w-20">YouTube</span>
								<input
									type="text"
									value={youtube}
									onChange={(e) => setYoutube(e.target.value)}
									placeholder="youtube.com/@channel"
									className="flex-1 h-9 px-3 rounded-xl bg-white text-black outline-none text-sm transition-colors border border-black/15 focus:border-black/35"
								/>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-xs text-black/50 w-20">Website</span>
								<input
									type="text"
									value={website}
									onChange={(e) => setWebsite(e.target.value)}
									placeholder="yourwebsite.com"
									className="flex-1 h-9 px-3 rounded-xl bg-white text-black outline-none text-sm transition-colors border border-black/15 focus:border-black/35"
								/>
							</div>
						</div>
					</div>

					{/* Footer Actions */}
					<div className="flex gap-3 justify-end mt-4 pt-4 border-t border-black/10 shrink-0">
						{community && (
							<button
								type="button"
								onClick={() => setEditing(false)}
								className="bg-white border-[3px] border-black text-black rounded-2xl px-4 py-2 font-bold text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
							>
								Cancel
							</button>
						)}
						<button
							type="submit"
							disabled={submitting}
							className="bg-[#FFC940] border-[3px] border-black text-black rounded-2xl px-4 py-2 font-bold text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
						>
							{submitting ? "Saving…" : community ? "Update Details" : "Activate"}
						</button>
					</div>
				</form>
			)}
		</div>
	)
}
