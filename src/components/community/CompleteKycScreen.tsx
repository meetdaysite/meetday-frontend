"use client"

import { useEffect, useState } from "react"
import clsx from "clsx"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "@/lib/toast"
import { Button } from "@/components/ui/Button"
import { TextField } from "@/components/ui/TextField"
import { Icon } from "@/components/ui/Icon"
import { getHostProfile, updateHostProfile, verifyPan, verifyBankAccount, type HostProfile } from "@/lib/api"
import { useHostStore } from "@/store/hostStore"
import { ApiError, getApiErrorMessage } from "@/lib/errors"
import CardSvg from "@/icons/filled/card.svg"
import CheckCircleSvg from "@/icons/filled/check-circle.svg"
import LockKeyholeSvg from "@/icons/outlined/lock-keyhole.svg"
import DangerTriangleSvg from "@/icons/outlined/danger-triangle.svg"

// Client-side backoff since verify endpoints are server-throttled
// (PAN: 3/min, bank: 5/min) and don't expose a Retry-After header.
const PAN_RETRY_COOLDOWN_SECONDS = 20
const BANK_RETRY_COOLDOWN_SECONDS = 15

const panSchema = z.object({
	pan: z.string().min(1, "Required"),
	legalName: z.string().min(1, "Required"),
})
type PanFormValues = z.infer<typeof panSchema>

const bankSchema = z.object({
	accountHolderName: z.string().min(1, "Required"),
	accountNumber: z.string().min(1, "Required"),
	ifscCode: z.string().min(1, "Required"),
	bankName: z.string().min(1, "Required"),
})
type BankFormValues = z.infer<typeof bankSchema>

function statusLabel(status: string) {
	if (status === "FAILED") return "Failed"
	if (status === "NOT_SUBMITTED") return "Not submitted"
	if (status === "PENDING") return "Pending"
	return status
}

function maskAccountNumber(accountNumber?: string | null) {
	if (!accountNumber) return "—"
	return "XXXX" + accountNumber.slice(-4)
}

function StatusBadge({ status }: { status: string }) {
	const verified = status === "VERIFIED"
	return (
		<span
			className={clsx(
				"flex items-center gap-1 text-caption font-medium px-2 py-1 rounded-avatar shrink-0",
				verified ? "text-text-success bg-surface-success-soft" : "text-text-warning bg-surface-warning-soft",
			)}
		>
			<Icon as={verified ? CheckCircleSvg : DangerTriangleSvg} size="sm" color={verified ? "success" : "warning"} />
			{verified ? "Verified" : statusLabel(status)}
		</span>
	)
}

