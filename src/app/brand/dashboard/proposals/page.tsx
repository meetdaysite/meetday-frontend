"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"

import { Skeleton } from "@/components/ui/Skeleton"
import {
	getAllPublishedSponsorships,
	getCategories,
	type Category,
	type PublishedSponsorshipProposal,
} from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"
import clsx from "clsx"

function formatDate(value: string | null): string {
	if (!value) return "Date TBD"
	try {
		return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
	} catch {
		return value
	}
}

function formatDateRange(start: string | null, end: string | null): string {
	if (!start) return "Date TBD"
	if (!end || end === start) return formatDate(start)
	return `${formatDate(start)} - ${formatDate(end)}`
}

function CategorySearchDropdown({
	categories,
	selectedId,
	onChange,
}: {
	categories: Category[]
	selectedId: string | null
	onChange: (id: string | null) => void
}) {
	const [isOpen, setIsOpen] = useState(false)
	const [search, setSearch] = useState("")

	const selectedName = selectedId
		? categories.find(c => c.id === selectedId)?.name || "IRL Categories"
		: "IRL Categories"

	const filtered = useMemo(() => {
		const lower = search.toLowerCase()
		return categories.filter(c => c.name.toLowerCase().includes(lower))
	}, [categories, search])

	useEffect(() => {
		if (!isOpen) setSearch("")
	}, [isOpen])

	useEffect(() => {
		if (!isOpen) return
		const handle = () => setIsOpen(false)
		window.addEventListener("click", handle)
		return () => window.removeEventListener("click", handle)
	}, [isOpen])

	return (
		<div className="relative w-full max-w-xs" onClick={e => e.stopPropagation()}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="w-full flex items-center justify-between h-11 px-4 bg-white border-[3px] border-black rounded-[16px] text-sm font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
			>
				<span>{selectedName}</span>
				<svg className={clsx("w-4 h-4 transition-transform", isOpen ? "rotate-180" : "")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			{isOpen && (
				<div className="absolute top-full left-0 right-0 mt-2 bg-white border-[3px] border-black rounded-[16px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-40 overflow-hidden flex flex-col max-h-[300px]">
					{/* Search input */}
					<div className="p-2 border-b-2 border-black bg-slate-50">
						<input
							type="text"
							placeholder="Search categories..."
							value={search}
							onChange={e => setSearch(e.target.value)}
							className="w-full h-8 px-3 rounded-lg border-2 border-black bg-white text-xs font-semibold text-black outline-none"
						/>
					</div>

					{/* Options List */}
					<div className="overflow-y-auto divide-y divide-black/10">
						<button
							type="button"
							onClick={() => {
								onChange(null)
								setIsOpen(false)
							}}
							className={clsx(
								"w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-black/5 transition-colors",
								selectedId === null ? "bg-[#FFC940] text-black" : "text-black"
							)}
						>
							IRL CATEGORIES
						</button>
						{filtered.map(c => (
							<button
								key={c.id}
								type="button"
								onClick={() => {
									onChange(c.id)
									setIsOpen(false)
								}}
								className={clsx(
									"w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-black/5 transition-colors",
									selectedId === c.id ? "bg-[#FFC940] text-black" : "text-black"
								)}
							>
								{c.name.toUpperCase()}
							</button>
						))}
						{filtered.length === 0 && (
							<div className="px-4 py-3 text-xs font-bold text-black/40 text-center">
								No categories found
							</div>
						)}
					</div>
				</div>
			)}
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
			className="group text-left relative cursor-pointer bg-white border-[3px] border-black rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all overflow-hidden flex flex-row w-full h-[150px]"
		>
			{/* Image / Logo */}
			<div className="relative w-[150px] h-full shrink-0 overflow-hidden bg-slate-50 border-r-[3px] border-black rounded-l-[17px]">
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

				{/* Status Badge */}
				<span className="absolute top-2 left-2 text-[7px] font-black px-1.5 py-0.5 border-[2px] border-black rounded-full uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] bg-green-400 text-black">
					Published
				</span>
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

				<div className="flex flex-wrap gap-1.5 mt-2">
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
			</div>
		</button>
	)
}

export default function ProposalsPage() {
	const router = useRouter()

	const [categories, setCategories] = useState<Category[]>([])
	const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
	const [proposals, setProposals] = useState<PublishedSponsorshipProposal[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)


	function handleProposalClick(proposalId: string) {
		router.push(`/brand/dashboard/proposal/${proposalId}`)
	}

	useEffect(() => {
		getCategories()
			.then(setCategories)
			.catch(() => {
				// non-fatal — filters just won't render
			})
	}, [])

	useEffect(() => {
		let cancelled = false
		setIsLoading(true)
		getAllPublishedSponsorships(selectedCategoryId ?? undefined)
			.then((res) => {
				if (!cancelled) setProposals(res.proposals)
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
	}, [selectedCategoryId])

	// Only show category tabs for categories that actually have at least one published proposal,
	// computed from the unfiltered "All" list the first time it loads.
	const categoriesWithProposals = useMemo(() => {
		if (selectedCategoryId !== null) return categories
		const idsInUse = new Set(proposals.flatMap((p) => p.hostProfile?.categories?.map((c) => c.id) ?? []))
		return categories.filter((c) => idsInUse.has(c.id))
	}, [categories, proposals, selectedCategoryId])

	return (
		<div className="flex flex-col min-h-full bg-white">
			{/* Top Nav / Subheader */}
			<div className="flex justify-between items-center px-8 py-4 border-b border-black/10 shrink-0">
				<p className="text-sm font-semibold text-black/50 mx-auto">
					Welcome to <span className="text-[#EE2C2C] font-bold">Meetday</span>
				</p>
			</div>

			<div className="px-4 lg:px-6 py-6 max-w-6xl w-full mx-auto flex-1 flex flex-col gap-6">
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
					<div>
						<h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-black leading-tight">
							Active Proposals
						</h1>
						<p className="text-sm font-semibold text-black/50 mt-2">
							Browse through all partnership proposals published across Meetday.
						</p>
					</div>

					<CategorySearchDropdown
						categories={categories}
						selectedId={selectedCategoryId}
						onChange={setSelectedCategoryId}
					/>
				</div>

				<div className="w-full">
					{isLoading ? (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{Array.from({ length: 6 }).map((_, i) => (
								<Skeleton key={i} className="h-36 border-[3px] border-black rounded-[20px]" />
							))}
						</div>
					) : error ? (
						<p className="text-sm font-bold text-red-600">{error}</p>
					) : proposals.length === 0 ? (
						<p className="text-sm font-bold text-black/50">No sponsorship proposals found for this filter.</p>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{proposals.map((proposal) => (
								<ProposalCard
									key={proposal.id}
									proposal={proposal}
									onClick={() => handleProposalClick(proposal.id)}
								/>
							))}
						</div>
					)}
				</div>
			</div>


		</div>
	)
}
