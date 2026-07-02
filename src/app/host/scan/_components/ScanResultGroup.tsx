"use client"

import type { ScanResult, VerifySessionResponse } from "@/lib/scannerApi"
import { PrivacyNotice } from "./PrivacyNotice"

type GroupResult = Extract<ScanResult, { status: "GROUP_PARTIAL" }>

type Props = {
	result: GroupResult
	sessionData: VerifySessionResponse
	onScanNextMember: () => void
	onFinishLater: () => void
}

export function ScanResultGroup({ result, sessionData, onScanNextMember, onFinishLater }: Props) {
	const { session, event } = sessionData
	const progressPct = Math.round((result.checkedIn / result.totalEntries) * 100)

	const formattedDate = event.eventDate
		? new Date(event.eventDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long" })
		: "—"

	return (
		<div className="flex flex-col min-h-screen bg-white">
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
				<div className="flex items-center gap-3">
					<div className="size-10 rounded-lg bg-neutral-900 flex items-center justify-center">
						<span className="text-white text-[10px] font-bold tracking-tight leading-none text-center px-1">
							{event.title.slice(0, 2).toUpperCase()}
						</span>
					</div>
					<div>
						<p className="text-[14px] font-bold text-neutral-900">{event.title}</p>
						<div className="flex items-center gap-1.5 mt-0.5">
							<LocationIcon />
							<span className="text-[11px] text-neutral-500">{session.label ?? "Main Entry"}</span>
						</div>
					</div>
				</div>
				<div className="text-right">
					<div className="flex items-center gap-1">
						<CalendarIcon />
						<span className="text-[11px] text-neutral-500">{formattedDate}</span>
					</div>
					<p className="text-[11px] text-neutral-400">{event.startTime} – {event.endTime}</p>
				</div>
			</div>

			<div className="flex-1 flex flex-col gap-5 px-4 py-5 overflow-y-auto">
				{/* Title */}
				<div>
					<h1 className="text-2xl font-bold text-neutral-900">Group entry in progress</h1>
					<p className="text-[13px] text-neutral-500 mt-1">
						{result.checkedIn} of {result.totalEntries} members checked in
					</p>
				</div>

				{/* Group ticket card */}
				<div className="border border-neutral-200 rounded-action shadow-md p-4 flex flex-col gap-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="size-10 rounded-xl bg-green-50 flex items-center justify-center">
								<GroupIcon />
							</div>
							<div>
								<p className="text-[11px] text-neutral-400 font-medium">Ticket type</p>
								<p className="text-[14px] font-semibold text-neutral-900">{result.ticketType}</p>
								<p className="text-[11px] text-neutral-400">Booking code <span className="font-mono font-semibold text-neutral-600">{result.bookingCode}</span></p>
							</div>
						</div>
					</div>

					{/* Stats */}
					<div className="grid grid-cols-3 gap-2">
						<StatBox label="Total entries" value={result.totalEntries} />
						<StatBox label="Checked in" value={`${result.checkedIn} of ${result.totalEntries}`} highlight />
						<StatBox label="Remaining" value={result.remaining} />
					</div>

					{/* Progress bar */}
					<div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
						<div
							className="h-full bg-green-500 rounded-full transition-all duration-500"
							style={{ width: `${progressPct}%` }}
						/>
					</div>

					{/* Entry chips */}
					<div className="flex gap-2 flex-wrap">
						{result.entries.map((entry) => (
							<div
								key={entry.index}
								className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium border ${
									entry.status === "CHECKED_IN"
										? "bg-green-50 border-green-200 text-green-700"
										: "bg-neutral-50 border-neutral-200 text-neutral-500"
								}`}
							>
								{entry.status === "CHECKED_IN" ? <CheckSmIcon /> : <ClockSmIcon />}
								Entry {entry.index}
								<span className="font-normal">{entry.status === "CHECKED_IN" ? "Checked in" : "Waiting"}</span>
							</div>
						))}
					</div>
				</div>

				{/* Privacy */}
				<PrivacyNotice compact />

				{/* Actions */}
				<div className="flex flex-col gap-3">
					<button
						onClick={onScanNextMember}
						className="w-full flex items-center justify-center gap-2 h-14 bg-red-600 text-white text-[15px] font-semibold rounded-2xl active:bg-red-700 transition-colors"
					>
						<ScanIcon />
						Scan next member
					</button>
					<button
						onClick={onFinishLater}
						className="w-full flex items-center justify-center gap-2 h-12 border-2 border-neutral-200 text-neutral-700 text-[14px] font-medium rounded-2xl active:bg-neutral-50 transition-colors"
					>
						<ClockIcon />
						Finish later
					</button>
				</div>
			</div>
		</div>
	)
}

function StatBox({ label, value, highlight }: { label: string; value: number | string; highlight?: boolean }) {
	return (
		<div className={`rounded-xl p-2.5 text-center ${highlight ? "bg-green-50" : "bg-neutral-50"}`}>
			<p className="text-[11px] text-neutral-400 font-medium mb-0.5">{label}</p>
			<p className={`text-[15px] font-bold ${highlight ? "text-green-700" : "text-neutral-900"}`}>{value}</p>
		</div>
	)
}

function LocationIcon() {
	return (
		<svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-neutral-400" aria-hidden>
			<path d="M12 21s-8-7.5-8-12a8 8 0 1 1 16 0c0 4.5-8 12-8 12z" stroke="currentColor" strokeWidth="2" />
		</svg>
	)
}
function CalendarIcon() {
	return (
		<svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-neutral-400" aria-hidden>
			<rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
			<path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}
function GroupIcon() {
	return (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-green-600" aria-hidden>
			<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
			<circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
			<path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}
function CheckSmIcon() {
	return (
		<svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
			<path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}
function ClockSmIcon() {
	return (
		<svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
			<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
			<path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}
function ScanIcon() {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
			<path d="M3 9V5a2 2 0 0 1 2-2h4M15 3h4a2 2 0 0 1 2 2v4M3 15v4a2 2 0 0 1 2 2h4M15 21h4a2 2 0 0 1 2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
			<rect x="7" y="7" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
		</svg>
	)
}
function ClockIcon() {
	return (
		<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
			<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
			<path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}
