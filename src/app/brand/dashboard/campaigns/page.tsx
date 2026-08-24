"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { toast } from "sonner"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Tabs } from "@/components/ui/Tabs"
import clsx from "clsx"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import { Icon } from "@/components/ui/Icon"
import { useBrandStore } from "@/store/brandStore"
import {
	createCampaign,
	getMyCampaigns,
	updateCampaign,
	deleteCampaign,
	generateCampaignDraft,
	extractCampaignCopilotDocument,
	type Campaign,
	type CampaignPayload,
	type CampaignStatus
} from "@/lib/api"

import DocumentTextSvg from "@/icons/outlined/document-text.svg"
import TrashBinSvg from "@/icons/outlined/trash-bin.svg"
import AiAvatarSvg from "@/assets/ai-avatar.svg"
import MagicStickSvg from "@/icons/duotone/magic-stick-3.svg"

const AUDIENCE_OPTIONS = [
	"Tech Developers",
	"Creative Designers",
	"Founders & Executives",
	"Remote Workers",
	"Investors",
	"Corporate Professionals",
	"Students",
	"Fitness Enthusiasts",
	"Artists & Musicians",
	"Food & Coffee",
	"Avid Readers",
	"Eco Advocates",
	"Gamers",
	"Kids & Families"
]

const GOAL_OPTIONS = [
	"Product Sampling",
	"Pop-up / Booth",
	"Host an Event",
	"Community Growth"
]

