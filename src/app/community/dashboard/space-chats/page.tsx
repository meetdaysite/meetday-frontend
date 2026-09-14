"use client"

import Link from "next/link"
import clsx from "clsx"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { SpaceChatDashboard } from "@/components/spaces/SpaceChatDashboard"
import { SpaceHostChatDashboard } from "@/components/spaces/SpaceHostChatDashboard"

function CommunitySpaceChatsContent() {
	const searchParams = useSearchParams()
	const isRequests = searchParams.get("sub") === "requests"

	return (
		<div className="flex flex-col flex-1 min-h-0 bg-white">
			<div className="flex justify-between items-center px-8 py-4 border-b border-black/10 shrink-0">
				<p className="text-sm font-semibold text-black/50 mx-auto">
					Welcome to <span className="text-[#EE2C2C] font-bold">Meetday</span>
				</p>
			</div>

			<div className="flex-1 min-h-0 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-6xl w-full mx-auto flex flex-col gap-4">
				<div>
					<h1 className="text-2xl sm:text-3xl font-heading font-black text-black">
						Spaces Chats
					</h1>
					<p className="text-xs sm:text-sm font-semibold text-black/50 mt-1">
						{isRequests
							? "Partnership requests sent to you by Space Partners."
							: "Chat with spaces you have expressed interest in."}
					</p>
				</div>

				<div className="inline-flex items-center p-1 bg-black/5 rounded-2xl border-2 border-black/10 self-start shrink-0">
					<Link
						href="/community/dashboard/space-chats"
						className={clsx(
							"px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all",
							!isRequests
								? "bg-[#EE2C2C] text-white shadow-sm"
								: "text-black/60 hover:text-black"
						)}
					>
						Chats
					</Link>
					<Link
						href="/community/dashboard/space-chats?sub=requests"
						className={clsx(
							"px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all",
							isRequests
								? "bg-[#EE2C2C] text-white shadow-sm"
								: "text-black/60 hover:text-black"
						)}
					>
						Requests
					</Link>
				</div>

				{isRequests ? (
					<SpaceHostChatDashboard
						key="requests"
						role="HOST"
						canRespond
						emptyLabel="No Space Partners have requested to partner with your community yet."
					/>
				) : (
					<SpaceChatDashboard
						role="COMMUNITY"
						emptyLabel="You haven't expressed interest in any Community Space yet."
					/>
				)}
			</div>
		</div>
	)
}

export default function CommunitySpaceChatsPage() {
	return (
		<Suspense fallback={null}>
			<CommunitySpaceChatsContent />
		</Suspense>
	)
}

