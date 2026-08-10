"use client"

import { useState, useEffect, useRef } from "react"
import { TextField } from "@/components/ui/TextField"
import { Button } from "@/components/ui/Button"
import { useHostStore } from "@/store/hostStore"
import { useAuthStore } from "@/store/authStore"
import { updateHostProfile, getHostProfile, getUploadUrl, updateUserDetails } from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"
import { Icon } from "@/components/ui/Icon"
import UserSvg from "@/icons/outlined/user.svg"
import { toast } from "sonner"
import clsx from "clsx"

// ─── Select Field Helper ──────────────────────────────────────────────────────
function SelectField({ label, value, onChange, options, inline = false }: {
	label: string
	value: string
	onChange: (v: string) => void
	options: { value: string; label: string }[]
	inline?: boolean
}) {
	const id = label.toLowerCase().replace(/\s+/g, "-")
	return (
		<div className="flex flex-col gap-1.5 w-full">
			<label htmlFor={id} className="text-xs font-bold text-black">{label}</label>
			<select
				id={id}
				value={value}
				onChange={e => onChange(e.target.value)}
				className={clsx(
					"h-10 px-4 rounded-xl bg-white text-black outline-none text-sm transition-colors w-full",
					inline ? "border border-black/15 focus:border-black/35" : "border-2 border-black"
				)}
			>
				<option value="">Select…</option>
				{options.map(o => (
					<option key={o.value} value={o.value}>{o.label}</option>
				))}
			</select>
		</div>
	)
}

const HOST_TYPE_OPTIONS = [
	{ value: "INDIVIDUAL", label: "Individual Host" },
	{ value: "BUSINESS", label: "Business Host" },
]

interface EditProfilePanelProps {
	onClose: () => void
	onSuccess: () => void
}

export function EditProfilePanel({ onClose, onSuccess }: EditProfilePanelProps) {
	const { profile, setProfile } = useHostStore()

	const [firstName, setFirstName] = useState("")
	const [lastName, setLastName] = useState("")
	const [communityName, setCommunityName] = useState("")
	const [phone, setPhone] = useState("")
	const [email, setEmail] = useState("")
	const [gender, setGender] = useState("")
	const [hostType, setHostType] = useState<"INDIVIDUAL" | "BUSINESS">("INDIVIDUAL")

	const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
	const [avatarKey, setAvatarKey] = useState<string | null>(null)
	const [avatarUploading, setAvatarUploading] = useState(false)
	const avatarInputRef = useRef<HTMLInputElement>(null)

	const [saving, setSaving] = useState(false)

	// Pre-populate from store
	useEffect(() => {
		if (!profile) return
		const hostUser = (profile as any)?.user
		setFirstName(hostUser?.firstName || "")
		setLastName(hostUser?.lastName || "")
		setCommunityName(profile.communityName || "")
		setPhone(hostUser?.phone || "")
		setEmail(hostUser?.email || "")
		setGender(profile.gender ?? "")
		setHostType(profile.hostType ?? "INDIVIDUAL")
	}, [profile])

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
			toast.success("Photo uploaded successfully! Save changes to apply.")
		} catch (err) {
			setAvatarPreview(null)
			setAvatarKey(null)
			toast.error(getApiErrorMessage(err))
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
			// Update auth user details (first/last name)
			await updateUserDetails({
				firstName: firstName.trim() || undefined,
				lastName: lastName.trim() || undefined,
			})

			// Update host profile
			await updateHostProfile({
				avatarUrl: avatarKey === "" ? null : (avatarKey ?? undefined),
				displayName: `${firstName} ${lastName}`.trim() || undefined,
				communityName: communityName.trim() || undefined,
				gender: gender || undefined,
				hostType: hostType || undefined,
			})

			const fresh = await getHostProfile()
			setProfile(fresh)
			toast.success("Profile updated successfully!")
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
				
				{/* Avatar Upload */}
				<div className="flex flex-col gap-3">
					<label className="text-xs font-bold text-black">Profile Photo</label>
					<div className="flex items-center gap-4">
						<div className="relative size-16 rounded-2xl border-2 border-dashed border-black/20 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
							{avatarPreview || (profile?.avatarUrl && avatarKey !== "") ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img src={avatarPreview ?? profile!.avatarUrl!} alt="Avatar" className="size-full object-cover" />
							) : (
								<Icon as={UserSvg} size="md" className="text-black/40 size-8" />
							)}
							{avatarUploading && (
								<div className="absolute inset-0 bg-black/40 flex items-center justify-center">
									<div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
								</div>
							)}
						</div>
						<div className="flex flex-col gap-1.5">
							<input
								ref={avatarInputRef}
								type="file"
								accept="image/*"
								className="hidden"
								onChange={handleAvatarChange}
							/>
							<div className="flex items-center gap-2">
								<Button
									type="button"
									variant="secondary"
									size="xs"
									radius="md"
									onClick={() => avatarInputRef.current?.click()}
									disabled={avatarUploading}
									className="bg-white border-2 border-black text-black text-[10px] py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
								>
									Choose Photo
								</Button>
								{(avatarPreview || (profile?.avatarUrl && avatarKey !== "")) && (
									<Button
										type="button"
										variant="secondary"
										size="xs"
										radius="md"
										onClick={handleRemovePhoto}
										disabled={avatarUploading}
										className="border-2 border-black text-red-600 bg-white text-[10px] py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
									>
										Remove
									</Button>
								)}
							</div>
							<span className="text-[10px] text-black/40">
								JPG, PNG or WebP accepted. Max 5MB.
							</span>
						</div>
					</div>
				</div>

				<hr className="border-black/10" />

				{/* Inputs */}
				<div className="flex flex-col gap-4">
					<TextField
						label="First Name"
						value={firstName}
						onChange={e => setFirstName(e.target.value)}
						placeholder="Enter your first name"
					/>
					<TextField
						label="Last Name"
						value={lastName}
						onChange={e => setLastName(e.target.value)}
						placeholder="Enter your last name"
					/>
					<TextField
						label="Community Name"
						value={communityName}
						onChange={e => setCommunityName(e.target.value)}
						placeholder="e.g. Bangalore Founders Circle"
						hint="The community or experience you run"
					/>
					<TextField
						label="Phone Number"
						value={phone}
						disabled
						readOnly
						placeholder="Not specified"
						hint="Phone number cannot be changed"
					/>
					<TextField
						label="Email Address"
						type="email"
						value={email}
						disabled
						readOnly
						placeholder="Enter your email address"
						hint="Email address cannot be changed"
					/>
					<SelectField
						label="Gender"
						value={gender}
						onChange={setGender}
						options={[
							{ value: "MALE", label: "Male" },
							{ value: "FEMALE", label: "Female" },
							{ value: "NON_BINARY", label: "Non-binary" },
							{ value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
						]}
						inline={true}
					/>
					<SelectField
						label="Host Type"
						value={hostType}
						onChange={(v) => setHostType(v as "INDIVIDUAL" | "BUSINESS")}
						options={HOST_TYPE_OPTIONS}
						inline={true}
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
						{saving ? "Saving…" : "Save Changes"}
					</button>
				</div>
			</div>
		</div>
	)
}
