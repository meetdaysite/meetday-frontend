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
import EmailSvg from "@/icons/outlined/email.svg"
import PhoneSvg from "@/icons/outlined/phone.svg"
import LockPasswordSvg from "@/icons/outlined/lock-password.svg"
import EyeOpenSvg from "@/icons/outlined/eye-open.svg"
import EyeClosedSvg from "@/icons/outlined/eye-closed.svg"

export default function SignupPage() {
	const [showPassword, setShowPassword] = useState(false)
	const [agreed, setAgreed] = useState(false)

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
					label="Full name"
					placeholder="Enter your full name"
					type="text"
					leftIcon={<Icon as={UserSvg} />}
					size="md"
					autoComplete="name"
				/>

				<TextField
					label="Work email"
					placeholder="name@company.com"
					type="email"
					leftIcon={<Icon as={EmailSvg} />}
					size="md"
					autoComplete="email"
				/>

				<TextField
					label="Phone number"
					placeholder="Enter your phone number"
					type="tel"
					leftIcon={<Icon as={PhoneSvg} />}
					size="md"
					autoComplete="tel"
				/>

				<TextField
					label="Password"
					placeholder="Create a strong password"
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
					autoComplete="new-password"
				/>

				{/* Terms */}
				<label className="flex items-start gap-2.5 cursor-pointer">
					<Checkbox checked={agreed} onChange={setAgreed} size="sm" />
					<span className="text-body-sm text-text-secondary leading-snug">
						I agree to the{" "}
						<Link href="/terms" className="font-medium text-text-link hover:underline">
							Terms of service
						</Link>{" "}
						and{" "}
						<Link href="/privacy" className="font-medium text-text-link hover:underline">
							Privacy Policy
						</Link>
					</span>
				</label>

				<Button
					type="submit"
					variant="primary"
					size="md"
					radius="pill"
					className="w-full mt-1"
					disabled={!agreed}
				>
					Sign up
				</Button>

				{/* Divider */}
				<div className="flex items-center gap-3 my-1">
					<div className="flex-1 h-px bg-border-default" />
					<span className="text-caption text-text-muted">or</span>
					<div className="flex-1 h-px bg-border-default" />
				</div>

				<SocialSignIn layout="side-by-side" />

				<p className="text-center text-body-sm text-text-secondary mt-1">
					Already have an account?{" "}
					<Link href="/login" className="font-medium text-text-link hover:underline">
						Log in
					</Link>
				</p>
			</form>
		</AuthShell>
	)
}
