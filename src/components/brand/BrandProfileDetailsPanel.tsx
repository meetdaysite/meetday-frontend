"use client"

import { Icon } from "@/components/ui/Icon"
import type { Category, CompanyType } from "@/lib/api"
import UserSvg from "@/icons/outlined/user.svg"
import clsx from "clsx"

export interface BrandProfileDetailsData {
	id?: string
	brandName?: string
	logoUrl?: string | null
	companyType?: CompanyType | null
	aboutCompany?: string | null
	industry?: string | null
	categories?: Category[]
	socialLinks?: {
		instagram?: string
		linkedin?: string
		youtube?: string
		website?: string
	} | null
}

interface BrandProfileDetailsPanelProps {
	brand: BrandProfileDetailsData
	onEdit?: () => void
	onClose?: () => void
	hideStatus?: boolean
}

const formatHref = (url: string) => {
	const trimmed = url.trim()
	if (/^https?:\/\//i.test(trimmed)) return trimmed
	return `https://${trimmed}`
}

export function BrandProfileDetailsPanel({
	brand,
	onEdit,
	onClose,
}: BrandProfileDetailsPanelProps) {
	const displayName = brand.brandName || "Brand"
	const avatarUrl = brand.logoUrl
	const categories = brand.categories || []
	const socials = brand.socialLinks || {}

	return (
		<div className="w-full h-full flex flex-col bg-white p-6 overflow-y-auto animate-in fade-in duration-150">
			{/* Panel Header */}
			<div className="flex justify-between items-center pb-4 mb-4 border-b border-black/10 shrink-0 gap-3">
				<div className="flex items-center gap-3 flex-wrap">
					<h2 className="text-xl font-heading font-black text-black">
						Brand Profile
					</h2>
				</div>
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
				{/* Top Card Header */}
				<div className="flex items-center gap-4">
					<div className="size-16 rounded-xl border-2 border-black overflow-hidden bg-slate-50 flex items-center justify-center shrink-0">
						{avatarUrl ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img src={avatarUrl} alt={displayName} className="size-full object-cover" />
						) : (
							<Icon as={UserSvg} size="md" color="muted" />
						)}
					</div>
					<div className="flex flex-col gap-1 min-w-0">
						<h3 className="text-lg font-heading font-black text-black leading-none truncate">
							{displayName}
						</h3>
						<div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
							<span className="inline-block bg-[#F5C343] text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-[11px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
								{brand.companyType === "AGENCY" ? "Agency" : "Brand"}
							</span>
							{brand.industry && (
								<span className="text-[11px] font-black text-black/60 uppercase tracking-wider">
									• {brand.industry}
								</span>
							)}
						</div>
					</div>
				</div>

				{/* About Description */}
				{brand.aboutCompany && (
					<div className="flex flex-col gap-1.5">
						<span className="text-xs font-bold text-black/50">About The Brand</span>
						<p className="text-sm font-semibold text-black/75 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-black/5 whitespace-pre-wrap">
							{brand.aboutCompany}
						</p>
					</div>
				)}

				{/* Experience Categories */}
				{categories.length > 0 && (
					<div className="flex flex-col gap-2">
						<span className="text-xs font-bold text-black/50">Experience Categories</span>
						<div className="flex flex-wrap gap-1.5">
							{categories.map((cat) => (
								<span
									key={cat.id}
									className="px-2.5 py-1 bg-[#FFC940]/10 text-[#6C32D1] border border-[#6C32D1]/20 rounded-lg text-xs font-bold"
								>
									{cat.name}
								</span>
							))}
						</div>
					</div>
				)}

				{/* Digital Presence / Social Links (Contact info excluded) */}
				{(socials.instagram || socials.linkedin || socials.youtube || socials.website) && (
					<div className="flex flex-col gap-2.5 border-t border-black/10 pt-4 mt-2">
						<span className="text-xs font-bold text-black/50">Digital Presence</span>
						<div className="flex flex-col gap-2">
							{socials.instagram && (
								<div className="flex justify-between items-center text-sm font-semibold">
									<span className="text-black/40">Instagram</span>
									<a
										href={formatHref(socials.instagram)}
										target="_blank"
										rel="noreferrer"
										className="text-green-600 hover:text-green-700 hover:underline"
									>
										View
									</a>
								</div>
							)}
							{socials.linkedin && (
								<div className="flex justify-between items-center text-sm font-semibold">
									<span className="text-black/40">LinkedIn</span>
									<a
										href={formatHref(socials.linkedin)}
										target="_blank"
										rel="noreferrer"
										className="text-green-600 hover:text-green-700 hover:underline"
									>
										View
									</a>
								</div>
							)}
							{socials.youtube && (
								<div className="flex justify-between items-center text-sm font-semibold">
									<span className="text-black/40">YouTube</span>
									<a
										href={formatHref(socials.youtube)}
										target="_blank"
										rel="noreferrer"
										className="text-green-600 hover:text-green-700 hover:underline"
									>
										View
									</a>
								</div>
							)}
							{socials.website && (
								<div className="flex justify-between items-center text-sm font-semibold">
									<span className="text-black/40">Website</span>
									<a
										href={formatHref(socials.website)}
										target="_blank"
										rel="noreferrer"
										className="text-green-600 hover:text-green-700 hover:underline"
									>
										View
									</a>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Edit details button (if onEdit callback provided) */}
				{onEdit && (
					<div className="mt-6 pt-6 border-t border-black/10 shrink-0">
						<button
							type="button"
							onClick={onEdit}
							className="w-full py-3 bg-[#FFC940] text-black border-[3px] border-black rounded-2xl font-black text-center text-xs tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all flex items-center justify-center gap-2 select-none cursor-pointer"
						>
							EDIT BRAND DETAILS
						</button>
					</div>
				)}
			</div>
		</div>
	)
}
