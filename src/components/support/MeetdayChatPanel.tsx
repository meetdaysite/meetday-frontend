"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import clsx from "clsx"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import { uploadMeetdayChatImage } from "@/lib/uploadMedia"
import { getMyMeetdayChat, sendMeetdayChatMessage, editMeetdayChatMessage, deleteMeetdayChatMessage, type MeetdayChatMessage, type MeetdayChatContext } from "@/lib/api"
import { ImageLightbox } from "@/components/ui/ImageLightbox"
import { EmojiPicker } from "@/components/ui/EmojiPicker"
import { LinkifiedText } from "@/components/ui/LinkifiedText"
import { MentionPicker, type MentionSuggestion } from "@/components/chat/MentionPicker"
import GallerySvg from "@/icons/outlined/gallery-wide.svg"

const POLL_MS = 4000

// Single persistent support chat with the Meetday team — one thread per user, no thread list
// needed (unlike TriChat). Shared by both the host and brand chat pages.
export function MeetdayChatPanel({ ownName, role }: { ownName: string; role: "HOST" | "BRAND" | "SPACE" }) {
	const chatContext: MeetdayChatContext = role === "SPACE" ? "SPACE_PARTNER" : role
	const [messages, setMessages] = useState<MeetdayChatMessage[]>([])
	const [loading, setLoading] = useState(true)
	const [input, setInput] = useState("")
	const [sending, setSending] = useState(false)
	const [uploadingImage, setUploadingImage] = useState(false)
	const [viewingImage, setViewingImage] = useState<string | null>(null)
	const [replyingTo, setReplyingTo] = useState<MeetdayChatMessage | null>(null)
	const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
	const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)
	const highlightTimerRef = useRef<NodeJS.Timeout | null>(null)
	const [mentionQuery, setMentionQuery] = useState("")
	const [isMentionOpen, setIsMentionOpen] = useState(false)
	const bottomRef = useRef<HTMLDivElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const handleJumpToMessage = useCallback((messageId: string) => {
		const el = document.getElementById(`support-msg-${messageId}`)
		if (el) {
			el.scrollIntoView({ behavior: "smooth", block: "center" })
			if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
			setHighlightedMessageId(messageId)
			highlightTimerRef.current = setTimeout(() => {
				setHighlightedMessageId(null)
			}, 2000)
		}
	}, [])

	const mentionSuggestions: MentionSuggestion[] = [
		{
			id: "meetday",
			name: "Meetday Support",
			tag: "Meetday",
			role: "Admin",
		},
	]

	const handleInputChange = (val: string) => {
		setInput(val)
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

	const load = useCallback(async () => {
		try {
				  const res = await getMyMeetdayChat(chatContext)
			setMessages(res.messages)
		} catch {
			// silent on poll
		} finally {
			setLoading(false)
		}
	}, [])

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
		if (editingMessageId) {
			try {
				const updated = await editMeetdayChatMessage(editingMessageId, input.trim())
				setMessages(prev => prev.map(m => (m.id === updated.id ? updated : m)))
				setEditingMessageId(null)
				setInput("")
			} catch {
				toast.error("Failed to edit message.")
			}
			return
		}
		setSending(true)
		try {
						 const msg = await sendMeetdayChatMessage({ content: input.trim(), replyToId: replyingTo?.id }, chatContext)
			setMessages(prev => [...prev, msg])
			setInput("")
			setReplyingTo(null)
			if (msg.wasRedacted) {
				toast.warning("Phone numbers, emails, and IDs aren't allowed here — we've masked them in your message to keep things safe.")
			}
		} catch {
			toast.error("Failed to send message.")
		} finally {
			setSending(false)
		}
	}

	function handleEditStart(m: MeetdayChatMessage) {
		setReplyingTo(null)
		setEditingMessageId(m.id)
		setInput(m.content)
	}

	function handleEditCancel() {
		setEditingMessageId(null)
		setInput("")
	}

	async function handleDelete(m: MeetdayChatMessage) {
		if (!window.confirm("Delete this message? This can't be undone.")) return
		try {
			await deleteMeetdayChatMessage(m.id)
			setMessages(prev => prev.map(msg => (msg.id === m.id ? { ...msg, content: "", mediaUrl: null, deletedAt: new Date().toISOString() } : msg)))
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
		}
		setUploadingImage(true)
		try {
			const mediaKey = await uploadMeetdayChatImage(file)
				const msg = await sendMeetdayChatMessage({ mediaKey, replyToId: replyingTo?.id }, chatContext)
			setMessages(prev => [...prev, msg])
			setReplyingTo(null)
		} catch {
			toast.error("Failed to send image.")
		} finally {
			setUploadingImage(false)
		}
	}

	return (
		<div className="flex-1 min-h-0 flex flex-col h-full bg-white overflow-hidden">
			<div className="px-4 sm:px-5 py-2.5 sm:py-3 border-b-[3px] border-black shrink-0 bg-white">
				<p className="text-xs sm:text-sm font-black text-black">Talk to Meetday</p>
				<p className="text-[10px] sm:text-[11px] font-semibold text-black/40">Questions, issues, or feedback? We&apos;re here to help.</p>
			</div>

			<div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-5 py-3 sm:py-4 flex flex-col gap-2.5 sm:gap-3">
				{loading ? (
					<p className="text-xs font-semibold text-black/40 text-center py-6">Loading…</p>
				) : messages.length === 0 ? (
					<p className="text-xs font-semibold text-black/40 text-center m-auto py-8">No messages yet — say hi to the Meetday team!</p>
				) : (
					messages.map(m => {
						const isMine = m.senderType === "USER"
						const isBot = m.senderType === "BOT"
						const isSystemMessage = m.content?.startsWith("[System]")
						if (isSystemMessage) {
							return (
								<div key={m.id} className="w-full flex justify-center my-1">
									<span className="text-[10px] sm:text-[11px] font-bold text-black/40 bg-neutral-100 px-3 py-1 rounded-full border border-black/10 text-center">
										{m.content.replace(/^\[System\]\s*/, "")}
									</span>
								</div>
							)
						}
						const senderLabel = isMine ? "You" : isBot ? "Meetday" : "Admin"
						const isDarkBubble = isMine && (role === "BRAND" || role === "SPACE")
						const isDeleted = Boolean(m.deletedAt)
						return (
							<div
								key={m.id}
								id={`support-msg-${m.id}`}
								className={clsx(
									"flex flex-col max-w-[85%] sm:max-w-[75%] md:max-w-[70%] transition-all duration-300 rounded-2xl p-0.5 sm:p-1",
									isMine ? "self-end items-end" : "self-start items-start",
									highlightedMessageId === m.id && "ring-4 ring-[#EE2C2C] bg-[#FFC940]/40 shadow-xl scale-[1.03] animate-pulse"
								)}
							>
								<div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 px-1 max-w-full flex-wrap">
									<span className="text-[10px] font-black uppercase tracking-wide text-black/35 truncate max-w-[160px] sm:max-w-none">
										{senderLabel}
									</span>
									{!isDeleted && (
										<button
											type="button"
											onClick={() => { setEditingMessageId(null); setReplyingTo(m) }}
											className="text-[10px] font-bold text-black/35 hover:text-black transition-colors cursor-pointer"
										>
											Reply
										</button>
									)}
									{isMine && m.content && !isDeleted && (
										<button
											type="button"
											onClick={() => handleEditStart(m)}
											className="text-[10px] font-bold text-black/35 hover:text-black transition-colors cursor-pointer"
										>
											Edit
										</button>
									)}
									{isMine && !isDeleted && (
										<button
											type="button"
											onClick={() => handleDelete(m)}
											className="text-[10px] font-bold text-black/35 hover:text-[#EE2C2C] transition-colors cursor-pointer"
										>
											Delete
										</button>
									)}
								</div>
								<div
									className={clsx(
										"rounded-2xl p-2.5 sm:p-3 text-xs sm:text-sm font-semibold break-words [overflow-wrap:anywhere] flex flex-col shadow-xs",
										isDeleted && "opacity-90",
										isMine && role === "HOST" && "bg-[#FFC940] text-black rounded-br-sm",
										isMine && role === "BRAND" && "bg-[#EE2C2C] text-white rounded-br-sm",
										isMine && role === "SPACE" && "bg-black text-white rounded-br-sm",
										isMine && role !== "HOST" && role !== "BRAND" && role !== "SPACE" && "bg-[#FFC940] text-black rounded-br-sm",
										!isMine && "bg-neutral-100 text-black border border-black/10 rounded-bl-sm",
									)}
								>
									{m.replyTo && (
										<button
											type="button"
											onClick={() => handleJumpToMessage(m.replyTo!.id)}
											className={clsx(
												"w-full text-left mb-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all cursor-pointer block border-l-4 shadow-xs",
												isDarkBubble
													? "bg-white/15 hover:bg-white/20 text-white border-white/70"
													: "bg-black/10 hover:bg-black/15 text-black border-black/40"
											)}
											title="Click to jump to message"
										>
											<p className={clsx(
												"text-[9px] font-black uppercase tracking-wider",
												isDarkBubble ? "text-white/80" : "text-black/60"
											)}>
												↩ Replying to {m.replyTo.senderType?.toUpperCase() === "ADMIN" ? "Admin" : m.replyTo.senderType === "BOT" ? "Meetday" : "You"}
											</p>
											{m.replyTo.hasMedia && (
												<p className={clsx("text-xs font-semibold flex items-center gap-1 my-0.5", isDarkBubble ? "text-white/90" : "text-black/70")}>
													📷 Photo
												</p>
											)}
											{m.replyTo.content && (
												<p className={clsx("text-xs font-medium break-words [overflow-wrap:anywhere] whitespace-pre-wrap leading-relaxed mt-0.5 line-clamp-3", isDarkBubble ? "text-white/90" : "text-black/80")}>
													{m.replyTo.content}
												</p>
											)}
										</button>
									)}
									{isDeleted && (
										<div className="flex items-center gap-1.5 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg border border-dashed border-red-200 mb-1 w-fit">
											<span>🗑️</span>
											<span>This message was deleted</span>
										</div>
									)}
									{m.mediaUrl && (
										/* eslint-disable-next-line @next/next/no-img-element */
										<img
											src={m.mediaUrl}
											alt="Shared image"
											onClick={() => setViewingImage(m.mediaUrl!)}
											className="max-w-[180px] sm:max-w-[240px] max-h-[180px] sm:max-h-[240px] rounded-xl border-2 sm:border-[3px] border-black object-cover cursor-pointer mb-1 hover:opacity-95 transition-opacity"
										/>
									)}
									{m.content && (
										<div className={clsx("px-1 py-0.5 break-words [overflow-wrap:anywhere]", isDeleted && "opacity-80")}>
											<LinkifiedText
												text={m.content}
												linkClassName={clsx(
													"underline font-bold",
													isDarkBubble ? "text-white hover:text-white/80" : "text-[#EE2C2C] hover:text-[#EE2C2C]/80"
												)}
											/>
										</div>
									)}
								</div>
								{(m.content || m.mediaUrl) && (
									<div className={clsx("flex items-center gap-1 mt-0.5 text-[9px] font-bold text-black/40 px-1", isMine ? "justify-end" : "justify-start")}>
										<span>
											{(() => {
												try {
													return new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
												} catch {
													return ""
												}
											})()}
										</span>
										{m.editedAt && !isDeleted && <span>(edited)</span>}
										{m.senderType === "USER" && (
											<span className="text-[10px] leading-none font-bold text-gray-400">
												✓✓
											</span>
										)}
									</div>
								)}
							</div>
						)
					})
				)}
				<div ref={bottomRef} />
			</div>

			{editingMessageId && (
				<div className="px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between border-t-2 sm:border-t-[3px] border-black bg-neutral-50 shrink-0">
					<span className="text-[10px] font-black uppercase text-black/40">Editing message</span>
					<button type="button" onClick={handleEditCancel} className="text-[10px] font-bold text-[#EE2C2C] cursor-pointer">
						Cancel
					</button>
				</div>
			)}
			{replyingTo && !editingMessageId && (
				<div className="px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-2 border-t-2 sm:border-t-[3px] border-black bg-neutral-50 shrink-0">
					<div className="min-w-0 pl-2 border-l-2 border-[#EE2C2C]">
						<p className="text-[10px] font-black uppercase text-black/40">
							Replying to {replyingTo.senderType?.toUpperCase() === "ADMIN" ? "Admin" : replyingTo.senderType === "BOT" ? "Meetday" : "You"}
						</p>
						<p className="text-[11px] font-semibold text-black/60 truncate">
							{replyingTo.content?.trim() ? replyingTo.content : (replyingTo.mediaUrl ? "Photo" : "")}
						</p>
					</div>
					<button type="button" onClick={() => setReplyingTo(null)} className="text-[10px] font-bold text-[#EE2C2C] shrink-0 cursor-pointer">
						Cancel
					</button>
				</div>
			)}
			<div className="relative p-2 sm:p-3 border-t-[3px] border-black flex items-center gap-1.5 sm:gap-2 shrink-0 bg-white pb-[max(0.6rem,env(safe-area-inset-bottom))]">
				<MentionPicker
					suggestions={mentionSuggestions}
					query={mentionQuery}
					isOpen={isMentionOpen}
					onSelect={handleMentionSelect}
					onClose={() => setIsMentionOpen(false)}
				/>
				<input type="file" accept="image/*" ref={fileInputRef} onChange={handleImagePick} className="hidden" />
				<button
					type="button"
					onClick={() => fileInputRef.current?.click()}
					disabled={uploadingImage || !!editingMessageId}
					className="shrink-0 size-8 sm:size-9 rounded-xl border-2 sm:border-[3px] border-black flex items-center justify-center hover:bg-neutral-50 disabled:opacity-50 cursor-pointer"
					aria-label="Attach image"
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
					placeholder={editingMessageId ? "Edit your message… (Enter to save)" : "Write a message… (type @ to tag)"}
					className="flex-1 min-w-0 rounded-2xl border-2 sm:border-[3px] border-black bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold outline-none focus:bg-neutral-50 placeholder:text-xs sm:placeholder:text-sm"
				/>
				<Button
					onClick={handleSend}
					disabled={sending || !input.trim()}
					className="shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm"
				>
					{sending ? "…" : editingMessageId ? "Save" : "Send"}
				</Button>
			</div>

			{viewingImage && <ImageLightbox url={viewingImage} onClose={() => setViewingImage(null)} />}
		</div>
	)
}
