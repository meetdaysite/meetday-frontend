"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import clsx from "clsx"
import { Icon } from "@/components/ui/Icon"
import { useAuthStore } from "@/store/authStore"
import { useHostStore } from "@/store/hostStore"
import BellSvg from "@/icons/outlined/bell.svg"
import AltArrowDownSvg from "@/icons/outlined/alt-arrow-down.svg"
import CheckCircleSvg from "@/icons/outlined/check-circle.svg"
import DangerCircleSvg from "@/icons/outlined/danger-circle.svg"
import CloseCircleSvg from "@/icons/outlined/close-circle.svg"
import DangerTriangleSvg from "@/icons/outlined/danger-triangle.svg"
import CheckSvg from "@/icons/outlined/check-circle.svg"
import type { ComponentType, SVGProps } from "react"

// ─── Notification data ────────────────────────────────────────────────────────

type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>

interface Notification {
	id: string
	title: string
	body: string
	time: string
	icon: SvgIcon
	iconBg: string
	iconColor: string
	unread: boolean
}

const NOTIFICATIONS: Notification[] = [
	{
		id: "n1",
		title: "Event Approved",
		body: "Summer Music Festival was approved and is now live.",
		time: "15m ago",
		icon: CheckCircleSvg,
		iconBg: "bg-emerald-50",
		iconColor: "text-emerald-600",
		unread: true,
	},
	{
		id: "n2",
		title: "Under Review",
		body: "Tech Innovators Summit is under review by our team.",
		time: "1h ago",
		icon: DangerCircleSvg,
		iconBg: "bg-blue-50",
		iconColor: "text-blue-500",
		unread: true,
	},
	{
		id: "n3",
		title: "Event Rejected",
		body: "Urban Photography Walk wasn't approved. Reason: needs more detail.",
		time: "3h ago",
		icon: CloseCircleSvg,
		iconBg: "bg-neutral-100",
		iconColor: "text-neutral-700",
		unread: true,
	},
	{
		id: "n4",
		title: "Event Cancelled",
		body: "Food & Culture Fest has been cancelled. Attendees notified.",
		time: "1d ago",
		icon: DangerTriangleSvg,
		iconBg: "bg-amber-50",
		iconColor: "text-amber-500",
		unread: false,
	},
]

// ─── Hook: close on outside click ────────────────────────────────────────────

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
	useEffect(() => {
		function onMouseDown(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				handler()
			}
		}
		document.addEventListener("mousedown", onMouseDown)
		return () => document.removeEventListener("mousedown", onMouseDown)
	}, [ref, handler])
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DashboardTopBar() {
	const [notifOpen, setNotifOpen] = useState(false)
	const [userOpen, setUserOpen] = useState(false)
	const [notifications, setNotifications] = useState(NOTIFICATIONS)
	const { signOut } = useAuthStore()
	const { profile, clearProfile } = useHostStore()
	const router = useRouter()

	const displayName = profile?.displayName || "Host"
	const initials = displayName.split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase() || "H"

	const notifRef = useRef<HTMLDivElement>(null)
	const userRef = useRef<HTMLDivElement>(null)

	async function handleSignOut() {
		clearProfile()
		await signOut()
		router.replace("/login")
	}

	useClickOutside(notifRef, () => setNotifOpen(false))
	useClickOutside(userRef, () => setUserOpen(false))

	const unreadCount = notifications.filter(n => n.unread).length

	function markAllRead() {
		setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
	}

	return (
		<div className="hidden lg:flex items-center justify-between px-8 py-4 bg-surface-card border-b border-border-subtle shrink-0">
			<p className="text-body-sm text-text-secondary">
				Welcome to <span className="font-semibold text-text-primary">Meetday</span>
			</p>

			<div className="flex items-center gap-3">
				{/* Bell */}
				<div ref={notifRef} className="relative">
					<button
						onClick={() => { setNotifOpen(o => !o); setUserOpen(false) }}
						className="relative p-2 rounded-action hover:bg-surface-card-muted transition-colors"
						aria-label="Notifications"
					>
						<Icon as={BellSvg} size="md" color="secondary" />
						{unreadCount > 0 && (
							<span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-action-primary" />
						)}
					</button>

					{/* Notifications panel */}
					{notifOpen && (
						<div className="absolute right-0 top-full mt-2 z-50 w-80 bg-surface-card border border-border-subtle rounded-card shadow-floating overflow-hidden">
							{/* Header */}
							<div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
								<h3 className="text-label-md font-semibold text-text-primary">Notifications</h3>
								<button
									onClick={markAllRead}
									className="flex items-center gap-1 text-label-sm font-medium text-text-brand hover:opacity-75 transition-opacity"
								>
									<Icon as={CheckSvg} size="sm" color="brand" aria-hidden />
									Mark all read
								</button>
							</div>

							{/* List */}
							<div className="max-h-96 overflow-y-auto divide-y divide-border-subtle">
								{notifications.map(notif => (
									<div
										key={notif.id}
										className="flex gap-3 px-4 py-3.5 hover:bg-surface-card-muted transition-colors cursor-pointer"
									>
										{/* Icon */}
										<div className={clsx("size-9 rounded-full flex items-center justify-center shrink-0 mt-0.5", notif.iconBg)}>
											<notif.icon className={clsx("size-4.5", notif.iconColor)} aria-hidden />
										</div>

										{/* Content */}
										<div className="flex-1 min-w-0">
											<div className="flex items-start justify-between gap-2">
												<p className="text-label-sm font-semibold text-text-primary leading-snug">
													{notif.title}
												</p>
												<div className="flex items-center gap-1.5 shrink-0">
													<span className="text-caption text-text-muted whitespace-nowrap">{notif.time}</span>
													{notif.unread && (
														<span className="size-2 rounded-full bg-action-primary shrink-0 mt-0.5" />
													)}
												</div>
											</div>
											<p className="text-caption text-text-tertiary mt-0.5 leading-snug">{notif.body}</p>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				{/* User menu */}
				<div ref={userRef} className="relative">
					<button
						onClick={() => { setUserOpen(o => !o); setNotifOpen(false) }}
						className="flex items-center gap-2 cursor-pointer hover:bg-surface-card-muted px-2 py-1.5 rounded-action transition-colors"
					>
						<div className="size-8 rounded-avatar bg-surface-brand-soft flex items-center justify-center">
							<span className="text-label-sm font-semibold text-text-brand">{initials}</span>
						</div>
						<span className="text-label-md text-text-primary">{displayName}</span>
						<Icon
							as={AltArrowDownSvg}
							size="sm"
							color="secondary"
							className={clsx("transition-transform duration-150", userOpen && "rotate-180")}
						/>
					</button>

					{/* User dropdown */}
					{userOpen && (
						<div className="absolute right-0 top-full mt-2 z-50 bg-surface-card border border-border-subtle rounded-action shadow-floating py-1 min-w-36">
							<button
								onClick={handleSignOut}
								className="w-full text-left px-4 py-2.5 text-label-sm font-medium text-text-brand hover:bg-surface-card-muted transition-colors"
							>
								Sign Out
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
