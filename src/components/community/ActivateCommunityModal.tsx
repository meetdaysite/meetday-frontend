"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "@/lib/toast"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import {
	getCategories,
	updateHostProfile,
	getHostCommunityProfile,
	activateHostCommunityProfile,
	getUploadUrl,
	type Category,
	type HostCommunityProfile,
} from "@/lib/api"
import UploadSvg from "@/icons/outlined/upload.svg"
import PenSvg from "@/icons/outlined/pen.svg"
import CloseSvg from "@/icons/outlined/close.svg"
import clsx from "clsx"

// Re-exported so existing imports elsewhere (ActivatedCommunity) keep working.
export type ActivatedCommunity = HostCommunityProfile

async function uploadLogoAndGetKey(file: File): Promise<string> {
	const { url, key } = await getUploadUrl({ context: "SPONSORSHIP_MEDIA", contentType: file.type })
	await fetch(url, { method: "PUT", headers: { "Content-Type": file.type }, body: file })
	return key
}

async function uploadPastEventImageAndGetKey(file: File): Promise<string> {
	const { url, key } = await getUploadUrl({ context: "COMMUNITY_PAST_EVENT_MEDIA", contentType: file.type })
	await fetch(url, { method: "PUT", headers: { "Content-Type": file.type }, body: file })
	return key
}

async function uploadBrandLogoAndGetKey(file: File): Promise<string> {
	const { url, key } = await getUploadUrl({ context: "COMMUNITY_BRAND_LOGO_MEDIA", contentType: file.type })
	await fetch(url, { method: "PUT", headers: { "Content-Type": file.type }, body: file })
	return key
}

// One past-event entry being edited in the form. Images can be a mix of already-uploaded
// keys (editing an existing profile) and newly picked local files (uploaded on submit).
type PastEventDraft = {
	name: string
	description: string
	images: { key?: string; url: string; file?: File }[]
}

const emptyPastEventDraft = (): PastEventDraft => ({ name: "", description: "", images: [] })

// One "brand worked with" entry being edited — logo can be an already-uploaded key
// (editing an existing profile) or a newly picked local file (uploaded on submit).
type BrandWorkedWithDraft = {
	brandName: string
	logoKey?: string
	logoUrl?: string
	logoFile?: File
}

const emptyBrandWorkedWithDraft = (): BrandWorkedWithDraft => ({ brandName: "" })

interface ActivateCommunityModalProps {
	hostId: string
	profileCommunityName?: string
	profileInstagram?: string
	profileLinkedin?: string
	profileYoutube?: string
	profilePortfolio?: string
	profileOperatingCities?: string[]
	onClose: () => void
	onSuccess: (community: ActivatedCommunity) => void
	inline?: boolean
}

