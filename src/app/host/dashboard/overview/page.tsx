"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Icon } from "@/components/ui/Icon"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import { useDashboardStore } from "@/store/dashboardStore"
import { useHostStore } from "@/store/hostStore"
import type { DisplayEventStatus } from "@/types/event"
import { formatEventDateRange } from "@/lib/eventForm"
import { Skeleton } from "@/components/ui/Skeleton"
import { getProposals, type StoredProposal } from "../proposal/page"

import CalendarOutSvg from "@/icons/outlined/calendar.svg"
import DocumentTextSvg from "@/icons/outlined/document-text.svg"
import AltArrowRightSvg from "@/icons/outlined/alt-arrow-right.svg"

const STATUS_CONFIG: Record<DisplayEventStatus, { label: string; className: string }> = {
	DRAFT: { label: "Draft", className: "bg-surface-card-muted text-text-secondary" },
	UNDER_REVIEW: { label: "Under Review", className: "bg-status-trending-bg text-status-trending-text" },
	PUBLISHED: { label: "Published", className: "bg-status-success-bg text-status-success-text" },
	LIVE: { label: "Live Now", className: "bg-red-100 text-red-700" },
	COMPLETED: { label: "Completed", className: "bg-surface-inverse text-text-inverse" },
	CANCELLED: { label: "Cancelled", className: "bg-status-error-bg text-status-error-text" },
}

