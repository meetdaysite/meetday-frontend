import type { Metadata } from "next"
import { AttendeeHeader } from "@/components/attendee/AttendeeHeader"

export const metadata: Metadata = {
	title: "My Communities — Meetday",
	description: "Communities you've joined and saved.",
}

export default function MyCommunitiesLayout({ children }: { children: React.ReactNode }) {
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
