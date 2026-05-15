"use client"

import { Suspense, useState, useEffect } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import clsx from "clsx"
import { getInterests, type Interest } from "@/lib/api"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import ArrowRightSvg from "@/icons/outlined/arrow-right.svg"
import CheckSvg from "@/icons/outlined/check.svg"
import StarSvg from "@/icons/filled/star.svg"
import LikeSvg from "@/icons/filled/like.svg"
import DislikeSvg from "@/icons/filled/dislike.svg"
import CheckCircleSvg from "@/icons/filled/check-circle.svg"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ATTENDEE_VIBES_KEY = "attendee_vibes"
export const ATTENDEE_ABOUT_KEY = "attendee_about"

// Substeps: 0 = Q1 (vibe style), 1 = Q2 (solo/group), 2 = swipe vibes, 3 = done
// Panel layout: substep 0-1 → dark LEFT / white RIGHT
//               substep 2-3 → white LEFT / dark RIGHT

const Q1_OPTIONS = [
	{ id: "party", label: "Life of the party", image: "/assets/attendee/life-of-the-party.svg" },
	{ id: "chill", label: "Chill and observing", image: "/assets/attendee/chill-and-observing.svg" },
	{ id: "connect", label: "Here to connect", image: "/assets/attendee/here-to-connect.svg" },
	{ id: "open", label: "Open to whatever comes", image: "/assets/attendee/open-to-whatever-comes.svg" },
]

const Q2_OPTIONS = [
	{ id: "solo", label: "Solo Explorer", image: "/assets/attendee/solo-explorer.svg" },
	{ id: "open", label: "Open to meeting people", image: "/assets/attendee/open-to-meeting-people.svg" },
	{ id: "gang", label: "Bringing my gang", image: "/assets/attendee/bringing-my-gang.svg" },
]

// ---------------------------------------------------------------------------
// Top bar
// ---------------------------------------------------------------------------

interface TopBarProps {
	substep: number
	isRequired: boolean
	onSkip: () => void
}

function TopBar({ substep, isRequired, onSkip }: TopBarProps) {
	const aboutDone = substep >= 2
	const aboutActive = substep < 2
	const vibeDone = substep >= 3
	const vibeActive = substep === 2

	return (
		<div className="shrink-0 h-16 relative flex items-center justify-between px-6 border-b border-border-subtle bg-surface-canvas">
			{/* Progress bar — centered, tracks Q1/Q2 sub-progress within About You */}
			{substep < 2 && (
				<div className="absolute left-1/2 -translate-x-1/2 w-32 h-2 bg-border-default rounded-full">
					<div
						className="h-full bg-action-primary rounded-full transition-all duration-300"
						style={{ width: substep === 0 ? "50%" : "100%" }}
					/>
				</div>
			)}

			{/* Step tabs */}
			<div className="flex items-center gap-1">
				<span
					className={clsx(
						"px-3 py-2 rounded-full text-label-sm transition-colors",
						aboutActive ? "bg-neutral-900 text-white font-semibold" : "text-text-secondary",
					)}
				>
					{aboutDone ? <Icon as={CheckSvg} size="sm" className="inline mr-0.5" /> : "1. "}About You
				</span>

				<span className="text-text-muted text-xs">·</span>

				<span
					className={clsx(
						"px-3 py-2 rounded-full text-label-sm transition-colors",
						vibeActive
							? "bg-neutral-900 text-white font-semibold"
							: vibeDone
								? "text-text-secondary"
								: "text-text-muted",
					)}
				>
					{vibeDone ? <Icon as={CheckSvg} size="sm" className="inline mr-0.5" /> : "2. "}Set Your
					Vibe
				</span>
			</div>

			{/* Skip */}
			{!isRequired && substep < 3 ? (
				<Button
					variant="secondary"
					size="sm"
					radius="pill"
					rightIcon={<ArrowRightSvg />}
					onClick={onSkip}
				>
					Skip &amp; Browse Events
				</Button>
			) : (
				<div />
			)}
		</div>
	)
}

