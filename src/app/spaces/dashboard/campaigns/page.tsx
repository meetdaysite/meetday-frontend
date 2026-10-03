"use client"

import { useEffect, useMemo, useState } from "react"
import clsx from "clsx"
import Link from "next/link"
import { toast } from "sonner"
import { CampaignCard } from "@/components/campaigns/CampaignCard"
import { CampaignDetailView } from "@/components/campaigns/CampaignDetailView"
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

	return selectedCampaign ? (
		<CampaignDetailView
			campaign={selectedCampaign}
			role="space"
			onBack={() => setSelectedCampaign(null)}
			isApproved={hubApproved}
			isInterested={interestedCampaignIds.has(selectedCampaign.id)}
			isSubmittingInterest={submittingInterest}
			onExpressInterest={() => handleExpressInterest(selectedCampaign)}
			chatHref="/spaces/dashboard/sponsorship-chats?type=campaign"
		/>
	) : (
		<div className="flex min-h-screen flex-col bg-white">
			{/* Top Nav / Subheader */}
			<div className="hidden sm:flex justify-between items-center px-8 py-4 border-b border-black/10 shrink-0">
				<p className="text-sm font-semibold text-black/50 mx-auto">
					Welcome to <span className="text-[#EE2C2C] font-bold">Meetday</span>
				</p>
			</div>

			<div className="px-4 lg:px-6 py-6 flex flex-col gap-6 mx-auto w-full max-w-6xl flex-1">
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
					<div className="grid gap-6 grid-cols-1 md:grid-cols-2">
						{filteredCampaigns.map((campaign) => (
							<CampaignCard
								key={campaign.id}
								campaign={campaign}
								onClick={() => setSelectedCampaign(campaign)}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	)
}