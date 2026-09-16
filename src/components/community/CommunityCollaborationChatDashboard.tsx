"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import clsx from "clsx"
import { toast } from "sonner"
import {
	acceptCommunityCollaborationRequest,
	declineCommunityCollaborationRequest,
	getCommunityCollaborationChatMessages,
	getMyCommunityCollaborationChats,
	sendCommunityCollaborationMessage,
	type CommunityCollaborationMessage,
	type CommunityHostChatStatus,
	type CommunityHostChatThread,
} from "@/lib/api"
import { Button } from "@/components/ui/Button"

const POLL_MS = 4000

type ChatSegment = "ACCEPTED" | "REQUESTED"

function formatTime(value: string | null | undefined) {
	if (!value) return ""
	return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function CommunityCollaborationChatDashboard() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [segment, setSegment] = useState<ChatSegment>("ACCEPTED")
	const [threads, setThreads] = useState<CommunityHostChatThread[]>([])
	const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("chatId"))
	const [messages, setMessages] = useState<CommunityCollaborationMessage[]>([])
	const [input, setInput] = useState("")
	const [loading, setLoading] = useState(true)
	const [loadingMessages, setLoadingMessages] = useState(false)
	const [sending, setSending] = useState(false)
	const bottomRef = useRef<HTMLDivElement>(null)

	const visibleThreads = useMemo(
		() => threads.filter(thread => thread.chatStatus === segment),
		[threads, segment],
	)
	const selectedThread = threads.find(thread => thread.id === selectedId) ?? null

	async function loadThreads() {
		try {
			const nextThreads = await getMyCommunityCollaborationChats()
			setThreads(nextThreads)
		} catch {
			// Polling errors should not interrupt an open chat.
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadThreads()
		const interval = setInterval(loadThreads, POLL_MS * 2)
		return () => clearInterval(interval)
	}, [])

	useEffect(() => {
		const chatId = searchParams.get("chatId")
		if (chatId !== selectedId) setSelectedId(chatId)
	}, [searchParams, selectedId])

	useEffect(() => {
		const thread = selectedThread
		if (!thread) {
			setMessages([])
			return
		}
		if (thread.chatStatus === "REQUESTED") {
			setMessages([])
			return
		}
		const threadId = thread.id

		let cancelled = false
		async function loadMessages() {
			setLoadingMessages(true)
			try {
				const response = await getCommunityCollaborationChatMessages(threadId)
				if (!cancelled) setMessages(response.messages)
			} catch {
				if (!cancelled) toast.error("Unable to load community messages.")
			} finally {
				if (!cancelled) setLoadingMessages(false)
			}
		}
		loadMessages()
		const interval = setInterval(loadMessages, POLL_MS)
		return () => {
			cancelled = true
			clearInterval(interval)
		}
	}, [selectedThread?.id, selectedThread?.chatStatus])

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [messages.length])

	function selectThread(thread: CommunityHostChatThread) {
		setSelectedId(thread.id)
		setSegment(thread.chatStatus === "ACCEPTED" ? "ACCEPTED" : "REQUESTED")
		router.push(`/community/dashboard/chats?type=community&chatId=${thread.id}`)
	}

	async function handleAccept(threadId: string) {
		try {
			await acceptCommunityCollaborationRequest(threadId)
			setThreads(previous => previous.map(thread => thread.id === threadId ? { ...thread, chatStatus: "ACCEPTED" } : thread))
			setSegment("ACCEPTED")
			setSelectedId(threadId)
			router.push(`/community/dashboard/chats?type=community&chatId=${threadId}`)
			toast.success("Accepted. You can now chat.")
		} catch {
			toast.error("Unable to accept this request.")
		}
	}

	async function handleDecline(threadId: string) {
		try {
			await declineCommunityCollaborationRequest(threadId)
			setThreads(previous => previous.map(thread => thread.id === threadId ? { ...thread, chatStatus: "DECLINED" } : thread))
			setSelectedId(null)
			toast.success("Collaboration request declined.")
		} catch {
			toast.error("Unable to decline this request.")
		}
	}

	async function handleSend() {
		if (!selectedThread || !input.trim() || sending) return
		setSending(true)
		try {
			const message = await sendCommunityCollaborationMessage(selectedThread.id, { content: input.trim() })
			setMessages(previous => [...previous, message])
			setInput("")
		} catch {
			toast.error("Unable to send message.")
		} finally {
			setSending(false)
		}
	}

	return (
		<div className="flex-1 min-h-0 flex flex-col bg-white border-t border-black/10">
			<div className="px-4 sm:px-6 py-4 border-b-[3px] border-black shrink-0">
				<h1 className="font-heading text-xl font-black text-black">Community Chats</h1>
				<p className="text-xs font-semibold text-black/50 mt-1">Message other communities about collaboration opportunities.</p>
			</div>
			<div className="flex-1 min-h-0 flex flex-col sm:flex-row">
				<aside className={clsx("w-full sm:w-80 shrink-0 border-r border-black/10 flex flex-col", selectedId && "hidden sm:flex")}>
					<div className="p-3 flex gap-2 border-b border-black/10">
						{(["ACCEPTED", "REQUESTED"] as ChatSegment[]).map(value => (
							<button
								key={value}
								type="button"
								onClick={() => { setSegment(value); setSelectedId(null); router.push(`/community/dashboard/chats?type=community`) }}
								className={clsx("flex-1 rounded-xl px-3 py-2 text-xs font-black", segment === value ? "bg-black text-white" : "bg-neutral-100 text-black/50")}
							>
								{value === "ACCEPTED" ? "Active" : "Requests"}
							</button>
						))}
					</div>
					<div className="flex-1 overflow-y-auto p-2">
						{loading ? <p className="p-4 text-xs font-semibold text-black/40">Loading chats…</p> : visibleThreads.length === 0 ? <p className="p-4 text-xs font-semibold text-black/40">No community chats yet.</p> : visibleThreads.map(thread => (
							<button key={thread.id} type="button" onClick={() => selectThread(thread)} className={clsx("w-full text-left p-3 rounded-xl mb-1", selectedId === thread.id ? "bg-[#FFC940]" : "hover:bg-neutral-100")}>
								<div className="flex items-center gap-2">
									<div className="size-9 rounded-full bg-neutral-200 overflow-hidden flex items-center justify-center font-black text-sm">
										{thread.communityAvatarUrl ? <img src={thread.communityAvatarUrl} alt="" className="w-full h-full object-cover" /> : thread.communityName.charAt(0).toUpperCase()}
									</div>
									<div className="min-w-0 flex-1"><p className="font-black text-sm truncate">{thread.communityName}</p><p className="text-[11px] font-semibold text-black/45 truncate">{thread.lastMessagePreview || "Collaboration chat"}</p></div>
								</div>
							</button>
						))}
					</div>
				</aside>
				<section className={clsx("flex-1 min-w-0 min-h-0 flex flex-col", !selectedId && "hidden sm:flex")}>
					{!selectedThread ? <div className="flex-1 flex items-center justify-center text-sm font-semibold text-black/30">Select a community chat</div> : (
						<>
							<header className="px-4 py-3 border-b-[3px] border-black flex items-center gap-3 shrink-0">
								<button type="button" onClick={() => setSelectedId(null)} className="sm:hidden text-xs font-black">Back</button>
								<div className="size-9 rounded-full bg-neutral-200 flex items-center justify-center font-black">{selectedThread.communityName.charAt(0).toUpperCase()}</div>
								<div><h2 className="font-black text-sm">{selectedThread.communityName}</h2><p className="text-[11px] font-semibold text-black/45">Community collaboration</p></div>
							</header>
							{selectedThread.chatStatus === "REQUESTED" ? <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center"><p className="text-sm font-black">{selectedThread.communityName} wants to collaborate.</p><p className="text-xs font-semibold text-black/45">Accept the request to start messaging.</p><div className="flex gap-2"><Button variant="primary" size="sm" radius="md" onClick={() => handleAccept(selectedThread.id)}>Accept</Button><Button variant="secondary" size="sm" radius="md" onClick={() => handleDecline(selectedThread.id)}>Decline</Button></div></div> : <><div className="flex-1 overflow-y-auto p-4 space-y-2">{loadingMessages ? <p className="text-xs font-semibold text-black/40">Loading messages…</p> : messages.map(message => { const isMine = message.senderType === selectedThread.mySenderType; return <div key={message.id} className={clsx("max-w-[78%] rounded-2xl px-3 py-2", isMine ? "ml-auto bg-black text-white" : "bg-[#FFC940] text-black")}><p className="text-sm font-semibold whitespace-pre-wrap break-words">{message.content}</p><p className={clsx("text-[10px] mt-1", isMine ? "text-white/55" : "text-black/45")}>{isMine ? "You" : selectedThread.communityName} · {formatTime(message.createdAt)}</p></div> })}<div ref={bottomRef} /></div><form onSubmit={event => { event.preventDefault(); handleSend() }} className="p-3 border-t-[3px] border-black flex gap-2"><input value={input} onChange={event => setInput(event.target.value)} placeholder="Write a message…" className="flex-1 min-w-0 rounded-xl border-2 border-black px-3 py-2 text-sm outline-none" /><Button type="submit" variant="primary" size="sm" radius="md" disabled={sending || !input.trim()}>{sending ? "Sending…" : "Send"}</Button></form></>}
						</>
					)}
				</section>
			</div>
		</div>
	)
}

export default CommunityCollaborationChatDashboard
