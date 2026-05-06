import Image from "next/image"
import Link from "next/link"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="relative min-h-screen flex flex-col">
			{/* Full-viewport background */}
			<Image
				src="/assets/auth_bg.svg"
				alt=""
				fill
				className="object-cover object-center opacity-40 pointer-events-none select-none"
				priority
				aria-hidden
			/>

			{/* Navbar — full width, content constrained */}
			<header className="relative w-full shrink-0 bg-surface-page z-10">
				<div className="flex h-16 items-center max-w-screen-2xl mx-auto px-6 lg:px-10">
					<Link href="/" className="inline-flex items-center">
						<Image src="/assets/brand_logo.svg" alt="Meetday" width={120} height={32} priority />
					</Link>
				</div>
			</header>

			{/* Page content — fills remaining viewport height */}
			<main className="relative flex flex-1 w-full max-w-screen-2xl mx-auto">{children}</main>
		</div>
	)
}
