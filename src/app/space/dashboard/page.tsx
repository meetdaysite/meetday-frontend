"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SpaceDashboardHome() {
	const router = useRouter()
	useEffect(() => {
		router.replace("/space/dashboard/profile")
	}, [router])
	return null
}
