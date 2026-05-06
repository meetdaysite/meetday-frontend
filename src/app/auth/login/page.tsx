"use client"

import { useState } from "react"
import Link from "next/link"
import { AuthShell } from "@/components/auth/AuthShell"
import { AuthTabs } from "@/components/auth/AuthTabs"
import { SocialSignIn } from "@/components/auth/SocialSignIn"
import { Button } from "@/components/ui/Button"
import { TextField } from "@/components/ui/TextField"
import { Checkbox } from "@/components/ui/Checkbox"

function UserIcon() {
	return (
		<svg
			viewBox="0 0 20 20"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.5}
			strokeLinecap="round"
			strokeLinejoin="round"
			className="size-full"
		>
			<circle cx="10" cy="7" r="3.5" />
			<path d="M2.5 17.5c0-4.142 3.358-7.5 7.5-7.5s7.5 3.358 7.5 7.5" />
		</svg>
	)
}

function LockIcon() {
	return (
		<svg
			viewBox="0 0 20 20"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.5}
			strokeLinecap="round"
			strokeLinejoin="round"
			className="size-full"
		>
			<rect x="4" y="9" width="12" height="9" rx="2" />
			<path d="M7 9V6.5a3 3 0 1 1 6 0V9" />
		</svg>
	)
}

function EyeIcon() {
	return (
		<svg
			viewBox="0 0 20 20"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.5}
			strokeLinecap="round"
			strokeLinejoin="round"
			className="size-full"
		>
			<path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" />
			<circle cx="10" cy="10" r="2.5" />
		</svg>
	)
}

function EyeOffIcon() {
	return (
		<svg
			viewBox="0 0 20 20"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.5}
			strokeLinecap="round"
			strokeLinejoin="round"
			className="size-full"
		>
			<path d="M3 3l14 14M8.46 8.53A2.5 2.5 0 0 0 10 12.5a2.5 2.5 0 0 0 1.47-.53M6.11 6.18C4.5 7.23 3 10 3 10s3 6 7 6c1.5 0 2.87-.56 4-1.49M10 4c4 0 7 6 7 6-.7 1.28-1.59 2.38-2.6 3.25" />
		</svg>
	)
}

export default function LoginPage() {
	const [showPassword, setShowPassword] = useState(false)
	const [rememberMe, setRememberMe] = useState(false)

	return (
		<AuthShell phoneImage="/assets/phone_image_login.svg" pointsImage="/assets/points_login.svg">
			<AuthTabs />

			{/* Heading */}
			<div className="mb-6">
				<h1 className="text-heading-sm text-text-primary mb-1">
					Start hosting on <span className="text-text-brand">meetday</span>
				</h1>
				<p className="text-body-sm text-text-secondary">
					Create events, grow your community, and build a host presence people trust
				</p>
			</div>

			<form className="flex flex-col gap-4" onSubmit={e => e.preventDefault()}>
				<TextField
					label="Email or phone number"
					placeholder="Enter your email or phone number"
					type="text"
					leftIcon={<UserIcon />}
					size="md"
					autoComplete="email"
				/>

				<TextField
					label="Password"
					placeholder="Enter your password"
					type={showPassword ? "text" : "password"}
					leftIcon={<LockIcon />}
					rightIcon={
						<button
							type="button"
							onClick={() => setShowPassword(v => !v)}
							className="text-icon-muted hover:text-icon-secondary transition-colors"
							aria-label={showPassword ? "Hide password" : "Show password"}
						>
							{showPassword ? <EyeOffIcon /> : <EyeIcon />}
						</button>
					}
					size="md"
					autoComplete="current-password"
				/>

				{/* Remember me + Forgot password */}
				<div className="flex items-center justify-between">
					<Checkbox label="Remember me" checked={rememberMe} onChange={setRememberMe} size="sm" />
					<Link
						href="/auth/forgot-password"
						className="text-sm font-medium text-text-link hover:underline"
					>
						Forgot password?
					</Link>
				</div>

				<Button type="submit" variant="primary" size="md" radius="pill" className="w-full mt-1">
					Log in
				</Button>

				<Button
					type="button"
					variant="secondary"
					size="md"
					radius="pill"
					className="w-full"
					onClick={() => {
						/* TODO: wire OTP login */
					}}
				>
					Use Instead OTP
				</Button>

				{/* Divider */}
				<div className="flex items-center gap-3 my-1">
					<div className="flex-1 h-px bg-border-default" />
					<span className="text-caption text-text-muted">or</span>
					<div className="flex-1 h-px bg-border-default" />
				</div>

				<SocialSignIn layout="stacked" />

				<p className="text-center text-body-sm text-text-secondary mt-1">
					New to meetday?{" "}
					<Link href="/auth/signup" className="font-medium text-text-link hover:underline">
						Create an account
					</Link>
				</p>
			</form>
		</AuthShell>
	)
}
