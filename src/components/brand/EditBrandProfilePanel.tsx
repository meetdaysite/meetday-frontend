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

	useEffect(() => {
		getCategories().then(setCategories).catch(() => {})
	}, [])

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

	async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		if (!file || !profile) return
		setLogoUploading(true)
		try {
			const { url, key } = await getUploadUrl({ context: "USER_AVATAR", contentType: file.type })
			await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } })
			setLogoKey(key)
			setLogoPreviewUrl(URL.createObjectURL(file))
			toast.success("Logo uploaded successfully! Save changes to apply.")
		} catch (err) {
			toast.error(getApiErrorMessage(err))
		} finally {
			setLogoUploading(false)
		}
	}

	async function handleSave() {
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
		</div>
	)
}
