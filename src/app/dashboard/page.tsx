"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import { useDashboardStore } from "@/store/dashboardStore"
import { useHostStore } from "@/store/hostStore"
import type { ApiEventStatus } from "@/types/event"
import type { DashboardPeriod } from "@/types/dashboard"
import { Skeleton } from "@/components/ui/Skeleton"

import FileTextSvg from "@/icons/outlined/file-text.svg"
import ClockCircleSvg from "@/icons/outlined/clock-circle.svg"
import PlaneSvg from "@/icons/outlined/plane.svg"
import Checklist2Svg from "@/icons/outlined/checklist-2.svg"
import CloseCircleSvg from "@/icons/outlined/close-circle.svg"
import MapPointRotateSvg from "@/icons/outlined/map-point-rotate.svg"
import CalendarOutSvg from "@/icons/outlined/calendar.svg"
import GalleryWideSvg from "@/icons/outlined/gallery-wide.svg"
import TicketSvg from "@/icons/outlined/ticket.svg"
import SettingsSvg from "@/icons/outlined/settings.svg"
import UsersGroupSvg from "@/icons/outlined/users-group.svg"
import DollarSvg from "@/icons/outlined/dollar.svg"
import StarSvg from "@/icons/outlined/star.svg"
import TrendUpSvg from "@/icons/outlined/trend-up.svg"
import AltArrowRightSvg from "@/icons/outlined/alt-arrow-right.svg"
import AltArrowDownSvg from "@/icons/outlined/alt-arrow-down.svg"
import DangerCircleSvg from "@/icons/outlined/danger-circle.svg"

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ApiEventStatus, { label: string; className: string }> = {
	DRAFT: { label: "Draft", className: "bg-surface-card-muted text-text-secondary" },
	UNDER_REVIEW: { label: "Under Review", className: "bg-status-trending-bg text-status-trending-text" },
	PUBLISHED: { label: "Published", className: "bg-status-success-bg text-status-success-text" },
	COMPLETED: { label: "Completed", className: "bg-surface-inverse text-text-inverse" },
	CANCELLED: { label: "Cancelled", className: "bg-status-error-bg text-status-error-text" },
	REJECTED: { label: "Rejected", className: "bg-status-error-bg text-status-error-text" },
}

const SUMMARY_CONFIG = [
	{ status: "DRAFT" as ApiEventStatus, countKey: "draft" as const, label: "Draft", subtitle: "Continue creating", icon: FileTextSvg, iconColor: "inherit" as const, bg: "bg-neutral-100" },
	{ status: "UNDER_REVIEW" as ApiEventStatus, countKey: "underReview" as const, label: "Under Review", subtitle: "Awaiting approval", icon: ClockCircleSvg, iconColor: "info" as const, bg: "bg-blue-100" },
	{ status: "PUBLISHED" as ApiEventStatus, countKey: "published" as const, label: "Published", subtitle: "Live and online", icon: PlaneSvg, iconColor: "success" as const, bg: "bg-status-success-bg" },
	{ status: "COMPLETED" as ApiEventStatus, countKey: "completed" as const, label: "Completed", subtitle: "Experiences finished", icon: Checklist2Svg, iconColor: "inverse" as const, bg: "bg-neutral-800" },
	{ status: "CANCELLED" as ApiEventStatus, countKey: "cancelled" as const, label: "Cancelled", subtitle: "Not active", icon: CloseCircleSvg, iconColor: "brand" as const, bg: "bg-red-100" },
]

const PERIOD_LABELS: Record<DashboardPeriod, string> = {
	THIS_MONTH: "This Month",
	LAST_30_DAYS: "Last 30 Days",
	THIS_YEAR: "This Year",
	ALL_TIME: "All Time",
}

