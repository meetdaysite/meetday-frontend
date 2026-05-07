"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthShell } from "@/components/auth/AuthShell"
import { OtpInput } from "@/components/auth/OtpInput"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import LockKeyholeSvg from "@/icons/outlined/lock-keyhole.svg"
import { useAuth } from "@/context/AuthContext"
import { fetchUserDetails, UserNotFoundError } from "@/lib/api"
import type { AuthSession } from "@/context/AuthContext"

function ShieldCheckIcon() {
	return (
		<svg viewBox="0 0 48 48" fill="none" className="size-full" aria-hidden>
			<path
				d="M24 4L8 10v14c0 9.94 6.84 19.24 16 22 9.16-2.76 16-12.06 16-22V10L24 4z"
				fill="var(--surface-success-soft)"
			/>
			<path
				d="M24 4L8 10v14c0 9.94 6.84 19.24 16 22 9.16-2.76 16-12.06 16-22V10L24 4z"
				stroke="var(--icon-success)"
				strokeWidth={2}
				strokeLinejoin="round"
			/>
			<path
				d="M17 24l5 5 9-10"
				stroke="var(--icon-success)"
				strokeWidth={2.5}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

function ArrowLeftIcon() {
	return (
		<svg
			viewBox="0 0 20 20"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.75}
			strokeLinecap="round"
			strokeLinejoin="round"
			className="size-4"
		>
			<path d="M12 4L6 10l6 6" />
		</svg>
	)
}

const RESEND_SECONDS = 42

export default function VerifyPage() {
	const [otp, setOtp] = useState("")
	const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS)
	const [error, setError] = useState("")
	const [loading, setLoading] = useState(false)
	const [session, setSession] = useState<AuthSession | null>(null)
	const { confirmOtp, sendOtp } = useAuth()
	const router = useRouter()
	const canResend = secondsLeft === 0

	useEffect(() => {
		const raw = sessionStorage.getItem("authSession")
		if (!raw) { router.replace("/login"); return }
		setSession(JSON.parse(raw) as AuthSession)
	}, [router])

	useEffect(() => {
		if (secondsLeft === 0) return
		const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000)
		return () => clearTimeout(t)
	}, [secondsLeft])

	const formatTime = (s: number) =>
		`${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

	async function handleResend() {
		if (!canResend || !session?.phone) return
		setError("")
		try {
			await sendOtp(session.phone, "recaptcha-container-verify")
			setSecondsLeft(RESEND_SECONDS)
		} catch {
			setError("Failed to resend OTP. Please try again.")
		}
	}

	async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		if (otp.length < 6 || !session) return
		setError("")
		setLoading(true)
		try {
			const idToken = await confirmOtp(otp)

			let userExists = true
			try {
				await fetchUserDetails(idToken)
			} catch (e) {
				if (e instanceof UserNotFoundError) userExists = false
				else throw e
			}

			if (session.intent === "login") {
				if (userExists) {
					sessionStorage.removeItem("authSession")
					router.push("/dashboard")
				} else {
					setError("Account not found. Please sign up.")
				}
			} else {
				if (userExists) {
					setError("Account already exists. Please log in.")
				} else {
					router.push("/onboarding")
				}
			}
		} catch {
			setError("Invalid OTP. Please try again.")
			setOtp("")
		} finally {
			setLoading(false)
		}
	}

	const backHref = session?.intent === "login" ? "/login" : "/signup"
	const displayPhone = session?.phone
		? session.phone.replace(/^\+91/, "").replace(/(\d{5})(\d{5})/, "$1-$2")
		: ""

	return (
		<AuthShell
			phoneImage="/assets/phone_image_otp_verify.svg"
			pointsImage="/assets/points_otp_verify.svg"
		>
			<div id="recaptcha-container-verify" />

			<Link
				href={backHref}
				className="inline-flex items-center gap-1.5 text-body-sm text-text-secondary hover:text-text-primary transition-colors mb-8"
			>
				<ArrowLeftIcon />
				{session?.intent === "login" ? "Back to Log in" : "Back to Sign up"}
			</Link>

			<div className="size-14 mb-5">
				<ShieldCheckIcon />
			</div>

			<div className="mb-6">
				<h1 className="text-heading-sm text-text-primary mb-1">
					Verify your account and <span className="text-text-brand">unlock your vibe.</span>
				</h1>
				<p className="text-body-sm text-text-secondary mt-2">
					We&apos;ve sent a 6-digit OTP to your phone number. Enter the code below to verify your
					account.
				</p>
			</div>

			<form className="flex flex-col gap-5" onSubmit={handleVerify}>
				{/* Phone display */}
				<div>
					<p className="text-label-md text-text-primary mb-1.5">Phone number</p>
					<div className="flex items-center justify-between rounded-input border border-border-default bg-surface-canvas px-4 h-(--size-input-md)">
						<div className="flex items-center gap-2 text-body-sm text-text-primary">
							<span>🇮🇳</span>
							<span>+91</span>
							<span className="text-text-muted mx-1">·</span>
							<span>{displayPhone}</span>
						</div>
						<Link href={backHref} className="text-label-md text-text-link hover:underline">
							Edit
						</Link>
					</div>
				</div>

				<div>
					<p className="text-label-md text-text-primary mb-3">Enter 6-digit OTP</p>
					<OtpInput value={otp} onChange={setOtp} length={6} />
				</div>

				{error && <p className="text-caption text-text-danger">{error}</p>}

				<p className="text-body-sm text-text-secondary">
					Didn&apos;t receive the code?{" "}
					<button
						type="button"
						onClick={handleResend}
						disabled={!canResend}
						className={
							canResend
								? "font-medium text-text-link hover:underline"
								: "font-medium text-text-muted cursor-default"
						}
					>
						{canResend ? "Resend" : `Resend in ${formatTime(secondsLeft)}`}
					</button>
				</p>

				<Button
					type="submit"
					variant="primary"
					size="md"
					radius="pill"
					className="w-full"
					leftIcon={<Icon as={LockKeyholeSvg} />}
					disabled={otp.length < 6 || loading}
				>
					{loading ? "Verifying…" : "Verify OTP"}
				</Button>

				<p className="text-caption text-text-muted text-center leading-relaxed">
					Your information is secure and encrypted. We never share your details with anyone.
				</p>
			</form>
		</AuthShell>
	)
}
