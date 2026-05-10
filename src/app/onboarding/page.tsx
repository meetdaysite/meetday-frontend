"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useForm, useFormContext, FormProvider, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import clsx from "clsx"
// TODO: restore when API is ready
// import { useAuth } from "@/context/AuthContext"
// import { useAuthSessionStore } from "@/store/authSessionStore"
// import { registerHost } from "@/lib/api"
import { Button } from "@/components/ui/Button"
import { TextField } from "@/components/ui/TextField"
import { Dropdown } from "@/components/ui/Dropdown"
import { Icon } from "@/components/ui/Icon"
import { OnboardingLeftPanel } from "@/components/onboarding/OnboardingLeftPanel"
import { STEP_PANEL_CONFIGS } from "./config"
import CalendarSvg from "@/icons/filled/calendar.svg"
import CardSvg from "@/icons/filled/card.svg"
import CheckCircleSvg from "@/icons/filled/check-circle.svg"
import ChartSvg from "@/icons/filled/chart-2.svg"
import DiplomaSvg from "@/icons/filled/diploma.svg"
import HeartsSvg from "@/icons/filled/hearts.svg"
import CameraAddSvg from "@/icons/outlined/camera-add.svg"
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

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
	// Step 1
	firstName: z.string().min(1, "Required"),
	lastName: z.string().min(1, "Required"),
	accountType: z.enum(["Individual", "Business"]).refine(v => !!v, "Select an option"),
	// Step 2
	displayName: z.string().optional(),
	bio: z.string().optional(),
	tagline: z.string().optional(),
	gender: z.string().optional(),
	// Step 3 — Experience & Focus
	yearsExperience: z.string().optional(),
	eventsHosted: z.string().optional(),
	interests: z.array(z.string()).optional(),
	// Step 4 (was 3)
	instagram: z.string().optional(),
	linkedin: z.string().optional(),
	youtube: z.string().optional(),
	portfolio: z.string().optional(),
	legalName: z.string().min(1, "Required"),
	pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Enter a valid PAN (e.g. ABCDE1234F)"),
	registeredAddress: z.string().optional(),
	// Step 4
	reviewConfirmed: z.boolean().refine(v => v === true, "Please confirm to continue"),
	// Step 5
	accountHolderName: z.string().min(1, "Required"),
	accountNumber: z.string().min(1, "Required"),
	ifscCode: z.string().min(1, "Required"),
	bankName: z.string().min(1, "Required"),
	// Step 7
	plan: z.enum(["discover", "community", "sell"]).refine(v => !!v, "Select a plan"),
	couponCode: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const STEP_FIELDS: (keyof FormValues)[][] = [
	["firstName", "lastName", "accountType"],
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
	"Save & Continue",
	"Confirm & review",
	"Submit for review",
	"Save & Continue",
	"Enter Host OS",
]

