"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { AttendeeAuthShell } from "@/components/attendee/auth/AttendeeAuthShell"
import { AttendeeAuthTabs } from "@/components/attendee/auth/AttendeeAuthTabs"
import { Button } from "@/components/ui/Button"
import { TextField } from "@/components/ui/TextField"
import { Checkbox } from "@/components/ui/Checkbox"
import { PhoneField } from "@/components/auth/PhoneField"
import { useAuth } from "@/context/AuthContext"
import { useAttendeeSessionStore } from "@/store/attendeeSessionStore"
import { checkPhone } from "@/lib/api"
import { DEFAULT_COUNTRY, type Country } from "@/lib/countries"

const schema = z.object({
	firstName: z.string().min(1, "First name is required").max(50),
	lastName: z.string().min(1, "Last name is required").max(50),
	email: z.string().min(1, "Email is required").email("Enter a valid email address"),
	phone: z
		.string()
		.min(10, "Enter a valid 10-digit phone number")
		.max(10, "Enter a valid 10-digit phone number")
		.regex(/^\d+$/, "Phone number must contain only digits"),
	agreed: z.literal(true, { message: "Please agree to the Terms of Service and Privacy Policy" }),
})

type FormValues = z.infer<typeof schema>

export default function AttendeeSignupPage() {
	const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY)
	const [loading, setLoading] = useState(false)
	const [phoneExistsError, setPhoneExistsError] = useState<string | null>(null)
	const { sendOtp } = useAuth()
	const setSession = useAttendeeSessionStore((s) => s.setSession)
	const router = useRouter()

	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { firstName: "", lastName: "", email: "", phone: "", agreed: undefined },
	})

	const agreed = useWatch({ control, name: "agreed" })

	async function onSubmit({ phone, firstName, lastName, email }: FormValues) {
		setPhoneExistsError(null)
		setLoading(true)

		try {
			const fullPhone = `${country.dialCode}${phone}`
			const { exists } = await checkPhone(fullPhone)

			if (exists) {
				setPhoneExistsError("This number already has an account — log in instead.")
				setLoading(false)
				return
			}

			await sendOtp(fullPhone, "recaptcha-container")
			setSession({ intent: "signup", phone: fullPhone, firstName, lastName, email })
			toast.success("OTP sent to your phone!")
			router.push("/attendee/verify")
		} catch {
			toast.error("Failed to send OTP. Please check the number and try again.")
		} finally {
			setLoading(false)
		}
	}

	return (
		<AttendeeAuthShell variant="signup">
			<div id="recaptcha-container" />
			<AttendeeAuthTabs />

			<div className="mb-6">
				<h1 className="text-heading-sm text-text-primary mb-1">
					Create your account and{" "}<br/>
					<span className="text-text-brand">find your people.</span>
				</h1>
				<p className="text-body-sm text-text-secondary mt-2">
					Sign up with your phone number to get started.
				</p>
			</div>

			<form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
				{/* First + Last name row */}
				<div className="flex gap-3">
					<Controller
						control={control}
						name="firstName"
						render={({ field }) => (
							<TextField
								label="First name"
								placeholder="Rahul"
								size="md"
								className="flex-1"
								disabled={loading}
								error={!!errors.firstName}
								helperText={errors.firstName?.message}
								{...field}
							/>
						)}
					/>
					<Controller
						control={control}
						name="lastName"
						render={({ field }) => (
							<TextField
								label="Last name"
								placeholder="Sharma"
								size="md"
								className="flex-1"
								disabled={loading}
								error={!!errors.lastName}
								helperText={errors.lastName?.message}
								{...field}
							/>
						)}
					/>
				</div>

				<Controller
					control={control}
					name="email"
					render={({ field }) => (
						<TextField
							label="Email address"
							placeholder="rahul@example.com"
							type="email"
							size="md"
							disabled={loading}
							error={!!errors.email}
							helperText={errors.email?.message}
							{...field}
						/>
					)}
				/>

				<Controller
					control={control}
					name="phone"
					render={({ field }) => (
						<PhoneField
							label="Phone number"
							value={field.value}
							onChange={(val) => {
								field.onChange(val)
								if (phoneExistsError) setPhoneExistsError(null)
							}}
							country={country}
							onCountryChange={setCountry}
							disabled={loading}
							error={phoneExistsError ?? errors.phone?.message}
						/>
					)}
				/>

				{/* T&C */}
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
					disabled={loading || !agreed}
				>
					{loading ? "Checking…" : "Send OTP"}
				</Button>

				<p className="text-center text-body-sm text-text-secondary mt-1">
					Already have an account?{" "}
					<Link href="/attendee/login" className="font-medium text-text-link hover:underline">
						Log in
					</Link>
				</p>
			</form>
		</AttendeeAuthShell>
	)
}
