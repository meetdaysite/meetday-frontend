import type { Metadata } from "next"
import { AttendeeHeader } from "@/components/attendee/AttendeeHeader"

export const metadata: Metadata = {
	title: "Community — Meetday",
	description: "Discover communities, connect with members, and get first access to events.",
}

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
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
