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
import { OnboardingLeftPanel } from "@/components/onboarding/OnboardingLeftPanel"
import { STEP_PANEL_CONFIGS } from "./config"

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
	// Step 1
	firstName: z.string().min(1, "Required"),
	lastName: z.string().min(1, "Required"),
	accountType: z.enum(["Individual", "Business"]).refine((v) => !!v, "Select an option"),
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
	registeredAddress: z.string().optional(),
	// Step 4
	reviewConfirmed: z.boolean().refine((v) => v === true, "Please confirm to continue"),
	// Step 5
	accountHolderName: z.string().min(1, "Required"),
	accountNumber: z.string().min(1, "Required"),
	ifscCode: z.string().min(1, "Required"),
	bankName: z.string().min(1, "Required"),
	// Step 7
	plan: z.enum(["discover", "community", "sell"]).refine((v) => !!v, "Select a plan"),
	couponCode: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const STEP_FIELDS: (keyof FormValues)[][] = [
	["firstName", "lastName", "accountType"],
	[],
	["legalName", "pan"],
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
	"Confirm & review",
	"Submit for review",
	"Save & Continue",
	"Enter Host OS",
]

const STEP_SUBTITLES = [
	"This helps us tailor your meetday experience to fit your goals and style.",
	"This helps us tailor your meetday experience to fit your goals and style.",
	"Help people find you verify your identity. Your information is safe with us.",
	"Take a moment to review everything before we go live",
	"Almost there! Please verify your account to receive payouts.",
	"Almost there! Please verify your account to receive payouts.",
	"Pick the plan that matches your goals. You can upgrade anytime.",
	"Amazing work! Everything is set up and you're all good to go. Let's make your first event one to remember.",
]

// ─── Inline SVG icons for social platforms ───────────────────────────────────

function IgIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" className="size-4 text-icon-muted">
			<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
		</svg>
	)
}

function LinkedInIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" className="size-4 text-icon-muted">
			<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
		</svg>
	)
}

function YoutubeIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" className="size-4 text-icon-muted">
			<path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
		</svg>
	)
}

function GlobeIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="size-4 text-icon-muted">
			<circle cx="12" cy="12" r="10" />
			<path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
		</svg>
	)
}

function CheckIcon() {
	return (
		<svg viewBox="0 0 20 20" fill="currentColor" className="size-5 text-icon-success shrink-0">
			<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
		</svg>
	)
}

function LockIcon() {
	return (
		<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-3.5 text-icon-muted shrink-0">
			<rect x="3" y="7" width="10" height="7" rx="1.5" />
			<path d="M5 7V5a3 3 0 016 0v2" />
		</svg>
	)
}

