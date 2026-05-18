import { storageUrl } from "@/lib/uploadMedia"
import type { Event, EventDraftPayload, Ticket, RefundPolicy, EventMedia } from "@/types/event"

export type DraftTicket = {
	name: string
	price: string
	totalCapacity: string
	maxPerPerson: string
	description: string
	saleStartDate: string
	saleEndDate: string
}

export const emptyDraftTicket: DraftTicket = {
	name: "", price: "", totalCapacity: "", maxPerPerson: "",
	description: "", saleStartDate: "", saleEndDate: "",
}

export function validateDraftTicket(d: DraftTicket): Record<string, string> {
	const e: Record<string, string> = {}
	if (!d.name.trim()) e.name = "Ticket name is required."
	if (d.price === "") e.price = "Price is required."
	else if (isNaN(Number(d.price)) || Number(d.price) < 0) e.price = "Enter a valid price (0 or above)."
	const cap = Number(d.totalCapacity)
	if (!d.totalCapacity.trim()) e.totalCapacity = "Total capacity is required."
	else if (isNaN(cap) || cap < 1 || !Number.isInteger(cap)) e.totalCapacity = "Enter a whole number of at least 1."
	const maxP = Number(d.maxPerPerson)
	if (!d.maxPerPerson.trim()) e.maxPerPerson = "Max per person is required."
	else if (isNaN(maxP) || maxP < 1 || !Number.isInteger(maxP)) e.maxPerPerson = "Enter a whole number of at least 1."
	else if (!isNaN(cap) && maxP > cap) e.maxPerPerson = "Cannot exceed total capacity."
	if (d.saleEndDate && d.saleStartDate && new Date(d.saleEndDate) < new Date(d.saleStartDate))
		e.saleEndDate = "Sale end date must be on or after start date."
	return e
}

export function draftTicketToTicket(d: DraftTicket): Ticket {
	return {
		name: d.name.trim(),
		price: Number(d.price) || 0,
		totalCapacity: Number(d.totalCapacity),
		maxPerPerson: Number(d.maxPerPerson),
		description: d.description.trim() || undefined,
		saleStartDate: d.saleStartDate ? toISODate(d.saleStartDate) : undefined,
		saleEndDate: d.saleEndDate ? toISODate(d.saleEndDate) : undefined,
	}
}

export function ticketToDraft(t: Ticket): DraftTicket {
	return {
		name: t.name,
		price: String(t.price),
		totalCapacity: String(t.totalCapacity),
		maxPerPerson: String(t.maxPerPerson),
		description: t.description ?? "",
		saleStartDate: toDateInput(t.saleStartDate),
		saleEndDate: toDateInput(t.saleEndDate),
	}
}

export const LANGUAGE_OPTIONS = [
	{ value: "English", label: "English" },
	{ value: "Hindi",   label: "Hindi" },
	{ value: "Bengali", label: "Bengali" },
	{ value: "Tamil",   label: "Tamil" },
	{ value: "Telugu",  label: "Telugu" },
	{ value: "Marathi", label: "Marathi" },
]

export const EVENT_TYPE_OPTIONS = [
	{ value: "In-Person", label: "In-Person" },
	{ value: "Online",    label: "Online" },
	{ value: "Hybrid",    label: "Hybrid" },
]

export const defaultFormData = {
	title: "", desc: "", category: "", eventType: "",
	languages: [] as string[], tags: [] as string[],
	whatToExpect: [] as string[], whoShouldAttend: [] as string[],
	eventDate: "", startTime: "", endTime: "",
	venueName: "", fullAddress: "", city: "",
	latitude: null as number | null, longitude: null as number | null,
	coverUrl: "", coverKey: "",
	gallerySlots: Array(6).fill("") as string[],
	galleryKeys:  Array(6).fill("") as string[],
	galleryTypes: Array(6).fill("") as string[],
	tickets: [] as Ticket[],
	visibility: "", ageRestriction: "", refundType: "",
	cutoffHours: "", refundPercent: "", instructions: "",
}

export type FormData = typeof defaultFormData
export type Errors = Record<string, string>

// ─── Format helpers ───────────────────────────────────────────────────────────

export function to12Hour(time24: string): string {
	if (!time24) return ""
	const [hStr, mStr] = time24.split(":")
	const h = parseInt(hStr, 10)
	const suffix = h >= 12 ? "PM" : "AM"
	const hour12 = h % 12 || 12
	return `${hour12.toString().padStart(2, "0")}:${mStr} ${suffix}`
}

export function from12Hour(time12: string): string {
	if (!time12) return ""
	const m = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
	if (!m) return ""
	let h = parseInt(m[1], 10)
	if (m[3].toUpperCase() === "AM" && h === 12) h = 0
	else if (m[3].toUpperCase() === "PM" && h !== 12) h += 12
	return `${h.toString().padStart(2, "0")}:${m[2]}`
}

