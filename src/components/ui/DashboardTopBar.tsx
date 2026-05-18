"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import clsx from "clsx"
import { Icon } from "@/components/ui/Icon"
import { NotificationBell } from "@/components/ui/NotificationBell"
import { LogoutConfirmDialog } from "@/components/ui/LogoutConfirmDialog"
import { useAuthStore } from "@/store/authStore"
import { useHostStore } from "@/store/hostStore"

import AltArrowDownSvg from "@/icons/outlined/alt-arrow-down.svg"

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

	const displayName = profile?.displayName || "Host"
	const initials = displayName.split(" ").filter(Boolean).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "H"

	const userRef = useRef<HTMLDivElement>(null)

	async function handleSignOut() {
		clearProfile()
		await signOut()
		router.replace("/login")
	}

	useClickOutside(userRef, () => setUserOpen(false))

	return (
		<>
		<div className="hidden lg:flex items-center justify-between px-8 py-4 bg-surface-card border-b border-border-subtle shrink-0">
			<p className="text-body-sm text-text-secondary">
				Welcome to <span className="font-semibold text-text-primary">Meetday</span>
			</p>

			<div className="flex items-center gap-3">
				<NotificationBell />

				{/* User menu */}
				<div ref={userRef} className="relative">
					<button
						onClick={() => setUserOpen((o) => !o)}
						className="flex items-center gap-2 cursor-pointer hover:bg-surface-card-muted px-2 py-1.5 rounded-action transition-colors"
					>
						<div className="size-8 rounded-avatar bg-surface-brand-soft flex items-center justify-center">
							<span className="text-label-sm font-semibold text-text-brand">{initials}</span>
						</div>
						<span className="text-label-md text-text-primary">{displayName}</span>
						<Icon
							as={AltArrowDownSvg}
							size="sm"
							color="secondary"
							className={clsx("transition-transform duration-150", userOpen && "rotate-180")}
						/>
					</button>

					{userOpen && (
						<div className="absolute right-0 top-full mt-2 z-50 bg-surface-card border border-border-subtle rounded-action shadow-floating py-1 min-w-36">
							<button
								onClick={() => {
									setUserOpen(false)
									setShowLogoutConfirm(true)
								}}
								className="w-full text-left px-4 py-2.5 text-label-sm font-medium text-text-brand hover:bg-surface-card-muted transition-colors"
							>
								Sign Out
							</button>
						</div>
					)}
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
