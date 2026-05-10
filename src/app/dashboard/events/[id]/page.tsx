"use client"

import Link from "next/link"
import { useState } from "react"
import clsx from "clsx"
import { Icon } from "@/components/ui/Icon"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import ClockCircleSvg from "@/icons/outlined/clock-circle.svg"
import MapPointRotateSvg from "@/icons/outlined/map-point-rotate.svg"
import PenSquareSvg from "@/icons/outlined/pen-square.svg"
import AltArrowDownSvg from "@/icons/outlined/alt-arrow-down.svg"
import TrendUpSvg from "@/icons/outlined/trend-up.svg"

// ─── Mock data ─────────────────────────────────────────────────────────────────

const EVENT = {
	title: "Rooftop Social: Strangers & Sunsets",
	category: "Social Vibes",
	date: "9th May 2025",
	startTime: "6:00 PM",
	endTime: "9:00 PM",
	venue: "The Loft, Bandra, Mumbai",
	ticketsSold: 50,
	totalCapacity: 80,
	cover: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
}

const STATS = [
	{
		label: "Total Attendees",
		value: "32",
		sub: "18 unused · 30 posted",
		dark: false,
	},
	{
		label: "Total Revenue",
		value: "₹28,480",
		sub: "₹0.00 – ₹1,000.00 per ticket",
		dark: false,
	},
	{
		label: "Net Payout",
		value: "₹24,208",
		sub: "After platform fees",
		dark: true,
	},
]

const ATTENDEES = [
	{ id: 1, name: "Abha Kapoor", initials: "AK", ticket: "Free", registered: "3 Sep, 12:14 AM", amount: "₹1,999", checkedIn: true },
	{ id: 2, name: "Rahul Mehta", initials: "RM", ticket: "General", registered: "5 Sep, 2:19 AM", amount: "₹745", checkedIn: false },
	{ id: 3, name: "Priya Sharma", initials: "PS", ticket: "General", registered: "6 Sep, 5:22 AM", amount: "₹745", checkedIn: false },
	{ id: 4, name: "Karan Singh", initials: "KS", ticket: "VIP", registered: "6 Sep, 3:11 PM", amount: "₹1,499", checkedIn: true },
	{ id: 5, name: "Neha Joshi", initials: "NJ", ticket: "Free", registered: "7 Sep, 1:40 PM", amount: "₹745", checkedIn: false },
]

const TICKET_COLORS: Record<string, string> = {
	Free: "bg-green-100 text-green-700",
	General: "bg-blue-100 text-blue-700",
	VIP: "bg-purple-100 text-purple-700",
}

