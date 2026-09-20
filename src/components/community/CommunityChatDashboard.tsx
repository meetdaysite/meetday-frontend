"use client"

import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import clsx from "clsx"
import {
	getMyCommunityCollaborationChats,
	getCommunityCollaborationChatMessages,
	sendCommunityCollaborationMessage,
	acceptCommunityCollaborationRequest,
	declineCommunityCollaborationRequest,
	type CommunityCollaborationThread,
	type CommunityCollaborationMessage,
} from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"
import { toast } from "@/lib/toast"
import { uploadCommunityCollaborationChatImage } from "@/lib/uploadMedia"
import { ImageLightbox } from "@/components/ui/ImageLightbox"
import { EmojiPicker } from "@/components/ui/EmojiPicker"
import { playMessageChime } from "@/lib/notificationSound"
import { useNotificationStore } from "@/store/notificationStore"
import { LinkifiedText } from "@/components/ui/LinkifiedText"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import GallerySvg from "@/icons/outlined/gallery-wide.svg"
import AltArrowLeftSvg from "@/icons/outlined/alt-arrow-left.svg"

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

export type CommunityChatSubTab = "ACCEPTED" | "REQUESTS" | "SENT_REQUESTS"

export function CommunityChatDashboard() {
	const searchParams = useSearchParams()
	const initialThreadParam = searchParams.get("threadId") || searchParams.get("interestId")

	const [threads, setThreads] = useState<CommunityCollaborationThread[]>([])
	const [loadingThreads, setLoadingThreads] = useState(true)
	const [activeTab, setActiveTab] = useState<CommunityChatSubTab>("ACCEPTED")
	const [selectedThreadId, setSelectedThreadId] = useState<string | null>(initialThreadParam)

	const [messages, setMessages] = useState<CommunityCollaborationMessage[]>([])
	const [loadingMessages, setLoadingMessages] = useState(false)
	const [input, setInput] = useState("")
	const [sending, setSending] = useState(false)
	const [replyingTo, setReplyingTo] = useState<CommunityCollaborationMessage | null>(null)
	const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)

	const [uploadingImage, setUploadingImage] = useState(false)
	const [viewingImage, setViewingImage] = useState<string | null>(null)
	const [responding, setResponding] = useState(false)

	const fileInputRef = useRef<HTMLInputElement>(null)
	const bottomRef = useRef<HTMLDivElement>(null)
	const highlightTimerRef = useRef<NodeJS.Timeout | null>(null)
	const prevMsgCountRef = useRef(0)

	const { markThreadRead } = useNotificationStore()

	// Fetch threads list
	const fetchThreads = useCallback((quiet = false) => {
		if (!quiet) setLoadingThreads(true)
		getMyCommunityCollaborationChats()
			.then((data) => {
				setThreads(data || [])
			})
			.catch(() => {})
			.finally(() => {
				if (!quiet) setLoadingThreads(false)
			})
	}, [])

	useEffect(() => {
		fetchThreads()
		const interval = setInterval(() => fetchThreads(true), THREADS_POLL_MS)
		return () => clearInterval(interval)
	}, [fetchThreads])

	// Auto-select initial thread from URL parameter
	useEffect(() => {
		if (initialThreadParam && threads.length > 0) {
			const found = threads.find((t) => t.id === initialThreadParam)
			if (found) {
				setSelectedThreadId(found.id)
				if (found.chatStatus === "ACCEPTED") {
					setActiveTab("ACCEPTED")
				} else if (found.direction === "INCOMING") {
					setActiveTab("REQUESTS")
				} else {
					setActiveTab("SENT_REQUESTS")
				}
			}
		}
	}, [initialThreadParam, threads])

	const selectedThread = useMemo(() => {
		return threads.find((t) => t.id === selectedThreadId) || null
	}, [threads, selectedThreadId])

	// Mark read on selection
	useEffect(() => {
		if (selectedThreadId) {
			setThreads((prev) =>
				prev.map((t) => (t.id === selectedThreadId ? { ...t, unreadCount: 0 } : t))
			)
			markThreadRead(selectedThreadId)
		}
	}, [selectedThreadId, markThreadRead])

	// Filter threads by active tab
	const filteredThreads = useMemo(() => {
		return threads.filter((t) => {
			if (activeTab === "ACCEPTED") return t.chatStatus === "ACCEPTED"
			if (activeTab === "REQUESTS") return t.chatStatus === "REQUESTED" && t.direction === "INCOMING"
			if (activeTab === "SENT_REQUESTS") return t.chatStatus === "REQUESTED" && t.direction === "OUTGOING"
			return true
		})
	}, [threads, activeTab])

	// Counts
	const unreadAcceptedCount = useMemo(() => {
		return threads
			.filter((t) => t.chatStatus === "ACCEPTED")
			.reduce((sum, t) => sum + (selectedThreadId === t.id ? 0 : t.unreadCount || 0), 0)
	}, [threads, selectedThreadId])

	const unreadRequestsCount = useMemo(() => {
		return threads
			.filter((t) => t.chatStatus === "REQUESTED" && t.direction === "INCOMING")
			.reduce((sum, t) => sum + (selectedThreadId === t.id ? 0 : t.unreadCount || 0), 0)
	}, [threads, selectedThreadId])

	const sentRequestsCount = useMemo(() => {
		return threads.filter((t) => t.chatStatus === "REQUESTED" && t.direction === "OUTGOING").length
	}, [threads])

	// Fetch messages for selected thread
	const fetchMessages = useCallback(
		(quiet = false) => {
			if (!selectedThreadId) return
			if (!quiet) setLoadingMessages(true)
			getCommunityCollaborationChatMessages(selectedThreadId)
				.then((res) => {
					const newMessages = res.messages || []
					if (prevMsgCountRef.current > 0 && newMessages.length > prevMsgCountRef.current) {
						const newest = newMessages[newMessages.length - 1]
						if (newest && newest.senderType !== res.mySenderType) {
							playMessageChime()
						}
					}
					prevMsgCountRef.current = newMessages.length
					setMessages(newMessages)
				})
				.catch((err) => {
					if (!quiet) toast.error(getApiErrorMessage(err))
				})
				.finally(() => {
					if (!quiet) setLoadingMessages(false)
				})
		},
		[selectedThreadId]
	)

	useEffect(() => {
		if (!selectedThreadId) {
			setMessages([])
			return
		}
		prevMsgCountRef.current = 0
		fetchMessages()
		const interval = setInterval(() => fetchMessages(true), MESSAGES_POLL_MS)
		return () => clearInterval(interval)
	}, [selectedThreadId, fetchMessages])

	// Scroll to bottom on new messages
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [messages.length])

	// Jump to message
	const handleJumpToMessage = useCallback((messageId: string) => {
		const el = document.getElementById(`collab-msg-${messageId}`)
		if (el) {
			el.scrollIntoView({ behavior: "smooth", block: "center" })
			if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
			setHighlightedMessageId(messageId)
			highlightTimerRef.current = setTimeout(() => {
				setHighlightedMessageId(null)
			}, 2000)
		}
	}, [])

	// Send message
	async function handleSend() {
		if (!selectedThreadId || !input.trim() || sending) return
		setSending(true)
		try {
			const sent = await sendCommunityCollaborationMessage(selectedThreadId, {
				content: input.trim(),
				replyToId: replyingTo?.id,
			})
			setMessages((prev) => [...prev, sent])
			setInput("")
			setReplyingTo(null)
			fetchThreads(true)
		} catch (err) {
			toast.error(getApiErrorMessage(err))
		} finally {
			setSending(false)
		}
	}

	// Image pick
	async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		e.target.value = ""
		if (!file || !selectedThreadId) return
		if (!file.type.startsWith("image/")) {
			toast.error("Only image files can be sent.")
			return
		}

		setUploadingImage(true)
		try {
			const mediaKey = await uploadCommunityCollaborationChatImage(file, selectedThreadId)
			const sent = await sendCommunityCollaborationMessage(selectedThreadId, {
				mediaKey,
				replyToId: replyingTo?.id,
			})
			setMessages((prev) => [...prev, sent])
			setReplyingTo(null)
			fetchThreads(true)
		} catch (err) {
			toast.error(getApiErrorMessage(err))
		} finally {
			setUploadingImage(false)
		}
	}

	// Accept / Decline request
	async function handleAccept() {
		if (!selectedThreadId || responding) return
		setResponding(true)
		try {
			await acceptCommunityCollaborationRequest(selectedThreadId)
			toast.success("Accepted — you can now chat.")
			fetchThreads()
			setActiveTab("ACCEPTED")
			fetchMessages()
		} catch (err) {
			toast.error(getApiErrorMessage(err))
		} finally {
			setResponding(false)
		}
	}

	async function handleDecline() {
		if (!selectedThreadId || responding) return
		setResponding(true)
		try {
			await declineCommunityCollaborationRequest(selectedThreadId)
			toast.success("Request declined.")
			fetchThreads()
			setSelectedThreadId(null)
		} catch (err) {
			toast.error(getApiErrorMessage(err))
		} finally {
			setResponding(false)
		}
	}

	return (
		<div className="h-[calc(100vh-240px)] border-[3px] border-black rounded-[24px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col sm:flex-row bg-white min-h-0">
			{/* Thread list sidebar */}
			<div
				className={clsx(
					"w-full sm:w-80 md:w-80 shrink-0 sm:min-w-[320px] sm:max-w-[320px] border-b-[3px] sm:border-b-0 sm:border-r-[3px] border-black flex flex-col",
					selectedThreadId ? "hidden sm:flex" : "flex"
				)}
			>
				{/* Sub-tabs header */}
				<div className="flex border-b-[3px] border-black shrink-0">
					{(["ACCEPTED", "REQUESTS", "SENT_REQUESTS"] as const).map((tab) => {
						const isReq = tab === "REQUESTS"
						const isSent = tab === "SENT_REQUESTS"
						const count = isReq
							? unreadRequestsCount
							: isSent
							? sentRequestsCount
							: unreadAcceptedCount
						const isActive = activeTab === tab

						let label = "Accepted"
						if (isReq) label = "Requests"
						if (isSent) label = "Sent"

						return (
							<button
								key={tab}
								type="button"
								onClick={() => {
									setActiveTab(tab)
									setSelectedThreadId(null)
								}}
								className={clsx(
									"flex-grow py-3 text-xs font-black uppercase tracking-wider transition-colors relative flex items-center justify-center gap-1.5",
									isActive ? "bg-[#EE2C2C] text-white" : "bg-white text-black/50 hover:bg-neutral-50"
								)}
							>
								<span>{label}</span>
								{count > 0 && (
									<span
										className={clsx(
											"min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-black flex items-center justify-center border",
											isActive
												? "bg-white text-[#EE2C2C] border-transparent"
												: "bg-[#FFC940] text-black border-black/10"
										)}
									>
										{count}
									</span>
								)}
							</button>
						)
					})}
				</div>

				{/* Threads list scrollable container */}
				<div className="flex-1 overflow-y-auto">
					{loadingThreads && threads.length === 0 ? (
						<p className="text-xs font-semibold text-black/40 text-center py-8">Loading…</p>
					) : filteredThreads.length === 0 ? (
						<p className="text-xs font-semibold text-black/40 text-center py-8 px-4">
							{activeTab === "ACCEPTED"
								? "No accepted community chats yet."
								: activeTab === "REQUESTS"
								? "No pending collaboration requests."
								: "No sent requests."}
						</p>
					) : (
						filteredThreads.map((t) => {
							const isSelected = selectedThreadId === t.id
							const unread = isSelected ? 0 : t.unreadCount || 0
							return (
								<button
									key={t.id}
									type="button"
									onClick={() => setSelectedThreadId(t.id)}
									className={clsx(
										"w-full text-left px-4 py-3 border-b border-black/10 transition-colors flex items-center gap-3",
										isSelected ? "bg-[#FFC940]/20" : "hover:bg-neutral-50"
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
										{unread > 0 && (
											<span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#EE2C2C] text-white text-[9px] font-black flex items-center justify-center border-2 border-white shadow-sm">
												{unread > 9 ? "9+" : unread}
											</span>
										)}
									</div>

									<div className="flex-1 min-w-0">
										<div className="flex items-center justify-between gap-2">
											<p className="text-sm font-black text-black truncate">{t.counterpartName}</p>
											<span className="text-[10px] font-semibold text-black/30 shrink-0">
												{timeAgo(t.lastMessageAt || t.createdAt)}
											</span>
										</div>
										<p className="text-[11px] font-semibold text-black/40 truncate mt-0.5">
											{t.lastMessagePreview ||
												(t.chatStatus === "ACCEPTED"
													? "Ready to collaborate! Send a message."
													: t.direction === "INCOMING"
													? "Collaboration request received"
													: "Collaboration request sent")}
										</p>
										{t.chatStatus === "REQUESTED" && t.direction === "INCOMING" && (
											<div className="flex items-center gap-1.5 mt-1.5">
												<span className="px-2 py-0.5 rounded-lg bg-[#22C55E]/10 text-[#22C55E] text-[10px] font-black uppercase border border-[#22C55E]/20">
													Incoming Request
												</span>
											</div>
										)}
										{t.chatStatus === "REQUESTED" && t.direction === "OUTGOING" && (
											<span className="text-[10px] font-black uppercase text-black/40 mt-1 block">
												Awaiting response
											</span>
										)}
									</div>
								</button>
							)
						})
					)}
				</div>
			</div>

			{/* Thread detail panel */}
			<div
				className={clsx(
					"flex-1 min-w-0 min-h-0 flex flex-col bg-white",
					selectedThreadId ? "flex" : "hidden sm:flex"
				)}
			>
				{!selectedThread ? (
					<div className="flex-1 flex items-center justify-center text-sm font-semibold text-black/30">
						Select a chat to view
					</div>
				) : (
					<div className="flex-1 min-w-0 min-h-0 flex flex-col relative h-full bg-white">
						{/* Top Header */}
						<div className="px-3 sm:px-5 py-2.5 sm:py-3 border-b-[3px] border-black bg-white flex items-center justify-between shrink-0 gap-2">
							<div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
								<button
									type="button"
									onClick={() => setSelectedThreadId(null)}
									className="sm:hidden p-1.5 -ml-1 text-black/70 hover:text-black hover:bg-neutral-100 rounded-full shrink-0 transition-colors"
									aria-label="Back to chat list"
								>
									<Icon as={AltArrowLeftSvg} size="sm" />
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
									<p className="text-xs sm:text-sm font-black text-black truncate leading-tight">
										{selectedThread.counterpartName}
									</p>
									<p className="text-[10px] sm:text-[11px] font-semibold text-black/40 truncate">
										Community Collaboration
									</p>
								</div>
							</div>

							{selectedThread.chatStatus === "REQUESTED" && selectedThread.direction === "INCOMING" && (
								<div className="flex items-center gap-2 shrink-0">
									<button
										type="button"
										onClick={handleAccept}
										disabled={responding}
										className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#22C55E] hover:bg-[#1ea750] text-white font-black text-xs border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer select-none disabled:opacity-50"
									>
										{responding ? "Accepting…" : "Accept"}
									</button>
									<button
										type="button"
										onClick={handleDecline}
										disabled={responding}
										className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-50 text-black font-black text-xs border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer select-none disabled:opacity-50"
									>
										Decline
									</button>
								</div>
							)}
						</div>

						{/* Messages scroll area */}
						<div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
							{loadingMessages ? (
								<p className="text-xs font-semibold text-black/40 text-center">Loading…</p>
							) : selectedThread.chatStatus === "REQUESTED" ? (
								<div className="m-auto text-center max-w-xs animate-in fade-in duration-200">
									{selectedThread.direction === "INCOMING" ? (
										<>
											<p className="text-sm font-black text-black">Collaboration Request Received</p>
											<p className="text-xs font-semibold text-black/50 mt-2">
												{selectedThread.counterpartName} wants to collaborate with your community. Accept the request to start chatting.
											</p>
											<button
												type="button"
												onClick={handleAccept}
												disabled={responding}
												className="mt-4 inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#EE2C2C] hover:bg-[#d42525] text-white font-black text-xs border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer disabled:opacity-50"
											>
												{responding ? "Accepting…" : "Accept Request"}
											</button>
										</>
									) : (
										<>
											<p className="text-sm font-black text-black">Collaboration Request Sent</p>
											<p className="text-xs font-semibold text-black/50 mt-2">
												You&apos;ve sent a collaboration request to {selectedThread.counterpartName}. You can start messaging as soon as they accept.
											</p>
										</>
									)}
								</div>
							) : messages.length === 0 ? (
								<p className="text-xs font-semibold text-black/40 text-center m-auto">
									No messages yet — say hi and start collaborating!
								</p>
							) : (
								messages.map((m) => {
									const isMine = m.senderType === selectedThread.mySenderType
									return (
										<div
											key={m.id}
											id={`collab-msg-${m.id}`}
											className={clsx(
												"flex flex-col max-w-[85%] sm:max-w-[75%] md:max-w-[70%] transition-all duration-300 rounded-2xl p-1",
												isMine ? "self-end items-end" : "self-start items-start",
												highlightedMessageId === m.id && "ring-4 ring-[#EE2C2C] bg-[#FFC940]/30 shadow-lg scale-[1.02]"
											)}
										>
											<div className="flex items-center gap-2 mb-0.5 px-1">
												<span className="text-[10px] font-black uppercase tracking-wide text-black/30">
													{isMine ? "You" : selectedThread.counterpartName}
												</span>
												{selectedThread.chatStatus === "ACCEPTED" && (
													<button
														type="button"
														onClick={() => setReplyingTo(m)}
														className="text-[10px] font-bold text-black/30 hover:text-black cursor-pointer"
													>
														Reply
													</button>
												)}
											</div>

											<div
												className={clsx(
													"rounded-2xl p-2 sm:p-2.5 text-sm font-semibold break-words flex flex-col shadow-xs",
													isMine ? "rounded-br-sm bg-[#FFC940] text-black" : "rounded-bl-sm bg-neutral-100 text-black border border-black/5"
												)}
											>
												{m.replyTo && (
													<button
														type="button"
														onClick={() => handleJumpToMessage(m.replyTo!.id)}
														className="w-full text-left mb-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer block border-l-4 shadow-xs bg-black/10 hover:bg-black/15 text-black border-black/40"
														title="Click to jump to message"
													>
														<p className="text-[9px] font-black uppercase tracking-wider text-black/60">
															↩ Replying to {m.replyTo.sender?.firstName || "message"}
														</p>
														{m.replyTo.content && (
															<p className="text-xs font-medium break-words whitespace-pre-wrap leading-relaxed mt-0.5 text-black/80">
																{m.replyTo.content}
															</p>
														)}
													</button>
												)}

												{m.mediaUrl && (
													/* eslint-disable-next-line @next/next/no-img-element */
													<img
														src={m.mediaUrl}
														alt="Shared attachment"
														onClick={() => setViewingImage(m.mediaUrl!)}
														className="max-w-[240px] max-h-[240px] rounded-2xl border-[3px] border-black object-cover cursor-pointer mb-1 hover:opacity-95 transition-opacity"
													/>
												)}

												{m.content && (
													<div className="px-1 py-0.5">
														<LinkifiedText
															text={m.content}
															linkClassName={isMine ? "underline font-bold text-black" : "underline font-bold text-[#EE2C2C]"}
														/>
													</div>
												)}
											</div>

											<div
												className={clsx(
													"flex items-center gap-1 mt-0.5 text-[9px] font-bold text-black/40 px-1",
													isMine ? "justify-end" : "justify-start"
												)}
											>
												<span>
													{(() => {
														try {
															return new Date(m.createdAt).toLocaleTimeString([], {
																hour: "2-digit",
																minute: "2-digit",
															})
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
							<div ref={bottomRef} />
						</div>

						{/* Bottom Input Bar */}
						{selectedThread.chatStatus === "ACCEPTED" && (
							<div className="border-t-[3px] border-black shrink-0 bg-white flex flex-col">
								{replyingTo && (
									<div className="px-3 pt-2 flex items-center justify-between gap-2 border-b border-black/10 pb-2">
										<div className="min-w-0 pl-2 border-l-2 border-[#EE2C2C]">
											<p className="text-[10px] font-black uppercase text-black/40">
												Replying to {replyingTo.sender?.firstName || selectedThread.counterpartName}
											</p>
											<p className="text-[11px] font-semibold text-black/50 truncate">
												{replyingTo.content?.trim() ? replyingTo.content : "Photo"}
											</p>
										</div>
										<button
											type="button"
											onClick={() => setReplyingTo(null)}
											className="text-[10px] font-bold text-[#EE2C2C] shrink-0 cursor-pointer"
										>
											Cancel
										</button>
									</div>
								)}

								<div className="relative p-2.5 sm:p-3 flex items-center gap-2 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
									<input
										type="file"
										accept="image/*"
										ref={fileInputRef}
										onChange={handleImagePick}
										className="hidden"
									/>
									<button
										type="button"
										onClick={() => fileInputRef.current?.click()}
										disabled={uploadingImage}
										className="shrink-0 size-9 rounded-xl border-[3px] border-black flex items-center justify-center hover:bg-neutral-50 disabled:opacity-50 cursor-pointer"
										aria-label="Attach photo"
									>
										<Icon as={GallerySvg} size="sm" />
									</button>
									<EmojiPicker onSelect={(emoji) => setInput((prev) => prev + emoji)} />
									<input
										value={input}
										onChange={(e) => setInput(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter" && !e.shiftKey) {
												e.preventDefault()
												handleSend()
											}
										}}
										placeholder="Write a message…"
										className="flex-1 min-w-0 rounded-2xl border-[3px] border-black bg-white px-3.5 sm:px-4 py-2 text-sm font-semibold outline-none focus:bg-neutral-50"
									/>
									<Button
										onClick={handleSend}
										disabled={sending || uploadingImage || !input.trim()}
										className="shrink-0 whitespace-nowrap"
									>
										{sending ? "…" : "Send"}
									</Button>
								</div>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Lightbox Modal */}
			{viewingImage && <ImageLightbox url={viewingImage} onClose={() => setViewingImage(null)} />}
		</div>
	)
}
