"use client"

import { useEffect, useState } from "react"
import { toast } from "@/lib/toast"
import { Button } from "@/components/ui/Button"
import { TextField } from "@/components/ui/TextField"
import { Icon } from "@/components/ui/Icon"
import {
	getHostProfile,
	updateHostProfile,
	verifyPan,
	verifyBankAccount,
	type HostProfile,
} from "@/lib/api"
import { useHostStore } from "@/store/hostStore"
import { ApiError, getApiErrorMessage } from "@/lib/errors"
import LockKeyholeSvg from "@/icons/outlined/lock-keyhole.svg"
import clsx from "clsx"

type FormValues = {
	displayName: string
	legalName: string
	pan: string
	accountHolderName: string
	accountNumber: string
	ifscCode: string
	bankName: string
}

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/

function needsPrompt(p: HostProfile): boolean {
	return !p.displayName || p.kycStatus !== "VERIFIED"
}

interface HostDetailsPromptProps {
	onClose?: () => void
	inline?: boolean
}

export function HostDetailsPrompt({ onClose, inline = false }: HostDetailsPromptProps) {
	const { profile, setProfile } = useHostStore()
	const [open, setOpen] = useState(false)
	const [saving, setSaving] = useState(false)
	const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({})

	const [values, setValues] = useState<FormValues>({
		displayName: "",
		legalName: "",
		pan: "",
		accountHolderName: "",
		accountNumber: "",
		ifscCode: "",
		bankName: "",
	})

	// Pull the profile if the store is cold
	useEffect(() => {
		if (profile) return
		let cancelled = false
		getHostProfile()
			.then(p => {
				if (!cancelled) setProfile(p)
			})
			.catch(() => {
				/* error handled by parent page */
			})
		return () => {
			cancelled = true
		}
	}, [profile, setProfile])

	// Seed from the profile
	useEffect(() => {
		if (!profile) return
		setValues(v => ({
			...v,
			displayName: profile.displayName ?? "",
			legalName: profile.legalName ?? "",
			pan: profile.pan ?? "",
		}))
		setOpen(needsPrompt(profile))
	}, [profile])

	function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
		setValues(v => ({ ...v, [key]: value }))
		setErrors(e => ({ ...e, [key]: undefined }))
	}

	async function handleSubmit() {
		const nextErrors: Partial<Record<keyof FormValues, string>> = {}
		if (!values.displayName.trim()) nextErrors.displayName = "Required"
		if (!values.legalName.trim()) nextErrors.legalName = "Required"
		if (!PAN_REGEX.test(values.pan.trim().toUpperCase()))
			nextErrors.pan = "Enter a valid PAN (e.g. ABCDE1234F)"
		if (!values.accountHolderName.trim()) nextErrors.accountHolderName = "Required"
		if (!values.accountNumber.trim()) nextErrors.accountNumber = "Required"
		if (!values.ifscCode.trim()) nextErrors.ifscCode = "Required"
		if (!values.bankName.trim()) nextErrors.bankName = "Required"
		
		setErrors(nextErrors)
		if (Object.keys(nextErrors).length) return

		setSaving(true)
		try {
			// 1. Update Profile details (displayName, legalName, PAN)
			try {
				await updateHostProfile({
					displayName: values.displayName.trim(),
					legalName: values.legalName.trim(),
					pan: values.pan.trim().toUpperCase(),
				})
			} catch (e) {
				// 409 profile already updated is fine, other errors throw
				if (!(e instanceof ApiError && e.statusCode === 409)) throw e
			}

			// 2. Trigger PAN KYC Verification check
			try {
				await verifyPan()
			} catch (e) {
				if (!(e instanceof ApiError && e.statusCode === 409)) throw e
			}

			// 3. Trigger Bank Verification check
			try {
				await verifyBankAccount({
					bankAccount: {
						accountNumber: values.accountNumber.trim(),
						ifscCode: values.ifscCode.trim().toUpperCase(),
						accountHolderName: values.accountHolderName.trim(),
						bankName: values.bankName.trim(),
					},
				})
			} catch (e) {
				if (!(e instanceof ApiError && e.statusCode === 409)) throw e
			}

			// 4. Reload final profile
			try {
				setProfile(await getHostProfile())
			} catch {
				/* non-blocking */
			}

			toast.success("Verification submitted successfully!")
			setOpen(false)
			if (onClose) onClose()
		} catch (e) {
			toast.error(getApiErrorMessage(e))
		} finally {
			setSaving(false)
		}
	}

	if (!open && !inline) return null

	const content = (
		<div className={clsx(
			"bg-white flex flex-col gap-6 text-black relative",
			inline ? "w-full h-full p-6 overflow-y-auto" : "w-full max-w-140 max-h-[90vh] overflow-y-auto bg-surface-card rounded-action shadow-modal p-8"
		)}>
			{/* Cross close button on the top right */}
			<button
				type="button"
				onClick={() => {
					setOpen(false)
					if (onClose) onClose()
				}}
				className="absolute top-4 right-4 text-black/60 hover:text-black p-2 rounded-full hover:bg-black/5 transition-colors text-lg font-bold leading-none"
				aria-label="Close"
			>
				✕
			</button>

			<div>
				<h2 className="text-xl font-heading font-black text-black">
					Verify details for <span className="text-[#EE2C2C]">payouts</span>
				</h2>
				<p className="text-xs font-semibold text-black/50 mt-2">
					Please complete verification to receive ticket payouts. This is a one-time process.
				</p>
			</div>

			<div className="flex flex-col gap-5">
				<TextField
					label="Display name"
					placeholder="What should we call you?"
					value={values.displayName}
					onChange={e => setField("displayName", (e.target as HTMLInputElement).value)}
					error={!!errors.displayName}
					helperText={errors.displayName}
					size="md"
				/>

				<div className="flex gap-3">
					<TextField
						label="Legal name (as per PAN)"
						placeholder="Enter your full legal name"
						value={values.legalName}
						onChange={e => setField("legalName", (e.target as HTMLInputElement).value)}
						error={!!errors.legalName}
						helperText={errors.legalName}
						size="md"
						className="flex-1"
					/>
					<TextField
						label="PAN card number"
						placeholder="ABCDE1234F"
						value={values.pan}
						onChange={e =>
							setField("pan", (e.target as HTMLInputElement).value.toUpperCase())
						}
						error={!!errors.pan}
						helperText={errors.pan}
						size="md"
						className="flex-1"
					/>
				</div>

				<div className="h-px bg-black/10" />

				<p className="text-sm font-bold text-black -mb-2">Bank account details</p>

				<TextField
					label="Account holder name"
					placeholder="As per your bank records"
					value={values.accountHolderName}
					onChange={e => setField("accountHolderName", (e.target as HTMLInputElement).value)}
					error={!!errors.accountHolderName}
					helperText={errors.accountHolderName}
					size="md"
				/>

				<TextField
					label="Account number"
					placeholder="Enter your account number"
					value={values.accountNumber}
					onChange={e => setField("accountNumber", (e.target as HTMLInputElement).value)}
					error={!!errors.accountNumber}
					helperText={errors.accountNumber}
					size="md"
				/>

				<div className="flex gap-3">
					<TextField
						label="IFSC code"
						placeholder="e.g. HDFC0001234"
						value={values.ifscCode}
						onChange={e =>
							setField("ifscCode", (e.target as HTMLInputElement).value.toUpperCase())
						}
						error={!!errors.ifscCode}
						helperText={errors.ifscCode}
						size="md"
						className="flex-1"
					/>
					<TextField
						label="Bank name"
						placeholder="e.g. HDFC Bank"
						value={values.bankName}
						onChange={e => setField("bankName", (e.target as HTMLInputElement).value)}
						error={!!errors.bankName}
						helperText={errors.bankName}
						size="md"
						className="flex-1"
					/>
				</div>

				<p className="flex items-center gap-1.5 text-xs text-black/50">
					<Icon as={LockKeyholeSvg} size="sm" className="opacity-80" />
					Your information is encrypted and never shared.
				</p>
			</div>

			<div className="flex gap-3 mt-4 shrink-0">
				<button
					type="button"
					onClick={handleSubmit}
					disabled={saving}
					className="w-full py-3 bg-[#FFC940] text-black border-[3px] border-black rounded-2xl font-black text-center text-xs tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all flex items-center justify-center gap-2 select-none"
				>
					{saving ? "Saving…" : "SUBMIT FOR VERIFICATION"}
				</button>
			</div>
		</div>
	)

	if (inline) {
		return content
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
			{content}
		</div>
	)
}
