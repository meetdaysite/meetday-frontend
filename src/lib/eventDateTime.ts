// Handles both 12-hour ("08:00 AM") and 24-hour ("08:00") time strings.
export function parseEventDateTime(eventDate: string, time: string): Date {
	const target = new Date(`${eventDate.slice(0, 10)}T00:00:00`)
	const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
	if (!match) return target

	let hours = parseInt(match[1], 10)
	const minutes = parseInt(match[2], 10)
	const period = match[3]?.toUpperCase()
	if (period === "PM" && hours !== 12) hours += 12
	if (period === "AM" && hours === 12) hours = 0

	target.setHours(hours, minutes, 0, 0)
	return target
}
