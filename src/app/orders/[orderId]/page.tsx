"use client"

import { TicketQRDisplay } from "@/app/events/[id]/book/_components/TicketQRDisplay"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import CheckCircleSvg from "@/icons/filled/check-circle.svg"
import HeadphonesSvg from "@/icons/filled/headphones.svg"
import LockSvg from "@/icons/filled/lock.svg"
import RocketSvg from "@/icons/filled/rocket.svg"
import ShieldCheckSvg from "@/icons/filled/shield-check.svg"
import StarCircleSvg from "@/icons/filled/star-circle.svg"
import AltArrowLeftSvg from "@/icons/outlined/alt-arrow-left.svg"
import SmileCircleSvg from "@/icons/filled/smile-circle.svg"
import ArrowDownSvg from "@/icons/outlined/arrow-down.svg"
import CalendarSvg from "@/icons/outlined/calendar.svg"

import ClockCircleSvg from "@/icons/outlined/clock-circle.svg"
import CopySvg from "@/icons/outlined/copy.svg"
import GiftSvg from "@/icons/outlined/gift.svg"
import MapPointSvg from "@/icons/outlined/map-point.svg"
import UserSvg from "@/icons/outlined/user.svg"
import { getPublicEventDetails } from "@/lib/api"
import { getFullOrderDetail } from "@/lib/ordersApi"
import { useAuthStore } from "@/store/authStore"
import type { PublicEventDetails } from "@/types/attendee"
import type { FullOrderDetail } from "@/types/order"
import Image from "next/image"
import Link from "next/link"
import { Suspense, use, useEffect, useState } from "react"

interface PageProps {
	params: Promise<{ orderId: string }>
}

