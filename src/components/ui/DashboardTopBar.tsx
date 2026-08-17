"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import clsx from "clsx"
import { Icon } from "@/components/ui/Icon"
import { NotificationBell } from "@/components/ui/NotificationBell"
import { LogoutConfirmDialog } from "@/components/ui/LogoutConfirmDialog"
import { useAuthStore } from "@/store/authStore"
import { useHostStore } from "@/store/hostStore"

import AltArrowDownSvg from "@/icons/outlined/alt-arrow-down.svg"
import UserSvg from "@/icons/outlined/user.svg"

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
	useEffect(() => {
		function onMouseDown(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				handler()
			}
		}
		document.addEventListener("mousedown", onMouseDown)
		return () => document.removeEventListener("mousedown", onMouseDown)
	}, [ref, handler])
}

export function DashboardTopBar() {
	const [userOpen, setUserOpen] = useState(false)
	const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

	const { signOut } = useAuthStore()
	const { profile, clearProfile } = useHostStore()
	const router = useRouter()
	const pathname = usePathname()
	const isBrand = pathname?.startsWith("/brand")
	const profilePath = isBrand ? "/brand/dashboard/profile" : "/community/dashboard/profile"

	const displayName = profile?.displayName || "Community"
	const initials = displayName.split(" ").filter(Boolean).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "C"

	const userRef = useRef<HTMLDivElement>(null)

	async function handleSignOut() {
		clearProfile()
		router.replace("/")
		await signOut()
	}

	useClickOutside(userRef, () => setUserOpen(false))

	return (
		<>
		<div className="hidden lg:flex items-center justify-between px-8 py-4 bg-surface-card border-b border-border-default shrink-0">
			<p className="text-body-sm text-text-secondary">
				Welcome to <span className="font-semibold text-text-primary">Meetday</span>
			</p>

			<div className="flex items-center gap-3">
				<NotificationBell />

				{/* User menu */}
				<div ref={userRef} className="relative">
					<button
						onClick={() => router.push(profilePath)}
						className="flex items-center gap-2 cursor-pointer hover:bg-surface-card-muted px-2 py-1.5 rounded-action transition-colors"
					>
						{profile?.avatarUrl ? (
							<div className="relative size-8 rounded-avatar overflow-hidden shrink-0 border border-border-default bg-surface-hover">
								<Image
									src={profile.avatarUrl}
									alt={displayName}
									fill
									sizes="32px"
									className="object-cover"
								/>
							</div>
						) : (
							<div className="size-8 rounded-avatar bg-surface-brand-soft flex items-center justify-center shrink-0 text-text-brand">
								<Icon as={UserSvg} size="sm" />
							</div>
						)}
						<span className="text-label-md text-text-primary">{displayName}</span>
					</button>
				</div>
			</div>
		</div>
		<LogoutConfirmDialog
			open={showLogoutConfirm}
			onClose={() => setShowLogoutConfirm(false)}
			onConfirm={handleSignOut}
		/>
		</>
	)
}
