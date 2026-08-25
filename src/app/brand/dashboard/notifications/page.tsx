"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import clsx from "clsx"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import { useNotificationStore } from "@/store/notificationStore"

// Icons
import BellSvg from "@/icons/outlined/bell.svg"

export default function NotificationsPage() {
	const { notifications, isLoading, init, markRead, markAllRead } = useNotificationStore()
	const router = useRouter()

	useEffect(() => {
		init()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const handleNotificationClick = (n: any) => {
		if (!n.isRead) {
			markRead(n.id)
		}
		const m = n.metadata || {}
		const tId = m.sponsorshipInterestId || m.interestId || m.interest_id || m.chatId || m.chat_id
		if (tId) {
			router.push(`/brand/dashboard/chats?interestId=${tId}`)
		} else if (m.proposalId || m.proposal_id) {
			router.push(`/brand/dashboard/proposals`)
		}
	}

	return (
		<div className="flex flex-col flex-1 min-h-0 bg-white">
			{/* Top Nav / Subheader */}
			<div className="flex justify-between items-center px-8 py-4 border-b border-black/10 shrink-0">
				<p className="text-sm font-semibold text-black/50 mx-auto">
					Welcome to <span className="text-[#EE2C2C] font-bold">Meetday</span>
				</p>
			</div>

			<div className="flex-1 overflow-y-auto px-6 lg:px-8 py-8 max-w-4xl w-full mx-auto flex flex-col gap-6">
				{/* Header */}
				<div className="flex justify-between items-center pb-4 border-b border-black/10">
					<div>
						<h1 className="text-3xl font-heading font-black text-black">Notifications</h1>
						<p className="text-sm font-semibold text-black/50 mt-1">Status updates, approvals, and system alerts.</p>
					</div>
					{notifications.length > 0 && (
						<Button variant="secondary" size="sm" radius="pill" onClick={markAllRead}>
							Mark all as read
						</Button>
					)}
				</div>

				{/* System notifications list */}
				<div className="flex flex-col gap-4 mt-2">
					<h2 className="text-xs font-black uppercase tracking-wider text-black/40">General Updates</h2>
					{isLoading && notifications.length === 0 ? (
						<div className="flex flex-col border-[3px] border-black rounded-[24px] bg-white divide-y divide-black/10 overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
							{Array.from({ length: 3 }).map((_, i) => (
								<div key={i} className="px-5 py-4 animate-pulse">
									<div className="h-4 w-1/3 bg-black/5 rounded mb-2" />
									<div className="h-3 w-2/3 bg-black/5 rounded" />
								</div>
							))}
						</div>
					) : notifications.length === 0 ? (
						<div className="border-[3px] border-dashed border-black/30 rounded-[24px] p-12 text-center flex flex-col items-center justify-center gap-2">
							<div className="size-12 rounded-full bg-black/5 flex items-center justify-center text-black/40 mb-2">
								<Icon as={BellSvg} size="md" />
							</div>
							<p className="text-sm font-black text-black/80">All caught up!</p>
							<p className="text-[11px] font-semibold text-black/40">No new notifications at this time.</p>
						</div>
					) : (
						<div className="flex flex-col border-[3px] border-black rounded-[24px] bg-white divide-y divide-black/10 overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
							{notifications.map((n) => (
								<div
									key={n.id}
									onClick={() => handleNotificationClick(n)}
									className={clsx(
										"flex items-start justify-between p-4 gap-4 transition-colors cursor-pointer",
										n.isRead ? "bg-white hover:bg-slate-50" : "bg-[#6C32D1]/5 hover:bg-[#6C32D1]/10"
									)}
								>
									<div className="flex items-start gap-3 min-w-0">
										<span className={clsx("size-2 mt-1.5 rounded-full shrink-0", n.isRead ? "bg-transparent" : "bg-[#EE2C2C]")} />
										<div className="min-w-0">
											<p className="text-sm font-bold text-black">{n.title}</p>
											<p className="text-xs font-semibold text-black/50 mt-0.5 leading-snug break-words">{n.body}</p>
											<p className="text-[10px] text-black/30 mt-1 font-semibold">
												{new Date(n.createdAt).toLocaleDateString("en-IN", {
													day: "numeric",
													month: "short",
													hour: "2-digit",
													minute: "2-digit",
												})}
											</p>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
