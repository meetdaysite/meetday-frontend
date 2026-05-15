"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { VibeCard } from "@/components/attendee/VibeCard"
import { VIBE_CATEGORIES } from "@/lib/mock-attendee"

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
// Phone mockup — landing hero right panel
// ---------------------------------------------------------------------------

function PhoneMockup() {
	return (
		<div className="relative flex items-center justify-center lg:justify-end">
			{/* Ambient glow behind phone */}
			<div
				className="absolute top-1/2 right-8 -translate-y-1/2 w-80 h-80 rounded-full blur-[80px] pointer-events-none"
				style={{ background: "radial-gradient(circle, rgba(238,39,39,0.22) 0%, transparent 70%)" }}
			/>

			{/* Phone body — dark navy matching Figma device */}
			<div
				className="relative shadow-[0_32px_80px_rgba(0,0,0,0.45)]"
				style={{ borderRadius: "3rem" }}
			>
				{/* Outer shell */}
				<div
					className="relative overflow-hidden"
					style={{
						width: "272px",
						height: "560px",
						borderRadius: "3rem",
						background: "#0f172a",
						padding: "6px",
						boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
					}}
				>
					{/* Screen bezel */}
					<div
						className="relative w-full h-full overflow-hidden"
						style={{ borderRadius: "2.5rem" }}
					>
						{/* Screen gradient */}
						<div
							className="absolute inset-0"
							style={{
								background:
									"linear-gradient(160deg, #c41818 0%, #8b0f0f 35%, #3d0606 65%, #110202 100%)",
							}}
						/>

						{/* Dot grid texture */}
						<div
							className="absolute inset-0 opacity-[0.12]"
							style={{
								backgroundImage:
									"radial-gradient(circle, #ffffff 1px, transparent 1px)",
								backgroundSize: "20px 20px",
							}}
						/>

						{/* Vignette overlay */}
						<div
							className="absolute inset-0"
							style={{
								background:
									"radial-gradient(ellipse at 50% 40%, transparent 40%, rgba(0,0,0,0.55) 100%)",
							}}
						/>

						{/* Dynamic island */}
						<div
							className="absolute top-3 left-1/2 -translate-x-1/2 z-20"
							style={{
								width: "88px",
								height: "26px",
								background: "#0f172a",
								borderRadius: "99px",
							}}
						/>

						{/* Screen content */}
						<div className="relative z-10 h-full flex flex-col justify-between px-6 pt-14 pb-8">
							{/* Headline */}
							<div className="flex flex-col gap-2 mt-6">
								<p
									className="text-white font-bold leading-[1.15]"
									style={{ fontSize: "28px" }}
								>
									Skip the<br />crowd.
								</p>
								<p
									className="text-white font-bold leading-[1.15]"
									style={{ fontSize: "28px" }}
								>
									Find your<br />tribe.
								</p>
							</div>

							{/* Bottom wordmark */}
							<div className="flex items-end justify-between">
								<span
									className="font-bold text-white"
									style={{ fontSize: "22px", letterSpacing: "-0.02em" }}
								>
									meet<span style={{ color: "#ff6b6b" }}>day</span>
									<span className="text-white/50 text-xs align-super ml-0.5">™</span>
								</span>

								{/* Home indicator */}
								<div
									className="mb-1"
									style={{
										width: "80px",
										height: "4px",
										background: "rgba(255,255,255,0.25)",
										borderRadius: "99px",
									}}
								/>
							</div>
						</div>
					</div>
				</div>

				{/* Side button accents */}
				<div
					className="absolute top-24 -right-0.75"
					style={{
						width: "3px",
						height: "56px",
						background: "#0a1020",
						borderRadius: "0 2px 2px 0",
					}}
				/>
				<div
					className="absolute top-20 -left-0.75"
					style={{
						width: "3px",
						height: "36px",
						background: "#0a1020",
						borderRadius: "2px 0 0 2px",
					}}
				/>
				<div
					className="absolute top-32 -left-0.75"
					style={{
						width: "3px",
						height: "56px",
						background: "#0a1020",
						borderRadius: "2px 0 0 2px",
					}}
				/>
			</div>
		</div>
	)
}

// ---------------------------------------------------------------------------
// Landing page
// ---------------------------------------------------------------------------