export default function DashboardOverviewPage() {
	const { data, isLoading, fetchDashboard } = useDashboardStore()
	const { profile } = useHostStore()
	const hostId = profile?.id || ""

	const [proposals, setProposals] = useState<StoredProposal[]>([])
	const [loadingProposals, setLoadingProposals] = useState(true)

	useEffect(() => {
		fetchDashboard()
	}, [fetchDashboard])

	useEffect(() => {
		if (!hostId) return
		setLoadingProposals(true)
		getProposals(hostId)
			.then((list) => {
				const sorted = [...list].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
				setProposals(sorted)
			})
			.catch((err) => {
				console.error("Failed to fetch proposals for dashboard", err)
			})
			.finally(() => {
				setLoadingProposals(false)
			})
	}, [hostId])

	const recentEvents = data?.recentEvents ?? []
	const topEvents = recentEvents.slice(0, 3)
	const topProposals = proposals.slice(0, 3)

	return (
		<div className="flex flex-col min-h-screen bg-surface-page">
			<DashboardTopBar />

			<div className="px-6 lg:px-8 py-8 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-8 animate-in fade-in duration-150">
				<div>
					<h1 className="text-heading-sm font-semibold text-text-primary">Dashboard Overview</h1>
					<p className="text-body-sm text-text-secondary mt-1">Quick summary of your active events and sponsorship proposals.</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
					{/* Column 1: My Events */}
					<div className="bg-surface-card rounded-action border border-border-default shadow-card overflow-hidden flex flex-col min-h-[340px]">
						<div className="flex items-center justify-between px-5 py-4 border-b border-border-default bg-surface-card-muted/50 shrink-0">
							<h2 className="text-label-md font-semibold text-text-primary">My Events</h2>
							<Link href="/host/dashboard/events" className="text-label-sm text-text-brand hover:underline inline-flex items-center gap-1">
								View All
								<AltArrowRightSvg className="size-3.5" aria-hidden />
							</Link>
						</div>

						{isLoading && !data ? (
							<div className="flex-1 flex flex-col divide-y divide-border-default">
								{Array.from({ length: 3 }).map((_, i) => (
									<div key={i} className="flex items-center gap-4 px-5 h-20">
										<Skeleton.Avatar size="md" className="rounded-image shrink-0" />
										<div className="flex-1 flex flex-col gap-1.5 min-w-0">
											<Skeleton.Text className="w-32" />
											<Skeleton.Text className="w-20" />
										</div>
									</div>
								))}
							</div>
						) : topEvents.length === 0 ? (
							<div className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center gap-3">
								<div className="size-12 rounded-full bg-surface-card-muted flex items-center justify-center text-text-tertiary">
									<Icon as={CalendarOutSvg} size="md" color="inherit" />
								</div>
								<div>
									<p className="text-label-sm font-semibold text-text-primary">No events yet</p>
									<p className="text-caption text-text-secondary mt-0.5">Create your first experience to get started.</p>
								</div>
								<Link href="/host/dashboard/create" className="mt-2">
									<button className="px-4 py-2 bg-action-primary text-text-inverse font-semibold text-xs rounded-pill hover:bg-action-primary-hover transition-colors">
										Create Event
									</button>
								</Link>
							</div>
						) : (
							<div className="flex-1 flex flex-col divide-y divide-border-default">
								{topEvents.map((event) => {
									const statusCfg = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.DRAFT
									const dateStr = formatEventDateRange(event.eventDate ?? undefined, event.endDate)
									return (
										<Link
											key={event.id}
											href={`/host/dashboard/events/${event.id}`}
											className="flex items-center justify-between px-5 h-20 hover:bg-surface-card-muted/30 transition-colors"
										>
											<div className="flex items-center gap-3 min-w-0">
												{event.coverImageUrl ? (
													// eslint-disable-next-line @next/next/no-img-element
													<img src={event.coverImageUrl} alt="" className="size-12 rounded-xl object-cover shrink-0 border border-border-default" />
												) : (
													<div className="size-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
														<Icon as={CalendarOutSvg} size="md" color="inherit" />
													</div>
												)}
												<div className="min-w-0">
													<p className="text-label-md font-semibold text-text-primary truncate">{event.title || "Untitled Event"}</p>
													<p className="text-caption text-text-tertiary mt-0.5">{dateStr} • {event.city || "Online"}</p>
												</div>
											</div>
											<span className={`inline-flex items-center px-2.5 py-0.5 rounded-badge text-[10px] font-semibold shrink-0 ${statusCfg.className}`}>
												{statusCfg.label}
											</span>
										</Link>
									)
								})}
								{Array.from({ length: Math.max(0, 3 - topEvents.length) }).map((_, i) => (
									<div key={`empty-ev-${i}`} className="h-20 border-b border-border-default/50 last:border-b-0" />
								))}
							</div>
						)}
					</div>

					{/* Column 2: My Proposals */}
					<div className="bg-surface-card rounded-action border border-border-default shadow-card overflow-hidden flex flex-col min-h-[340px]">
						<div className="flex items-center justify-between px-5 py-4 border-b border-border-default bg-surface-card-muted/50 shrink-0">
							<h2 className="text-label-md font-semibold text-text-primary">My Sponsorships</h2>
							<Link href="/host/dashboard/proposal" className="text-label-sm text-text-brand hover:underline inline-flex items-center gap-1">
								View All
								<AltArrowRightSvg className="size-3.5" aria-hidden />
							</Link>
						</div>

						{loadingProposals ? (
							<div className="flex-1 flex flex-col divide-y divide-border-default">
								{Array.from({ length: 3 }).map((_, i) => (
									<div key={i} className="flex items-center gap-4 px-5 h-20">
										<Skeleton.Avatar size="md" className="rounded-image shrink-0" />
										<div className="flex-1 flex flex-col gap-1.5 min-w-0">
											<Skeleton.Text className="w-32" />
											<Skeleton.Text className="w-20" />
										</div>
									</div>
								))}
							</div>
						) : topProposals.length === 0 ? (
							<div className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center gap-3">
								<div className="size-12 rounded-full bg-surface-card-muted flex items-center justify-center text-text-tertiary">
									<Icon as={DocumentTextSvg} size="md" color="inherit" />
								</div>
								<div>
									<p className="text-label-sm font-semibold text-text-primary">No proposals yet</p>
									<p className="text-caption text-text-secondary mt-0.5">Build a proposal and start raising sponsorship.</p>
								</div>
								<Link href="/host/dashboard/proposal" className="mt-2">
									<button className="px-4 py-2 bg-action-primary text-text-inverse font-semibold text-xs rounded-pill hover:bg-action-primary-hover transition-colors">
										Create Proposal
									</button>
								</Link>
							</div>
						) : (
							<div className="flex-1 flex flex-col divide-y divide-border-default">
								{topProposals.map((prop) => {
									const imgUrl = prop.image ? URL.createObjectURL(prop.image) : null
									return (
										<Link
											key={prop.id}
											href={`/host/dashboard/proposal?proposalId=${prop.id}`}
											className="flex items-center justify-between px-5 h-20 hover:bg-surface-card-muted/30 transition-colors"
										>
											<div className="flex items-center gap-3 min-w-0">
												{imgUrl ? (
													// eslint-disable-next-line @next/next/no-img-element
													<img
														src={imgUrl}
														alt=""
														className="size-12 rounded-xl object-cover shrink-0 border border-border-default"
														onLoad={() => URL.revokeObjectURL(imgUrl)}
													/>
												) : (
													<div className="size-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
														<Icon as={DocumentTextSvg} size="md" color="inherit" />
													</div>
												)}
												<div className="min-w-0">
													<p className="text-label-md font-semibold text-text-primary truncate">{prop.name}</p>
													<p className="text-caption text-text-tertiary mt-0.5">{prop.venue} • {prop.city}</p>
												</div>
											</div>
											<span className="text-[11px] text-text-brand font-semibold shrink-0 bg-surface-brand-soft px-2 py-0.5 rounded-badge border border-border-brand">
												{prop.guestCount} guests
											</span>
										</Link>
									)
								})}
								{Array.from({ length: Math.max(0, 3 - topProposals.length) }).map((_, i) => (
									<div key={`empty-prop-${i}`} className="h-20 border-b border-border-default/50 last:border-b-0" />
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
