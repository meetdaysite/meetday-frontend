"use client"

import { useState, useRef, useEffect } from "react"
import clsx from "clsx"
import { useNotificationStore } from "@/store/notificationStore"
import type { Notification, NotificationType } from "@/types/notification"
import type { ComponentType, SVGProps } from "react"

import BellSvg from "@/icons/outlined/bell.svg"
import CheckCircleSvg from "@/icons/outlined/check-circle.svg"
import DangerCircleSvg from "@/icons/outlined/danger-circle.svg"
import CloseCircleSvg from "@/icons/outlined/close-circle.svg"
import DangerTriangleSvg from "@/icons/outlined/danger-triangle.svg"
import TicketSvg from "@/icons/outlined/ticket.svg"
import CheckSvg from "@/icons/outlined/check-circle.svg"
import AltArrowDownSvg from "@/icons/outlined/alt-arrow-down.svg"

// ─── Icon mapping ─────────────────────────────────────────────────────────────

type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>
type IconConfig = { icon: SvgIcon; iconBg: string; iconColor: string }

function getIconConfig(type: NotificationType): IconConfig {
	switch (type) {
		case "event_approved":
			return { icon: CheckCircleSvg, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" }
		case "event_rejected":
			return { icon: CloseCircleSvg, iconBg: "bg-neutral-100", iconColor: "text-neutral-700" }
		case "event_under_review":
		case "event_review_requested":
			return { icon: DangerCircleSvg, iconBg: "bg-blue-50", iconColor: "text-blue-500" }
		case "event_cancelled":
			return { icon: DangerTriangleSvg, iconBg: "bg-amber-50", iconColor: "text-amber-500" }
		case "booking_confirmed":
			return { icon: TicketSvg, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" }
		case "booking_cancelled":
			return { icon: TicketSvg, iconBg: "bg-neutral-100", iconColor: "text-neutral-600" }
		case "subscription_upgraded":
			return { icon: CheckCircleSvg, iconBg: "bg-purple-50", iconColor: "text-purple-600" }
		case "subscription_expiring":
			return { icon: DangerTriangleSvg, iconBg: "bg-amber-50", iconColor: "text-amber-500" }
		default:
			return { icon: BellSvg, iconBg: "bg-neutral-100", iconColor: "text-neutral-500" }
	}
}

function formatRelativeTime(dateStr: string): string {
	const diffMs = Date.now() - new Date(dateStr).getTime()
	const mins = Math.floor(diffMs / 60_000)
	if (mins < 1) return "just now"
	if (mins < 60) return `${mins}m ago`
	const hours = Math.floor(mins / 60)
	if (hours < 24) return `${hours}h ago`
	return `${Math.floor(hours / 24)}d ago`
}

// ─── Notification row ─────────────────────────────────────────────────────────

function NotificationRow({ notif, onRead }: { notif: Notification; onRead: (id: string) => void }) {
	const { icon: NotifIcon, iconBg, iconColor } = getIconConfig(notif.type)
	return (
		<div
			className={clsx(
				"flex gap-3 px-4 py-3.5 hover:bg-surface-card-muted transition-colors cursor-pointer",
				!notif.isRead && "bg-surface-brand-soft/30",
			)}
			onClick={() => { if (!notif.isRead) onRead(notif.id) }}
		>
			<div className={clsx("size-9 rounded-full flex items-center justify-center shrink-0 mt-0.5", iconBg)}>
				<NotifIcon className={clsx("size-4.5", iconColor)} aria-hidden />
			</div>
			<div className="flex-1 min-w-0">
				<div className="flex items-start justify-between gap-2">
					<p className="text-label-sm font-semibold text-text-primary leading-snug">{notif.title}</p>
					<div className="flex items-center gap-1.5 shrink-0">
						<span className="text-caption text-text-muted whitespace-nowrap">
							{formatRelativeTime(notif.createdAt)}
						</span>
						{!notif.isRead && (
							<span className="size-2 rounded-full bg-action-primary shrink-0 mt-0.5" />
						)}
					</div>
				</div>
				<p className="text-caption text-text-tertiary mt-0.5 leading-snug">{notif.body}</p>
			</div>
		</div>
	)
}

// ─── Component ────────────────────────────────────────────────────────────────

type Tab = "all" | "unread"

export function NotificationBell() {
	const [open, setOpen] = useState(false)
	const [tab, setTab] = useState<Tab>("all")
	const panelRef = useRef<HTMLDivElement>(null)

	const { notifications, unreadCount, hasMore, isLoading, markRead, markAllRead, loadMore } =
		useNotificationStore()

	const displayed = tab === "unread" ? notifications.filter((n) => !n.isRead) : notifications

	// Close on outside click
	useEffect(() => {
		function onMouseDown(e: MouseEvent) {
			if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
				setOpen(false)
			}
		}
		document.addEventListener("mousedown", onMouseDown)
		return () => document.removeEventListener("mousedown", onMouseDown)
	}, [])

	return (
		<div ref={panelRef} className="relative">
			{/* Bell button */}
			<button
				onClick={() => setOpen((o) => !o)}
				className="relative p-2 rounded-action hover:bg-surface-card-muted transition-colors"
				aria-label="Notifications"
				aria-expanded={open}
			>
				<BellSvg className="size-5 text-text-secondary" aria-hidden />
				{unreadCount > 0 && (
					<span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-action-primary" />
				)}
			</button>

			{/* Panel */}
			{open && (
				<div className="absolute right-0 top-full mt-2 z-50 w-80 bg-surface-card border border-border-subtle rounded-card shadow-floating overflow-hidden">
					{/* Header */}
					<div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
						<h3 className="text-label-md font-semibold text-text-primary">
							Notifications
							{unreadCount > 0 && (
								<span className="ml-2 inline-flex items-center justify-center size-5 rounded-full bg-action-primary text-white text-[10px] font-bold">
									{unreadCount > 99 ? "99+" : unreadCount}
								</span>
							)}
						</h3>
						{unreadCount > 0 && (
							<button
								onClick={markAllRead}
								className="flex items-center gap-1 text-label-sm font-medium text-text-brand hover:opacity-75 transition-opacity"
							>
								<CheckSvg className="size-3.5" aria-hidden />
								Mark all read
							</button>
						)}
					</div>

					{/* Tabs */}
					<div className="flex border-b border-border-subtle">
						{(["all", "unread"] as Tab[]).map((t) => (
							<button
								key={t}
								onClick={() => setTab(t)}
								className={clsx(
									"flex-1 py-2 text-label-sm font-medium transition-colors",
									tab === t
										? "text-text-brand border-b-2 border-text-brand"
										: "text-text-secondary hover:text-text-primary",
								)}
							>
								{t === "all" ? "All" : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
							</button>
						))}
					</div>

					{/* List */}
					<div className="max-h-96 overflow-y-auto divide-y divide-border-subtle">
						{isLoading && notifications.length === 0 ? (
							Array.from({ length: 3 }).map((_, i) => (
								<div key={i} className="flex gap-3 px-4 py-3.5 animate-pulse">
									<div className="size-9 rounded-full bg-neutral-200 shrink-0" />
									<div className="flex-1 flex flex-col gap-2 pt-1">
										<div className="h-3.5 w-32 bg-neutral-200 rounded" />
										<div className="h-3 w-48 bg-neutral-100 rounded" />
									</div>
								</div>
							))
						) : displayed.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-10 gap-2">
								<BellSvg className="size-8 text-text-muted" aria-hidden />
								<p className="text-label-sm text-text-secondary">
									{tab === "unread" ? "No unread notifications" : "You're all caught up"}
								</p>
							</div>
						) : (
							<>
								{displayed.map((notif) => (
									<NotificationRow key={notif.id} notif={notif} onRead={markRead} />
								))}

								{/* Load more */}
								{tab === "all" && hasMore && (
									<div className="px-4 py-3 flex justify-center">
										<button
											onClick={loadMore}
											disabled={isLoading}
											className="flex items-center gap-1.5 text-label-sm text-text-brand hover:opacity-75 transition-opacity disabled:opacity-50"
										>
											{isLoading ? (
												<span className="size-3.5 border-2 border-text-brand border-t-transparent rounded-full animate-spin" />
											) : (
												<AltArrowDownSvg className="size-3.5" aria-hidden />
											)}
											Load more
										</button>
									</div>
								)}
							</>
						)}
					</div>
				</div>
			)}
		</div>
	)
}
