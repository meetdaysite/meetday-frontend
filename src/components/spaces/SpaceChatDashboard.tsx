"use client"

import { useEffect, useRef, useState } from "react"
import {
	acceptSpaceChatRequest,
	declineSpaceChatRequest,
	getMySpaceChats,
	getSpaceChatMessages,
	sendSpaceChatMessage,
	type SpaceChatMessage,
	type SpaceChatRole,
	type SpaceChatThread,
} from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"
import { toast } from "@/lib/toast"
import clsx from "clsx"

const THREADS_POLL_MS = 8000
const MESSAGES_POLL_MS = 4000

function timeAgo(iso: string | null): string {
	if (!iso) return ""
	const diffMs = Date.now() - new Date(iso).getTime()
	const mins = Math.floor(diffMs / 60000)
	if (mins < 1) return "now"
	if (mins < 60) return `${mins}m`
	const hours = Math.floor(mins / 60)
	if (hours < 24) return `${hours}h`
	return `${Math.floor(hours / 24)}d`
}

export type SpaceChatTabDef = {
	key: string
	label: string
	filter: (t: SpaceChatThread) => boolean
}

export type SpaceChatDashboardProps = {
	role: SpaceChatRole
	tabs?: SpaceChatTabDef[]
	// Only the space partner side can accept/decline pending requests.
	canRespond?: boolean
	emptyLabel?: string
	defaultCategory?: "COMMUNITY" | "BRAND"
	category?: "COMMUNITY" | "BRAND"
}

