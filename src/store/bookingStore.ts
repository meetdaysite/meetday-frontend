"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { OrderDetail } from "@/types/order"

export interface AttendeeSlot {
	fullName: string
	email: string
	phone?: string
	gender?: string
	city?: string
}

type BookingStore = {
	eventId: string | null
	quantities: Record<string, number>
	promoCode: string
	promoApplied: boolean
	promoDiscount: number
	promoError: string | null
	attendeesByTicket: Record<string, AttendeeSlot[]>
	agreedToTerms: boolean
	pendingOrderId: string | null
	confirmedOrder: OrderDetail | null

	setEventId: (id: string) => void
	setQuantity: (ticketId: string, qty: number) => void
	setPromoCode: (code: string) => void
	setPromoApplied: (discount: number) => void
	setPromoError: (error: string | null) => void
	clearPromo: () => void
	setAttendeeSlot: (ticketId: string, slotIndex: number, data: AttendeeSlot) => void
	initAttendeeSlots: (ticketId: string, qty: number) => void
	setAgreedToTerms: (v: boolean) => void
	setPendingOrderId: (id: string) => void
	setConfirmedOrder: (order: OrderDetail) => void
	reset: () => void
}

const initialState = {
	eventId: null,
	quantities: {},
	promoCode: "",
	promoApplied: false,
	promoDiscount: 0,
	promoError: null,
	attendeesByTicket: {},
	agreedToTerms: false,
	pendingOrderId: null,
	confirmedOrder: null,
}

export const useBookingStore = create<BookingStore>()(
	persist(
		(set, get) => ({
			...initialState,

			setEventId: (eventId) => set({ eventId }),

			setQuantity: (ticketId, qty) =>
				set((s) => ({ quantities: { ...s.quantities, [ticketId]: qty } })),

			setPromoCode: (promoCode) => set({ promoCode }),

			setPromoApplied: (discount) =>
				set({ promoApplied: true, promoDiscount: discount, promoError: null }),

			setPromoError: (promoError) =>
				set({ promoError, promoApplied: false, promoDiscount: 0 }),

			clearPromo: () =>
				set({ promoCode: "", promoApplied: false, promoDiscount: 0, promoError: null }),

			setAttendeeSlot: (ticketId, slotIndex, data) =>
				set((s) => {
					const existing = s.attendeesByTicket[ticketId] ?? []
					const updated = [...existing]
					updated[slotIndex] = data
					return { attendeesByTicket: { ...s.attendeesByTicket, [ticketId]: updated } }
				}),

			initAttendeeSlots: (ticketId, qty) => {
				const existing = get().attendeesByTicket[ticketId] ?? []
				const slots: AttendeeSlot[] = Array.from({ length: qty }, (_, i) => ({
					fullName: existing[i]?.fullName ?? "",
					email: existing[i]?.email ?? "",
					phone: existing[i]?.phone ?? "",
					gender: existing[i]?.gender ?? "",
					city: existing[i]?.city ?? "",
				}))
				set((s) => ({ attendeesByTicket: { ...s.attendeesByTicket, [ticketId]: slots } }))
			},

			setAgreedToTerms: (agreedToTerms) => set({ agreedToTerms }),

			setPendingOrderId: (pendingOrderId) => set({ pendingOrderId }),

			setConfirmedOrder: (confirmedOrder) => set({ confirmedOrder }),

			reset: () => set(initialState),
		}),
		{
			name: "meetday-booking",
			storage: createJSONStorage(() => sessionStorage),
		},
	),
)
