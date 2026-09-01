"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Icon } from "@/components/ui/Icon"
import { DeleteAccountModal } from "@/components/ui/DeleteAccountModal"
import { NotificationSoundToggle } from "@/components/ui/NotificationSoundToggle"
import { useHostStore } from "@/store/hostStore"
import { useAuthStore } from "@/store/authStore"
import { getHostCommunityProfile, type HostCommunityProfile, getHostTeamMembers, inviteHostTeamMember, removeHostTeamMember, setHostMemberPermission } from "@/lib/api"
import { HostDetailsPrompt } from "@/components/community/HostDetailsPrompt"
import { ActivateCommunityModal } from "@/components/community/ActivateCommunityModal"
import { CommunityProfileDetailsPanel } from "@/components/community/CommunityProfileDetailsPanel"
import { VerificationsDetailsPanel } from "@/components/community/VerificationsDetailsPanel"
import { EditProfilePanel } from "@/components/community/EditProfilePanel"
import { TeamMembersModal } from "@/components/team/TeamMembersModal"
import clsx from "clsx"

import UserSvg from "@/icons/outlined/user.svg"

const GENDER_LABELS: Record<string, string> = {
	MALE: "Male",
	FEMALE: "Female",
	NON_BINARY: "Non-binary",
	PREFER_NOT_TO_SAY: "Prefer not to say",
}

