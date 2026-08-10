"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { BrandAuthShell } from "@/components/brand/BrandAuthShell"
import { BrandAuthTabs } from "@/components/brand/BrandAuthTabs"
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
		<BrandAuthShell variant="login">
			<div id="recaptcha-container" />
			<BrandAuthTabs />

			<div className="mb-6">
				<h1 className="text-heading-sm text-text-primary mb-1">
					Start as brand on <span className="text-text-brand">meetday</span>
				</h1>
				<p className="text-body-sm text-text-secondary">
					Create experiences, grow your community, and build a brand presence people trust
				</p>
			</div>

			{/* Phone OTP sign-in paused until Fast2SMS DLT registration is approved — Google
			    Sign-In is the sole login method in the meantime. Uncomment to re-enable.
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

				<p className="text-center text-body-sm text-text-secondary mt-1">
					New to meetday?{" "}
					<Link href="/brand/signup" className="font-medium text-text-link hover:underline">
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
				New to meetday?{" "}
				<Link href="/brand/signup" className="font-medium text-text-link hover:underline">
					Create an account
				</Link>
			</p>
		</BrandAuthShell>
	)
}
