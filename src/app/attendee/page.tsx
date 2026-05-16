"use client"

import { useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import ArrowRightSvg from "@/icons/outlined/arrow-right.svg"
import ShieldCheckSvg from "@/icons/outlined/shield-check.svg"
import UserGroupSvg from "@/icons/outlined/users-group.svg"
import GiftSvg from "@/icons/outlined/gift.svg"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import { useAuthStore } from "@/store/authStore"

// ---------------------------------------------------------------------------
// Trust badge chip
// ---------------------------------------------------------------------------

interface TrustBadgeProps {
	icon: React.ReactNode
	label: string
	sublabel: string
}

function TrustBadge({ icon, label, sublabel }: TrustBadgeProps) {
	return (
		<div className="flex items-start gap-2.5 px-3 py-2.5 rounded-action border border-border-default bg-surface-canvas shadow-card">
			<span className="mt-0.5 shrink-0 text-text-brand">{icon}</span>
			<div>
				<p className="text-label-sm font-semibold text-text-primary leading-tight">{label}</p>
				<p className="text-caption text-text-secondary mt-0.5">{sublabel}</p>
			</div>
		</div>
	)
}

// ---------------------------------------------------------------------------
// Phone mockup â€” landing hero right panel
// ---------------------------------------------------------------------------

function PhoneMockup() {
	return (
		<div className="relative flex items-center justify-center lg:justify-end">
			<Image
				src="/assets/attendee/landing/phone-mockup.svg"
				alt="Meetday app on phone"
				width={460}
				height={870}
				priority
				style={{ width: "clamp(280px, 23vw, 460px)", height: "auto" }}
			/>
		</div>
	)
}

// ---------------------------------------------------------------------------
// Landing page
// ---------------------------------------------------------------------------

const TICKET_CARDS = [1, 2, 3, 4, 5, 6, 7]

export default function AttendeeLandingPage() {
	const router = useRouter()
	const { user, authLoading } = useAuthStore()

	useEffect(() => {
		if (!authLoading && user) {
			router.replace("/explore")
		}
	}, [user, authLoading, router])

	if (authLoading) return null

	return (
		<div
			className="relative flex flex-col flex-1 w-full bg-cover bg-top bg-no-repeat overflow-hidden"
			style={{ backgroundImage: "url('/assets/attendee/attendee_bg.png')" }}
		>

			{/* Shared wrapper â€” relative so the phone can span hero + vibe sections */}
			<div className="relative z-10 flex flex-col flex-1">

				{/* Phone â€” desktop only, absolutely positioned to bleed into vibe section */}
				<div
					className="hidden lg:block absolute z-30"
					style={{
						top: "3.5rem",
						right: "max(calc((100% - 80rem) / 2 + 2.5rem), 2.5rem)",
					}}
				>
					<PhoneMockup />
				</div>

				{/* ------------------------------------------------------------
				    Hero section
				------------------------------------------------------------ */}
				<section className="flex-1 w-full max-w-7xl mx-auto px-(--space-page-x-mobile) md:px-(--space-page-x-tablet) lg:px-(--space-page-x-desktop) pb-12 md:pb-16 lg:pb-20 pt-4 md:pt-6 lg:pt-8 2xl:pt-20">
					{/* Brand logo */}
					<div className="mb-8">
						<Image
							src="/assets/brand_logo.svg"
							alt="Meetday"
							width={120}
							height={36}
							priority
							style={{ height: "auto" }}
						/>
					</div>

					{/* Left content only â€” phone is absolutely positioned on the right on desktop */}
					<div className="flex flex-col gap-6 max-w-xl">
						<div className="flex flex-col gap-1">
							<h1 className="text-2xl md:text-4xl font-extrabold text-text-primary leading-[1.1]">
								Don&apos;t just attend events.
							</h1>
							<h2 className="text-2xl md:text-4xl font-extrabold font-extra leading-[1.1]">
								Create your{" "}
								<span className="text-text-brand">vibe</span>
								{" "}and find your{" "}
								<span className="text-text-brand">people</span>
							</h2>
						</div>

						<p className="text-body-sm md:text-body-md text-text-secondary leading-relaxed">
							Discover events, meet like-minded people, and build real
							connections &mdash; before, during, and after.
						</p>

						<div className="flex items-center gap-3">
							<Link
								href="/attendee/onboarding"
								className="inline-flex items-center justify-center gap-2 h-(--size-action-lg) px-6 text-label-md font-semibold bg-neutral-900 text-white rounded-action hover:bg-neutral-800 active:bg-neutral-950 transition-colors"
							>
								Start exploring <Icon as={ArrowRightSvg} size="sm"/>
							</Link>
							<Button
								variant="primary"
								size="lg"
								onClick={() => router.push("/attendee/login")}
								className="w-30"
							>
								Login
							</Button>
						</div>

						{/* Trust badges */}
						<div className="flex flex-wrap lg:flex-nowrap gap-3 pt-1">
							<TrustBadge
								icon={<Icon as ={ShieldCheckSvg} size="sm" color="brand"/>}
								label="Safe & verified"
								sublabel="Real people. Real connections."
							/>
							<TrustBadge
								icon={<Icon as ={UserGroupSvg} size="sm" color="brand"/>}
								label="Vibe-based matching"
								sublabel="Find people who feel like you."
							/>
							<TrustBadge
								icon={<Icon as ={GiftSvg} size="sm" color="brand"/>}
								label="Earn rewards"
								sublabel="Invite friends, get credits."
							/>
						</div>
					</div>
				</section>


				<section className="relative bg-surface-canvas border-t border-border-subtle py-8 lg:-mt-36 xl:-mt-44 2xl:-mt-52 2xl:pb-20">
					<p className="text-body-sm text-text-secondary text-left mb-5 px-(--space-page-x-mobile) md:px-(--space-page-x-tablet) lg:px-(--space-page-x-desktop) lg:pl-32">
						Choose your vibe, and we will curate an experience for you
					</p>

					{/* Marquee: two identical groups, translateX(-50%) loops seamlessly */}
					<div className="relative z-40 overflow-hidden">
						<div className="flex animate-marquee">
							{/* Group A */}
							<div className="flex gap-3 shrink-0 pr-3">
								{TICKET_CARDS.map((n) => (
									<Image
										key={n}
										src={`/assets/attendee/landing/ticket-card-${n}.svg`}
										alt=""
										width={340}
										height={436}
										loading="eager"
										className="shrink-0"
										style={{ width: "clamp(180px, 17vw, 340px)", height: "auto" }}
									/>
								))}
							</div>
							{/* Group B â€” seamless loop duplicate */}
							<div className="flex gap-3 shrink-0 pr-3" aria-hidden="true">
								{TICKET_CARDS.map((n) => (
									<Image
										key={`dup-${n}`}
										src={`/assets/attendee/landing/ticket-card-${n}.svg`}
										alt=""
										width={340}
										height={436}
										loading="eager"
										className="shrink-0"
										style={{ width: "clamp(180px, 17vw, 340px)", height: "auto" }}
									/>
								))}
							</div>
						</div>
					</div>
				</section>
			</div>
		</div>
	)
}

