"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { AuthShell } from "@/components/auth/AuthShell"
import { Button } from "@/components/ui/Button"
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
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
	const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY)
	const [loading, setLoading] = useState(false)
	const { sendOtp } = useAuth()
	const { loading: googleLoading, handleGoogleSignIn } = useGoogleSignIn("login", "brand")
	const setSession = useAuthSessionStore((s) => s.setSession)
	const router = useRouter()

	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { phone: "" },
	})

	async function onSubmit({ phone }: FormValues) {
		setLoading(true)
		try {
			await sendOtp(`${country.dialCode}${phone}`, "recaptcha-container")
			setSession({ intent: "login", phone: `${country.dialCode}${phone}` })
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
					Log In
				</h1>
				<p className="text-body-sm text-text-secondary mt-2">
					Welcome back! Sign in with Google to continue.
				</p>
			</div>

			{/* Phone OTP sign-in paused until Fast2SMS DLT registration is approved — Google
			    Sign-In is the sole login method in the meantime. Uncomment to re-enable.
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

				<Button
					type="submit"
					variant="primary"
					size="md"
					radius="pill"
					className="w-full py-4 mt-2 bg-[#EE2C2C] text-white border-[3px] border-black rounded-2xl font-extrabold text-center shadow-[4px_4px_0px_0px_#FFC940] hover:shadow-[1px_1px_0px_0px_#FFC940] hover:translate-x-[3px] hover:translate-y-[3px] transition-all text-base tracking-wider"
					disabled={loading}
				>
					{loading ? "Generating OTP…" : "Send OTP"}
				</Button>

				<p className="text-center text-body-sm text-text-secondary mt-1">
					New to Meetday?{" "}
					<Link href="/brand/signup" className="font-semibold text-text-link hover:underline">
						Create an account
					</Link>
				</p>
			</form>

			<div className="flex items-center gap-3 mt-5">
				<div className="h-px flex-1 bg-border-default" />
				<span className="text-caption text-text-muted">or</span>
				<div className="h-px flex-1 bg-border-default" />
			</div>
			*/}
			<div className="mt-5">
				<GoogleSignInButton onClick={handleGoogleSignIn} loading={googleLoading} />
			</div>

			<p className="text-center text-body-sm text-text-secondary mt-4">
				New to Meetday?{" "}
				<Link href="/brand/signup" className="font-semibold text-text-link hover:underline">
					Create an account
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
