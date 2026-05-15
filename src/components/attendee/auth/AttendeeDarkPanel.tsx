import Image from "next/image"
import type { CSSProperties } from "react"
import { OnboardingCalloutCard } from "@/components/onboarding/OnboardingCalloutCard"

export type AttendeePanelVariant = "login" | "signup" | "verify"

interface AttendeeDarkPanelProps {
	variant: AttendeePanelVariant
}

type CardConfig = {
	icon: string
	iconBg: string
	title: string
	body: string
	position: CSSProperties
	iconStyle?: CSSProperties
}

// CSS filters to colorize black SVG <img> elements
const FILTER_RED = "brightness(0) saturate(100%) invert(27%) sepia(74%) saturate(1500%) hue-rotate(335deg) brightness(105%)"
const FILTER_GREEN = "brightness(0) saturate(100%) invert(55%) sepia(60%) saturate(500%) hue-rotate(100deg) brightness(95%)"
const FILTER_BLUE = "brightness(0) saturate(100%) invert(38%) sepia(80%) saturate(700%) hue-rotate(200deg) brightness(100%)"
const FILTER_PURPLE = "brightness(0) saturate(100%) invert(30%) sepia(60%) saturate(900%) hue-rotate(260deg) brightness(100%)"

const PHONE_IMAGES: Record<AttendeePanelVariant, string> = {
	login: "/assets/attendee/phone-login.png",
	signup: "/assets/attendee/phone-signup.png",
	verify: "/assets/attendee/phone-otp-verify.png",
}

const CARDS: Record<AttendeePanelVariant, CardConfig[]> = {
	login: [
		{
			icon: "/icons/filled/shield-check.svg",
			iconBg: "#FFFFFF",
			title: "Safe by Design",
			body: "Verified hosts and attendees only",
			position: { top: "8%", left: "4%" },
			iconStyle: { filter: FILTER_BLUE },
		},
		{
			icon: "/icons/onboarding/users-group.svg",
			iconBg: "#F0FDF4",
			title: "Real connections",
			body: "Meet people who get you.",
			position: { top: "36%", right: "4%" },
		},
		{
			icon: "/icons/onboarding/heart.svg",
			iconBg: "#FFFBEB",
			title: "Create memories",
			body: "Events picked around your interests.",
			position: { bottom: "24%", left: "4%" },
		},
		{
			icon: "/icons/filled/users-group-2.svg",
			iconBg: "#FFFFFF",
			title: "Vibe-based matching",
			body: "Find people who match your vibe",
			position: { bottom: "6%", right: "4%" },
			iconStyle: { filter: FILTER_PURPLE },
		},
	],
	signup: [
		{
			icon: "/icons/filled/shield-check.svg",
			iconBg: "#FFFFFF",
			title: "Safe by Design",
			body: "Verified hosts and attendees only",
			position: { top: "8%", right: "4%" },
			iconStyle: { filter: FILTER_GREEN },
		},
		{
			icon: "/icons/onboarding/users-group.svg",
			iconBg: "#F0FDF4",
			title: "Real connections",
			body: "Meet people who get you.",
			position: { top: "36%", left: "4%" },
		},
		{
			icon: "/icons/onboarding/heart.svg",
			iconBg: "#FFFBEB",
			title: "Create memories",
			body: "Events picked around your interests.",
			position: { bottom: "24%", right: "4%" },
		},
		{
			icon: "/icons/filled/users-group-2.svg",
			iconBg: "#FFFFFF",
			title: "Vibe-based matching",
			body: "Find people who match your vibe",
			position: { bottom: "6%", left: "4%" },
			iconStyle: { filter: FILTER_RED },
		},
	],
	verify: [
		{
			icon: "/icons/filled/shield-check.svg",
			iconBg: "#EFF6FF",
			title: "Fast access",
			body: "Quick check-ins, Zero hassle.",
			position: { top: "8%", left: "4%" },
			iconStyle: { filter: FILTER_GREEN },
		},
		{
			icon: "/icons/onboarding/check-circle.svg",
			iconBg: "#F0FDF4",
			title: "Trusted Community",
			body: "Built for real connections",
			position: { top: "36%", right: "4%" },
		},
		{
			icon: "/icons/onboarding/users-group.svg",
			iconBg: "#FFFBEB",
			title: "Discover your vibe",
			body: "Curated experience that match you.",
			position: { bottom: "24%", left: "4%" },
		},
		{
			icon: "/icons/filled/users-group-2.svg",
			iconBg: "#FFFBEB",
			title: "Meet people",
			body: "Find your crowd, your vibe.",
			position: { bottom: "6%", right: "4%" },
			iconStyle: { filter: FILTER_PURPLE },
		},
	],
}

export function AttendeeDarkPanel({ variant }: AttendeeDarkPanelProps) {
	const cards = CARDS[variant]

	return (
		<div className="relative w-full h-full overflow-hidden flex items-center justify-center">
			{/* Phone mockup — centered */}
			<Image
				src={PHONE_IMAGES[variant]}
				alt=""
				width={480}
				height={960}
				className="object-contain h-[70vh] w-auto drop-shadow-xl relative z-10"
				aria-hidden
				priority
			/>

			{/* Floating callout cards */}
			{cards.map((card, i) => (
				<OnboardingCalloutCard
					key={i}
					icon={card.icon}
					iconBg={card.iconBg}
					title={card.title}
					body={card.body}
					style={card.position}
					iconStyle={card.iconStyle}
				/>
			))}
		</div>
	)
}
