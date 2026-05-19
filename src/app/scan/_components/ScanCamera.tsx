"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { getLiveStats, parseQrContent, scanTicket } from "@/lib/scannerApi"
import type { LiveStatsResponse, ScanResult, VerifySessionResponse } from "@/lib/scannerApi"
import { PrivacyNotice } from "./PrivacyNotice"

type Props = {
	sessionData: VerifySessionResponse
	token: string
	onResult: (result: ScanResult) => void
	onPause: () => void
	onManualCheckIn: () => void
	onSessionExpired: () => void
}

export function ScanCamera({ sessionData, token, onResult, onPause, onManualCheckIn, onSessionExpired }: Props) {
	const { session, event } = sessionData
	const videoRef = useRef<HTMLVideoElement>(null)
	const scannerRef = useRef<import("qr-scanner").default | null>(null)
	const processingRef = useRef(false)

	const [torchOn, setTorchOn] = useState(false)
	const [torchAvailable, setTorchAvailable] = useState(false)
	const [facingMode, setFacingMode] = useState<"environment" | "user">("environment")
	const [stats, setStats] = useState<LiveStatsResponse | null>(null)
	const [syncStatus, setSyncStatus] = useState<"live" | "offline">("live")
	const [showTips, setShowTips] = useState(false)
	const [scanning, setScanning] = useState(true)
	const [cameraError, setCameraError] = useState<"permission" | "unavailable" | null>(null)
	const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

	useEffect(() => {
		async function fetchStats() {
			try {
				const s = await getLiveStats(token)
				setStats(s)
				setSyncStatus("live")
			} catch (err) {
				const status = (err as { status?: number }).status
				if (status === 401 || status === 403) { onSessionExpired(); return }
				setSyncStatus("offline")
			}
		}

		void fetchStats()
		statsIntervalRef.current = setInterval(() => void fetchStats(), 10_000)
		return () => {
			if (statsIntervalRef.current) clearInterval(statsIntervalRef.current)
		}
	}, [token, onSessionExpired])

	const handleDecode = useCallback(
		async (result: { data: string }) => {
			if (processingRef.current || !scanning) return
			processingRef.current = true
			setScanning(false)
			scannerRef.current?.pause()

			const ticketCode = parseQrContent(result.data)
			try {
				const scanResult = await scanTicket(ticketCode, token)
				onResult(scanResult)
			} catch (err) {
				const status = (err as { status?: number }).status
				if (status === 401 || status === 403) { onSessionExpired(); return }
				const msg = status === 404 ? "Ticket not found" : "Scan failed — try again"
				onResult({ status: "INVALID", message: msg })
				processingRef.current = false
			}
		},
		[scanning, token, onResult],
	)

	useEffect(() => {
		let cancelled = false
		let QrScanner: typeof import("qr-scanner").default

		async function initScanner() {
			let mod: typeof import("qr-scanner")
			try {
				mod = await import("qr-scanner")
			} catch {
				if (!cancelled) setCameraError("unavailable")
				return
			}
			if (cancelled) return
			QrScanner = mod.default

			if (!videoRef.current) return
			const scanner = new QrScanner(videoRef.current, handleDecode, {
				preferredCamera: facingMode,
				highlightScanRegion: false,
				highlightCodeOutline: false,
			})
			scannerRef.current = scanner

			try {
				await scanner.start()
			} catch (err) {
				if ((err as Error)?.name === "AbortError") return
				if (!cancelled) {
					scanner.destroy()
					scannerRef.current = null
					const isPermission = (err as Error)?.name === "NotAllowedError"
					setCameraError(isPermission ? "permission" : "unavailable")
				}
				return
			}
			if (cancelled) { scanner.stop(); scanner.destroy(); return }
			const hasFlash = await QrScanner.hasCamera()
			if (!cancelled) setTorchAvailable(hasFlash)
		}

		initScanner()

		return () => {
			cancelled = true
			scannerRef.current?.stop()
			scannerRef.current?.destroy()
			scannerRef.current = null
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [facingMode])

	async function toggleTorch() {
		if (!scannerRef.current) return
		try {
			await scannerRef.current.toggleFlash()
			setTorchOn((v) => !v)
		} catch {
			// torch not supported
		}
	}

	function flipCamera() {
		setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))
	}

	const formattedDate = event.eventDate
		? new Date(event.eventDate).toLocaleDateString("en-IN", {
				weekday: "short", day: "numeric", month: "long",
		  })
		: "—"

	return (
		<div className="flex flex-col min-h-screen bg-black">
			{/* Compact event header */}
			<div className="flex items-center justify-between px-4 py-3 bg-black/80 z-10">
				<div>
					<p className="text-[14px] font-bold text-white">{event.title}</p>
					<p className="text-[11px] text-white/60">{event.venueName} · {session.label ?? "Main Entry"}</p>
				</div>
				<div className="text-right">
					<p className="text-[12px] text-white/70">{formattedDate}</p>
					<p className="text-[11px] text-white/50">{event.startTime} – {event.endTime}</p>
				</div>
			</div>

			{/* Camera viewport */}
			<div className="relative flex-1 overflow-hidden bg-black" style={{ minHeight: "55vw", maxHeight: "65vh" }}>
				<video
					ref={videoRef}
					className="absolute inset-0 w-full h-full object-cover"
					muted
					playsInline
				/>

				{/* Dark overlay with cutout feel */}
				<div className="absolute inset-0 pointer-events-none">
					{/* Top overlay */}
					<div className="absolute top-0 left-0 right-0 h-[20%] bg-black/50" />
					{/* Bottom overlay */}
					<div className="absolute bottom-0 left-0 right-0 h-[20%] bg-black/50" />
					{/* Left overlay */}
					<div className="absolute top-[20%] bottom-[20%] left-0 w-[12%] bg-black/50" />
					{/* Right overlay */}
					<div className="absolute top-[20%] bottom-[20%] right-0 w-[12%] bg-black/50" />

					{/* Corner brackets */}
					<div className="absolute top-[20%] left-[12%] w-8 h-8 border-l-2 border-t-2 border-white/90 rounded-tl-sm" />
					<div className="absolute top-[20%] right-[12%] w-8 h-8 border-r-2 border-t-2 border-white/90 rounded-tr-sm" />
					<div className="absolute bottom-[20%] left-[12%] w-8 h-8 border-l-2 border-b-2 border-white/90 rounded-bl-sm" />
					<div className="absolute bottom-[20%] right-[12%] w-8 h-8 border-r-2 border-b-2 border-white/90 rounded-br-sm" />

					{/* Scan line */}
					<div className="absolute left-[12%] right-[12%] top-[20%] bottom-[20%] flex items-center">
						<div className="w-full h-0.5 bg-red-500/80 animate-[scanline_2s_ease-in-out_infinite]" />
					</div>
				</div>

{/* Hint text */}
				<div className="absolute top-[22%] left-0 right-0 flex justify-center pointer-events-none">
					<div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 rounded-full">
						<ScanFrameIcon />
						<span className="text-[11px] text-white/80">Align the attendee QR inside the frame</span>
					</div>
				</div>

				{/* Camera error overlay */}
				{cameraError && (
					<div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 px-6 text-center z-10">
						<div className="size-16 rounded-full bg-white/10 flex items-center justify-center">
							{cameraError === "permission"
								? <NoCameraIcon />
								: <AlertIcon />
							}
						</div>
						<div>
							<p className="text-white font-bold text-[16px] mb-1">
								{cameraError === "permission" ? "Camera access denied" : "Camera unavailable"}
							</p>
							<p className="text-white/70 text-[12px] leading-snug">
								{cameraError === "permission"
									? "Allow camera access in your browser settings, then reload the page."
									: "Could not start the camera. Use manual check-in instead."}
							</p>
						</div>
						<button
							onClick={onManualCheckIn}
							className="flex items-center gap-2 px-5 py-2.5 bg-white text-neutral-900 text-[13px] font-semibold rounded-xl"
						>
							Switch to manual check-in
						</button>
					</div>
				)}

				{/* Camera controls */}
				{torchAvailable && (
					<button
						onClick={toggleTorch}
						className="absolute top-3 left-3 flex flex-col items-center gap-1 px-3 py-2 bg-black/60 rounded-xl"
					>
						<TorchIcon active={torchOn} />
						<span className="text-[10px] text-white/80">Torch</span>
					</button>
				)}
				<button
					onClick={flipCamera}
					className="absolute top-3 right-3 flex flex-col items-center gap-1 px-3 py-2 bg-black/60 rounded-xl"
				>
					<FlipIcon />
					<span className="text-[10px] text-white/80">Flip</span>
				</button>
			</div>

			{/* Bottom panel */}
			<div className="flex flex-col gap-4 px-4 py-5 bg-white">
				{/* Privacy notice compact */}
				<PrivacyNotice compact />

				{/* Stats strip */}
				<div className="flex items-center justify-between">
					<StatChip
						icon={<CheckSmIcon />}
						label="Checked in"
						value={stats?.checkedIn ?? "—"}
						color="text-green-600"
					/>
					<StatChip
						icon={<PeopleSmIcon />}
						label="Remaining"
						value={stats?.remaining ?? "—"}
						color="text-neutral-700"
					/>
					<div className="flex flex-col items-center gap-0.5">
						<div className="flex items-center gap-1">
							<span className={`size-2 rounded-full ${syncStatus === "live" ? "bg-green-500" : "bg-orange-400"}`} />
							<span className="text-[13px] font-bold text-neutral-800">{syncStatus === "live" ? "Live" : "Offline"}</span>
						</div>
						<span className="text-[10px] text-neutral-400">{syncStatus === "live" ? "● Connected" : "Reconnecting…"}</span>
					</div>
				</div>

				{/* Action buttons */}
				<button
					onClick={onPause}
					className="w-full flex items-center justify-center gap-2 h-13 bg-red-600 text-white text-[15px] font-semibold rounded-2xl active:bg-red-700 transition-colors"
				>
					<PauseIcon />
					Pause scanning
				</button>
				<button
					onClick={onManualCheckIn}
					className="w-full flex items-center justify-center gap-2 h-11 border-2 border-neutral-200 text-neutral-700 text-[14px] font-medium rounded-2xl active:bg-neutral-50 transition-colors"
				>
					<PersonSmIcon />
					Manual check-in
				</button>
				<button
					onClick={() => setShowTips(true)}
					className="text-[13px] text-blue-600 font-medium text-center"
				>
					<span className="flex items-center justify-center gap-1"><LightbulbIcon /> Scan tips</span>
				</button>
			</div>

			{/* Scan tips bottom sheet */}
			{showTips && (
				<div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowTips(false)}>
					<div className="w-full bg-white rounded-t-2xl p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
						<p className="text-[15px] font-bold text-neutral-900 mb-4">Scan tips</p>
						<ul className="flex flex-col gap-3">
							{[
								"Hold steady — let the camera focus",
								"Ensure the QR code is well lit",
								"Keep the QR fully inside the frame",
								"Try flipping to front camera indoors",
							].map((tip) => (
								<li key={tip} className="flex items-start gap-2 text-[13px] text-neutral-600">
									<span className="mt-1.5 size-1.5 rounded-full bg-red-500 shrink-0" />
									{tip}
								</li>
							))}
						</ul>
						<button
							onClick={() => setShowTips(false)}
							className="w-full mt-5 h-11 bg-neutral-100 text-neutral-700 text-[14px] font-medium rounded-xl"
						>
							Got it
						</button>
					</div>
				</div>
			)}

			<style>{`
				@keyframes scanline {
					0%, 100% { transform: translateY(0); opacity: 1; }
					50% { transform: translateY(8px); opacity: 0.6; }
				}
			`}</style>
		</div>
	)
}

