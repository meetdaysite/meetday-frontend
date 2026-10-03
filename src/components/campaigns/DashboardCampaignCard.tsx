import Link from "next/link"
import type { Campaign } from "@/lib/api"

export function DashboardCampaignCard({
	campaign,
	href,
	fallbackLogo,
	fallbackBrandName,
}: {
	campaign: Campaign
	href: string
	fallbackLogo?: string | null
	fallbackBrandName?: string
}) {
	const brandName = campaign.brandProfile?.brandName || fallbackBrandName || "Brand"
	const brandLogo = campaign.brandProfile?.logoUrl || fallbackLogo

	const startDate = campaign.startDate
		? new Date(campaign.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
		: ""
	const endDate = campaign.endDate
		? new Date(campaign.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
		: ""
	const displayDates = startDate && endDate ? `${startDate} - ${endDate}` : startDate

	return (
		<Link
			href={href}
			className="group relative cursor-pointer bg-white border-[3px] border-black rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all overflow-hidden flex flex-row w-[380px] max-w-[85vw] shrink-0"
		>
			{/* Image / Logo on the left */}
			<div className="relative w-[120px] aspect-square shrink-0 overflow-hidden bg-slate-50 border-r-[3px] border-black rounded-l-[17px]">
				{brandLogo ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img
						src={brandLogo}
						alt={brandName}
						className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 rounded-l-[14px]"
					/>
				) : (
					<div className="w-full h-full bg-slate-100 flex items-center justify-center text-black/40 font-black text-sm">
						{brandName.substring(0, 2).toUpperCase()}
					</div>
				)}

				{/* Offer Type Badge(s) */}
				<div className="absolute top-2 left-2 flex flex-wrap gap-1 z-10">
					{(campaign.offerType === "CASH" || campaign.offerType === "BOTH" || !campaign.offerType) && (
						<span className="text-[7px] font-black px-1.5 py-0.5 border-[2px] border-black rounded-full uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] bg-emerald-100 text-emerald-900">
							Cash
						</span>
					)}
					{(campaign.offerType === "BARTER" || campaign.offerType === "BOTH") && (
						<span className="text-[7px] font-black px-1.5 py-0.5 border-[2px] border-black rounded-full uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] bg-[#FFC940] text-black">
							Barter
						</span>
					)}
				</div>
			</div>

			{/* Content & Footer info on the right */}
			<div className="flex-1 p-3 flex flex-col justify-between min-w-0">
				<div className="flex flex-col gap-1">
					<h3 className="font-heading font-black text-base text-black truncate group-hover:text-[#EE2C2C] transition-colors leading-snug">
						{campaign.name}
					</h3>
					<p className="text-[11px] font-bold text-black/50 truncate">
						{brandName}{campaign.locations && campaign.locations.length > 0 && ` • ${campaign.locations.slice(0, 2).join(", ")}`}
					</p>
					{campaign.description && (
						<p className="text-[11px] font-semibold text-black/70 line-clamp-2 mt-0.5 leading-normal">
							{campaign.description}
						</p>
					)}
				</div>

				<div className="flex flex-wrap gap-1.5 mt-2">
					{displayDates && (
						<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-[#6C32D1] text-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
							{displayDates}
						</span>
					)}
					<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-[#EE2C2C] text-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
						{campaign.offerType === "BARTER" ? "BARTER" : `${campaign.budgetCurrency || "₹"} ${Number(campaign.budgetAmount).toLocaleString()}`}
					</span>
				</div>
			</div>
		</Link>
	)
}
