"use client"

import { useState } from "react"
import clsx from "clsx"
import { Icon } from "@/components/ui/Icon"
import { TextField } from "@/components/ui/TextField"
import { Button } from "@/components/ui/Button"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import UserSvg from "@/icons/outlined/user.svg"
import BellSvg from "@/icons/outlined/bell.svg"
import CameraAddSvg from "@/icons/outlined/camera-add.svg"
import CardSvg from "@/icons/filled/card.svg"

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
	return (
		<button
			role="switch"
			aria-checked={checked}
			onClick={() => onChange(!checked)}
			className={clsx(
				"relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2",
				checked ? "bg-action-primary" : "bg-neutral-200",
			)}
		>
			<span
				className={clsx(
					"pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200",
					checked ? "translate-x-5" : "translate-x-0",
				)}
			/>
		</button>
	)
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
	icon,
	title,
	children,
}: {
	icon: React.ReactNode
	title: string
	children: React.ReactNode
}) {
	return (
		<div className="bg-surface-card border border-border-subtle rounded-card px-5 py-5">
			<div className="flex items-center gap-3 mb-5">
				<div className="size-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
					{icon}
				</div>
				<h2 className="text-label-lg font-semibold text-text-primary">{title}</h2>
			</div>
			{children}
		</div>
	)
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function ProfileAvatar({ name }: { name: string }) {
	const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
	return (
		<div className="size-16 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-700 text-title-sm font-semibold select-none">
			{initials}
		</div>
	)
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const NOTIFICATIONS = [
	{
		id: "new-registration",
		label: "New Registration",
		description: "When someone registers for your event",
		defaultOn: true,
	},
	{
		id: "review-updates",
		label: "Review Updates",
		description: "Event approved, rejected, or under review",
		defaultOn: true,
	},
	{
		id: "payout-notifications",
		label: "Payout Notifications",
		description: "When earnings are sent to your account",
		defaultOn: true,
	},
	{
		id: "attendee-messages",
		label: "Attendee Messages",
		description: "Direct messages from attendees",
		defaultOn: false,
	},
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
	const [firstName, setFirstName] = useState("Alex")
	const [lastName, setLastName] = useState("Morgan")
	const [email, setEmail] = useState("alex.morgan@email.com")
	const [phone, setPhone] = useState("+1 (555) 000-1234")

	const [notifs, setNotifs] = useState<Record<string, boolean>>(
		Object.fromEntries(NOTIFICATIONS.map(n => [n.id, n.defaultOn])),
	)

	function handleSave() {
		// no-op for now — mock UI
	}

	return (
		<div className="flex flex-col min-h-screen">
			<DashboardTopBar />

			<div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 bg-surface-page">
				{/* Header */}
				<div className="mb-6">
					<h1 className="text-heading-sm font-semibold text-text-primary">Settings</h1>
					<p className="text-body-sm text-text-secondary mt-0.5">
						Manage your account and notification preferences
					</p>
				</div>

				<div className="flex flex-col gap-4 max-w-2xl">
					{/* Host Profile */}
					<SectionCard
						icon={<Icon as={UserSvg} size="md" color="brand" aria-hidden />}
						title="Host Profile"
					>
						{/* Avatar row */}
						<div className="flex items-center gap-4 mb-6">
							<ProfileAvatar name={`${firstName} ${lastName}`} />
							<div>
								<p className="text-label-md font-semibold text-text-primary">
									{firstName} {lastName}
								</p>
								<p className="text-body-sm text-text-tertiary mb-1">{email}</p>
								<button className="flex items-center gap-1 text-label-sm text-text-brand hover:opacity-80 transition-opacity">
									<Icon as={CameraAddSvg} size="sm" color="brand" aria-hidden />
									Change photo
								</button>
							</div>
						</div>

						{/* Form fields */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<TextField
								label="First Name"
								value={firstName}
								onChange={e => setFirstName(e.target.value)}
								placeholder="First name"
							/>
							<TextField
								label="Last Name"
								value={lastName}
								onChange={e => setLastName(e.target.value)}
								placeholder="Last name"
							/>
							<TextField
								label="Email"
								type="email"
								value={email}
								onChange={e => setEmail(e.target.value)}
								placeholder="Email address"
							/>
							<TextField
								label="Phone"
								type="tel"
								value={phone}
								onChange={e => setPhone(e.target.value)}
								placeholder="+1 (555) 000-0000"
							/>
						</div>
					</SectionCard>

					{/* Notification Preferences */}
					<SectionCard
						icon={<Icon as={BellSvg} size="md" color="brand" aria-hidden />}
						title="Notification Preferences"
					>
						<div className="flex flex-col divide-y divide-border-subtle -my-1">
							{NOTIFICATIONS.map((notif, i) => (
								<div
									key={notif.id}
									className={clsx(
										"flex items-center justify-between gap-4 py-4",
										i === 0 && "pt-0",
										i === NOTIFICATIONS.length - 1 && "pb-0",
									)}
								>
									<div>
										<p className="text-label-sm font-semibold text-text-primary">{notif.label}</p>
										<p className="text-caption text-text-tertiary mt-0.5">{notif.description}</p>
									</div>
									<Toggle
										checked={notifs[notif.id]}
										onChange={v => setNotifs(prev => ({ ...prev, [notif.id]: v }))}
									/>
								</div>
							))}
						</div>
					</SectionCard>

					{/* Host Plan */}
					<SectionCard
						icon={<Icon as={CardSvg} size="md" color="brand" aria-hidden />}
						title="Host Plan"
					>
						<div className="flex items-center justify-between gap-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3.5">
							<div>
								<p className="text-label-sm font-semibold text-text-primary">Host Pro Plan</p>
								<p className="text-caption text-text-tertiary mt-0.5">
									18 / 50 events used &middot; Renews Jun 1, 2026
								</p>
							</div>
							<Button variant="secondary" size="sm" radius="pill" className="shrink-0">
								Upgrade
							</Button>
						</div>
					</SectionCard>

					{/* Save Changes */}
					<div className="pt-2">
						<Button variant="primary" size="lg" radius="pill" onClick={handleSave} className="px-8">
							Save Changes
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
