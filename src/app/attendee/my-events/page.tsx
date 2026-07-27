"use client"

import { EventCard } from "@/components/attendee/EventCard"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import { Skeleton } from "@/components/ui/Skeleton"
import { Tabs } from "@/components/ui/Tabs"
import type { TabItem } from "@/components/ui/Tabs"
import BookmarkFilledSvg from "@/icons/filled/bookmark.svg"
import CheckCircleSvg from "@/icons/filled/check-circle.svg"
import HeadphonesSvg from "@/icons/filled/headphones.svg"
import SmileCircleSvg from "@/icons/filled/smile-circle.svg"
import TicketSvg from "@/icons/filled/ticket.svg"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import ClockCircleSvg from "@/icons/outlined/clock-circle.svg"
import CopySvg from "@/icons/outlined/copy.svg"
import MapPointSvg from "@/icons/outlined/map-point.svg"
import { getPublicEventDetails, getPublicEvents, getSavedEvents } from "@/lib/api"
import { parseEventDateTime } from "@/lib/eventDateTime"
import { getMyOrders } from "@/lib/ordersApi"
import { useAuthStore } from "@/store/authStore"
import type { ExploreEvent, PublicEventDetails, SavedEvent } from "@/types/attendee"
import type { MyOrderListItem } from "@/types/order"
import clsx from "clsx"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Suspense, useEffect, useState } from "react"

type Tab = "upcoming" | "past" | "cancelled" | "saved"

