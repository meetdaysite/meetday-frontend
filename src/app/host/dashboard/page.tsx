"use client"

import Link from "next/link"
import { Icon } from "@/components/ui/Icon"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import { useHostStore } from "@/store/hostStore"

import CalendarOutSvg from "@/icons/outlined/calendar.svg"
import DocumentTextSvg from "@/icons/outlined/document-text.svg"
import AltArrowRightSvg from "@/icons/outlined/alt-arrow-right.svg"

export default function DashboardWelcomePage() {
	const { profile } = useHostStore()
	const displayName = profile?.displayName || "Host"

	return (
		<div className="flex flex-col min-h-screen bg-surface-page">
			<DashboardTopBar />

			<div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-4xl mx-auto w-full text-center">
				{/* Welcome Header */}
				<div className="mb-12 animate-fade-in">
					<h1 className="text-4xl md:text-6xl font-black tracking-tight text-text-primary leading-tight">
						Welcome to <span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">meetday!</span>
					</h1>
					<p className="text-lg md:text-xl text-text-secondary mt-4 max-w-2xl mx-auto font-medium">
						Hey {displayName}, let&apos;s get you started. What are we building today?
					</p>
				</div>

				{/* Two CTAs grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
					{/* CTA 1: Raise Sponsorship */}
					<Link
						href="/host/dashboard/proposal"
						className="group relative flex flex-col items-start text-left p-8 rounded-3xl border border-border-default bg-surface-card shadow-lg hover:shadow-2xl hover:border-orange-500/30 transition-all duration-300 overflow-hidden"
					>
						{/* Background gradient hint */}
						<div className="absolute -right-16 -top-16 size-48 rounded-full bg-orange-500/10 blur-3xl group-hover:bg-orange-500/20 transition-all duration-300" />
						
						<div className="size-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
							<Icon as={DocumentTextSvg} size="lg" color="inherit" />
						</div>

						<h2 className="text-2xl font-bold text-text-primary leading-snug">
							Raise Sponsorship
						</h2>
						<p className="text-body-md text-text-secondary mt-2 mb-8 flex-1">
							Create a professional proposal, connect with top brands, and secure funding for your upcoming events.
						</p>

						<div className="flex items-center gap-2 text-label-md font-bold text-orange-600 group-hover:translate-x-1.5 transition-transform duration-300">
							Get Sponsored
							<AltArrowRightSvg className="size-4" aria-hidden />
						</div>
					</Link>

					{/* CTA 2: Host an Experience */}
					<Link
						href="/host/dashboard/create"
						className="group relative flex flex-col items-start text-left p-8 rounded-3xl border border-border-default bg-surface-card shadow-lg hover:shadow-2xl hover:border-red-500/30 transition-all duration-300 overflow-hidden"
					>
						{/* Background gradient hint */}
						<div className="absolute -right-16 -top-16 size-48 rounded-full bg-red-500/10 blur-3xl group-hover:bg-red-500/20 transition-all duration-300" />

						<div className="size-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
							<Icon as={CalendarOutSvg} size="lg" color="inherit" />
						</div>

						<h2 className="text-2xl font-bold text-text-primary leading-snug">
							Host an Experience
						</h2>
						<p className="text-body-md text-text-secondary mt-2 mb-8 flex-1">
							Set up ticket types, dates, venue details, and invite your community to a brand new unforgettable experience.
						</p>

						<div className="flex items-center gap-2 text-label-md font-bold text-red-600 group-hover:translate-x-1.5 transition-transform duration-300">
							Create Event
							<AltArrowRightSvg className="size-4" aria-hidden />
						</div>
					</Link>
				</div>
			</div>
		</div>
	)
}
