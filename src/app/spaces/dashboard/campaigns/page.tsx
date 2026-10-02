"use client"

import { useEffect, useMemo, useState } from "react"
import { getPublishedCampaigns, type Campaign } from "@/lib/api"

export default function SpaceCampaignsPage() {
	const [campaigns, setCampaigns] = useState<Campaign[]>([])
	const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
	const [search, setSearch] = useState("")
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(false)

	useEffect(() => {
		let cancelled = false
		getPublishedCampaigns()
			.then((items) => {
				if (!cancelled) setCampaigns(items)
			})
			.catch((cause) => {
				console.error("Failed to load published campaigns for Hub Partner", cause)
				if (!cancelled) setError(true)
			})
			.finally(() => {
				if (!cancelled) setLoading(false)
			})
		return () => {
			cancelled = true
		}
	}, [])

	const filteredCampaigns = useMemo(() => {
		const query = search.trim().toLowerCase()
		if (!query) return campaigns
		return campaigns.filter((campaign) =>
			campaign.name.toLowerCase().includes(query) ||
			(campaign.brandProfile?.brandName ?? "").toLowerCase().includes(query) ||
			campaign.locations.some((location) => location.toLowerCase().includes(query)) ||
			campaign.goal.toLowerCase().includes(query),
		)
	}, [campaigns, search])

	return (
		<main className="min-h-screen bg-white px-4 py-6 sm:px-6 lg:px-8">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
				<header>
					<p className="text-xs font-black uppercase text-[#EE2C2C]">Hub Partner</p>
					<h1 className="mt-1 text-3xl font-heading font-black text-black">Brand Campaigns</h1>
					<p className="mt-2 text-sm font-semibold text-black/55">
						Browse published campaigns from brands and review their requirements.
					</p>
				</header>

				<input
					value={search}
					onChange={(event) => setSearch(event.target.value)}
					placeholder="Search campaigns, brands, locations, or goals..."
					className="h-11 w-full rounded-xl border-[3px] border-black px-4 text-sm font-bold text-black shadow-[3px_3px_0_0_#000] outline-none focus:translate-x-[3px] focus:translate-y-[3px] focus:shadow-none"
				/>

				{error ? (
					<div className="border-[3px] border-black bg-[#FFF8F3] p-5 font-semibold">
						<p>Campaigns could not be loaded.</p>
						<button className="mt-3 underline" onClick={() => window.location.reload()} type="button">
							Try again
						</button>
					</div>
				) : loading ? (
					<div className="border-[3px] border-dashed border-black/30 p-10 text-center font-semibold text-black/50">
						Loading campaigns...
					</div>
				) : filteredCampaigns.length === 0 ? (
					<div className="border-[3px] border-dashed border-black/30 p-10 text-center">
						<p className="text-lg font-black text-black/60">No published campaigns found</p>
					</div>
				) : (
					<div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
						<div className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
							{filteredCampaigns.map((campaign) => {
								const selected = selectedCampaign?.id === campaign.id
								return (
									<button
										key={campaign.id}
										type="button"
										onClick={() => setSelectedCampaign(selected ? null : campaign)}
										className={`flex min-h-28 w-full gap-3 border-[3px] border-black p-3 text-left shadow-[3px_3px_0_0_#000] ${selected ? "bg-[#FFF3C4]" : "bg-white"}`}
									>
										<div
											role="img"
											aria-label={`${campaign.brandProfile?.brandName ?? "Brand"} logo`}
											className="flex size-16 shrink-0 items-center justify-center overflow-hidden border-2 border-black bg-[#EE2C2C] bg-cover bg-center font-black text-white"
											style={campaign.brandProfile?.logoUrl ? { backgroundImage: `url(${JSON.stringify(campaign.brandProfile.logoUrl)})` } : undefined}
										>
											{(campaign.brandProfile?.brandName ?? "B").slice(0, 1).toUpperCase()}
										</div>
										<div className="min-w-0 flex-1">
											<p className="truncate text-base font-black text-black">{campaign.name}</p>
											<p className="mt-1 truncate text-xs font-bold text-black/55">{campaign.brandProfile?.brandName ?? "Brand"}</p>
											<p className="mt-2 line-clamp-2 text-xs font-semibold text-black/70">{campaign.goal}</p>
										</div>
									</button>
								)
							})}
						</div>

						<section className="border-[3px] border-black bg-white p-5 shadow-[4px_4px_0_0_#000]">
							{selectedCampaign ? (
								<>
									<p className="text-xs font-black uppercase text-[#EE2C2C]">{selectedCampaign.brandProfile?.brandName ?? "Brand"}</p>
									<h2 className="mt-1 text-xl font-heading font-black text-black">{selectedCampaign.name}</h2>
									<dl className="mt-5 grid gap-4 text-sm">
										<div><dt className="font-black">Goal</dt><dd>{selectedCampaign.goal}</dd></div>
										<div><dt className="font-black">Locations</dt><dd>{selectedCampaign.locations.join(", ") || "Not specified"}</dd></div>
										<div><dt className="font-black">Audience</dt><dd>{selectedCampaign.audience.join(", ") || "Not specified"}</dd></div>
										<div><dt className="font-black">Offer</dt><dd>{selectedCampaign.offerType === "BARTER" ? selectedCampaign.barterElements || "Barter" : `${selectedCampaign.budgetCurrency} ${Number(selectedCampaign.budgetAmount).toLocaleString()}`}</dd></div>
										<div><dt className="font-black">Run dates</dt><dd>{new Date(selectedCampaign.startDate).toLocaleDateString("en-IN")} – {new Date(selectedCampaign.endDate).toLocaleDateString("en-IN")}</dd></div>
										{selectedCampaign.description && <div><dt className="font-black">Details</dt><dd className="whitespace-pre-wrap">{selectedCampaign.description}</dd></div>}
									</dl>
									<div className="mt-6 border-[2px] border-dashed border-black/40 bg-[#FFF8F3] p-4 text-sm font-bold text-black/65">
										Hub campaign interest, chat, deal locking, and reporting are not available yet. No request will be sent.
									</div>
								</>
							) : (
								<p className="font-semibold text-black/50">Select a campaign to view its details.</p>
							)}
						</section>
					</div>
				)}
			</div>
		</main>
	)
}