import Image from "next/image"
import { OnboardingCalloutCard } from "./OnboardingCalloutCard"
import type { StepPanelConfig } from "@/app/onboarding/config"

type Props = {
	config: StepPanelConfig
}

export function OnboardingLeftPanel({ config }: Props) {
	return (
		<div className="relative w-full h-full overflow-hidden">
			{/* Static background — shared across all steps */}
			<Image
				src="/onboarding/bg-pattern.png"
				alt=""
				fill
				sizes="44vw"
				className="object-cover object-bottom scale-120"
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
					className="w-auto h-8"
				/>
			</div>

			{/* Heading + description — top-left */}
			<div className="absolute top-20 left-8 right-8 z-10">
				<h2 className="text-heading-lg font-semibold text-text-inverse leading-none max-w-2xl">
					{config.headingPlain}
					<br />
					<span className="text-text-brand">{config.headingHighlight}</span>
				</h2>
				<p className="text-body-md text-text-inverse mt-6 leading-relaxed max-w-lg">
					{config.description}
				</p>
			</div>

			{/* Person image — bottom-center, bleeds to bottom edge */}
			<div className="absolute inset-x-0 -bottom-15 flex justify-center items-end z-10 pointer-events-none">
				<Image
					src={config.personImage}
					alt=""
					width={420}
					height={520}
					className="object-contain object-bottom max-h-[72vh] w-auto"
					aria-hidden
					priority
				/>
			</div>

			{/* Callout cards */}
			{config.cards.map((card, i) => (
				<OnboardingCalloutCard
					key={i}
					icon={card.icon}
					iconBg={card.iconBg}
					title={card.title}
					body={card.body}
					style={card.position}
				/>
			))}

			{/* Social proof badge (step 1 only) */}
			{config.socialProof && (
				<div
					className="absolute z-20 flex items-start gap-3 bg-surface-inverse rounded-card shadow-floating px-4 py-3 max-w-72 border border-neutral-700"
					style={config.socialProof.position}
				>
					<Image
						src={config.socialProof.icon}
						alt=""
						width={80}
						height={40}
						className="shrink-0"
						style={{ height: "auto" }}
						aria-hidden
					/>
					<p className="text-body-sm font-bold text-text-inverse leading-snug flex-1">
						{config.socialProof.text}
					</p>
					<Image
						src="/icons/onboarding/heart.svg"
						alt=""
						width={28}
						height={28}
						aria-hidden
						className="shrink-0 self-end"
					/>
				</div>
			)}
		</div>
	)
}
