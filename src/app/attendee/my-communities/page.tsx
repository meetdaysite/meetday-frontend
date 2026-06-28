"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import clsx from "clsx"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import BookmarkFilledSvg from "@/icons/filled/bookmark.svg"
import UsersGroupSvg from "@/icons/filled/users-group-2.svg"
import GiftSvg from "@/icons/outlined/gift.svg"
import { getJoinedCommunities, getSavedCommunities, getRecommendedCommunities } from "@/lib/api"
import { CommunityCard } from "@/components/attendee/CommunityCard"
import { useAuthStore } from "@/store/authStore"
import type { PublicCommunity } from "@/lib/api"

type Tab = "joined" | "saved"

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({
	joinedCount,
	savedCount,
}: {
	joinedCount: number
	savedCount: number
}) {
	const stats = [
		{ label: "Joined", value: joinedCount, color: "text-text-brand" },
		{ label: "Saved", value: savedCount, color: "text-amber-500" },
	]
	return (
		<div className="flex items-center gap-3 flex-wrap">
			{stats.map((s) => (
				<div
					key={s.label}
					className="flex items-center gap-2.5 px-4 py-2 rounded-action bg-surface-card border border-border-default"
				>
					<span className={clsx("text-heading-sm font-extrabold", s.color)}>{s.value}</span>
					<span className="text-label-sm text-text-secondary">{s.label}</span>
				</div>
			))}
		</div>
	)
}

// ─── Empty tab state ──────────────────────────────────────────────────────────

function EmptyTabState({ tab }: { tab: Tab }) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const msgs: Record<Tab, { title: string; body: string; icon: any }> = {
		joined: {
			title: "No communities joined yet",
			body: "Join a community and build meaningful connections.",
			icon: UsersGroupSvg,
		},
		saved: {
			title: "No saved communities yet",
			body: "Tap Save on any community to bookmark it here.",
			icon: BookmarkFilledSvg,
		},
	}
	const { title, body, icon } = msgs[tab]
	return (
		<div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
			<div className="size-14 rounded-full bg-surface-secondary flex items-center justify-center">
				<Icon as={icon} size="lg" color="muted" />
			</div>
			<div>
				<p className="text-body-md font-bold text-text-primary">{title}</p>
				<p className="text-body-sm text-text-secondary mt-1">{body}</p>
			</div>
			<Link href="/explore?view=communities">
				<Button variant="primary" size="sm" radius="pill">
					Browse Communities →
				</Button>
			</Link>
		</div>
	)
}

// ─── Full empty state ─────────────────────────────────────────────────────────