// Shared chat surface for Community Space interest requests — reused (with a different `role` +
// `tabs` config) by the Brand dashboard, Community dashboard, and Space Partner dashboard.
export function SpaceChatDashboard({ role, tabs, canRespond, emptyLabel, defaultCategory = "COMMUNITY", category: controlledCategory }: SpaceChatDashboardProps) {
	const [threads, setThreads] = useState<SpaceChatThread[]>([])
	const [category, setCategory] = useState<"COMMUNITY" | "BRAND">(controlledCategory ?? defaultCategory)
	const [subTab, setSubTab] = useState<"ACCEPTED" | "REQUESTED">("ACCEPTED")
	const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
	const [messages, setMessages] = useState<SpaceChatMessage[]>([])
	const [messageInput, setMessageInput] = useState("")
	const [sending, setSending] = useState(false)
	const [respondingId, setRespondingId] = useState<string | null>(null)
	const messagesEndRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		setCategory(controlledCategory ?? defaultCategory)
		setSelectedThreadId(null)
	}, [controlledCategory, defaultCategory])

	useEffect(() => {
		let cancelled = false
		function poll() {
			getMySpaceChats(undefined, role)
				.then((data) => {
					if (!cancelled) setThreads(data)
				})
				.catch(() => {})
		}
		poll()
		const id = setInterval(poll, THREADS_POLL_MS)
		return () => {
			cancelled = true
			clearInterval(id)
		}
	}, [role])

	useEffect(() => {
		if (!selectedThreadId) return
		let cancelled = false
		function poll() {
			getSpaceChatMessages(selectedThreadId!, role)
				.then((data) => {
					if (!cancelled) setMessages(data.messages)
				})
				.catch(() => {})
		}
		poll()
		const id = setInterval(poll, MESSAGES_POLL_MS)
		return () => {
			cancelled = true
			clearInterval(id)
		}
	}, [selectedThreadId, role])

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [messages])

	useEffect(() => {
		if (selectedThreadId) {
			setThreads(prev => prev.map(t => (t.id === selectedThreadId ? { ...t, unreadCount: 0 } : t)))
		}
	}, [selectedThreadId])

	const selectedThread = threads.find((t) => t.id === selectedThreadId) ?? null

	const currentUnreadAccepted = role === "SPACE"
		? threads.filter((t) => t.requesterType === category && t.chatStatus === "ACCEPTED").reduce((sum, t) => sum + (selectedThreadId === t.id ? 0 : t.unreadCount || 0), 0)
		: threads.filter(t => t.chatStatus === "ACCEPTED").reduce((sum, t) => sum + (selectedThreadId === t.id ? 0 : t.unreadCount || 0), 0)

	const currentUnreadRequested = role === "SPACE"
		? threads.filter((t) => t.requesterType === category && t.chatStatus === "REQUESTED").reduce((sum, t) => sum + (selectedThreadId === t.id ? 0 : t.unreadCount || 0), 0)
		: threads.filter(t => t.chatStatus === "REQUESTED").reduce((sum, t) => sum + (selectedThreadId === t.id ? 0 : t.unreadCount || 0), 0)

	// Filter visible threads based on active category and sub-tab
	const visibleThreads = threads.filter((t) => {
		if (role === "SPACE") {
			if (t.requesterType !== category) return false
		}
		return t.chatStatus === subTab
	})

	async function handleSend() {
		if (!selectedThreadId || !messageInput.trim() || sending) return
		setSending(true)
		try {
			await sendSpaceChatMessage(selectedThreadId, { content: messageInput.trim() })
			setMessageInput("")
			const data = await getSpaceChatMessages(selectedThreadId, role)
			setMessages(data.messages)
		} catch (e) {
			toast.error(getApiErrorMessage(e))
		} finally {
			setSending(false)
		}
	}

	async function handleAccept(threadId: string) {
		setRespondingId(threadId)
		try {
			await acceptSpaceChatRequest(threadId)
			const data = await getMySpaceChats(undefined, role)
			setThreads(data)
			toast.success("Request accepted — chat is now open.")
		} catch (e) {
			toast.error(getApiErrorMessage(e))
		} finally {
			setRespondingId(null)
		}
	}

	async function handleDecline(threadId: string) {
		setRespondingId(threadId)
		try {
			await declineSpaceChatRequest(threadId)
			const data = await getMySpaceChats(undefined, role)
			setThreads(data)
			if (selectedThreadId === threadId) setSelectedThreadId(null)
		} catch (e) {
			toast.error(getApiErrorMessage(e))
		} finally {
			setRespondingId(null)
		}
	}

	return (
		<div className="flex flex-col flex-1 min-h-0 w-full">
			<div className="h-[calc(100vh-240px)] border-[3px] border-black rounded-[24px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col sm:flex-row bg-white min-h-0">
				{/* Thread list */}
				<div className={clsx(
					"w-full sm:w-80 md:w-80 shrink-0 sm:min-w-[320px] sm:max-w-[320px] border-b-[3px] sm:border-b-0 sm:border-r-[3px] border-black flex flex-col",
					selectedThreadId ? "hidden sm:flex" : "flex"
				)}>
					{/* Segregation Tabs (Accepted vs Requests) */}
					<div className="flex border-b-[3px] border-black shrink-0">
						{(["ACCEPTED", "REQUESTED"] as const).map((tab) => {
							const isReq = tab === "REQUESTED"
							const count = isReq ? currentUnreadRequested : currentUnreadAccepted
							const isActive = subTab === tab
							return (
								<button
									key={tab}
									type="button"
									onClick={() => {
										setSubTab(tab)
										setSelectedThreadId(null)
									}}
									className={clsx(
										"flex-grow py-3 text-xs font-black uppercase tracking-wider transition-colors relative flex items-center justify-center gap-1.5",
										isActive ? "bg-[#EE2C2C] text-white" : "bg-white text-black/50 hover:bg-neutral-50",
									)}
								>
									<span>{isReq ? (canRespond ? "Requests" : "Sent Requests") : "Accepted"}</span>
									{count > 0 && (
										<span className={clsx(
											"min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-black flex items-center justify-center border",
											isActive ? "bg-white text-[#EE2C2C] border-transparent" : "bg-[#FFC940] text-black border-black/10"
										)}>
											{count}
										</span>
									)}
								</button>
							)
						})}
					</div>

					<div className="flex-1 overflow-y-auto">
						{visibleThreads.length === 0 ? (
							<p className="text-xs font-semibold text-black/40 text-center py-8 px-4">
								{subTab === "ACCEPTED"
									? (role === "SPACE"
										? (category === "COMMUNITY" ? "No accepted community chats yet." : "No accepted brand chats yet.")
										: "No accepted chats yet.")
									: (role === "SPACE"
										? (category === "COMMUNITY" ? "No pending community requests." : "No pending brand requests.")
										: "No pending requests.")}
							</p>
						) : (
							visibleThreads.map((t) => (
								<button
									key={t.id}
									type="button"
									onClick={() => setSelectedThreadId(t.id)}
									className={clsx(
										"w-full text-left px-4 py-3 border-b border-black/10 transition-colors flex items-center gap-3",
										selectedThreadId === t.id ? "bg-[#FFC940]/20" : "hover:bg-neutral-50",
									)}
								>
									<div className="relative shrink-0">
										<div className="w-10 h-10 rounded-full border border-black/15 overflow-hidden bg-neutral-100 flex items-center justify-center">
											{t.counterpartAvatarUrl ? (
												<img
													src={t.counterpartAvatarUrl}
													alt={t.counterpartName}
													className="w-full h-full object-cover"
												/>
											) : (
												<span className="font-heading font-black text-sm text-black/60">
													{t.counterpartName.charAt(0).toUpperCase()}
												</span>
											)}
										</div>
										{t.unreadCount > 0 && (
											<span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#EE2C2C] text-white text-[9px] font-black flex items-center justify-center border-2 border-white shadow-sm">
												{t.unreadCount > 9 ? "9+" : t.unreadCount}
											</span>
										)}
									</div>

									<div className="flex-1 min-w-0">
										<div className="flex items-center justify-between gap-2">
											<p className="text-sm font-black text-black truncate">{t.counterpartName}</p>
											<span className="text-[10px] font-semibold text-black/30 shrink-0">{timeAgo(t.lastMessageAt || t.createdAt)}</span>
										</div>
										<p className="text-[11px] font-semibold text-black/40 truncate mt-0.5">{t.lastMessagePreview || "No messages yet"}</p>
										{t.chatStatus === "REQUESTED" && canRespond && (
											<div className="flex items-center gap-1.5 mt-1.5">
												<button
													type="button"
													disabled={respondingId === t.id}
													onClick={(e) => {
														e.stopPropagation()
														handleAccept(t.id)
													}}
													className="px-2.5 py-1 rounded-xl bg-[#22C55E] hover:bg-[#1ea750] text-white font-black text-[10px] uppercase border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
												>
													Accept
												</button>
												<button
													type="button"
													disabled={respondingId === t.id}
													onClick={(e) => {
														e.stopPropagation()
														handleDecline(t.id)
													}}
													className="px-2.5 py-1 rounded-xl bg-white hover:bg-neutral-50 text-black font-black text-[10px] uppercase border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
												>
													Decline
												</button>
											</div>
										)}
										{t.chatStatus === "REQUESTED" && !canRespond && (
											<span className="text-[10px] font-black uppercase text-black/40 mt-1 block">Awaiting response</span>
										)}
										{t.chatStatus === "DECLINED" && <span className="text-[10px] font-black uppercase text-red-500 mt-1 block">Declined</span>}
									</div>
								</button>
							))
						)}
					</div>
				</div>

				{/* Message view */}
				<div className={clsx(
					"flex-1 min-w-0 min-h-0 flex flex-col bg-white",
					selectedThreadId ? "flex" : "hidden sm:flex"
				)}>
					{!selectedThread ? (
						<div className="flex-1 flex items-center justify-center text-sm font-semibold text-black/30">Select a chat to view messages</div>
					) : (
						<>
							<div className="px-3 sm:px-5 py-2.5 sm:py-3 border-b-[3px] border-black bg-white flex items-center justify-between shrink-0 gap-2">
								<div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
									<button
										type="button"
										onClick={() => setSelectedThreadId(null)}
										className="sm:hidden p-1.5 -ml-1 text-black/70 hover:text-black hover:bg-neutral-100 rounded-full shrink-0 transition-colors"
										aria-label="Back to chat list"
									>
										<svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
											<path d="m15 18-6-6 6-6"/>
										</svg>
									</button>
									<div className="w-8 h-8 rounded-full border border-black/15 overflow-hidden shrink-0 relative bg-neutral-100 flex items-center justify-center">
										{selectedThread.counterpartAvatarUrl ? (
											<img
												src={selectedThread.counterpartAvatarUrl}
												alt={selectedThread.counterpartName}
												className="w-full h-full object-cover"
											/>
										) : (
											<span className="font-heading font-black text-xs text-black/60">
												{selectedThread.counterpartName.charAt(0).toUpperCase()}
											</span>
										)}
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-xs sm:text-sm font-black text-black truncate leading-tight">{selectedThread.counterpartName}</p>
									</div>
								</div>
								{selectedThread.chatStatus === "REQUESTED" && canRespond && (
									<div className="flex items-center gap-1.5">
										<button
											type="button"
											onClick={() => handleAccept(selectedThread.id)}
											className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#22C55E] hover:bg-[#1ea750] text-white font-black text-xs border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer select-none"
										>
											Accept
										</button>
										<button
											type="button"
											onClick={() => handleDecline(selectedThread.id)}
											className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-50 text-black font-black text-xs border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer select-none"
										>
											Decline
										</button>
									</div>
								)}
							</div>
							<div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 min-h-0">
								{selectedThread.chatStatus === "REQUESTED" ? (
									<div className="m-auto text-center max-w-xs animate-in fade-in duration-200">
										<p className="text-sm font-black text-black">
											{canRespond ? "Community Space Interest" : "Request Sent"}
										</p>
										<p className="text-xs font-semibold text-black/50 mt-2">
											{canRespond ? "Accept this request to start chatting." : "Waiting for the space to accept your request."}
										</p>
									</div>
								) : selectedThread.chatStatus === "DECLINED" ? (
									<div className="m-auto text-center max-w-xs text-xs font-semibold text-black/40">
										This request was declined.
									</div>
								) : messages.length === 0 ? (
									<p className="text-xs font-semibold text-black/40 text-center m-auto">No messages yet — say hi!</p>
								) : (
									messages.map((m) => {
										const isMine = m.senderType === role
										return (
											<div
												key={m.id}
												className={clsx(
													"flex flex-col max-w-[85%] sm:max-w-[75%] md:max-w-[70%] transition-all duration-300 rounded-2xl p-1",
													isMine ? "self-end items-end" : "self-start items-start"
												)}
											>
												<div className="flex items-center gap-2 mb-0.5 px-1">
													<span className="text-[10px] font-black uppercase tracking-wide text-black/30">
														{isMine
															? "You"
															: m.senderType === "BRAND"
															? `${selectedThread.counterpartName} • Brand`
															: (m.senderType === "COMMUNITY" || m.senderType === "SPACE")
															? `${selectedThread.counterpartName} • Community`
															: "Meetday • Admin"}
													</span>
												</div>
												<div
													className={clsx(
														"rounded-2xl p-2 sm:p-2.5 text-sm font-semibold break-words border flex flex-col shadow-xs",
														isMine && "bg-black text-white rounded-br-sm border-black",
														!isMine && m.senderType === "BRAND" && "bg-[#EE2C2C] text-white rounded-bl-sm border-[#EE2C2C]",
														!isMine && (m.senderType === "COMMUNITY" || m.senderType === "SPACE") && "bg-[#FFC940] text-black rounded-bl-sm border-[#FFC940]",
													)}
												>
													{m.deletedAt ? <span className="italic opacity-60">Message deleted</span> : m.content}
												</div>
												<div className={clsx("flex items-center gap-1 mt-0.5 text-[9px] font-bold text-black/40 px-1", isMine ? "justify-end" : "justify-start")}>
													<span>
														{(() => {
															try {
																return new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
															} catch {
																return ""
															}
														})()}
													</span>
												</div>
											</div>
										)
									})
								)}
								<div ref={messagesEndRef} />
							</div>
							{selectedThread.chatStatus === "ACCEPTED" && (
								<div className="border-t-[3px] border-black shrink-0 bg-white p-2.5 sm:p-3 flex items-center gap-2 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
									<input
										value={messageInput}
										onChange={(e) => setMessageInput(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter" && !e.shiftKey) {
												e.preventDefault()
												handleSend()
											}
										}}
										placeholder="Write a message…"
										className="flex-1 min-w-0 rounded-2xl border-[3px] border-black bg-white px-3.5 sm:px-4 py-2 text-sm font-semibold outline-none focus:bg-neutral-50"
									/>
									<button
										type="button"
										onClick={handleSend}
										disabled={sending || !messageInput.trim()}
										className="inline-flex items-center justify-center px-4 py-2 rounded-2xl bg-[#EE2C2C] hover:bg-[#d42525] text-white font-black text-xs uppercase tracking-wider border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer select-none disabled:opacity-50 shrink-0"
									>
										{sending ? "…" : "Send"}
									</button>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	)
}