export default function ProfilePage() {
	const { profile, clearProfile } = useHostStore()
	const { user, signOut } = useAuthStore()
	const router = useRouter()
	const searchParams = useSearchParams()

	const [showDeleteModal, setShowDeleteModal] = useState(false)
	const [showKycForm, setShowKycForm] = useState(false)
	
	// Right panel states
	const [showCommunityModal, setShowCommunityModal] = useState(false)
	const [isEditingCommunity, setIsEditingCommunity] = useState(false)
	const [community, setCommunity] = useState<HostCommunityProfile | null>(null)

	const [showVerificationsModal, setShowVerificationsModal] = useState(false)
	const [isEditingVerifications, setIsEditingVerifications] = useState(false)

	const [showEditProfileModal, setShowEditProfileModal] = useState(false)
	const [showTeamMembersModal, setShowTeamMembersModal] = useState(false)

	// Fetch community profile status from the backend on mount
	const [communityLoading, setCommunityLoading] = useState(true)
	useEffect(() => {
		if (profile?.id) {
			getHostCommunityProfile()
				.then(setCommunity)
				.catch(() => {})
				.finally(() => setCommunityLoading(false))
		}
	}, [profile?.id])

	// Auto-open panels based on query params on mount
	useEffect(() => {
		if (profile?.id) {
			const open = searchParams ? searchParams.get("open") : null
			if (open === "community") {
				setShowCommunityModal(true)
				setIsEditingCommunity(true)
				setShowVerificationsModal(false)
				setShowEditProfileModal(false)
			} else if (open === "kyc") {
				setShowVerificationsModal(true)
				setIsEditingVerifications(profile.kycStatus !== "VERIFIED")
				setShowCommunityModal(false)
				setShowEditProfileModal(false)
			}
		}
	}, [searchParams, profile])

	const handleSignOut = async () => {
		clearProfile()
		router.replace("/")
		await signOut()
	}

	const email = user?.email || (profile as any)?.email || ""
	const phone = profile?.phone || ""
	const displayName = profile?.displayName || "Host"
	const avatarUrl = profile?.avatarUrl

	const handleCommunityProfileClick = () => {
		if (communityLoading) return
		setShowCommunityModal(true)
		setShowVerificationsModal(false)
		setShowEditProfileModal(false)
		setIsEditingVerifications(false)
		setIsEditingCommunity(!community)
	}

	const handleVerificationsClick = () => {
		setShowVerificationsModal(true)
		setShowCommunityModal(false)
		setShowEditProfileModal(false)
		setIsEditingCommunity(false)
		setIsEditingVerifications(profile?.kycStatus !== "VERIFIED")
	}

	const handleEditProfileClick = () => {
		setShowEditProfileModal(true)
		setShowCommunityModal(false)
		setShowVerificationsModal(false)
		setIsEditingCommunity(false)
		setIsEditingVerifications(false)
	}

	const closeRightPanel = () => {
		setShowCommunityModal(false)
		setShowVerificationsModal(false)
		setShowEditProfileModal(false)
	}

	const isPanelOpen = showCommunityModal || showVerificationsModal || showEditProfileModal

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
							Your host identity and account details
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
										<img src={avatarUrl} alt={displayName} className="size-full object-cover" />
									) : (
										<Icon as={UserSvg} size="lg" className="text-black size-8" />
									)}
								</div>
								
								<div className="flex flex-col gap-1.5">
									<p className="text-xl font-heading font-black text-black leading-none">{displayName}</p>
									<span className="inline-block bg-[#1E1B4B] text-white text-[8px] font-black px-2.5 py-0.5 rounded-lg uppercase tracking-wider w-max">
										{profile?.hostType === "INDIVIDUAL" ? "Individual Host" : "Business Host"}
									</span>
								</div>
							</div>

							{/* Divider */}
							<hr className="border-dashed border-black/10 my-1" />

							{/* Info Rows */}
							<div className="flex flex-col gap-3">
								<div className="flex gap-2 text-sm font-semibold">
									<span className="text-black/50 w-24">Gender :</span>
									<span className="text-[#6C32D1] font-bold">
										{profile?.gender ? (GENDER_LABELS[profile.gender] ?? profile.gender) : "Not specified"}
									</span>
								</div>
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
									<span className="text-black/50 w-24">Community :</span>
									<span className="text-[#6C32D1] font-bold truncate max-w-[280px]">
										{profile?.communityName || "Not specified"}
									</span>
								</div>
							</div>

						</div>
					</div>

					{/* Options Menu List */}
					<div className="flex flex-col mt-4">
						
						{/* Community Profile */}
						<div 
							onClick={handleCommunityProfileClick}
							className={clsx(
								"flex items-center justify-between py-4 border-b border-black/10 hover:bg-black/[0.01]",
								communityLoading ? "cursor-wait opacity-60" : "cursor-pointer",
							)}
						>
							<span className="font-heading font-black text-base text-black">Community Profile</span>
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

						{/* My Verifications */}
						<div 
							onClick={handleVerificationsClick}
							className="flex items-center justify-between py-4 border-b border-black/10 cursor-pointer hover:bg-black/[0.01]"
						>
							<span className="font-heading font-black text-base text-black">My Verifications</span>
							<div className="flex items-center gap-3">
								<button 
									type="button"
									className="bg-[#EE2C2C] text-white text-[9px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[#1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all select-none"
								>
									{profile?.kycStatus === "VERIFIED" ? "VIEW DETAILS" : "VERIFY NOW"}
								</button>
								<span className="text-black/50 font-black text-lg">&gt;</span>
							</div>
						</div>

						<NotificationSoundToggle />

						{/* Team Members */}
						<div
							onClick={() => setShowTeamMembersModal(true)}
							className="flex items-center justify-between py-4 border-b border-black/10 cursor-pointer hover:bg-black/[0.01]"
						>
							<span className="font-heading font-black text-base text-black">Team Members</span>
							<div className="flex items-center gap-3">
								<button
									type="button"
									className="bg-[#EE2C2C] text-white text-[9px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[#1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all select-none"
								>
									MANAGE
								</button>
								<span className="text-black/50 font-black text-lg">&gt;</span>
							</div>
						</div>

						{/* Profile Actions */}
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

				{/* Right Column: Inline Activate Community, Verifications, or Edit Profile Drawer */}
				{isPanelOpen && profile?.id && (
					<>
						{/* Mobile/Tablet Backdrop Blur */}
						<div 
							onClick={closeRightPanel}
							className="lg:hidden fixed inset-0 bg-black/45 z-40 backdrop-blur-xs"
						/>
						
						{/* Responsive drawer container */}
						<div className={clsx(
							"bg-white h-full flex flex-col z-50 transition-all duration-300 animate-in slide-in-from-right",
							"fixed inset-y-0 right-0 w-full sm:w-[420px] border-l-4 border-black shadow-modal",
							"lg:static lg:border-l-0 lg:border-l lg:border-black/10 lg:shadow-none lg:w-full"
						)}>
							{showCommunityModal ? (
								isEditingCommunity ? (
									<ActivateCommunityModal
										hostId={profile.id}
										profileCommunityName={profile.communityName || ""}
										profileInstagram={profile.socialLinks?.instagram || ""}
										profileLinkedin={profile.socialLinks?.linkedin || ""}
										profileYoutube={profile.socialLinks?.youtube || ""}
										profilePortfolio={profile.socialLinks?.website || ""}
										profileOperatingCities={profile.operatingCities || []}
										onClose={() => {
											if (!community) {
												setShowCommunityModal(false)
											} else {
												setIsEditingCommunity(false)
											}
										}}
										onSuccess={(saved) => {
											setCommunity(saved)
											setIsEditingCommunity(false)
										}}
										inline={true}
									/>
								) : (
									<CommunityProfileDetailsPanel
										community={community!}
										operatingCities={profile?.operatingCities}
										socialLinks={profile?.socialLinks}
										onEdit={() => setIsEditingCommunity(true)}
										onClose={() => setShowCommunityModal(false)}
									/>
								)
							) : showVerificationsModal ? (
								isEditingVerifications ? (
									<HostDetailsPrompt
										inline={true}
										onClose={() => {
											if (profile.kycStatus === "VERIFIED") {
												setIsEditingVerifications(false)
											} else {
												setShowVerificationsModal(false)
											}
										}}
									/>
								) : (
									<VerificationsDetailsPanel
										profile={profile}
										onVerifyNow={() => setIsEditingVerifications(true)}
										onClose={() => setShowVerificationsModal(false)}
									/>
								)
							) : (
								<EditProfilePanel
									onClose={() => setShowEditProfileModal(false)}
									onSuccess={() => {
										// Successfully saved updates reload automatically
									}}
								/>
							)}
						</div>
					</>
				)}

			</div>

			<DeleteAccountModal
				open={showDeleteModal}
				role="host"
				onClose={() => setShowDeleteModal(false)}
				onDeleted={async () => {
					setShowDeleteModal(false)
					clearProfile()
					router.replace("/")
					await signOut()
				}}
			/>

			<TeamMembersModal
				open={showTeamMembersModal}
				onClose={() => setShowTeamMembersModal(false)}
				accountLabel={profile?.communityName || "your community"}
				listMembers={getHostTeamMembers}
				inviteMember={inviteHostTeamMember}
				removeMember={removeHostTeamMember}
				setMemberPermission={setHostMemberPermission}
			/>

		</div>
	)
}