export function CompleteKycScreen({ profile, onSignOut }: { profile: HostProfile; onSignOut: () => void }) {
	const setProfile = useHostStore((s) => s.setProfile)
	const [panLoading, setPanLoading] = useState(false)
	const [bankSubmitting, setBankSubmitting] = useState(false)
	const [panFailureReason, setPanFailureReason] = useState<string | null>(null)
	const [panCooldown, setPanCooldown] = useState(0)
	const [bankCooldown, setBankCooldown] = useState(0)
	const [panEditing, setPanEditing] = useState(false)
	const [bankEditing, setBankEditing] = useState(false)

	const panVerified = profile.panVerificationStatus === "VERIFIED"
	const panSubmitted = !!profile.pan && !!profile.legalName
	const panPending = profile.panVerificationStatus === "PENDING"
	const bankVerified = profile.bankVerificationStatus === "VERIFIED"
	const bankPending = profile.bankVerificationStatus === "PENDING"

	const panForm = useForm<PanFormValues>({
		resolver: zodResolver(panSchema),
		defaultValues: { pan: profile.pan ?? "", legalName: profile.legalName ?? "" },
	})
	// Re-sync when a fresh profile comes back after a submit — not on every
	// keystroke, since refreshProfile() only fires after a call resolves.
	useEffect(() => {
		panForm.reset({ pan: profile.pan ?? "", legalName: profile.legalName ?? "" })
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [profile.pan, profile.legalName])

	const bankForm = useForm<BankFormValues>({
		resolver: zodResolver(bankSchema),
		defaultValues: {
			accountHolderName: profile.bankDetails?.accountHolderName ?? "",
			accountNumber: profile.bankDetails?.accountNumber ?? "",
			ifscCode: profile.bankDetails?.ifscCode ?? "",
			bankName: profile.bankDetails?.bankName ?? "",
		},
	})
	// Previously-submitted bank details were never re-synced here, so the form always showed
	// blank fields on reload even though something had been submitted (bug) — mirror the PAN
	// form's re-sync pattern above.
	useEffect(() => {
		bankForm.reset({
			accountHolderName: profile.bankDetails?.accountHolderName ?? "",
			accountNumber: profile.bankDetails?.accountNumber ?? "",
			ifscCode: profile.bankDetails?.ifscCode ?? "",
			bankName: profile.bankDetails?.bankName ?? "",
		})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [profile.bankDetails])

	useEffect(() => {
		if (panCooldown <= 0) return
		const t = setTimeout(() => setPanCooldown((s) => s - 1), 1000)
		return () => clearTimeout(t)
	}, [panCooldown])

	useEffect(() => {
		if (bankCooldown <= 0) return
		const t = setTimeout(() => setBankCooldown((s) => s - 1), 1000)
		return () => clearTimeout(t)
	}, [bankCooldown])

	async function refreshProfile() {
		const fresh = await getHostProfile()
		setProfile(fresh)
	}

	async function onSubmitPan(values: PanFormValues) {
		setPanFailureReason(null)
		setPanLoading(true)
		try {
			await updateHostProfile({ pan: values.pan, legalName: values.legalName })

			let status: string = "VERIFIED"
			try {
				const result = await verifyPan()
				status = result.panVerificationStatus
				if (status !== "VERIFIED") setPanFailureReason(result.failureReason)
			} catch (e) {
				if (e instanceof ApiError && e.statusCode === 409) {
					// Already verified — treat as success
				} else if (e instanceof ApiError && e.statusCode === 429) {
					setPanCooldown(PAN_RETRY_COOLDOWN_SECONDS)
					toast.error("Too many attempts. Please wait a moment before retrying.")
					return
				} else {
					throw e
				}
			}

			await refreshProfile()
			if (status === "VERIFIED") toast.success("PAN verified!")
			else toast.success("PAN submitted for review.")
		} catch (e) {
			toast.error(getApiErrorMessage(e))
		} finally {
			setPanLoading(false)
			setPanEditing(false)
		}
	}

	async function onSubmitBank(values: BankFormValues) {
		setBankSubmitting(true)
		try {
			let status: string = "VERIFIED"
			try {
				const result = await verifyBankAccount({ bankAccount: values })
				status = result.bankVerificationStatus
			} catch (e) {
				if (e instanceof ApiError && e.statusCode === 409) {
					// Already verified — treat as success
				} else if (e instanceof ApiError && e.statusCode === 429) {
					setBankCooldown(BANK_RETRY_COOLDOWN_SECONDS)
					toast.error("Too many attempts. Please wait a moment before retrying.")
					return
				} else {
					throw e
				}
			}

			await refreshProfile()
			if (status === "VERIFIED") toast.success("Bank account verified!")
			else toast.success("Bank details submitted for review.")
		} catch (e) {
			toast.error(getApiErrorMessage(e))
		} finally {
			setBankSubmitting(false)
			setBankEditing(false)
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-surface-page px-4">
			<div className="w-full max-w-md flex flex-col items-center gap-6 py-12">
				<div className="size-20 rounded-full bg-surface-warning-soft flex items-center justify-center">
					<Icon as={DangerTriangleSvg} size="xl" color="warning" />
				</div>

				<div className="text-center">
					<h1 className="text-heading-sm text-text-primary font-bold">Complete your verification</h1>
					<p className="text-body-sm text-text-secondary mt-2 max-w-md mx-auto">
						Submit your PAN and bank account details — our team will manually review them before your application can be approved.
					</p>
				</div>

				<div className="w-full flex flex-col gap-4">
					{/* PAN — step 1, always addressable */}
					{panVerified ? (
						<div className="rounded-action border border-border-default bg-surface-card px-4 py-3 flex items-center justify-between gap-3">
							<p className="text-label-md text-text-primary font-bold">PAN verification</p>
							<StatusBadge status={profile.panVerificationStatus} />
						</div>
					) : panPending && !panEditing ? (
						<div className="rounded-action border border-border-default bg-surface-card px-4 py-4 flex flex-col gap-3">
							<div className="flex items-center justify-between">
								<p className="text-label-md text-text-primary font-bold">PAN verification</p>
								<StatusBadge status={profile.panVerificationStatus} />
							</div>
							<div className="text-body-sm text-text-secondary">
								<p><span className="text-text-muted">PAN:</span> {profile.pan}</p>
								<p><span className="text-text-muted">Legal name:</span> {profile.legalName}</p>
							</div>
							<p className="text-caption text-text-muted">Under review by our team. You can edit and resubmit if needed.</p>
							<Button type="button" variant="secondary" size="sm" onClick={() => setPanEditing(true)} className="mt-1 self-start">
								Edit
							</Button>
						</div>
					) : (
						<form
							onSubmit={panForm.handleSubmit(onSubmitPan)}
							className="rounded-action border border-border-default bg-surface-card px-4 py-4 flex flex-col gap-3"
						>
							<div className="flex items-center justify-between">
								<p className="text-label-md text-text-primary font-bold">PAN verification</p>
								<StatusBadge status={profile.panVerificationStatus} />
							</div>
							{profile.panVerificationStatus === "FAILED" && profile.kycFailureReason && (
								<p className="text-caption text-text-danger">{profile.kycFailureReason}</p>
							)}
							<TextField
								label="PAN"
								placeholder="Enter your PAN"
								{...panForm.register("pan")}
								error={!!panForm.formState.errors.pan}
								helperText={panForm.formState.errors.pan?.message}
								size="sm"
								leftIcon={<Icon as={CardSvg} size="sm" color="inherit" />}
							/>
							<TextField
								label="Legal name"
								placeholder="Full name as per PAN"
								{...panForm.register("legalName")}
								error={!!panForm.formState.errors.legalName}
								helperText={panForm.formState.errors.legalName?.message}
								size="sm"
							/>
							{panFailureReason && <p className="text-caption text-text-danger">{panFailureReason}</p>}
							<div className="flex items-center gap-2 mt-1">
								<Button
									type="submit"
									variant="primary"
									size="sm"
									disabled={panLoading || panCooldown > 0}
								>
									{panLoading ? "Submitting…" : panCooldown > 0 ? `Try again in ${panCooldown}s` : "Submit PAN"}
								</Button>
								{panPending && (
									<Button type="button" variant="secondary" size="sm" onClick={() => setPanEditing(false)} disabled={panLoading}>
										Cancel
									</Button>
								)}
							</div>
						</form>
					)}

					{/* Bank — step 2, gated behind PAN so a mid-flow PAN failure never
					    wipes out re-typed bank details (raw account number isn't stored). */}
					{bankVerified ? (
						<div className="rounded-action border border-border-default bg-surface-card px-4 py-3 flex items-center justify-between gap-3">
							<p className="text-label-md text-text-primary font-bold">Bank account verification</p>
							<StatusBadge status={profile.bankVerificationStatus} />
						</div>
					) : !panSubmitted ? (
						<div className="rounded-action border border-dashed border-border-default bg-surface-secondary px-4 py-4 flex items-center gap-3 opacity-70">
							<Icon as={LockKeyholeSvg} size="md" color="muted" />
							<p className="text-body-sm text-text-muted">
								Submit your PAN details first to unlock bank account details.
							</p>
						</div>
					) : bankPending && !bankEditing ? (
						<div className="rounded-action border border-border-default bg-surface-card px-4 py-4 flex flex-col gap-3">
							<div className="flex items-center justify-between">
								<p className="text-label-md text-text-primary font-bold">Bank account verification</p>
								<StatusBadge status={profile.bankVerificationStatus} />
							</div>
							<div className="text-body-sm text-text-secondary">
								<p><span className="text-text-muted">Account holder:</span> {profile.bankDetails?.accountHolderName}</p>
								<p><span className="text-text-muted">Bank:</span> {profile.bankDetails?.bankName}</p>
								<p><span className="text-text-muted">Account:</span> {maskAccountNumber(profile.bankDetails?.accountNumber)}</p>
								<p><span className="text-text-muted">IFSC:</span> {profile.bankDetails?.ifscCode}</p>
							</div>
							<p className="text-caption text-text-muted">Under review by our team. You can edit and resubmit if needed.</p>
							<Button type="button" variant="secondary" size="sm" onClick={() => setBankEditing(true)} className="mt-1 self-start">
								Edit
							</Button>
						</div>
					) : (
						<form
							onSubmit={bankForm.handleSubmit(onSubmitBank)}
							className="rounded-action border border-border-default bg-surface-card px-4 py-4 flex flex-col gap-3"
						>
							<div className="flex items-center justify-between">
								<p className="text-label-md text-text-primary font-bold">Bank account verification</p>
								<StatusBadge status={profile.bankVerificationStatus} />
							</div>
							{profile.bankVerificationStatus === "FAILED" && (profile.bankDetails?.rejectionReason || profile.kycFailureReason) && (
								<p className="text-caption text-text-danger">{profile.bankDetails?.rejectionReason || profile.kycFailureReason}</p>
							)}
							<TextField
								label="Account holder name"
								placeholder="Enter your account holder name"
								{...bankForm.register("accountHolderName")}
								error={!!bankForm.formState.errors.accountHolderName}
								helperText={bankForm.formState.errors.accountHolderName?.message}
								size="sm"
							/>
							<TextField
								label="Account number"
								placeholder="Enter your account number"
								{...bankForm.register("accountNumber")}
								error={!!bankForm.formState.errors.accountNumber}
								helperText={bankForm.formState.errors.accountNumber?.message}
								size="sm"
							/>
							<div className="flex gap-3">
								<TextField
									label="IFSC Code"
									placeholder="IFSC code"
									{...bankForm.register("ifscCode")}
									error={!!bankForm.formState.errors.ifscCode}
									helperText={bankForm.formState.errors.ifscCode?.message}
									size="sm"
									className="flex-1"
								/>
								<TextField
									label="Bank name"
									placeholder="Bank name"
									{...bankForm.register("bankName")}
									error={!!bankForm.formState.errors.bankName}
									helperText={bankForm.formState.errors.bankName?.message}
									size="sm"
									className="flex-1"
								/>
							</div>
							<div className="flex items-center gap-2 mt-1">
								<Button
									type="submit"
									variant="primary"
									size="sm"
									disabled={bankSubmitting || bankCooldown > 0}
								>
									{bankSubmitting ? "Submitting…" : bankCooldown > 0 ? `Try again in ${bankCooldown}s` : "Submit bank details"}
								</Button>
								{bankPending && (
									<Button type="button" variant="secondary" size="sm" onClick={() => setBankEditing(false)} disabled={bankSubmitting}>
										Cancel
									</Button>
								)}
							</div>
						</form>
					)}
				</div>

				<p className="flex items-center gap-1.5 text-caption text-text-muted text-center">
					<Icon as={LockKeyholeSvg} size="sm" className="opacity-80 shrink-0" />
					Your information is encrypted and secured. Raw account number is never stored.
				</p>

				<button
					onClick={onSignOut}
					className="text-label-sm font-medium text-text-secondary hover:text-text-primary transition-colors underline underline-offset-2"
				>
					Sign out
				</button>
			</div>
		</div>
	)
}
