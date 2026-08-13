"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import clsx from "clsx"
import { TextField } from "@/components/ui/TextField"
import { Button } from "@/components/ui/Button"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import { useBrandStore } from "@/store/brandStore"
import { updateBrandProfile, getCategories, getUploadUrl, type Category, type CompanyType } from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"

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

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="bg-surface-card border border-border-default rounded-action px-5 py-5">
			<h2 className="text-label-lg font-semibold text-text-primary mb-5">{title}</h2>
			{children}
		</div>
	)
}

function CategoryPicker({ selected, onChange, categories }: {
	selected: string[]
	onChange: (ids: string[]) => void
	categories: Category[]
}) {
	function toggle(id: string) {
		onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id])
	}

	return (
		<div className="flex flex-col gap-1.5">
			<p className="text-label-sm font-medium text-text-primary">Categories</p>
			<div className="flex flex-wrap gap-2">
				{categories.map((cat) => {
					const active = selected.includes(cat.id)
					return (
						<button
							key={cat.id}
							type="button"
							onClick={() => toggle(cat.id)}
							className={clsx(
								"inline-flex items-center px-3 py-1.5 rounded-badge text-label-sm font-medium border transition-colors",
								active
									? "bg-surface-brand-soft text-text-brand border-border-brand"
									: "bg-surface-card text-text-secondary border-border-default hover:bg-surface-card-muted",
							)}
						>
							{cat.name}
						</button>
					)
				})}
			</div>
			<p className="text-caption text-text-tertiary">Optional — skip if not sure yet</p>
		</div>
	)
}

export default function EditProfilePage() {
	const router = useRouter()
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
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!profile) return
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setBrandName(profile.brandName ?? "")
		setCategoryIds(profile.categories?.map((c) => c.id) ?? [])
		setWebsite(profile.socialLinks?.website ?? "")
		setInstagram(profile.socialLinks?.instagram ?? "")
		setLinkedin(profile.socialLinks?.linkedin ?? "")
		setWorkEmail(profile.workEmail ?? "")
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

	useEffect(() => {
		getCategories().then(setCategories).catch(() => {})
	}, [])

	async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		if (!file) return
		setLogoUploading(true)
		try {
			const { url, key } = await getUploadUrl({ context: "USER_AVATAR", contentType: file.type })
			await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } })
			setLogoKey(key)
			setLogoPreviewUrl(URL.createObjectURL(file))
		} catch (err) {
			setError(getApiErrorMessage(err))
		} finally {
			setLogoUploading(false)
		}
	}

	async function handleSave() {
		setSaving(true)
		setError(null)
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
			router.push("/brand/dashboard/profile")
		} catch (e) {
			setError(getApiErrorMessage(e))
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="flex flex-col min-h-screen">
			<DashboardTopBar />

			<div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 bg-surface-page">
				<div className="mb-6">
					<h1 className="text-heading-sm font-semibold text-text-primary">Edit Profile</h1>
					<p className="text-body-sm text-text-secondary mt-0.5">
						All fields are optional — skip anything you&apos;re not ready to fill in yet.
					</p>
				</div>

				<div className="max-w-2xl flex flex-col gap-4">
					<SectionCard title="Brand Details">
						<div className="flex flex-col gap-4">
							<TextField
								label="Brand Name"
								value={brandName}
								onChange={(e) => setBrandName(e.target.value)}
								placeholder="Acme Corp"
							/>
							<div className="flex flex-col gap-1.5">
								<p className="text-label-sm font-medium text-text-primary">Company Logo</p>
								<div className="flex items-center gap-3">
									<div className="size-14 rounded-full overflow-hidden bg-surface-card-muted shrink-0 flex items-center justify-center">
										{logoPreviewUrl ? (
											// eslint-disable-next-line @next/next/no-img-element
											<img src={logoPreviewUrl} alt="Logo" className="size-full object-cover" />
										) : null}
									</div>
									<label className="text-label-sm font-medium text-text-brand cursor-pointer">
										{logoUploading ? "Uploading…" : "Upload logo"}
										<input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={logoUploading} />
									</label>
								</div>
								<p className="text-caption text-text-tertiary">Optional — square image, max 2MB</p>
							</div>
							<div className="flex flex-col gap-1.5">
								<p className="text-label-sm font-medium text-text-primary">Company Type</p>
								<div className="flex gap-2">
									{(["BRAND", "AGENCY"] as const).map((type) => (
										<button
											key={type}
											type="button"
											onClick={() => setCompanyType(type)}
											className={clsx(
												"inline-flex items-center px-3 py-1.5 rounded-badge text-label-sm font-medium border transition-colors",
												companyType === type
													? "bg-surface-brand-soft text-text-brand border-border-brand"
													: "bg-surface-card text-text-secondary border-border-default hover:bg-surface-card-muted",
											)}
										>
											{type === "BRAND" ? "Brand" : "Agency"}
										</button>
									))}
								</div>
							</div>
							<div className="flex flex-col gap-1.5">
								<p className="text-label-sm font-medium text-text-primary">Industry</p>
								<div className="flex flex-wrap gap-2">
									{INDUSTRY_OPTIONS.map((opt) => (
										<button
											key={opt}
											type="button"
											onClick={() => setIndustry(opt)}
											className={clsx(
												"inline-flex items-center px-3 py-1.5 rounded-badge text-label-sm font-medium border transition-colors",
												industry === opt
													? "bg-surface-brand-soft text-text-brand border-border-brand"
													: "bg-surface-card text-text-secondary border-border-default hover:bg-surface-card-muted",
											)}
										>
											{opt}
										</button>
									))}
								</div>
								{industry === "Custom" && (
									<TextField
										value={customIndustry}
										onChange={(e) => setCustomIndustry(e.target.value)}
										placeholder="Enter your industry"
									/>
								)}
							</div>
							<div className="flex flex-col gap-1.5">
								<label htmlFor="about-company" className="text-label-sm font-medium text-text-primary">About the Company</label>
								<textarea
									id="about-company"
									value={aboutCompany}
									onChange={(e) => setAboutCompany(e.target.value)}
									rows={3}
									placeholder="What does your company do?"
									className="px-4 py-3 rounded-input border border-border-default bg-surface-card text-label-sm text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-transparent transition-shadow resize-none"
								/>
							</div>
							<CategoryPicker selected={categoryIds} onChange={setCategoryIds} categories={categories} />
						</div>
					</SectionCard>

					<SectionCard title="Contact">
						<div className="flex flex-col gap-4">
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
						</div>
					</SectionCard>

					<SectionCard title="Website / Social Links">
						<div className="flex flex-col gap-4">
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
					</SectionCard>

					{error && <p className="text-body-sm text-status-error-text">{error}</p>}

					<div className="flex items-center gap-3">
						<Button variant="primary" onClick={handleSave} disabled={saving}>
							{saving ? "Saving…" : "Save Changes"}
						</Button>
						<Button variant="secondary" onClick={() => router.back()} disabled={saving}>
							Cancel
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
