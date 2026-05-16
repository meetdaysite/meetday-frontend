"use client"

import { TextField } from "@/components/ui/TextField"
import { Icon } from "@/components/ui/Icon"
import UserSvg from "@/icons/outlined/user.svg"
import EmailSvg from "@/icons/outlined/email.svg"
import type { AttendeeSlot } from "@/store/bookingStore"

interface AttendeeFormProps {
	slot: AttendeeSlot
	slotIndex: number
	ticketName: string
	isPrimary: boolean
	onChange: (data: Partial<AttendeeSlot>) => void
}

export function AttendeeForm({ slot, slotIndex, ticketName, isPrimary, onChange }: AttendeeFormProps) {
	return (
		<div className="rounded-card border border-border-subtle bg-surface-card p-5 flex flex-col gap-4">
			{/* Header */}
			<div className="flex items-center gap-2">
				<div className="size-6 rounded-full bg-action-primary flex items-center justify-center shrink-0">
					<span className="text-[11px] font-bold text-white">{slotIndex + 1}</span>
				</div>
				<span className="text-body-md font-bold text-text-primary">
					Attendee {slotIndex + 1}
					{isPrimary && (
						<span className="ml-2 text-label-sm font-medium text-text-brand bg-surface-brand-soft px-1.5 py-0.5 rounded-badge">
							Primary
						</span>
					)}
				</span>
				<span className="ml-auto text-label-sm text-text-muted">{ticketName}</span>
			</div>

			{/* Fields */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<TextField
					label="Full name"
					placeholder="Enter full name"
					value={slot.fullName}
					onChange={(e) => onChange({ fullName: e.target.value })}
					leftIcon={<Icon as={UserSvg} size="sm" color="inherit" />}
					required
				/>
				<TextField
					label="Email address"
					type="email"
					placeholder="Enter email address"
					value={slot.email}
					onChange={(e) => onChange({ email: e.target.value })}
					leftIcon={<Icon as={EmailSvg} size="sm" color="inherit" />}
					required
				/>
			</div>
		</div>
	)
}
