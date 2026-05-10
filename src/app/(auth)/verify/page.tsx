"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { AuthShell } from "@/components/auth/AuthShell"
import { OtpInput } from "@/components/auth/OtpInput"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import LockKeyholeSvg from "@/icons/outlined/lock-keyhole.svg"
import ArrowLeftSvg from "@/icons/outlined/arrow-left.svg"
import { useAuth } from "@/context/AuthContext"
import { useAuthSessionStore } from "@/store/authSessionStore"
import { fetchUserDetails, UserNotFoundError } from "@/lib/api"
import { CountrySelect } from "@/components/auth/PhoneField"
import { COUNTRIES, DEFAULT_COUNTRY } from "@/lib/countries"

const schema = z.object({
	otp: z
		.string()
		.length(6, "Enter the 6-digit OTP")
		.regex(/^\d+$/, "OTP must contain only digits"),
})

type FormValues = z.infer<typeof schema>

const RESEND_SECONDS = 42

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


export default function VerifyPage() {
	const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS)
	const [loading, setLoading] = useState(false)
	const { confirmOtp, sendOtp } = useAuth()
	const { intent, phone, clearSession } = useAuthSessionStore()
	const router = useRouter()
	const canResend = secondsLeft === 0

	const {
		control,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { otp: "" },
	})

	useEffect(() => {
		if (!intent) router.replace("/login")
	}, [intent, router])

	useEffect(() => {
		if (secondsLeft === 0) return
		const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
		return () => clearTimeout(t)
	}, [secondsLeft])

	const formatTime = (s: number) =>
		`${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

	async function handleResend() {
		if (!canResend || !phone) return
		try {
			await sendOtp(phone, "recaptcha-container-verify")
			setSecondsLeft(RESEND_SECONDS)
			toast.success("OTP resent!")
		} catch {
			toast.error("Failed to resend OTP. Please try again.")
		}
	}

	async function onSubmit({ otp }: FormValues) {
		setLoading(true)
		try {
			await confirmOtp(otp)

			let userExists = true
			try {
				await fetchUserDetails()
			} catch (e) {
				if (e instanceof UserNotFoundError) userExists = false
				else throw e
			}

			if (intent === "login") {
				if (userExists) {
					clearSession()
					router.push("/dashboard")
				} else {
					toast.error("Account not found. Please sign up.")
				}
			} else {
				if (userExists) {
					toast.error("Account already exists. Please log in.")
				} else {
					router.push("/onboarding")
				}
			}
		} catch {
			toast.error("Invalid OTP. Please try again.")
			setValue("otp", "")
		} finally {
			setLoading(false)
		}
	}

	const backHref = intent === "login" ? "/login" : "/signup"
	const inferredCountry = phone
		? (COUNTRIES.find((c) => phone.startsWith(c.dialCode)) ?? DEFAULT_COUNTRY)
		: DEFAULT_COUNTRY
	const localPhone = phone
		? phone.slice(inferredCountry.dialCode.length).replace(/(\d{5})(\d{5})/, "$1-$2")
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
				<Icon as={ArrowLeftSvg} size="sm" />
				{intent === "login" ? "Back to Log in" : "Back to Sign up"}
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

			<form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
				<div>
					<p className="text-label-md text-text-primary mb-1.5">Phone number</p>
					<div className="flex items-center rounded-input border border-border-default bg-surface-canvas h-(--size-input-md)">
						<CountrySelect value={inferredCountry} onChange={() => {}} disabled />
						<span className="flex-1 px-3 text-body-sm text-text-primary">{localPhone}</span>
						<Link href={backHref} className="text-label-md text-text-link hover:underline pr-4">
							Edit
						</Link>
					</div>
				</div>

				<div>
					<p className="text-label-md text-text-primary mb-3">Enter 6-digit OTP</p>
					<Controller
						control={control}
						name="otp"
						render={({ field }) => (
							<OtpInput value={field.value} onChange={field.onChange} length={6} />
						)}
					/>
					{errors.otp && (
						<p className="text-caption text-text-danger mt-2">{errors.otp.message}</p>
					)}
				</div>

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
					disabled={loading}
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
