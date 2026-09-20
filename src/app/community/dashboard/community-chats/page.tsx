"use client"

import { Suspense } from "react"
import { ChatHub } from "@/components/chat/ChatHub"

export default function CommunityCollaborationChatsPage() {
	return (
		<Suspense
			fallback={
				<div className="flex-1 flex items-center justify-center min-h-[400px] text-xs font-semibold text-black/40">
					Loading Community Chats…
				</div>
			}
		>
			<ChatHub role="COMMUNITY" defaultCategory="communities" />
		</Suspense>
	)
}
