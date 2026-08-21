"use client"

import { useState, useEffect, useRef } from "react"
import { TextField } from "@/components/ui/TextField"
import { Button } from "@/components/ui/Button"
import { useBrandStore } from "@/store/brandStore"
import { updateBrandProfile, getCategories, getUploadUrl, getBrandProfile, type Category, type CompanyType } from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"
import { Icon } from "@/components/ui/Icon"
import UserSvg from "@/icons/outlined/user.svg"
import { toast } from "@/lib/toast"
import clsx from "clsx"

const INDUSTRY_OPTIONS = [
	"Tech/SaaS",
	"Food & Beverage",
	"Fashion/Apparel",
	"Consumer Tech",
	"Health & Wellness",
	"FinTech",
	"Entertainment",
	"Alcobev",
	"Custom",
]

function CategoryPicker({ selected, onChange, categories }: {
	selected: string[]
	onChange: (ids: string[]) => void
	categories: Category[]
}) {
	function toggle(id: string) {
		onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id])
	}

	return (
		<div className="flex flex-col gap-1.5 w-full">
			<label className="text-xs font-bold text-black">Categories</label>
			<div className="flex flex-wrap gap-2">
				{categories.map((cat) => {
					const active = selected.includes(cat.id)
					return (
						<button
							key={cat.id}
							type="button"
							onClick={() => toggle(cat.id)}
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
			<p className="text-[10px] text-black/40">Optional — pick all that apply</p>
		</div>
	)
}

interface EditBrandProfilePanelProps {
	onClose: () => void
	onSuccess: () => void
}

export function EditBrandProfilePanel({ onClose, onSuccess }: EditBrandProfilePanelProps) {
	const { profile, setProfile } = useBrandStore()

	const [brandName, setBrandName] = useState("")
	const [categoryIds, setCategoryIds] = useState<string[]>([])
	const [website, setWebsite] = useState("")
	const [instagram, setInstagram] = useState("")
	const [linkedin, setLinkedin] = useState("")
	const [workEmail, setWorkEmail] = useState("")
	const [contactPhone, setContactPhone] = useState("")
	const [companyType, setCompanyType] = useState<CompanyType | "">("")
	const [aboutCompany, setAboutCompany] = useState("")
	const [industry, setIndustry] = useState("")
	const [customIndustry, setCustomIndustry] = useState("")
	const [logoKey, setLogoKey] = useState<string | null>(null)
	const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
	const [logoUploading, setLogoUploading] = useState(false)
	const [categories, setCategories] = useState<Category[]>([])
	const [saving, setSaving] = useState(false)

	const logoInputRef = useRef<HTMLInputElement>(null)

	const [cropSource, setCropSource] = useState<string | null>(null)
	const [cropFileMeta, setCropFileMeta] = useState<{ name: string; type: string } | null>(null)

	useEffect(() => {
		getCategories().then(setCategories).catch(() => {})
	}, [])

	useEffect(() => {
		getBrandProfile().then(setProfile).catch(() => {})
	}, [setProfile])

	useEffect(() => {
		if (!profile) return
		setBrandName(profile.brandName ?? "")
		setCategoryIds(profile.categories?.map((c) => c.id) ?? [])
		setWebsite(profile.socialLinks?.website ?? "")
		setInstagram(profile.socialLinks?.instagram ?? "")
		setLinkedin(profile.socialLinks?.linkedin ?? "")
		setWorkEmail(profile.workEmail ?? profile.email ?? "")
		setContactPhone(profile.contactPhone ?? "")
		setCompanyType(profile.companyType ?? "")
		setAboutCompany(profile.aboutCompany ?? "")
		const savedIndustry = profile.industry ?? ""
		if (savedIndustry && !INDUSTRY_OPTIONS.includes(savedIndustry)) {
			setIndustry("Custom")
			setCustomIndustry(savedIndustry)
		} else {
			setIndustry(savedIndustry)
		}
		setLogoKey(profile.logoKey ?? null)
		setLogoPreviewUrl(profile.logoUrl ?? null)
	}, [profile])

	function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		if (!file || !profile) return
		setCropSource(URL.createObjectURL(file))
		setCropFileMeta({ name: file.name, type: file.type })
		e.target.value = ""
	}

	async function handleCroppedUpload(file: File, previewUrl: string) {
		if (!profile) return
		setLogoPreviewUrl(previewUrl)
		setLogoUploading(true)
		try {
			const { url, key } = await getUploadUrl({ context: "USER_AVATAR", contentType: file.type })
			await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } })
			setLogoKey(key)
			toast.success("Logo cropped & uploaded successfully! Save changes to apply.")
		} catch (err) {
			toast.error(getApiErrorMessage(err))
		} finally {
			setLogoUploading(false)
			setCropSource(null)
			setCropFileMeta(null)
		}
	}

	async function handleSave() {
		if (saving) return
		setSaving(true)
		try {
			const resolvedIndustry = industry === "Custom" ? customIndustry : industry
			const updated = await updateBrandProfile({
				brandName: brandName || undefined,
				categoryIds,
				socialLinks: { website: website || undefined, instagram: instagram || undefined, linkedin: linkedin || undefined },
				workEmail: workEmail || undefined,
				contactPhone: contactPhone || undefined,
				logoKey: logoKey || undefined,
				companyType: companyType || undefined,
				aboutCompany: aboutCompany || undefined,
				industry: resolvedIndustry || undefined,
			})
			setProfile(updated)
			toast.success("Profile submitted for admin approval!")
			onSuccess()
			onClose()
		} catch (err) {
			toast.error(getApiErrorMessage(err))
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="w-full h-full flex flex-col bg-white p-6 overflow-y-auto animate-in fade-in duration-150 relative">
			{/* Panel Header */}
			<div className="flex justify-between items-center pb-4 mb-4 border-b border-black/10 shrink-0">
				<h2 className="text-xl font-heading font-black text-black">
					Edit Profile
				</h2>
				<button
					type="button"
					onClick={onClose}
					className="text-black/60 hover:text-black size-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors font-bold text-sm"
				>
					✕
				</button>
			</div>

			{/* Panel Body */}
			<div className="flex-1 flex flex-col gap-6">

				{/* Approval status banner */}
				{profile?.approvalStatus && (
					<div className={clsx(
						"rounded-xl px-3.5 py-2.5 text-xs font-semibold border-2",
						profile.approvalStatus === "APPROVED" && "bg-green-50 border-green-600 text-green-800",
						profile.approvalStatus === "PENDING" && "bg-amber-50 border-amber-500 text-amber-800",
						profile.approvalStatus === "REJECTED" && "bg-red-50 border-red-500 text-red-700",
					)}>
						{profile.approvalStatus === "APPROVED" && "Approved — Your brand profile is live and active."}
						{profile.approvalStatus === "PENDING" && "Awaiting admin approval — your profile is currently under review."}
						{profile.approvalStatus === "REJECTED" && "Rejected — Please update your profile details and submit again."}
					</div>
				)}
				
				{/* Logo Upload */}
				<div className="flex flex-col gap-3">
					<label className="text-xs font-bold text-black">Company Logo</label>
					<div className="flex items-center gap-4">
						<div className="relative size-16 rounded-2xl border-[3px] border-black bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
							{logoPreviewUrl ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img src={logoPreviewUrl} alt="Logo" className="size-full object-cover" />
							) : (
								<Icon as={UserSvg} size="md" className="text-black/40 size-8" />
							)}
							{logoUploading && (
								<div className="absolute inset-0 bg-black/40 flex items-center justify-center">
									<div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
								</div>
							)}
						</div>
						<div className="flex flex-col gap-1.5">
							<input
								ref={logoInputRef}
								type="file"
								accept="image/*"
								className="hidden"
								onChange={handleLogoUpload}
							/>
							<Button
								type="button"
								variant="secondary"
								size="xs"
								radius="md"
								onClick={() => logoInputRef.current?.click()}
								disabled={logoUploading}
								className="bg-white border-2 border-black text-black text-[10px] py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
							>
								Choose Photo
							</Button>
							<span className="text-[10px] text-black/40">
								Square image, max 2MB.
							</span>
						</div>
					</div>
				</div>

				<hr className="border-black/10" />

				{/* Inputs */}
				<div className="flex flex-col gap-4">
					<TextField
						label="Brand Name"
						value={brandName}
						onChange={(e) => setBrandName(e.target.value)}
						placeholder="Acme Corp"
					/>

					<div className="flex flex-col gap-1.5 w-full">
						<label className="text-xs font-bold text-black">Company Type</label>
						<div className="flex gap-2">
							{(["BRAND", "AGENCY"] as const).map((type) => (
								<button
									key={type}
									type="button"
									onClick={() => setCompanyType(type)}
									className={clsx(
										"px-3 py-1.5 rounded-full text-xs font-bold transition-all border-2 border-black",
										companyType === type
											? "bg-[#FFC940] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
											: "bg-white text-black hover:bg-black/5"
									)}
								>
									{type === "BRAND" ? "Brand" : "Agency"}
								</button>
							))}
						</div>
					</div>

					<div className="flex flex-col gap-1.5 w-full">
						<label className="text-xs font-bold text-black">Industry</label>
						<div className="flex flex-wrap gap-2">
							{INDUSTRY_OPTIONS.map((opt) => (
								<button
									key={opt}
									type="button"
									onClick={() => setIndustry(opt)}
									className={clsx(
										"px-3 py-1.5 rounded-full text-xs font-bold transition-all border-2 border-black",
										industry === opt
											? "bg-[#FFC940] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
											: "bg-white text-black hover:bg-black/5"
									)}
								>
									{opt}
								</button>
							))}
						</div>
						{industry === "Custom" && (
							<div className="mt-2">
								<TextField
									value={customIndustry}
									onChange={(e) => setCustomIndustry(e.target.value)}
									placeholder="Enter your industry"
								/>
							</div>
						)}
					</div>

					<div className="flex flex-col gap-1.5 w-full">
						<label htmlFor="about-company" className="text-xs font-bold text-black">About the Company</label>
						<textarea
							id="about-company"
							value={aboutCompany}
							onChange={(e) => setAboutCompany(e.target.value)}
							rows={3}
							placeholder="What does your company do?"
							className="px-4 py-3 rounded-xl border-2 border-black bg-white text-sm text-black placeholder:text-black/40 focus:outline-none transition-shadow resize-none"
						/>
					</div>

					<CategoryPicker selected={categoryIds} onChange={setCategoryIds} categories={categories} />

					<TextField
						label="Work Email"
						type="email"
						value={workEmail}
						onChange={(e) => setWorkEmail(e.target.value)}
						placeholder="you@company.com"
					/>

					<TextField
						label="Phone Number (optional)"
						value={contactPhone}
						onChange={(e) => setContactPhone(e.target.value)}
						placeholder="+919876543210"
					/>

					<TextField
						label="Website"
						value={website}
						onChange={(e) => setWebsite(e.target.value)}
						placeholder="https://yourbrand.com"
					/>

					<TextField
						label="Instagram"
						value={instagram}
						onChange={(e) => setInstagram(e.target.value)}
						placeholder="https://instagram.com/yourbrand"
					/>

					<TextField
						label="LinkedIn"
						value={linkedin}
						onChange={(e) => setLinkedin(e.target.value)}
						placeholder="https://linkedin.com/company/yourbrand"
					/>
				</div>

				{/* Footer */}
				<div className="mt-auto pt-6 border-t border-black/10 shrink-0 flex gap-3 justify-end">
					<button
						type="button"
						onClick={onClose}
						disabled={saving}
						className="bg-white border-[3px] border-black text-black rounded-2xl px-4 py-2 font-bold text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleSave}
						disabled={saving}
						className="bg-[#FFC940] border-[3px] border-black text-black rounded-2xl px-4 py-2 font-bold text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						{saving ? "Submitting…" : "Submit"}
					</button>
				</div>
			</div>

			{cropSource && cropFileMeta && (
				<LogoCropModal
					src={cropSource}
					fileName={cropFileMeta.name}
					fileType={cropFileMeta.type}
					onClose={() => {
						setCropSource(null)
						setCropFileMeta(null)
					}}
					onCrop={handleCroppedUpload}
				/>
			)}
		</div>
	)
}

