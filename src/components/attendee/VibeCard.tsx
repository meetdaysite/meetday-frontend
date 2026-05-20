import Image from "next/image"
import clsx from "clsx"
import type { VibeCategory } from "@/types/attendee"

interface VibeCardProps {
	vibe: VibeCategory
	onClick?: () => void
	className?: string
	style?: React.CSSProperties
}

export function VibeCard({ vibe, onClick, className, style }: VibeCardProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			style={style}
			className={clsx(
				"relative shrink-0 w-44 h-52 sm:w-52 sm:h-60 md:w-56 md:h-64 rounded-action overflow-hidden group",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2",
				"cursor-pointer",
				className,
			)}
			aria-label={vibe.label}
		>
			{/* Background photo */}
			<Image
				src={vibe.image}
				alt=""
				fill
				sizes="(max-width: 640px) 176px, (max-width: 768px) 208px, 224px"
				className="object-cover transition-transform duration-(--duration-400) ease-(--ease-spring-soft) group-hover:scale-105"
				aria-hidden
			/>

			{/* Gradient overlay — bottom-up for readability */}
			<div
				className={clsx(
					"absolute inset-0 bg-linear-to-t",
					vibe.gradient,
				)}
			/>

			{/* Label */}
			<div className="absolute inset-x-0 bottom-0 p-3 text-left">
				<span className="text-label-sm font-semibold text-white leading-snug drop-shadow-sm">
					{vibe.label}
				</span>
			</div>
		</button>
	)
}
