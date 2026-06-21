"use client"

import { useState } from "react"
import Image from "next/image"
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

// ─── Types ────────────────────────────────────────────────────────────────────

export type MemberRole = "Top Contributor" | "New Member" | "Active Member"

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
	avatarUrl: string
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
}

const ROLE_CONFIG: Record<MemberRole, { textClass: string; iconColor: "vibe" | "success" }> = {
	"Top Contributor": { textClass: "text-violet-600", iconColor: "vibe" },
	"New Member": { textClass: "text-violet-600", iconColor: "vibe" },
	"Active Member": { textClass: "text-teal-600", iconColor: "success" },
}

// TODO: Replace with real current user from useAuthStore
const MOCK_CURRENT_USER = {
	name: "You",
	avatarUrl: "https://i.pravatar.cc/40?img=8",
	city: "Kolkata",
	vibe: "Night Owl",
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

// ─── Say Hi Modal ─────────────────────────────────────────────────────────────

const MAX_INTRO_CHARS = 250

function SayHiModal({ member, onClose }: { member: DrawerMember; onClose: () => void }) {
	const defaultMessage = `Hi ${member.name} 👋\n\nI noticed we're both attending Night Rituals on May 23. Love Tech House too! Would love to connect before the event and maybe catch up there.`
	const [message, setMessage] = useState(defaultMessage)

	const handleSend = () => {
		// TODO: POST /api/users/[id]/introduction with message payload
		onClose()
	}

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
							<div className="relative size-14 rounded-full overflow-hidden border border-border-default bg-surface-hover">
								<Image
									src={member.avatarUrl}
									alt={member.name}
									fill
									sizes="56px"
									className="object-cover"
								/>
							</div>
							{member.online && (
								<span className="absolute bottom-0.5 right-0.5 size-3 rounded-full bg-green-500 border-2 border-surface-card" />
							)}
						</div>
						<div className="flex flex-col gap-0.5">
							<div className="flex items-center gap-1.5">
								<span className="text-body-md font-bold text-text-primary">
									{member.name}
								</span>
								{member.isVerified && <Icon as={VerifiedSvg} size="sm" color="brand" />}
								<RoleBadge role={member.role} />
							</div>
							<div className="flex items-center gap-1 text-label-sm text-text-secondary">
								<Icon as={MapPointSvg} size="xs" color="secondary" />
								{member.city}, India
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

					{/* Start a warm introduction */}
					<div className="flex flex-col gap-2">
						<h3 className="text-body-md font-bold text-text-primary">
							Start a warm introduction
						</h3>
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
								className="w-full resize-none rounded-action border border-border-default bg-surface-page px-4 py-3 text-label-sm text-text-primary placeholder:text-text-muted outline-none focus:border-border-focus transition-colors pr-4 pb-7"
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
								<Image
									src={MOCK_CURRENT_USER.avatarUrl}
									alt="You"
									fill
									sizes="40px"
									className="object-cover"
								/>
							</div>
							<div className="flex flex-col gap-0.5 min-w-0">
								<p className="text-label-sm font-bold text-text-primary">
									{MOCK_CURRENT_USER.name}
								</p>
								<p className="text-[11px] text-text-muted">
									{MOCK_CURRENT_USER.city} &bull; {MOCK_CURRENT_USER.vibe}
								</p>
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
						>
							Send Introduction
						</Button>
						<Button
							variant="secondary"
							size="md"
							radius="pill"
							className="w-full"
							onClick={onClose}
						>
							Cancel
						</Button>
					</div>

					{/* Private note */}
					<div className="flex items-center justify-center gap-1.5 text-[11px] text-text-muted">
						<Icon as={LockSvg} size="xs" color="muted" />
						Your intro is private until {member.name} accepts.
					</div>
				</div>
			</div>
		</div>
	)
}

// ─── Member Profile Drawer ────────────────────────────────────────────────────

