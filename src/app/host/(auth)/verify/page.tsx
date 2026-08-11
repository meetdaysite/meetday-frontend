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
import { useHostStore } from "@/store/hostStore"
import { checkPhone, getAuthMe, getHostProfile } from "@/lib/api"
import { CountrySelect } from "@/components/auth/PhoneField"
import { COUNTRIES, DEFAULT_COUNTRY } from "@/lib/countries"
import { getApiErrorMessage } from "@/lib/errors"

const schema = z.object({
	otp: z
		.string()
		.length(6, "Enter the 6-digit OTP")
		.regex(/^\d+$/, "OTP must contain only digits"),
})

type FormValues = z.infer<typeof schema>

function MiniSpinner() {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="animate-spin shrink-0">
			<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
			<path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}

const RESEND_SECONDS = 60

export default function VerifyPage() {
	const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS)
	const [loading, setLoading] = useState(false)
	const { confirmOtp, sendOtp, signOut, hasPendingOtp } = useAuth()
	const { intent, phone, clearSession } = useAuthSessionStore()
	const { setProfile } = useHostStore()
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
		if (!intent) {
			router.replace("/host/login")
			return
		}
		// Pending OTP confirmation lives in memory only — a page refresh between
		// "OTP sent" and "OTP confirmed" loses it, so send the user back to resend.
		if (!hasPendingOtp()) {
			toast.error("Your code expired. Please request a new one.")
			router.replace(intent === "login" ? "/host/login" : "/host/signup")
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

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
		} catch (err) {
			toast.error(getApiErrorMessage(err))
		}
	}

	async function onSubmit({ otp }: FormValues) {
		setLoading(true)

		try {
			await confirmOtp(otp)
		} catch (err) {
			toast.error(getApiErrorMessage(err))
			setValue("otp", "")
			setLoading(false)
			return
		}

		try {
			if (!phone) {
				toast.error("Session expired. Please start again.")
				router.replace(intent === "login" ? "/host/login" : "/host/signup")
				return
			}

			const { exists } = await checkPhone(phone)

			let hasHostAccess = false
			if (exists) {
				const me = await getAuthMe()
				if (me.attendeeProfile !== null) {
					await signOut()
					toast.error("An attendee account exists for this number. You cannot login as a host.")
					router.replace("/host/login")
					return
				}
				hasHostAccess = me.hasHostAccess
			}

			if (intent === "login") {
				if (hasHostAccess) {
					const profile = await getHostProfile()
					setProfile(profile)
					clearSession()
					router.push("/host/dashboard")
				} else {
					// Firebase sign-in succeeded but this identity has no host profile yet — don't
					// leave the user authenticated with no matching profile.
					await signOut()
					toast.error("No host account found for this number yet. Please sign up.")
					router.replace("/host/signup")
				}
			} else {
				if (hasHostAccess) {
					await signOut()
					toast.error("An account already exists for this number. Please log in.")
					router.replace("/host/login")
				} else {
					// One login can hold host, brand, and admin access at once — this identity
					// may already exist (e.g. as BRAND or an admin) but just needs a host profile
					// attached, so let them through to onboarding either way.
					router.push("/host/onboarding")
				}
			}
		} catch (err) {
			toast.error(getApiErrorMessage(err))
		} finally {
			setLoading(false)
		}
	}

	const backHref = intent === "login" ? "/host/login" : "/host/signup"
	const inferredCountry = phone
		? (COUNTRIES.find((c) => phone.startsWith(c.dialCode)) ?? DEFAULT_COUNTRY)
		: DEFAULT_COUNTRY
	const localPhone = phone
		? phone.slice(inferredCountry.dialCode.length).replace(/(\d{5})(\d{5})/, "$1-$2")
		: ""

	return (
		<AuthShell
			size="small"
			phoneImage="/assets/phone_image_otp_verify.svg"
			pointsImage="/assets/points_otp_verify.svg"
		>
			<div id="recaptcha-container-verify" />

			<Link
				href={backHref}
				className="inline-flex items-center gap-1.5 text-xs font-bold text-black/50 hover:text-black transition-colors mb-4"
			>
				<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
				</svg>
				Back
			</Link>

			<div className="mb-6">
				<h1 className="font-heading text-3xl font-black text-black mb-1">
					{intent === "login" ? "Log In" : "Create Account"}
				</h1>
				<p className="text-body-sm text-text-secondary mt-2">
					{intent === "login" 
						? "Welcome back! Enter your phone number to sign in."
						: "First time here? Set up your account and start hosting!"
					}
				</p>
			</div>

			<form className="flex flex-col gap-4 mt-2" onSubmit={handleSubmit(onSubmit)}>
				
				{/* Read-only Phone Number block */}
				<div className="flex items-center justify-between border-[3px] border-black rounded-2xl px-2 py-1.5 bg-white">
					<div className="flex items-center flex-1">
						<CountrySelect value={inferredCountry} onChange={() => {}} disabled />
						<span className="text-black/25 font-light mx-1">|</span>
						<span className="flex-1 px-2 text-base font-semibold text-black">{localPhone}</span>
					</div>
					<Link href={backHref} className="text-sm font-extrabold text-[#7C3AED] hover:underline pr-4">
						Edit
					</Link>
				</div>

				{/* Instruction Text */}
				<p className="text-sm font-semibold text-black/60 leading-relaxed">
					We&apos;ve sent an SMS with an activation code to your phone. Enter the 6-digit code below.
				</p>

				{/* OTP Input Fields */}
				<div>
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

				{/* Code Resend Timer */}
				{!canResend && (
					<p className="text-sm font-bold text-black/50 mt-1">
						Send code again <span className="text-black">{formatTime(secondsLeft)}</span>
					</p>
				)}

				{/* Submit Button */}
				<Button
					type="submit"
					variant="primary"
					size="md"
					radius="pill"
					className="w-full py-4 mt-2 bg-[#EE2C2C] text-white border-[3px] border-black rounded-2xl font-extrabold text-center shadow-[4px_4px_0px_0px_#FFC940] hover:shadow-[1px_1px_0px_0px_#FFC940] hover:translate-x-[3px] hover:translate-y-[3px] transition-all text-base tracking-wider"
					disabled={loading}
					leftIcon={loading ? <MiniSpinner /> : undefined}
				>
					{loading 
						? "Verifying OTP…" 
						: (intent === "login" ? "Log In" : "Create Account")
					}
				</Button>

				{/* Footer text resend code */}
				<p className="text-center text-body-sm text-text-secondary mt-1">
					I didn&apos;t receive a code{" "}
					<button
						type="button"
						onClick={handleResend}
						disabled={!canResend}
						className={
							canResend
								? "font-bold text-[#7C3AED] hover:underline"
								: "font-semibold text-text-muted cursor-not-allowed"
						}
					>
						Resend
					</button>
				</p>
			</form>

			{/* Bottom Section: Indicator Dots */}
			<div className="flex gap-2 justify-center items-center mt-8 mb-2">
				<span className="w-2 h-2 bg-black/15 rounded-full" />
				<span className="w-2 h-2 bg-black/15 rounded-full" />
				<span className="w-5 h-2 bg-[#EE2C2C] rounded-full transition-all" />
				<span className="w-2 h-2 bg-black/15 rounded-full" />
			</div>
		</AuthShell>
	)
}
