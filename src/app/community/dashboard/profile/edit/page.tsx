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

const HOST_TYPE_OPTIONS = [
	{ value: "INDIVIDUAL", label: "Individual Host" },
	{ value: "BUSINESS", label: "Business Host" },
]

export default function EditProfilePage() {
	const router = useRouter()
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
	const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

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

	function showToast(message: string, type: "success" | "error") {
		setToast({ message, type })
		setTimeout(() => setToast(null), 3000)
	}

	const [cropSource, setCropSource] = useState<string | null>(null)
	const [cropFileMeta, setCropFileMeta] = useState<{ name: string; type: string } | null>(null)

	function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		if (!file || !profile) return

		setCropSource(URL.createObjectURL(file))
		setCropFileMeta({ name: file.name, type: file.type })
		e.target.value = ""
	}

	async function handleCroppedUpload(file: File, previewUrl: string) {
		if (!profile) return
		setAvatarPreview(previewUrl)
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
			showToast("Photo cropped & uploaded. Save changes to apply.", "success")
		} catch (err) {
			setAvatarPreview(null)
			setAvatarKey(null)
			showToast(getApiErrorMessage(err), "error")
		} finally {
			setAvatarUploading(false)
			setCropSource(null)
			setCropFileMeta(null)
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
			showToast("Profile updated.", "success")
			setTimeout(() => router.push("/community/dashboard/profile"), 1000)
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
						<Button variant="secondary" size="md" radius="pill" onClick={() => router.push("/community/dashboard/profile")} disabled={saving}>
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
						<Button variant="secondary" size="lg" radius="pill" onClick={() => router.push("/community/dashboard/profile")} disabled={saving}>
							Cancel
						</Button>
						<Button variant="primary" size="lg" radius="pill" onClick={handleSave} disabled={saving}>
							{saving ? "Saving…" : "Save Changes"}
						</Button>
					</div>
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

interface LogoCropModalProps {
	src: string
	fileName: string
	fileType: string
	onClose: () => void
	onCrop: (croppedFile: File, previewUrl: string) => void
}

function LogoCropModal({ src, fileName, fileType, onClose, onCrop }: LogoCropModalProps) {
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
