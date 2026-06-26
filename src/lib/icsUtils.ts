interface ICSEventData {
	title: string
	date: string
	startTime: string
	endTime: string
	venueName: string
	fullAddress: string
	description?: string
}

function toICSDate(dateStr: string, timeStr: string): string {
	const [year, month, day] = dateStr.split("-")
	const [hour, minute] = timeStr.split(":")
	return `${year}${month}${day}T${hour}${minute}00`
}

export function generateICSContent(event: ICSEventData): string {
	const dtStart = toICSDate(event.date, event.startTime)
	const dtEnd = toICSDate(event.date, event.endTime)
	const uid = `${dtStart}-meetday@meetday.in`
	const now = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15)

	const lines = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//Meetday//Meetday//EN",
		"BEGIN:VEVENT",
		`UID:${uid}`,
		`DTSTAMP:${now}Z`,
		`DTSTART:${dtStart}`,
		`DTEND:${dtEnd}`,
		`SUMMARY:${event.title}`,
		`LOCATION:${event.venueName}, ${event.fullAddress}`,
		event.description ? `DESCRIPTION:${event.description.replace(/\n/g, "\\n")}` : "",
		"END:VEVENT",
		"END:VCALENDAR",
	].filter(Boolean)

	return lines.join("\r\n")
}

export function downloadICS(filename: string, content: string): void {
	const blob = new Blob([content], { type: "text/calendar;charset=utf-8" })
	const url = URL.createObjectURL(blob)
	const link = document.createElement("a")
	link.href = url
	link.download = filename
	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)
	URL.revokeObjectURL(url)
}
