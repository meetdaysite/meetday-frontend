export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { Poppins, Bricolage_Grotesque } from "next/font/google"
import { Toaster } from "sonner"
import { AuthProvider } from "@/context/AuthContext"
import "./globals.css"

const poppins = Poppins({
	variable: "--font-poppins",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
})

const bricolage = Bricolage_Grotesque({
	variable: "--font-bricolage",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
	title: "Meetday",
	description: "The social network that happens in real life.",
	openGraph: {
		title: "meetday.ai",
		description: "A unified platform for brands and communities to partner.",
		images: [
			{
				url: "/images/Image.png",
				width: 1200,
				height: 630,
				alt: "Meetday",
			},
		],
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "meetday.ai",
		description: "A unified platform for brands and communities to partner.",
		images: ["/images/Image.png"],
	},
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en" className={`${poppins.variable} ${bricolage.variable} h-full antialiased`}>
			<body className="min-h-full flex flex-col bg-surface-page text-text-primary">
				<AuthProvider>{children}</AuthProvider>
				<Toaster richColors position="top-right" />
			</body>
		</html>
	)
}
