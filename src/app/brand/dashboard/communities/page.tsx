"use client"

import { useEffect, useState, useMemo, useRef, Suspense } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Skeleton } from "@/components/ui/Skeleton"
import { toast } from "sonner"
import {
	getBrandCommunities,
	getAllPublishedSponsorships,
	markBrandCommunityCollaborationInterest,
	getMyBrandCommunityCollaborationChats,
	getCategories,
	type BrandCommunity,
	type PublishedSponsorshipProposal,
	type Category,
	type BrandCommunityCollaborationThread,
	type BrandCommunityInterestDomain,
} from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"
import { BrandCommunityDetailView } from "@/components/community/BrandCommunityDetailView"
import clsx from "clsx"

function formatExternalUrl(url?: string | null) {
	if (!url) return null
	const trimmed = url.trim()
	if (!trimmed) return null
	return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

const SIZE_PRESETS = [
	{ label: "All Sizes", value: "ALL" },
	{ label: "< 500", value: "UNDER_500", min: 0, max: 499 },
	{ label: "500 - 1,000", value: "500_1000", min: 500, max: 1000 },
	{ label: "1,000 - 5,000", value: "1000_5000", min: 1000, max: 5000 },
	{ label: "5,000 - 10,000", value: "5000_10000", min: 5000, max: 10000 },
	{ label: "10,000 - 20,000", value: "10000_20000", min: 10000, max: 20000 },
	{ label: "20,000 - 30,000", value: "20000_30000", min: 20000, max: 30000 },
	{ label: "30,000+", value: "OVER_30000", min: 30000, max: Infinity },
]

function parseCommunitySize(sizeStr?: string | null): number | null {
	if (!sizeStr) return null
	// Clean string: replace commas, spaces
	const cleaned = sizeStr.replace(/,/g, "").trim().toLowerCase()
	// Match numbers with possible k/m suffix
	const match = cleaned.match(/(\d+(?:\.\d+)?)\s*(k|m)?/)
	if (!match) return null
	let num = parseFloat(match[1])
	if (match[2] === "k") num *= 1000
	if (match[2] === "m") num *= 1000000
	return isNaN(num) ? null : num
}

function FilterDropdown({
	label,
	selectedText,
	isActive,
	onClear,
	children,
	searchPlaceholder,
	searchValue,
	onSearchChange,
	closeOnSelect = true,
}: {
	label: string
	selectedText: string
	isActive: boolean
	onClear?: () => void
	children: React.ReactNode
	searchPlaceholder?: string
	searchValue?: string
	onSearchChange?: (val: string) => void
	closeOnSelect?: boolean
}) {
	const [isOpen, setIsOpen] = useState(false)
	const dropdownRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!isOpen) return
		const handle = (e: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
				setIsOpen(false)
			}
		}
		window.addEventListener("mousedown", handle)
		return () => window.removeEventListener("mousedown", handle)
	}, [isOpen])

	return (
		<div className="relative" ref={dropdownRef}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className={clsx(
					"flex items-center gap-2 h-10 px-3.5 rounded-[14px] border-[2.5px] border-black text-xs font-black transition-all cursor-pointer select-none",
					isActive
						? "bg-[#FFC940] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
						: "bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-50"
				)}
			>
				<span className="text-black/50 font-bold uppercase tracking-wider text-[10px]">{label}:</span>
				<span className="truncate max-w-[130px]">{selectedText}</span>
				{isActive && onClear ? (
					<span
						onClick={(e) => {
							e.stopPropagation()
							onClear()
						}}
						className="ml-0.5 size-4 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-[10px] text-black"
						title="Clear filter"
					>
						✕
					</span>
				) : (
					<svg
						className={clsx("w-3.5 h-3.5 text-black shrink-0 transition-transform", isOpen ? "rotate-180" : "")}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
					</svg>
				)}
			</button>

			{isOpen && (
				<div className="absolute top-full left-0 mt-2 bg-white border-[2.5px] border-black rounded-[18px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-40 overflow-hidden flex flex-col w-72 max-h-[320px] animate-in fade-in zoom-in-95 duration-100">
					{searchPlaceholder && onSearchChange !== undefined && (
						<div className="p-2 border-b-2 border-black bg-slate-50 shrink-0">
							<input
								type="text"
								placeholder={searchPlaceholder}
								value={searchValue || ""}
								onChange={(e) => onSearchChange(e.target.value)}
								className="w-full h-8 px-3 rounded-lg border-[1.5px] border-black bg-white text-xs font-semibold text-black outline-none placeholder:text-black/40"
								autoFocus
							/>
						</div>
					)}
					<div
						className="overflow-y-auto divide-y divide-black/10 flex-1 p-1"
						onClick={() => {
							if (closeOnSelect) setIsOpen(false)
						}}
					>
						{children}
					</div>
				</div>
			)}
		</div>
	)
}

