"use client"

import { useEffect } from "react"
import { useNotificationStore } from "@/store/notificationStore"
import { useHostStore } from "@/store/hostStore"
import { MeetdayChatPanel } from "@/components/support/MeetdayChatPanel"

export default function DashboardSupportPage() {
	const { profile } = useHostStore()
	const ownName = profile?.displayName || "You"
	const { notifications, markRead } = useNotificationStore()

	useEffect(() => {
		const unreadSupportNotifs = notifications.filter(n => !n.isRead && n.title === "Meetday")
		unreadSupportNotifs.forEach(n => {
			markRead(n.id).catch(() => {})
		})
	}, [notifications, markRead])

	return (
		<div className="flex flex-col min-h-screen bg-white">
			{/* Top Nav / Subheader */}
			<div className="flex justify-between items-center px-8 py-4 border-b border-black/10 shrink-0">
				<p className="text-sm font-semibold text-black/50 mx-auto">
					Welcome to <span className="text-[#EE2C2C] font-bold">Meetday</span>
				</p>
			</div>

			<div className="flex-1 min-h-0 flex flex-col p-6 max-w-4xl w-full mx-auto">
				<div className="mb-4">
					<h1 className="text-3xl font-heading font-black text-black">Support Chat</h1>
					<p className="text-sm font-semibold text-black/50 mt-1">Chat directly with the Meetday team.</p>
				</div>
				<div className="flex-1 min-h-0 border-[3px] border-black rounded-[24px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex bg-white">
					<MeetdayChatPanel ownName={ownName} role="HOST" />
				</div>
			</div>
		</div>
	)
}
