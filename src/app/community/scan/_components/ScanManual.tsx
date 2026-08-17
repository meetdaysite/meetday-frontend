"use client"

import { useState } from "react"
import { lookupBooking, scanTicket, toScanResult } from "@/lib/scannerApi"
import type { LookupResult, ScanResult, VerifySessionResponse } from "@/lib/scannerApi"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"

type Props = {
	sessionData: VerifySessionResponse
	token: string
	onResult: (result: ScanResult) => void
	onBack: () => void
}

type TabType = "bookingId" | "ticketCode"

function lookupErrorMessage(status: number | undefined): string {
	if (status === 404) return "No booking found with that ID."
	if (status === 400) return "Enter a booking ID or ticket code."
	return "Connection problem — check your signal and try again."
}

function checkInErrorMessage(status: number | undefined): string {
	if (status === 404) return "Ticket not found."
	if (status === 400) return "This ticket isn't valid for this event."
	return "Check-in failed — check your connection and try again."
}

export function ScanManual({ sessionData, token, onResult, onBack }: Props) {
	const { event } = sessionData
	const [tab, setTab] = useState<TabType>("ticketCode")
	const [query, setQuery] = useState("")
	const [result, setResult] = useState<LookupResult | null>(null)
	const [searching, setSearching] = useState(false)
	const [searchError, setSearchError] = useState("")
	const [checkingIn, setCheckingIn] = useState(false)
	const [approveError, setApproveError] = useState<string | null>(null)

	function switchTab(t: TabType) {
		setTab(t)
		setQuery("")
		setResult(null)
		setSearchError("")
		setApproveError(null)
	}

	async function handleSearch() {
		if (!query.trim()) return
		setSearching(true)
		setSearchError("")
		setResult(null)
		setApproveError(null)
		try {
			const payload = tab === "bookingId" ? { bookingId: query.trim() } : { ticketCode: query.trim() }
			const res = await lookupBooking(token, payload)
			setResult(res)
		} catch (err) {
			const status = (err as { status?: number }).status
			setSearchError(lookupErrorMessage(status))
		} finally {
			setSearching(false)
		}
	}

	async function handleApprove() {
		setCheckingIn(true)
		setApproveError(null)
		try {
			const ticketCode = query.trim()
			const data = await scanTicket(ticketCode, token)
			onResult(toScanResult(ticketCode, data))
		} catch (err) {
			const status = (err as { status?: number }).status
			setApproveError(checkInErrorMessage(status))
			setCheckingIn(false)
		}
	}

	return (
		<div className="flex flex-col min-h-screen bg-surface-canvas">
			{/* Header */}
			<div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle">
				<button onClick={onBack} className="size-9 flex items-center justify-center rounded-action active:bg-surface-card-muted transition-colors">
					<BackIcon />
				</button>
				<p className="text-label-md text-text-primary font-bold">{event.title}</p>
			</div>

			<div className="flex-1 flex flex-col gap-5 px-4 py-5 overflow-y-auto">
				{/* Title */}
				<div>
					<div className="flex items-center gap-2 mb-1">
						<PersonIcon />
						<h1 className="text-label-md text-text-primary font-bold">Manual check-in</h1>
					</div>
					<p className="text-caption text-text-tertiary">Look up a booking or check someone in by ticket code.</p>
				</div>

				{/* Tabs */}
				<div className="flex bg-surface-card-muted rounded-action p-1">
					{(["ticketCode", "bookingId"] as TabType[]).map((t) => (
						<button
							key={t}
							onClick={() => switchTab(t)}
							className={`flex-1 py-2 text-label-sm rounded-badge transition-colors ${
								tab === t ? "bg-surface-card text-text-primary shadow-card font-semibold" : "text-text-tertiary"
							}`}
						>
							{t === "bookingId" ? "Booking ID" : "Ticket Code"}
						</button>
					))}
				</div>

				{/* Search input */}
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2 px-3 py-3 border border-border-default rounded-action bg-surface-card-muted">
						<SearchIcon />
						<input
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleSearch()}
							placeholder={tab === "bookingId" ? "Enter booking ID" : "Enter ticket code"}
							className="flex-1 bg-transparent text-label-md text-text-primary placeholder:text-text-muted outline-none"
						/>
					</div>
					<p className="text-caption text-text-muted">
						{tab === "bookingId"
							? "Shows booking status only — use Ticket Code to check someone in."
							: "Enter the individual ticket UUID from the QR code."}
					</p>
				</div>

				{/* Search button */}
				<Button
					onClick={handleSearch}
					disabled={!query.trim() || searching}
					size="lg"
					radius="lg"
					className="w-full"
					leftIcon={searching ? <MiniSpinner /> : <SearchIcon className="text-action-primary-text" />}
				>
					{searching ? "Searching…" : "Search"}
				</Button>

				{/* Error */}
				{searchError && (
					<p className="text-label-sm text-text-danger text-center">{searchError}</p>
				)}

				{/* Booking status result (read-only) */}
				{result && (
					<div className="flex flex-col gap-3">
						<p className="text-label-md text-text-primary font-semibold">Booking status</p>
						<div className="border border-border-default rounded-action shadow-card overflow-hidden">
							<div className="flex items-center justify-between px-4 py-3 bg-surface-card-muted">
								<span className="text-label-sm text-text-secondary font-mono font-semibold">{result.bookingCode}</span>
								<Badge variant={result.orderStatus === "CONFIRMED" ? "success" : "default"}>
									{result.orderStatus}
								</Badge>
							</div>
							<div className="flex flex-col divide-y divide-border-subtle">
								{result.items.map((item) => {
									const remaining = item.totalEntries - item.checkedInCount
									return (
										<div key={item.orderItemId} className="flex items-center justify-between px-4 py-3">
											<div>
												<p className="text-label-md text-text-primary font-semibold">{item.ticketType}</p>
												<p className="text-caption text-text-tertiary">
													{item.checkedInCount}/{item.totalEntries} checked in
												</p>
											</div>
											<Badge variant={remaining === 0 ? "success" : item.checkedInCount > 0 ? "warning" : "default"}>
												{remaining === 0 ? "Fully checked in" : item.checkedInCount > 0 ? "Partially checked in" : "Not checked in"}
											</Badge>
										</div>
									)
								})}
							</div>
						</div>

						{tab === "ticketCode" && (
							<>
								{approveError && <p className="text-label-sm text-text-danger text-center">{approveError}</p>}
								<Button onClick={handleApprove} disabled={checkingIn} size="lg" radius="lg" className="w-full">
									{checkingIn ? <MiniSpinner /> : null}
									Approve entry
								</Button>
							</>
						)}
					</div>
				)}
			</div>

			{/* Sticky bottom */}
			<div className="px-4 pb-6 pt-2 border-t border-border-subtle">
				<Button onClick={onBack} variant="secondary" size="lg" radius="lg" className="w-full" leftIcon={<BackIcon />}>
					Back to scanner
				</Button>
			</div>
		</div>
	)
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function BackIcon() {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-text-secondary" aria-hidden>
			<path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}
function PersonIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-text-secondary" aria-hidden>
			<circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
			<path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}
function SearchIcon({ className }: { className?: string }) {
	return (
		<svg width="15" height="15" viewBox="0 0 24 24" fill="none" className={className ?? "text-text-muted"} aria-hidden>
			<circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
			<path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
