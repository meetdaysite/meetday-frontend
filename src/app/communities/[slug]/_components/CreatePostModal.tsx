"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import CloseSvg from "@/icons/outlined/close.svg"
import GalleryWideSvg from "@/icons/outlined/gallery-wide.svg"
import { createCommunityFeedPost, getUploadUrl } from "@/lib/api"
import type { FeedPost } from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import { useAttendeeProfileStore } from "@/store/attendeeProfileStore"
import { avatarColor } from "@/lib/avatarColor"

interface CreatePostModalProps {
	open: boolean
	communityId: string
	onClose: () => void
	onPosted?: (post: FeedPost) => void
}

const MAX_IMAGES = 5
const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp"

async function uploadImageToS3(file: File, communityId: string): Promise<string> {
	const { url, key } = await getUploadUrl({
		context: "COMMUNITY_FEED_MEDIA",
		contentType: "application/octet-stream",
		resourceId: communityId,
	})
	const res = await fetch(url, {
		method: "PUT",
		body: file,
		headers: { "Content-Type": "application/octet-stream" },
	})
	if (!res.ok) throw new Error(`Image upload failed: ${res.status}`)
	return key
}

export function CreatePostModal({ open, communityId, onClose, onPosted }: CreatePostModalProps) {
	const user = useAuthStore(s => s.user)
	const profile = useAttendeeProfileStore(s => s.profile)

	const [content, setContent] = useState("")
	const [imageFiles, setImageFiles] = useState<File[]>([])
	const [imagePreviews, setImagePreviews] = useState<string[]>([])
	const [isSubmitting, setIsSubmitting] = useState(false)

	const fileInputRef = useRef<HTMLInputElement>(null)
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden"
			setTimeout(() => textareaRef.current?.focus(), 50)
		}
		return () => { document.body.style.overflow = "" }
	}, [open])

	useEffect(() => {
		if (!open) {
			setContent("")
			setImageFiles([])
			setImagePreviews([])
			setIsSubmitting(false)
		}
	}, [open])

	// Revoke preview URLs when images change
	useEffect(() => {
		return () => { imagePreviews.forEach(url => URL.revokeObjectURL(url)) }
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [imageFiles])

	const handleFiles = useCallback((files: FileList | null) => {
		if (!files) return
		const incoming = Array.from(files).filter(f => f.type.startsWith("image/"))
		const remaining = MAX_IMAGES - imageFiles.length
		if (remaining <= 0) return
		const toAdd = incoming.slice(0, remaining)
		setImageFiles(prev => [...prev, ...toAdd])
		setImagePreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))])
	}, [imageFiles.length])

	const removeImage = (index: number) => {
		URL.revokeObjectURL(imagePreviews[index])
		setImageFiles(prev => prev.filter((_, i) => i !== index))
		setImagePreviews(prev => prev.filter((_, i) => i !== index))
	}

	const canSubmit = (content.trim().length > 0 || imageFiles.length > 0) && !isSubmitting

	const handleSubmit = async () => {
		if (!canSubmit) return
		setIsSubmitting(true)
		try {
			let mediaKeys: string[] = []
			if (imageFiles.length > 0) {
				mediaKeys = await Promise.all(imageFiles.map(f => uploadImageToS3(f, communityId)))
			}

			const post = await createCommunityFeedPost(communityId, {
				postType: imageFiles.length > 0 ? "PHOTO" : "TEXT",
				category: "GENERAL",
				content: content.trim() || undefined,
				mediaKeys: mediaKeys.length > 0 ? mediaKeys : undefined,
			})

			toast.success("Post shared!")
			onPosted?.(post)
			onClose()
		} catch {
			toast.error("Failed to post. Please try again.")
		} finally {
			setIsSubmitting(false)
		}
	}

	if (!open) return null

	const avatarUrl = profile?.avatarUrl ?? user?.photoURL ?? null
	const firstName = profile?.firstName ?? user?.displayName?.split(" ")[0] ?? ""
	const lastName = profile?.lastName ?? user?.displayName?.split(" ")[1] ?? ""
	const displayName = [firstName, lastName].filter(Boolean).join(" ") || "You"
	const initials = (`${firstName[0] ?? ""}${lastName[0] ?? ""}`).toUpperCase() || "?"
	const color = avatarColor(firstName || "?")

	return (
		<div
			className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm"
			onClick={e => { if (e.target === e.currentTarget && !isSubmitting) onClose() }}
		>
			<div className="bg-surface-card rounded-t-panel sm:rounded-panel border border-border-default shadow-floating w-full sm:max-w-lg flex flex-col">

				{/* Header */}
				<div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-border-default shrink-0">
					<h2 className="text-body-md font-bold text-text-primary">Create Post</h2>
					<button
						type="button"
						onClick={onClose}
						disabled={isSubmitting}
						className="flex items-center justify-center size-8 rounded-full bg-surface-hover hover:bg-surface-page border border-border-default transition-colors disabled:opacity-40"
					>
						<Icon as={CloseSvg} size="md" color="primary" />
					</button>
				</div>

				{/* Body */}
				<div className="flex flex-col gap-4 p-4 overflow-y-auto max-h-[60vh]">

					{/* Author row */}
					<div className="flex items-center gap-3">
						{avatarUrl ? (
							<div className="relative size-10 rounded-full overflow-hidden border border-border-default bg-surface-hover shrink-0">
								<Image src={avatarUrl} alt={displayName} fill sizes="40px" className="object-cover" />
							</div>
						) : (
							<div className={`size-10 rounded-full ${color.bg} border ${color.border} flex items-center justify-center shrink-0`}>
								<span className={`text-label-xs font-bold ${color.text}`}>{initials}</span>
							</div>
						)}
						<span className="text-label-sm font-semibold text-text-primary">{displayName}</span>
					</div>

					{/* Text area */}
					<textarea
						ref={textareaRef}
						value={content}
						onChange={e => setContent(e.target.value)}
						placeholder="What's on your mind?"
						rows={4}
						className="w-full resize-none bg-transparent text-body-sm text-text-primary placeholder:text-text-muted outline-none leading-relaxed"
					/>

					{/* Image previews */}
					{imagePreviews.length > 0 && (
						<div className="grid grid-cols-3 gap-2">
							{imagePreviews.map((src, i) => (
								<div key={i} className="relative aspect-square rounded-action overflow-hidden bg-surface-hover group">
									<Image src={src} alt="" fill sizes="150px" className="object-cover" />
									<button
										type="button"
										onClick={() => removeImage(i)}
										className="absolute top-1 right-1 size-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
									>
										<Icon as={CloseSvg} size="xs" color="inverse" />
									</button>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between gap-3 px-4 pb-4 pt-3 border-t border-border-default shrink-0">
					<div className="flex items-center gap-2">
						<button
							type="button"
							disabled={imageFiles.length >= MAX_IMAGES || isSubmitting}
							onClick={() => fileInputRef.current?.click()}
							className="flex items-center gap-1.5 px-3 py-1.5 rounded-action border border-border-default bg-surface-page hover:bg-surface-hover transition-colors text-label-sm text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed"
						>
							<Icon as={GalleryWideSvg} size="xs" color="secondary" />
							Photo
						</button>
						<input
							ref={fileInputRef}
							type="file"
							accept={ACCEPTED_IMAGE_TYPES}
							multiple
							className="hidden"
							onChange={e => handleFiles(e.target.files)}
						/>
					</div>

					<Button
						variant="primary"
						size="sm"
						radius="pill"
						disabled={!canSubmit}
						onClick={handleSubmit}
					>
						{isSubmitting ? "Posting…" : "Post"}
					</Button>
				</div>
			</div>
		</div>
	)
}
