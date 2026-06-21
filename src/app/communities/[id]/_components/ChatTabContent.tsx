"use client"

import { useState } from "react"
import Image from "next/image"
import { Icon } from "@/components/ui/Icon"
import PlusSvg from "@/icons/outlined/plus.svg"
import DotsSvg from "@/icons/outlined/dots.svg"
import PinSvg from "@/icons/outlined/pin.svg"
import CloseSvg from "@/icons/outlined/close.svg"
import SmileCircleSvg from "@/icons/outlined/smile-circle.svg"
import FileTextSvg from "@/icons/outlined/file-text.svg"
import PlaneSvg from "@/icons/outlined/plane.svg"
import ChatSvg from "@/icons/outlined/chat.svg"
import ArrowRightSvg from "@/icons/outlined/arrow-right.svg"

// ─── Mock data ────────────────────────────────────────────────────────────────

// TODO: Replace with real channels from GET /api/communities/[id]/chat/channels
const CHANNELS = [
	{ id: "general", label: "General" },
	{ id: "introductions", label: "Introductions" },
	{ id: "event-plans", label: "Event Plans" },
	{ id: "recommendations", label: "Recommendations" },
]

// TODO: Replace with real online members from GET /api/communities/[id]/members?status=online
const ONLINE_AVATARS = [
	"https://i.pravatar.cc/40?img=1",
	"https://i.pravatar.cc/40?img=3",
	"https://i.pravatar.cc/40?img=5",
	"https://i.pravatar.cc/40?img=7",
	"https://i.pravatar.cc/40?img=9",
	"https://i.pravatar.cc/40?img=11",
	"https://i.pravatar.cc/40?img=13",
	"https://i.pravatar.cc/40?img=15",
	"https://i.pravatar.cc/40?img=17",
	"https://i.pravatar.cc/40?img=19",
]
const ONLINE_OVERFLOW = 13

// TODO: Replace with real DM list from GET /api/users/me/direct-messages?communityId=[id]
const DIRECT_MESSAGES = [
	{ id: "dm1", name: "Arjun", avatarUrl: "https://i.pravatar.cc/40?img=6", online: true },
	{ id: "dm2", name: "Megha", avatarUrl: "https://i.pravatar.cc/40?img=5", online: true },
	{ id: "dm3", name: "Karan", avatarUrl: "https://i.pravatar.cc/40?img=11", online: false },
]

interface Reaction {
	emoji: string
	count: number
	isChat?: boolean
}

interface ChatMessage {
	id: string
	author: string
	avatarUrl: string
	timeAgo: string
	content: string
	reactions: Reaction[]
	isAdmin?: boolean
	isPinned?: boolean
}

// TODO: Replace with real messages from GET /api/communities/[id]/chat/channels/[channelId]/messages
const MOCK_MESSAGES: ChatMessage[] = [
	{
		id: "m0",
		author: "Meetday Team",
		avatarUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=40&h=40&fit=crop",
		timeAgo: "2d ago",
		content: "Please be respectful to everyone.\nNo spam or promotions. Ask before sharing photos.",
		reactions: [],
		isAdmin: true,
		isPinned: true,
	},
	{
		id: "m1",
		author: "Arjun",
		avatarUrl: "https://i.pravatar.cc/40?img=6",
		timeAgo: "2m ago",
		content: "Anyone attending After Hours this Saturday? 🙌",
		reactions: [{ emoji: "💜", count: 5 }, { emoji: "😆", count: 2 }],
	},
	{
		id: "m2",
		author: "Megha",
		avatarUrl: "https://i.pravatar.cc/40?img=5",
		timeAgo: "5m ago",
		content: "New here 👋 Excited for my first rooftop event!",
		reactions: [{ emoji: "💜", count: 6 }, { emoji: "👋", count: 1 }],
	},
	{
		id: "m3",
		author: "Rishav",
		avatarUrl: "https://i.pravatar.cc/40?img=17",
		timeAgo: "12m ago",
		content: "Any recommendations near Park Street before Night Rituals?",
		reactions: [{ emoji: "💜", count: 3 }, { emoji: "💬", count: 2, isChat: true }],
	},
	{
		id: "m4",
		author: "Karan",
		avatarUrl: "https://i.pravatar.cc/40?img=11",
		timeAgo: "18m ago",
		content: "Looking for 1 ticket for Neon Nights. Let me know if anyone has an extra!",
		reactions: [{ emoji: "💜", count: 2 }],
	},
]

