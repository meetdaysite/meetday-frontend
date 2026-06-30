"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import UsersGroupSvg from "@/icons/filled/users-group-2.svg"
import VerifiedSvg from "@/icons/filled/verified-check.svg"
import BookmarkFilledSvg from "@/icons/filled/bookmark.svg"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import MapPointSvg from "@/icons/outlined/map-point.svg"
import BookmarkSvg from "@/icons/outlined/bookmark.svg"
import BoltSvg from "@/icons/outlined/bolt.svg"
import CheckSvg from "@/icons/outlined/check.svg"
import { useAuthStore } from "@/store/authStore"
import { saveCommunity, unsaveCommunity } from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"
import { toast } from "sonner"

export interface CommunityDetails {
	id: string
	slug: string
	name: string
	description: string
	type: string
	access: string
	memberCount: number
	experienceCount: number
	primaryCity: string
	coverImageUrl: string
	iconUrl: string
}

function fmtCount(n: number): string {
	if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
	return String(n)
}

export function CommunityHero({
	community,
	isMember,
	isSaved: initialSaved = false,
	onJoinClick,
	onLeaveClick,
}: {
	community: CommunityDetails
	isMember: boolean
	isSaved?: boolean
	onJoinClick: () => void
	onLeaveClick: () => void
}) {
	const router = useRouter()
	const user = useAuthStore((s) => s.user)
	const [saved, setSaved] = useState(initialSaved)
	const [saving, setSaving] = useState(false)

	const isManaged = community.type === "MEETDAY_MANAGED_PUBLIC"
	const visibilityLabel = community.access === "PUBLIC" ? "Public" : "Private"

	async function handleSave() {
		if (!user) {
			router.push(`/attendee/login?redirect=${encodeURIComponent(window.location.pathname)}`)
			return
		}
		if (saving) return
		const next = !saved
		setSaved(next)
		setSaving(true)
		try {
			if (next) {
				await saveCommunity(community.id)
				toast.success("Community saved", { description: "Find it anytime in your saved list." })
			} else {
				await unsaveCommunity(community.id)
				toast.success("Community removed from saved")
			}
		} catch (err) {
			setSaved(!next)
			toast.error(getApiErrorMessage(err))
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="rounded-panel overflow-hidden bg-neutral-950 border border-neutral-800 relative min-h-64 shadow-md">
			{/* Full background cover image */}
			<Image
				src={community.coverImageUrl}
				alt=""
				fill
				sizes="(max-width: 1280px) 100vw, 900px"
				className="object-cover opacity-40"
				priority
			/>

			{/* Gradient overlay for readability */}
			<div className="absolute inset-0 bg-linear-to-b from-neutral-950/40 via-neutral-950/60 to-neutral-950/95 pointer-events-none" />

			{/* Ambient glow */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute -left-12 top-4 size-56 rounded-full bg-purple-600/25 blur-3xl" />
				<div className="absolute right-16 bottom-0 size-56 rounded-full bg-pink-600/20 blur-3xl" />
				<div className="absolute left-1/2 top-0 size-40 rounded-full bg-blue-600/15 blur-2xl" />
			</div>

			{/* Content area */}
			<div className="relative z-10 px-8 pt-10 pb-8 flex flex-col gap-6">
				{/* Row 1: icon (left) + info (right) */}
				<div className="grid grid-cols-[auto_1fr] gap-5 items-start">
					{/* Left: community icon */}
					<div className="relative size-32 rounded-full shrink-0 border-4 border-neutral-950 overflow-hidden bg-neutral-800">
						<Image
							src={community.iconUrl}
							alt={community.name}
							fill
							sizes="128px"
							className="object-cover"
						/>
					</div>

					{/* Right: badges + name + description + stats */}
					<div className="flex flex-col gap-2 pt-2">
						{/* Badges */}
						<div className="flex gap-2 flex-wrap">
							<span className="text-[11px] font-medium bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-avatar px-2.5 py-0.5">
								{visibilityLabel} Community
							</span>
							{isManaged && (
								<span className="text-[11px] font-medium bg-teal-600/20 text-teal-300 border border-teal-500/30 rounded-avatar px-2.5 py-0.5">
									Managed by Meetday
								</span>
							)}
						</div>

						{/* Name */}
						<div className="flex items-center gap-2">
							<h1 className="text-xl font-extrabold text-white leading-tight">{community.name}</h1>
							{isManaged && <Icon as={VerifiedSvg} size="md" color="brand" />}
						</div>

						{/* Description */}
						<p className="text-label-sm text-white/70 leading-relaxed font-normal">
							{community.description}
						</p>

						{/* Stats */}
						<div className="flex flex-wrap gap-x-4 gap-y-1.5">
							<div className="flex items-center gap-1.5 text-label-sm text-white/75">
								<Icon as={UsersGroupSvg} size="sm" color="inverse" />
								<span>{fmtCount(community.memberCount)} members</span>
							</div>
							<div className="flex items-center gap-1.5 text-label-sm text-white/75">
								<Icon as={CalendarSvg} size="sm" color="inverse" />
								<span>{community.experienceCount} upcoming experiences</span>
							</div>
							<div className="flex items-center gap-1.5 text-label-sm text-white/75">
								<Icon as={MapPointSvg} size="sm" color="inverse" />
								<span>{community.primaryCity}</span>
							</div>
						</div>
					</div>
				</div>

				{/* Row 2: action buttons */}
				<div className="flex gap-2">
					{isMember ? (
						<Button
							variant="secondary"
							size="md"
							radius="pill"
							leftIcon={<Icon as={CheckSvg} size="sm" color="inherit" />}
							className="border-white/20 text-white bg-white/10 hover:bg-white/15"
							onClick={onLeaveClick}
						>
							Joined
						</Button>
					) : (
						<Button
							variant="primary"
							size="md"
							radius="pill"
							leftIcon={<Icon as={BoltSvg} size="sm" color="inverse" />}
							onClick={onJoinClick}
						>
							Join Community
						</Button>
					)}
					<Button
						variant="secondary"
						size="md"
						radius="pill"
						leftIcon={<Icon as={saved ? BookmarkFilledSvg : BookmarkSvg} size="sm" color="inverse" />}
						className="border-white/20 text-white bg-white/5 hover:bg-white/10"
						onClick={handleSave}
						disabled={saving}
					>
						{saved ? "Saved" : "Save"}
					</Button>
				</div>
			</div>
		</div>
	)
}
