"use client"

import { useState } from "react"
import { lookupBooking, scanTicket } from "@/lib/scannerApi"
import type { LookupResult, ScanResult, VerifySessionResponse } from "@/lib/scannerApi"

type Props = {
	sessionData: VerifySessionResponse
	token: string
	onResult: (result: ScanResult) => void
	onBack: () => void
}

type TabType = "bookingId" | "ticketCode"

function derivedStatus(r: LookupResult): { label: string; className: string; icon: React.ReactNode } {
	if (r.remainingSeats === 0) {
		return { label: "Fully checked in", className: "bg-green-50 text-green-700 border-green-200", icon: <CheckBadgeIcon className="text-green-600" /> }
	}
	if (r.checkedInCount > 0) {
		return { label: "Partially checked in", className: "bg-blue-50 text-blue-700 border-blue-200", icon: <ClockBadgeIcon className="text-blue-500" /> }
	}
	return { label: "Not checked in", className: "bg-orange-50 text-orange-600 border-orange-200", icon: <ClockBadgeIcon className="text-orange-500" /> }
}

export function ScanManual({ sessionData, token, onResult, onBack }: Props) {
	const { session, event } = sessionData
	const [tab, setTab] = useState<TabType>("bookingId")
	const [query, setQuery] = useState("")
	const [results, setResults] = useState<LookupResult[] | null>(null)
	const [searching, setSearching] = useState(false)
	const [searchError, setSearchError] = useState("")
	const [checkingIn, setCheckingIn] = useState<string | null>(null)
	const [approveError, setApproveError] = useState<string | null>(null)

	async function handleSearch() {
		if (!query.trim()) return
		setSearching(true)
		setSearchError("")
		setResults(null)
		setApproveError(null)
		try {
			const payload = tab === "bookingId" ? { bookingId: query.trim() } : { ticketCode: query.trim() }
			const res = await lookupBooking(token, payload)
			setResults(res)
		} catch (err) {
			const status = (err as { status?: number }).status
			setSearchError(
				status === 404
					? "No booking found with that ID."
					: "Connection problem — check your signal and try again.",
			)
		} finally {
			setSearching(false)
		}
	}

	async function handleApprove(ticketCode: string) {
		setCheckingIn(ticketCode)
		setApproveError(null)
		try {
			const result = await scanTicket(ticketCode, token)
			onResult(result)
		} catch (err) {
			const status = (err as { status?: number }).status
			setApproveError(
				status === 404
					? "Ticket not found."
					: "Check-in failed — check your connection and try again.",
			)
			setCheckingIn(null)
		}
	}

	return (
		<div className="flex flex-col min-h-screen bg-white">
			{/* Header */}
			<div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100">
				<button onClick={onBack} className="size-9 flex items-center justify-center rounded-xl active:bg-neutral-100 transition-colors">
					<BackIcon />
				</button>
				<div>
					<p className="text-[14px] font-bold text-neutral-900">{event.title}</p>
					<div className="flex items-center gap-1.5">
						<GateSmIcon />
						<span className="text-[11px] text-neutral-500">{session.label ?? "Main Entry"}</span>
					</div>
				</div>
			</div>

			<div className="flex-1 flex flex-col gap-5 px-4 py-5 overflow-y-auto">
				{/* Title */}
				<div>
					<div className="flex items-center gap-2 mb-1">
						<PersonIcon />
						<h1 className="text-[16px] font-bold text-neutral-900">Manual check-in</h1>
					</div>
					<p className="text-[12px] text-neutral-500">Look up a booking or ticket to check in manually.</p>
				</div>

				{/* Tabs */}
				<div className="flex bg-neutral-100 rounded-xl p-1">
					{(["bookingId", "ticketCode"] as TabType[]).map((t) => (
						<button
							key={t}
							onClick={() => { setTab(t); setResults(null); setQuery(""); setSearchError("") }}
							className={`flex-1 py-2 text-[13px] font-semibold rounded-lg transition-colors ${
								tab === t ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"
							}`}
						>
							{t === "bookingId" ? "Booking ID" : "Ticket Code"}
						</button>
					))}
				</div>

				{/* Search input */}
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2 px-3 py-3 border border-neutral-200 rounded-xl bg-neutral-50">
						<SearchIcon />
						<input
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleSearch()}
							placeholder={tab === "bookingId" ? "Enter booking ID" : "Enter ticket code"}
							className="flex-1 bg-transparent text-[14px] text-neutral-900 placeholder:text-neutral-400 outline-none"
						/>
					</div>
					<p className="text-[11px] text-neutral-400">
						{tab === "bookingId"
							? "Enter the full booking ID to find the booking."
							: "Enter the individual ticket UUID from the QR code."}
					</p>
				</div>

				{/* Search button */}
				<button
					onClick={handleSearch}
					disabled={!query.trim() || searching}
					className="w-full flex items-center justify-center gap-2 h-12 bg-blue-600 text-white text-[14px] font-semibold rounded-2xl active:bg-blue-700 disabled:opacity-50 transition-colors"
				>
					{searching ? <MiniSpinner /> : <SearchIcon className="text-white" />}
					{searching ? "Searching…" : "Search booking"}
				</button>

				{/* Error */}
				{searchError && (
					<p className="text-[12px] text-red-500 text-center">{searchError}</p>
				)}

				{/* Results */}
				{results !== null && (
					<div className="flex flex-col gap-3">
						<p className="text-[13px] font-semibold text-neutral-800">Search results</p>

						{results.length === 0 ? (
							<p className="text-[13px] text-neutral-400 text-center py-4">No bookings found.</p>
						) : (
							<div className="flex flex-col gap-2">
								{results.map((booking) => {
									const cfg = derivedStatus(booking)
									const canCheckIn = booking.remainingSeats > 0
									return (
										<div key={booking.bookingId} className="border border-neutral-200 rounded-xl overflow-hidden">
											<div className="flex items-center justify-between px-4 py-3">
												<div className="flex items-center gap-3">
													<div className="size-9 rounded-lg bg-neutral-100 flex items-center justify-center">
														<PeopleIcon />
													</div>
													<div className="text-left">
														<p className="text-[13px] font-semibold text-neutral-900">{booking.name}</p>
														<p className="text-[11px] text-neutral-500">
															{booking.ticketType} · {booking.checkedInCount}/{booking.checkedInCount + booking.remainingSeats} checked in
														</p>
													</div>
												</div>
												<span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.className}`}>
													{cfg.icon}
													{cfg.label}
												</span>
											</div>

											{canCheckIn && (
												<div className="border-t border-neutral-100 px-4 py-3 bg-neutral-50 flex flex-col gap-2">
													{approveError && (
														<p className="text-[11px] text-red-500 text-right">{approveError}</p>
													)}
													<div className="flex justify-end">
														<button
															onClick={() => handleApprove(booking.ticketCode)}
															disabled={checkingIn === booking.ticketCode}
															className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-[12px] font-semibold rounded-lg active:bg-red-700 disabled:opacity-50 transition-colors"
														>
															{checkingIn === booking.ticketCode ? <MiniSpinner /> : null}
															Approve entry
														</button>
													</div>
												</div>
											)}
										</div>
									)
								})}
							</div>
						)}
					</div>
				)}
			</div>

			{/* Sticky bottom */}
			<div className="px-4 pb-6 pt-2 border-t border-neutral-100">
				<button
					onClick={onBack}
					className="w-full flex items-center justify-center gap-2 h-12 border-2 border-neutral-200 text-neutral-700 text-[14px] font-medium rounded-2xl active:bg-neutral-50 transition-colors"
				>
					<BackIcon />
					Back to scanner
				</button>
			</div>
		</div>
	)
}

function _maskBookingId(id: string): string {
	if (id.length <= 8) return id
	return `${id.slice(0, 4)}-****`
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function BackIcon() {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-neutral-600" aria-hidden>
			<path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}
function PersonIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-neutral-700" aria-hidden>
			<circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
			<path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}
function PeopleIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-neutral-500" aria-hidden>
			<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
			<circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
			<path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}
function SearchIcon({ className }: { className?: string }) {
	return (
		<svg width="15" height="15" viewBox="0 0 24 24" fill="none" className={className ?? "text-neutral-400"} aria-hidden>
			<circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
			<path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}
function GateSmIcon() {
	return (
		<svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-red-400" aria-hidden>
			<rect x="2" y="7" width="8" height="14" rx="1" stroke="currentColor" strokeWidth="2" />
			<rect x="14" y="7" width="8" height="14" rx="1" stroke="currentColor" strokeWidth="2" />
		</svg>
	)
}
function ClockBadgeIcon({ className }: { className?: string }) {
	return (
		<svg width="9" height="9" viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
			<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" />
			<path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
		</svg>
	)
}
function CheckBadgeIcon({ className }: { className?: string }) {
	return (
		<svg width="9" height="9" viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
			<path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}
function _XBadgeIcon({ className }: { className?: string }) {
	return (
		<svg width="9" height="9" viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
			<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
		</svg>
	)
}
function MiniSpinner() {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="animate-spin shrink-0">
			<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
			<path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}
