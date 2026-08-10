"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import clsx from "clsx"
import { TextField } from "@/components/ui/TextField"
import { Button } from "@/components/ui/Button"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import { useHostStore } from "@/store/hostStore"
import { useAuthStore } from "@/store/authStore"
import { updateHostProfile, getHostProfile, getUploadUrl, updateUserDetails } from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"
import { Icon } from "@/components/ui/Icon"
import UserSvg from "@/icons/outlined/user.svg"

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
				className="h-10 px-4 rounded-xl border border-border-default bg-surface-card text-label-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-transparent transition-shadow"
			>
				<option value="">Select…</option>
				{options.map(o => (
					<option key={o.value} value={o.value}>{o.label}</option>
				))}
			</select>
		</div>
	)
}

// ─── Page Options ─────────────────────────────────────────────────────────────
const GENDER_OPTIONS = [
	{ value: "MALE", label: "Male" },
	{ value: "FEMALE", label: "Female" },
	{ value: "OTHER", label: "Other" },
	{ value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
]

const HOST_TYPE_OPTIONS = [
	{ value: "INDIVIDUAL", label: "Individual Host" },
	{ value: "BUSINESS", label: "Business Host" },
]

export default function EditProfilePage() {
	const router = useRouter()
	const { profile, setProfile } = useHostStore()

	const [displayName, setDisplayName] = useState("")
	const [email, setEmail] = useState("")
	const [gender, setGender] = useState("")
	const [hostType, setHostType] = useState<"INDIVIDUAL" | "BUSINESS">("INDIVIDUAL")

	const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
	const [avatarKey, setAvatarKey] = useState<string | null>(null)
	const [avatarUploading, setAvatarUploading] = useState(false)
	const avatarInputRef = useRef<HTMLInputElement>(null)

	const [saving, setSaving] = useState(false)
	const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

	// Pre-populate from store
	useEffect(() => {
		if (!profile) return
		setDisplayName(profile.displayName ?? "")
		setEmail((profile as any).email || useAuthStore.getState().user?.email || "")
		setGender(profile.gender ?? "")
		setHostType(profile.hostType ?? "INDIVIDUAL")
	}, [profile])

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
			e.target.value = ""
		}
	}

	function handleRemovePhoto() {
		setAvatarPreview(null)
		setAvatarKey("")
	}

	async function handleSave() {
		setSaving(true)
		try {
			await updateHostProfile({
				avatarUrl: avatarKey === "" ? null : (avatarKey ?? undefined),
				displayName: displayName.trim() || undefined,
				email: email.trim() || undefined,
				gender: gender || undefined,
				hostType: hostType || undefined,
			})
			const fresh = await getHostProfile()
			setProfile(fresh)
			showToast("Profile updated.", "success")
			setTimeout(() => router.push("/host/dashboard/profile"), 1000)
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
				<div className="flex items-center justify-between mb-6 max-w-2xl">
					<div>
						<h1 className="text-heading-sm font-semibold text-text-primary">Edit Profile</h1>
						<p className="text-body-sm text-text-secondary mt-0.5">Update your host identity and details</p>
					</div>
					<div className="flex items-center gap-3">
						<Button variant="secondary" size="md" radius="pill" onClick={() => router.push("/host/dashboard/profile")} disabled={saving}>
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
									{avatarPreview || (profile?.avatarUrl && avatarKey !== "") ? (
										// eslint-disable-next-line @next/next/no-img-element
										<img src={avatarPreview ?? profile!.avatarUrl!} alt="Avatar" className="size-full object-cover" />
									) : (
										<Icon as={UserSvg} size="lg" className="text-red-700 size-10" />
									)}
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
								<div className="flex items-center gap-2">
									<Button
										variant="secondary"
										size="sm"
										radius="pill"
										onClick={() => avatarInputRef.current?.click()}
										disabled={avatarUploading}
									>
										{avatarUploading ? "Uploading…" : "Change Photo"}
									</Button>
									{(avatarPreview || (profile?.avatarUrl && avatarKey !== "")) && (
										<Button
											variant="secondary"
											size="sm"
											radius="pill"
											onClick={handleRemovePhoto}
											disabled={avatarUploading}
											className="text-text-danger border-status-error-border hover:bg-status-error-bg"
										>
											Remove Photo
										</Button>
									)}
								</div>
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
								label="Email Address"
								type="email"
								value={email}
								onChange={e => setEmail(e.target.value)}
								placeholder="Enter your email address"
							/>
							<SelectField
								label="Gender"
								value={gender}
								onChange={setGender}
								options={GENDER_OPTIONS}
							/>
							<SelectField
								label="Host Type"
								value={hostType}
								onChange={(v) => setHostType(v as "INDIVIDUAL" | "BUSINESS")}
								options={HOST_TYPE_OPTIONS}
							/>
						</div>
					</SectionCard>

					{/* Bottom save */}
					<div className="flex justify-end gap-3 pt-2 pb-4">
						<Button variant="secondary" size="lg" radius="pill" onClick={() => router.push("/host/dashboard/profile")} disabled={saving}>
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
