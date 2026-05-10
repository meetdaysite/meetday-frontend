
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"

import BellSvg from "@/icons/outlined/bell.svg"
import FileTextSvg from "@/icons/outlined/file-text.svg"
import ClockCircleSvg from "@/icons/outlined/clock-circle.svg"
import StarSvg from "@/icons/outlined/star.svg"
import TrendUpSvg from "@/icons/outlined/trend-up.svg"
import TrendDownSvg from "@/icons/outlined/trend-down.svg"
import MapPointRotateSvg from "@/icons/outlined/map-point-rotate.svg"
import CalendarOutSvg from "@/icons/outlined/calendar.svg"
import GalleryWideSvg from "@/icons/outlined/gallery-wide.svg"
import TicketSvg from "@/icons/outlined/ticket.svg"
import Checklist2Svg from "@/icons/outlined/checklist-2.svg"
import UserSvg from "@/icons/outlined/user.svg"
import UsersGroupSvg from "@/icons/outlined/users-group.svg"
import DollarSvg from "@/icons/outlined/dollar.svg"
import CheckCircleFillSvg from "@/icons/filled/check-circle.svg"
import PlaneSvg from "@/icons/outlined/plane.svg"
import CloseCircleSvg from "@/icons/outlined/close-circle.svg"
import SettingsSvg from "@/icons/outlined/settings.svg"
import AltArrowDownSvg from "@/icons/outlined/alt-arrow-down.svg"
import AltArrowRightSvg from "@/icons/outlined/alt-arrow-right.svg"

// ─── Data ─────────────────────────────────────────────────────────────────────

const SUMMARY_STATS = [
	{ count: 12, label: "Draft", subtitle: "Continue creating", arrow: true, icon: FileTextSvg, iconColor: "inherit" as const, bg: "bg-neutral-100" },
	{ count: 5, label: "Under Review", subtitle: "Awaiting approval", arrow: true, icon: ClockCircleSvg, iconColor: "info" as const, bg: "bg-blue-100" },
	{ count: 23, label: "Published", subtitle: "Live and online", arrow: true, icon: PlaneSvg, iconColor: "success" as const, bg: "bg-status-success-bg" },
	{ count: 18, label: "Completed", subtitle: "Events finished", arrow: true, icon: Checklist2Svg, iconColor: "inverse" as const, bg: "bg-neutral-800" },
	{ count: 3, label: "Cancelled", subtitle: "Not active", arrow: false, icon: CloseCircleSvg, iconColor: "brand" as const, bg: "bg-red-100" },
]

const EVENTS = [
	{
		id: 1,
		name: "Summer Music Festival",
		location: "Austin, TX",
		date: "Jun 21–23, 2025",
		dateNote: "3 days",
		status: "Published" as const,
		registrations: 1248,
		revenue: 24580,
		color: "bg-[#F97316]",
	},
	{
		id: 2,
		name: "Tech Innovators Summit",
		location: "Chicago, IL",
		date: "Jul 15, 2025",
		dateNote: "1 day",
		status: "Under Review" as const,
		registrations: 312,
		revenue: 8040,
		color: "bg-[#6366F1]",
	},
	{
		id: 3,
		name: "Wellness Retreat",
		location: "Sedona, AZ",
		date: "Aug 8–10, 2025",
		dateNote: "3 days",
		status: "Draft" as const,
		registrations: null,
		revenue: 0,
		color: "bg-[#10B981]",
	},
	{
		id: 4,
		name: "Night Market Experience",
		location: "Brooklyn, NY",
		date: "Sep 2–4, 2025",
		dateNote: "3 days",
		status: "Completed" as const,
		registrations: 2349,
		revenue: 18100,
		color: "bg-[#8B5CF6]",
	},
	{
		id: 5,
		name: "Food & Culture Fest",
		location: "Atlanta, GA",
		date: "Sep 13–16, 2025",
		dateNote: "4 days",
		status: "Cancelled" as const,
		registrations: null,
		revenue: 0,
		color: "bg-[#EC4899]",
	},
]