const CREATE_STEPS = [
	{ step: 1, title: "Basic Info", subtitle: "Tell us about your experience", icon: FileTextSvg, iconColor: "inherit" as const, bg: "bg-orange-100", numColor: "text-orange-500" },
	{ step: 2, title: "Date & Location", subtitle: "When and where it happens", icon: MapPointRotateSvg, iconColor: "info" as const, bg: "bg-blue-100", numColor: "text-blue-500" },
	{ step: 3, title: "Media Upload", subtitle: "Add photos, videos, and more", icon: GalleryWideSvg, iconColor: "vibe" as const, bg: "bg-purple-100", numColor: "text-purple-500" },
	{ step: 4, title: "Ticket Types", subtitle: "Set pricing and ticket options", icon: TicketSvg, iconColor: "inherit" as const, bg: "bg-yellow-100", numColor: "text-yellow-600" },
	{ step: 5, title: "Setting & Review", subtitle: "Review and publish", icon: SettingsSvg, iconColor: "success" as const, bg: "bg-green-100", numColor: "text-green-600" },
]

const EVENT_COLORS = ["bg-[#F97316]", "bg-[#6366F1]", "bg-[#10B981]", "bg-[#8B5CF6]", "bg-[#EC4899]", "bg-[#3B82F6]", "bg-[#F59E0B]"]

// ─── Sub-components ───────────────────────────────────────────────────────────

