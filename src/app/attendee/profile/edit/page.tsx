"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { toast } from "sonner"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import { TextField } from "@/components/ui/TextField"
import { Dropdown } from "@/components/ui/Dropdown"
import { Skeleton } from "@/components/ui/Skeleton"
import AltArrowLeftSvg from "@/icons/outlined/alt-arrow-left.svg"
import CameraAddSvg from "@/icons/outlined/camera-add.svg"
import UserSvg from "@/icons/outlined/user.svg"
import LikeSvg from "@/icons/filled/like.svg"
import DislikeSvg from "@/icons/filled/dislike.svg"
import StarSvg from "@/icons/filled/star.svg"
import { useAuthStore } from "@/store/authStore"
import {
	getAttendeeProfile,
	updateAttendeeProfile,
	getAttendeeInterests,
	updateAttendeeInterests,
	getUploadUrl,
	type AttendeeVibeType,
	type AttendeeSocialStyle,
	type AttendeeInterestAffinity,
} from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"
import type { AttendeeProfile } from "@/types/attendee"

// ─── Option sets ────────────────────────────────────────────────────────────────
// vibeType/socialStyle values are confirmed (match AttendeeVibeType/AttendeeSocialStyle,
// already used at registration). ageRange values are confirmed against the display
// page's formatAgeRange() pattern. gender values match the same set already used on the
// host edit page. privacy only has "MEMBERS_ONLY" confirmed from a live response — PUBLIC/
// PRIVATE below are inferred from the (pre-fix) display copy and should be confirmed with backend.

const VIBE_OPTIONS: { value: AttendeeVibeType; label: string }[] = [
	{ value: "LIFE_OF_PARTY", label: "Life of the Party" },
	{ value: "CHILL_OBSERVING", label: "Chill & Observing" },
	{ value: "HERE_TO_CONNECT", label: "Here to Connect" },
	{ value: "OPEN_TO_WHATEVER", label: "Open to Whatever" },
]

const SOCIAL_OPTIONS: { value: AttendeeSocialStyle; label: string }[] = [
	{ value: "SOLO_EXPLORER", label: "Solo Explorer" },
	{ value: "OPEN_TO_MEETING", label: "Open to Meeting People" },
	{ value: "BRINGING_GANG", label: "Bringing the Gang" },
]

const AGE_RANGE_OPTIONS = [
	{ value: "UNDER_18", label: "Under 18" },
	{ value: "AGE_18_24", label: "18–24" },
	{ value: "AGE_25_34", label: "25–34" },
	{ value: "AGE_35_44", label: "35–44" },
	{ value: "AGE_45_54", label: "45–54" },
	{ value: "AGE_55_PLUS", label: "55+" },
]

const GENDER_OPTIONS = [
	{ value: "MALE", label: "Male" },
	{ value: "FEMALE", label: "Female" },
	{ value: "OTHER", label: "Other" },
	{ value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
]

const PRIVACY_OPTIONS = [
	{ value: "PUBLIC", label: "Public — visible to everyone" },
	{ value: "MEMBERS_ONLY", label: "Members only — visible to community members" },
	{ value: "PRIVATE", label: "Private — only visible to you" },
]

type Affinity = "LIKED" | "OPEN_TO" | "DISLIKED"

// ─── Pill select (vibe / social style) ───────────────────────────────────────────

function PillSelect<T extends string>({
	options,
	value,
	onChange,
}: {
	options: { value: T; label: string }[]
	value: T | ""
	onChange: (v: T) => void
}) {
	return (
		<div className="flex flex-wrap gap-2">
			{options.map(opt => (
				<button
					key={opt.value}
					type="button"
					onClick={() => onChange(opt.value)}
					className={`px-3.5 py-2 rounded-avatar text-label-sm font-semibold border transition-colors ${
						value === opt.value
							? "bg-action-primary text-white border-action-primary"
							: "bg-surface-card text-text-secondary border-border-default hover:border-border-brand"
					}`}
				>
					{opt.label}
				</button>
			))}
		</div>
	)
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="rounded-action bg-surface-card border border-border-default shadow-card p-5 flex flex-col gap-4">
			<h2 className="text-body-md font-bold text-text-primary">{title}</h2>
			{children}
		</div>
	)
}

