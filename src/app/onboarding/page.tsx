"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFormContext, FormProvider, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import clsx from "clsx"
import { useAuth } from "@/context/AuthContext"
import { useAuthSessionStore } from "@/store/authSessionStore"
import { registerHost } from "@/lib/api"
import type { HostRegistrationData } from "@/lib/api"
import { Button } from "@/components/ui/Button"
import { TextField } from "@/components/ui/TextField"
import { PhoneField } from "@/components/auth/PhoneField"
import { DEFAULT_COUNTRY, type Country } from "@/lib/countries"

// ─── Schema ───────────────────────────────────────────────────────────────────

const onboardingSchema = z.object({
	firstName: z.string().min(1, "Required"),
	lastName: z.string().min(1, "Required"),
	phone: z
		.string()
		.min(10, "Enter a valid 10-digit phone number")
		.max(10, "Enter a valid 10-digit phone number")
		.regex(/^\d+$/, "Phone number must contain only digits"),
	email: z.string().email("Enter a valid email"),
	accountType: z.string().min(1, "Select an account type"),
	hostType: z.string().min(1, "Select a host type"),
	displayName: z.string().min(1, "Required"),
	legalName: z.string().min(1, "Required"),
	bio: z.string().min(1, "Required"),
	tagline: z.string().min(1, "Required"),
	pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Enter a valid PAN (e.g. ABCDE1234F)"),
	categories: z.array(z.string()).min(1, "Select at least one category"),
	languages: z.array(z.string()).min(1, "Select at least one language"),
	yearsOfExperience: z.coerce.number().min(0, "Cannot be negative"),
	totalEventsHosted: z.coerce.number().min(0, "Cannot be negative"),
	operatingCities: z.array(z.string()).min(1, "Select at least one city"),
	instagram: z.string().optional(),
	addressLine1: z.string().min(1, "Required"),
	addressLine2: z.string().optional(),
	city: z.string().min(1, "Required"),
	state: z.string().min(1, "Required"),
	pincode: z
		.string()
		.length(6, "Enter a valid 6-digit pincode")
		.regex(/^\d+$/, "Pincode must contain only digits"),
})

type OnboardingValues = z.infer<typeof onboardingSchema>

const STEP_FIELDS: (keyof OnboardingValues)[][] = [
	["firstName", "lastName", "phone", "email"],
	["accountType", "hostType"],
	["displayName", "legalName", "bio", "tagline", "pan"],
	["categories", "languages"],
	["yearsOfExperience", "totalEventsHosted"],
	["operatingCities"],
	["instagram"],
	["addressLine1", "city", "state", "pincode"],
]

const STEPS = [
	"Personal details",
	"Account details",
	"Host profile",
	"Categories & languages",
	"Experience",
	"Operating cities",
	"Social links",
	"Address",
] as const

// ─── Step components ──────────────────────────────────────────────────────────

function StepPersonal({ country, onCountryChange }: { country: Country; onCountryChange: (c: Country) => void }) {
	const { register, control, formState: { errors } } = useFormContext<OnboardingValues>()
	return (
		<div className="flex flex-col gap-4">
			<div className="flex gap-3">
				<TextField
					label="First name"
					placeholder="Jane"
					{...register("firstName")}
					error={!!errors.firstName}
					helperText={errors.firstName?.message}
					size="md"
					className="flex-1"
				/>
				<TextField
					label="Last name"
					placeholder="Doe"
					{...register("lastName")}
					error={!!errors.lastName}
					helperText={errors.lastName?.message}
					size="md"
					className="flex-1"
				/>
			</div>
			<Controller
				control={control}
				name="phone"
				render={({ field }) => (
					<PhoneField
						label="Phone number"
						value={field.value}
						onChange={field.onChange}
						country={country}
						onCountryChange={onCountryChange}
						error={errors.phone?.message}
					/>
				)}
			/>
			<TextField
				label="Email"
				placeholder="jane@example.com"
				type="email"
				{...register("email")}
				error={!!errors.email}
				helperText={errors.email?.message}
				size="md"
			/>
		</div>
	)
}

