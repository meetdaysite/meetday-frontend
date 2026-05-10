"use client"

import { useState } from "react"
import Image from "next/image"
import { Sidebar } from "@/components/dashboard/Sidebar"

function HamburgerIcon() {
	return (
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
			<path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	const [sidebarOpen, setSidebarOpen] = useState(false)

	return (
		<div className="min-h-screen flex bg-surface-page">
			<Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

			<div className="flex-1 flex flex-col min-w-0">
				{/* Mobile top bar */}
				<header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-surface-card border-b border-border-subtle">
					<Image
						src="/assets/brand_logo.svg"
						alt="Meetday"
						width={100}
						height={28}
						className="h-7 w-auto"
					/>
					<button
						onClick={() => setSidebarOpen(true)}
						className="text-text-primary p-1.5 rounded-action hover:bg-surface-card-muted transition-colors"
						aria-label="Open navigation menu"
					>
						<HamburgerIcon />
					</button>
				</header>

				<main className="flex-1">{children}</main>
			</div>
		</div>
	)
}
