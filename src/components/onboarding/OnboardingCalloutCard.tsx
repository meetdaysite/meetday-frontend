import Image from "next/image"
import type { CSSProperties } from "react"

type Props = {
	icon: string
	iconBg: string
	title: string
	body: string
	style?: CSSProperties
	iconStyle?: CSSProperties
}

export function OnboardingCalloutCard({ icon, title, body, style, iconStyle }: Props) {
	return (
		<div
			className="absolute flex items-center gap-2.5 bg-surface-card rounded-card shadow-floating px-3 py-2.5 max-w-55 z-20"
			style={style}
		>
			<Image src={icon} alt="" width={48} height={48} style={{ height: "auto", ...iconStyle }} aria-hidden />
			<div className="min-w-0">
				<p className="text-xs font-bold text-text-primary leading-tight">{title}</p>
				<p className="text-[11px] text-text-tertiary leading-tight mt-0.5">{body}</p>
			</div>
		</div>
	)
}