function DeltaBadge({ delta }: { delta: number | null }) {
	if (delta === null) return <span className="text-caption text-text-muted">—</span>
	const isPositive = delta >= 0
	return (
		<div className="flex items-center gap-1">
			<TrendUpSvg
				className={`size-3 ${isPositive ? "text-status-success-text" : "text-status-error-text rotate-180"}`}
				aria-hidden
			/>
			<span className={`text-caption font-medium ${isPositive ? "text-text-success" : "text-status-error-text"}`}>
				{isPositive ? "+" : ""}{delta}%
			</span>
		</div>
	)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
	const { data, isLoading, error, period, fetchDashboard, setPeriod } = useDashboardStore()
	const { profile } = useHostStore()

	useEffect(() => {
		fetchDashboard()
	}, [fetchDashboard])

	const displayName = profile?.displayName || "Host"
	const recentEvents = data?.recentEvents ?? []

	return (
		<div className="flex flex-col">
			<DashboardTopBar />

			{/* Hero */}
			<div className="relative px-6 lg:px-8 pt-8 pb-6 overflow-hidden">
				<div
					className="absolute top-0 right-0 w-48 h-48 opacity-30 pointer-events-none"
					style={{
						backgroundImage: "radial-gradient(circle, var(--color-border-default) 1.5px, transparent 1.5px)",
						backgroundSize: "16px 16px",
					}}
					aria-hidden
				/>

				<h1 className="text-heading-sm lg:text-heading-md font-semibold text-text-primary max-w-xl leading-tight">
					Welcome back, <span className="text-text-brand">{displayName}.</span>
				</h1>
				<p className="text-body-sm text-text-secondary mt-2 mb-6">
					Everything you need to build, publish and grow unforgettable events.
				</p>

				{/* Summary stats */}
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
					{isLoading && !data
						? Array.from({ length: 5 }).map((_, i) => <Skeleton.StatCard key={i} />)
						: SUMMARY_CONFIG.map(({ status, countKey, label, subtitle, icon, iconColor, bg }) => (
							<Link
								key={status}
								href={`/dashboard/events?status=${status}`}
								className="flex gap-4 items-center p-4 rounded-action border border-border-default bg-surface-card shadow-card hover:shadow-card-hover transition-shadow text-left"
							>
								<div className={`size-10 rounded-badge flex items-center justify-center ${bg}`}>
									<Icon as={icon} size="lg" color={iconColor} />
								</div>
								<div>
									<p className="text-title-md font-semibold text-text-primary">
										{data?.eventCounts[countKey] ?? 0}
									</p>
									<p className="text-label-sm text-text-primary font-medium">{label}</p>
									<p className="text-caption text-text-tertiary mt-0.5 flex items-center gap-0.5">
										{subtitle}
										<AltArrowRightSvg className="size-3" aria-hidden />
									</p>
								</div>
							</Link>
						))
					}
				</div>
			</div>

			{/* Body */}
			<div className="px-6 lg:px-8 pb-10 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
				{/* Left column */}
				<div className="flex flex-col gap-6 min-w-0">

					{/* Error banner */}
					{error && (
						<div className="flex items-center justify-between gap-3 px-4 py-3 rounded-action bg-status-error-bg border border-status-error-text/20">
							<div className="flex items-center gap-2">
								<DangerCircleSvg className="size-4 text-status-error-text shrink-0" aria-hidden />
								<p className="text-label-sm text-status-error-text">{error}</p>
							</div>
							<button
								onClick={() => fetchDashboard()}
								className="text-label-sm font-medium text-status-error-text underline hover:no-underline shrink-0"
							>
								Retry
							</button>
						</div>
					)}

					{/* My Events table */}
					<div className="bg-surface-card rounded-action border border-border-default shadow-card overflow-hidden">
						<div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
							<h2 className="text-label-md font-semibold text-text-primary">My Events</h2>
							<Link href="/dashboard/events" className="text-label-sm text-text-brand hover:underline inline-flex items-center gap-1">
								View All Events
								<AltArrowRightSvg className="size-3.5" aria-hidden />
							</Link>
						</div>

						{isLoading && !data ? (
							<div className="flex flex-col divide-y divide-border-default">
								{Array.from({ length: 3 }).map((_, i) => (
									<div key={i} className="flex items-center gap-4 px-5 py-4">
										<Skeleton.Avatar size="md" className="rounded-image" />
										<div className="flex-1 flex flex-col gap-2">
											<Skeleton.Text className="w-48" />
											<Skeleton.Text className="w-32" />
										</div>
										<Skeleton.Block className="h-6 w-20 rounded-badge" />
									</div>
								))}
							</div>
						) : recentEvents.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-16 gap-3">
								<Icon as={CalendarOutSvg} size="lg" color="muted" />
								<p className="text-body-sm text-text-secondary">No events yet.</p>
								<Link href="/dashboard/create">
									<Button variant="primary" size="sm" radius="pill">Create your first experience</Button>
								</Link>
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full min-w-160">
									<thead>
										<tr className="border-b border-border-default">
											<th className="text-left text-caption text-text-tertiary font-medium px-5 py-3">EVENT NAME</th>
											<th className="text-left text-caption text-text-tertiary font-medium px-4 py-3">DATE</th>
											<th className="text-left text-caption text-text-tertiary font-medium px-4 py-3">STATUS</th>
											<th className="text-left text-caption text-text-tertiary font-medium px-4 py-3">REGISTRATIONS</th>
											<th className="text-left text-caption text-text-tertiary font-medium px-4 py-3">REVENUE</th>
											<th className="text-left text-caption text-text-tertiary font-medium px-4 py-3">ACTIONS</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-border-default">
										{recentEvents.map((event, idx) => {
											const statusCfg = STATUS_CONFIG[event.status as ApiEventStatus] ?? STATUS_CONFIG.DRAFT
											const dateStr = event.eventDate
												? new Date(event.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
												: "—"
											return (
												<tr key={event.id} className="hover:bg-surface-card-muted transition-colors">
													<td className="px-5 py-3.5">
														<div className="flex items-center gap-3">
															{event.coverImageUrl
																// eslint-disable-next-line @next/next/no-img-element
																? <img src={event.coverImageUrl} alt="" className="size-10 rounded-action object-cover shrink-0" />
																: <div className={`size-10 rounded-action shrink-0 ${EVENT_COLORS[idx % EVENT_COLORS.length]}`} />
															}
															<div>
																<p className="text-label-sm font-medium text-text-primary leading-tight">{event.title || "Untitled"}</p>
																<p className="text-caption text-text-tertiary">{event.city || "—"}</p>
															</div>
														</div>
													</td>
													<td className="px-4 py-3.5">
														<p className="text-label-sm text-text-primary">{dateStr}</p>
													</td>
													<td className="px-4 py-3.5">
														<span className={`inline-flex items-center px-2.5 py-1 rounded-badge text-caption font-medium ${statusCfg.className}`}>
															{statusCfg.label}
														</span>
													</td>
													<td className="px-4 py-3.5">
														<p className="text-label-sm text-text-primary">{event.registrations.toLocaleString()}</p>
													</td>
													<td className="px-4 py-3.5">
														<p className="text-label-sm text-text-primary">
															{event.revenue > 0 ? `₹${event.revenue.toLocaleString()}` : "—"}
														</p>
													</td>
													<td className="px-4 py-3.5">
														<Link
															href={`/dashboard/events/${event.id}`}
															className="text-label-sm text-text-brand hover:underline"
														>
															View
														</Link>
													</td>
												</tr>
											)
										})}
									</tbody>
								</table>
							</div>
						)}
					</div>

					{/* Overview */}
					<div className="bg-surface-card rounded-action border border-border-default shadow-card p-5">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-label-md font-semibold text-text-primary">Overview</h2>
							<div className="relative">
								<select
									value={period}
									onChange={e => setPeriod(e.target.value as DashboardPeriod)}
									className="appearance-none text-label-sm text-text-secondary border border-border-default rounded-action pl-3 pr-8 py-1.5 hover:bg-surface-card-muted transition-colors bg-transparent cursor-pointer"
								>
									{(Object.keys(PERIOD_LABELS) as DashboardPeriod[]).map(p => (
										<option key={p} value={p}>{PERIOD_LABELS[p]}</option>
									))}
								</select>
								<AltArrowDownSvg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-text-secondary" aria-hidden />
							</div>
						</div>

						<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
							{isLoading && !data ? (
								Array.from({ length: 4 }).map((_, i) => <Skeleton.OverviewItem key={i} />)
							) : (
								<>
									<div className="flex items-start gap-3">
										<div className="size-10 rounded-xl bg-red-100 text-red-500 flex items-center justify-center shrink-0 mt-0.5">
											<Icon as={CalendarOutSvg} size="md" color="inherit" />
										</div>
										<div className="flex flex-col gap-0.5 min-w-0">
											<p className="text-caption text-text-tertiary">Total Events</p>
											<p className="text-title-md font-semibold text-text-primary">
												{data?.overview.totalEvents ?? "—"}
											</p>
											<DeltaBadge delta={data?.overview.totalEventsDelta ?? null} />
										</div>
									</div>

									<div className="flex items-start gap-3">
										<div className="size-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
											<Icon as={UsersGroupSvg} size="md" color="info" />
										</div>
										<div className="flex flex-col gap-0.5 min-w-0">
											<p className="text-caption text-text-tertiary">Registrations</p>
											<p className="text-title-md font-semibold text-text-primary">
												{data?.overview.liveRegistrations.toLocaleString() ?? "—"}
											</p>
											<DeltaBadge delta={data?.overview.liveRegistrationsDelta ?? null} />
										</div>
									</div>

									<div className="flex items-start gap-3">
										<div className="size-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
											<Icon as={DollarSvg} size="md" color="success" />
										</div>
										<div className="flex flex-col gap-0.5 min-w-0">
											<p className="text-caption text-text-tertiary">Revenue</p>
											<p className="text-title-md font-semibold text-text-primary">
												{data ? `₹${data.overview.revenue.toLocaleString()}` : "—"}
											</p>
											<DeltaBadge delta={data?.overview.revenueDelta ?? null} />
										</div>
									</div>

									<div className="flex items-start gap-3">
										<div className="size-10 rounded-xl bg-yellow-100 flex items-center justify-center shrink-0 mt-0.5">
											<Icon as={StarSvg} size="md" color="inherit" />
										</div>
										<div className="flex flex-col gap-0.5 min-w-0">
											<p className="text-caption text-text-tertiary">Satisfaction</p>
											<p className="text-title-md font-semibold text-text-primary">
												{data?.overview.avgSatisfaction ?? "—"}
											</p>
											<DeltaBadge delta={data?.overview.avgSatisfactionDelta ?? null} />
										</div>
									</div>
								</>
							)}
						</div>
					</div>
				</div>

				{/* Right panel */}
				<div className="flex flex-col gap-6">
					{/* Create an Experience */}
					<div className="bg-surface-card rounded-action border border-border-default shadow-card p-5">
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
							<Link href="/dashboard/create">
								<Button variant="primary" size="md" radius="md" className="w-full">
									Create new experience
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
