"use client"

import Image from "next/image"
import { Icon } from "@/components/ui/Icon"
import type { ActivatedCommunity } from "./ActivateCommunityModal"
import { getCategories, type Category } from "@/lib/api"
import { useState, useEffect } from "react"
import UploadSvg from "@/icons/outlined/upload.svg"

interface CommunityProfileDetailsPanelProps {
	community: ActivatedCommunity
	onEdit: () => void
	onClose: () => void
}

export function CommunityProfileDetailsPanel({
	community,
	onEdit,
	onClose,
}: CommunityProfileDetailsPanelProps) {
	const [categories, setCategories] = useState<Category[]>([])
	const logoUrl = community.logo ? URL.createObjectURL(community.logo) : null

	useEffect(() => {
		getCategories().then(setCategories).catch(() => {})
		return () => {
			if (logoUrl) URL.revokeObjectURL(logoUrl)
		}
	}, [community.logo])

	const communityCategoryNames = community.categoryIds
		? community.categoryIds.map(id => categories.find(c => c.id === id)?.name).filter(Boolean)
		: []

	return (
		<div className="w-full h-full flex flex-col bg-white p-6 overflow-y-auto animate-in fade-in duration-150">
			{/* Panel Header */}
			<div className="flex justify-between items-center pb-4 mb-4 border-b border-black/10 shrink-0">
				<h2 className="text-xl font-heading font-black text-black">
					Community Profile
				</h2>
				<button
					type="button"
					onClick={onClose}
					className="text-black/60 hover:text-black size-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors font-bold text-sm"
				>
					✕
				</button>
			</div>

			{/* Panel Content */}
			<div className="flex-grow flex flex-col gap-6">
				{/* Top Card Header */}
				<div className="flex items-center gap-4">
					<div className="size-16 rounded-xl border-2 border-black overflow-hidden bg-slate-50 flex items-center justify-center shrink-0">
						{logoUrl ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img src={logoUrl} alt={community.name} className="size-full object-cover" />
						) : (
							<Icon as={UploadSvg} size="md" color="muted" />
						)}
					</div>
					<div className="flex flex-col gap-1">
						<h3 className="text-lg font-heading font-black text-black leading-none">{community.name}</h3>
						<span className="inline-block bg-[#1E1B4B] text-white text-[8px] font-black px-2.5 py-0.5 rounded-lg uppercase tracking-wider w-max mt-1">
							{community.size} Members
						</span>
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
				{communityCategoryNames.length > 0 && (
					<div className="flex flex-col gap-2">
						<span className="text-xs font-bold text-black/50">Experience Categories</span>
						<div className="flex flex-wrap gap-1.5">
							{communityCategoryNames.map((name) => (
								<span key={name} className="px-2.5 py-1 bg-[#FFC940]/10 text-[#6C32D1] border border-[#6C32D1]/20 rounded-lg text-xs font-bold">
									{name}
								</span>
							))}
						</div>
					</div>
				)}

				{/* Social Links */}
				<div className="flex flex-col gap-2.5 border-t border-black/10 pt-4 mt-2">
					<span className="text-xs font-bold text-black/50">Links & Socials</span>
					<div className="flex flex-col gap-2">
						{community.instagram && (
							<div className="flex justify-between items-center text-sm font-semibold">
								<span className="text-black/40">Instagram</span>
								<a href={`https://${community.instagram}`} target="_blank" rel="noreferrer" className="text-[#6C32D1] hover:underline">
									{community.instagram.replace("instagram.com/", "@")}
								</a>
							</div>
						)}
						{community.linkedin && (
							<div className="flex justify-between items-center text-sm font-semibold">
								<span className="text-black/40">LinkedIn</span>
								<a href={`https://${community.linkedin}`} target="_blank" rel="noreferrer" className="text-[#6C32D1] hover:underline truncate max-w-[200px]">
									{community.linkedin}
								</a>
							</div>
						)}
						{community.youtube && (
							<div className="flex justify-between items-center text-sm font-semibold">
								<span className="text-black/40">YouTube</span>
								<a href={`https://${community.youtube}`} target="_blank" rel="noreferrer" className="text-[#6C32D1] hover:underline truncate max-w-[200px]">
									{community.youtube}
								</a>
							</div>
						)}
						{community.portfolio && (
							<div className="flex justify-between items-center text-sm font-semibold">
								<span className="text-black/40">Website</span>
								<a href={`https://${community.portfolio}`} target="_blank" rel="noreferrer" className="text-[#6C32D1] hover:underline truncate max-w-[200px]">
									{community.portfolio}
								</a>
							</div>
						)}
					</div>
				</div>

				{/* Edit details button */}
				<div className="mt-auto pt-6 border-t border-black/10 shrink-0">
					<button
						type="button"
						onClick={onEdit}
						className="w-full py-3 bg-[#FFC940] text-black border-[3px] border-black rounded-2xl font-black text-center text-xs tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all flex items-center justify-center gap-2 select-none"
					>
						EDIT COMMUNITY DETAILS
					</button>
				</div>
			</div>
		</div>
	)
}
