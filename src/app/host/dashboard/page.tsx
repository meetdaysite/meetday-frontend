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
import { getProposals, type StoredProposal } from "./proposal/page"

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

export default function DashboardWelcomePage() {
	const { data, isLoading, fetchDashboard } = useDashboardStore()
	const { profile } = useHostStore()
	const hostId = profile?.id || ""
	const displayName = profile?.displayName || "Host"

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
	const approvedSponsorships = proposals.filter((p) => p.status === "PUBLISHED")
	const upcomingEvents = recentEvents.filter((e) => e.status === "PUBLISHED" || e.status === "LIVE")

	return (
		<div className="flex flex-col min-h-screen bg-surface-page">
			<DashboardTopBar />

			<div className="px-6 lg:px-8 py-8 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-8 animate-in fade-in duration-150">
				{/* Welcome Header */}
				<div className="animate-fade-in text-left">
					<h1 className="text-3xl md:text-5xl font-black tracking-tight text-text-primary leading-tight">
						Hey {displayName}, <span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">what are we building today?</span>
					</h1>
					<p className="text-md md:text-lg text-text-secondary mt-3 max-w-2xl font-medium">
						Start something new, or pick up where you left off.
					</p>
				</div>

				{/* Two CTAs grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
					{/* CTA 1: Raise Sponsorship */}
					<Link
						href="/host/dashboard/proposal"
						className="group relative flex flex-col items-start text-left p-6 rounded-3xl border border-border-default bg-surface-card shadow-md hover:shadow-xl hover:border-orange-500/50 hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300 ease-out overflow-hidden"
					>
						<div className="absolute -right-16 -top-16 size-48 rounded-full bg-orange-500/10 blur-3xl group-hover:bg-orange-500/20 transition-all duration-300" />
						<div className="size-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
							<Icon as={DocumentTextSvg} size="md" color="inherit" />
						</div>
						<h2 className="text-xl font-bold text-text-primary leading-snug group-hover:text-orange-600 transition-colors duration-300">
							Raise Sponsorship
						</h2>
						<p className="text-body-sm text-text-secondary mt-2 mb-6 flex-1">
							Create a professional proposal, connect with top brands, and secure funding for your upcoming events.
						</p>
						<div className="flex items-center gap-2 text-label-sm font-bold text-orange-600 group-hover:translate-x-2 transition-transform duration-300">
							Get Sponsored
							<AltArrowRightSvg className="size-4" aria-hidden />
						</div>
					</Link>

					{/* CTA 2: Host an Experience */}
					<Link
						href="/host/dashboard/create"
						className="group relative flex flex-col items-start text-left p-6 rounded-3xl border border-border-default bg-surface-card shadow-md hover:shadow-xl hover:border-red-500/50 hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300 ease-out overflow-hidden"
					>
						<div className="absolute -right-16 -top-16 size-48 rounded-full bg-red-500/10 blur-3xl group-hover:bg-red-500/20 transition-all duration-300" />
						<div className="size-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
							<Icon as={CalendarOutSvg} size="md" color="inherit" />
						</div>
						<h2 className="text-xl font-bold text-text-primary leading-snug group-hover:text-red-600 transition-colors duration-300">
							Host an Experience
						</h2>
						<p className="text-body-sm text-text-secondary mt-2 mb-6 flex-1">
							Set up ticket types, dates, venue details, and invite your community to a brand new unforgettable experience.
						</p>
						<div className="flex items-center gap-2 text-label-sm font-bold text-red-600 group-hover:translate-x-2 transition-transform duration-300">
							Create Event
							<AltArrowRightSvg className="size-4" aria-hidden />
						</div>
					</Link>
				</div>

				<hr className="border-border-default" />

				{/* Overview Section */}
				<div className="flex flex-col gap-8">
					{/* Row 1: Approved Sponsorships */}
					<div className="bg-surface-card rounded-action border border-border-default shadow-card overflow-hidden flex flex-col w-full">
						<div className="flex items-center justify-between px-5 py-4 border-b border-border-default bg-surface-card-muted/50 shrink-0">
							<div>
								<h2 className="text-label-md font-semibold text-text-primary">Approved Sponsorships</h2>
								<p className="text-caption text-text-secondary mt-0.5">Your published sponsorship proposals.</p>
							</div>
							<Link href="/host/dashboard/proposal" className="text-label-sm text-text-brand hover:underline inline-flex items-center gap-1">
								View All Proposals
								<AltArrowRightSvg className="size-3.5" aria-hidden />
							</Link>
						</div>

						{loadingProposals ? (
							<div className="flex flex-col divide-y divide-border-default">
								{Array.from({ length: 2 }).map((_, i) => (
									<div key={i} className="flex items-center gap-4 px-5 h-20 animate-pulse">
										<div className="size-12 rounded-xl bg-surface-card-muted shrink-0" />
										<div className="flex-1 flex flex-col gap-1.5 min-w-0">
											<div className="h-4 bg-surface-card-muted rounded w-32" />
											<div className="h-3 bg-surface-card-muted rounded w-20" />
										</div>
									</div>
								))}
							</div>
						) : approvedSponsorships.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
								<div className="size-12 rounded-full bg-surface-card-muted flex items-center justify-center text-text-tertiary">
									<Icon as={DocumentTextSvg} size="md" color="inherit" />
								</div>
								<div>
									<p className="text-label-sm font-semibold text-text-primary">No approved sponsorships yet</p>
									<p className="text-caption text-text-secondary mt-0.5">Submit your first proposal for admin approval to get sponsored.</p>
								</div>
							</div>
						) : (
							<div className="flex flex-col divide-y divide-border-default">
								{approvedSponsorships.map((prop) => {
									const imgUrl = prop.image ? URL.createObjectURL(prop.image) : null
									return (
										<Link
											key={prop.id}
											href={`/host/dashboard/proposal?proposalId=${prop.id}`}
											className="group/item flex items-center justify-between px-5 h-20 hover:bg-surface-card-muted/50 hover:pl-7 transition-all duration-300 ease-out"
										>
											<div className="flex items-center gap-3 min-w-0">
												{imgUrl ? (
													<div className="size-12 rounded-xl overflow-hidden shrink-0 border border-border-default">
														{/* eslint-disable-next-line @next/next/no-img-element */}
														<img
															src={imgUrl}
															alt=""
															className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-300"
															onLoad={() => URL.revokeObjectURL(imgUrl)}
														/>
													</div>
												) : (
													<div className="size-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 group-hover/item:scale-115 group-hover/item:rotate-3 transition-transform duration-300">
														<Icon as={DocumentTextSvg} size="md" color="inherit" />
													</div>
												)}
												<div className="min-w-0">
													<p className="text-label-md font-semibold text-text-primary truncate group-hover/item:text-orange-600 transition-colors duration-300">{prop.name}</p>
													<p className="text-caption text-text-tertiary mt-0.5">{prop.venue} • {prop.city}</p>
												</div>
											</div>
											<div className="flex items-center gap-2">
												<span className="text-[11px] text-text-brand font-semibold shrink-0 bg-surface-brand-soft px-2 py-0.5 rounded-badge border border-border-brand">
													{prop.guestCount} guests
												</span>
												<span className="inline-flex items-center px-2.5 py-0.5 rounded-badge text-[10px] font-semibold shrink-0 bg-status-success-bg text-status-success-text">
													Published
												</span>
											</div>
										</Link>
									)
								})}
							</div>
						)}
					</div>

					{/* Row 2: Upcoming Events */}
					<div className="bg-surface-card rounded-action border border-border-default shadow-card overflow-hidden flex flex-col w-full">
						<div className="flex items-center justify-between px-5 py-4 border-b border-border-default bg-surface-card-muted/50 shrink-0">
							<div>
								<h2 className="text-label-md font-semibold text-text-primary">Upcoming Events</h2>
								<p className="text-caption text-text-secondary mt-0.5">Your published or live experiences.</p>
							</div>
							<Link href="/host/dashboard/events" className="text-label-sm text-text-brand hover:underline inline-flex items-center gap-1">
								View All Events
								<AltArrowRightSvg className="size-3.5" aria-hidden />
							</Link>
						</div>

						{isLoading && !data ? (
							<div className="flex flex-col divide-y divide-border-default">
								{Array.from({ length: 2 }).map((_, i) => (
									<div key={i} className="flex items-center gap-4 px-5 h-20 animate-pulse">
										<div className="size-12 rounded-xl bg-surface-card-muted shrink-0" />
										<div className="flex-1 flex flex-col gap-1.5 min-w-0">
											<div className="h-4 bg-surface-card-muted rounded w-32" />
											<div className="h-3 bg-surface-card-muted rounded w-20" />
										</div>
									</div>
								))}
							</div>
						) : upcomingEvents.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
								<div className="size-12 rounded-full bg-surface-card-muted flex items-center justify-center text-text-tertiary">
									<Icon as={CalendarOutSvg} size="md" color="inherit" />
								</div>
								<div>
									<p className="text-label-sm font-semibold text-text-primary">No upcoming events yet</p>
									<p className="text-caption text-text-secondary mt-0.5">Create and publish an event to see it here.</p>
								</div>
							</div>
						) : (
							<div className="flex flex-col divide-y divide-border-default">
								{upcomingEvents.map((event) => {
									const statusCfg = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.DRAFT
									const dateStr = formatEventDateRange(event.eventDate ?? undefined, event.endDate)
									return (
										<Link
											key={event.id}
											href={`/host/dashboard/events/${event.id}`}
											className="group/item flex items-center justify-between px-5 h-20 hover:bg-surface-card-muted/50 hover:pl-7 transition-all duration-300 ease-out"
										>
											<div className="flex items-center gap-3 min-w-0">
												{event.coverImageUrl ? (
													<div className="size-12 rounded-xl overflow-hidden shrink-0 border border-border-default">
														{/* eslint-disable-next-line @next/next/no-img-element */}
														<img src={event.coverImageUrl} alt="" className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-300" />
													</div>
												) : (
													<div className="size-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 group-hover/item:scale-115 group-hover/item:rotate-3 transition-transform duration-300">
														<Icon as={CalendarOutSvg} size="md" color="inherit" />
													</div>
												)}
												<div className="min-w-0">
													<p className="text-label-md font-semibold text-text-primary truncate group-hover/item:text-red-600 transition-colors duration-300">{event.title || "Untitled Event"}</p>
													<p className="text-caption text-text-tertiary mt-0.5">{dateStr} • {event.city || "Online"}</p>
												</div>
											</div>
											<span className={`inline-flex items-center px-2.5 py-0.5 rounded-badge text-[10px] font-semibold shrink-0 ${statusCfg.className}`}>
												{statusCfg.label}
											</span>
										</Link>
									)
								})}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
