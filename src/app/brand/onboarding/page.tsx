"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import clsx from "clsx"
import { toast } from "sonner"
import { ApiError, getApiErrorMessage } from "@/lib/errors"
import {
	registerBrand,
	getBrandProfile,
	updateBrandProfile,
	getCategories,
	getUploadUrl,
	type Category,
	type CompanyType,
} from "@/lib/api"
import { useBrandStore } from "@/store/brandStore"
import { useAuthSessionStore, useAuthSessionHydrated } from "@/store/authSessionStore"
import { useAuth } from "@/context/AuthContext"
import { AuthShell } from "@/components/auth/AuthShell"
import { Button } from "@/components/ui/Button"
import { TextField } from "@/components/ui/TextField"
import { Icon } from "@/components/ui/Icon"
import DangerTriangleSvg from "@/icons/outlined/danger-triangle.svg"

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

export default function OnboardingPage() {
	const [loadingMessage, setLoadingMessage] = useState<string | null>(null)
	const { phone, email: sessionEmail, redirectTo, clearSession } = useAuthSessionStore()
	const sessionHydrated = useAuthSessionHydrated()
	const { signOut } = useAuth()
	const { setProfile } = useBrandStore()
	const router = useRouter()

	// Guard: only reachable from signup flow — wait for the persisted session to hydrate
	// before checking, otherwise a hard refresh reads stale empty defaults and bounces
	// an in-progress signup back to /brand/signup.
	useEffect(() => {
		if (!sessionHydrated) return
		if (!phone && !sessionEmail) {
			router.replace("/brand/signup")
		}
	}, [sessionHydrated, phone, sessionEmail, router])

	const [brandName, setBrandName] = useState("")
	const [brandNameError, setBrandNameError] = useState<string | null>(null)
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
			toast.error(getApiErrorMessage(err))
		} finally {
			setLogoUploading(false)
		}
	}

	async function finishSignup() {
		if (!brandName.trim()) {
			setBrandNameError("Brand name is required to continue")
			return
		}
		setLoadingMessage("Setting up your brand profile…")
		try {
			try {
				await registerBrand({
					firstName: "Brand",
					lastName: brandName,
					email: sessionEmail || "",
					phone: phone || undefined,
					accountType: "BRAND",
					brandName,
					categoryIds,
					socialLinks: { website: website || undefined, instagram: instagram || undefined, linkedin: linkedin || undefined },
				})
			} catch (e) {
				// 409 = brand already registered — treat as success
				if (!(e instanceof ApiError && e.statusCode === 409)) throw e
			}

			// Persist the Step-2-only fields (not part of /auth/register) via a follow-up profile update.
			const resolvedIndustry = industry === "Custom" ? customIndustry : industry
			const hasExtra = workEmail || contactPhone || logoKey || companyType || aboutCompany || resolvedIndustry
			if (hasExtra) {
				try {
					await updateBrandProfile({
						workEmail: workEmail || undefined,
						contactPhone: contactPhone || undefined,
						logoKey: logoKey || undefined,
						companyType: companyType || undefined,
						aboutCompany: aboutCompany || undefined,
						industry: resolvedIndustry || undefined,
					})
				} catch {
					// Non-fatal — account is already created, they can fill these in later from Edit Profile.
				}
			}

			try {
				const profile = await getBrandProfile()
				setProfile(profile)
				clearSession()
				router.push(redirectTo || "/brand/dashboard")
			} catch {
				toast.error(
					"This email is already linked to a different account. Please use a different one, or log in instead.",
				)
			}
		} catch (e) {
			toast.error(getApiErrorMessage(e))
		} finally {
			setLoadingMessage(null)
		}
	}

	return (
		<AuthShell>
			{/* Loading overlay */}
			{loadingMessage && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
					<div className="bg-surface-card rounded-action px-10 py-8 flex flex-col items-center gap-4 shadow-xl">
						<div className="size-10 rounded-full bg-surface-warning-soft flex items-center justify-center">
							<Icon as={DangerTriangleSvg} size="lg" color="warning" />
						</div>
						<p className="text-body-sm font-semibold text-text-primary">{loadingMessage}</p>
					</div>
				</div>
			)}

			<div className="flex items-center justify-between mb-4">
				<button
					type="button"
					onClick={async () => {
						// Sign out first — otherwise the login page's own "already authenticated"
						// guard immediately bounces back to a dashboard with no profile yet.
						clearSession()
						await signOut()
						router.replace("/brand/login")
					}}
					className="inline-flex items-center gap-1.5 text-xs font-bold text-black/50 hover:text-black transition-colors"
				>
					<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
					</svg>
					Back to login
				</button>
			</div>

			<div className="flex flex-col flex-grow justify-between h-full">
				{/* Top Section: Title & Subtitle */}
				<div className="text-center pt-4 mb-6">
					<h2 className="font-heading text-3xl sm:text-4xl font-black text-black tracking-tight mb-3">
						Set up your Brand profile
					</h2>
					<p className="text-sm font-semibold text-black/60 max-w-md mx-auto leading-relaxed">
						Brand name is required — everything else below is optional and can be added later from your profile.
					</p>
				</div>

				<div className="flex flex-col gap-4">
					<SectionCard title="Brand Details">
						<div className="flex flex-col gap-4">
							<TextField
								label="Email address"
								value={sessionEmail || ""}
								disabled
								hint="From your account session"
							/>
							<TextField
								label="Brand Name"
								value={brandName}
								onChange={(e) => {
									setBrandName(e.target.value)
									if (brandNameError) setBrandNameError(null)
								}}
								placeholder="Acme Corp"
								error={!!brandNameError}
								helperText={brandNameError ?? undefined}
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

					<div className="flex justify-end gap-3 pt-4 pb-2 border-t border-border-default">

						<Button
							type="button"
							variant="primary"
							size="md"
							radius="pill"
							className="bg-[#EE2C2C] text-white border-[3px] border-black rounded-2xl font-extrabold text-center shadow-[4px_4px_0px_0px_#FFC940] hover:shadow-[1px_1px_0px_0px_#FFC940] hover:translate-x-[3px] hover:translate-y-[3px] transition-all tracking-wider"
							disabled={!!loadingMessage}
							onClick={() => finishSignup()}
						>
							{loadingMessage ? "Please wait…" : "Submit"}
						</Button>
					</div>
				</div>
			</div>
		</AuthShell>
	)
}
