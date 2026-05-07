import Image from "next/image"
import Link from "next/link"

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="relative min-h-screen flex flex-col">
			<Image
				src="/assets/auth_bg.svg"
				alt=""
				fill
				className="object-cover object-center opacity-40 pointer-events-none select-none"
				priority
				aria-hidden
			/>

			<header className="relative w-full shrink-0 bg-surface-page z-10">
				<div className="flex h-16 items-center max-w-screen-2xl mx-auto px-6 lg:px-10">
					<Link href="/" className="inline-flex items-center">
						<Image src="/assets/brand_logo.svg" alt="Meetday" width={120} height={32} priority />
					</Link>
				</div>
			</header>

			<main className="relative flex flex-1 w-full justify-center items-start py-10 px-4">
				{children}
			</main>
		</div>
	)
}
