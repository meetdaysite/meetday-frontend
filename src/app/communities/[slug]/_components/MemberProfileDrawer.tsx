"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import CloseSvg from "@/icons/outlined/close.svg"
import DotsSvg from "@/icons/outlined/dots.svg"
import VerifiedSvg from "@/icons/filled/verified-check.svg"
import StarSvg from "@/icons/outlined/star.svg"
import MapPointSvg from "@/icons/outlined/map-point.svg"
import StarCircleSvg from "@/icons/outlined/star-circle.svg"
import CalendarSvg from "@/icons/outlined/calendar.svg"
import UserSvg from "@/icons/outlined/user.svg"
import Checklist2Svg from "@/icons/outlined/checklist-2.svg"
import ChatSvg from "@/icons/outlined/chat.svg"
import ShieldCheckSvg from "@/icons/outlined/shield-check.svg"
import ArrowRightSvg from "@/icons/outlined/arrow-right.svg"
import PlaneSvg from "@/icons/outlined/plane.svg"
import LockSvg from "@/icons/outlined/lock.svg"
import { useAttendeeProfileStore } from "@/store/attendeeProfileStore"
import { getOrCreateDeviceIdentity, getMasterKey, setConversationKey } from "@/lib/deviceStore"
import {
	getSodium,
	b64,
	unb64,
	encryptMessage,
	generateConversationKey,
	wrapKeyToDevice,
	wrapKeyToMaster,
} from "@/lib/e2ee"
import {
	getMemberDeviceKeys,
	sendIntro,
	acceptIntro,
	rejectIntro,
	fetchConversationKeys,
	uploadConversationKeys,
} from "@/lib/chatApi"
import { listMyDevices } from "@/lib/e2eeApi"
import { E2EESetupModal, type E2EESetupMode } from "./E2EESetupModal"

// ─── Types ────────────────────────────────────────────────────────────────────

export type MemberRole = "Top Contributor" | "New Member" | "Active Member"
export type DmStatus = "none" | "intro_sent" | "intro_received" | "connected"

export interface SharedExperience {
	id: string
	title: string
	date: string
	imageUrl: string
	status: "going" | "interested"
}

export interface DrawerMember {
	id: string
	name: string
	avatarUrl: string | null
	role: MemberRole
	city: string
	online?: boolean
	isVerified?: boolean
	vibe?: string
	sharedInterests?: string[]
	sharedExperiences?: SharedExperience[]
	communityActivity?: {
		joinedAgo: string
		experiencesAttended: number
		posts: number
		chatReplies: number
	}
	dmStatus?: DmStatus
	conversationId?: string
}

const ROLE_CONFIG: Record<MemberRole, { textClass: string; iconColor: "vibe" | "success" }> = {
	"Top Contributor": { textClass: "text-violet-600", iconColor: "vibe" },
	"New Member": { textClass: "text-violet-600", iconColor: "vibe" },
	"Active Member": { textClass: "text-teal-600", iconColor: "success" },
}

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: MemberRole }) {
	const config = ROLE_CONFIG[role]
	return (
		<span className={`flex items-center gap-1 text-[12px] font-semibold ${config.textClass}`}>
			<Icon as={StarSvg} size="xs" color={config.iconColor} />
			{role}
		</span>
	)
}

// ─── Avatar fallback ──────────────────────────────────────────────────────────

function AvatarFallback({ name, size }: { name: string; size: number }) {
	const initial = name.trim()[0]?.toUpperCase() ?? "?"
	const sizeClass = `size-${size}`
	return (
		<div className={`${sizeClass} rounded-full bg-surface-brand-soft border border-border-default flex items-center justify-center`}>
			<span className="text-sm font-bold text-text-brand">{initial}</span>
		</div>
	)
}

// ─── Device setup check ───────────────────────────────────────────────────────

