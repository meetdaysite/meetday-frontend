"use client"

import { useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/Button"

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	useEffect(() => {
		console.error(error)
	}, [error])

	return (
		<div className="min-h-screen flex flex-col bg-surface-page overflow-hidden">
			<header className="shrink-0 px-6 sm:px-10 lg:px-16 py-5">
				<Image src="/assets/brand_logo.svg" alt="Meetday" width={120} height={32} className="h-8 w-auto" />
			</header>

			<main className="flex-1 flex items-center justify-center">
				<div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-12 px-6 sm:px-10 lg:px-16 py-8">

					{/* Illustration */}
					<div className="w-full lg:w-3/5 flex items-center justify-center order-first lg:order-last">
						<Image
							src="/assets/errors/500.png"
							alt="Something went wrong"
							width={800}
							height={800}
							priority
							className="w-full h-auto"
						/>
					</div>

					{/* Content */}
					<div className="w-full lg:w-2/5 flex flex-col items-center lg:items-start gap-4 text-center lg:text-left">
						<p className="text-[6rem] sm:text-[8rem] lg:text-[12rem] font-bold leading-none tracking-tight text-text-brand">
							500
						</p>

						<div className="-mt-2">
							<h1 className="text-heading-sm font-bold text-text-primary">Something went wrong</h1>
							<p className="text-body-sm text-text-secondary mt-2 max-w-sm">
								An unexpected error occurred on our end. If this keeps happening, please try again later.
							</p>
						</div>

						<div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-2">
							<Button onClick={reset}>Try again</Button>
							<Link
								href="/"
								className="inline-flex items-center gap-2 h-(--size-action-md) px-4 text-label-sm font-medium rounded-action bg-action-secondary text-action-secondary-text border border-action-secondary-border hover:bg-action-secondary-hover transition-colors duration-(--duration-120)"
							>
								Go home
							</Link>
						</div>
					</div>

				</div>
			</main>
		</div>
	)
}
