"use client"

import { Suspense } from "react"
import Link from "next/link"
import { SpaceChatDashboard } from "@/components/spaces/SpaceChatDashboard"

function BrandSpaceChatsContent() {
	return (
		<div className="flex flex-col flex-1 min-h-0 bg-white">
			<div className="flex justify-between items-center px-8 py-4 border-b border-black/10 shrink-0">
				<p className="text-sm font-semibold text-black/50 mx-auto">
					Welcome to <span className="text-[#EE2C2C] font-bold">Meetday</span>
				</p>
			</div>

			<div className="flex-1 min-h-0 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-6xl w-full mx-auto flex flex-col gap-4">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<h1 className="text-2xl sm:text-3xl font-heading font-black text-black">
							Spaces Chats
						</h1>
						<p className="text-xs sm:text-sm font-semibold text-black/50 mt-1">
							Chat with spaces you have expressed interest in.
						</p>
					</div>

					<div className="inline-flex items-center p-1 bg-black/5 rounded-2xl border-2 border-black/10 self-start sm:self-auto shrink-0">
						<Link
							href="/brand/dashboard/chats?type=campaign"
							className="px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-black/60 hover:text-black"
						>
							Campaign
						</Link>
						<Link
							href="/brand/dashboard/chats?type=sponsorship"
							className="px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-black/60 hover:text-black"
						>
							Sponsorship
						</Link>
						<Link
							href="/brand/dashboard/space-chats"
							className="px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all bg-black text-white shadow-sm"
						>
							Spaces
						</Link>
					</div>
				</div>
				<SpaceChatDashboard
					role="BRAND"
					emptyLabel="You haven't expressed interest in any Community Space yet."
				/>
			</div>
		</div>
	)
}

export default function BrandSpaceChatsPage() {
	return (
		<Suspense fallback={null}>
			<BrandSpaceChatsContent />
		</Suspense>
	)
}
