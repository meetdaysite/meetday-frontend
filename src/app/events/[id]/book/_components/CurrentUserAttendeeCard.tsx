"use client"

import { TextField } from "@/components/ui/TextField"
import { Icon } from "@/components/ui/Icon"
import UserSvg from "@/icons/outlined/user.svg"
import EmailSvg from "@/icons/outlined/email.svg"

interface CurrentUserAttendeeCardProps {
	fullName: string
	email: string
	ticketName: string
}

export function CurrentUserAttendeeCard({ fullName, email, ticketName }: CurrentUserAttendeeCardProps) {
	return (
		<div className="rounded-action border border-border-default border-l-4 border-l-border-focus bg-surface-card p-5 flex flex-col gap-4 shadow-md">
			{/* Header */}
			<div className="flex items-center gap-2">
				<div className="size-6 rounded-full bg-action-primary flex items-center justify-center shrink-0">
					<span className="text-[11px] font-bold text-white">1</span>
				</div>
				<span className="text-body-md font-bold text-text-primary">
					Attendee 1
				</span>
				<span className="px-2 py-1 rounded-md text-caption font-semibold bg-surface-info-soft text-text-info border border-blue-200">
					You
				</span>
				<span className="ml-auto text-label-sm text-text-muted">{ticketName}</span>
			</div>

			{/* Fields */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<TextField
					label="Full name"
					value={fullName}
					leftIcon={<Icon as={UserSvg} size="sm" color="inherit" />}
					disabled
				/>
				<TextField
					label="Email address"
					type="email"
					value={email}
					leftIcon={<Icon as={EmailSvg} size="sm" color="inherit" />}
					disabled
				/>
			</div>
		</div>
	)
}