function EmptyCommunitiesState() {
	return (
		<div className="flex flex-col gap-4">
			<div className="rounded-action border border-border-default bg-surface-card overflow-hidden">
				<div className="flex items-stretch min-h-52">
					<div className="relative w-64 shrink-0 overflow-hidden">
						<Image
							src="/assets/attendee/my-events-empty.png"
							alt="Explore communities"
							fill
							sizes="256px"
							className="object-cover"
						/>
						<div className="absolute top-4 left-4 right-4 px-2.5 py-1 rounded-badge bg-black/30 backdrop-blur-sm border border-white/20">
							<span className="text-[10px] font-semibold text-white">Find your people 🤝</span>
						</div>
					</div>
					<div className="flex-1 flex flex-col justify-center gap-5 p-8">
						<div>
							<h2 className="text-heading-lg font-black text-text-primary leading-tight">
								Your{" "}
								<span className="text-text-brand">tribe</span>{" "}
								is out there
							</h2>
							<p className="text-body-sm text-text-secondary mt-2 leading-relaxed max-w-xs">
								Join communities built around your interests — meet people who get you, attend exclusive
								events, and stay connected beyond the moment.
							</p>
						</div>
						<div className="flex flex-col gap-2.5">
							<Link href="/explore?view=communities">
								<Button variant="primary" size="md" radius="pill" className="w-full justify-center">
									Explore Communities →
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

// ─── Right panel ──────────────────────────────────────────────────────────────

function RightPanel({ recommendations }: { recommendations: PublicCommunity[] }) {
	return (
		<>
			{recommendations.length > 0 && (
				<div className="rounded-panel bg-surface-card border border-border-default p-5 flex flex-col gap-3">
					<div className="flex items-center justify-between">
						<p className="text-title-md font-bold text-text-primary">Recommended for you</p>
						<Link
							href="/explore?view=communities"
							className="text-label-sm text-text-brand hover:underline font-medium"
						>
							View all →
						</Link>
					</div>
					<div className="flex flex-col gap-3">
						{recommendations.map((c) => (
							<Link
								key={c.id}
								href={`/communities/${c.slug}`}
								className="flex gap-3 items-center group"
							>
								<div className="relative size-12 rounded-full overflow-hidden shrink-0 bg-neutral-200 border border-border-default">
									<Image
										src={c.iconUrl}
										alt={c.name}
										fill
										sizes="48px"
										className="object-cover group-hover:scale-105 transition-transform duration-300"
									/>
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-label-sm font-semibold text-text-primary leading-tight truncate">
										{c.name}
									</p>
									<p className="text-caption text-text-muted">
										{c.memberCount.toLocaleString()} members
									</p>
								</div>
							</Link>
						))}
					</div>
				</div>
			)}

			{/* Invite — commented until invite feature is live
			<div className="rounded-panel bg-surface-card border border-border-default p-5 flex flex-col gap-3">
				<div className="flex items-center gap-3">
					<div className="size-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
						<Icon as={GiftSvg} size="md" color="info" />
					</div>
					<div>
						<p className="text-body-sm font-bold text-text-primary">Invite friend, get rewarded</p>
						<p className="text-caption text-text-muted leading-snug">
							Invite your crew and unlock Meetday rewards when they join.
						</p>
					</div>
				</div>
				<Button variant="secondary" size="sm" radius="pill">
					<Icon as={GiftSvg} size="sm" color="inherit" className="mr-1.5" />
					Invite friends
				</Button>
			</div>
			*/}
		</>
	)
}

// ─── Community grid ───────────────────────────────────────────────────────────

function CommunityGrid({ communities }: { communities: PublicCommunity[] }) {
	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
			{communities.map((c) => (
				<CommunityCard key={c.id} community={c} />
			))}
		</div>
	)
}

// ─── Main page ────────────────────────────────────────────────────────────────

function MyCommunitiesPageInner() {
	const { authLoading, user } = useAuthStore()
	const router = useRouter()
	const [joined, setJoined] = useState<PublicCommunity[]>([])
	const [saved, setSaved] = useState<PublicCommunity[]>([])
	const [recommendations, setRecommendations] = useState<PublicCommunity[]>([])
	const [loading, setLoading] = useState(true)
	const [activeTab, setActiveTab] = useState<Tab>("joined")

	useEffect(() => {
		if (authLoading) return

		const load = async () => {
			try {
				const [joinedRes, savedRes] = await Promise.all([
					getJoinedCommunities({ limit: 50 }).catch(() => ({ data: [], total: 0, page: 1, limit: 50 })),
					getSavedCommunities({ limit: 50 }).catch(() => ({ data: [], total: 0, page: 1, limit: 50 })),
				])
				setJoined(joinedRes.data)
				setSaved(savedRes.data)

				if (joinedRes.data.length === 0) {
					getRecommendedCommunities({ limit: 5 })
						.then((res) => setRecommendations(res.data))
						.catch(() => {})
				}
			} finally {
				setLoading(false)
			}
		}
		load()
	}, [authLoading])

	if (authLoading || loading) {
		return (
			<main className="flex-1 flex items-center justify-center py-24">
				<div className="size-8 rounded-full border-2 border-action-primary border-t-transparent animate-spin" />
			</main>
		)
	}

	if (!user) {
		router.replace(`/attendee/login?redirect=${encodeURIComponent("/attendee/my-communities")}`)
		return null
	}

	const hasAny = joined.length > 0 || saved.length > 0

	const tabs: { key: Tab; label: string; count: number }[] = [
		{ key: "joined", label: "Joined", count: joined.length },
		{ key: "saved", label: "Saved", count: saved.length },
	]

	const activeList = activeTab === "joined" ? joined : saved

	return (
		<main className="flex-1 py-6 md:py-8 pb-16">
			<div className="max-w-384 mx-auto px-(--space-page-x-mobile) md:px-(--space-page-x-tablet) lg:px-(--space-page-x-desktop)">
				{/* Header */}
				<div className="mb-6">
					<h1 className="text-heading-md font-extrabold text-text-primary">My Communities</h1>
					<p className="text-body-sm text-text-secondary mt-1">
						Communities you&apos;re part of and ones you&apos;ve saved.
					</p>
				</div>

				{/* Stats */}
				{hasAny && (
					<div className="mb-6">
						<StatsBar joinedCount={joined.length} savedCount={saved.length} />
					</div>
				)}

				{/* Two-column layout */}
				<div className="flex gap-8 items-start">
					{/* Left */}
					<div className="flex-1 min-w-0 flex flex-col gap-4">
						{hasAny ? (
							<>
								{/* Tabs */}
								<div className="flex items-center gap-1 border-b border-border-default">
									{tabs.map((tab) => (
										<button
											key={tab.key}
											type="button"
											onClick={() => setActiveTab(tab.key)}
											className={clsx(
												"relative px-4 py-2.5 text-label-sm font-medium transition-colors",
												activeTab === tab.key
													? "text-text-primary"
													: "text-text-secondary hover:text-text-primary",
											)}
										>
											{tab.label}
											{tab.count > 0 && (
												<span
													className={clsx(
														"ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
														activeTab === tab.key
															? "bg-action-primary text-white"
															: "bg-surface-secondary text-text-muted",
													)}
												>
													{tab.count}
												</span>
											)}
											{activeTab === tab.key && (
												<span className="absolute bottom-0 left-4 right-4 h-0.5 bg-text-brand rounded-full" />
											)}
										</button>
									))}
								</div>

								{/* Tab content */}
								{activeList.length > 0 ? (
									<CommunityGrid communities={activeList} />
								) : (
									<EmptyTabState tab={activeTab} />
								)}
							</>
						) : (
							<EmptyCommunitiesState />
						)}
					</div>

					{/* Right sticky panel */}
					<aside className="hidden lg:flex flex-col gap-4 w-80 shrink-0 sticky top-20">
						<RightPanel recommendations={recommendations} />
					</aside>
				</div>
			</div>
		</main>
	)
}

export default function MyCommunitiesPage() {
	return (
		<Suspense
			fallback={
				<main className="flex-1 flex items-center justify-center py-24">
					<div className="size-8 rounded-full border-2 border-action-primary border-t-transparent animate-spin" />
				</main>
			}
		>
			<MyCommunitiesPageInner />
		</Suspense>
	)
}
