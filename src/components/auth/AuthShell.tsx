import Image from "next/image"

interface AuthShellProps {
	children: React.ReactNode
	phoneImage: string
	pointsImage: string
}

export function AuthShell({ children, phoneImage, pointsImage }: AuthShellProps) {
	return (
		<div className="flex flex-1">
			{/* ── Left — form panel ── */}
			<div className="flex flex-1 items-center justify-center px-4 py-8 lg:pl-8 lg:pr-3 xl:pl-12 xl:pr-4">
				<div
					className={[
						"w-full bg-surface-card rounded-modal shadow-modal",
						"px-5 py-6 my-8",
						"lg:px-7 lg:py-7 lg:max-w-100 lg:my-0",
						"xl:px-8 xl:py-8 xl:max-w-130",
					].join(" ")}
				>
					{children}
				</div>
			</div>

			{/* ── Right — phone + feature cards, fixed, hidden below lg ── */}
			<div
				className={[
					"hidden lg:flex flex-1 items-center justify-center",
					"gap-2 pl-1 pr-3",
					"xl:gap-4 xl:pl-2 xl:pr-6",
					"2xl:gap-6 2xl:pl-4 2xl:pr-8",
				].join(" ")}
			>
				{/* Phone mockup */}
				<div
					className={[
						"relative shrink-0",
						"lg:h-[66vh] lg:w-52",
						"xl:h-[84vh] xl:w-70",
						"2xl:h-[84vh] 2xl:w-80",
					].join(" ")}
				>
					<Image
						src={phoneImage}
						alt=""
						fill
						className="object-contain object-center"
						priority
						aria-hidden
					/>
				</div>

				{/* Feature cards */}
				<div
					className={[
						"relative shrink-0 self-center",
						"lg:h-[72vh] lg:w-60",
						"xl:h-[78vh] xl:w-72",
						"2xl:h-[84vh] 2xl:w-78",
					].join(" ")}
				>
					<Image
						src={pointsImage}
						alt=""
						fill
						loading="eager"
						className="object-contain object-center"
						aria-hidden
					/>
				</div>
			</div>
		</div>
	)
}
