"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { ApiError, getApiErrorMessage } from "@/lib/errors"
import { registerBrand, getBrandProfile, type BrandRegisterPayload } from "@/lib/api"
import { useBrandStore } from "@/store/brandStore"
import { useAuthSessionStore, useAuthSessionHydrated } from "@/store/authSessionStore"
import { useAuth } from "@/context/AuthContext"
import { AuthShell } from "@/components/auth/AuthShell"
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

export default function OnboardingPage() {
	const [loadingMessage, setLoadingMessage] = useState<string | null>(null)
	const { phone, email: sessionEmail, clearSession } = useAuthSessionStore()
	const sessionHydrated = useAuthSessionHydrated()
	const { signOut } = useAuth()
	const { setProfile } = useBrandStore()
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
		<AuthShell>
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

			<button
				type="button"
				onClick={async () => {
					// Sign out first — otherwise the login page's own "already authenticated"
					// guard immediately bounces back to a dashboard with no profile yet.
					clearSession()
					await signOut()
					router.replace("/brand/login")
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
						Set up your Brand profile
					</h2>
					<p className="text-sm font-semibold text-black/60 max-w-xs mx-auto leading-relaxed">
						Just your email and brand name — that&apos;s all we need to get you started.
					</p>
				</div>

				<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-6">
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

					<Button
						type="submit"
						variant="primary"
						size="md"
						radius="pill"
						className="w-full py-4 mt-4 bg-[#EE2C2C] text-white border-[3px] border-black rounded-2xl font-extrabold text-center shadow-[4px_4px_0px_0px_#FFC940] hover:shadow-[1px_1px_0px_0px_#FFC940] hover:translate-x-[3px] hover:translate-y-[3px] transition-all text-base tracking-wider"
						disabled={!!loadingMessage}
					>
						{loadingMessage ? "Please wait…" : "Submit"}
					</Button>
				</form>

				{/* Bottom Section: Indicator Dots */}
				<div className="flex gap-2 justify-center items-center mt-6 mb-2">
					<span className="w-2 h-2 bg-black/15 rounded-full" />
					<span className="w-2 h-2 bg-black/15 rounded-full" />
					<span className="w-2 h-2 bg-black/15 rounded-full" />
					<span className="w-5 h-2 bg-[#EE2C2C] rounded-full transition-all" />
				</div>
			</div>
		</AuthShell>
	)
}

