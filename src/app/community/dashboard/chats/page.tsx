"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import clsx from "clsx"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import { useHostStore } from "@/store/hostStore"
import { uploadSponsorshipChatImage } from "@/lib/uploadMedia"
import {
	getMySponsorshipChats,
	getSponsorshipChatMessages,
	sendSponsorshipChatMessage,
	acceptSponsorshipChatRequest,
	getSponsorshipDeal,
	type SponsorshipChatThread,
	type SponsorshipChatMessage,
	type SponsorshipDeal,
} from "@/lib/api"
import { DealBanner, DealFormModal, DealDetailsModal } from "@/components/sponsorship/DealPanel"
import { MeetdayChatPanel } from "@/components/support/MeetdayChatPanel"
import GallerySvg from "@/icons/outlined/gallery-wide.svg"

const POLL_MS = 4000

type Segment = "REQUESTED" | "ACCEPTED" | "MEETDAY"

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

export default function CommunityChatsPage() {
	const { profile } = useHostStore()
	const ownName = profile?.displayName || "You"
	const [segment, setSegment] = useState<Segment>("REQUESTED")
	const [threads, setThreads] = useState<SponsorshipChatThread[]>([])
	const [loadingThreads, setLoadingThreads] = useState(true)
	const [selectedId, setSelectedId] = useState<string | null>(null)

	const loadThreads = useCallback(async (seg: Segment) => {
		if (seg === "MEETDAY") {
			setLoadingThreads(false)
			return
		}
		try {
			const data = await getMySponsorshipChats(seg)
			setThreads(data)
		} catch {
			// silent — polling refresh, don't spam toasts
		} finally {
			setLoadingThreads(false)
		}
	}, [])

	useEffect(() => {
		// Fetch immediately, then poll — intentional fetch-on-mount + interval pattern.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		loadThreads(segment)
		const interval = setInterval(() => loadThreads(segment), POLL_MS * 2)
		return () => clearInterval(interval)
	}, [segment, loadThreads])

	function handleSegmentChange(seg: Segment) {
		setSegment(seg)
		setSelectedId(null)
		setLoadingThreads(true)
	}

	const selectedThread = threads.find(t => t.id === selectedId) ?? null

	async function handleAccept(interestId: string) {
		try {
			await acceptSponsorshipChatRequest(interestId)
			toast.success("Accepted — you can now chat.")
			await loadThreads(segment)
			setSegment("ACCEPTED")
			setSelectedId(interestId)
		} catch {
			toast.error("Failed to accept request.")
		}
	}

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
					<p className="text-sm font-semibold text-black/50 mt-1">Talk to brands interested in your proposals.</p>
				</div>

				<div className="flex-1 min-h-0 border-[3px] border-black rounded-[24px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col sm:flex-row bg-white">
					{/* Thread list */}
					<div className="w-full sm:w-72 shrink-0 border-b-[3px] sm:border-b-0 sm:border-r-[3px] border-black flex flex-col">
						<div className="flex border-b-[3px] border-black">
							{(["REQUESTED", "ACCEPTED", "MEETDAY"] as Segment[]).map(seg => (
								<button
									key={seg}
									onClick={() => handleSegmentChange(seg)}
									className={clsx(
										"flex-1 py-3 text-xs font-black uppercase tracking-wider transition-colors",
										segment === seg ? "bg-[#EE2C2C] text-white" : "bg-white text-black/50 hover:bg-neutral-50",
									)}
								>
									{seg === "REQUESTED" ? "Requests" : seg === "ACCEPTED" ? "General" : "Meetday"}
								</button>
							))}
						</div>
						{segment !== "MEETDAY" && (
						<div className="flex-1 overflow-y-auto">
							{loadingThreads ? (
								<p className="text-xs font-semibold text-black/40 text-center py-8">Loading…</p>
							) : threads.length === 0 ? (
								<p className="text-xs font-semibold text-black/40 text-center py-8 px-4">
									{segment === "REQUESTED" ? "No pending requests yet." : "No accepted chats yet."}
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
										<div className="flex items-center justify-between gap-2 mt-0.5">
											<p className="text-[11px] font-semibold text-black/50 truncate">{t.proposalName}</p>
											{t.unreadCount > 0 && (
												<span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[#EE2C2C] text-white text-[10px] font-black flex items-center justify-center">
													{t.unreadCount > 9 ? "9+" : t.unreadCount}
												</span>
											)}
										</div>
										{segment === "REQUESTED" && (
											<p className="text-[11px] font-bold text-[#EE2C2C] mt-1">This brand is interested in your proposal</p>
										)}
										{t.lastMessagePreview && segment === "ACCEPTED" && (
											<p className="text-[11px] text-black/40 truncate mt-1">{t.lastMessagePreview}</p>
										)}
									</button>
								))
							)}
						</div>
						)}
					</div>

					{/* Thread detail */}
					<div className="flex-1 min-h-0 flex flex-col">
						{segment === "MEETDAY" ? (
							<MeetdayChatPanel ownName={ownName} />
						) : !selectedThread ? (
							<div className="flex-1 flex items-center justify-center text-sm font-semibold text-black/30">
								Select a chat to view
							</div>
						) : (
							<ChatThreadPanel key={selectedThread.id} thread={selectedThread} onAccept={handleAccept} />
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

function ChatThreadPanel({
	thread,
	onAccept,
}: {
	thread: SponsorshipChatThread
	onAccept: (interestId: string) => void
}) {
	const { profile } = useHostStore()
	const ownName = profile?.displayName || "You"
	const [messages, setMessages] = useState<SponsorshipChatMessage[]>([])
	const [loading, setLoading] = useState(true)
	const [input, setInput] = useState("")
	const [sending, setSending] = useState(false)
	const [uploadingImage, setUploadingImage] = useState(false)
	const [deal, setDeal] = useState<SponsorshipDeal | null>(null)
	const [dealModal, setDealModal] = useState<"form" | "details" | null>(null)
	const bottomRef = useRef<HTMLDivElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const load = useCallback(async () => {
		try {
			const [res, dealRes] = await Promise.all([
				getSponsorshipChatMessages(thread.id),
				thread.chatStatus === "ACCEPTED" ? getSponsorshipDeal(thread.id) : Promise.resolve(null),
			])
			setMessages(res.messages)
			setDeal(dealRes)
		} catch {
			// silent on poll
		} finally {
			setLoading(false)
		}
	}, [thread.id, thread.chatStatus])

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
			const msg = await sendSponsorshipChatMessage(thread.id, { content: input.trim() })
			setMessages(prev => [...prev, msg])
			setInput("")
			if (msg.wasRedacted) {
				toast.warning("Phone numbers, emails, and IDs aren't allowed here — we've masked them in your message to keep things safe.")
			}
		} catch {
			toast.error("Failed to send message.")
		} finally {
			setSending(false)
		}
	}

	async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		e.target.value = ""
		if (!file) return
		if (!file.type.startsWith("image/")) {
			toast.error("Only image files can be sent.")
			return
		}
		setUploadingImage(true)
		try {
			const mediaKey = await uploadSponsorshipChatImage(file, thread.id)
			const msg = await sendSponsorshipChatMessage(thread.id, { mediaKey })
			setMessages(prev => [...prev, msg])
		} catch {
			toast.error("Failed to send image.")
		} finally {
			setUploadingImage(false)
		}
	}

	function labelFor(senderType: SponsorshipChatMessage["senderType"]) {
		if (senderType === "HOST") return ownName
		if (senderType === "BRAND") return thread.counterpartName
		return "Meetday"
	}

	return (
		<div className="flex-1 min-h-0 flex flex-col">
			<div className="px-5 py-3 border-b-[3px] border-black flex items-center justify-between shrink-0">
				<div className="min-w-0">
					<p className="text-sm font-black text-black truncate">{thread.counterpartName}</p>
					<p className="text-[11px] font-semibold text-black/40 truncate">{thread.proposalName}</p>
				</div>
				{thread.chatStatus === "REQUESTED" && (
					<Button size="sm" onClick={() => onAccept(thread.id)}>
						Accept
					</Button>
				)}
			</div>

			{thread.chatStatus === "ACCEPTED" && (
				<DealBanner
					deal={deal}
					role="HOST"
					onLock={() => setDealModal("form")}
					onEdit={() => setDealModal("form")}
					onView={() => setDealModal("details")}
				/>
			)}

			<div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
				{loading ? (
					<p className="text-xs font-semibold text-black/40 text-center">Loading…</p>
				) : thread.chatStatus === "REQUESTED" ? (
					<div className="m-auto text-center max-w-xs">
						<p className="text-sm font-black text-black">This brand is interested in your proposal</p>
						<p className="text-xs font-semibold text-black/50 mt-2">
							Accept the request to open the chat and reply.
						</p>
					</div>
				) : messages.length === 0 ? (
					<p className="text-xs font-semibold text-black/40 text-center m-auto">No messages yet — say hi!</p>
				) : (
					messages.map(m => {
						if (m.messageType === "SYSTEM") {
							return (
								<div key={m.id} className="self-center max-w-[90%] px-3 py-1.5 rounded-full bg-neutral-100 text-black/50 text-[11px] font-bold text-center">
									{m.content}
								</div>
							)
						}
						const isMine = m.senderType === "HOST"
						return (
							<div key={m.id} className={clsx("flex flex-col max-w-[75%]", isMine ? "self-end items-end" : "self-start items-start")}>
								<span className="text-[10px] font-black uppercase tracking-wide text-black/30 mb-0.5 px-1">
									{labelFor(m.senderType)}
								</span>
								{m.mediaUrl && (
									/* eslint-disable-next-line @next/next/no-img-element */
									<img
										src={m.mediaUrl}
										alt="Shared image"
										onClick={() => window.open(m.mediaUrl!, "_blank")}
										className="max-w-[220px] max-h-[220px] rounded-2xl border-[3px] border-black object-cover cursor-pointer mb-1"
									/>
								)}
								{m.content && (
									<div
										className={clsx(
											"px-3.5 py-2 rounded-2xl text-sm font-semibold break-words",
											isMine ? "bg-[#EE2C2C] text-white rounded-br-sm" : "bg-neutral-100 text-black rounded-bl-sm",
										)}
									>
										{m.content}
									</div>
								)}
							</div>
						)
					})
				)}
				<div ref={bottomRef} />
			</div>

			{thread.chatStatus === "ACCEPTED" && (
				<div className="p-3 border-t-[3px] border-black flex items-center gap-2 shrink-0">
					<input type="file" accept="image/*" ref={fileInputRef} onChange={handleImagePick} className="hidden" />
					<button
						type="button"
						onClick={() => fileInputRef.current?.click()}
						disabled={uploadingImage}
						className="shrink-0 size-9 rounded-xl border-[3px] border-black flex items-center justify-center hover:bg-neutral-50 disabled:opacity-50"
						aria-label="Attach image"
					>
						<Icon as={GallerySvg} size="sm" />
					</button>
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

			{dealModal === "form" && (
				<DealFormModal
					interestId={thread.id}
					deal={deal}
					onClose={() => setDealModal(null)}
					onSaved={setDeal}
				/>
			)}
			{dealModal === "details" && deal && (
				<DealDetailsModal
					interestId={thread.id}
					deal={deal}
					role="HOST"
					onClose={() => setDealModal(null)}
					onUpdated={setDeal}
				/>
			)}
		</div>
	)
}
