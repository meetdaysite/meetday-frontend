"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import clsx from "clsx"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import {
	getMySponsorshipChats,
	getSponsorshipChatMessages,
	sendSponsorshipChatMessage,
	type SponsorshipChatThread,
	type SponsorshipChatMessage,
} from "@/lib/api"

const POLL_MS = 4000

type Tab = "ALL" | "ACCEPTED"

function timeAgo(iso: string | null) {
	if (!iso) return ""
	const diffMs = Date.now() - new Date(iso).getTime()
	const mins = Math.floor(diffMs / 60000)
	if (mins < 1) return "now"
	if (mins < 60) return `${mins}m`
	const hours = Math.floor(mins / 60)
	if (hours < 24) return `${hours}h`
	return `${Math.floor(hours / 24)}d`
}

export default function BrandChatsPage() {
	const [tab, setTab] = useState<Tab>("ALL")
	const [threads, setThreads] = useState<SponsorshipChatThread[]>([])
	const [loadingThreads, setLoadingThreads] = useState(true)
	const [selectedId, setSelectedId] = useState<string | null>(null)

	const loadThreads = useCallback(async (t: Tab) => {
		try {
			const data = await getMySponsorshipChats(t === "ACCEPTED" ? "ACCEPTED" : undefined)
			setThreads(data)
		} catch {
			// silent — polling refresh
		} finally {
			setLoadingThreads(false)
		}
	}, [])

	useEffect(() => {
		// Fetch immediately, then poll — intentional fetch-on-mount + interval pattern.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		loadThreads(tab)
		const interval = setInterval(() => loadThreads(tab), POLL_MS * 2)
		return () => clearInterval(interval)
	}, [tab, loadThreads])

	function handleTabChange(t: Tab) {
		setTab(t)
		setSelectedId(null)
		setLoadingThreads(true)
	}

	const selectedThread = threads.find(t => t.id === selectedId) ?? null

	return (
		<div className="flex flex-col flex-1 min-h-0 bg-white">
			<div className="flex justify-between items-center px-8 py-4 border-b border-black/10 shrink-0">
				<p className="text-sm font-semibold text-black/50 mx-auto">
					Welcome to <span className="text-[#EE2C2C] font-bold">Meetday</span>
				</p>
			</div>

			<div className="flex-1 min-h-0 px-6 lg:px-8 py-6 max-w-6xl w-full mx-auto flex flex-col gap-4">
				<div>
					<h1 className="text-3xl font-heading font-black text-black">Chats</h1>
					<p className="text-sm font-semibold text-black/50 mt-1">Talk to communities you&apos;ve expressed interest in.</p>
				</div>

				<div className="flex-1 min-h-0 border-[3px] border-black rounded-[24px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col sm:flex-row bg-white">
					{/* Thread list */}
					<div className="w-full sm:w-72 shrink-0 border-b-[3px] sm:border-b-0 sm:border-r-[3px] border-black flex flex-col">
						<div className="flex border-b-[3px] border-black">
							{(["ALL", "ACCEPTED"] as Tab[]).map(t => (
								<button
									key={t}
									onClick={() => handleTabChange(t)}
									className={clsx(
										"flex-1 py-3 text-xs font-black uppercase tracking-wider transition-colors",
										tab === t ? "bg-[#EE2C2C] text-white" : "bg-white text-black/50 hover:bg-neutral-50",
									)}
								>
									{t === "ALL" ? "General" : "Accepted"}
								</button>
							))}
						</div>
						<div className="flex-1 overflow-y-auto">
							{loadingThreads ? (
								<p className="text-xs font-semibold text-black/40 text-center py-8">Loading…</p>
							) : threads.length === 0 ? (
								<p className="text-xs font-semibold text-black/40 text-center py-8 px-4">
									{tab === "ACCEPTED" ? "No accepted chats yet." : "Express interest in a proposal to start a chat."}
								</p>
							) : (
								threads.map(t => (
									<button
										key={t.id}
										onClick={() => setSelectedId(t.id)}
										className={clsx(
											"w-full text-left px-4 py-3 border-b border-black/10 transition-colors",
											selectedId === t.id ? "bg-[#FFC940]/20" : "hover:bg-neutral-50",
										)}
									>
										<div className="flex items-center justify-between gap-2">
											<p className="text-sm font-black text-black truncate">{t.counterpartName}</p>
											<span className="text-[10px] font-semibold text-black/30 shrink-0">{timeAgo(t.lastMessageAt ?? t.createdAt)}</span>
										</div>
										<p className="text-[11px] font-semibold text-black/50 truncate mt-0.5">{t.proposalName}</p>
										<p className={clsx("text-[11px] font-bold mt-1", t.chatStatus === "REQUESTED" ? "text-black/40" : "text-black/40")}>
											{t.chatStatus === "REQUESTED" ? "Waiting for acceptance…" : (t.lastMessagePreview ?? "Chat open")}
										</p>
									</button>
								))
							)}
						</div>
					</div>

					{/* Thread detail */}
					<div className="flex-1 min-h-0 flex flex-col">
						{!selectedThread ? (
							<div className="flex-1 flex items-center justify-center text-sm font-semibold text-black/30">
								Select a chat to view
							</div>
						) : (
							<BrandChatThreadPanel key={selectedThread.id} thread={selectedThread} />
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

function BrandChatThreadPanel({ thread }: { thread: SponsorshipChatThread }) {
	const [messages, setMessages] = useState<SponsorshipChatMessage[]>([])
	const [loading, setLoading] = useState(true)
	const [input, setInput] = useState("")
	const [sending, setSending] = useState(false)
	const bottomRef = useRef<HTMLDivElement>(null)

	const load = useCallback(async () => {
		try {
			const res = await getSponsorshipChatMessages(thread.id)
			setMessages(res.messages)
		} catch {
			// silent on poll
		} finally {
			setLoading(false)
		}
	}, [thread.id])

	useEffect(() => {
		// Fetch immediately, then poll — intentional fetch-on-mount + interval pattern.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		load()
		const interval = setInterval(load, POLL_MS)
		return () => clearInterval(interval)
	}, [load])

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [messages.length])

	async function handleSend() {
		if (!input.trim()) return
		setSending(true)
		try {
			const msg = await sendSponsorshipChatMessage(thread.id, input.trim())
			setMessages(prev => [...prev, msg])
			setInput("")
		} catch {
			toast.error("Failed to send message.")
		} finally {
			setSending(false)
		}
	}

	function labelFor(senderType: SponsorshipChatMessage["senderType"]) {
		if (senderType === "BRAND") return "Brand"
		if (senderType === "HOST") return "Community"
		return "Meetday"
	}

	return (
		<div className="flex-1 min-h-0 flex flex-col">
			<div className="px-5 py-3 border-b-[3px] border-black shrink-0">
				<p className="text-sm font-black text-black truncate">{thread.counterpartName}</p>
				<p className="text-[11px] font-semibold text-black/40 truncate">{thread.proposalName}</p>
			</div>

			<div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
				{loading ? (
					<p className="text-xs font-semibold text-black/40 text-center">Loading…</p>
				) : thread.chatStatus === "REQUESTED" ? (
					<div className="m-auto text-center max-w-xs">
						<p className="text-sm font-black text-black">Request sent</p>
						<p className="text-xs font-semibold text-black/50 mt-2">
							Waiting for the community to accept your interest before you can chat.
						</p>
					</div>
				) : messages.length === 0 ? (
					<p className="text-xs font-semibold text-black/40 text-center m-auto">No messages yet — say hi!</p>
				) : (
					messages.map(m => {
						const isMine = m.senderType === "BRAND"
						return (
							<div key={m.id} className={clsx("flex flex-col max-w-[75%]", isMine ? "self-end items-end" : "self-start items-start")}>
								<span className="text-[10px] font-black uppercase tracking-wide text-black/30 mb-0.5 px-1">
									{labelFor(m.senderType)}
								</span>
								<div
									className={clsx(
										"px-3.5 py-2 rounded-2xl text-sm font-semibold break-words",
										isMine ? "bg-[#EE2C2C] text-white rounded-br-sm" : "bg-neutral-100 text-black rounded-bl-sm",
									)}
								>
									{m.content}
								</div>
							</div>
						)
					})
				)}
				<div ref={bottomRef} />
			</div>

			{thread.chatStatus === "ACCEPTED" && (
				<div className="p-3 border-t-[3px] border-black flex items-center gap-2 shrink-0">
					<input
						value={input}
						onChange={e => setInput(e.target.value)}
						onKeyDown={e => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault()
								handleSend()
							}
						}}
						placeholder="Write a message…"
						className="flex-1 rounded-2xl border-[3px] border-black bg-white px-4 py-2 text-sm font-semibold outline-none focus:bg-neutral-50"
					/>
					<Button onClick={handleSend} disabled={sending || !input.trim()}>
						{sending ? "…" : "Send"}
					</Button>
				</div>
			)}
		</div>
	)
}
