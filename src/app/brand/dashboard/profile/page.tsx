"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useBrandStore } from "@/store/brandStore"
import { useAuthStore } from "@/store/authStore"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import clsx from "clsx"

import UserSvg from "@/icons/outlined/user.svg"
import GlobeSvg from "@/icons/outlined/globe.svg"
import { EditBrandProfilePanel } from "@/components/brand/EditBrandProfilePanel"
import { DeleteAccountModal } from "@/components/ui/DeleteAccountModal"

export default function BrandProfilePage() {
	const { profile, clearProfile } = useBrandStore()
	const { signOut } = useAuthStore()
	const router = useRouter()
	const [showEditPanel, setShowEditPanel] = useState(false)
	const [showDeleteModal, setShowDeleteModal] = useState(false)

	const displayName = profile?.brandName || "Brand"
	const avatarUrl = profile?.logoUrl
	const email = profile?.email || ""
	const phone = profile?.phone || ""

	const handleSignOut = async () => {
		clearProfile()
		router.replace("/")
		await signOut()
	}

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
				showEditPanel ? "md:grid md:grid-cols-[65%_35%]" : "flex"
			)}>
				
				{/* Left Column: Profile details */}
				<div className={clsx(
					"px-4 lg:px-6 py-8 flex-1 flex flex-col gap-8 overflow-y-auto h-full w-full",
					showEditPanel ? "max-w-none" : "max-w-3xl mx-auto"
				)}>
					{/* Header */}
					<div>
						<h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-black leading-tight">
							My Profile
						</h1>
						<p className="text-sm font-semibold text-black/50 mt-1.5">
							Your brand identity and account details
						</p>
					</div>


				{/* Profile Review Status Banner */}
				{profile && (profile.approvalStatus === "PENDING" || profile.approvalStatus === "APPROVED" || profile.approvalStatus === "REJECTED") && (
					<div className={clsx(
						"rounded-xl px-4 py-3 text-sm font-semibold border-2 w-full",
						profile.approvalStatus === "APPROVED" && "bg-green-50 border-green-600 text-green-800",
						profile.approvalStatus === "PENDING" && "bg-amber-50 border-amber-500 text-amber-800",
						profile.approvalStatus === "REJECTED" && "bg-red-50 border-red-500 text-red-700",
					)}>
						{profile.approvalStatus === "APPROVED" && "Approved - Your brand profile is live and active."}
						{profile.approvalStatus === "PENDING" && "Awaiting admin approval - your profile is currently under review."}
						{profile.approvalStatus === "REJECTED" && "Rejected - Please update your profile details and submit again."}
					</div>
				)}
				{/* Yellow Card Container */}
				<div className="w-full bg-[#FFC940] border-[3px] border-black rounded-[28px] p-3.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
					{/* Inner Dashed Card */}
					<div className="w-full bg-white border-2 border-dashed border-black/40 rounded-[20px] p-6 flex flex-col gap-5">
						
						{/* Avatar Row */}
						<div className="flex items-center gap-4">
							<div className="relative size-16 rounded-2xl border-[3px] border-black overflow-hidden bg-slate-50 flex items-center justify-center shrink-0">
								{avatarUrl ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img src={avatarUrl} alt={displayName} className="size-full object-cover" />
								) : (
									<Icon as={UserSvg} size="lg" className="text-black size-8" />
								)}
							</div>
							
							<div className="flex flex-col gap-1.5">
								<p className="text-xl font-heading font-black text-black leading-none">{displayName}</p>
								<span className="inline-block bg-[#1E1B4B] text-white text-[8px] font-black px-2.5 py-0.5 rounded-lg uppercase tracking-wider w-max">
									{profile?.companyType === "AGENCY" ? "Agency" : "Brand"}
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
								<span className="text-black/50 w-24">About :</span>
								<span className="text-[#6C32D1] font-bold truncate max-w-[280px]">
									{profile?.aboutCompany || "Not specified"}
								</span>
							</div>
						</div>

					</div>
				</div>

				{/* Options Menu List */}
				<div className="flex flex-col mt-4">
					{/* Edit Profile */}
					<div className="flex items-center justify-between py-4 border-b border-black/10 hover:bg-black/[0.01]">
						<span className="font-heading font-black text-base text-black">Edit Brand Profile</span>
						<div className="flex items-center gap-3">
							<button 
								onClick={() => setShowEditPanel(true)}
								className="bg-[#EE2C2C] text-white text-[9px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[#1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all select-none"
							>
								EDIT DETAILS
							</button>
							<span className="text-black/50 font-black text-lg">&gt;</span>
						</div>
					</div>

					{/* Sign Out */}
					<div className="flex items-center justify-between py-4">
						<span className="font-heading font-black text-base text-black">Profile Actions</span>
						<div className="flex items-center gap-3">
							<button 
								onClick={handleSignOut}
								className="bg-white border-[3px] border-black text-black rounded-2xl px-4 py-2 font-black text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
							>
								LOG OUT
							</button>
							<button 
								onClick={() => setShowDeleteModal(true)} 
								className="bg-[#EE2C2C] border-[3px] border-black text-white rounded-2xl px-4 py-2 font-black text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
							>
								DELETE
							</button>
						</div>
					</div>
					</div>
				</div>

				{/* Right Column: Edit Profile drawer */}
				{showEditPanel && (
					<>
						{/* Mobile/Tablet Backdrop */}
						<div 
							onClick={() => setShowEditPanel(false)}
							className="lg:hidden fixed inset-0 bg-black/45 z-40 backdrop-blur-xs"
						/>
						
						{/* Responsive drawer container */}
						<div className={clsx(
							"bg-white h-full flex flex-col z-50 transition-all duration-300 animate-in slide-in-from-right",
							"fixed inset-y-0 right-0 w-full sm:w-[420px] border-l-4 border-black shadow-modal",
							"lg:static lg:border-l-0 lg:border-l lg:border-black/10 lg:shadow-none lg:w-full"
						)}>
							<EditBrandProfilePanel
								onClose={() => setShowEditPanel(false)}
								onSuccess={() => {}}
							/>
						</div>
					</>
				)}

			</div>

			<DeleteAccountModal
				open={showDeleteModal}
				role="brand"
				onClose={() => setShowDeleteModal(false)}
				onDeleted={async () => {
					setShowDeleteModal(false)
					clearProfile()
					router.replace("/")
					await signOut()
				}}
			/>
		</div>
	)
}
