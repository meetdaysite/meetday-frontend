"use client"

import { Suspense, use, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import AltArrowLeftSvg from "@/icons/outlined/alt-arrow-left.svg"
import CheckCircleSvg from "@/icons/filled/check-circle.svg"
import ShieldCheckSvg from "@/icons/filled/shield-check.svg"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import TicketSvg from "@/icons/filled/ticket.svg"
import CopySvg from "@/icons/outlined/copy.svg"
import InfoCircleSvg from "@/icons/filled/info-circle.svg"
import LockSvg from "@/icons/filled/lock.svg"
import StarCircleSvg from "@/icons/filled/star-circle.svg"
import HeadphonesSvg from "@/icons/filled/headphones.svg"
import { getPublicEventDetails } from "@/lib/api"
import { getOrderDetail } from "@/lib/ordersApi"
import { useBookingStore } from "@/store/bookingStore"
import { useAuthStore } from "@/store/authStore"
import { generateICSContent, downloadICS } from "@/lib/icsUtils"
import type { PublicEventDetails } from "@/types/attendee"
import type { OrderDetail } from "@/types/order"
import { EventPreviewBar } from "../_components/EventPreviewBar"
import { TicketQRDisplay } from "../_components/TicketQRDisplay"
import { ConfirmedRightPanel } from "../_components/ConfirmedRightPanel"

interface PageProps {
	params: Promise<{ id: string }>
}

function formatINR(amount: number): string {
	return `₹${amount.toLocaleString("en-IN")}`
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

function ConfirmedContent({ event, order }: { event: PublicEventDetails; order: OrderDetail }) {
	const [copied, setCopied] = useState(false)
	const primaryEmail = order.items[0]?.groupAttendees?.[0]?.email ?? ""

	const firstItem = order.items[0]
	const firstTicket = event.tickets.find(t => t.id === firstItem?.ticketId)
	const qrValue = `MEETDAY:${order.id}:${firstItem?.ticketId ?? ""}:${primaryEmail}`
	const qrDataUrl = firstItem?.qrCodes?.[0]
	const bookingRef = order.bookingRef ?? order.id.slice(0, 12).toUpperCase()

	const handleCopy = () => {
		copyToClipboard(bookingRef)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	const handleAddToCalendar = () => {
		const content = generateICSContent({
			title: event.title,
			date: event.eventDate,
			startTime: event.startTime,
			endTime: event.endTime,
			venueName: event.venueName,
			fullAddress: event.fullAddress,
			description: event.description,
		})
		downloadICS(`${event.title.replace(/\s+/g, "-")}.ics`, content)
	}

	return (
		<main className="flex-1 py-6 md:py-8 pb-12">
			<div className="max-w-384 mx-auto px-(--space-page-x-mobile) md:px-(--space-page-x-tablet) lg:px-(--space-page-x-desktop)">
				{/* Back — above the two-column layout so both columns start at the same height */}
				<Link
					href="/explore"
					className="inline-flex items-center gap-1.5 text-body-sm text-text-primary hover:text-text-primary transition-colors mb-6"
				>
					<Icon as={AltArrowLeftSvg} size="sm" color="primary" />
					Back to events
				</Link>

				<div className="flex gap-8 items-start">
					{/* Left */}
					<div className="flex-1 min-w-0 flex flex-col gap-6">
						{/* ── Main confirmation card ── */}
						<div className="rounded-action border border-border-default bg-surface-card p-6 flex flex-col gap-6">
							{/* Success hero */}
							<div className="flex flex-col items-center text-center gap-4 py-2">
								<div className="size-16 rounded-full bg-green-100 flex items-center justify-center">
									<Icon as={CheckCircleSvg} size="lg" color="success" className="size-8" />
								</div>
								<div>
									<h1 className="text-heading-md font-extrabold text-text-primary">
										You&apos;re In! Your Spot Is Confirmed
									</h1>
									<p className="text-body-sm text-text-secondary mt-1.5 max-w-sm mx-auto leading-relaxed">
										Get ready for an unforgettable night of music, energy and good vibes.
									</p>
								</div>
								<div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-badge bg-green-50 border border-green-200">
									<Icon as={CheckCircleSvg} size="sm" color="success" />
									<span className="text-label-sm font-medium text-icon-success">
										Booking Confirmed
									</span>
									<span className="text-text-muted">•</span>
									<Icon as={ShieldCheckSvg} size="sm" color="success" />
									<span className="text-label-sm font-medium text-icon-success">
										Payment Successful
									</span>
								</div>
							</div>

							{/* Event preview */}
							<EventPreviewBar event={event} />

							{/* Info columns */}
							<div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border-default border border-border-default rounded-action overflow-hidden">
								{/* Your Ticket */}
								<div className="p-5 flex flex-col gap-2">
									<div className="flex items-center gap-1.5 mb-1">
										<Icon as={TicketSvg} size="sm" color="brand" />
										<span className="text-label-sm font-bold text-text-primary uppercase tracking-wide">
											Your Ticket
										</span>
									</div>
									<p className="text-body-md font-bold text-text-primary">
										{firstTicket?.name ?? firstItem?.ticketName ?? "Ticket"}
									</p>
									{firstTicket?.description && (
										<p className="text-label-sm text-text-secondary leading-snug line-clamp-2">
											{firstTicket.description.split("\n")[0]}
										</p>
									)}
								</div>

								{/* Booking ID */}
								<div className="p-5 flex flex-col gap-2">
									<span className="text-label-sm font-bold text-text-primary uppercase tracking-wide mb-1">
										Booking ID
									</span>
									<div className="flex items-center gap-2">
										<span className="text-body-md font-mono font-bold text-text-primary">
											{bookingRef}
										</span>
										<button
											type="button"
											onClick={handleCopy}
											aria-label="Copy booking ID"
											className="flex items-center gap-1 text-text-brand hover:text-text-brand/80 shrink-0 transition-colors"
										>
											<Icon as={CopySvg} size="sm" color="inherit" />
											{copied && <span className="text-caption">Copied!</span>}
										</button>
									</div>
									<div className="flex items-center gap-2 mt-auto pt-1">
										<span className="text-caption text-text-muted">Paid via</span>
										<Image
											src="/assets/razorpay-logo.svg"
											alt="Razorpay"
											width={60}
											height={13}
										/>
										<span className="text-caption font-semibold text-text-secondary">
											{formatINR(order.totalAmount)}
										</span>
									</div>
								</div>

								{/* QR */}
								<div className="p-5 flex flex-col items-center gap-2">
									<div className="flex items-center gap-1.5 self-start mb-1">
										<span className="text-label-sm font-bold text-text-primary uppercase tracking-wide">
											Your Ticket Preview
										</span>
										<Icon as={InfoCircleSvg} size="sm" color="muted" />
									</div>
									<TicketQRDisplay qrDataUrl={qrDataUrl} value={qrValue} size={140} />
									<p className="text-caption text-text-muted text-center leading-snug">
										Scan at the venue entry
									</p>
									{primaryEmail && (
										<p className="text-[10px] text-text-muted text-center leading-snug">
											Full ticket sent to{" "}
											<span className="text-text-brand">{primaryEmail}</span>
										</p>
									)}
								</div>
							</div>

							{/* What's next */}
							{primaryEmail && (
								<div className="flex flex-col gap-0.5">
									<p className="text-label-sm font-semibold text-text-primary">
										What&apos;s next?
									</p>
									<p className="text-label-sm text-text-secondary">
										A confirmation email with your ticket and event details has been sent
										to <span className="text-text-brand font-medium">{primaryEmail}</span>
									</p>
								</div>
							)}

							{/* Action buttons */}
							<div className="flex flex-wrap justify-center gap-3">
								<Link href={`/orders/${order.id}`}>
								<Button
									variant="primary"
									size="md"
									radius="md"
									leftIcon={<Icon as={TicketSvg} size="sm" color="inherit" />}
								>
									View my ticket
								</Button>
							</Link>
								<Button
									variant="secondary"
									size="md"
									radius="md"
									leftIcon={<Icon as={CalendarSvg} size="sm" color="inherit" />}
									onClick={handleAddToCalendar}
								>
									Add to calendar
								</Button>
							</div>

							{/* Secure note */}
							<div className="flex items-center justify-center gap-1.5">
								<Icon as={ShieldCheckSvg} size="sm" color="muted" />
								<span className="text-caption text-text-muted">
									Secure booking. Encrypted and protected.
								</span>
							</div>
						</div>

						{/* Trust footer card */}
						<div className="rounded-action border border-border-default bg-surface-card p-5">
							<div className="grid grid-cols-2 gap-6">
								{TRUST_ITEMS.map(item => (
									<div key={item.title} className="flex gap-4 items-center">
										<div
											className={`size-10 rounded-action ${item.iconBgColor} flex items-center justify-center`}
										>
											<Icon as={item.icon} size="lg" color={item.color} />
										</div>
										<div>
											<p className="text-label-sm font-semibold text-text-primary">
												{item.title}
											</p>
											<p className="text-caption text-text-muted leading-snug">
												{item.body}
											</p>
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

					{/* Right */}
					<aside className="hidden lg:flex flex-col gap-4 w-80 shrink-0 sticky top-20">
						<ConfirmedRightPanel />
					</aside>
				</div>
			</div>
		</main>
	)
}

function ConfirmedPageInner({ id }: { id: string }) {
	const searchParams = useSearchParams()
	const orderId = searchParams.get("orderId")
	const { confirmedOrder, setConfirmedOrder } = useBookingStore()
	const { authLoading } = useAuthStore()

	const [event, setEvent] = useState<PublicEventDetails | null>(null)
	const [order, setOrder] = useState<OrderDetail | null>(confirmedOrder)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		if (authLoading) return

		const fetches: Promise<unknown>[] = [
			getPublicEventDetails(id).then(e => {
				if (e) setEvent(e)
			}),
		]

		if (!confirmedOrder && orderId) {
			fetches.push(
				getOrderDetail(orderId).then(o => {
					setOrder(o)
					setConfirmedOrder(o)
				}),
			)
		}

		Promise.all(fetches).finally(() => setLoading(false))
	}, [id, orderId, confirmedOrder, setConfirmedOrder, authLoading])

	if (loading || !event || !order) {
		return (
			<main className="flex-1 flex items-center justify-center py-24">
				<div className="size-8 rounded-full border-2 border-action-primary border-t-transparent animate-spin" />
			</main>
		)
	}

	return <ConfirmedContent event={event} order={order} />
}

export default function BookingConfirmedPage({ params }: PageProps) {
	const { id } = use(params)
	return (
		<Suspense
			fallback={
				<main className="flex-1 flex items-center justify-center py-24">
					<div className="size-8 rounded-full border-2 border-action-primary border-t-transparent animate-spin" />
				</main>
			}
		>
			<ConfirmedPageInner id={id} />
		</Suspense>
	)
}
