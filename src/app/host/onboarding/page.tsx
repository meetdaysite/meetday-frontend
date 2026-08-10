"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useForm, useFormContext, FormProvider, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { ApiError, getApiErrorMessage } from "@/lib/errors"
import clsx from "clsx"
import {
	registerHost,
	verifyPan,
	verifyBankAccount,
	getCategories,
	getHostProfile,
	type Category,
	type BankKycResult,
	type RegisterPayload,
} from "@/lib/api"
import { useHostStore } from "@/store/hostStore"
import { useAuthSessionStore, useAuthSessionHydrated } from "@/store/authSessionStore"
import { useAuth } from "@/context/AuthContext"
import { AuthShell } from "@/components/auth/AuthShell"
import { Button } from "@/components/ui/Button"
import { TextField } from "@/components/ui/TextField"
import { Dropdown } from "@/components/ui/Dropdown"
import { Icon } from "@/components/ui/Icon"
import { OnboardingLeftPanel } from "@/components/onboarding/OnboardingLeftPanel"
import { STEP_PANEL_CONFIGS } from "./config"
import CheckCircleSvg from "@/icons/filled/check-circle.svg"
import CardSvg from "@/icons/filled/card.svg"
import LockKeyholeSvg from "@/icons/outlined/lock-keyhole.svg"
import DangerTriangleSvg from "@/icons/outlined/danger-triangle.svg"
import InstagramSvg from "@/icons/socials/instagram.svg"
import LinkedinSvg from "@/icons/socials/linkedin.svg"
import YoutubeSvg from "@/icons/socials/youtube.svg"
import LinkSvg from "@/icons/socials/link.svg"
import DuotoneUserSvg from "@/icons/duotone/user.svg"
import DuotoneCalenderSvg from "@/icons/duotone/calender.svg"
import DuotoneUserHandsSvg from "@/icons/duotone/user-hands.svg"
import DuotoneStarsSvg from "@/icons/duotone/stars.svg"
import DuotoneShieldCheckSvg from "@/icons/duotone/shield-check.svg"
import AltArrowRightSvg from "@/icons/outlined/alt-arrow-right.svg"