export default function CampaignsPage() {
	const { profile } = useBrandStore()
	const brandId = profile?.id || ""
	const searchParams = useSearchParams()
	const urlCampaignId = searchParams ? searchParams.get("campaignId") : null

	const todayStr = useMemo(() => {
		const today = new Date()
		const yyyy = today.getFullYear()
		const mm = String(today.getMonth() + 1).padStart(2, "0")
		const dd = String(today.getDate()).padStart(2, "0")
		return `${yyyy}-${mm}-${dd}`
	}, [])

	const [campaigns, setCampaigns] = useState<Campaign[]>([])
	const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
	
	// Create/Edit Form State
	const [showForm, setShowForm] = useState(false)
	const [isEditing, setIsEditing] = useState(false)
	const [name, setName] = useState("")
	const [goals, setGoals] = useState<string[]>([])
	const [locations, setLocations] = useState<string[]>([])
	const [newLocation, setNewLocation] = useState("")
	const [audience, setAudience] = useState<string[]>([])
	const [customAudience, setCustomAudience] = useState("")
	const [showCustomAudienceInput, setShowCustomAudienceInput] = useState(false)
	const [startDate, setStartDate] = useState("")
	const [endDate, setEndDate] = useState("")
	const [offerType, setOfferType] = useState("CASH")
	const [budgetAmount, setBudgetAmount] = useState("")
	const [budgetCurrency, setBudgetCurrency] = useState("INR")
	const [barterElements, setBarterElements] = useState("")
	const [description, setDescription] = useState("")

	const [campaignCopilotOpen, setCampaignCopilotOpen] = useState(false)
	const [campaignCopilotPrompt, setCampaignCopilotPrompt] = useState("")
	const [campaignCopilotLoading, setCampaignCopilotLoading] = useState(false)
	const [copilotDocFile, setCopilotDocFile] = useState<File | null>(null)
	const [copilotDocText, setCopilotDocText] = useState<string | null>(null)
	const [copilotDocUploading, setCopilotDocUploading] = useState(false)
	const copilotDocInputRef = useRef<HTMLInputElement>(null)
	const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)

	const loadingMessages = useMemo(() => [
		"Meetday is cooking... 🍳",
		"Spicing up the campaign details... 🌶️",
		"Whipping up the target audience profile... 📊",
		"Simmering the budget and offer details... 💰",
		"Adding the secret sauce to the brief... 🍯",
		"Plating the perfect campaign... 🍽️",
		"Garnishing with final touches... ✨"
	], [])

	useEffect(() => {
		let interval: NodeJS.Timeout
		if (campaignCopilotLoading) {
			setLoadingMessageIndex(0)
			interval = setInterval(() => {
				setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length)
			}, 2000)
		}
		return () => clearInterval(interval)
	}, [campaignCopilotLoading, loadingMessages])

	const [activeTab, setActiveTab] = useState<"ALL" | "DRAFT" | "UNDER_REVIEW" | "REJECTED" | "PUBLISHED">("ALL")
	const [loading, setLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)

	const isSplitLayout = !!selectedCampaign && !showForm

	const filteredCampaigns = useMemo(() => {
		return campaigns.filter(c => {
			if (activeTab === "ALL") return true
			return c.status === activeTab
		})
	}, [campaigns, activeTab])

	useEffect(() => {
		if (!brandId) return
		setLoading(true)
		getMyCampaigns()
			.then((data) => {
				setCampaigns(data)
				if (urlCampaignId) {
					const found = data.find(item => item.id === urlCampaignId)
					if (found) {
						setSelectedCampaign(found)
					}
				}
			})
			.catch((err) => {
				console.error("Failed to load campaigns", err)
			})
			.finally(() => {
				setLoading(false)
			})
	}, [brandId, urlCampaignId])

	const isBrandApproved = profile?.approvalStatus === "APPROVED"

	const openForm = (c?: Campaign) => {
		if (!c && !isBrandApproved) {
			toast.error(
				profile?.approvalStatus === "REJECTED"
					? "Your brand profile was rejected by admin. Update it and wait for re-approval before creating a campaign."
					: "Your brand profile is still pending admin approval. You'll be able to create a campaign once it's approved.",
			)
			return
		}
		if (c) {
			setName(c.name)
			setGoals(c.goal ? c.goal.split(",").map(g => g.trim()) : [])
			setLocations(c.locations)
			setAudience(c.audience.filter(a => AUDIENCE_OPTIONS.includes(a)))
			const custom = c.audience.find(a => !AUDIENCE_OPTIONS.includes(a))
			if (custom) {
				setCustomAudience(custom)
				setShowCustomAudienceInput(true)
			} else {
				setCustomAudience("")
				setShowCustomAudienceInput(false)
			}
			setStartDate(c.startDate ? c.startDate.substring(0, 10) : "")
			setEndDate(c.endDate ? c.endDate.substring(0, 10) : "")
			setOfferType(c.offerType)
			setBudgetAmount(c.budgetAmount.toString())
			setBudgetCurrency(c.budgetCurrency)
			setBarterElements(c.barterElements || "")
			setDescription(c.description || "")
			setSelectedCampaign(c)
			setIsEditing(true)
		} else {
			setName("")
			setGoals([])
			setLocations([])
			setNewLocation("")
			setAudience([])
			setCustomAudience("")
			setShowCustomAudienceInput(false)
			setStartDate("")
			setEndDate("")
			setOfferType("CASH")
			setBudgetAmount("")
			setBudgetCurrency("INR")
			setBarterElements("")
			setDescription("")
			setSelectedCampaign(null)
			setIsEditing(false)
		}
		setShowForm(true)
	}

	const resetForm = () => {
		setShowForm(false)
		setIsEditing(false)
		setCampaignCopilotOpen(false)
		setCampaignCopilotPrompt("")
		setCopilotDocFile(null)
		setCopilotDocText(null)
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
			const text = await extractCampaignCopilotDocument(file)
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

	async function handleGenerateCampaignDraft() {
		const trimmed = campaignCopilotPrompt.trim()
		if (!trimmed || campaignCopilotLoading) return
		setCampaignCopilotLoading(true)
		try {
			const combinedPrompt = copilotDocText
				? `${trimmed}\n\nAdditional context from an uploaded document:\n${copilotDocText}`
				: trimmed
			const draft = await generateCampaignDraft(combinedPrompt)
			setName(draft.name)
			setGoal(GOAL_OPTIONS.includes(draft.goal) ? draft.goal : GOAL_OPTIONS[0])
			setLocations(draft.locations)
			const knownAudience = draft.audience.filter(a => AUDIENCE_OPTIONS.includes(a))
			const customAud = draft.audience.find(a => !AUDIENCE_OPTIONS.includes(a))
			setAudience(knownAudience)
			if (customAud) {
				setCustomAudience(customAud)
				setShowCustomAudienceInput(true)
			} else {
				setCustomAudience("")
				setShowCustomAudienceInput(false)
			}
			setOfferType(draft.offer_type)
			setBudgetAmount(String(draft.budget_amount))
			setBudgetCurrency(draft.budget_currency)
			setBarterElements(draft.barter_elements || "")
			setDescription(draft.description || "")
			setCampaignCopilotOpen(false)
			handleRemoveCopilotDoc()
			toast.success("Meetday filled in the campaign brief — review and adjust as needed.")
		} catch (err: any) {
			const status = err?.response?.status
			if (status === 403) toast.error("Brand role required to use Meetday AI.")
			else toast.error("Couldn't generate a draft right now. Please try again.")
		} finally {
			setCampaignCopilotLoading(false)
		}
	}

	const handleAddLocation = () => {
		const trimmed = newLocation.trim()
		if (trimmed && !locations.includes(trimmed)) {
			setLocations([...locations, trimmed])
			setNewLocation("")
		}
	}

	const handleAudienceToggle = (opt: string) => {
		if (audience.includes(opt)) {
			setAudience(audience.filter(a => a !== opt))
		} else {
			setAudience([...audience, opt])
		}
	}

	const handleFormSubmit = async (e: React.FormEvent, forceStatus?: CampaignStatus) => {
		e.preventDefault()

		if (!name.trim()) {
			toast.error("Campaign Name is required.")
			return
		}
		if (!description.trim()) {
			toast.error("Description is required.")
			return
		}
		if (goals.length === 0) {
			toast.error("Please select at least one goal.")
			return
		}
		if (locations.length === 0) {
			toast.error("Please add at least one location.")
			return
		}
		
		const finalAudience = [...audience]
		if (showCustomAudienceInput && customAudience.trim()) {
			finalAudience.push(customAudience.trim())
		}

		if (finalAudience.length === 0) {
			toast.error("Please select at least one audience target.")
			return
		}
		if (!startDate || !endDate) {
			toast.error("Please pick run dates.")
			return
		}
		if (endDate < startDate) {
			toast.error("End date cannot be before the start date.")
			return
		}
		if (offerType !== "BARTER" && (!budgetAmount || isNaN(Number(budgetAmount)) || Number(budgetAmount) <= 0)) {
			toast.error("Please enter a valid budget amount.")
			return
		}
		if ((offerType === "BARTER" || offerType === "BOTH") && !barterElements.trim()) {
			toast.error("Please describe the elements for barter.")
			return
		}

		// Count words for optional Tell us more (max 250 words)
		const wordCount = description.trim().split(/\s+/).filter(Boolean).length
		if (wordCount > 250) {
			toast.error("Tell us more description cannot exceed 250 words.")
			return
		}

		setIsSaving(true)

		const payload: CampaignPayload = {
			name,
			goal: goals.join(", "),
			locations,
			audience: finalAudience,
			startDate,
			endDate,
			offerType,
			budgetAmount: offerType === "BARTER" ? 0 : Number(budgetAmount),
			budgetCurrency: offerType === "BARTER" ? "INR" : budgetCurrency,
			barterElements: (offerType === "BARTER" || offerType === "BOTH") ? barterElements : undefined,
			description: description.trim() || undefined,
			status: forceStatus || (isEditing ? selectedCampaign?.status : "DRAFT"),
		}

		try {
			let saved: Campaign
			if (isEditing && selectedCampaign) {
				saved = await updateCampaign(selectedCampaign.id, payload)
				toast.success("Campaign brief updated successfully!")
			} else {
				saved = await createCampaign(payload)
				toast.success("Campaign brief created successfully!")
			}

			setCampaigns(prev => {
				const exists = prev.some(c => c.id === saved.id)
				return exists ? prev.map(c => c.id === saved.id ? saved : c) : [saved, ...prev]
			})
			setSelectedCampaign(saved)
			resetForm()
		} catch (err: any) {
			console.error(err)
			toast.error("Failed to save campaign brief.")
		} finally {
			setIsSaving(false)
		}
	}

	const handleDeleteCampaign = (id: string) => {
		if (confirm("Are you sure you want to delete this campaign brief?")) {
			deleteCampaign(id)
				.then(() => {
					setCampaigns(prev => prev.filter(c => c.id !== id))
					setSelectedCampaign(null)
					toast.success("Campaign brief deleted successfully.")
				})
				.catch((err) => {
					console.error(err)
					toast.error("Failed to delete campaign.")
				})
		}
	}

	return (
		<div className="flex flex-col min-h-screen bg-white text-black">
			{/* Top Bar */}
			<div className="flex justify-between items-center px-8 py-4 border-b border-black/10 shrink-0">
				<p className="text-sm font-semibold text-black/50 mx-auto">
					Welcome to <span className="text-[#EE2C2C] font-bold">Meetday</span>
				</p>
			</div>

			<div className={clsx(
				"flex-1 min-h-0 w-full overflow-hidden relative bg-white",
				isSplitLayout ? "md:grid md:grid-cols-[60%_40%]" : "flex flex-col"
			)}>
				{/* Left / Main Panel */}
				<div className={clsx(
					"px-4 lg:px-6 py-6 lg:py-8 flex-1 flex flex-col gap-6 overflow-y-auto h-full transition-all duration-300 w-full mx-auto",
					isSplitLayout ? "max-w-none" : "max-w-6xl"
				)}>
					{loading ? (
						<div className="flex flex-col gap-4 w-full">
							<h1 className="text-3xl font-heading font-black">Campaigns</h1>
							<div className="bg-white border-2 border-black rounded-[20px] p-12 text-center">
								<p className="text-sm font-semibold text-black/50">Loading details...</p>
							</div>
						</div>
					) : showForm ? (
						/* CREATE/EDIT FORM */
						<div className="animate-in fade-in duration-150 flex flex-col gap-6">
							<div className="flex justify-between items-center shrink-0">
								<div className="flex flex-col gap-1">
									<div className="flex items-center gap-2 cursor-pointer text-black/60 hover:text-black" onClick={resetForm}>
										<span className="text-xl font-bold">←</span>
										<h1 className="text-3xl font-heading font-black leading-tight">
											{isEditing ? "Edit Campaign brief" : "Create a Campaign"}
										</h1>
									</div>
									<p className="text-sm font-semibold text-black/50 mt-1">
										Provide campaign details to match with host communities
									</p>
								</div>
								<div className="flex items-center gap-3">
									<button
										type="button"
										onClick={(e) => handleFormSubmit(e, "DRAFT")}
										className="px-4 py-2 bg-black/5 hover:bg-black/10 border border-black/10 text-xs font-bold rounded-lg text-black transition-colors"
									>
										Save As Draft
									</button>
									<button
										type="button"
										onClick={(e) => handleFormSubmit(e, "UNDER_REVIEW")}
										className="bg-[#EE2C2C] text-white text-[9px] font-black px-4 py-2.5 rounded-lg uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[#1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all select-none"
									>
										SUBMIT FOR REVIEW
									</button>
								</div>
							</div>

							<form onSubmit={(e) => handleFormSubmit(e, "UNDER_REVIEW")} className="border-[3px] border-dashed border-black/30 rounded-[28px] p-6 bg-white flex flex-col gap-6 w-full">

								{/* AI assist */}
								{!isEditing && (
									<div className="w-full">
										{!campaignCopilotOpen ? (
											<div
												onClick={() => setCampaignCopilotOpen(true)}
												className="group border-[3px] border-black bg-purple-100 hover:bg-purple-200 p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer flex flex-col md:flex-row items-center justify-between gap-4 select-none"
											>
												<div className="flex items-center gap-4 text-left">
													<div className="flex items-center justify-center h-12 w-12 rounded-xl bg-[#EE2C2C] text-white shrink-0 transition-transform duration-300 p-2" style={{ animation: 'aiIconPulse 2s ease-in-out infinite' }}>
														<Icon as={AiAvatarSvg} size="2xl" color="inherit" className="w-full h-full" />
													</div>
													<div>
														<h3 className="font-heading text-sm sm:text-base font-extrabold text-black uppercase tracking-wider">
															Start with our <span className="text-[#EE2C2C]">AI Companion</span>
														</h3>
														<p className="text-[11px] sm:text-xs font-semibold text-black/65 mt-0.5">
															Describe your campaign in a few words, we fill the rest.
														</p>
													</div>
												</div>
												<div className="flex items-center gap-2 bg-black text-white text-sm font-black px-4 py-2.5 rounded-lg uppercase tracking-wider border-2 border-black group-hover:bg-[#EE2C2C] transition-colors duration-200 shrink-0">
													<Icon as={MagicStickSvg} size="sm" color="inherit" />
													Draft with AI
												</div>
											</div>
										) : campaignCopilotLoading ? (
											<div className="border-[3px] border-black bg-purple-100 p-8 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center gap-5 text-center min-h-[180px]">
												<div className="relative flex items-center justify-center h-16 w-16">
													<div className="absolute inset-0 rounded-full border-4 border-dashed border-[#EE2C2C]/40 animate-spin" style={{ animationDuration: '4s' }} />
													<div className="flex items-center justify-center h-10 w-10 rounded-full bg-[#EE2C2C] text-white p-2">
														<Icon as={AiAvatarSvg} size="xl" color="inherit" className="w-full h-full" />
													</div>
												</div>
												<div className="flex flex-col gap-1.5">
													<h4 className="font-heading text-lg font-black text-black tracking-wide">
														{loadingMessages[loadingMessageIndex]}
													</h4>
													<p className="text-sm text-purple-700 font-bold tracking-tight">
														Whipping up goals, audiences, and budget suggestions...
													</p>
												</div>
											</div>
										) : (
											<div className="border-[3px] border-black bg-purple-100 p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
												<div className="flex items-center gap-3">
													<div className="flex items-center justify-center h-9 w-9 rounded-lg bg-[#EE2C2C] text-white shrink-0 p-1.5">
														<Icon as={AiAvatarSvg} size="xl" color="inherit" className="w-full h-full" />
													</div>
													<div>
														<h3 className="font-heading text-sm font-extrabold text-black uppercase tracking-wider">
															Meetday AI Companion
														</h3>
														<p className="text-xs font-bold text-purple-700">
															Generate structure and fields from your description
														</p>
													</div>
												</div>
												<div className="flex flex-col gap-2">
													<label className="text-sm font-bold text-black">
														Describe your campaign
													</label>
													<textarea
														value={campaignCopilotPrompt}
														onChange={(e) => setCampaignCopilotPrompt(e.target.value)}
														placeholder="e.g. We want to sample our new energy drink at rooftop networking meetups for young professionals in Bangalore and Mumbai over the next quarter."
														rows={3}
														disabled={campaignCopilotLoading}
														className="px-4 py-2.5 rounded-xl border-2 border-black/30 bg-white/80 text-black outline-none focus:border-black text-sm transition-colors resize-none disabled:opacity-50"
													/>
													<input
														type="file"
														accept=".pdf,.docx,.pptx"
														ref={copilotDocInputRef}
														onChange={handleCopilotDocPick}
														className="hidden"
													/>
													{copilotDocFile ? (
														<div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border-2 border-black/20 bg-white/80">
															<span className="text-xs font-bold text-black truncate">
																{copilotDocUploading ? "Reading document..." : `\ud83d\udcce ${copilotDocFile.name}`}
															</span>
															<button
																type="button"
																onClick={handleRemoveCopilotDoc}
																disabled={copilotDocUploading}
																className="text-xs font-black text-black/50 hover:text-black shrink-0 disabled:opacity-50"
															>
																Remove
															</button>
														</div>
													) : (
														<button
															type="button"
															onClick={() => copilotDocInputRef.current?.click()}
															disabled={campaignCopilotLoading}
															className="self-start text-xs font-black text-purple-700 hover:text-[#EE2C2C] transition-colors disabled:opacity-50"
														>
															+ Upload a document (optional) — PDF, Word, or PowerPoint
														</button>
													)}
													<div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between mt-1">
														<p className="text-xs font-bold text-black/60">
															{campaignCopilotPrompt.trim().length < 20
																? "Write a bit more — at least 20 characters to continue."
																: <span className="text-purple-700">Ready — click below when you&apos;re done writing.</span>}
														</p>
														<div className="flex items-center gap-2 self-end shrink-0">
															<button
																type="button"
																onClick={() => setCampaignCopilotOpen(false)}
																disabled={campaignCopilotLoading}
																className="px-3 py-2 text-sm font-black text-black/60 hover:text-black transition-colors disabled:opacity-50"
															>
																Cancel
															</button>
															<button
																type="button"
																onClick={handleGenerateCampaignDraft}
																disabled={campaignCopilotLoading || copilotDocUploading || campaignCopilotPrompt.trim().length < 20}
																className="flex items-center gap-2 bg-black text-white text-sm font-black px-4 py-2.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#EE2C2C] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-50 transition-all select-none"
															>
																<Icon as={MagicStickSvg} size="sm" color="inherit" />
																Start Cooking
															</button>
														</div>
													</div>
												</div>
											</div>
										)}
									</div>
								)}

								{/* Campaign Name */}
								<div className="flex flex-col gap-1.5">
									<label className="text-xs font-bold text-black">Campaign Name *</label>
									<input
										type="text"
										required
										value={name}
										onChange={(e) => setName(e.target.value)}
										placeholder='e.g., "Figma Q3 Sampling Campaign"'
										className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
									/>
								</div>

								{/* Description */}
								<div className="flex flex-col gap-1.5">
									<div className="flex justify-between items-center">
										<label className="text-xs font-bold text-black">Description *</label>
										<span className="text-[10px] text-black/45">Max 250 words</span>
									</div>
									<textarea
										required
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										placeholder='Provide context for our AI matching engine (e.g., "Looking for spaces with high afternoon foot traffic and an eco-friendly vibe.")'
										rows={4}
										className="p-3 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors resize-none"
									/>
								</div>

								{/* What is the goal? */}
								<div className="flex flex-col gap-2">
									<label className="text-xs font-bold text-black">What is the goal? *</label>
									<div className="flex flex-wrap gap-2">
										{GOAL_OPTIONS.map((g) => {
											const isSelected = goals.includes(g)
											return (
												<button
													key={g}
													type="button"
													onClick={() => {
														if (goals.includes(g)) {
															setGoals(goals.filter(item => item !== g))
														} else {
															setGoals([...goals, g])
														}
													}}
													className={clsx(
														"px-4 py-2 rounded-xl text-xs font-bold border transition-all select-none",
														isSelected
															? "bg-[#FFC940] text-black border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
															: "bg-slate-50 text-black/60 border-black/15 hover:border-black/30"
													)}
												>
													{g}
												</button>
											)
										})}
									</div>
								</div>

								{/* Where? (City / Region) */}
								<div className="flex flex-col gap-1.5">
									<label className="text-xs font-bold text-black">Where? (City / Region) *</label>
									<div className="flex gap-2">
										<input
											type="text"
											value={newLocation}
											onChange={(e) => setNewLocation(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault()
													handleAddLocation()
												}
											}}
											placeholder='e.g., "Delhi", "Mumbai" (press Add or Enter)'
											className="flex-1 h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
										/>
										<button
											type="button"
											onClick={handleAddLocation}
											className="px-4 py-2 bg-white border border-black rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50 transition-colors"
										>
											Add
										</button>
									</div>
									{locations.length > 0 ? (
										<div className="flex flex-wrap gap-2 mt-2">
											{locations.map((loc, idx) => (
												<span
													key={idx}
													className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-black/5 text-black border border-black/10"
												>
													{loc}
													<button
														type="button"
														onClick={() => setLocations(locations.filter((_, i) => i !== idx))}
														className="text-black/40 hover:text-black font-bold text-[10px]"
													>
														✕
													</button>
												</span>
											))}
										</div>
									) : (
										<p className="text-[10px] text-black/40">Add at least one targeted region.</p>
									)}
								</div>

								{/* Who is the audience? */}
								<div className="flex flex-col gap-2">
									<label className="text-xs font-bold text-black">Who is the audience? *</label>
									<div className="flex flex-wrap gap-2">
										{AUDIENCE_OPTIONS.map((aud) => {
											const isSelected = audience.includes(aud)
											return (
												<button
													key={aud}
													type="button"
													onClick={() => handleAudienceToggle(aud)}
													className={clsx(
														"px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all select-none",
														isSelected
															? "bg-[#6C32D1] text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
															: "bg-slate-50 text-black/60 border-black/15 hover:border-black/30"
													)}
												>
													{aud}
												</button>
											)
										})}
										<button
											type="button"
											onClick={() => setShowCustomAudienceInput(!showCustomAudienceInput)}
											className={clsx(
												"px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all select-none",
												showCustomAudienceInput || customAudience
													? "bg-[#6C32D1] text-white border-black"
													: "bg-slate-50 text-black/60 border-black/15 hover:border-black/30"
											)}
										>
											Custom..
										</button>
									</div>
									
									{showCustomAudienceInput && (
										<input
											type="text"
											value={customAudience}
											onChange={(e) => setCustomAudience(e.target.value)}
											placeholder="Type custom audience description..."
											className="mt-2 h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors w-full"
										/>
									)}
								</div>

								{/* Run Dates */}
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div className="flex flex-col gap-1.5">
										<label className="text-xs font-bold text-black">Start Date *</label>
										<input
											type="date"
											required
											min={todayStr}
											value={startDate}
											onChange={(e) => setStartDate(e.target.value)}
											className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
										/>
									</div>
									<div className="flex flex-col gap-1.5">
										<label className="text-xs font-bold text-black">End Date *</label>
										<input
											type="date"
											required
											min={startDate || undefined}
											value={endDate}
											onChange={(e) => setEndDate(e.target.value)}
											className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
										/>
									</div>
								</div>

								{/* Offer */}
								<div className="flex flex-col gap-2">
									<label className="text-xs font-bold text-black">Offer *</label>
									<div className="flex gap-3">
										{["CASH", "BARTER", "BOTH"].map((o) => {
											const isSelected = offerType === o
											return (
												<button
													key={o}
													type="button"
													onClick={() => setOfferType(o)}
													className={clsx(
														"flex-1 py-2.5 rounded-xl text-xs font-black border transition-all select-none",
														isSelected
															? "bg-[#EE2C2C] text-white border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
															: "bg-slate-50 text-black/60 border-black/15 hover:border-black/30"
													)}
												>
													{o}
												</button>
											)
										})}
									</div>
								</div>

								{/* Total Budget */}
								{offerType !== "BARTER" && (
									<div className="flex flex-col gap-1.5">
										<label className="text-xs font-bold text-black">Total Budget *</label>
										<div className="flex gap-2">
											<div className="relative flex-1">
												<input
													type="number"
													required
													min="1"
													value={budgetAmount}
													onChange={(e) => setBudgetAmount(e.target.value)}
													placeholder="e.g. 50,000"
													className="w-full h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
												/>
											</div>
											<select
												value={budgetCurrency}
												onChange={(e) => setBudgetCurrency(e.target.value)}
												className="h-10 px-3 rounded-xl border border-black/10 bg-slate-50 text-black font-bold outline-none focus:border-black hover:border-black/30 text-sm"
											>
												<option value="INR">INR (₹)</option>
												<option value="USD">USD ($)</option>
												<option value="EUR">EUR (€)</option>
											</select>
										</div>
									</div>
								)}

								{/* Elements for Barter (Conditional) */}
								{(offerType === "BARTER" || offerType === "BOTH") && (
									<div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
										<label className="text-xs font-bold text-black">Elements for Barter *</label>
										<input
											type="text"
											required
											value={barterElements}
											onChange={(e) => setBarterElements(e.target.value)}
											placeholder="Describe goods, services or products offered in exchange..."
											className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
										/>
									</div>
								)}


							</form>
						</div>
					) : (
						/* LISTINGS VIEW */
						<div className="flex flex-col gap-6">
							{/* Header */}
							<div className="flex justify-between items-center mb-2">
								<div>
									<h1 className="text-3xl font-heading font-black tracking-tight text-black leading-tight mt-1">
										My Campaigns
									</h1>
									<p className="text-sm font-semibold text-black/50 mt-1.5">
										Manage your brand sponsorship briefs and targets
									</p>
								</div>
								{campaigns.length > 0 && (
									<button
										onClick={() => openForm()}
										className="bg-[#EE2C2C] text-white text-[9px] font-black px-4 py-2.5 rounded-lg uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[#1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all select-none cursor-pointer"
									>
										+ CREATE BRIEF
									</button>
								)}
							</div>

							{campaigns.length > 0 && (
								<div className="border-b border-black/10 w-full flex gap-4">
									{(["ALL", "DRAFT", "UNDER_REVIEW", "REJECTED", "PUBLISHED"] as const).map((t) => {
										const active = activeTab === t
										return (
											<button
												key={t}
												onClick={() => setActiveTab(t)}
												className={clsx(
													"pb-2.5 text-xs font-black tracking-wide uppercase border-b-2 transition-colors select-none",
													active ? "border-[#EE2C2C] text-black" : "border-transparent text-black/40 hover:text-black/60"
												)}
											>
												{t === "UNDER_REVIEW" ? "PENDING" : t} ({t === "ALL" ? campaigns.length : campaigns.filter(c => c.status === t).length})
											</button>
										)
									})}
								</div>
							)}

							<div className="flex flex-col gap-4 w-full">
								{filteredCampaigns.length === 0 ? (
									<div className="border-[3px] border-dashed border-black/30 rounded-[20px] p-12 flex flex-col items-center justify-center text-center gap-4 bg-transparent mt-2">
										<p className="font-heading font-black text-black/40 text-lg">
											No campaigns found
										</p>
										<p className="text-sm font-semibold text-black/30 max-w-sm">
											Post a sponsorship brief detailing your requirements for offline marketing and invite communities to apply.
										</p>
										<button
											onClick={() => openForm()}
											className="bg-[#EE2C2C] text-white text-[9px] font-black px-4 py-2.5 rounded-lg uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[#1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all select-none cursor-pointer"
										>
											+ Create Campaign Brief
										</button>
									</div>
								) : (
									<div className={clsx(
										"grid gap-6",
										isSplitLayout ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
									)}>
										{filteredCampaigns.map((c) => {
											const isSelected = selectedCampaign?.id === c.id
											return (
												<div
													key={c.id}
													onClick={() => setSelectedCampaign(c)}
													className={clsx(
														"group text-left relative cursor-pointer bg-white border-[3px] border-black rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all overflow-hidden flex flex-row w-full h-[150px]",
														isSelected && "bg-amber-50 shadow-none translate-x-[2px] translate-y-[2px]"
													)}
												>
													{/* Image / Logo on the left */}
													<div className="relative w-[150px] h-full shrink-0 overflow-hidden bg-slate-50 border-r-[3px] border-black rounded-l-[17px]">
														{profile?.logoUrl ? (
															<img
																src={profile.logoUrl}
																alt={c.name || "Campaign"}
																className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 rounded-l-[14px]"
															/>
														) : (
															<div className="w-full h-full bg-slate-100 flex items-center justify-center text-black/40 font-black text-sm">
																{profile?.brandName ? profile.brandName.substring(0, 2).toUpperCase() : "MD"}
															</div>
														)}

														{/* Status Badge */}
														<span className={clsx(
															"absolute top-2 left-2 text-[7px] font-black px-1.5 py-0.5 border-[2px] border-black rounded-full uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]",
															c.status === "PUBLISHED" ? "bg-green-400 text-black" :
															c.status === "UNDER_REVIEW" ? "bg-yellow-300 text-black" :
															c.status === "REJECTED" ? "bg-red-400 text-white" :
															"bg-gray-300 text-black"
														)}>
															{c.status === "UNDER_REVIEW" ? "PENDING" : c.status}
														</span>
													</div>

													{/* Content & Footer info */}
													<div className="flex-1 p-3 flex flex-col justify-between min-w-0">
														<div className="flex flex-col gap-1">
															<h3 className="font-heading font-black text-base text-black truncate group-hover:text-[#EE2C2C] transition-colors leading-snug">
																{c.name}
															</h3>
															<p className="text-[11px] font-bold text-black/50 truncate">
																Goal: {c.goal} {c.locations?.length > 0 && `• ${c.locations.slice(0, 2).join(", ")}`}{c.locations?.length > 2 ? ` +${c.locations.length - 2}` : ""}
															</p>
															{c.description && (
																<p className="text-[11px] font-semibold text-black/70 line-clamp-2 mt-0.5 leading-normal">
																	{c.description}
																</p>
															)}
														</div>

														<div className="flex justify-between items-end mt-auto gap-2">
															<div className="flex flex-wrap gap-1.5">
																<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-[#6C32D1] text-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
																	{new Date(c.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – {new Date(c.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
																</span>
																<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-[#EE2C2C] text-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
																	{c.offerType === "BARTER" ? "BARTER" : `${c.budgetCurrency} ${Number(c.budgetAmount).toLocaleString()}`}
																</span>
															</div>
															<button
																type="button"
																onClick={(e) => {
																	e.stopPropagation()
																	handleDeleteCampaign(c.id)
																}}
																className="p-1.5 border-2 border-black rounded-lg bg-red-50 text-[#EE2C2C] hover:bg-red-100 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shrink-0 self-end"
															>
																<Icon as={TrashBinSvg} size="xs" />
															</button>
														</div>
													</div>
												</div>
											)
										})}
									</div>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Right Panel: DETAILS VIEW */}
				{isSplitLayout && selectedCampaign && (
					<div className="border-t-[3px] md:border-t-0 md:border-l-[3px] border-black bg-slate-50 overflow-y-auto h-full p-6 animate-in slide-in-from-right duration-200">
						<div className="flex flex-col gap-6">
							<div className="flex justify-between items-center border-b border-black/10 pb-4">
								<h2 className="font-heading font-black text-lg text-black">Campaign Details</h2>
								<button
									onClick={() => setSelectedCampaign(null)}
									className="text-xs font-bold text-black/50 hover:text-black"
								>
									Close ✕
								</button>
							</div>

							<div className="flex flex-col gap-5">
								<h3 className="font-heading font-black text-xl text-black leading-snug">
									{selectedCampaign.name}
								</h3>

								{/* Status and Action Buttons */}
								<div className="flex flex-wrap gap-2">
									<button
										onClick={() => openForm(selectedCampaign)}
										className="flex-1 py-2 bg-[#FFC940] text-black border-2 border-black rounded-xl text-[10px] font-black tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all select-none text-center"
									>
										Edit Brief
									</button>
									<button
										onClick={() => handleDeleteCampaign(selectedCampaign.id)}
										className="py-2 px-3 bg-red-50 text-[#EE2C2C] border-2 border-black rounded-xl text-[10px] font-black tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all select-none text-center"
									>
										Delete
									</button>
								</div>

								<div className="bg-white border-2 border-black rounded-2xl p-4 flex flex-col gap-3.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
									<div>
										<p className="text-[9px] text-black/40 font-bold uppercase tracking-wider">Goal</p>
										<p className="text-xs font-extrabold text-black mt-0.5">{selectedCampaign.goal}</p>
									</div>

									<div>
										<p className="text-[9px] text-black/40 font-bold uppercase tracking-wider">Locations</p>
										<div className="flex flex-wrap gap-1 mt-1">
											{selectedCampaign.locations.map((loc, i) => (
												<span key={i} className="text-[10px] font-black bg-[#EE2C2C] text-white px-2 py-0.5 border border-black rounded-full shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
													{loc}
												</span>
											))}
										</div>
									</div>

									<div>
										<p className="text-[9px] text-black/40 font-bold uppercase tracking-wider">Target Audience</p>
										<div className="flex flex-wrap gap-1.5 mt-1">
											{selectedCampaign.audience.map((aud, i) => (
												<span key={i} className="text-[10px] font-black bg-[#6C32D1] text-white px-2.5 py-0.5 border border-black rounded-full shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
													{aud}
												</span>
											))}
										</div>
									</div>

									<div>
										<p className="text-[9px] text-black/40 font-bold uppercase tracking-wider">Run Dates</p>
										<p className="text-xs font-black text-black mt-0.5">
											{new Date(selectedCampaign.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} - {new Date(selectedCampaign.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
										</p>
									</div>

									<div>
										<p className="text-[9px] text-black/40 font-bold uppercase tracking-wider">Budget & Offer</p>
										<p className="text-xs font-black text-[#EE2C2C] mt-0.5">
											{selectedCampaign.offerType === "BARTER"
												? "BARTER"
												: `${selectedCampaign.budgetCurrency} ${Number(selectedCampaign.budgetAmount).toLocaleString()} (${selectedCampaign.offerType})`}
										</p>
									</div>

									{selectedCampaign.barterElements && (
										<div>
											<p className="text-[9px] text-black/40 font-bold uppercase tracking-wider">Barter Elements</p>
											<p className="text-xs font-semibold text-black mt-0.5 leading-relaxed">{selectedCampaign.barterElements}</p>
										</div>
									)}
								</div>

								{selectedCampaign.description && (
									<div className="bg-white border-2 border-black rounded-2xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
										<p className="text-[9px] text-black/40 font-bold uppercase tracking-wider mb-1">Tell us more</p>
										<p className="text-xs font-semibold text-black/80 leading-relaxed whitespace-pre-wrap break-words">
											{selectedCampaign.description}
										</p>
									</div>
								)}

								{selectedCampaign.status === "REJECTED" && selectedCampaign.adminRejectionRemark && (
									<div className="bg-red-50 border-2 border-[#EE2C2C] rounded-2xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
										<p className="text-[9px] text-[#EE2C2C] font-bold uppercase tracking-wider mb-1">Admin Remark</p>
										<p className="text-xs font-semibold text-black leading-relaxed whitespace-pre-wrap break-words">
											{selectedCampaign.adminRejectionRemark}
										</p>
									</div>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
