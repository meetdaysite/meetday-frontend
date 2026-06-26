import Image from "next/image"
import { AttendeeHeader } from "@/components/attendee/AttendeeHeader"

export default function AttendeeAuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="relative min-h-screen flex flex-col">
			<Image
				src="/assets/auth_bg.svg"
				alt=""
				fill
				className="object-cover object-center opacity-30 pointer-events-none select-none"
				priority
				aria-hidden
			/>

			<AttendeeHeader />

			<main className="relative flex flex-1 w-full max-w-screen-2xl mx-auto">
				{children}
			</main>
		</div>
	)
}
