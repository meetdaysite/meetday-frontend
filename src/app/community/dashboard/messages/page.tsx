"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import clsx from "clsx"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import { useHostStore } from "@/store/hostStore"
import { useNotificationStore } from "@/store/notificationStore"
import { getHostCommunityProfile, getMySponsorshipProposals } from "@/lib/api"

// Icons
import CheckCircleSvg from "@/icons/outlined/check-circle.svg"
import CloseCircleSvg from "@/icons/outlined/close-circle.svg"
import ClockCircleSvg from "@/icons/outlined/clock-circle.svg"
import BellSvg from "@/icons/outlined/bell.svg"

export default function NotificationsPage() {
	const { profile } = useHostStore()
	const { notifications, init: initNotifs, markRead, markAllRead } = useNotificationStore()
	const [community, setCommunity] = useState<any>(null)
	const [proposals, setProposals] = useState<any[]>([])

	useEffect(() => {
		initNotifs()
		if (profile?.id) {
			getHostCommunityProfile()
				.then(setCommunity)
				.catch(() => {})
			getMySponsorshipProposals()
				.then(res => setProposals(res.proposals || []))
				.catch(() => {})
		}
	}, [initNotifs, profile?.id])

	// Compile status notifications
	const statusNotifs: any[] = []

	// 1. Host profile verification status
	if (profile?.approvalStatus === "REJECTED") {
		statusNotifs.push({
			id: 'host-profile-rejected',
			type: "error",
			title: "Verification Rejected",
			desc: profile.rejectionReason || "Your host verification application was not approved.",
			action: "Reapply",
			link: "/community/dashboard/profile"
		})
	} else if (profile?.approvalStatus === "PENDING" && profile?.kycStatus === "VERIFIED") {
		statusNotifs.push({
			id: 'host-profile-pending',
			type: "warning",
			title: "Verification Pending",
			desc: "Your host verification is under review. This usually takes 2-3 business days.",
		})
	}

	// 2. Community profile status
	if (community) {
		if (community.approvalStatus === "REJECTED") {
			statusNotifs.push({
				id: 'community-rejected',
				type: "error",
				title: "Community Profile Rejected",
				desc: community.adminRejectionRemark || "Your community profile details were rejected.",
				action: "Edit Details",
				link: "/community/dashboard/profile"
			})
		} else if (community.approvalStatus === "PENDING") {
			statusNotifs.push({
				id: 'community-pending',
				type: "warning",
				title: "Community Under Review",
				desc: "Your community profile is currently under review by the admin team.",
			})
		}
	}

	// 3. Proposals status
	proposals.forEach(p => {
		if (p.status === "REJECTED") {
			statusNotifs.push({
				id: 'proposal-rejected-' + p.id,
				type: "error",
				title: `Proposal Rejected: ${p.name}`,
				desc: p.adminRejectionRemark || "No rejection remark provided.",
				action: "Edit Proposal",
				link: `/community/dashboard/proposal?proposalId=${p.id}`
			})
		} else if (p.status === "UNDER_REVIEW") {
			statusNotifs.push({
				id: 'proposal-review-' + p.id,
				type: "warning",
				title: `Proposal Under Review: ${p.name}`,
				desc: "This proposal is currently being reviewed by the admin team.",
				action: "View Details",
				link: `/community/dashboard/proposal?proposalId=${p.id}`
			})
		} else if (p.status === "PUBLISHED") {
			statusNotifs.push({
				id: 'proposal-published-' + p.id,
				type: "success",
				title: `Proposal Published: ${p.name}`,
				desc: "Your proposal has been approved and is now live to brands!",
				action: "View Proposal",
				link: `/community/dashboard/proposal?proposalId=${p.id}`
			})
		}
	})

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

				{/* 1. Status & Verification Notifications (Neobrutalist cards) */}
				{statusNotifs.length > 0 && (
					<div className="flex flex-col gap-4">
						<h2 className="text-xs font-black uppercase tracking-wider text-black/40">Status Alerts</h2>
						<div className="flex flex-col gap-4">
							{statusNotifs.map(n => {
								const borderColors = n.type === "error" ? "border-[#EE2C2C]" : n.type === "warning" ? "border-[#FFC940]" : "border-green-600"
								const bgColors = n.type === "error" ? "bg-[#FFD2D2]" : n.type === "warning" ? "bg-[#FFEAA7]" : "bg-green-50"
								const icon = n.type === "error" ? CloseCircleSvg : n.type === "warning" ? ClockCircleSvg : CheckCircleSvg
								const iconColor = n.type === "error" ? "text-[#EE2C2C]" : n.type === "warning" ? "text-[#b27b00]" : "text-green-600"

								return (
									<div key={n.id} className={clsx("border-[3px] border-black rounded-[24px] p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4", bgColors)}>
										<div className="flex gap-3 items-start min-w-0">
											<div className={clsx("size-10 rounded-full bg-white/40 flex items-center justify-center shrink-0", iconColor)}>
												<Icon as={icon} size="md" color="inherit" />
											</div>
											<div className="min-w-0">
												<h3 className="font-heading font-black text-base leading-tight text-black">{n.title}</h3>
												<p className="text-xs font-semibold text-black/60 mt-1 leading-relaxed break-words">{n.desc}</p>
											</div>
										</div>
										{n.action && n.link && (
											<Link
												href={n.link}
												className="px-4 py-2 bg-black text-white hover:bg-black/90 border-[3px] border-black rounded-2xl font-black text-center text-xs tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all select-none uppercase whitespace-nowrap"
											>
												{n.action}
											</Link>
										)}
									</div>
								)
							})}
						</div>
					</div>
				)}

				{/* 2. System notifications list */}
				<div className="flex flex-col gap-4 mt-2">
					<h2 className="text-xs font-black uppercase tracking-wider text-black/40">General Updates</h2>
					{notifications.length === 0 ? (
						<div className="border-[3px] border-dashed border-black/30 rounded-[24px] p-12 text-center flex flex-col items-center justify-center gap-2">
							<div className="size-12 rounded-full bg-black/5 flex items-center justify-center text-black/40 mb-2">
								<Icon as={BellSvg} size="md" />
							</div>
							<p className="text-sm font-black text-black/80">All caught up!</p>
							<p className="text-[11px] font-semibold text-black/40">No new notifications at this time.</p>
						</div>
					) : (
						<div className="flex flex-col border-[3px] border-black rounded-[24px] bg-white divide-y divide-black/10 overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
							{notifications.map(n => (
								<div
									key={n.id}
									onClick={() => !n.isRead && markRead(n.id)}
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
											<p className="text-[10px] text-black/30 mt-1 font-semibold">{new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
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