function daysFromNow(isoDate: string): number {
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	const event = new Date(isoDate)
	event.setHours(0, 0, 0, 0)
	return Math.round((event.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function formatEventDate(isoDate: string): string {
	return new Date(isoDate).toLocaleDateString("en-IN", {
		weekday: "short",
		day: "numeric",
		month: "short",
		year: "numeric",
	})
}

function formatOrderAmount(amount: string): string {
	const n = parseFloat(amount)
	return isNaN(n) ? "₹0" : `₹${Math.round(n).toLocaleString("en-IN")}`
}

function copyToClipboard(text: string) {
	navigator.clipboard.writeText(text).catch(() => {
		const el = document.createElement("textarea")
		el.value = text
		document.body.appendChild(el)
		el.select()
		document.execCommand("copy")
		document.body.removeChild(el)
	})
}

// ─── My Events card ───────────────────────────────────────────────────────────

function DaysBadge({ days }: { days: number }) {
	if (days > 0) {
		return (
			<span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
				In {days} day{days !== 1 ? "s" : ""}
			</span>
		)
	}
	if (days === 0) {
		return (
			<span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-100 text-red-600 border border-red-200">
				Today
			</span>
		)
	}
	return null
}

// PARTIALLY_REFUNDED still has active tickets — not fully valid, not fully void — so it
// gets its own amber state rather than reading either green Confirmed or red Cancelled.
function isActiveOrderStatus(status: string) {
	return status === "CONFIRMED" || status === "PARTIALLY_REFUNDED"
}

function StatusBadge({ status }: { status: string }) {
	if (status === "CONFIRMED") {
		return (
			<div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-green-50 border border-green-200">
				<Icon as={CheckCircleSvg} size="sm" color="success" />
				<span className="text-label-sm font-semibold text-icon-success">Confirmed</span>
			</div>
		)
	}
	if (status === "PARTIALLY_REFUNDED") {
		return (
			<div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200">
				<span className="text-label-sm font-semibold text-amber-700">Partially Refunded</span>
			</div>
		)
	}
	if (status === "PENDING_PAYMENT") {
		return (
			<div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200">
				<span className="text-label-sm font-semibold text-amber-700">Payment Pending</span>
			</div>
		)
	}
	if (status === "CANCELLED") {
		return (
			<div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 border border-red-200">
				<span className="text-label-sm font-semibold text-red-600">Cancelled</span>
			</div>
		)
	}
	if (status === "REFUNDED") {
		return (
			<div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 border border-red-200">
				<span className="text-label-sm font-semibold text-red-600">Refunded</span>
			</div>
		)
	}
	return (
		<div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-secondary border border-border-default">
			<span className="text-label-sm font-semibold text-text-secondary">{status}</span>
		</div>
	)
}

function MyEventCard({
	order,
	eventDetails,
	tab,
}: {
	order: MyOrderListItem
	eventDetails: PublicEventDetails | null
	tab: "upcoming" | "past" | "cancelled"
}) {
	const [copied, setCopied] = useState(false)
	const router = useRouter()
	const ev = order.event
	const days = daysFromNow(ev.eventDate)
	const isUpcoming = tab === "upcoming"
	const isPast = tab === "past"
	const bookingRef = order.id.slice(0, 12).toUpperCase()

	const coverImageUrl = eventDetails?.media.find((m) => m.type === "COVER")?.url ?? null
	const categoryName = eventDetails?.category.name ?? null
	const hostName = eventDetails?.hostProfile.displayName ?? null
	const tags = eventDetails?.tags ?? []

	// quantity is the originally purchased count; cancelledCount tracks how many of those
	// were later cancelled (relevant for PARTIALLY_REFUNDED orders) — subtract it so the
	// label reflects tickets actually still active, not the original purchase size.
	const totalTickets = order.items.reduce((sum, item) => sum + (item.quantity - (item.cancelledCount ?? 0)), 0)
	const ticketLabel = `${totalTickets} Ticket${totalTickets !== 1 ? "s" : ""}`

	const handleCopy = (e: React.MouseEvent) => {
		e.stopPropagation()
		copyToClipboard(bookingRef)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	return (
		<div className="rounded-action border border-border-default bg-surface-card overflow-hidden flex flex-col shadow-md">
			{/* Main row */}
			<div className="flex min-h-44">
				{/* Cover image */}
				<div className="relative w-44 shrink-0 bg-neutral-900">
					{coverImageUrl && (
						<Image
							src={coverImageUrl}
							alt={ev.title}
							fill
							sizes="176px"
							loading="eager"
							className="object-cover opacity-80"
						/>
					)}
					<div className="absolute inset-0 bg-linear-to-b from-black/50 to-black/20" />
					{/* Category badge */}
					{categoryName && (
						<div className="absolute top-3 left-3 right-3">
							<span className="text-[9px] font-bold text-white uppercase tracking-wide bg-white/20 backdrop-blur-sm px-2 py-1 rounded">
								{categoryName}
							</span>
						</div>
					)}
					{/* Days badge */}
					{isUpcoming && days >= 0 && (
						<div className="absolute bottom-3 left-3">
							<DaysBadge days={days} />
						</div>
					)}
				</div>

				{/* Event info */}
				<div className="flex-1 flex flex-col gap-2.5 p-5 min-w-0">
					<div>
						<h3 className="text-body-lg font-bold text-text-primary leading-tight truncate">
							{ev.title}
						</h3>
						{hostName && (
							<p className="text-label-sm text-text-secondary mt-0.5">
								by{" "}
								<span className="text-text-primary font-medium">{hostName}</span>
								<span className="inline-block size-1.5 rounded-full bg-action-primary ml-1 align-middle" />
							</p>
						)}
					</div>

					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-2">
							<Icon as={CalendarSvg} size="sm" color="muted" className="shrink-0" />
							<span className="text-label-sm text-text-secondary">{formatEventDate(ev.eventDate)}</span>
						</div>
						<div className="flex items-center gap-2">
							<Icon as={ClockCircleSvg} size="sm" color="muted" className="shrink-0" />
							<span className="text-label-sm text-text-secondary">
								{ev.startTime}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<Icon as={MapPointSvg} size="sm" color="muted" className="shrink-0" />
							<span className="text-label-sm text-text-secondary truncate">
								{ev.venueName}, {ev.city}
							</span>
						</div>
					</div>

					{tags.length > 0 && (
						<div className="flex flex-wrap gap-1.5">
							{tags.map((tag) => (
								<span
									key={tag}
									className="text-[11px] font-medium px-2 py-1 rounded-action bg-surface-secondary text-text-vibe border border-violet-200 bg-surface-vibe-soft"
								>
									{tag}
								</span>
							))}
						</div>
					)}
				</div>

				{/* Status column */}
				<div className="w-52 shrink-0 border-l border-border-default flex flex-col gap-3 p-5">
					<StatusBadge status={order.status} />

					<div>
						<p className="text-body-sm font-bold text-text-primary">
							{ticketLabel}{" "}
							<span className="text-text-muted font-normal">•</span>{" "}
							{formatOrderAmount(order.totalAmount)}
						</p>
					</div>

					<div>
						<p className="text-caption text-text-muted mb-0.5">Booking ID</p>
						<div className="flex items-center gap-1.5">
							<span className="text-label-sm font-mono font-bold text-text-brand">
								{bookingRef}
							</span>
							<button
								type="button"
								onClick={handleCopy}
								aria-label="Copy booking ID"
								className="text-text-brand hover:text-text-brand/70 transition-colors"
							>
								<Icon as={CopySvg} size="sm" color="inherit" />
							</button>
							{copied && <span className="text-caption text-text-brand">Copied!</span>}
						</div>
					</div>

					<div className="mt-auto flex flex-col gap-2">
						<Button
							variant="primary"
							size="sm"
							radius="sm"
							leftIcon={<Icon as={TicketSvg} size="sm" color="inherit" />}
							onClick={() => router.push(`/orders/${order.id}`)}
						>
							View Ticket
						</Button>
						{isPast && isActiveOrderStatus(order.status) && (
							<Button
								variant="secondary"
								size="sm"
								radius="sm"
								leftIcon={<Icon as={SmileCircleSvg} size="sm" color="inherit" />}
								onClick={() =>
									router.push(`/events/${order.event.id}/review?orderId=${order.id}`)
								}
							>
								Leave a Review
							</Button>
						)}
					</div>
				</div>
			</div>

			{/* Bottom bar */}
			{isUpcoming && isActiveOrderStatus(order.status) && (
				<div className="flex items-center gap-2 px-5 py-2.5 bg-green-50 border-t border-green-100">
					<Icon as={CheckCircleSvg} size="sm" color="success" />
					<span className="text-label-sm font-medium text-icon-success">
						{"You're all set! Show your QR code at the venue entry."}
					</span>
				</div>
			)}
		</div>
	)
}

// ─── Empty tab state (has orders but current tab is empty) ────────────────────

function EmptyTabState({ tab }: { tab: Tab }) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const msgs: Record<Tab, { title: string; body: string; icon: any }> = {
		upcoming: {
			title: "No upcoming experiences",
			body: "Book your next experience and it'll show up here.",
			icon: TicketSvg,
		},
		past: {
			title: "No attended experiences yet",
			body: "Experiences you've attended will appear here after they happen.",
			icon: TicketSvg,
		},
		cancelled: {
			title: "No cancelled experiences",
			body: "You haven't cancelled any bookings.",
			icon: TicketSvg,
		},
		saved: {
			title: "No saved experiences yet",
			body: "Tap the bookmark on any event to save it here for later.",
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
			{tab !== "cancelled" && (
				<Link href="/explore">
					<Button variant="primary" size="sm" radius="pill">
						Browse Experiences →
					</Button>
				</Link>
			)}
		</div>
	)
}

function EmptyEventsState() {
	const categories = ["Music", "Rooftop", "Wellness", "Art", "Networking", "Food"]
	return (
		<div className="flex flex-col gap-4">
			{/* Hero banner */}
			<div className="rounded-action border border-border-default bg-surface-card overflow-hidden">
				<div className="flex items-stretch min-h-52">
					{/* Illustration side */}
					<div className="relative w-64 shrink-0 overflow-hidden">
						<Image
							src="/assets/attendee/my-events-empty.png"
							alt="Explore events"
							fill
							sizes="256px"
							className="object-cover"
						/>
						<div className="absolute top-4 left-4 right-4 px-2.5 py-1 rounded-action bg-black/30 backdrop-blur-sm border border-white/20">
							<span className="text-[10px] font-semibold text-white">New here? Let&apos;s get you started 🎉</span>
						</div>
					</div>

					{/* Content side */}
					<div className="flex-1 flex flex-col justify-center gap-5 p-8">
						<div>
							<h2 className="text-heading-lg font-black text-text-primary leading-tight">
								Your{" "}
								<span className="text-text-brand">vibe</span>{" "}
								journey starts here
							</h2>
							<p className="text-body-sm text-text-secondary mt-2 leading-relaxed max-w-xs">
								Discover curated events, meet like-minded people, and unlock experiences that match your vibe.
							</p>
						</div>
						<div className="flex flex-col gap-2.5">
							<Link href="/explore">
								<Button variant="primary" size="md" radius="pill" className="w-full justify-center">
									Explore Experiences →
								</Button>
							</Link>
							<Link href="/explore">
								<Button variant="secondary" size="md" radius="pill" className="w-full justify-center">
									Find your vibe →
								</Button>
							</Link>
						</div>
						<div className="flex flex-wrap gap-2">
							{categories.map((cat) => (
								<Link
									key={cat}
									href={`/explore?category=${cat.toLowerCase()}`}
									className="inline-flex items-center gap-1 px-3 py-1 rounded-action border border-border-default bg-surface-secondary text-label-sm text-text-secondary hover:text-text-primary hover:border-border-default transition-colors"
								>
									{cat}
								</Link>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Going with friends — commented until invite feature is live
			<div className="rounded-action border border-border-default bg-surface-card p-4 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<AvatarStack />
					<div>
						<p className="text-body-sm font-bold text-text-primary">Going with friends?</p>
						<p className="text-caption text-text-muted">
							Add friends to your booking and sit, vibe and make memories together.
						</p>
					</div>
				</div>
				<Button variant="secondary" size="sm" radius="pill">
					<Icon as={GiftSvg} size="sm" color="inherit" className="mr-1.5" />
					Invite friends
				</Button>
			</div>
			*/}
		</div>
	)
}

// ─── Right panels ─────────────────────────────────────────────────────────────

function StatsSummaryCard({
	upcomingCount,
	attendedCount,
	savedCount,
}: {
	upcomingCount: number
	attendedCount: number
	savedCount: number
}) {
	const stats = [
		{ label: "Upcoming", value: upcomingCount, icon: TicketSvg, color: "brand" as const, bg: "bg-surface-brand-soft" },
		{ label: "Attended", value: attendedCount, icon: CheckCircleSvg, color: "success" as const, bg: "bg-surface-success-soft" },
		{ label: "Saved", value: savedCount, icon: BookmarkFilledSvg, color: "warning" as const, bg: "bg-amber-50" },
		{ label: "People Met", value: "—", icon: SmileCircleSvg, color: "vibe" as const, bg: "bg-surface-vibe-soft" },
	]
	return (
		<div className="rounded-action bg-surface-card border border-border-default shadow-md p-5 flex flex-col gap-4">
			<p className="text-body-sm font-bold text-text-primary">Your Activity</p>
			<div className="grid grid-cols-2 gap-4">
				{stats.map((s) => (
					<div key={s.label} className="flex items-center gap-2.5 min-w-0">
						<div className={clsx("size-8 rounded-full flex items-center justify-center shrink-0", s.bg)}>
							<Icon as={s.icon} size="sm" color={s.color} />
						</div>
						<div className="min-w-0">
							<p className="text-body-md font-extrabold text-text-primary leading-none">{s.value}</p>
							<p className="text-caption text-text-muted mt-1">{s.label}</p>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

function WithEventsRightPanel({
	upcomingCount,
	attendedCount,
	savedCount,
}: {
	upcomingCount: number
	attendedCount: number
	savedCount: number
}) {
	return (
		<>
			<StatsSummaryCard upcomingCount={upcomingCount} attendedCount={attendedCount} savedCount={savedCount} />

			{/* Need help */}
			<div className="rounded-action bg-surface-card border border-border-default shadow-md p-5 flex flex-col gap-3">
				<div className="flex items-center gap-3">
					<div className="size-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
						<Icon as={HeadphonesSvg} size="md" color="inherit" className="text-red-500" />
					</div>
					<div>
						<p className="text-body-sm font-bold text-text-primary">Need help?</p>
						<p className="text-caption text-text-muted leading-snug">
							Contact support anytime. We are here for you.
						</p>
					</div>
				</div>
				<button
					type="button"
					className="text-label-sm text-text-brand hover:underline font-medium text-left"
				>
					Contact support →
				</button>
			</div>

			{/* Invite — commented until invite feature is live
			<div className="rounded-action bg-surface-card border border-border-default shadow-md p-5 flex flex-col gap-3">
				<div className="flex items-center gap-3">
					<div className="size-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
						<Icon as={GiftSvg} size="md" color="info" />
					</div>
					<div>
						<p className="text-body-sm font-bold text-text-primary">Invite friend, get rewarded</p>
						<p className="text-caption text-text-muted leading-snug">
							Invite your crew and unlock meetday rewards when they join.
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

function EmptyStateRightPanel({ recommendations }: { recommendations: ExploreEvent[] }) {
	return (
		<>
			{/* Good vibes */}
			<div className="rounded-action bg-surface-card border border-border-default shadow-md p-5 flex flex-col gap-4">
				<p className="text-title-md font-bold text-text-primary">Good vibes, great company</p>
				<div className="grid grid-cols-3 gap-3">
					{[
						{ value: "95%", label: "vibe match", sub: "Get matched with the right crowd" },
						{ value: "2.5K+", label: "this week", sub: "People like you are going" },
						{ value: "100+", label: "exclusive perks", sub: "Start booking to unlock rewards" },
					].map((stat) => (
						<div key={stat.label} className="flex flex-col items-center text-center gap-1">
							<span className="text-heading-sm font-extrabold text-text-brand">{stat.value}</span>
							<span className="text-[10px] text-text-muted leading-tight">{stat.sub}</span>
							<span className="text-[10px] font-semibold text-text-secondary">{stat.label}</span>
						</div>
					))}
				</div>
			</div>

			{/* Recommendations */}
			{recommendations.length > 0 && (
				<div className="rounded-action bg-surface-card border border-border-default shadow-md p-5 flex flex-col gap-3">
					<div className="flex items-center justify-between">
						<p className="text-title-md font-bold text-text-primary">Recommended for you</p>
						<Link
							href="/explore"
							className="text-label-sm text-text-brand hover:underline font-medium"
						>
							View all →
						</Link>
					</div>
					<div className="flex flex-col gap-3">
						{recommendations.map((event) => (
							<Link
								key={event.id}
								href={`/events/${event.id}`}
								className="flex gap-3 items-start group"
							>
								<div className="relative size-14 rounded-lg overflow-hidden shrink-0 bg-neutral-200">
									<Image
										src={event.coverImageUrl}
										alt={event.title}
										fill
										sizes="56px"
										className="object-cover group-hover:scale-105 transition-transform duration-300"
									/>
								</div>
								<div className="flex-1 min-w-0">
									<span className="text-[9px] font-bold uppercase tracking-wide text-text-brand">
										{event.category.name}
									</span>
									<p className="text-label-sm font-semibold text-text-primary leading-tight truncate">
										{event.title}
									</p>
									<p className="text-caption text-text-muted truncate">
										{event.venueName}
									</p>
								</div>
							</Link>
						))}
					</div>
				</div>
			)}

			{/* Invite — commented until invite feature is live
			<div className="rounded-action bg-surface-card border border-border-default shadow-md p-5 flex flex-col gap-3">
				<div className="flex items-center gap-3">
					<div className="size-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
						<Icon as={GiftSvg} size="md" color="info" />
					</div>
					<div>
						<p className="text-body-sm font-bold text-text-primary">Invite friend, get rewarded</p>
						<p className="text-caption text-text-muted leading-snug">
							Invite your crew and unlock meetday rewards when they join.
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

// ─── Main page ────────────────────────────────────────────────────────────────

function MyEventsPageInner() {
	const { authLoading, user } = useAuthStore()
	const router = useRouter()
	const [orders, setOrders] = useState<MyOrderListItem[] | null>(null)
	const [eventDetailsMap, setEventDetailsMap] = useState<Map<string, PublicEventDetails | null>>(
		new Map(),
	)
	const [savedEvents, setSavedEvents] = useState<SavedEvent[]>([])
	const [recommendations, setRecommendations] = useState<ExploreEvent[]>([])
	const [loading, setLoading] = useState(true)
	const [activeTab, setActiveTab] = useState<Tab>("upcoming")

	useEffect(() => {
		if (authLoading) return

		const load = async () => {
			try {
				const [allOrders, savedRes] = await Promise.all([
					getMyOrders(),
					getSavedEvents({ limit: 20 }).catch(() => ({ data: [], total: 0, page: 1, limit: 20 })),
				])
				setOrders(allOrders)
				setSavedEvents(savedRes.data)

				const uniqueEventIds = [...new Set(allOrders.map((o) => o.event.id))]
				const detailsArray = await Promise.all(
					uniqueEventIds.map((id) => getPublicEventDetails(id).catch(() => null)),
				)
				const map = new Map<string, PublicEventDetails | null>(uniqueEventIds.map((id, i) => [id, detailsArray[i]]))
				setEventDetailsMap(map)

				if (allOrders.length === 0) {
					getPublicEvents({ limit: 3 }).then((res) => setRecommendations(res.events)).catch(() => {})
				}
			} finally {
				setLoading(false)
			}
		}
		load()
	}, [authLoading])

	if (authLoading || loading) {
		return <MyEventsPageSkeleton />
	}

	if (!user) {
		router.replace(`/attendee/login?redirect=${encodeURIComponent("/attendee/my-events")}`)
		return null
	}

	const allOrders = orders ?? []
	const now = new Date()

	// PARTIALLY_REFUNDED orders still have active tickets, so they bucket with CONFIRMED
	// (upcoming/past) via isActiveOrderStatus; REFUNDED is a terminal/void state, so it
	// buckets with CANCELLED. Without this, PARTIALLY_REFUNDED and REFUNDED orders
	// wouldn't appear in any tab.
	//
	// /orders/me doesn't return the event's endTime, only eventDate + startTime, so this
	// buckets on start time rather than the actual end — the closest available proxy for
	// "has this event happened yet". The order detail page has endTime and gates the
	// review CTA on that instead, so this only governs which tab an order appears in.
	const upcomingOrders = allOrders.filter(
		(o) =>
			isActiveOrderStatus(o.status) && parseEventDateTime(o.event.eventDate, o.event.startTime) >= now,
	)
	const pastOrders = allOrders.filter(
		(o) =>
			isActiveOrderStatus(o.status) && parseEventDateTime(o.event.eventDate, o.event.startTime) < now,
	)
	const cancelledOrders = allOrders.filter((o) => o.status === "CANCELLED" || o.status === "REFUNDED")

	const tabOrders: Record<"upcoming" | "past" | "cancelled", MyOrderListItem[]> = {
		upcoming: upcomingOrders,
		past: pastOrders,
		cancelled: cancelledOrders,
	}
	const filteredOrders = activeTab !== "saved" ? tabOrders[activeTab] : []
	const hasAnyOrders = allOrders.length > 0

	const tabs: { key: Tab; label: string; count: number }[] = [
		{ key: "upcoming", label: "Upcoming", count: upcomingOrders.length },
		{ key: "past", label: "Past", count: pastOrders.length },
		{ key: "cancelled", label: "Cancelled", count: cancelledOrders.length },
		{ key: "saved", label: "Saved", count: savedEvents.length },
	]

	return (
		<main className="flex-1 py-6 md:py-8 pb-16">
			<div className="max-w-384 mx-auto px-(--space-page-x-mobile) md:px-(--space-page-x-tablet) lg:px-(--space-page-x-desktop)">
				{/* Page header */}
				<div className="mb-6">
					<h1 className="text-heading-md font-extrabold text-text-primary">My Experiences</h1>
					<p className="text-body-sm text-text-secondary mt-1">
						All the events you&apos;ve booked or attended.
					</p>
				</div>

				{/* Two-column layout */}
				<div className="flex gap-8 items-start">
					{/* Left */}
					<div className="flex-1 min-w-0 flex flex-col gap-4">
						{/* Tabs — always visible */}
						<Tabs
							items={tabs.map((tab): TabItem<Tab> => ({
								value: tab.key,
								label: tab.label,
								extra: tab.count > 0 && (
									<span
										className={clsx(
											"text-[10px] font-bold px-1.5 py-1 rounded-full",
											activeTab === tab.key
												? "bg-white text-neutral-900"
												: "bg-surface-secondary text-text-muted",
										)}
									>
										{tab.count}
									</span>
								),
							}))}
							value={activeTab}
							onChange={setActiveTab}
							variant="pill"
						/>

						{/* Tab content */}
						{activeTab === "saved" ? (
							savedEvents.length > 0 ? (
								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
									{savedEvents.map((event) => (
										<EventCard key={event.id} event={event} />
									))}
								</div>
							) : (
								<EmptyTabState tab="saved" />
							)
						) : hasAnyOrders ? (
							filteredOrders.length > 0 ? (
								<div className="flex flex-col gap-4">
									{filteredOrders.map((order) => (
										<MyEventCard
											key={order.id}
											order={order}
											eventDetails={eventDetailsMap.get(order.event.id) ?? null}
											tab={activeTab as "upcoming" | "past" | "cancelled"}
										/>
									))}
								</div>
							) : (
								<EmptyTabState tab={activeTab} />
							)
						) : (
							<EmptyEventsState />
						)}
					</div>

					{/* Right sticky panel */}
					<aside className="hidden lg:flex flex-col gap-4 w-80 shrink-0 sticky top-20">
						{hasAnyOrders ? (
							<WithEventsRightPanel
								upcomingCount={upcomingOrders.length}
								attendedCount={pastOrders.length}
								savedCount={savedEvents.length}
							/>
						) : (
							<EmptyStateRightPanel recommendations={recommendations} />
						)}
					</aside>
				</div>
			</div>
		</main>
	)
}

function MyEventsPageSkeleton() {
	return (
		<main className="flex-1 py-6 md:py-8 pb-16">
			<div className="max-w-384 mx-auto px-(--space-page-x-mobile) md:px-(--space-page-x-tablet) lg:px-(--space-page-x-desktop)">
				<div className="mb-6 flex flex-col gap-2">
					<Skeleton.Text className="h-7 w-36" />
					<Skeleton.Text className="w-60" />
				</div>
				<div className="mb-6 flex items-center gap-3 flex-wrap">
					{[...Array(4)].map((_, i) => (
						<Skeleton.Block key={i} className="h-10 w-28 rounded-action" />
					))}
				</div>
				<div className="flex gap-6 pb-2.5 border-b border-border-default mb-4">
					{["w-20", "w-16", "w-24", "w-16"].map((w, i) => (
						<Skeleton.Text key={i} className={`${w} h-4`} />
					))}
				</div>
				<div className="flex flex-col gap-4">
					<Skeleton.Announcement />
					<Skeleton.Announcement />
					<Skeleton.Announcement />
				</div>
			</div>
		</main>
	)
}

export default function MyEventsPage() {
	return (
		<Suspense fallback={<MyEventsPageSkeleton />}>
			<MyEventsPageInner />
		</Suspense>
	)
}
