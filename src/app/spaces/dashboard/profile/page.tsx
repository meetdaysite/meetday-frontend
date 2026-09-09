"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSpaceStore } from "@/store/spaceStore"
import { useAuthStore } from "@/store/authStore"
import { LogoutConfirmDialog } from "@/components/ui/LogoutConfirmDialog"
import { Button } from "@/components/ui/Button"

export default function SpacesProfilePage() {
	const { profile, clearProfile } = useSpaceStore()
	const { user, signOut } = useAuthStore()
	const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
	const router = useRouter()

	async function handleSignOut() {
		clearProfile()
		router.replace("/spaces")
		await signOut()
	}

	const businessName = profile?.businessName || "Space Partner"
	const email = user?.email || ""
	const phone = profile?.phone || "Not provided"
	const cities = profile?.operatingCities || []

	return (
		<div className="flex flex-col gap-6 w-full max-w-3xl">
			{/* Top Bar */}
			<div className="flex items-center justify-between border-b border-black/10 pb-4">
				<div>
					<Link
						href="/spaces/dashboard"
						className="inline-flex items-center gap-1.5 text-xs font-bold text-black/50 hover:text-black transition-colors mb-1"
					>
						<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
						</svg>
						Back to Dashboard
					</Link>
					<h1 className="font-heading text-3xl font-black text-black">
						Space Partner Profile
					</h1>
				</div>

				<Button
					variant="secondary"
					size="sm"
					className="border-2 border-black rounded-xl font-bold bg-white text-black hover:bg-red-50 hover:text-[#EE2C2C] hover:border-[#EE2C2C] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
					onClick={() => setShowLogoutConfirm(true)}
				>
					Log Out
				</Button>
			</div>

			{/* Business & Account Details Card */}
			<div className="bg-white border-[3px] border-black rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-6">
				<div className="flex items-center gap-4">
					<div className="size-16 rounded-2xl bg-[#FFCE29] border-2 border-black flex items-center justify-center text-2xl font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
						🏢
					</div>
					<div>
						<span className="text-[10px] font-black uppercase text-[#EE2C2C] tracking-wider">
							Venue / Space Partner
						</span>
						<h2 className="font-heading text-2xl font-black text-black leading-tight">
							{businessName}
						</h2>
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-black/10 pt-4">
					<div>
						<span className="text-xs font-bold text-black/50 uppercase tracking-wider block">
							Registered Email
						</span>
						<p className="text-sm font-bold text-black mt-1 break-all">
							{email || "—"}
						</p>
					</div>

					<div>
						<span className="text-xs font-bold text-black/50 uppercase tracking-wider block">
							Contact Phone
						</span>
						<p className="text-sm font-bold text-black mt-1">
							{phone}
						</p>
					</div>
				</div>

				<div className="border-t border-black/10 pt-4">
					<span className="text-xs font-bold text-black/50 uppercase tracking-wider block mb-2">
						Operating Cities
					</span>
					{cities.length > 0 ? (
						<div className="flex flex-wrap gap-2">
							{cities.map((city) => (
								<span
									key={city}
									className="px-3 py-1 bg-[#EE2C2C] text-white text-xs font-bold rounded-full shadow-sm"
								>
									{city}
								</span>
							))}
						</div>
					) : (
						<p className="text-xs text-black/50">No cities registered yet.</p>
					)}
				</div>
			</div>

			{/* Danger / Logout Section */}
			<div className="bg-[#FFFDF9] border-2 border-black/20 rounded-[24px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h3 className="font-heading text-base font-black text-black">
						Session Management
					</h3>
					<p className="text-xs font-medium text-black/60 mt-0.5">
						Sign out from your active Space Partner session on this device.
					</p>
				</div>
				<button
					type="button"
					onClick={() => setShowLogoutConfirm(true)}
					className="px-5 py-2.5 bg-[#EE2C2C] text-white border-2 border-black rounded-xl font-bold text-xs tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer w-fit"
				>
					Sign Out
				</button>
			</div>

			<LogoutConfirmDialog
				open={showLogoutConfirm}
				onClose={() => setShowLogoutConfirm(false)}
				onConfirm={handleSignOut}
			/>
		</div>
	)
}
