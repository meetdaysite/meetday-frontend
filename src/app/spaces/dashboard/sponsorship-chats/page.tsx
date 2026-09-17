"use client"

import { Suspense } from "react"
import { ChatHub } from "@/components/chat/ChatHub"

export default function SpaceSponsorshipChatsPage() {
	return (
		<Suspense
			fallback={
				<div className="flex-1 flex items-center justify-center min-h-[400px] text-xs font-semibold text-black/40">
					Loading Sponsorship Chats…
				</div>
			}
		>
			<ChatHub role="SPACE" defaultCategory="sponsorships" />
		</Suspense>
	)
}
