"use client"

import { useEffect, useMemo, useState } from "react"
import clsx from "clsx"
import Link from "next/link"
import { toast } from "sonner"
import { CampaignCard } from "@/components/campaigns/CampaignCard"
import {
	getMySponsorshipChats,
	getPublishedCampaigns,
	getSpaceCommunityProfile,
	markCampaignInterest,
	type Campaign,
} from "@/lib/api"

export default function SpaceCampaignsPage() {
	const [campaigns, setCampaigns] = useState<Campaign[]>([])
	const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
	const [search, setSearch] = useState("")
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(false)
	const [hubApproved, setHubApproved] = useState(false)
	const [interestedCampaignIds, setInterestedCampaignIds] = useState<Set<string>>(new Set())
	const [submittingInterest, setSubmittingInterest] = useState(false)

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

	useEffect(() => {
		getSpaceCommunityProfile()
			.then((profile) => setHubApproved(profile?.approvalStatus === "APPROVED"))
			.catch(() => setHubApproved(false))

		Promise.all([
			getMySponsorshipChats("REQUESTED", "SPACE").catch(() => []),
			getMySponsorshipChats("ACCEPTED", "SPACE").catch(() => []),
		]).then(([requested, accepted]) => {
			setInterestedCampaignIds(new Set([...requested, ...accepted].flatMap((thread) => thread.campaignId ? [thread.campaignId] : [])))
		})
	}, [])

	async function handleExpressInterest(campaign: Campaign) {
		if (!hubApproved) {
			toast.error("Your Hub profile must be approved before expressing interest.")
			return
		}
		setSubmittingInterest(true)
		try {
			const result = await markCampaignInterest(campaign.id, "SPACE")
			setInterestedCampaignIds((current) => new Set([...current, campaign.id]))
			toast.success(result.alreadyInterested ? "Interest was already sent." : "Interest sent to the brand.")
		} catch (cause) {
			console.error("Failed to express Hub interest in campaign", cause)
			toast.error("Could not express interest. Check that your Hub profile is approved.")
		} finally {
			setSubmittingInterest(false)
		}
	}

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
	const isSplitLayout = !!selectedCampaign

	return (
		<div className="flex min-h-screen flex-col bg-white">
			<div className={clsx("flex-1 min-h-0 w-full bg-white", isSplitLayout && "md:grid md:grid-cols-[58%_42%] md:overflow-hidden")}>
			<div className={clsx("px-4 lg:px-6 py-6 flex flex-col gap-6", isSplitLayout ? "md:max-w-none" : "mx-auto w-full max-w-6xl")}>
				<header>
					<h1 className="text-3xl font-heading font-black tracking-tight text-black leading-tight">Brand Campaigns</h1>
					<p className="mt-1.5 text-sm font-semibold text-black/50">
						Explore and match with active campaign briefs from brands looking for sponsorships.
					</p>
				</header>

				<input
					value={search}
					onChange={(event) => setSearch(event.target.value)}
					placeholder="Search by campaign name, brand, location or goal..."
					className="h-11 w-full rounded-xl border-[3px] border-black bg-white px-4 text-sm font-bold text-black shadow-[3px_3px_0_0_#000] outline-none placeholder:text-black/40 transition-all focus:translate-x-[3px] focus:translate-y-[3px] focus:shadow-none"
				/>

				{error ? (
					<div className="border-[3px] border-black bg-[#FFF8F3] p-5 font-semibold">
						<p>Campaigns could not be loaded.</p>
						<button className="mt-3 underline" onClick={() => window.location.reload()} type="button">
							Try again
						</button>
					</div>
				) : loading ? (
					<div className="rounded-[20px] border-[3px] border-dashed border-black/30 p-12 text-center font-semibold text-black/50">
						Loading campaigns...
					</div>
				) : filteredCampaigns.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-4 rounded-[20px] border-[3px] border-dashed border-black/30 p-12 text-center">
						<p className="text-lg font-black text-black/60">No campaigns found</p>
						<p className="max-w-sm text-sm font-semibold text-black/30">There are no active campaigns right now. Check back later!</p>
					</div>
				) : (
					<div className={clsx("grid gap-6", isSplitLayout ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2")}>
							{filteredCampaigns.map((campaign) => {
								const selected = selectedCampaign?.id === campaign.id
								return (
									<CampaignCard
										key={campaign.id}
										campaign={campaign}
										onClick={() => setSelectedCampaign(selected ? null : campaign)}
									/>
								)
							})}
						</div>
				)}
			</div>

			{selectedCampaign && (
				<section className="flex flex-col border-t-[3px] border-black bg-white md:h-full md:overflow-y-auto md:border-l-[3px] md:border-t-0">
					<div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
						<h2 className="text-xl font-heading font-black text-black">Campaign Details</h2>
						<button type="button" onClick={() => setSelectedCampaign(null)} aria-label="Close campaign details" className="flex size-8 items-center justify-center rounded-full text-sm font-bold text-black/60 transition-colors hover:bg-black/5 hover:text-black">✕</button>
					</div>
					<div className="flex flex-col gap-5 p-6">
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
									<div className="mt-6 border-t-[3px] border-black pt-4">
										{interestedCampaignIds.has(selectedCampaign.id) ? (
											<Link href="/spaces/dashboard/sponsorship-chats?type=campaign" className="block w-full border-[3px] border-black bg-[#FFC940] p-3 text-center text-xs font-black shadow-[3px_3px_0_0_#000]">
												REQUEST SENT · OPEN CAMPAIGN CHAT
											</Link>
										) : (
											<button
												type="button"
												disabled={!hubApproved || submittingInterest}
												onClick={() => handleExpressInterest(selectedCampaign)}
												className="w-full border-[3px] border-black bg-[#EE2C2C] p-3 text-center text-xs font-black text-white shadow-[3px_3px_0_0_#000] disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-black/45 disabled:shadow-none"
											>
												{!hubApproved ? "APPROVED HUB PROFILE REQUIRED" : submittingInterest ? "SENDING..." : "I'M INTERESTED"}
											</button>
										)}
									</div>
					</div>
						</section>
			)}
			</div>
		</div>
	)
}