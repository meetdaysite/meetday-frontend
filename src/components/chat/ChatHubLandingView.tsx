"use client"

import { useState, useMemo } from "react"
import clsx from "clsx"
import type {
	ChatRole,
	ChatCategoryKey,
	CategoryDefinition,
	UnifiedRequestItem,
	RequestDirection,
} from "./ChatHubTypes"
import { Icon } from "@/components/ui/Icon"
import DocumentTextSvg from "@/icons/outlined/document-text.svg"
import RocketSvg from "@/icons/outlined/rocket.svg"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import UsersGroupSvg from "@/icons/outlined/users-group-2.svg"
import TagPriceSvg from "@/icons/outlined/tag-price.svg"
import SearchSvg from "@/icons/outlined/search.svg"
import CheckSvg from "@/icons/outlined/check.svg"

interface ChatHubLandingViewProps {
	role: ChatRole
	categories: CategoryDefinition[]
	onSelectCategory: (category: ChatCategoryKey) => void
	requests: UnifiedRequestItem[]
	activeQueue: RequestDirection
	setActiveQueue: (queue: RequestDirection) => void
	categoryFilter: string
	setCategoryFilter: (cat: string) => void
	incomingCount: number
	sentCount: number
	onAcceptRequest: (req: UnifiedRequestItem) => Promise<void> | void
	onDeclineRequest?: (req: UnifiedRequestItem) => Promise<void> | void
	respondingId: string | null
	loading: boolean
}

function timeAgo(iso: string | null | undefined): string {
	if (!iso) return ""
	const diffMs = Date.now() - new Date(iso).getTime()
	const mins = Math.floor(diffMs / 60000)
	if (mins < 1) return "just now"
	if (mins < 60) return `${mins}m ago`
	const hours = Math.floor(mins / 60)
	if (hours < 24) return `${hours}h ago`
	return `${Math.floor(hours / 24)}d ago`
}

function getCategoryIcon(key: ChatCategoryKey) {
	switch (key) {
		case "sponsorships":
			return DocumentTextSvg
		case "campaigns":
			return RocketSvg
		case "spaces":
			return CalendarSvg
		case "communities":
			return UsersGroupSvg
		case "brands":
			return TagPriceSvg
		default:
			return DocumentTextSvg
	}
}

function getCategoryBadgeColor(cat: ChatCategoryKey) {
	switch (cat) {
		case "sponsorships":
			return "bg-[#FFC940] text-black border-black/20"
		case "campaigns":
			return "bg-[#EE2C2C]/15 text-[#EE2C2C] border-[#EE2C2C]/30"
		case "spaces":
			return "bg-black/10 text-black border-black/20"
		case "communities":
			return "bg-[#FFC940]/25 text-black border-black/20"
		case "brands":
			return "bg-[#EE2C2C]/15 text-[#EE2C2C] border-[#EE2C2C]/30"
		default:
			return "bg-black/10 text-black border-black/20"
	}
}

function getCategoryCardIconStyles(key: ChatCategoryKey): { bg: string; iconColor: string } {
	switch (key) {
		case "sponsorships":
		case "communities":
			return { bg: "bg-[#FFC940]", iconColor: "text-black" }
		case "campaigns":
		case "brands":
			return { bg: "bg-[#EE2C2C]", iconColor: "text-white" }
		case "spaces":
		default:
			return { bg: "bg-black", iconColor: "text-white" }
	}
}

function getCategoryFilterPillStyles(key: string, isSelected: boolean): string {
	if (!isSelected) {
		return "bg-white text-black/60 border-black/10 hover:border-black/25"
	}
	switch (key) {
		case "sponsorships":
		case "communities":
			return "bg-[#FFC940] text-black border-black font-black"
		case "campaigns":
		case "brands":
			return "bg-[#EE2C2C] text-white border-black font-black"
		case "ALL":
		case "spaces":
		default:
			return "bg-black text-white border-black font-black"
	}
}

