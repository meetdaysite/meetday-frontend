"use client"

import { useEffect, useState } from "react"
import { Switch } from "@/components/ui/Switch"
import { isNotificationSoundMuted, setNotificationSoundMuted } from "@/lib/notificationSound"

/** Profile-page row toggling the "Meetday" chat notification sound on/off, persisted locally. */
export function NotificationSoundToggle() {
	const [muted, setMuted] = useState(false)

	useEffect(() => {
		// Read the persisted preference once on mount — intentional, not a derived-state effect.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setMuted(isNotificationSoundMuted())
	}, [])

	function handleChange(checked: boolean) {
		// checked = sound ON, so muted is the inverse.
		setMuted(!checked)
		setNotificationSoundMuted(!checked)
	}

	return (
		<div className="flex items-center justify-between py-4 border-b border-black/10">
			<div>
				<span className="font-heading font-black text-base text-black">Notification Sound</span>
				<p className="text-xs font-semibold text-black/40 mt-0.5">Play a sound when a new chat message arrives</p>
			</div>
			<Switch checked={!muted} onChange={handleChange} />
		</div>
	)
}
