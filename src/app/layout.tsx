import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import { AuthProvider } from "@/context/AuthContext"
import "./globals.css"

const poppins = Poppins({
	variable: "--font-poppins",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
	title: "Meetday",
	description: "The social network that happens in real life.",
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en" className={`${poppins.variable} h-full antialiased`}>
			<body className="min-h-full flex flex-col bg-surface-page text-text-primary">
				<AuthProvider>{children}</AuthProvider>
			</body>
		</html>
	)
}
