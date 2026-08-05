"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { AuthShell } from "@/components/auth/AuthShell"
import { AuthTabs } from "@/components/auth/AuthTabs"
import { Button } from "@/components/ui/Button"
import { Checkbox } from "@/components/ui/Checkbox"
import { PhoneField } from "@/components/auth/PhoneField"
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

function MiniSpinner() {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="animate-spin shrink-0">
			<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
			<path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}

export default function SignupPage() {
	const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY)
	const [loading, setLoading] = useState(false)
	const { sendOtp } = useAuth()
	const setSession = useAuthSessionStore((s) => s.setSession)
	const router = useRouter()

	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { phone: "", agreed: true },
	})

	async function onSubmit({ phone }: FormValues) {
		setLoading(true)
		try {
			await sendOtp(`${country.dialCode}${phone}`, "recaptcha-container")
			setSession({ intent: "signup", phone: `${country.dialCode}${phone}` })
			toast.success("OTP sent to your phone!")
			router.push("/host/verify")
		} catch (err) {
			toast.error(getApiErrorMessage(err))
		} finally {
			setLoading(false)
		}
	}

	return (
		<AuthShell phoneImage="/assets/phone_image_login.svg" pointsImage="/assets/points_login.svg">
			<div id="recaptcha-container" />
			<Link 
				href="/host" 
				className="inline-flex items-center gap-1.5 text-xs font-bold text-black/50 hover:text-black transition-colors mb-4"
			>
				<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
				</svg>
				Back to welcome
			</Link>

			<div className="mb-6">
				<h1 className="font-heading text-3xl font-black text-black mb-1">
					Create Account
				</h1>
				<p className="text-body-sm text-text-secondary mt-2">
					First time here? Set up your account and start hosting!
				</p>
			</div>

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
					leftIcon={loading ? <MiniSpinner /> : undefined}
				>
					{loading ? "Generating OTP…" : "Send OTP"}
				</Button>

				<p className="text-center text-body-sm text-text-secondary mt-1">
					Already have an account?{" "}
					<Link href="/host/login" className="font-semibold text-text-link hover:underline">
						Log in
					</Link>
				</p>
			</form>

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