function buildRegisterPayload(values: FormValues, sessionPhone?: string): RegisterPayload {
	const phone = sessionPhone || (values.phone ? `+91${values.phone}` : undefined)
	return {
		firstName: values.firstName,
		lastName: values.lastName,
		email: values.email,
		phone,
		accountType: "HOST",
		hostType: values.accountType === "Individual" ? "INDIVIDUAL" : "BUSINESS",
		displayName: `${values.firstName} ${values.lastName}`.trim() || undefined,
		hostBio: values.bio || undefined,
		tagline: values.tagline || undefined,
		gender: values.gender || undefined,
		communityName: values.communityName || undefined,
		// Commented out original assignment for legalName and pan
		// legalName: values.legalName,
		// pan: values.pan,
		legalName: values.legalName || undefined,
		pan: values.pan || undefined,
		languages: values.languages?.length ? values.languages : undefined,
		address: values.addressLine1
			? {
				addressLine1: values.addressLine1,
				addressLine2: values.addressLine2 || undefined,
				city: values.addressCity || "",
				state: values.addressState || "",
				pincode: values.addressPincode || "",
				country: values.addressCountry || undefined,
			}
			: undefined,
		socialLinks: {
			instagram: values.instagram || undefined,
			linkedin: values.linkedin || undefined,
			youtube: values.youtube || undefined,
			website: values.portfolio || undefined,
		},
		portfolioLinks: values.portfolioLinks?.length ? values.portfolioLinks : undefined,
		categoryIds: values.categoryIds ?? [],
		yearsOfExperience: values.yearsOfExperience ?? 0,
		totalEventsPreviouslyHosted: values.totalEventsHosted ?? 0,
		operatingCities: values.operatingCities ?? [],
	}
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
	// Step 1
	firstName: z.string().min(1, "Required"),
	lastName: z.string().min(1, "Required"),
	accountType: z.enum(["Individual", "Business"]).refine(v => !!v, "Select an option"),
	email: z.string().email("Enter a valid email address"),
	// Step 2
	phone: z
		.string()
		.min(10, "Enter a valid 10-digit phone number")
		.max(10, "Enter a valid 10-digit phone number")
		.regex(/^\d+$/, "Phone number must contain only digits"),
	displayName: z.string().optional(),
	bio: z.string().optional(),
	tagline: z.string().optional(),
	gender: z.string().optional(),
	communityName: z.string().min(1, "Required"),
	// Step 3
	instagram: z.string().optional(),
	linkedin: z.string().optional(),
	youtube: z.string().optional(),
	portfolio: z.string().optional(),
	// Commented out original fields and made them optional
	// legalName: z.string().min(1, "Required"),
	// pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Enter a valid PAN (e.g. ABCDE1234F)"),
	legalName: z.string().optional(),
	pan: z.string().optional(),
	languages: z.array(z.string()).optional(),
	addressLine1: z.string().optional(),
	addressLine2: z.string().optional(),
	addressCity: z.string().optional(),
	addressState: z.string().optional(),
	addressPincode: z.string().optional(),
	addressCountry: z.string().optional(),
	// Step 4
	// Commented out original fields and made them optional
	// yearsOfExperience: z.coerce.number({ error: "Required" }).min(0, "Required"),
	// totalEventsHosted: z.coerce.number({ error: "Required" }).min(0, "Required"),
	yearsOfExperience: z.coerce.number().optional(),
	totalEventsHosted: z.coerce.number().optional(),
	categoryIds: z.array(z.string()).optional(),
	operatingCities: z.array(z.string()).optional(),
	portfolioLinks: z.array(z.string()).optional(),
	// Step 5
	// Commented out original fields and made them optional
	// reviewConfirmed: z.boolean().refine(v => v === true, "Please confirm to continue"),
	reviewConfirmed: z.boolean().optional(),
	// Step 6
	// Commented out original fields and made them optional
	// accountHolderName: z.string().min(1, "Required"),
	// accountNumber: z.string().min(1, "Required"),
	// ifscCode: z.string().min(1, "Required"),
	// bankName: z.string().min(1, "Required"),
	accountHolderName: z.string().optional(),
	accountNumber: z.string().optional(),
	ifscCode: z.string().optional(),
	bankName: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

// Commented out original STEP_FIELDS config
/*
const STEP_FIELDS: (keyof FormValues)[][] = [
	["firstName", "lastName", "accountType", "email"],
	[],
	["legalName", "pan"],
	["yearsOfExperience", "totalEventsHosted", "categoryIds", "operatingCities"],
	["reviewConfirmed"],
	["accountHolderName", "accountNumber", "ifscCode", "bankName"],
	[],
	[],
]
*/
const STEP_FIELDS: (keyof FormValues)[][] = [
	["accountType"],
	["firstName", "lastName", "communityName", "email", "phone"],
]

// Commented out original STEP_BUTTON_LABELS config
/*
const STEP_BUTTON_LABELS = [
	"Save & Continue",
	"Save & Continue",
	"Save & Continue",
	"Save & Continue",
	"Submit & Continue",
	"Confirm & Continue",
	"Save & Continue",
	"",
]
*/
const STEP_BUTTON_LABELS = [
	"Next",
	"Create Account",
]

// Commented out original STEP_SUBTITLES config
/*
const STEP_SUBTITLES = [
	"This helps us tailor your meetday experience to fit your goals and style.",
	"This helps us tailor your meetday experience to fit your goals and style.",
	"Help people find you and verify your identity. Your information is safe with us.",
	"Tell us about your hosting journey so we can match you with the right tools and community.",
	"Take a moment to review everything before we proceed.",
	"Almost there! Please verify your account to receive payouts.",
	"Almost there! Please verify your account to receive payouts.",
	"We'll review your application and notify you by email once it's approved.",
]
*/
const STEP_SUBTITLES = [
	"Help us tailor your Meetday experience to fit your style & goals.",
	"Help us learn more about you.",
]

// ─── Custom STEP_PANEL_CONFIGS for 2-step onboarding ──────────────────────────
const TWO_STEP_PANEL_CONFIGS = [
	{
		headingPlain: "Your story",
		headingHighlight: "shapes the experience",
		description: "Hosts like you build more than events. You build trust, community, and moment that matter",
		personImage: "/onboarding/person-2.png",
		cards: [
			{
				icon: "/icons/onboarding/shield-check.svg",
				iconBg: "#EFF6FF",
				title: "Trusted by real people",
				body: "Build credibility that lasts.",
				position: { bottom: "44%", left: "4%" } as React.CSSProperties,
			},
			{
				icon: "/icons/onboarding/users-group-two.svg",
				iconBg: "#FEF2F2",
				title: "Your identity, your way",
				body: "Show up how you want.",
				position: { top: "38%", right: "6%" } as React.CSSProperties,
			},
		],
	},
]

function CheckIcon() {
	return (
		<svg viewBox="0 0 20 20" fill="currentColor" className="size-5 text-icon-success shrink-0">
			<path
				fillRule="evenodd"
				d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
				clipRule="evenodd"
			/>
		</svg>
	)
}

// ─── Step 1 — Tell us about you ───────────────────────────────────────────────

function StepAboutYou({ isEmailReadOnly }: { isEmailReadOnly: boolean }) {
	const {
		register,
		control,
		formState: { errors },
	} = useFormContext<FormValues>()

	return (
		<div className="flex flex-col gap-6">
			<div className="flex gap-3">
				<TextField
					label="First name"
					placeholder="Enter your first name"
					{...register("firstName")}
					error={!!errors.firstName}
					helperText={errors.firstName?.message}
					size="md"
					className="flex-1"
				/>
				<TextField
					label="Last name"
					placeholder="Enter your last name"
					{...register("lastName")}
					error={!!errors.lastName}
					helperText={errors.lastName?.message}
					size="md"
					className="flex-1"
				/>
			</div>

			<TextField
				label="Email address"
				placeholder="Enter your email address"
				type="email"
				{...register("email")}
				error={!!errors.email}
				helperText={errors.email?.message}
				size="md"
				disabled={isEmailReadOnly}
				hint={isEmailReadOnly ? "From your Google account" : undefined}
			/>

			<div>
				<p className="text-label-sm font-semibold text-text-primary mb-3">What best describes you?</p>
				<Controller
					control={control}
					name="accountType"
					render={({ field }) => (
						<div className="grid grid-cols-2 gap-3">
							{(["Individual", "Business"] as const).map(type => {
								const selected = field.value === type
								return (
									<button
										key={type}
										type="button"
										onClick={() => field.onChange(type)}
										className={clsx(
											"relative flex flex-col items-center gap-3 rounded-action border-2 px-4 py-5 text-center transition-all duration-(--duration-120)",
											selected
												? "border-border-focus bg-surface-brand-soft"
												: "border-border-default bg-surface-canvas hover:border-border-strong",
										)}
									>
										{selected && (
											<span className="absolute top-2.5 right-2.5 flex size-5 items-center justify-center rounded-avatar bg-action-primary">
												<svg viewBox="0 0 12 12" fill="none" className="size-3">
													<path
														d="M2 6l2.5 2.5L10 3.5"
														stroke="white"
														strokeWidth={1.5}
														strokeLinecap="round"
														strokeLinejoin="round"
													/>
												</svg>
											</span>
										)}
										<Image
											src={
												type === "Individual"
													? "/onboarding/individual.svg"
													: "/onboarding/business.svg"
											}
											alt=""
											width={100}
											height={100}
											className="w-auto"
											aria-hidden
										/>
										<div className="mt-2">
											<p className="text-label-md text-text-primary font-semibold">{type}</p>
											<p className="text-[10px] text-text-secondary mt-0.5">
												{type === "Individual"
													? "I host events on my own"
													: "I represent a company or organization"}
											</p>
										</div>
									</button>
								)
							})}
						</div>
					)}
				/>
				{errors.accountType && (
					<p className="text-caption text-text-danger mt-2">{errors.accountType.message}</p>
				)}
				<p className="flex items-center gap-1.5 text-caption text-text-muted mt-3">
					<svg
						viewBox="0 0 16 16"
						fill="currentColor"
						className="size-3.5 shrink-0 text-icon-muted"
					>
						<path
							fillRule="evenodd"
							d="M8 15A7 7 0 108 1a7 7 0 000 14zm.75-10a.75.75 0 00-1.5 0v4a.75.75 0 001.5 0V5zm-.75 6.5a.875.875 0 100 1.75.875.875 0 000-1.75z"
							clipRule="evenodd"
						/>
					</svg>
					Don&apos;t worry - you can change this later. Next steps will adapt to your choice.
				</p>
			</div>
		</div>
	)
}

// ─── Step 2 — Set up your host profile ───────────────────────────────────────

function StepHostProfile() {
	const {
		register,
		control,
		formState: { errors },
	} = useFormContext<FormValues>()

	const genderOptions = [
		{ value: "MALE", label: "Male" },
		{ value: "FEMALE", label: "Female" },
		{ value: "NON_BINARY", label: "Non-binary" },
		{ value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
	]

	return (
		<div className="flex flex-col gap-5">
			<div className="flex flex-col gap-1.5">
				<div className="flex items-center justify-between">
					<label className="text-label-sm font-semibold text-text-primary">Bio</label>
					<span className="text-caption text-text-muted">Optional</span>
				</div>
				<textarea
					placeholder="Tell us a little about yourself"
					{...register("bio")}
					rows={3}
					className={clsx(
						"w-full rounded-input border bg-surface-canvas px-4 py-3",
						"text-body-sm text-text-primary placeholder:text-text-muted outline-none resize-none",
						"hover:border-border-strong focus:border-border-focused transition-colors duration-(--duration-120)",
						errors.bio ? "border-border-brand" : "border-border-default",
					)}
				/>
			</div>

			<TextField
				label="Tagline"
				hint="Optional"
				placeholder="A short line that shows your vibe"
				{...register("tagline")}
				size="md"
			/>

			<Controller
				control={control}
				name="gender"
				render={({ field }) => (
					<Dropdown
						label="Gender"
						placeholder="Select gender"
						options={genderOptions}
						value={field.value}
						onChange={field.onChange}
						size="md"
					/>
				)}
			/>
		</div>
	)
}

// ─── Step 3 — Links & legal details ──────────────────────────────────────────

function StepLinksLegal() {
	const {
		register,
		formState: { errors },
	} = useFormContext<FormValues>()

	return (
		<div className="flex flex-col gap-5">
			<div className="flex flex-col gap-3">
				<p className="text-label-sm font-semibold text-text-primary">Social media links</p>
				<div className="flex justify-center items-center gap-2">
					<div className="border border-border-default p-2 rounded-xl bg-action-secondary-hover">
						<Icon as={InstagramSvg} size="lg" />
					</div>
					<TextField
						placeholder="instagram.com/yourhandle"
						{...register("instagram")}
						size="md"
						className="flex-1"
					/>
				</div>
				<div className="flex justify-center items-center gap-2">
					<div className="border border-border-default p-2 rounded-xl bg-action-secondary-hover">
						<Icon as={LinkedinSvg} size="lg" />
					</div>
					<TextField
						placeholder="linkedin.com/in/yourprofile"
						{...register("linkedin")}
						size="md"
						className="flex-1"
					/>
				</div>
				<div className="flex justify-center items-center gap-2">
					<div className="border border-border-default p-2 rounded-xl bg-action-secondary-hover">
						<Icon as={YoutubeSvg} size="lg" />
					</div>
					<TextField
						placeholder="youtube.com/@yourusername"
						{...register("youtube")}
						size="md"
						className="flex-1"
					/>
				</div>
				<div className="flex justify-center items-center gap-2">
					<div className="border border-border-default p-2 rounded-xl bg-action-secondary-hover">
						<Icon as={LinkSvg} size="lg" />
					</div>
					<TextField
						placeholder="yourwebsite.com"
						{...register("portfolio")}
						size="md"
						className="flex-1"
					/>
				</div>
			</div>

			<div className="flex gap-3">
				<TextField
					label="Legal name (as per PAN)"
					placeholder="Enter your full legal name"
					{...register("legalName")}
					error={!!errors.legalName}
					helperText={errors.legalName?.message}
					size="md"
					className="flex-1"
				/>
				<TextField
					label="PAN card number"
					placeholder="Enter your 10-digit PAN"
					{...register("pan", { setValueAs: (v: string) => v.toUpperCase() })}
					error={!!errors.pan}
					helperText={errors.pan?.message}
					size="md"
					className="flex-1"
				/>
			</div>

			<div className="flex flex-col gap-3">
				<p className="text-label-sm font-semibold text-text-primary">
					Registered address <span className="text-text-muted font-normal">(Optional)</span>
				</p>
				<TextField
					placeholder="Address line 1 (e.g. 12, Linking Road)"
					{...register("addressLine1")}
					size="md"
				/>
				<TextField
					placeholder="Address line 2 (e.g. Bandra West)"
					{...register("addressLine2")}
					size="md"
				/>
				<div className="flex gap-3">
					<TextField
						placeholder="City"
						{...register("addressCity")}
						size="md"
						className="flex-1"
					/>
					<TextField
						placeholder="State"
						{...register("addressState")}
						size="md"
						className="flex-1"
					/>
				</div>
				<TextField
					placeholder="Pincode"
					{...register("addressPincode")}
					size="md"
				/>
			</div>

			<p className="flex items-center gap-1.5 text-caption text-text-secondary">
				<Icon as={LockKeyholeSvg} size="sm" className="opacity-80" />
				Your information is encrypted and never shared.
			</p>
		</div>
	)
}

// ─── Step 4 — Experience & Focus ─────────────────────────────────────────────

function StepExperienceFocus({ categories }: { categories: Category[] }) {
	const {
		control,
		register,
		getValues,
		setValue,
		formState: { errors },
	} = useFormContext<FormValues>()
	const [cityInput, setCityInput] = useState("")

	function addCity() {
		const trimmed = cityInput.trim()
		if (!trimmed) return
		const current = getValues("operatingCities") ?? []
		if (current.includes(trimmed)) { setCityInput(""); return }
		setValue("operatingCities", [...current, trimmed])
		setCityInput("")
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex gap-3">
				<TextField
					label="Years of experience"
					placeholder="e.g. 3"
					type="number"
					min={0}
					{...register("yearsOfExperience", { valueAsNumber: true })}
					error={!!errors.yearsOfExperience}
					helperText={errors.yearsOfExperience?.message}
					size="md"
					className="flex-1"
				/>
				<TextField
					label="Total events hosted"
					placeholder="e.g. 15"
					type="number"
					min={0}
					{...register("totalEventsHosted", { valueAsNumber: true })}
					error={!!errors.totalEventsHosted}
					helperText={errors.totalEventsHosted?.message}
					size="md"
					className="flex-1"
				/>
			</div>

			{/* Operating cities */}
			<div className="flex flex-col gap-2">
				<p className="text-label-sm font-semibold text-text-primary">Operating cities</p>
				<div className="flex gap-2">
					<TextField
						placeholder="e.g. Mumbai"
						value={cityInput}
						onChange={e => setCityInput((e.target as HTMLInputElement).value)}
						onKeyDown={(e: React.KeyboardEvent) => {
							if (e.key === "Enter") { e.preventDefault(); addCity() }
						}}
						size="md"
						className="flex-1"
					/>
					<button
						type="button"
						onClick={addCity}
						className="px-4 rounded-input border border-border-default bg-surface-canvas text-label-sm font-semibold text-text-primary hover:bg-action-secondary-hover transition-colors"
					>
						Add
					</button>
				</div>
				<Controller
					control={control}
					name="operatingCities"
					render={({ field }) => {
						const cities = field.value ?? []
						if (!cities.length) return <></>
						return (
							<div className="flex flex-wrap gap-2 mt-1">
								{cities.map(city => (
									<span
										key={city}
										className="flex items-center gap-1.5 px-3 py-1 rounded-avatar border border-border-default bg-surface-canvas text-label-sm text-text-primary"
									>
										{city}
										<button
											type="button"
											onClick={() => field.onChange(cities.filter(c => c !== city))}
											className="text-text-muted hover:text-text-primary transition-colors leading-none"
										>
											×
										</button>
									</span>
								))}
							</div>
						)
					}}
				/>
				{errors.operatingCities && (
					<p className="text-caption text-text-danger">{errors.operatingCities.message}</p>
				)}
			</div>

			{/* Interests & focus areas */}
			<div className="flex flex-col gap-3">
				<div className="flex items-center justify-between">
					<p className="text-label-sm font-semibold text-text-primary">Interests & focus areas</p>
					<span className="text-caption text-text-muted">Pick all that apply</span>
				</div>
				{categories.length === 0 ? (
					<p className="text-caption text-text-muted">Loading categories…</p>
				) : (
					<Controller
						control={control}
						name="categoryIds"
						render={({ field }) => {
							const selected = field.value ?? []
							function toggle(id: string) {
								field.onChange(
									selected.includes(id)
										? selected.filter((i: string) => i !== id)
										: [...selected, id],
								)
							}
							return (
								<div className="flex flex-wrap gap-2">
									{categories.map(cat => {
										const active = selected.includes(cat.id)
										return (
											<button
												key={cat.id}
												type="button"
												onClick={() => toggle(cat.id)}
												className={clsx(
													"px-3.5 py-1.5 rounded-avatar border-2 text-label-sm transition-all duration-(--duration-120)",
													active
														? "border-border-focus bg-surface-brand-soft text-text-brand font-semibold"
														: "border-border-default bg-surface-canvas text-text-secondary hover:border-border-strong",
												)}
											>
												{cat.name}
											</button>
										)
									})}
								</div>
							)
						}}
					/>
				)}
				{errors.categoryIds && (
					<p className="text-caption text-text-danger">{errors.categoryIds.message}</p>
				)}
			</div>

			<p className="flex items-center gap-1.5 text-caption text-text-muted">
				<svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5 shrink-0 text-icon-muted">
					<path
						fillRule="evenodd"
						d="M8 15A7 7 0 108 1a7 7 0 000 14zm.75-10a.75.75 0 00-1.5 0v4a.75.75 0 001.5 0V5zm-.75 6.5a.875.875 0 100 1.75.875.875 0 000-1.75z"
						clipRule="evenodd"
					/>
				</svg>
				You can update these anytime from your host profile settings.
			</p>
		</div>
	)
}

// ─── Step 5 — Review your details ────────────────────────────────────────────

function StepReviewDetails({ onJumpTo }: { onJumpTo: (step: number) => void }) {
	const {
		getValues,
		register,
		formState: { errors },
	} = useFormContext<FormValues>()
	const values = getValues()

	const sections = [
		{
			label: "Account",
			icon: DuotoneUserSvg,
			details: [
				[values.firstName, values.lastName].filter(Boolean).join(" ") || "—",
				values.email || "—",
			],
			jumpStep: 0,
		},
		{
			label: "Host type",
			icon: DuotoneCalenderSvg,
			details: ["I host events", values.accountType ?? "—"],
			jumpStep: 0,
		},
		{
			label: "Profile",
			icon: DuotoneUserHandsSvg,
			details: [values.displayName || values.firstName || "—", values.tagline || "—"],
			jumpStep: 1,
		},
		{
			label: "Experience & Focus",
			icon: DuotoneStarsSvg,
			details: [
				values.yearsOfExperience != null ? `${values.yearsOfExperience} yrs exp` : "—",
				values.totalEventsHosted != null ? `${values.totalEventsHosted} events` : "—",
				values.operatingCities?.length ? values.operatingCities.join(", ") : "—",
			],
			jumpStep: 3,
		},
		{
			label: "Links & KYC",
			icon: DuotoneShieldCheckSvg,
			details: [
				values.instagram ? `Instagram: @${values.instagram}` : "Instagram: —",
				values.pan ? "PAN added" : "PAN pending",
			],
			jumpStep: 2,
		},
	]

	return (
		<div className="flex flex-col gap-3">
			{sections.map(s => (
				<div
					key={s.label}
					className="flex items-center gap-3 rounded-action border border-border-default bg-surface-canvas px-4 py-4"
				>
					<div className="size-11 rounded-full border border-border-default bg-surface-canvas flex items-center justify-center shrink-0">
						<Icon as={s.icon} size="md" />
					</div>
					<div className="flex-1 min-w-0">
						<p className="text-label-sm font-bold text-text-primary">{s.label}</p>
						<p className="text-body-sm text-text-secondary truncate">{s.details.join(" • ")}</p>
					</div>
					<button
						type="button"
						onClick={() => onJumpTo(s.jumpStep)}
						className="ml-2 flex items-center gap-1.5 text-caption text-text-brand font-semibold hover:underline shrink-0"
					>
						Edit
					</button>
				</div>
			))}

			<label className="flex items-start gap-2.5 cursor-pointer mt-1">
				<input
					type="checkbox"
					{...register("reviewConfirmed")}
					className="mt-0.5 size-4 accent-red-500"
				/>
				<span className="text-body-sm text-text-secondary">
					I confirm that all the information above is accurate and complete
				</span>
			</label>
			{errors.reviewConfirmed && (
				<p className="text-caption text-text-danger -mt-2">{errors.reviewConfirmed.message}</p>
			)}
		</div>
	)
}

// ─── Step 6 — Verify payout details ──────────────────────────────────────────

function StepPayoutDetails() {
	const {
		register,
		getValues,
		formState: { errors },
	} = useFormContext<FormValues>()
	const pan = getValues("pan")

	return (
		<div className="flex flex-col gap-5">
			<div className="flex items-center justify-between rounded-action border border-border-default bg-surface-canvas px-4 py-3">
				<div className="flex items-center gap-3">
					<div className="size-10 rounded-badge bg-surface-success-soft flex items-center justify-center shrink-0">
						<Icon as={CardSvg} size="lg" color="success" />
					</div>
					<div>
						<p className="text-label-md text-text-primary font-bold">PAN Auto-detected</p>
						<p className="text-body-sm font-mono text-text-primary">{pan || "ABCDE1234F"}</p>
					</div>
				</div>
				<span className="flex items-center gap-1 text-caption font-medium text-text-success bg-surface-success-soft px-2 py-1 rounded-avatar">
					<Icon as={CheckCircleSvg} size="sm" color="success" />
					Submitted
				</span>
			</div>

			<TextField
				label="Account holder name"
				placeholder="Enter your account holder name"
				{...register("accountHolderName")}
				error={!!errors.accountHolderName}
				helperText={errors.accountHolderName?.message}
				size="md"
			/>
			<TextField
				label="Account number"
				placeholder="Enter your account number"
				{...register("accountNumber")}
				error={!!errors.accountNumber}
				helperText={errors.accountNumber?.message}
				size="md"
			/>
			<div className="flex gap-3">
				<TextField
					label="IFSC Code"
					placeholder="Enter your IFSC code"
					{...register("ifscCode")}
					error={!!errors.ifscCode}
					helperText={errors.ifscCode?.message}
					size="md"
					className="flex-1"
				/>
				<TextField
					label="Bank name"
					placeholder="Enter your bank name"
					{...register("bankName")}
					error={!!errors.bankName}
					helperText={errors.bankName?.message}
					size="md"
					className="flex-1"
				/>
			</div>

			<p className="flex items-center gap-1.5 text-caption text-text-muted">
				<Icon as={LockKeyholeSvg} size="sm" className="opacity-80" />
				Your information is encrypted and secured. Raw account number is never stored.
			</p>
		</div>
	)
}

// ─── Step 7 — Review payout details ──────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
	const verified = status === "VERIFIED"
	return (
		<span
			className={clsx(
				"flex items-center gap-1 text-caption font-medium px-2 py-1 rounded-avatar",
				verified
					? "text-text-success bg-surface-success-soft"
					: "text-text-warning bg-surface-warning-soft",
			)}
		>
			{verified ? (
				<Icon as={CheckCircleSvg} size="sm" color="success" />
			) : (
				<svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5 text-icon-warning">
					<path fillRule="evenodd" d="M8 1a7 7 0 100 14A7 7 0 008 1zm.75 4a.75.75 0 00-1.5 0v4a.75.75 0 001.5 0V5zm-.75 6.5a.875.875 0 100 1.75.875.875 0 000-1.75z" clipRule="evenodd" />
				</svg>
			)}
			{verified ? "Verified" : status}
		</span>
	)
}

function StepReviewPayout({ bankKycResult }: { bankKycResult: BankKycResult | null }) {
	const { getValues } = useFormContext<FormValues>()
	const v = getValues()
	const maskedAccount = v.accountNumber
		? `••••${v.accountNumber.slice(-4)}`
		: "——"

	return (
		<div className="flex flex-col gap-4">
			{/* PAN status */}
			<div className="flex items-center justify-between rounded-action border border-border-default bg-surface-canvas px-4 py-3">
				<div className="flex items-center gap-3">
					<div className="size-10 rounded-badge bg-surface-success-soft flex items-center justify-center shrink-0">
						<Icon as={CardSvg} size="lg" color="success" />
					</div>
					<div>
						<p className="text-label-md text-text-primary font-bold">PAN</p>
						<p className="text-body-sm font-mono text-text-primary">{v.pan || "—"}</p>
					</div>
				</div>
				<StatusBadge status={bankKycResult?.panVerificationStatus ?? "PENDING"} />
			</div>

			{/* Bank details */}
			<div className="rounded-action border border-border-default bg-surface-canvas px-4 py-4 flex flex-col gap-3">
				<div className="flex items-center justify-between">
					<p className="text-label-md text-text-primary font-semibold">Bank account details</p>
					<StatusBadge status={bankKycResult?.bankVerificationStatus ?? "PENDING"} />
				</div>
				{[
					{ label: "Account holder name", value: v.accountHolderName },
					{ label: "Account number", value: maskedAccount },
					{ label: "IFSC Code", value: v.ifscCode },
					{ label: "Bank name", value: v.bankName },
				].map(({ label, value }) => (
					<div key={label} className="flex justify-between items-center">
						<span className="text-caption text-text-secondary">{label}</span>
						<span className="text-body-sm text-text-primary">{value || "—"}</span>
					</div>
				))}
			</div>

			{bankKycResult?.kycFailureReason && (
				<p className="text-caption text-text-danger px-1">{bankKycResult.kycFailureReason}</p>
			)}

			<p className="flex items-center gap-1.5 text-caption text-text-muted">
				<Icon as={LockKeyholeSvg} size="sm" className="opacity-80" />
				Your information is encrypted and never shared.
			</p>
		</div>
	)
}

// ─── Step 8 — Account under review ───────────────────────────────────────────

function StepUnderReview({ onGoToDashboard }: { onGoToDashboard: () => void }) {
	return (
		<div className="flex flex-col items-center gap-6 py-2">
			{/* Pending icon */}
			<div className="size-20 rounded-full bg-surface-warning-soft flex items-center justify-center">
				<svg viewBox="0 0 48 48" fill="none" className="size-10">
					<circle cx="24" cy="24" r="20" stroke="var(--icon-warning)" strokeWidth="2" fill="var(--surface-warning-soft)" />
					<path d="M24 14v12l7 4" stroke="var(--icon-warning)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			</div>

			<div className="text-center">
				<h2 className="text-heading-sm text-text-primary font-bold">Account Under Review</h2>
				<p className="text-body-sm text-text-secondary mt-2 max-w-xs mx-auto">
					Your profile has been submitted. Our team will review your application within 2–3 business days.
				</p>
			</div>

			{/* Checklist */}
			<div className="w-full rounded-action border border-border-default overflow-hidden">
				{[
					{ label: "Profile submitted", done: true },
					{ label: "PAN submitted for verification", done: true },
					{ label: "Bank account verified", done: true },
					{ label: "Admin approval", done: false },
				].map((item, i, arr) => (
					<div
						key={item.label}
						className={clsx(
							"flex items-center gap-3 px-4 py-3",
							i < arr.length - 1 && "border-b border-border-default",
							!item.done && "opacity-50",
						)}
					>
						{item.done ? (
							<CheckIcon />
						) : (
							<svg viewBox="0 0 20 20" fill="currentColor" className="size-5 text-icon-muted shrink-0">
								<circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
								<path d="M10 6v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
							</svg>
						)}
						<span className="text-body-sm text-text-primary font-semibold">{item.label}</span>
						{!item.done && (
							<span className="ml-auto text-caption font-medium text-text-warning bg-surface-warning-soft border border-yellow-200 px-2.5 py-0.5 rounded-avatar">
								Pending
							</span>
						)}
					</div>
				))}
			</div>

			<p className="text-body-sm text-text-secondary text-center">
				You&apos;ll receive an email once your account is approved. Dashboard access is restricted until then.
			</p>

			<Button
				type="button"
				variant="secondary"
				size="lg"
				radius="pill"
				className="w-full"
				onClick={onGoToDashboard}
			>
				Go to Dashboard
				<AltArrowRightSvg className="size-5" aria-hidden />
			</Button>
		</div>
	)
}

// ─── StepOne and StepTwo Components ───────────────────────────────────────────

// ─── Combined Step 1 Component ───────────────────────────────────────────────
function StepOne() {
	const {
		control,
		formState: { errors },
	} = useFormContext<FormValues>()

	return (
		<div className="flex flex-col gap-5">
			<p className="text-sm font-bold text-black text-center mt-2">What best describes you?</p>
			<Controller
				control={control}
				name="accountType"
				render={({ field }) => (
					<div className="grid grid-cols-2 gap-4">
						{(["Individual", "Business"] as const).map(type => {
							const selected = field.value === type
							return (
								<button
									key={type}
									type="button"
									onClick={() => field.onChange(type)}
									className={clsx(
										"relative flex flex-col items-center gap-3 rounded-2xl border-[3px] border-black px-4 py-8 text-center transition-all duration-150 bg-white",
										selected
											? "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-slate-50 translate-x-0 translate-y-0"
											: "shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:border-black/70"
									)}
								>
									<div className="w-14 h-14 relative flex items-center justify-center">
										<Image
											src={
												type === "Individual"
													? "/images/person-3-fill-svgrepo-com 2.svg"
													: "/images/person-3-fill-svgrepo-com 1.svg"
											}
											alt={type}
											width={56}
											height={56}
											className="w-auto h-full object-contain"
											aria-hidden
										/>
									</div>
									<div className="mt-2">
										<p className="text-base text-black font-extrabold">{type}</p>
										<p className="text-[11px] font-semibold text-black/50 mt-1.5 leading-snug">
											{type === "Individual"
												? "I host experiences on my own"
												: "I represent a company"}
										</p>
									</div>
								</button>
							)
						})}
					</div>
				)}
			/>
			{errors.accountType && (
				<p className="text-xs font-bold text-[#EE2C2C] text-center mt-1">{errors.accountType.message}</p>
			)}
		</div>
	)
}

function StepTwo({ isEmailReadOnly }: { isEmailReadOnly: boolean }) {
	const {
		register,
		control,
		formState: { errors },
	} = useFormContext<FormValues>()

	const genderOptions = [
		{ value: "MALE", label: "Male" },
		{ value: "FEMALE", label: "Female" },
		{ value: "NON_BINARY", label: "Non-binary" },
		{ value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
	]

	return (
		<div className="flex flex-col gap-4">
			<TextField
				label="First name"
				placeholder="Enter your first name"
				{...register("firstName")}
				error={!!errors.firstName}
				helperText={errors.firstName?.message}
				size="md"
			/>
			<TextField
				label="Last name"
				placeholder="Enter your last name"
				{...register("lastName")}
				error={!!errors.lastName}
				helperText={errors.lastName?.message}
				size="md"
			/>
			<TextField
				label="Community name"
				placeholder="e.g. Bangalore Founders Circle"
				hint="The community or experience you run — shown to brands later"
				{...register("communityName")}
				error={!!errors.communityName}
				helperText={errors.communityName?.message}
				size="md"
			/>
			<TextField
				label="Phone number"
				placeholder="98765 43210"
				hint="We use this to reach you about your hosting account"
				{...register("phone")}
				error={!!errors.phone}
				helperText={errors.phone?.message}
				size="md"
			/>
			<Controller
				control={control}
				name="gender"
				render={({ field }) => (
					<Dropdown
						label="Gender"
						placeholder="Select gender"
						options={genderOptions}
						value={field.value}
						onChange={field.onChange}
						size="md"
					/>
				)}
			/>
			<TextField
				label="Email address"
				placeholder="Enter your email address"
				type="email"
				{...register("email")}
				error={!!errors.email}
				helperText={errors.email?.message}
				size="md"
				disabled={isEmailReadOnly}
				hint={isEmailReadOnly ? "From your Google account" : undefined}
			/>
		</div>
	)
}



// ─── Step heading config ──────────────────────────────────────────────────────

type HeadingConfig = { plain: string; highlight: string } | { full: string }

// Commented out original STEP_HEADINGS config
/*
const STEP_HEADINGS: HeadingConfig[] = [
	{ plain: "Tell us", highlight: "about you" },
	{ plain: "Set up your", highlight: "host profile" },
	{ full: "Links & legal details" },
	{ full: "Experience & Focus" },
	{ full: "Review your details" },
	{ full: "Verify payout details" },
	{ full: "Review payout details" },
	{ full: "Your account is under review" },
]
*/
const STEP_HEADINGS: HeadingConfig[] = [
	{ plain: "Getting", highlight: "Started" },
	{ plain: "You're", highlight: "almost there" },
]

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
	const [step, setStep] = useState(0)
	const [loadingMessage, setLoadingMessage] = useState<string | null>(null)
	const [bankKycResult, setBankKycResult] = useState<BankKycResult | null>(null)
	const [categories, setCategories] = useState<Category[]>([])
	const [isRegistered, setIsRegistered] = useState(false)
	const { phone, email: sessionEmail, clearSession } = useAuthSessionStore()
	const sessionHydrated = useAuthSessionHydrated()
	const { signOut } = useAuth()
	const { setProfile } = useHostStore()
	const router = useRouter()

	// Guard: only reachable from signup flow — wait for the persisted session to hydrate
	// before checking, otherwise a hard refresh reads stale empty defaults and bounces
	// an in-progress signup back to /host/signup.
	useEffect(() => {
		if (!sessionHydrated) return
		if (!phone && !sessionEmail) {
			router.replace("/host/signup")
		}
	}, [sessionHydrated, phone, sessionEmail, router])

	// Fetch categories on mount (public endpoint)
	useEffect(() => {
		let cancelled = false
		getCategories().then(cats => {
			if (!cancelled) setCategories(cats)
		}).catch(() => {
			if (!cancelled) toast.error("Failed to load category data. Some fields may be unavailable.")
		})
		return () => { cancelled = true }
	}, [])

	const methods = useForm<FormValues>({
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		resolver: zodResolver(schema) as any,
		defaultValues: {
			firstName: "",
			lastName: "",
			accountType: undefined,
			email: sessionEmail || "",
			phone: "",
			displayName: "",
			bio: "",
			tagline: "",
			gender: "",
			communityName: "",
			yearsOfExperience: undefined,
			totalEventsHosted: undefined,
			categoryIds: [],
			operatingCities: [],
			instagram: "",
			linkedin: "",
			youtube: "",
			portfolio: "",
			legalName: "",
			pan: "",
			languages: [],
			addressLine1: "",
			addressLine2: "",
			addressCity: "",
			addressState: "",
			addressPincode: "",
			addressCountry: "",
			portfolioLinks: [],
			reviewConfirmed: false,
			accountHolderName: "",
			accountNumber: "",
			ifscCode: "",
			bankName: "",
		},
	})

	const { handleSubmit, trigger, getValues } = methods
	// Commented out original step configs
	/*
	const TOTAL = STEP_PANEL_CONFIGS.length
	const isLast = step === TOTAL - 1
	const panelConfig = STEP_PANEL_CONFIGS[step]
	*/
	const TOTAL = 2
	const isLast = step === TOTAL - 1
	const panelConfig = TWO_STEP_PANEL_CONFIGS[step]
	const heading = STEP_HEADINGS[step]

	async function handleNext() {
		const fields = STEP_FIELDS[step]
		if (fields.length > 0) {
			const valid = await trigger(fields as (keyof FormValues)[])
			if (!valid) return
		}

		if (isLast) {
			setLoadingMessage("Setting up your profile…")
			try {
				const values = getValues()
				const payload = buildRegisterPayload(values, phone)
				// Register the host with the data collected
				try {
					await registerHost(payload)
				} catch (e) {
					// 409 = host already registered — treat as success
					if (!(e instanceof ApiError && e.statusCode === 409)) throw e
				}

				// A 409 above is only truly "safe to ignore" when it's this same Firebase
				// identity re-submitting. If the email/phone actually belongs to a different
				// account (e.g. same email already used to register via phone, now signing up
				// again via Google — a different Firebase UID), this identity still has no
				// HostProfile — don't silently push to a dashboard that will just 404-loop.
				try {
					const profile = await getHostProfile()
					setProfile(profile)
					clearSession()
					router.push("/host/dashboard")
				} catch {
					toast.error(
						"This email or phone number is already linked to a different account. Please use a different one, or log in instead.",
					)
				}
			} catch (e) {
				toast.error(getApiErrorMessage(e))
			} finally {
				setLoadingMessage(null)
			}
			return
		}

		setStep(s => s + 1)
	}

	const isEmailReadOnly = !!sessionEmail

	// Commented out original step components list
	/*
	const stepComponents = [
		<StepAboutYou key={0} isEmailReadOnly={isEmailReadOnly} />,
		<StepHostProfile key={1} />,
		<StepLinksLegal key={2} />,
		<StepExperienceFocus key={3} categories={categories} />,
		<StepReviewDetails key={4} onJumpTo={setStep} />,
		<StepPayoutDetails key={5} />,
		<StepReviewPayout key={6} bankKycResult={bankKycResult} />,
		<StepUnderReview key={7} onGoToDashboard={handleNext} />,
	]
	*/
	const stepComponents = [
		<StepOne key={0} />,
		<StepTwo key={1} isEmailReadOnly={isEmailReadOnly} />,
	]

	return (
		<AuthShell>
			{/* Loading overlay for blocking API calls */}
			{loadingMessage && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
					<div className="bg-surface-card rounded-action px-10 py-8 flex flex-col items-center gap-4 shadow-xl">
						<div className="size-10 rounded-full bg-surface-warning-soft flex items-center justify-center">
							<Icon as={DangerTriangleSvg} size="lg" color="warning" />
						</div>
						<p className="text-body-sm font-semibold text-text-primary">{loadingMessage}</p>
					</div>
				</div>
			)}

			<button
				type="button"
				onClick={async () => {
					// Sign out first — otherwise the login page's own "already authenticated"
					// guard immediately bounces back to a dashboard with no profile yet.
					clearSession()
					await signOut()
					router.replace("/host/login")
				}}
				className="inline-flex items-center gap-1.5 text-xs font-bold text-black/50 hover:text-black transition-colors mb-4"
			>
				<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
				</svg>
				Back to login
			</button>

			<div className="flex flex-col flex-grow justify-between min-h-[380px] h-full">
				
				{/* Top Section: Title & Subtitle */}
				<div className="text-center pt-4">
					<h2 className="font-heading text-3xl sm:text-4xl font-black text-black tracking-tight mb-3">
						{step === 0 ? "Getting Started" : "You're almost there"}
					</h2>
					<p className="text-sm font-semibold text-black/60 max-w-xs mx-auto leading-relaxed">
						{step === 0 
							? "Help us tailor your Meetday experience to fit your style & goals."
							: "Help us learn more about you."
						}
					</p>
				</div>

				{/* Form Section */}
				<FormProvider {...methods}>
					<form onSubmit={(e) => { e.preventDefault(); handleNext(); }} noValidate className="flex flex-col gap-4 mt-6">
						{stepComponents[step]}

						{/* Submit/Next Button */}
						<Button
							type="submit"
							variant="primary"
							size="md"
							radius="pill"
							className="w-full py-4 mt-4 bg-[#EE2C2C] text-white border-[3px] border-black rounded-2xl font-extrabold text-center shadow-[4px_4px_0px_0px_#FFC940] hover:shadow-[1px_1px_0px_0px_#FFC940] hover:translate-x-[3px] hover:translate-y-[3px] transition-all text-base tracking-wider"
							disabled={!!loadingMessage}
						>
							{loadingMessage
								? "Please wait…"
								: (step === TOTAL - 1 ? "Create Account" : STEP_BUTTON_LABELS[step])
							}
						</Button>
						{step === 0 && (
							<p className="text-center text-xs font-semibold text-black/40 mt-3">
								You can always change this later
							</p>
						)}
					</form>
				</FormProvider>

				{/* Bottom Section: Indicator Dots */}
				<div className="flex gap-2 justify-center items-center mt-6 mb-2">
					<span className="w-2 h-2 bg-black/15 rounded-full" />
					<span className="w-2 h-2 bg-black/15 rounded-full" />
					<span className={clsx("h-2 rounded-full transition-all duration-300", step === 0 ? "w-5 bg-[#EE2C2C]" : "w-2 bg-black/15")} />
					<span className={clsx("h-2 rounded-full transition-all duration-300", step === 1 ? "w-5 bg-[#EE2C2C]" : "w-2 bg-black/15")} />
				</div>
			</div>
		</AuthShell>
	)
}
