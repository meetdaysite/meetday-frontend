import type { Metadata } from "next"
import { AttendeeHeader } from "@/components/attendee/AttendeeHeader"

export const metadata: Metadata = {
	title: "My Experiences — Meetday",
	description: "View and manage all your upcoming and past experiences.",
}

export default function MyEventsLayout({ children }: { children: React.ReactNode }) {
	return (
		<div
			className="flex flex-col min-h-screen bg-cover bg-center bg-no-repeat"
			style={{ backgroundImage: "url('/assets/attendee/attendee_bg.png')" }}
		>
			<AttendeeHeader />
			<div className="flex flex-col flex-1">{children}</div>
		</div>
	)
}
