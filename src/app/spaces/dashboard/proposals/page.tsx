"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { toast } from "@/lib/toast"
import { useSearchParams } from "next/navigation"
import { Icon } from "@/components/ui/Icon"
import clsx from "clsx"
import { useSpaceStore } from "@/store/spaceStore"
import {
	createSponsorshipProposal,
	updateSponsorshipProposal,
	getMySponsorshipProposals,
	submitSponsorshipProposal,
	deleteSponsorshipProposal,
	getUploadUrl,
	getSpaceCommunityProfile,
	generateProposalDraft,
	extractProposalCopilotDocument,
	type SponsorshipProposal as ApiSponsorshipProposal,
	type SponsorshipProposalPayload,
	type SponsorTier,
	type SpaceCommunityProfile,
} from "@/lib/api"
import { CommunityProfileDetailsPanel } from "@/components/community/CommunityProfileDetailsPanel"
import { AddressAutocompleteInput } from "@/components/eventForm/AddressAutocompleteInput"
import UploadSvg from "@/icons/outlined/upload.svg"
import AiAvatarSvg from "@/assets/ai-avatar.svg"
import MagicStickSvg from "@/icons/duotone/magic-stick-3.svg"

interface StoredProposal {
	id: string
	name: string
	about: string
	image: string | null
	date: string
	endDate: string
	venues: string[]
	venueCities: string[]
	audienceProfile: string[]
	ageGroup: string
	guestCount: string
	videoUrl?: string
	status?: "DRAFT" | "UNDER_REVIEW" | "REJECTED" | "PUBLISHED"
	adminRejectionRemark?: string | null
	sponsorPrices: SponsorTier[]
	sponsorshipType?: "CASH" | "BARTER" | "BOTH"
	popupDays?: string | null
	popupPrice?: string | null
	brandingDays?: string | null
	brandingPrice?: string | null
	pendingRevision?: Record<string, unknown> | null
	updatedAt: string
}

function mapApiProposalToStored(p: ApiSponsorshipProposal): StoredProposal {
	return {
		id: p.id,
		name: p.name || "",
		about: p.about || "",
		image: p.imageUrl || null,
		date: p.eventDate ? p.eventDate.substring(0, 10) : "",
		endDate: p.eventEndDate ? p.eventEndDate.substring(0, 10) : "",
		venues: p.venues && p.venues.length > 0 ? p.venues : p.venue ? [p.venue] : [],
		venueCities: p.venueCities && p.venueCities.length > 0 ? p.venueCities : p.city ? [p.city] : [],
		audienceProfile: p.audienceProfile || [],
		ageGroup: p.ageGroup || "",
		guestCount: p.guestCount || "",
		videoUrl: p.videoUrl || "",
		status: p.status,
		adminRejectionRemark: p.adminRejectionRemark,
		sponsorshipType: p.sponsorshipType || "CASH",
		sponsorPrices: p.sponsorTiers || [],
		popupDays: p.popupDays,
		popupPrice: p.popupPrice,
		brandingDays: p.brandingDays,
		brandingPrice: p.brandingPrice,
		pendingRevision: p.pendingRevision,
		updatedAt: p.updatedAt,
	}
}

function padVenueCities(venues: string[], cities: string[]): string[] {
	return venues.map((_, i) => cities[i] ?? "")
}

async function uploadFileAndGetKey(file: File): Promise<string> {
	const { url, key } = await getUploadUrl({ context: "SPONSORSHIP_MEDIA", contentType: file.type })
	await fetch(url, { method: "PUT", headers: { "Content-Type": file.type }, body: file })
	return key
}

