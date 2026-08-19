"use client"

import { useEffect, useRef, useState, useCallback, Fragment } from "react"
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
	editSponsorshipChatMessage,
	deleteSponsorshipChatMessage,
	acceptSponsorshipChatRequest,
	getSponsorshipDeal,
	type SponsorshipChatThread,
	type SponsorshipChatMessage,
	type SponsorshipDeal,
} from "@/lib/api"
import { DealBanner, DealFormModal, DealDetailsModal } from "@/components/sponsorship/DealPanel"
import { MeetdayChatPanel } from "@/components/support/MeetdayChatPanel"
import GallerySvg from "@/icons/outlined/gallery-wide.svg"
import { useNotificationStore } from "@/store/notificationStore"

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
	const [segment, setSegment] = useState<Segment>("ACCEPTED")
	const [threads, setThreads] = useState<SponsorshipChatThread[]>([])
	const [loadingThreads, setLoadingThreads] = useState(true)
	const [selectedId, setSelectedId] = useState<string | null>(null)

	const { notifications, markRead } = useNotificationStore()

	const getThreadUnreadCount = useCallback((threadId: string) => {
		return notifications.filter(n => {
			if (n.isRead) return false
			const m = n.metadata || {}
			const tId = m.threadId || m.thread_id || m.interestId || m.interest_id || m.chatId || m.chat_id || m.sponsorshipInterestId
			return tId === threadId
		}).length
	}, [notifications])

	const getMeetdayUnreadCount = useCallback(() => {
		return notifications.filter(n => {
			if (n.isRead) return false
			if (n.title !== "Meetday") return false
			const m = n.metadata || {}
			const hasThread = m.threadId || m.thread_id || m.interestId || m.interest_id || m.chatId || m.chat_id || m.sponsorshipInterestId
			return !hasThread
		}).length
	}, [notifications])

	const loadThreads = useCallback(async (seg: Segment) => {
		if (seg === "MEETDAY") {
			setLoadingThreads(false)
			return
		}
		try {
			const data = await getMySponsorshipChats(seg)
			console.log("[DEBUG community chats data]:", data)
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
	}, [segment, loadThreads, notifications])

	// Clear unread counts in memory instantly when opened
	useEffect(() => {
		if (selectedId) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setThreads(prev =>
				prev.map(t => (t.id === selectedId ? { ...t, unreadCount: 0 } : t))
			)
			const unreadChatNotifs = notifications.filter(n => {
				if (n.isRead) return false
				const m = n.metadata || {}
				const tId = m.threadId || m.thread_id || m.interestId || m.interest_id || m.chatId || m.chat_id || m.sponsorshipInterestId
				return tId === selectedId
			})
			unreadChatNotifs.forEach(n => {
				markRead(n.id).catch(() => {})
			})
		}
	}, [selectedId, notifications, markRead])

	useEffect(() => {
		if (segment === "MEETDAY") {
			const unreadSupportNotifs = notifications.filter(n => !n.isRead && n.title === "Meetday")
			unreadSupportNotifs.forEach(n => {
				markRead(n.id).catch(() => {})
			})
		}
	}, [segment, notifications, markRead])

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

				<div className="h-[calc(100vh-240px)] border-[3px] border-black rounded-[24px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col sm:flex-row bg-white">
					{/* Thread list */}
					<div className="w-full sm:w-72 shrink-0 border-b-[3px] sm:border-b-0 sm:border-r-[3px] border-black flex flex-col">
						<div className="flex border-b-[3px] border-black">
							{(["ACCEPTED", "MEETDAY", "REQUESTED"] as Segment[]).map(seg => {
								const unreadCount = seg === "MEETDAY" ? getMeetdayUnreadCount() : 0;
								return (
									<button
										key={seg}
										onClick={() => handleSegmentChange(seg)}
										className={clsx(
											"flex-grow py-3 text-xs font-black uppercase tracking-wider transition-colors relative",
											segment === seg ? "bg-[#EE2C2C] text-white" : "bg-white text-black/50 hover:bg-neutral-50",
										)}
									>
										{seg === "REQUESTED" ? "Requests" : seg === "ACCEPTED" ? "General" : "Meetday"}
										{unreadCount > 0 && (
											<span className="absolute top-1.5 right-1.5 shrink-0 min-w-[16px] h-[16px] px-1 rounded-full bg-[#EE2C2C] text-white text-[8px] font-black flex items-center justify-center border border-white">
												{unreadCount > 9 ? "9+" : unreadCount}
											</span>
										)}
									</button>
								);
							})}
						</div>
						{segment !== "MEETDAY" ? (
						<div className="flex-1 overflow-y-auto">
							{loadingThreads ? (
								<p className="text-xs font-semibold text-black/40 text-center py-8">Loading…</p>
							) : threads.length === 0 ? (
								<p className="text-xs font-semibold text-black/40 text-center py-8 px-4">
									{segment === "REQUESTED" ? "No pending requests yet." : "No accepted chats yet."}
								</p>
							) : (
								threads.map(t => {
									const unread = selectedId === t.id ? 0 : Math.max(t.unreadCount || 0, getThreadUnreadCount(t.id));
									return (
										<button
											key={t.id}
											onClick={() => setSelectedId(t.id)}
											className={clsx(
												"w-full text-left px-4 py-3 border-b border-black/10 transition-colors flex items-center gap-3",
												selectedId === t.id ? "bg-[#FFC940]/20" : "hover:bg-neutral-50",
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
												{unread > 0 && (
													<span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#EE2C2C] text-white text-[9px] font-black flex items-center justify-center border-2 border-white shadow-[2px_2px_4px_rgba(0,0,0,0.15)]">
														{unread > 9 ? "9+" : unread}
													</span>
												)}
											</div>

											<div className="flex-1 min-w-0">
												<div className="flex items-center justify-between gap-2">
													<p className="text-sm font-black text-black truncate">{t.counterpartName}</p>
													<span className="text-[10px] font-semibold text-black/30 shrink-0">{timeAgo(t.lastMessageAt ?? t.createdAt)}</span>
												</div>
												<div className="flex items-center justify-between gap-2 mt-0.5">
													<p className="text-[11px] font-semibold text-black/50 truncate">{t.proposalName}</p>
												</div>
											{segment === "REQUESTED" && (
												<p className="text-[11px] font-bold text-[#EE2C2C] mt-1">This brand is interested in your proposal</p>
											)}
											{t.lastMessagePreview && segment === "ACCEPTED" && (
												<p className="text-[11px] text-black/40 truncate mt-1">{t.lastMessagePreview}</p>
											)}
										</div>
									</button>
								);
							})
							)}
						</div>
						) : (
							<div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-neutral-50/50">
								<p className="text-sm font-black text-black leading-snug">Welcome to Meetday Chat!</p>
								<p className="text-xs font-semibold text-black/50 mt-2 leading-relaxed">
									We are here to help you. Feel free to ask us anything or share feedback!
								</p>
							</div>
						)}
					</div>

					{/* Thread detail */}
					<div className="flex-1 min-h-0 flex flex-col">
						{segment === "MEETDAY" ? (
							<MeetdayChatPanel ownName={ownName} role="HOST" />
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
	const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
	const [unreadDivider, setUnreadDivider] = useState<{ messageId: string; count: number } | null>(null)
	const dividerCapturedRef = useRef(false)
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
			// Only capture the unread boundary once per thread — subsequent polls mark everything
			// read, so re-computing it every time would make the divider disappear immediately.
			if (!dividerCapturedRef.current) {
				dividerCapturedRef.current = true
				if (res.firstUnreadMessageId && res.unreadCount > 0) {
					setUnreadDivider({ messageId: res.firstUnreadMessageId, count: res.unreadCount })
				}
			}
		} catch {
			// silent on poll
		} finally {
			setLoading(false)
		}
	}, [thread.id, thread.chatStatus])

	const { notifications } = useNotificationStore()

	useEffect(() => {
		// Fetch immediately, then poll — intentional fetch-on-mount + interval pattern.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		load()
		const interval = setInterval(load, POLL_MS)
		return () => clearInterval(interval)
	}, [load, notifications])

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [messages.length])

	async function handleSend() {
		if (!input.trim()) return
		if (editingMessageId) {
			setSending(true)
			try {
				const updated = await editSponsorshipChatMessage(thread.id, editingMessageId, input.trim())
				setMessages(prev => prev.map(m => (m.id === updated.id ? updated : m)))
				setEditingMessageId(null)
				setInput("")
				if (updated.wasRedacted) {
					toast.warning("Phone numbers, emails, and IDs aren't allowed here — we've masked them in your message to keep things safe.")
				}
			} catch {
				toast.error("Failed to save changes.")
			} finally {
				setSending(false)
			}
			return
		}
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

	function handleEditStart(m: SponsorshipChatMessage) {
		setEditingMessageId(m.id)
		setInput(m.content)
	}

	function handleEditCancel() {
		setEditingMessageId(null)
		setInput("")
	}

	async function handleDelete(m: SponsorshipChatMessage) {
		if (!window.confirm("Delete this message? This can't be undone.")) return
		try {
			await deleteSponsorshipChatMessage(thread.id, m.id)
			setMessages(prev => prev.map(x => (x.id === m.id ? { ...x, deletedAt: new Date().toISOString(), content: "", mediaUrl: null } : x)))
			if (editingMessageId === m.id) handleEditCancel()
		} catch {
			toast.error("Failed to delete message.")
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
		if (senderType === "HOST") return `${ownName} • Community`
		if (senderType === "BRAND") return `${thread.counterpartName} • Brand`
		return "Meetday • Admin"
	}

	return (
		<div className="flex-1 min-h-0 flex flex-col">
			<div className="px-5 py-3 border-b-[3px] border-black flex items-center justify-between shrink-0">
				<div className="flex items-center gap-3 min-w-0">
					<div className="w-8 h-8 rounded-full border border-black/15 overflow-hidden shrink-0 relative bg-neutral-100 flex items-center justify-center">
						{thread.counterpartAvatarUrl ? (
							<img
								src={thread.counterpartAvatarUrl}
								alt={thread.counterpartName}
								className="w-full h-full object-cover"
							/>
						) : (
							<span className="font-heading font-black text-xs text-black/60">
								{thread.counterpartName.charAt(0).toUpperCase()}
							</span>
						)}
					</div>
					<div className="min-w-0">
						<p className="text-sm font-black text-black truncate">{thread.counterpartName}</p>
						<p className="text-[11px] font-semibold text-black/40 truncate">{thread.proposalName}</p>
					</div>
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
						const isDeleted = !!m.deletedAt
						return (
							<Fragment key={m.id}>
								{unreadDivider?.messageId === m.id && (
									<div className="self-stretch flex items-center gap-2 my-1">
										<div className="flex-1 h-px bg-[#EE2C2C]/30" />
										<span className="text-[10px] font-black uppercase text-[#EE2C2C] shrink-0">
											{unreadDivider.count} unread message{unreadDivider.count > 1 ? "s" : ""}
										</span>
										<div className="flex-1 h-px bg-[#EE2C2C]/30" />
									</div>
								)}
								<div className={clsx("flex flex-col max-w-[75%]", isMine ? "self-end items-end" : "self-start items-start")}>
									<div className="flex items-center gap-2 mb-0.5 px-1">
										<span className="text-[10px] font-black uppercase tracking-wide text-black/30">{labelFor(m.senderType)}</span>
										{isMine && !isDeleted && (
											<>
												<button type="button" onClick={() => handleEditStart(m)} className="text-[10px] font-bold text-black/30 hover:text-black">
													Edit
												</button>
												<button type="button" onClick={() => handleDelete(m)} className="text-[10px] font-bold text-black/30 hover:text-[#EE2C2C]">
													Delete
												</button>
											</>
										)}
									</div>
									{isDeleted ? (
										<div className="px-3.5 py-2 rounded-2xl text-sm font-semibold italic text-black/40 bg-neutral-50 border border-dashed border-black/15">
											This message was deleted
										</div>
									) : (
										<>
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
														"px-3.5 py-2 rounded-2xl text-sm font-semibold break-words border border-black/10",
														m.senderType === "BRAND" && "bg-[#EE2C2C] text-white",
														m.senderType === "HOST" && "bg-[#FFC940] text-black",
														m.senderType === "ADMIN" && "bg-neutral-100 text-black",
														isMine ? "rounded-br-sm" : "rounded-bl-sm",
													)}
												>
													{m.content}
													{m.editedAt && <span className="ml-1.5 text-[10px] font-semibold opacity-60">(edited)</span>}
												</div>
											)}
										</>
									)}
									{(m.content || m.mediaUrl) && !isDeleted && (
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
											{isMine && (
												<span className={clsx("text-[10px] leading-none font-black", m.seenByOther ? "text-[#EE2C2C]" : "text-black/25")}>
													{m.seenByOther ? "✓✓" : "✓"}
												</span>
											)}
										</div>
									)}
								</div>
							</Fragment>
						)
					})
				)}
				<div ref={bottomRef} />
			</div>

			{thread.chatStatus === "ACCEPTED" && (
				<div className="border-t-[3px] border-black shrink-0">
					{editingMessageId && (
						<div className="px-3 pt-2 flex items-center justify-between">
							<span className="text-[10px] font-black uppercase text-black/40">Editing message</span>
							<button type="button" onClick={handleEditCancel} className="text-[10px] font-bold text-[#EE2C2C]">Cancel</button>
						</div>
					)}
					<div className="p-3 flex items-center gap-2">
						<input type="file" accept="image/*" ref={fileInputRef} onChange={handleImagePick} className="hidden" />
						<button
							type="button"
							onClick={() => fileInputRef.current?.click()}
							disabled={uploadingImage || !!editingMessageId}
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
								if (e.key === "Escape" && editingMessageId) handleEditCancel()
							}}
							placeholder="Write a message…"
							className="flex-1 rounded-2xl border-[3px] border-black bg-white px-4 py-2 text-sm font-semibold outline-none focus:bg-neutral-50"
						/>
						<Button onClick={handleSend} disabled={sending || !input.trim()}>
							{sending ? "…" : editingMessageId ? "Save" : "Send"}
						</Button>
					</div>
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