function StepAccount() {
	const { control, formState: { errors } } = useFormContext<OnboardingValues>()
	const accountTypes = ["Individual", "Business", "Organization"]
	const hostTypes = ["Event Host", "Venue Host", "Experience Host"]

	return (
		<div className="flex flex-col gap-5">
			<div>
				<p className="text-label-md text-text-primary mb-2">Account type</p>
				<Controller
					control={control}
					name="accountType"
					render={({ field }) => (
						<div className="flex flex-wrap gap-2">
							{accountTypes.map((t) => (
								<button
									key={t}
									type="button"
									onClick={() => field.onChange(t)}
									className={clsx(
										"px-4 py-2 rounded-full text-body-sm border transition-colors duration-(--duration-120)",
										field.value === t
											? "bg-action-primary text-white border-action-primary"
											: "border-border-default text-text-secondary hover:border-border-strong",
									)}
								>
									{t}
								</button>
							))}
						</div>
					)}
				/>
				{errors.accountType && (
					<p className="text-caption text-text-danger mt-1">{errors.accountType.message}</p>
				)}
			</div>

			<div>
				<p className="text-label-md text-text-primary mb-2">Host type</p>
				<Controller
					control={control}
					name="hostType"
					render={({ field }) => (
						<div className="flex flex-wrap gap-2">
							{hostTypes.map((t) => (
								<button
									key={t}
									type="button"
									onClick={() => field.onChange(t)}
									className={clsx(
										"px-4 py-2 rounded-full text-body-sm border transition-colors duration-(--duration-120)",
										field.value === t
											? "bg-action-primary text-white border-action-primary"
											: "border-border-default text-text-secondary hover:border-border-strong",
									)}
								>
									{t}
								</button>
							))}
						</div>
					)}
				/>
				{errors.hostType && (
					<p className="text-caption text-text-danger mt-1">{errors.hostType.message}</p>
				)}
			</div>
		</div>
	)
}

function StepHostProfile() {
	const { register, formState: { errors } } = useFormContext<OnboardingValues>()
	return (
		<div className="flex flex-col gap-4">
			<TextField
				label="Display name"
				placeholder="The name guests will see"
				{...register("displayName")}
				error={!!errors.displayName}
				helperText={errors.displayName?.message}
				size="md"
			/>
			<TextField
				label="Legal name"
				placeholder="Your legal or business name"
				{...register("legalName")}
				error={!!errors.legalName}
				helperText={errors.legalName?.message}
				size="md"
			/>
			<div className="flex flex-col gap-1.5">
				<label className="text-label-md text-text-primary">Host bio</label>
				<textarea
					placeholder="Tell guests about yourself and what makes your events special"
					{...register("bio")}
					rows={4}
					className={clsx(
						"w-full rounded-input border bg-surface-canvas px-4 py-3",
						"text-sm text-text-primary placeholder:text-text-muted outline-none resize-none",
						"hover:border-border-strong focus:border-border-focused transition-colors duration-(--duration-120)",
						errors.bio ? "border-border-brand" : "border-border-default",
					)}
				/>
				{errors.bio && <p className="text-caption text-text-danger">{errors.bio.message}</p>}
			</div>
			<TextField
				label="Tagline"
				placeholder="A short catchy line about your hosting style"
				{...register("tagline")}
				error={!!errors.tagline}
				helperText={errors.tagline?.message}
				size="md"
			/>
			<TextField
				label="PAN"
				placeholder="ABCDE1234F"
				{...register("pan", { setValueAs: (v: string) => v.toUpperCase() })}
				error={!!errors.pan}
				helperText={errors.pan?.message}
				size="md"
				hint="Required for payouts"
			/>
		</div>
	)
}