export function toISODate(dateStr: string): string {
	if (!dateStr) return ""
	return new Date(`${dateStr}T00:00:00`).toISOString()
}

export function toDateInput(iso?: string): string {
	if (!iso) return ""
	return iso.split("T")[0]
}

// ─── Converters ───────────────────────────────────────────────────────────────

// The API returns pre-signed S3 URLs in media[].url. Strip the query string and
// leading slash to recover the storage key for use in save payloads.
function keyFromMediaItem(m: { key?: string; url?: string }): string {
	if (m.key) return m.key
	if (m.url) {
		try {
			return new URL(m.url).pathname.slice(1)
		} catch {
			return ""
		}
	}
	return ""
}

function displayUrlFromMediaItem(m: { key?: string; url?: string }): string {
	if (m.url) return m.url
	return storageUrl(m.key ?? "")
}

export function eventToFormData(event: Event): FormData {
	const coverMedia = event.media?.find((m) => m.type === "COVER")
	const galleryMedia = (event.media?.filter((m) => m.type !== "COVER") ?? [])
		.slice()
		.sort((a, b) => a.order - b.order)
	const galleryKeys  = Array(6).fill("") as string[]
	const gallerySlots = Array(6).fill("") as string[]
	const galleryTypes = Array(6).fill("") as string[]
	galleryMedia.slice(0, 6).forEach((m, i) => {
		galleryKeys[i]  = keyFromMediaItem(m)
		gallerySlots[i] = displayUrlFromMediaItem(m)
		galleryTypes[i] = m.type
	})
	return {
		title: event.title ?? "",
		desc: event.description ?? "",
		category: event.categoryId ?? "",
		eventType: event.eventType ?? "",
		languages: event.languages ?? [],
		tags: event.tags ?? [],
		whatToExpect: event.whatToExpect ?? [],
		whoShouldAttend: event.whoShouldAttend ?? [],
		eventDate: toDateInput(event.eventDate),
		startTime: from12Hour(event.startTime ?? ""),
		endTime: from12Hour(event.endTime ?? ""),
		venueName: event.venueName ?? "",
		fullAddress: event.fullAddress ?? "",
		city: event.city ?? "",
		latitude: event.latitude ?? null,
		longitude: event.longitude ?? null,
		coverKey: coverMedia ? keyFromMediaItem(coverMedia) : "",
		coverUrl: coverMedia ? displayUrlFromMediaItem(coverMedia) : "",
		gallerySlots,
		galleryKeys,
		galleryTypes,
		tickets: (event.tickets ?? []).map((t) => ({
			id: t.id,
			name: t.name,
			price: t.price,
			totalCapacity: t.totalCapacity,
			maxPerPerson: t.maxPerPerson,
			description: t.description,
			saleStartDate: t.saleStartDate,
			saleEndDate: t.saleEndDate,
		})),
		visibility: event.visibility ?? "",
		ageRestriction: event.ageRestriction ?? "",
		refundType: event.refundPolicy?.type ?? "",
		cutoffHours: event.refundPolicy?.cutoffHours != null ? String(event.refundPolicy.cutoffHours) : "",
		refundPercent: event.refundPolicy?.refundPercent != null ? String(event.refundPolicy.refundPercent) : "",
		instructions: event.specialInstructions ?? "",
	}
}

export function buildPayload(f: FormData): EventDraftPayload {
	const isFree = f.tickets.length === 0 || f.tickets.every((t) => t.price === 0)

	const refundPolicy: RefundPolicy | undefined = f.refundType
		? {
			type: f.refundType as "FULL" | "PARTIAL" | "NO_REFUND",
			cutoffHours: f.cutoffHours ? Number(f.cutoffHours) : undefined,
			refundPercent: f.refundPercent ? Number(f.refundPercent) : undefined,
			refundTo: "ORIGINAL_PAYMENT",
		  }
		: undefined

	const media: EventMedia[] = []
	if (f.coverKey) media.push({ key: f.coverKey, type: "COVER", order: 0 })
	f.galleryKeys.forEach((key, i) => {
		if (key) media.push({ key, type: (f.galleryTypes[i] as "GALLERY" | "VIDEO") || "GALLERY", order: i + 1 })
	})

	return {
		categoryId:          f.category || undefined,
		title:               f.title || undefined,
		description:         f.desc || undefined,
		eventType:           f.eventType || undefined,
		languages:           f.languages.length > 0 ? f.languages : undefined,
		tags:                f.tags.length > 0 ? f.tags : undefined,
		eventDate:           f.eventDate ? toISODate(f.eventDate) : undefined,
		startTime:           f.startTime ? to12Hour(f.startTime) : undefined,
		endTime:             f.endTime ? to12Hour(f.endTime) : undefined,
		venueName:           f.venueName || undefined,
		fullAddress:         f.fullAddress || undefined,
		city:                f.city || undefined,
		latitude:            f.latitude ?? undefined,
		longitude:           f.longitude ?? undefined,
		whatToExpect:        f.whatToExpect.length > 0 ? f.whatToExpect : undefined,
		whoShouldAttend:     f.whoShouldAttend.length > 0 ? f.whoShouldAttend : undefined,
		visibility:          (f.visibility as "PUBLIC" | "PRIVATE") || undefined,
		ageRestriction:      f.ageRestriction || undefined,
		specialInstructions: f.instructions || undefined,
		isFree,
		tickets:             f.tickets.length > 0 ? f.tickets : undefined,
		refundPolicy,
		media:               media.length > 0 ? media : undefined,
	}
}

