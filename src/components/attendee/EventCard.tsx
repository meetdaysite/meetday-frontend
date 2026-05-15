"use client"

import Image from "next/image"
import Link from "next/link"
import clsx from "clsx"
import { useEffect, useRef, useState } from "react"
import type { ExploreEvent } from "@/types/attendee"

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

interface EventCardProps {
	event: ExploreEvent
	className?: string
}

export function EventCard({ event, className }: EventCardProps) {
	const isFree = event.startingPrice === 0

	return (
		<Link
			href={`/events/${event.id}`}
			className={clsx(
				"relative flex flex-col overflow-hidden rounded-2xl group cursor-pointer aspect-3/4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
				className,
			)}
		>
			<Image
				src={event.coverImageUrl}
				alt={event.title}
				fill
				sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 20vw"
				className="object-cover transition-transform duration-500 group-hover:scale-105"
			/>

			<div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/60 to-black/10" />
			<div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-black/50 to-transparent" />

			{/* Event type badge */}
			<span className="absolute -top-3.25 -right-3.5 shrink-0 bg-white/10 text-white text-[9px] font-semibold px-2 py-1 uppercase tracking-wide shadow-sm rounded-bl-sm">
				{event.eventType}
			</span>

			<div className="relative z-10 flex flex-col h-full p-3.5">
				<div>
					<p className="text-white text-body-md font-semibold leading-tight drop-shadow">
						{fmtDate(event.eventDate)}
					</p>
					<p className="text-white/60 text-body-sm leading-tight mt-0.5">{event.startTime}</p>
				</div>

				<div className="flex-1" />

				<div className="flex flex-col gap-3">
					<TruncatedTitle
						text={event.title}
						className="text-white font-black text-2xl uppercase leading-tight tracking-tight line-clamp-2 drop-shadow-md max-w-3/4 wrap"
					/>

					<div className="flex flex-col gap-2">
						<span className="self-start bg-white/15 backdrop-blur-sm text-white/90 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/10">
							{event.category.name}
						</span>
						<span className="text-white/55 text-xs truncate">{event.venueName}</span>
					</div>

					<div className="flex items-center justify-end pt-0.5">
						<span className="text-white font-bold text-[11px]">
							{isFree ? "Free" : `₹${event.startingPrice}`}
						</span>
					</div>
				</div>
			</div>
		</Link>
	)
}
