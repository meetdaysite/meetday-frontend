"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import clsx from "clsx"
import { toast } from "sonner"
import { ApiError, getApiErrorMessage } from "@/lib/errors"
import { registerSpace, getSpaceProfile } from "@/lib/api"
import { useSpaceStore } from "@/store/spaceStore"
import { useAuthSessionStore, useAuthSessionHydrated } from "@/store/authSessionStore"
import { useAuth } from "@/context/AuthContext"
import { AuthShell } from "@/components/auth/AuthShell"
import { Button } from "@/components/ui/Button"
import { TextField } from "@/components/ui/TextField"
import { PhoneField } from "@/components/auth/PhoneField"
import { CityTagPicker } from "@/components/ui/CityTagPicker"
import { DEFAULT_COUNTRY, type Country } from "@/lib/countries"

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="bg-surface-card border border-border-default rounded-action px-5 py-5">
			<h2 className="text-label-lg font-semibold text-text-primary mb-4">{title}</h2>
			{children}
		</div>
	)
}

export default function SpacesOnboardingPage() {
	const [loadingMessage, setLoadingMessage] = useState<string | null>(null)
	const { email: sessionEmail, displayName, redirectTo, clearSession } = useAuthSessionStore()
	const sessionHydrated = useAuthSessionHydrated()
	const { signOut } = useAuth()
	const { setProfile } = useSpaceStore()
	const router = useRouter()

	// Initial name parsing from Google displayName
	const [firstName, setFirstName] = useState("")
	const [lastName, setLastName] = useState("")
	const [businessName, setBusinessName] = useState("")
	const [operatingCities, setOperatingCities] = useState<string[]>([])
	const [phone, setPhone] = useState("")
	const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY)

	// Validation error states
	const [errors, setErrors] = useState<{
		firstName?: string
		lastName?: string
		businessName?: string
		operatingCities?: string
		phone?: string
	}>({})

	// Guard: only reachable from signup/oauth flow
	useEffect(() => {
		if (!sessionHydrated) return
		if (!sessionEmail) {
			router.replace("/spaces/signup")
		}
	}, [sessionHydrated, sessionEmail, router])

	// Populate initial names once session hydrates
	useEffect(() => {
		if (displayName && !firstName && !lastName) {
			const parts = displayName.trim().split(" ")
			if (parts.length > 0) {
				setFirstName(parts[0])
				if (parts.length > 1) {
					setLastName(parts.slice(1).join(" "))
				}
			}
		}
	}, [displayName, firstName, lastName])

	function validate() {
		const newErrors: typeof errors = {}
		if (!firstName.trim()) newErrors.firstName = "First name is required"
		if (!lastName.trim()) newErrors.lastName = "Last name is required"
		if (!businessName.trim()) newErrors.businessName = "Business name / Venue chain is required"
		if (operatingCities.length === 0) newErrors.operatingCities = "Please select or type at least one operating city"
		if (!phone.trim() || phone.length < 7) newErrors.phone = "Please enter a valid phone number"

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	async function handleSubmit() {
		if (!validate()) return

		setLoadingMessage("Creating your Hub Partner account…")
		try {
			const fullPhone = `${country.dialCode}${phone.trim()}`
			try {
				await registerSpace({
					firstName: firstName.trim(),
					lastName: lastName.trim(),
					email: sessionEmail || "",
					phone: fullPhone,
					accountType: "SPACE",
					businessName: businessName.trim(),
					operatingCities,
				})
			} catch (e) {
				// If 409, user/profile may already exist or be linked
				if (!(e instanceof ApiError && e.statusCode === 409)) throw e
			}

			const profile = await getSpaceProfile()
			setProfile(profile)
			clearSession()
			toast.success("Welcome to Meetday Hubs!")
			router.push(redirectTo || "/spaces/dashboard")
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
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden className="animate-spin text-[#EE2C2C]">
							<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
							<path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
						</svg>
						<p className="text-body-sm font-semibold text-text-primary">{loadingMessage}</p>
					</div>
				</div>
			)}

			<div className="flex items-center justify-between mb-2">
				<button
					type="button"
					onClick={async () => {
						clearSession()
						await signOut()
						router.replace("/spaces/login")
					}}
					className="inline-flex items-center gap-1.5 text-xs font-bold text-black/50 hover:text-black transition-colors"
				>
					<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
					</svg>
					Back to login
				</button>
			</div>

			<div className="flex flex-col flex-grow justify-between h-full">
				<div className="text-center pt-2 mb-4">
					<h2 className="font-heading text-3xl sm:text-4xl font-black text-black tracking-tight mb-2">
						Set up your Hub Partner profile
					</h2>
					<p className="text-sm font-semibold text-black/60 max-w-md mx-auto leading-relaxed">
						Tell us about yourself and the venue locations you manage.
					</p>
				</div>

				<div className="flex flex-col gap-4">
					<SectionCard title="Account & Contact Details">
						<div className="flex flex-col gap-3.5">
							<TextField
								label="Email address"
								value={sessionEmail || ""}
								disabled
								hint="Populated from your Google account (read-only)"
							/>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<TextField
									label="First name"
									placeholder="John"
									value={firstName}
									onChange={(e) => {
										setFirstName(e.target.value)
										if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: undefined }))
									}}
									error={!!errors.firstName}
									helperText={errors.firstName}
								/>
								<TextField
									label="Last name"
									placeholder="Doe"
									value={lastName}
									onChange={(e) => {
										setLastName(e.target.value)
										if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: undefined }))
									}}
									error={!!errors.lastName}
									helperText={errors.lastName}
								/>
							</div>

							<PhoneField
								label="Phone Number"
								value={phone}
								onChange={(val) => {
									setPhone(val)
									if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }))
								}}
								country={country}
								onCountryChange={setCountry}
								error={errors.phone}
							/>
						</div>
					</SectionCard>

					<SectionCard title="Business & Hub Info">
						<div className="flex flex-col gap-4">
							<TextField
								label="Business Name / Venue Chain"
								placeholder="e.g. Social Offline, Third Wave Coffee, WeWork"
								value={businessName}
								onChange={(e) => {
									setBusinessName(e.target.value)
									if (errors.businessName) setErrors((prev) => ({ ...prev, businessName: undefined }))
								}}
								error={!!errors.businessName}
								helperText={errors.businessName}
							/>

							<CityTagPicker
								label="Operating Cities"
								selectedCities={operatingCities}
								onChange={(cities) => {
									setOperatingCities(cities)
									if (errors.operatingCities) setErrors((prev) => ({ ...prev, operatingCities: undefined }))
								}}
								error={errors.operatingCities}
								placeholder="Select or type cities (e.g. Bengaluru, Mumbai, Delhi)..."
							/>
						</div>
					</SectionCard>

					<div className="flex justify-end gap-3 pt-3 pb-2 border-t border-border-default">
						<Button
							type="button"
							variant="primary"
							size="md"
							radius="pill"
							className="bg-[#EE2C2C] text-white border-[3px] border-black rounded-2xl font-extrabold text-center shadow-[4px_4px_0px_0px_#FFC940] hover:shadow-[1px_1px_0px_0px_#FFC940] hover:translate-x-[3px] hover:translate-y-[3px] transition-all tracking-wider px-8"
							disabled={!!loadingMessage}
							onClick={handleSubmit}
						>
							{loadingMessage ? "Creating…" : "Complete Registration"}
						</Button>
					</div>
				</div>
			</div>
		</AuthShell>
	)
}
