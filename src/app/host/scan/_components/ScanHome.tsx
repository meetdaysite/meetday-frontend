"use client"

import { Button } from "@/components/ui/Button"
import type { LiveStatsResponse, VerifySessionResponse } from "@/lib/scannerApi"
import { getLiveStats } from "@/lib/scannerApi"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { LiveStats } from "./LiveStats"
import { PrivacyNotice } from "./PrivacyNotice"

type Props = {
	sessionData: VerifySessionResponse
	token: string
	onStartScanning: () => void
	onManualCheckIn: () => void
	onSessionExpired: () => void
}

export function ScanHome({ sessionData, token, onStartScanning, onManualCheckIn, onSessionExpired }: Props) {
	const { session, event } = sessionData
	const [stats, setStats] = useState<LiveStatsResponse | null>(null)
	const [lastSynced, setLastSynced] = useState<Date | null>(null)
	const [sinceText, setSinceText] = useState("")
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

	async function fetchStats() {
		try {
			const s = await getLiveStats(token)
			setStats(s)
			setLastSynced(new Date())
		} catch (err) {
			const status = (err as { status?: number }).status
			if (status === 401 || status === 403 || status === 410) onSessionExpired()
			// otherwise keep stale data
		}
	}

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		fetchStats()
		intervalRef.current = setInterval(fetchStats, 10_000)
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token])

	useEffect(() => {
		if (!lastSynced) return
		function update() {
			if (!lastSynced) return
			const secs = Math.floor((Date.now() - lastSynced.getTime()) / 1000)
			setSinceText(secs < 5 ? "just now" : `${secs}s ago`)
		}
		update()
		const t = setInterval(update, 1000)
		return () => clearInterval(t)
	}, [lastSynced])

	const formattedDate = event.eventDate
		? new Date(event.eventDate).toLocaleDateString("en-IN", {
				weekday: "short",
				day: "numeric",
				month: "long",
				year: "numeric",
			})
		: "—"

	return (
		<div className="flex flex-col min-h-screen bg-surface-canvas">
			{/* Top bar */}
			<div className="flex items-center justify-between px-4 pt-4 pb-3">
				<Image
					src="/assets/brand_logo.svg"
					alt="Meetday"
					width={110}
					height={28}
					className="h-7 w-auto"
					priority
				/>
				<div className="flex gap-2">
					{/* Status strip */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2 px-3 py-1.5 bg-surface-success-soft border border-green-200 rounded-avatar">
							<span className="size-1.5 rounded-avatar bg-text-success" />
							<span className="text-caption font-medium text-text-success">Link active</span>
						</div>
					</div>
					<div className="flex items-center gap-2 px-3 py-1.5 bg-surface-card-muted rounded-avatar border border-border-brand text-text-brand">
						<PersonIcon />
						<span className="text-label-sm">{session.staffName}</span>
					</div>
				</div>
			</div>

			<div className="flex-1 flex flex-col px-4 pb-6 gap-4 overflow-y-auto">
				{/* Event info */}
				<div className="mt-6">
					<h1 className="text-heading-sm text-text-primary mb-3">{event.title}</h1>
					<div className="flex flex-col gap-1.5">
						<div className="flex items-center gap-2">
							<CalendarIcon />
							<span className="text-label-sm text-text-secondary">{formattedDate}</span>
						</div>
						<div className="flex items-center gap-2">
							<ClockIcon />
							<span className="text-label-sm text-text-secondary">
								{event.startTime} – {event.endTime}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<LocationIcon />
							<span className="text-label-sm text-text-secondary">
								{event.venueName}, {event.city}
							</span>
						</div>
					</div>
				</div>

				{/* Privacy notice */}
				<PrivacyNotice />

				{/* CTA buttons */}
				<div className="flex flex-col gap-3">
					<Button
						onClick={onStartScanning}
						size="lg"
						radius="lg"
						className="w-full"
						leftIcon={<ScanIcon />}
					>
						Start scanning
					</Button>
					<Button
						onClick={onManualCheckIn}
						variant="secondary"
						size="md"
						radius="lg"
						className="w-full h-12"
						leftIcon={<PersonIcon2 />}
					>
						Manual check-in
					</Button>
				</div>

				{/* Live summary */}
				<div className="bg-surface-card border border-border-default rounded-action shadow-card p-4">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-2">
							<PulseIcon />
							<span className="text-label-md text-text-primary font-semibold">
								Live summary
							</span>
						</div>
						<div className="flex items-center gap-1">
							<span className="size-1.5 rounded-avatar bg-text-success" />
							<span className="text-caption text-text-muted">Auto-updates</span>
						</div>
					</div>
					<LiveStats stats={stats} />
					<button
						onClick={fetchStats}
						className="w-full flex items-center justify-center gap-1.5 mt-4 pt-3 border-t border-border-subtle text-caption text-text-tertiary"
					>
						<RefreshIcon />
						{lastSynced ? `Last synced ${sinceText}` : "Tap to sync"}
					</button>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-center gap-1.5 pt-2">
					<ShieldIcon />
					<span className="text-caption text-text-muted">
						Secure connection · Do not share this link
					</span>
				</div>
			</div>
		</div>
	)
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function PersonIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
			<circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
			<path
				d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</svg>
	)
}
function PersonIcon2() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
			<circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
			<path
				d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</svg>
	)
}
function CalendarIcon() {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			className="text-text-muted shrink-0"
			aria-hidden
		>
			<rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
			<path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}
function ClockIcon() {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			className="text-text-muted shrink-0"
			aria-hidden
		>
			<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
			<path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}
function LocationIcon() {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			className="text-text-muted shrink-0"
			aria-hidden
		>
			<path
				d="M12 21s-8-7.5-8-12a8 8 0 1 1 16 0c0 4.5-8 12-8 12z"
				stroke="currentColor"
				strokeWidth="2"
			/>
			<circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
		</svg>
	)
}
function ScanIcon() {
	return (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
			<path
				d="M3 9V5a2 2 0 0 1 2-2h4M15 3h4a2 2 0 0 1 2 2v4M3 15v4a2 2 0 0 1 2 2h4M15 21h4a2 2 0 0 1 2-2v-4"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
			<rect x="7" y="7" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
		</svg>
	)
}
function PulseIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-text-brand" aria-hidden>
			<path
				d="M22 12h-4l-3 9L9 3l-3 9H2"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}
function RefreshIcon() {
	return (
		<svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
			<path
				d="M1 4v6h6M23 20v-6h-6"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}
function ShieldIcon() {
	return (
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-text-muted" aria-hidden>
			<path
				d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinejoin="round"
			/>
		</svg>
	)
}
