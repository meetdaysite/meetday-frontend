"use client"

import { useEffect, useRef, useState } from "react"
import { getLiveStats } from "@/lib/scannerApi"
import type { VerifySessionResponse, LiveStatsResponse } from "@/lib/scannerApi"
import { PrivacyNotice } from "./PrivacyNotice"
import { LiveStats } from "./LiveStats"

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
			if (status === 401 || status === 403) onSessionExpired()
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
				weekday: "short", day: "numeric", month: "long", year: "numeric",
		  })
		: "—"

	return (
		<div className="flex flex-col min-h-screen bg-white">
			{/* Top bar */}
			<div className="flex items-center justify-between px-4 pt-4 pb-3">
				<MeetdayLogo />
				<div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-full">
					<PersonIcon />
					<span className="text-[13px] font-medium text-neutral-700">{session.staffName}</span>
				</div>
			</div>

			<div className="flex-1 flex flex-col px-4 pb-6 gap-4 overflow-y-auto">
				{/* Status strip */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full">
						<span className="size-1.5 rounded-full bg-green-500" />
						<span className="text-[12px] font-medium text-green-700">Link active</span>
					</div>
					<div className="flex items-center gap-1.5">
						<LockIcon className="text-neutral-400" />
						<span className="text-[12px] text-neutral-400">Secure check-in link</span>
					</div>
				</div>

				{/* Event info */}
				<div>
					<h1 className="text-2xl font-bold text-neutral-900 mb-3">{event.title}</h1>
					<div className="flex flex-col gap-1.5">
						<div className="flex items-center gap-2">
							<CalendarIcon />
							<span className="text-[13px] text-neutral-600">{formattedDate}</span>
						</div>
						<div className="flex items-center gap-2">
							<ClockIcon />
							<span className="text-[13px] text-neutral-600">{event.startTime} – {event.endTime}</span>
						</div>
						<div className="flex items-center gap-2">
							<LocationIcon />
							<span className="text-[13px] text-neutral-600">{event.venueName}, {event.city}</span>
						</div>
					</div>
				</div>

				{/* Gate card */}
				<div className="flex items-center justify-between p-3.5 bg-neutral-50 border border-neutral-200 rounded-action shadow-md">
					<div className="flex items-center gap-3">
						<div className="size-10 rounded-lg bg-red-100 flex items-center justify-center">
							<GateIcon />
						</div>
						<div>
							<p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wide">Gate</p>
							<p className="text-[15px] font-semibold text-neutral-900">{session.label ?? "Main Entry"}</p>
						</div>
					</div>
				</div>

				{/* Privacy notice */}
				<PrivacyNotice />

				{/* CTA buttons */}
				<div className="flex flex-col gap-3">
					<button
						onClick={onStartScanning}
						className="w-full flex items-center justify-center gap-2.5 h-14 bg-red-600 text-white text-[15px] font-semibold rounded-2xl active:bg-red-700 transition-colors"
					>
						<ScanIcon />
						Start scanning
					</button>
					<button
						onClick={onManualCheckIn}
						className="w-full flex items-center justify-center gap-2 h-12 border-2 border-neutral-200 text-neutral-700 text-[14px] font-medium rounded-2xl active:bg-neutral-50 transition-colors"
					>
						<PersonIcon2 />
						Manual check-in
					</button>
				</div>

				{/* Live summary */}
				<div className="bg-white border border-neutral-200 rounded-action shadow-md p-4">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-2">
							<PulseIcon />
							<span className="text-[13px] font-semibold text-neutral-800">Live summary</span>
						</div>
						<div className="flex items-center gap-1">
							<span className="size-1.5 rounded-full bg-green-500" />
							<span className="text-[11px] text-neutral-400">Auto-updates</span>
						</div>
					</div>
					<LiveStats stats={stats} />
				</div>

				{/* Utility row */}
				<div className="grid grid-cols-3 gap-3">
					<UtilityButton
						icon={<FlashlightIcon />}
						label="Flashlight"
						sub="Off"
						onClick={() => {}}
						disabled
					/>
					<UtilityButton
						icon={<RefreshIcon />}
						label="Refresh link"
						sub={lastSynced ? `Last synced ${sinceText}` : "Tap to sync"}
						onClick={fetchStats}
					/>
					<UtilityButton
						icon={<HeadphonesIcon />}
						label="Staff help"
						sub="Get support"
						onClick={() => {}}
					/>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-center gap-1.5 pt-2">
					<ShieldIcon />
					<span className="text-[11px] text-neutral-400">Secure connection · Do not share this link</span>
				</div>
			</div>
		</div>
	)
}

function UtilityButton({
	icon,
	label,
	sub,
	onClick,
	disabled,
}: {
	icon: React.ReactNode
	label: string
	sub: string
	onClick: () => void
	disabled?: boolean
}) {
	return (
		<button
			onClick={onClick}
			disabled={disabled}
			className="flex flex-col items-center gap-1.5 p-3 bg-neutral-50 border border-neutral-200 rounded-xl active:bg-neutral-100 transition-colors disabled:opacity-50"
		>
			<div className="text-neutral-500">{icon}</div>
			<span className="text-[11px] font-medium text-neutral-700 text-center leading-tight">{label}</span>
			<span className="text-[10px] text-neutral-400 text-center leading-tight">{sub}</span>
		</button>
	)
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function MeetdayLogo() {
	return <span className="text-xl font-black text-red-600 tracking-tight">meetday</span>
}
function PersonIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
			<circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
			<path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}
function PersonIcon2() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
			<circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
			<path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}
function CalendarIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-neutral-400 shrink-0" aria-hidden>
			<rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
			<path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}
function ClockIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-neutral-400 shrink-0" aria-hidden>
			<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
			<path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}
function LocationIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-neutral-400 shrink-0" aria-hidden>
			<path d="M12 21s-8-7.5-8-12a8 8 0 1 1 16 0c0 4.5-8 12-8 12z" stroke="currentColor" strokeWidth="2" />
			<circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
		</svg>
	)
}
function GateIcon() {
	return (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-red-500" aria-hidden>
			<rect x="2" y="7" width="8" height="14" rx="1" stroke="currentColor" strokeWidth="2" />
			<rect x="14" y="7" width="8" height="14" rx="1" stroke="currentColor" strokeWidth="2" />
			<path d="M10 12h4M10 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
			<path d="M6 3h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}
function LockIcon({ className }: { className?: string }) {
	return (
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
			<rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
			<path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}
function ScanIcon() {
	return (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
			<path d="M3 9V5a2 2 0 0 1 2-2h4M15 3h4a2 2 0 0 1 2 2v4M3 15v4a2 2 0 0 1 2 2h4M15 21h4a2 2 0 0 1 2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
			<rect x="7" y="7" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
		</svg>
	)
}
function PulseIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-red-500" aria-hidden>
			<path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}
function FlashlightIcon() {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
			<path d="M8 2h8l1 7H7L8 2zM7 9l5 13 5-13" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
		</svg>
	)
}
function RefreshIcon() {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
			<path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}
function HeadphonesIcon() {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
			<path d="M3 18v-6a9 9 0 0 1 18 0v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
			<path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" stroke="currentColor" strokeWidth="2" />
		</svg>
	)
}
function ShieldIcon() {
	return (
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-neutral-400" aria-hidden>
			<path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
		</svg>
	)
}
