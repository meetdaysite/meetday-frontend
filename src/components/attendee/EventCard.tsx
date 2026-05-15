"use client"

import Image from "next/image"
import Link from "next/link"
import clsx from "clsx"
import { useEffect, useRef, useState } from "react"
import type { AttendeeEventCard } from "@/types/attendee"
// import MapSvg from "@/icons/outlined/map-point.svg"
// import { Icon } from "../ui/Icon"

// ---------------------------------------------------------------------------
// TruncatedTitle — shows a tooltip only when line-clamp cuts the text
// ---------------------------------------------------------------------------

interface TruncatedTitleProps {
	text: string
	className?: string
}

function TruncatedTitle({ text, className }: TruncatedTitleProps) {
	const ref = useRef<HTMLHeadingElement>(null)
	const [isClamped, setIsClamped] = useState(false)
	const [show, setShow] = useState(false)

	useEffect(() => {
		const el = ref.current
		if (!el) return
		setIsClamped(el.scrollHeight > el.clientHeight)
	}, [text])

	return (
		<div className="relative">
			<h3
				ref={ref}
				className={className}
				onMouseEnter={() => isClamped && setShow(true)}
				onMouseLeave={() => setShow(false)}
			>
				{text}
			</h3>
			{show && (
				<div
					className="absolute bottom-[calc(100%+6px)] left-0 right-0 z-50 pointer-events-none px-2.5 py-1.5 rounded-chip text-label-sm text-text-inverse shadow-floating"
					style={{ background: "rgba(15,15,20,0.93)", backdropFilter: "blur(6px)" }}
				>
					{text}
				</div>
			)}
		</div>
	)
}

function fmtDate(s: string) {
	const d = new Date(s)
	return d.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })
}

function fmtTime(t: string) {
	const [h, m] = t.split(":").map(Number)
	return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`
}

// Deterministic placeholder avatars using a seeded hue from index
const AVATAR_COLORS = ["#e05252", "#6c8ee0", "#52c4a0", "#e0a052", "#9b52e0", "#52a0e0", "#e07a52", "#52e07a"]

interface AvatarStackProps {
	count: number
	show?: number
}

function AvatarStack({ count, show = 3 }: AvatarStackProps) {
	const extra = count - show
	return (
		<div className="flex items-center">
			{Array.from({ length: Math.min(show, count) }).map((_, i) => (
				<div
					key={i}
					className="w-6 h-6 rounded-full border-2 border-white/20 flex items-center justify-center text-white text-[8px] font-bold -ml-2 first:ml-0 shrink-0"
					style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length], zIndex: show - i }}
				>
					{String.fromCharCode(65 + i)}
				</div>
			))}
			{extra > 0 && <span className="ml-1 text-white/70 text-[10px] font-semibold">+{extra}</span>}
		</div>
	)
}

interface EventCardProps {
	event: AttendeeEventCard
	className?: string
}

export function EventCard({ event, className }: EventCardProps) {
	const categoryLabel = event.genre ?? event.category

	return (
		<Link
			href={`/events/${event.id}`}
			className={clsx(
				"relative flex flex-col overflow-hidden rounded-2xl group cursor-pointer aspect-3/4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
				className,
			)}
		>
			{/* Cover image */}
			<Image
				src={event.cover}
				alt={event.title}
				fill
				sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 20vw"
				className="object-cover transition-transform duration-500 group-hover:scale-105"
			/>

			{/* Gradient overlays */}
			<div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/60 to-black/10" />
			<div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-black/50 to-transparent" />

			{/* Content */}
			<div className="relative z-10 flex flex-col h-full p-3.5">
				{/* Top row: date/time + badge */}
				<div className="relative flex items-start justify-between gap-1">
					<div>
						<p className="text-white text-body-md font-semibold leading-tight drop-shadow">
							{fmtDate(event.date)}
						</p>
						<p className="text-white/60 text-body-sm leading-tight mt-0.5">
							{fmtTime(event.time)}
						</p>
					</div>

					{event.isTrending && (
						<span className="absolute -top-3.25 -right-3.5 shrink-0 bg-white/10 text-white text-[9px] font-semibold px-2 py-1 uppercase tracking-wide shadow-sm rounded-bl-sm">
							Trending
						</span>
					)}
					{!event.isTrending && event.isNew && (
						<span className="absolute -top-3.25 -right-3.5 shrink-0 bg-white/10 text-white text-[9px] font-semibold px-2 py-1 uppercase tracking-wide shadow-sm rounded-bl-sm">
							New
						</span>
					)}
				</div>

				<div className="flex-1" />

				{/* Bottom info block */}
				<div className="flex flex-col gap-3">
					{/* Title */}
					<TruncatedTitle
						text={event.title}
						className="text-white font-black text-2xl uppercase leading-tight tracking-tight line-clamp-2 drop-shadow-md max-w-3/4 wrap"
					/>

					{/* Category chip + location */}
					<div className="flex flex-col gap-2">
						<span className="self-start bg-white/15 backdrop-blur-sm text-white/90 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/10">
							{categoryLabel}
						</span>
						<div className="flex gap-1 text-white/55 text-xs">
							{/* <Icon as={MapSvg} size="sm" /> */}
							<span>
								{event.venue}, {event.city.split(",")[0]}
							</span>
						</div>
					</div>

					{/* Attendees row */}
					<div className="flex items-center justify-between pt-0.5">
						<AvatarStack count={event.attendeeCount} show={3} />
						<span className="text-white font-bold text-[11px]">
							{event.price === null ? "Free" : `₹${event.price}`}
						</span>
					</div>
				</div>
			</div>
		</Link>
	)
}
