import type { Metadata } from "next"
import { AttendeeHeader } from "@/components/attendee/AttendeeHeader"

export const metadata: Metadata = {
	title: "Explore Events — Meetday",
	description: "Find events that feel like you. Meet people who match your vibe.",
}

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex flex-col min-h-screen">
			<AttendeeHeader />
			<div className="flex flex-col flex-1">{children}</div>
		</div>
	)
}
