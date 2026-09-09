"use client"

import Link from "next/link"
import { AuthShell } from "@/components/auth/AuthShell"

export default function SpacesWelcomeAuthPage() {
	return (
		<AuthShell size="small">
			<div className="flex flex-col flex-grow justify-between min-h-[380px] h-full">
				<Link 
					href="/" 
					className="inline-flex items-center gap-1.5 text-xs font-bold text-black/50 hover:text-black transition-colors mb-2"
				>
					<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
					</svg>
					Back to welcome
				</Link>

				{/* Top Section: Title & Subtitle */}
				<div className="text-center pt-2">
					<h2 className="font-heading text-3xl sm:text-4xl font-black text-black tracking-tight mb-3">
						Getting Started
					</h2>
					<p className="text-sm font-semibold text-black/60 max-w-xs mx-auto leading-relaxed">
						List your venues, host top offline communities, and monetize your spaces!
					</p>
				</div>

				{/* Middle Section: Buttons */}
				<div className="flex flex-col gap-4 mt-6 w-full">
					<Link 
						href="/spaces/login" 
						className="w-full py-3.5 bg-[#FFC940] text-black border-[3px] border-black rounded-2xl font-extrabold text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all text-base tracking-wider block"
					>
						Sign In
					</Link>
					
					<Link 
						href="/spaces/signup" 
						className="w-full py-3.5 bg-white text-black border-[3px] border-black rounded-2xl font-extrabold text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all text-base tracking-wider block"
					>
						Create account
					</Link>
				</div>

				{/* Bottom Section: Indicator Dots */}
				<div className="flex gap-2 justify-center items-center mt-10 mb-2">
					<span className="w-5 h-2 bg-[#EE2C2C] rounded-full transition-all" />
					<span className="w-2 h-2 bg-black/15 rounded-full" />
					<span className="w-2 h-2 bg-black/15 rounded-full" />
					<span className="w-2 h-2 bg-black/15 rounded-full" />
				</div>

			</div>
		</AuthShell>
	)
}
