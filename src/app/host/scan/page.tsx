"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { verifySession } from "@/lib/scannerApi"
import type { VerifySessionResponse, ScanResult } from "@/lib/scannerApi"
// import { ScanDesktopGate } from "./_components/ScanDesktopGate"
import { ScanInvalidToken } from "./_components/ScanInvalidToken"
import { ScanHome } from "./_components/ScanHome"
import { ScanCamera } from "./_components/ScanCamera"
import { ScanResultApproved } from "./_components/ScanResultApproved"
import { ScanResultGroup } from "./_components/ScanResultGroup"
import { ScanResultDuplicate } from "./_components/ScanResultDuplicate"
import { ScanManual } from "./_components/ScanManual"
import { ScanResultInvalid } from "./_components/ScanResultInvalid"

type AppState =
	| { screen: "VALIDATING" }
	| { screen: "INVALID"; message?: string }
	| { screen: "LOAD_ERROR" }
	| { screen: "HOME" }
	| { screen: "SCANNING" }
	| { screen: "MANUAL" }
	| { screen: "APPROVED"; result: Extract<ScanResult, { status: "APPROVED" }> }
	| { screen: "GROUP"; result: Extract<ScanResult, { status: "GROUP_PARTIAL" }> }
	| { screen: "DUPLICATE"; result: Extract<ScanResult, { status: "DUPLICATE" }> }
	| { screen: "TICKET_INVALID"; message?: string }

function ScanPageInner() {
	const searchParams = useSearchParams()
	const token = searchParams.get("token") ?? ""
	const [sessionData, setSessionData] = useState<VerifySessionResponse | null>(null)
	const [state, setState] = useState<AppState>({ screen: "VALIDATING" })
	const [debugLines, setDebugLines] = useState<string[]>([])

	function dbg(msg: string) {
		const line = `${new Date().toISOString().slice(11, 23)} ${msg}`
		// console.log("[scan]", msg)
		setDebugLines((prev) => [...prev.slice(-30), line])
	}

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		dbg(`token="${token || "(empty)"}"`)
		if (!token) {
			dbg("ERROR: no token → INVALID")
			setState({ screen: "INVALID" })
			return
		}

		dbg(`fetch → /api/scan/verify-session`)
		verifySession(token)
			.then((data) => {
				dbg(`SUCCESS: session for "${data.session?.staffName}"`)
				setSessionData(data)
				setState({ screen: "HOME" })
			})
			.catch((err: unknown) => {
				const status = (err as { status?: number }).status
				const msg = (err as Error).message
				dbg(`FAILED: status=${status} msg="${msg}"`)
				if (status === 401 || status === 403) {
					setState({ screen: "INVALID", message: "expired" })
				} else {
					// Network/server error — allow retry
					setState({ screen: "LOAD_ERROR" })
				}
			})
	}, [token])

	// if (isDesktop) return <ScanDesktopGate />

	if (state.screen === "VALIDATING") return <ValidatingScreen debugLines={debugLines} token={token} />

	if (state.screen === "INVALID") return <ScanInvalidToken message={state.message} />

	if (state.screen === "LOAD_ERROR") return <LoadErrorScreen onRetry={() => {
		setState({ screen: "VALIDATING" })
		verifySession(token)
			.then((data) => { setSessionData(data); setState({ screen: "HOME" }) })
			.catch((err: unknown) => {
				const status = (err as { status?: number }).status
				if (status === 401 || status === 403) setState({ screen: "INVALID", message: "expired" })
				else setState({ screen: "LOAD_ERROR" })
			})
	}} />

	if (!sessionData) return <ValidatingScreen />

	function handleSessionExpired() {
		setState({ screen: "INVALID", message: "expired" })
	}

	function handleScanResult(result: ScanResult) {
		if (result.status === "APPROVED") {
			setState({ screen: "APPROVED", result })
		} else if (result.status === "GROUP_PARTIAL") {
			setState({ screen: "GROUP", result })
		} else if (result.status === "DUPLICATE") {
			setState({ screen: "DUPLICATE", result })
		} else {
			setState({ screen: "TICKET_INVALID", message: result.message })
		}
	}

	switch (state.screen) {
		case "HOME":
			return (
				<ScanHome
					sessionData={sessionData}
					token={token}
					onStartScanning={() => setState({ screen: "SCANNING" })}
					onManualCheckIn={() => setState({ screen: "MANUAL" })}
					onSessionExpired={handleSessionExpired}
				/>
			)
		case "SCANNING":
			return (
				<ScanCamera
					sessionData={sessionData}
					token={token}
					onResult={handleScanResult}
					onPause={() => setState({ screen: "HOME" })}
					onManualCheckIn={() => setState({ screen: "MANUAL" })}
					onSessionExpired={handleSessionExpired}
				/>
			)
		case "APPROVED":
			return (
				<ScanResultApproved
					result={state.result}
					onScanNext={() => setState({ screen: "SCANNING" })}
				/>
			)
		case "GROUP":
			return (
				<ScanResultGroup
					result={state.result}
					sessionData={sessionData}
					onScanNextMember={() => setState({ screen: "SCANNING" })}
					onFinishLater={() => setState({ screen: "HOME" })}
				/>
			)
		case "DUPLICATE":
			return (
				<ScanResultDuplicate
					result={state.result}
					onScanNext={() => setState({ screen: "SCANNING" })}
				/>
			)
		case "TICKET_INVALID":
			return (
				<ScanResultInvalid
					message={state.message}
					onScanNext={() => setState({ screen: "SCANNING" })}
				/>
			)

		case "MANUAL":
			return (
				<ScanManual
					sessionData={sessionData}
					token={token}
					onResult={handleScanResult}
					onBack={() => setState({ screen: "SCANNING" })}
				/>
			)
	}
}