export function MemberProfileDrawer({
	member,
	onClose,
}: {
	member: DrawerMember | null
	onClose: () => void
}) {
	const [sayHiOpen, setSayHiOpen] = useState(false)

	if (!member) return null

	const role = ROLE_CONFIG[member.role]

	return (
		<>
			{/* Backdrop + drawer container */}
			<div className="fixed inset-0 z-50 flex justify-end">
				<div className="absolute inset-0 bg-black/40" onClick={onClose} />

				{/* Drawer panel — slides in from right */}
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

					<div className="px-6 pb-8 flex flex-col gap-5">
						{/* Avatar + name row */}
						<div className="flex flex-col items-start gap-3">
							{/* Avatar */}
							<div className="relative">
								<div className="relative size-20 rounded-full overflow-hidden border-2 border-surface-hover bg-surface-hover">
									<Image
										src={member.avatarUrl}
										alt={member.name}
										fill
										sizes="80px"
										className="object-cover"
									/>
								</div>
								{member.online && (
									<span className="absolute bottom-1 right-1 size-4 rounded-full bg-green-500 border-2 border-surface-card" />
								)}
							</div>

							{/* Name + verified + dots */}
							<div className="w-full flex items-start justify-between gap-2">
								<div className="flex flex-col gap-1">
									<div className="flex items-center gap-1.5">
										<h2 className="text-body-xl font-bold text-text-primary">
											{member.name}
										</h2>
										{member.isVerified && (
											<Icon as={VerifiedSvg} size="sm" color="brand" />
										)}
									</div>
									<RoleBadge role={member.role} />
									<div className="flex items-center gap-1.5 mt-1 text-label-sm text-text-secondary">
										<Icon as={MapPointSvg} size="xs" color="secondary" />
										{member.city}, India
									</div>
									{member.vibe && (
										<div className="flex items-center gap-1.5 text-label-sm text-text-secondary">
											<Icon as={StarCircleSvg} size="xs" color="secondary" />
											{member.vibe}
										</div>
									)}
								</div>
								{/* TODO: Wire to member options menu (report, block) */}
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
								<p className="text-body-md font-semibold text-text-primary">
									Shared interests
								</p>
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
								<p className="text-body-md font-semibold text-text-primary">
									Shared experiences
								</p>
								<div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
									{member.sharedExperiences.map(exp => (
										<div key={exp.id} className="shrink-0 w-36 flex flex-col gap-1.5">
											<div className="relative h-22 rounded-action overflow-hidden bg-surface-hover">
												<Image
													src={exp.imageUrl}
													alt={exp.title}
													fill
													sizes="144px"
													className="object-cover"
												/>
											</div>
											<p className="text-label-sm font-bold text-text-primary leading-snug">
												{exp.title}
											</p>
											<p className="text-[11px] text-text-muted">{exp.date}</p>
											<span className="self-start text-[11px] font-medium text-violet-600 bg-surface-vibe-soft border border-purple-200 rounded-full px-2.5 py-0.5">
												{exp.status === "going" ? "Going" : "Interested"}
											</span>
										</div>
									))}
									{/* TODO: Link to full shared experiences list */}
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
								<p className="text-body-md font-semibold text-text-primary">
									Community activity
								</p>
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

						{/* Actions */}
						<div className="flex flex-col gap-3">
							<p className="text-body-md font-semibold text-text-primary">Actions</p>
							<div className="flex gap-3">
								{/* TODO: Wire to POST /api/users/[id]/introduction */}
								<Button
									variant="primary"
									size="md"
									radius="pill"
									leftIcon={<Icon as={ChatSvg} size="sm" color="inverse" />}
									className="w-full"
									onClick={() => setSayHiOpen(true)}
								>
									Say Hi
								</Button>
								{/* TODO: Wire to open invite-to-event flow */}
								<Button
									variant="secondary"
									size="md"
									radius="pill"
									leftIcon={<Icon as={CalendarSvg} size="sm" color="primary" />}
									className="w-full"
								>
									Invite to Event
								</Button>
							</div>
						</div>

						{/* Privacy notice */}
						<div className="rounded-action bg-surface-vibe-soft border border-purple-100 p-4 flex flex-col gap-2">
							<div className="flex items-start gap-3">
								<Icon
									as={ShieldCheckSvg}
									size="sm"
									color="vibe"
									className="mt-0.5 shrink-0"
								/>
								<p className="text-label-sm text-text-secondary font-normal leading-snug">
									Only information chosen by the member is shown. You can always report or
									block if something feels off.
								</p>
							</div>
							{/* TODO: Link to /communities/[id]/guidelines once page is built */}
							<button
								type="button"
								className="flex items-center gap-1 text-label-sm text-violet-600 font-semibold hover:underline ml-7"
							>
								Community guidelines
								<Icon as={ArrowRightSvg} size="xs" color="vibe" />
							</button>
						</div>
					</div>
				</aside>
			</div>

			{/* Say Hi modal — stacks on top of drawer */}
			{sayHiOpen && <SayHiModal member={member} onClose={() => setSayHiOpen(false)} />}
		</>
	)
}
