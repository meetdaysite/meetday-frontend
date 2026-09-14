"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
	acceptSpaceHostChatRequest,
	declineSpaceHostChatRequest,
	getMySpaceHostChats,
	getSpaceHostChatMessages,
	sendSpaceHostChatMessage,
	getSpaceHostDeal,
	getSpaceHostDealReport,
	type SpaceHostChatMessage,
	type SpaceHostChatRole,
	type SpaceHostChatThread,
	type SpaceHostDeal,
	type SpaceHostDealReport,
} from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"
import { toast } from "@/lib/toast"
import clsx from "clsx"
import {
	SpaceHostDealBanner,
	SpaceHostDealFormModal,
	SpaceHostDealDetailsModal,
	SpaceHostDealReportModal,
} from "./SpaceHostDealPanel"
import { SystemMessageBubble } from "@/components/chat/SystemMessageBubble"
import { uploadSpaceHostChatImage, isPdfMediaUrl } from "@/lib/uploadMedia"
import { ImageLightbox } from "@/components/ui/ImageLightbox"
import { EmojiPicker } from "@/components/ui/EmojiPicker"
import { playMessageChime } from "@/lib/notificationSound"
import { useNotificationStore } from "@/store/notificationStore"
import { Icon } from "@/components/ui/Icon"
import GallerySvg from "@/icons/outlined/gallery-wide.svg"

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

export type SpaceHostChatDashboardProps = {
	role: SpaceHostChatRole
	// Only the community (HOST) side can accept/decline pending requests.
	canRespond?: boolean
	emptyLabel?: string
}

