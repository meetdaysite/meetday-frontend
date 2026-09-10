"use client"

import { SpaceChatDashboard } from "@/components/spaces/SpaceChatDashboard"

export default function BrandSpaceChatsPage() {
	return (
		<div className="flex flex-col flex-1 min-h-0 bg-white">
			<div className="flex-1 min-h-0 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-6xl w-full mx-auto flex flex-col gap-4">
				<div>
					<h1 className="text-xl sm:text-2xl font-heading font-black text-black">Community Space Chats</h1>
					<p className="text-xs sm:text-sm font-semibold text-black/50">Chat with spaces you have expressed interest in.</p>
				</div>
				<div className="h-[calc(100vh-240px)]">
					<SpaceChatDashboard
						role="BRAND"
						tabs={[
							{ key: "requests", label: "Requests", filter: (t) => t.chatStatus === "REQUESTED" },
							{ key: "chats", label: "Chats", filter: (t) => t.chatStatus === "ACCEPTED" },
						]}
						emptyLabel="You haven't expressed interest in any Community Space yet."
					/>
				</div>
			</div>
		</div>
	)
}
