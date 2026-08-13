"use client"

import { Icon } from "@/components/ui/Icon"
import type { HostCommunityProfile } from "@/lib/api"
import UploadSvg from "@/icons/outlined/upload.svg"
import clsx from "clsx"

interface CommunityProfileDetailsPanelProps {
	community: HostCommunityProfile
	operatingCities?: string[]
	socialLinks?: {
		instagram?: string
		linkedin?: string
		youtube?: string
		website?: string
	}
	onEdit?: () => void
	onClose?: () => void
}

const STATUS_CONFIG: Record<HostCommunityProfile["approvalStatus"], { label: string; className: string }> = {
	APPROVED: { label: "Live to Brands", className: "bg-green-50 border-green-600 text-green-800" },
	PENDING: { label: "Pending admin approval", className: "bg-amber-50 border-amber-500 text-amber-800" },
	REJECTED: { label: "Rejected — needs changes", className: "bg-red-50 border-red-500 text-red-700" },
	SUSPENDED: { label: "Suspended", className: "bg-black/5 border-black/30 text-black/60" },
}

const formatHref = (url: string) => {
	const trimmed = url.trim()
	if (/^https?:\/\//i.test(trimmed)) {
		return trimmed
	}
	return `https://${trimmed}`
}

export function CommunityProfileDetailsPanel({
	community,
	operatingCities,
	socialLinks,
	onEdit,
	onClose,
}: CommunityProfileDetailsPanelProps) {
	const statusConfig = STATUS_CONFIG[community.approvalStatus]

	return (
		<div className="w-full h-full flex flex-col bg-white p-6 overflow-y-auto animate-in fade-in duration-150">
			{/* Panel Header */}
			<div className="flex justify-between items-center pb-4 mb-4 border-b border-black/10 shrink-0">
				<h2 className="text-xl font-heading font-black text-black">
					Community Profile
				</h2>
				{onClose && (
					<button
						type="button"
						onClick={onClose}
						className="text-black/60 hover:text-black size-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors font-bold text-sm"
					>
						✕
					</button>
				)}
			</div>

			{/* Panel Content */}
			<div className="flex flex-col gap-6">
				{/* Approval status banner */}
				<div className={clsx("rounded-xl px-3.5 py-2.5 text-xs font-semibold border-2", statusConfig.className)}>
					{statusConfig.label}
					{community.approvalStatus === "REJECTED" && community.adminRejectionRemark && (
						<>: {community.adminRejectionRemark}</>
					)}
				</div>

				{/* Top Card Header */}
				<div className="flex items-center gap-4">
					<div className="size-16 rounded-xl border-2 border-black overflow-hidden bg-slate-50 flex items-center justify-center shrink-0">
						{community.logoUrl ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img src={community.logoUrl} alt={community.name} className="size-full object-cover" />
						) : (
							<Icon as={UploadSvg} size="md" color="muted" />
						)}
					</div>
					<div className="flex flex-col gap-1">
						<h3 className="text-lg font-heading font-black text-black leading-none">{community.name}</h3>
						<div className="flex items-center gap-1.5 mt-1.5">
							<span className="inline-block bg-[#F5C343] text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-[11px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
								{community.size}
							</span>
							<span className="text-[11px] font-black text-black/60 uppercase tracking-wider">
								Members
							</span>
						</div>
					</div>
				</div>

				{/* About description */}
				<div className="flex flex-col gap-1.5">
					<span className="text-xs font-bold text-black/50">About the community</span>
					<p className="text-sm font-semibold text-black/75 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-black/5 whitespace-pre-wrap">
						{community.about}
					</p>
				</div>

				{/* Statistics / Numbers Grid */}
				<div className="grid grid-cols-2 gap-4">
					<div className="p-3.5 bg-slate-50 rounded-2xl border border-black/5 flex flex-col gap-1">
						<span className="text-[10px] font-bold text-black/40 uppercase">Avg Guest Count</span>
						<span className="text-lg font-heading font-black text-black">{community.avgGuestCount} guests</span>
					</div>
					<div className="p-3.5 bg-slate-50 rounded-2xl border border-black/5 flex flex-col gap-1">
						<span className="text-[10px] font-bold text-black/40 uppercase">Experiences / Yr</span>
						<span className="text-lg font-heading font-black text-black">{community.experiencesPerYear} events</span>
					</div>
				</div>

				{/* Categories */}
				{community.categories.length > 0 && (
					<div className="flex flex-col gap-2">
						<span className="text-xs font-bold text-black/50">Experience Categories</span>
						<div className="flex flex-wrap gap-1.5">
							{community.categories.map((cat) => (
								<span key={cat.id} className="px-2.5 py-1 bg-[#FFC940]/10 text-[#6C32D1] border border-[#6C32D1]/20 rounded-lg text-xs font-bold">
									{cat.name}
								</span>
							))}
						</div>
					</div>
				)}

				{/* Operating Cities */}
				{operatingCities && operatingCities.length > 0 && (
					<div className="flex flex-col gap-2">
						<span className="text-xs font-bold text-black/50">Operating Cities</span>
						<div className="flex flex-wrap gap-1.5">
							{operatingCities.map((city) => (
								<span key={city} className="px-2.5 py-1 bg-slate-50 text-black/70 border border-black/10 rounded-lg text-xs font-bold">
									{city}
								</span>
							))}
						</div>
					</div>
				)}

				{/* Social Links */}
				<div className="flex flex-col gap-2.5 border-t border-black/10 pt-4 mt-2">
					<span className="text-xs font-bold text-black/50">Digital Presence</span>
					<div className="flex flex-col gap-2">
						{socialLinks?.instagram && (
							<div className="flex justify-between items-center text-sm font-semibold">
								<span className="text-black/40">Instagram</span>
								<a href={formatHref(socialLinks.instagram)} target="_blank" rel="noreferrer" className="text-green-600 hover:text-green-700 hover:underline">
									View
								</a>
							</div>
						)}
						{socialLinks?.linkedin && (
							<div className="flex justify-between items-center text-sm font-semibold">
								<span className="text-black/40">LinkedIn</span>
								<a href={formatHref(socialLinks.linkedin)} target="_blank" rel="noreferrer" className="text-green-600 hover:text-green-700 hover:underline">
									View
								</a>
							</div>
						)}
						{socialLinks?.youtube && (
							<div className="flex justify-between items-center text-sm font-semibold">
								<span className="text-black/40">YouTube</span>
								<a href={formatHref(socialLinks.youtube)} target="_blank" rel="noreferrer" className="text-green-600 hover:text-green-700 hover:underline">
									View
								</a>
							</div>
						)}
						{socialLinks?.website && (
							<div className="flex justify-between items-center text-sm font-semibold">
								<span className="text-black/40">Website</span>
								<a href={formatHref(socialLinks.website)} target="_blank" rel="noreferrer" className="text-green-600 hover:text-green-700 hover:underline">
									View
								</a>
							</div>
						)}
					</div>
				</div>

				{/* Edit details button */}
				{onEdit && (
					<div className="mt-6 pt-6 border-t border-black/10 shrink-0">
						<button
							type="button"
							onClick={onEdit}
							className="w-full py-3 bg-[#FFC940] text-black border-[3px] border-black rounded-2xl font-black text-center text-xs tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all flex items-center justify-center gap-2 select-none"
						>
							EDIT COMMUNITY DETAILS
						</button>
					</div>
				)}
			</div>
		</div>
	)
}