async function detectSetupMode(): Promise<E2EESetupMode | null> {
	try {
		const { deviceId } = await getOrCreateDeviceIdentity()
		const devices = await listMyDevices()
		const registered = devices.find(d => d.deviceId === deviceId && !d.revokedAt)
		if (registered) return null // already set up
		// Device not on server — check if backup exists
		try {
			const { fetchKeyBackup } = await import("@/lib/e2eeApi")
			await fetchKeyBackup()
			return "new-device"
		} catch {
			return "first-device"
		}
	} catch {
		return "first-device"
	}
}

// ─── Say Hi Modal ─────────────────────────────────────────────────────────────

const MAX_INTRO_CHARS = 250

function SayHiModal({
	member,
	communityId,
	currentUserId,
	onClose,
	onSuccess,
}: {
	member: DrawerMember
	communityId: string
	currentUserId: string
	onClose: () => void
	onSuccess: (conversationId: string) => void
}) {
	const profile = useAttendeeProfileStore(s => s.profile)
	const defaultMessage = `Hi ${member.name} 👋\n\nWould love to connect and learn more about you!`
	const [message, setMessage] = useState(defaultMessage)
	const [sending, setSending] = useState(false)

	const handleSend = async () => {
		if (!message.trim()) return
		setSending(true)
		try {
			await getSodium()

			// Get local device identity
			const { deviceId, publicKey: myPub, privateKey: myPriv } = await getOrCreateDeviceIdentity()

			// Fetch recipient's devices and my own active devices
			const [theirDevices, myDevices] = await Promise.all([
				getMemberDeviceKeys(communityId, member.id),
				listMyDevices(),
			])

			const myActiveDevices = myDevices.filter(d => !d.revokedAt)
			if (!myActiveDevices.find(d => d.deviceId === deviceId)) {
				toast.error("Device not registered. Please set up secure messaging first.")
				setSending(false)
				return
			}

			// Generate conversation key and encrypt the intro message
			const K = await generateConversationKey()
			const encPayload = await encryptMessage(K, message.trim())

			// Wrap K to every device of both participants
			const deviceWraps = await Promise.all([
				...theirDevices.map(async d => ({
					recipientUserId: member.id,
					recipientDeviceId: d.deviceId,
					epoch: 1,
					wrappedKey: await wrapKeyToDevice(K, unb64(d.identityPublicKey)),
				})),
				...myActiveDevices.map(async d => ({
					recipientUserId: currentUserId,
					recipientDeviceId: d.deviceId,
					epoch: 1,
					wrappedKey: await wrapKeyToDevice(K, unb64(d.identityPublicKey)),
				})),
			])

			// Wrap K under my master key for self-recovery
			const MK = await getMasterKey()
			const masterWraps = MK
				? [{ userId: currentUserId, epoch: 1, wrappedKey: await wrapKeyToMaster(K, MK) }]
				: []

			const { conversationId } = await sendIntro(communityId, {
				targetUserId: member.id,
				message: { ...encPayload, messageType: "TEXT" as const },
				keys: { deviceWraps, masterWraps },
			})

			await setConversationKey(conversationId, 1, K)
			toast.success(`Intro sent to ${member.name}!`)
			onSuccess(conversationId)
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response?.status
			if (status === 409) {
				toast.error("An intro is already pending with this member.")
			} else if (status === 403) {
				toast.error("This member isn't accepting intro requests right now.")
			} else {
				toast.error("Failed to send intro. Please try again.")
			}
		} finally {
			setSending(false)
		}
	}

	const currentName = profile ? `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() : "You"
	const currentAvatar = profile?.avatarUrl ?? null

	return (
		<div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4">
			{/* Backdrop */}
			<div className="absolute inset-0 bg-black/50" onClick={onClose} />

			{/* Sheet */}
			<div className="relative w-full sm:max-w-md bg-surface-card rounded-t-2xl sm:rounded-2xl overflow-y-auto max-h-[92svh] no-scrollbar flex flex-col">
				<div className="p-6 flex flex-col gap-5">
					{/* Header */}
					<div className="flex items-center justify-between">
						<h2 className="text-body-lg font-bold text-text-primary">Say hi to {member.name}</h2>
						<button
							type="button"
							onClick={onClose}
							className="text-text-muted hover:text-text-primary transition-colors"
						>
							<Icon as={CloseSvg} size="md" color="muted" />
						</button>
					</div>

					{/* Mini profile */}
					<div className="flex items-start gap-3">
						<div className="relative shrink-0">
							{member.avatarUrl ? (
								<div className="relative size-14 rounded-full overflow-hidden border border-border-default bg-surface-hover">
									<Image src={member.avatarUrl} alt={member.name} fill sizes="56px" className="object-cover" />
								</div>
							) : (
								<AvatarFallback name={member.name} size={14} />
							)}
							{member.online && (
								<span className="absolute bottom-0.5 right-0.5 size-3 rounded-full bg-green-500 border-2 border-surface-card" />
							)}
						</div>
						<div className="flex flex-col gap-0.5">
							<div className="flex items-center gap-1.5">
								<span className="text-body-md font-bold text-text-primary">{member.name}</span>
								{member.isVerified && <Icon as={VerifiedSvg} size="sm" color="brand" />}
								<RoleBadge role={member.role} />
							</div>
							<div className="flex items-center gap-1 text-label-sm text-text-secondary">
								<Icon as={MapPointSvg} size="xs" color="secondary" />
								{member.city ? `${member.city}, India` : "India"}
							</div>
							{member.vibe && (
								<div className="flex items-center gap-1 text-label-sm text-text-secondary">
									<Icon as={StarCircleSvg} size="xs" color="secondary" />
									{member.vibe}
								</div>
							)}
						</div>
					</div>

					{/* Common interests */}
					{member.sharedInterests && member.sharedInterests.length > 0 && (
						<div className="flex items-start gap-3 bg-surface-vibe-soft border border-purple-100 rounded-action p-3">
							<Icon as={StarSvg} size="sm" color="vibe" className="mt-0.5 shrink-0" />
							<div className="flex flex-col gap-2">
								<p className="text-label-sm font-semibold text-text-primary">
									You both have {member.sharedInterests.length} things in common
								</p>
								<div className="flex flex-wrap gap-1.5">
									{member.sharedInterests.map(interest => (
										<span
											key={interest}
											className="text-[11px] text-text-secondary border border-border-default rounded-full px-2.5 py-1 bg-surface-card"
										>
											{interest}
										</span>
									))}
								</div>
							</div>
						</div>
					)}

					{/* Intro section */}
					<div className="flex flex-col gap-2">
						<h3 className="text-body-md font-bold text-text-primary">Start a warm introduction</h3>
						<p className="text-label-sm text-text-secondary font-normal">
							Introduce yourself and mention why you&apos;d like to connect.
							<br />
							This is not a chat. It&apos;s a friendly intro request.
						</p>
					</div>

					{/* Textarea */}
					<div className="flex flex-col gap-1">
						<div className="relative">
							<textarea
								value={message}
								onChange={e => setMessage(e.target.value.slice(0, MAX_INTRO_CHARS))}
								rows={5}
								disabled={sending}
								className="w-full resize-none rounded-action border border-border-default bg-surface-page px-4 py-3 text-label-sm text-text-primary placeholder:text-text-muted outline-none focus:border-border-focus transition-colors pr-4 pb-7 disabled:opacity-60"
							/>
							<span className="absolute bottom-3 right-3 text-[11px] text-text-muted select-none">
								{message.length}/{MAX_INTRO_CHARS}
							</span>
						</div>
						<p className="text-[11px] text-text-muted">
							This introduction will be visible to {member.name}.
						</p>
					</div>

					{/* Preview */}
					<div className="rounded-action border border-border-default bg-surface-page p-4 flex flex-col gap-3">
						<p className="text-label-sm font-bold text-text-primary">Preview to {member.name}</p>
						<div className="flex items-start gap-3">
							<div className="relative size-10 rounded-full overflow-hidden shrink-0 border border-border-default bg-surface-hover">
								{currentAvatar ? (
									<Image src={currentAvatar} alt="You" fill sizes="40px" className="object-cover" />
								) : (
									<div className="w-full h-full flex items-center justify-center bg-surface-brand-soft">
										<span className="text-xs font-bold text-text-brand">
											{currentName[0]?.toUpperCase() ?? "Y"}
										</span>
									</div>
								)}
							</div>
							<div className="flex flex-col gap-0.5 min-w-0">
								<p className="text-label-sm font-bold text-text-primary">{currentName}</p>
								<p className="text-label-sm text-text-primary font-normal mt-1 whitespace-pre-line leading-relaxed">
									{message}
								</p>
							</div>
						</div>
					</div>

					{/* Actions */}
					<div className="flex gap-3">
						<Button
							variant="primary"
							size="md"
							radius="pill"
							leftIcon={<Icon as={PlaneSvg} size="sm" color="inverse" />}
							className="w-full"
							onClick={handleSend}
							disabled={sending}
						>
							{sending ? "Sending…" : "Send Introduction"}
						</Button>
						<Button
							variant="secondary"
							size="md"
							radius="pill"
							className="w-full"
							onClick={onClose}
							disabled={sending}
						>
							Cancel
						</Button>
					</div>

					{/* E2EE note */}
					<div className="flex items-center justify-center gap-1.5 text-[11px] text-text-muted">
						<Icon as={LockSvg} size="xs" color="muted" />
						End-to-end encrypted. Only you and {member.name} can read this.
					</div>
				</div>
			</div>
		</div>
	)
}

// ─── Member Profile Drawer ────────────────────────────────────────────────────

export function MemberProfileDrawer({
	member,
	communityId,
	currentUserId,
	detailLoading = false,
	onClose,
}: {
	member: DrawerMember | null
	communityId: string
	currentUserId: string | null
	detailLoading?: boolean
	onClose: () => void
}) {
	const [sayHiOpen, setSayHiOpen] = useState(false)
	const [e2eeSetupMode, setE2eeSetupMode] = useState<E2EESetupMode | null>(null)
	const [localDmStatus, setLocalDmStatus] = useState<DmStatus | null>(null)
	const [pendingAction, setPendingAction] = useState<"sayhi" | null>(null)
	const [actionLoading, setActionLoading] = useState(false)

	// Reset local overrides when member changes
	useEffect(() => {
		setLocalDmStatus(null)
		setSayHiOpen(false)
		setE2eeSetupMode(null)
		setPendingAction(null)
	}, [member?.id])

	if (!member) return null

	const effectiveDmStatus = localDmStatus ?? member.dmStatus ?? "none"
	const role = ROLE_CONFIG[member.role]

	const handleSayHiClick = async () => {
		if (!currentUserId) {
			toast.error("Please log in to send an intro.")
			return
		}
		// Check device setup
		const mode = await detectSetupMode()
		if (mode) {
			setPendingAction("sayhi")
			setE2eeSetupMode(mode)
		} else {
			setSayHiOpen(true)
		}
	}

	const handleE2EESetupSuccess = () => {
		setE2eeSetupMode(null)
		if (pendingAction === "sayhi") {
			setSayHiOpen(true)
		}
		setPendingAction(null)
	}

	const handleIntroSuccess = (conversationId: string) => {
		setSayHiOpen(false)
		setLocalDmStatus("intro_sent")
		// store conversationId for future use if needed
		member.conversationId = conversationId
	}

	const handleAcceptIntro = async () => {
		if (!member.conversationId || !currentUserId) return
		setActionLoading(true)
		try {
			await acceptIntro(communityId, member.conversationId)
			// Upload own master wrap so future devices can recover K
			const { deviceId } = await getOrCreateDeviceIdentity()
			const keys = await fetchConversationKeys(communityId, member.conversationId, deviceId)
			if (keys.deviceKeys.length > 0) {
				const { unwrapDeviceKey, wrapKeyToMaster: wrapMaster } = await import("@/lib/e2ee")
				const { publicKey, privateKey } = await getOrCreateDeviceIdentity()
				const K = await unwrapDeviceKey(keys.deviceKeys[0].wrappedKey, publicKey, privateKey)
				await setConversationKey(member.conversationId, 1, K)
				const MK = await getMasterKey()
				if (MK) {
					await uploadConversationKeys(communityId, member.conversationId, {
						masterWraps: [{ userId: currentUserId, epoch: 1, wrappedKey: await wrapMaster(K, MK) }],
					})
				}
			}
			setLocalDmStatus("connected")
			toast.success("Intro accepted! You can now chat.")
		} catch {
			toast.error("Failed to accept intro. Please try again.")
		} finally {
			setActionLoading(false)
		}
	}

	const handleRejectIntro = async () => {
		if (!member.conversationId) return
		setActionLoading(true)
		try {
			await rejectIntro(communityId, member.conversationId)
			setLocalDmStatus("none")
		} catch {
			toast.error("Failed to decline intro. Please try again.")
		} finally {
			setActionLoading(false)
		}
	}

	return (
		<>
			{/* Backdrop + drawer container */}
			<div className="fixed inset-0 z-50 flex justify-end">
				<div className="absolute inset-0 bg-black/40" onClick={onClose} />

				{/* Drawer panel */}
				<aside className="relative h-full w-full max-w-lg bg-surface-card shadow-2xl overflow-y-auto no-scrollbar flex flex-col">
					{/* Close row */}
					<div className="flex items-center justify-end p-4 shrink-0">
						<button
							type="button"
							onClick={onClose}
							className="text-text-muted hover:text-text-primary transition-colors"
						>
							<Icon as={CloseSvg} size="md" color="muted" />
						</button>
					</div>

					{detailLoading && (
						<div className="h-0.5 w-full overflow-hidden bg-border-default shrink-0">
							<div className="h-full w-1/3 bg-action-primary animate-pulse" />
						</div>
					)}

					<div className="px-6 pb-8 flex flex-col gap-5">
						{/* Avatar + name row */}
						<div className="flex flex-col items-start gap-3">
							<div className="relative">
								{member.avatarUrl ? (
									<div className="relative size-20 rounded-full overflow-hidden border-2 border-surface-hover bg-surface-hover">
										<Image src={member.avatarUrl} alt={member.name} fill sizes="80px" className="object-cover" />
									</div>
								) : (
									<AvatarFallback name={member.name} size={20} />
								)}
								{member.online && (
									<span className="absolute bottom-1 right-1 size-4 rounded-full bg-green-500 border-2 border-surface-card" />
								)}
							</div>

							<div className="w-full flex items-start justify-between gap-2">
								<div className="flex flex-col gap-1">
									<div className="flex items-center gap-1.5">
										<h2 className="text-body-xl font-bold text-text-primary">{member.name}</h2>
										{member.isVerified && <Icon as={VerifiedSvg} size="sm" color="brand" />}
									</div>
									<RoleBadge role={member.role} />
									<div className="flex items-center gap-1.5 mt-1 text-label-sm text-text-secondary">
										<Icon as={MapPointSvg} size="xs" color="secondary" />
										{member.city ? `${member.city}, India` : "India"}
									</div>
									{member.vibe && (
										<div className="flex items-center gap-1.5 text-label-sm text-text-secondary">
											<Icon as={StarCircleSvg} size="xs" color="secondary" />
											{member.vibe}
										</div>
									)}
								</div>
								<button
									type="button"
									className="text-text-muted hover:text-text-primary transition-colors mt-0.5 shrink-0"
								>
									<Icon as={DotsSvg} size="sm" color="muted" />
								</button>
							</div>
						</div>

						<div className="h-px bg-border-default" />

						{/* Shared interests */}
						{member.sharedInterests && member.sharedInterests.length > 0 && (
							<div className="flex flex-col gap-3">
								<p className="text-body-md font-semibold text-text-primary">Shared interests</p>
								<div className="flex flex-wrap gap-1.5">
									{member.sharedInterests.map(interest => (
										<span
											key={interest}
											className="text-label-sm text-text-secondary border border-border-default rounded-full px-3 py-1"
										>
											{interest}
										</span>
									))}
								</div>
							</div>
						)}

						{/* Shared experiences */}
						{member.sharedExperiences && member.sharedExperiences.length > 0 && (
							<div className="flex flex-col gap-3">
								<p className="text-body-md font-semibold text-text-primary">Shared experiences</p>
								<div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
									{member.sharedExperiences.map(exp => (
										<div key={exp.id} className="shrink-0 w-36 flex flex-col gap-1.5">
											<div className="relative h-22 rounded-action overflow-hidden bg-surface-hover">
												<Image src={exp.imageUrl} alt={exp.title} fill sizes="144px" className="object-cover" />
											</div>
											<p className="text-label-sm font-bold text-text-primary leading-snug">{exp.title}</p>
											<p className="text-[11px] text-text-muted">{exp.date}</p>
											<span className="self-start text-[11px] font-medium text-violet-600 bg-surface-vibe-soft border border-purple-200 rounded-full px-2.5 py-0.5">
												{exp.status === "going" ? "Going" : "Interested"}
											</span>
										</div>
									))}
									<button
										type="button"
										className="size-8 rounded-full border border-border-default bg-surface-page hover:bg-surface-hover transition-colors flex items-center justify-center shrink-0 self-center"
									>
										<Icon as={ArrowRightSvg} size="xs" color="secondary" />
									</button>
								</div>
							</div>
						)}

						{/* Community activity */}
						{member.communityActivity && (
							<div className="flex flex-col gap-3">
								<p className="text-body-md font-semibold text-text-primary">Community activity</p>
								<div className="flex flex-col gap-2.5">
									<div className="flex items-center gap-3 text-label-sm text-text-secondary">
										<Icon as={UserSvg} size="sm" color="secondary" />
										Joined {member.communityActivity.joinedAgo}
									</div>
									<div className="flex items-center gap-3 text-label-sm text-text-secondary">
										<Icon as={CalendarSvg} size="sm" color="secondary" />
										{member.communityActivity.experiencesAttended} experiences attended
									</div>
									<div className="flex items-center gap-3 text-label-sm text-text-secondary">
										<Icon as={Checklist2Svg} size="sm" color="secondary" />
										{member.communityActivity.posts} community posts
									</div>
									<div className="flex items-center gap-3 text-label-sm text-text-secondary">
										<Icon as={ChatSvg} size="sm" color="secondary" />
										{member.communityActivity.chatReplies} chat replies
									</div>
								</div>
							</div>
						)}

						<div className="h-px bg-border-default" />

						{/* Empty state — shown when no content sections are visible */}
						{!member.sharedInterests?.length && !member.sharedExperiences?.length && !member.communityActivity && (
							<div className="rounded-action border border-border-default bg-surface-page p-4 flex items-start gap-3">
								<div className="size-8 rounded-full bg-surface-brand-soft flex items-center justify-center shrink-0 mt-0.5">
									<Icon as={LockSvg} size="xs" color="brand" />
								</div>
								<div className="flex flex-col gap-0.5">
									<p className="text-label-sm font-semibold text-text-primary">Private profile</p>
									<p className="text-[11px] text-text-secondary font-normal leading-snug">
										This member keeps their profile private. Send them an intro — they can choose to share more once connected.
									</p>
								</div>
							</div>
						)}

						{/* Actions */}
						<div className="flex flex-col gap-3">
							<p className="text-body-md font-semibold text-text-primary">Actions</p>
							<div className="flex gap-3">
								{effectiveDmStatus === "none" && (
									<>
										<Button
											variant="primary"
											size="md"
											radius="pill"
											leftIcon={<Icon as={ChatSvg} size="sm" color="inverse" />}
											className="w-full"
											onClick={handleSayHiClick}
										>
											Say Hi
										</Button>
										<Button
											variant="secondary"
											size="md"
											radius="pill"
											leftIcon={<Icon as={CalendarSvg} size="sm" color="primary" />}
											className="w-full"
										>
											Invite to Event
										</Button>
									</>
								)}

								{effectiveDmStatus === "intro_sent" && (
									<div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-full border border-border-default bg-surface-page text-label-sm text-text-secondary">
										<Icon as={PlaneSvg} size="sm" color="secondary" />
										Intro sent — waiting for response
									</div>
								)}

								{effectiveDmStatus === "intro_received" && (
									<>
										<Button
											variant="primary"
											size="md"
											radius="pill"
											className="w-full"
											disabled={actionLoading}
											onClick={handleAcceptIntro}
										>
											{actionLoading ? "Accepting…" : "Accept"}
										</Button>
										<Button
											variant="secondary"
											size="md"
											radius="pill"
											className="w-full"
											disabled={actionLoading}
											onClick={handleRejectIntro}
										>
											Decline
										</Button>
									</>
								)}

								{effectiveDmStatus === "connected" && (
									<Button
										variant="primary"
										size="md"
										radius="pill"
										leftIcon={<Icon as={ChatSvg} size="sm" color="inverse" />}
										className="w-full"
										onClick={() => toast("Open the Chat tab to continue your conversation.")}
									>
										Message
									</Button>
								)}
							</div>
						</div>

						{/* Privacy notice + community guidelines */}
						<div className="rounded-action bg-surface-vibe-soft border border-purple-100 p-4 flex flex-col gap-3">
							<div className="flex items-start gap-3">
								<Icon as={ShieldCheckSvg} size="sm" color="vibe" className="mt-0.5 shrink-0" />
								<p className="text-label-sm text-text-secondary font-normal leading-snug">
									Only information chosen by the member is shown. You can always report or
									block if something feels off.
								</p>
							</div>

							<div className="h-px bg-purple-100 ml-7" />

							<div className="ml-7 flex flex-col gap-2">
								<p className="text-label-sm font-semibold text-text-primary">Community guidelines</p>
								<ul className="flex flex-col gap-1.5">
									{[
										"Be respectful and kind to every member",
										"No spam, self-promotion, or irrelevant links",
										"Keep conversations on-topic and constructive",
										"Harassment or hate speech will not be tolerated",
										"Report anything that feels unsafe or off",
									].map(rule => (
										<li key={rule} className="flex items-start gap-2 text-[11px] text-text-secondary font-normal leading-snug">
											<span className="mt-1 size-1 rounded-full bg-violet-400 shrink-0" />
											{rule}
										</li>
									))}
								</ul>
							</div>
						</div>
					</div>
				</aside>
			</div>

			{/* Say Hi modal */}
			{sayHiOpen && currentUserId && (
				<SayHiModal
					member={member}
					communityId={communityId}
					currentUserId={currentUserId}
					onClose={() => setSayHiOpen(false)}
					onSuccess={handleIntroSuccess}
				/>
			)}

			{/* E2EE setup modal */}
			{e2eeSetupMode && (
				<E2EESetupModal
					mode={e2eeSetupMode}
					onSuccess={handleE2EESetupSuccess}
					onClose={() => { setE2eeSetupMode(null); setPendingAction(null) }}
				/>
			)}
		</>
	)
}