const STEP_SUBTITLES = [
	"This helps us tailor your meetday experience to fit your goals and style.",
	"This helps us tailor your meetday experience to fit your goals and style.",
	"Help people find you verify your identity. Your information is safe with us.",
	"Tell us about your hosting journey so we can match you with the right tools and community.",
	"Take a moment to review everything before we go live",
	"Almost there! Please verify your account to receive payouts.",
	"Almost there! Please verify your account to receive payouts.",
	"Pick the plan that matches your goals. You can upgrade anytime.",
	"Amazing work! Everything is set up and you're all good to go. Let's make your first event one to remember.",
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

function StepAboutYou() {
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
											"relative flex flex-col items-center gap-3 rounded-card border-2 px-4 py-5 text-center transition-all duration-(--duration-120)",
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
											<p className="text-label-md text-text-primary font-semibold">
												{type}
											</p>
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
	const fileRef = useRef<HTMLInputElement>(null)
	const [previewUrl, setPreviewUrl] = useState<string | null>(null)

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		if (!file) return
		const url = URL.createObjectURL(file)
		setPreviewUrl(prev => {
			if (prev) URL.revokeObjectURL(prev)
			return url
		})
	}

	const genderOptions = [
		{ value: "male", label: "Male" },
		{ value: "female", label: "Female" },
		{ value: "non-binary", label: "Non-binary" },
		{ value: "prefer-not-to-say", label: "Prefer not to say" },
	]

	return (
		<div className="flex flex-col gap-5">
			{/* Photo upload */}
			<div className="flex items-start gap-4">
				<button
					type="button"
					onClick={() => fileRef.current?.click()}
					className="relative flex flex-col items-center justify-center gap-2 w-30 h-30 rounded-image border-2 border-dashed border-border-default bg-surface-canvas hover:border-border-strong transition-colors shrink-0 overflow-hidden"
				>
					{previewUrl ? (
						<Image src={previewUrl} alt="Profile photo preview" fill className="object-cover" />
					) : (
						<>
							<div className="border border-border-default p-2 rounded-full">
								<Icon as={CameraAddSvg} size="lg" />
							</div>
							<span className="text-[10px] text-text-muted text-center px-1">
								<span className="text-label-sm text-text-primary font-semibold">
									Upload photo
								</span>
								<br />
								JPG or PNG, max 5 mb
							</span>
						</>
					)}
				</button>
				<input
					ref={fileRef}
					type="file"
					accept="image/jpeg,image/png"
					className="hidden"
					onChange={handleFileChange}
				/>

				<div className="flex-1 flex flex-col gap-4">
					<TextField
						label="Display name"
						hint="Optional"
						placeholder="What should we call you?"
						{...register("displayName")}
						size="md"
					/>
				</div>
			</div>

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

			<TextField
				label="Registered address"
				hint="Optional"
				placeholder="Enter your complete address"
				{...register("registeredAddress")}
				size="md"
			/>

			<p className="flex items-center gap-1.5 text-caption text-text-secondary">
				<Icon as={LockKeyholeSvg} size="sm" className="opacity-80" />
				Your information is encrypted and never shared quickly.
			</p>
		</div>
	)
}

// ─── Step 4 — Experience & Focus ─────────────────────────────────────────────

const INTEREST_OPTIONS = [
	"Community",
	"Networking",
	"Music & Arts",
	"Tech & Innovation",
	"Wellness & Mindfulness",
	"Sports & Fitness",
	"Education",
	"Food & Drinks",
	"Travel & Outdoors",
	"Business",
]

