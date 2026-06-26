"use client"

import { useState, useEffect, useRef, KeyboardEvent } from "react"
import { useRouter } from "next/navigation"
import clsx from "clsx"
import { TextField } from "@/components/ui/TextField"
import { Button } from "@/components/ui/Button"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import { useHostStore } from "@/store/hostStore"
import { updateHostProfile, getHostProfile, getCategories, getUploadUrl } from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"
import type { Category } from "@/lib/api"

import CloseSvg from "@/icons/outlined/close.svg"

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
	return (
		<div className={clsx(
			"fixed bottom-6 right-6 z-50 px-4 py-3 rounded-action shadow-floating text-label-sm font-medium",
			type === "success"
				? "bg-surface-inverse text-text-inverse"
				: "bg-status-error-bg text-status-error-text border border-red-200",
		)}>
			{message}
		</div>
	)
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="bg-surface-card border border-border-default rounded-action px-5 py-5">
			<h2 className="text-label-lg font-semibold text-text-primary mb-5">{title}</h2>
			{children}
		</div>
	)
}

// ─── Select ───────────────────────────────────────────────────────────────────

function SelectField({ label, value, onChange, options }: {
	label: string
	value: string
	onChange: (v: string) => void
	options: { value: string; label: string }[]
}) {
	const id = label.toLowerCase().replace(/\s+/g, "-")
	return (
		<div className="flex flex-col gap-1.5">
			<label htmlFor={id} className="text-label-sm font-medium text-text-primary">{label}</label>
			<select
				id={id}
				value={value}
				onChange={e => onChange(e.target.value)}
				className="h-(--size-input-md) px-4 rounded-input border border-border-default bg-surface-card text-label-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-transparent transition-shadow"
			>
				<option value="">Select…</option>
				{options.map(o => (
					<option key={o.value} value={o.value}>{o.label}</option>
				))}
			</select>
		</div>
	)
}

// ─── Textarea ─────────────────────────────────────────────────────────────────

function TextareaField({ label, value, onChange, placeholder, rows = 3 }: {
	label: string
	value: string
	onChange: (v: string) => void
	placeholder?: string
	rows?: number
}) {
	const id = label.toLowerCase().replace(/\s+/g, "-")
	return (
		<div className="flex flex-col gap-1.5">
			<label htmlFor={id} className="text-label-sm font-medium text-text-primary">{label}</label>
			<textarea
				id={id}
				value={value}
				onChange={e => onChange(e.target.value)}
				placeholder={placeholder}
				rows={rows}
				className="px-4 py-3 rounded-input border border-border-default bg-surface-card text-label-sm text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-transparent transition-shadow resize-none"
			/>
		</div>
	)
}

// ─── Tag input ────────────────────────────────────────────────────────────────

function TagInput({ label, tags, onChange, placeholder }: {
	label: string
	tags: string[]
	onChange: (tags: string[]) => void
	placeholder?: string
}) {
	const [input, setInput] = useState("")
	const inputRef = useRef<HTMLInputElement>(null)

	function addTag(raw: string) {
		const val = raw.trim()
		if (val && !tags.includes(val)) onChange([...tags, val])
		setInput("")
	}

	function handleKey(e: KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault()
			addTag(input)
		} else if (e.key === "Backspace" && !input && tags.length > 0) {
			onChange(tags.slice(0, -1))
		}
	}

	return (
		<div className="flex flex-col gap-1.5">
			<label className="text-label-sm font-medium text-text-primary">{label}</label>
			<div
				className="min-h-(--size-input-md) px-3 py-2 rounded-input border border-border-default bg-surface-card flex flex-wrap gap-1.5 cursor-text focus-within:ring-2 focus-within:ring-border-focus focus-within:border-transparent transition-shadow"
				onClick={() => inputRef.current?.focus()}
			>
				{tags.map(tag => (
					<span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-badge text-caption font-medium bg-surface-brand-soft text-text-brand">
						{tag}
						<button
							type="button"
							onClick={e => { e.stopPropagation(); onChange(tags.filter(t => t !== tag)) }}
							className="hover:opacity-70"
							aria-label={`Remove ${tag}`}
						>
							<CloseSvg className="size-3" aria-hidden />
						</button>
					</span>
				))}
				<input
					ref={inputRef}
					value={input}
					onChange={e => setInput(e.target.value)}
					onKeyDown={handleKey}
					onBlur={() => { if (input.trim()) addTag(input) }}
					placeholder={tags.length === 0 ? placeholder : ""}
					className="flex-1 min-w-24 bg-transparent text-label-sm text-text-primary placeholder:text-text-placeholder outline-none"
				/>
			</div>
			<p className="text-caption text-text-tertiary">Press Enter or comma to add</p>
		</div>
	)
}

