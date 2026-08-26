"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import clsx from "clsx"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import { uploadMeetdayChatImage } from "@/lib/uploadMedia"
import { getMyMeetdayChat, sendMeetdayChatMessage, type MeetdayChatMessage } from "@/lib/api"
import { ImageLightbox } from "@/components/ui/ImageLightbox"
import { EmojiPicker } from "@/components/ui/EmojiPicker"
import { LinkifiedText } from "@/components/ui/LinkifiedText"
import { MentionPicker, type MentionSuggestion } from "@/components/chat/MentionPicker"
import GallerySvg from "@/icons/outlined/gallery-wide.svg"

const POLL_MS = 4000

// Single persistent support chat with the Meetday team — one thread per user, no thread list
// needed (unlike TriChat). Shared by both the host and brand chat pages.
export function MeetdayChatPanel({ ownName, role }: { ownName: string; role: "HOST" | "BRAND" }) {
	const [messages, setMessages] = useState<MeetdayChatMessage[]>([])
	const [loading, setLoading] = useState(true)
	const [input, setInput] = useState("")
	const [sending, setSending] = useState(false)
	const [uploadingImage, setUploadingImage] = useState(false)
	const [viewingImage, setViewingImage] = useState<string | null>(null)
	const [replyingTo, setReplyingTo] = useState<MeetdayChatMessage | null>(null)
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
			const res = await getMyMeetdayChat()
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
		setSending(true)
		try {
			const msg = await sendMeetdayChatMessage({ content: input.trim(), replyToId: replyingTo?.id })
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
			const msg = await sendMeetdayChatMessage({ mediaKey, replyToId: replyingTo?.id })
			setMessages(prev => [...prev, msg])
			setReplyingTo(null)
		} catch {
			toast.error("Failed to send image.")
		} finally {
			setUploadingImage(false)
		}
	}

	return (
		<div className="flex-1 min-h-0 flex flex-col">
			<div className="px-5 py-3 border-b-[3px] border-black shrink-0">
				<p className="text-sm font-black text-black">Talk to Meetday</p>
				<p className="text-[11px] font-semibold text-black/40">Questions, issues, or feedback? We&apos;re here to help.</p>
			</div>

			<div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
				{loading ? (
					<p className="text-xs font-semibold text-black/40 text-center">Loading…</p>
				) : messages.length === 0 ? (
					<p className="text-xs font-semibold text-black/40 text-center m-auto">No messages yet — say hi to the Meetday team!</p>
				) : (
					messages.map(m => {
						const isMine = m.senderType === "USER"
						const isBot = m.senderType === "BOT"
						const isSystemMessage = m.content?.startsWith("[System]")
						if (isSystemMessage) {
							return (
								<div key={m.id} className="w-full flex justify-center my-1">
									<span className="text-[11px] font-bold text-black/40 bg-neutral-100 px-3 py-1 rounded-full">
										{m.content.replace(/^\[System\]\s*/, "")}
									</span>
								</div>
							)
						}
						const senderLabel = isMine
							? (role === "HOST" ? `${ownName} • Community` : `${ownName} • Brand`)
							: isBot ? "Meetday" : "Meetday • Admin"
						return (
							<div
								key={m.id}
								id={`support-msg-${m.id}`}
								className={clsx(
									"flex flex-col max-w-[75%] transition-all duration-300 rounded-2xl p-1",
									isMine ? "self-end items-end" : "self-start items-start",
									highlightedMessageId === m.id && "ring-4 ring-[#EE2C2C] bg-[#FFC940]/40 shadow-xl scale-[1.03] animate-pulse"
								)}
							>
								<div className="flex items-center gap-2 mb-0.5 px-1">
									<span className="text-[10px] font-black uppercase tracking-wide text-black/30">
										{senderLabel}
									</span>
									<button
										type="button"
										onClick={() => setReplyingTo(m)}
										className="text-[10px] font-bold text-black/30 hover:text-black transition-colors"
									>
										Reply
									</button>
								</div>
								<div
									className={clsx(
										"rounded-2xl p-2 sm:p-2.5 text-sm font-semibold break-words border flex flex-col shadow-xs",
										isMine ? (role === "BRAND" ? "bg-[#EE2C2C] text-white rounded-br-sm border-[#EE2C2C]" : "bg-[#FFC940] text-black rounded-br-sm border-[#FFC940]") : isBot ? "bg-black text-white rounded-bl-sm border-black" : "bg-neutral-100 text-black rounded-bl-sm border-black/10",
									)}
								>
									{m.replyTo && (
										<button
											type="button"
											onClick={() => handleJumpToMessage(m.replyTo!.id)}
											className={clsx(
												"w-full text-left mb-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer block border-l-4 shadow-xs",
												isMine && role === "BRAND"
													? "bg-black/25 hover:bg-black/35 text-white border-white/80"
													: isMine && role === "HOST"
													? "bg-black/10 hover:bg-black/15 text-black border-black/40"
													: isBot
													? "bg-white/15 hover:bg-white/25 text-white border-white/70"
													: "bg-white hover:bg-neutral-50 text-black border-[#EE2C2C] border border-black/10"
											)}
											title="Click to jump to message"
										>
											<p className={clsx(
												"text-[9px] font-black uppercase tracking-wider",
												(isBot || (isMine && role === "BRAND")) ? "text-white/80" : "text-black/60"
											)}>
												↩ Replying to {m.replyTo.senderType === "BOT" ? "Meetday" : m.replyTo.senderType === "ADMIN" ? "Meetday • Admin" : ownName}
											</p>
											{m.replyTo.hasMedia && (
												<p className={clsx("text-xs font-semibold flex items-center gap-1 my-0.5", (isBot || (isMine && role === "BRAND")) ? "text-white/90" : "text-black/70")}>
													📷 Photo
												</p>
											)}
											{m.replyTo.content && (
												<p className={clsx("text-xs font-medium break-words whitespace-pre-wrap leading-relaxed mt-0.5", (isBot || (isMine && role === "BRAND")) ? "text-white/90" : "text-black/80")}>
													{m.replyTo.content}
												</p>
											)}
										</button>
									)}
									{m.mediaUrl && (
										/* eslint-disable-next-line @next/next/no-img-element */
										<img
											src={m.mediaUrl}
											alt="Shared image"
											onClick={() => setViewingImage(m.mediaUrl!)}
											className="max-w-[220px] max-h-[220px] rounded-xl border border-black/15 object-cover cursor-pointer mb-1 shadow-sm"
										/>
									)}
									{m.content && (
										<div className="px-1 py-0.5">
											<LinkifiedText text={m.content} />
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

			{replyingTo && (
				<div className="px-4 py-2 flex items-center justify-between gap-2 border-t-[3px] border-black bg-neutral-50">
					<div className="min-w-0 pl-2 border-l-2 border-[#EE2C2C]">
						<p className="text-[10px] font-black uppercase text-black/40">
							Replying to {replyingTo.senderType === "BOT" ? "Meetday" : replyingTo.senderType === "ADMIN" ? "Meetday • Admin" : ownName}
						</p>
						<p className="text-[11px] font-semibold text-black/60 truncate">
							{replyingTo.content?.trim() ? replyingTo.content : (replyingTo.mediaUrl ? "Photo" : "")}
						</p>
					</div>
					<button type="button" onClick={() => setReplyingTo(null)} className="text-[10px] font-bold text-[#EE2C2C] shrink-0">
						Cancel
					</button>
				</div>
			)}
			<div className="relative p-3 border-t-[3px] border-black flex items-center gap-2 shrink-0 bg-white">
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
					disabled={uploadingImage}
					className="shrink-0 size-9 rounded-xl border-[3px] border-black flex items-center justify-center hover:bg-neutral-50 disabled:opacity-50"
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
					}}
					placeholder="Write a message… (type @ to tag)"
					className="flex-1 rounded-2xl border-[3px] border-black bg-white px-4 py-2 text-sm font-semibold outline-none focus:bg-neutral-50"
				/>
				<Button onClick={handleSend} disabled={sending || !input.trim()}>
					{sending ? "…" : "Send"}
				</Button>
			</div>

			{viewingImage && <ImageLightbox url={viewingImage} onClose={() => setViewingImage(null)} />}
		</div>
	)
}
