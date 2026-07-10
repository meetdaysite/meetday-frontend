import type { Metadata } from "next"
import { AttendeeHeader } from "@/components/attendee/AttendeeHeader"
import { WelcomeModalController } from "@/components/attendee/WelcomeModalController"

export const metadata: Metadata = {
	title: "Communities — Meetday",
	description: "Discover communities on Meetday and find your people.",
}

export default function CommunitiesListLayout({ children }: { children: React.ReactNode }) {
	return (
		<div
			className="flex flex-col min-h-screen bg-cover bg-center bg-no-repeat"
			style={{ backgroundImage: "url('/assets/attendee/attendee_bg.png')" }}
		>
			<AttendeeHeader />
			<div className="flex flex-col flex-1">{children}</div>
			<WelcomeModalController />
		</div>
	)
}