const CHANNEL_META: Record<string, { title: string; subtitle: string }> = {
	general: { title: "General", subtitle: "General discussion for everyone in the community." },
	introductions: { title: "Introductions", subtitle: "Say hi and introduce yourself to the community." },
	"event-plans": { title: "Event Plans", subtitle: "Coordinate and plan upcoming experiences together." },
	recommendations: { title: "Recommendations", subtitle: "Share your favourite spots and suggestions." },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ChatTabContent({ communityName }: { communityName: string }) {
	const [activeChannel, setActiveChannel] = useState("general")
	const [welcomeDismissed, setWelcomeDismissed] = useState(false)

	const meta = CHANNEL_META[activeChannel] ?? CHANNEL_META["general"]

	return (
		<div className="rounded-panel border border-border-default bg-surface-card overflow-hidden flex h-155">
			{/* ── Left sidebar ── */}
			<aside className="w-60 shrink-0 border-r border-border-default flex flex-col bg-surface-page overflow-y-auto no-scrollbar">
				{/* Channels */}
				<div className="p-4">
					<div className="flex items-center justify-between mb-2">
						<span className="text-[10px] font-bold text-text-muted tracking-wider uppercase">
							Channels
						</span>
						{/* TODO: Wire to create-channel flow */}
						<button type="button" className="text-text-muted hover:text-text-primary transition-colors">
							<Icon as={PlusSvg} size="sm" color="muted" />
						</button>
					</div>

					<div className="flex flex-col gap-0.5">
						{CHANNELS.map(ch => {
							const isActive = activeChannel === ch.id
							return (
								<button
									key={ch.id}
									type="button"
									onClick={() => setActiveChannel(ch.id)}
									className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-action text-left transition-colors ${
										isActive
											? "bg-surface-vibe-soft text-violet-600 font-semibold"
											: "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
									}`}
								>
									<span className="flex items-center gap-1.5 text-label-sm">
										<span className="font-medium">#</span>
										{ch.label}
									</span>
									{isActive && (
										<span className="size-2 rounded-full bg-violet-500 shrink-0" />
									)}
								</button>
							)
						})}
					</div>
				</div>

				<div className="border-t border-border-default" />

				{/* Online Now */}
				<div className="p-4">
					<p className="text-[10px] font-bold text-text-muted tracking-wider uppercase mb-3">
						Online now · {ONLINE_AVATARS.length + ONLINE_OVERFLOW}
					</p>
					<div className="flex flex-wrap gap-1.5">
						{ONLINE_AVATARS.map((src, i) => (
							<div key={i} className="relative">
								<div className="relative size-8 rounded-full overflow-hidden border border-surface-card bg-surface-hover">
									<Image src={src} alt="" fill sizes="32px" className="object-cover" />
								</div>
								<span className="absolute bottom-0 right-0 size-2 rounded-full bg-green-500 border border-surface-card" />
							</div>
						))}
						<div className="size-8 rounded-full bg-surface-hover border border-border-default flex items-center justify-center">
							<span className="text-[9px] font-semibold text-text-muted">+{ONLINE_OVERFLOW}</span>
						</div>
					</div>
				</div>

				<div className="border-t border-border-default" />

				{/* Direct Messages */}
				<div className="p-4 flex-1">
					<div className="flex items-center justify-between mb-2">
						<span className="text-[10px] font-bold text-text-muted tracking-wider uppercase">
							Direct Messages
						</span>
						{/* TODO: Wire to start-dm flow */}
						<button type="button" className="text-text-muted hover:text-text-primary transition-colors">
							<Icon as={PlusSvg} size="sm" color="muted" />
						</button>
					</div>

					<div className="flex flex-col gap-1">
						{DIRECT_MESSAGES.map(dm => (
							<button
								key={dm.id}
								type="button"
								className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-action hover:bg-surface-hover transition-colors text-left"
							>
								<div className="relative shrink-0">
									<div className="relative size-7 rounded-full overflow-hidden border border-border-default bg-surface-hover">
										<Image src={dm.avatarUrl} alt={dm.name} fill sizes="28px" className="object-cover" />
									</div>
									{dm.online && (
										<span className="absolute bottom-0 right-0 size-2 rounded-full bg-green-500 border border-surface-card" />
									)}
								</div>
								<span className="text-label-sm text-text-primary font-medium">{dm.name}</span>
							</button>
						))}
					</div>

					{/* TODO: Link to /communities/[id]/chat/dms once page is built */}
					<button
						type="button"
						className="flex items-center gap-1 mt-3 px-2 text-label-sm text-text-brand font-medium hover:underline"
					>
						See all
						<Icon as={ArrowRightSvg} size="xs" color="brand" />
					</button>
				</div>
			</aside>

			{/* ── Right chat panel ── */}
			<div className="flex-1 flex flex-col min-w-0">
				{/* Channel header */}
				<div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-border-default shrink-0">
					<div className="min-w-0">
						<div className="flex items-center gap-1.5">
							<span className="text-text-muted font-medium">#</span>
							<h2 className="text-body-md font-bold text-text-primary">{meta.title}</h2>
						</div>
						<p className="text-[11px] text-text-secondary mt-0.5 truncate">{meta.subtitle}</p>
					</div>
					<div className="flex items-center gap-2 shrink-0">
						{/* TODO: Wire pin to show pinned messages panel */}
						<button type="button" className="text-text-muted hover:text-text-primary transition-colors p-1">
							<Icon as={PinSvg} size="sm" color="muted" />
						</button>
						{/* TODO: Wire to channel settings/options menu */}
						<button type="button" className="text-text-muted hover:text-text-primary transition-colors p-1">
							<Icon as={DotsSvg} size="sm" color="muted" />
						</button>
					</div>
				</div>

				{/* Message list */}
				<div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 flex flex-col gap-1">
					{/* Welcome banner */}
					{!welcomeDismissed && (
						<div className="flex items-start justify-between gap-3 px-4 py-3 rounded-action bg-surface-vibe-soft border border-purple-100 mb-3">
							<p className="text-label-sm text-text-primary font-normal leading-snug">
								<span className="mr-1">👋</span>
								<span className="font-bold">Welcome to {communityName}!</span>
								<span className="text-text-secondary ml-1">
									Introduce yourself, ask questions, and meet people attending upcoming experiences.
								</span>
							</p>
							<button
								type="button"
								onClick={() => setWelcomeDismissed(true)}
								className="text-text-muted hover:text-text-primary transition-colors shrink-0 mt-0.5"
							>
								<Icon as={CloseSvg} size="sm" color="muted" />
							</button>
						</div>
					)}

					{/* Messages */}
					<div className="flex flex-col gap-4">
						{MOCK_MESSAGES.map(msg => (
							<div
								key={msg.id}
								className={`flex gap-3 ${msg.isPinned ? "p-3 rounded-action bg-surface-vibe-soft border border-purple-100" : ""}`}
							>
								{/* Avatar */}
								<div className={`relative shrink-0 rounded-full overflow-hidden border border-border-default bg-surface-hover ${msg.isAdmin ? "size-10" : "size-9"}`}>
									<Image
										src={msg.avatarUrl}
										alt={msg.author}
										fill
										sizes="40px"
										className="object-cover"
									/>
								</div>

								{/* Content */}
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 flex-wrap">
										<span className="text-label-sm font-bold text-text-primary">{msg.author}</span>
										{msg.isAdmin && (
											<span className="text-[10px] font-semibold text-text-secondary bg-surface-hover border border-border-default rounded-avatar px-1.5 py-0.5">
												ADMIN
											</span>
										)}
										{msg.isPinned && (
											<span className="text-[10px] font-semibold text-text-info bg-surface-info-soft border border-blue-200 rounded-avatar px-1.5 py-0.5">
												Pinned
											</span>
										)}
										<span className="text-[11px] text-text-muted">{msg.timeAgo}</span>
									</div>

									<p className="text-label-sm text-text-primary font-normal mt-0.5 leading-relaxed whitespace-pre-line">
										{msg.content}
									</p>

									{msg.reactions.length > 0 && (
										<div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
											{msg.reactions.map((r, i) =>
												r.isChat ? (
													<button
														key={i}
														type="button"
														className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-page border border-border-default text-[11px] text-text-secondary hover:bg-surface-hover transition-colors"
													>
														<Icon as={ChatSvg} size="xs" color="secondary" />
														{r.count}
													</button>
												) : (
													<button
														key={i}
														type="button"
														className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-page border border-border-default text-[11px] text-text-secondary hover:bg-surface-hover transition-colors"
													>
														{r.emoji} {r.count}
													</button>
												)
											)}
										</div>
									)}
								</div>

								{/* Pin icon for admin message */}
								{msg.isPinned && (
									<div className="shrink-0">
										<Icon as={PinSvg} size="sm" color="vibe" />
									</div>
								)}
							</div>
						))}
					</div>
				</div>

				{/* Message input */}
				<div className="px-5 py-3.5 border-t border-border-default shrink-0">
					<div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-surface-page border border-border-default">
						<input
							type="text"
							placeholder="Say hello to the community..."
							className="flex-1 text-label-sm text-text-primary placeholder:text-text-muted bg-transparent outline-none"
							// TODO: Wire to POST /api/communities/[id]/chat/channels/[channelId]/messages
							readOnly
						/>
						<div className="flex items-center gap-2 shrink-0">
							{/* TODO: Wire emoji picker */}
							<button type="button" className="text-text-muted hover:text-text-primary transition-colors">
								<Icon as={SmileCircleSvg} size="sm" color="muted" />
							</button>
							{/* TODO: Wire file attachment */}
							<button type="button" className="text-text-muted hover:text-text-primary transition-colors">
								<Icon as={FileTextSvg} size="sm" color="muted" />
							</button>
						</div>
						{/* TODO: Wire send message action */}
						<button
							type="button"
							className="size-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0 hover:bg-violet-700 transition-colors"
						>
							<Icon as={PlaneSvg} size="sm" color="inverse" />
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
