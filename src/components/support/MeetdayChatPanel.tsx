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
	const bottomRef = useRef<HTMLDivElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

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
			const msg = await sendMeetdayChatMessage({ content: input.trim() })
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
			const mediaKey = await uploadMeetdayChatImage(file)
			const msg = await sendMeetdayChatMessage({ mediaKey })
			setMessages(prev => [...prev, msg])
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
						const senderLabel = isMine
							? (role === "HOST" ? `${ownName} • Community` : `${ownName} • Brand`)
							: isBot ? "Meetday • Bot" : "Meetday • Admin"
						return (
							<div key={m.id} className={clsx("flex flex-col max-w-[75%]", isMine ? "self-end items-end" : "self-start items-start")}>
								<span className="text-[10px] font-black uppercase tracking-wide text-black/30 mb-0.5 px-1">
									{senderLabel}
								</span>
								{m.mediaUrl && (
									/* eslint-disable-next-line @next/next/no-img-element */
									<img
										src={m.mediaUrl}
										alt="Shared image"
										onClick={() => setViewingImage(m.mediaUrl!)}
										className="max-w-[220px] max-h-[220px] rounded-2xl border-[3px] border-black object-cover cursor-pointer mb-1"
									/>
								)}
								{m.content && (
									<div
										className={clsx(
											"px-3.5 py-2 rounded-2xl text-sm font-semibold break-words border border-black/10",
											isMine ? (role === "BRAND" ? "bg-[#EE2C2C] text-white" : "bg-[#FFC940] text-black") : isBot ? "bg-black text-white" : "bg-neutral-100 text-black",
											isMine ? "rounded-br-sm" : "rounded-bl-sm",
										)}
									>
										{m.content}
									</div>
								)}
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
				<EmojiPicker onSelect={emoji => setInput(prev => prev + emoji)} />
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

			{viewingImage && <ImageLightbox url={viewingImage} onClose={() => setViewingImage(null)} />}
		</div>
	)
}
