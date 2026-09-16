"use client"

import { Suspense } from "react"
import { CommunityChatDashboard } from "@/components/community/CommunityChatDashboard"

function CommunityCollaborationChatsContent() {
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
						Community Chats
					</h1>
					<p className="text-xs sm:text-sm font-semibold text-black/50 mt-1">
						Collaborate with other communities and manage your partnership chats and requests.
					</p>
				</div>

				<CommunityChatDashboard />
			</div>
		</div>
	)
}

export default function CommunityCollaborationChatsPage() {
	return (
		<Suspense fallback={null}>
			<CommunityCollaborationChatsContent />
		</Suspense>
	)
}
