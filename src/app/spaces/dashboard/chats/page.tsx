"use client"

import Link from "next/link"
import clsx from "clsx"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { SpaceChatDashboard } from "@/components/spaces/SpaceChatDashboard"

function SpacesChatsContent() {
	const searchParams = useSearchParams()
	const isBrand = searchParams.get("type") === "brand"
	const category = isBrand ? "BRAND" : "COMMUNITY"

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
							{isBrand ? "Brand Chats" : "Community Chats"}
						</h1>
						<p className="text-xs sm:text-sm font-semibold text-black/50 mt-1">
							{isBrand
								? "Respond to brands interested in your space."
								: "Respond to communities interested in your space."}
						</p>
					</div>

					<div className="inline-flex items-center p-1 bg-black/5 rounded-2xl border-2 border-black/10 self-start sm:self-auto shrink-0">
						<Link
							href="/spaces/dashboard/chats?type=community"
							className={clsx(
								"px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all",
								!isBrand
									? "bg-black text-white shadow-sm"
									: "text-black/60 hover:text-black"
							)}
						>
							Community
						</Link>
						<Link
							href="/spaces/dashboard/chats?type=brand"
							className={clsx(
								"px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all",
								isBrand
									? "bg-black text-white shadow-sm"
									: "text-black/60 hover:text-black"
							)}
						>
							Brand
						</Link>
					</div>
				</div>
				<SpaceChatDashboard
					key={category}
					role="SPACE"
					canRespond
					category={category}
					emptyLabel={
						isBrand
							? "No brands have expressed interest in your space yet."
							: "No communities have expressed interest in your space yet."
					}
				/>
			</div>
		</div>
	)
}

export default function SpacesChatsPage() {
	return (
		<Suspense fallback={null}>
			<SpacesChatsContent />
		</Suspense>
	)
}