// ─── Interest card ────────────────────────────────────────────────────────────

function InterestCard({
	interest,
	affinity,
	onChange,
}: {
	interest: AttendeeInterestAffinity
	affinity: Affinity
	onChange: (a: Affinity) => void
}) {
	const actions: { key: Affinity; icon: typeof LikeSvg; activeClass: string }[] = [
		{ key: "DISLIKED", icon: DislikeSvg, activeClass: "bg-red-500 text-white" },
		{ key: "OPEN_TO", icon: StarSvg, activeClass: "bg-amber-400 text-white" },
		{ key: "LIKED", icon: LikeSvg, activeClass: "bg-green-500 text-white" },
	]

	return (
		<div className="relative rounded-action overflow-hidden border border-border-default aspect-4/5">
			<Image src={interest.image} alt={interest.name} fill sizes="180px" className="object-cover" />
			<div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/20 to-transparent" />
			<p className="absolute bottom-11 left-2 right-2 text-white text-label-sm font-semibold leading-tight line-clamp-2">
				{interest.name}
			</p>
			<div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
				{actions.map(a => (
					<button
						key={a.key}
						type="button"
						onClick={() => onChange(a.key)}
						aria-label={a.key}
						className={`size-8 rounded-full flex items-center justify-center transition-colors ${
							affinity === a.key ? a.activeClass : "bg-white/20 text-white hover:bg-white/30"
						}`}
					>
						<Icon as={a.icon} size="sm" color="inherit" className="**:fill-current **:stroke-current" />
					</button>
				))}
			</div>
		</div>
	)
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EditAttendeeProfilePage() {
	const router = useRouter()
	const { authLoading, user } = useAuthStore()

	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)

	const [profile, setProfile] = useState<AttendeeProfile | null>(null)
	const [username, setUsername] = useState("")
	const [bio, setBio] = useState("")
	const [city, setCity] = useState("")
	const [profession, setProfession] = useState("")
	const [ageRange, setAgeRange] = useState("")
	const [gender, setGender] = useState("")
	const [vibeType, setVibeType] = useState<AttendeeVibeType | "">("")
	const [socialStyle, setSocialStyle] = useState<AttendeeSocialStyle | "">("")
	const [privacy, setPrivacy] = useState("")

	const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
	const [avatarKey, setAvatarKey] = useState<string | null>(null)
	const [avatarUploading, setAvatarUploading] = useState(false)
	const avatarInputRef = useRef<HTMLInputElement>(null)

	const [interests, setInterests] = useState<AttendeeInterestAffinity[]>([])
	const [affinities, setAffinities] = useState<Record<string, Affinity>>({})

	useEffect(() => {
		if (authLoading) return
		if (!user) {
			router.replace(`/attendee/login?redirect=${encodeURIComponent("/attendee/profile/edit")}`)
			return
		}

		Promise.all([getAttendeeProfile().catch(() => null), getAttendeeInterests().catch(() => [])])
			.then(([ap, ints]) => {
				if (ap) {
					setProfile(ap)
					setUsername(ap.username ?? "")
					setBio(ap.bio ?? "")
					setCity(ap.city ?? "")
					setProfession(ap.profession ?? "")
					setAgeRange(ap.ageRange ?? "")
					setGender(ap.gender ?? "")
					setVibeType((ap.vibeType as AttendeeVibeType) ?? "")
					setSocialStyle((ap.socialStyle as AttendeeSocialStyle) ?? "")
					setPrivacy(ap.privacy ?? "")
				}
				setInterests(ints)
				setAffinities(Object.fromEntries(ints.map(i => [i.interestId, i.affinity])))
			})
			.finally(() => setLoading(false))
	}, [authLoading, user, router])

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
			await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } })
			setAvatarKey(key)
		} catch (err) {
			setAvatarPreview(null)
			setAvatarKey(null)
			toast.error(getApiErrorMessage(err))
		} finally {
			setAvatarUploading(false)
			e.target.value = ""
		}
	}

	async function handleSave() {
		if (saving) return
		setSaving(true)
		try {
			await updateAttendeeProfile({
				username: username.trim() || undefined,
				bio: bio.trim() || undefined,
				city: city.trim() || undefined,
				profession: profession.trim() || undefined,
				ageRange: ageRange || undefined,
				gender: gender || undefined,
				vibeType: vibeType || undefined,
				socialStyle: socialStyle || undefined,
				privacy: privacy || undefined,
				avatarKey: avatarKey ?? undefined,
			})

			const affinityChanged =
				interests.length > 0 && interests.some(i => affinities[i.interestId] !== i.affinity)
			if (affinityChanged) {
				await updateAttendeeInterests(
					interests.map(i => ({ interestId: i.interestId, affinity: affinities[i.interestId] })),
				)
			}

			toast.success("Profile updated.")
			router.push("/attendee/profile")
		} catch (err) {
			toast.error(getApiErrorMessage(err))
		} finally {
			setSaving(false)
		}
	}

	if (authLoading || loading) {
		return (
			<main className="flex-1">
				<div className="max-w-384 mx-auto px-(--space-page-x-mobile) md:px-(--space-page-x-tablet) lg:px-(--space-page-x-desktop) pt-8 pb-16">
					<Skeleton.Text className="w-28 mb-6" />
					<div className="max-w-2xl flex flex-col gap-4">
						<Skeleton.Block className="h-40 rounded-action" />
						<Skeleton.Block className="h-64 rounded-action" />
						<Skeleton.Block className="h-48 rounded-action" />
					</div>
				</div>
			</main>
		)
	}

	const avatarSrc = avatarPreview ?? profile?.avatarUrl ?? null

	return (
		<main className="flex-1">
			<div className="max-w-384 mx-auto px-(--space-page-x-mobile) md:px-(--space-page-x-tablet) lg:px-(--space-page-x-desktop) pt-8 pb-16">
				{/* Back */}
				<button
					type="button"
					onClick={() => router.push("/attendee/profile")}
					className="inline-flex items-center gap-1.5 text-body-sm text-text-primary hover:text-text-primary transition-colors mb-4"
				>
					<Icon as={AltArrowLeftSvg} size="sm" color="primary" />
					Back to profile
				</button>

				<div className="flex items-center justify-between mb-6 flex-wrap gap-3">
					<div>
						<h1 className="text-heading-md font-extrabold text-text-primary">Edit profile</h1>
						<p className="text-body-sm text-text-secondary mt-1">
							Update how you appear to other attendees and hosts.
						</p>
					</div>
					<div className="flex items-center gap-2.5">
						<Button
							variant="secondary"
							size="md"
							radius="pill"
							onClick={() => router.push("/attendee/profile")}
							disabled={saving}
						>
							Cancel
						</Button>
						<Button variant="primary" size="md" radius="pill" onClick={handleSave} disabled={saving}>
							{saving ? "Saving…" : "Save changes"}
						</Button>
					</div>
				</div>

				<div className="max-w-2xl flex flex-col gap-4">
					{/* Avatar */}
					<SectionCard title="Profile photo">
						<div className="flex items-center gap-5">
							<div className="relative shrink-0">
								<div className="size-20 rounded-full overflow-hidden bg-surface-brand-soft flex items-center justify-center border border-border-default">
									{avatarSrc ? (
										<Image src={avatarSrc} alt="Avatar" width={80} height={80} className="object-cover size-full" />
									) : (
										<Icon as={UserSvg} size="lg" color="brand" />
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
								<Button
									variant="secondary"
									size="sm"
									radius="pill"
									leftIcon={<Icon as={CameraAddSvg} size="sm" color="inherit" />}
									onClick={() => avatarInputRef.current?.click()}
									disabled={avatarUploading}
								>
									{avatarUploading ? "Uploading…" : "Change photo"}
								</Button>
								<p className="text-caption text-text-muted">JPG, PNG or WebP.</p>
							</div>
						</div>
					</SectionCard>

					{/* Basic info */}
					<SectionCard title="Basic info">
						<div className="flex flex-col gap-4">
							<TextField
								label="Username"
								value={username}
								onChange={e => setUsername(e.target.value)}
								placeholder="e.g. rahul_walks"
							/>
							<div className="flex flex-col gap-1.5">
								<label htmlFor="bio" className="text-label-sm font-semibold text-text-primary">Bio</label>
								<textarea
									id="bio"
									value={bio}
									onChange={e => setBio(e.target.value)}
									placeholder="Tell people a bit about yourself…"
									rows={3}
									className="px-4 py-3 rounded-input border border-border-default bg-surface-canvas text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-transparent transition-shadow resize-none"
								/>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<TextField
									label="City"
									value={city}
									onChange={e => setCity(e.target.value)}
									placeholder="e.g. Mumbai"
								/>
								<TextField
									label="Profession"
									value={profession}
									onChange={e => setProfession(e.target.value)}
									placeholder="e.g. Product Designer"
								/>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<Dropdown
									label="Age range"
									placeholder="Select…"
									options={AGE_RANGE_OPTIONS}
									value={ageRange}
									onChange={setAgeRange}
								/>
								<Dropdown
									label="Gender"
									placeholder="Select…"
									options={GENDER_OPTIONS}
									value={gender}
									onChange={setGender}
								/>
							</div>
						</div>
					</SectionCard>

					{/* Vibe & social style */}
					<SectionCard title="Your vibe">
						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-2">
								<span className="text-label-sm font-semibold text-text-primary">Vibe at experiences</span>
								<PillSelect options={VIBE_OPTIONS} value={vibeType} onChange={setVibeType} />
							</div>
							<div className="flex flex-col gap-2">
								<span className="text-label-sm font-semibold text-text-primary">Social style</span>
								<PillSelect options={SOCIAL_OPTIONS} value={socialStyle} onChange={setSocialStyle} />
							</div>
						</div>
					</SectionCard>

					{/* Privacy */}
					<SectionCard title="Privacy">
						<Dropdown
							label="Who can see your profile"
							placeholder="Select…"
							options={PRIVACY_OPTIONS}
							value={privacy}
							onChange={setPrivacy}
						/>
					</SectionCard>

					{/* Interests */}
					{interests.length > 0 && (
						<SectionCard title="Your interests">
							<p className="text-label-sm text-text-secondary -mt-2">
								Tap dislike, open-to, or like on each to update your affinity.
							</p>
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
								{interests.map(interest => (
									<InterestCard
										key={interest.interestId}
										interest={interest}
										affinity={affinities[interest.interestId] ?? interest.affinity}
										onChange={a =>
											setAffinities(prev => ({ ...prev, [interest.interestId]: a }))
										}
									/>
								))}
							</div>
						</SectionCard>
					)}

					{/* Bottom save */}
					<div className="flex justify-end gap-2.5 pt-2 pb-4">
						<Button
							variant="secondary"
							size="lg"
							radius="pill"
							onClick={() => router.push("/attendee/profile")}
							disabled={saving}
						>
							Cancel
						</Button>
						<Button variant="primary" size="lg" radius="pill" onClick={handleSave} disabled={saving}>
							{saving ? "Saving…" : "Save changes"}
						</Button>
					</div>
				</div>
			</div>
		</main>
	)
}