export function CommunityCard({ community, onClick }: { community: BrandCommunity; onClick?: () => void }) {
	return (
		<div
			onClick={onClick}
			className="group cursor-pointer flex flex-col bg-white border-[3px] border-black rounded-[24px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all overflow-hidden h-full animate-in fade-in zoom-in-95 duration-150"
		>
			<div className="relative w-full aspect-square bg-slate-50 shrink-0 border-b-[3px] border-black">
				{community.logoUrl ? (
					<Image src={community.logoUrl} alt={community.name} fill className="object-cover group-hover:scale-[1.02] transition-transform duration-300" unoptimized />
				) : (
					<div className="w-full h-full bg-slate-100 flex items-center justify-center text-black/30 font-black text-3xl">
						{community.name.substring(0, 2).toUpperCase()}
					</div>
				)}
			</div>
			<div className="p-4 flex flex-col items-start gap-2 w-full text-left">
				<p className="text-sm font-black text-black line-clamp-2 leading-tight group-hover:text-[#EE2C2C] transition-colors">{community.name}</p>
				<div className="flex items-center gap-1.5 mt-auto">
					<span className="inline-block bg-[#F5C343] text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
						{community.size}
					</span>
					<span className="text-[10px] font-black text-black/50 uppercase tracking-wider">
						Members
					</span>
				</div>
			</div>
		</div>
	)
}