export default function SpaceProposalsPage() {
	const { profile } = useSpaceStore()
	const searchParams = useSearchParams()
	const urlProposalId = searchParams ? searchParams.get("proposalId") : null

	const [community, setCommunity] = useState<SpaceCommunityProfile | null>(null)
	const [proposals, setProposals] = useState<StoredProposal[]>([])
	const [selectedProposal, setSelectedProposal] = useState<StoredProposal | null>(null)
	const [loading, setLoading] = useState(true)
	const [activeTab, setActiveTab] = useState<"ALL" | "DRAFT" | "UNDER_REVIEW" | "REJECTED" | "PUBLISHED">("ALL")
	const [showProposalForm, setShowProposalForm] = useState(false)
	const [isUploading, setIsUploading] = useState(false)

	// Form fields
	const [projName, setProjName] = useState("")
	const [projAbout, setProjAbout] = useState("")
	const [projImage, setProjImage] = useState<File | null>(null)
	const [projImagePreview, setProjImagePreview] = useState<string | null>(null)
	const [projDate, setProjDate] = useState("")
	const [projEndDate, setProjEndDate] = useState("")
	const [projVenues, setProjVenues] = useState<string[]>([""])
	const [projVenueCities, setProjVenueCities] = useState<string[]>([""])
	const [projAudience, setProjAudience] = useState<string[]>([])
	const [newAudience, setNewAudience] = useState("")
	const [projAgeGroup, setProjAgeGroup] = useState("")
	const [projGuestCount, setProjGuestCount] = useState("")
	const [projVideoUrl, setProjVideoUrl] = useState("")
	const [projSponsorshipType, setProjSponsorshipType] = useState<"CASH" | "BARTER" | "BOTH">("CASH")
	const [sponsorPrices, setSponsorPrices] = useState<SponsorTier[]>([{ name: "", price: "" }])
	const [popupDays, setPopupDays] = useState("")
	const [popupPrice, setPopupPrice] = useState("")
	const [brandingDays, setBrandingDays] = useState("")
	const [brandingPrice, setBrandingPrice] = useState("")

	const projImageInputRef = useRef<HTMLInputElement>(null)

	// AI copilot
	const [copilotOpen, setCopilotOpen] = useState(false)
	const [copilotPrompt, setCopilotPrompt] = useState("")
	const [copilotLoading, setCopilotLoading] = useState(false)
	const [copilotDocFile, setCopilotDocFile] = useState<File | null>(null)
	const [copilotDocText, setCopilotDocText] = useState<string | null>(null)
	const [copilotDocUploading, setCopilotDocUploading] = useState(false)
	const copilotDocInputRef = useRef<HTMLInputElement>(null)
	const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)

	const loadingMessages = useMemo(
		() => [
			"Meetday is cooking... 🍳",
			"Spicing up the proposal details... 🌶️",
			"Whipping up the target audience profile... 📊",
			"Simmering the numbers and pricing... 💰",
			"Plating the perfect proposal... 🍽️",
		],
		[],
	)

	useEffect(() => {
		let interval: NodeJS.Timeout
		if (copilotLoading) {
			setLoadingMessageIndex(0)
			interval = setInterval(() => setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length), 2000)
		}
		return () => clearInterval(interval)
	}, [copilotLoading, loadingMessages])

	useEffect(() => {
		setLoading(true)
		Promise.all([getMySponsorshipProposals(), getSpaceCommunityProfile().catch(() => null)])
			.then(([{ proposals: list }, c]) => {
				const mapped = list.map(mapApiProposalToStored)
				setProposals(mapped)
				setCommunity(c)
				if (urlProposalId) {
					const found = mapped.find((item) => item.id === urlProposalId)
					if (found) setSelectedProposal(found)
				}
			})
			.catch((err) => console.error("Failed to load space proposals/profile", err))
			.finally(() => setLoading(false))
	}, [urlProposalId])

	// Poll community approval status while pending
	useEffect(() => {
		if (!community || community.approvalStatus === "APPROVED") return
		const interval = setInterval(() => {
			getSpaceCommunityProfile().then(setCommunity).catch(() => {})
		}, 15000)
		return () => clearInterval(interval)
	}, [community])

	useEffect(() => {
		if (projImage) {
			const url = URL.createObjectURL(projImage)
			setProjImagePreview(url)
			return () => URL.revokeObjectURL(url)
		}
		setProjImagePreview(null)
	}, [projImage])

	const isCommunityApproved = community?.approvalStatus === "APPROVED"

	const draftCount = useMemo(() => proposals.filter((p) => p.status === "DRAFT").length, [proposals])
	const underReviewCount = useMemo(
		() => proposals.filter((p) => p.status === "UNDER_REVIEW" || p.pendingRevision != null).length,
		[proposals],
	)
	const rejectedCount = useMemo(() => proposals.filter((p) => p.status === "REJECTED").length, [proposals])
	const publishedCount = useMemo(() => proposals.filter((p) => p.status === "PUBLISHED" || !p.status).length, [proposals])
	const allCount = proposals.length

	const filteredProposals = useMemo(() => {
		return proposals.filter((p) => {
			if (activeTab === "ALL") return true
			if (activeTab === "DRAFT") return p.status === "DRAFT"
			if (activeTab === "UNDER_REVIEW") return p.status === "UNDER_REVIEW" || p.pendingRevision != null
			if (activeTab === "REJECTED") return p.status === "REJECTED"
			if (activeTab === "PUBLISHED") return p.status === "PUBLISHED" || !p.status
			return true
		})
	}, [proposals, activeTab])

	const communityForPanel = community
		? {
				...community,
				size: community.communitySize,
				avgGuestCount: community.venueCapacity,
				secondaryImageUrl: community.posterUrl,
				secondaryImageKey: community.posterKey,
				hostProfileId: community.spaceProfileId,
			}
		: null

	function resetProposalForm() {
		setProjName("")
		setProjAbout("")
		setProjImage(null)
		setProjDate("")
		setProjEndDate("")
		setProjVenues([""])
		setProjVenueCities([""])
		setProjAudience([])
		setNewAudience("")
		setProjAgeGroup("")
		setProjGuestCount("")
		setProjVideoUrl("")
		setProjSponsorshipType("CASH")
		setSponsorPrices([{ name: "", price: "" }])
		setPopupDays("")
		setPopupPrice("")
		setBrandingDays("")
		setBrandingPrice("")
		setShowProposalForm(false)
	}

	function openProposalForm(p?: StoredProposal) {
		if (!p && !isCommunityApproved) {
			toast.error(
				community?.approvalStatus === "REJECTED"
					? "Your Community Space profile was rejected by admin. Update it and wait for re-approval before creating a proposal."
					: "Your Community Space profile is still pending admin approval. You'll be able to create a proposal once it's approved.",
			)
			return
		}
		if (p) {
			const data = (p.pendingRevision as unknown as StoredProposal) || p
			setProjName(data.name)
			setProjAbout(data.about)
			setProjImage(null)
			setProjDate(data.date)
			setProjEndDate(data.endDate)
			setProjVenues(data.venues && data.venues.length > 0 ? data.venues : [""])
			setProjVenueCities(padVenueCities(data.venues && data.venues.length > 0 ? data.venues : [""], data.venueCities || []))
			setProjAudience(Array.isArray(data.audienceProfile) ? data.audienceProfile : [])
			setProjAgeGroup(data.ageGroup)
			setProjGuestCount(data.guestCount)
			setProjVideoUrl(data.videoUrl || "")
			setProjSponsorshipType(data.sponsorshipType || "CASH")
			setSponsorPrices(data.sponsorPrices && data.sponsorPrices.length > 0 ? data.sponsorPrices : [{ name: "", price: "" }])
			setPopupDays(data.popupDays || "")
			setPopupPrice(data.popupPrice || "")
			setBrandingDays(data.brandingDays || "")
			setBrandingPrice(data.brandingPrice || "")
			setSelectedProposal(p)
		} else {
			resetProposalForm()
			setSelectedProposal(null)
		}
		setShowProposalForm(true)
	}

	function handleProjImageChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		if (!file) return
		const allowedTypes = ["image/jpeg", "image/jpg", "image/png"]
		if (!allowedTypes.includes(file.type)) {
			toast.error("Only JPG, JPEG or PNG images are accepted.")
			return
		}
		if (file.size > 5 * 1024 * 1024) {
			toast.error("Image file size cannot exceed 5MB.")
			return
		}
		setProjImage(file)
	}

	async function handleCopilotDocPick(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		e.target.value = ""
		if (!file) return
		const ext = file.name.split(".").pop()?.toLowerCase()
		if (!ext || !["pdf", "docx", "pptx"].includes(ext)) {
			toast.error("Only PDF, Word (.docx), and PowerPoint (.pptx) files are supported.")
			return
		}
		if (file.size > 10 * 1024 * 1024) {
			toast.error("File size cannot exceed 10MB.")
			return
		}
		setCopilotDocFile(file)
		setCopilotDocUploading(true)
		try {
			const text = await extractProposalCopilotDocument(file)
			setCopilotDocText(text)
		} catch {
			toast.error("Couldn't read that document. Please try a different file.")
			setCopilotDocFile(null)
			setCopilotDocText(null)
		} finally {
			setCopilotDocUploading(false)
		}
	}

	function handleRemoveCopilotDoc() {
		setCopilotDocFile(null)
		setCopilotDocText(null)
	}

	async function handleGenerateProposalDraft() {
		const trimmed = copilotPrompt.trim()
		if (!trimmed || copilotLoading) return
		setCopilotLoading(true)
		try {
			const combinedPrompt = copilotDocText
				? `${trimmed}\n\nAdditional context from an uploaded document:\n${copilotDocText}`
				: trimmed
			const draft = await generateProposalDraft(combinedPrompt)
			setProjName(draft.name)
			setProjAbout(draft.about)
			setProjAudience(draft.audience_profile)
			setProjAgeGroup(draft.age_group)
			setProjGuestCount(draft.guest_count)
			setSponsorPrices(draft.sponsor_tiers.length > 0 ? draft.sponsor_tiers : [{ name: "", price: "" }])
			setCopilotOpen(false)
			handleRemoveCopilotDoc()
			toast.success("Meetday filled in the proposal. Review and adjust as needed.")
		} catch {
			toast.error("Couldn't generate a draft right now. Please try again.")
		} finally {
			setCopilotLoading(false)
		}
	}

	async function handleProposalSubmit(e: React.FormEvent, forceStatus?: "DRAFT" | "UNDER_REVIEW") {
		e.preventDefault()
		if (isUploading) return

		if (!projName.trim()) return toast.error("Project Name is required.")
		if (!projAbout.trim()) return toast.error("About description is required.")
		if (!projImage && !selectedProposal?.image) return toast.error("Project Image is required.")
		if (!projDate) return toast.error("Date is required.")
		if (!projEndDate) return toast.error("End date is required.")
		if (projEndDate < projDate) return toast.error("End date cannot be before the start date.")
		if (projVenues.every((v) => !v.trim())) return toast.error("At least one venue is required.")
		if (projVenues.some((v, idx) => v.trim() && !projVenueCities[idx]?.trim()))
			return toast.error("Please add a city for every venue.")
		if (projAudience.length === 0) return toast.error("At least one Audience Profile tag is required.")
		if (!projAgeGroup.trim()) return toast.error("Age Group is required.")
		if (!projGuestCount.trim()) return toast.error("Number of Guests is required.")
		const hasPopup = popupDays.trim() && popupPrice.trim()
		const hasBranding = brandingDays.trim() && brandingPrice.trim()
		if (!hasPopup && !hasBranding) return toast.error("Fill in at least one of Pop-up or Branding pricing.")

		setIsUploading(true)
		try {
			const filledVenueIdx = projVenues.map((v, idx) => (v.trim() ? idx : -1)).filter((idx) => idx !== -1)
			const payload: SponsorshipProposalPayload = {
				name: projName,
				about: projAbout,
				eventDate: projDate,
				eventEndDate: projEndDate,
				venues: filledVenueIdx.map((idx) => projVenues[idx].trim()),
				venueCities: filledVenueIdx.map((idx) => projVenueCities[idx]?.trim() || ""),
				audienceProfile: projAudience,
				ageGroup: projAgeGroup,
				guestCount: projGuestCount,
				sponsorshipType: projSponsorshipType,
				sponsorTiers: projSponsorshipType === "BARTER" ? [] : sponsorPrices,
				...(projVideoUrl.trim() && { videoUrl: projVideoUrl.trim() }),
				popupDays: popupDays.trim() || undefined,
				popupPrice: popupPrice.trim() || undefined,
				brandingDays: brandingDays.trim() || undefined,
				brandingPrice: brandingPrice.trim() || undefined,
			}
			if (projImage) {
				payload.imageKey = await uploadFileAndGetKey(projImage)
			}

			let saved: ApiSponsorshipProposal
			if (selectedProposal) {
				saved = await updateSponsorshipProposal(selectedProposal.id, payload)
				if (forceStatus !== "DRAFT" && (saved.status === "DRAFT" || saved.status === "REJECTED")) {
					saved = await submitSponsorshipProposal(selectedProposal.id)
				}
			} else {
				saved = await createSponsorshipProposal(payload)
				if (forceStatus !== "DRAFT") {
					saved = await submitSponsorshipProposal(saved.id)
				}
			}

			const stored = mapApiProposalToStored(saved)
			setProposals((prev) => {
				const exists = prev.some((p) => p.id === stored.id)
				return exists ? prev.map((p) => (p.id === stored.id ? stored : p)) : [...prev, stored]
			})
			resetProposalForm()
			setSelectedProposal(stored)
			toast.success("Proposal details saved successfully!")
		} catch (err) {
			console.error(err)
			const errMsg =
				(err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
				(err as { message?: string })?.message ||
				"Failed to save proposal details."
			toast.error(errMsg)
		} finally {
			setIsUploading(false)
		}
	}

	const [isSubmittingForApproval, setIsSubmittingForApproval] = useState(false)
	async function submitProposalForApproval(proposal: StoredProposal) {
		if (isSubmittingForApproval) return
		setIsSubmittingForApproval(true)
		try {
			const saved = await submitSponsorshipProposal(proposal.id)
			const stored = mapApiProposalToStored(saved)
			setProposals((prev) => prev.map((p) => (p.id === stored.id ? stored : p)))
			if (selectedProposal?.id === stored.id) setSelectedProposal(stored)
			toast.success("Proposal submitted for admin approval!")
		} catch (err) {
			console.error(err)
			toast.error("Failed to submit proposal.")
		} finally {
			setIsSubmittingForApproval(false)
		}
	}

	function handleDelete(proposalId?: string) {
		const idToDelete = proposalId || selectedProposal?.id
		if (!idToDelete) return
		if (!confirm("Are you sure you want to delete this proposal?")) return
		deleteSponsorshipProposal(idToDelete)
			.then(() => {
				setProposals((prev) => prev.filter((p) => p.id !== idToDelete))
				setSelectedProposal(null)
				resetProposalForm()
				toast.success("Proposal deleted successfully.")
			})
			.catch((err) => {
				console.error(err)
				toast.error("Failed to delete proposal.")
			})
	}

	const isSplitLayout = !!community

	return (
		<div className="flex flex-col min-h-screen">
			<div className="flex justify-between items-center px-8 py-4 border-b border-black/10 shrink-0">
				<p className="text-sm font-semibold text-black/50 mx-auto">
					Welcome to <span className="text-[#EE2C2C] font-bold">Meetday</span>
				</p>
			</div>

			<div
				className={clsx(
					"flex-1 min-h-0 w-full overflow-hidden relative bg-white",
					isSplitLayout ? "md:grid md:grid-cols-[65%_35%]" : "flex flex-col",
				)}
			>
				<div
					className={clsx(
						"px-4 lg:px-6 py-6 lg:py-8 flex-1 flex flex-col gap-8 overflow-y-auto h-full transition-all duration-300",
						isSplitLayout ? "max-w-3xl w-full mx-auto" : "max-w-2xl mx-auto w-full",
					)}
				>
					{loading ? (
						<div className="bg-white border-2 border-black rounded-[20px] p-12 text-center max-w-2xl">
							<p className="text-sm font-semibold text-black/50">Loading details...</p>
						</div>
					) : !community ? (
						<div className="flex flex-col gap-8 w-full max-w-2xl mx-auto">
							<div className="mb-2">
								<h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-black leading-tight mt-1">
									My Proposals
								</h1>
								<p className="text-sm font-semibold text-black/50 mt-1.5">Pitch your Community Space to brands</p>
							</div>
							<div className="bg-white border-[3px] border-black rounded-[20px] p-6 flex flex-col md:flex-row md:items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] gap-4">
								<div className="flex flex-col gap-1.5">
									<h3 className="font-heading font-black text-black text-lg">
										Uh-Oh! Looks like you haven&apos;t activated your Community Space Profile yet.
									</h3>
									<p className="text-sm font-semibold text-black/50">
										Activate your Community Space Profile before creating proposals for brands.
									</p>
								</div>
								<a
									href="/spaces/dashboard/profile"
									className="bg-[#EE2C2C] text-white text-[9px] font-black px-4 py-2.5 rounded-lg uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all select-none shrink-0 self-start md:self-auto"
								>
									ACTIVATE NOW
								</a>
							</div>
						</div>
					) : selectedProposal && !showProposalForm ? (
						<div className="flex flex-col gap-6 animate-in fade-in duration-150">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-2 border-b border-black/10 gap-4">
								<div className="flex flex-col gap-1">
									<button
										onClick={() => setSelectedProposal(null)}
										className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#EE2C2C] hover:underline mb-1 self-start"
									>
										← Back to Proposals
									</button>
									<h1 className="text-heading-sm font-semibold text-black">{selectedProposal.name}</h1>
									<p className="text-caption text-black/40">Project Overview & Details</p>
								</div>
								<div className="flex flex-wrap items-center gap-2">
									{(selectedProposal.status === "DRAFT" || selectedProposal.status === "REJECTED") && (
										<button
											type="button"
											disabled={isSubmittingForApproval}
											className="bg-[#6C32D1] text-white border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider disabled:opacity-50"
											onClick={() => submitProposalForApproval(selectedProposal)}
										>
											{isSubmittingForApproval ? "Submitting…" : "Submit for Approval"}
										</button>
									)}
									<button
										type="button"
										className="bg-white text-black border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
										onClick={() => openProposalForm(selectedProposal)}
									>
										Edit
									</button>
									<button
										type="button"
										className="bg-red-50 text-[#EE2C2C] border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
										onClick={() => handleDelete(selectedProposal.id)}
									>
										Delete
									</button>
								</div>
							</div>

							{selectedProposal.status === "REJECTED" && selectedProposal.adminRejectionRemark && (
								<div className="p-3 bg-red-50 border border-red-200 rounded-action text-xs text-red-700">
									<span className="font-semibold">Rejected by admin: </span>
									{selectedProposal.adminRejectionRemark}
								</div>
							)}
							{selectedProposal.pendingRevision != null && (
								<div className="p-3 bg-amber-50 border border-amber-200 rounded-action text-xs text-amber-800 font-medium">
									This proposal has a pending revision awaiting admin review.
								</div>
							)}

							<div className="flex flex-col gap-6">
								<div className="flex flex-row gap-4 items-start">
									{selectedProposal.image && (
										// eslint-disable-next-line @next/next/no-img-element
										<img
											src={selectedProposal.image}
											alt={selectedProposal.name}
											className="size-16 sm:size-36 object-cover rounded-xl border border-black/10 shadow-sm shrink-0"
										/>
									)}
									<div className="flex-1 bg-slate-50 border border-black/10 rounded-action p-4 w-full flex flex-col gap-3 min-w-0">
										<div>
											<p className="text-[11px] text-black/40 font-bold uppercase tracking-wider">Venue &amp; City</p>
											<div className="flex flex-col gap-1 mt-1">
												{selectedProposal.venues.map((v, idx) => (
													<div key={idx} className="flex items-center gap-2">
														{selectedProposal.venueCities[idx] && (
															<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-[#EE2C2C] text-white border border-black">
																{selectedProposal.venueCities[idx]}
															</span>
														)}
														<span className="text-xs font-semibold text-black/70">{v}</span>
													</div>
												))}
											</div>
										</div>
										<div className="grid grid-cols-2 gap-4">
											<div>
												<p className="text-[11px] text-black/40 font-bold uppercase tracking-wider">Guests</p>
												<span className="inline-flex mt-1 items-center px-3 py-1 rounded-full text-xs font-black bg-[#EE2C2C] text-white border border-black">
													{selectedProposal.guestCount} Guests
												</span>
											</div>
											<div>
												<p className="text-[11px] text-black/40 font-bold uppercase tracking-wider">Age Group</p>
												<span className="inline-flex mt-1 items-center px-3 py-1 rounded-full text-xs font-black bg-[#EE2C2C] text-white border border-black">
													{selectedProposal.ageGroup} Years
												</span>
											</div>
										</div>
									</div>
								</div>

								<div className="bg-white border border-black/10 rounded-action p-5">
									<h4 className="text-sm font-bold text-black mb-2">About the Space</h4>
									<p className="text-body-sm text-black/70 leading-relaxed whitespace-pre-wrap break-words">
										{selectedProposal.about}
									</p>
								</div>

								<div className="bg-white border border-black/10 rounded-action p-5 flex flex-col gap-3">
									<h4 className="text-sm font-bold text-black">Sponsorship Offerings</h4>
									<div className="flex flex-wrap gap-3">
										{selectedProposal.popupDays && selectedProposal.popupPrice && (
											<div className="flex flex-col gap-1 border border-black/10 rounded-xl px-4 py-2 bg-slate-50">
												<span className="text-xs font-bold text-black">Pop-up</span>
												<span className="text-xs text-black/60">
													{selectedProposal.popupDays} days · ₹{selectedProposal.popupPrice}
												</span>
											</div>
										)}
										{selectedProposal.brandingDays && selectedProposal.brandingPrice && (
											<div className="flex flex-col gap-1 border border-black/10 rounded-xl px-4 py-2 bg-slate-50">
												<span className="text-xs font-bold text-black">Branding</span>
												<span className="text-xs text-black/60">
													{selectedProposal.brandingDays} days · ₹{selectedProposal.brandingPrice}
												</span>
											</div>
										)}
									</div>
									{selectedProposal.sponsorPrices.length > 0 && (
										<div className="flex flex-wrap gap-3 mt-1">
											{selectedProposal.sponsorPrices.map((tier, idx) => (
												<div key={idx} className="flex gap-2 text-sm border border-black/10 rounded-xl px-4 py-2 bg-slate-50">
													<span className="text-black/60 font-medium">{tier.name}:</span>
													<span className="text-[#EE2C2C] font-semibold">₹{tier.price}</span>
												</div>
											))}
										</div>
									)}
								</div>
							</div>
						</div>
					) : showProposalForm ? (
						<div className="animate-in fade-in duration-150 flex flex-col gap-5 sm:gap-6">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 pb-2 border-b border-black/10 sm:border-0 sm:pb-0">
								<div className="flex flex-col gap-1">
									<div className="flex items-center gap-2 cursor-pointer text-black/60 hover:text-black" onClick={resetProposalForm}>
										<span className="text-xl font-bold">←</span>
										<h1 className="text-xl sm:text-2xl md:text-3xl font-heading font-black tracking-tight text-black leading-tight">
											{selectedProposal ? "Edit Proposal" : "Create Proposal"}
										</h1>
									</div>
									<p className="text-xs sm:text-sm font-semibold text-black/50">Provide details about your space and offerings</p>
								</div>
								<div className="flex items-center gap-2 w-full sm:w-auto justify-end">
									<button
										type="button"
										onClick={(e) => handleProposalSubmit(e, "DRAFT")}
										disabled={isUploading}
										className="flex-1 sm:flex-none px-4 py-2.5 bg-black/5 hover:bg-black/10 border border-black/10 text-xs font-bold rounded-lg text-black transition-colors disabled:opacity-50"
									>
										Save As Draft
									</button>
									<button
										type="button"
										onClick={(e) => handleProposalSubmit(e, "UNDER_REVIEW")}
										disabled={isUploading}
										className="flex-1 sm:flex-none bg-[#EE2C2C] text-white text-[10px] sm:text-[9px] font-black px-5 py-2.5 rounded-lg uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
									>
										{isUploading ? "SUBMITTING…" : "SUBMIT"}
									</button>
								</div>
							</div>

							<form onSubmit={handleProposalSubmit} className="border-[3px] border-dashed border-black/30 rounded-2xl sm:rounded-[28px] p-4 sm:p-6 bg-white flex flex-col gap-5 sm:gap-6 w-full">
								{/* AI assist */}
								{!selectedProposal && (
									<div className="w-full">
										{!copilotOpen ? (
											<div
												onClick={() => setCopilotOpen(true)}
												className="group border-[3px] border-black bg-purple-100 hover:bg-purple-200 p-4 sm:p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 select-none"
											>
												<div className="flex items-center gap-3.5 text-left">
													<div className="flex items-center justify-center size-11 sm:size-12 rounded-xl bg-[#EE2C2C] text-white shrink-0 p-2">
														<Icon as={AiAvatarSvg} size="2xl" color="inherit" className="w-full h-full" />
													</div>
													<div>
														<h3 className="font-heading text-sm sm:text-base font-extrabold text-black uppercase tracking-wider">
															Start with our <span className="text-[#EE2C2C]">AI Companion</span>
														</h3>
														<p className="text-[11px] sm:text-xs font-semibold text-black/65 mt-0.5">
															Describe your space in a few words, we fill the rest.
														</p>
													</div>
												</div>
												<div className="w-full sm:w-auto flex items-center justify-center gap-2 bg-black text-white text-xs sm:text-sm font-black px-4 py-2.5 rounded-lg uppercase tracking-wider border-2 border-black group-hover:bg-[#EE2C2C] transition-colors shrink-0">
													<Icon as={MagicStickSvg} size="sm" color="inherit" />
													Draft with AI
												</div>
											</div>
										) : copilotLoading ? (
											<div className="border-[3px] border-black bg-purple-100 p-6 sm:p-8 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center gap-4 text-center min-h-[180px]">
												<div className="relative flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16">
													<div className="absolute inset-0 rounded-full border-4 border-dashed border-[#EE2C2C]/40 animate-spin" style={{ animationDuration: "4s" }} />
													<div className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-[#EE2C2C] text-white p-2">
														<Icon as={AiAvatarSvg} size="xl" color="inherit" className="w-full h-full" />
													</div>
												</div>
												<h4 className="font-heading text-base sm:text-lg font-black text-black tracking-wide">
													{loadingMessages[loadingMessageIndex]}
												</h4>
											</div>
										) : (
											<div className="border-[3px] border-black bg-purple-100 p-4 sm:p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
												<div className="flex items-center gap-3">
													<div className="flex items-center justify-center h-9 w-9 rounded-lg bg-[#EE2C2C] text-white shrink-0 p-1.5">
														<Icon as={AiAvatarSvg} size="xl" color="inherit" className="w-full h-full" />
													</div>
													<div>
														<h3 className="font-heading text-sm font-extrabold text-black uppercase tracking-wider">Meetday AI Companion</h3>
														<p className="text-xs font-bold text-purple-700">Generate structure and fields from your description</p>
													</div>
												</div>
												<div className="flex flex-col gap-2">
													<label className="text-xs sm:text-sm font-bold text-black">
														Describe your space in a minimum of 20 words to continue
													</label>
													<textarea
														value={copilotPrompt}
														onChange={(e) => setCopilotPrompt(e.target.value)}
														placeholder="e.g. We run a 5000 sq ft rooftop event space in Bangalore that hosts pop-ups, launches, and branded activations for 150-300 guests."
														rows={5}
														disabled={copilotLoading}
														className="px-4 py-2.5 rounded-xl border-2 border-black/30 bg-white/80 text-black outline-none focus:border-black text-sm transition-colors resize-none disabled:opacity-50"
													/>
													<input type="file" accept=".pdf,.docx,.pptx" ref={copilotDocInputRef} onChange={handleCopilotDocPick} className="hidden" />
													{copilotDocFile ? (
														<div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border-2 border-black/20 bg-white/80">
															<span className="text-xs font-bold text-black truncate">
																{copilotDocUploading ? "Reading document..." : `📎 ${copilotDocFile.name}`}
															</span>
															<button type="button" onClick={handleRemoveCopilotDoc} disabled={copilotDocUploading} className="text-xs font-black text-black/50 hover:text-black shrink-0 disabled:opacity-50">
																Remove
															</button>
														</div>
													) : (
														<button
															type="button"
															onClick={() => copilotDocInputRef.current?.click()}
															disabled={copilotLoading}
															className="self-start flex items-center gap-2 bg-white text-purple-700 text-xs font-black px-3.5 py-2 rounded-lg border-2 border-purple-700 hover:bg-purple-700 hover:text-white transition-colors disabled:opacity-50"
														>
															<Icon as={UploadSvg} size="sm" color="inherit" />
															Upload document for context (PDF, Word, PPT)
														</button>
													)}
													<div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2 mt-1">
														<button type="button" onClick={() => setCopilotOpen(false)} disabled={copilotLoading} className="px-3 py-2 text-sm font-black text-black/60 hover:text-black transition-colors disabled:opacity-50">
															Cancel
														</button>
														<button
															type="button"
															onClick={handleGenerateProposalDraft}
															disabled={copilotLoading || copilotDocUploading || copilotPrompt.trim().length < 20}
															className="flex items-center justify-center gap-2 bg-black text-white text-sm font-black px-4 py-2.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#EE2C2C] disabled:opacity-50 transition-all"
														>
															<Icon as={MagicStickSvg} size="sm" color="inherit" />
															Start Cooking
														</button>
													</div>
												</div>
											</div>
										)}
									</div>
								)}

								<div className="flex flex-col gap-1.5">
									<label className="text-xs font-bold text-black">Project Name *</label>
									<input
										type="text"
										required
										value={projName}
										onChange={(e) => setProjName(e.target.value)}
										placeholder="e.g. Rooftop Pop-up Space"
										className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
									/>
								</div>

								<div className="flex flex-col gap-1.5">
									<label className="text-xs font-bold text-black">About the space *</label>
									<textarea
										required
										value={projAbout}
										onChange={(e) => setProjAbout(e.target.value)}
										placeholder="Describe your space's details, format, and what brands can do here..."
										rows={8}
										className="p-3 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors resize-none"
									/>
								</div>

								<div className="flex flex-col gap-1.5">
									<label className="text-xs font-bold text-black">Cover Image *</label>
									<div className="flex items-center gap-3">
										{projImagePreview ? (
											// eslint-disable-next-line @next/next/no-img-element
											<img src={projImagePreview} alt="Preview" className="size-16 rounded-xl object-cover border border-black/10 shrink-0" />
										) : selectedProposal?.image ? (
											// eslint-disable-next-line @next/next/no-img-element
											<img src={selectedProposal.image} alt="Current" className="size-16 rounded-xl object-cover border border-black/10 shrink-0" />
										) : (
											<div className="size-16 rounded-xl bg-slate-50 border border-dashed border-black/20 flex items-center justify-center text-black/30 text-xs shrink-0">No Image</div>
										)}
										<div className="flex flex-col gap-1">
											<input ref={projImageInputRef} type="file" accept="image/jpeg,image/jpg,image/png" className="hidden" onChange={handleProjImageChange} />
											<button type="button" onClick={() => projImageInputRef.current?.click()} className="self-start px-4 py-2 bg-white border border-black rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50 transition-colors">
												Choose Image
											</button>
											<span className="text-[10px] text-black/40">JPEG, JPG, PNG accepted (1:1, max 5MB).</span>
										</div>
									</div>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div className="flex flex-col gap-1.5">
										<label className="text-xs font-bold text-black">Start Date *</label>
										<input type="date" required value={projDate} onChange={(e) => setProjDate(e.target.value)} className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black text-sm transition-colors w-full" />
									</div>
									<div className="flex flex-col gap-1.5">
										<label className="text-xs font-bold text-black">End Date *</label>
										<input type="date" required min={projDate || undefined} value={projEndDate} onChange={(e) => setProjEndDate(e.target.value)} className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black text-sm transition-colors w-full" />
									</div>
								</div>

								<div className="flex flex-col gap-3">
									<div className="flex justify-between items-center">
										<label className="text-xs font-bold text-black">Venue *</label>
										<button type="button" onClick={() => { setProjVenues([...projVenues, ""]); setProjVenueCities([...projVenueCities, ""]) }} className="text-xs font-bold text-black hover:underline">
											+ Add Venue
										</button>
									</div>
									{projVenues.map((v, idx) => (
										<div key={idx} className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center relative">
											<div className="w-full sm:flex-1 min-w-0">
												<AddressAutocompleteInput
													value={v}
													error={false}
													onChange={(val) => { const updated = [...projVenues]; updated[idx] = val; setProjVenues(updated) }}
													onPlaceSelect={(fields) => {
														const updated = [...projVenues]
														updated[idx] = fields.venueName || fields.fullAddress
														setProjVenues(updated)
														if (fields.city && !projVenueCities[idx]?.trim()) {
															const updatedCities = [...projVenueCities]
															updatedCities[idx] = fields.city
															setProjVenueCities(updatedCities)
														}
													}}
													placeholder="e.g. Rooftop Terrace, Indiranagar"
												/>
											</div>
											<div className="w-full sm:w-40 min-w-0">
												<input type="text" value={projVenueCities[idx] || ""} onChange={(e) => { const updated = [...projVenueCities]; updated[idx] = e.target.value; setProjVenueCities(updated) }} placeholder="City *" className="w-full h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black text-sm transition-colors" />
											</div>
											{projVenues.length > 1 && (
												<button type="button" onClick={() => { setProjVenues(projVenues.filter((_, i) => i !== idx)); setProjVenueCities(projVenueCities.filter((_, i) => i !== idx)) }} className="absolute top-2 right-2 sm:relative sm:top-0 sm:right-0 text-red-500 hover:text-red-700 font-bold text-lg p-1 shrink-0">
													✕
												</button>
											)}
										</div>
									))}
								</div>

								<div className="flex flex-col gap-1.5">
									<label className="text-xs font-bold text-black">Audience Profile *</label>
									<div className="flex gap-2 min-w-0">
										<input
											type="text"
											value={newAudience}
											onChange={(e) => setNewAudience(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault()
													const trimmed = newAudience.trim()
													if (trimmed && !projAudience.includes(trimmed)) {
														setProjAudience([...projAudience, trimmed])
														setNewAudience("")
													}
												}
											}}
											placeholder="e.g. Tech Founders"
											className="min-w-0 flex-1 h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black text-sm transition-colors"
										/>
										<button
											type="button"
											onClick={() => {
												const trimmed = newAudience.trim()
												if (trimmed && !projAudience.includes(trimmed)) {
													setProjAudience([...projAudience, trimmed])
													setNewAudience("")
												}
											}}
											className="shrink-0 px-4 py-2 bg-white border border-black rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50 transition-colors"
										>
											Add
										</button>
									</div>
									{projAudience.length > 0 && (
										<div className="flex flex-wrap gap-2 mt-2">
											{projAudience.map((aud, idx) => (
												<span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-black/5 text-black border border-black/10">
													{aud}
													<button type="button" onClick={() => setProjAudience(projAudience.filter((_, i) => i !== idx))} className="text-black/40 hover:text-black font-bold text-[10px]">
														✕
													</button>
												</span>
											))}
										</div>
									)}
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div className="flex flex-col gap-1.5">
										<label className="text-xs font-bold text-black">Age Group *</label>
										<input type="text" required value={projAgeGroup} onChange={(e) => setProjAgeGroup(e.target.value)} placeholder="e.g. 21-40" className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black text-sm transition-colors" />
									</div>
									<div className="flex flex-col gap-1.5">
										<label className="text-xs font-bold text-black">Guests Count *</label>
										<input type="number" required min="1" value={projGuestCount} onChange={(e) => setProjGuestCount(e.target.value)} placeholder="e.g. 150" className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black text-sm transition-colors" />
									</div>
								</div>

								<div className="flex flex-col gap-1.5">
									<label className="text-xs font-bold text-black">Proposal Video Link</label>
									<input type="url" value={projVideoUrl} onChange={(e) => setProjVideoUrl(e.target.value)} placeholder="e.g. https://youtube.com/watch?v=..." className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black text-sm transition-colors" />
								</div>

								{/* Space sponsorship offerings — Pop-up + Branding */}
								<div className="flex flex-col gap-3">
									<label className="text-xs font-bold text-black">Sponsorship Offerings * (fill in at least one)</label>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div className="border border-black/10 rounded-xl p-3.5 bg-slate-50 flex flex-col gap-2">
											<span className="text-xs font-black text-black">Pop-up</span>
											<div className="grid grid-cols-2 gap-2">
												<input type="number" min="1" value={popupDays} onChange={(e) => setPopupDays(e.target.value)} placeholder="Days" className="h-10 px-3 rounded-lg border border-black/10 bg-white text-black outline-none focus:border-black text-sm transition-colors" />
												<div className="relative">
													<span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-black/40 select-none">₹</span>
													<input type="text" value={popupPrice} onChange={(e) => setPopupPrice(e.target.value)} placeholder="Price" className="w-full h-10 pl-7 pr-3 rounded-lg border border-black/10 bg-white text-black outline-none focus:border-black text-sm transition-colors" />
												</div>
											</div>
										</div>
										<div className="border border-black/10 rounded-xl p-3.5 bg-slate-50 flex flex-col gap-2">
											<span className="text-xs font-black text-black">Branding</span>
											<div className="grid grid-cols-2 gap-2">
												<input type="number" min="1" value={brandingDays} onChange={(e) => setBrandingDays(e.target.value)} placeholder="Days" className="h-10 px-3 rounded-lg border border-black/10 bg-white text-black outline-none focus:border-black text-sm transition-colors" />
												<div className="relative">
													<span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-black/40 select-none">₹</span>
													<input type="text" value={brandingPrice} onChange={(e) => setBrandingPrice(e.target.value)} placeholder="Price" className="w-full h-10 pl-7 pr-3 rounded-lg border border-black/10 bg-white text-black outline-none focus:border-black text-sm transition-colors" />
												</div>
											</div>
										</div>
									</div>
								</div>

								{/* Optional cash/barter pricing tiers, same as host proposals */}
								<div className="flex flex-col gap-2">
									<label className="text-xs font-bold text-black">Additional Sponsorship Type</label>
									<div className="grid grid-cols-3 gap-2">
										{(["CASH", "BARTER", "BOTH"] as const).map((o) => {
											const isSelected = projSponsorshipType === o
											return (
												<button
													key={o}
													type="button"
													onClick={() => setProjSponsorshipType(o)}
													className={clsx(
														"py-2.5 rounded-xl text-xs font-black border transition-all select-none cursor-pointer text-center",
														isSelected ? "bg-[#EE2C2C] text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "bg-slate-50 text-black/60 border-black/15 hover:border-black/30",
													)}
												>
													{o === "CASH" ? "Cash" : o === "BARTER" ? "Barter" : "Both"}
												</button>
											)
										})}
									</div>
								</div>

								{projSponsorshipType !== "BARTER" && (
									<div className="flex flex-col gap-3">
										<div className="flex justify-between items-center">
											<label className="text-xs font-bold text-black">Additional Sponsorship Slots</label>
											<button type="button" onClick={() => setSponsorPrices([...sponsorPrices, { name: "", price: "" }])} className="text-xs font-bold text-black hover:underline">
												+ Add Slot
											</button>
										</div>
										{sponsorPrices.map((sp, idx) => (
											<div key={idx} className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center relative">
												<input
													type="text"
													placeholder="Slot Name (e.g., Title Sponsor)"
													value={sp.name}
													onChange={(e) => { const updated = [...sponsorPrices]; updated[idx].name = e.target.value; setSponsorPrices(updated) }}
													className="w-full sm:flex-1 h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black text-sm transition-colors"
												/>
												<div className="flex items-center gap-2 w-full sm:flex-1">
													<div className="relative flex-1">
														<span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-black/40 select-none">₹</span>
														<input
															type="text"
															placeholder="Price (e.g., 50,000)"
															value={sp.price}
															onChange={(e) => { const updated = [...sponsorPrices]; updated[idx].price = e.target.value; setSponsorPrices(updated) }}
															className="w-full h-10 pl-8 pr-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black text-sm transition-colors"
														/>
													</div>
													{sponsorPrices.length > 1 && (
														<button type="button" onClick={() => setSponsorPrices(sponsorPrices.filter((_, i) => i !== idx))} className="size-8 shrink-0 rounded-full text-red-500 hover:text-red-700 font-bold text-base flex items-center justify-center p-1" aria-label="Remove slot">
															✕
														</button>
													)}
												</div>
											</div>
										))}
									</div>
								)}
							</form>
						</div>
					) : (
						<>
							<div className="flex justify-between items-center mb-2">
								<div>
									<h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-black leading-tight mt-1">My Proposals</h1>
									<p className="text-sm font-semibold text-black/50 mt-1.5">Pitch your Community Space to brands</p>
								</div>
								{proposals.length > 0 && (
									<button
										onClick={() => openProposalForm()}
										title={!isCommunityApproved ? "Your Community Space profile must be admin-approved first" : undefined}
										className={clsx(
											"text-white text-[9px] font-black px-4 py-2.5 rounded-lg uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all select-none cursor-pointer",
											isCommunityApproved ? "bg-[#EE2C2C]" : "bg-black/30",
										)}
									>
										{isCommunityApproved ? "+ CREATE NEW" : "PENDING APPROVAL"}
									</button>
								)}
							</div>

							{proposals.length > 0 ? (
								<div className="flex flex-col gap-6 w-full animate-in fade-in duration-150">
									<div className="flex flex-row overflow-x-auto whitespace-nowrap scrollbar-none gap-3 sm:gap-5 border-b border-black/10 pb-2 mb-4 w-full">
										{[
											{ value: "ALL", label: `ALL (${allCount})` },
											{ value: "DRAFT", label: `DRAFT (${draftCount})` },
											{ value: "UNDER_REVIEW", label: `UNDER REVIEW (${underReviewCount})` },
											{ value: "PUBLISHED", label: `PUBLISHED (${publishedCount})` },
											{ value: "REJECTED", label: `REJECTED (${rejectedCount})` },
										].map((tab) => {
											const isActive = activeTab === tab.value
											return (
												<button
													key={tab.value}
													onClick={() => setActiveTab(tab.value as typeof activeTab)}
													className={clsx(
														"text-[8px] sm:text-[10px] font-black uppercase tracking-wider pb-2 relative transition-colors shrink-0",
														isActive ? "text-[#EE2C2C]" : "text-black/40 hover:text-black",
													)}
												>
													{tab.label}
													{isActive && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#EE2C2C]" />}
												</button>
											)
										})}
									</div>
									{filteredProposals.length === 0 ? (
										<div className="flex flex-col items-center justify-center py-20 text-center gap-3 border-[3px] border-dashed border-black/30 rounded-[20px]">
											<p className="text-label-md font-semibold text-black/50">No proposals found</p>
										</div>
									) : (
										<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
											{filteredProposals.map((p) => {
												const isViewingRevision = p.pendingRevision != null
												const startDisplay = p.date ? p.date.split("-").reverse().join("/") : ""
												const endDisplay = p.endDate ? p.endDate.split("-").reverse().join("/") : ""
												const displayDate = endDisplay && endDisplay !== startDisplay ? `${startDisplay} - ${endDisplay}` : startDisplay
												return (
													<div
														key={p.id}
														onClick={() => setSelectedProposal(p)}
														className="group relative cursor-pointer bg-white border-[3px] border-black rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all overflow-hidden flex flex-row w-full"
													>
														<div className="relative w-[120px] aspect-square shrink-0 overflow-hidden bg-slate-50 border-r-[3px] border-black rounded-l-[17px]">
															{p.image ? (
																// eslint-disable-next-line @next/next/no-img-element
																<img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 rounded-l-[14px]" />
															) : (
																<div className="w-full h-full bg-slate-100 flex items-center justify-center text-black/40 font-black text-sm">
																	{p.name.substring(0, 2).toUpperCase()}
																</div>
															)}
															<span
																className={clsx(
																	"absolute top-2 left-2 text-[7px] font-black px-1.5 py-0.5 border-[2px] border-black rounded-full uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]",
																	p.status === "DRAFT" && "bg-slate-100 text-black",
																	isViewingRevision && "bg-[#F5C343] text-black",
																	!isViewingRevision && p.status === "UNDER_REVIEW" && "bg-[#F5C343] text-black",
																	p.status === "REJECTED" && "bg-[#EE2C2C] text-white",
																	!isViewingRevision && (p.status === "PUBLISHED" || !p.status) && "bg-green-400 text-black",
																)}
															>
																{p.status === "DRAFT" ? "Draft" : isViewingRevision ? "Revision Under Review" : p.status === "UNDER_REVIEW" ? "Under Review" : p.status === "REJECTED" ? "Rejected" : "Published"}
															</span>
														</div>
														<div className="flex-1 p-3 flex flex-col justify-between min-w-0">
															<div className="flex flex-col gap-1">
																<h3 className="font-heading font-black text-base text-black truncate group-hover:text-[#EE2C2C] transition-colors">{p.name}</h3>
																<p className="text-[11px] font-bold text-black/50 truncate">
																	{p.venues.map((v, idx) => (p.venueCities[idx] ? `${v} (${p.venueCities[idx]})` : v)).join(", ")}
																</p>
																<p className="text-[11px] font-semibold text-black/70 line-clamp-2 mt-0.5 leading-normal">{p.about}</p>
															</div>
															<div className="flex flex-wrap gap-1.5 mt-2">
																<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-[#6C32D1] text-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">{displayDate}</span>
																<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-[#EE2C2C] text-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">{p.guestCount} Guests</span>
																{p.popupDays && p.popupPrice && (
																	<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-black text-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">Pop-up</span>
																)}
																{p.brandingDays && p.brandingPrice && (
																	<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-black text-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">Branding</span>
																)}
															</div>
														</div>
													</div>
												)
											})}
										</div>
									)}
								</div>
							) : (
								<div className="border-[3px] border-dashed border-black/30 rounded-[20px] p-12 text-center w-full flex flex-col items-center justify-center gap-2">
									<h2 className="font-heading font-black text-black text-lg">No active proposals</h2>
									<p className="text-xs font-semibold text-black/50 mb-3">Create a proposal detailing your space&apos;s offerings.</p>
									<button
										onClick={() => openProposalForm()}
										title={!isCommunityApproved ? "Your Community Space profile must be admin-approved first" : undefined}
										className={clsx(
											"text-white text-[9px] font-black px-5 py-2.5 rounded-lg uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all select-none cursor-pointer",
											isCommunityApproved ? "bg-[#EE2C2C]" : "bg-black/30",
										)}
									>
										{isCommunityApproved ? "GET STARTED" : "PENDING ADMIN APPROVAL"}
									</button>
								</div>
							)}
						</>
					)}
				</div>

				{isSplitLayout && (
					<div className="hidden md:flex flex-col h-full w-full bg-white animate-in fade-in duration-150 shrink-0 overflow-hidden">
						{communityForPanel && (
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							<CommunityProfileDetailsPanel community={communityForPanel as any} operatingCities={profile?.operatingCities} socialLinks={profile?.socialLinks ?? undefined} />
						)}
					</div>
				)}
			</div>
		</div>
	)
}
