"use client"

import { useEffect, useRef, useState, useCallback, useMemo, Fragment } from "react"
import { useSearchParams } from "next/navigation"
import clsx from "clsx"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import { useHostStore } from "@/store/hostStore"
import { uploadSponsorshipChatImage, isPdfMediaUrl } from "@/lib/uploadMedia"
import {
	getMySponsorshipChats,
	getSponsorshipChatMessages,
	sendSponsorshipChatMessage,
	editSponsorshipChatMessage,
	deleteSponsorshipChatMessage,
	acceptSponsorshipChatRequest,
	getSponsorshipDeal,
	getSponsorshipDealReport,
	type SponsorshipChatThread,
	type SponsorshipChatMessage,
	type SponsorshipDeal,
} from "@/lib/api"
import { DealBanner, DealFormModal, DealDetailsModal, DealReportModal } from "@/components/sponsorship/DealPanel"
import { MeetdayChatPanel } from "@/components/support/MeetdayChatPanel"
import { ImageLightbox } from "@/components/ui/ImageLightbox"
import { EmojiPicker } from "@/components/ui/EmojiPicker"
import { MentionPicker, type MentionSuggestion } from "@/components/chat/MentionPicker"
import { useChatTyping } from "@/hooks/useChatTyping"
import GallerySvg from "@/icons/outlined/gallery-wide.svg"
import AltArrowLeftSvg from "@/icons/outlined/alt-arrow-left.svg"
import { useNotificationStore } from "@/store/notificationStore"
import { LinkifiedText } from "@/components/ui/LinkifiedText"
import { SystemMessageBubble } from "@/components/chat/SystemMessageBubble"
import confetti from "canvas-confetti"

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
	const [dealType, setDealType] = useState<"SPONSORSHIP" | "CAMPAIGN">("SPONSORSHIP")
	const [acceptedThreads, setAcceptedThreads] = useState<SponsorshipChatThread[]>([])
	const [requestedThreads, setRequestedThreads] = useState<SponsorshipChatThread[]>([])
	const [loadingThreads, setLoadingThreads] = useState(true)
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const searchParams = useSearchParams()
	const { notifications, markRead } = useNotificationStore()

	useEffect(() => {
		const interestId = searchParams.get("interestId")
		if (interestId) {
			setSelectedId(interestId)
		}
	}, [searchParams])

	const threads = useMemo(() => {
		const baseList = segment === "REQUESTED" ? requestedThreads : acceptedThreads
		return baseList.filter(t => {
			if (dealType === "SPONSORSHIP") {
				return !t.campaignId
			} else {
				return !!t.campaignId
			}
		})
	}, [segment, acceptedThreads, requestedThreads, dealType])

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

	const loadThreadsSeq = useRef(0)

	const loadThreads = useCallback(async () => {
		const seq = ++loadThreadsSeq.current
		try {
			const [acceptedData, requestedData] = await Promise.all([
				getMySponsorshipChats("ACCEPTED", "HOST").catch(() => []),
				getMySponsorshipChats("REQUESTED", "HOST").catch(() => []),
			])
			// A newer loadThreads() call already resolved and updated state — discard this
			// stale response instead of letting it overwrite fresher data (was causing threads
			// to flicker in and out of the list during active back-and-forth chatting).
			if (seq !== loadThreadsSeq.current) return

			const sortedAccepted = [...acceptedData].sort((a, b) => {
				const tA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0)
				const tB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0)
				return tB - tA
			})

			const sortedRequested = [...requestedData].sort((a, b) => {
				const tA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0)
				const tB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0)
				return tB - tA
			})

			setAcceptedThreads(sortedAccepted)
			setRequestedThreads(sortedRequested)
		} catch {
			// silent — polling refresh
		} finally {
			if (seq === loadThreadsSeq.current) setLoadingThreads(false)
		}
	}, [])

	useEffect(() => {
		// Fetch immediately, then poll — intentional fetch-on-mount + interval pattern.
		// Deliberately NOT depending on `notifications` (it gets a new array reference on every
		// poll/websocket event, which was re-triggering this effect on every chat message and
		// firing overlapping fetches).
		// eslint-disable-next-line react-hooks/set-state-in-effect
		loadThreads()
		const interval = setInterval(() => loadThreads(), POLL_MS * 2)
		return () => clearInterval(interval)
	}, [loadThreads])

	// Clear unread counts in memory instantly when opened
	useEffect(() => {
		if (selectedId) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setAcceptedThreads(prev =>
				prev.map(t => (t.id === selectedId ? { ...t, unreadCount: 0 } : t))
			)
			setRequestedThreads(prev =>
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

	const unreadAcceptedCount = acceptedThreads.reduce((sum, t) => {
		return sum + (selectedId === t.id ? 0 : Math.max(t.unreadCount || 0, getThreadUnreadCount(t.id)))
	}, 0)
	const unreadRequestedCount = requestedThreads.reduce((sum, t) => {
		return sum + (selectedId === t.id ? 0 : Math.max(t.unreadCount || 0, getThreadUnreadCount(t.id)))
	}, 0)

	const sponsorshipUnreadCount = useMemo(() => {
		const all = [...acceptedThreads, ...requestedThreads]
		return all.reduce((sum, t) => {
			if (t.campaignId) return sum
			return sum + (selectedId === t.id ? 0 : Math.max(t.unreadCount || 0, getThreadUnreadCount(t.id)))
		}, 0)
	}, [acceptedThreads, requestedThreads, selectedId, getThreadUnreadCount])

	const campaignUnreadCount = useMemo(() => {
		const all = [...acceptedThreads, ...requestedThreads]
		return all.reduce((sum, t) => {
			if (!t.campaignId) return sum
			return sum + (selectedId === t.id ? 0 : Math.max(t.unreadCount || 0, getThreadUnreadCount(t.id)))
		}, 0)
	}, [acceptedThreads, requestedThreads, selectedId, getThreadUnreadCount])

	async function handleAccept(interestId: string) {
		try {
			await acceptSponsorshipChatRequest(interestId)
			toast.success("Accepted — you can now chat.")
			await loadThreads()
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

			<div className="flex-1 min-h-0 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-6xl w-full mx-auto flex flex-col gap-4">
				<div>
					<h1 className="text-2xl sm:text-3xl font-heading font-black text-black">Chats</h1>
					<p className="text-xs sm:text-sm font-semibold text-black/50 mt-1">Talk to brands interested in your proposals.</p>
				</div>

				<div className="h-[calc(100vh-240px)] border-[3px] border-black rounded-[24px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col sm:flex-row bg-white">
					{/* Thread list */}
					<div className={clsx(
						"w-full sm:w-72 shrink-0 border-b-[3px] sm:border-b-0 sm:border-r-[3px] border-black flex flex-col",
						selectedId ? "hidden sm:flex" : "flex"
					)}>
						{/* Sponsorship vs Campaign deals Tab selectors */}
						<div className="flex border-b-[3px] border-black bg-neutral-50 divide-x-[3px] divide-black shrink-0">
							{(["SPONSORSHIP", "CAMPAIGN"] as const).map(dt => {
								const tabUnread = dt === "SPONSORSHIP" ? sponsorshipUnreadCount : campaignUnreadCount
								return (
									<button
										key={dt}
										onClick={() => {
											setDealType(dt)
											setSelectedId(null)
										}}
										className={clsx(
											"flex-grow py-2 text-[10px] font-black uppercase tracking-wider text-center transition-colors select-none flex items-center justify-center gap-1.5",
											dealType === dt ? "bg-black text-[#FFC940]" : "bg-white text-black/50 hover:bg-neutral-100"
										)}
									>
										<span>{dt === "SPONSORSHIP" ? "Sponsorships" : "Campaigns"}</span>
										{tabUnread > 0 && (
											<span className={clsx(
												"min-w-[14px] h-[14px] px-1 rounded-full text-[8px] font-black flex items-center justify-center border border-transparent",
												dealType === dt ? "bg-[#FFC940] text-black" : "bg-[#EE2C2C] text-white"
											)}>
												{tabUnread}
											</span>
										)}
									</button>
								)
							})}
						</div>

						<div className="flex border-b-[3px] border-black shrink-0">
							{(["ACCEPTED", "REQUESTED"] as Segment[]).map(seg => {
								const isReq = seg === "REQUESTED"
								const count = isReq ? unreadRequestedCount : unreadAcceptedCount
								return (
									<button
										key={seg}
										onClick={() => handleSegmentChange(seg)}
										className={clsx(
											"flex-grow py-3 text-xs font-black uppercase tracking-wider transition-colors relative flex items-center justify-center gap-1.5",
											segment === seg ? "bg-[#EE2C2C] text-white" : "bg-white text-black/50 hover:bg-neutral-50",
										)}
									>
										<span>{seg === "REQUESTED" ? (dealType === "SPONSORSHIP" ? "Requests" : "Sent Requests") : "Accepted"}</span>
										{count > 0 && (
											<span className={clsx(
												"min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-black flex items-center justify-center border",
												segment === seg ? "bg-white text-[#EE2C2C] border-transparent" : "bg-[#FFC940] text-black border-black/10"
											)}>
												{count}
											</span>
										)}
									</button>
								);
							})}
						</div>
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
													<div className="absolute -top-1.5 -right-2 flex items-center gap-0.5 z-10">
														{t.hasUnreadMention && (
															<span className="size-4.5 rounded-full bg-black text-[#FFC940] text-[10px] font-black flex items-center justify-center border-2 border-white shadow-sm" title="You were mentioned or replied to">
																@
															</span>
														)}
														<span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#EE2C2C] text-white text-[9px] font-black flex items-center justify-center border-2 border-white shadow-[2px_2px_4px_rgba(0,0,0,0.15)]">
															{unread > 9 ? "9+" : unread}
														</span>
													</div>
												)}
											</div>

											<div className="flex-1 min-w-0">
												<div className="flex items-center justify-between gap-2">
													<div className="flex items-center gap-1.5 min-w-0">
														<p className="text-sm font-black text-black truncate">{t.counterpartName}</p>
														{t.isDealLocked && (
															<span className="shrink-0 text-xs" title="Deal Locked">🔒</span>
														)}
													</div>
													<span className="text-[10px] font-semibold text-black/30 shrink-0">{timeAgo(t.lastMessageAt ?? t.createdAt)}</span>
												</div>
												<div className="flex items-center justify-between gap-2 mt-0.5">
													<p className="text-[11px] font-semibold text-black/50 truncate">{t.proposalName}</p>
												</div>
												{segment === "REQUESTED" && (
													<p className="text-[11px] font-bold text-[#EE2C2C] mt-1">
														{t.campaignId
															? "You've shown interest to this campaign by this brand. Waiting for brand approval."
															: "This brand is interested in your proposal"}
													</p>
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
					</div>

					{/* Thread detail */}
					<div className={clsx(
						"flex-1 min-h-0 flex flex-col",
						selectedId ? "flex" : "hidden sm:flex"
					)}>
						{!selectedThread ? (
							<div className="flex-1 flex items-center justify-center text-sm font-semibold text-black/30">
								Select a chat to view
							</div>
						) : (
							<ChatThreadPanel
								key={selectedThread.id}
								thread={selectedThread}
								onAccept={handleAccept}
								onBack={() => setSelectedId(null)}
							/>
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
	onBack,
}: {
	thread: SponsorshipChatThread
	onAccept: (interestId: string) => void
	onBack?: () => void
}) {
	const { profile } = useHostStore()
	const ownName = profile?.displayName || "You"
	const [messages, setMessages] = useState<SponsorshipChatMessage[]>([])
	const [loading, setLoading] = useState(true)
	const [input, setInput] = useState("")
	const [sending, setSending] = useState(false)
	const [uploadingImage, setUploadingImage] = useState(false)
	const [deal, setDeal] = useState<SponsorshipDeal | null>(null)
	const [report, setReport] = useState<any>(null)
	const [dealModal, setDealModal] = useState<"form" | "details" | "report" | null>(null)
	const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
	const [replyingTo, setReplyingTo] = useState<SponsorshipChatMessage | null>(null)
	const [unreadDivider, setUnreadDivider] = useState<{ messageId: string; count: number } | null>(null)
	const [viewingImage, setViewingImage] = useState<string | null>(null)
	const [mentionQuery, setMentionQuery] = useState("")
	const [isMentionOpen, setIsMentionOpen] = useState(false)
	const bottomRef = useRef<HTMLDivElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

	const mentionSuggestions: MentionSuggestion[] = [
		{
			id: "counterpart",
			name: thread.counterpartName,
			tag: thread.counterpartName.replace(/\s+/g, ""),
			role: "Brand",
			avatarUrl: thread.counterpartAvatarUrl,
		},
		{
			id: "meetday",
			name: "Meetday Support",
			tag: "Meetday",
			role: "Admin",
		},
	]

	const handleInputChange = (val: string) => {
		setInput(val)
		if (val.trim()) notifyTyping()
		else notifyStopTyping()

		const lastAt = val.lastIndexOf("@")
		if (lastAt !== -1 && (lastAt === 0 || /\s/.test(val[lastAt - 1]))) {
			const q = val.slice(lastAt + 1)
			if (!/\s/.test(q)) {
				setMentionQuery(q)
				setIsMentionOpen(true)
				return
			}
		}
		setIsMentionOpen(false)
	}

	const handleMentionSelect = (tag: string) => {
		const lastAt = input.lastIndexOf("@")
		if (lastAt !== -1) {
			const next = input.slice(0, lastAt) + `@${tag} `
			setInput(next)
		} else {
			setInput(prev => prev + `@${tag} `)
		}
		setIsMentionOpen(false)
	}
	const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)
	const highlightTimerRef = useRef<NodeJS.Timeout | null>(null)
	const dividerCapturedRef = useRef(false)
	const autoOpenedRef = useRef(false)
	const { typingSenderType, notifyTyping, notifyStopTyping } = useChatTyping(thread.id, "HOST")
	useEffect(() => {
		if (deal?.status === "APPROVED" && !localStorage.getItem(`confetti-fired-${deal.id}`)) {
			localStorage.setItem(`confetti-fired-${deal.id}`, "true")
			const canvas = document.getElementById("chat-confetti-canvas") as HTMLCanvasElement | null
			if (canvas) {
				const myConfetti = confetti.create(canvas, {
					resize: true,
					useWorker: true
				})
				myConfetti({
					particleCount: 150,
					spread: 80,
					origin: { y: 0.6 }
				})
			}
		}
	}, [deal])

	useEffect(() => {
		if (autoOpenedRef.current) return
		const searchParams = new URLSearchParams(window.location.search)
		if (searchParams.get("openDeal") === "true" && deal) {
			setDealModal(deal.status === "APPROVED" ? "details" : "form")
			autoOpenedRef.current = true
			
			// Remove openDeal from URL to prevent reopening
			searchParams.delete("openDeal")
			const newSearch = searchParams.toString()
			const newPath = window.location.pathname + (newSearch ? `?${newSearch}` : "")
			window.history.replaceState(null, "", newPath)
		}
	}, [deal])

	const loadSeq = useRef(0)

	const load = useCallback(async () => {
		const seq = ++loadSeq.current
		try {
			const [res, dealRes, reportRes] = await Promise.all([
				getSponsorshipChatMessages(thread.id),
				thread.chatStatus === "ACCEPTED" ? getSponsorshipDeal(thread.id) : Promise.resolve(null),
				thread.chatStatus === "ACCEPTED" ? getSponsorshipDealReport(thread.id).catch(() => null) : Promise.resolve(null),
			])
			// Discard a stale, out-of-order response so it can't revert the view to older data.
			if (seq !== loadSeq.current) return
			setMessages(res.messages)
			setDeal(dealRes)
			setReport(reportRes)
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
			if (seq === loadSeq.current) setLoading(false)
		}
	}, [thread.id, thread.chatStatus])

	useEffect(() => {
		// Fetch immediately, then poll — intentional fetch-on-mount + interval pattern.
		// Deliberately NOT depending on `notifications` — see chats list effect for why.
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
			const msg = await sendSponsorshipChatMessage(thread.id, { content: input.trim(), replyToId: replyingTo?.id })
			setMessages(prev => [...prev, msg])
			setInput("")
			setReplyingTo(null)
			notifyStopTyping()
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
		setReplyingTo(null)
		setEditingMessageId(m.id)
		setInput(m.content)
	}

	function handleEditCancel() {
		setEditingMessageId(null)
		setInput("")
	}

	const handleJumpToMessage = useCallback((messageId: string) => {
		const el = document.getElementById(`msg-${messageId}`)
		if (el) {
			el.scrollIntoView({ behavior: "smooth", block: "center" })
			if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
			setHighlightedMessageId(messageId)
			highlightTimerRef.current = setTimeout(() => {
				setHighlightedMessageId(null)
			}, 2000)
		}
	}, [])

	function handleReplyStart(m: SponsorshipChatMessage) {
		handleEditCancel()
		setReplyingTo(m)
	}

	function handleReplyCancel() {
		setReplyingTo(null)
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
		if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
			toast.error("Only image or PDF files can be sent.")
			return
		}
		setUploadingImage(true)
		try {
			const mediaKey = await uploadSponsorshipChatImage(file, thread.id)
			const msg = await sendSponsorshipChatMessage(thread.id, { mediaKey, replyToId: replyingTo?.id })
			setMessages(prev => [...prev, msg])
			setReplyingTo(null)
		} catch {
			toast.error("Failed to send file.")
		} finally {
			setUploadingImage(false)
		}
	}

	function labelFor(senderType: SponsorshipChatMessage["senderType"]) {
		if (senderType === "HOST") return `${ownName} • Community`
		if (senderType === "BRAND") return `${thread.counterpartName} • Brand`
		return "Meetday • Admin"
	}

	function replySnippet(replyTo: SponsorshipChatMessage["replyTo"]) {
		if (!replyTo) return ""
		return replyTo.content?.trim() ? replyTo.content : replyTo.hasMedia ? "📄 Attachment" : ""
	}

	function replyLabel(senderType: SponsorshipChatMessage["senderType"]) {
		if (senderType === "HOST") return ownName
		if (senderType === "BRAND") return thread.counterpartName
		return "Meetday"
	}

	return (
		<div className="flex-1 min-h-0 flex flex-col relative h-full bg-white">
			<canvas id="chat-confetti-canvas" className="pointer-events-none absolute inset-0 w-full h-full z-30" />
			<div className="px-3 sm:px-5 py-2.5 sm:py-3 border-b-[3px] border-black bg-white flex items-center justify-between shrink-0 gap-2">
				<div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
					{onBack && (
						<button
							type="button"
							onClick={onBack}
							className="md:hidden p-1.5 -ml-1 text-black/70 hover:text-black hover:bg-neutral-100 rounded-full shrink-0 transition-colors"
							aria-label="Back to chat list"
						>
							<Icon as={AltArrowLeftSvg} size="sm" />
						</button>
					)}
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
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-1.5">
							<p className="text-xs sm:text-sm font-black text-black truncate leading-tight">{thread.counterpartName}</p>
							{((deal && deal.status === "APPROVED") || thread.isDealLocked) && (
								<span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black bg-[#FFC940] text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
									🔒 Locked
								</span>
							)}
						</div>
						<p className="text-[10px] sm:text-[11px] font-semibold text-black/40 truncate">{thread.proposalName}</p>
					</div>
				</div>
				{thread.chatStatus === "REQUESTED" && !thread.campaignId && (
					<button
						type="button"
						onClick={() => onAccept(thread.id)}
						className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EE2C2C] hover:bg-[#d42525] text-white font-black text-xs border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer select-none"
					>
						Accept Request
					</button>
				)}
			</div>

			{thread.chatStatus === "ACCEPTED" && !thread.campaignId && (
				<DealBanner
					deal={deal}
					role="HOST"
					onLock={() => setDealModal("form")}
					onEdit={() => setDealModal("form")}
					onView={() => setDealModal("details")}
					onReport={() => setDealModal("report")}
					hasReport={!!report}
					isCampaign={!!thread.campaignId}
				/>
			)}

			<div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
				{loading ? (
					<p className="text-xs font-semibold text-black/40 text-center">Loading…</p>
				) : thread.chatStatus === "REQUESTED" ? (
					<div className="m-auto text-center max-w-xs animate-in fade-in duration-200">
						{thread.campaignId ? (
							<>
								<p className="text-sm font-black text-black">Interest Expressed</p>
								<p className="text-xs font-semibold text-black/50 mt-2">
									You've shown interest to this campaign by this brand. Waiting for brand approval.
								</p>
							</>
						) : (
							<>
								<p className="text-sm font-black text-black">This brand is interested in your proposal</p>
								<p className="text-xs font-semibold text-black/50 mt-2">
									Accept the request to open the chat and reply.
								</p>
							</>
						)}
					</div>
				) : messages.length === 0 ? (
					<p className="text-xs font-semibold text-black/40 text-center m-auto">No messages yet — say hi!</p>
				) : (
					messages.map(m => {
						if (m.messageType === "SYSTEM") {
							return <SystemMessageBubble key={m.id} content={m.content ?? ""} />
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
								<div
									id={`msg-${m.id}`}
									className={clsx(
										"flex flex-col max-w-[85%] sm:max-w-[75%] md:max-w-[70%] transition-all duration-300 rounded-2xl p-1",
										isMine ? "self-end items-end" : "self-start items-start",
										highlightedMessageId === m.id && "ring-4 ring-[#EE2C2C] bg-[#FFC940]/30 shadow-lg scale-[1.02]"
									)}
								>
									<div className="flex items-center gap-2 mb-0.5 px-1">
										<span className="text-[10px] font-black uppercase tracking-wide text-black/30">{labelFor(m.senderType)}</span>
										{!isDeleted && (
											<button type="button" onClick={() => handleReplyStart(m)} className="text-[10px] font-bold text-black/30 hover:text-black">
												Reply
											</button>
										)}
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
										<div
											className={clsx(
												"rounded-2xl p-2 sm:p-2.5 text-sm font-semibold break-words border flex flex-col shadow-xs",
												m.senderType === "BRAND" && "bg-[#EE2C2C] text-white rounded-bl-sm border-[#EE2C2C]",
												m.senderType === "HOST" && "bg-[#FFC940] text-black rounded-br-sm border-[#FFC940]",
												m.senderType === "ADMIN" && "bg-neutral-100 text-black rounded-bl-sm border-black/10",
											)}
										>
											{m.replyTo && (
												<button
													type="button"
													onClick={() => handleJumpToMessage(m.replyTo!.id)}
													className={clsx(
														"w-full text-left mb-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer block border-l-4 shadow-xs",
														m.senderType === "BRAND"
															? "bg-black/25 hover:bg-black/35 text-white border-white/80"
															: m.senderType === "HOST"
															? "bg-black/10 hover:bg-black/15 text-black border-black/40"
															: "bg-white hover:bg-neutral-50 text-black border-[#EE2C2C] border border-black/10"
													)}
													title="Click to jump to message"
												>
													<p className={clsx(
														"text-[9px] font-black uppercase tracking-wider",
														m.senderType === "BRAND" ? "text-white/80" : "text-black/60"
													)}>
														↩ Replying to {replyLabel(m.replyTo.senderType)}
													</p>
													{m.replyTo.hasMedia && (
														<p className={clsx("text-xs font-semibold flex items-center gap-1 my-0.5", m.senderType === "BRAND" ? "text-white/90" : "text-black/70")}>
														📄 Attachment
														</p>
													)}
													{m.replyTo.content && (
														<p className={clsx("text-xs font-medium break-words whitespace-pre-wrap leading-relaxed mt-0.5", m.senderType === "BRAND" ? "text-white/90" : "text-black/80")}>
															{m.replyTo.content}
														</p>
													)}
												</button>
											)}
											{m.mediaUrl && (
												isPdfMediaUrl(m.mediaUrl) ? (
													<a
														href={m.mediaUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border-[3px] border-black bg-white hover:bg-neutral-50 mb-1 text-sm font-bold text-black"
													>
														📄 View PDF
													</a>
												) : (
													/* eslint-disable-next-line @next/next/no-img-element */
													<img
														src={m.mediaUrl}
														alt="Shared image"
														onClick={() => setViewingImage(m.mediaUrl!)}
														className="max-w-[220px] max-h-[220px] rounded-2xl border-[3px] border-black object-cover cursor-pointer mb-1"
													/>
												)
											)}
											{m.content && (
												<div className="px-1 py-0.5">
													<LinkifiedText text={m.content} />
													{m.editedAt && <span className="ml-1.5 text-[10px] font-semibold opacity-60">(edited)</span>}
												</div>
											)}
										</div>
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
				<div className="border-t-[3px] border-black shrink-0 bg-white flex flex-col">
					{typingSenderType && (
						<p className="px-3 pt-2 text-[11px] font-bold text-black/40 italic">{thread.counterpartName} is typing…</p>
					)}
					{editingMessageId && (
						<div className="px-3 pt-2 flex items-center justify-between">
							<span className="text-[10px] font-black uppercase text-black/40">Editing message</span>
							<button type="button" onClick={handleEditCancel} className="text-[10px] font-bold text-[#EE2C2C]">Cancel</button>
						</div>
					)}
					{replyingTo && !editingMessageId && (
						<div className="px-3 pt-2 flex items-center justify-between gap-2 border-b border-black/10 pb-2">
							<div className="min-w-0 pl-2 border-l-2 border-[#EE2C2C]">
								<p className="text-[10px] font-black uppercase text-black/40">Replying to {replyLabel(replyingTo.senderType)}</p>
								<p className="text-[11px] font-semibold text-black/50 truncate">{replyingTo.content?.trim() ? replyingTo.content : (replyingTo.mediaUrl ? "Attachment" : "")}</p>
							</div>
							<button type="button" onClick={handleReplyCancel} className="text-[10px] font-bold text-[#EE2C2C] shrink-0">Cancel</button>
						</div>
					)}
					<div className="p-3 flex items-center gap-2">
						<input type="file" accept="image/*,application/pdf" ref={fileInputRef} onChange={handleImagePick} className="hidden" />
						<button
							type="button"
							onClick={() => fileInputRef.current?.click()}
							disabled={uploadingImage || !!editingMessageId}
							className="shrink-0 size-9 rounded-xl border-[3px] border-black flex items-center justify-center hover:bg-neutral-50 disabled:opacity-50"
							aria-label="Attach image or PDF"
						>
							<Icon as={GallerySvg} size="sm" />
						</button>
						<EmojiPicker onSelect={emoji => setInput(prev => prev + emoji)} />
						<input
							value={input}
							onChange={e => handleInputChange(e.target.value)}
							onKeyDown={e => {
								if (e.key === "Enter" && !e.shiftKey && !isMentionOpen) {
									e.preventDefault()
									handleSend()
								}
								if (e.key === "Escape" && editingMessageId) handleEditCancel()
							}}
							placeholder="Write a message… (type @ to tag)"
							className="flex-1 min-w-0 rounded-2xl border-[3px] border-black bg-white px-3.5 sm:px-4 py-2 text-sm font-semibold outline-none focus:bg-neutral-50"
						/>
						<Button onClick={handleSend} disabled={sending || !input.trim()} className="shrink-0 whitespace-nowrap">
							{sending ? "…" : editingMessageId ? "Save" : "Send"}
						</Button>
					</div>
				</div>
			)}

			{dealModal === "form" && (
				<DealFormModal
					interestId={thread.id}
					proposalId={!thread.campaignId ? (thread.proposalId ?? undefined) : undefined}
					campaignId={thread.campaignId ?? undefined}
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
			{dealModal === "report" && (
				<DealReportModal interestId={thread.id} role="HOST" onClose={() => setDealModal(null)} />
			)}
			{viewingImage && <ImageLightbox url={viewingImage} onClose={() => setViewingImage(null)} />}
		</div>
	)
}
