"use client"

import { useRouter } from "next/navigation"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import ShareSvg from "@/icons/outlined/share.svg"
import { useAuthStore } from "@/store/authStore"

export function StickyFooter({ eventId }: { eventId: string }) {
	const router = useRouter()
	const user = useAuthStore((s) => s.user)

	function handleShare() {
		if (navigator.share) {
			navigator.share({ title: document.title, url: window.location.href }).catch(() => {})
		} else {
			navigator.clipboard.writeText(window.location.href).catch(() => {})
		}
	}

	function handleJoin() {
		if (!user) {
			router.push(`/attendee/login?redirect=${encodeURIComponent(window.location.pathname)}`)
			return
		}
		router.push(`/events/${eventId}/book`)
	}

	return (
		<div className="rounded-action bg-surface-card border border-border-subtle p-5 flex items-center justify-between gap-4">
			<div className="flex flex-col gap-0.5">
				<p className="text-label-md font-semibold text-text-primary">Secure your spot.</p>
				<p className="text-body-sm text-text-muted">Limited tickets available.</p>
			</div>

			<div className="flex items-center gap-2 shrink-0">
				<Button variant="secondary" size="md" leftIcon={<Icon as={ShareSvg} size="sm" color="inherit" />} onClick={handleShare}>
					Share
				</Button>
				<Button variant="primary" size="md" onClick={handleJoin}>
					{user ? "Join this event" : "Sign in to join"}
				</Button>
			</div>
		</div>
	)
}
