"use client"

import Link from "next/link"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import { useBrandStore } from "@/store/brandStore"

import UserSvg from "@/icons/outlined/user.svg"
import CheckCircleSvg from "@/icons/outlined/check-circle.svg"
import ClockCircleSvg from "@/icons/outlined/clock-circle.svg"
import Chart2OutSvg from "@/icons/outlined/chart-2.svg"

function SectionCard({ icon, title, children, action }: {
	icon: React.ReactNode
	title: string
	children: React.ReactNode
	action?: React.ReactNode
}) {
	return (
		<div className="bg-surface-card border border-border-default rounded-action px-5 py-5">
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

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex items-center justify-between gap-4 py-3 border-b border-border-default last:border-b-0">
			<p className="text-label-sm text-text-tertiary shrink-0">{label}</p>
			<div className="text-right">{value}</div>
		</div>
	)
}

export default function ProfilePage() {
	const { profile } = useBrandStore()

	const displayName = profile?.brandName || "Brand"
	const initials = displayName.split(" ").filter(Boolean).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "B"
	const socialLinks = profile?.socialLinks ?? {}
	const hasSocialLinks = Object.values(socialLinks).some(Boolean)

	return (
		<div className="flex flex-col min-h-screen">
			<DashboardTopBar />

			<div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 bg-surface-page">
				<div className="mb-6 flex items-center justify-between gap-4">
					<div>
						<h1 className="text-heading-sm font-semibold text-text-primary">My Profile</h1>
						<p className="text-body-sm text-text-secondary mt-0.5">Your brand identity and account details</p>
					</div>
					{profile && !profile.isProfileComplete && (
						<span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-badge text-caption font-medium bg-surface-warning-soft text-text-warning border border-yellow-200 shrink-0">
							<Icon as={ClockCircleSvg} size="xs" color="inherit" />
							Incomplete profile
						</span>
					)}
				</div>

				<div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4 items-start">
					<div className="flex flex-col gap-4">
						<SectionCard
							icon={<Icon as={UserSvg} size="md" color="brand" />}
							title="Brand Identity"
							action={
								<Link href="/brand/dashboard/profile/edit">
									<Button variant="secondary" size="sm" radius="pill">
										Edit Profile
									</Button>
								</Link>
							}
						>
							<div className="flex items-center gap-4 mb-6 pb-6 border-b border-border-default">
								<div className="size-20 rounded-full shrink-0 overflow-hidden bg-red-100 flex items-center justify-center text-red-700 text-heading-sm font-bold select-none">
									{profile?.logoUrl
										// eslint-disable-next-line @next/next/no-img-element
										? <img src={profile.logoUrl} alt={displayName} className="size-full object-cover" />
										: initials
									}
								</div>
								<div>
									<p className="text-title-sm font-semibold text-text-primary">{displayName}</p>
									{profile?.email && <p className="text-caption text-text-muted mt-0.5">{profile.email}</p>}
									{profile?.companyType && (
										<span className="mt-2 inline-flex items-center px-2 py-0.5 rounded-badge text-caption font-medium bg-surface-card-muted text-text-secondary">
											{profile.companyType === "AGENCY" ? "Agency" : "Brand"}
										</span>
									)}
								</div>
							</div>

							<div className="-my-3">
								{profile?.industry && (
									<InfoRow label="Industry" value={<p className="text-label-sm text-text-primary">{profile.industry}</p>} />
								)}
								{profile?.workEmail && (
									<InfoRow label="Work email" value={<p className="text-label-sm text-text-primary">{profile.workEmail}</p>} />
								)}
								{profile?.contactPhone && (
									<InfoRow label="Phone" value={<p className="text-label-sm text-text-primary">{profile.contactPhone}</p>} />
								)}
								{profile?.aboutCompany && (
									<InfoRow label="About" value={<p className="text-label-sm text-text-primary max-w-60 text-right leading-snug">{profile.aboutCompany}</p>} />
								)}
							</div>

							{profile?.isProfileComplete && (
								<div className="-my-3">
									<InfoRow
										label="Profile status"
										value={
											<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-badge text-caption font-medium bg-status-success-bg text-status-success-text">
												<Icon as={CheckCircleSvg} size="xs" color="inherit" />
												Complete
											</span>
										}
									/>
								</div>
							)}
						</SectionCard>

						{profile?.categories && profile.categories.length > 0 && (
							<SectionCard icon={<Icon as={Chart2OutSvg} size="md" color="brand" />} title="Categories">
								<div className="flex flex-wrap gap-2">
									{profile.categories.map((category) => (
										<span key={category.id} className="inline-flex items-center px-3 py-1 rounded-badge text-label-sm font-medium bg-surface-brand-soft text-text-brand border border-border-brand">
											{category.name}
										</span>
									))}
								</div>
							</SectionCard>
						)}

						{hasSocialLinks && (
							<SectionCard icon={<Icon as={UserSvg} size="md" color="brand" />} title="Social & Links">
								<div className="-my-3">
									{socialLinks.website && <InfoRow label="Website" value={<p className="text-label-sm text-text-brand truncate max-w-60">{socialLinks.website}</p>} />}
									{socialLinks.instagram && <InfoRow label="Instagram" value={<p className="text-label-sm text-text-brand truncate max-w-60">{socialLinks.instagram}</p>} />}
									{socialLinks.linkedin && <InfoRow label="LinkedIn" value={<p className="text-label-sm text-text-brand truncate max-w-60">{socialLinks.linkedin}</p>} />}
									{socialLinks.youtube && <InfoRow label="YouTube" value={<p className="text-label-sm text-text-brand truncate max-w-60">{socialLinks.youtube}</p>} />}
								</div>
							</SectionCard>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
