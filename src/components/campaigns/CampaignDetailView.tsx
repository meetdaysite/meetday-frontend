"use client"

import React from "react"
import Link from "next/link"
import clsx from "clsx"
import type { Campaign } from "@/lib/api"

export interface CampaignDetailViewProps {
	campaign: Campaign
	onBack: () => void
	role: "community" | "space" | "brand"
	// For viewers (community & space):
	isApproved?: boolean
	isInterested?: boolean
	isSubmittingInterest?: boolean
	onExpressInterest?: () => void
	chatHref?: string
	// For owner (brand):
	onEdit?: () => void
	onDelete?: () => void
	onSubmitForApproval?: () => void
	isSubmittingForApproval?: boolean
}

function formatDate(isoString: string): string {
	if (!isoString) return ""
	try {
		return new Date(isoString).toLocaleDateString("en-IN", {
			day: "numeric",
			month: "short",
			year: "numeric",
		})
	} catch {
		return isoString
	}
}

export function CampaignDetailView({
	campaign,
	onBack,
	role,
	isApproved = true,
	isInterested = false,
	isSubmittingInterest = false,
	onExpressInterest,
	chatHref,
	onEdit,
	onDelete,
	onSubmitForApproval,
	isSubmittingForApproval = false,
}: CampaignDetailViewProps) {
	const brandName = campaign.brandProfile?.brandName || "Brand"
	const brandLogo = campaign.brandProfile?.logoUrl
	const isBrandRole = role === "brand"

	const startDisplay = formatDate(campaign.startDate)
	const endDisplay = formatDate(campaign.endDate)

	return (
		<div className="flex flex-col min-h-full bg-white">
			{/* Top Nav / Subheader */}
			<div className="flex justify-between items-center px-8 py-4 border-b border-black/10 shrink-0">
				<p className="text-sm font-semibold text-black/50 mx-auto">
					Welcome to <span className="text-[#EE2C2C] font-bold">Meetday</span>
				</p>
			</div>

			<div className="flex-1 min-h-0 w-full overflow-hidden relative bg-white flex flex-col">
				<div className="px-4 lg:px-6 py-6 lg:py-8 flex-1 flex flex-col gap-6 overflow-y-auto h-full min-h-0 transition-all duration-300 relative max-w-3xl mx-auto w-full">
					{/* Viewer CTA: Floating / Sticky 'I am Interested' button with exact proposal popup styling */}
					{!isBrandRole && onExpressInterest && (
						<div className="fixed bottom-6 right-6 z-40 sm:sticky sm:top-0 sm:self-end sm:z-30 sm:h-0 sm:w-0 sm:relative">
							<div className="sm:absolute sm:top-0 sm:right-0">
								<style>{`
									@keyframes pop-animation {
										0%, 100% { transform: scale(1); }
										50% { transform: scale(1.04); }
									}
									.btn-pop {
										animation: pop-animation 2s infinite ease-in-out;
									}
								`}</style>
								{isInterested && chatHref ? (
									<Link
										href={chatHref}
										className="py-3 px-6 bg-[#FFC940] text-black border-[3px] border-black rounded-2xl font-black text-center text-xs tracking-wider transition-all select-none whitespace-nowrap shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] block uppercase"
									>
										REQUEST SENT · OPEN CHAT
									</Link>
								) : (
									<button
										type="button"
										disabled={isInterested || isSubmittingInterest || !isApproved}
										onClick={onExpressInterest}
										className={clsx(
											"py-3 px-6 bg-[#EE2C2C] text-white border-[3px] border-black rounded-2xl font-black text-center text-xs tracking-wider transition-all select-none whitespace-nowrap",
											!isInterested && !isSubmittingInterest && isApproved
												? "btn-pop shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]"
												: "opacity-60 cursor-not-allowed",
										)}
									>
										{isInterested
											? "Brand Notified ✓"
											: isSubmittingInterest
												? "Sending…"
												: "I am Interested"}
									</button>
								)}
								{!isApproved && (
									<span className="block mt-2 text-[11px] font-black text-[#EE2C2C] uppercase tracking-wider text-right">
										Waiting for profile approval
									</span>
								)}
							</div>
						</div>
					)}

					{/* Header row for Brand view OR Back button for viewers */}
					{isBrandRole ? (
						<div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-2 border-b border-black/10 gap-4">
							<div className="flex flex-col gap-1">
								<button
									type="button"
									onClick={onBack}
									className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#EE2C2C] hover:underline mb-1 self-start cursor-pointer"
								>
									← Back to Campaigns
								</button>
								<div className="flex items-center gap-2 flex-wrap">
									<h1 className="text-xl sm:text-2xl md:text-3xl font-heading font-black text-black leading-tight">
										{campaign.name}
									</h1>
									{campaign.status && (
										<span
											className={clsx(
												"text-[9px] font-black px-2 py-0.5 border border-black rounded-full uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]",
												campaign.status === "DRAFT" && "bg-slate-100 text-black",
												campaign.status === "UNDER_REVIEW" && "bg-[#F5C343] text-black",
												campaign.status === "REJECTED" && "bg-[#EE2C2C] text-white",
												campaign.status === "PUBLISHED" && "bg-emerald-400 text-black",
											)}
										>
											{campaign.status === "UNDER_REVIEW" ? "Under Review" : campaign.status}
										</span>
									)}
								</div>
								<p className="text-xs font-semibold text-black/50">Campaign Brief &amp; Overview</p>
							</div>
							<div className="flex flex-wrap items-center gap-2">
								{(campaign.status === "DRAFT" || campaign.status === "REJECTED") && onSubmitForApproval && (
									<button
										type="button"
										disabled={isSubmittingForApproval}
										className="bg-[#6C32D1] text-white border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider select-none disabled:opacity-50"
										onClick={onSubmitForApproval}
									>
										{isSubmittingForApproval ? "Submitting…" : "Submit for Approval"}
									</button>
								)}
								{onEdit && (
									<button
										type="button"
										className="bg-[#EE2C2C] text-white border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider select-none"
										onClick={onEdit}
									>
										Edit Details
									</button>
								)}
								{onDelete && (
									<button
										type="button"
										className="bg-red-50 text-[#EE2C2C] border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider select-none"
										onClick={onDelete}
									>
										Delete
									</button>
								)}
							</div>
						</div>
					) : (
						<button
							type="button"
							onClick={onBack}
							className="flex items-center gap-1.5 text-xs font-bold text-black/50 hover:text-black transition-colors mb-2 self-start cursor-pointer"
						>
							<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
							</svg>
							Back to Active Campaigns
						</button>
					)}

					{/* Rejection remark banner */}
					{campaign.status === "REJECTED" && campaign.adminRejectionRemark && (
						<div className="p-3 bg-red-50 border border-red-200 rounded-action text-xs text-red-700">
							<span className="font-semibold">Rejected by admin: </span>
							{campaign.adminRejectionRemark}
						</div>
					)}

					{/* Title Section — side by side: logo left, name right */}
					<div className="flex flex-row items-start gap-4 pb-4 border-b border-black/10">
						{brandLogo ? (
							<div className="relative size-16 sm:size-36 shrink-0 rounded-xl overflow-hidden border border-border-default shadow-sm bg-slate-50">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src={brandLogo} alt={brandName} className="size-full object-cover" />
							</div>
						) : (
							<div className="relative size-16 sm:size-36 shrink-0 rounded-xl overflow-hidden border border-border-default shadow-sm bg-[#EE2C2C] flex items-center justify-center">
								<span className="text-white font-black text-2xl sm:text-4xl">
									{(brandName || "B")[0].toUpperCase()}
								</span>
							</div>
						)}
						<div className="flex-1 min-w-0">
							<h1 className="text-xl sm:text-3xl font-heading font-black text-black leading-tight">
								{campaign.name || "Untitled Campaign"}
							</h1>
							<p className="text-sm font-semibold text-black/50 mt-1">Initiated by {brandName}</p>
						</div>
					</div>

					{/* Metadata Section */}
					<div className="flex flex-col gap-6">
						<div className="flex flex-col gap-6 items-stretch">
							<div className="flex-1 bg-surface-card-muted border border-border-default rounded-action p-4 w-full flex flex-col justify-between gap-4">
								<div className="grid grid-cols-2 gap-4">
									{/* Start Date */}
									{startDisplay && (
										<div>
											<p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">Start</p>
											<div className="mt-1">
												<span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black bg-[#EE2C2C] text-white border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
													{startDisplay}
												</span>
											</div>
										</div>
									)}

									{/* End Date */}
									{endDisplay && endDisplay !== startDisplay && (
										<div>
											<p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">End</p>
											<div className="mt-1">
												<span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black bg-[#EE2C2C] text-white border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
													{endDisplay}
												</span>
											</div>
										</div>
									)}

									{/* Target Locations — full width second row */}
									<div className="col-span-2">
										<p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">Target Locations</p>
										<div className="flex flex-row flex-wrap items-center gap-2 mt-1">
											{campaign.locations && campaign.locations.length > 0 ? (
												campaign.locations.map((loc, idx) => (
													<span
														key={idx}
														className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-[#EE2C2C] text-white border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap"
													>
														{loc}
													</span>
												))
											) : (
												<span className="text-xs font-semibold text-text-secondary">Not specified</span>
											)}
										</div>
									</div>
								</div>

								{/* Divider */}
								<hr className="border-border-default/15" />

								{/* Row 2: Campaign Goal & Offer Type */}
								<div className="grid grid-cols-2 gap-4">
									{campaign.goal && (
										<div>
											<p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">Campaign Goal</p>
											<div className="flex mt-1">
												<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-[#EE2C2C] text-white border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
													{campaign.goal}
												</span>
											</div>
										</div>
									)}
									{campaign.offerType && (
										<div>
											<p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">Offer Type</p>
											<div className="flex mt-1">
												<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-[#EE2C2C] text-white border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
													{campaign.offerType}
												</span>
											</div>
										</div>
									)}
								</div>

								{/* Divider */}
								<hr className="border-border-default/15" />

								{/* Row 3: Audience */}
								{campaign.audience && campaign.audience.length > 0 && (
									<div>
										<p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">Target Audience</p>
										<div className="flex flex-wrap gap-1.5 mt-1">
											{campaign.audience.map((aud, i) => (
												<span
													key={i}
													className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-[#F5C343] text-black border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider"
												>
													{aud}
												</span>
											))}
										</div>
									</div>
								)}
							</div>
						</div>

						{/* About Campaign */}
						{campaign.description && (
							<div className="bg-surface-card border border-border-default rounded-action p-5">
								<h4 className="text-sm font-bold text-text-primary mb-2">About the Campaign</h4>
								<p className="text-body-sm text-text-secondary leading-relaxed whitespace-pre-wrap break-words">
									{campaign.description}
								</p>
							</div>
						)}

						{/* Collaboration / Offer Type & Budget */}
						{campaign.offerType === "BARTER" ? (
							<div className="bg-surface-card border border-border-default rounded-action p-5 flex flex-col gap-2">
								<div className="flex items-center gap-2">
									<h4 className="text-sm font-bold text-text-primary">Collaboration Type</h4>
									<span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#FFC940] text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase">
										Barter
									</span>
								</div>
								<p className="text-body-sm text-text-secondary">
									{campaign.barterElements || "This brand is open to product, service, or venue barter collaborations."}
								</p>
							</div>
						) : campaign.offerType === "BOTH" ? (
							<div className="bg-surface-card border border-border-default rounded-action p-5 flex flex-col gap-3">
								<div className="flex items-center justify-between flex-wrap gap-2">
									<h4 className="text-sm font-bold text-text-primary">Budget &amp; Barter</h4>
									<div className="flex items-center gap-1.5">
										<span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase">
											Cash
										</span>
										<span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#FFC940] text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase">
											Barter
										</span>
									</div>
								</div>
								<div className="flex flex-wrap gap-3">
									<div className="flex flex-col gap-1 border border-border-default/45 rounded-xl px-4 py-2 bg-surface-card-muted">
										<div className="flex gap-2 text-sm">
											<span className="text-text-secondary font-medium">Budget:</span>
											<span className="text-text-brand font-semibold">
												{campaign.budgetCurrency} {Number(campaign.budgetAmount).toLocaleString()}
											</span>
										</div>
									</div>
								</div>
								{campaign.barterElements && (
									<div className="border-t border-border-default/20 pt-2">
										<p className="text-xs font-bold text-text-tertiary uppercase">Barter Elements</p>
										<p className="text-body-sm text-text-secondary mt-1 whitespace-pre-wrap">{campaign.barterElements}</p>
									</div>
								)}
							</div>
						) : (
							<div className="bg-surface-card border border-border-default rounded-action p-5 flex flex-col gap-3">
								<div className="flex items-center justify-between flex-wrap gap-2">
									<h4 className="text-sm font-bold text-text-primary">Campaign Budget</h4>
									<span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase">
										Cash
									</span>
								</div>
								<div className="flex flex-wrap gap-3">
									<div className="flex flex-col gap-1 border border-border-default/45 rounded-xl px-4 py-2 bg-surface-card-muted">
										<div className="flex gap-2 text-sm">
											<span className="text-text-secondary font-medium">Budget Amount:</span>
											<span className="text-text-brand font-semibold">
												{campaign.budgetCurrency} {Number(campaign.budgetAmount).toLocaleString()}
											</span>
										</div>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
