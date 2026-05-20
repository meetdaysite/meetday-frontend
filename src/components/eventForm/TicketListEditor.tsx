"use client"

import { useState, type ReactNode } from "react"
import { Icon } from "@/components/ui/Icon"
import {
	inpCls,
	iconWrapCls,
	taCls,
	FieldLabel,
	ErrMsg,
} from "@/components/eventForm/shared"
import {
	emptyDraftTicket,
	validateDraftTicket,
	draftTicketToTicket,
	ticketToDraft,
	type DraftTicket,
} from "@/lib/eventForm"
import type { Ticket } from "@/types/event"

import CalendarSvg from "@/icons/outlined/calendar.svg"
import AddCircleSvg from "@/icons/outlined/add-circle.svg"
import TrashBinSvg from "@/icons/outlined/trash-bin.svg"

// ─── Single Ticket Form ───────────────────────────────────────────────────────

function TicketForm({
	draft,
	index,
	canDelete,
	showErrors,
	onChange,
	onDelete,
}: {
	draft: DraftTicket
	index: number
	canDelete: boolean
	showErrors: boolean
	onChange: (d: DraftTicket) => void
	onDelete: () => void
}) {
	const errors = showErrors ? validateDraftTicket(draft) : {}

	function set(key: keyof DraftTicket, value: string) {
		onChange({ ...draft, [key]: value })
	}

	return (
		<div className="border border-border-subtle rounded-action bg-surface-card overflow-hidden">
			<div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-border-subtle bg-surface-canvas">
				<div className="flex items-center gap-2.5">
					<div className="size-7 rounded-full bg-surface-inverse text-text-inverse flex items-center justify-center text-caption font-bold shrink-0">
						{String(index + 1).padStart(2, "0")}
					</div>
					<span className="text-label-sm font-semibold text-text-primary">
						{draft.name.trim() || `Ticket ${index + 1}`}
					</span>
				</div>
				{canDelete && (
					<button
						type="button"
						onClick={onDelete}
						aria-label="Remove ticket"
						className="size-8 flex items-center justify-center rounded-action text-text-secondary hover:text-text-danger hover:bg-surface-danger-soft transition-colors"
					>
						<Icon as={TrashBinSvg} size="sm" />
					</button>
				)}
			</div>

			<div className="p-5 flex flex-col gap-4">
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="flex flex-col gap-1.5">
						<FieldLabel required>Ticket Name</FieldLabel>
						<input
							type="text"
							value={draft.name}
							onChange={(e) => set("name", e.target.value)}
							placeholder="e.g. General Admission"
							className={inpCls(!!errors.name)}
						/>
						<ErrMsg msg={errors.name} />
					</div>
					<div className="flex flex-col gap-1.5">
						<FieldLabel required>Price (INR)</FieldLabel>
						<input
							type="number"
							value={draft.price}
							onChange={(e) => set("price", e.target.value)}
							placeholder="₹ 0"
							min={0}
							className={inpCls(!!errors.price)}
						/>
						<ErrMsg msg={errors.price} />
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="flex flex-col gap-1.5">
						<FieldLabel required>Total Capacity</FieldLabel>
						<input
							type="number"
							value={draft.totalCapacity}
							onChange={(e) => set("totalCapacity", e.target.value)}
							placeholder="100"
							min={1}
							className={inpCls(!!errors.totalCapacity)}
						/>
						<ErrMsg msg={errors.totalCapacity} />
					</div>
					<div className="flex flex-col gap-1.5">
						<FieldLabel required>Max Per Person</FieldLabel>
						<input
							type="number"
							value={draft.maxPerPerson}
							onChange={(e) => set("maxPerPerson", e.target.value)}
							placeholder="1"
							min={1}
							className={inpCls(!!errors.maxPerPerson)}
						/>
						<ErrMsg msg={errors.maxPerPerson} />
					</div>
				</div>

				<div className="flex flex-col gap-1.5">
					<FieldLabel hint="Optional">Description</FieldLabel>
					<textarea
						rows={3}
						value={draft.description}
						onChange={(e) => set("description", e.target.value)}
						placeholder="What's included in this tier?"
						className={taCls(false)}
					/>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="flex flex-col gap-1.5">
						<FieldLabel hint="Optional">Sale Start Date</FieldLabel>
						<div className={iconWrapCls(!!errors.saleStartDate)}>
							<Icon as={CalendarSvg} size="sm" color="secondary" />
							<input
								type="date"
								value={draft.saleStartDate}
								onChange={(e) => set("saleStartDate", e.target.value)}
								className="flex-1 bg-transparent text-sm text-text-primary outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute"
							/>
						</div>
						<ErrMsg msg={errors.saleStartDate} />
					</div>
					<div className="flex flex-col gap-1.5">
						<FieldLabel hint="Optional">Sale End Date</FieldLabel>
						<div className={iconWrapCls(!!errors.saleEndDate)}>
							<Icon as={CalendarSvg} size="sm" color="secondary" />
							<input
								type="date"
								value={draft.saleEndDate}
								min={draft.saleStartDate || undefined}
								onChange={(e) => set("saleEndDate", e.target.value)}
								className="flex-1 bg-transparent text-sm text-text-primary outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute"
							/>
						</div>
						<ErrMsg msg={errors.saleEndDate} />
					</div>
				</div>
			</div>
		</div>
	)
}

// ─── TicketListEditor ─────────────────────────────────────────────────────────

export function TicketListEditor({
	tickets,
	onChange,
	listError,
	headerSlot,
}: {
	tickets: Ticket[]
	onChange: (tickets: Ticket[]) => void
	listError?: string
	headerSlot?: ReactNode
}) {
	const [drafts, setDrafts] = useState<DraftTicket[]>(() =>
		tickets.length > 0 ? tickets.map(ticketToDraft) : [{ ...emptyDraftTicket }],
	)

	function sync(next: DraftTicket[]) {
		setDrafts(next)
		onChange(
			next
				.filter((d) => Object.keys(validateDraftTicket(d)).length === 0)
				.map(draftTicketToTicket),
		)
	}

	function updateDraft(index: number, draft: DraftTicket) {
		sync(drafts.map((d, i) => (i === index ? draft : d)))
	}

	function addTicket() {
		sync([...drafts, { ...emptyDraftTicket }])
	}

	function removeTicket(index: number) {
		sync(drafts.filter((_, i) => i !== index))
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-start justify-between gap-4">
				{headerSlot ?? <span />}
				<button
					type="button"
					onClick={addTicket}
					className="flex items-center gap-2 px-4 h-(--size-input-md) bg-surface-inverse text-text-inverse rounded-action text-label-sm font-medium hover:opacity-90 transition-opacity shrink-0"
				>
					<Icon as={AddCircleSvg} size="sm" color="inverse" />
					Add Ticket
				</button>
			</div>

			<div className="flex flex-col gap-4">
				{drafts.map((draft, i) => (
					<TicketForm
						key={i}
						draft={draft}
						index={i}
						canDelete={i > 0}
						showErrors={!!listError}
						onChange={(d) => updateDraft(i, d)}
						onDelete={() => removeTicket(i)}
					/>
				))}
			</div>

			{listError && <p className="text-caption text-text-danger">{listError}</p>}
		</div>
	)
}
