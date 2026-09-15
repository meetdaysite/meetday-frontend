"use client"

import { Suspense } from "react"
import { SpaceChatDashboard } from "@/components/spaces/SpaceChatDashboard"

function CommunitySpaceChatsContent() {
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
						Collaborate with Community Spaces and manage your incoming and sent requests.
					</p>
				</div>

				<SpaceChatDashboard
					role="COMMUNITY"
					emptyLabel="No space chats yet."
				/>
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
