"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Icon } from "@/components/ui/Icon"
import { Skeleton } from "@/components/ui/Skeleton"
import { DeleteAccountModal } from "@/components/ui/DeleteAccountModal"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import SmileCircleSvg from "@/icons/outlined/smile-circle.svg"
import TicketSvg from "@/icons/outlined/ticket.svg"
import UsersGroupSvg from "@/icons/outlined/users-group-2.svg"
import BoltSvg from "@/icons/outlined/bolt.svg"
import UserSvg from "@/icons/outlined/user.svg"
import MapPointSvg from "@/icons/outlined/map-point.svg"
import ArrowRightSvg from "@/icons/outlined/arrow-right.svg"
import DangerTriangleSvg from "@/icons/outlined/danger-triangle.svg"
import { useAuthStore } from "@/store/authStore"
import { useAttendeeProfileStore } from "@/store/attendeeProfileStore"
import {
	getAttendeeProfile,
	getJoinedCommunities,
	getAttendeeInterests,
	type AttendeeVibeType,
	type AttendeeSocialStyle,
	type AttendeeInterestAffinity,
} from "@/lib/api"
import { getMyOrders } from "@/lib/ordersApi"
import type { AttendeeProfile } from "@/types/attendee"
import { Button } from "@/components/ui/Button"

// ─── Label maps ───────────────────────────────────────────────────────────────

const VIBE_LABELS: Record<AttendeeVibeType, string> = {
	LIFE_OF_PARTY: "Life of the Party",
	CHILL_OBSERVING: "Chill & Observing",
	HERE_TO_CONNECT: "Here to Connect",
	OPEN_TO_WHATEVER: "Open to Whatever",
}

const SOCIAL_LABELS: Record<AttendeeSocialStyle, string> = {
	SOLO_EXPLORER: "Solo Explorer",
	OPEN_TO_MEETING: "Open to Meeting People",
	BRINGING_GANG: "Bringing the Gang",
}

const GENDER_LABELS: Record<string, string> = {
	MALE: "Male",
	FEMALE: "Female",
	OTHER: "Other",
	PREFER_NOT_TO_SAY: "Prefer not to say",
}

const PRIVACY_LABELS: Record<string, string> = {
	PUBLIC: "Your profile is visible to everyone.",
	MEMBERS_ONLY: "Your profile is visible to community members.",
	PRIVATE: "Your profile is only visible to you.",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMemberSince(isoDate: string): string {
	return new Date(isoDate).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
}

function formatAgeRange(raw: string): string {
	if (raw === "UNDER_18") return "Under 18"
	if (raw === "AGE_55_PLUS") return "55+"
	const match = raw.match(/AGE_(\d+)_(\d+)/)
	if (match) return `${match[1]}–${match[2]}`
	return raw
}

function getInitials(firstName: string | null, lastName: string | null): string {
	return [firstName, lastName]
		.filter(Boolean)
		.map(n => n![0]!.toUpperCase())
		.slice(0, 2)
		.join("")
}

// ─── Stat pill ────────────────────────────────────────────────────────────────

function StatPill({
	icon,
	value,
	label,
	valueColor,
	bgClass,
	iconColor,
}: {
	icon: React.ComponentType
	value: number | string
	label: string
	valueColor: string
	bgClass: string
	iconColor?:
		| "secondary"
		| "primary"
		| "muted"
		| "inverse"
		| "brand"
		| "info"
		| "vibe"
		| "warning"
		| "success"
		| "inherit"
		| undefined
}) {
	return (
		<div className={`flex items-center gap-2 px-3.5 py-2 rounded-action border ${bgClass}`}>
			<Icon as={icon} size="lg" color={iconColor || "secondary"} />
			<span className={`text-heading-sm font-semibold ${valueColor}`}>{value}</span>
			<span className={`text-label-md ${valueColor}`}>{label}</span>
		</div>
	)
}

// ─── Vibe / Social chips ──────────────────────────────────────────────────────

function VibeChip({ label }: { label: string }) {
	return (
		<div className="flex items-center gap-2.5 w-full px-4 py-3 rounded-action bg-purple-50 border border-purple-200">
			<span className="size-2 rounded-full bg-purple-500 shrink-0" />
			<span className="text-body-sm font-semibold text-purple-700">{label}</span>
		</div>
	)
}

function SocialChip({ label }: { label: string }) {
	return (
		<div className="flex items-center gap-2.5 w-full px-4 py-3 rounded-action bg-blue-50 border border-blue-200">
			<span className="size-2 rounded-full bg-blue-500 shrink-0" />
			<span className="text-body-sm font-semibold text-blue-700">{label}</span>
		</div>
	)
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ icon, children }: { icon: React.ComponentType; children: React.ReactNode }) {
	return (
		<div className="flex items-center gap-1.5">
			<Icon as={icon} size="xs" color="muted" />
			<span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
				{children}
			</span>
		</div>
	)
}