const OVERVIEW_STATS = [
	{ label: "Total Events", value: "33", trend: "+12%", up: true, icon: CalendarOutSvg, iconColor: "inherit" as const, bg: "bg-red-100", textColor: "text-red-500", note: "vs last month" },
	{ label: "Live Registrations", value: "3,905", trend: "+18%", up: true, icon: UsersGroupSvg, iconColor: "info" as const, bg: "bg-blue-100", textColor: "", note: "vs last 3 days" },
	{ label: "Revenue (USD)", value: "$51,620", trend: "+24%", up: true, icon: DollarSvg, iconColor: "success" as const, bg: "bg-green-100", textColor: "", note: "vs last month" },
	{ label: "Attendee Satisfaction", value: "4.7 / 5", trend: "+0.3", up: true, icon: StarSvg, iconColor: "inherit" as const, bg: "bg-yellow-100", textColor: "text-yellow-500", note: "vs last month" },
]

const CREATE_STEPS = [
	{ step: 1, title: "Basic Info", subtitle: "Tell us about your event", icon: FileTextSvg, iconColor: "inherit" as const, bg: "bg-orange-100", numColor: "text-orange-500" },
	{ step: 2, title: "Date & Location", subtitle: "When and where it happens", icon: MapPointRotateSvg, iconColor: "info" as const, bg: "bg-blue-100", numColor: "text-blue-500" },
	{ step: 3, title: "Media Upload", subtitle: "Add photos, videos, and more", icon: GalleryWideSvg, iconColor: "vibe" as const, bg: "bg-purple-100", numColor: "text-purple-500" },
	{ step: 4, title: "Ticket Types", subtitle: "Set pricing and ticket options", icon: TicketSvg, iconColor: "inherit" as const, bg: "bg-yellow-100", numColor: "text-yellow-600" },
	{ step: 5, title: "Setting & Review", subtitle: "Review and publish", icon: SettingsSvg, iconColor: "success" as const, bg: "bg-green-100", numColor: "text-green-600" },
]

const NOTIFICATIONS = [
	{ text: "Summer Music Festival was approved and is now live.", time: "7m ago", icon: CheckCircleFillSvg, color: "success" as const },
	{ text: "Tech Innovators Summit is under review.", time: "45m ago", icon: ClockCircleSvg, color: "info" as const },
	{ text: "Food & Culture Fest was rejected.", time: "1hr ago", icon: CloseCircleSvg, color: "warning" as const },
	{ text: "New registration for Summer Music Festival.", time: "3hr ago", icon: UserSvg, color: "secondary" as const },
	{ text: "Payout of $4,320 was sent to your account.", time: "5hr ago", icon: DollarSvg, color: "success" as const },
]

// ─── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES = {
	Published: "bg-status-success-bg text-status-success-text",
	"Under Review": "bg-status-trending-bg text-status-trending-text",
	Draft: "bg-surface-card-muted text-text-secondary",
	Completed: "bg-surface-inverse text-text-inverse",
	Cancelled: "bg-status-error-bg text-status-error-text",
} as const