export default function ScanPage() {
	return (
		<Suspense fallback={<ValidatingScreen />}>
			<ScanPageInner />
		</Suspense>
	)
}

function LoadErrorScreen({ onRetry }: { onRetry: () => void }) {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white gap-6">
			<div className="size-20 rounded-full bg-orange-50 flex items-center justify-center">
				<svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-orange-400" aria-hidden>
					<path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
					<path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			</div>
			<div className="text-center max-w-xs">
				<h1 className="text-xl font-bold text-neutral-900 mb-2">Connection problem</h1>
				<p className="text-sm text-neutral-500 leading-relaxed">
					Could not reach the server. Check your connection and try again.
				</p>
			</div>
			<button
				onClick={onRetry}
				className="flex items-center justify-center gap-2 h-12 px-8 bg-red-600 text-white text-[14px] font-semibold rounded-2xl active:bg-red-700 transition-colors"
			>
				Try again
			</button>
		</div>
	)
}

function ValidatingScreen({ debugLines, token }: { debugLines?: string[]; token?: string }) {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white px-4">
			<span className="text-2xl font-black text-red-600 tracking-tight">meetday</span>
			<div className="size-8 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
			<p className="text-[13px] text-neutral-400">Verifying your access…</p>
			<div className="w-full max-w-sm bg-neutral-900 rounded-panel shadow-md p-3 text-left">
				<p className="text-[10px] font-mono text-yellow-400 mb-1">— debug —</p>
				<p className="text-[10px] font-mono text-white break-all">
					token: {token ? `${token.slice(0, 12)}…` : "(empty — no token in URL)"}
				</p>
				<p className="text-[10px] font-mono text-white">
					effects fired: {debugLines?.length ?? 0} log lines
				</p>
				{debugLines && debugLines.map((line, i) => (
					<p key={i} className="text-[10px] font-mono text-green-400 leading-relaxed whitespace-pre-wrap break-all">
						{line}
					</p>
				))}
			</div>
		</div>
	)
}