function formatEventDate(isoDate: string): string {
	return new Date(isoDate).toLocaleDateString("en-IN", {
		weekday: "short",
		day: "numeric",
		month: "short",
		year: "numeric",
	})
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

const ENTRY_STEPS = [
	{
		title: "Show your QR code at the entry gate.",
		body: "Digital tickets only. No print required.",
	},
	{
		title: "Arrive early for smooth entry.",
		body: "Doors open 30 minutes before the event starts.",
	},
	{
		title: "Valid ID may be required.",
		body: "Carry a government-issued photo ID.",
	},
	{
		title: "No re-entry allowed.",
		body: "Once you exit, you won't be able to re-enter.",
	},
]

const TRUST_ITEMS = [
	{
		icon: LockSvg,
		color: "brand" as const,
		iconBgColor: "bg-surface-brand-soft",
		title: "100% Secure Payments",
		body: "Powered by Razorpay. Your data is safe.",
	},
	{
		icon: ShieldCheckSvg,
		color: "success" as const,
		iconBgColor: "bg-surface-success-soft",
		title: "Refund Clarity",
		body: "Cancel upto 24h before the event for a full credit. No hassle.",
	},
	{
		icon: StarCircleSvg,
		color: "vibe" as const,
		iconBgColor: "bg-surface-vibe-soft",
		title: "Trusted by Hosts",
		body: "Official tickets. No scams, just good vibes.",
	},
	{
		icon: HeadphonesSvg,
		color: "info" as const,
		iconBgColor: "bg-surface-info-soft",
		title: "Need Help?",
		body: "Contact support anytime, we're here for you.",
		link: "Contact Support →",
	},
]

function AvatarStack({ count = 4 }: { count?: number }) {
	const gradients = [
		"from-purple-400 to-pink-400",
		"from-blue-400 to-cyan-400",
		"from-green-400 to-teal-400",
		"from-orange-400 to-red-400",
	]
	return (
		<div className="flex items-center gap-1.5">
			<div className="flex -space-x-2">
				{[...Array(count)].map((_, i) => (
					<div
						key={i}
						className={`size-7 rounded-full bg-linear-to-br ${gradients[i % gradients.length]} border-2 border-surface-card`}
						style={{ zIndex: count - i }}
					/>
				))}
			</div>
			<span className="text-caption text-text-muted">+24</span>
		</div>
	)
}

function TicketPageContent({
	order,
	eventDetails,
}: {
	order: FullOrderDetail
	eventDetails: PublicEventDetails | null
}) {
	const [copied, setCopied] = useState(false)

	const firstItem = order.items[0]
	const leadAttendee = firstItem?.attendees.find((a) => a.isLead) ?? firstItem?.attendees[0]
	const qrValue = leadAttendee?.ticketCode
		? `MEETDAY:${order.id}:${firstItem?.ticketId}:${leadAttendee.ticketCode}`
		: order.id

	const coverImageUrl =
		eventDetails?.media.find((m) => m.type === "COVER")?.url ?? null

	const handleCopy = () => {
		copyToClipboard(order.bookingId)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	const ev = order.event

	return (
		<main className="flex-1 py-6 md:py-8 pb-12">
			<div className="max-w-384 mx-auto px-(--space-page-x-mobile) md:px-(--space-page-x-tablet) lg:px-(--space-page-x-desktop)">
				<Link
					href="/explore"
					className="inline-flex items-center gap-1.5 text-body-sm text-text-primary hover:text-text-primary transition-colors mb-4"
				>
					<Icon as={AltArrowLeftSvg} size="sm" color="primary" />
					Back to events
				</Link>

				<div className="mb-6">
					<h1 className="text-heading-md font-extrabold text-text-primary">My Ticket</h1>
					<p className="text-body-sm text-text-secondary mt-1">You&apos;re all set! Get ready to vibe.</p>
				</div>

				<div className="flex gap-8 items-start">
					{/* ── Left column ── */}
					<div className="flex-1 min-w-0 flex flex-col gap-5">
						{/* Physical ticket card */}
						<div className="rounded-action overflow-hidden border border-border-default shadow-(--shadow-card) flex min-h-72">
							{/* Left: event image + details */}
							<div className="relative flex-1 bg-neutral-900">
								{coverImageUrl && (
									<Image
										src={coverImageUrl}
										alt={ev.title}
										fill
										className="object-cover opacity-70"
									/>
								)}
								<div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/70 to-black/40" />
								<div className="relative z-10 p-6 h-full flex flex-col justify-between gap-4">
									{/* Category tag */}
									{eventDetails?.category && (
										<div className="flex flex-wrap gap-1.5">
											<span className="text-[10px] font-bold text-white uppercase bg-action-primary/80 backdrop-blur-sm px-2 py-0.5 rounded">
												{eventDetails.category.name}
											</span>
										</div>
									)}

									{/* Event title */}
									<h2 className="text-heading-lg font-black text-white leading-tight flex-1 flex items-center">
										{ev.title}
									</h2>

									{/* Details + attendee */}
									<div className="flex flex-col gap-3">
										<div className="flex flex-col gap-1.5">
											<div className="flex items-center gap-2">
												<Icon as={CalendarSvg} size="sm" color="inherit" className="text-white/70 shrink-0" />
												<span className="text-label-sm text-white/80">
													{formatEventDate(ev.eventDate)}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<Icon as={ClockCircleSvg} size="sm" color="inherit" className="text-white/70 shrink-0" />
												<span className="text-label-sm text-white/80">
													{ev.startTime} – {ev.endTime}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<Icon as={MapPointSvg} size="sm" color="inherit" className="text-white/70 shrink-0" />
												<span className="text-label-sm text-white/80">
													{ev.venueName}, {ev.city}
												</span>
											</div>
										</div>

										{leadAttendee && (
											<div className="border-t border-white/20 pt-3">
												<p className="text-caption text-white/50 mb-1.5">Attendee</p>
												<div className="flex items-center gap-2.5">
													<div className="size-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
														<Icon as={UserSvg} size="sm" color="inherit" className="text-white" />
													</div>
													<span className="text-body-sm font-semibold text-white">
														{leadAttendee.fullName}
													</span>
												</div>
											</div>
										)}
									</div>
								</div>
							</div>

							{/* Dashed divider */}
							<div className="shrink-0 w-0 border-l-2 border-dashed border-gray-300/60 self-stretch" />

							{/* Right: QR + booking info */}
							<div className="w-56 bg-white shrink-0 flex flex-col items-center justify-center gap-5 p-6">
								<div className="w-full flex flex-col gap-0.5">
									<p className="text-caption text-text-muted">Booking ID</p>
									<div className="flex items-center gap-1.5">
										<span className="text-body-sm font-bold text-text-brand font-mono">
											{order.bookingId}
										</span>
										<button
											type="button"
											onClick={handleCopy}
											aria-label="Copy booking ID"
											className="flex items-center gap-1 text-text-brand hover:text-text-brand/80 shrink-0 transition-colors"
										>
											<Icon as={CopySvg} size="sm" color="inherit" />
											{copied && (
												<span className="text-caption text-text-brand">Copied!</span>
											)}
										</button>
									</div>
								</div>

								<TicketQRDisplay value={qrValue} size={160} />

								<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-badge bg-green-50 border border-green-200">
									<Icon as={CheckCircleSvg} size="sm" color="success" />
									<span className="text-label-sm font-medium text-icon-success">
										Ticket Confirmed
									</span>
								</div>
							</div>
						</div>

						{/* Action buttons */}
						<div className="rounded-action border border-border-default bg-surface-card p-5 flex items-center justify-center flex-wrap gap-3">
							<Button
								variant="secondary"
								size="md"
								radius="md"
								leftIcon={<Icon as={ArrowDownSvg} size="sm" color="inherit" />}
							>
								Download
							</Button>
							{order.status === "CONFIRMED" && new Date(order.event.eventDate) < new Date() && (
								<Link href={`/events/${order.eventId}/review?orderId=${order.id}`}>
									<Button
										variant="secondary"
										size="md"
										radius="md"
										leftIcon={<Icon as={SmileCircleSvg} size="sm" color="inherit" />}
									>
										Leave a Review
									</Button>
								</Link>
							)}
						</div>

						{/* Trust footer */}
						<div className="rounded-action border border-border-default bg-surface-card p-5">
							<div className="grid grid-cols-2 gap-6">
								{TRUST_ITEMS.map((item) => (
									<div key={item.title} className="flex gap-4 items-center">
										<div
											className={`size-10 rounded-action ${item.iconBgColor} flex items-center justify-center shrink-0`}
										>
											<Icon as={item.icon} size="lg" color={item.color} />
										</div>
										<div>
											<p className="text-label-sm font-semibold text-text-primary">
												{item.title}
											</p>
											<p className="text-caption text-text-muted leading-snug">{item.body}</p>
											{item.link && (
												<span className="text-caption text-text-brand cursor-pointer hover:underline font-medium">
													{item.link}
												</span>
											)}
										</div>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* ── Right panel ── */}
					<aside className="hidden lg:flex flex-col gap-4 w-80 shrink-0 sticky top-20">
						{/* Entry Instructions */}
						<div className="rounded-panel bg-surface-card border border-border-default p-5 flex flex-col gap-4">
							<div className="flex items-center gap-2">
								<Icon as={RocketSvg} size="md" color="brand" />
								<span className="text-title-md font-bold text-text-primary">Entry Instructions</span>
							</div>
							<div className="flex flex-col gap-3">
								{ENTRY_STEPS.map((step, i) => (
									<div key={i} className="flex items-start gap-3">
										<div className="size-7 rounded-full bg-neutral-900 flex items-center justify-center shrink-0">
											<span className="text-[11px] font-bold text-white">{i + 1}</span>
										</div>
										<div className="pt-0.5">
											<p className="text-label-sm font-semibold text-text-primary leading-snug">
												{step.title}
											</p>
											<p className="text-caption text-text-muted leading-snug mt-0.5">
												{step.body}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Invite friend, get rewarded — commented until invite feature is live
						<div className="rounded-panel bg-surface-card border border-border-default p-5 flex flex-col gap-3">
							<div className="flex items-center gap-3">
								<div className="size-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
									<Icon as={GiftSvg} size="md" color="info" />
								</div>
								<div>
									<p className="text-body-sm font-bold text-text-primary">
										Invite friend, get rewarded
									</p>
									<p className="text-caption text-text-muted leading-snug">
										Invite your crew and unlock meetday rewards when they join.
									</p>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<AvatarStack />
								<button
									type="button"
									className="inline-flex items-center gap-1.5 h-(--size-action-sm) px-3 rounded-action border border-border-default text-label-sm text-text-primary hover:bg-surface-secondary transition-colors"
								>
									<Icon as={GiftSvg} size="sm" color="inherit" />
									Invite friends
								</button>
							</div>
						</div>
						*/}

						{/* Refund reference */}
						<div className="rounded-panel bg-surface-card border border-border-default p-5 flex flex-col gap-3">
							<div className="flex items-center gap-3">
								<div className="size-9 rounded-full bg-surface-brand-soft flex items-center justify-center shrink-0">
									<Icon as={ShieldCheckSvg} size="md" color="brand" />
								</div>
								<div>
									<p className="text-body-sm font-bold text-text-primary">Refund reference</p>
									<p className="text-caption text-text-muted leading-snug">
										Cancel up to 24h before the event for a full credit. No hassle. No
										questions.
									</p>
								</div>
							</div>
							<button
								type="button"
								className="text-label-sm text-text-brand hover:underline font-medium text-left"
							>
								View refund policy →
							</button>
						</div>
					</aside>
				</div>
			</div>
		</main>
	)
}

function TicketPageInner({ orderId }: { orderId: string }) {
	const { authLoading } = useAuthStore()
	const [order, setOrder] = useState<FullOrderDetail | null>(null)
	const [eventDetails, setEventDetails] = useState<PublicEventDetails | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (authLoading) return

		getFullOrderDetail(orderId)
			.then((o) => {
				setOrder(o)
				return getPublicEventDetails(o.eventId).then((ev) => {
					if (ev) setEventDetails(ev)
				})
			})
			.catch((err) => {
				setError(err instanceof Error ? err.message : "Failed to load ticket.")
			})
			.finally(() => setLoading(false))
	}, [orderId, authLoading])

	if (loading) {
		return (
			<main className="flex-1 flex items-center justify-center py-24">
				<div className="size-8 rounded-full border-2 border-action-primary border-t-transparent animate-spin" />
			</main>
		)
	}

	if (error || !order) {
		return (
			<main className="flex-1 flex items-center justify-center py-24">
				<div className="text-center flex flex-col items-center gap-3">
					<p className="text-heading-sm font-bold text-text-primary">Ticket not found</p>
					<p className="text-body-sm text-text-secondary">
						{error ?? "We couldn't find this ticket."}
					</p>
					<Link
						href="/explore"
						className="text-label-sm text-text-brand hover:underline font-medium"
					>
						← Back to events
					</Link>
				</div>
			</main>
		)
	}

	return <TicketPageContent order={order} eventDetails={eventDetails} />
}

export default function MyTicketPage({ params }: PageProps) {
	const { orderId } = use(params)
	return (
		<Suspense
			fallback={
				<main className="flex-1 flex items-center justify-center py-24">
					<div className="size-8 rounded-full border-2 border-action-primary border-t-transparent animate-spin" />
				</main>
			}
		>
			<TicketPageInner orderId={orderId} />
		</Suspense>
	)
}
