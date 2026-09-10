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
	tabs: SpaceChatTabDef[]
	// Only the space partner side can accept/decline pending requests.
	canRespond?: boolean
	emptyLabel?: string
}

// Shared chat surface for Community Space interest requests — reused (with a different `role` +
// `tabs` config) by the Brand dashboard, Community dashboard, and Space Partner dashboard.
export function SpaceChatDashboard({ role, tabs, canRespond, emptyLabel }: SpaceChatDashboardProps) {
	const [threads, setThreads] = useState<SpaceChatThread[]>([])
	const [activeTab, setActiveTab] = useState(tabs[0]?.key)
	const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
	const [messages, setMessages] = useState<SpaceChatMessage[]>([])
	const [messageInput, setMessageInput] = useState("")
	const [sending, setSending] = useState(false)
	const [respondingId, setRespondingId] = useState<string | null>(null)
	const messagesEndRef = useRef<HTMLDivElement>(null)

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

	const selectedThread = threads.find((t) => t.id === selectedThreadId) ?? null
	const activeTabDef = tabs.find((t) => t.key === activeTab)
	const visibleThreads = activeTabDef ? threads.filter(activeTabDef.filter) : threads

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
		<div className="flex flex-col gap-4 h-full min-h-0">
			<div className="flex items-center gap-2 shrink-0 overflow-x-auto">
				{tabs.map((tab) => (
					<button
						key={tab.key}
						type="button"
						onClick={() => {
							setActiveTab(tab.key)
							setSelectedThreadId(null)
						}}
						className={clsx(
							"shrink-0 text-xs font-black px-4 py-2 rounded-xl uppercase tracking-wider border-2 border-black transition-all select-none",
							activeTab === tab.key
								? "bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
								: "bg-white text-black hover:bg-slate-50",
						)}
					>
						{tab.label}
						{tab.filter && threads.filter(tab.filter).length > 0 && (
							<span className="ml-1.5 opacity-60">({threads.filter(tab.filter).length})</span>
						)}
					</button>
				))}
			</div>

			<div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4">
				{/* Thread list */}
				<div className="border-2 border-black rounded-2xl bg-white overflow-y-auto flex flex-col divide-y divide-black/10">
					{visibleThreads.length === 0 ? (
						<p className="text-xs font-semibold text-black/40 p-6 text-center">{emptyLabel ?? "Nothing here yet."}</p>
					) : (
						visibleThreads.map((t) => (
							<button
								key={t.id}
								type="button"
								onClick={() => setSelectedThreadId(t.id)}
								className={clsx(
									"text-left p-4 flex flex-col gap-1 transition-colors",
									selectedThreadId === t.id ? "bg-[#FFF7E0]" : "hover:bg-slate-50",
								)}
							>
								<div className="flex items-center justify-between gap-2">
									<p className="text-sm font-black text-black truncate">{t.counterpartName}</p>
									{t.unreadCount > 0 && (
										<span className="shrink-0 text-[10px] font-black bg-[#EE2C2C] text-white rounded-full size-5 flex items-center justify-center">
											{t.unreadCount > 9 ? "9+" : t.unreadCount}
										</span>
									)}
								</div>
								<p className="text-xs text-black/50 truncate">{t.lastMessagePreview || "No messages yet"}</p>
								<div className="flex items-center justify-between gap-2 mt-1">
									<span className="text-[10px] font-bold text-black/30 uppercase tracking-wider">{timeAgo(t.lastMessageAt || t.createdAt)}</span>
									{t.chatStatus === "REQUESTED" && canRespond && (
										<div className="flex items-center gap-1.5">
											<button
												type="button"
												disabled={respondingId === t.id}
												onClick={(e) => {
													e.stopPropagation()
													handleAccept(t.id)
												}}
												className="text-[10px] font-black uppercase px-2 py-1 rounded-md bg-[#22C55E] text-white disabled:opacity-50"
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
												className="text-[10px] font-black uppercase px-2 py-1 rounded-md bg-white border border-black/20 text-black/60 disabled:opacity-50"
											>
												Decline
											</button>
										</div>
									)}
									{t.chatStatus === "REQUESTED" && !canRespond && (
										<span className="text-[10px] font-black uppercase text-black/40">Awaiting response</span>
									)}
									{t.chatStatus === "DECLINED" && <span className="text-[10px] font-black uppercase text-red-500">Declined</span>}
								</div>
							</button>
						))
					)}
				</div>

				{/* Message view */}
				<div className="border-2 border-black rounded-2xl bg-white flex flex-col min-h-0">
					{!selectedThread ? (
						<div className="flex-1 flex items-center justify-center text-sm font-semibold text-black/30">Select a chat to view messages</div>
					) : (
						<>
							<div className="p-4 border-b border-black/10 flex items-center justify-between shrink-0">
								<p className="text-sm font-black text-black">{selectedThread.counterpartName}</p>
								{selectedThread.chatStatus === "REQUESTED" && canRespond && (
									<div className="flex items-center gap-1.5">
										<button
											type="button"
											onClick={() => handleAccept(selectedThread.id)}
											className="text-[10px] font-black uppercase px-3 py-1.5 rounded-md bg-[#22C55E] text-white"
										>
											Accept
										</button>
										<button
											type="button"
											onClick={() => handleDecline(selectedThread.id)}
											className="text-[10px] font-black uppercase px-3 py-1.5 rounded-md bg-white border border-black/20 text-black/60"
										>
											Decline
										</button>
									</div>
								)}
							</div>
							<div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 min-h-0">
								{selectedThread.chatStatus === "REQUESTED" ? (
									<p className="text-xs font-semibold text-black/40 text-center my-auto">
										{canRespond ? "Accept this request to start chatting." : "Waiting for the space to accept your request."}
									</p>
								) : selectedThread.chatStatus === "DECLINED" ? (
									<p className="text-xs font-semibold text-black/40 text-center my-auto">This request was declined.</p>
								) : (
									messages.map((m) => {
										const isMine = m.senderType === role
										return (
											<div key={m.id} className={clsx("max-w-[75%] px-3 py-2 rounded-2xl text-sm", isMine ? "self-end bg-[#EE2C2C] text-white" : "self-start bg-slate-100 text-black")}>
												{m.deletedAt ? <span className="italic opacity-60">Message deleted</span> : m.content}
											</div>
										)
									})
								)}
								<div ref={messagesEndRef} />
							</div>
							{selectedThread.chatStatus === "ACCEPTED" && (
								<div className="p-3 border-t border-black/10 flex items-center gap-2 shrink-0">
									<input
										value={messageInput}
										onChange={(e) => setMessageInput(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter" && !e.shiftKey) {
												e.preventDefault()
												handleSend()
											}
										}}
										placeholder="Type a message…"
										className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-black/15 bg-slate-50 text-sm outline-none focus:border-black"
									/>
									<button
										type="button"
										onClick={handleSend}
										disabled={sending || !messageInput.trim()}
										className="shrink-0 bg-[#EE2C2C] text-white text-xs font-black px-4 py-2 rounded-xl uppercase tracking-wider disabled:opacity-50"
									>
										Send
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
