"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { BrandAuthShell } from "@/components/brand/BrandAuthShell"
import { OtpInput } from "@/components/auth/OtpInput"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import LockKeyholeSvg from "@/icons/outlined/lock-keyhole.svg"
import ArrowLeftSvg from "@/icons/outlined/arrow-left.svg"
import { useAuth } from "@/context/AuthContext"
import { useAuthSessionStore } from "@/store/authSessionStore"
import { useHostStore } from "@/store/hostStore"
import { checkPhone, getAuthMe, getBrandProfile } from "@/lib/api"
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
			router.replace("/brand/login")
			return
		}
		// Pending OTP confirmation lives in memory only — a page refresh between
		// "OTP sent" and "OTP confirmed" loses it, so send the user back to resend.
		if (!hasPendingOtp()) {
			toast.error("Your code expired. Please request a new one.")
			router.replace(intent === "login" ? "/brand/login" : "/brand/signup")
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
				router.replace(intent === "login" ? "/brand/login" : "/brand/signup")
				return
			}

			const { exists } = await checkPhone(phone)

			if (exists) {
				const me = await getAuthMe()
				if (me.attendeeProfile !== null) {
					await signOut()
					toast.error("An attendee account exists for this number. You cannot login as a brand.")
					router.replace("/brand/login")
					return
				}
			}

			if (intent === "login") {
				if (exists) {
					const profile = await getBrandProfile()
					setProfile(profile)
					clearSession()
					router.push("/brand/dashboard")
				} else {
					// Firebase sign-in succeeded but no host record exists — don't leave the
					// user authenticated with no matching profile.
					await signOut()
					toast.error("No account found for this number. Please sign up.")
					router.replace("/brand/signup")
				}
			} else {
				if (exists) {
					await signOut()
					toast.error("An account already exists for this number. Please log in.")
					router.replace("/brand/login")
				} else {
					router.push("/brand/onboarding")
				}
			}
		} catch (err) {
			toast.error(getApiErrorMessage(err))
		} finally {
			setLoading(false)
		}
	}

	const backHref = intent === "login" ? "/brand/login" : "/brand/signup"
	const inferredCountry = phone
		? (COUNTRIES.find((c) => phone.startsWith(c.dialCode)) ?? DEFAULT_COUNTRY)
		: DEFAULT_COUNTRY
	const localPhone = phone
		? phone.slice(inferredCountry.dialCode.length).replace(/(\d{5})(\d{5})/, "$1-$2")
		: ""

	return (
		<BrandAuthShell variant="verify">
			<div id="recaptcha-container-verify" />

			<Link
				href={backHref}
				className="inline-flex items-center gap-1.5 text-body-sm text-text-secondary hover:text-text-primary transition-colors mb-8"
			>
				<Icon as={ArrowLeftSvg} size="sm" />
				{intent === "login" ? "Back to Log in" : "Back to Sign up"}
			</Link>

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
		</BrandAuthShell>
	)
}
