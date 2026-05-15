import Image from "next/image"
import { Icon } from "@/components/ui/Icon"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import ClockCircleSvg from "@/icons/outlined/clock-circle.svg"
import MapPointSvg from "@/icons/outlined/map-point.svg"
import UserSvg from "@/icons/outlined/user.svg"
import type { PublicEventDetails } from "@/types/attendee"

function formatEventDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString("en-IN", {
		weekday: "short",
		day: "numeric",
		month: "short",
		year: "numeric",
	})
}

export function EventHero({ event }: { event: PublicEventDetails }) {
	const cover = event.media.find(m => m.type === "COVER")

	return (
		<div className="relative rounded-card overflow-hidden aspect-16/6 md:aspect-16/5 bg-neutral-200">
			{cover?.url && (
				<Image
					src={cover.url}
					alt={event.title}
					fill
					sizes="(max-width: 768px) 100vw, (max-width: 1280px) 70vw, 900px"
					className="object-cover"
					priority
					loading="eager"
				/>
			)}

			{/* Gradient overlay */}
			<div className="absolute inset-0 bg-linear-to-t from-neutral-950/90 via-neutral-950/30 to-transparent" />

			{/* Top badges */}
			<div className="absolute top-4 left-4 flex flex-wrap gap-2">
				<span className="px-2.5 py-1 rounded-badge bg-action-primary backdrop-blur-sm text-white text-[11px] font-medium tracking-wide uppercase">
					{event.category.name}
				</span>
			</div>

			{/* Bottom content */}
			<div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 flex flex-col gap-2">
				<h1 className="text-2xl md:text-3xl xl:text-4xl font-extrabold text-white leading-tight drop-shadow-sm">
					{event.title}
				</h1>

				<div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-1">
					<div className="flex items-center gap-1.5">
						<Icon as={CalendarSvg} size="sm" color="inverse" />
						<span className="text-body-sm text-white">{formatEventDate(event.eventDate)}</span>
					</div>
					<div className="flex items-center gap-1.5">
						<Icon as={ClockCircleSvg} size="sm" color="inverse" />
						<span className="text-body-sm text-white">
							{event.startTime} – {event.endTime}
						</span>
					</div>
				</div>

				<div className="flex items-start gap-1.5">
					<Icon as={MapPointSvg} size="sm" color="inverse" className="mt-0.5 shrink-0" />
					<span className="text-body-sm text-white/90">
						<span className="font-semibold text-white">{event.venueName}</span>
						{" · "}
						{event.city}
					</span>
				</div>

				<div className="flex items-center gap-1.5">
					<Icon as={UserSvg} size="sm" color="inverse" />
					<span className="text-body-sm text-white/80">
						Hosted by{" "}
						<span className="text-white font-medium">{event.hostProfile.displayName}</span>
					</span>
				</div>
			</div>
		</div>
	)
}
