import type { Metadata } from "next"

export const metadata: Metadata = {
	title: "Leave a Review — Meetday",
	description: "Share your experience and help others find events they'll love.",
}

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>
}