// ─── Category multi-select ────────────────────────────────────────────────────

function CategoryPicker({ selected, onChange, categories }: {
	selected: string[]
	onChange: (ids: string[]) => void
	categories: Category[]
}) {
	function toggle(id: string) {
		onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id])
	}

	return (
		<div className="flex flex-col gap-1.5">
			<p className="text-label-sm font-medium text-text-primary">Experience Categories</p>
			<div className="flex flex-wrap gap-2">
				{categories.map(cat => {
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
		</div>
	)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
	{ value: "MALE", label: "Male" },
	{ value: "FEMALE", label: "Female" },
	{ value: "OTHER", label: "Other" },
	{ value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
]

export default function EditProfilePage() {
	const router = useRouter()
	const { profile, setProfile } = useHostStore()

	const [displayName, setDisplayName] = useState("")
	const [tagline, setTagline] = useState("")
	const [hostBio, setHostBio] = useState("")
	const [gender, setGender] = useState("")
	const [yearsOfExperience, setYearsOfExperience] = useState("")
	const [totalEventsPreviouslyHosted, setTotalEventsPreviouslyHosted] = useState("")
	const [operatingCities, setOperatingCities] = useState<string[]>([])
	const [categoryIds, setCategoryIds] = useState<string[]>([])
	const [youtube, setYoutube] = useState("")
	const [instagram, setInstagram] = useState("")
	const [linkedin, setLinkedin] = useState("")
	const [portfolioLink, setPortfolioLink] = useState("")
	const [addressLine1, setAddressLine1] = useState("")
	const [addressLine2, setAddressLine2] = useState("")
	const [city, setCity] = useState("")
	const [state, setState] = useState("")
	const [pincode, setPincode] = useState("")
	const [country, setCountry] = useState("")

	const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
	const [avatarKey, setAvatarKey] = useState<string | null>(null)
	const [avatarUploading, setAvatarUploading] = useState(false)
	const avatarInputRef = useRef<HTMLInputElement>(null)

	const [categories, setCategories] = useState<Category[]>([])
	const [saving, setSaving] = useState(false)
	const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

	// Pre-populate from store
	useEffect(() => {
		if (!profile) return
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setDisplayName(profile.displayName ?? "")
		setTagline(profile.tagline ?? "")
		setHostBio(profile.hostBio ?? "")
		setGender(profile.gender ?? "")
		setYearsOfExperience(profile.yearsOfExperience?.toString() ?? "")
		setTotalEventsPreviouslyHosted(profile.totalEventsPreviouslyHosted?.toString() ?? "")
		setOperatingCities(profile.operatingCities ?? [])
		setCategoryIds(profile.categories?.map(c => c.categoryId) ?? [])
		setYoutube(profile.socialLinks?.youtube ?? "")
		setInstagram(profile.socialLinks?.instagram ?? "")
		setLinkedin(profile.socialLinks?.linkedin ?? "")
		setPortfolioLink(profile.socialLinks?.portfolio ?? "")
		setAddressLine1(profile.address?.addressLine1 ?? "")
		setAddressLine2(profile.address?.addressLine2 ?? "")
		setCity(profile.address?.city ?? "")
		setState(profile.address?.state ?? "")
		setPincode(profile.address?.pincode ?? "")
		setCountry(profile.address?.country ?? "")
	}, [profile])

	// Load categories
	useEffect(() => {
		getCategories().then(setCategories).catch(() => {})
	}, [])

	function showToast(message: string, type: "success" | "error") {
		setToast({ message, type })
		setTimeout(() => setToast(null), 3000)
	}

	async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		if (!file || !profile) return

		setAvatarPreview(URL.createObjectURL(file))
		setAvatarUploading(true)
		try {
			const { url, key } = await getUploadUrl({
				context: "USER_AVATAR",
				contentType: file.type,
				resourceId: profile.userId,
			})
			await fetch(url, {
				method: "PUT",
				body: file,
				headers: { "Content-Type": file.type },
			})
			setAvatarKey(key)
			showToast("Photo ready. Save to apply.", "success")
		} catch (err) {
			setAvatarPreview(null)
			setAvatarKey(null)
			showToast(getApiErrorMessage(err), "error")
		} finally {
			setAvatarUploading(false)
			// Reset input so the same file can be re-selected if needed
			e.target.value = ""
		}
	}

	async function handleSave() {
		setSaving(true)
		try {
			await updateHostProfile({
				avatarUrl: avatarKey ?? undefined,
				displayName: displayName.trim() || undefined,
				tagline: tagline.trim() || undefined,
				hostBio: hostBio.trim() || undefined,
				gender: gender || undefined,
				yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : undefined,
				totalEventsPreviouslyHosted: totalEventsPreviouslyHosted ? Number(totalEventsPreviouslyHosted) : undefined,
				operatingCities,
				categoryIds,
				socialLinks: {
					youtube: youtube.trim() || undefined,
					instagram: instagram.trim() || undefined,
					linkedin: linkedin.trim() || undefined,
					portfolio: portfolioLink.trim() || undefined,
				},
				address: addressLine1.trim() ? {
					addressLine1: addressLine1.trim(),
					addressLine2: addressLine2.trim() || undefined,
					city: city.trim(),
					state: state.trim(),
					pincode: pincode.trim(),
					country: country.trim() || undefined,
				} : undefined,
			})
			const fresh = await getHostProfile()
			setProfile(fresh)
			showToast("Profile updated.", "success")
			setTimeout(() => router.push("/dashboard/profile"), 1000)
		} catch (err) {
			showToast(getApiErrorMessage(err), "error")
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="flex flex-col min-h-screen">
			<DashboardTopBar />

			{toast && <Toast message={toast.message} type={toast.type} />}

			<div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 bg-surface-page">
				{/* Header */}
				<div className="flex items-center justify-between mb-6">
					<div>
						<h1 className="text-heading-sm font-semibold text-text-primary">Edit Profile</h1>
						<p className="text-body-sm text-text-secondary mt-0.5">Update your host identity and details</p>
					</div>
					<div className="flex items-center gap-3">
						<Button variant="secondary" size="md" radius="pill" onClick={() => router.push("/dashboard/profile")} disabled={saving}>
							Cancel
						</Button>
						<Button variant="primary" size="md" radius="pill" onClick={handleSave} disabled={saving}>
							{saving ? "Saving…" : "Save Changes"}
						</Button>
					</div>
				</div>

				<div className="max-w-2xl flex flex-col gap-4">

					{/* Avatar */}
					<SectionCard title="Profile Photo">
						<div className="flex items-center gap-5">
							<div className="relative shrink-0">
								<div className="size-20 rounded-full overflow-hidden bg-red-100 flex items-center justify-center text-red-700 text-heading-sm font-bold select-none">
									{avatarPreview || profile?.avatarUrl
										// eslint-disable-next-line @next/next/no-img-element
										? <img src={avatarPreview ?? profile!.avatarUrl!} alt="Avatar" className="size-full object-cover" />
										: (profile?.displayName || "H").split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase()
									}
								</div>
								{avatarUploading && (
									<div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
										<div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
									</div>
								)}
							</div>
							<div className="flex flex-col gap-2">
								<input
									ref={avatarInputRef}
									type="file"
									accept="image/*"
									className="hidden"
									onChange={handleAvatarChange}
								/>
								<Button
									variant="secondary"
									size="sm"
									radius="pill"
									onClick={() => avatarInputRef.current?.click()}
									disabled={avatarUploading}
								>
									{avatarUploading ? "Uploading…" : "Change Photo"}
								</Button>
								<p className="text-caption text-text-tertiary">JPG, PNG or WebP. Max 5 MB.</p>
							</div>
						</div>
					</SectionCard>

					{/* Basic */}
					<SectionCard title="Basic Info">
						<div className="flex flex-col gap-4">
							<TextField
								label="Display Name"
								value={displayName}
								onChange={e => setDisplayName(e.target.value)}
								placeholder="How you appear to attendees"
							/>
							<TextField
								label="Tagline"
								value={tagline}
								onChange={e => setTagline(e.target.value)}
								placeholder="A short line about you"
							/>
							<TextareaField
								label="Bio"
								value={hostBio}
								onChange={setHostBio}
								placeholder="Tell attendees about yourself…"
								rows={4}
							/>
							<SelectField
								label="Gender"
								value={gender}
								onChange={setGender}
								options={GENDER_OPTIONS}
							/>
						</div>
					</SectionCard>

					{/* Experience */}
					<SectionCard title="Experience">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<TextField
								label="Years of Experience"
								type="number"
								min={0}
								value={yearsOfExperience}
								onChange={e => setYearsOfExperience(e.target.value)}
								placeholder="e.g. 3"
							/>
							<TextField
								label="Experiences Hosted Before"
								type="number"
								min={0}
								value={totalEventsPreviouslyHosted}
								onChange={e => setTotalEventsPreviouslyHosted(e.target.value)}
								placeholder="e.g. 10"
							/>
						</div>
					</SectionCard>

					{/* Cities */}
					<SectionCard title="Operating Cities">
						<TagInput
							label="Cities"
							tags={operatingCities}
							onChange={setOperatingCities}
							placeholder="Type a city and press Enter…"
						/>
					</SectionCard>

					{/* Categories */}
					{categories.length > 0 && (
						<SectionCard title="Experience Categories">
							<CategoryPicker
								selected={categoryIds}
								onChange={setCategoryIds}
								categories={categories}
							/>
						</SectionCard>
					)}

					{/* Social Links */}
					<SectionCard title="Social Links">
						<div className="flex flex-col gap-4">
							<TextField
								label="YouTube"
								value={youtube}
								onChange={e => setYoutube(e.target.value)}
								placeholder="Channel URL or handle"
							/>
							<TextField
								label="Instagram"
								value={instagram}
								onChange={e => setInstagram(e.target.value)}
								placeholder="Profile URL or @handle"
							/>
							<TextField
								label="LinkedIn"
								value={linkedin}
								onChange={e => setLinkedin(e.target.value)}
								placeholder="Profile URL"
							/>
							<TextField
								label="Portfolio"
								value={portfolioLink}
								onChange={e => setPortfolioLink(e.target.value)}
								placeholder="Website or portfolio URL"
							/>
						</div>
					</SectionCard>

					{/* Address */}
					<SectionCard title="Address">
						<div className="flex flex-col gap-4">
							<TextField
								label="Address Line 1"
								value={addressLine1}
								onChange={e => setAddressLine1(e.target.value)}
								placeholder="Street, building, floor…"
							/>
							<TextField
								label="Address Line 2"
								value={addressLine2}
								onChange={e => setAddressLine2(e.target.value)}
								placeholder="Landmark, area (optional)"
							/>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<TextField
									label="City"
									value={city}
									onChange={e => setCity(e.target.value)}
									placeholder="City"
								/>
								<TextField
									label="State"
									value={state}
									onChange={e => setState(e.target.value)}
									placeholder="State"
								/>
								<TextField
									label="Pincode"
									value={pincode}
									onChange={e => setPincode(e.target.value)}
									placeholder="Pincode"
								/>
								<TextField
									label="Country"
									value={country}
									onChange={e => setCountry(e.target.value)}
									placeholder="Country"
								/>
							</div>
						</div>
					</SectionCard>

					{/* Bottom save */}
					<div className="flex justify-end gap-3 pt-2 pb-4">
						<Button variant="secondary" size="lg" radius="pill" onClick={() => router.push("/dashboard/profile")} disabled={saving}>
							Cancel
						</Button>
						<Button variant="primary" size="lg" radius="pill" onClick={handleSave} disabled={saving}>
							{saving ? "Saving…" : "Save Changes"}
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
