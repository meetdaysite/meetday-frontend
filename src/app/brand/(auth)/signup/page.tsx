"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { AuthShell } from "@/components/auth/AuthShell"
import { Button } from "@/components/ui/Button"
import { Checkbox } from "@/components/ui/Checkbox"
import { PhoneField } from "@/components/auth/PhoneField"
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton"
import { useGoogleSignIn } from "@/hooks/useGoogleSignIn"
import { useAuth } from "@/context/AuthContext"
import { useAuthSessionStore } from "@/store/authSessionStore"
import { DEFAULT_COUNTRY, type Country } from "@/lib/countries"
import { getApiErrorMessage } from "@/lib/errors"

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
	const { sendOtp } = useAuth()
	const { loading: googleLoading, handleGoogleSignIn } = useGoogleSignIn("signup", "brand")
	const setSession = useAuthSessionStore((s) => s.setSession)
	const router = useRouter()

	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { phone: "", agreed: undefined },
	})

	const agreed = useWatch({ control, name: "agreed" })

	async function onSubmit({ phone }: FormValues) {
		setLoading(true)
		try {
			await sendOtp(`${country.dialCode}${phone}`, "recaptcha-container")
			setSession({ intent: "signup", phone: `${country.dialCode}${phone}` })
			toast.success("OTP sent to your phone!")
			router.push("/brand/verify")
		} catch (err) {
			toast.error(getApiErrorMessage(err))
		} finally {
			setLoading(false)
		}
	}

	return (
		<AuthShell size="small" phoneImage="/assets/phone_image_login.svg" pointsImage="/assets/points_login.svg">
			<div id="recaptcha-container" />

			<div className="mb-6">
				<h1 className="font-heading text-3xl font-black text-black mb-1">
					Create Account
				</h1>
				<p className="text-body-sm text-text-secondary mt-2">
					First time here? Sign up with Google to start onboarding!
				</p>
			</div>

			{/* Phone OTP signup paused until Fast2SMS DLT registration is approved — Google
			    Sign-In is the sole signup method in the meantime. Uncomment to re-enable.
			<form className="flex flex-col gap-5 mt-2" onSubmit={handleSubmit(onSubmit)}>
				<Controller
					control={control}
					name="phone"
					render={({ field }) => (
						<PhoneField
							label="Enter your Mobile Number"
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
									<a
										href="https://www.meetday.ai/terms"
										target="_blank"
										rel="noopener noreferrer"
										className="font-medium text-text-link hover:underline"
									>
										Terms of service
									</a>{" "}
									and{" "}
									<a
										href="https://www.meetday.ai/privacy"
										target="_blank"
										rel="noopener noreferrer"
										className="font-medium text-text-link hover:underline"
									>
										Privacy Policy
									</a>
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
					className="w-full py-4 mt-2 bg-[#EE2C2C] text-white border-[3px] border-black rounded-2xl font-extrabold text-center shadow-[4px_4px_0px_0px_#FFC940] hover:shadow-[1px_1px_0px_0px_#FFC940] hover:translate-x-[3px] hover:translate-y-[3px] transition-all text-base tracking-wider"
					disabled={loading || !agreed}
				>
					Send OTP
				</Button>

				<p className="text-center text-body-sm text-text-secondary mt-1">
					Already have an account?{" "}
					<Link href="/brand/login" className="font-semibold text-text-link hover:underline">
						Log in
					</Link>
				</p>
			</form>

			<div className="flex items-center gap-3 mt-5">
				<div className="h-px flex-1 bg-border-default" />
				<span className="text-caption text-text-muted">or</span>
				<div className="h-px flex-1 bg-border-default" />
			</div>
			*/}
			<div className="flex flex-col gap-1 mb-4">
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
								<a
									href="https://www.meetday.ai/terms"
									target="_blank"
									rel="noopener noreferrer"
									className="font-semibold text-text-link hover:underline"
								>
									Terms of service
								</a>{" "}
								and{" "}
								<a
									href="https://www.meetday.ai/privacy"
									target="_blank"
									rel="noopener noreferrer"
									className="font-semibold text-text-link hover:underline"
								>
									Privacy Policy
								</a>
							</span>
						</label>
					)}
				/>
			</div>
			<div>
				<GoogleSignInButton
					onClick={handleGoogleSignIn}
					loading={googleLoading}
					disabled={!agreed}
					label={!agreed ? "Agree to terms to continue" : "Continue with Google"}
				/>
			</div>

			<p className="text-center text-body-sm text-text-secondary mt-4">
				Already have an account?{" "}
				<Link href="/brand/login" className="font-semibold text-text-link hover:underline">
					Log in
				</Link>
			</p>

			{/* Bottom Section: Indicator Dots */}
			<div className="flex gap-2 justify-center items-center mt-8 mb-2">
				<span className="w-2 h-2 bg-black/15 rounded-full" />
				<span className="w-5 h-2 bg-[#EE2C2C] rounded-full transition-all" />
				<span className="w-2 h-2 bg-black/15 rounded-full" />
				<span className="w-2 h-2 bg-black/15 rounded-full" />
			</div>
		</AuthShell>
	)
}
