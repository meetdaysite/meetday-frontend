"use client"

import { ATTENDEE_ABOUT_KEY, ATTENDEE_VIBES_KEY } from "@/app/attendee/onboarding/page"
import { AttendeeAuthShell } from "@/components/attendee/auth/AttendeeAuthShell"
import { OtpInput } from "@/components/auth/OtpInput"
import { CountrySelect } from "@/components/auth/PhoneField"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import { useAuth } from "@/context/AuthContext"
import ArrowLeftSvg from "@/icons/outlined/arrow-left.svg"
import LockKeyholeSvg from "@/icons/outlined/lock-keyhole.svg"
import { checkPhone, registerAttendee, type AttendeeSocialStyle, type AttendeeVibeType } from "@/lib/api"
import { COUNTRIES, DEFAULT_COUNTRY } from "@/lib/countries"
import { getApiErrorMessage } from "@/lib/errors"
import { useAttendeeProfileStore } from "@/store/attendeeProfileStore"
import { useAttendeeSessionStore } from "@/store/attendeeSessionStore"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import ShieldCheckSvg from "@/icons/outlined/shield-check.svg"
import LockSvg from "@/icons/outlined/lock.svg"

const schema = z.object({
	otp: z.string().length(6, "Enter the 6-digit OTP").regex(/^\d+$/, "OTP must contain only digits"),
})

type FormValues = z.infer<typeof schema>

const RESEND_SECONDS = 60

function TrustBadge({ icon, label, sublabel }: { icon: React.ReactNode; label: string; sublabel: string }) {
	return (
		<div className="flex items-center gap-3 flex-1 bg-surface-brand-soft rounded-lg px-3 py-3 border border-border-brand">
			<span className="text-text-brand">{icon}</span>
			<div>
				<p className="text-label-sm text-text-primary font-semibold leading-tight">{label}</p>
				<p className="text-[10px] text-text-secondary">{sublabel}</p>
			</div>
		</div>
	)
}

export default function AttendeeVerifyPage() {
	const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS)
	const [loading, setLoading] = useState(false)
	const { confirmOtp, sendOtp } = useAuth()
	const { intent, phone, firstName, lastName, email, clearSession } = useAttendeeSessionStore()
	const setShowWelcomeModal = useAttendeeProfileStore(s => s.setShowWelcomeModal)
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
		if (!intent) router.replace("/attendee/login")
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	useEffect(() => {
		if (secondsLeft === 0) return
		const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000)
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
				router.replace(intent === "login" ? "/attendee/login" : "/attendee/signup")
				return
			}

			const { exists } = await checkPhone(phone)

			if (intent === "login") {
				if (exists) {
					clearSession()
					router.push("/explore")
				} else {
					toast.error("No account found for this number. Please sign up.")
					router.replace("/attendee/signup")
				}
				return
			}

			// Signup path: check for pre-existing vibes in localStorage
			let affinities: { interestId: string; affinity: "LIKED" | "OPEN_TO" | "DISLIKED" }[] = []
			let vibeType: AttendeeVibeType | undefined
			let socialStyle: AttendeeSocialStyle | undefined

			try {
				const vibesRaw = localStorage.getItem(ATTENDEE_VIBES_KEY)
				if (vibesRaw) affinities = JSON.parse(vibesRaw)

				const aboutRaw = localStorage.getItem(ATTENDEE_ABOUT_KEY)
				if (aboutRaw) {
					const about = JSON.parse(aboutRaw)
					vibeType = about.vibeStyle ?? undefined
					socialStyle = about.socialStyle ?? undefined
				}
			} catch {
				// localStorage unavailable or corrupt — treat as absent
			}

			if (affinities.length > 0) {
				// Vibes present: register immediately
				await registerAttendee({
					firstName: firstName ?? "",
					lastName: lastName ?? "",
					email: email ?? "",
					phone,
					vibeType,
					socialStyle,
					interests: affinities,
				})
				clearSession()
				setShowWelcomeModal(true)
				router.push("/explore")
			} else {
				// No vibes: go to mandatory onboarding first; registration happens there
				router.push("/attendee/onboarding?required=true")
			}
		} catch (err) {
			toast.error(getApiErrorMessage(err))
		} finally {
			setLoading(false)
		}
	}

	const backHref = intent === "login" ? "/attendee/login" : "/attendee/signup"
	const inferredCountry = phone
		? (COUNTRIES.find(c => phone.startsWith(c.dialCode)) ?? DEFAULT_COUNTRY)
		: DEFAULT_COUNTRY
	const localPhone = phone
		? phone.slice(inferredCountry.dialCode.length).replace(/(\d{5})(\d{5})/, "$1-$2")
		: ""

	return (
		<AttendeeAuthShell variant="verify">
			<div id="recaptcha-container-verify" />

			<Link
				href={backHref}
				className="inline-flex items-center gap-1.5 text-body-sm text-text-secondary hover:text-text-primary transition-colors mb-8"
			>
				<Icon as={ArrowLeftSvg} size="sm" />
				{intent === "login" ? "Back to Log in" : "Back to Sign up"}
			</Link>

			{/* <div className="size-14 mb-5">
				<ShieldCheckIcon />
			</div> */}

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
				{/* Phone display row */}
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

				{/* OTP input */}
				<div>
					<p className="text-label-md text-text-primary mb-3">Enter 6-digit OTP</p>
					<Controller
						control={control}
						name="otp"
						render={({ field }) => (
							<OtpInput value={field.value} onChange={field.onChange} length={6} />
						)}
					/>
					{errors.otp && <p className="text-caption text-text-danger mt-2">{errors.otp.message}</p>}
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
					variant="secondary"
					size="md"
					radius="pill"
					className="w-full bg-neutral-900 text-white hover:bg-neutral-800 border-neutral-900 hover:border-neutral-800"
					leftIcon={<Icon as={LockKeyholeSvg} />}
					disabled={loading}
				>
					{loading ? "Verifying…" : "Verify OTP"}
				</Button>

				{/* Trust badges */}
				<div className="flex items-start gap-2 pt-4 border-t border-border-default">
					<TrustBadge
						icon={<Icon as={ShieldCheckSvg} size="lg" />}
						label="Safe & Verified"
						sublabel="Real people only"
					/>
					<TrustBadge
						icon={<Icon as={LockSvg} size="lg" />}
						label="Secure Checkout"
						sublabel="Payments are 100% secure"
					/>
					{/* <TrustBadge
						icon={<Icon as={ClockSvg} size="lg" />}
						label="Limited spots held"
						sublabel="Spot held for 10 mins"
					/> */}
				</div>

				<p className="text-caption text-text-muted text-center leading-relaxed">
					Your information is secure and encrypted. We never share your details with anyone.
				</p>
			</form>
		</AttendeeAuthShell>
	)
}
