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
	getSubscriptionPlans,
	getHostProfile,
	type Category,
	type SubscriptionPlan,
	type BankKycResult,
	type RegisterPayload,
} from "@/lib/api"
import { useHostStore } from "@/store/hostStore"
import { useAuthSessionStore } from "@/store/authSessionStore"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { TextField } from "@/components/ui/TextField"
import { Dropdown } from "@/components/ui/Dropdown"
import { Icon } from "@/components/ui/Icon"
import { OnboardingLeftPanel } from "@/components/onboarding/OnboardingLeftPanel"
import { STEP_PANEL_CONFIGS } from "./config"
import CheckCircleSvg from "@/icons/filled/check-circle.svg"
import CardSvg from "@/icons/filled/card.svg"
import LockKeyholeSvg from "@/icons/outlined/lock-keyhole.svg"
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


function buildRegisterPayload(values: FormValues, phone?: string): RegisterPayload {
	return {
		firstName: values.firstName,
		lastName: values.lastName,
		email: values.email,
		phone: phone || undefined,
		accountType: "HOST",
		hostType: values.accountType === "Individual" ? "INDIVIDUAL" : "BUSINESS",
		displayName: values.displayName || undefined,
		hostBio: values.bio || undefined,
		tagline: values.tagline || undefined,
		gender: values.gender || undefined,
		legalName: values.legalName,
		pan: values.pan,
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

// ─── Plan display metadata (marketing copy, not from API) ────────────────────

const PLAN_META: Record<
	string,
	{ features: string[]; highlightFeature: string | null; recommended: boolean; cta: string }
> = {
	DISCOVER: {
		features: ["Host up to 3 events/month", "Community up to 100 people", "Basic event tools", "Email support"],
		highlightFeature: null,
		recommended: false,
		cta: "Try for free",
	},
	COMMUNITY: {
		features: ["Host unlimited events", "Community up to 5,000 people", "Ticket & registrations", "Custom branding", "Priority support"],
		highlightFeature: "All Discover features +",
		recommended: true,
		cta: "Choose Community",
	},
	SELL: {
		features: ["No platform fees", "Advanced analytics", "Payouts & Settlements", "Dedicated support"],
		highlightFeature: "Everything in Community +",
		recommended: false,
		cta: "Choose Sell",
	},
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
	// Step 1
	firstName: z.string().min(1, "Required"),
	lastName: z.string().min(1, "Required"),
	accountType: z.enum(["Individual", "Business"]).refine(v => !!v, "Select an option"),
	email: z.string().email("Enter a valid email address"),
	// Step 2
	displayName: z.string().optional(),
	bio: z.string().optional(),
	tagline: z.string().optional(),
	gender: z.string().optional(),
	// Step 3
	instagram: z.string().optional(),
	linkedin: z.string().optional(),
	youtube: z.string().optional(),
	portfolio: z.string().optional(),
	legalName: z.string().min(1, "Required"),
	pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Enter a valid PAN (e.g. ABCDE1234F)"),
	languages: z.array(z.string()).optional(),
	addressLine1: z.string().optional(),
	addressLine2: z.string().optional(),
	addressCity: z.string().optional(),
	addressState: z.string().optional(),
	addressPincode: z.string().optional(),
	addressCountry: z.string().optional(),
	// Step 4
	yearsOfExperience: z.coerce.number().min(0).optional(),
	totalEventsHosted: z.coerce.number().min(0).optional(),
	categoryIds: z.array(z.string()).optional(),
	operatingCities: z.array(z.string()).optional(),
	portfolioLinks: z.array(z.string()).optional(),
	// Step 5
	reviewConfirmed: z.boolean().refine(v => v === true, "Please confirm to continue"),
	// Step 6
	accountHolderName: z.string().min(1, "Required"),
	accountNumber: z.string().min(1, "Required"),
	ifscCode: z.string().min(1, "Required"),
	bankName: z.string().min(1, "Required"),
	// Step 8
	plan: z.enum(["discover", "community", "sell"]).refine(v => !!v, "Select a plan"),
	billingCycle: z.enum(["MONTHLY", "YEARLY"]).optional(),
	couponCode: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const STEP_FIELDS: (keyof FormValues)[][] = [
	["firstName", "lastName", "accountType", "email"],
	[],
	["legalName", "pan"],
	[],
	["reviewConfirmed"],
	["accountHolderName", "accountNumber", "ifscCode", "bankName"],
	[],
	["plan"],
	[],
]

const STEP_BUTTON_LABELS = [
	"Save & Continue",
	"Save & Continue",
	"Save & Continue",
	"Save & Continue",
	"Submit & Continue",
	"Confirm & Continue",
	"Save & Continue",
	"Continue",
	"",
]

const STEP_SUBTITLES = [
	"This helps us tailor your meetday experience to fit your goals and style.",
	"This helps us tailor your meetday experience to fit your goals and style.",
	"Help people find you and verify your identity. Your information is safe with us.",
	"Tell us about your hosting journey so we can match you with the right tools and community.",
	"Take a moment to review everything before we proceed.",
	"Almost there! Please verify your account to receive payouts.",
	"Almost there! Please verify your account to receive payouts.",
	"Pick the plan that matches your goals. You can upgrade anytime.",
	"We'll review your application and notify you by email once it's approved.",
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
			<TextField
				label="Display name"
				hint="Optional"
				placeholder="What should we call you?"
				{...register("displayName")}
				size="md"
			/>

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
	const { control, register, getValues, setValue } = useFormContext<FormValues>()
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
					hint="Optional"
					placeholder="e.g. 3"
					type="number"
					min={0}
					{...register("yearsOfExperience", { valueAsNumber: true })}
					size="md"
					className="flex-1"
				/>
				<TextField
					label="Total events hosted"
					hint="Optional"
					placeholder="e.g. 15"
					type="number"
					min={0}
					{...register("totalEventsHosted", { valueAsNumber: true })}
					size="md"
					className="flex-1"
				/>
			</div>

			{/* Operating cities */}
			<div className="flex flex-col gap-2">
				<div className="flex items-center justify-between">
					<p className="text-label-sm font-semibold text-text-primary">Operating cities</p>
					<span className="text-caption text-text-muted">Optional</span>
				</div>
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
			</div>

			{/* Interests & focus areas */}
			<div className="flex flex-col gap-3">
				<div className="flex items-center justify-between">
					<p className="text-label-sm font-semibold text-text-primary">Interests & focus areas</p>
					<span className="text-caption text-text-muted">Optional · pick all that apply</span>
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

// ─── Step 8 — Choose your host plan ──────────────────────────────────────────

function FilledCheckIcon() {
	return (
		<svg viewBox="0 0 16 16" fill="none" className="size-3.5 shrink-0">
			<circle cx="8" cy="8" r="8" fill="#3B82F6" />
			<path d="M4.5 8l2.5 2.5 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

function OutlineCheckIcon() {
	return (
		<svg viewBox="0 0 16 16" fill="none" className="size-3.5 mt-0.5 shrink-0 text-text-muted">
			<circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
			<path d="M5 8l2 2 4-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

function StepChoosePlan({ plans }: { plans: SubscriptionPlan[] }) {
	const {
		control,
		register,
		watch,
		formState: { errors },
	} = useFormContext<FormValues>()
	const selectedPlan = watch("plan")
	const billingCycle = watch("billingCycle")

	if (plans.length === 0) {
		return (
			<div className="flex flex-col items-center gap-3 py-8 text-center">
				<p className="text-body-sm text-text-secondary">Loading plans…</p>
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-5">
			<Controller
				control={control}
				name="plan"
				render={({ field }) => (
					<div className="flex gap-3 py-4">
						{plans.map(apiPlan => {
							const meta = PLAN_META[apiPlan.plan]
							if (!meta) return null
							const planId = apiPlan.plan.toLowerCase() as "discover" | "community" | "sell"
							const selected = field.value === planId

							const isCommunitySelected = planId === "community" && selected
							const displayPrice = (() => {
								if (apiPlan.plan === "DISCOVER") return "Free"
								if (apiPlan.plan === "SELL") return apiPlan.yearlyPrice ? `₹${apiPlan.yearlyPrice.toLocaleString("en-IN")}` : "—"
								if (apiPlan.plan === "COMMUNITY") {
									if (billingCycle === "MONTHLY" && apiPlan.monthlyPrice) return `₹${apiPlan.monthlyPrice.toLocaleString("en-IN")}`
									if (apiPlan.yearlyPrice) return `₹${apiPlan.yearlyPrice.toLocaleString("en-IN")}`
								}
								return "—"
							})()

							const priceNote = (() => {
								if (apiPlan.plan === "DISCOVER") return null
								if (apiPlan.plan === "SELL") return "/year"
								if (apiPlan.plan === "COMMUNITY") return billingCycle === "MONTHLY" ? "/month" : "/year"
								return null
							})()

							const feeRate = `${(apiPlan.platformFeeRate * 100).toFixed(0)}% platform fee`

							return (
								<div
									key={apiPlan.id}
									role="button"
									tabIndex={0}
									onClick={() => field.onChange(planId)}
									onKeyDown={e => (e.key === "Enter" || e.key === " ") && field.onChange(planId)}
									className={clsx(
										"flex flex-col rounded-action border-2 text-left flex-1 overflow-hidden cursor-pointer transition-all duration-(--duration-120)",
										meta.recommended && "-my-4",
										selected
											? "border-border-focus bg-surface-brand-soft"
											: meta.recommended
												? "border-action-primary"
												: "border-border-default hover:border-border-strong",
									)}
								>
									{meta.recommended && (
										<div className="bg-action-primary text-text-inverse text-[10px] font-bold uppercase tracking-widest py-1.5 text-center w-full shrink-0">
											Recommended Plan
										</div>
									)}

									<div className="flex flex-col gap-3 px-3 py-4 flex-1">
										<div>
											<p className="text-label-md font-bold text-text-primary capitalize">{planId}</p>
											<p className="text-[10px] text-text-muted mt-0.5 leading-tight">{feeRate}</p>
											<p className="text-2xl font-extrabold text-text-primary mt-2 leading-none">
												{displayPrice}
												{priceNote && (
													<span className="text-caption font-normal text-text-muted"> {priceNote}</span>
												)}
											</p>
										</div>

										{/* Billing cycle toggle for Community */}
										{isCommunitySelected && (
											<Controller
												control={control}
												name="billingCycle"
												render={({ field: bf }) => (
													<div className="flex rounded-avatar border border-border-default overflow-hidden text-[10px] font-semibold">
														{(["MONTHLY", "YEARLY"] as const).map(cycle => (
															<button
																key={cycle}
																type="button"
																onClick={e => { e.stopPropagation(); bf.onChange(cycle) }}
																className={clsx(
																	"flex-1 py-1.5 text-center transition-colors",
																	bf.value === cycle
																		? "bg-action-primary text-text-inverse"
																		: "bg-surface-canvas text-text-secondary hover:bg-action-secondary-hover",
																)}
															>
																{cycle === "MONTHLY" ? "Monthly" : "Yearly"}
															</button>
														))}
													</div>
												)}
											/>
										)}

										<ul className="flex flex-col gap-1.5 flex-1">
											{meta.highlightFeature && (
												<li className="flex items-center gap-1.5">
													<FilledCheckIcon />
													<span className="text-[11px] font-semibold text-text-primary leading-tight">
														{meta.highlightFeature}
													</span>
												</li>
											)}
											{meta.features.map(f => (
												<li key={f} className="flex items-start gap-1.5">
													<OutlineCheckIcon />
													<span className="text-[11px] text-text-secondary leading-tight">{f}</span>
												</li>
											))}
										</ul>

										<div className="mt-2 py-2.5 rounded-avatar bg-[#0a0a0a] text-white text-label-sm font-semibold text-center">
											{meta.cta}
										</div>
									</div>
								</div>
							)
						})}
					</div>
				)}
			/>
			{errors.plan && <p className="text-caption text-text-danger">{errors.plan.message}</p>}
			{errors.billingCycle && <p className="text-caption text-text-danger">{errors.billingCycle.message}</p>}

			<div className="flex flex-col gap-1.5">
				<label className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
					Coupon Code
				</label>
				<div className="flex gap-2">
					<TextField
						placeholder="e.g. MEETDAY2026"
						{...register("couponCode")}
						size="md"
						className="flex-1"
					/>
					<button
						type="button"
						className="px-5 rounded-input bg-[#0a0a0a] text-white text-label-sm font-semibold shrink-0 hover:opacity-80 transition-opacity"
					>
						Apply
					</button>
				</div>
				<p className="text-caption text-text-muted">
					Uppercase letters, numbers, hyphens and underscores only.
				</p>
			</div>

			{selectedPlan && selectedPlan !== "discover" && (
				<p className="text-caption text-text-muted text-center">
					Payment via Razorpay will be enabled shortly. Your plan selection is saved.
				</p>
			)}
		</div>
	)
}

// ─── Step 9 — Account under review ───────────────────────────────────────────

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
					{ label: "Plan selected", done: true },
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

// ─── Step heading config ──────────────────────────────────────────────────────

type HeadingConfig = { plain: string; highlight: string } | { full: string }

const STEP_HEADINGS: HeadingConfig[] = [
	{ plain: "Tell us", highlight: "about you" },
	{ plain: "Set up your", highlight: "host profile" },
	{ full: "Links & legal details" },
	{ full: "Experience & Focus" },
	{ full: "Review your details" },
	{ full: "Verify payout details" },
	{ full: "Review payout details" },
	{ full: "Choose your host plan" },
	{ full: "Your account is under review" },
]

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
	const [step, setStep] = useState(0)
	const [loadingMessage, setLoadingMessage] = useState<string | null>(null)
	const [bankKycResult, setBankKycResult] = useState<BankKycResult | null>(null)
	const [categories, setCategories] = useState<Category[]>([])
	const [plans, setPlans] = useState<SubscriptionPlan[]>([])
	const { phone, email: sessionEmail, clearSession } = useAuthSessionStore()
	const { setProfile } = useHostStore()
	const router = useRouter()

	// Guard: only reachable from signup flow
	useEffect(() => {
		if (!phone && !sessionEmail) {
			router.replace("/signup")
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// Fetch categories and plans on mount (both are public endpoints)
	useEffect(() => {
		let cancelled = false
		Promise.all([getCategories(), getSubscriptionPlans()]).then(([cats, plns]) => {
			if (!cancelled) {
				setCategories(cats)
				// Sort: DISCOVER first, then COMMUNITY, then SELL
				const order = ["DISCOVER", "COMMUNITY", "SELL"]
				setPlans(plns.sort((a, b) => order.indexOf(a.plan) - order.indexOf(b.plan)))
			}
		}).catch(() => {
			if (!cancelled) toast.error("Failed to load plan data. Some fields may be unavailable.")
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
			displayName: "",
			bio: "",
			tagline: "",
			gender: "",
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
			plan: undefined,
			billingCycle: undefined,
			couponCode: "",
		},
	})

	const { handleSubmit, trigger, getValues, setError } = methods
	const TOTAL = STEP_PANEL_CONFIGS.length
	const isLast = step === TOTAL - 1
	const panelConfig = STEP_PANEL_CONFIGS[step]
	const heading = STEP_HEADINGS[step]

	async function handleNext() {
		if (isLast) {
			try {
				const profile = await getHostProfile()
				setProfile(profile)
			} catch {
				// profile fetch failure shouldn't block navigation
			}
			clearSession()
			router.push("/dashboard")
			return
		}

		const fields = STEP_FIELDS[step]
		if (fields.length > 0) {
			const valid = await trigger(fields as (keyof FormValues)[])
			if (!valid) return
		}

		// Step 4 (Review): register host then verify PAN — both blocking
		if (step === 4) {
			setLoadingMessage("Setting up your profile…")
			try {
				const values = getValues()
				await registerHost(buildRegisterPayload(values, phone))

				setLoadingMessage("Verifying your PAN…")
				try {
					await verifyPan()
				} catch (e) {
					// 409 = PAN already verified — treat as success
					if (!(e instanceof ApiError && e.statusCode === 409)) throw e
				}

				setStep(s => s + 1)
			} catch (e) {
				toast.error(getApiErrorMessage(e))
			} finally {
				setLoadingMessage(null)
			}
			return
		}

		// Step 5 (Payout): verify bank account — blocking
		if (step === 5) {
			setLoadingMessage("Verifying your bank account…")
			try {
				const values = getValues()
				const result = await verifyBankAccount({
					bankAccount: {
						accountNumber: values.accountNumber,
						ifscCode: values.ifscCode,
						accountHolderName: values.accountHolderName,
						bankName: values.bankName,
					},
				})
				setBankKycResult(result)
				setStep(s => s + 1)
			} catch (e) {
				if (e instanceof ApiError && e.statusCode === 409) {
					// KYC already verified
					setBankKycResult({
						panReferenceId: "",
						pennyDropReference: null,
						kycStatus: "VERIFIED",
						panVerificationStatus: "VERIFIED",
						bankVerificationStatus: "VERIFIED",
						kycFailureReason: null,
					})
					setStep(s => s + 1)
				} else {
					toast.error(getApiErrorMessage(e))
				}
			} finally {
				setLoadingMessage(null)
			}
			return
		}

		// Step 7 (Plan): require billing cycle for Community
		if (step === 7) {
			const values = getValues()
			if (values.plan === "community" && !values.billingCycle) {
				setError("billingCycle", { message: "Please select a billing cycle" })
				return
			}
			setStep(s => s + 1)
			return
		}

		setStep(s => s + 1)
	}

	const isEmailReadOnly = !!sessionEmail

	const stepComponents = [
		<StepAboutYou key={0} isEmailReadOnly={isEmailReadOnly} />,
		<StepHostProfile key={1} />,
		<StepLinksLegal key={2} />,
		<StepExperienceFocus key={3} categories={categories} />,
		<StepReviewDetails key={4} onJumpTo={setStep} />,
		<StepPayoutDetails key={5} />,
		<StepReviewPayout key={6} bankKycResult={bankKycResult} />,
		<StepChoosePlan key={7} plans={plans} />,
		<StepUnderReview key={8} onGoToDashboard={handleNext} />,
	]

	return (
		<div className="flex h-screen overflow-hidden bg-surface-page">
			{/* Loading overlay for blocking API calls */}
			{loadingMessage && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
					<div className="bg-surface-card rounded-action px-10 py-8 flex flex-col items-center gap-4 shadow-xl">
						<Skeleton.Block className="size-10 rounded-full" />
						<p className="text-body-sm font-semibold text-text-primary">{loadingMessage}</p>
					</div>
				</div>
			)}

			{/* Left panel */}
			<div className="hidden lg:block w-[44%] max-w-200 shrink-0 relative">
				<OnboardingLeftPanel config={panelConfig} />
			</div>

			{/* Right panel */}
			<div className="flex-1 overflow-y-auto bg-surface-card flex flex-col">
				{/* Progress bar */}
				<div className="shrink-0">
					<div className="w-full max-w-175 mx-auto px-8 pt-7 pb-5 flex items-center gap-3">
						<div className="flex-1 h-3 bg-border-default rounded-full overflow-hidden">
							<div
								className="h-full bg-action-primary rounded-full transition-all duration-300"
								style={{ width: `${((step + 1) / TOTAL) * 100}%` }}
							/>
						</div>
						<span className="text-body-sm text-text-primary font-semibold shrink-0">
							Step {step + 1} of {TOTAL}
						</span>
					</div>
				</div>

				{/* Form content */}
				<div className="flex-1 w-full max-w-175 mx-auto px-8 py-8">
					{/* Heading */}
					<div className="mb-6">
						<h1 className="text-heading-md text-text-primary leading-tight">
							{"plain" in heading ? (
								<>
									{heading.plain}{" "}
									<span className="text-text-brand">{heading.highlight}</span>
								</>
							) : (
								heading.full
							)}
						</h1>
						<p className="text-body-sm text-text-secondary mt-2">{STEP_SUBTITLES[step]}</p>
					</div>

					<FormProvider {...methods}>
						<form onSubmit={handleSubmit(() => {})} noValidate>
							{stepComponents[step]}
						</form>
					</FormProvider>

					{/* Navigation */}
					{!isLast && (
						<div className="flex gap-3 mt-8">
							{step > 0 && (
								<Button
									type="button"
									variant="secondary"
									size="md"
									radius="pill"
									className="flex-1"
									onClick={() => setStep(s => s - 1)}
									disabled={!!loadingMessage}
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
								disabled={!!loadingMessage}
							>
								{loadingMessage
									? "Please wait…"
									: <>{STEP_BUTTON_LABELS[step]} <AltArrowRightSvg className="size-4" aria-hidden /></>
								}
							</Button>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
