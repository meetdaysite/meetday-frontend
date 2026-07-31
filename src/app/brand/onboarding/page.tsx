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
	brandName: z.string().min(1, "Brand name is required"),
	email: z.string().email("Enter a valid email address"),
	instagram: z.string().optional(),
	linkedin: z.string().optional(),
	youtube: z.string().optional(),
	portfolio: z.string().optional(),
	categoryIds: z.array(z.string()).min(1, "Select at least one category"),
})

type FormValues = z.infer<typeof schema>

function buildBrandRegisterPayload(values: FormValues, phone?: string): BrandRegisterPayload {
	const parts = values.brandName.trim().split(/\s+/)
	const firstName = parts[0] || "Brand"
	const lastName = parts.slice(1).join(" ") || "Name"

	return {
		firstName,
		lastName,
		email: values.email,
		phone: phone || undefined,
		accountType: "BRAND",
		hostType: "BUSINESS",
		displayName: values.brandName,
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

// Left panel configuration
const PANEL_CONFIG = {
	headingPlain: "Set up your",
	headingHighlight: "brand profile",
	description: "Introduce your brand or agency, add your links and pick your categories to get matched to the right events.",
	personImage: "/onboarding/person-2.png",
	cards: [
		{
			icon: "/icons/onboarding/shield-check.svg",
			iconBg: "#EFF6FF",
			title: "Connect with events",
			body: "Get discovered by verified event hosts.",
			position: { bottom: "44%", left: "4%" } as React.CSSProperties,
		},
		{
			icon: "/icons/onboarding/users-group-two.svg",
			iconBg: "#FEF2F2",
			title: "Grow your presence",
			body: "Scale your offline marketing campaigns.",
			position: { top: "38%", right: "6%" } as React.CSSProperties,
		},
	],
}

export default function OnboardingPage() {
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

	const methods = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			brandName: "",
			email: sessionEmail || "",
			instagram: "",
			linkedin: "",
			youtube: "",
			portfolio: "",
			categoryIds: [],
		},
	})

	const { handleSubmit, formState: { errors } } = methods
	const isEmailReadOnly = !!sessionEmail

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
					<OnboardingLeftPanel config={PANEL_CONFIG} />
				</div>

				{/* Right panel */}
				<div className="flex-1 overflow-y-auto bg-surface-card flex flex-col">
					{/* Progress bar */}
					<div className="shrink-0">
						<div className="w-full max-w-175 mx-auto px-8 pt-7 pb-5 flex items-center gap-3">
							<div className="flex-1 h-3 bg-border-default rounded-full overflow-hidden">
								<div className="h-full bg-action-primary rounded-full" style={{ width: "100%" }} />
							</div>
							<span className="text-body-sm text-text-primary font-semibold shrink-0">
								Step 1 of 1
							</span>
						</div>
					</div>

					{/* Form content */}
					<div className="flex-1 w-full max-w-175 mx-auto px-8 py-8">
						<div className="mb-6">
							<h1 className="text-heading-md text-text-primary leading-tight">
								Set up your <span className="text-text-brand">brand profile</span>
							</h1>
							<p className="text-body-sm text-text-secondary mt-2">
								Provide your basic brand details and social links to complete onboarding.
							</p>
						</div>

						<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
							<StepBrandOnboarding isEmailReadOnly={isEmailReadOnly} categories={categories} />

							<div className="flex justify-end gap-3 pt-4 border-t border-border-default">
								<Button type="submit" variant="primary" size="md">
									Submit
								</Button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</FormProvider>
	)
}

function StepBrandOnboarding({ isEmailReadOnly, categories }: { isEmailReadOnly: boolean; categories: Category[] }) {
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

			{/* Categories focus areas */}
			<div className="flex flex-col gap-3">
				<div className="flex items-center justify-between">
					<p className="text-label-sm font-semibold text-text-primary">Categories</p>
					<span className="text-caption text-text-muted font-normal">(Pick all that apply)</span>
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
		</div>
	)
}
