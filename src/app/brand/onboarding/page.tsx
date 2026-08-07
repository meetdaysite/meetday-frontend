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
import { useAuthSessionStore } from "@/store/authSessionStore"
import { Button } from "@/components/ui/Button"
import { TextField } from "@/components/ui/TextField"
import { Icon } from "@/components/ui/Icon"
import { OnboardingLeftPanel } from "@/components/onboarding/OnboardingLeftPanel"
import DangerTriangleSvg from "@/icons/outlined/danger-triangle.svg"

// ─── Schema ───────────────────────────────────────────────────────────────────
// Minimal brand onboarding: phone is already captured via OTP during signup, so we
// only need an email address and the brand name here.
const schema = z.object({
	email: z.string().email("Enter a valid email address"),
	brandName: z.string().min(1, "Brand name is required"),
})

type FormValues = z.infer<typeof schema>

function buildBrandRegisterPayload(values: FormValues, phone?: string): BrandRegisterPayload {
	return {
		firstName: "Brand",
		lastName: values.brandName,
		email: values.email,
		phone: phone || undefined,
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
	const { setProfile } = useHostStore()
	const router = useRouter()

	// Guard: only reachable from signup flow
	useEffect(() => {
		if (!phone && !sessionEmail) {
			router.replace("/brand/signup")
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			email: sessionEmail || "",
			brandName: "",
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

