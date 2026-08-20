"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { io, type Socket } from "socket.io-client"
import { auth } from "@/lib/firebase"

export type ChatSenderType = "HOST" | "BRAND" | "ADMIN"

function getOrigin(): string {
	const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? ""
	return baseUrl.replace(/\/api(\/v\d+)?$/, "")
}

// Only re-emits typing-start at most once per this interval while the user keeps typing —
// the backend auto-clears a stale typing state after 3s of silence anyway.
const TYPING_EMIT_THROTTLE_MS = 2000

/** Connects to the sponsorship-chat typing-indicator socket for one thread while mounted. */
export function useChatTyping(interestId: string, myRole: ChatSenderType) {
	const [typingSenderType, setTypingSenderType] = useState<ChatSenderType | null>(null)
	const socketRef = useRef<Socket | null>(null)
	const lastEmitRef = useRef(0)

	useEffect(() => {
		let cancelled = false
		let socket: Socket | null = null

		auth.currentUser?.getIdToken().then(token => {
			if (!token || cancelled) return
			socket = io(`${getOrigin()}/sponsorship-chat`, {
				auth: { token },
				transports: ["polling", "websocket"],
			})
			socketRef.current = socket

			socket.on("connect", () => socket?.emit("join-chat", { interestId }))
			socket.on("typing", (payload: { interestId: string; senderType: ChatSenderType }) => {
				if (payload.interestId === interestId && payload.senderType !== myRole) setTypingSenderType(payload.senderType)
			})
			socket.on("typing-stopped", (payload: { interestId: string; senderType: ChatSenderType }) => {
				if (payload.interestId === interestId && payload.senderType !== myRole) setTypingSenderType(null)
			})
		})

		return () => {
			cancelled = true
			socket?.disconnect()
			socketRef.current = null
			setTypingSenderType(null)
		}
	}, [interestId, myRole])

	const notifyTyping = useCallback(() => {
		const now = Date.now()
		if (now - lastEmitRef.current < TYPING_EMIT_THROTTLE_MS) return
		lastEmitRef.current = now
		socketRef.current?.emit("typing-start", { interestId, senderType: myRole })
	}, [interestId, myRole])

	const notifyStopTyping = useCallback(() => {
		lastEmitRef.current = 0
		socketRef.current?.emit("typing-stop", { interestId, senderType: myRole })
	}, [interestId, myRole])

	return { typingSenderType, notifyTyping, notifyStopTyping }
}
