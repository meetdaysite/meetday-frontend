"use client"

import Link from "next/link"
import { Icon } from "@/components/ui/Icon"
import type { SpaceCommunityProfile } from "@/lib/api"
import UploadSvg from "@/icons/outlined/upload.svg"
import clsx from "clsx"

interface SpaceCommunityProfileDetailsPanelProps {
	community: SpaceCommunityProfile
	operatingCities?: string[]
	socialLinks?: {
		instagram?: string
		linkedin?: string
		youtube?: string
		website?: string
	} | null
	onEdit?: () => void
	onClose?: () => void
	hideStatus?: boolean
	viewBrandPreviewHref?: string
	onViewBrandPreview?: () => void
}

const STATUS_CONFIG: Record<SpaceCommunityProfile["approvalStatus"], { label: string; className: string }> = {
	APPROVED: { label: "Live to Brands & Communities", className: "bg-green-50 border-green-600 text-green-800" },
	PENDING: { label: "Pending admin approval", className: "bg-amber-50 border-amber-500 text-amber-800" },
	REJECTED: { label: "Rejected — needs changes", className: "bg-red-50 border-red-500 text-red-700" },
	SUSPENDED: { label: "Suspended", className: "bg-black/5 border-black/30 text-black/60" },
}

function formatHref(url: string) {
	const trimmed = url.trim()
	return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function formatExternalUrl(url?: string | null) {
	if (!url) return null
	const trimmed = url.trim()
	if (!trimmed) return null
	return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

// Read-only display of a Space Partner's Community Space Profile — this is the SAME record
// shown/edited by SpaceCommunityProfileForm (My Profile page), just rendered read-only here.
// Deliberately NOT a re-shaping of HostCommunityProfile's fields (numberOfVenues/venueCapacity/
// communitySize are genuinely different concepts than Host's size/avgGuestCount) — mirrors the
// visual structure of CommunityProfileDetailsPanel but binds to Space's own real field names.
export function SpaceCommunityProfileDetailsPanel({
	community,
	operatingCities,
	socialLinks,
	onEdit,
	onClose,
	hideStatus = false,
	viewBrandPreviewHref,
	onViewBrandPreview,
}: SpaceCommunityProfileDetailsPanelProps) {
	const statusConfig = STATUS_CONFIG[community.approvalStatus]

	return (
		<div className="w-full h-full flex flex-col bg-white p-6 overflow-y-auto animate-in fade-in duration-150">
			{/* Panel Header */}
			<div className="flex justify-between items-center pb-4 mb-4 border-b border-black/10 shrink-0 gap-3">
				<div className="flex items-center gap-3 flex-wrap">
					<h2 className="text-xl font-heading font-black text-black">Community Hub Profile</h2>
					{viewBrandPreviewHref ? (
						<Link
							href={viewBrandPreviewHref}
							className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black bg-[#FFC940] hover:bg-[#ffbe1a] text-black border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
						>
							<span>Brand preview</span>
							<span className="text-xs font-black">→</span>
						</Link>
					) : onViewBrandPreview ? (
						<button
							type="button"
							onClick={onViewBrandPreview}
							className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black bg-[#FFC940] hover:bg-[#ffbe1a] text-black border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
						>
							<span>Brand preview</span>
							<span className="text-xs font-black">→</span>
						</button>
					) : null}
				</div>
				{onClose && (
					<button
						type="button"
						onClick={onClose}
						className="text-black/60 hover:text-black size-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors font-bold text-sm cursor-pointer"
					>
						✕
					</button>
				)}
			</div>

			<div className="flex flex-col gap-6">
				{!hideStatus && (
					<div className={clsx("rounded-xl px-3.5 py-2.5 text-xs font-semibold border-2", statusConfig.className)}>
						{statusConfig.label}
						{community.approvalStatus === "REJECTED" && community.adminRejectionRemark && <>: {community.adminRejectionRemark}</>}
					</div>
				)}

				{!hideStatus && community.approvalStatus === "APPROVED" && community.pendingRevision && (
					<div className="rounded-xl px-3.5 py-2.5 text-xs font-semibold border-2 bg-blue-50 border-blue-500 text-blue-800">
						Your recent edit is pending admin review — brands still see the current live version above until it&apos;s approved.
					</div>
				)}

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
								{community.numberOfVenues}
							</span>
							<span className="text-[11px] font-black text-black/60 uppercase tracking-wider">Venues</span>
						</div>
					</div>
				</div>

				{/* About */}
				<div className="flex flex-col gap-1.5">
					<span className="text-xs font-bold text-black/50">About The Hub</span>
					<p className="text-sm font-semibold text-black/75 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-black/5 whitespace-pre-wrap">
						{community.about}
					</p>
				</div>

				{/* Poster */}
				{community.posterUrl && (
					<div className="flex flex-col gap-1.5">
						<span className="text-xs font-bold text-black/50">Highlight Poster</span>
						<div className="relative w-full aspect-[4/5] rounded-2xl border-2 border-black overflow-hidden bg-slate-900 max-w-sm flex items-center justify-center">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={community.posterUrl} alt="Highlight Poster" className="size-full object-contain" />
						</div>
					</div>
				)}

				{/* Centre Showcase Images */}
				{community.centreShowcaseUrls && community.centreShowcaseUrls.length > 0 && (
					<div className="flex flex-col gap-1.5">
						<span className="text-xs font-bold text-black/50">Centre Photographs</span>
						<div className="flex flex-wrap gap-3">
							{community.centreShowcaseUrls.map((url, i) => (
								<div key={i} className="relative w-[calc(50%-6px)] aspect-[4/5] rounded-xl border border-black/10 overflow-hidden bg-white shrink-0">
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img src={url} alt={`Centre photo ${i + 1}`} className="w-full h-full object-cover" />
								</div>
							))}
						</div>
					</div>
				)}

				{/* Past Events */}
				{community.pastEvents && community.pastEvents.length > 0 && (
					<div className="flex flex-col gap-3 mt-2">
						<span className="text-xs font-bold text-black/50">Past Experiences</span>
						<div className="flex flex-col gap-4">
							{community.pastEvents.map((event, i) => (
								<div key={i} className="p-4 bg-slate-50 rounded-2xl border border-black/5 flex flex-col gap-2.5">
									<div className="flex justify-between items-center gap-2">
										{event.name ? (
											<span className="text-sm font-bold text-black">{event.name}</span>
										) : (
											<span className="text-sm font-bold text-black/50">Experience #{i + 1}</span>
										)}
									</div>
									{event.description && (
										<p className="text-sm font-semibold text-black/75 leading-relaxed whitespace-pre-wrap">{event.description}</p>
									)}
									{event.imageUrls && event.imageUrls.length > 0 && (
										<div className="flex flex-wrap gap-3 mt-1">
											{event.imageUrls.slice(0, 2).map((url, j) => (
												<div key={j} className="relative w-[calc(50%-6px)] aspect-[4/5] rounded-xl border border-black/10 overflow-hidden bg-white shrink-0">
													{/* eslint-disable-next-line @next/next/no-img-element */}
													<img src={url} alt={event.name || "Past Experience Image"} className="w-full h-full object-cover" />
												</div>
											))}
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				)}

				{/* Associated Brands */}
				{community.brandsWorkedWith && community.brandsWorkedWith.filter((b) => b.logoUrl || b.brandName).length > 0 && (
					<div className="flex flex-col gap-2 mt-2">
						<span className="text-xs font-bold text-black/50">Associated Brands</span>
						<div className="flex flex-wrap gap-2.5">
							{community.brandsWorkedWith
								.filter((b) => b.logoUrl || b.brandName)
								.map((brand, i) => {
									const href = formatExternalUrl(brand.url)
									const content = (
										<div className="group relative" title={brand.brandName || (href ? (brand.url ?? undefined) : "Brand")}>
											<div className="size-12 aspect-square rounded-xl border border-black/10 overflow-hidden bg-white flex items-center justify-center shadow-sm hover:border-black/30 hover:scale-115 transition-transform duration-200 cursor-pointer">
												{brand.logoUrl ? (
													// eslint-disable-next-line @next/next/no-img-element
													<img src={brand.logoUrl} alt={brand.brandName || "Brand logo"} className="size-full object-cover" />
												) : (
													<span className="text-xs font-bold text-black/60">{(brand.brandName || "B").charAt(0).toUpperCase()}</span>
												)}
											</div>
										</div>
									)
									return href ? (
										<a key={i} href={href} target="_blank" rel="noopener noreferrer" className="inline-block">
											{content}
										</a>
									) : (
										<div key={i} className="inline-block">
											{content}
										</div>
									)
								})}
						</div>
					</div>
				)}

				{/* Statistics Grid */}
				<div className="grid grid-cols-2 gap-4">
					<div className="p-3.5 bg-slate-50 rounded-2xl border border-black/5 flex flex-col gap-1">
						<span className="text-[10px] font-bold text-black/40 uppercase">Venue Capacity</span>
						<span className="text-lg font-heading font-black text-black">{community.venueCapacity}</span>
					</div>
					<div className="p-3.5 bg-slate-50 rounded-2xl border border-black/5 flex flex-col gap-1">
						<span className="text-[10px] font-bold text-black/40 uppercase">Community Size</span>
						<span className="text-lg font-heading font-black text-black">{community.communitySize}</span>
					</div>
					<div className="p-3.5 bg-slate-50 rounded-2xl border border-black/5 flex flex-col gap-1">
						<span className="text-[10px] font-bold text-black/40 uppercase">Experiences / Yr</span>
						<span className="text-lg font-heading font-black text-black">{community.experiencesPerYear} events</span>
					</div>
					<div className="p-3.5 bg-slate-50 rounded-2xl border border-black/5 flex flex-col gap-1">
						<span className="text-[10px] font-bold text-black/40 uppercase">Number of Venues</span>
						<span className="text-lg font-heading font-black text-black">{community.numberOfVenues}</span>
					</div>
				</div>

				{/* Categories */}
				{community.categories && community.categories.length > 0 && (
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

				{/* Branding & Activation Offerings */}
				{((community.popupDays && community.popupPrice) || (community.brandingDays && community.brandingPrice)) && (
					<div className="flex flex-col gap-2">
						<span className="text-xs font-bold text-black/50">Branding and Activation Offerings</span>
						<div className="flex flex-wrap gap-3">
							{community.popupDays && community.popupPrice && (
								<div className="flex flex-col gap-1 border border-black/10 rounded-xl px-4 py-2 bg-slate-50">
									<span className="text-xs font-bold text-black">Pop-up</span>
									<span className="text-xs text-black/60">
										{community.popupDays} days · ₹{community.popupPrice}
									</span>
								</div>
							)}
							{community.brandingDays && community.brandingPrice && (
								<div className="flex flex-col gap-1 border border-black/10 rounded-xl px-4 py-2 bg-slate-50">
									<span className="text-xs font-bold text-black">Branding</span>
									<span className="text-xs text-black/60">
										{community.brandingDays} days · ₹{community.brandingPrice}
									</span>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Active Locations */}
				{community.activeLocations && community.activeLocations.length > 0 && (
					<div className="flex flex-col gap-2">
						<span className="text-xs font-bold text-black/50">Active Locations</span>
						<div className="flex flex-wrap gap-1.5">
							{community.activeLocations.map((loc) => (
								<span key={loc} className="px-2.5 py-1 bg-slate-50 text-black/70 border border-black/10 rounded-lg text-xs font-bold">
									{loc}
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

				{/* Video Link */}
				{community.videoLink && (
					<div className="flex flex-col gap-1.5">
						<span className="text-xs font-bold text-black/50">Hub Video</span>
						<a
							href={formatExternalUrl(community.videoLink) ?? undefined}
							target="_blank"
							rel="noopener noreferrer"
							className="text-sm font-bold text-[#EE2C2C] hover:underline break-all"
						>
							Watch Video ↗
						</a>
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
							EDIT COMMUNITY HUB DETAILS
						</button>
					</div>
				)}
			</div>
		</div>
	)
}
