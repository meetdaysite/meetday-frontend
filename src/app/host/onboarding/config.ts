import type { CSSProperties } from "react"

export type CardConfig = {
	icon: string
	iconBg: string
	title: string
	body: string
	position: CSSProperties
}

export type SocialProofConfig = {
	icon: string
	text: string
	position: CSSProperties
}

export type StepPanelConfig = {
	headingPlain: string
	headingHighlight: string
	description: string
	personImage: string
	cards: CardConfig[]
	socialProof?: SocialProofConfig
}

export const STEP_PANEL_CONFIGS: StepPanelConfig[] = [
	// Step 1 — Tell us about you
	{
		headingPlain: "Your story",
		headingHighlight: "shapes the experience",
		description: "Hosts like you build more than events. You build trust, community, and moment that matter",
		personImage: "/onboarding/person-2.png",
		cards: [
			{
				icon: "/icons/onboarding/shield-check.svg",
				iconBg: "#EFF6FF",
				title: "Trusted by real people",
				body: "Build credibility that lasts.",
				position: { bottom: "44%", left: "4%" },
			},
			{
				icon: "/icons/onboarding/users-group-two.svg",
				iconBg: "#FEF2F2",
				title: "Your identity, your way",
				body: "Show up how you want.",
				position: { top: "38%", right: "6%" },
			},
			{
				icon: "/icons/onboarding/users-group.svg",
				iconBg: "#F0FDF4",
				title: "Grow your audience",
				body: "Connect with the right people.",
				position: { bottom: "16%", left: "4%" },
			},
		],
		socialProof: {
			icon: "/icons/onboarding/avatar-stack.svg",
			text: "People can't wait to join what you're building",
			position: { bottom: "4%", left: "50%" },
		},
	},

	// Step 2 — Set up your host profile
	{
		headingPlain: "Make your",
		headingHighlight: "profile feel human",
		description: "A little about you goes a long way. Help people connect with the human behind the host.",
		personImage: "/onboarding/person-3.png",
		cards: [
			{
				icon: "/icons/onboarding/heart.svg",
				iconBg: "#FEF2F2",
				title: "First impressions",
				body: "A great profile helps people connect.",
				position: { top: "36%", right: "2%" },
			},
			{
				icon: "/icons/onboarding/user.svg",
				iconBg: "#F5F3FF",
				title: "Your identity,",
				body: "Help people get to know the real you.",
				position: { top: "52%", left: "4%" },
			},
			{
				icon: "/icons/onboarding/stars.svg",
				iconBg: "#FFFBEB",
				title: "Memorable hosting",
				body: "People remember how you make them feel!",
				position: { bottom: "8%", left: "18%" },
			},
		],
	},

	// Step 3 — Links & legal details
	{
		headingPlain: "Build trust",
		headingHighlight: "beyond the profile",
		description: "Add your links and legal details to boost credibility, get discovered, and unlock more opportunities.",
		personImage: "/onboarding/person-3.png",
		cards: [
			{
				icon: "/icons/onboarding/diploma.svg",
				iconBg: "#FFFBEB",
				title: "More credibility",
				body: "Verified details build instant trust.",
				position: { top: "38%", right: "2%" },
			},
			{
				icon: "/icons/onboarding/chart-2.svg",
				iconBg: "#EFF6FF",
				title: "Better discoverability",
				body: "Get the right people to get found.",
				position: { top: "54%", left: "4%" },
			},
			{
				icon: "/icons/onboarding/check-circle.svg",
				iconBg: "#F0FDF4",
				title: "Verification ready",
				body: "Complete your details to unlock more hosting features.",
				position: { bottom: "8%", left: "18%" },
			},
		],
	},

	// Step 4 — Experience & Focus
	{
		headingPlain: "Let your",
		headingHighlight: "experience speak",
		description: "Every event you've hosted has shaped who you are. Tell us about your journey so we can match you with the right tools and community.",
		personImage: "/onboarding/person-2.png",
		cards: [
			{
				icon: "/icons/onboarding/stars.svg",
				iconBg: "#FFFBEB",
				title: "Expertise recognised",
				body: "Your experience helps you stand out.",
				position: { top: "36%", right: "2%" },
			},
			{
				icon: "/icons/onboarding/users-group.svg",
				iconBg: "#EFF6FF",
				title: "Right community",
				body: "Get matched with hosts at your level.",
				position: { top: "52%", left: "4%" },
			},
			{
				icon: "/icons/onboarding/chart-2.svg",
				iconBg: "#F0FDF4",
				title: "Better visibility",
				body: "Your focus areas attract the right audience.",
				position: { bottom: "8%", left: "18%" },
			},
		],
	},

	// Step 5 — Review your details
	{
		headingPlain: "Make your",
		headingHighlight: "profile feel human",
		description: "A little about you goes a long way. Help people connect with the human behind the host.",
		personImage: "/onboarding/person-2.png",
		cards: [
			{
				icon: "/icons/onboarding/user-check-circle.svg",
				iconBg: "#F5F3FF",
				title: "Polished profile",
				body: "You're showing up with confidence.",
				position: { top: "36%", right: "2%" },
			},
			{
				icon: "/icons/onboarding/check-circle.svg",
				iconBg: "#F0FDF4",
				title: "Verified details",
				body: "Details stored and verified.",
				position: { top: "52%", left: "4%" },
			},
			{
				icon: "/icons/onboarding/rocket.svg",
				iconBg: "#FEF2F2",
				title: "Launched ready",
				body: "Your events are about to go live.",
				position: { bottom: "8%", left: "18%" },
			},
		],
	},

	// Step 5 — Verify payout details
	{
		headingPlain: "Secure payouts.",
		headingHighlight: "Smooth operations.",
		description: "Add your links and legal details to boost credibility, get discovered, and unlock more opportunities.",
		personImage: "/onboarding/person-3.png",
		cards: [
			{
				icon: "/icons/onboarding/check-circle.svg",
				iconBg: "#F0FDF4",
				title: "Verified identity",
				body: "KYC verified successfully.",
				position: { top: "38%", right: "2%" },
			},
			{
				icon: "/icons/onboarding/wallet.svg",
				iconBg: "#EFF6FF",
				title: "Payout ready",
				body: "Get paid securely, right on time.",
				position: { top: "54%", left: "4%" },
			},
			{
				icon: "/icons/onboarding/lock.svg",
				iconBg: "#FFFBEB",
				title: "Secure onboarding",
				body: "Your data is safe and protected.",
				position: { bottom: "8%", left: "18%" },
			},
		],
	},

	// Step 6 — Review payout details (same panel as step 5)
	{
		headingPlain: "Secure payouts.",
		headingHighlight: "Smooth operations.",
		description: "Add your links and legal details to boost credibility, get discovered, and unlock more opportunities.",
		personImage: "/onboarding/person-3.png",
		cards: [
			{
				icon: "/icons/onboarding/check-circle.svg",
				iconBg: "#F0FDF4",
				title: "Verified identity",
				body: "KYC verified successfully.",
				position: { top: "38%", right: "2%" },
			},
			{
				icon: "/icons/onboarding/wallet.svg",
				iconBg: "#EFF6FF",
				title: "Payout ready",
				body: "Get paid securely, right on time.",
				position: { top: "54%", left: "4%" },
			},
			{
				icon: "/icons/onboarding/lock.svg",
				iconBg: "#FFFBEB",
				title: "Secure onboarding",
				body: "Your data is safe and protected.",
				position: { bottom: "8%", left: "18%" },
			},
		],
	},

	// Step 8 — You're ready to host
	{
		headingPlain: "Your stage",
		headingHighlight: "is ready",
		description: "You've got everything you need to host amazing events, build your community, and grow your impact",
		personImage: "/onboarding/person-1.png",
		cards: [
			{
				icon: "/icons/onboarding/users-group.svg",
				iconBg: "#EFF6FF",
				title: "community",
				body: "Bring people together around what matters most.",
				position: { top: "52%", left: "4%" },
			},
			{
				icon: "/icons/onboarding/rocket.svg",
				iconBg: "#FEF2F2",
				title: "Launch",
				body: "Create unforgettable experiences people love.",
				position: { top: "36%", right: "2%" },
			},
			{
				icon: "/icons/onboarding/chart-2.svg",
				iconBg: "#F0FDF4",
				title: "Growth",
				body: "Turn your passion into a thriving community.",
				position: { bottom: "8%", left: "18%" },
			},
		],
	},
]
