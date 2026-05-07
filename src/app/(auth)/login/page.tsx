"use client"

import { useState } from "react"
import Link from "next/link"
import { AuthShell } from "@/components/auth/AuthShell"
import { AuthTabs } from "@/components/auth/AuthTabs"
import { SocialSignIn } from "@/components/auth/SocialSignIn"
import { Button } from "@/components/ui/Button"
import { TextField } from "@/components/ui/TextField"
import { Checkbox } from "@/components/ui/Checkbox"
import { Icon } from "@/components/ui/Icon"
import UserSvg from "@/icons/outlined/user.svg"
import LockPasswordSvg from "@/icons/outlined/lock-password.svg"
import EyeOpenSvg from "@/icons/outlined/eye-open.svg"
import EyeClosedSvg from "@/icons/outlined/eye-closed.svg"

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
					leftIcon={<Icon as={UserSvg} />}
					size="md"
					autoComplete="email"
				/>

				<TextField
					label="Password"
					placeholder="Enter your password"
					type={showPassword ? "text" : "password"}
					leftIcon={<Icon as={LockPasswordSvg} />}
					rightIcon={
						<button
							type="button"
							onClick={() => setShowPassword(v => !v)}
							className="text-icon-muted hover:text-icon-secondary transition-colors"
							aria-label={showPassword ? "Hide password" : "Show password"}
						>
							{showPassword ? <Icon as={EyeClosedSvg} /> : <Icon as={EyeOpenSvg} />}
						</button>
					}
					size="md"
					autoComplete="current-password"
				/>

				{/* Remember me + Forgot password */}
				<div className="flex items-center justify-between">
					<Checkbox label="Remember me" checked={rememberMe} onChange={setRememberMe} size="sm" />
					<Link
						href="/forgot-password"
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
					Use OTP Instead
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
					<Link href="/signup" className="font-medium text-text-link hover:underline">
						Create an account
					</Link>
				</p>
			</form>
		</AuthShell>
	)
}