export function ActivateCommunityModal({
	hostId,
	profileCommunityName = "",
	profileInstagram = "",
	profileLinkedin = "",
	profileYoutube = "",
	profilePortfolio = "",
	profileOperatingCities = [],
	onClose,
	onSuccess,
	inline = false,
}: ActivateCommunityModalProps) {
	const [categories, setCategories] = useState<Category[]>([])
	const [community, setCommunity] = useState<HostCommunityProfile | null>(null)

	// Form fields
	const [communityName, setCommunityName] = useState(profileCommunityName)
	const [aboutCommunity, setAboutCommunity] = useState("")
	const [logoFile, setLogoFile] = useState<File | null>(null)
	const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
	const [communitySize, setCommunitySize] = useState("")
	const [avgGuestCount, setAvgGuestCount] = useState("")
	const [experiencesPerYear, setExperiencesPerYear] = useState("")
	const [categoryIds, setCategoryIds] = useState<string[]>([])
	const [instagram, setInstagram] = useState("")
	const [linkedin, setLinkedin] = useState("")
	const [youtube, setYoutube] = useState("")
	const [portfolio, setPortfolio] = useState("")
	const [operatingCities, setOperatingCities] = useState<string[]>([])
	const [cityInput, setCityInput] = useState("")
	const [secondaryImageFile, setSecondaryImageFile] = useState<File | null>(null)
	const [secondaryImagePreviewUrl, setSecondaryImagePreviewUrl] = useState<string | null>(null)
	const [secondaryImageRemoved, setSecondaryImageRemoved] = useState(false)
	const secondaryImageInputRef = useRef<HTMLInputElement>(null)
	const [pastEvents, setPastEvents] = useState<PastEventDraft[]>([])
	const [brandsWorkedWith, setBrandsWorkedWith] = useState<BrandWorkedWithDraft[]>([])
	const [submitting, setSubmitting] = useState(false)

	const logoInputRef = useRef<HTMLInputElement>(null)

	function addCity() {
		const trimmed = cityInput.trim()
		if (!trimmed) return
		setOperatingCities((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]))
		setCityInput("")
	}

	// Fetch categories & existing community on mount
	useEffect(() => {
		getCategories().then(setCategories).catch(() => {})
		getHostCommunityProfile()
			.then((existing) => {
				if (existing) {
					setCommunity(existing)
					setCommunityName(existing.name)
					setAboutCommunity(existing.about)
					setCommunitySize(existing.size)
					setAvgGuestCount(existing.avgGuestCount)
					setExperiencesPerYear(existing.experiencesPerYear)
					setCategoryIds(existing.categories.map((c) => c.id))
					setLogoPreviewUrl(existing.logoUrl)
					setSecondaryImagePreviewUrl(existing.secondaryImageUrl || null)
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
							logoKey: b.logoKey ?? undefined,
							logoUrl: b.logoUrl ?? undefined,
						})),
					)
					setInstagram(profileInstagram)
					setLinkedin(profileLinkedin)
					setYoutube(profileYoutube)
					setPortfolio(profilePortfolio)
					setOperatingCities(profileOperatingCities)
				} else {
					setCommunityName(profileCommunityName)
					setInstagram(profileInstagram)
					setLinkedin(profileLinkedin)
					setYoutube(profileYoutube)
					setPortfolio(profilePortfolio)
					setOperatingCities(profileOperatingCities)
				}
			})
			.catch(() => {})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hostId])

	// Handle Logo change
		const handleSecondaryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0]
			const allowedExtensions = [".jpg", ".jpeg", ".png"]
			const allowedTypes = ["image/jpeg", "image/jpg", "image/png"]
			const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
			const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)

			if (!isValidType) {
				toast.error("Only JPG, JPEG or PNG images are accepted for the secondary image.")
				return
			}

			const maxSecondaryImageSize = 5 * 1024 * 1024 // 5MB
			if (file.size > maxSecondaryImageSize) {
				toast.error("Image file size cannot exceed 5MB.")
				return
			}

			setSecondaryImageFile(file)
			setSecondaryImagePreviewUrl(URL.createObjectURL(file))
			setSecondaryImageRemoved(false)
		}
	}

	function removeSecondaryImage() {
		setSecondaryImageFile(null)
		setSecondaryImagePreviewUrl(null)
		setSecondaryImageRemoved(true)
		if (secondaryImageInputRef.current) secondaryImageInputRef.current.value = ""
	}

	const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0]
			const allowedExtensions = [".jpg", ".jpeg", ".png"]
			const allowedTypes = ["image/jpeg", "image/jpg", "image/png"]
			const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
			const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)

			if (!isValidType) {
				toast.error("Only JPG, JPEG or PNG images are accepted for the logo.")
				return
			}

			const maxLogoSize = 3 * 1024 * 1024 // 3MB
			if (file.size > maxLogoSize) {
				toast.error("Logo file size cannot exceed 3MB.")
				return
			}

			setLogoFile(file)
			setLogoPreviewUrl(URL.createObjectURL(file))
		}
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
		setPastEvents((prev) =>
			prev.map((e, i) => (i === eventIndex ? { ...e, images: e.images.filter((_, j) => j !== imageIndex) } : e)),
		)
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

	function updateBrandWorkedWithLogo(index: number, file: File) {
		if (!file.type.startsWith("image/")) {
			toast.error("Only image files are accepted.")
			return
		}
		setBrandsWorkedWith((prev) =>
			prev.map((b, i) => (i === index ? { ...b, logoFile: file, logoUrl: URL.createObjectURL(file) } : b)),
		)
	}

	const handleActivationSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (submitting) return

		if (!communityName.trim()) {
			toast.error("Community Name is required.")
			return
		}
		if (!aboutCommunity.trim()) {
			toast.error("About the community description is required.")
			return
		}
		if (!logoFile && !community?.logoKey) {
			toast.error("Logo image is required.")
			return
		}
		if (!communitySize.trim()) {
			toast.error("Community Size is required.")
			return
		}
		if (!avgGuestCount.trim()) {
			toast.error("Average Guest Count is required.")
			return
		}
		if (!experiencesPerYear.trim()) {
			toast.error("Number of experiences hosted in a year is required.")
			return
		}
		if (categoryIds.length === 0) {
			toast.error("At least one category must be selected.")
			return
		}
		if (operatingCities.length === 0) {
			toast.error("Add at least one operating city.")
			return
		}

		setSubmitting(true)
		try {
			const logoKey = logoFile ? await uploadLogoAndGetKey(logoFile) : community!.logoKey
			const secondaryImageKey = secondaryImageFile
				? await uploadLogoAndGetKey(secondaryImageFile)
				: secondaryImageRemoved
					? null
					: (community?.secondaryImageKey || undefined)

			const pastEventsPayload = await Promise.all(
				pastEvents.map(async (event) => ({
					name: event.name.trim() || undefined,
					description: event.description.trim() || undefined,
					imageKeys: await Promise.all(
						event.images.map((img) => (img.key ? img.key : uploadPastEventImageAndGetKey(img.file!))),
					),
				})),
			)

			const brandsWorkedWithPayload = await Promise.all(
				brandsWorkedWith
					.filter((b) => b.brandName.trim() || b.logoFile || b.logoKey)
					.map(async (b) => ({
						brandName: b.brandName.trim() || undefined,
						logoKey: b.logoFile ? await uploadBrandLogoAndGetKey(b.logoFile) : b.logoKey,
					})),
			)

			const saved = await activateHostCommunityProfile({
				name: communityName.trim(),
				about: aboutCommunity.trim(),
				logoKey,
				secondaryImageKey,
				size: communitySize.trim(),
				avgGuestCount: avgGuestCount.trim(),
				experiencesPerYear: experiencesPerYear.trim(),
				categoryIds,
				pastEvents: pastEventsPayload,
				brandsWorkedWith: brandsWorkedWithPayload,
			})

			try {
				await updateHostProfile({
					socialLinks: {
						instagram: instagram.trim() || undefined,
						linkedin: linkedin.trim() || undefined,
						youtube: youtube.trim() || undefined,
						website: portfolio.trim() || undefined,
					},
					operatingCities,
				})
			} catch {}

			onSuccess(saved)
			toast.success(
				community?.approvalStatus === "APPROVED"
					? "Changes submitted — your current profile stays live to brands until an admin approves this edit."
					: community
						? "Community details updated — pending admin approval."
						: "Community submitted for admin approval!",
			)
			onClose()
		} catch {
			toast.error("Failed to activate community.")
		} finally {
			setSubmitting(false)
		}
	}

	const content = (
		<div className={clsx(
			"bg-white flex flex-col h-full",
			inline ? "w-full px-6 py-4 overflow-y-auto" : "rounded-3xl border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg p-6 my-8 max-h-[90vh]"
		)}>
			
			{/* Modal Header */}
			<div className="flex justify-between items-center pb-4 mb-4 border-b border-black/10 shrink-0">
				<h2 className="text-xl font-heading font-black text-black">
					{community ? "Edit Community Details" : "Activate Community"}
				</h2>
				<button
					type="button"
					onClick={onClose}
					className="text-black/60 hover:text-black size-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors font-bold text-sm"
				>
					✕
				</button>
			</div>

			{/* Modal Body (Scrollable) */}
			<form onSubmit={handleActivationSubmit} className="flex-1 pr-1 flex flex-col gap-4">

				{community && (
					<div className={clsx(
						"rounded-xl px-3.5 py-2.5 text-xs font-semibold border-2",
						community.approvalStatus === "APPROVED" && "bg-green-50 border-green-600 text-green-800",
						community.approvalStatus === "PENDING" && "bg-amber-50 border-amber-500 text-amber-800",
						community.approvalStatus === "REJECTED" && "bg-red-50 border-red-500 text-red-700",
						community.approvalStatus === "SUSPENDED" && "bg-black/5 border-black/30 text-black/60",
					)}>
						{community.approvalStatus === "APPROVED" && "Live to Brands. Editing will send it back for admin re-approval."}
						{community.approvalStatus === "PENDING" && "Awaiting admin approval — you won't be shown to brands until it's approved."}
						{community.approvalStatus === "REJECTED" && (
							<>Rejected by admin{community.adminRejectionRemark ? `: ${community.adminRejectionRemark}` : "."} Update and resubmit for review.</>
						)}
						{community.approvalStatus === "SUSPENDED" && "Suspended by admin. Contact support for details."}
					</div>
				)}
				
				{/* Community Name */}
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-bold text-black">Community Name *</label>
					<input
						type="text"
						required
						value={communityName}
						onChange={(e) => setCommunityName(e.target.value)}
						placeholder="e.g. Bangalore Boardgamers Guild"
						className={clsx(
							"h-10 px-4 rounded-xl bg-white text-black outline-none text-sm transition-colors w-full",
							inline ? "border border-black/15 focus:border-black/35" : "border-2 border-black"
						)}
					/>
				</div>

				{/* About Community */}
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-bold text-black">About the community *</label>
					<textarea
						required
						value={aboutCommunity}
						onChange={(e) => setAboutCommunity(e.target.value)}
						placeholder="Describe your community's purpose, focus, and vibes..."
						rows={3}
						className={clsx(
							"p-3 rounded-xl bg-white text-black outline-none text-sm transition-colors resize-none w-full",
							inline ? "border border-black/15 focus:border-black/35" : "border-2 border-black"
						)}
					/>
				</div>

				{/* Logo Upload */}
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-bold text-black">Logo *</label>
					<div className="flex items-center gap-4">
						<div className={clsx(
							"size-16 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0",
							inline ? "border border-dashed border-black/20" : "border-2 border-dashed border-black/30"
						)}>
							{logoPreviewUrl ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img src={logoPreviewUrl} alt="Logo preview" className="size-full object-cover" />
							) : (
								<Icon as={UploadSvg} size="md" color="muted" />
							)}
						</div>
						<div className="flex flex-col gap-1">
							<input
								ref={logoInputRef}
								type="file"
								accept=".jpeg,.jpg,.png,image/jpeg,image/png"
								className="hidden"
								onChange={handleLogoChange}
							/>
							<Button
								type="button"
								variant="secondary"
								size="xs"
								radius="md"
								onClick={() => logoInputRef.current?.click()}
								className="bg-white border-2 border-black text-black text-[10px] py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
							>
								Choose Image
							</Button>
							<span className="text-[10px] text-black/40 mt-1">
								JPEG, JPG, PNG accepted (1:1 ratio, max 3MB).
							</span>
							{logoFile && (
								<span className="text-[10px] text-black/60 truncate max-w-xs font-semibold">
									{logoFile.name}
								</span>
							)}
						</div>
					</div>
				</div>

				{/* Secondary Image Upload */}
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-bold text-black">Secondary Image (4:5, Optional)</label>
					<div className="flex items-center gap-4">
						<div className={clsx(
						"w-16 h-20 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0 relative",
						inline ? "border border-dashed border-black/20" : "border-2 border-dashed border-black/30"
					)}>
						{secondaryImagePreviewUrl ? (
							<>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src={secondaryImagePreviewUrl} alt="Secondary preview" className="size-full object-cover" />
								<button
									type="button"
									onClick={removeSecondaryImage}
									aria-label="Remove secondary image"
									className="absolute top-0.5 right-0.5 size-4 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center leading-none"
								>
									×
								</button>
							</>
							) : (
								<Icon as={UploadSvg} size="md" color="muted" />
							)}
						</div>
						<div className="flex flex-col gap-1">
							<input
								ref={secondaryImageInputRef}
								type="file"
								accept=".jpeg,.jpg,.png,image/jpeg,image/png"
								className="hidden"
								onChange={handleSecondaryImageChange}
							/>
							<Button
								type="button"
								variant="secondary"
								size="xs"
								radius="md"
								onClick={() => secondaryImageInputRef.current?.click()}
								className="bg-white border-2 border-black text-black text-[10px] py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
							>
								Choose Image
							</Button>
							<span className="text-[10px] text-black/40 mt-1">
								JPEG, JPG, PNG accepted (4:5 ratio, max 5MB).
							</span>
							{secondaryImageFile && (
								<span className="text-[10px] text-black/60 truncate max-w-xs font-semibold">
									{secondaryImageFile.name}
								</span>
							)}
						</div>
					</div>
				</div>

				{/* Past Experiences */}
				<div className="flex flex-col gap-3">
					<div className="flex items-center justify-between">
						<label className="text-xs font-bold text-black">Past Experiences</label>
						<span className="text-[10px] text-black/40">Showcase up to 2 images per experience (4:5 ratio)</span>
					</div>
					{pastEvents.map((event, i) => (
						<div key={i} className="flex flex-col gap-2 p-3 rounded-xl border-2 border-black/10 bg-slate-50/50">
							<div className="flex items-center justify-between">
								<span className="text-[10px] font-bold text-black/40 uppercase">Experience {i + 1}</span>
								<button
									type="button"
									onClick={() => removePastEvent(i)}
									className="text-black/40 hover:text-red-600 text-xs font-bold transition-colors"
								>
									Remove
								</button>
							</div>
							<input
								type="text"
								value={event.name}
								onChange={(e) => updatePastEvent(i, "name", e.target.value)}
								placeholder="Experience name (optional)"
								className={clsx(
									"h-9 px-3 rounded-xl bg-white text-black outline-none text-sm transition-colors w-full",
									inline ? "border border-black/15 focus:border-black/35" : "border-2 border-black"
								)}
							/>
							<textarea
								value={event.description}
								onChange={(e) => updatePastEvent(i, "description", e.target.value)}
								placeholder="Experience description (optional)"
								rows={2}
								className={clsx(
									"p-2.5 rounded-xl bg-white text-black outline-none text-sm transition-colors resize-none w-full",
									inline ? "border border-black/15 focus:border-black/35" : "border-2 border-black"
								)}
							/>
							<div className="flex items-center gap-2">
								{event.images.map((img, j) => (
									<div key={j} className="relative w-16 h-20 rounded-lg border-2 border-black overflow-hidden shrink-0">
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img src={img.url} alt="Past experience" className="size-full object-cover" />
										<button
											type="button"
											onClick={() => removePastEventImage(i, j)}
											className="absolute top-0.5 right-0.5 size-4 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center leading-none"
										>
											×
										</button>
									</div>
								))}
								{event.images.length < 2 && (
									<label className="w-16 h-20 rounded-lg border-2 border-dashed border-black/30 flex items-center justify-center shrink-0 cursor-pointer hover:bg-black/5">
										<input
											type="file"
											accept="image/*"
											className="hidden"
											onChange={(e) => {
												const file = e.target.files?.[0]
												e.target.value = ""
												if (file) addPastEventImage(i, file)
											}}
										/>
										<Icon as={UploadSvg} size="sm" color="muted" />
									</label>
								)}
							</div>
						</div>
					))}
					<Button
						type="button"
						variant="secondary"
						size="sm"
						radius="md"
						onClick={addPastEvent}
						className="bg-[#FFC940] border-2 border-black text-black text-xs font-bold py-2 px-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all self-start"
					>
						+ Add Showcase
					</Button>
				</div>

				{/* Brands Worked With */}
				<div className="flex flex-col gap-3">
					<div className="flex items-center justify-between">
						<label className="text-xs font-bold text-black">Brands You&apos;ve Worked With</label>
						<span className="text-[10px] text-black/40">Add brand name + logo</span>
					</div>
					{brandsWorkedWith.map((brand, i) => (
						<div key={i} className="relative flex items-center gap-3 p-3 pr-10 rounded-xl border-2 border-black/10 bg-slate-50/50">
							<label className={clsx(
								"group relative size-14 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0 cursor-pointer transition-all",
								inline ? "border border-dashed border-black/20 hover:border-black/40" : "border-2 border-dashed border-black/30 hover:border-black"
							)}>
								<input
									type="file"
									accept="image/*"
									className="hidden"
									onChange={(e) => {
										const file = e.target.files?.[0]
										e.target.value = ""
										if (file) updateBrandWorkedWithLogo(i, file)
									}}
								/>
								{brand.logoUrl ? (
									<>
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img src={brand.logoUrl} alt={brand.brandName || "Brand logo"} className="size-full object-cover" />
										<div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
											<div className="size-6 rounded-full bg-white text-black flex items-center justify-center shadow-md">
												<Icon as={PenSvg} size="xs" color="inherit" />
											</div>
										</div>
									</>
								) : (
									<div className="flex flex-col items-center justify-center gap-0.5 text-black/40 group-hover:text-black transition-colors">
										<Icon as={UploadSvg} size="sm" color="inherit" />
									</div>
								)}
							</label>
							<input
								type="text"
								value={brand.brandName}
								onChange={(e) => updateBrandWorkedWithName(i, e.target.value)}
								placeholder="Brand name"
								className={clsx(
									"flex-1 h-10 px-3 rounded-xl bg-white text-black outline-none text-sm transition-colors",
									inline ? "border border-black/15 focus:border-black/35" : "border-2 border-black"
								)}
							/>
							<button
								type="button"
								onClick={() => removeBrandWorkedWith(i)}
								aria-label="Remove brand"
								className="absolute top-2.5 right-2.5 size-6 rounded-full bg-black/5 text-black/40 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer"
							>
								<Icon as={CloseSvg} size="xs" color="inherit" />
							</button>
						</div>
					))}
					<Button
						type="button"
						variant="secondary"
						size="sm"
						radius="md"
						onClick={addBrandWorkedWith}
						className="bg-[#FFC940] border-2 border-black text-black text-xs font-bold py-2 px-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all self-start"
					>
						+ Add
					</Button>
				</div>

				{/* Community Size */}
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-bold text-black">Community Size *</label>
					<input
						type="number"
						required
						min="1"
						value={communitySize}
						onChange={(e) => setCommunitySize(e.target.value)}
						placeholder="e.g. 500"
						className={clsx(
							"h-10 px-4 rounded-xl bg-white text-black outline-none text-sm transition-colors w-full",
							inline ? "border border-black/15 focus:border-black/35" : "border-2 border-black"
						)}
					/>
				</div>

				{/* Average Guest Count */}
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-bold text-black">Average Guest Count (per experience)*</label>
					<input
						type="number"
						required
						min="1"
						value={avgGuestCount}
						onChange={(e) => setAvgGuestCount(e.target.value)}
						placeholder="e.g. 30"
						className={clsx(
							"h-10 px-4 rounded-xl bg-white text-black outline-none text-sm transition-colors w-full",
							inline ? "border border-black/15 focus:border-black/35" : "border-2 border-black"
						)}
					/>
				</div>

				{/* Experiences Hosted in a Year */}
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-bold text-black">Number of curated experiences hosted in a year *</label>
					<input
						type="number"
						required
						min="0"
						value={experiencesPerYear}
						onChange={(e) => setExperiencesPerYear(e.target.value)}
						placeholder="e.g. 24"
						className={clsx(
							"h-10 px-4 rounded-xl bg-white text-black outline-none text-sm transition-colors w-full",
							inline ? "border border-black/15 focus:border-black/35" : "border-2 border-black"
						)}
					/>
				</div>

				{/* Categories */}
				<div className="flex flex-col gap-1.5">
					<div className="flex items-center justify-between">
						<label className="text-xs font-bold text-black">Categories *</label>
						<span className="text-[10px] text-black/40">Pick all that apply</span>
					</div>
					{categories.length === 0 ? (
						<p className="text-xs text-black/45">Loading categories…</p>
					) : (
						<div className="flex flex-wrap gap-2">
							{categories.map(cat => {
								const active = categoryIds.includes(cat.id)
								return (
									<button
										key={cat.id}
										type="button"
										onClick={() => {
											setCategoryIds(prev =>
												prev.includes(cat.id)
													? prev.filter(id => id !== cat.id)
													: [...prev, cat.id]
											)
										}}
										className={clsx(
											"px-3 py-1.5 rounded-full text-xs font-bold transition-all border-2 border-black",
											active
												? "bg-[#FFC940] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
												: "bg-white text-black hover:bg-black/5"
										)}
									>
										{cat.name}
									</button>
								)
							})}
						</div>
					)}
				</div>

				{/* Operating Cities */}
				<div className="flex flex-col gap-1.5">
					<div className="flex items-center justify-between">
						<label className="text-xs font-bold text-black">Operating cities *</label>
						<span className="text-[10px] text-black/40">Add at least one</span>
					</div>
					<div className="flex items-center gap-2">
						<input
							type="text"
							value={cityInput}
							onChange={(e) => setCityInput(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") { e.preventDefault(); addCity() }
							}}
							placeholder="e.g. Mumbai"
							className={clsx(
								"flex-1 h-10 px-4 rounded-xl bg-white text-black outline-none text-sm transition-colors",
								inline ? "border border-black/15 focus:border-black/35" : "border-2 border-black"
							)}
						/>
						<Button
							type="button"
							variant="secondary"
							size="xs"
							radius="md"
							onClick={addCity}
							className="bg-white border-2 border-black text-black text-[10px] py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
						>
							Add
						</Button>
					</div>
					{operatingCities.length > 0 && (
						<div className="flex flex-wrap gap-2 mt-1">
							{operatingCities.map((city) => (
								<span
									key={city}
									className="flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-black bg-white text-xs font-bold text-black"
								>
									{city}
									<button
										type="button"
										onClick={() => setOperatingCities((prev) => prev.filter((c) => c !== city))}
										className="text-black/50 hover:text-black transition-colors leading-none"
									>
										×
									</button>
								</span>
							))}
						</div>
					)}
				</div>

				{/* Social Media Links */}
				<div className="flex flex-col gap-3">
					<label className="text-xs font-bold text-black">Social media links</label>
					<div className="flex flex-col gap-2.5">
						<div className="flex items-center gap-2">
							<span className="text-xs text-black/50 w-20">Instagram</span>
							<input
								type="text"
								value={instagram}
								onChange={(e) => setInstagram(e.target.value)}
								placeholder="instagram.com/handle"
								className={clsx(
									"flex-1 h-9 px-3 rounded-xl bg-white text-black outline-none text-sm transition-colors",
									inline ? "border border-black/15 focus:border-black/35" : "border-2 border-black"
								)}
							/>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-xs text-black/50 w-20">LinkedIn</span>
							<input
								type="text"
								value={linkedin}
								onChange={(e) => setLinkedin(e.target.value)}
								placeholder="linkedin.com/in/profile"
								className={clsx(
									"flex-1 h-9 px-3 rounded-xl bg-white text-black outline-none text-sm transition-colors",
									inline ? "border border-black/15 focus:border-black/35" : "border-2 border-black"
								)}
							/>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-xs text-black/50 w-20">YouTube</span>
							<input
								type="text"
								value={youtube}
								onChange={(e) => setYoutube(e.target.value)}
								placeholder="youtube.com/@channel"
								className={clsx(
									"flex-1 h-9 px-3 rounded-xl bg-white text-black outline-none text-sm transition-colors",
									inline ? "border border-black/15 focus:border-black/35" : "border-2 border-black"
								)}
							/>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-xs text-black/50 w-20">Website</span>
							<input
								type="text"
								value={portfolio}
								onChange={(e) => setPortfolio(e.target.value)}
								placeholder="yourwebsite.com"
								className={clsx(
									"flex-1 h-9 px-3 rounded-xl bg-white text-black outline-none text-sm transition-colors",
									inline ? "border border-black/15 focus:border-black/35" : "border-2 border-black"
								)}
							/>
						</div>
					</div>
				</div>



				{/* Modal Footer */}
				<div className="flex gap-3 justify-end mt-4 pt-4 border-t border-black/10 shrink-0">
					<button
						type="button"
						onClick={onClose}
						className="bg-white border-[3px] border-black text-black rounded-2xl px-4 py-2 font-bold text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={submitting}
						className="bg-[#FFC940] border-[3px] border-black text-black rounded-2xl px-4 py-2 font-bold text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:pointer-events-none"
					>
						{submitting ? "Saving…" : community ? "Update Details" : "Activate"}
					</button>
				</div>
			</form>
		</div>
	)

	if (inline) {
		return content
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
			{content}
		</div>
	)
}
