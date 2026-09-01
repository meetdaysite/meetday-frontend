"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { Switch } from "@/components/ui/Switch"
import CloseSvg from "@/icons/outlined/close.svg"
import UserSvg from "@/icons/outlined/user.svg"
import TrashSvg from "@/icons/outlined/trash-bin.svg"
import { getApiErrorMessage } from "@/lib/errors"
import type { TeamMember, TeamMembersList } from "@/lib/api"

const EMPTY_LIST: TeamMembersList = { members: [], viewerCanManage: false, viewerIsOwner: false }

interface TeamMembersModalProps {
	open: boolean
	onClose: () => void
	accountLabel: string
	listMembers: () => Promise<TeamMembersList>
	inviteMember: (email: string) => Promise<TeamMember>
	removeMember: (memberId: string) => Promise<void>
	setMemberPermission: (memberId: string, canManageMembers: boolean) => Promise<void>
}

export function TeamMembersModal({
	open,
	onClose,
	accountLabel,
	listMembers,
	inviteMember,
	removeMember,
	setMemberPermission,
}: TeamMembersModalProps) {
	const [list, setList] = useState<TeamMembersList>(EMPTY_LIST)
	const [loading, setLoading] = useState(true)
	const [email, setEmail] = useState("")
	const [inviting, setInviting] = useState(false)
	const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null)

	useEffect(() => {
		if (!open) return
		document.body.style.overflow = "hidden"
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setLoading(true)
		listMembers()
			.then(setList)
			.catch((err) => toast.error(getApiErrorMessage(err)))
			.finally(() => setLoading(false))
		return () => {
			document.body.style.overflow = ""
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open])

	if (!open) return null

	const { members, viewerCanManage, viewerIsOwner } = list

	async function handleInvite(e: React.FormEvent) {
		e.preventDefault()
		if (!email.trim() || inviting) return
		setInviting(true)
		try {
			await inviteMember(email.trim())
			toast.success(`Invite sent to ${email.trim()}`)
			setEmail("")
			const refreshed = await listMembers()
			setList(refreshed)
		} catch (err) {
			toast.error(getApiErrorMessage(err))
		} finally {
			setInviting(false)
		}
	}

	async function handleRemove() {
		if (!memberToRemove) return
		try {
			await removeMember(memberToRemove.id)
			toast.success(`Removed ${memberToRemove.email}`)
			setMemberToRemove(null)
			const refreshed = await listMembers()
			setList(refreshed)
		} catch (err) {
			toast.error(getApiErrorMessage(err))
		}
	}

	async function handleTogglePermission(member: TeamMember, canManageMembers: boolean) {
		try {
			await setMemberPermission(member.id, canManageMembers)
			const refreshed = await listMembers()
			setList(refreshed)
		} catch (err) {
			toast.error(getApiErrorMessage(err))
		}
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose()
			}}
		>
			<div className="bg-surface-card rounded-action border border-border-default shadow-floating w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col relative">
				{/* Header */}
				<div className="flex items-center justify-between p-5 border-b border-border-default shrink-0">
					<h2 className="text-body-lg font-extrabold text-text-primary">Team Members</h2>
					<button
						type="button"
						onClick={onClose}
						className="flex items-center justify-center size-8 rounded-full bg-surface-hover hover:bg-surface-page border border-border-default transition-colors"
					>
						<Icon as={CloseSvg} size="sm" color="secondary" />
					</button>
				</div>

				{/* Body */}
				<div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
					<p className="text-body-sm text-text-secondary">
						Anyone you add gets full access to {accountLabel}&apos;s dashboard. Everyone can see the full members list below.
					</p>

					{viewerCanManage ? (
						<form onSubmit={handleInvite} className="flex items-center gap-2">
							<input
								type="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="teammate@example.com"
								disabled={inviting}
								className="flex-1 h-10 px-4 rounded-input border border-border-default bg-surface-canvas text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors hover:border-border-strong focus:border-border-focused disabled:opacity-50"
							/>
							<Button type="submit" variant="primary" size="md" radius="pill" disabled={inviting}>
								{inviting ? "Sending…" : "Invite"}
							</Button>
						</form>
					) : (
						<p className="text-caption text-text-tertiary -mt-1">You don&apos;t have permission to add members.</p>
					)}

					<div className="flex flex-col gap-2">
						{loading ? (
							<p className="text-body-sm text-text-tertiary py-4 text-center">Loading members…</p>
						) : members.length === 0 ? (
							<p className="text-body-sm text-text-tertiary py-4 text-center">No members yet.</p>
						) : (
							members.map((member) => (
								<div
									key={member.id}
									className="flex items-center gap-3 p-3 rounded-action border border-border-default bg-surface-canvas"
								>
									<div className="size-9 rounded-full bg-surface-hover border border-border-default flex items-center justify-center shrink-0">
										<Icon as={UserSvg} size="sm" color="secondary" />
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-label-sm font-semibold text-text-primary truncate">
											{member.name || "Pending signup"}
										</p>
										<p className="text-caption text-text-tertiary truncate">{member.email}</p>
										{viewerIsOwner && member.role === "MEMBER" && (
											<div className="mt-1.5">
												<Switch
													checked={member.canManageMembers}
													onChange={(checked) => handleTogglePermission(member, checked)}
													label="Can add/remove members"
												/>
											</div>
										)}
									</div>
									<div className="flex flex-col items-end gap-1 shrink-0">
										<span className="text-[10px] font-black uppercase tracking-wider text-text-tertiary">
											{member.role === "OWNER" ? "Owner" : "Member"}
										</span>
										{member.status === "PENDING" && (
											<span className="text-[10px] font-black uppercase tracking-wider text-amber-600">
												Pending
											</span>
										)}
									</div>
									{viewerCanManage && member.role === "MEMBER" && (
										<button
											type="button"
											onClick={() => setMemberToRemove(member)}
											className="flex items-center justify-center size-8 rounded-full bg-surface-hover hover:bg-red-50 border border-border-default transition-colors shrink-0"
											aria-label={`Remove ${member.email}`}
										>
											<Icon as={TrashSvg} size="sm" color="secondary" />
										</button>
									)}
								</div>
							))
						)}
					</div>
				</div>
			</div>

			<ConfirmDialog
				open={!!memberToRemove}
				title="Remove this member?"
				description={`${memberToRemove?.email} will lose access to ${accountLabel}'s dashboard immediately. If their invite is still pending, this email will no longer be able to join using the invite link.`}
				confirmLabel="Remove"
				destructive
				onClose={() => setMemberToRemove(null)}
				onConfirm={handleRemove}
			/>
		</div>
	)
}
