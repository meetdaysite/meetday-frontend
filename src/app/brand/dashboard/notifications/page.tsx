"use client"

import { useEffect } from "react"
import clsx from "clsx"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { useNotificationStore } from "@/store/notificationStore"

function formatRelativeTime(dateStr: string): string {
	const diffMs = Date.now() - new Date(dateStr).getTime()
	const mins = Math.floor(diffMs / 60_000)
	if (mins < 1) return "just now"
	if (mins < 60) return `${mins}m ago`
	const hours = Math.floor(mins / 60)
	if (hours < 24) return `${hours}h ago`
	return `${Math.floor(hours / 24)}d ago`
}

export default function NotificationsPage() {
	const { notifications, isLoading, hasMore, init, loadMore, markRead, markAllRead, unreadCount } =
		useNotificationStore()

	useEffect(() => {
		init()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return (
		<div className="flex flex-col">
			<DashboardTopBar />

			<div className="px-6 lg:px-8 pt-8 pb-6 flex items-center justify-between gap-4">
				<div>
					<h1 className="text-heading-sm lg:text-heading-md font-semibold text-text-primary leading-tight">
						Notifications
					</h1>
					<p className="text-body-sm text-text-secondary mt-2">Updates on your proposals and interests.</p>
				</div>
				{unreadCount > 0 && (
					<Button variant="secondary" size="sm" onClick={() => markAllRead()}>
						Mark all as read
					</Button>
				)}
			</div>

			<div className="px-6 lg:px-8 pb-8">
				{isLoading && notifications.length === 0 ? (
					<div className="flex flex-col gap-3">
						{Array.from({ length: 5 }).map((_, i) => (
							<Skeleton key={i} className="h-16 rounded-action" />
						))}
					</div>
				) : notifications.length === 0 ? (
					<p className="text-body-sm text-text-secondary">No notifications yet.</p>
				) : (
					<div className="flex flex-col rounded-action border border-border-default bg-surface-card overflow-hidden divide-y divide-border-default">
						{notifications.map((notif) => (
							<div
								key={notif.id}
								className={clsx(
									"flex items-start gap-3 px-4 py-3.5 cursor-pointer hover:bg-surface-card-muted transition-colors",
									!notif.isRead && "bg-surface-brand-soft/30",
								)}
								onClick={() => {
									if (!notif.isRead) markRead(notif.id)
								}}
							>
								<div className="flex-1 min-w-0">
									<p className="text-label-sm font-semibold text-text-primary leading-snug">{notif.title}</p>
									<p className="text-caption text-text-secondary mt-0.5">{notif.body}</p>
								</div>
								<span className="text-caption text-text-muted shrink-0">{formatRelativeTime(notif.createdAt)}</span>
							</div>
						))}
					</div>
				)}

				{hasMore && (
					<div className="flex justify-center mt-4">
						<Button variant="secondary" size="sm" onClick={() => loadMore()} disabled={isLoading}>
							{isLoading ? "Loading…" : "Load more"}
						</Button>
					</div>
				)}
			</div>
		</div>
	)
}
