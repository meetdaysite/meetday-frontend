"use client"

import { Icon } from "@/components/ui/Icon"
import type { HostProfile } from "@/lib/api"
import CheckCircleSvg from "@/icons/outlined/check-circle.svg"
import ClockCircleSvg from "@/icons/outlined/clock-circle.svg"
import CloseCircleSvg from "@/icons/outlined/close-circle.svg"

interface VerificationsDetailsPanelProps {
	profile: HostProfile | null
	onVerifyNow: () => void
	onClose: () => void
}

function StatusBadge({ status }: { status: string }) {
	const cfg: Record<string, { label: string; className: string; Icon: React.ElementType }> = {
		VERIFIED: { label: "Verified", className: "bg-status-success-bg text-status-success-text", Icon: CheckCircleSvg },
		APPROVED: { label: "Approved", className: "bg-status-success-bg text-status-success-text", Icon: CheckCircleSvg },
		PENDING: { label: "Pending", className: "bg-status-trending-bg text-status-trending-text", Icon: ClockCircleSvg },
		FAILED: { label: "Failed", className: "bg-status-error-bg text-status-error-text", Icon: CloseCircleSvg },
		REJECTED: { label: "Rejected", className: "bg-status-error-bg text-status-error-text", Icon: CloseCircleSvg },
	}
	const { label, className, Icon: BadgeIcon } = cfg[status] ?? {
		label: status,
		className: "bg-slate-100 text-slate-600",
		Icon: ClockCircleSvg,
	}
	return (
		<span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${className}`}>
			<BadgeIcon className="size-3.5" aria-hidden />
			{label}
		</span>
	)
}

export function VerificationsDetailsPanel({
	profile,
	onVerifyNow,
	onClose,
}: VerificationsDetailsPanelProps) {
	if (!profile) return null

	const isKycComplete = profile.kycStatus === "VERIFIED"

	return (
		<div className="w-full h-full flex flex-col bg-white p-6 overflow-y-auto animate-in fade-in duration-150">
			{/* Panel Header */}
			<div className="flex justify-between items-center pb-4 mb-4 border-b border-black/10 shrink-0">
				<h2 className="text-xl font-heading font-black text-black">
					My Verifications
				</h2>
				<button
					type="button"
					onClick={onClose}
					className="text-black/60 hover:text-black size-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors font-bold text-sm"
				>
					✕
				</button>
			</div>

			{/* Panel Content */}
			<div className="flex-grow flex flex-col gap-6">
				<p className="text-xs font-semibold text-black/50 leading-relaxed">
					Verify your identity and bank credentials to host events and receive payouts.
				</p>

				{/* Verifications Rows */}
				<div className="flex flex-col gap-4 mt-2">
					
					{/* KYC Row */}
					<div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-black/5">
						<div className="flex flex-col gap-0.5">
							<span className="text-sm font-bold text-black">Identity Verification</span>
							<span className="text-[10px] font-semibold text-black/40">Overall KYC Status</span>
						</div>
						<StatusBadge status={profile.kycStatus} />
					</div>

					{/* PAN Verification */}
					<div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-black/5">
						<div className="flex flex-col gap-0.5">
							<span className="text-sm font-bold text-black">PAN Card</span>
							<span className="text-[10px] font-semibold text-black/40">Income tax identity check</span>
						</div>
						<StatusBadge status={profile.panVerificationStatus} />
					</div>

					{/* Bank Verification */}
					<div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-black/5">
						<div className="flex flex-col gap-0.5">
							<span className="text-sm font-bold text-black">Bank Account</span>
							<span className="text-[10px] font-semibold text-black/40">Payout bank setup verification</span>
						</div>
						<StatusBadge status={profile.bankVerificationStatus} />
					</div>

					{/* KYC Failure message */}
					{profile.kycFailureReason && (
						<div className="p-4 bg-red-50 text-red-700 border border-red-100 rounded-2xl text-xs font-semibold leading-relaxed">
							<span className="font-bold block mb-1">KYC Verification Failed:</span>
							{profile.kycFailureReason}
						</div>
					)}
				</div>

				{/* Verify Now Action */}
				{!isKycComplete && (
					<div className="mt-auto pt-6 border-t border-black/10 shrink-0">
						<button
							type="button"
							onClick={onVerifyNow}
							className="w-full py-3 bg-[#FFC940] text-black border-[3px] border-black rounded-2xl font-black text-center text-xs tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all flex items-center justify-center gap-2 select-none"
						>
							VERIFY KYC NOW
						</button>
					</div>
				)}
			</div>
		</div>
	)
}
