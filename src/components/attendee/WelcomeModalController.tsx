"use client"

import { useAttendeeProfileStore } from "@/store/attendeeProfileStore"
import { RegistrationSuccessModal } from "./RegistrationSuccessModal"

export function WelcomeModalController() {
	const showWelcomeModal = useAttendeeProfileStore((s) => s.showWelcomeModal)
	const setShowWelcomeModal = useAttendeeProfileStore((s) => s.setShowWelcomeModal)

	return (
		<RegistrationSuccessModal
			open={showWelcomeModal}
			onClose={() => setShowWelcomeModal(false)}
		/>
	)
}