function PencilIcon() {
	return (
		<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-3.5">
			<path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

// ─── Step 1 — Tell us about you ───────────────────────────────────────────────

function StepAboutYou() {
	const { register, control, formState: { errors } } = useFormContext<FormValues>()

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
				<p className="text-label-md text-text-primary mb-3">What best describes you?</p>
				<Controller
					control={control}
					name="accountType"
					render={({ field }) => (
						<div className="grid grid-cols-2 gap-3">
							{(["Individual", "Business"] as const).map((type) => {
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
													<path d="M2 6l2.5 2.5L10 3.5" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
												</svg>
											</span>
										)}
										<Image
											src={type === "Individual" ? "/onboarding/individual.svg" : "/onboarding/business.svg"}
											alt=""
											width={100}
											height={100}
											className="w-auto"
											aria-hidden
										/>
										<div className="mt-2">
											<p className="text-label-md text-text-primary font-semibold">{type}</p>
											<p className="text-[10px] text-text-secondary mt-0.5">
												{type === "Individual" ? "I host events on my own" : "I represent a company or organization"}
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
					<svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5 shrink-0 text-icon-muted">
						<path fillRule="evenodd" d="M8 15A7 7 0 108 1a7 7 0 000 14zm.75-10a.75.75 0 00-1.5 0v4a.75.75 0 001.5 0V5zm-.75 6.5a.875.875 0 100 1.75.875.875 0 000-1.75z" clipRule="evenodd" />
					</svg>
					Don&apos;t worry - you can change this later. Next steps will adapt to your choice.
				</p>
			</div>
		</div>
	)
}

// ─── Step 2 — Set up your host profile ───────────────────────────────────────

function StepHostProfile() {
	const { register, control, formState: { errors } } = useFormContext<FormValues>()
	const fileRef = useRef<HTMLInputElement>(null)
	const [previewUrl, setPreviewUrl] = useState<string | null>(null)

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		if (!file) return
		const url = URL.createObjectURL(file)
		setPreviewUrl((prev) => {
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
					className="relative flex flex-col items-center justify-center gap-2 w-28 h-28 rounded-image border-2 border-dashed border-border-default bg-surface-canvas hover:border-border-strong transition-colors shrink-0 overflow-hidden"
				>
					{previewUrl ? (
						<Image src={previewUrl} alt="Profile photo preview" fill className="object-cover" />
					) : (
						<>
							<Image src="/icons/onboarding/user.svg" alt="" width={24} height={24} aria-hidden className="opacity-40" />
							<span className="text-[11px] text-text-muted text-center leading-tight px-1">
								Upload photo<br />JPG or PNG, max 5 mb
							</span>
						</>
					)}
				</button>
				<input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleFileChange} />

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
					<label className="text-label-md text-text-primary">Bio</label>
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
	const { register, formState: { errors } } = useFormContext<FormValues>()

	return (
		<div className="flex flex-col gap-5">
			<div className="flex flex-col gap-3">
				<p className="text-label-md text-text-primary">Social media links</p>
				<TextField
					placeholder="instagram.com/yourhandle"
					{...register("instagram")}
					size="md"
					leftIcon={<IgIcon />}
				/>
				<TextField
					placeholder="linkedin.com/in/yourprofile"
					{...register("linkedin")}
					size="md"
					leftIcon={<LinkedInIcon />}
				/>
				<TextField
					placeholder="youtube.com/@yourusername"
					{...register("youtube")}
					size="md"
					leftIcon={<YoutubeIcon />}
				/>
				<TextField
					placeholder="yourwebsite.com"
					{...register("portfolio")}
					size="md"
					leftIcon={<GlobeIcon />}
				/>
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

			<p className="flex items-center gap-1.5 text-caption text-text-muted">
				<LockIcon />
				Your information is encrypted and never shared quickly.
			</p>
		</div>
	)
}

// ─── Step 4 — Review your details ────────────────────────────────────────────

function StepReviewDetails({ onJumpTo }: { onJumpTo: (step: number) => void }) {
	const { getValues, register, formState: { errors } } = useFormContext<FormValues>()
	const values = getValues()

	const sections = [
		{
			label: "Account",
			detail: [values.firstName, values.lastName].filter(Boolean).join(" "),
			jumpStep: 0,
		},
		{
			label: "Host type",
			detail: values.accountType ?? "—",
			jumpStep: 0,
		},
		{
			label: "Profile",
			detail: values.displayName || values.firstName || "—",
			jumpStep: 1,
		},
		{
			label: "Experience & Focus",
			detail: "—",
			jumpStep: 2,
		},
		{
			label: "Link & KYC",
			detail: values.pan ? `PAN: ${values.pan}` : "—",
			jumpStep: 2,
		},
	]

	return (
		<div className="flex flex-col gap-4">
			{sections.map((s) => (
				<div
					key={s.label}
					className="flex items-center justify-between rounded-card border border-border-default bg-surface-canvas px-4 py-3"
				>
					<div className="min-w-0">
						<p className="text-label-sm text-text-secondary">{s.label}</p>
						<p className="text-body-sm text-text-primary truncate">{s.detail}</p>
					</div>
					<button
						type="button"
						onClick={() => onJumpTo(s.jumpStep)}
						className="ml-4 flex items-center gap-1 text-caption text-text-brand hover:underline shrink-0"
					>
						Edit <PencilIcon />
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
					I confirm that all the information above is accurate and correct
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
	const { register, getValues, formState: { errors } } = useFormContext<FormValues>()
	const pan = getValues("pan")

	return (
		<div className="flex flex-col gap-5">
			{/* PAN auto-detected card */}
			<div className="flex items-center justify-between rounded-card border border-border-default bg-surface-canvas px-4 py-3">
				<div className="flex items-center gap-3">
					<div className="size-8 rounded-badge bg-surface-success-soft flex items-center justify-center shrink-0">
						<Image src="/icons/onboarding/check-circle.svg" alt="" width={16} height={16} aria-hidden />
					</div>
					<div>
						<p className="text-label-sm text-text-secondary">PAN Auto-detected</p>
						<p className="text-body-sm font-mono text-text-primary">{pan || "ABCDE1234F"}</p>
					</div>
				</div>
				<span className="flex items-center gap-1 text-caption font-medium text-text-success bg-surface-success-soft px-2 py-1 rounded-avatar">
					<svg viewBox="0 0 12 12" fill="none" className="size-3">
						<path d="M2 6l2.5 2.5L10 3.5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
					</svg>
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
				<LockIcon />
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
					<div className="size-8 rounded-badge bg-surface-success-soft flex items-center justify-center shrink-0">
						<Image src="/icons/onboarding/check-circle.svg" alt="" width={16} height={16} aria-hidden />
					</div>
					<div>
						<p className="text-label-sm text-text-secondary">PAN Auto-detected</p>
						<p className="text-body-sm font-mono text-text-primary">{v.pan || "ABCDE1234F"}</p>
					</div>
				</div>
				<span className="flex items-center gap-1 text-caption font-medium text-text-success bg-surface-success-soft px-2 py-1 rounded-avatar">
					<svg viewBox="0 0 12 12" fill="none" className="size-3">
						<path d="M2 6l2.5 2.5L10 3.5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
					</svg>
					Verified
				</span>
			</div>

			{/* Bank details */}
			<div className="rounded-card border border-border-default bg-surface-canvas px-4 py-4 flex flex-col gap-3">
				<p className="text-label-sm text-text-secondary font-semibold">Bank account details</p>
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
				<LockIcon />
				Your information is encrypted and never shared quickly.
			</p>
		</div>
	)
}

// ─── Step 7 — Choose your host plan ──────────────────────────────────────────

const PLANS = [
	{
		id: "discover" as const,
		name: "Discover",
		price: "Free",
		priceNote: "No credit card required",
		features: ["Host up to 3 Events/Month", "Host unlimited events", "Basic event tools", "Email support"],
		recommended: false,
		cta: "Try for free",
	},
	{
		id: "community" as const,
		name: "Community",
		price: "₹1,250",
		priceNote: "/month",
		features: ["Host unlimited events", "Community up to 5,000 people", "Ticket & registrations", "Custom branding", "Priority support"],
		recommended: true,
		cta: "Choose Community",
	},
	{
		id: "sell" as const,
		name: "Sell",
		price: "₹8,300",
		priceNote: "/month",
		features: ["Everything in Community +", "No platform fees", "Advanced analytics", "Payouts & Settlements", "Dedicated support"],
		recommended: false,
		cta: "Choose Sell",
	},
]

function StepChoosePlan() {
	const { control, register, formState: { errors } } = useFormContext<FormValues>()

	return (
		<div className="flex flex-col gap-5">
			<Controller
				control={control}
				name="plan"
				render={({ field }) => (
					<div className="grid grid-cols-3 gap-3">
						{PLANS.map((plan) => {
							const selected = field.value === plan.id
							return (
								<button
									key={plan.id}
									type="button"
									onClick={() => field.onChange(plan.id)}
									className={clsx(
										"relative flex flex-col gap-3 rounded-card border-2 px-3 py-4 text-left transition-all duration-(--duration-120)",
										selected
											? "border-border-focus bg-surface-brand-soft"
											: plan.recommended
												? "border-border-brand"
												: "border-border-default hover:border-border-strong",
									)}
								>
									{plan.recommended && (
										<span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-action-primary text-text-inverse text-[10px] font-semibold px-2 py-0.5 rounded-avatar whitespace-nowrap">
											RECOMMENDED
										</span>
									)}
									<div>
										<p className="text-label-md text-text-primary">{plan.name}</p>
										<p className="text-title-md font-bold text-text-primary mt-0.5">
											{plan.price}
											<span className="text-caption text-text-muted">{plan.priceNote}</span>
										</p>
									</div>
									<ul className="flex flex-col gap-1.5">
										{plan.features.map((f) => (
											<li key={f} className="flex items-start gap-1.5">
												<svg viewBox="0 0 12 12" fill="none" className="size-3 mt-0.5 shrink-0 text-icon-success">
													<path d="M2 6l2.5 2.5L10 3.5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
												</svg>
												<span className="text-[11px] text-text-secondary leading-tight">{f}</span>
											</li>
										))}
									</ul>
								</button>
							)
						})}
					</div>
				)}
			/>
			{errors.plan && (
				<p className="text-caption text-text-danger">{errors.plan.message}</p>
			)}

			<TextField
				label="Coupon code"
				placeholder="e.g. FAST100/BIG50"
				{...register("couponCode")}
				size="md"
			/>
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
	{ label: "Create Event", desc: "Start building an amazing experience" },
	{ label: "View dashboard", desc: "Explore your overview and insights" },
	{ label: "Invite your team", desc: "Add team members and collaborate" },
]

function StepSuccess() {
	return (
		<div className="flex flex-col gap-5">
			<div className="flex flex-col gap-3">
				{CHECKLIST.map((item, i) => (
					<div key={item} className="flex items-center justify-between">
						<div className="flex items-center gap-2.5">
							<CheckIcon />
							<span className="text-body-sm text-text-primary">{item}</span>
						</div>
						{i === CHECKLIST.length - 1 && (
							<span className="text-caption font-medium text-text-success bg-surface-success-soft px-2 py-0.5 rounded-avatar">Active</span>
						)}
					</div>
				))}
			</div>

			<div className="grid grid-cols-3 gap-3 mt-2">
				{QUICK_ACTIONS.map((a) => (
					<div key={a.label} className="flex flex-col gap-1 rounded-card border border-border-default bg-surface-canvas px-3 py-3 cursor-pointer hover:border-border-strong transition-colors">
						<p className="text-label-sm text-text-primary">{a.label}</p>
						<p className="text-[11px] text-text-muted leading-tight">{a.desc}</p>
					</div>
				))}
			</div>

			<p className="text-caption text-text-muted text-center">
				You are now part of a community of hosts building connection and impact. Let&apos;s go! ❤️
			</p>
		</div>
	)
}

// ─── Step heading config ──────────────────────────────────────────────────────

type HeadingConfig =
	| { plain: string; highlight: string }
	| { full: string }

const STEP_HEADINGS: HeadingConfig[] = [
	{ plain: "Tell us", highlight: "about you" },
	{ plain: "Set up your", highlight: "host profile" },
	{ full: "Links & legal details" },
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
			await new Promise((r) => setTimeout(r, 600))
			toast.success("Profile submitted successfully!")
			setSubmitting(false)
		}

		setStep((s) => s + 1)
	}

	const stepComponents = [
		<StepAboutYou key={0} />,
		<StepHostProfile key={1} />,
		<StepLinksLegal key={2} />,
		<StepReviewDetails key={3} onJumpTo={setStep} />,
		<StepPayoutDetails key={4} />,
		<StepReviewPayout key={5} />,
		<StepChoosePlan key={6} />,
		<StepSuccess key={7} />,
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
					<div className="w-full max-w-140 mx-auto px-8 pt-7 pb-5 flex items-center gap-3">
						<div className="flex-1 h-3 bg-border-default rounded-full overflow-hidden">
							<div
								className="h-full bg-action-primary rounded-full transition-all duration-300"
								style={{ width: `${((step + 1) / TOTAL) * 100}%` }}
							/>
						</div>
						<span className="text-body-sm text-text-primary font-semibold shrink-0">Step {step + 1} of {TOTAL}</span>
					</div>
				</div>

				{/* Form content */}
				<div className="flex-1 w-full max-w-140 mx-auto px-8 py-8">
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
					<div className="flex gap-3 mt-8">
						{step > 0 && step < TOTAL - 1 && (
							<Button
								type="button"
								variant="secondary"
								size="lg"
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
							size="lg"
							radius="pill"
							className="flex-1"
							onClick={handleNext}
							disabled={submitting}
						>
							{submitting ? "Submitting…" : `${STEP_BUTTON_LABELS[step]} →`}
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
