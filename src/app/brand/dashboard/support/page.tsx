"use client"

import { useEffect } from "react"
import { useNotificationStore } from "@/store/notificationStore"
import { useBrandStore } from "@/store/brandStore"
import { MeetdayChatPanel } from "@/components/support/MeetdayChatPanel"

export default function BrandSupportPage() {
	const { profile } = useBrandStore()
	const ownName = profile?.brandName || "You"
	const { notifications, markRead } = useNotificationStore()

	useEffect(() => {
		const unreadSupportNotifs = notifications.filter(n => !n.isRead && n.title === "Meetday")
		unreadSupportNotifs.forEach(n => {
			markRead(n.id).catch(() => {})
		})
	}, [notifications, markRead])

	return (
		<div className="flex flex-col flex-1 min-h-0 bg-white h-full">
			{/* Top Nav / Subheader */}
			<div className="hidden sm:flex justify-between items-center px-8 py-3.5 border-b border-black/10 shrink-0">
				<p className="text-sm font-semibold text-black/50 mx-auto">
					Welcome to <span className="text-[#EE2C2C] font-bold">Meetday</span>
				</p>
			</div>

			<div className="flex-1 min-h-0 px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 max-w-7xl w-full mx-auto flex flex-col h-full gap-3">
				<div className="shrink-0">
					<h1 className="text-2xl sm:text-3xl font-heading font-black text-black">Support Chat</h1>
					<p className="text-xs sm:text-sm font-semibold text-black/50 mt-0.5">Chat directly with the Meetday team.</p>
				</div>
				<div className="flex-1 min-h-[440px] border-[3px] border-black rounded-[24px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col bg-white">
					<MeetdayChatPanel ownName={ownName} role="BRAND" />
				</div>
			</div>
		</div>
	)
}
