"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
// import ShareSvg from "@/icons/outlined/share.svg"
import BookmarkSvg from "@/icons/outlined/bookmark.svg"
import BookmarkFilledSvg from "@/icons/filled/bookmark.svg"
import { useAuthStore } from "@/store/authStore"
import { saveEvent, unsaveEvent } from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"
import { toast } from "sonner"

export function StickyFooter({
	eventId,
	isSaved: initialSaved = false,
}: {
	eventId: string
	isSaved?: boolean
}) {
	const router = useRouter()
	const user = useAuthStore(s => s.user)
	const [saved, setSaved] = useState(initialSaved)
	const [saving, setSaving] = useState(false)

	// function handleShare() {
	// 	if (navigator.share) {
	// 		navigator.share({ title: document.title, url: window.location.href }).catch(() => {})
	// 	} else {
	// 		navigator.clipboard.writeText(window.location.href).catch(() => {})
	// 	}
	// }

	function handleJoin() {
		if (!user) {
			router.push(`/attendee/login?redirect=${encodeURIComponent(window.location.pathname)}`)
			return
		}
		router.push(`/events/${eventId}/book`)
	}

	async function handleSave() {
		if (!user) {
			router.push(`/attendee/login?redirect=${encodeURIComponent(window.location.pathname)}`)
			return
		}
		if (saving) return
		const next = !saved
		setSaved(next)
		setSaving(true)
		try {
			if (next) {
				await saveEvent(eventId)
				toast.success("Event saved", { description: "Find it anytime in My Events → Saved." })
			} else {
				await unsaveEvent(eventId)
				toast.success("Event removed from saved")
			}
		} catch (err) {
			setSaved(!next)
			toast.error(getApiErrorMessage(err))
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="rounded-action bg-surface-card border border-border-default shadow-md p-5 flex items-center justify-between gap-4">
			<div className="flex flex-col gap-0.5">
				<p className="text-label-md font-semibold text-text-primary">Secure your spot.</p>
				<p className="text-body-sm text-text-muted">Limited tickets available.</p>
			</div>

			<div className="flex items-center gap-2 shrink-0">
				{/* <Button variant="secondary" size="md" leftIcon={<Icon as={ShareSvg} size="sm" color="inherit" />} onClick={handleShare}>
					Share
				</Button> */}
				<Button
					variant="secondary"
					size="md"
					leftIcon={
						<Icon
							as={saved ? BookmarkFilledSvg : BookmarkSvg}
							size="sm"
							color={saved ? "brand" : "inherit"}
						/>
					}
					onClick={handleSave}
					disabled={saving}
				>
					{saved ? "Saved" : "Save"}
				</Button>
				<Button variant="primary" size="md" onClick={handleJoin}>
					{user ? "Join this experience" : "Sign in to join"}
				</Button>
			</div>
		</div>
	)
}
