"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Icon } from "@/components/ui/Icon"
import { useSpaceStore } from "@/store/spaceStore"
import { useAuthStore } from "@/store/authStore"
import { getSpaceCommunityProfile, type SpaceCommunityProfile } from "@/lib/api"
import { NotificationSoundToggle } from "@/components/ui/NotificationSoundToggle"
import { LogoutConfirmDialog } from "@/components/ui/LogoutConfirmDialog"
import { SpaceCommunityProfileForm } from "@/components/spaces/SpaceCommunityProfileForm"
import UserSvg from "@/icons/outlined/user.svg"
import clsx from "clsx"

export default function SpacesProfilePage() {
	const { profile, clearProfile } = useSpaceStore()
	const { user, signOut } = useAuthStore()
	const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
	const [showCommunityModal, setShowCommunityModal] = useState(false)
	const [community, setCommunity] = useState<SpaceCommunityProfile | null>(null)
	const [communityLoading, setCommunityLoading] = useState(true)
	const router = useRouter()
	const searchParams = useSearchParams()

	useEffect(() => {
		getSpaceCommunityProfile()
			.then(setCommunity)
			.catch(() => {})
			.finally(() => setCommunityLoading(false))
	}, [])

	useEffect(() => {
		const open = searchParams ? searchParams.get("open") : null
		if (open === "community") {
			setShowCommunityModal(true)
		}
	}, [searchParams])

	async function handleSignOut() {
		clearProfile()
		router.replace("/spaces")
		await signOut()
	}

	const businessName = profile?.businessName || "Space Partner"
	const email = user?.email || profile?.user?.email || ""
	const phone = profile?.phone || profile?.user?.phone || ""
	const cities = profile?.operatingCities || []
	const avatarUrl = profile?.user?.avatarUrl

	const isPanelOpen = showCommunityModal

	return (
		<div className="flex flex-col min-h-full bg-white">
			{/* Top Nav / Subheader */}
			<div className="flex justify-between items-center px-8 py-4 border-b border-black/10 shrink-0">
				<p className="text-sm font-semibold text-black/50 mx-auto">
					Welcome to <span className="text-[#EE2C2C] font-bold">Meetday</span>
				</p>
			</div>

			<div className={clsx(
				"flex-1 min-h-0 w-full overflow-hidden relative",
				isPanelOpen ? "md:grid md:grid-cols-[65%_35%]" : "flex"
			)}>
				{/* Left Column: Profile details */}
				<div className={clsx(
					"px-4 lg:px-6 py-8 flex-1 flex flex-col gap-8 overflow-y-auto h-full w-full",
					isPanelOpen ? "max-w-none" : "max-w-3xl mx-auto"
				)}>
					{/* Header */}
					<div>
						<h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-black leading-tight">
							My Profile
						</h1>
						<p className="text-sm font-semibold text-black/50 mt-1.5">
							Your space partner identity and account details
						</p>
					</div>

					{/* Yellow Card Container */}
					<div className="w-full bg-[#FFC940] border-[3px] border-black rounded-[28px] p-3.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
						{/* Inner Dashed Card */}
						<div className="w-full bg-white border-2 border-dashed border-black/40 rounded-[20px] p-6 flex flex-col gap-5">
							{/* Avatar Row */}
							<div className="flex items-center gap-4">
								<div className="relative size-16 rounded-2xl border-[3px] border-black overflow-hidden bg-slate-50 flex items-center justify-center shrink-0">
									{avatarUrl ? (
										// eslint-disable-next-line @next/next/no-img-element
										<img src={avatarUrl} alt={businessName} className="size-full object-cover" />
									) : (
										<Icon as={UserSvg} size="lg" className="text-black size-8" />
									)}
								</div>

								<div className="flex flex-col gap-1.5">
									<p className="text-xl font-heading font-black text-black leading-none">{businessName}</p>
									<span className="inline-block bg-[#1E1B4B] text-white text-[8px] font-black px-2.5 py-0.5 rounded-lg uppercase tracking-wider w-max">
										Venue / Space Partner
									</span>
								</div>
							</div>

							{/* Divider */}
							<hr className="border-dashed border-black/10 my-1" />

							{/* Info Rows */}
							<div className="flex flex-col gap-3">
								<div className="flex gap-2 text-sm font-semibold">
									<span className="text-black/50 w-24">Email ID :</span>
									<span className="text-[#6C32D1] font-bold truncate max-w-[280px]">
										{email || "Not specified"}
									</span>
								</div>
								<div className="flex gap-2 text-sm font-semibold">
									<span className="text-black/50 w-24">Phone No :</span>
									<span className="text-[#6C32D1] font-bold">
										{phone || "Not specified"}
									</span>
								</div>
								<div className="flex gap-2 text-sm font-semibold">
									<span className="text-black/50 w-24">Cities :</span>
									<span className="text-[#6C32D1] font-bold truncate max-w-[280px]">
										{cities.length > 0 ? cities.join(", ") : "Not specified"}
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* Options Menu List */}
					<div className="flex flex-col mt-4">
						{/* Community Spaces Profile */}
						<div
							onClick={() => !communityLoading && setShowCommunityModal(true)}
							className={clsx(
								"flex items-center justify-between py-4 border-b border-black/10 hover:bg-black/[0.01]",
								communityLoading ? "cursor-wait opacity-60" : "cursor-pointer"
							)}
						>
							<span className="font-heading font-black text-base text-black">Community Spaces Profile</span>
							<div className="flex items-center gap-3">
								<button
									type="button"
									className="bg-[#EE2C2C] text-white text-[9px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[#1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all select-none"
								>
									{communityLoading ? "LOADING…" : community ? "VIEW DETAILS" : "ACTIVATE NOW"}
								</button>
								<span className="text-black/50 font-black text-lg">&gt;</span>
							</div>
						</div>

						<NotificationSoundToggle />

						{/* Profile Actions */}
						<div className="flex items-center justify-between py-4">
							<span className="font-heading font-black text-base text-black">Profile Actions</span>
							<div className="flex items-center gap-3">
								<button
									type="button"
									onClick={() => setShowLogoutConfirm(true)}
									className="bg-white border-[3px] border-black text-black rounded-2xl px-4 py-2 font-black text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
								>
									LOG OUT
								</button>
							</div>
						</div>
					</div>
				</div>

				{/* Right Column: Slide-in Drawer for Community Spaces Profile */}
				{isPanelOpen && (
					<>
						{/* Mobile/Tablet Backdrop Blur */}
						<div
							onClick={() => setShowCommunityModal(false)}
							className="lg:hidden fixed inset-0 bg-black/45 z-40 backdrop-blur-xs"
						/>

						{/* Responsive drawer container */}
						<div className={clsx(
							"bg-white h-full flex flex-col z-50 transition-all duration-300 animate-in slide-in-from-right overflow-y-auto",
							"fixed inset-y-0 right-0 w-full sm:w-[460px] border-l-4 border-black shadow-modal",
							"lg:static lg:border-l-0 lg:border-l lg:border-black/10 lg:shadow-none lg:w-full"
						)}>
							<SpaceCommunityProfileForm
								onClose={() => setShowCommunityModal(false)}
								onSaved={(saved) => setCommunity(saved)}
							/>
						</div>
					</>
				)}
			</div>

			<LogoutConfirmDialog
				open={showLogoutConfirm}
				onClose={() => setShowLogoutConfirm(false)}
				onConfirm={handleSignOut}
			/>
		</div>
	)
}
