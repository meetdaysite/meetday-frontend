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

export function storageUrl(key: string): string {
	if (!key) return ""
	if (key.startsWith("http")) return key
	const base = process.env.NEXT_PUBLIC_STORAGE_BASE_URL
	return base ? `${base}/${key}` : ""
}