type EventStatus = keyof typeof STATUS_STYLES

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
	return (
		<div className="flex flex-col">
			{/* Desktop page header */}
			<div className="hidden lg:flex items-center justify-between px-8 py-4 bg-surface-card border-b border-border-subtle">
				<p className="text-body-sm text-text-secondary">
					Welcome to <span className="font-semibold text-text-primary">Meetday</span>
				</p>
				<div className="flex items-center gap-3">
					<button className="relative p-2 rounded-action hover:bg-surface-card-muted transition-colors" aria-label="Notifications">
						<Icon as={BellSvg} size="md" color="secondary" />
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

			{/* Hero */}
			<div className="relative px-6 lg:px-8 pt-8 pb-6 overflow-hidden">
				{/* Decorative dot grid */}
				<div
					className="absolute top-0 right-0 w-48 h-48 opacity-30 pointer-events-none"
					style={{
						backgroundImage: "radial-gradient(circle, var(--color-border-default) 1.5px, transparent 1.5px)",
						backgroundSize: "16px 16px",
					}}
					aria-hidden
				/>

				<h1 className="text-heading-sm lg:text-heading-md font-semibold text-text-primary max-w-xl leading-tight">
					Create and manage experiences{" "}
					<span className="text-text-brand">that people remember.</span>
				</h1>
				<p className="text-body-sm text-text-secondary mt-2 mb-6">
					Everything you need to build, publish and grow unforgettable events.
				</p>

				{/* Summary stats row */}
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
					{SUMMARY_STATS.map(({ count, label, subtitle, arrow, icon, iconColor, bg }) => (
						<button
							key={label}
							className={`flex gap-4 items-center p-4 rounded-card border border-border-subtle bg-surface-card shadow-card hover:shadow-card-hover transition-shadow text-left`}
						>
							<div className={`size-10 rounded-badge flex items-center justify-center ${bg}`}>
								<Icon as={icon} size="lg" color={iconColor} />
							</div>
							<div>
								<p className="text-title-md font-semibold text-text-primary">{count}</p>
								<p className="text-label-sm text-text-primary font-medium">{label}</p>
								<p className="text-caption text-text-tertiary mt-0.5 flex items-center gap-0.5">
										{subtitle}
										{arrow && <AltArrowRightSvg className="size-3" aria-hidden />}
									</p>
							</div>
						</button>
					))}
				</div>
			</div>

			{/* Body */}
			<div className="px-6 lg:px-8 pb-10 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
				{/* Left column */}
				<div className="flex flex-col gap-6 min-w-0">
					{/* My Events */}
					<div className="bg-surface-card rounded-card border border-border-subtle shadow-card overflow-hidden">
						<div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
							<h2 className="text-label-md font-semibold text-text-primary">My Events</h2>
							<a href="/dashboard/events" className="text-label-sm text-text-brand hover:underline inline-flex items-center gap-1">
								View All Events
								<AltArrowRightSvg className="size-3.5" aria-hidden />
							</a>
						</div>

						<div className="overflow-x-auto">
							<table className="w-full min-w-160">
								<thead>
									<tr className="border-b border-border-subtle">
										<th className="text-left text-caption text-text-tertiary font-medium px-5 py-3">EVENT NAME</th>
										<th className="text-left text-caption text-text-tertiary font-medium px-4 py-3">DATE</th>
										<th className="text-left text-caption text-text-tertiary font-medium px-4 py-3">STATUS</th>
										<th className="text-left text-caption text-text-tertiary font-medium px-4 py-3">REGISTRATIONS</th>
										<th className="text-left text-caption text-text-tertiary font-medium px-4 py-3">REVENUE</th>
										<th className="text-left text-caption text-text-tertiary font-medium px-4 py-3">ACTIONS</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border-subtle">
									{EVENTS.map((event) => (
										<tr key={event.id} className="hover:bg-surface-card-muted transition-colors">
											<td className="px-5 py-3.5">
												<div className="flex items-center gap-3">
													<div className={`size-10 rounded-image shrink-0 ${event.color}`} />
													<div>
														<p className="text-label-sm font-medium text-text-primary leading-tight">{event.name}</p>
														<p className="text-caption text-text-tertiary">{event.location}</p>
													</div>
												</div>
											</td>
											<td className="px-4 py-3.5">
												<p className="text-label-sm text-text-primary">{event.date}</p>
												<p className="text-caption text-text-tertiary">{event.dateNote}</p>
											</td>
											<td className="px-4 py-3.5">
												<span className={`inline-flex items-center px-2.5 py-1 rounded-badge text-caption font-medium ${STATUS_STYLES[event.status as EventStatus]}`}>
													{event.status}
												</span>
											</td>
											<td className="px-4 py-3.5">
												<p className="text-label-sm text-text-primary">
													{event.registrations != null ? event.registrations.toLocaleString() : "—"}
												</p>
											</td>
											<td className="px-4 py-3.5">
												<p className="text-label-sm text-text-primary">
													{event.revenue > 0 ? `$${event.revenue.toLocaleString()}` : "—"}
												</p>
											</td>
											<td className="px-4 py-3.5">
												<button className="text-text-tertiary hover:text-text-primary p-1 rounded transition-colors" aria-label={`Actions for ${event.name}`}>
													<svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden>
														<circle cx="9" cy="4" r="1.5" />
														<circle cx="9" cy="9" r="1.5" />
														<circle cx="9" cy="14" r="1.5" />
													</svg>
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					{/* Overview */}
					<div className="bg-surface-card rounded-card border border-border-subtle shadow-card p-5">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-label-md font-semibold text-text-primary">Overview</h2>
							<button className="flex items-center gap-1.5 text-label-sm text-text-secondary border border-border-default rounded-action px-3 py-1.5 hover:bg-surface-card-muted transition-colors">
								This Month
								<AltArrowDownSvg className="size-3.5" aria-hidden />
							</button>
						</div>

						<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
							{OVERVIEW_STATS.map(({ label, value, trend, up, icon, iconColor, bg, textColor, note }) => (
								<div key={label} className="flex items-start gap-3">
									<div className={`size-10 rounded-xl ${bg} ${textColor} flex items-center justify-center shrink-0 mt-0.5`}>
										<Icon as={icon} size="md" color={iconColor} />
									</div>
									<div className="flex flex-col gap-0.5 min-w-0">
										<p className="text-caption text-text-tertiary">{label}</p>
										<p className="text-title-md font-semibold text-text-primary">{value}</p>
										<div className="flex items-center gap-1 flex-wrap">
											<Icon as={up ? TrendUpSvg : TrendDownSvg} size="sm" color={up ? "success" : "brand"} />
											<span className={`text-caption font-medium ${up ? "text-text-success" : "text-text-danger"}`}>{trend}</span>
											<span className="text-caption text-text-muted">{note}</span>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Right panel */}
				<div className="flex flex-col gap-6">
					{/* Create an Experience */}
					<div className="bg-surface-card rounded-card border border-border-subtle shadow-card p-5">
						<h2 className="text-label-md font-semibold text-text-primary">Create an Experience</h2>
						<p className="text-caption text-text-tertiary mt-1 mb-4">
							Follow these simple steps to launch your event.
						</p>

						<div className="flex flex-col gap-3">
							{CREATE_STEPS.map(({ step, title, subtitle, icon, iconColor, bg, numColor }) => (
								<div key={step} className="flex items-center gap-3">
									<div className={`size-10 rounded-2xl ${bg} ${numColor} flex items-center justify-center shrink-0`}>
										<Icon as={icon} size="md" color={iconColor} />
									</div>
									<div>
										<p className="text-label-sm font-semibold text-text-primary">{title}</p>
										<p className="text-caption text-text-tertiary">{subtitle}</p>
									</div>
								</div>
							))}
						</div>

						<div className="mt-5">
							<Button variant="primary" size="md" radius="pill" className="w-full">
								Create new experience
							</Button>
						</div>
					</div>

					{/* Recent Notifications */}
					<div className="bg-surface-card rounded-card border border-border-subtle shadow-card p-5">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-label-md font-semibold text-text-primary">Recent Notifications</h2>
							<a href="/dashboard/notifications" className="text-label-sm text-text-brand hover:underline inline-flex items-center gap-1">
								View All
								<AltArrowRightSvg className="size-3.5" aria-hidden />
							</a>
						</div>

						<div className="flex flex-col gap-3">
							{NOTIFICATIONS.map(({ text, time, icon, color }, i) => (
								<div key={i} className="flex items-start gap-3">
									<div className="size-8 rounded-badge bg-surface-card-muted flex items-center justify-center shrink-0 mt-0.5">
										<Icon as={icon} size="sm" color={color} />
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-caption text-text-primary leading-snug">{text}</p>
										<p className="text-caption text-text-muted mt-0.5">{time}</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
