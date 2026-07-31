import Image from "next/image"
import type { CSSProperties } from "react"
import { OnboardingCalloutCard } from "@/components/onboarding/OnboardingCalloutCard"

export type BrandPanelVariant = "login" | "signup" | "verify"

interface BrandDarkPanelProps {
	variant: BrandPanelVariant
}

type CardConfig = {
	icon: string
	iconBg: string
	title: string
	body: string
	position: CSSProperties
	iconStyle?: CSSProperties
}

const CARDS: CardConfig[] = [
	{
		icon: "/icons/onboarding/user.svg",
		iconBg: "#EFF6FF",
		title: "1. Onboarding",
		body: "The brand or agency signs up and shares a few key details so we can match them to the right events and communities.",
		position: { top: "10%", left: "8%", right: "8%" },
	},
	{
		icon: "/icons/onboarding/chart-2.svg",
		iconBg: "#FEF2F2",
		title: "2. Create a campaign / RFP",
		body: "The brand creates a campaign or RFP manually, describing what they are looking for.",
		position: { top: "38%", left: "8%", right: "8%" },
	},
	{
		icon: "/icons/onboarding/shield-check.svg",
		iconBg: "#F0FDF4",
		title: "3. Admin review",
		body: "A Meetday admin reviews the campaign and either approves or rejects it.",
		position: { top: "66%", left: "8%", right: "8%" },
	},
]

export function BrandDarkPanel({ variant }: BrandDarkPanelProps) {
	return (
		<div className="relative w-full h-full min-h-[600px] overflow-hidden bg-neutral-950 flex flex-col justify-center px-10 py-12">
			{/* Static background pattern */}
			<Image
				src="/onboarding/bg-pattern.png"
				alt=""
				fill
				sizes="44vw"
				className="object-cover object-bottom scale-120 opacity-30 pointer-events-none select-none"
				aria-hidden
				priority
			/>

			{/* Logo — top-left */}
			<div className="absolute top-6 left-8 z-10">
				<Image
					src="/assets/brand_logo.svg"
					alt="meetday"
					width={120}
					height={32}
					className="w-auto h-8 brightness-0 invert"
				/>
			</div>

			{/* Headline */}
			<div className="relative z-10 mb-8 mt-12">
				<h2 className="text-heading-md font-extrabold text-white leading-tight">
					Grow with <span className="text-text-brand">Meetday for Brands</span>
				</h2>
				<p className="text-body-sm text-neutral-400 mt-2">
					Collaborate with top hosts, discover communities, and scale your brand presence.
				</p>
			</div>

			{/* Steps */}
			<div className="relative z-10 flex flex-col gap-5 max-w-lg">
				{CARDS.map((card, i) => (
					<div
						key={i}
						className="flex gap-4 p-5 rounded-panel border border-neutral-800 bg-neutral-900/80 backdrop-blur-md shadow-lg"
					>
						<div
							className="size-11 rounded-badge flex items-center justify-center shrink-0"
							style={{ backgroundColor: card.iconBg }}
						>
							<Image
								src={card.icon}
								alt=""
								width={22}
								height={22}
								className="w-5 h-5 object-contain"
								style={card.iconStyle}
							/>
						</div>
						<div>
							<h3 className="text-title-sm font-bold text-white mb-1">{card.title}</h3>
							<p className="text-body-xs text-neutral-300 leading-relaxed">{card.body}</p>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
