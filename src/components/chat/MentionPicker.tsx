"use client"

import React, { useEffect, useState } from "react"
import { clsx } from "clsx"

export type MentionSuggestion = {
	id: string
	name: string
	tag: string
	role?: string
	avatarUrl?: string | null
}

interface MentionPickerProps {
	suggestions: MentionSuggestion[]
	query: string
	isOpen: boolean
	onSelect: (tag: string) => void
	onClose: () => void
}

export function MentionPicker({ suggestions, query, isOpen, onSelect, onClose }: MentionPickerProps) {
	const [selectedIndex, setSelectedIndex] = useState(0)

	const filtered = suggestions.filter(s =>
		s.name.toLowerCase().includes(query.toLowerCase()) ||
		s.tag.toLowerCase().includes(query.toLowerCase()) ||
		(s.role && s.role.toLowerCase().includes(query.toLowerCase()))
	)

	useEffect(() => {
		setSelectedIndex(0)
	}, [query])

	useEffect(() => {
		if (!isOpen) return

		function handleKeyDown(e: KeyboardEvent) {
			if (!isOpen || filtered.length === 0) return

			if (e.key === "ArrowDown") {
				e.preventDefault()
				setSelectedIndex(prev => (prev + 1) % filtered.length)
			} else if (e.key === "ArrowUp") {
				e.preventDefault()
				setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length)
			} else if (e.key === "Enter" || e.key === "Tab") {
				if (filtered[selectedIndex]) {
					e.preventDefault()
					onSelect(filtered[selectedIndex].tag)
				}
			} else if (e.key === "Escape") {
				e.preventDefault()
				onClose()
			}
		}

		window.addEventListener("keydown", handleKeyDown, true)
		return () => window.removeEventListener("keydown", handleKeyDown, true)
	}, [isOpen, filtered, selectedIndex, onSelect, onClose])

	if (!isOpen || filtered.length === 0) return null

	return (
		<div className="absolute bottom-full left-2 sm:left-4 mb-2 z-50 w-64 sm:w-72 bg-white rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
			<div className="px-3 py-1.5 bg-neutral-100 border-b-2 border-black flex items-center justify-between">
				<span className="text-[10px] font-black uppercase tracking-wider text-black/50">Tag a participant</span>
				<span className="text-[9px] font-bold text-black/40">↑↓ to navigate • ↵ to select</span>
			</div>
			<div className="max-h-48 overflow-y-auto py-1 divide-y divide-black/5">
				{filtered.map((item, idx) => {
					const isSelected = idx === selectedIndex
					return (
						<button
							key={item.id}
							type="button"
							onMouseDown={(e) => {
								e.preventDefault()
								onSelect(item.tag)
							}}
							onMouseEnter={() => setSelectedIndex(idx)}
							className={clsx(
								"w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors cursor-pointer",
								isSelected ? "bg-[#FFC940]/30 font-bold" : "hover:bg-neutral-50"
							)}
						>
							<div className="size-7 rounded-full border border-black/15 overflow-hidden bg-neutral-100 flex items-center justify-center shrink-0">
								{item.avatarUrl ? (
									<img src={item.avatarUrl} alt={item.name} className="w-full h-full object-cover" />
								) : (
									<span className="text-[10px] font-black text-black/60">
										{item.name.charAt(0).toUpperCase()}
									</span>
								)}
							</div>
							<div className="flex-1 min-w-0">
								<div className="flex items-center justify-between gap-1">
									<p className="text-xs font-black text-black truncate">{item.name}</p>
									{item.role && (
										<span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-black/5 text-black/50 shrink-0">
											{item.role}
										</span>
									)}
								</div>
								<p className="text-[10px] font-semibold text-[#EE2C2C] truncate">@{item.tag}</p>
							</div>
						</button>
					)
				})}
			</div>
		</div>
	)
}