function ChipSelect({
	label,
	name,
	options,
}: {
	label: string
	name: "categories" | "languages" | "operatingCities"
	options: string[]
}) {
	const { control, formState: { errors } } = useFormContext<OnboardingValues>()
	return (
		<div>
			<p className="text-label-md text-text-primary mb-2">{label}</p>
			<Controller
				control={control}
				name={name}
				render={({ field }) => (
					<div className="flex flex-wrap gap-2">
						{options.map((opt) => {
							const selected = (field.value as string[]).includes(opt)
							return (
								<button
									key={opt}
									type="button"
									onClick={() =>
										field.onChange(
											selected
												? (field.value as string[]).filter((v) => v !== opt)
												: [...(field.value as string[]), opt],
										)
									}
									className={clsx(
										"px-4 py-2 rounded-full text-body-sm border transition-colors duration-(--duration-120)",
										selected
											? "bg-action-primary text-white border-action-primary"
											: "border-border-default text-text-secondary hover:border-border-strong",
									)}
								>
									{opt}
								</button>
							)
						})}
					</div>
				)}
			/>
			{errors[name] && (
				<p className="text-caption text-text-danger mt-1">
					{errors[name]?.message as string}
				</p>
			)}
		</div>
	)
}

const CATEGORY_OPTIONS = ["Music", "Art", "Food & Drink", "Sports", "Tech", "Wellness", "Networking", "Comedy", "Film", "Education"]
const LANGUAGE_OPTIONS = ["English", "Hindi", "Bengali", "Marathi", "Tamil", "Telugu", "Kannada", "Malayalam", "Gujarati", "Punjabi"]

function StepCategoriesLanguages() {
	return (
		<div className="flex flex-col gap-5">
			<ChipSelect label="Categories" name="categories" options={CATEGORY_OPTIONS} />
			<ChipSelect label="Languages" name="languages" options={LANGUAGE_OPTIONS} />
		</div>
	)
}

function StepExperience() {
	const { register, formState: { errors } } = useFormContext<OnboardingValues>()
	return (
		<div className="flex flex-col gap-4">
			<TextField
				label="Years of experience"
				placeholder="e.g. 3"
				type="number"
				{...register("yearsOfExperience")}
				error={!!errors.yearsOfExperience}
				helperText={errors.yearsOfExperience?.message}
				size="md"
			/>
			<TextField
				label="Total events hosted previously"
				placeholder="e.g. 20"
				type="number"
				{...register("totalEventsHosted")}
				error={!!errors.totalEventsHosted}
				helperText={errors.totalEventsHosted?.message}
				size="md"
			/>
		</div>
	)
}

const CITY_OPTIONS = ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Surat"]

function StepOperatingCities() {
	return <ChipSelect label="Cities where you host events" name="operatingCities" options={CITY_OPTIONS} />
}

function StepSocialLinks() {
	const { register, formState: { errors } } = useFormContext<OnboardingValues>()
	return (
		<TextField
			label="Instagram"
			placeholder="@yourhandle"
			{...register("instagram")}
			error={!!errors.instagram}
			helperText={errors.instagram?.message}
			size="md"
			hint="Optional"
		/>
	)
}

