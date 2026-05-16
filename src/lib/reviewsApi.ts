import apiClient from "./axios"
import { getUploadUrl } from "./api"
import type { ReviewHighlight, ReviewPayload } from "@/types/review"

export async function getReviewHighlights(eventId: string): Promise<ReviewHighlight[]> {
	try {
		const { data } = await apiClient.get<{ success: boolean; data: ReviewHighlight[] }>(
			`/reviews/highlights?eventId=${eventId}`,
		)
		return Array.isArray(data.data) && data.data.length > 0 ? data.data : []
	} catch {
		return []
	}
}

export async function submitReview(payload: ReviewPayload): Promise<void> {
	await apiClient.post("/reviews", payload)
}

export async function uploadReviewPhoto(file: File): Promise<string> {
	const { url, key } = await getUploadUrl({
		context: "REVIEW_PHOTO",
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
