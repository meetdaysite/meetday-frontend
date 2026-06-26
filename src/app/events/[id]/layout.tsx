import type { Metadata } from "next"
import { AttendeeHeader } from "@/components/attendee/AttendeeHeader"
import { WelcomeModalController } from "@/components/attendee/WelcomeModalController"

export const metadata: Metadata = {
	title: "Experience Details — Meetday",
	description: "Discover experience details and get your tickets on Meetday.",
}

export default function EventDetailsLayout({ children }: { children: React.ReactNode }) {
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