function StepExperienceFocus() {
	const { control } = useFormContext<FormValues>()

	const yearsOptions = [
		{ value: "less-than-1", label: "Less than 1 year" },
		{ value: "1-2", label: "1–2 years" },
		{ value: "3-5", label: "3–5 years" },
		{ value: "6-10", label: "6–10 years" },
		{ value: "10+", label: "10+ years" },
	]

	const eventsOptions = [
		{ value: "first", label: "This will be my first" },
		{ value: "1-5", label: "1–5 events" },
		{ value: "6-15", label: "6–15 events" },
		{ value: "16-50", label: "16–50 events" },
		{ value: "50+", label: "50+ events" },
	]

	return (
		<div className="flex flex-col gap-6">
			<Controller
				control={control}
				name="yearsExperience"
				render={({ field }) => (
					<Dropdown
						label="Total years of experience"
						hint="Optional"
						placeholder="How long have you been hosting?"
						options={yearsOptions}
						value={field.value}
						onChange={field.onChange}
						size="md"
					/>
				)}
			/>

			<Controller
				control={control}
				name="eventsHosted"
				render={({ field }) => (
					<Dropdown
						label="Total events hosted till now"
						hint="Optional"
						placeholder="Roughly how many events have you run?"
						options={eventsOptions}
						value={field.value}
						onChange={field.onChange}
						size="md"
					/>
				)}
			/>

			<div className="flex flex-col gap-3">
				<div className="flex items-center justify-between">
					<p className="text-label-sm font-semibold text-text-primary">Interests & focus areas</p>
					<span className="text-caption text-text-muted">Optional · pick all that apply</span>
				</div>
				<Controller
					control={control}
					name="interests"
					render={({ field }) => {
						const selected = field.value ?? []
						function toggle(interest: string) {
							field.onChange(
								selected.includes(interest)
									? selected.filter((i: string) => i !== interest)
									: [...selected, interest],
							)
						}
						return (
							<div className="flex flex-wrap gap-2">
								{INTEREST_OPTIONS.map(interest => {
									const active = selected.includes(interest)
									return (
										<button
											key={interest}
											type="button"
											onClick={() => toggle(interest)}
											className={clsx(
												"px-3.5 py-1.5 rounded-avatar border-2 text-label-sm transition-all duration-(--duration-120)",
												active
													? "border-border-focus bg-surface-brand-soft text-text-brand font-semibold"
													: "border-border-default bg-surface-canvas text-text-secondary hover:border-border-strong",
											)}
										>
											{interest}
										</button>
									)
								})}
							</div>
						)
					}}
				/>
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
				"hello@meetday.com",
			],
			jumpStep: 0,
		},
		{
			label: "Host type",
			icon: DuotoneCalenderSvg,
			details: ["I host events", values.accountType ?? "In-person"],
			jumpStep: 0,
		},
		{
			label: "Profile",
			icon: DuotoneUserHandsSvg,
			details: [values.displayName || values.firstName || "—", "Kolkata, WB"],
			jumpStep: 1,
		},
		{
			label: "Experience & Focus",
			icon: DuotoneStarsSvg,
			details: [
				values.eventsHosted || "—",
				values.yearsExperience || "—",
				values.interests?.length ? values.interests.join(", ") : "—",
			],
			jumpStep: 3,
		},
		{
			label: "Link & KYC",
			icon: DuotoneShieldCheckSvg,
			details: [
				values.instagram ? `Instagram: @${values.instagram}` : "Instagram: —",
				values.pan ? "ID Verified" : "ID Pending",
			],
			jumpStep: 2,
		},
	]

	return (
		<div className="flex flex-col gap-3">
			{sections.map(s => (
				<div
					key={s.label}
					className="flex items-center gap-3 rounded-card border border-border-default bg-surface-canvas px-4 py-4"
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

// ─── Step 5 — Verify payout details ──────────────────────────────────────────

function StepPayoutDetails() {
	const {
		register,
		getValues,
		formState: { errors },
	} = useFormContext<FormValues>()
	const pan = getValues("pan")

	return (
		<div className="flex flex-col gap-5">
			{/* PAN auto-detected card */}
			<div className="flex items-center justify-between rounded-card border border-border-default bg-surface-canvas px-4 py-3">
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
					Verified
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
				Your information is encrypted and secured
			</p>
		</div>
	)
}

// ─── Step 6 — Review payout details ──────────────────────────────────────────

function StepReviewPayout() {
	const { getValues } = useFormContext<FormValues>()
	const v = getValues()

	return (
		<div className="flex flex-col gap-4">
			{/* PAN card */}
			<div className="flex items-center justify-between rounded-card border border-border-default bg-surface-canvas px-4 py-3">
				<div className="flex items-center gap-3">
					<div className="size-10 rounded-badge bg-surface-success-soft flex items-center justify-center shrink-0">
						<Icon as={CardSvg} size="lg" color="success" />
					</div>
					<div>
						<p className="text-label-md text-text-primary font-bold">PAN Auto-detected</p>
						<p className="text-body-sm font-mono text-text-primary">{v.pan || "ABCDE1234F"}</p>
					</div>
				</div>
				<span className="flex items-center gap-1 text-caption font-medium text-text-success bg-surface-success-soft px-2 py-1 rounded-avatar">
					<Icon as={CheckCircleSvg} size="sm" color="success" />
					Verified
				</span>
			</div>

			{/* Bank details */}
			<div className="rounded-card border border-border-default bg-surface-canvas px-4 py-4 flex flex-col gap-3">
				<p className="text-label-md text-text-primary font-semibold">Bank account details</p>
				{[
					{ label: "Account holder name", value: v.accountHolderName },
					{ label: "Account number", value: v.accountNumber },
					{ label: "IFSC Code", value: v.ifscCode },
					{ label: "Bank name", value: v.bankName },
				].map(({ label, value }) => (
					<div key={label} className="flex justify-between items-center">
						<span className="text-caption text-text-secondary">{label}</span>
						<span className="text-body-sm text-text-primary">{value || "—"}</span>
					</div>
				))}
			</div>

			<p className="flex items-center gap-1.5 text-caption text-text-muted">
				<Icon as={LockKeyholeSvg} size="sm" className="opacity-80" />
				Your information is encrypted and never shared quickly.
			</p>
		</div>
	)
}

// ─── Step 8 — Choose your host plan ──────────────────────────────────────────

const PLANS = [
	{
		id: "discover" as const,
		name: "Discover",
		subtitle: "20% Platform fee per ticket",
		price: "Free",
		priceNote: null as string | null,
		highlightFeature: null as string | null,
		features: [
			"Host up to 3 events/month",
			"Community upto 100 people",
			"Basic event tools",
			"Email support",
		],
		recommended: false,
		cta: "Try for free",
	},
	{
		id: "community" as const,
		name: "Community",
		subtitle: "15% Platform fee – billed monthly or yearly",
		price: "₹1,250",
		priceNote: "/month" as string | null,
		highlightFeature: "All Discover features +" as string | null,
		features: [
			"Host unlimited events",
			"Community up to 5,000 people",
			"Ticket & registrations",
			"Custom branding",
			"Priority support",
		],
		recommended: true,
		cta: "Choose Community",
	},
	{
		id: "sell" as const,
		name: "Sell",
		subtitle: "15% Platform fee – yearly billing only",
		price: "₹8,300",
		priceNote: "/month" as string | null,
		highlightFeature: "Everything in Community +" as string | null,
		features: [
			"No platform fees",
			"Advanced analytics",
			"Payouts & Settlements",
			"Dedicated support",
		],
		recommended: false,
		cta: "Choose Sell",
	},
]

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

function StepChoosePlan() {
	const {
		control,
		register,
		formState: { errors },
	} = useFormContext<FormValues>()

	return (
		<div className="flex flex-col gap-5">
			<Controller
				control={control}
				name="plan"
				render={({ field }) => (
					<div className="flex gap-3 py-4">
						{PLANS.map(plan => {
							const selected = field.value === plan.id
							return (
								<div
									key={plan.id}
									role="button"
									tabIndex={0}
									onClick={() => field.onChange(plan.id)}
									onKeyDown={e => (e.key === "Enter" || e.key === " ") && field.onChange(plan.id)}
									className={clsx(
										"flex flex-col rounded-card border-2 text-left flex-1 overflow-hidden cursor-pointer transition-all duration-(--duration-120)",
										plan.recommended && "-my-4",
										selected
											? "border-border-focus bg-surface-brand-soft"
											: plan.recommended
												? "border-action-primary"
												: "border-border-default hover:border-border-strong",
									)}
								>
									{plan.recommended && (
										<div className="bg-action-primary text-text-inverse text-[10px] font-bold uppercase tracking-widest py-1.5 text-center w-full shrink-0">
											Recommended Plan
										</div>
									)}

									<div className="flex flex-col gap-3 px-3 py-4 flex-1">
										<div>
											<p className="text-label-md font-bold text-text-primary">{plan.name}</p>
											<p className="text-[10px] text-text-muted mt-0.5 leading-tight">{plan.subtitle}</p>
											<p className="text-2xl font-extrabold text-text-primary mt-2 leading-none">
												{plan.price}
												{plan.priceNote && (
													<span className="text-caption font-normal text-text-muted"> {plan.priceNote}</span>
												)}
											</p>
										</div>

										<ul className="flex flex-col gap-1.5 flex-1">
											{plan.highlightFeature && (
												<li className="flex items-center gap-1.5">
													<FilledCheckIcon />
													<span className="text-[11px] font-semibold text-text-primary leading-tight">
														{plan.highlightFeature}
													</span>
												</li>
											)}
											{plan.features.map(f => (
												<li key={f} className="flex items-start gap-1.5">
													<OutlineCheckIcon />
													<span className="text-[11px] text-text-secondary leading-tight">{f}</span>
												</li>
											))}
										</ul>

										<div className="mt-2 py-2.5 rounded-avatar bg-[#0a0a0a] text-white text-label-sm font-semibold text-center">
											{plan.cta}
										</div>
									</div>
								</div>
							)
						})}
					</div>
				)}
			/>
			{errors.plan && <p className="text-caption text-text-danger">{errors.plan.message}</p>}

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
		</div>
	)
}

// ─── Step 8 — You're ready to host ───────────────────────────────────────────

const CHECKLIST = [
	"Account created",
	"Profile complete",
	"Experience details added",
	"KYC submitted & approved",
	"Payout method verified",
	"Plan active",
]

const QUICK_ACTIONS = [
	{
		label: "Create Event",
		desc: "Start building an amazing experience",
		icon: CalendarSvg,
		iconBg: "#FFF1F1",
		iconColor: "brand" as const,
		href: "/events/create",
	},
	{
		label: "View dashboard",
		desc: "Explore your overview and insights.",
		icon: ChartSvg,
		iconBg: "#EEF5FF",
		iconColor: "info" as const,
		href: "/dashboard",
	},
	{
		label: "Invite your team",
		desc: "Add team members and collaborate.",
		icon: DiplomaSvg,
		iconBg: "#ECFDF5",
		iconColor: "success" as const,
		href: "/team",
	},
]

function StepSuccess({ onEnter }: { onEnter: () => void }) {
	const router = useRouter()

	return (
		<div className="flex flex-col gap-5">
			{/* Checklist in bordered card */}
			<div className="rounded-card border border-border-default overflow-hidden">
				{CHECKLIST.map((item, i) => (
					<div
						key={item}
						className={clsx(
							"flex items-center justify-between px-4 py-3",
							i < CHECKLIST.length - 1 && "border-b border-border-default",
						)}
					>
						<div className="flex items-center gap-3">
							<CheckIcon />
							<span className="text-body-sm text-text-primary font-semibold">{item}</span>
						</div>
						{i === CHECKLIST.length - 1 && (
							<span className="text-caption font-medium text-text-success bg-surface-success-soft border border-green-200 px-2.5 py-0.5 rounded-avatar">
								Active
							</span>
						)}
					</div>
				))}
			</div>

			{/* CTA */}
			<Button type="button" variant="primary" size="lg" radius="pill" className="w-full" onClick={onEnter}>
				Enter Host OS
				<AltArrowRightSvg className="size-5" aria-hidden />
			</Button>

			{/* Quick actions */}
			<p className="text-body-sm text-text-secondary text-center font-semibold">What would you like to do most?</p>

			<div className="grid grid-cols-3 gap-3">
				{QUICK_ACTIONS.map(a => (
					<div
						key={a.label}
						role="button"
						tabIndex={0}
						onClick={() => router.push(a.href)}
						onKeyDown={e => (e.key === "Enter" || e.key === " ") && router.push(a.href)}
						className="flex items-center gap-3 rounded-card border border-border-default bg-surface-canvas px-3 py-3 cursor-pointer hover:border-border-strong transition-colors"
					>
						<div
							className="size-11 rounded-xl flex items-center justify-center shrink-0"
							style={{ backgroundColor: a.iconBg }}
						>
							<Icon as={a.icon} size="lg" color={a.iconColor} />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-label-sm font-bold text-text-primary">{a.label}</p>
							<p className="text-[11px] text-text-muted leading-tight">{a.desc}</p>
						</div>
						<AltArrowRightSvg className="size-4 text-text-secondary shrink-0" aria-hidden />
					</div>
				))}
			</div>
			<div className="text-center mt-1">
				<p className="text-caption text-text-muted font-semibold">
					You are now part of a community of hosts building connection and impact.
				</p>
				<p className="text-label-sm font-bold text-text-primary mt-1 flex items-center justify-center gap-1.5">
					Let&apos;s go!
					<Icon as={HeartsSvg} size="sm" color="brand" />
				</p>
			</div>
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
	{ full: "You're ready to host 🎉" },
]

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
	const [step, setStep] = useState(0)
	const [submitting, setSubmitting] = useState(false)
	// TODO: restore when API is ready
	// const { user } = useAuth()
	// const { phone, email, clearSession } = useAuthSessionStore()
	const router = useRouter()

	const methods = useForm<FormValues>({
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		resolver: zodResolver(schema) as any,
		defaultValues: {
			firstName: "",
			lastName: "",
			accountType: undefined,
			displayName: "",
			bio: "",
			tagline: "",
			gender: "",
			yearsExperience: "",
			eventsHosted: "",
			interests: [],
			instagram: "",
			linkedin: "",
			youtube: "",
			portfolio: "",
			legalName: "",
			pan: "",
			registeredAddress: "",
			reviewConfirmed: false,
			accountHolderName: "",
			accountNumber: "",
			ifscCode: "",
			bankName: "",
			plan: undefined,
			couponCode: "",
		},
	})

	const { handleSubmit, trigger } = methods
	const TOTAL = STEP_PANEL_CONFIGS.length
	const isLast = step === TOTAL - 1
	const panelConfig = STEP_PANEL_CONFIGS[step]
	const heading = STEP_HEADINGS[step]

	// TODO: pre-fill from session when auth is wired back up

	async function handleNext() {
		if (isLast) {
			router.push("/dashboard")
			return
		}

		const fields = STEP_FIELDS[step]
		if (fields.length > 0) {
			const valid = await trigger(fields as (keyof FormValues)[])
			if (!valid) return
		}

		// TODO: replace mock with real API integration
		if (step === TOTAL - 2) {
			setSubmitting(true)
			await new Promise(r => setTimeout(r, 600))
			toast.success("Profile submitted successfully!")
			setSubmitting(false)
		}

		setStep(s => s + 1)
	}

	const stepComponents = [
		<StepAboutYou key={0} />,
		<StepHostProfile key={1} />,
		<StepLinksLegal key={2} />,
		<StepExperienceFocus key={3} />,
		<StepReviewDetails key={4} onJumpTo={setStep} />,
		<StepPayoutDetails key={5} />,
		<StepReviewPayout key={6} />,
		<StepChoosePlan key={7} />,
		<StepSuccess key={8} onEnter={handleNext} />,
	]

	return (
		<div className="flex h-screen overflow-hidden bg-surface-page">
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
									size="lg"
									radius="pill"
									className="flex-1"
									onClick={() => setStep(s => s - 1)}
									disabled={submitting}
								>
									Back
								</Button>
							)}
							<Button
								type="button"
								variant="primary"
								size="lg"
								radius="pill"
								className="flex-1"
								onClick={handleNext}
								disabled={submitting}
							>
								{submitting ? "Submitting…" : <>{STEP_BUTTON_LABELS[step]} <AltArrowRightSvg className="size-4" aria-hidden /></>}
							</Button>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
