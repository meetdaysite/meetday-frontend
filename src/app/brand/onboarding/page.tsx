"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useForm, FormProvider, Controller, useFormContext } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { ApiError, getApiErrorMessage } from "@/lib/errors"
import clsx from "clsx"
import {
	registerBrand,
	getCategories,
	getBrandProfile,
	type Category,
	type BrandRegisterPayload,
} from "@/lib/api"
import { useHostStore } from "@/store/hostStore"
import { useAuthSessionStore } from "@/store/authSessionStore"
import { Button } from "@/components/ui/Button"
import { TextField } from "@/components/ui/TextField"
import { Icon } from "@/components/ui/Icon"
import { OnboardingLeftPanel } from "@/components/onboarding/OnboardingLeftPanel"
import DangerTriangleSvg from "@/icons/outlined/danger-triangle.svg"
import InstagramSvg from "@/icons/socials/instagram.svg"
import LinkedinSvg from "@/icons/socials/linkedin.svg"
import YoutubeSvg from "@/icons/socials/youtube.svg"
import LinkSvg from "@/icons/socials/link.svg"

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = z.object({
	// Step 1
	name: z.string().min(1, "Name is required"),
	designation: z.string().min(1, "Designation is required"),
	email: z.string().email("Enter a valid email address"),
	mobile: z
		.string()
		.min(10, "Enter a valid 10-digit mobile number")
		.max(10, "Enter a valid 10-digit mobile number")
		.regex(/^\d+$/, "Mobile number must contain only digits"),

	// Step 2
	brandName: z.string().min(1, "Brand name is required"),
	categoryIds: z.array(z.string()).min(1, "Select at least one industry"),
	portfolio: z.string().optional(),
	instagram: z.string().optional(),
	linkedin: z.string().optional(),
	youtube: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

function buildBrandRegisterPayload(values: FormValues, phone?: string): BrandRegisterPayload {
	const parts = values.name.trim().split(/\s+/)
	const firstName = parts[0] || "Brand"
	const lastName = parts.slice(1).join(" ") || "."

	return {
		firstName,
		lastName,
		email: values.email,
		phone: values.mobile ? `+91${values.mobile}` : (phone || undefined), // assumes +91 dial code for simplicity or uses phone
		accountType: "BRAND",
		hostType: "BUSINESS",
		displayName: values.brandName,
		tagline: values.designation,
		categoryIds: values.categoryIds ?? [],
		yearsOfExperience: 0,
		totalEventsPreviouslyHosted: 0,
		operatingCities: [],
		socialLinks: {
			instagram: values.instagram || undefined,
			linkedin: values.linkedin || undefined,
			youtube: values.youtube || undefined,
			website: values.portfolio || undefined,
		},
	}
}

// Left panel configuration for Step 1 and Step 2
const PANEL_CONFIGS = [
	{
		headingPlain: "Tell us about",
		headingHighlight: "yourself",
		description: "Provide your basic contact information and designation so event hosts know who they are connecting with.",
		personImage: "/onboarding/person-2.png",
		cards: [
			{
				icon: "/icons/onboarding/shield-check.svg",
				iconBg: "#EFF6FF",
				title: "Trusted Profile",
				body: "Verified contact details build trust.",
				position: { bottom: "44%", left: "4%" } as React.CSSProperties,
			},
		],
	},
	{
		headingPlain: "Set up your",
		headingHighlight: "brand profile",
		description: "Introduce your brand or agency, add your links and pick your categories to get matched to the right events.",
		personImage: "/onboarding/person-3.png",
		cards: [
			{
				icon: "/icons/onboarding/users-group-two.svg",
				iconBg: "#FEF2F2",
				title: "Grow your presence",
				body: "Scale your offline marketing campaigns.",
				position: { top: "38%", right: "6%" } as React.CSSProperties,
			},
		],
	},
]

export default function OnboardingPage() {
	const [step, setStep] = useState(1)
	const [loadingMessage, setLoadingMessage] = useState<string | null>(null)
	const [categories, setCategories] = useState<Category[]>([])
	const { phone, email: sessionEmail, clearSession } = useAuthSessionStore()
	const { setProfile } = useHostStore()
	const router = useRouter()

	// Guard: only reachable from signup flow
	useEffect(() => {
		if (!phone && !sessionEmail) {
			router.replace("/brand/signup")
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// Fetch categories on mount
	useEffect(() => {
		let cancelled = false
		getCategories().then(cats => {
			if (!cancelled) setCategories(cats)
		}).catch(() => {
			if (!cancelled) toast.error("Failed to load category data.")
		})
		return () => { cancelled = true }
	}, [])

	// Parse initial phone from session (remove dial code if present)
	const initialPhone = phone ? (phone.startsWith("+91") ? phone.slice(3) : phone) : ""

	const methods = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			name: "",
			designation: "",
			email: sessionEmail || "",
			mobile: initialPhone,
			brandName: "",
			instagram: "",
			linkedin: "",
			youtube: "",
			portfolio: "",
			categoryIds: [],
		},
	})

	const { handleSubmit, trigger, formState: { errors } } = methods
	const isEmailReadOnly = !!sessionEmail
	const isMobileReadOnly = !!phone

	const handleNext = async () => {
		const isStep1Valid = await trigger(["name", "designation", "email", "mobile"])
		if (isStep1Valid) {
			setStep(2)
		}
	}

	const handleBack = () => {
		setStep(1)
	}

	async function onSubmit(values: FormValues) {
		setLoadingMessage("Setting up your brand profile…")
		try {
			try {
				await registerBrand(buildBrandRegisterPayload(values, phone))
			} catch (e) {
				// 409 = brand already registered — treat as success
				if (!(e instanceof ApiError && e.statusCode === 409)) throw e
			}

			try {
				const profile = await getBrandProfile()
				setProfile(profile)
			} catch {
				// profile fetch failure shouldn't block navigation
			}
			clearSession()
			router.push("/brand/dashboard")
		} catch (e) {
			toast.error(getApiErrorMessage(e))
		} finally {
			setLoadingMessage(null)
		}
	}

	const currentPanelConfig = PANEL_CONFIGS[step - 1] || PANEL_CONFIGS[0]

	return (
		<FormProvider {...methods}>
			<div className="flex h-screen overflow-hidden bg-surface-page">
				{/* Loading overlay */}
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

				{/* Left panel */}
				<div className="hidden lg:block w-[44%] max-w-200 shrink-0 relative">
					<OnboardingLeftPanel config={currentPanelConfig} />
				</div>

				{/* Right panel */}
				<div className="flex-1 overflow-y-auto bg-surface-card flex flex-col">
					{/* Progress bar */}
					<div className="shrink-0">
						<div className="w-full max-w-175 mx-auto px-8 pt-7 pb-5 flex items-center gap-3">
							<div className="flex-1 h-3 bg-border-default rounded-full overflow-hidden">
								<div
									className="h-full bg-action-primary rounded-full transition-all duration-300"
									style={{ width: step === 1 ? "50%" : "100%" }}
								/>
							</div>
							<span className="text-body-sm text-text-primary font-semibold shrink-0">
								Step {step} of 2
							</span>
						</div>
					</div>

					{/* Form content */}
					<div className="flex-1 w-full max-w-175 mx-auto px-8 py-8">
						{step === 1 ? (
							<>
								<div className="mb-6">
									<h1 className="text-heading-md text-text-primary leading-tight">
										Tell us about <span className="text-text-brand">yourself</span>
									</h1>
									<p className="text-body-sm text-text-secondary mt-2">
										Provide your personal details to get started.
									</p>
								</div>

								<div className="flex flex-col gap-6">
									<Step1Fields
										isEmailReadOnly={isEmailReadOnly}
										isMobileReadOnly={isMobileReadOnly}
									/>

									<div className="flex justify-end gap-3 pt-4 border-t border-border-default">
										<Button type="button" variant="primary" size="md" onClick={handleNext}>
											Next
										</Button>
									</div>
								</div>
							</>
						) : (
							<>
								<div className="mb-6">
									<h1 className="text-heading-md text-text-primary leading-tight">
										Set up your <span className="text-text-brand">brand profile</span>
									</h1>
									<p className="text-body-sm text-text-secondary mt-2">
										Provide your basic brand details and social links to complete onboarding.
									</p>
								</div>

								<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
									<Step2Fields categories={categories} />

									<div className="flex justify-between gap-3 pt-4 border-t border-border-default">
										<Button type="button" variant="secondary" size="md" onClick={handleBack}>
											Back
										</Button>
										<Button type="submit" variant="primary" size="md">
											Submit
										</Button>
									</div>
								</form>
							</>
						)}
					</div>
				</div>
			</div>
		</FormProvider>
	)
}

function Step1Fields({
	isEmailReadOnly,
	isMobileReadOnly,
}: {
	isEmailReadOnly: boolean
	isMobileReadOnly: boolean
}) {
	const { register, formState: { errors } } = useFormContext<FormValues>()

	return (
		<div className="flex flex-col gap-6">
			<TextField
				label="Name"
				placeholder="Enter your full name"
				{...register("name")}
				error={!!errors.name}
				helperText={errors.name?.message}
				size="md"
			/>

			<TextField
				label="Designation"
				placeholder="Enter your designation (e.g. Marketing Manager)"
				{...register("designation")}
				error={!!errors.designation}
				helperText={errors.designation?.message}
				size="md"
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
				hint={isEmailReadOnly ? "From your account session" : undefined}
			/>

			<TextField
				label="Mobile number"
				placeholder="Enter 10-digit mobile number"
				type="tel"
				{...register("mobile")}
				error={!!errors.mobile}
				helperText={errors.mobile?.message}
				size="md"
				disabled={isMobileReadOnly}
				hint={isMobileReadOnly ? "From your verified phone" : undefined}
			/>
		</div>
	)
}

function Step2Fields({ categories }: { categories: Category[] }) {
	const { register, control, formState: { errors } } = useFormContext<FormValues>()

	return (
		<div className="flex flex-col gap-6">
			<TextField
				label="Brand name"
				placeholder="Enter your brand or agency name"
				{...register("brandName")}
				error={!!errors.brandName}
				helperText={errors.brandName?.message}
				size="md"
			/>

			{/* Industry focus areas */}
			<div className="flex flex-col gap-3">
				<div className="flex items-center justify-between">
					<p className="text-label-sm font-semibold text-text-primary">Industry</p>
					<span className="text-caption text-text-muted font-normal">(Pick all that apply)</span>
				</div>
				{categories.length === 0 ? (
					<p className="text-caption text-text-muted">Loading industries…</p>
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

			<div className="flex flex-col gap-3">
				<p className="text-label-sm font-semibold text-text-primary">Social media links & Website</p>
				
				<div className="flex justify-center items-center gap-2">
					<div className="border border-border-default p-2 rounded-xl bg-action-secondary-hover">
						<Icon as={LinkSvg} size="lg" />
					</div>
					<TextField
						placeholder="yourwebsite.com (Website)"
						{...register("portfolio")}
						size="md"
						className="flex-1"
					/>
				</div>

				<div className="flex justify-center items-center gap-2">
					<div className="border border-border-default p-2 rounded-xl bg-action-secondary-hover">
						<Icon as={InstagramSvg} size="lg" />
					</div>
					<TextField
						placeholder="instagram.com/yourhandle (Instagram)"
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
						placeholder="linkedin.com/in/yourprofile (LinkedIn)"
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
						placeholder="youtube.com/@yourusername (YouTube)"
						{...register("youtube")}
						size="md"
						className="flex-1"
					/>
				</div>
			</div>
		</div>
	)
}
