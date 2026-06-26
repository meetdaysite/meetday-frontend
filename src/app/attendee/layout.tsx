import type { Metadata } from "next"

export const metadata: Metadata = {
	title: "Meetday — Find experiences that feel like you",
	description:
		"Discover experiences, meet like-minded people, and build real connections — before, during, and after.",
}

export default function AttendeeLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>
}
