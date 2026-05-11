"use client"

import { useState } from "react"
import clsx from "clsx"
import {
	BarChart,
	Bar,
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts"
import { Icon } from "@/components/ui/Icon"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import Chart2Svg from "@/icons/outlined/chart-2.svg"
import UsersGroup2Svg from "@/icons/outlined/users-group-2.svg"
import TrendUpSvg from "@/icons/outlined/trend-up.svg"
import StarSvg from "@/icons/outlined/star.svg"
import AltArrowDownSvg from "@/icons/outlined/alt-arrow-down.svg"

// ─── Data ─────────────────────────────────────────────────────────────────────

const PERIOD_OPTIONS = ["Last 6 Months", "Last 3 Months", "Last Year"] as const
type Period = (typeof PERIOD_OPTIONS)[number]

const MONTHLY_REVENUE = [
	{ month: "Jan", revenue: 1800 },
	{ month: "Feb", revenue: 5500 },
	{ month: "Mar", revenue: 6200 },
	{ month: "Apr", revenue: 5000 },
	{ month: "May", revenue: 12800 },
	{ month: "Jun", revenue: 18600 },
]

const MONTHLY_REGISTRATIONS = [
	{ month: "Jan", registrations: 180 },
	{ month: "Feb", registrations: 210 },
	{ month: "Mar", registrations: 260 },
	{ month: "Apr", registrations: 310 },
	{ month: "May", registrations: 280 },
	{ month: "Jun", registrations: 420 },
	{ month: "Jul", registrations: 480 },
	{ month: "Aug", registrations: 520 },
	{ month: "Sep", registrations: 490 },
	{ month: "Oct", registrations: 560 },
	{ month: "Nov", registrations: 640 },
	{ month: "Dec", registrations: 680 },
].slice(0, 6)

const TOP_EVENTS = [
	{ rank: 1, name: "Night Market Experience", registrations: 2534, revenue: 18120, rating: 4.8 },
	{ rank: 2, name: "Summer Music Festival", registrations: 1230, revenue: 24560, rating: 4.9 },
	{ rank: 3, name: "Tech Innovators Summit", registrations: 312, revenue: 8940, rating: 4.6 },
]

const STATS = [
	{
		label: "Active Events",
		value: "2",
		trend: "+2 vs last period",
		up: true,
		icon: Chart2Svg,
		bg: "bg-red-50",
		iconColor: "brand" as const,
	},
	{
		label: "Total Registrations",
		value: "12",
		trend: "+18% vs last period",
		up: true,
		icon: UsersGroup2Svg,
		bg: "bg-blue-50",
		iconColor: "info" as const,
	},
	{
		label: "Total Revenue",
		value: "$258,130",
		trend: "+24% vs last period",
		up: true,
		icon: TrendUpSvg,
		bg: "bg-emerald-50",
		iconColor: "success" as const,
	},
	{
		label: "Avg. Rating",
		value: "4.7 / 5",
		trend: "+0.3 vs last period",
		up: true,
		icon: StarSvg,
		bg: "bg-amber-50",
		iconColor: "warning" as const,
	},
]

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
	if (!active || !payload?.length) return null
	return (
		<div className="bg-surface-card border border-border-subtle rounded-action shadow-floating px-3 py-2">
			<p className="text-caption text-text-muted mb-0.5">{label}</p>
			<p className="text-label-sm font-semibold text-text-primary">
				${payload[0].value.toLocaleString()}
			</p>
		</div>
	)
}

function RegistrationsTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
	if (!active || !payload?.length) return null
	return (
		<div className="bg-surface-card border border-border-subtle rounded-action shadow-floating px-3 py-2">
			<p className="text-caption text-text-muted mb-0.5">{label}</p>
			<p className="text-label-sm font-semibold text-text-primary">
				{payload[0].value.toLocaleString()} registrations
			</p>
		</div>
	)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InsightsPage() {
	const [period, setPeriod] = useState<Period>("Last 6 Months")
	const [periodOpen, setPeriodOpen] = useState(false)

	return (
		<div className="flex flex-col min-h-screen">
			<DashboardTopBar />

			<div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 bg-surface-page">
				{/* Header */}
				<div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
					<div>
						<h1 className="text-heading-sm font-semibold text-text-primary">Insights</h1>
						<p className="text-body-sm text-text-secondary mt-0.5">Performance analytics for your events</p>
					</div>

					{/* Period picker */}
					<div className="relative">
						<button
							onClick={() => setPeriodOpen(o => !o)}
							className="flex items-center gap-1.5 h-9 px-3.5 rounded-action border border-border-default bg-surface-card text-label-sm text-text-primary hover:border-border-strong transition-colors"
						>
							{period}
							<Icon as={AltArrowDownSvg} size="sm" color="muted" aria-hidden />
						</button>
						{periodOpen && (
							<div className="absolute right-0 top-full mt-1.5 z-20 bg-surface-card border border-border-subtle rounded-action shadow-floating min-w-40 py-1">
								{PERIOD_OPTIONS.map(opt => (
									<button
										key={opt}
										onClick={() => { setPeriod(opt); setPeriodOpen(false) }}
										className={clsx(
											"w-full text-left px-3 py-2 text-label-sm transition-colors",
											opt === period
												? "text-text-primary font-medium bg-surface-card-muted"
												: "text-text-secondary hover:bg-surface-card-muted",
										)}
									>
										{opt}
									</button>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Stat cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
					{STATS.map(stat => (
						<div key={stat.label} className="bg-surface-card border border-border-subtle rounded-card px-5 py-4">
							<div className={clsx("size-10 rounded-xl flex items-center justify-center mb-3", stat.bg)}>
								<Icon as={stat.icon} size="md" color={stat.iconColor} aria-hidden />
							</div>
							<p className="text-caption text-text-tertiary mb-1">{stat.label}</p>
							<p className="text-title-md font-semibold text-text-primary mb-1">{stat.value}</p>
							<div className="flex items-center gap-1">
								<Icon as={TrendUpSvg} size="sm" color="success" aria-hidden />
								<span className="text-caption text-text-success">{stat.trend}</span>
							</div>
						</div>
					))}
				</div>

				{/* Charts row */}
				<div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
					{/* Monthly Revenue */}
					<div className="bg-surface-card border border-border-subtle rounded-card px-5 py-4">
						<h2 className="text-label-md font-semibold text-text-primary mb-4">Monthly Revenue</h2>
						<ResponsiveContainer width="100%" height={200}>
							<BarChart data={MONTHLY_REVENUE} barCategoryGap="40%" margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
								<CartesianGrid vertical={false} stroke="var(--border-subtle)" strokeDasharray="0" />
								<XAxis
									dataKey="month"
									axisLine={false}
									tickLine={false}
									tick={{ fontSize: 11, fill: "var(--text-muted)" }}
									dy={8}
								/>
								<YAxis
									axisLine={false}
									tickLine={false}
									tick={{ fontSize: 11, fill: "var(--text-muted)" }}
									tickFormatter={v => `$${v >= 1000 ? `${v / 1000}k` : v}`}
									width={40}
								/>
								<Tooltip content={<RevenueTooltip />} cursor={{ fill: "var(--surface-card-muted)" }} />
								<Bar dataKey="revenue" fill="#EF4444" radius={[4, 4, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</div>

					{/* Monthly Registrations */}
					<div className="bg-surface-card border border-border-subtle rounded-card px-5 py-4">
						<h2 className="text-label-md font-semibold text-text-primary mb-4">Monthly Registrations</h2>
						<ResponsiveContainer width="100%" height={200}>
							<LineChart data={MONTHLY_REGISTRATIONS} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
								<CartesianGrid stroke="var(--border-subtle)" strokeDasharray="0" />
								<XAxis
									dataKey="month"
									axisLine={false}
									tickLine={false}
									tick={{ fontSize: 11, fill: "var(--text-muted)" }}
									dy={8}
								/>
								<YAxis
									axisLine={false}
									tickLine={false}
									tick={{ fontSize: 11, fill: "var(--text-muted)" }}
									width={40}
								/>
								<Tooltip content={<RegistrationsTooltip />} cursor={{ stroke: "var(--border-default)" }} />
								<Line
									type="monotone"
									dataKey="registrations"
									stroke="#3B82F6"
									strokeWidth={2}
									dot={{ fill: "#3B82F6", r: 4, strokeWidth: 0 }}
									activeDot={{ r: 5, fill: "#3B82F6" }}
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>
				</div>

				{/* Top Performing Events */}
				<div className="bg-surface-card border border-border-subtle rounded-card overflow-hidden">
					<div className="px-5 py-4 border-b border-border-subtle">
						<h2 className="text-label-md font-semibold text-text-primary">Top Performing Events</h2>
					</div>
					<div className="divide-y divide-border-subtle">
						{TOP_EVENTS.map(event => (
							<div key={event.rank} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-card-muted transition-colors">
								{/* Rank */}
								<span className="text-body-sm text-text-muted w-4 shrink-0 text-center">{event.rank}</span>

								{/* Name + registrations */}
								<div className="flex-1 min-w-0">
									<p className="text-body-sm font-semibold text-text-primary truncate">{event.name}</p>
									<p className="text-caption text-text-tertiary mt-0.5">{event.registrations.toLocaleString()} registrations</p>
								</div>

								{/* Revenue + rating */}
								<div className="flex items-center gap-6 shrink-0">
									<span className="text-body-sm font-semibold text-text-primary tabular-nums">
										${event.revenue.toLocaleString()}
									</span>
									<div className="flex items-center gap-1">
										<Icon as={StarSvg} size="sm" color="warning" aria-hidden />
										<span className="text-body-sm font-medium text-text-primary">{event.rating}</span>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}
