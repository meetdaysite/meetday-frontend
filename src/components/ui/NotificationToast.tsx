"use client"

import { toast } from "sonner"
import clsx from "clsx"
import type { ComponentType, SVGProps } from "react"
import type { Notification, NotificationType } from "@/types/notification"

import BellSvg from "@/icons/outlined/bell.svg"
import CheckCircleSvg from "@/icons/outlined/check-circle.svg"
import DangerCircleSvg from "@/icons/outlined/danger-circle.svg"
import CloseCircleSvg from "@/icons/outlined/close-circle.svg"
import DangerTriangleSvg from "@/icons/outlined/danger-triangle.svg"
import TicketSvg from "@/icons/outlined/ticket.svg"

type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>
type IconConfig = { icon: SvgIcon; iconBg: string; iconColor: string }

function getIconConfig(type: NotificationType): IconConfig {
	switch (type) {
		case "event_approved":
			return { icon: CheckCircleSvg, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" }
		case "event_rejected":
			return { icon: CloseCircleSvg, iconBg: "bg-neutral-200", iconColor: "text-neutral-600" }
		case "event_under_review":
		case "event_review_requested":
			return { icon: DangerCircleSvg, iconBg: "bg-blue-50", iconColor: "text-blue-500" }
		case "event_cancelled":
			return { icon: DangerTriangleSvg, iconBg: "bg-amber-50", iconColor: "text-amber-500" }
		case "booking_confirmed":
			return { icon: TicketSvg, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" }
		case "booking_cancelled":
			return { icon: TicketSvg, iconBg: "bg-neutral-200", iconColor: "text-neutral-600" }
		case "subscription_upgraded":
			return { icon: CheckCircleSvg, iconBg: "bg-purple-50", iconColor: "text-purple-600" }
		case "subscription_expiring":
			return { icon: DangerTriangleSvg, iconBg: "bg-amber-50", iconColor: "text-amber-500" }
		case "brand_interested_in_sponsorship":
		case "brand_interest_confirmed":
		case "host_interested_in_campaign":
		case "host_interest_confirmed":
		case "sponsorship_chat_accepted":
			return { icon: CheckCircleSvg, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" }
		default:
			return { icon: BellSvg, iconBg: "bg-neutral-200", iconColor: "text-neutral-500" }
	}
}

function ToastContent({ notif }: { notif: Notification }) {
	const { icon: Icon, iconBg, iconColor } = getIconConfig(notif.type)
	return (
		<div
			className="flex items-start gap-3 px-3.5 py-3 w-80 rounded-xl pointer-events-auto"
			style={{
				background: "var(--color-surface-canvas)",
				border: "1px solid var(--color-border-default)",
				boxShadow: "var(--shadow-3)",
				fontFamily: "var(--font-poppins, sans-serif)",
			}}
		>
			<div className={clsx("size-8 rounded-full flex items-center justify-center shrink-0 mt-0.5", iconBg)}>
				<Icon className={clsx("size-4", iconColor)} aria-hidden />
			</div>
			<div className="flex-1 min-w-0">
				<p
					className="truncate"
					style={{
						fontSize: "0.875rem",
						lineHeight: "1.25rem",
						fontWeight: 600,
						color: "var(--color-neutral-900)",
					}}
				>
					{notif.title}
				</p>
				<p
					className="mt-0.5 line-clamp-2"
					style={{
						fontSize: "0.75rem",
						lineHeight: "1.125rem",
						fontWeight: 400,
						color: "var(--color-neutral-600)",
					}}
				>
					{notif.body}
				</p>
			</div>
		</div>
	)
}

export function showNotificationToast(notif: Notification) {
	toast.custom(() => <ToastContent notif={notif} />, { duration: 5000 })
}