function LogoCropModal({ src, fileName, fileType, onClose, onCrop }: {
	src: string
	fileName: string
	fileType: string
	onClose: () => void
	onCrop: (croppedFile: File, previewUrl: string) => void
}) {
	const [zoom, setZoom] = useState(1)
	const [offset, setOffset] = useState({ x: 0, y: 0 })
	const [isDragging, setIsDragging] = useState(false)
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
	const imgRef = useRef<HTMLImageElement>(null)

	function handleMouseDown(e: React.MouseEvent) {
		setIsDragging(true)
		setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
	}

	function handleMouseMove(e: React.MouseEvent) {
		if (!isDragging) return
		setOffset({
			x: e.clientX - dragStart.x,
			y: e.clientY - dragStart.y,
		})
	}

	function handleMouseUp() {
		setIsDragging(false)
	}

	function handleTouchStart(e: React.TouchEvent) {
		if (e.touches.length !== 1) return
		setIsDragging(true)
		setDragStart({ x: e.touches[0].clientX - offset.x, y: e.touches[0].clientY - offset.y })
	}

	function handleTouchMove(e: React.TouchEvent) {
		if (!isDragging || e.touches.length !== 1) return
		setOffset({
			x: e.touches[0].clientX - dragStart.x,
			y: e.touches[0].clientY - dragStart.y,
		})
	}

	function handleApply() {
		const img = imgRef.current
		if (!img) return

		const canvas = document.createElement("canvas")
		canvas.width = 240
		canvas.height = 240
		const ctx = canvas.getContext("2d")
		if (!ctx) return

		ctx.fillStyle = "#ffffff"
		ctx.fillRect(0, 0, 240, 240)

		ctx.translate(120 + offset.x, 120 + offset.y)
		ctx.scale(zoom, zoom)

		const aspect = img.naturalWidth / img.naturalHeight
		let dw = 200
		let dh = 200
		if (aspect > 1) {
			dh = 200 / aspect
		} else {
			dw = 200 * aspect
		}

		ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh)

		canvas.toBlob((blob) => {
			if (!blob) return
			const croppedFile = new File([blob], fileName, { type: fileType })
			const previewUrl = URL.createObjectURL(blob)
			onCrop(croppedFile, previewUrl)
		}, fileType)
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
			<div className="bg-white rounded-[24px] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full max-w-sm flex flex-col p-6 gap-4">
				<div className="flex items-center justify-between border-b-2 border-black pb-2">
					<h3 className="font-heading font-black text-base text-black">📐 Fit Profile Photo</h3>
					<button onClick={onClose} className="text-xl font-black text-black/40 hover:text-black">×</button>
				</div>

				<p className="text-xs text-black/50 font-semibold leading-normal">
					Drag the image to position it. Use the slider or buttons to zoom.
				</p>

				<div 
					className="size-60 rounded-full border-[3px] border-black overflow-hidden relative bg-neutral-100 flex items-center justify-center cursor-move select-none mx-auto"
					onMouseDown={handleMouseDown}
					onMouseMove={handleMouseMove}
					onMouseUp={handleMouseUp}
					onMouseLeave={handleMouseUp}
					onTouchStart={handleTouchStart}
					onTouchMove={handleTouchMove}
					onTouchEnd={handleMouseUp}
				>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						ref={imgRef}
						src={src}
						alt="Source"
						draggable={false}
						style={{
							transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
							transition: isDragging ? "none" : "transform 0.15s ease-out",
							maxWidth: "none",
							maxHeight: "none",
							width: "200px",
							height: "auto",
						}}
					/>
					<div className="absolute inset-0 rounded-full border-2 border-dashed border-red-500/40 pointer-events-none" />
				</div>

				<div className="flex flex-col gap-2.5 mt-2">
					<div className="flex items-center justify-between gap-3">
						<span className="text-[10px] font-black uppercase text-black/40">Zoom</span>
						<div className="flex items-center gap-2">
							<Button variant="secondary" size="sm" onClick={() => setZoom(z => Math.max(1, z - 0.1))}>−</Button>
							<input
								type="range"
								min="1"
								max="4"
								step="0.05"
								value={zoom}
								onChange={(e) => setZoom(parseFloat(e.target.value))}
								className="w-24 accent-[#EE2C2C]"
							/>
							<Button variant="secondary" size="sm" onClick={() => setZoom(z => Math.min(4, z + 0.1))}>+</Button>
						</div>
					</div>
				</div>

				<div className="flex justify-end gap-2 mt-2 border-t-2 border-black pt-4">
					<Button variant="secondary" onClick={onClose}>Cancel</Button>
					<Button onClick={handleApply}>Apply & Crop</Button>
				</div>
			</div>
		</div>
	)
}
