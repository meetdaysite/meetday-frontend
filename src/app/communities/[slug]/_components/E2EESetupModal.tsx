"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import CloseSvg from "@/icons/outlined/close.svg"
import LockSvg from "@/icons/outlined/lock.svg"
import { getOrCreateDeviceIdentity } from "@/lib/deviceStore"
import { setMasterKey } from "@/lib/deviceStore"
import {
	getSodium,
	b64,
	generateMasterKey,
	wrapMasterKeyWithPassphrase,
	unwrapMasterKeyWithPassphrase,
} from "@/lib/e2ee"
import {
	registerDevice,
	storeKeyBackup,
	fetchKeyBackup,
} from "@/lib/e2eeApi"

// ─── Types ────────────────────────────────────────────────────────────────────

export type E2EESetupMode = "first-device" | "new-device"

interface Props {
	mode: E2EESetupMode
	onSuccess: () => void
	onClose: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function E2EESetupModal({ mode, onSuccess, onClose }: Props) {
	const [passphrase, setPassphrase] = useState("")
	const [confirm, setConfirm] = useState("")
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const isFirstDevice = mode === "first-device"

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)

		if (!passphrase.trim()) {
			setError("Please enter a passphrase.")
			return
		}
		if (isFirstDevice && passphrase !== confirm) {
			setError("Passphrases do not match.")
			return
		}

		setLoading(true)
		try {
			await getSodium()
			const { deviceId, publicKey } = await getOrCreateDeviceIdentity()

			if (isFirstDevice) {
				// Register device
				await registerDevice(deviceId, b64(publicKey))

				// Create MK and back it up
				const MK = await generateMasterKey()
				const { wrappedMasterKey, kdfParams } = await wrapMasterKeyWithPassphrase(MK, passphrase)
				await storeKeyBackup(wrappedMasterKey, kdfParams)
				await setMasterKey(MK)
			} else {
				// Register new device
				await registerDevice(deviceId, b64(publicKey))

				// Restore MK from backup
				const backup = await fetchKeyBackup()
				let MK: Uint8Array
				try {
					MK = await unwrapMasterKeyWithPassphrase(
						backup.wrappedMasterKey,
						backup.kdfParams,
						passphrase,
					)
				} catch {
					setError("Incorrect passphrase. Please try again.")
					setLoading(false)
					return
				}
				await setMasterKey(MK)
			}

			toast.success(isFirstDevice ? "Secure messaging enabled." : "Device restored successfully.")
			onSuccess()
		} catch (err) {
			console.error("[E2EESetupModal] setup failed:", err)
			setError("Setup failed. Please try again.")
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="fixed inset-0 z-70 flex items-end sm:items-center justify-center p-0 sm:p-4">
			<div className="absolute inset-0 bg-black/50" onClick={onClose} />

			<div className="relative w-full sm:max-w-md bg-surface-card rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col">
				<div className="p-6 flex flex-col gap-5">
					{/* Header */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<div className="flex items-center justify-center size-8 rounded-full bg-action-primary shrink-0">
								<Icon as={LockSvg} size="sm" color="inverse" />
							</div>
							<h2 className="text-body-lg font-bold text-text-primary">
								{isFirstDevice ? "Enable secure messaging" : "Restore secure messaging"}
							</h2>
						</div>
						<button
							type="button"
							onClick={onClose}
							className="text-text-muted hover:text-text-primary transition-colors"
						>
							<Icon as={CloseSvg} size="md" color="muted" />
						</button>
					</div>

					{/* Description */}
					<p className="text-label-sm text-text-secondary font-normal leading-relaxed">
						{isFirstDevice
							? "Your messages are end-to-end encrypted — only you and the recipient can read them. Create a passphrase to protect your encryption keys. Keep it safe; it can't be recovered."
							: "You've used secure DMs on another device. Enter your passphrase to restore access to your messages on this device."}
					</p>

					{/* Form */}
					<form onSubmit={handleSubmit} className="flex flex-col gap-4">
						<div className="flex flex-col gap-1.5">
							<label className="text-label-sm font-semibold text-text-primary">
								{isFirstDevice ? "Create passphrase" : "Enter passphrase"}
							</label>
							<input
								type="password"
								value={passphrase}
								onChange={e => setPassphrase(e.target.value)}
								placeholder="Enter passphrase…"
								className="w-full rounded-action border border-border-default bg-surface-page px-4 py-3 text-label-sm text-text-primary placeholder:text-text-muted outline-none focus:border-border-focus transition-colors"
								autoComplete={isFirstDevice ? "new-password" : "current-password"}
								disabled={loading}
							/>
						</div>

						{isFirstDevice && (
							<div className="flex flex-col gap-1.5">
								<label className="text-label-sm font-semibold text-text-primary">
									Confirm passphrase
								</label>
								<input
									type="password"
									value={confirm}
									onChange={e => setConfirm(e.target.value)}
									placeholder="Confirm passphrase…"
									className="w-full rounded-action border border-border-default bg-surface-page px-4 py-3 text-label-sm text-text-primary placeholder:text-text-muted outline-none focus:border-border-focus transition-colors"
									autoComplete="new-password"
									disabled={loading}
								/>
							</div>
						)}

						{error && (
							<p className="text-label-sm text-red-600 font-normal">{error}</p>
						)}

						<Button
							type="submit"
							variant="primary"
							size="md"
							radius="pill"
							className="w-full"
							disabled={loading}
						>
							{loading
								? isFirstDevice ? "Setting up…" : "Restoring…"
								: isFirstDevice ? "Enable Secure Messaging" : "Restore Access"}
						</Button>
					</form>

					{/* Warning */}
					<p className="text-[11px] text-text-muted text-center leading-relaxed">
						{isFirstDevice
							? "If you lose your passphrase and all your devices, your message history will be permanently unrecoverable."
							: "Your passphrase was set when you first enabled secure messaging."}
					</p>
				</div>
			</div>
		</div>
	)
}
