"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { AuthShell } from "@/components/auth/AuthShell"
import { AuthTabs } from "@/components/auth/AuthTabs"
import { SocialSignIn } from "@/components/auth/SocialSignIn"
import { Button } from "@/components/ui/Button"
import { Checkbox } from "@/components/ui/Checkbox"
import { PhoneField } from "@/components/auth/PhoneField"
import { useAuth } from "@/context/AuthContext"
import { useAuthSessionStore } from "@/store/authSessionStore"
import { fetchUserDetails, UserNotFoundError } from "@/lib/api"
import { DEFAULT_COUNTRY, type Country } from "@/lib/countries"

const schema = z.object({
	phone: z
		.string()
		.min(10, "Enter a valid 10-digit phone number")
		.max(10, "Enter a valid 10-digit phone number")
		.regex(/^\d+$/, "Phone number must contain only digits"),
	agreed: z.literal(true, { message: "Please agree to the Terms of Service and Privacy Policy" }),
})

type FormValues = z.infer<typeof schema>

export default function SignupPage() {
	const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY)
	const [loading, setLoading] = useState(false)
	const { sendOtp, signInWithGoogle } = useAuth()
	const setSession = useAuthSessionStore((s) => s.setSession)
	const router = useRouter()

	const {
		control,
		handleSubmit,
		trigger,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { phone: "", agreed: undefined },
	})

	async function onSubmit({ phone }: FormValues) {
		setLoading(true)
		try {
			await sendOtp(`${country.dialCode}${phone}`, "recaptcha-container")
			setSession({ intent: "signup", phone: `${country.dialCode}${phone}` })
			toast.success("OTP sent to your phone!")
			router.push("/verify")
		} catch {
			toast.error("Failed to send OTP. Please check the number and try again.")
		} finally {
			setLoading(false)
		}
	}

	async function handleGoogleSignIn() {
		const agreedValid = await trigger("agreed")
		if (!agreedValid) return

		setLoading(true)
		try {
			const { email, displayName } = await signInWithGoogle()
			try {
				await fetchUserDetails()
				toast.error("Account already exists. Please log in.")
			} catch (e) {
				if (e instanceof UserNotFoundError) {
					setSession({ intent: "signup", email: email ?? undefined, displayName: displayName ?? undefined })
					router.push("/onboarding")
				} else {
					throw e
				}
			}
		} catch (e) {
			if (!(e instanceof UserNotFoundError)) {
				toast.error("Google sign-in failed. Please try again.")
			}
		} finally {
			setLoading(false)
		}
	}

	return (
		<AuthShell phoneImage="/assets/phone_image_login.svg" pointsImage="/assets/points_login.svg">
			<div id="recaptcha-container" />
			<AuthTabs />

			<div className="mb-6">
				<h1 className="text-heading-sm text-text-primary mb-1">
					Start hosting on <span className="text-text-brand">meetday</span>
				</h1>
				<p className="text-body-sm text-text-secondary">
					Create events, grow your community, and build a host presence people trust
				</p>
			</div>

			<form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
				<Controller
					control={control}
					name="phone"
					render={({ field }) => (
						<PhoneField
							label="Phone number"
							value={field.value}
							onChange={field.onChange}
							country={country}
							onCountryChange={setCountry}
							disabled={loading}
							error={errors.phone?.message}
						/>
					)}
				/>

				<div className="flex flex-col gap-1">
					<Controller
						control={control}
						name="agreed"
						render={({ field }) => (
							<label className="flex items-start gap-2.5 cursor-pointer">
								<Checkbox
									checked={!!field.value}
									onChange={(checked) => field.onChange(checked || undefined)}
									size="sm"
								/>
								<span className="text-body-sm text-text-secondary leading-snug">
									I agree to the{" "}
									<Link href="/terms" className="font-medium text-text-link hover:underline">
										Terms of service
									</Link>{" "}
									and{" "}
									<Link href="/privacy" className="font-medium text-text-link hover:underline">
										Privacy Policy
									</Link>
								</span>
							</label>
						)}
					/>
					{errors.agreed && (
						<p className="text-caption text-text-danger">{errors.agreed.message}</p>
					)}
				</div>

				<Button
					type="submit"
					variant="primary"
					size="md"
					radius="pill"
					className="w-full mt-1"
					disabled={loading}
				>
					Send OTP
				</Button>

				<div className="flex items-center gap-3 my-1">
					<div className="flex-1 h-px bg-border-default" />
					<span className="text-caption text-text-muted">or</span>
					<div className="flex-1 h-px bg-border-default" />
				</div>

				<SocialSignIn layout="stacked" onGoogleSignIn={handleGoogleSignIn} disabled={loading} />

				<p className="text-center text-body-sm text-text-secondary mt-1">
					Already have an account?{" "}
					<Link href="/login" className="font-medium text-text-link hover:underline">
						Log in
					</Link>
				</p>
			</form>
		</AuthShell>
	)
}
