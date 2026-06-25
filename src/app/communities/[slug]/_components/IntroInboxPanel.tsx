"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import CloseSvg from "@/icons/outlined/close.svg"
import StarSvg from "@/icons/outlined/star.svg"
import {
	getReceivedIntros,
	acceptIntro,
	rejectIntro,
	type ReceivedIntro,
} from "@/lib/chatApi"

// ─── Intro card ───────────────────────────────────────────────────────────────

function IntroCard({
	intro,
	communityId,
	onAccepted,
	onRejected,
}: {
	intro: ReceivedIntro
	communityId: string
	onAccepted: (conversationId: string) => void
	onRejected: (conversationId: string) => void
}) {
	const [loading, setLoading] = useState<"accept" | "reject" | null>(null)
	const from = intro.from
	const fullName = `${from.firstName} ${from.lastName}`

	const handleAccept = async () => {
		setLoading("accept")
		try {
			await acceptIntro(communityId, intro.conversationId)
			toast.success(`Connected with ${fullName}!`)
			onAccepted(intro.conversationId)
		} catch {
			toast.error("Failed to accept intro. Please try again.")
		} finally {
			setLoading(null)
		}
	}

	const handleReject = async () => {
		setLoading("reject")
		try {
			await rejectIntro(communityId, intro.conversationId)
			onRejected(intro.conversationId)
		} catch {
			toast.error("Failed to decline intro. Please try again.")
		} finally {
			setLoading(null)
		}
	}

	return (
		<div className="flex flex-col gap-3 p-4 rounded-action border border-border-default bg-surface-page">
			{/* Sender row */}
			<div className="flex items-center gap-3">
				{from.avatarUrl ? (
					<div className="relative size-10 rounded-full overflow-hidden border border-border-default bg-surface-hover shrink-0">
						<Image src={from.avatarUrl} alt={fullName} fill sizes="40px" className="object-cover" />
					</div>
				) : (
					<div className="size-10 rounded-full bg-surface-brand-soft border border-border-default flex items-center justify-center shrink-0">
						<span className="text-sm font-bold text-text-brand">
							{from.firstName[0]?.toUpperCase() ?? "?"}
						</span>
					</div>
				)}
				<div className="flex flex-col gap-0.5 min-w-0">
					<p className="text-label-sm font-bold text-text-primary">{fullName}</p>
					<p className="text-[11px] text-text-muted">
						{new Date(intro.sentAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
					</p>
				</div>
			</div>

			{/* Message preview */}
			{intro.message?.content ? (
				<p className="text-label-sm text-text-primary font-normal leading-relaxed line-clamp-3">
					{intro.message.content}
				</p>
			) : (
				<p className="text-label-sm text-text-muted italic">No message.</p>
			)}

			{/* Shared interests */}
			{intro.sharedInterests && intro.sharedInterests.count > 0 && (
				<div className="flex items-start gap-2">
					<Icon as={StarSvg} size="xs" color="vibe" className="mt-0.5 shrink-0" />
					<div className="flex flex-wrap gap-1">
						{intro.sharedInterests.tags.slice(0, 4).map(tag => (
							<span
								key={tag.id}
								className="text-[10px] text-text-secondary border border-border-default rounded-full px-2 py-0.5 bg-surface-card"
							>
								{tag.name}
							</span>
						))}
						{intro.sharedInterests.count > 4 && (
							<span className="text-[10px] text-text-muted">+{intro.sharedInterests.count - 4} more</span>
						)}
					</div>
				</div>
			)}

			{/* Actions */}
			<div className="flex gap-2">
				<Button
					variant="primary"
					size="sm"
					radius="pill"
					className="flex-1"
					disabled={!!loading}
					onClick={handleAccept}
				>
					{loading === "accept" ? "Accepting…" : "Accept"}
				</Button>
				<Button
					variant="secondary"
					size="sm"
					radius="pill"
					className="flex-1"
					disabled={!!loading}
					onClick={handleReject}
				>
					{loading === "reject" ? "Declining…" : "Decline"}
				</Button>
			</div>
		</div>
	)
}

// ─── Main component ───────────────────────────────────────────────────────────

interface IntroInboxPanelProps {
	communityId: string
	currentUserId: string
	onClose: () => void
	onAccepted: (conversationId: string) => void
}

export function IntroInboxPanel({
	communityId,
	onClose,
	onAccepted,
}: IntroInboxPanelProps) {
	const [intros, setIntros] = useState<ReceivedIntro[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const loadIntros = useCallback(async () => {
		setLoading(true)
		setError(null)
		try {
			const raw = await getReceivedIntros(communityId)
			setIntros(raw)
		} catch {
			setError("Failed to load intro requests.")
		} finally {
			setLoading(false)
		}
	}, [communityId])

	useEffect(() => {
		loadIntros()
	}, [loadIntros])

	const handleAccepted = (conversationId: string) => {
		setIntros(prev => prev.filter(i => i.conversationId !== conversationId))
		onAccepted(conversationId)
	}

	const handleRejected = (conversationId: string) => {
		setIntros(prev => prev.filter(i => i.conversationId !== conversationId))
	}

	return (
		<div className="flex flex-col h-full">
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-border-default shrink-0">
				<div>
					<h3 className="text-body-sm font-bold text-text-primary">Intro Requests</h3>
					{!loading && intros.length > 0 && (
						<p className="text-[11px] text-text-secondary mt-0.5">
							{intros.length} pending {intros.length === 1 ? "request" : "requests"}
						</p>
					)}
				</div>
				<button
					type="button"
					onClick={onClose}
					className="text-text-muted hover:text-text-primary transition-colors"
				>
					<Icon as={CloseSvg} size="sm" color="muted" />
				</button>
			</div>

			{/* Body */}
			<div className="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col gap-3">
				{loading ? (
					<>
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className="rounded-action border border-border-default p-4 flex flex-col gap-3 animate-pulse">
								<div className="flex items-center gap-3">
									<div className="size-10 rounded-full bg-surface-hover shrink-0" />
									<div className="flex flex-col gap-1.5">
										<div className="h-3 w-24 bg-surface-hover rounded" />
										<div className="h-2.5 w-14 bg-surface-hover rounded" />
									</div>
								</div>
								<div className="h-3 w-full bg-surface-hover rounded" />
								<div className="h-3 w-3/4 bg-surface-hover rounded" />
							</div>
						))}
					</>
				) : error ? (
					<div className="flex flex-col items-center gap-3 py-8 text-center">
						<p className="text-label-sm text-text-secondary">{error}</p>
						<Button variant="secondary" size="sm" onClick={loadIntros}>Retry</Button>
					</div>
				) : intros.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
						<div className="size-12 rounded-full bg-surface-hover flex items-center justify-center">
							<Icon as={CloseSvg} size="md" color="muted" />
						</div>
						<p className="text-body-sm font-semibold text-text-primary">No intro requests</p>
						<p className="text-label-sm text-text-secondary font-normal max-w-48 leading-snug">
							When someone sends you an intro, it will appear here.
						</p>
					</div>
				) : (
					intros.map(intro => (
						<IntroCard
							key={intro.conversationId}
							intro={intro}
							communityId={communityId}
							onAccepted={handleAccepted}
							onRejected={handleRejected}
						/>
					))
				)}
			</div>
		</div>
	)
}
