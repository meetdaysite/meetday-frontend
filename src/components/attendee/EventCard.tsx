import Image from "next/image"
import Link from "next/link"
import clsx from "clsx"
import type { AttendeeEventCard } from "@/types/attendee"

function fmtDate(s: string) {
	const d = new Date(s)
	return d.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })
}

function fmtTime(t: string) {
	const [h, m] = t.split(":").map(Number)
	return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`
}

interface EventCardProps {
	event: AttendeeEventCard
	className?: string
}

export function EventCard({ event, className }: EventCardProps) {
	return (
		<Link
			href={`/events/${event.id}`}
			className={clsx(
				"relative flex flex-col overflow-hidden rounded-xl group cursor-pointer aspect-[3/4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-1",
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

			{/* Gradient overlay */}
			<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/5" />

			{/* Content */}
			<div className="relative z-10 flex flex-col h-full p-3">
				{/* Top: date + badge */}
				<div className="flex items-start justify-between gap-1">
					<div>
						<p className="text-white text-[10px] font-semibold leading-snug drop-shadow">
							{fmtDate(event.date)}
						</p>
						<p className="text-white/70 text-[10px] leading-snug">{fmtTime(event.time)}</p>
					</div>
					{event.isTrending && (
						<span className="shrink-0 bg-amber-400/90 text-amber-900 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
							Trending
						</span>
					)}
					{!event.isTrending && event.isNew && (
						<span className="shrink-0 bg-emerald-400/90 text-emerald-900 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
							New
						</span>
					)}
				</div>

				<div className="flex-1" />

				{/* Bottom: title + meta */}
				<div>
					<h3 className="text-white font-bold text-sm uppercase leading-tight tracking-tight line-clamp-2 mb-1 drop-shadow">
						{event.title}
					</h3>
					<p className="text-white/55 text-[10px] mb-1.5 truncate">{event.category}</p>
					<div className="flex items-center justify-between">
						<span className="text-white/65 text-[10px]">{event.attendeeCount} going</span>
						<span className="text-white font-semibold text-[11px]">
							{event.price === null ? "Free" : `₹${event.price}`}
						</span>
					</div>
				</div>
			</div>
		</Link>
	)
}