// Shared chat surface for Space<->Community partnership requests — reused by the Space Partner
// dashboard (role=SPACE) and the Community dashboard (role=HOST, canRespond). Mirrors
// SpaceChatDashboard almost exactly, minus the requesterType/category split (Space is always
// the sole requester in this flow).
export function SpaceHostChatDashboard({ role, canRespond, emptyLabel }: SpaceHostChatDashboardProps) {
	const [threads, setThreads] = useState<SpaceHostChatThread[]>([])
	const [subTab, setSubTab] = useState<"ACCEPTED" | "REQUESTED">("ACCEPTED")
	const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
	const [messages, setMessages] = useState<SpaceHostChatMessage[]>([])
	const [messageInput, setMessageInput] = useState("")
	const [sending, setSending] = useState(false)
	const [respondingId, setRespondingId] = useState<string | null>(null)
	const [deal, setDeal] = useState<SpaceHostDeal | null>(null)
	const [report, setReport] = useState<SpaceHostDealReport | null>(null)
	const [showDealModal, setShowDealModal] = useState(false)
	const [showDetailsModal, setShowDetailsModal] = useState(false)
	const [showReportModal, setShowReportModal] = useState(false)
	const [uploadingImage, setUploadingImage] = useState(false)
	const [viewingImage, setViewingImage] = useState<string | null>(null)
	const [replyingTo, setReplyingTo] = useState<SpaceHostChatMessage | null>(null)
	const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const prevMsgCountRef = useRef(0)

	const searchParams = useSearchParams()
	const initialThreadParam = searchParams.get("threadId") || searchParams.get("interestId")

	useEffect(() => {
		let cancelled = false
		function poll() {
			getMySpaceHostChats(undefined, role)
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
		if (initialThreadParam && threads.length > 0) {
			const found = threads.find((t) => t.id === initialThreadParam)
			if (found) {
				setSelectedThreadId(found.id)
				setSubTab(found.chatStatus === "REQUESTED" ? "REQUESTED" : "ACCEPTED")
			}
		}
	}, [initialThreadParam, threads])

	useEffect(() => {
		if (!selectedThreadId) return
		prevMsgCountRef.current = 0
		let cancelled = false
		function poll() {
			getSpaceHostChatMessages(selectedThreadId!, role)
				.then((data) => {
					if (cancelled) return
					if (prevMsgCountRef.current > 0 && data.messages.length > prevMsgCountRef.current) {
						const newest = data.messages[data.messages.length - 1]
						if (newest && newest.senderType !== role) playMessageChime()
					}
					prevMsgCountRef.current = data.messages.length
					setMessages(data.messages)
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
		if (!selectedThreadId) {
			setDeal(null)
			setReport(null)
			return
		}
		let cancelled = false
		function pollDealAndReport() {
			getSpaceHostDeal(selectedThreadId!)
				.then((d) => {
					if (!cancelled) setDeal(d)
				})
				.catch(() => {})

			getSpaceHostDealReport(selectedThreadId!, role)
				.then((r) => {
					if (!cancelled) setReport(r)
				})
				.catch(() => {})
		}
		pollDealAndReport()
		const id = setInterval(pollDealAndReport, MESSAGES_POLL_MS)
		return () => {
			cancelled = true
			clearInterval(id)
		}
	}, [selectedThreadId, role])

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [messages])

	const { markThreadRead } = useNotificationStore()

	useEffect(() => {
		if (selectedThreadId) {
			setThreads(prev => prev.map(t => (t.id === selectedThreadId ? { ...t, unreadCount: 0 } : t)))
			markThreadRead(selectedThreadId)
		}
	}, [selectedThreadId, markThreadRead])

	const selectedThread = threads.find((t) => t.id === selectedThreadId) ?? null

	const currentUnreadAccepted = threads.filter(t => t.chatStatus === "ACCEPTED").reduce((sum, t) => sum + (selectedThreadId === t.id ? 0 : t.unreadCount || 0), 0)
	const currentUnreadRequested = threads.filter(t => t.chatStatus === "REQUESTED").reduce((sum, t) => sum + (selectedThreadId === t.id ? 0 : t.unreadCount || 0), 0)

	const visibleThreads = threads.filter((t) => t.chatStatus === subTab)

	async function handleSend() {
		if (!selectedThreadId || !messageInput.trim() || sending) return
		setSending(true)
		try {
			await sendSpaceHostChatMessage(selectedThreadId, { content: messageInput.trim(), replyToId: replyingTo?.id }, role)
			setMessageInput("")
			setReplyingTo(null)
			const data = await getSpaceHostChatMessages(selectedThreadId, role)
			setMessages(data.messages)
		} catch (e) {
			toast.error(getApiErrorMessage(e))
		} finally {
			setSending(false)
		}
	}

	async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		e.target.value = ""
		if (!file || !selectedThreadId) return
		setUploadingImage(true)
		try {
			const mediaKey = await uploadSpaceHostChatImage(file, selectedThreadId)
			await sendSpaceHostChatMessage(selectedThreadId, { mediaKey, replyToId: replyingTo?.id }, role)
			setReplyingTo(null)
			const data = await getSpaceHostChatMessages(selectedThreadId, role)
			setMessages(data.messages)
		} catch (e) {
			toast.error(getApiErrorMessage(e))
		} finally {
			setUploadingImage(false)
		}
	}

	function handleReplyStart(m: SpaceHostChatMessage) {
		setReplyingTo(m)
	}

	function handleReplyCancel() {
		setReplyingTo(null)
	}

	function handleJumpToMessage(messageId: string) {
		const el = document.getElementById(`space-host-msg-${messageId}`)
		if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
		setHighlightedMessageId(messageId)
		setTimeout(() => setHighlightedMessageId((cur) => (cur === messageId ? null : cur)), 2000)
	}

	function replyLabel(senderType: SpaceHostChatMessage["senderType"]) {
		return senderType === "SPACE" ? "Space" : senderType === "HOST" ? "Community" : "Meetday"
	}

	async function handleAccept(threadId: string) {
		setRespondingId(threadId)
		try {
			await acceptSpaceHostChatRequest(threadId, role)
			const data = await getMySpaceHostChats(undefined, role)
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
			await declineSpaceHostChatRequest(threadId, role)
			const data = await getMySpaceHostChats(undefined, role)
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
								{emptyLabel ?? (subTab === "ACCEPTED" ? "No accepted chats yet." : "No pending requests.")}
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
												<span className="font-heading font-black text-xs text-black/60">
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
											{(() => {
												const isThreadClosed = t.isDealClosed || (!!t.lastMessagePreview && (
													t.lastMessagePreview.toLowerCase().includes("approved the deliverables report") ||
													t.lastMessagePreview.toLowerCase().includes("report approved") ||
													t.lastMessagePreview.toLowerCase().includes("deal is closed") ||
													t.lastMessagePreview.toLowerCase().includes("officially completed and closed") ||
													t.lastMessagePreview.toLowerCase().includes("deal is officially closed") ||
													t.lastMessagePreview.toLowerCase().includes("deal is completed")
												))
												const isThreadLocked = t.isDealLocked || (!!t.lastMessagePreview && (
													t.lastMessagePreview.toLowerCase().includes("deal is locked") ||
													t.lastMessagePreview.toLowerCase().includes("deal is officially locked") ||
													t.lastMessagePreview.toLowerCase().includes("locked and confirmed") ||
													t.lastMessagePreview.toLowerCase().includes("deal confirmed")
												))
												return (
													<div className="flex items-center gap-1.5 min-w-0">
														<p className="text-sm font-black text-black truncate">{t.counterpartName}</p>
														{isThreadClosed ? (
															<span className="shrink-0 inline-flex items-center justify-center size-4 rounded-full bg-[#10B981] text-white" title="Deal Closed">
																<svg className="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
																	<polyline points="20 6 9 17 4 12" />
																</svg>
															</span>
														) : isThreadLocked ? (
															<span className="shrink-0 text-xs" title="Deal Locked">🔒</span>
														) : null}
													</div>
												)
											})()}
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

							{selectedThread.chatStatus === "ACCEPTED" && (
								<SpaceHostDealBanner
									deal={deal}
									role={role}
									onLock={() => setShowDealModal(true)}
									onEdit={() => setShowDealModal(true)}
									onView={() => setShowDetailsModal(true)}
									onReport={() => setShowReportModal(true)}
									hasReport={Boolean(report)}
									report={report}
								/>
							)}

							<div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 min-h-0">
								{selectedThread.chatStatus === "REQUESTED" ? (
									<div className="m-auto text-center max-w-xs animate-in fade-in duration-200">
										<p className="text-sm font-black text-black">
											{canRespond ? "Partnership Interest" : "Request Sent"}
										</p>
										<p className="text-xs font-semibold text-black/50 mt-2">
											{canRespond ? "Accept this request to start chatting." : "Waiting for the community to accept your request."}
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
										const isSystemMessage =
											m.messageType === "SYSTEM" ||
											(m.senderType as string) === "SYSTEM" ||
											m.content?.startsWith("[System]") ||
											(typeof m.content === "string" && (
												m.content.toLowerCase().includes("deal is locked") ||
												m.content.toLowerCase().includes("deal is officially locked") ||
												m.content.toLowerCase().includes("deal is closed") ||
												m.content.toLowerCase().includes("deal is officially closed") ||
												m.content.toLowerCase().includes("deliverables report was submitted") ||
												m.content.toLowerCase().includes("revision was requested on the deliverables") ||
												m.content.toLowerCase().includes("deal proposal was shared")
											))

										if (isSystemMessage) {
											return <SystemMessageBubble key={m.id} content={m.content ?? ""} />
										}

										const isMine = m.senderType === role
										const isHost = m.senderType === "HOST"
										const isSpaceMsg = m.senderType === "SPACE"
										const isAdmin = (m.senderType as string) === "ADMIN" || (m.senderType as string) === "BOT"
										const isDarkBubble = isSpaceMsg

										return (
											<div
												key={m.id}
												id={`space-host-msg-${m.id}`}
												className={clsx(
													"flex flex-col max-w-[85%] sm:max-w-[75%] md:max-w-[70%] transition-all duration-300 rounded-2xl p-1",
													isMine ? "self-end items-end" : "self-start items-start",
													highlightedMessageId === m.id && "ring-4 ring-[#EE2C2C] bg-[#FFC940]/30 shadow-lg scale-[1.02]"
												)}
											>
												<div className="flex items-center gap-2 mb-0.5 px-1">
													<span className="text-[10px] font-black uppercase tracking-wide text-black/30">
														{isMine
															? "You"
															: m.senderType === "SPACE"
															? `${selectedThread.counterpartName} • Space`
															: isHost
															? `${selectedThread.counterpartName} • Community`
															: "Meetday • Admin"}
													</span>
													{!m.deletedAt && (
														<button type="button" onClick={() => handleReplyStart(m)} className="text-[10px] font-bold text-black/30 hover:text-black">
															Reply
														</button>
													)}
												</div>
												<div
													className={clsx(
														"rounded-2xl p-2 sm:p-2.5 text-sm font-semibold break-words flex flex-col shadow-xs",
														isMine ? "rounded-br-sm" : "rounded-bl-sm",
														isHost && "bg-[#FFC940] text-black",
														isSpaceMsg && "bg-black text-white",
														isAdmin && "bg-neutral-200 text-black",
														!isHost && !isSpaceMsg && !isAdmin && "bg-neutral-200 text-black",
													)}
												>
													{m.deletedAt ? (
														<span className="italic opacity-60">Message deleted</span>
													) : (
														<>
															{m.replyTo && (
																<button
																	type="button"
																	onClick={() => handleJumpToMessage(m.replyTo!.id)}
																	className={clsx(
																		"w-full text-left mb-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer block border-l-4 shadow-xs",
																		isDarkBubble ? "bg-white/15 hover:bg-white/20 text-white border-white/70" : "bg-black/10 hover:bg-black/15 text-black border-black/40"
																	)}
																	title="Click to jump to message"
																>
																	<p className={clsx("text-[9px] font-black uppercase tracking-wider", isDarkBubble ? "text-white/80" : "text-black/60")}>
																		↩ Replying to {replyLabel(m.replyTo.senderType)}
																	</p>
																	{m.replyTo.hasMedia && (
																		<p className={clsx("text-xs font-semibold flex items-center gap-1 my-0.5", isDarkBubble ? "text-white/90" : "text-black/70")}>
																			📄 Attachment
																		</p>
																	)}
																	{m.replyTo.content && (
																		<p className={clsx("text-xs font-medium break-words whitespace-pre-wrap leading-relaxed mt-0.5", isDarkBubble ? "text-white/90" : "text-black/80")}>
																			{m.replyTo.content}
																		</p>
																	)}
																</button>
															)}
															{m.mediaUrl &&
																(isPdfMediaUrl(m.mediaUrl) ? (
																	<a href={m.mediaUrl} target="_blank" rel="noreferrer" className="underline text-xs font-bold">
																		📄 View attachment
																	</a>
																) : (
																	// eslint-disable-next-line @next/next/no-img-element
																	<img
																		src={m.mediaUrl}
																		alt=""
																		onClick={() => setViewingImage(m.mediaUrl!)}
																		className="max-w-[220px] max-h-[220px] rounded-xl object-cover cursor-pointer mb-1"
																	/>
																))}
															{m.content}
														</>
													)}
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
								<div className="border-t-[3px] border-black shrink-0 bg-white flex flex-col">
									{replyingTo && (
										<div className="px-3 sm:px-3.5 pt-2.5 flex items-center justify-between gap-2 pb-2 border-b border-black/10">
											<div className="min-w-0 pl-2 border-l-2 border-[#EE2C2C]">
												<p className="text-[10px] font-black uppercase text-black/40">Replying to {replyLabel(replyingTo.senderType)}</p>
												<p className="text-[11px] font-semibold text-black/50 truncate">
													{replyingTo.content?.trim() ? replyingTo.content : replyingTo.mediaUrl ? "Attachment" : ""}
												</p>
											</div>
											<button type="button" onClick={handleReplyCancel} className="text-[10px] font-bold text-[#EE2C2C] shrink-0">
												Cancel
											</button>
										</div>
									)}
									<div className="p-2.5 sm:p-3 flex items-center gap-2 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
									<input type="file" accept="image/*,application/pdf" ref={fileInputRef} onChange={handleImagePick} className="hidden" />
									<button
										type="button"
										onClick={() => fileInputRef.current?.click()}
										disabled={uploadingImage}
										className="shrink-0 size-9 rounded-xl border-[3px] border-black flex items-center justify-center hover:bg-neutral-50 disabled:opacity-50"
										aria-label="Attach image or PDF"
									>
										<Icon as={GallerySvg} size="sm" />
									</button>
									<EmojiPicker onSelect={(emoji) => setMessageInput((prev) => prev + emoji)} />
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
								</div>
							)}
						</>
					)}
				</div>
			</div>

			{showDealModal && selectedThread && (
				<SpaceHostDealFormModal
					interestId={selectedThread.id}
					thread={selectedThread}
					deal={deal}
					role={role}
					onClose={() => setShowDealModal(false)}
					onSaved={(saved) => {
						setDeal(saved)
					}}
				/>
			)}

			{showDetailsModal && selectedThread && deal && (
				<SpaceHostDealDetailsModal
					interestId={selectedThread.id}
					deal={deal}
					role={role}
					onClose={() => setShowDetailsModal(false)}
					onUpdated={(updated) => {
						setDeal(updated)
					}}
				/>
			)}

			{showReportModal && selectedThread && (
				<SpaceHostDealReportModal
					interestId={selectedThread.id}
					role={role}
					onClose={() => setShowReportModal(false)}
					onReportUpdated={(updated) => {
						setReport(updated)
					}}
				/>
			)}

			<canvas
				id="space-host-chat-confetti-canvas"
				className="fixed inset-0 pointer-events-none z-50 w-full h-full"
			/>

			{viewingImage && <ImageLightbox url={viewingImage} onClose={() => setViewingImage(null)} />}
		</div>
	)
}