// ---------------------------------------------------------------------------
// Dark panel — content changes based on step group
// ---------------------------------------------------------------------------

interface DarkPanelProps {
	group: "about" | "vibe"
}

function DarkPanel({ group }: DarkPanelProps) {
	const isAbout = group === "about"

	return (
		<div className="relative h-full overflow-hidden flex flex-col">
			{/* Background image */}
			<Image
				src="/onboarding/bg-pattern.png"
				alt=""
				fill
				sizes="34vw"
				className="object-cover object-bottom"
				aria-hidden
				priority
			/>

			{/* Red brand overlay */}
			<div className="absolute inset-0" />

			{/* Brand logo */}
			<div className="absolute top-6 left-8 z-10">
				<Image
					src="/assets/brand_logo.svg"
					alt="meetday"
					width={120}
					height={32}
					className="w-auto h-8"
					priority
				/>
			</div>

			{/* Content */}
			<div className="relative z-10 flex flex-col h-full px-8 py-10 justify-between">
				<div className="flex flex-col gap-4 mt-16">
					<h2 className="text-heading-md font-bold text-white leading-tight">
						{isAbout ? (
							<>
								Help us understand
								<br />
								your <span style={{ color: "#ff6b6b" }}>vibe</span>
							</>
						) : (
							<>
								Swipe to discover
								<br />
								your <span style={{ color: "#ff6b6b" }}>vibe.</span>
								<br />
								We&apos;ll handle the rest
							</>
						)}
					</h2>
					<p className="text-body-sm text-white/70 leading-relaxed max-w-xs">
						{isAbout
							? "A few fun questions to match you with the right events and like-minded people."
							: "Tell us what excites you (or not). We'll show you events and people that match your energy."}
					</p>
				</div>

				{/* Inline phone mockup */}
				{isAbout ? (
					<div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
						<Image src="/assets/attendee/phone-1.png" alt="Phone mockup" width={350} height={420} />
					</div>
				) : (
					<div className="absolute bottom-20 right-0">
						<Image src="/assets/attendee/phone-2.png" alt="Phone mockup" width={350} height={420} />
					</div>
				)}
			</div>
		</div>
	)
}

// ---------------------------------------------------------------------------
// Illustration option card (Q1 and Q2)
// ---------------------------------------------------------------------------

interface OptionCardProps {
	id: string
	label: string
	image: string
	selected: boolean
	onSelect: () => void
}

function OptionCard({ label, image, selected, onSelect }: OptionCardProps) {
	return (
		<button
			type="button"
			onClick={onSelect}
			className={clsx(
				"relative flex flex-col items-center gap-3 rounded-lg border-2 bg-surface-canvas overflow-hidden",
				"px-3 pt-3 pb-4 cursor-pointer transition-all duration-(--duration-150)",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus bg-surface-card-muted",
				selected
					? "border-action-primary bg-action-primary/10"
					: "border-border-brand/20 hover:border-border-brand",
			)}
		>
			{/* Selected indicator */}
			{selected && (
				<span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-action-primary flex items-center justify-center">
					<svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
						<path
							d="M2 5l2 2 4-4"
							stroke="white"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</span>
			)}
			{/* Image */}
			<div className="relative w-full aspect-square overflow-hidden rounded-lg">
				<Image src={image} alt="" fill className="object-cover object-top" aria-hidden />
			</div>
			{/* Label */}
				<p className="text-body-lg text-text-secondary text-center leading-snug mt-2">{label}</p>
		</button>
	)
}

// ---------------------------------------------------------------------------
// About You content (Steps 0 and 1)
// ---------------------------------------------------------------------------

interface AboutYouProps {
	substep: 0 | 1
	q1Value: string | null
	q2Value: string | null
	onQ1Change: (id: string) => void
	onQ2Change: (id: string) => void
	onNext: () => void
}

