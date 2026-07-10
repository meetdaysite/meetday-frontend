import Image from "next/image"
import Link from "next/link"
import clsx from "clsx"
// import ShieldCheckSvg from "@/icons/filled/shield-check.svg"
import ArrowRightSvg from "@/icons/outlined/arrow-right.svg"
import { Icon } from "@/components/ui/Icon"

const OPTIONS = [
	{
		key: "attendee",
		image: "/assets/landing/attendee.svg",
		title: "Attendee",
		titleClass: "text-text-brand",
		description:
			"Discover curated experiences, meet like-minded people, and be part of real-world moments.",
		cta: "Continue as Attendee",
		href: "/attendee/login",
		tone: "red" as const,
	},
	{
		key: "host",
		image: "/assets/landing/host.svg",
		title: "Host",
		titleClass: "text-text-vibe",
		description: "Create and manage experiences, grow your community, and collaborate with brands.",
		cta: "Continue as Host",
		href: "/host/login",
		tone: "purple" as const,
	},
	{
		key: "website",
		image: "/assets/landing/website.svg",
		title: "Visit Website",
		titleClass: "text-text-primary",
		description: "Explore Meetday, learn more about our mission, features, and how it all works.",
		cta: "Visit Website",
		href: "https://meetday.ai",
		tone: "outline" as const,
	},
]

const CTA_BASE_CLASS =
	"inline-flex items-center justify-center w-full h-(--size-action-lg) px-5 rounded-avatar text-label-md font-semibold transition-colors duration-(--duration-120)"

const CTA_TONE_CLASS = {
	red: "bg-action-primary text-action-primary-text hover:bg-action-primary-hover active:bg-action-primary-pressed",
	purple: "bg-text-vibe text-white hover:bg-purple-700 active:bg-purple-800",
	outline: "bg-surface-card text-text-primary border-2 border-border-focused hover:bg-surface-card-muted",
} as const

export default function RootPage() {
	return (
		<div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden px-6 py-16 sm:py-20">
			{/* Decorative background */}
			<Image
				src="/assets/landing/background.svg"
				alt=""
				fill
				priority
				aria-hidden
				className="pointer-events-none object-cover"
			/>

			{/* Heading */}
			<div className="relative z-10 flex flex-col items-center text-center max-w-7xl mx-auto mb-14">
				<h1 className="text-heading-lg sm:text-display-md font-extrabold text-text-primary leading-tight">
					Real people. Real experiences.
				</h1>
				<h1 className="relative inline-block text-heading-lg sm:text-display-md font-extrabold text-text-brand leading-tight mt-1">
					Stronger together.
				</h1>
				<p className="mt-7 text-body-lg text-text-secondary max-w-2xl">
					Whether you want to discover experiences, host for your community, or just explore what
					we&apos;re building — you&apos;re in the right place.
				</p>
			</div>

			{/* Option cards */}
			<div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-5xl">
				{OPTIONS.map(option => (
					<div
						key={option.key}
						className="flex flex-col items-center text-center bg-surface-card border border-border-default rounded-panel shadow-panel px-8 py-10"
					>
						<div className="relative w-44 h-44 mb-5 shrink-0">
							<Image src={option.image} alt="" fill sizes="176px" className="object-contain" />
						</div>
						<h2 className={clsx("text-heading-sm font-extrabold mb-2", option.titleClass)}>
							{option.title}
						</h2>
						<p className="text-body-sm text-text-secondary leading-relaxed mb-8 flex-1">
							{option.description}
						</p>
						<Link
							href={option.href}
							className={clsx(CTA_BASE_CLASS, CTA_TONE_CLASS[option.tone])}
						>
							{option.cta}
							<Icon as={ArrowRightSvg} className="ml-2" />
						</Link>
					</div>
				))}
			</div>

			{/* Trust badge */}
			{/* <div className="relative z-10 flex flex-col items-center gap-1 mt-14 text-center">
				<div className="flex items-center gap-2">
					<ShieldCheckSvg className="size-4 text-text-primary" aria-hidden />
					<span className="text-label-md font-semibold text-text-primary">
						Secure. Verified. Built for trust.
					</span>
				</div>
				<p className="text-caption text-text-muted">Your data and privacy are always protected.</p>
			</div> */}
		</div>
	)
}
