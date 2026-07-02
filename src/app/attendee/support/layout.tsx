import type { Metadata } from "next"
import { AttendeeHeader } from "@/components/attendee/AttendeeHeader"

export const metadata: Metadata = {
	title: "Support Tickets — Meetday",
	description: "Track your support requests and view resolutions.",
}

export default function SupportLayout({ children }: { children: React.ReactNode }) {
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