// ─── Validators ───────────────────────────────────────────────────────────────

function isFutureOrToday(val: string) {
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	return new Date(val) >= today
}

function timeToMinutes(val: string) {
	const [h, m] = val.split(":").map(Number)
	return h * 60 + m
}

export function validateStep1(f: Pick<FormData, "title" | "desc" | "category" | "eventType" | "whatToExpect" | "whoShouldAttend">): Errors {
	const e: Errors = {}
	if (!f.title.trim()) e.title = "Event title is required."
	else if (f.title.trim().length < 3) e.title = "Title must be at least 3 characters."
	if (!f.desc.trim()) e.desc = "Description is required."
	else if (f.desc.trim().length < 20) e.desc = "Description must be at least 20 characters."
	if (!f.category) e.category = "Please select a category."
	if (!f.eventType) e.eventType = "Please select an event type."
	if (f.whatToExpect.length === 0) e.whatToExpect = "Add at least one item for what to expect."
	if (f.whoShouldAttend.length === 0) e.whoShouldAttend = "Add at least one item for who should attend."
	return e
}

export function validateStep2(
	f: Pick<FormData, "eventDate" | "startTime" | "endTime" | "venueName" | "fullAddress">,
	allowPastDate = false,
): Errors {
	const e: Errors = {}
	if (!f.eventDate) e.eventDate = "Event date is required."
	else if (!allowPastDate && !isFutureOrToday(f.eventDate)) e.eventDate = "Date must be today or in the future."
	if (!f.startTime) e.startTime = "Start time is required."
	if (!f.endTime) e.endTime = "End time is required."
	else if (f.startTime && timeToMinutes(f.endTime) <= timeToMinutes(f.startTime))
		e.endTime = "End time must be after start time."
	if (!f.venueName.trim()) e.venueName = "Venue name is required."
	if (!f.fullAddress.trim()) e.fullAddress = "Full address is required."
	return e
}

export function validateStep3(f: { coverKey: string; hasGallery: boolean }): Errors {
	const e: Errors = {}
	if (!f.coverKey) e.coverUrl = "Cover image is required — please upload a file."
	if (!f.hasGallery) e.gallery = "Add at least one gallery image."
	return e
}

export function validateStep4(f: Pick<FormData, "tickets">): Errors {
	const e: Errors = {}
	if (f.tickets.length === 0) e.tickets = "Add at least one ticket type."
	return e
}

export function validateStep5(f: Pick<FormData, "visibility" | "ageRestriction" | "refundType" | "cutoffHours" | "refundPercent" | "instructions">): Errors {
	const e: Errors = {}
	if (!f.visibility) e.visibility = "Please select a visibility option."
	if (!f.ageRestriction) e.ageRestriction = "Please select an age restriction."
	if (!f.refundType) e.refundType = "Please select a refund type."
	if (f.refundType === "PARTIAL") {
		if (!f.cutoffHours.trim()) e.cutoffHours = "Cutoff hours is required."
		else if (isNaN(Number(f.cutoffHours)) || Number(f.cutoffHours) < 0) e.cutoffHours = "Enter a valid number of hours."
		if (!f.refundPercent.trim()) e.refundPercent = "Refund percent is required."
		else if (isNaN(Number(f.refundPercent)) || Number(f.refundPercent) < 0 || Number(f.refundPercent) > 100)
			e.refundPercent = "Enter a value between 0 and 100."
	}
	if (!f.instructions.trim()) e.instructions = "Special instructions are required."
	return e
}

export function validateAll(f: FormData, allowPastDate = false): Errors {
	return {
		...validateStep1(f),
		...validateStep2(f, allowPastDate),
		...validateStep3({ coverKey: f.coverKey, hasGallery: f.galleryKeys.some((k) => k !== "") }),
		...validateStep4({ tickets: f.tickets }),
		...validateStep5(f),
	}
}
