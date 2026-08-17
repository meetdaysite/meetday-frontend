"use client"

import { Suspense, useEffect, useState } from "react"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { verifySession } from "@/lib/scannerApi"
import type { VerifySessionResponse, ScanResult } from "@/lib/scannerApi"
import { Button } from "@/components/ui/Button"
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

function isLinkDeadStatus(status: number | undefined): boolean {
	return status === 401 || status === 403 || status === 410
}

function ScanPageInner() {
	const searchParams = useSearchParams()
	const token = searchParams.get("token") ?? ""
	const [sessionData, setSessionData] = useState<VerifySessionResponse | null>(null)
	const [state, setState] = useState<AppState>({ screen: "VALIDATING" })

	function loadSession() {
		if (!token) {
			setState({ screen: "INVALID" })
			return
		}
		verifySession(token)
			.then((data) => {
				setSessionData(data)
				setState({ screen: "HOME" })
			})
			.catch((err: unknown) => {
				const status = (err as { status?: number }).status
				if (isLinkDeadStatus(status)) {
					setState({ screen: "INVALID", message: "expired" })
				} else {
					setState({ screen: "LOAD_ERROR" })
				}
			})
	}

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		loadSession()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token])

	if (state.screen === "VALIDATING") return <ValidatingScreen />

	if (state.screen === "INVALID") return <ScanInvalidToken message={state.message} />

	if (state.screen === "LOAD_ERROR") return <LoadErrorScreen onRetry={loadSession} />

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
					sessionData={sessionData}
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
		<div className="min-h-screen flex flex-col items-center justify-center p-8 bg-surface-canvas gap-6">
			<div className="size-20 rounded-avatar bg-surface-warning-soft flex items-center justify-center">
				<svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-text-warning" aria-hidden>
					<path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
					<path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			</div>
			<div className="text-center max-w-xs">
				<h1 className="text-title-md text-text-primary mb-2">Connection problem</h1>
				<p className="text-body-sm text-text-secondary leading-relaxed">
					Could not reach the server. Check your connection and try again.
				</p>
			</div>
			<Button onClick={onRetry} size="lg" radius="lg">
				Try again
			</Button>
		</div>
	)
}

function ValidatingScreen() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-surface-canvas px-4">
			<Image src="/assets/brand_logo.svg" alt="Meetday" width={120} height={32} className="h-8 w-auto" priority />
			<div className="size-8 rounded-avatar border-2 border-action-primary border-t-transparent animate-spin" />
			<p className="text-label-sm text-text-tertiary">Verifying your access…</p>
		</div>
	)
}
