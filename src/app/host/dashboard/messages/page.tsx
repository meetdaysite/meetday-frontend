"use client"

import { useState, useRef, useEffect } from "react"
import clsx from "clsx"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import { MOCK_CONVERSATIONS, type Conversation, type ChatMessage } from "@/lib/mock-messages"
import PlaneSvg from "@/icons/outlined/plane.svg"

// ─── Avatar helpers ───────────────────────────────────────────────────────────

const AVATAR_COLORS = [
	"bg-red-100 text-red-700",
	"bg-orange-100 text-orange-700",
	"bg-amber-100 text-amber-700",
	"bg-emerald-100 text-emerald-700",
	"bg-cyan-100 text-cyan-700",
	"bg-blue-100 text-blue-700",
	"bg-violet-100 text-violet-700",
	"bg-pink-100 text-pink-700",
]

function avatarColor(name: string): string {
	let hash = 0
	for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
	return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function initials(name: string): string {
	return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
	// TODO(sockets): replace with real conversation list from API/socket subscription
	const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS)
	const [activeId, setActiveId] = useState<string>(MOCK_CONVERSATIONS[0].id)
	const [draft, setDraft] = useState("")
	const messagesEndRef = useRef<HTMLDivElement>(null)

	const active = conversations.find(c => c.id === activeId) ?? conversations[0]

	// Scroll to bottom when active conversation or messages change
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [activeId, active.messages.length])

	function selectConversation(id: string) {
		// TODO(sockets): mark messages as read via API
		setConversations(prev =>
			prev.map(c => c.id === id ? { ...c, unread: 0 } : c),
		)
		setActiveId(id)
		setDraft("")
	}

	function sendMessage() {
		const text = draft.trim()
		if (!text) return

		// TODO(sockets): emit message via socket instead of local state update
		const newMsg: ChatMessage = {
			id: `local-${Date.now()}`,
			from: "host",
			text,
			time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
		}

		setConversations(prev =>
			prev.map(c =>
				c.id === activeId
					? { ...c, messages: [...c.messages, newMsg], lastMessage: text, timeAgo: "Just now" }
					: c,
			),
		)
		setDraft("")
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault()
			sendMessage()
		}
	}

	return (
		<div className="flex flex-col flex-1 min-h-0">
			<DashboardTopBar />

			<div className="flex flex-1 min-h-0 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 bg-surface-page gap-4">
				{/* Header — sits above the two-panel layout on mobile */}
				<div className="hidden">
					<h1 className="text-heading-sm font-semibold text-text-primary">Messages</h1>
				</div>

				{/* Two-panel layout */}
				<div className="flex flex-1 min-h-0 bg-surface-card border border-border-default rounded-action overflow-hidden">

					{/* ── Left: conversation list ── */}
					<aside className="w-72 shrink-0 flex flex-col border-r border-border-default">
						<div className="px-4 py-3 border-b border-border-default">
							<h1 className="text-heading-sm font-semibold text-text-primary">Messages</h1>
							<p className="text-caption text-text-muted mt-0.5">Communicate with your attendees</p>
						</div>

						<p className="px-4 pt-3 pb-1 text-caption text-text-muted">
							{conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
						</p>

						<ul className="flex-1 overflow-y-auto px-2 pb-2">
							{conversations.map(conv => (
								<ConversationItem
									key={conv.id}
									conv={conv}
									isActive={conv.id === activeId}
									onClick={() => selectConversation(conv.id)}
								/>
							))}
						</ul>
					</aside>

					{/* ── Right: chat area ── */}
					<div className="flex flex-col flex-1 min-w-0">
						{/* Chat header */}
						<div className="flex items-center gap-3 px-5 py-3.5 border-b border-border-default shrink-0">
							<div className={clsx("size-9 rounded-full flex items-center justify-center text-label-sm font-semibold shrink-0", avatarColor(active.attendeeName))}>
								{initials(active.attendeeName)}
							</div>
							<div className="min-w-0">
								<p className="text-label-md font-semibold text-text-primary truncate">{active.attendeeName}</p>
								<p className="text-caption text-text-muted truncate">{active.eventTitle}</p>
							</div>
						</div>

						{/* Messages */}
						<div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-3">
							{active.messages.map(msg => (
								<MessageBubble key={msg.id} msg={msg} />
							))}
							<div ref={messagesEndRef} />
						</div>

						{/* Input */}
						<div className="shrink-0 px-4 py-4 border-t border-border-default">
							<div className="flex items-center gap-3 bg-surface-page border border-border-default rounded-full px-4 h-12 focus-within:border-border-focused transition-colors">
								<input
									type="text"
									value={draft}
									onChange={e => setDraft(e.target.value)}
									onKeyDown={handleKeyDown}
									placeholder="Type a message..."
									className="flex-1 min-w-0 bg-transparent text-body-sm text-text-primary placeholder:text-text-muted outline-none"
								/>
								<button
									onClick={sendMessage}
									disabled={!draft.trim()}
									aria-label="Send message"
									className={clsx(
										"size-9 rounded-full flex items-center justify-center shrink-0 transition-colors",
										draft.trim()
											? "bg-action-primary hover:bg-action-primary-hover text-white"
											: "bg-surface-card-muted text-text-muted cursor-not-allowed",
									)}
								>
									<PlaneSvg className="size-4" aria-hidden />
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

// ─── Conversation item ────────────────────────────────────────────────────────

function ConversationItem({
	conv,
	isActive,
	onClick,
}: {
	conv: Conversation
	isActive: boolean
	onClick: () => void
}) {
	return (
		<li>
			<button
				onClick={onClick}
				className={clsx(
					"w-full flex items-center gap-3 px-3 py-3 rounded-action text-left transition-colors",
					isActive ? "bg-surface-brand-soft" : "hover:bg-surface-card-muted",
				)}
			>
				<div className={clsx("size-9 rounded-full flex items-center justify-center text-label-sm font-semibold shrink-0", avatarColor(conv.attendeeName))}>
					{initials(conv.attendeeName)}
				</div>

				<div className="flex-1 min-w-0">
					<div className="flex items-baseline justify-between gap-1">
						<span className="text-label-sm font-semibold text-text-primary truncate">{conv.attendeeName}</span>
						<span className="text-caption text-text-muted shrink-0">{conv.timeAgo}</span>
					</div>
					<p className="text-caption text-text-muted truncate mt-0.5">{conv.lastMessage}</p>
				</div>

				{conv.unread > 0 && (
					<span className="size-5 rounded-full bg-action-primary text-white text-[10px] font-semibold flex items-center justify-center shrink-0">
						{conv.unread}
					</span>
				)}
			</button>
		</li>
	)
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
	const isHost = msg.from === "host"

	return (
		<div className={clsx("flex", isHost ? "justify-end" : "justify-start")}>
			<div
				className={clsx(
					"max-w-sm px-4 py-3 rounded-2xl text-body-sm",
					isHost
						? "bg-action-primary text-white rounded-br-sm"
						: "bg-surface-card-muted text-text-primary rounded-bl-sm",
				)}
			>
				<p className="leading-snug">{msg.text}</p>
				<p className={clsx(
					"text-[10px] mt-1.5",
					isHost ? "text-white/60 text-right" : "text-text-muted",
				)}>
					{msg.time}
				</p>
			</div>
		</div>
	)
}
