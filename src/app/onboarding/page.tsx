"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { registerHost } from "@/lib/api"
import type { HostRegistrationData } from "@/lib/api"
import type { AuthSession } from "@/context/AuthContext"
import { Button } from "@/components/ui/Button"
import { TextField } from "@/components/ui/TextField"
import { PhoneField } from "@/components/auth/PhoneField"
import { DEFAULT_COUNTRY, type Country } from "@/lib/countries"
import clsx from "clsx"

// ─── Types ────────────────────────────────────────────────────────────────────

type FormData = Omit<HostRegistrationData, "yearsOfExperience" | "totalEventsHosted"> & {
	yearsOfExperience: number | ""
	totalEventsHosted: number | ""
}

const INITIAL: FormData = {
	firstName: "",
	lastName: "",
	phone: "",
	email: "",
	accountType: "",
	hostType: "",
	displayName: "",
	legalName: "",
	bio: "",
	tagline: "",
	pan: "",
	categories: [],
	languages: [],
	yearsOfExperience: "",
	totalEventsHosted: "",
	operatingCities: [],
	instagram: "",
	addressLine1: "",
	addressLine2: "",
	city: "",
	state: "",
	pincode: "",
}

const STEPS = [
	"Personal details",
	"Account details",
	"Host profile",
	"Categories & languages",
	"Experience",
	"Operating cities",
	"Social links",
	"Address",
] as const

// ─── Step components ──────────────────────────────────────────────────────────

function StepPersonal({
	data,
	onChange,
	country,
	onCountryChange,
}: {
	data: FormData
	onChange: (patch: Partial<FormData>) => void
	country: Country
	onCountryChange: (c: Country) => void
}) {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex gap-3">
				<TextField
					label="First name"
					placeholder="Jane"
					value={data.firstName}
					onChange={e => onChange({ firstName: e.target.value })}
					size="md"
					className="flex-1"
				/>
				<TextField
					label="Last name"
					placeholder="Doe"
					value={data.lastName}
					onChange={e => onChange({ lastName: e.target.value })}
					size="md"
					className="flex-1"
				/>
			</div>
			<PhoneField
				label="Phone number"
				value={data.phone}
				onChange={v => onChange({ phone: v })}
				country={country}
				onCountryChange={onCountryChange}
			/>
			<TextField
				label="Email"
				placeholder="jane@example.com"
				type="email"
				value={data.email}
				onChange={e => onChange({ email: e.target.value })}
				size="md"
			/>
		</div>
	)
}

function StepAccount({ data, onChange }: { data: FormData; onChange: (patch: Partial<FormData>) => void }) {
	const accountTypes = ["Individual", "Business", "Organization"]
	const hostTypes = ["Event Host", "Venue Host", "Experience Host"]

	return (
		<div className="flex flex-col gap-5">
			<div>
				<p className="text-label-md text-text-primary mb-2">Account type</p>
				<div className="flex flex-wrap gap-2">
					{accountTypes.map(t => (
						<button
							key={t}
							type="button"
							onClick={() => onChange({ accountType: t })}
							className={clsx(
								"px-4 py-2 rounded-full text-body-sm border transition-colors duration-(--duration-120)",
								data.accountType === t
									? "bg-action-primary text-white border-action-primary"
									: "border-border-default text-text-secondary hover:border-border-strong",
							)}
						>
							{t}
						</button>
					))}
				</div>
			</div>
			<div>
				<p className="text-label-md text-text-primary mb-2">Host type</p>
				<div className="flex flex-wrap gap-2">
					{hostTypes.map(t => (
						<button
							key={t}
							type="button"
							onClick={() => onChange({ hostType: t })}
							className={clsx(
								"px-4 py-2 rounded-full text-body-sm border transition-colors duration-(--duration-120)",
								data.hostType === t
									? "bg-action-primary text-white border-action-primary"
									: "border-border-default text-text-secondary hover:border-border-strong",
							)}
						>
							{t}
						</button>
					))}
				</div>
			</div>
		</div>
	)
}

