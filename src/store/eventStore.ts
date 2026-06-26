import { create } from "zustand"
import {
	createEventDraft,
	getMyEvents,
	getMyEventDetail,
	updateEventDraft,
	submitEventForReview,
	cancelEvent as cancelEventApi,
	deleteEventDraft as deleteEventDraftApi,
} from "@/lib/api"
import type { Event, EventDraftPayload, ApiEventStatus } from "@/types/event"
import { getApiErrorMessage } from "@/lib/errors"

type EventStore = {
	// ── List state ───────────────────────────────────────────────────────────
	events: Event[]
	eventsTotal: number
	eventsLoading: boolean
	eventsError: string | null

	// ── Current event (detail / create) ──────────────────────────────────────
	currentEvent: Event | null
	currentEventLoading: boolean
	currentEventError: string | null

	// ── Actions ───────────────────────────────────────────────────────────────
	fetchMyEvents(params?: { status?: ApiEventStatus; page?: number; limit?: number }): Promise<void>
	fetchMyEventDetail(id: string): Promise<void>
	createDraft(payload?: EventDraftPayload): Promise<Event>
	updateDraft(id: string, payload: EventDraftPayload): Promise<Event>
	submitForReview(id: string): Promise<void>
	cancelEvent(id: string, reason: string): Promise<void>
	deleteEvent(id: string): Promise<void>
	clearCurrentEvent(): void
}

export const useEventStore = create<EventStore>((set) => ({
	events: [],
	eventsTotal: 0,
	eventsLoading: false,
	eventsError: null,

	currentEvent: null,
	currentEventLoading: false,
	currentEventError: null,

	async fetchMyEvents(params) {
		set({ eventsLoading: true, eventsError: null })
		try {
			const result = await getMyEvents({ limit: 100, ...params })
			set({ events: result.events, eventsTotal: result.total, eventsLoading: false })
		} catch (err) {
			set({ eventsLoading: false, eventsError: getApiErrorMessage(err) })
		}
	},

	async fetchMyEventDetail(id) {
		set({ currentEventLoading: true, currentEventError: null })
		try {
			const event = await getMyEventDetail(id)
			set({ currentEvent: event, currentEventLoading: false })
		} catch (err) {
			set({ currentEventLoading: false, currentEventError: getApiErrorMessage(err) })
		}
	},

	async createDraft(payload = {}) {
		const event = await createEventDraft(payload)
		set({ currentEvent: event })
		return event
	},

	async updateDraft(id, payload) {
		const event = await updateEventDraft(id, payload)
		set({ currentEvent: event })
		return event
	},

	async submitForReview(id) {
		const event = await submitEventForReview(id)
		set((state) => ({
			currentEvent: event,
			events: state.events.map((e) => (e.id === id ? event : e)),
		}))
	},

	async cancelEvent(id, reason) {
		const event = await cancelEventApi(id, reason)
		set((state) => ({
			currentEvent: state.currentEvent?.id === id ? event : state.currentEvent,
			events: state.events.map((e) => (e.id === id ? event : e)),
		}))
	},

	async deleteEvent(id) {
		await deleteEventDraftApi(id)
		set((state) => ({
			events: state.events.filter((e) => e.id !== id),
			eventsTotal: Math.max(0, state.eventsTotal - 1),
		}))
	},

	clearCurrentEvent() {
		set({ currentEvent: null, currentEventError: null })
	},
}))

