import Image from "next/image"
import type { Campaign } from "@/lib/api"

export function CampaignCard({ campaign, onClick }: { campaign: Campaign; onClick: () => void }) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="group relative flex h-[150px] w-full cursor-pointer flex-row overflow-hidden rounded-[20px] border-[3px] border-black bg-white text-left shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
		>
			<div className="relative h-full w-[150px] shrink-0 overflow-hidden rounded-l-[17px] border-r-[3px] border-black bg-slate-50">
				{campaign.brandProfile?.logoUrl ? (
					<Image
						src={campaign.brandProfile.logoUrl}
						alt={campaign.brandProfile.brandName || "Brand"}
						fill
						unoptimized
						className="rounded-l-[14px] object-cover transition-transform duration-300 group-hover:scale-[1.02]"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm font-black text-black/40">
						{campaign.brandProfile?.brandName?.slice(0, 2).toUpperCase() || "MD"}
					</div>
				)}
				<span className="absolute left-2 top-2 rounded-full border-[2px] border-black bg-[#FFC940] px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
					{campaign.offerType}
				</span>
			</div>
			<div className="flex min-w-0 flex-1 flex-col justify-between p-3">
				<div className="flex min-w-0 flex-col gap-1">
					<h3 className="truncate font-heading text-base font-black leading-snug text-black transition-colors group-hover:text-[#EE2C2C]">
						{campaign.name}
					</h3>
					<p className="truncate text-[11px] font-bold text-black/50">
						Brand: {campaign.brandProfile?.brandName ?? "Brand"}{campaign.locations.length > 0 && ` • ${campaign.locations.slice(0, 2).join(", ")}`}{campaign.locations.length > 2 ? ` +${campaign.locations.length - 2}` : ""}
					</p>
					{campaign.description && (
						<p className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-normal text-black/70">
							{campaign.description}
						</p>
					)}
				</div>
				<div className="mt-2 flex flex-wrap gap-1.5">
					<span className="inline-flex items-center gap-1 rounded-md border border-black bg-[#6C32D1] px-2 py-0.5 text-[10px] font-black text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
						{new Date(campaign.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – {new Date(campaign.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
					</span>
					<span className="inline-flex items-center gap-1 rounded-md border border-black bg-[#EE2C2C] px-2 py-0.5 text-[10px] font-black text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
						{campaign.offerType === "BARTER" ? "BARTER" : `${campaign.budgetCurrency} ${Number(campaign.budgetAmount).toLocaleString()}`}
					</span>
				</div>
			</div>
		</button>
	)
}