const TABS = ["Attendees", "Ticket Breakdown", "Notifications"] as const
type Tab = typeof TABS[number]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventDetailPage() {
	const [activeTab, setActiveTab] = useState<Tab>("Attendees")
	const [search, setSearch] = useState("")
	const [checkedIn, setCheckedIn] = useState<Record<number, boolean>>(
		Object.fromEntries(ATTENDEES.map((a) => [a.id, a.checkedIn])),
	)

	const filtered = ATTENDEES.filter((a) =>
		a.name.toLowerCase().includes(search.toLowerCase()),
	)

	return (
		<div className="flex flex-col min-h-screen">
			{/* Desktop top bar */}
			<div className="hidden lg:flex items-center justify-between px-8 py-4 bg-surface-card border-b border-border-subtle shrink-0">
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
						<Icon as={AltArrowDownSvg} size="sm" color="secondary" />
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 px-6 lg:px-8 py-6 bg-surface-page overflow-y-auto">
				{/* Back link */}
				<Link
					href="/dashboard/events"
					className="inline-flex items-center gap-1.5 text-label-sm text-text-secondary hover:text-text-primary transition-colors mb-5"
				>
					<ArrowLeftIcon />
					Back to my events
				</Link>

				{/* Cover image */}
				<div className="w-full aspect-[3/1] rounded-card overflow-hidden bg-surface-card-muted mb-5">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={EVENT.cover}
						alt={EVENT.title}
						className="w-full h-full object-cover"
					/>
				</div>

				{/* Event header */}
				<div className="mb-5">
					<span className="inline-block text-caption font-semibold px-2.5 py-0.5 rounded-badge bg-red-100 text-red-600 mb-2">
						{EVENT.category}
					</span>
					<h1 className="text-heading-md font-bold text-text-primary mb-3">{EVENT.title}</h1>
					<div className="flex flex-wrap items-center gap-x-5 gap-y-2">
						<span className="flex items-center gap-1.5 text-body-sm text-text-secondary">
							<Icon as={CalendarSvg} size="sm" color="secondary" />
							{EVENT.date}
						</span>
						<span className="flex items-center gap-1.5 text-body-sm text-text-secondary">
							<Icon as={ClockCircleSvg} size="sm" color="secondary" />
							{EVENT.startTime} – {EVENT.endTime}
						</span>
						<span className="flex items-center gap-1.5 text-body-sm text-text-secondary">
							<Icon as={MapPointRotateSvg} size="sm" color="secondary" />
							{EVENT.venue}
						</span>
						<span className="flex items-center gap-1.5 text-body-sm text-text-secondary">
							<PeopleIcon />
							{EVENT.ticketsSold} / {EVENT.totalCapacity} registered
						</span>
					</div>
				</div>

				{/* Action buttons */}
				<div className="flex flex-wrap items-center gap-2 mb-6">
					<button className="flex items-center gap-2 px-4 py-2 bg-action-primary text-white text-label-sm font-semibold rounded-action hover:opacity-90 transition-opacity">
						<Icon as={PenSquareSvg} size="sm" color="inverse" />
						Edit Event
					</button>
					<button className="flex items-center gap-2 px-4 py-2 border border-border-default text-label-sm text-text-primary rounded-action hover:bg-surface-card-muted transition-colors">
						<ShareIcon />
						Share Link
					</button>
					<button className="flex items-center gap-2 px-4 py-2 border border-border-default text-label-sm text-text-primary rounded-action hover:bg-surface-card-muted transition-colors">
						<CancelIcon />
						Cancel Event
					</button>
					<button className="flex items-center gap-2 px-4 py-2 border border-border-default text-label-sm text-text-primary rounded-action hover:bg-surface-card-muted transition-colors">
						<CsvIcon />
						Export CSV
					</button>
				</div>

				{/* Stats cards */}
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
					{STATS.map(({ label, value, sub, dark }) => (
						<div
							key={label}
							className={clsx(
								"rounded-card p-5 flex flex-col gap-1",
								dark
									? "bg-surface-inverse text-text-inverse"
									: "bg-surface-card border border-border-subtle",
							)}
						>
							<p className={clsx("text-caption font-medium", dark ? "text-white/60" : "text-text-secondary")}>
								{label}
							</p>
							<p className={clsx("text-heading-md font-bold", dark ? "text-white" : "text-text-primary")}>
								{value}
							</p>
							<p className={clsx("text-caption", dark ? "text-white/50" : "text-text-muted")}>
								{sub}
							</p>
							{!dark && (
								<div className="flex items-center gap-1 mt-1">
									<Icon as={TrendUpSvg} size="sm" color="success" />
									<span className="text-caption text-text-success font-medium">+12% this week</span>
								</div>
							)}
						</div>
					))}
				</div>

				{/* Attendees section */}
				<div className="bg-surface-card border border-border-subtle rounded-card overflow-hidden">
					{/* Tabs */}
					<div className="flex items-center border-b border-border-subtle px-5 overflow-x-auto">
						{TABS.map((tab) => {
							const isActive = activeTab === tab
							return (
								<button
									key={tab}
									onClick={() => setActiveTab(tab)}
									className={clsx(
										"shrink-0 px-1 py-3.5 mr-6 text-label-sm font-medium border-b-2 transition-colors",
										isActive
											? "border-text-primary text-text-primary"
											: "border-transparent text-text-muted hover:text-text-secondary",
									)}
								>
									{tab}
									{tab === "Attendees" && (
										<span className={clsx(
											"ml-1.5 inline-flex items-center justify-center size-5 rounded-full text-caption font-semibold",
											isActive ? "bg-surface-inverse text-text-inverse" : "bg-surface-card-muted text-text-muted",
										)}>
											{ATTENDEES.length}
										</span>
									)}
								</button>
							)
						})}
					</div>

					{activeTab === "Attendees" && (
						<>
							{/* Table toolbar */}
							<div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border-subtle flex-wrap">
								<div className="flex items-center gap-2 h-9 px-3 rounded-action border border-border-default bg-surface-canvas text-text-muted hover:border-border-strong focus-within:border-border-focused transition-colors w-56">
									<SearchIcon />
									<input
										type="text"
										value={search}
										onChange={(e) => setSearch(e.target.value)}
										placeholder="Search attendees..."
										className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
									/>
								</div>
								<div className="flex items-center gap-2">
									<button className="flex items-center gap-1.5 px-3 py-1.5 border border-border-default rounded-action text-label-sm text-text-primary hover:bg-surface-card-muted transition-colors">
										<CsvIcon />
										Export CSV
									</button>
									<button className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-inverse text-text-inverse rounded-action text-label-sm font-medium hover:opacity-90 transition-opacity">
										<MessageIcon />
										Message All
									</button>
								</div>
							</div>

							{/* Table */}
							<div className="overflow-x-auto">
								<table className="w-full text-left">
									<thead>
										<tr className="border-b border-border-subtle">
											<th className="px-5 py-3 w-10">
												<input type="checkbox" className="rounded" />
											</th>
											<th className="px-4 py-3 text-caption font-semibold text-text-tertiary">Attendee</th>
											<th className="px-4 py-3 text-caption font-semibold text-text-tertiary">Ticket</th>
											<th className="px-4 py-3 text-caption font-semibold text-text-tertiary">Registered</th>
											<th className="px-4 py-3 text-caption font-semibold text-text-tertiary">Amount Paid</th>
											<th className="px-4 py-3 text-caption font-semibold text-text-tertiary">Shown By</th>
											<th className="px-4 py-3 text-caption font-semibold text-text-tertiary">Check-in</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-border-subtle">
										{filtered.map((attendee) => (
											<tr key={attendee.id} className="hover:bg-surface-card-muted transition-colors">
												<td className="px-5 py-3.5">
													<input type="checkbox" className="rounded" />
												</td>
												<td className="px-4 py-3.5">
													<div className="flex items-center gap-2.5">
														<div className="size-8 rounded-avatar bg-surface-brand-soft flex items-center justify-center shrink-0">
															<span className="text-caption font-semibold text-text-brand">{attendee.initials}</span>
														</div>
														<span className="text-label-sm font-medium text-text-primary">{attendee.name}</span>
													</div>
												</td>
												<td className="px-4 py-3.5">
													<span className={clsx("text-caption font-medium px-2 py-0.5 rounded-badge", TICKET_COLORS[attendee.ticket] ?? "bg-surface-card-muted text-text-secondary")}>
														{attendee.ticket}
													</span>
												</td>
												<td className="px-4 py-3.5 text-body-sm text-text-secondary">{attendee.registered}</td>
												<td className="px-4 py-3.5 text-body-sm text-text-primary font-medium">{attendee.amount}</td>
												<td className="px-4 py-3.5">
													<div className="size-7 rounded-avatar bg-surface-card-muted border border-border-default flex items-center justify-center">
														<UserIcon />
													</div>
												</td>
												<td className="px-4 py-3.5">
													<button
														type="button"
														role="switch"
														aria-checked={checkedIn[attendee.id]}
														onClick={() => setCheckedIn((prev) => ({ ...prev, [attendee.id]: !prev[attendee.id] }))}
														className={clsx(
															"relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
															checkedIn[attendee.id] ? "bg-action-primary" : "bg-border-default",
														)}
													>
														<span
															className={clsx(
																"pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200",
																checkedIn[attendee.id] ? "translate-x-4" : "translate-x-0",
															)}
														/>
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							<div className="px-5 py-3 border-t border-border-subtle">
								<p className="text-caption text-text-muted">
									{ATTENDEES.length} attendees shown · Export CSV to see the full list
								</p>
							</div>
						</>
					)}

					{activeTab === "Ticket Breakdown" && (
						<div className="px-5 py-12 flex flex-col items-center justify-center text-center gap-2">
							<p className="text-label-md font-semibold text-text-primary">Ticket Breakdown</p>
							<p className="text-body-sm text-text-muted">Detailed ticket breakdown coming soon.</p>
						</div>
					)}

					{activeTab === "Notifications" && (
						<div className="px-5 py-12 flex flex-col items-center justify-center text-center gap-2">
							<p className="text-label-md font-semibold text-text-primary">Notifications</p>
							<p className="text-body-sm text-text-muted">No notifications yet.</p>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

// ─── Inline icon components ────────────────────────────────────────────────────

function BellIcon() {
	return (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
			<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

function ArrowLeftIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
			<path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

function PeopleIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
			<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

function ShareIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
			<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

function CancelIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
			<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.75" />
			<path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
		</svg>
	)
}

function CsvIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
			<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8L14 2z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

function SearchIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
			<circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.75" />
			<path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
		</svg>
	)
}

function MessageIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
			<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

function UserIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
			<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}
