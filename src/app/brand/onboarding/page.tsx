"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { ApiError, getApiErrorMessage } from "@/lib/errors"
import { registerBrand, getBrandProfile, type BrandRegisterPayload } from "@/lib/api"
import { useHostStore } from "@/store/hostStore"
import { useAuthSessionStore, useAuthSessionHydrated } from "@/store/authSessionStore"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/Button"
import { TextField } from "@/components/ui/TextField"
import { Icon } from "@/components/ui/Icon"
import { OnboardingLeftPanel } from "@/components/onboarding/OnboardingLeftPanel"
import DangerTriangleSvg from "@/icons/outlined/danger-triangle.svg"

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = z.object({
	email: z.string().email("Enter a valid email address"),
	brandName: z.string().min(1, "Brand name is required"),
	phone: z
		.string()
		.min(10, "Enter a valid 10-digit phone number")
		.max(10, "Enter a valid 10-digit phone number")
		.regex(/^\d+$/, "Phone number must contain only digits"),
})

type FormValues = z.infer<typeof schema>

function buildBrandRegisterPayload(values: FormValues, sessionPhone?: string): BrandRegisterPayload {
	const phone = sessionPhone || (values.phone ? `+91${values.phone}` : undefined)
	return {
		firstName: "Brand",
		lastName: values.brandName,
		email: values.email,
		phone,
		accountType: "BRAND",
		brandName: values.brandName,
	}
}

const PANEL_CONFIG = {
	headingPlain: "Set up your",
	headingHighlight: "brand profile",
	description: "Add your email and brand name to start browsing sponsorship opportunities from event hosts.",
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
}

export default function OnboardingPage() {
	const [loadingMessage, setLoadingMessage] = useState<string | null>(null)
	const { phone, email: sessionEmail, clearSession } = useAuthSessionStore()
	const sessionHydrated = useAuthSessionHydrated()
	const { signOut } = useAuth()
	const { setProfile } = useHostStore()
	const router = useRouter()

	// Guard: only reachable from signup flow — wait for the persisted session to hydrate
	// before checking, otherwise a hard refresh reads stale empty defaults and bounces
	// an in-progress signup back to /brand/signup.
	useEffect(() => {
		if (!sessionHydrated) return
		if (!phone && !sessionEmail) {
			router.replace("/brand/signup")
		}
	}, [sessionHydrated, phone, sessionEmail, router])

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			email: sessionEmail || "",
			brandName: "",
			phone: "",
		},
	})

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

			// A 409 above is only truly "safe to ignore" when it's this same Firebase
			// identity re-submitting. If the email actually belongs to a different account,
			// this identity still has no BrandProfile — don't silently push to a dashboard
			// that will just 404-loop.
			try {
				const profile = await getBrandProfile()
				setProfile(profile)
				clearSession()
				router.push("/brand/dashboard")
			} catch {
				toast.error(
					"This email is already linked to a different account. Please use a different one, or log in instead.",
				)
			}
		} catch (e) {
			toast.error(getApiErrorMessage(e))
		} finally {
			setLoadingMessage(null)
		}
	}

	return (
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
				<div className="flex-1 w-full max-w-175 mx-auto px-8 py-8">
					<button
						type="button"
						onClick={async () => {
							// Sign out first — otherwise the login page's own "already authenticated"
							// guard immediately bounces back to a dashboard with no profile yet.
							clearSession()
							await signOut()
							router.replace("/brand/login")
						}}
						className="inline-flex items-center gap-1.5 text-xs font-bold text-text-tertiary hover:text-text-primary transition-colors mb-4"
					>
						<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
						</svg>
						Back to login
					</button>
					<div className="mb-6">
						<h1 className="text-heading-md text-text-primary leading-tight">
							Set up your <span className="text-text-brand">brand profile</span>
						</h1>
						<p className="text-body-sm text-text-secondary mt-2">
							Just your email and brand name — that&apos;s all we need to get you started.
						</p>
					</div>

					<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
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
							label="Brand name"
							placeholder="Enter your brand or agency name"
							{...register("brandName")}
							error={!!errors.brandName}
							helperText={errors.brandName?.message}
							size="md"
						/>

						<TextField
							label="Phone number"
							placeholder="98765 43210"
							hint="We use this to reach you about your brand account"
							{...register("phone")}
							error={!!errors.phone}
							helperText={errors.phone?.message}
							size="md"
						/>

						<div className="flex justify-end gap-3 pt-4 border-t border-border-default">
							<Button type="submit" variant="primary" size="md">
								Submit
							</Button>
						</div>
					</form>
				</div>
			</div>
		</div>
	)
}

