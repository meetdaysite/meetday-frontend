"use client"

import Link from "next/link"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AuthShell } from "@/components/auth/AuthShell"
import { Checkbox } from "@/components/ui/Checkbox"
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton"
import { useGoogleSignIn } from "@/hooks/useGoogleSignIn"

const schema = z.object({
	agreed: z.literal(true, { message: "Please agree to the Terms of Service and Privacy Policy" }),
})

type FormValues = z.infer<typeof schema>

export default function SpacesSignupPage() {
	const { loading: googleLoading, handleGoogleSignIn } = useGoogleSignIn("signup", "spaces")

	const {
		control,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { agreed: true as unknown as undefined },
	})

	return (
		<AuthShell size="small" phoneImage="/assets/phone_image_login.svg" pointsImage="/assets/points_login.svg">
			<Link 
				href="/spaces" 
				className="inline-flex items-center gap-1.5 text-xs font-bold text-black/50 hover:text-black transition-colors mb-4"
			>
				<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
				</svg>
				Back to hubs
			</Link>

			<div className="mb-6">
				<h1 className="font-heading text-3xl font-black text-black mb-1">
					Join as Hub Partner
				</h1>
				<p className="text-body-sm text-text-secondary mt-2">
					List your venues, host top offline communities, and monetize your hubs.
				</p>
			</div>

			<div className="flex flex-col gap-1 mb-4">
				<Controller
					control={control}
					name="agreed"
					render={({ field }) => (
						<label className="flex items-start gap-2.5 cursor-pointer">
							<Checkbox
								checked={!!field.value}
								onChange={(checked) => field.onChange(checked || undefined)}
								size="sm"
							/>
							<span className="text-body-sm text-text-secondary leading-snug">
								I agree to the{" "}
								<a
									href="https://www.meetday.ai/terms"
									target="_blank"
									rel="noopener noreferrer"
									className="font-semibold text-text-link hover:underline"
								>
									Terms of service
								</a>{" "}
								and{" "}
								<a
									href="https://www.meetday.ai/privacy"
									target="_blank"
									rel="noopener noreferrer"
									className="font-semibold text-text-link hover:underline"
								>
									Privacy Policy
								</a>
							</span>
						</label>
					)}
				/>
				{errors.agreed && (
					<p className="text-caption text-text-danger">{errors.agreed.message}</p>
				)}
			</div>

			<div className="mt-2">
				<GoogleSignInButton
					onClick={handleGoogleSignIn}
					loading={googleLoading}
				/>
			</div>

			<p className="text-center text-body-sm text-text-secondary mt-6">
				Already have an account?{" "}
				<Link href="/spaces/login" className="font-semibold text-text-link hover:underline">
					Log in
				</Link>
			</p>

			{/* Bottom Section: Indicator Dots */}
			<div className="flex gap-2 justify-center items-center mt-8 mb-2">
				<span className="w-2 h-2 bg-black/15 rounded-full" />
				<span className="w-5 h-2 bg-[#EE2C2C] rounded-full transition-all" />
				<span className="w-2 h-2 bg-black/15 rounded-full" />
				<span className="w-2 h-2 bg-black/15 rounded-full" />
			</div>
		</AuthShell>
	)
}
