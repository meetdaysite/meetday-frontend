"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Icon } from "@/components/ui/Icon"
import { CampaignCard } from "@/components/campaigns/CampaignCard"
import { CampaignDetailView } from "@/components/campaigns/CampaignDetailView"
import { getPublishedCampaigns, markCampaignInterest, getMySponsorshipChats, type Campaign } from "@/lib/api"
import { useHostStore } from "@/store/hostStore"
import clsx from "clsx"

import RocketSvg from "@/icons/outlined/rocket.svg"

export default function ExploreCampaignsPage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const urlCampaignId = searchParams ? searchParams.get("campaignId") : null
	const { profile } = useHostStore()
	const [campaigns, setCampaigns] = useState<Campaign[]>([])
	const [loading, setLoading] = useState(true)
	const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
	const [searchQuery, setSearchQuery] = useState("")
	const [submittingInterest, setSubmittingInterest] = useState(false)
	const [interestedCampaignIds, setInterestedCampaignIds] = useState<Set<string>>(new Set())

	const isHostApproved = profile?.approvalStatus === "APPROVED"

	async function handleExpressInterest() {
		if (!selectedCampaign) return
		if (!isHostApproved) {
			toast.error("Your community profile must be approved by the admin to express interest.")
			return
		}
		setSubmittingInterest(true)
		try {
			const res = await markCampaignInterest(selectedCampaign.id)
			if (res.alreadyInterested) {
				toast.info("You have already expressed interest in this campaign.")
			} else {
				toast.success("Interest expressed successfully! A chat thread has been created.")
			}
			setInterestedCampaignIds(prev => {
				const next = new Set(prev)
				next.add(selectedCampaign.id)
				return next
			})

		} catch (err) {
			console.error(err)
			toast.error("Failed to express interest. Please try again.")
		} finally {
			setSubmittingInterest(false)
		}
	}

	useEffect(() => {
		setLoading(true)
		getPublishedCampaigns()
			.then((data) => setCampaigns(data))
			.catch((err) => {
				console.error("Failed to load campaigns", err)
				toast.error("Failed to load campaigns")
			})
			.finally(() => setLoading(false))

		Promise.all([
			getMySponsorshipChats("REQUESTED", "HOST").catch(() => []),
			getMySponsorshipChats("ACCEPTED", "HOST").catch(() => []),
		]).then(([req, acc]) => {
			const ids = new Set<string>()
			const all = [...req, ...acc]
			all.forEach(t => {
				if (t.campaignId) {
					ids.add(t.campaignId)
				}
			})
			setInterestedCampaignIds(ids)
		}).catch(err => {
			console.error("Failed to load existing chat interests", err)
		})
	}, [])

	useEffect(() => {
		if (urlCampaignId && campaigns.length > 0) {
			const found = campaigns.find(c => c.id === urlCampaignId)
			if (found) {
				setSelectedCampaign(found)
			}
		}
	}, [urlCampaignId, campaigns])

	const filteredCampaigns = useMemo(() => {
		const query = searchQuery.toLowerCase().trim()
		if (!query) return campaigns
		return campaigns.filter(c =>
			c.name.toLowerCase().includes(query) ||
			(c.brandProfile?.brandName ?? "").toLowerCase().includes(query) ||
			c.locations.some(loc => loc.toLowerCase().includes(query)) ||
			c.goal.toLowerCase().includes(query)
		)
	}, [campaigns, searchQuery])

	return selectedCampaign ? (
		<CampaignDetailView
			campaign={selectedCampaign}
			role="community"
			onBack={() => {
				setSelectedCampaign(null)
				if (urlCampaignId) {
					router.replace("/community/dashboard/campaigns")
				}
			}}
			isApproved={isHostApproved}
			isInterested={interestedCampaignIds.has(selectedCampaign.id)}
			isSubmittingInterest={submittingInterest}
			onExpressInterest={handleExpressInterest}
		/>
	) : (
		<div className="flex flex-col min-h-screen">
			{/* Top Nav / Subheader */}
			<div className="hidden sm:flex justify-between items-center px-8 py-4 border-b border-black/10 shrink-0">
				<p className="text-sm font-semibold text-black/50 mx-auto">
					Welcome to <span className="text-[#EE2C2C] font-bold">Meetday</span>
				</p>
			</div>

			<div className="px-4 lg:px-6 py-6 max-w-6xl mx-auto w-full flex-1 flex flex-col gap-6">
				<div>
					<h1 className="text-3xl font-heading font-black tracking-tight text-black leading-tight">
						Brand Campaigns
					</h1>
					<p className="text-sm font-semibold text-black/50 mt-1.5">
						Explore and match with active campaign briefs from brands looking for sponsorships
					</p>
				</div>

				{/* Search */}
				<input
					type="text"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					placeholder="Search by campaign name, brand, location or goal..."
					className="w-full h-11 px-4 rounded-xl border-[3px] border-black bg-white text-black placeholder:text-black/40 outline-none font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:shadow-none focus:translate-x-[3px] focus:translate-y-[3px] transition-all"
				/>

				{loading ? (
					<div className="border-[3px] border-dashed border-black/30 rounded-[20px] p-12 text-center">
						<p className="text-sm font-semibold text-black/50">Loading campaigns...</p>
					</div>
				) : filteredCampaigns.length === 0 ? (
					<div className="border-[3px] border-dashed border-black/30 rounded-[20px] p-12 flex flex-col items-center justify-center text-center gap-4">
						<Icon as={RocketSvg} size="lg" className="text-black/20" />
						<p className="font-heading font-black text-black/40 text-lg">No campaigns found</p>
						<p className="text-sm font-semibold text-black/30 max-w-sm">
							There are no active campaigns right now. Check back later!
						</p>
					</div>
				) : (
					<div className="grid gap-6 grid-cols-1 md:grid-cols-2">
						{filteredCampaigns.map((c) => (
							<CampaignCard
								key={c.id}
								campaign={c}
								onClick={() => setSelectedCampaign(c)}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	)
}