function StepAddress() {
	const { register, formState: { errors } } = useFormContext<OnboardingValues>()
	return (
		<div className="flex flex-col gap-4">
			<TextField
				label="Address line 1"
				placeholder="Building, street"
				{...register("addressLine1")}
				error={!!errors.addressLine1}
				helperText={errors.addressLine1?.message}
				size="md"
			/>
			<TextField
				label="Address line 2"
				placeholder="Area, landmark (optional)"
				{...register("addressLine2")}
				size="md"
			/>
			<div className="flex gap-3">
				<TextField
					label="City"
					placeholder="Mumbai"
					{...register("city")}
					error={!!errors.city}
					helperText={errors.city?.message}
					size="md"
					className="flex-1"
				/>
				<TextField
					label="State"
					placeholder="Maharashtra"
					{...register("state")}
					error={!!errors.state}
					helperText={errors.state?.message}
					size="md"
					className="flex-1"
				/>
			</div>
			<TextField
				label="Pincode"
				placeholder="400001"
				{...register("pincode", { setValueAs: (v: string) => v.replace(/\D/g, "").slice(0, 6) })}
				error={!!errors.pincode}
				helperText={errors.pincode?.message}
				size="md"
			/>
		</div>
	)
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
	const [step, setStep] = useState(0)
	const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY)
	const [submitting, setSubmitting] = useState(false)
	const { user } = useAuth()
	const { phone, email, clearSession } = useAuthSessionStore()
	const router = useRouter()

	const methods = useForm<OnboardingValues>({
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		resolver: zodResolver(onboardingSchema) as any,
		defaultValues: {
			firstName: "",
			lastName: "",
			phone: "",
			email: "",
			accountType: "",
			hostType: "",
			displayName: "",
			legalName: "",
			bio: "",
			tagline: "",
			pan: "",
			categories: [],
			languages: [],
			yearsOfExperience: 0,
			totalEventsHosted: 0,
			operatingCities: [],
			instagram: "",
			addressLine1: "",
			addressLine2: "",
			city: "",
			state: "",
			pincode: "",
		},
	})

	const { handleSubmit, trigger, setValue } = methods

	useEffect(() => {
		if (phone) setValue("phone", phone.replace(/^\+91/, ""))
		if (email) setValue("email", email)
	}, [phone, email, setValue])

	const isLastStep = step === STEPS.length - 1

	const stepComponents = [
		<StepPersonal key={0} country={country} onCountryChange={setCountry} />,
		<StepAccount key={1} />,
		<StepHostProfile key={2} />,
		<StepCategoriesLanguages key={3} />,
		<StepExperience key={4} />,
		<StepOperatingCities key={5} />,
		<StepSocialLinks key={6} />,
		<StepAddress key={7} />,
	]

	async function handleNext() {
		const valid = await trigger(STEP_FIELDS[step] as (keyof OnboardingValues)[])
		if (!valid) return
		if (!isLastStep) { setStep((s) => s + 1); return }

		if (!user) { router.replace("/login"); return }
		setSubmitting(true)
		try {
			const values = methods.getValues()
			const payload: HostRegistrationData = {
				...values,
				phone: `${country.dialCode}${values.phone}`,
				yearsOfExperience: Number(values.yearsOfExperience),
				totalEventsHosted: Number(values.totalEventsHosted),
				instagram: values.instagram ?? "",
				addressLine2: values.addressLine2 ?? "",
			}
			await registerHost(payload)
			clearSession()
			toast.success("Profile submitted successfully!")
			router.push("/dashboard")
		} catch {
			toast.error("Registration failed. Please try again.")
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div className="w-full max-w-lg bg-surface-card rounded-modal shadow-modal px-6 py-8 lg:px-8 lg:py-10">
			<div className="mb-6">
				<p className="text-caption text-text-muted mb-1">
					Step {step + 1} of {STEPS.length}
				</p>
				<h1 className="text-heading-sm text-text-primary">{STEPS[step]}</h1>
			</div>

			<div className="w-full h-1 bg-border-subtle rounded-full mb-8">
				<div
					className="h-full bg-action-primary rounded-full transition-all duration-300"
					style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
				/>
			</div>

			<FormProvider {...methods}>
				<form onSubmit={handleSubmit(() => {})}>
					{stepComponents[step]}
				</form>
			</FormProvider>

			<div className="flex gap-3 mt-8">
				{step > 0 && (
					<Button
						type="button"
						variant="secondary"
						size="md"
						radius="pill"
						className="flex-1"
						onClick={() => setStep((s) => s - 1)}
						disabled={submitting}
					>
						Back
					</Button>
				)}
				<Button
					type="button"
					variant="primary"
					size="md"
					radius="pill"
					className="flex-1"
					onClick={handleNext}
					disabled={submitting}
				>
					{isLastStep ? (submitting ? "Submitting…" : "Submit") : "Next"}
				</Button>
			</div>
		</div>
	)
}