function ProposalCard({
	proposal,
	onClick,
}: {
	proposal: PublishedSponsorshipProposal
	onClick: () => void
}) {
	const hostName =
		proposal.hostProfile?.displayName ||
		[proposal.hostProfile?.user?.firstName, proposal.hostProfile?.user?.lastName].filter(Boolean).join(" ") ||
		"Host"
	const displayDate = proposal.eventDate ? new Date(proposal.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""

	return (
		<button
			type="button"
			onClick={onClick}
			className="group text-left relative cursor-pointer bg-white border-[3px] border-black rounded-[20px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all overflow-hidden flex flex-row w-full h-[160px]"
		>
			{/* Image / Logo */}
			<div className="relative aspect-[4/5] h-full shrink-0 overflow-hidden bg-slate-50 border-r-[3px] border-black rounded-l-[17px]">
				{proposal.imageUrl ? (
					<Image
						src={proposal.imageUrl}
						alt={proposal.name || "Proposal"}
						fill
						className="object-cover group-hover:scale-[1.02] transition-transform duration-300 rounded-l-[14px]"
						unoptimized
					/>
				) : (
					<div className="w-full h-full bg-slate-100 flex items-center justify-center text-black/40 font-black text-sm">
						{proposal.name ? proposal.name.substring(0, 2).toUpperCase() : "MD"}
					</div>
				)}
			</div>

			{/* Content & Footer info */}
			<div className="flex-1 p-3 flex flex-col justify-between min-w-0">
				<div className="flex flex-col gap-1">
					<h3 className="font-heading font-black text-base text-black truncate group-hover:text-[#EE2C2C] transition-colors">
						{proposal.name}
					</h3>
					<p className="text-[11px] font-bold text-black/50 truncate">
						Hosted by {hostName} {proposal.city && `• ${proposal.city}`}
					</p>
					{proposal.about && (
						<p className="text-[11px] font-semibold text-black/70 line-clamp-2 mt-0.5 leading-normal">
							{proposal.about}
						</p>
					)}
				</div>

				<div className="flex items-center justify-between gap-1.5 mt-2">
					<div className="flex flex-wrap items-center gap-1.5 min-w-0">
						{displayDate && (
							<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-[#6C32D1] text-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
								{displayDate}
							</span>
						)}
						{proposal.guestCount && (
							<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-[#EE2C2C] text-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
								{proposal.guestCount} Guests
							</span>
						)}
					</div>
					<div className="flex items-center gap-1 shrink-0 ml-auto">
						{(proposal.sponsorshipType === "CASH" || proposal.sponsorshipType === "BOTH" || !proposal.sponsorshipType) && (
							<span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] bg-emerald-100 text-emerald-900 uppercase">
								Cash
							</span>
						)}
						{(proposal.sponsorshipType === "BARTER" || proposal.sponsorshipType === "BOTH") && (
							<span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] bg-[#FFC940] text-black uppercase">
								Barter
							</span>
						)}
					</div>
				</div>
			</div>
		</button>
	)
}

function BrandCommunitiesContent() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const urlCommunityId = searchParams ? searchParams.get("communityId") : null
	const [communities, setCommunities] = useState<BrandCommunity[]>([])
	const [proposals, setProposals] = useState<PublishedSponsorshipProposal[]>([])
	const [selectedCommunity, setSelectedCommunity] = useState<BrandCommunity | null>(null)
	const [collaborationThreads, setCollaborationThreads] = useState<BrandCommunityCollaborationThread[]>([])
	const [interestDomainSending, setInterestDomainSending] = useState<BrandCommunityInterestDomain | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [interestState, setInterestState] = useState<"idle" | "sending" | "sent">("idle")

	useEffect(() => {
		getMyBrandCommunityCollaborationChats(undefined, "BRAND")
			.then((threads) => setCollaborationThreads(threads || []))
			.catch(() => {})
	}, [])

	useEffect(() => {
		if (urlCommunityId && communities.length > 0) {
			const found = communities.find(
				(c) =>
					c.id === urlCommunityId ||
					c.hostProfileId === urlCommunityId ||
					c.name.toLowerCase().trim() === urlCommunityId.toLowerCase().trim()
			)
			if (found) setSelectedCommunity(found)
		}
	}, [urlCommunityId, communities])

	useEffect(() => {
		let cancelled = false
		setIsLoading(true)
		Promise.all([getBrandCommunities(), getAllPublishedSponsorships()])
			.then(async ([commRes, propRes]) => {
				if (!cancelled) {
					const proposalsWithDetails = await Promise.all(
						propRes.proposals.map(async (p) => {
							try {
								const detail = await import('@/lib/api').then(m => m.getPublishedSponsorshipDetail(p.id));
								return { ...p, communityId: detail.community?.id || null, community: detail.community } as PublishedSponsorshipProposal & { communityId?: string | null, community?: any };
							} catch (e) {
								return p as PublishedSponsorshipProposal & { communityId?: string | null, community?: any };
							}
						})
					);
					
					if (!cancelled) {
						setCommunities(commRes.communities)
						setProposals(proposalsWithDetails)
						
						if (typeof window !== "undefined") {
							const sp = new URLSearchParams(window.location.search);
							const cid = sp.get("communityId");
							if (cid) {
								const found = commRes.communities.find(
									c => c.id === cid || c.hostProfileId === cid || c.name.toLowerCase().trim() === cid.toLowerCase().trim()
								)
								if (found) setSelectedCommunity(found)
							}
						}
					}
				}
			})
			.catch((e) => {
				if (!cancelled) setError(getApiErrorMessage(e))
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false)
			})
		return () => {
			cancelled = true
		}
	}, [])

	const activeProposals = selectedCommunity
		? (proposals as (PublishedSponsorshipProposal & { communityId?: string | null, community?: any })[]).filter((p) => {
				if (p.communityId) {
					return p.communityId === selectedCommunity.id;
				}
				const cHostId = selectedCommunity.hostProfileId || selectedCommunity.id;
				const matchesId = p.hostProfileId === cHostId || p.hostProfile?.id === cHostId;
				
				const propName = p.hostProfile?.displayName?.toLowerCase().trim() || "";
				const commName = selectedCommunity.name?.toLowerCase().trim() || "";
				const matchesName = propName === commName || (commName.length > 3 && propName.includes(commName)) || (propName.length > 3 && commName.includes(propName));
				
				return matchesId || matchesName;
		  })
		: []
	const [selectedSizes, setSelectedSizes] = useState<string[]>([])
	const [selectedCities, setSelectedCities] = useState<string[]>([])
	const [citySearch, setCitySearch] = useState<string>("")
	const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
	const [categorySearch, setCategorySearch] = useState<string>("")

	// Extract unique available cities from communities
	const availableCities = useMemo(() => {
		const set = new Set<string>()
		communities.forEach((c) => {
			if (Array.isArray(c.operatingCities)) {
				c.operatingCities.forEach((city) => {
					const trimmed = city?.trim()
					if (trimmed) set.add(trimmed)
				})
			}
		})
		return Array.from(set).sort((a, b) => a.localeCompare(b))
	}, [communities])

	const filteredCitiesList = useMemo(() => {
		if (!citySearch.trim()) return availableCities
		const lower = citySearch.toLowerCase()
		return availableCities.filter((city) => city.toLowerCase().includes(lower))
	}, [availableCities, citySearch])

	const [allCategories, setAllCategories] = useState<Category[]>([])

	useEffect(() => {
		getCategories()
			.then((cats) => {
				if (Array.isArray(cats)) setAllCategories(cats)
			})
			.catch(() => {})
	}, [])

	// Extract unique available categories from allCategories + communities
	const availableCategories = useMemo(() => {
		const map = new Map<string, Category>()
		// First add system categories
		allCategories.forEach((c) => {
			if (c && c.id && !map.has(c.id)) {
				map.set(c.id, c)
			}
		})
		// Also add any community categories
		communities.forEach((c) => {
			if (Array.isArray(c.categories)) {
				c.categories.forEach((cat) => {
					if (cat && cat.id && !map.has(cat.id)) {
						map.set(cat.id, cat)
					}
				})
			}
		})
		return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
	}, [allCategories, communities])

	const filteredCategoriesList = useMemo(() => {
		if (!categorySearch.trim()) return availableCategories
		const lower = categorySearch.toLowerCase()
		return availableCategories.filter((cat) => cat.name.toLowerCase().includes(lower))
	}, [availableCategories, categorySearch])

	// Filter communities by sizes, cities, and categories (all multi-select)
	const filteredCommunities = useMemo(() => {
		return communities.filter((community) => {
			// Size filter (multi-select: matches ANY selected size range)
			if (selectedSizes.length > 0) {
				const parsedSize = parseCommunitySize(community.size)
				if (parsedSize === null) return false
				const matchesAnySize = selectedSizes.some((val) => {
					const preset = SIZE_PRESETS.find((p) => p.value === val)
					if (!preset) return false
					return parsedSize >= preset.min! && parsedSize <= preset.max!
				})
				if (!matchesAnySize) return false
			}

			// City filter (multi-select: matches ANY selected city)
			if (selectedCities.length > 0) {
				const commCities = Array.isArray(community.operatingCities)
					? community.operatingCities.map((c) => c.toLowerCase().trim())
					: []
				const matchesAnyCity = selectedCities.some((city) =>
					commCities.includes(city.toLowerCase().trim())
				)
				if (!matchesAnyCity) return false
			}

			// Category filter (multi-select: matches ANY selected category)
			if (selectedCategoryIds.length > 0) {
				const selectedCatObjects = availableCategories.filter((c) => selectedCategoryIds.includes(c.id))
				const selectedNames = new Set(selectedCatObjects.map((c) => c.name.toLowerCase().trim()))

				const communityCats = Array.isArray(community.categories) ? community.categories : []
				const hasCat = communityCats.some((c: any) => {
					if (!c) return false
					const id = typeof c === "string" ? c : c.id
					const name = typeof c === "string" ? c : c.name
					if (id && selectedCategoryIds.includes(id)) return true
					if (name && selectedNames.has(name.toLowerCase().trim())) return true
					return false
				})
				if (!hasCat) return false
			}

			return true
		})
	}, [communities, selectedSizes, selectedCities, selectedCategoryIds, availableCategories])

	const hasActiveFilters = selectedSizes.length > 0 || selectedCities.length > 0 || selectedCategoryIds.length > 0

	const handleToggleSize = (value: string) => {
		setSelectedSizes((prev) =>
			prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
		)
	}

	const handleToggleCity = (city: string) => {
		setSelectedCities((prev) =>
			prev.includes(city) ? prev.filter((item) => item !== city) : [...prev, city]
		)
	}

	const handleToggleCategory = (id: string) => {
		setSelectedCategoryIds((prev) =>
			prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
		)
	}

	const handleResetFilters = () => {
		setSelectedSizes([])
		setSelectedCities([])
		setSelectedCategoryIds([])
	}

	if (selectedCommunity) {
		const currentThread = collaborationThreads.find(
			(t) => t.targetCommunityId === selectedCommunity.id
		)

		return (
			<BrandCommunityDetailView
				community={selectedCommunity}
				activeProposals={activeProposals}
				otherProposals={proposals}
				onBack={() => {
					setSelectedCommunity(null)
					router.replace("/brand/dashboard/communities")
				}}
				backLabel="Back to Communities"
				onProposalClick={(id) => router.push(`/brand/dashboard/proposal/${id}`)}
				chatStatus={currentThread?.chatStatus || null}
				chatId={currentThread?.id || null}
				sentDomain={currentThread?.interestDomain || null}
				interestDomainSending={interestDomainSending}
				onGoToChat={(chatId) => {
					router.push(`/brand/dashboard/chats?category=communities&threadId=${chatId}&view=active`)
				}}
				onGoToChannel={(chatId) => {
					router.push(`/brand/dashboard/chats?category=communities&threadId=${chatId}&view=active`)
				}}
				onInterestDomain={async (domain) => {
					setInterestDomainSending(domain)
					try {
						const result = await markBrandCommunityCollaborationInterest(selectedCommunity.id, domain)
						setCollaborationThreads((prev) => {
							const existingIdx = prev.findIndex((t) => t.id === result.interestId)
							if (existingIdx >= 0) {
								const copy = [...prev]
								copy[existingIdx] = {
									...copy[existingIdx],
									chatStatus: result.chatStatus,
									interestDomain: result.interestDomain || domain,
								}
								return copy
							}
							return [
								...prev,
								{
									id: result.interestId,
									collaborationType: "BRAND_COMMUNITY",
									requesterBrandId: "",
									targetCommunityId: selectedCommunity.id,
									mySenderType: "REQUESTER",
									direction: "OUTGOING",
									counterpartName: selectedCommunity.name,
									counterpartAvatarUrl: selectedCommunity.logoUrl || null,
									chatStatus: result.chatStatus,
									interestDomain: result.interestDomain || domain,
									createdAt: new Date().toISOString(),
									unreadCount: 0,
								},
							]
						})
						const domainLabels: Record<string, string> = {
							SPONSORSHIP: "Sponsorship",
							BRANDED_CONTENT: "Branded Content",
							SAMPLING: "Sampling",
						}
						toast.success(
							result.alreadyInterested
								? `Interest updated to ${domainLabels[domain] || domain}.`
								: `${domainLabels[domain] || domain} interest sent to ${selectedCommunity.name}!`
						)
					} catch (e) {
						toast.error(getApiErrorMessage(e) || "Failed to send interest.")
					} finally {
						setInterestDomainSending(null)
					}
				}}
			/>
		)
	}

	return (
		<div className="flex flex-col min-h-full bg-white">
			{/* Top Nav / Subheader */}
			<div className="hidden sm:flex justify-between items-center px-8 py-4 border-b border-black/10 shrink-0">
				<p className="text-sm font-semibold text-black/50 mx-auto">
					Welcome to <span className="text-[#EE2C2C] font-bold">Meetday</span>
				</p>
			</div>

			<div className="px-4 lg:px-6 py-6 max-w-6xl w-full mx-auto flex-grow flex flex-col gap-6 min-h-0">
				<div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
					<div>
						<h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-black leading-tight">
							Communities
						</h1>
						<p className="text-sm font-semibold text-black/50 mt-1">
							Communities onboarded on Meetday, available for collaboration.
						</p>
					</div>

					{/* Filters Bar */}
					<div className="flex flex-wrap items-center gap-2.5">
						{/* Size Filter (Multi-select) */}
						<FilterDropdown
							label="Size"
							selectedText={
								selectedSizes.length === 0
									? "All Sizes"
									: selectedSizes.length === 1
									? SIZE_PRESETS.find((p) => p.value === selectedSizes[0])?.label || "1 Size"
									: `${selectedSizes.length} Selected`
							}
							isActive={selectedSizes.length > 0}
							onClear={() => setSelectedSizes([])}
							closeOnSelect={false}
						>
							<div className="flex items-center justify-between px-3 py-2 border-b border-black/10 bg-slate-50/50">
								<span className="text-[10px] font-black uppercase text-black/50">Select Sizes</span>
								{selectedSizes.length > 0 && (
									<button
										type="button"
										onClick={() => setSelectedSizes([])}
										className="text-[10px] font-black text-[#EE2C2C] hover:underline cursor-pointer"
									>
										Clear ({selectedSizes.length})
									</button>
								)}
							</div>
							{SIZE_PRESETS.filter((p) => p.value !== "ALL").map((preset) => {
								const isSelected = selectedSizes.includes(preset.value)
								return (
									<button
										key={preset.value}
										type="button"
										onClick={() => handleToggleSize(preset.value)}
										className={clsx(
											"w-full text-left px-3.5 py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-between gap-3",
											isSelected ? "bg-[#FFC940]/40 text-black font-black" : "text-black hover:bg-black/5"
										)}
									>
										<span className="truncate flex-1">{preset.label}</span>
										<div
											className={clsx(
												"w-5 h-5 min-w-[20px] min-h-[20px] rounded-[6px] border-2 border-black flex items-center justify-center shrink-0 transition-all shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]",
												isSelected ? "bg-[#EE2C2C] text-white" : "bg-white"
											)}
										>
											{isSelected && (
												<svg className="w-3.5 h-3.5 stroke-[3.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
												</svg>
											)}
										</div>
									</button>
								)
							})}
						</FilterDropdown>

						{/* Cities Filter (Multi-select) */}
						<FilterDropdown
							label="City"
							selectedText={
								selectedCities.length === 0
									? "All Cities"
									: selectedCities.length === 1
									? selectedCities[0]
									: `${selectedCities.length} Selected`
							}
							isActive={selectedCities.length > 0}
							onClear={() => setSelectedCities([])}
							searchPlaceholder="Search cities..."
							searchValue={citySearch}
							onSearchChange={setCitySearch}
							closeOnSelect={false}
						>
							<div className="flex items-center justify-between px-3 py-2 border-b border-black/10 bg-slate-50/50">
								<span className="text-[10px] font-black uppercase text-black/50">Select Cities</span>
								{selectedCities.length > 0 && (
									<button
										type="button"
										onClick={() => setSelectedCities([])}
										className="text-[10px] font-black text-[#EE2C2C] hover:underline cursor-pointer"
									>
										Clear ({selectedCities.length})
									</button>
								)}
							</div>
							{filteredCitiesList.map((city) => {
								const isSelected = selectedCities.includes(city)
								return (
									<button
										key={city}
										type="button"
										onClick={() => handleToggleCity(city)}
										className={clsx(
											"w-full text-left px-3.5 py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-between gap-3",
											isSelected ? "bg-[#FFC940]/40 text-black font-black" : "text-black hover:bg-black/5"
										)}
									>
										<span className="truncate flex-1">{city}</span>
										<div
											className={clsx(
												"w-5 h-5 min-w-[20px] min-h-[20px] rounded-[6px] border-2 border-black flex items-center justify-center shrink-0 transition-all shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]",
												isSelected ? "bg-[#EE2C2C] text-white" : "bg-white"
											)}
										>
											{isSelected && (
												<svg className="w-3.5 h-3.5 stroke-[3.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
												</svg>
											)}
										</div>
									</button>
								)
							})}
							{filteredCitiesList.length === 0 && (
								<div className="px-3.5 py-3 text-xs font-bold text-black/40 text-center">
									No cities found
								</div>
							)}
						</FilterDropdown>

						{/* Categories Filter (Multi-select) */}
						<FilterDropdown
							label="Categories"
							selectedText={
								selectedCategoryIds.length === 0
									? "All Categories"
									: selectedCategoryIds.length === 1
									? availableCategories.find((c) => c.id === selectedCategoryIds[0])?.name || "1 Category"
									: `${selectedCategoryIds.length} Selected`
							}
							isActive={selectedCategoryIds.length > 0}
							onClear={() => setSelectedCategoryIds([])}
							searchPlaceholder="Search categories..."
							searchValue={categorySearch}
							onSearchChange={setCategorySearch}
							closeOnSelect={false}
						>
							<div className="flex items-center justify-between px-3 py-2 border-b border-black/10 bg-slate-50/50">
								<span className="text-[10px] font-black uppercase text-black/50">Select Categories</span>
								{selectedCategoryIds.length > 0 && (
									<button
										type="button"
										onClick={() => setSelectedCategoryIds([])}
										className="text-[10px] font-black text-[#EE2C2C] hover:underline cursor-pointer"
									>
										Clear ({selectedCategoryIds.length})
									</button>
								)}
							</div>
							{filteredCategoriesList.map((cat) => {
								const isSelected = selectedCategoryIds.includes(cat.id)
								return (
									<button
										key={cat.id}
										type="button"
										onClick={() => handleToggleCategory(cat.id)}
										className={clsx(
											"w-full text-left px-3.5 py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-between gap-3",
											isSelected ? "bg-[#FFC940]/40 text-black font-black" : "text-black hover:bg-black/5"
										)}
									>
										<span className="truncate flex-1">{cat.name}</span>
										<div
											className={clsx(
												"w-5 h-5 min-w-[20px] min-h-[20px] rounded-[6px] border-2 border-black flex items-center justify-center shrink-0 transition-all shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]",
												isSelected ? "bg-[#EE2C2C] text-white" : "bg-white"
											)}
										>
											{isSelected && (
												<svg className="w-3.5 h-3.5 stroke-[3.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
												</svg>
											)}
										</div>
									</button>
								)
							})}
							{filteredCategoriesList.length === 0 && (
								<div className="px-3.5 py-3 text-xs font-bold text-black/40 text-center">
									No categories found
								</div>
							)}
						</FilterDropdown>

						{/* Reset all button */}
						{hasActiveFilters && (
							<button
								type="button"
								onClick={handleResetFilters}
								className="h-10 px-3.5 rounded-[14px] border-[2.5px] border-black bg-white hover:bg-red-50 text-[#EE2C2C] text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer flex items-center gap-1.5"
							>
								<span>Reset</span>
							</button>
						)}
					</div>
				</div>

				<div className="w-full">
					{isLoading ? (
						<div className="flex flex-col gap-4">
							{Array.from({ length: 5 }).map((_, i) => (
								<Skeleton key={i} className="h-24 border-[3px] border-black rounded-[20px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
							))}
						</div>
					) : error ? (
						<p className="text-sm font-bold text-red-600">{error}</p>
					) : communities.length === 0 ? (
						<p className="text-sm font-bold text-black/50">No communities onboarded yet.</p>
					) : filteredCommunities.length === 0 ? (
						<div className="py-12 px-4 text-center border-[3px] border-dashed border-black/20 rounded-[24px] bg-slate-50/50 flex flex-col items-center justify-center gap-2">
							<p className="text-base font-black text-black">No communities match your filters</p>
							<p className="text-xs font-bold text-black/50">Try adjusting or clearing your size, city, or category filters.</p>
							<button
								type="button"
								onClick={handleResetFilters}
								className="mt-3 px-4 py-2 rounded-[12px] border-2 border-black bg-[#FFC940] text-black text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
							>
								Clear All Filters
							</button>
						</div>
					) : (
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 pt-2 px-2 pb-4">
							{filteredCommunities.map((community) => (
								<CommunityCard
									key={community.id}
									community={community}
									onClick={() => setSelectedCommunity(community)}
								/>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default function BrandCommunitiesPage() {
	return (
		<Suspense fallback={<div className="p-8 text-center text-sm font-semibold text-black/50">Loading communities...</div>}>
			<BrandCommunitiesContent />
		</Suspense>
	)
}
