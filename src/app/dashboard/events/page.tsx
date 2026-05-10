"use client"

import Link from "next/link"
import { Icon } from "@/components/ui/Icon"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import MapPointRotateSvg from "@/icons/outlined/map-point-rotate.svg"
import TicketSvg from "@/icons/outlined/ticket.svg"
import AltArrowRightSvg from "@/icons/outlined/alt-arrow-right.svg"

const MOCK_EVENTS = [
	{
		id: "rooftop-social-strangers-sunsets",
		title: "Rooftop Social: Strangers & Sunsets",
		category: "Social Vibes",
		date: "9th May 2025",
		time: "6:00 PM – 9:00 PM",
		venue: "The Loft, Bandra, Mumbai",
		ticketsSold: 50,
		totalCapacity: 80,
		revenue: "₹28,480",
		cover: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
		status: "live" as const,
	},
	{
		id: "jazz-nights-downtown",
		title: "Jazz Nights Downtown",
		category: "Music",
		date: "22nd May 2025",
		time: "8:00 PM – 11:00 PM",
		venue: "Blue Note Lounge, Colaba, Mumbai",
		ticketsSold: 34,
		totalCapacity: 60,
		revenue: "₹17,340",
		cover: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&q=80",
		status: "live" as const,
	},
	{
		id: "startup-mixer-worli",
		title: "Startup Mixer – Worli Edition",
		category: "Business",
		date: "1st Jun 2025",
		time: "5:00 PM – 8:00 PM",
		venue: "WeWork BKC, Mumbai",
		ticketsSold: 12,
		totalCapacity: 100,
		revenue: "₹5,988",
		cover: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80",
		status: "upcoming" as const,
	},
]

const STATUS_STYLES = {
	live: "bg-green-100 text-green-700",
	upcoming: "bg-blue-100 text-blue-700",
	ended: "bg-surface-card-muted text-text-muted",
}

export default function MyEventsPage() {
	return (
		<div className="flex flex-col min-h-screen">
			<div className="hidden lg:flex items-center justify-between px-8 py-4 bg-surface-card border-b border-border-subtle">
				<p className="text-body-sm text-text-secondary">
					Welcome to <span className="font-semibold text-text-primary">Meetday</span>
				</p>
				<div className="flex items-center gap-3">
					<button className="relative p-2 rounded-action hover:bg-surface-card-muted transition-colors" aria-label="Notifications">
						<BellIcon />
						<span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-action-primary" />
					</button>
					<div className="flex items-center gap-2 cursor-pointer hover:bg-surface-card-muted px-2 py-1.5 rounded-action transition-colors">
						<div className="size-8 rounded-avatar bg-surface-brand-soft flex items-center justify-center">
							<span className="text-label-sm font-semibold text-text-brand">AM</span>
						</div>
						<span className="text-label-md text-text-primary">Alex Morgan</span>
						<ChevronDownIcon />
					</div>
				</div>
			</div>

			<div className="flex-1 px-6 lg:px-8 py-8 bg-surface-page">
				<div className="max-w-5xl">
					<div className="mb-6">
						<h1 className="text-heading-sm font-semibold text-text-primary">My Events</h1>
						<p className="text-body-sm text-text-secondary mt-1">Manage and track all your hosted experiences.</p>
					</div>

					<div className="flex flex-col gap-4">
						{MOCK_EVENTS.map((event) => (
							<Link
								key={event.id}
								href={`/dashboard/events/${event.id}`}
								className="flex gap-5 bg-surface-card border border-border-subtle rounded-card p-4 hover:border-border-strong transition-colors group"
							>
								<div className="w-32 h-20 rounded-card overflow-hidden shrink-0 bg-surface-card-muted">
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img src={event.cover} alt={event.title} className="w-full h-full object-cover" />
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-start justify-between gap-3">
										<div>
											<span className={`inline-block text-caption font-medium px-2 py-0.5 rounded-badge ${STATUS_STYLES[event.status]} mb-1`}>
												{event.status === "live" ? "Live" : event.status === "upcoming" ? "Upcoming" : "Ended"}
											</span>
											<h2 className="text-label-md font-semibold text-text-primary group-hover:text-text-brand transition-colors">{event.title}</h2>
										</div>
										<Icon as={AltArrowRightSvg} size="md" color="muted" className="shrink-0 mt-1 group-hover:text-text-brand transition-colors" />
									</div>
									<div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
										<span className="flex items-center gap-1.5 text-caption text-text-secondary">
											<Icon as={CalendarSvg} size="sm" color="secondary" />
											{event.date}
										</span>
										<span className="flex items-center gap-1.5 text-caption text-text-secondary">
											<Icon as={MapPointRotateSvg} size="sm" color="secondary" />
											{event.venue}
										</span>
										<span className="flex items-center gap-1.5 text-caption text-text-secondary">
											<Icon as={TicketSvg} size="sm" color="secondary" />
											{event.ticketsSold}/{event.totalCapacity} registered
										</span>
									</div>
								</div>
								<div className="hidden sm:flex flex-col items-end justify-center shrink-0">
									<p className="text-label-md font-semibold text-text-primary">{event.revenue}</p>
									<p className="text-caption text-text-muted">Revenue</p>
								</div>
							</Link>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}

function BellIcon() {
	return (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
			<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

function ChevronDownIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
			<path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}