function StepHostProfile({ data, onChange }: { data: FormData; onChange: (patch: Partial<FormData>) => void }) {
	return (
		<div className="flex flex-col gap-4">
			<TextField
				label="Display name"
				placeholder="The name guests will see"
				value={data.displayName}
				onChange={e => onChange({ displayName: e.target.value })}
				size="md"
			/>
			<TextField
				label="Legal name"
				placeholder="Your legal or business name"
				value={data.legalName}
				onChange={e => onChange({ legalName: e.target.value })}
				size="md"
			/>
			<div className="flex flex-col gap-1.5">
				<label className="text-label-md text-text-primary">Host bio</label>
				<textarea
					placeholder="Tell guests about yourself and what makes your events special"
					value={data.bio}
					onChange={e => onChange({ bio: e.target.value })}
					rows={4}
					className={clsx(
						"w-full rounded-input border border-border-default bg-surface-canvas px-4 py-3",
						"text-sm text-text-primary placeholder:text-text-muted outline-none resize-none",
						"hover:border-border-strong focus:border-border-focused transition-colors duration-(--duration-120)",
					)}
				/>
			</div>
			<TextField
				label="Tagline"
				placeholder="A short catchy line about your hosting style"
				value={data.tagline}
				onChange={e => onChange({ tagline: e.target.value })}
				size="md"
			/>
			<TextField
				label="PAN"
				placeholder="ABCDE1234F"
				value={data.pan}
				onChange={e => onChange({ pan: e.target.value.toUpperCase() })}
				size="md"
				hint="Required for payouts"
			/>
		</div>
	)
}

function ChipSelect({
	label,
	options,
	value,
	onChange,
}: {
	label: string
	options: string[]
	value: string[]
	onChange: (v: string[]) => void
}) {
	function toggle(opt: string) {
		onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt])
	}

	return (
		<div>
			<p className="text-label-md text-text-primary mb-2">{label}</p>
			<div className="flex flex-wrap gap-2">
				{options.map(opt => (
					<button
						key={opt}
						type="button"
						onClick={() => toggle(opt)}
						className={clsx(
							"px-4 py-2 rounded-full text-body-sm border transition-colors duration-(--duration-120)",
							value.includes(opt)
								? "bg-action-primary text-white border-action-primary"
								: "border-border-default text-text-secondary hover:border-border-strong",
						)}
					>
						{opt}
					</button>
				))}
			</div>
		</div>
	)
}

const CATEGORY_OPTIONS = ["Music", "Art", "Food & Drink", "Sports", "Tech", "Wellness", "Networking", "Comedy", "Film", "Education"]
const LANGUAGE_OPTIONS = ["English", "Hindi", "Bengali", "Marathi", "Tamil", "Telugu", "Kannada", "Malayalam", "Gujarati", "Punjabi"]

function StepCategoriesLanguages({ data, onChange }: { data: FormData; onChange: (patch: Partial<FormData>) => void }) {
	return (
		<div className="flex flex-col gap-5">
			<ChipSelect
				label="Categories"
				options={CATEGORY_OPTIONS}
				value={data.categories}
				onChange={v => onChange({ categories: v })}
			/>
			<ChipSelect
				label="Languages"
				options={LANGUAGE_OPTIONS}
				value={data.languages}
				onChange={v => onChange({ languages: v })}
			/>
		</div>
	)
}

function StepExperience({ data, onChange }: { data: FormData; onChange: (patch: Partial<FormData>) => void }) {
	return (
		<div className="flex flex-col gap-4">
			<TextField
				label="Years of experience"
				placeholder="e.g. 3"
				type="number"
				value={data.yearsOfExperience === "" ? "" : String(data.yearsOfExperience)}
				onChange={e => onChange({ yearsOfExperience: e.target.value === "" ? "" : Number(e.target.value) })}
				size="md"
			/>
			<TextField
				label="Total events hosted previously"
				placeholder="e.g. 20"
				type="number"
				value={data.totalEventsHosted === "" ? "" : String(data.totalEventsHosted)}
				onChange={e => onChange({ totalEventsHosted: e.target.value === "" ? "" : Number(e.target.value) })}
				size="md"
			/>
		</div>
	)
}

const CITY_OPTIONS = ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Surat"]

function StepOperatingCities({ data, onChange }: { data: FormData; onChange: (patch: Partial<FormData>) => void }) {
	return (
		<ChipSelect
			label="Cities where you host events"
			options={CITY_OPTIONS}
			value={data.operatingCities}
			onChange={v => onChange({ operatingCities: v })}
		/>
	)
}

function StepSocialLinks({ data, onChange }: { data: FormData; onChange: (patch: Partial<FormData>) => void }) {
	return (
		<TextField
			label="Instagram"
			placeholder="@yourhandle"
			value={data.instagram}
			onChange={e => onChange({ instagram: e.target.value })}
			size="md"
			hint="Optional"
		/>
	)
}

