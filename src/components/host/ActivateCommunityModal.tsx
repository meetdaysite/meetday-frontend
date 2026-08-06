"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import { getCategories, updateHostProfile, type Category } from "@/lib/api"
import UploadSvg from "@/icons/outlined/upload.svg"
import clsx from "clsx"

// ─── IndexedDB Setup ─────────────────────────────────────────────────────────
const DB_NAME = "MeetdayProposalDB"
const STORE_NAME = "proposals"
const COMMUNITY_KEY = "activated_community"

export interface ActivatedCommunity {
	name: string
	about: string
	logo: File | Blob | null
	logoName: string
	size: string
	avgGuestCount: string
	experiencesPerYear: string
	categoryIds: string[]
	instagram?: string
	linkedin?: string
	youtube?: string
	portfolio?: string
	activatedAt: string
}

function initDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1)
		request.onerror = () => reject(request.error)
		request.onsuccess = () => resolve(request.result)
		request.onupgradeneeded = () => {
			request.result.createObjectStore(STORE_NAME)
		}
	})
}

function saveCommunity(community: ActivatedCommunity, hostId: string): Promise<ActivatedCommunity> {
	return initDB().then((db) => {
		return new Promise<ActivatedCommunity>((resolve, reject) => {
			const transaction = db.transaction(STORE_NAME, "readwrite")
			const store = transaction.objectStore(STORE_NAME)
			const request = store.put(community, `${COMMUNITY_KEY}_${hostId}`)
			request.onerror = () => reject(request.error)
			request.onsuccess = () => resolve(community)
		})
	})
}

function getCommunity(hostId: string): Promise<ActivatedCommunity | null> {
	return initDB().then((db) => {
		return new Promise<ActivatedCommunity | null>((resolve, reject) => {
			const transaction = db.transaction(STORE_NAME, "readonly")
			const store = transaction.objectStore(STORE_NAME)
			const request = store.get(`${COMMUNITY_KEY}_${hostId}`)
			request.onerror = () => reject(request.error)
			request.onsuccess = () => resolve(request.result || null)
		})
	})
}

interface ActivateCommunityModalProps {
	hostId: string
	profileInstagram?: string
	profileLinkedin?: string
	profileYoutube?: string
	profilePortfolio?: string
	onClose: () => void
	onSuccess: (community: ActivatedCommunity) => void
	inline?: boolean
}

export function ActivateCommunityModal({
	hostId,
	profileInstagram = "",
	profileLinkedin = "",
	profileYoutube = "",
	profilePortfolio = "",
	onClose,
	onSuccess,
	inline = false,
}: ActivateCommunityModalProps) {
	const [categories, setCategories] = useState<Category[]>([])
	const [community, setCommunity] = useState<ActivatedCommunity | null>(null)

	// Form fields
	const [communityName, setCommunityName] = useState("")
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

	const logoInputRef = useRef<HTMLInputElement>(null)

	// Fetch categories & existing community on mount
	useEffect(() => {
		getCategories().then(setCategories).catch(() => {})
		getCommunity(hostId).then((existing) => {
			if (existing) {
				setCommunity(existing)
				setCommunityName(existing.name)
				setAboutCommunity(existing.about)
				setCommunitySize(existing.size)
				setAvgGuestCount(existing.avgGuestCount)
				setExperiencesPerYear(existing.experiencesPerYear)
				setCategoryIds(existing.categoryIds)
				setInstagram(existing.instagram || "")
				setLinkedin(existing.linkedin || "")
				setYoutube(existing.youtube || "")
				setPortfolio(existing.portfolio || "")
				if (existing.logo) {
					setLogoFile(existing.logo as File)
					setLogoPreviewUrl(URL.createObjectURL(existing.logo))
				}
			} else {
				setInstagram(profileInstagram)
				setLinkedin(profileLinkedin)
				setYoutube(profileYoutube)
				setPortfolio(profilePortfolio)
			}
		})
	}, [hostId, profileInstagram, profileLinkedin, profileYoutube, profilePortfolio])

	// Handle Logo change
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

			const maxLogoSize = 5 * 1024 * 1024 // 5MB
			if (file.size > maxLogoSize) {
				toast.error("Logo file size cannot exceed 5MB.")
				return
			}

			setLogoFile(file)
			setLogoPreviewUrl(URL.createObjectURL(file))
		}
	}

	const handleActivationSubmit = (e: React.FormEvent) => {
		e.preventDefault()

		if (!communityName.trim()) {
			toast.error("Community Name is required.")
			return
		}
		if (!aboutCommunity.trim()) {
			toast.error("About the community description is required.")
			return
		}
		if (!logoFile) {
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
		if (!instagram.trim()) {
			toast.error("Instagram profile link is required.")
			return
		}

		const communityData: ActivatedCommunity = {
			name: communityName,
			about: aboutCommunity,
			logo: logoFile,
			logoName: logoFile.name,
			size: communitySize,
			avgGuestCount: avgGuestCount,
			experiencesPerYear: experiencesPerYear,
			categoryIds: categoryIds,
			instagram: instagram.trim() || undefined,
			linkedin: linkedin.trim() || undefined,
			youtube: youtube.trim() || undefined,
			portfolio: portfolio.trim() || undefined,
			activatedAt: community?.activatedAt || new Date().toISOString(),
		}

		saveCommunity(communityData, hostId)
			.then(async (saved) => {
				onSuccess(saved)
				try {
					await updateHostProfile({
						socialLinks: {
							instagram: instagram.trim() || undefined,
							linkedin: linkedin.trim() || undefined,
							youtube: youtube.trim() || undefined,
							portfolio: portfolio.trim() || undefined,
						},
					})
				} catch {}
				toast.success(community ? "Community details updated!" : "Community activated successfully!")
				onClose()
			})
			.catch(() => {
				toast.error("Failed to activate community.")
			})
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
								JPEG, JPG, PNG accepted. Max 5MB.
							</span>
							{logoFile && (
								<span className="text-[10px] text-black/60 truncate max-w-xs font-semibold">
									{logoFile.name}
								</span>
							)}
						</div>
					</div>
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
						className="bg-[#FFC940] border-[3px] border-black text-black rounded-2xl px-4 py-2 font-bold text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						{community ? "Update Details" : "Activate"}
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
