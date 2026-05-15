import type { Metadata } from "next"
import { AttendeeHeader } from "@/components/attendee/AttendeeHeader"
import { WelcomeModalController } from "@/components/attendee/WelcomeModalController"

export const metadata: Metadata = {
	title: "Explore Events — Meetday",
	description: "Find events that feel like you. Meet people who match your vibe.",
}

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
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