export default function AttendeeLandingPage() {
	const router = useRouter()

	function handleVibeClick(vibeId: string) {
		router.push(`/explore?vibe=${vibeId}`)
	}

	return (
		<div
			className="relative flex flex-col flex-1 w-full bg-cover bg-top bg-no-repeat"
			style={{ backgroundImage: "url('/assets/attendee-bg.svg')" }}
		>

			{/* Shared wrapper — relative so the phone can span hero + vibe sections */}
			<div className="relative z-10 flex flex-col flex-1">

				{/* Phone — desktop only, absolutely positioned to bleed into vibe section */}
				<div
					className="hidden lg:block absolute z-20"
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
				<section className="flex-1 w-full max-w-7xl mx-auto px-(--space-page-x-mobile) md:px-(--space-page-x-tablet) lg:px-(--space-page-x-desktop) py-12 md:py-16 lg:py-20">
					{/* Left content only — phone is absolutely positioned on the right on desktop */}
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

						<div>
							<Link
								href="/attendee/onboarding"
								className="inline-flex items-center justify-center gap-2 h-(--size-action-lg) px-6 text-label-md font-semibold bg-neutral-900 text-white rounded-action hover:bg-neutral-800 active:bg-neutral-950 transition-colors"
							>
								Start exploring <ArrowRightIcon />
							</Link>
						</div>

						{/* Trust badges */}
						<div className="flex flex-wrap lg:flex-nowrap gap-3 pt-1">
							<TrustBadge
								icon={<ShieldCheckIcon />}
								label="Safe & verified"
								sublabel="Real people. Real connections."
							/>
							<TrustBadge
								icon={<UsersMatchIcon />}
								label="Vibe-based matching"
								sublabel="Find people who feel like you."
							/>
							<TrustBadge
								icon={<GiftIcon />}
								label="Earn rewards"
								sublabel="Invite friends, get credits."
							/>
						</div>
					</div>
				</section>

				{/* ------------------------------------------------------------
				    Vibe strip — full-bleed auto-scroll marquee
				    No z-index on the section so it doesn't form a stacking context;
				    the marquee div gets z-30 directly in the wrapper's context,
				    placing it above the phone (z-20).
				------------------------------------------------------------ */}
				<section className="relative bg-surface-canvas border-t border-border-subtle py-8">
					<p className="text-body-sm text-text-secondary text-center mb-5 px-(--space-page-x-mobile)">
						Choose your vibe, and we will curate an experience for you
					</p>

					{/* Marquee: two identical groups, translateX(-50%) loops seamlessly */}
					<div className="relative z-30 overflow-hidden">
						<div className="flex animate-marquee">
							{/* Group A */}
							<div className="flex gap-3 shrink-0 pr-3">
								{VIBE_CATEGORIES.map((vibe) => (
									<VibeCard
										key={vibe.id}
										vibe={vibe}
										onClick={() => handleVibeClick(vibe.id)}
									/>
								))}
							</div>
							{/* Group B — seamless loop duplicate */}
							<div className="flex gap-3 shrink-0 pr-3" aria-hidden="true">
								{VIBE_CATEGORIES.map((vibe) => (
									<VibeCard
										key={`dup-${vibe.id}`}
										vibe={vibe}
										onClick={() => handleVibeClick(vibe.id)}
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

// ---------------------------------------------------------------------------
// Icon helpers — all use currentColor
// ---------------------------------------------------------------------------

function ArrowRightIcon() {
	return (
		<svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
			<path
				d="M8 3l4.5 4.5L8 12"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M2.5 7.5h10"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
			/>
		</svg>
	)
}

function ShieldCheckIcon() {
	return (
		<svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
			<path
				d="M7.5 1.5L2 4v3.5C2 10.5 4.5 13 7.5 14c3-1 5.5-3.5 5.5-6.5V4L7.5 1.5z"
				stroke="currentColor"
				strokeWidth="1.4"
				strokeLinejoin="round"
			/>
			<path
				d="M5 7.5l1.5 1.5 3-3"
				stroke="currentColor"
				strokeWidth="1.4"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

function UsersMatchIcon() {
	return (
		<svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
			<circle cx="5.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
			<path
				d="M1.5 13c0-2.2 1.8-4 4-4s4 1.8 4 4"
				stroke="currentColor"
				strokeWidth="1.4"
				strokeLinecap="round"
			/>
			<circle cx="11" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.3" />
			<path
				d="M8.5 13c0-1.7 1.1-3.1 2.5-3.4"
				stroke="currentColor"
				strokeWidth="1.3"
				strokeLinecap="round"
			/>
		</svg>
	)
}

function GiftIcon() {
	return (
		<svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
			<rect x="1.5" y="5" width="12" height="2.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
			<rect x="3" y="7.5" width="9" height="6" rx="0.75" stroke="currentColor" strokeWidth="1.3" />
			<path d="M7.5 5v8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
			<path
				d="M7.5 5C7.5 5 6 3 4.5 3.5S4 6 7.5 5z"
				stroke="currentColor"
				strokeWidth="1.2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M7.5 5C7.5 5 9 3 10.5 3.5S11 6 7.5 5z"
				stroke="currentColor"
				strokeWidth="1.2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