function getCategoryFilterCountBadgeStyles(key: string, isSelected: boolean): string {
	if (!isSelected) {
		return "bg-black/10 text-black/70"
	}
	switch (key) {
		case "sponsorships":
		case "communities":
			return "bg-black text-white"
		case "campaigns":
		case "brands":
			return "bg-white text-[#EE2C2C]"
		case "ALL":
		case "spaces":
		default:
			return "bg-[#FFC940] text-black"
	}
}

export function ChatHubLandingView({
	role,
	categories,
	onSelectCategory,
	requests,
	activeQueue,
	setActiveQueue,
	categoryFilter,
	setCategoryFilter,
	incomingCount,
	sentCount,
	onAcceptRequest,
	onDeclineRequest,
	respondingId,
	loading,
}: ChatHubLandingViewProps) {
	const [searchQuery, setSearchQuery] = useState("")

	// Filter requests by active queue (INCOMING vs OUTGOING), category filter, and search text
	const filteredRequests = useMemo(() => {
		return requests.filter((req) => {
			if (req.direction !== activeQueue) return false
			if (categoryFilter !== "ALL" && req.category !== categoryFilter) return false
			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase()
				const matchName = req.counterpartName.toLowerCase().includes(q)
				const matchTitle = req.title.toLowerCase().includes(q)
				const matchSub = (req.subtitle || "").toLowerCase().includes(q)
				if (!matchName && !matchTitle && !matchSub) return false
			}
			return true
		})
	}, [requests, activeQueue, categoryFilter, searchQuery])

	// Compute category-specific counts for filter pills
	const categoryFilterCounts = useMemo(() => {
		const counts: Record<string, number> = { ALL: 0 }
		requests.forEach((r) => {
			if (r.direction === activeQueue) {
				counts.ALL = (counts.ALL || 0) + 1
				counts[r.category] = (counts[r.category] || 0) + 1
			}
		})
		return counts
	}, [requests, activeQueue])

	return (
		<div className="flex-1 flex flex-col gap-5 min-h-0">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
				<div>
					<h1 className="text-2xl sm:text-3xl font-heading font-black text-black tracking-tight">
						Chats & Requests Hub
					</h1>
					<p className="text-xs sm:text-sm font-semibold text-black/50 mt-0.5">
						Select a category to view active conversations, or manage your requests below.
					</p>
				</div>
			</div>

			{/* Main 2-Column Unboxed Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1 min-h-0">
				
				{/* ═════════════════════════════════════════════════════════════
				    LEFT COLUMN: Category Entry Cards
				   ═════════════════════════════════════════════════════════════ */}
				<div className="lg:col-span-5 xl:col-span-5 flex flex-col gap-3.5">
					<div className="flex items-center justify-between px-1 shrink-0 min-h-[36px]">
						<div>
							<h2 className="text-xs font-black uppercase tracking-wider text-black/60">
								Chat Categories
							</h2>
							<p className="text-[11px] font-semibold text-black/40">
								Choose a category to open conversations
							</p>
						</div>
					</div>

					{/* Category Cards */}
					<div className="flex flex-col gap-3">
						{categories.map((cat) => {
							const hasUnread = (cat.badgeCount || 0) > 0
							const hasPending = (cat.pendingRequestsCount || 0) > 0
							const isDisabled = !!cat.disabled
							const IconComponent = getCategoryIcon(cat.key)
							const cardIconStyles = getCategoryCardIconStyles(cat.key)

							if (isDisabled) {
								return (
									<div
										key={cat.key}
										className="relative p-4 rounded-[20px] border-[3px] border-black/20 bg-neutral-100 opacity-60 cursor-not-allowed select-none transition-all"
									>
										<div className="flex items-start justify-between gap-3">
											<div className="flex items-center gap-3">
												<div className="size-10 rounded-xl bg-black/5 border-2 border-black/20 flex items-center justify-center shrink-0">
													<Icon as={IconComponent} size="md" className="text-black/40" />
												</div>
												<div>
													<h3 className="text-sm font-heading font-black text-black/60 leading-tight">
														{cat.label}
													</h3>
													<p className="text-[11px] font-semibold text-black/40 mt-0.5 leading-snug">
														{cat.description}
													</p>
												</div>
											</div>
											<span className="shrink-0 text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-black/10 text-black/50 border border-black/10">
												Coming Soon
											</span>
										</div>
									</div>
								)
							}

							return (
								<button
									key={cat.key}
									type="button"
									onClick={() => onSelectCategory(cat.key)}
									className="group relative p-4.5 sm:p-5 rounded-[22px] border-[3px] border-black bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all text-left cursor-pointer flex flex-col justify-between gap-3 select-none"
								>
									{/* Top Row: Icon + Title + Unread Badge */}
									<div className="flex items-start justify-between gap-3">
										<div className="flex items-center gap-3 min-w-0">
											<div className={clsx("size-11 rounded-2xl border-[2.5px] border-black flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform", cardIconStyles.bg)}>
												<Icon as={IconComponent} size="md" className={cardIconStyles.iconColor} />
											</div>
											<div className="min-w-0">
												<h3 className="text-base sm:text-lg font-heading font-black truncate leading-tight group-hover:text-[#EE2C2C] transition-colors">
													{cat.label}
												</h3>
												<p className="text-xs font-semibold text-black/60 line-clamp-1 mt-0.5">
													{cat.description}
												</p>
											</div>
										</div>

										{/* Notification Badge */}
										<div className="flex items-center gap-1 shrink-0">
											{hasUnread && (
												<span
													className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#EE2C2C] text-white text-[10px] font-black flex items-center justify-center border-2 border-black shadow-xs"
													title={`${cat.badgeCount} unread message(s)`}
												>
													{cat.badgeCount! > 9 ? "9+" : cat.badgeCount}
												</span>
											)}
										</div>
									</div>

									{/* Bottom Meta Row */}
									<div className="flex items-center justify-between text-xs font-bold pt-2.5 border-t border-black/10">
										<span className="flex items-center gap-1.5 text-black/80">
											<span className="size-2 rounded-full bg-[#22C55E] border border-black/30" />
											<span>{cat.activeCount || 0} active conversation{(cat.activeCount || 0) === 1 ? "" : "s"}</span>
										</span>

										{hasPending ? (
											<span className="px-2.5 py-0.5 rounded-lg bg-[#FFC940] text-black font-black text-[11px] border border-black shadow-xs">
												{cat.pendingRequestsCount} pending
											</span>
										) : (
											<span className="text-black/60 group-hover:text-[#EE2C2C] group-hover:translate-x-1 transition-all text-xs font-black">
												Open →
											</span>
										)}
									</div>
								</button>
							)
						})}
					</div>
				</div>

				{/* ═════════════════════════════════════════════════════════════
				    RIGHT SECTION: Requests Hub (Header outside, Box starts at filters)
				   ═════════════════════════════════════════════════════════════ */}
				<div className="lg:col-span-7 xl:col-span-7 flex flex-col gap-3.5 h-full min-h-0">
					
					{/* Requests Hub Header (Outside Box) */}
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1 shrink-0 min-h-[36px]">
						<div>
							<h2 className="text-xs font-black uppercase tracking-wider text-black/60">
								Requests Hub
							</h2>
							<p className="text-[11px] font-semibold text-black/40">
								Incoming requests & outgoing inquiries
							</p>
						</div>

						{/* Queue Switcher Navtab */}
						<div className="inline-flex p-1 bg-black/5 rounded-2xl border-2 border-black/10 self-start sm:self-auto shrink-0">
							<button
								type="button"
								onClick={() => setActiveQueue("INCOMING")}
								className={clsx(
									"px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer",
									activeQueue === "INCOMING"
										? "bg-[#EE2C2C] text-white shadow-sm"
										: "text-black/60 hover:text-black"
								)}
							>
								<span>Incoming</span>
								{incomingCount > 0 && (
									<span
										className={clsx(
											"min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-black flex items-center justify-center border",
											activeQueue === "INCOMING"
												? "bg-white text-[#EE2C2C] border-transparent"
												: "bg-[#FFC940] text-black border-black/10"
										)}
									>
										{incomingCount}
									</span>
								)}
							</button>

							<button
								type="button"
								onClick={() => setActiveQueue("OUTGOING")}
								className={clsx(
									"px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer",
									activeQueue === "OUTGOING"
										? "bg-black text-white shadow-sm"
										: "text-black/60 hover:text-black"
								)}
							>
								<span>Sent</span>
								{sentCount > 0 && (
									<span
										className={clsx(
											"min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-black flex items-center justify-center border",
											activeQueue === "OUTGOING"
												? "bg-[#FFC940] text-black border-transparent"
												: "bg-black/10 text-black border-black/10"
										)}
									>
										{sentCount}
									</span>
								)}
							</button>
						</div>
					</div>

					{/* The Requests Box: Starts from Filter Tabs, extends to match the height of the left column */}
					<div className="flex-1 min-h-[380px] lg:min-h-0 border-[3px] border-black rounded-[22px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden flex flex-col">
						{/* Category Filter Pills & Search */}
						<div className="p-3 sm:p-3.5 border-b-2 border-black bg-neutral-50 flex flex-wrap items-center justify-between gap-2 shrink-0">
							<div className="flex flex-wrap items-center gap-1.5">
								<button
									type="button"
									onClick={() => setCategoryFilter("ALL")}
									className={clsx(
										"px-2.5 py-1 rounded-xl text-xs font-bold transition-all border-2 flex items-center gap-1 cursor-pointer",
										categoryFilter === "ALL"
											? "bg-black text-white border-black"
											: "bg-white text-black/60 border-black/10 hover:border-black/25"
									)}
								>
									<span>All</span>
									<span className="text-[10px] opacity-75">
										({categoryFilterCounts.ALL || 0})
									</span>
								</button>

								{categories
									.filter((c) => !c.disabled)
									.map((c) => {
										const count = categoryFilterCounts[c.key] || 0
										const isSelected = categoryFilter === c.key
										return (
											<button
												key={c.key}
												type="button"
												onClick={() => setCategoryFilter(c.key)}
												className={clsx(
													"px-2.5 py-1 rounded-xl text-xs transition-all border-2 flex items-center gap-1 cursor-pointer",
													getCategoryFilterPillStyles(c.key, isSelected)
												)}
											>
												<span>{c.label}</span>
												{count > 0 && (
													<span
														className={clsx(
															"px-1.5 py-0.2 rounded-full text-[9px] font-black",
															getCategoryFilterCountBadgeStyles(c.key, isSelected)
														)}
													>
														{count}
													</span>
												)}
											</button>
										)
									})}
							</div>

							{/* Search Input */}
							<div className="relative min-w-[160px] flex-1 sm:flex-initial">
								<input
									type="text"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="Search requests…"
									className="w-full pl-7 pr-3 py-1 text-xs font-semibold rounded-xl border-2 border-black/15 focus:border-black outline-none bg-white transition-colors"
								/>
								<Icon
									as={SearchSvg}
									size="xs"
									className="text-black/40 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
								/>
								{searchQuery && (
									<button
										type="button"
										onClick={() => setSearchQuery("")}
										className="absolute right-2 top-1/2 -translate-y-1/2 text-black/40 hover:text-black font-bold text-xs"
									>
										✕
									</button>
								)}
							</div>
						</div>

					{/* Request Cards Feed */}
					<div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-3.5 flex flex-col gap-2">
						{loading && requests.length === 0 ? (
							<div className="flex-1 flex items-center justify-center py-10 text-xs font-semibold text-black/40">
								Loading requests…
							</div>
						) : filteredRequests.length === 0 ? (
							<div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center">
								<h3 className="text-sm font-heading font-black text-black">
									{activeQueue === "INCOMING"
										? "No incoming requests pending"
										: "No sent requests in this category"}
								</h3>
								<p className="text-xs font-semibold text-black/50 max-w-xs mt-1">
									{activeQueue === "INCOMING"
										? "When counterparts reach out, their requests will appear here."
										: "Any requests you have sent will be tracked here."}
								</p>
							</div>
						) : (
							filteredRequests.map((req) => {
								const isIncoming = req.direction === "INCOMING"
								const isResponding = respondingId === req.id
								const badgeColor = getCategoryBadgeColor(req.category)

								return (
									<div
										key={req.id}
										className="p-3 sm:p-3.5 rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
									>
										{/* Left Side: Avatar + Details */}
										<div className="flex items-start gap-3 min-w-0 flex-1">
											<div className="size-10 rounded-full border-2 border-black overflow-hidden bg-neutral-100 shrink-0 flex items-center justify-center font-heading font-black text-xs text-black/60 shadow-xs">
												{req.counterpartAvatarUrl ? (
													<img
														src={req.counterpartAvatarUrl}
														alt={req.counterpartName}
														className="w-full h-full object-cover"
													/>
												) : (
													req.counterpartName.charAt(0).toUpperCase()
												)}
											</div>

											<div className="min-w-0 flex-1">
												<div className="flex flex-wrap items-center gap-1.5">
													<p className="text-xs sm:text-sm font-black text-black truncate leading-tight">
														{req.counterpartName}
													</p>
													<span
														className={clsx(
															"px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase tracking-wider border",
															badgeColor
														)}
													>
														{req.category}
													</span>
													{req.createdAt && (
														<span className="text-[10px] font-semibold text-black/35 shrink-0">
															• {timeAgo(req.createdAt)}
														</span>
													)}
												</div>

												<p className="text-[11px] font-bold text-black/70 truncate mt-0.5">
													{req.title}
												</p>

												<p className="text-[11px] font-semibold text-black/50 mt-0.5 line-clamp-1">
													{req.description || req.lastMessagePreview || (
														isIncoming
															? "Requested connection with your profile."
															: "You sent a connection request."
													)}
												</p>
											</div>
										</div>

										{/* Right Side: Actions */}
										<div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
											{isIncoming ? (
												<>
													<button
														type="button"
														disabled={isResponding}
														onClick={() => onAcceptRequest(req)}
														className="px-3 py-1.5 rounded-xl bg-[#22C55E] hover:bg-[#1ea750] text-white font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none transition-all cursor-pointer disabled:opacity-50 select-none flex items-center gap-1"
													>
														<Icon as={CheckSvg} size="xs" />
														<span>{isResponding ? "Accepting…" : "Accept"}</span>
													</button>

													{onDeclineRequest && (
														<button
															type="button"
															disabled={isResponding}
															onClick={() => onDeclineRequest(req)}
															className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-neutral-50 text-black font-black text-xs border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all cursor-pointer disabled:opacity-50 select-none"
														>
															Decline
														</button>
													)}
												</>
											) : (
												<div className="flex items-center gap-1.5">
													<span className="px-2.5 py-1 rounded-xl bg-black/5 text-black/60 font-black text-[11px] border border-black/15 inline-flex items-center gap-1.5">
														<span className="size-1.5 rounded-full bg-[#FFC940] animate-pulse" />
														<span>Awaiting Response</span>
													</span>
												</div>
											)}
										</div>
									</div>
								)
							})
						)}
					</div>
				</div>
			</div>
		</div>
	</div>
	)
}