// ─── Quick link card ──────────────────────────────────────────────────────────

function QuickLinkCard({
	href,
	label,
	sub,
	icon,
}: {
	href: string
	label: string
	sub: string
	icon: React.ComponentType
}) {
	return (
		<Link
			href={href}
			className="flex items-center gap-3.5 p-4 rounded-action border border-border-default bg-surface-card hover:bg-red-50 hover:border-red-200 transition-colors group shadow-card"
		>
			<div className="size-10 rounded-badge bg-red-100 flex items-center justify-center shrink-0 group-hover:bg-red-200 transition-colors">
				<Icon as={icon} size="sm" color="brand" />
			</div>
			<div className="flex-1 min-w-0">
				<p className="text-label-sm font-bold text-text-primary">{label}</p>
				<p className="text-[11px] text-text-muted mt-0.5">{sub}</p>
			</div>
			<Icon
				as={ArrowRightSvg}
				size="xs"
				color="muted"
				className="shrink-0 group-hover:text-text-brand transition-colors"
			/>
		</Link>
	)
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProfileSkeleton() {
	return (
		<main className="flex-1">
			<div className="max-w-384 mx-auto px-(--space-page-x-mobile) md:px-(--space-page-x-tablet) lg:px-(--space-page-x-desktop) pt-8 pb-16">
				<div className="flex items-center gap-4 mb-5">
					<Skeleton.Block className="size-22 rounded-full shrink-0" />
					<div className="flex flex-col gap-2">
						<Skeleton.Text className="w-40 h-6" />
						<Skeleton.Text className="w-28" />
					</div>
				</div>
				<div className="flex items-center justify-between gap-3 mb-8">
					<div className="flex gap-2.5">
						<Skeleton.Block className="h-9 w-36 rounded-action" />
						<Skeleton.Block className="h-9 w-28 rounded-action" />
					</div>
					<Skeleton.Block className="h-10 w-32 rounded-avatar shrink-0" />
				</div>
				<div className="flex flex-col lg:flex-row gap-5 lg:gap-8 items-start">
					<div className="flex-1 rounded-action bg-surface-card border border-border-default shadow-md p-5 flex flex-col gap-4">
						<Skeleton.Text className="w-16 h-4" />
						<Skeleton.Text className="w-full" />
						<Skeleton.Block className="h-11 w-full rounded-action" />
						<Skeleton.Block className="h-11 w-full rounded-action" />
					</div>
					<div className="w-full lg:w-72 shrink-0 flex flex-col gap-3">
						<Skeleton.Block className="h-16 rounded-action" />
						<Skeleton.Block className="h-16 rounded-action" />
					</div>
				</div>
			</div>
		</main>
	)
}

// ─── Main page ────────────────────────────────────────────────────────────────

function ProfilePageInner() {
	const router = useRouter()
	const { authLoading, user, signOut } = useAuthStore()
	const profile = useAttendeeProfileStore(s => s.profile)
	const profileLoading = useAttendeeProfileStore(s => s.profileLoading)

	const [attendeeProfile, setAttendeeProfile] = useState<AttendeeProfile | null>(null)
	const [interests, setInterests] = useState<AttendeeInterestAffinity[]>([])
	const [communitiesCount, setCommunitiesCount] = useState(0)
	const [eventsCount, setEventsCount] = useState(0)
	const [dataLoading, setDataLoading] = useState(true)
	const [showDeleteModal, setShowDeleteModal] = useState(false)

	useEffect(() => {
		if (authLoading || profileLoading) return
		if (!user) {
			router.replace(`/attendee/login?redirect=${encodeURIComponent("/attendee/profile")}`)
			return
		}

		Promise.all([
			getAttendeeProfile().catch(() => null),
			getAttendeeInterests().catch(() => []),
			getJoinedCommunities({ limit: 1 }).catch(() => ({ data: [], total: 0 })),
			getMyOrders().catch(() => [] as Awaited<ReturnType<typeof getMyOrders>>),
		])
			.then(([ap, ints, communities, orders]) => {
				setAttendeeProfile(ap)
				setInterests(ints)
				setCommunitiesCount(communities.total ?? communities.data.length)
				setEventsCount(orders.length)
			})
			.finally(() => setDataLoading(false))
	}, [authLoading, profileLoading, user, router])

	if (authLoading || profileLoading || dataLoading) return <ProfileSkeleton />
	if (!user || !profile) return null

	const firstName = profile.firstName ?? ""
	const lastName = profile.lastName ?? ""
	const displayName = [firstName, lastName].filter(Boolean).join(" ") || "Attendee"
	const initials = getInitials(profile.firstName, profile.lastName) || "A"
	const avatarUrl = attendeeProfile?.avatarUrl ?? profile.avatarUrl

	const memberSince = attendeeProfile?.createdAt ? formatMemberSince(attendeeProfile.createdAt) : null

	const vibeLabel = attendeeProfile?.vibeType
		? (VIBE_LABELS[attendeeProfile.vibeType as AttendeeVibeType] ?? attendeeProfile.vibeType)
		: null

	const socialLabel = attendeeProfile?.socialStyle
		? (SOCIAL_LABELS[attendeeProfile.socialStyle as AttendeeSocialStyle] ?? attendeeProfile.socialStyle)
		: null

	const hasAbout =
		attendeeProfile?.bio ||
		attendeeProfile?.profession ||
		attendeeProfile?.city ||
		attendeeProfile?.ageRange ||
		attendeeProfile?.gender ||
		vibeLabel ||
		socialLabel

	const likedInterests = interests.filter(i => i.affinity === "LIKED")

	return (
		<main className="flex-1">
			<div className="max-w-384 mx-auto px-(--space-page-x-mobile) md:px-(--space-page-x-tablet) lg:px-(--space-page-x-desktop) pt-8 pb-16">
				{/* ── Avatar + name ─────────────────────────────────────────────── */}
				<div className="flex items-center gap-4 lg:gap-5">
					{/* Gradient ring avatar */}
					<div className="p-0.75 rounded-full bg-linear-to-br from-red-400 to-purple-500 shadow-lg shrink-0">
						<div className="size-22 rounded-full bg-white overflow-hidden border-2 border-white flex items-center justify-center">
							{avatarUrl ? (
								<Image
									src={avatarUrl}
									alt={displayName}
									width={88}
									height={88}
									className="object-cover size-full"
								/>
							) : (
								<span className="text-2xl font-bold text-text-brand">{initials}</span>
							)}
						</div>
					</div>

					{/* Name + member since */}
					<div className="pb-1 flex flex-col gap-0.5">
						<h1 className="text-heading-lg font-bold text-text-primary">{displayName}</h1>
						{attendeeProfile?.username && (
							<p className="text-label-sm text-text-muted">@{attendeeProfile.username}</p>
						)}
						{memberSince && (
							<div className="flex items-center gap-1.5 mt-0.5">
								<Icon as={CalendarSvg} size="lg" color="vibe" />
								<span className="text-body-md font-medium text-text-vibe">
									Member since {memberSince}
								</span>
							</div>
						)}
					</div>
				</div>

				{/* ── Stats + Edit button row ───────────────────────────────────── */}
				<div className="mt-5 flex flex-wrap items-center justify-between gap-3 mb-7">
					<div className="flex flex-wrap gap-2.5">
						<StatPill
							icon={UsersGroupSvg}
							value={communitiesCount}
							label="Communities"
							valueColor="text-text-brand"
							bgClass="bg-red-50 border-red-100"
							iconColor="brand"
						/>
						<StatPill
							icon={TicketSvg}
							value={eventsCount}
							label="Events"
							valueColor="text-green-600"
							bgClass="bg-green-50 border-green-100"
							iconColor="success"
						/>
					</div>

					<div className="flex items-center gap-2.5 shrink-0">
						<Link
							href="/attendee/profile/edit"
							className="inline-flex items-center justify-center h-(--size-action-md) px-4 gap-2 text-label-sm rounded-action bg-surface-card text-text-brand hover:bg-surface-card-muted transition-colors duration-(--duration-120) shrink-0 border border-border-focus"
						>
							<EditIcon />
							Edit profile
						</Link>
						<Button
							variant="primary"
							onClick={() => setShowDeleteModal(true)}
							leftIcon={<Icon as={DangerTriangleSvg} size="sm" color="inherit" />}
						>
							Delete account
						</Button>
					</div>
				</div>

				{/* ── Two-column body ───────────────────────────────────────────── */}
				<div className="flex flex-col lg:flex-row gap-5 lg:gap-7 items-start">
					{/* About card */}
					<div className="w-full lg:flex-1 min-w-0">
						{hasAbout ? (
							<div className="rounded-action bg-surface-card border border-border-default overflow-hidden shadow-card">
								{/* colored top accent */}
								<div className="h-1 bg-linear-to-r from-red-400 to-purple-500" />
								<div className="p-5 flex flex-col gap-4">
									<h2 className="text-body-md font-bold text-text-primary">About</h2>

									{attendeeProfile?.bio && (
										<p className="text-body-sm text-text-secondary font-normal leading-relaxed">
											{attendeeProfile.bio}
										</p>
									)}

									{(attendeeProfile?.ageRange ||
										attendeeProfile?.gender ||
										attendeeProfile?.profession ||
										attendeeProfile?.city) && (
										<div className="flex flex-col gap-2">
											{attendeeProfile?.profession && (
												<div className="flex items-center gap-2.5">
													<Icon as={BoltSvg} size="sm" color="muted" />
													<span className="text-body-sm text-text-secondary">
														{attendeeProfile.profession}
													</span>
												</div>
											)}
											{attendeeProfile?.city && (
												<div className="flex items-center gap-2.5">
													<Icon as={MapPointSvg} size="sm" color="muted" />
													<span className="text-body-sm text-text-secondary">
														{attendeeProfile.city}
													</span>
												</div>
											)}
											{attendeeProfile?.ageRange && (
												<div className="flex items-center gap-2.5">
													<Icon as={SmileCircleSvg} size="sm" color="muted" />
													<span className="text-body-sm text-text-secondary">
														Age {formatAgeRange(attendeeProfile.ageRange)}
													</span>
												</div>
											)}
											{attendeeProfile?.gender && (
												<div className="flex items-center gap-2.5">
													<Icon as={UserSvg} size="sm" color="muted" />
													<span className="text-body-sm text-text-secondary">
														{GENDER_LABELS[attendeeProfile.gender] ??
															attendeeProfile.gender}
													</span>
												</div>
											)}
										</div>
									)}

									{(vibeLabel || socialLabel) && (
										<div className="flex flex-col gap-3.5 pt-0.5">
											{vibeLabel && (
												<div className="flex flex-col gap-1.5">
													<SectionLabel icon={SmileCircleSvg}>Vibe</SectionLabel>
													<VibeChip label={vibeLabel} />
												</div>
											)}
											{socialLabel && (
												<div className="flex flex-col gap-1.5">
													<SectionLabel icon={BoltSvg}>Social style</SectionLabel>
													<SocialChip label={socialLabel} />
												</div>
											)}
										</div>
									)}
								</div>
							</div>
						) : (
							<div className="rounded-action bg-surface-card border border-border-default overflow-hidden shadow-card">
								<div className="h-1 bg-linear-to-r from-red-400 to-purple-500" />
								<div className="p-8 flex flex-col items-center text-center gap-3">
									<div className="size-12 rounded-full bg-red-100 flex items-center justify-center">
										<Icon as={UserSvg} size="md" color="brand" />
									</div>
									<div>
										<p className="text-body-sm font-semibold text-text-primary">
											Your profile is bare
										</p>
										<p className="text-label-sm text-text-secondary font-normal mt-0.5">
											Add a bio, vibe, and more so others know who you are.
										</p>
									</div>
									<Link
										href="/attendee/profile/edit"
										className="inline-flex items-center justify-center h-(--size-action-sm) px-4 gap-1.5 text-label-sm font-semibold rounded-avatar bg-action-primary text-action-primary-text hover:bg-action-primary-bg-hover transition-colors"
									>
										Complete your profile
									</Link>
								</div>
							</div>
						)}
					</div>

					{/* Right sidebar */}
					<div className="w-full lg:flex-1 min-w-0 flex flex-col gap-2.5">
						<QuickLinkCard
							href="/attendee/my-events"
							label="My Experiences"
							sub="Upcoming, past & saved events"
							icon={TicketSvg}
						/>
						<QuickLinkCard
							href="/attendee/my-communities"
							label="My Communities"
							sub="Joined & saved communities"
							icon={UsersGroupSvg}
						/>

						{likedInterests.length > 0 && (
							<div className="rounded-action bg-surface-card border border-border-default shadow-card p-4 flex flex-col gap-2.5">
								<SectionLabel icon={SmileCircleSvg}>Interests</SectionLabel>
								<div className="flex flex-wrap gap-1.5">
									{likedInterests.map(i => (
										<span
											key={i.interestId}
											className="text-[11px] font-medium px-2.5 py-1 rounded-avatar bg-surface-vibe-soft text-text-vibe border border-violet-200"
										>
											{i.name}
										</span>
									))}
								</div>
							</div>
						)}

						{attendeeProfile?.privacy && (
							<div className="mt-0.5 px-4 py-3 rounded-action bg-amber-50 border border-amber-100">
								<p className="text-[11px] text-amber-800 leading-snug">
									<span className="font-semibold">Privacy: </span>
									{PRIVACY_LABELS[attendeeProfile.privacy] ??
										"Your profile is only visible to you."}
								</p>
							</div>
						)}
					</div>
				</div>
			</div>

			<DeleteAccountModal
				open={showDeleteModal}
				role="attendee"
				onClose={() => setShowDeleteModal(false)}
				onDeleted={async () => {
					setShowDeleteModal(false)
					await signOut()
					router.replace("/attendee/login")
				}}
			/>
		</main>
	)
}

export default function ProfilePage() {
	return (
		<Suspense fallback={<ProfileSkeleton />}>
			<ProfilePageInner />
		</Suspense>
	)
}

// ─── Inline icon ──────────────────────────────────────────────────────────────

function EditIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 15 15" fill="none" aria-hidden>
			<path
				d="M10.5 1.5a2.12 2.12 0 013 3L4.5 13.5 1 14l.5-3.5 9-9z"
				stroke="currentColor"
				strokeWidth="1.3"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}
