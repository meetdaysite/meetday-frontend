import { getUploadUrl } from "./api"

export async function uploadEventMedia(
	file: File,
	mediaType: "COVER" | "GALLERY",
): Promise<string> {
	const { url, key } = await getUploadUrl({
		context: "EVENT_MEDIA",
		contentType: file.type,
		mediaType,
	})
	const res = await fetch(url, {
		method: "PUT",
		body: file,
		headers: { "Content-Type": file.type },
	})
	if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
	return key
}

export async function uploadSponsorshipChatImage(file: File, interestId: string): Promise<string> {
	const { url, key } = await getUploadUrl({
		context: "SPONSORSHIP_CHAT_MEDIA",
		contentType: file.type,
		resourceId: interestId,
	})
	const res = await fetch(url, {
		method: "PUT",
		body: file,
		headers: { "Content-Type": file.type },
	})
	if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
	return key
}

export async function uploadMeetdayChatImage(file: File): Promise<string> {
	const { url, key } = await getUploadUrl({
		context: "MEETDAY_CHAT_MEDIA",
		contentType: file.type,
	})
	const res = await fetch(url, {
		method: "PUT",
		body: file,
		headers: { "Content-Type": file.type },
	})
	if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
	return key
}

export function storageUrl(key: string): string {
	if (!key) return ""
	if (key.startsWith("http")) return key
	const base = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || "https://meetday-dev.s3.ap-south-1.amazonaws.com"
	return base ? `${base}/${key}` : ""
}
