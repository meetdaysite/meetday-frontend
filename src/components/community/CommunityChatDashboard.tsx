"use client"

import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import clsx from "clsx"
import Image from "next/image"
import Link from "next/link"
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
import { LinkifiedText } from "@/components/ui/LinkifiedText"
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

function formatDateDivider(iso: string): string {
	const d = new Date(iso)
	const today = new Date()
	const yesterday = new Date()
	yesterday.setDate(yesterday.getDate() - 1)

	if (d.toDateString() === today.toDateString()) return "Today"
	if (d.toDateString() === yesterday.toDateString()) return "Yesterday"
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined })
}

export type CommunityChatSubTab = "ACCEPTED" | "REQUESTS" | "SENT_REQUESTS"

export function CommunityChatDashboard() {
	const searchParams = useSearchParams()
	const initialThreadParam = searchParams.get("threadId") || searchParams.get("interestId")

	const [threads, setThreads] = useState<CommunityCollaborationThread[]>([])
	const [loadingThreads, setLoadingThreads] = useState(true)
	const [activeTab, setActiveTab] = useState<CommunityChatSubTab>("ACCEPTED")
	const [selectedThreadId, setSelectedThreadId] = useState<string | null>(initialThreadParam)
	const [searchQuery, setSearchQuery] = useState("")

	const [messages, setMessages] = useState<CommunityCollaborationMessage[]>([])
	const [loadingMessages, setLoadingMessages] = useState(false)
	const [messageText, setMessageText] = useState("")
	const [sending, setSending] = useState(false)
	const [replyTo, setReplyTo] = useState<CommunityCollaborationMessage | null>(null)

	const [pendingMediaKey, setPendingMediaKey] = useState<string | null>(null)
	const [pendingMediaPreview, setPendingMediaPreview] = useState<string | null>(null)
	const [uploadingMedia, setUploadingMedia] = useState(false)
	const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
	const [responding, setResponding] = useState(false)

	const fileInputRef = useRef<HTMLInputElement>(null)
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const prevMsgCountRef = useRef(0)

	// Fetch threads
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

	// Auto-select initial thread from URL query param
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

	// Filter threads by active tab & search query
	const filteredThreads = useMemo(() => {
		return threads.filter((t) => {
			if (activeTab === "ACCEPTED" && t.chatStatus !== "ACCEPTED") return false
			if (activeTab === "REQUESTS" && (t.chatStatus !== "REQUESTED" || t.direction !== "INCOMING")) return false
			if (activeTab === "SENT_REQUESTS" && (t.chatStatus !== "REQUESTED" || t.direction !== "OUTGOING")) return false

			if (searchQuery.trim()) {
				const query = searchQuery.trim().toLowerCase()
				const name = (t.counterpartName || "").toLowerCase()
				return name.includes(query)
			}
			return true
		})
	}, [threads, activeTab, searchQuery])

	// Incoming requests count badge
	const incomingRequestsCount = useMemo(() => {
		return threads.filter((t) => t.direction === "INCOMING" && t.chatStatus === "REQUESTED").length
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
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [messages])

	// Handle sending a message
	async function handleSendMessage(e?: React.FormEvent) {
		e?.preventDefault()
		if (!selectedThreadId || sending || uploadingMedia) return
		const text = messageText.trim()
		if (!text && !pendingMediaKey) return

		setSending(true)
		try {
			const sent = await sendCommunityCollaborationMessage(selectedThreadId, {
				content: text || undefined,
				mediaKey: pendingMediaKey || undefined,
				replyToId: replyTo ? replyTo.id : undefined,
			})
			setMessages((prev) => [...prev, sent])
			setMessageText("")
			setReplyTo(null)
			setPendingMediaKey(null)
			setPendingMediaPreview(null)
			fetchThreads(true)
		} catch (err) {
			toast.error(getApiErrorMessage(err))
		} finally {
			setSending(false)
		}
	}

	// Handle media attachment upload
	async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		if (!file || !selectedThreadId) return

		setUploadingMedia(true)
		const preview = URL.createObjectURL(file)
		setPendingMediaPreview(preview)

		try {
			const key = await uploadCommunityCollaborationChatImage(file, selectedThreadId)
			setPendingMediaKey(key)
			toast.success("Image attached")
		} catch (err) {
			toast.error("Failed to upload image")
			setPendingMediaPreview(null)
			setPendingMediaKey(null)
		} finally {
			setUploadingMedia(false)
			if (fileInputRef.current) fileInputRef.current.value = ""
		}
	}

	// Handle accept / decline requests
	async function handleAccept() {
		if (!selectedThreadId || responding) return
		setResponding(true)
		try {
			await acceptCommunityCollaborationRequest(selectedThreadId)
			toast.success("Collaboration request accepted! You can now message each other.")
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
			toast.success("Collaboration request declined.")
			fetchThreads()
			setSelectedThreadId(null)
		} catch (err) {
			toast.error(getApiErrorMessage(err))
		} finally {
			setResponding(false)
		}
	}

	// Group messages by date
	const groupedMessages = useMemo(() => {
		const groups: { date: string; items: CommunityCollaborationMessage[] }[] = []
		let currentDate = ""
		let currentGroup: CommunityCollaborationMessage[] = []

		for (const msg of messages) {
			const dateStr = formatDateDivider(msg.createdAt)
			if (dateStr !== currentDate) {
				if (currentGroup.length > 0) {
					groups.push({ date: currentDate, items: currentGroup })
				}
				currentDate = dateStr
				currentGroup = [msg]
			} else {
				currentGroup.push(msg)
			}
		}
		if (currentGroup.length > 0) {
			groups.push({ date: currentDate, items: currentGroup })
		}
		return groups
	}, [messages])

	return (
		<div className="flex flex-col flex-1 min-h-0 bg-white border-[3px] border-black rounded-[28px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
			<div className="flex flex-col md:flex-row flex-1 min-h-0">
				{/* Left Sidebar: Threads list */}
				<div
					className={clsx(
						"w-full md:w-[360px] lg:w-[400px] border-r-[3px] border-black flex flex-col bg-slate-50/50 shrink-0",
						selectedThreadId ? "hidden md:flex" : "flex"
					)}
				>
					{/* Sub-tabs header */}
					<div className="p-3.5 border-b-2 border-black/10 flex items-center gap-1.5 bg-white">
						<button
							type="button"
							onClick={() => setActiveTab("ACCEPTED")}
							className={clsx(
								"flex-1 py-2 px-2.5 rounded-xl font-heading font-black text-xs transition-all uppercase tracking-wider text-center cursor-pointer select-none",
								activeTab === "ACCEPTED"
									? "bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
									: "bg-white text-black/60 hover:text-black border-2 border-transparent hover:border-black/10"
							)}
						>
							Chats
						</button>
						<button
							type="button"
							onClick={() => setActiveTab("REQUESTS")}
							className={clsx(
								"flex-1 py-2 px-2.5 rounded-xl font-heading font-black text-xs transition-all uppercase tracking-wider text-center cursor-pointer select-none relative inline-flex items-center justify-center gap-1.5",
								activeTab === "REQUESTS"
									? "bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
									: "bg-white text-black/60 hover:text-black border-2 border-transparent hover:border-black/10"
							)}
						>
							<span>Requests</span>
							{incomingRequestsCount > 0 && (
								<span className="size-4 rounded-full bg-[#EE2C2C] text-white text-[10px] font-black flex items-center justify-center shrink-0">
									{incomingRequestsCount}
								</span>
							)}
						</button>
						<button
							type="button"
							onClick={() => setActiveTab("SENT_REQUESTS")}
							className={clsx(
								"flex-1 py-2 px-2.5 rounded-xl font-heading font-black text-xs transition-all uppercase tracking-wider text-center cursor-pointer select-none",
								activeTab === "SENT_REQUESTS"
									? "bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
									: "bg-white text-black/60 hover:text-black border-2 border-transparent hover:border-black/10"
							)}
						>
							Sent
						</button>
					</div>

					{/* Search input */}
					<div className="p-3 border-b-2 border-black/10 bg-white">
						<div className="relative">
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search communities..."
								className="w-full bg-slate-50 border-2 border-black rounded-xl px-3.5 py-1.5 text-xs font-semibold text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black"
							/>
							{searchQuery && (
								<button
									type="button"
									onClick={() => setSearchQuery("")}
									className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-black/40 hover:text-black"
								>
									✕
								</button>
							)}
						</div>
					</div>

					{/* Threads List */}
					<div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2">
						{loadingThreads && threads.length === 0 && (
							<div className="p-6 text-center text-xs font-bold text-black/40 animate-pulse">
								Loading chats...
							</div>
						)}

						{!loadingThreads && filteredThreads.length === 0 && (
							<div className="p-8 text-center flex flex-col items-center gap-3">
								<div className="size-12 rounded-2xl bg-black/5 border-2 border-black/10 flex items-center justify-center text-xl">
									💬
								</div>
								<p className="text-xs font-bold text-black/50 max-w-[200px]">
									{activeTab === "ACCEPTED"
										? "No active community chats yet."
										: activeTab === "REQUESTS"
										? "No incoming collaboration requests."
										: "No sent collaboration requests."}
								</p>
								{activeTab === "ACCEPTED" && (
									<Link
										href="/community/dashboard/communities"
										className="mt-1 text-xs font-black px-3.5 py-1.5 rounded-xl border-2 border-black bg-[#FFC940] hover:bg-[#ffbe1a] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all uppercase tracking-wider"
									>
										Explore Communities
									</Link>
								)}
							</div>
						)}

						{filteredThreads.map((thread) => {
							const isSelected = thread.id === selectedThreadId
							return (
								<div
									key={thread.id}
									onClick={() => setSelectedThreadId(thread.id)}
									className={clsx(
										"p-3 rounded-2xl border-2 border-black cursor-pointer transition-all flex items-start gap-3 select-none",
										isSelected
											? "bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[1px] translate-y-[1px]"
											: "bg-white/80 hover:bg-white hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
									)}
								>
									<div className="relative size-11 rounded-xl border-2 border-black overflow-hidden bg-[#FFCE29] shrink-0 flex items-center justify-center font-heading font-black text-black text-sm">
										{thread.counterpartAvatarUrl ? (
											<Image src={thread.counterpartAvatarUrl} alt={thread.counterpartName} fill className="object-cover" unoptimized />
										) : (
											thread.counterpartName.substring(0, 2).toUpperCase()
										)}
									</div>

									<div className="flex-1 min-w-0 flex flex-col gap-1">
										<div className="flex items-center justify-between gap-1.5">
											<h4 className="font-heading font-black text-sm text-black truncate">
												{thread.counterpartName}
											</h4>
											<span className="text-[10px] font-bold text-black/40 shrink-0">
												{timeAgo(thread.lastMessageAt || thread.createdAt)}
											</span>
										</div>

										<div className="flex items-center justify-between gap-1">
											<p className="text-xs font-semibold text-black/60 truncate">
												{thread.lastMessagePreview ||
													(thread.chatStatus === "ACCEPTED"
														? "Ready to collaborate! Send a message."
														: thread.direction === "INCOMING"
														? "Requested collaboration with you"
														: "Collaboration request sent")}
											</p>
											{thread.unreadCount > 0 && (
												<span className="size-4.5 min-w-[18px] px-1 rounded-full bg-[#FFC940] text-black font-black text-[10px] flex items-center justify-center shrink-0 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
													{thread.unreadCount}
												</span>
											)}
										</div>
									</div>
								</div>
							)
						})}
					</div>
				</div>

				{/* Right Pane: Active Chat Conversation */}
				<div
					className={clsx(
						"flex-1 flex flex-col bg-white min-w-0 min-h-0",
						!selectedThreadId ? "hidden md:flex" : "flex"
					)}
				>
					{selectedThread ? (
						<>
							{/* Top Thread Header */}
							<div className="px-4 py-3.5 border-b-2 border-black/10 flex items-center justify-between gap-3 bg-white shrink-0">
								<div className="flex items-center gap-3 min-w-0">
									<button
										type="button"
										onClick={() => setSelectedThreadId(null)}
										className="md:hidden size-8 rounded-xl border-2 border-black flex items-center justify-center text-black font-extrabold hover:bg-black/5"
										aria-label="Back to threads"
									>
										‹
									</button>

									<div className="relative size-10 rounded-xl border-2 border-black overflow-hidden bg-[#FFCE29] shrink-0 flex items-center justify-center font-heading font-black text-black text-sm">
										{selectedThread.counterpartAvatarUrl ? (
											<Image
												src={selectedThread.counterpartAvatarUrl}
												alt={selectedThread.counterpartName}
												fill
												className="object-cover"
												unoptimized
											/>
										) : (
											selectedThread.counterpartName.substring(0, 2).toUpperCase()
										)}
									</div>

									<div className="min-w-0 flex flex-col">
										<h3 className="font-heading font-black text-base text-black truncate leading-tight">
											{selectedThread.counterpartName}
										</h3>
										<span className="text-[10px] font-bold text-black/50 uppercase tracking-wider">
											Community Collaboration
										</span>
									</div>
								</div>

								<div className="shrink-0 flex items-center gap-2">
									{selectedThread.chatStatus === "ACCEPTED" ? (
										<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-50 text-green-700 border border-green-200">
											<span className="size-1.5 rounded-full bg-green-600 animate-pulse" />
											Active
										</span>
									) : selectedThread.direction === "INCOMING" ? (
										<span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
											Request Pending
										</span>
									) : (
										<span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
											Sent Request
										</span>
									)}
								</div>
							</div>

							{/* Request Decision Banner (if incoming request is not accepted yet) */}
							{selectedThread.chatStatus === "REQUESTED" && selectedThread.direction === "INCOMING" && (
								<div className="p-4 bg-[#FFF8E6] border-b-2 border-black/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
									<div className="flex flex-col gap-0.5">
										<p className="text-xs font-black text-black">
											{selectedThread.counterpartName} wants to collaborate with your community!
										</p>
										<p className="text-[11px] font-semibold text-black/60">
											Accept to unlock community-to-community direct messaging.
										</p>
									</div>

									<div className="flex items-center gap-2 shrink-0">
										<button
											type="button"
											onClick={handleAccept}
											disabled={responding}
											className="px-4 py-1.5 rounded-xl border-2 border-black bg-[#EE2C2C] text-white font-heading font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50 cursor-pointer uppercase tracking-wider"
										>
											{responding ? "Accepting…" : "Accept"}
										</button>
										<button
											type="button"
											onClick={handleDecline}
											disabled={responding}
											className="px-3 py-1.5 rounded-xl border-2 border-black bg-white hover:bg-black/5 text-black font-heading font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50 cursor-pointer uppercase tracking-wider"
										>
											Decline
										</button>
									</div>
								</div>
							)}

							{/* Request Sent Pending Banner */}
							{selectedThread.chatStatus === "REQUESTED" && selectedThread.direction === "OUTGOING" && (
								<div className="p-3.5 bg-blue-50/70 border-b-2 border-black/10 flex items-center gap-3 shrink-0">
									<span className="text-base">⏳</span>
									<p className="text-xs font-semibold text-blue-900">
										Collaboration request sent to <strong>{selectedThread.counterpartName}</strong>. Once accepted, you can message here.
									</p>
								</div>
							)}

							{/* Messages Area */}
							<div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 min-h-0 bg-slate-50/30">
								{loadingMessages && messages.length === 0 && (
									<div className="m-auto text-xs font-bold text-black/40">Loading messages...</div>
								)}

								{!loadingMessages && messages.length === 0 && (
									<div className="m-auto text-center flex flex-col items-center gap-2 text-black/40 max-w-sm">
										<div className="size-12 rounded-2xl bg-black/5 border-2 border-black/10 flex items-center justify-center text-xl">
											🤝
										</div>
										<h4 className="font-heading font-black text-sm text-black">
											{selectedThread.chatStatus === "ACCEPTED"
												? "You are now connected!"
												: "Collaboration Request"}
										</h4>
										<p className="text-xs font-semibold">
											{selectedThread.chatStatus === "ACCEPTED"
												? "Say hello and discuss opportunities to cross-promote or co-host experiences."
												: "Messages will appear here once the collaboration request is accepted."}
										</p>
									</div>
								)}

								{groupedMessages.map((group, gIdx) => (
									<div key={gIdx} className="flex flex-col gap-3">
										<div className="flex items-center justify-center my-1">
											<span className="px-3 py-0.5 rounded-full bg-black/5 text-[10px] font-black uppercase tracking-wider text-black/50 border border-black/10">
												{group.date}
											</span>
										</div>

										{group.items.map((msg) => {
											const isMine = msg.senderType === selectedThread.mySenderType

											return (
												<div
													key={msg.id}
													className={clsx(
														"flex flex-col max-w-[85%] sm:max-w-[70%]",
														isMine ? "self-end items-end" : "self-start items-start"
													)}
												>
													{/* Sender Name for incoming */}
													{!isMine && (
														<span className="text-[10px] font-black text-black/40 mb-1 ml-2">
															{selectedThread.counterpartName}
														</span>
													)}

													{/* Reply To Preview */}
													{msg.replyTo && (
														<div
															className={clsx(
																"px-3 py-1.5 rounded-t-xl text-[11px] font-semibold border-2 border-b-0 border-black flex flex-col max-w-full truncate opacity-75 -mb-0.5",
																isMine ? "bg-black/90 text-white" : "bg-slate-100 text-black"
															)}
														>
															<span className="font-black text-[9px] uppercase tracking-wider">
																{msg.replyTo.sender?.firstName || "Replying to"}
															</span>
															<span className="truncate">{msg.replyTo.content}</span>
														</div>
													)}

													<div
														className={clsx(
															"p-3.5 rounded-2xl border-2 border-black flex flex-col gap-2 relative group",
															isMine
																? "bg-black text-white rounded-br-none shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
																: "bg-white text-black rounded-bl-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
														)}
													>
														{/* Attached Image */}
														{msg.mediaUrl && (
															<div
																onClick={() => setLightboxUrl(msg.mediaUrl!)}
																className="relative w-48 sm:w-60 aspect-video rounded-xl border-2 border-black overflow-hidden bg-black/5 cursor-pointer hover:opacity-90 transition-opacity"
															>
																<Image src={msg.mediaUrl} alt="Attachment" fill className="object-cover" unoptimized />
															</div>
														)}

														{/* Content */}
														{msg.content && (
															<p className="text-xs sm:text-sm font-semibold leading-relaxed whitespace-pre-wrap break-words">
																<LinkifiedText
																	text={msg.content}
																	linkClassName={isMine ? "text-[#FFC940] underline hover:opacity-80" : "text-[#EE2C2C] underline hover:opacity-80"}
																/>
															</p>
														)}

														<div className="flex items-center justify-end gap-1.5 mt-0.5">
															<span className={clsx("text-[9px] font-bold", isMine ? "text-white/50" : "text-black/40")}>
																{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
															</span>
														</div>

														{/* Quick Reply Action on Hover */}
														{selectedThread.chatStatus === "ACCEPTED" && (
															<button
																type="button"
																onClick={() => {
																	setReplyTo(msg)
																	textareaRef.current?.focus()
																}}
																className={clsx(
																	"absolute top-2 hidden group-hover:flex size-6 rounded-lg border border-black/20 bg-white/90 text-black items-center justify-center text-xs font-black shadow-sm hover:bg-white cursor-pointer",
																	isMine ? "-left-8" : "-right-8"
																)}
																title="Reply to message"
															>
																↩
															</button>
														)}
													</div>
												</div>
											)
										})}
									</div>
								))}
								<div ref={messagesEndRef} />
							</div>

							{/* Active Messaging Input Bar */}
							{selectedThread.chatStatus === "ACCEPTED" ? (
								<div className="p-3 sm:p-4 border-t-2 border-black/10 bg-white shrink-0 flex flex-col gap-2">
									{/* Reply Preview */}
									{replyTo && (
										<div className="flex items-center justify-between bg-slate-50 border-2 border-black rounded-xl p-2 px-3 text-xs">
											<div className="flex flex-col min-w-0">
												<span className="text-[10px] font-black uppercase text-black/50">
													Replying to {replyTo.sender?.firstName || "message"}
												</span>
												<span className="text-xs font-semibold text-black truncate">{replyTo.content || "Attachment"}</span>
											</div>
											<button
												type="button"
												onClick={() => setReplyTo(null)}
												className="text-xs font-black text-black/40 hover:text-black ml-2"
											>
												✕
											</button>
										</div>
									)}

									{/* Attached Media Preview */}
									{pendingMediaPreview && (
										<div className="relative size-16 rounded-xl border-2 border-black overflow-hidden bg-slate-100">
											<Image src={pendingMediaPreview} alt="Preview" fill className="object-cover" unoptimized />
											<button
												type="button"
												onClick={() => {
													setPendingMediaPreview(null)
													setPendingMediaKey(null)
												}}
												className="absolute top-1 right-1 size-5 rounded-full bg-black text-white text-[10px] font-black flex items-center justify-center hover:scale-105"
											>
												✕
											</button>
										</div>
									)}

									{/* Input & Action controls */}
									<form onSubmit={handleSendMessage} className="flex items-center gap-2">
										<input
											type="file"
											ref={fileInputRef}
											onChange={handleFileSelected}
											accept="image/jpeg,image/png,image/webp"
											className="hidden"
										/>
										<button
											type="button"
											onClick={() => fileInputRef.current?.click()}
											disabled={uploadingMedia}
											className="size-10 rounded-xl border-2 border-black bg-white hover:bg-black/5 flex items-center justify-center text-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50 cursor-pointer shrink-0"
											title="Attach photo"
										>
											<Icon as={GallerySvg} size="sm" />
										</button>

										<EmojiPicker
											onSelect={(emoji) => {
												setMessageText((prev) => prev + emoji)
												textareaRef.current?.focus()
											}}
										/>

										<textarea
											ref={textareaRef}
											value={messageText}
											onChange={(e) => setMessageText(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Enter" && !e.shiftKey) {
													e.preventDefault()
													handleSendMessage()
												}
											}}
											placeholder="Type a message... (Enter to send)"
											rows={1}
											className="flex-1 bg-slate-50 border-2 border-black rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black resize-none max-h-24"
										/>

										<button
											type="submit"
											disabled={sending || uploadingMedia || (!messageText.trim() && !pendingMediaKey)}
											className="size-10 rounded-xl border-2 border-black bg-[#EE2C2C] text-white flex items-center justify-center font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50 cursor-pointer shrink-0"
											title="Send message"
										>
											<svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
												<path d="M5 12h14m-7-7 7 7-7 7" />
											</svg>
										</button>
									</form>
								</div>
							) : (
								<div className="p-4 border-t-2 border-black/10 bg-slate-50/50 text-center text-xs font-bold text-black/50 shrink-0">
									{selectedThread.chatStatus === "REQUESTED"
										? "Messaging will unlock once the collaboration request is accepted."
										: "This collaboration request was declined."}
								</div>
							)}
						</>
					) : (
						<div className="m-auto text-center flex flex-col items-center gap-3 p-6 max-w-sm">
							<div className="size-16 rounded-3xl bg-black/5 border-2 border-black/10 flex items-center justify-center text-3xl">
								💬
							</div>
							<h3 className="font-heading font-black text-xl text-black">Select a Chat</h3>
							<p className="text-xs sm:text-sm font-semibold text-black/50 leading-relaxed">
								Pick a conversation from the list on the left to start collaborating with other communities.
							</p>
						</div>
					)}
				</div>
			</div>

			{/* Lightbox Modal */}
			{lightboxUrl && <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
		</div>
	)
}
