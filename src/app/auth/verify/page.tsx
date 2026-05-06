"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AuthShell } from "@/components/auth/AuthShell"
import { OtpInput } from "@/components/auth/OtpInput"
import { Button } from "@/components/ui/Button"

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

function LockIcon() {
	return (
		<svg
			viewBox="0 0 20 20"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.5}
			strokeLinecap="round"
			strokeLinejoin="round"
			className="size-full"
		>
			<rect x="4" y="9" width="12" height="9" rx="2" />
			<path d="M7 9V6.5a3 3 0 1 1 6 0V9" />
		</svg>
	)
}

// function SafeIcon() {
// 	return (
// 		<svg
// 			viewBox="0 0 24 24"
// 			fill="none"
// 			stroke="currentColor"
// 			strokeWidth={1.5}
// 			strokeLinecap="round"
// 			strokeLinejoin="round"
// 			aria-hidden
// 			className="size-9 shrink-0 text-icon-success"
// 		>
// 			<path d="M12 2 4 6v6c0 5.5 3.8 10.74 8 12 4.2-1.26 8-6.5 8-12V6L12 2z" />
// 			<path d="M9 12l2 2 4-4" />
// 		</svg>
// 	)
// }

// function SecureIcon() {
// 	return (
// 		<svg
// 			viewBox="0 0 24 24"
// 			fill="none"
// 			stroke="currentColor"
// 			strokeWidth={1.5}
// 			strokeLinecap="round"
// 			strokeLinejoin="round"
// 			aria-hidden
// 			className="size-9 shrink-0 text-icon-warning"
// 		>
// 			<circle cx="12" cy="12" r="9" />
// 			<circle cx="12" cy="9.5" r="2.5" />
// 			<path d="M7 19c0-2.76 2.24-5 5-5s5 2.24 5 5" />
// 		</svg>
// 	)
// }

// function ClockIcon() {
// 	return (
// 		<svg
// 			viewBox="0 0 24 24"
// 			fill="none"
// 			stroke="currentColor"
// 			strokeWidth={1.5}
// 			strokeLinecap="round"
// 			strokeLinejoin="round"
// 			aria-hidden
// 			className="size-9 shrink-0 text-icon-vibe"
// 		>
// 			<circle cx="12" cy="12" r="9" />
// 			<path d="M12 7v5l3 3" />
// 		</svg>
// 	)
// }

const RESEND_SECONDS = 42

export default function VerifyPage() {
	const [otp, setOtp] = useState("")
	const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS)
	const canResend = secondsLeft === 0

	useEffect(() => {
		if (secondsLeft === 0) return
		const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000)
		return () => clearTimeout(t)
	}, [secondsLeft])

	const formatTime = (s: number) =>
		`${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

	const handleResend = () => {
		if (!canResend) return
		setSecondsLeft(RESEND_SECONDS)
		// TODO: wire Firebase resend OTP
	}

	return (
		<AuthShell
			phoneImage="/assets/phone_image_otp_verify.svg"
			pointsImage="/assets/points_otp_verify.svg"
		>
			{/* Back link */}
			<Link
				href="/auth/signup"
				className="inline-flex items-center gap-1.5 text-body-sm text-text-secondary hover:text-text-primary transition-colors mb-8"
			>
				<ArrowLeftIcon />
				Back to Sign up
			</Link>

			{/* Shield icon */}
			<div className="size-14 mb-5">
				<ShieldCheckIcon />
			</div>

			{/* Heading */}
			<div className="mb-6">
				<h1 className="text-heading-sm text-text-primary mb-1">
					Verify your account and <span className="text-text-brand">unlock your vibe.</span>
				</h1>
				<p className="text-body-sm text-text-secondary mt-2">
					We&apos;ve sent a 5-digit OTP to your phone number. Enter the code below to verify your
					account.
				</p>
			</div>

			<form className="flex flex-col gap-5" onSubmit={e => e.preventDefault()}>
				{/* Phone display */}
				<div>
					<p className="text-label-md text-text-primary mb-1.5">Phone number</p>
					<div className="flex items-center justify-between rounded-input border border-border-default bg-surface-canvas px-4 h-(--size-input-md)">
						<div className="flex items-center gap-2 text-body-sm text-text-primary">
							<span>🇮🇳</span>
							<span>+91</span>
							<span className="text-text-muted mx-1">·</span>
							<span>98765-43210</span>
						</div>
						<button type="button" className="text-label-md text-text-link hover:underline">
							Edit
						</button>
					</div>
				</div>

				{/* OTP boxes */}
				<div>
					<p className="text-label-md text-text-primary mb-3">Enter 5-digit OTP</p>
					<OtpInput value={otp} onChange={setOtp} length={5} />
				</div>

				{/* Resend */}
				<p className="text-body-sm text-text-secondary">
					Didn&apos;t receive the code?{" "}
					<button
						type="button"
						onClick={handleResend}
						className={
							canResend
								? "font-medium text-text-link hover:underline"
								: "font-medium text-text-muted cursor-default"
						}
					>
						{canResend ? "Resend" : `Resend in ${formatTime(secondsLeft)}`}
					</button>
				</p>

				{/* Verify button */}
				<Button
					type="submit"
					variant="primary"
					size="md"
					radius="pill"
					className="w-full"
					leftIcon={<LockIcon />}
					disabled={otp.length < 5}
				>
					Verify OTP
				</Button>

				<Button
					type="button"
					variant="secondary"
					size="md"
					radius="pill"
					className="w-full"
				>
					Use instead Password
				</Button>

				{/* Privacy note */}
				<p className="text-caption text-text-muted text-center leading-relaxed">
					Your information is secure and encrypted. We never share your details with anyone.
				</p>

				{/* Trust badges */}
				{/* <div className="flex gap-2 pt-2">
					<div className="flex-1 flex items-start gap-2.5 rounded-card border border-border-subtle bg-surface-canvas p-3">
						<SafeIcon />
						<div className="min-w-0">
							<p className="text-label-sm text-text-primary">Safe &amp; Verified</p>
							<p className="text-[11px] text-text-muted leading-tight mt-0.5">
								All events and hosts are verified for your safety
							</p>
						</div>
					</div>
					<div className="flex-1 flex items-start gap-2.5 rounded-card border border-border-subtle bg-surface-canvas p-3">
						<SecureIcon />
						<div className="min-w-0">
							<p className="text-label-sm text-text-primary">Secure Checkout</p>
							<p className="text-[11px] text-text-muted leading-tight mt-0.5">
								Your payments and data are 100% secure.
							</p>
						</div>
					</div>
					<div className="flex-1 flex items-start gap-2.5 rounded-card border border-border-subtle bg-surface-canvas p-3">
						<ClockIcon />
						<div className="min-w-0">
							<p className="text-label-sm text-text-primary">Limited spots held</p>
							<p className="text-[11px] text-text-muted leading-tight mt-0.5">
								Your spot is held for 10 minutes.
							</p>
						</div>
					</div>
				</div> */}
			</form>
		</AuthShell>
	)
}