function StepAddress({ data, onChange }: { data: FormData; onChange: (patch: Partial<FormData>) => void }) {
	return (
		<div className="flex flex-col gap-4">
			<TextField
				label="Address line 1"
				placeholder="Building, street"
				value={data.addressLine1}
				onChange={e => onChange({ addressLine1: e.target.value })}
				size="md"
			/>
			<TextField
				label="Address line 2"
				placeholder="Area, landmark (optional)"
				value={data.addressLine2}
				onChange={e => onChange({ addressLine2: e.target.value })}
				size="md"
			/>
			<div className="flex gap-3">
				<TextField
					label="City"
					placeholder="Mumbai"
					value={data.city}
					onChange={e => onChange({ city: e.target.value })}
					size="md"
					className="flex-1"
				/>
				<TextField
					label="State"
					placeholder="Maharashtra"
					value={data.state}
					onChange={e => onChange({ state: e.target.value })}
					size="md"
					className="flex-1"
				/>
			</div>
			<TextField
				label="Pincode"
				placeholder="400001"
				value={data.pincode}
				onChange={e => onChange({ pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
				size="md"
			/>
		</div>
	)
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
	const [step, setStep] = useState(0)
	const [formData, setFormData] = useState<FormData>(INITIAL)
	const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY)
	const [submitError, setSubmitError] = useState("")
	const [submitting, setSubmitting] = useState(false)
	const { user } = useAuth()
	const router = useRouter()

	// Pre-fill phone/email from session
	useEffect(() => {
		const raw = sessionStorage.getItem("authSession")
		if (!raw) return
		const session = JSON.parse(raw) as AuthSession
		setFormData(prev => ({
			...prev,
			phone: session.phone ? session.phone.replace(/^\+91/, "") : prev.phone,
			email: session.email ?? prev.email,
		}))
	}, [])

	function patch(p: Partial<FormData>) {
		setFormData(prev => ({ ...prev, ...p }))
	}

	const stepComponents = [
		<StepPersonal key={0} data={formData} onChange={patch} country={country} onCountryChange={setCountry} />,
		<StepAccount key={1} data={formData} onChange={patch} />,
		<StepHostProfile key={2} data={formData} onChange={patch} />,
		<StepCategoriesLanguages key={3} data={formData} onChange={patch} />,
		<StepExperience key={4} data={formData} onChange={patch} />,
		<StepOperatingCities key={5} data={formData} onChange={patch} />,
		<StepSocialLinks key={6} data={formData} onChange={patch} />,
		<StepAddress key={7} data={formData} onChange={patch} />,
	]

	const isLastStep = step === STEPS.length - 1

	async function handleNext() {
		if (!isLastStep) { setStep(s => s + 1); return }

		if (!user) { router.replace("/login"); return }
		setSubmitError("")
		setSubmitting(true)
		try {
			const idToken = await user.getIdToken()
			const payload: HostRegistrationData = {
				...formData,
				phone: `${country.dialCode}${formData.phone}`,
				yearsOfExperience: Number(formData.yearsOfExperience) || 0,
				totalEventsHosted: Number(formData.totalEventsHosted) || 0,
			}
			await registerHost(idToken, payload)
			sessionStorage.removeItem("authSession")
			router.push("/dashboard")
		} catch {
			setSubmitError("Registration failed. Please try again.")
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div className="w-full max-w-lg bg-surface-card rounded-modal shadow-modal px-6 py-8 lg:px-8 lg:py-10">
			{/* Step header */}
			<div className="mb-6">
				<p className="text-caption text-text-muted mb-1">
					Step {step + 1} of {STEPS.length}
				</p>
				<h1 className="text-heading-sm text-text-primary">{STEPS[step]}</h1>
			</div>

			{/* Progress bar */}
			<div className="w-full h-1 bg-border-subtle rounded-full mb-8">
				<div
					className="h-full bg-action-primary rounded-full transition-all duration-300"
					style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
				/>
			</div>

			{/* Step content */}
			{stepComponents[step]}

			{submitError && (
				<p className="text-caption text-text-danger mt-4">{submitError}</p>
			)}

			{/* Navigation */}
			<div className="flex gap-3 mt-8">
				{step > 0 && (
					<Button
						type="button"
						variant="secondary"
						size="md"
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
					size="md"
					radius="pill"
					className="flex-1"
					onClick={handleNext}
					disabled={submitting}
				>
					{isLastStep ? (submitting ? "Submitting…" : "Submit") : "Next"}
				</Button>
			</div>
		</div>
	)
}
