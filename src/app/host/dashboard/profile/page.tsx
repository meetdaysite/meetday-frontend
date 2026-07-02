"use client"

// import { useState } from "react"
import Link from "next/link"
import clsx from "clsx"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import { useHostStore } from "@/store/hostStore"

import UserSvg from "@/icons/outlined/user.svg"
import CheckCircleSvg from "@/icons/outlined/check-circle.svg"
import ClockCircleSvg from "@/icons/outlined/clock-circle.svg"
import CloseCircleSvg from "@/icons/outlined/close-circle.svg"
import MapPointRotateSvg from "@/icons/outlined/map-point-rotate.svg"
// import BellSvg from "@/icons/outlined/bell.svg"
import CardSvg from "@/icons/filled/card.svg"
import Chart2OutSvg from "@/icons/outlined/chart-2.svg"

// ─── Status badge ─────────────────────────────────────────────────────────────

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
		className: "bg-surface-card-muted text-text-secondary",
		Icon: ClockCircleSvg,
	}
	return (
		<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-badge text-caption font-medium ${className}`}>
			<BadgeIcon className="size-3.5" aria-hidden />
			{label}
		</span>
	)
}

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex items-center justify-between gap-4 py-3 border-b border-border-default last:border-b-0">
			<p className="text-label-sm text-text-tertiary shrink-0">{label}</p>
			<div className="text-right">{value}</div>
		</div>
	)
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ icon, title, children, className, action }: {
	icon: React.ReactNode
	title: string
	children: React.ReactNode
	className?: string
	action?: React.ReactNode
}) {
	return (
		<div className={clsx("bg-surface-card border border-border-default rounded-action px-5 py-5", className)}>
			<div className="flex items-center justify-between gap-3 mb-5">
				<div className="flex items-center gap-3">
					<div className="size-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
						{icon}
					</div>
					<h2 className="text-label-lg font-semibold text-text-primary">{title}</h2>
				</div>
				{action}
			</div>
			{children}
		</div>
	)
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

// function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
// 	return (
// 		<button
// 			role="switch"
// 			aria-checked={checked}
// 			onClick={() => onChange(!checked)}
// 			className={clsx(
// 				"relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2",
// 				checked ? "bg-action-primary" : "bg-neutral-200",
// 			)}
// 		>
// 			<span className={clsx(
// 				"pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200",
// 				checked ? "translate-x-5" : "translate-x-0",
// 			)} />
// 		</button>
// 	)
// }

// ─── Data ─────────────────────────────────────────────────────────────────────

// const NOTIFICATION_PREFS = [
// 	{ id: "new-registration", label: "New Registration", description: "When someone registers for your event", defaultOn: true },
// 	{ id: "review-updates", label: "Review Updates", description: "Event approved, rejected, or under review", defaultOn: true },
// 	{ id: "payout-notifications", label: "Payout Notifications", description: "When earnings are sent to your account", defaultOn: true },
// 	{ id: "attendee-messages", label: "Attendee Messages", description: "Direct messages from attendees", defaultOn: false },
// ]

const PLAN_LABELS: Record<string, string> = {
	DISCOVER: "Discover Plan",
	COMMUNITY: "Community Plan",
	SELL: "Sell Plan",
}

const GENDER_LABELS: Record<string, string> = {
	MALE: "Male",
	FEMALE: "Female",
	OTHER: "Other",
	PREFER_NOT_TO_SAY: "Prefer not to say",
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
	const { profile } = useHostStore()

	// const [notifs, setNotifs] = useState<Record<string, boolean>>(
	// 	Object.fromEntries(NOTIFICATION_PREFS.map(n => [n.id, n.defaultOn])),
	// )

	const displayName = profile?.displayName || "Host"
	const initials = displayName.split(" ").filter(Boolean).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "H"
	const planLabel = profile?.currentPlan ? PLAN_LABELS[profile.currentPlan] ?? profile.currentPlan : "—"

	const address = profile?.address
	const formattedAddress = address
		? [
			address.addressLine1,
			address.addressLine2,
			address.city,
			address.state && address.pincode ? `${address.state} ${address.pincode}` : address.state || address.pincode,
			address.country,
		].filter(Boolean).join(", ")
		: null

	const hasSocial = profile?.socialLinks && Object.values(profile.socialLinks).some(Boolean)
	const hasExtra = hasSocial || (profile?.languages?.length ?? 0) > 0 || (profile?.portfolioLinks?.length ?? 0) > 0

	return (
		<div className="flex flex-col min-h-screen">
			<DashboardTopBar />

			<div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 bg-surface-page">
				{/* Header */}
				<div className="mb-6">
					<h1 className="text-heading-sm font-semibold text-text-primary">Profile</h1>
					<p className="text-body-sm text-text-secondary mt-0.5">Your host identity and account details</p>
				</div>

				{/* 2-column grid */}
				<div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4 items-start">

					{/* ── LEFT COLUMN ─────────────────────────────────────── */}
					<div className="flex flex-col gap-4">

						{/* Identity */}
						<SectionCard
							icon={<Icon as={UserSvg} size="md" color="brand" />}
							title="Host Identity"
							action={
								<Link href="/host/dashboard/profile/edit">
									<Button variant="secondary" size="sm" radius="pill">
										Edit Profile
									</Button>
								</Link>
							}
						>
							{/* Avatar row */}
							<div className="flex items-center gap-4 mb-6 pb-6 border-b border-border-default">
								<div className="size-20 rounded-full shrink-0 overflow-hidden bg-red-100 flex items-center justify-center text-red-700 text-heading-sm font-bold select-none">
									{profile?.avatarUrl
										// eslint-disable-next-line @next/next/no-img-element
										? <img src={profile.avatarUrl} alt={displayName} className="size-full object-cover" />
										: initials
									}
								</div>
								<div>
									<p className="text-title-sm font-semibold text-text-primary">{displayName}</p>
									{profile?.legalName && profile.legalName !== displayName && (
										<p className="text-caption text-text-muted mt-0.5">Legal: {profile.legalName}</p>
									)}
									{profile && (
										<span className="mt-2 inline-flex items-center px-2 py-0.5 rounded-badge text-caption font-medium bg-surface-card-muted text-text-secondary">
											{profile.hostType === "INDIVIDUAL" ? "Individual Host" : "Business Host"}
										</span>
									)}
								</div>
							</div>

							{/* Identity info rows */}
							<div className="-my-3">
								{profile?.gender && (
									<InfoRow label="Gender" value={<p className="text-label-sm text-text-primary">{GENDER_LABELS[profile.gender] ?? profile.gender}</p>} />
								)}
								{profile?.tagline && (
									<InfoRow label="Tagline" value={<p className="text-label-sm text-text-primary">{profile.tagline}</p>} />
								)}
								{profile?.hostBio && (
									<InfoRow label="Bio" value={<p className="text-label-sm text-text-primary max-w-xs text-right leading-snug">{profile.hostBio}</p>} />
								)}
								{profile?.pan && (
									<InfoRow label="PAN" value={<p className="text-label-sm text-text-primary font-mono">{profile.pan}</p>} />
								)}
								{profile?.gstin && (
									<InfoRow label="GSTIN" value={<p className="text-label-sm text-text-primary font-mono">{profile.gstin}</p>} />
								)}
							</div>
						</SectionCard>

						{/* Categories */}
						{profile?.categories && profile.categories.length > 0 && (
							<SectionCard icon={<Icon as={Chart2OutSvg} size="md" color="brand" />} title="Experience Categories">
								<div className="flex flex-wrap gap-2">
									{profile.categories.map(({ category }) => (
										<span key={category.id} className="inline-flex items-center px-3 py-1 rounded-badge text-label-sm font-medium bg-surface-brand-soft text-text-brand border border-border-brand">
											{category.name}
										</span>
									))}
								</div>
							</SectionCard>
						)}

						{/* Experience & Cities */}
						{profile && (
							profile.yearsOfExperience != null ||
							profile.totalEventsPreviouslyHosted != null ||
							(profile.operatingCities?.length ?? 0) > 0 ||
							profile.totalEventsHosted != null ||
							profile.averageRating != null
						) && (
							<SectionCard icon={<Icon as={MapPointRotateSvg} size="md" color="brand" />} title="Experience & Cities">
								<div className="-my-3">
									{profile?.yearsOfExperience != null && (
										<InfoRow
											label="Years of experience"
											value={<p className="text-label-sm text-text-primary">{profile.yearsOfExperience} yr{profile.yearsOfExperience !== 1 ? "s" : ""}</p>}
										/>
									)}
									{profile?.totalEventsPreviouslyHosted != null && (
										<InfoRow
											label="Experiences hosted before"
											value={<p className="text-label-sm text-text-primary">{profile.totalEventsPreviouslyHosted}</p>}
										/>
									)}
									{profile?.totalEventsHosted != null && (
										<InfoRow
											label="Experiences hosted on Meetday"
											value={<p className="text-label-sm text-text-primary">{profile.totalEventsHosted}</p>}
										/>
									)}
									{profile?.averageRating != null && (
										<InfoRow
											label="Average rating"
											value={<p className="text-label-sm text-text-primary">{profile.averageRating.toFixed(1)} ★ ({profile.totalReviews ?? 0} reviews)</p>}
										/>
									)}
									{profile?.operatingCities && profile.operatingCities.length > 0 && (
										<InfoRow
											label="Operating cities"
											value={
												<div className="flex flex-wrap gap-1.5 justify-end">
													{profile.operatingCities.map(city => (
														<span key={city} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-badge text-caption font-medium bg-surface-card-muted text-text-secondary">
															<MapPointRotateSvg className="size-3" aria-hidden />
															{city}
														</span>
													))}
												</div>
											}
										/>
									)}
								</div>
							</SectionCard>
						)}

						{/* Social & Links */}
						{hasExtra && (
							<SectionCard icon={<Icon as={UserSvg} size="md" color="brand" />} title="Social & Links">
								<div className="-my-3">
									{profile?.socialLinks?.youtube && (
										<InfoRow label="YouTube" value={<p className="text-label-sm text-text-brand truncate max-w-50">{profile.socialLinks.youtube}</p>} />
									)}
									{profile?.socialLinks?.instagram && (
										<InfoRow label="Instagram" value={<p className="text-label-sm text-text-brand truncate max-w-50">{profile.socialLinks.instagram}</p>} />
									)}
									{profile?.socialLinks?.linkedin && (
										<InfoRow label="LinkedIn" value={<p className="text-label-sm text-text-brand truncate max-w-50">{profile.socialLinks.linkedin}</p>} />
									)}
									{profile?.socialLinks?.portfolio && (
										<InfoRow label="Portfolio" value={<p className="text-label-sm text-text-brand truncate max-w-50">{profile.socialLinks.portfolio}</p>} />
									)}
									{profile?.languages && profile.languages.length > 0 && (
										<InfoRow
											label="Languages"
											value={
												<div className="flex flex-wrap gap-1.5 justify-end">
													{profile.languages.map(lang => (
														<span key={lang} className="inline-flex items-center px-2 py-0.5 rounded-badge text-caption font-medium bg-surface-card-muted text-text-secondary">{lang}</span>
													))}
												</div>
											}
										/>
									)}
									{profile?.portfolioLinks && profile.portfolioLinks.length > 0 && (
										<InfoRow
											label="Portfolio links"
											value={
												<div className="flex flex-col gap-1 items-end">
													{profile.portfolioLinks.map((link, i) => (
														<p key={i} className="text-label-sm text-text-brand truncate max-w-50">{link}</p>
													))}
												</div>
											}
										/>
									)}
								</div>
							</SectionCard>
						)}

						{/* Address */}
						{formattedAddress && (
							<SectionCard icon={<Icon as={MapPointRotateSvg} size="md" color="brand" />} title="Address">
								<p className="text-label-sm text-text-primary leading-relaxed">{formattedAddress}</p>
							</SectionCard>
						)}
					</div>

					{/* ── RIGHT COLUMN ────────────────────────────────────── */}
					<div className="flex flex-col gap-4">

						{/* Verification & Approval */}
						{profile && (
							<SectionCard icon={<Icon as={CheckCircleSvg} size="md" color="brand" />} title="Verification">
								<div className="-my-3">
									<InfoRow label="Approval" value={<StatusBadge status={profile.approvalStatus} />} />
									{profile.rejectionReason && (
										<InfoRow label="Reason" value={<p className="text-label-sm text-status-error-text max-w-50 text-right leading-snug">{profile.rejectionReason}</p>} />
									)}
									<InfoRow label="KYC" value={<StatusBadge status={profile.kycStatus} />} />
									{profile.kycFailureReason && (
										<InfoRow label="KYC reason" value={<p className="text-label-sm text-status-error-text max-w-50 text-right leading-snug">{profile.kycFailureReason}</p>} />
									)}
									<InfoRow label="PAN" value={<StatusBadge status={profile.panVerificationStatus} />} />
									<InfoRow label="Bank" value={<StatusBadge status={profile.bankVerificationStatus} />} />
								</div>
							</SectionCard>
						)}

						{/* Subscription */}
						{profile && (
							<SectionCard icon={<Icon as={CardSvg} size="md" color="brand" />} title="Subscription">
								<div className="bg-red-50 border border-red-100 rounded-panel shadow-md px-4 py-3.5">
									<p className="text-label-sm font-semibold text-text-primary">{planLabel}</p>
									<p className="text-caption text-text-tertiary mt-0.5">
										{profile.currentPlan ?? "No active plan"}
									</p>
								</div>
							</SectionCard>
						)}

						{/* Notification Preferences */}
						{/* <SectionCard icon={<Icon as={BellSvg} size="md" color="brand" />} title="Notifications">
							<div className="flex flex-col divide-y divide-border-default -my-1">
								{NOTIFICATION_PREFS.map((notif, i) => (
									<div
										key={notif.id}
										className={clsx(
											"flex items-center justify-between gap-3 py-4",
											i === 0 && "pt-0",
											i === NOTIFICATION_PREFS.length - 1 && "pb-0",
										)}
									>
										<div className="min-w-0">
											<p className="text-label-sm font-semibold text-text-primary">{notif.label}</p>
											<p className="text-caption text-text-tertiary mt-0.5 leading-snug">{notif.description}</p>
										</div>
										<Toggle
											checked={notifs[notif.id]}
											onChange={v => setNotifs(prev => ({ ...prev, [notif.id]: v }))}
										/>
									</div>
								))}
							</div>
						</SectionCard> */}

					</div>
				</div>
			</div>
		</div>
	)
}
