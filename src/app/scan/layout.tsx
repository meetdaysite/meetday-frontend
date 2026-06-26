import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
	title: "Scanner — Meetday",
	robots: { index: false, follow: false },
}

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
}

export default function ScanLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
			{children}
		</div>
	)
}