function AboutYouContent({ substep, q1Value, q2Value, onQ1Change, onQ2Change, onNext }: AboutYouProps) {
	const isQ1 = substep === 0
	const options = isQ1 ? Q1_OPTIONS : Q2_OPTIONS
	const selected = isQ1 ? q1Value : q2Value
	const onChange = isQ1 ? onQ1Change : onQ2Change
	const canNext = selected !== null

	return (
		<div className="flex flex-col h-full overflow-y-auto px-8 py-8">
			{/* Heading row */}
			<div className="flex items-start justify-between mb-1">
				<div>
					<h1 className="text-heading-md text-text-primary font-bold">Tell us a bit about you</h1>
					<p className="text-body-sm text-text-secondary mt-1">
						Pick what feels most like you. There&apos;s no wrong answer!
					</p>
				</div>
				<Button
					variant="primary"
					size="sm"
					radius="pill"
					rightIcon={<ArrowRightSvg />}
					disabled={!canNext}
					onClick={onNext}
				>
					Next
				</Button>
			</div>

			<div className="bg-border-subtle/10 p-6 rounded-card my-5 shadow-md">
				{/* Question */}
				<p className="text-title-md font-bold text-text-primary mb-6">
					{isQ1 ? "Your vibe at events?" : "You prefer going solo or with friends?"}
				</p>

				{/* Options grid */}
				<div className={clsx("grid gap-3", isQ1 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3")}>
					{options.map(opt => (
						<OptionCard
							key={opt.id}
							id={opt.id}
							label={opt.label}
							image={opt.image}
							selected={selected === opt.id}
							onSelect={() => onChange(opt.id)}
						/>
					))}
				</div>
			</div>
		</div>
	)
}

// ---------------------------------------------------------------------------
// Set Your Vibe — swipe step (Step 2)
// ---------------------------------------------------------------------------

type Affinity = "LIKED" | "OPEN_TO" | "DISLIKED"
type InterestAffinity = { interestId: string; affinity: Affinity }

interface SwipeStepProps {
	onDone: () => void
}

function SwipeStepContent({ onDone }: SwipeStepProps) {
	const [interests, setInterests] = useState<Interest[]>([])
	const [loading, setLoading] = useState(true)
	const [currentIdx, setCurrentIdx] = useState(0)
	const [affinities, setAffinities] = useState<InterestAffinity[]>([])

	useEffect(() => {
		getInterests()
			.then(setInterests)
			.finally(() => setLoading(false))
	}, [])

	function handleAction(action: "like" | "dislike" | "open") {
		const interest = interests[currentIdx]
		const affinity: Affinity = action === "like" ? "LIKED" : action === "open" ? "OPEN_TO" : "DISLIKED"
		const updated = [...affinities, { interestId: interest.id, affinity }]

		if (currentIdx + 1 >= interests.length) {
			try {
				localStorage.setItem(ATTENDEE_VIBES_KEY, JSON.stringify(updated))
			} catch {
				/* storage unavailable */
			}
			onDone()
		} else {
			setAffinities(updated)
			setCurrentIdx(i => i + 1)
		}
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="w-8 h-8 rounded-full border-2 border-action-primary border-t-transparent animate-spin" />
			</div>
		)
	}

	if (!interests.length) {
		return (
			<div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
				<p className="text-body-md text-text-secondary">Couldn&apos;t load interests. Please try again.</p>
				<Button variant="primary" size="sm" radius="pill" onClick={() => { setLoading(true); getInterests().then(setInterests).finally(() => setLoading(false)) }}>
					Retry
				</Button>
			</div>
		)
	}

	const interest = interests[currentIdx]
	const prevInterest = currentIdx > 0 ? interests[currentIdx - 1] : null
	const nextInterest = currentIdx + 1 < interests.length ? interests[currentIdx + 1] : null

	return (
		<div className="relative flex flex-col items-center justify-center h-full px-6 py-8 gap-6">
			<div
				className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
				style={{ backgroundImage: "url('/assets/main_bg.svg')" }}
			/>
			{/* Card stack */}
			<div
				className="relative z-10 flex items-center justify-center w-full"
				style={{ height: "450px" }}
			>
				{/* Background card — next */}
				{nextInterest && (
					<div
						className="absolute rounded-card overflow-hidden shadow-card"
						style={{
							width: "220px",
							height: "390px",
							right: "calc(50% - 130px)",
							transform: "rotate(5deg) translateX(40px)",
							zIndex: 1,
						}}
					>
						<Image src={nextInterest.image} alt="" fill sizes="220px" className="object-cover" aria-hidden />
						<div className="absolute inset-0 bg-white/40 rounded-card" />
					</div>
				)}

				{/* Background card — prev */}
				{prevInterest && (
					<div
						className="absolute rounded-card overflow-hidden shadow-card"
						style={{
							width: "220px",
							height: "390px",
							left: "calc(50% - 130px)",
							transform: "rotate(-5deg) translateX(-40px)",
							zIndex: 1,
						}}
					>
						<Image src={prevInterest.image} alt="" fill sizes="220px" className="object-cover" aria-hidden />
						<div className="absolute inset-0 bg-white/40 rounded-card" />
					</div>
				)}

				{/* Main card */}
				<div
					className="relative rounded-card overflow-hidden shadow-modal"
					style={{ width: "250px", height: "445px", zIndex: 2 }}
				>
					<Image src={interest.image} alt={interest.name} fill sizes="250px" className="object-cover" priority />
					<div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/40 to-transparent p-4">
						<p className="text-label-md font-bold text-white leading-tight">{interest.name}</p>
						<p className="text-caption text-white/70 mt-0.5 line-clamp-2">{interest.description}</p>
					</div>
				</div>
			</div>

			{/* Progress dots */}
			<div className="relative z-10 w-62.5 flex items-center justify-center gap-1.5">
				{interests.map((_: Interest, i: number) => (
					<div
						key={i}
						className={clsx(
							"rounded-full transition-all duration-(--duration-200)",
							i === currentIdx
								? "w-4 h-2 bg-action-primary"
								: i < currentIdx
									? "w-2 h-2 bg-neutral-300"
									: "w-2 h-2 bg-neutral-200",
						)}
					/>
				))}
			</div>

			{/* Action buttons */}
			<div className="relative z-10 w-62.5 flex items-center justify-between">
				<button
					type="button"
					onClick={() => handleAction("dislike")}
					className="w-14 h-14 rounded-full bg-neutral-900 shadow-card flex items-center justify-center hover:bg-neutral-800 active:bg-black transition-colors"
					aria-label="Dislike"
				>
					<Icon as={DislikeSvg} size="md" className="text-red-500 **:fill-current **:stroke-current" />
				</button>
				<button
					type="button"
					onClick={() => handleAction("open")}
					className="w-14 h-14 rounded-full bg-neutral-900 shadow-card flex items-center justify-center hover:bg-neutral-800 active:bg-black transition-colors"
					aria-label="Open to it"
				>
					<Icon as={StarSvg} size="md" className="text-amber-400 **:fill-current **:stroke-current" />
				</button>
				<button
					type="button"
					onClick={() => handleAction("like")}
					className="w-14 h-14 rounded-full bg-neutral-900 shadow-card flex items-center justify-center hover:bg-neutral-800 active:bg-black transition-colors"
					aria-label="Like"
				>
					<Icon as={LikeSvg} size="md" className="text-green-500 **:fill-current **:stroke-current" />
				</button>
			</div>
		</div>
	)
}

// ---------------------------------------------------------------------------
// Done screen (Step 3)
// ---------------------------------------------------------------------------

function DoneContent({ onExplore }: { onExplore: () => void }) {
	return (
		<div className="relative flex flex-col items-center justify-center h-full px-8 py-12 gap-6 text-center">
			<div
				className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
				style={{ backgroundImage: "url('/assets/main_bg.svg')" }}
			/>

			<div className="relative z-10 bg-surface-canvas rounded-card shadow-md flex flex-col items-center justify-center text-center p-6 gap-6 border border-border-subtle">
				<Icon as={CheckCircleSvg} color="success" className="size-20" />

				<div className="flex flex-col gap-2 max-w-xs">
					<h1 className="text-heading-sm font-bold text-text-primary leading-tight">
						You&apos;re all set to explore the events
					</h1>
					<p className="text-body-sm text-text-secondary">
						We&apos;ve got your vibe. Get ready to discover events and people you&apos;ll love.
					</p>
				</div>

				<Button
					variant="primary"
					size="lg"
					radius="pill"
					rightIcon={<ArrowRightSvg />}
					onClick={onExplore}
					className="w-full"
				>
					Explore Events
				</Button>
			</div>
		</div>
	)
}

// ---------------------------------------------------------------------------
// Main inner component
// ---------------------------------------------------------------------------

function OnboardingInner() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const isRequired = searchParams.get("required") === "true"

	const [substep, setSubstep] = useState<0 | 1 | 2 | 3>(0)
	const [q1, setQ1] = useState<string | null>(null)
	const [q2, setQ2] = useState<string | null>(null)

	// Panel layout
	const isAboutGroup = substep < 2 // dark LEFT, white RIGHT
	const panelGroup: "about" | "vibe" = isAboutGroup ? "about" : "vibe"

	function handleSkip() {
		router.push("/explore")
	}

	function handleNextFromAbout() {
		if (substep === 0) setSubstep(1)
		else if (substep === 1) setSubstep(2)
	}

	function handleSwipeDone() {
		setSubstep(3)
	}

	function handleExplore() {
		try {
			localStorage.setItem(ATTENDEE_ABOUT_KEY, JSON.stringify({ vibeStyle: q1, socialStyle: q2 }))
		} catch {
			/* storage unavailable */
		}
		router.push("/explore")
	}

	// Shared dark panel
	const darkPanel = (
		<div className="hidden lg:block shrink-0 w-[34%] relative">
			<DarkPanel group={panelGroup} />
		</div>
	)

	// White content panel — TopBar lives here, not at the outer level
	const contentPanel = (
		<div className="flex-1 bg-surface-canvas flex flex-col overflow-hidden">
			<TopBar substep={substep} isRequired={isRequired} onSkip={handleSkip} />
			{substep === 0 && (
				<AboutYouContent
					substep={0}
					q1Value={q1}
					q2Value={q2}
					onQ1Change={setQ1}
					onQ2Change={setQ2}
					onNext={handleNextFromAbout}
				/>
			)}
			{substep === 1 && (
				<AboutYouContent
					substep={1}
					q1Value={q1}
					q2Value={q2}
					onQ1Change={setQ1}
					onQ2Change={setQ2}
					onNext={handleNextFromAbout}
				/>
			)}
			{substep === 2 && <SwipeStepContent onDone={handleSwipeDone} />}
			{substep === 3 && <DoneContent onExplore={handleExplore} />}
		</div>
	)

	return (
		<div className="flex h-screen overflow-hidden">
			{isAboutGroup ? (
				<>
					{darkPanel}
					{contentPanel}
				</>
			) : (
				<>
					{contentPanel}
					{darkPanel}
				</>
			)}
		</div>
	)
}

// ---------------------------------------------------------------------------
// Page export
// ---------------------------------------------------------------------------

export default function AttendeeOnboardingPage() {
	return (
		<Suspense>
			<OnboardingInner />
		</Suspense>
	)
}
