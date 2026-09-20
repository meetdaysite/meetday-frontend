"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { TextField } from "@/components/ui/TextField"
import { useAuthSessionStore, useAuthSessionHydrated } from "@/store/authSessionStore"
import { useSpaceStore } from "@/store/spaceStore"
import { registerSpace, getSpaceProfile } from "@/lib/api"
import { ApiError, getApiErrorMessage } from "@/lib/errors"

const schema = z.object({
	firstName: z.string().min(1, "Required").max(100),
	lastName: z.string().min(1, "Required").max(100),
	businessName: z.string().min(1, "Required").max(100),
	phone: z
		.string()
		.min(10, "Enter a valid 10-digit phone number")
		.max(10, "Enter a valid 10-digit phone number")
		.regex(/^\d+$/, "Phone number must contain only digits"),
})

type FormValues = z.infer<typeof schema>

export default function SpaceOnboardingPage() {
	const { email: sessionEmail, displayName, clearSession } = useAuthSessionStore()
	const sessionHydrated = useAuthSessionHydrated()
	const setProfile = useSpaceStore((s) => s.setProfile)
	const router = useRouter()
	const [submitting, setSubmitting] = useState(false)
	const [cities, setCities] = useState<string[]>([])
	const [cityInput, setCityInput] = useState("")

	useEffect(() => {
		if (!sessionHydrated) return
		if (!sessionEmail) router.replace("/space/signup")
	}, [sessionHydrated, sessionEmail, router])

	const [firstName, lastName] = (displayName ?? "").split(" ", 2)
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { firstName: firstName ?? "", lastName: lastName ?? "", businessName: "", phone: "" },
	})

	function addCity(value?: string) {
		const trimmed = (value ?? cityInput).trim()
		if (!trimmed) return
		setCities((prev) => {
			const normalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
			return prev.some((city) => city.toLowerCase() === normalized.toLowerCase()) ? prev : [...prev, normalized]
		})
		setCityInput("")
	}

	function handleCityKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter") {
			e.preventDefault()
			addCity()
			return
		}

		if (e.key === "Backspace" && !cityInput && cities.length > 0) {
			e.preventDefault()
			setCities((prev) => prev.slice(0, -1))
		}
	}

	async function onSubmit(values: FormValues) {
		if (submitting) return
		setSubmitting(true)
		try {
			try {
				await registerSpace({
					firstName: values.firstName,
					lastName: values.lastName,
					email: sessionEmail || "",
					phone: `+91${values.phone}`,
					accountType: "SPACE",
					businessName: values.businessName,
					operatingCities: cities,
				})
			} catch (e) {
				if (!(e instanceof ApiError && e.statusCode === 409)) throw e
			}
			const profile = await getSpaceProfile()
			setProfile(profile)
			clearSession()
			router.push("/space/dashboard")
		} catch (e) {
			toast.error(getApiErrorMessage(e))
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-surface-page px-4 py-12">
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="w-full max-w-md flex flex-col gap-5 bg-white rounded-3xl border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6"
			>
				<div>
					<h1 className="font-heading text-2xl font-black text-black">Tell us about your hub</h1>
					<p className="text-body-sm text-text-secondary mt-1">A few details to get your Hub Partner account set up.</p>
				</div>

				<TextField label="First name" {...register("firstName")} error={!!errors.firstName} helperText={errors.firstName?.message} />
				<TextField label="Last name" {...register("lastName")} error={!!errors.lastName} helperText={errors.lastName?.message} />
				<TextField
					label="Business Name"
					placeholder="e.g. WeWork Koramangala"
					{...register("businessName")}
					error={!!errors.businessName}
					helperText={errors.businessName?.message}
				/>
				<TextField
					label="Phone number"
					placeholder="10-digit mobile number"
					{...register("phone")}
					error={!!errors.phone}
					helperText={errors.phone?.message}
				/>

				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-bold text-black">Cities</label>
					<div className="flex gap-2">
						<input
							type="text"
							value={cityInput}
							onChange={(e) => setCityInput(e.target.value)}
							onKeyDown={handleCityKeyDown}
							placeholder="Type a city and press Enter"
							className="h-10 px-4 rounded-xl border-2 border-black bg-white text-black outline-none text-sm flex-1"
						/>
					</div>
					{cities.length > 0 && (
						<div className="flex flex-wrap gap-2 mt-1">
							{cities.map((city) => (
								<span key={city} className="bg-black/10 text-black text-xs px-3 py-1 rounded-full flex items-center gap-2">
									{city}
									<button type="button" onClick={() => setCities((prev) => prev.filter((c) => c !== city))} className="text-black/60 hover:text-black">
										×
									</button>
								</span>
							))}
						</div>
					)}
				</div>

				<Button type="submit" variant="primary" className="w-full mt-2" disabled={submitting}>
					{submitting ? "Setting up…" : "Continue"}
				</Button>
			</form>
		</div>
	)
}