function StatChip({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
	return (
		<div className="flex flex-col items-center gap-0.5">
			<div className={`flex items-center gap-1 ${color}`}>
				{icon}
				<span className="text-[18px] font-bold">{value}</span>
			</div>
			<span className="text-[10px] text-neutral-400">{label}</span>
		</div>
	)
}

function ScanFrameIcon() {
	return (
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-white/80" aria-hidden>
			<path d="M3 9V5a2 2 0 0 1 2-2h4M15 3h4a2 2 0 0 1 2 2v4M3 15v4a2 2 0 0 1 2 2h4M15 21h4a2 2 0 0 1 2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}
function TorchIcon({ active }: { active: boolean }) {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={active ? "text-yellow-400" : "text-white/80"} aria-hidden>
			<path d="M13 2L4.09 12.96A1 1 0 0 0 5 14.5h7l-1 7.5 8.91-10.96A1 1 0 0 0 19 9.5h-7L13 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
		</svg>
	)
}
function FlipIcon() {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white/80" aria-hidden>
			<path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}
function PauseIcon() {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
			<rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
			<rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
		</svg>
	)
}
function PersonSmIcon() {
	return (
		<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
			<circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
			<path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}
function CheckSmIcon() {
	return (
		<svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
			<path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}
function PeopleSmIcon() {
	return (
		<svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
			<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
			<circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
		</svg>
	)
}
function NoCameraIcon() {
	return (
		<svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white/80" aria-hidden>
			<path d="M1 1l22 22M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h2a2 2 0 0 1 2 2v9.34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
			<circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="2" />
		</svg>
	)
}
function AlertIcon() {
	return (
		<svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white/80" aria-hidden>
			<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
			<path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}
function LightbulbIcon() {
	return (
		<svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
			<path d="M9 21h6M12 3a6 6 0 0 1 6 6c0 2.22-1.21 4.16-3 5.2V17H9v-2.8A6 6 0 0 1 6 9a6 6 0 0 1 6-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}
