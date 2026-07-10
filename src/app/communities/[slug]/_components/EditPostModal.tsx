"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import CloseSvg from "@/icons/outlined/close.svg"
import { updateCommunityFeedPost } from "@/lib/api"
import type { FeedPost, FeedPostCategory, UpdateFeedPostPayload } from "@/lib/api"
import { getApiErrorMessage } from "@/lib/errors"

const CATEGORIES: { value: FeedPostCategory; label: string }[] = [
	{ value: "GENERAL", label: "General" },
	{ value: "MEMORIES", label: "Memories" },
	{ value: "RECOMMENDATION", label: "Recommendation" },
	{ value: "QUESTION", label: "Question" },
]

interface EditPostModalProps {
	post: FeedPost
	communityId: string
	onClose: () => void
	onSaved: (updated: FeedPost) => void
}

export function EditPostModal({ post, communityId, onClose, onSaved }: EditPostModalProps) {
	const [content, setContent] = useState(post.content ?? "")
	const [category, setCategory] = useState<FeedPostCategory>(post.category)
	const [topic, setTopic] = useState(post.topic ?? "")
	const [saving, setSaving] = useState(false)
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	useEffect(() => {
		setTimeout(() => textareaRef.current?.focus(), 100)
	}, [])

	useEffect(() => {
		const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
		document.addEventListener("keydown", handler)
		return () => document.removeEventListener("keydown", handler)
	}, [onClose])

	const isDirty =
		content !== (post.content ?? "") ||
		category !== post.category ||
		topic !== (post.topic ?? "")

	const handleSave = async () => {
		if (!isDirty || saving) return
		setSaving(true)
		try {
			const payload: UpdateFeedPostPayload = {}
			if (content !== (post.content ?? "")) payload.content = content.trim() || undefined
			if (category !== post.category) payload.category = category
			if (topic !== (post.topic ?? "")) payload.topic = topic.trim() || undefined
			const updated = await updateCommunityFeedPost(communityId, post.id, payload)
			toast.success("Post updated.")
			onSaved(updated)
			onClose()
		} catch (err) {
			toast.error(getApiErrorMessage(err))
		} finally {
			setSaving(false)
		}
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
			onClick={e => { if (e.target === e.currentTarget) onClose() }}
		>
			<div className="w-full max-w-lg flex flex-col bg-surface-card rounded-action border border-border-default shadow-floating overflow-hidden">
				{/* Header */}
				<div className="flex items-center justify-between px-5 py-4 border-b border-border-default shrink-0">
					<h2 className="text-label-md font-semibold text-text-primary">Edit post</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 rounded-action text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
					>
						<Icon as={CloseSvg} size="sm" color="inherit" />
					</button>
				</div>

				{/* Body */}
				<div className="px-5 py-4 flex flex-col gap-4">
					{/* Content */}
					<div className="flex flex-col gap-1.5">
						<label className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">
							Content
						</label>
						<textarea
							ref={textareaRef}
							value={content}
							onChange={e => setContent(e.target.value)}
							rows={5}
							placeholder="What's on your mind?"
							className="w-full resize-none rounded-action border border-border-default bg-surface-page px-3 py-2.5 text-label-sm text-text-primary placeholder:text-text-muted outline-none focus:border-border-focus transition-colors"
						/>
					</div>

					{/* Category */}
					{post.postType !== "POLL" && (
						<div className="flex flex-col gap-1.5">
							<label className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">
								Category
							</label>
							<div className="flex flex-wrap gap-2">
								{CATEGORIES.map(c => (
									<button
										key={c.value}
										type="button"
										onClick={() => setCategory(c.value)}
										className={`px-3 py-1.5 rounded-avatar text-label-sm font-medium border transition-colors ${
											category === c.value
												? "bg-surface-brand-soft text-text-brand border-border-focus"
												: "bg-surface-page text-text-secondary border-border-default hover:border-border-focus"
										}`}
									>
										{c.label}
									</button>
								))}
							</div>
						</div>
					)}

					{/* Topic */}
					<div className="flex flex-col gap-1.5">
						<label className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">
							Topic <span className="font-normal normal-case text-text-muted">(optional)</span>
						</label>
						<input
							type="text"
							value={topic}
							onChange={e => setTopic(e.target.value)}
							placeholder="e.g. Saturday Meetup"
							maxLength={60}
							className="rounded-action border border-border-default bg-surface-page px-3 py-2.5 text-label-sm text-text-primary placeholder:text-text-muted outline-none focus:border-border-focus transition-colors"
						/>
					</div>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border-default">
					<Button variant="secondary" size="sm" radius="md" onClick={onClose} disabled={saving}>
						Cancel
					</Button>
					<Button
						variant="primary"
						size="sm"
						radius="md"
						onClick={handleSave}
						disabled={!isDirty || saving}
					>
						{saving ? "Saving…" : "Save changes"}
					</Button>
				</div>
			</div>
		</div>
	)
}
