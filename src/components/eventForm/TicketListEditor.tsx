"use client"

import { useState, useCallback } from "react"
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
import PenSquareSvg from "@/icons/outlined/pen-square.svg"
import TrashBinSvg from "@/icons/outlined/trash-bin.svg"

// ─── Ticket Card ──────────────────────────────────────────────────────────────

function TicketCard({
	ticket,
	index,
	onEdit,
	onDelete,
}: {
	ticket: Ticket
	index: number
	onEdit: () => void
	onDelete: () => void
}) {
	const isFree = ticket.price === 0
	return (
		<div className="flex items-center justify-between gap-3 px-4 py-3 rounded-card border border-border-subtle bg-surface-canvas">
			<div className="flex items-center gap-3 min-w-0">
				<div className="size-7 rounded-full bg-surface-inverse text-text-inverse flex items-center justify-center text-caption font-bold shrink-0">
					{String(index + 1).padStart(2, "0")}
				</div>
				<div className="min-w-0">
					<p className="text-label-sm font-semibold text-text-primary truncate">{ticket.name}</p>
					<p className="text-caption text-text-secondary">
						{isFree ? "Free" : `₹${ticket.price.toLocaleString("en-IN")}`}
						{" · "}
						{ticket.totalCapacity} seats
						{" · "}
						max {ticket.maxPerPerson}/person
					</p>
				</div>
			</div>
			<div className="flex items-center gap-1 shrink-0">
				<button
					type="button"
					onClick={onEdit}
					aria-label="Edit ticket"
					className="size-8 flex items-center justify-center rounded-action text-text-secondary hover:text-text-primary hover:bg-surface-card-muted transition-colors"
				>
					<Icon as={PenSquareSvg} size="sm" />
				</button>
				<button
					type="button"
					onClick={onDelete}
					aria-label="Delete ticket"
					className="size-8 flex items-center justify-center rounded-action text-text-secondary hover:text-text-danger hover:bg-surface-danger-soft transition-colors"
				>
					<Icon as={TrashBinSvg} size="sm" />
				</button>
			</div>
		</div>
	)
}

// ─── Draft Form ───────────────────────────────────────────────────────────────

function DraftForm({
	draft,
	onChange,
	onSave,
	onCancel,
	isEditing,
}: {
	draft: DraftTicket
	onChange: (d: DraftTicket) => void
	onSave: () => void
	onCancel: () => void
	isEditing: boolean
}) {
	const [touched, setTouched] = useState(false)
	const errors = touched ? validateDraftTicket(draft) : {}

	function set(key: keyof DraftTicket, value: string) {
		onChange({ ...draft, [key]: value })
	}

	function handleSave() {
		setTouched(true)
		if (Object.keys(validateDraftTicket(draft)).length === 0) {
			onSave()
		}
	}

	return (
		<div className="border border-border-subtle rounded-card bg-surface-card overflow-hidden">
			<div className="flex items-center gap-3 px-5 py-4 border-b border-border-subtle">
				<p className="text-label-md font-semibold text-text-primary">
					{isEditing ? "Edit Ticket" : "New Ticket"}
				</p>
			</div>
			<div className="p-5 flex flex-col gap-4">
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="flex flex-col gap-1.5">
						<FieldLabel required>Ticket Name</FieldLabel>
						<input
							type="text"
							value={draft.name}
							onChange={(e) => set("name", e.target.value)}
							placeholder="General Admission"
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

				<div className="flex items-center justify-end gap-3 pt-1">
					<button
						type="button"
						onClick={onCancel}
						className="px-4 h-(--size-input-md) text-label-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleSave}
						className="flex items-center gap-2 px-5 h-(--size-input-md) bg-surface-inverse text-text-inverse rounded-action text-label-sm font-medium hover:opacity-90 transition-opacity"
					>
						{isEditing ? "Save Changes" : "Add Ticket"}
					</button>
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
}: {
	tickets: Ticket[]
	onChange: (tickets: Ticket[]) => void
	listError?: string
}) {
	const [draft, setDraft] = useState<DraftTicket | null>(null)
	const [editIndex, setEditIndex] = useState<number | null>(null)

	const openNew = useCallback(() => {
		setDraft({ ...emptyDraftTicket })
		setEditIndex(null)
	}, [])

	const openEdit = useCallback(
		(index: number) => {
			setDraft(ticketToDraft(tickets[index]))
			setEditIndex(index)
		},
		[tickets],
	)

	function handleSave() {
		if (!draft) return
		const ticket = draftTicketToTicket(draft)
		if (editIndex !== null) {
			const updated = tickets.map((t, i) => (i === editIndex ? ticket : t))
			onChange(updated)
		} else {
			onChange([...tickets, ticket])
		}
		setDraft(null)
		setEditIndex(null)
	}

	function handleDelete(index: number) {
		onChange(tickets.filter((_, i) => i !== index))
		if (editIndex === index) {
			setDraft(null)
			setEditIndex(null)
		}
	}

	function handleCancel() {
		setDraft(null)
		setEditIndex(null)
	}

	return (
		<div className="flex flex-col gap-3">
			{tickets.length > 0 && (
				<div className="flex flex-col gap-2">
					{tickets.map((ticket, i) => (
						<TicketCard
							key={i}
							ticket={ticket}
							index={i}
							onEdit={() => openEdit(i)}
							onDelete={() => handleDelete(i)}
						/>
					))}
				</div>
			)}

			{draft !== null ? (
				<DraftForm
					draft={draft}
					onChange={setDraft}
					onSave={handleSave}
					onCancel={handleCancel}
					isEditing={editIndex !== null}
				/>
			) : (
				<button
					type="button"
					onClick={openNew}
					className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-card border border-dashed border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary transition-colors text-label-sm font-medium"
				>
					<Icon as={AddCircleSvg} size="sm" />
					Add {tickets.length > 0 ? "another" : "a"} ticket type
				</button>
			)}

			{listError && <p className="text-caption text-text-danger">{listError}</p>}
		</div>
	)
}
