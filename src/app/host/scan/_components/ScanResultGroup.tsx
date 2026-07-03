"use client"

import type { ScanResult, VerifySessionResponse } from "@/lib/scannerApi"
import { Button } from "@/components/ui/Button"
import { PrivacyNotice } from "./PrivacyNotice"

type GroupResult = Extract<ScanResult, { status: "GROUP_PARTIAL" }>

type Props = {
	result: GroupResult
	sessionData: VerifySessionResponse
	onScanNextMember: () => void
	onFinishLater: () => void
}

export function ScanResultGroup({ result, sessionData, onScanNextMember, onFinishLater }: Props) {
	const { event } = sessionData
	const remaining = result.totalEntries - result.checkedInCount
	const progressPct = result.totalEntries > 0 ? Math.round((result.checkedInCount / result.totalEntries) * 100) : 0

	const formattedDate = event.eventDate
		? new Date(event.eventDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long" })
		: "—"

	return (
		<div className="flex flex-col min-h-screen bg-surface-canvas">
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
				<div className="flex items-center gap-3">
					<div className="size-10 rounded-action bg-surface-inverse flex items-center justify-center">
						<span className="text-text-inverse text-caption font-bold tracking-tight leading-none text-center px-1">
							{event.title.slice(0, 2).toUpperCase()}
						</span>
					</div>
					<p className="text-label-md text-text-primary font-bold">{event.title}</p>
				</div>
				<div className="text-right">
					<div className="flex items-center gap-1">
						<CalendarIcon />
						<span className="text-caption text-text-tertiary">{formattedDate}</span>
					</div>
					<p className="text-caption text-text-muted">{event.startTime} – {event.endTime}</p>
				</div>
			</div>

			<div className="flex-1 flex flex-col gap-5 px-4 py-5 overflow-y-auto">
				{/* Title */}
				<div>
					<h1 className="text-heading-sm text-text-primary">Group entry in progress</h1>
					<p className="text-label-sm text-text-tertiary mt-1">
						{result.checkedInCount} of {result.totalEntries} entries checked in
					</p>
				</div>

				{/* Group ticket card */}
				<div className="border border-border-default rounded-action shadow-card p-4 flex flex-col gap-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="size-10 rounded-action bg-surface-success-soft flex items-center justify-center">
								<GroupIcon />
							</div>
							<div>
								<p className="text-label-md text-text-primary font-semibold">{result.ticketType}</p>
								<p className="text-caption text-text-muted">
									Booking code <span className="font-mono font-semibold text-text-secondary">{result.bookingCode}</span>
								</p>
							</div>
						</div>
					</div>

					{/* Stats */}
					<div className="grid grid-cols-3 gap-2">
						<StatBox label="Total entries" value={result.totalEntries} />
						<StatBox label="Checked in" value={`${result.checkedInCount} of ${result.totalEntries}`} highlight />
						<StatBox label="Remaining" value={remaining} />
					</div>

					{/* Progress bar */}
					<div className="h-2 bg-surface-card-muted rounded-avatar overflow-hidden">
						<div
							className="h-full bg-text-success rounded-avatar transition-all duration-500"
							style={{ width: `${progressPct}%` }}
						/>
					</div>

					{/* Entry chips */}
					<div className="flex gap-2 flex-wrap">
						{result.entries.map((entry) => (
							<div
								key={entry.position}
								className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-avatar text-caption font-medium border ${
									entry.isCheckedIn
										? "bg-surface-success-soft border-border-success text-text-success"
										: "bg-surface-card-muted border-border-default text-text-tertiary"
								}`}
							>
								{entry.isCheckedIn ? <CheckSmIcon /> : <ClockSmIcon />}
								Entry {entry.position}
								<span className="font-normal">{entry.isCheckedIn ? "Checked in" : "Waiting"}</span>
							</div>
						))}
					</div>
				</div>

				{/* Privacy */}
				<PrivacyNotice compact />

				{/* Actions */}
				<div className="flex flex-col gap-3">
					<Button onClick={onScanNextMember} size="lg" radius="lg" className="w-full" leftIcon={<ScanIcon />}>
						Scan next member
					</Button>
					<Button onClick={onFinishLater} variant="secondary" size="md" radius="lg" className="w-full h-12" leftIcon={<ClockIcon />}>
						Finish later
					</Button>
				</div>
			</div>
		</div>
	)
}

function StatBox({ label, value, highlight }: { label: string; value: number | string; highlight?: boolean }) {
	return (
		<div className={`rounded-action p-2.5 text-center ${highlight ? "bg-surface-success-soft" : "bg-surface-card-muted"}`}>
			<p className="text-caption text-text-muted font-medium mb-0.5">{label}</p>
			<p className={`text-label-md font-bold ${highlight ? "text-text-success" : "text-text-primary"}`}>{value}</p>
		</div>
	)
}

function CalendarIcon() {
	return (
		<svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-text-muted" aria-hidden>
			<rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
			<path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}
function GroupIcon() {
	return (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-text-success" aria-hidden>
			<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
			<circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
			<path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
