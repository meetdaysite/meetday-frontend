"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "@/lib/toast"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import { useSpaceStore } from "@/store/spaceStore"
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

async function uploadImageAndGetKey(file: File, context: "SPONSORSHIP_MEDIA" | "COMMUNITY_PAST_EVENT_MEDIA" | "COMMUNITY_BRAND_LOGO_MEDIA"): Promise<string> {
	const { url, key } = await getUploadUrl({ context, contentType: file.type })
	await fetch(url, { method: "PUT", headers: { "Content-Type": file.type }, body: file })
	return key
}

type PastEventDraft = { name: string; description: string; images: { key?: string; url: string; file?: File }[] }
const emptyPastEventDraft = (): PastEventDraft => ({ name: "", description: "", images: [] })

type BrandWorkedWithDraft = { brandName: string; url?: string; logoKey?: string; logoUrl?: string; logoFile?: File }
const emptyBrandWorkedWithDraft = (): BrandWorkedWithDraft => ({ brandName: "", url: "" })

const APPROVAL_BANNER: Record<string, { className: string; text: (p: SpaceCommunityProfile) => React.ReactNode }> = {
	APPROVED: {
		className: "bg-green-50 border-green-600 text-green-800",
		text: () => "Live to Communities & Brands.",
	},
	PENDING: {
		className: "bg-amber-50 border-amber-500 text-amber-800",
		text: () => "Profile under review.",
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

// Shared by both /space/dashboard/profile and /spaces/dashboard/profile — the two parallel
// Space Partner portals share the same account/data layer (useSpaceStore, api.ts functions),
// so this is the single canonical "Activate Community Space Profile" form for both.
export function SpaceCommunityProfileForm() {
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
	const [activeLocations, setActiveLocations] = useState<string[]>([])
	const [locationInput, setLocationInput] = useState("")
	const [centreShowcaseImages, setCentreShowcaseImages] = useState<{ key?: string; url: string; file?: File }[]>([])
	const [videoLink, setVideoLink] = useState("")
	const [instagram, setInstagram] = useState("")
	const [linkedin, setLinkedin] = useState("")
	const [youtube, setYoutube] = useState("")
	const [website, setWebsite] = useState("")
	const [pastEvents, setPastEvents] = useState<PastEventDraft[]>([])
	const [brandsWorkedWith, setBrandsWorkedWith] = useState<BrandWorkedWithDraft[]>([])
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
					setActiveLocations(existing.activeLocations)
					setCentreShowcaseImages((existing.centreShowcaseImageKeys ?? []).map((key, i) => ({ key, url: existing.centreShowcaseUrls[i] ?? "" })))
					setVideoLink(existing.videoLink ?? "")
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
				} else {
					setName(spaceProfile?.businessName ?? "")
					setActiveLocations(spaceProfile?.operatingCities ?? [])
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

	function addLocation() {
		const trimmed = locationInput.trim()
		if (!trimmed) return
		setActiveLocations((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]))
		setLocationInput("")
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
		if (!numberOfVenues.trim()) return toast.error("Number of venues / event spaces is required.")
		if (!venueCapacity.trim()) return toast.error("Venue capacity is required.")
		if (!communitySize.trim()) return toast.error("Community size is required.")
		if (!experiencesPerYear.trim()) return toast.error("Experiences/year is required.")
		if (categoryIds.length === 0) return toast.error("At least one category must be selected.")

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
				categoryIds,
				pastEvents: pastEventsPayload,
				brandsWorkedWith: brandsWorkedWithPayload,
			})

			try {
				await updateSpaceProfile({ operatingCities: activeLocations })
			} catch {
				/* non-fatal */
			}

			setCommunity(saved)
			setEditing(false)
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
			<div className="p-6 lg:p-8">
				<p className="text-sm text-text-secondary">Loading…</p>
			</div>
		)
	}

	const banner = community ? APPROVAL_BANNER[community.approvalStatus] : null

	return (
		<div className="p-6 lg:p-8 max-w-3xl mx-auto flex flex-col gap-5">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-black text-black">Community Space Profile</h1>
				{community && !editing && (
					<Button type="button" variant="secondary" size="sm" onClick={() => setEditing(true)}>
						Edit
					</Button>
				)}
			</div>

			{banner && (
				<div className={clsx("rounded-xl px-3.5 py-2.5 text-xs font-semibold border-2", banner.className)}>
					{banner.text(community!)}
				</div>
			)}

			{community && !editing ? (
				<div className="flex flex-col gap-4 rounded-2xl border-2 border-black/10 p-5">
					{community.logoUrl && (
						// eslint-disable-next-line @next/next/no-img-element
						<img src={community.logoUrl} alt={community.name} className="size-20 rounded-full object-cover border border-black/10" />
					)}
					<h2 className="text-lg font-bold text-black">{community.name}</h2>
					<p className="text-sm text-black/70 whitespace-pre-wrap">{community.about}</p>
					<div className="flex flex-wrap gap-1.5">
						{community.categories.map((c) => (
							<span key={c.id} className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-black/70">
								{c.name}
							</span>
						))}
					</div>
				</div>
			) : (
				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-black">Name *</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. WeWork Koramangala"
							className="h-10 px-4 rounded-xl border-2 border-black bg-white text-black outline-none text-sm w-full"
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-black">About *</label>
						<textarea
							value={about}
							onChange={(e) => setAbout(e.target.value)}
							placeholder="Describe the space, its vibe, and what makes it special..."
							rows={3}
							className="p-3 rounded-xl border-2 border-black bg-white text-black outline-none text-sm resize-none w-full"
						/>
					</div>

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
								<Button type="button" variant="secondary" size="xs" onClick={() => logoInputRef.current?.click()}>
									Choose Image
								</Button>
								<span className="text-[10px] text-black/40">1:1 ratio recommended.</span>
							</div>
						</div>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-black">Highlight Poster (4:5, Optional)</label>
						<div className="flex items-center gap-4">
							<div className="w-16 h-20 rounded-xl bg-white border-2 border-dashed border-black/30 flex items-center justify-center overflow-hidden shrink-0 relative">
								{posterPreviewUrl ? (
									<>
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img src={posterPreviewUrl} alt="Poster preview" className="size-full object-cover" />
										<button type="button" onClick={removePoster} className="absolute top-0.5 right-0.5 size-4 rounded-full bg-black/70 text-white text-[10px]">×</button>
									</>
								) : (
									<Icon as={UploadSvg} size="md" color="muted" />
								)}
							</div>
							<div className="flex flex-col gap-1">
								<input ref={posterInputRef} type="file" accept="image/*" className="hidden" onChange={handlePosterChange} />
								<Button type="button" variant="secondary" size="xs" onClick={() => posterInputRef.current?.click()}>
									Choose Image
								</Button>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-black">Number of Venues / Event Spaces *</label>
							<input type="text" value={numberOfVenues} onChange={(e) => setNumberOfVenues(e.target.value)} placeholder="e.g. 3" className="h-10 px-4 rounded-xl border-2 border-black bg-white text-black outline-none text-sm w-full" />
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-black">Venue Capacity *</label>
							<input type="text" value={venueCapacity} onChange={(e) => setVenueCapacity(e.target.value)} placeholder="e.g. 80" className="h-10 px-4 rounded-xl border-2 border-black bg-white text-black outline-none text-sm w-full" />
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-black">Community Size *</label>
							<input type="text" value={communitySize} onChange={(e) => setCommunitySize(e.target.value)} placeholder="e.g. 250" className="h-10 px-4 rounded-xl border-2 border-black bg-white text-black outline-none text-sm w-full" />
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-black">Experiences/Year *</label>
							<input type="text" value={experiencesPerYear} onChange={(e) => setExperiencesPerYear(e.target.value)} placeholder="e.g. 40" className="h-10 px-4 rounded-xl border-2 border-black bg-white text-black outline-none text-sm w-full" />
						</div>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-black">Categories *</label>
						<div className="grid grid-cols-2 gap-2">
							{categories.map((cat) => (
								<label key={cat.id} className="flex items-center gap-2 p-2 rounded-lg border border-black/15 hover:bg-black/5 cursor-pointer">
									<input
										type="checkbox"
										checked={categoryIds.includes(cat.id)}
										onChange={(e) => setCategoryIds(e.target.checked ? [...categoryIds, cat.id] : categoryIds.filter((id) => id !== cat.id))}
										className="w-4 h-4"
									/>
									<span className="text-xs font-medium text-black">{cat.name}</span>
								</label>
							))}
						</div>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-black">Active Locations</label>
						<div className="flex gap-2">
							<input
								type="text"
								value={locationInput}
								onChange={(e) => setLocationInput(e.target.value)}
								onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLocation() } }}
								placeholder="Type a location and press Add"
								className="h-10 px-4 rounded-xl border-2 border-black bg-white text-black outline-none text-sm flex-1"
							/>
							<Button type="button" variant="primary" size="sm" onClick={addLocation} className="h-10">Add</Button>
						</div>
						<div className="flex flex-wrap gap-2">
							{activeLocations.map((loc, idx) => (
								<span key={idx} className="bg-black/10 text-black text-xs px-3 py-1 rounded-full flex items-center gap-2">
									{loc}
									<button type="button" onClick={() => setActiveLocations((prev) => prev.filter((_, i) => i !== idx))} className="text-black/60 hover:text-black">×</button>
								</span>
							))}
						</div>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-black">Video Link (Optional)</label>
						<input type="text" value={videoLink} onChange={(e) => setVideoLink(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="h-10 px-4 rounded-xl border-2 border-black bg-white text-black outline-none text-sm w-full" />
					</div>

					<div className="flex flex-col gap-2">
						<div className="flex justify-between items-center">
							<label className="text-xs font-bold text-black">Centre Showcase (Optional)</label>
						</div>
						<div className="flex gap-2 flex-wrap">
							{centreShowcaseImages.map((img, idx) => (
								<div key={idx} className="relative w-20 h-20 rounded-lg border border-black/15 overflow-hidden">
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img src={img.url} alt={`Centre showcase ${idx + 1}`} className="w-full h-full object-cover" />
									<button type="button" onClick={() => removeCentreShowcaseImage(idx)} className="absolute top-0.5 right-0.5 size-4 rounded-full bg-black/70 text-white text-[10px]">×</button>
								</div>
							))}
							<label className="w-20 h-20 rounded-lg border-2 border-dashed border-black/20 flex items-center justify-center cursor-pointer hover:bg-black/5">
								<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && addCentreShowcaseImage(e.target.files[0])} />
								<span className="text-[10px] text-black/40">+ Add</span>
							</label>
						</div>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-black">Social Links (Optional)</label>
						<input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="Instagram URL" className="h-10 px-4 rounded-xl border-2 border-black bg-white text-black outline-none text-sm w-full" />
						<input type="text" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="LinkedIn URL" className="h-10 px-4 rounded-xl border-2 border-black bg-white text-black outline-none text-sm w-full" />
						<input type="text" value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="YouTube URL" className="h-10 px-4 rounded-xl border-2 border-black bg-white text-black outline-none text-sm w-full" />
						<input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Website URL" className="h-10 px-4 rounded-xl border-2 border-black bg-white text-black outline-none text-sm w-full" />
					</div>

					<div className="flex flex-col gap-2">
						<div className="flex justify-between items-center">
							<label className="text-xs font-bold text-black">Past Events (Optional)</label>
							<button type="button" onClick={addPastEvent} className="text-[10px] font-bold text-[#EE2C2C] underline">+ Add Event</button>
						</div>
						{pastEvents.map((event, i) => (
							<div key={i} className="p-3 rounded-xl border-2 border-black/10 bg-slate-50/50">
								<div className="flex justify-between items-center mb-2">
									<span className="text-[10px] font-bold text-black/40 uppercase">Event {i + 1}</span>
									<button type="button" onClick={() => removePastEvent(i)} className="text-[10px] font-bold text-red-600">Remove</button>
								</div>
								<input type="text" value={event.name} onChange={(e) => updatePastEvent(i, "name", e.target.value)} placeholder="Event name" className="h-8 px-3 rounded-lg bg-white border border-black/15 text-sm w-full mb-2" />
								<textarea value={event.description} onChange={(e) => updatePastEvent(i, "description", e.target.value)} placeholder="Description" rows={2} className="p-2 rounded-lg bg-white border border-black/15 text-sm w-full resize-none mb-2" />
								<div className="flex gap-2 flex-wrap">
									{event.images.map((img, imgIdx) => (
										<div key={imgIdx} className="relative w-20 h-20 rounded-lg border border-black/15 overflow-hidden">
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img src={img.url} alt={`Event ${i + 1} image ${imgIdx + 1}`} className="w-full h-full object-cover" />
											<button type="button" onClick={() => removePastEventImage(i, imgIdx)} className="absolute top-0.5 right-0.5 size-4 rounded-full bg-black/70 text-white text-[10px]">×</button>
										</div>
									))}
									{event.images.length < 2 && (
										<label className="w-20 h-20 rounded-lg border-2 border-dashed border-black/20 flex items-center justify-center cursor-pointer hover:bg-black/5">
											<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && addPastEventImage(i, e.target.files[0])} />
											<span className="text-[10px] text-black/40">+ Add</span>
										</label>
									)}
								</div>
							</div>
						))}
					</div>

					<div className="flex flex-col gap-2">
						<div className="flex justify-between items-center">
							<label className="text-xs font-bold text-black">Associated Brands (Optional)</label>
							<button type="button" onClick={addBrandWorkedWith} className="text-[10px] font-bold text-[#EE2C2C] underline">+ Add Brand</button>
						</div>
						{brandsWorkedWith.map((brand, i) => (
							<div key={i} className="p-3 rounded-xl border-2 border-black/10 bg-slate-50/50">
								<div className="flex justify-between items-center mb-2">
									<span className="text-[10px] font-bold text-black/40 uppercase">Brand {i + 1}</span>
									<button type="button" onClick={() => removeBrandWorkedWith(i)} className="text-[10px] font-bold text-red-600">Remove</button>
								</div>
								<input type="text" value={brand.brandName} onChange={(e) => updateBrandWorkedWithName(i, e.target.value)} placeholder="Brand name" className="h-8 px-3 rounded-lg bg-white border border-black/15 text-sm w-full mb-2" />
								<input type="text" value={brand.url || ""} onChange={(e) => updateBrandWorkedWithUrl(i, e.target.value)} placeholder="Brand URL (optional)" className="h-8 px-3 rounded-lg bg-white border border-black/15 text-sm w-full mb-2" />
								<label className="flex items-center gap-2 p-2 rounded-lg border border-black/15 cursor-pointer hover:bg-black/5">
									<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && updateBrandWorkedWithLogo(i, e.target.files[0])} />
									{brand.logoUrl ? (
										<>
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img src={brand.logoUrl} alt={`${brand.brandName} logo`} className="w-8 h-8 rounded object-cover" />
											<span className="text-xs text-black">Logo selected</span>
										</>
									) : (
										<span className="text-[10px] text-black/40">+ Upload logo</span>
									)}
								</label>
							</div>
						))}
					</div>

					<div className="flex items-center gap-2 mt-2">
						<Button type="submit" variant="primary" disabled={submitting}>
							{submitting ? "Submitting…" : community ? "Save Changes" : "Activate Your Profile"}
						</Button>
						{community && (
							<Button type="button" variant="secondary" onClick={() => setEditing(false)} disabled={submitting}>
								Cancel
							</Button>
						)}
					</div>
				</form>
			)}
		</div>
	)
}
