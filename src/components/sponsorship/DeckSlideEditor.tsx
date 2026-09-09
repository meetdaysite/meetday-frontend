"use client"

import { useEffect, useRef, useState } from "react"
import Moveable from "react-moveable"
import { toast } from "@/lib/toast"
import { getUploadUrl, type DeckSlide, type DeckElementStyle } from "@/lib/api"

type Slot = { id: string; label: string; kind: "text" | "image" }

// Mirrors ProposalPdfGeneratorService.kickerFor/renderSlide's slot ids exactly — every id used
// here must match a `styleAttr(slide, id)` call in the backend renderer, or the override is
// silently ignored at render time.
function slotsFor(slide: DeckSlide): Slot[] {
	const slots: Slot[] = []
	const hasKicker = slide.layout !== "COVER"
	if (hasKicker) slots.push({ id: "kicker", label: "Section Label", kind: "text" })
	slots.push({ id: "title", label: "Title", kind: "text" })
	if (slide.layout === "COVER" && slide.subtitle) slots.push({ id: "subtitle", label: "Subtitle", kind: "text" })
	slots.push({ id: "body", label: slide.layout === "COVER" ? "Content Block" : "Body Text", kind: "text" })

	if (slide.layout === "COVER") {
		slots.push({ id: "hero", label: "Hero Image", kind: "image" })
	} else if (slide.layout === "VALUE_PROP") {
		slots.push({ id: "gallery-0", label: "Image 1", kind: "image" })
		slots.push({ id: "gallery-1", label: "Image 2", kind: "image" })
	} else if (slide.layout === "STAT_HIGHLIGHT") {
		;(slide.stats ?? []).forEach((_, i) => slots.push({ id: `stat-${i}`, label: `Stat Card ${i + 1}`, kind: "text" }))
	} else if (slide.layout === "BULLET_LIST") {
		;(slide.bullets ?? []).forEach((_, i) => slots.push({ id: `bullet-${i}`, label: `Bullet ${i + 1}`, kind: "text" }))
	} else if (slide.layout === "PAST_SPONSORS") {
		;(slide.pastSponsors ?? []).forEach((_, i) => slots.push({ id: `sponsor-${i}`, label: `Sponsor ${i + 1}`, kind: "text" }))
	} else if (slide.layout === "PRICING_COMPARISON") {
		;(slide.pricingTiers ?? []).forEach((_, i) => slots.push({ id: `tier-${i}`, label: `Tier ${i + 1}`, kind: "text" }))
	}

	return slots
}

const FONT_CHOICES = [
	{ value: "", label: "Deck default" },
	{ value: "sans-serif", label: "Sans-serif" },
	{ value: "serif", label: "Serif" },
	{ value: "monospace", label: "Monospace" },
]

function transformFor(style: DeckElementStyle | undefined): string {
	const x = style?.x ?? 0
	const y = style?.y ?? 0
	const scale = style?.scale ?? 1
	return `translate(${x}px, ${y}px) scale(${scale})`
}

async function uploadImageAndGetKey(file: File): Promise<string> {
	const { url, key } = await getUploadUrl({ context: "SPONSORSHIP_MEDIA", contentType: file.type })
	await fetch(url, { method: "PUT", headers: { "Content-Type": file.type }, body: file })
	return key
}

export type DeckSlideEditorProps = {
	slide: DeckSlide
	onChange: (updates: Partial<DeckSlide>) => void
}

// Interactive "customize layout" canvas for a single slide — lets the host drag/resize each
// text element and replace slide images after seeing the AI-generated content, without needing
// a full freeform canvas rewrite of the underlying fixed-template renderer. Position/size/font
// overrides are written into slide.elementStyles, keyed by the same slot ids the backend PDF
// renderer already understands (see ProposalPdfGeneratorService.styleAttr).
export function DeckSlideEditor({ slide, onChange }: DeckSlideEditorProps) {
	const [selected, setSelected] = useState<string | null>(null)
	const [targetEl, setTargetEl] = useState<HTMLElement | null>(null)
	const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null)
	const refs = useRef<Record<string, HTMLElement | null>>({})
	const imageInputRef = useRef<HTMLInputElement>(null)
	const [pendingImageSlot, setPendingImageSlot] = useState<string | null>(null)

	const slots = slotsFor(slide)
	const isDark = slide.layout === "COVER" || slide.layout === "CLOSING_CONTACT"
	const elementStyles = slide.elementStyles ?? {}

	useEffect(() => {
		// Deselect if the slide content changed enough that the selected slot no longer exists
		// (e.g. a stat/bullet was removed elsewhere in the plain-text editor).
		if (selected && !slots.some((s) => s.id === selected)) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setSelected(null)
			setTargetEl(null)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [slide])

	function updateElementStyle(slotId: string, patch: Partial<DeckElementStyle>) {
		onChange({ elementStyles: { ...elementStyles, [slotId]: { ...elementStyles[slotId], ...patch } } })
	}

	function resetElementStyle(slotId: string) {
		const next = { ...elementStyles }
		delete next[slotId]
		onChange({ elementStyles: next })
	}

	async function handleImagePick(file: File) {
		if (!pendingImageSlot) return
		try {
			const key = await uploadImageAndGetKey(file)
			onChange({ imageOverrides: { ...(slide.imageOverrides ?? {}), [pendingImageSlot]: key } })
			toast.success("Image replaced")
		} catch {
			toast.error("Failed to upload image")
		} finally {
			setPendingImageSlot(null)
		}
	}

	const selectedSlot = slots.find((s) => s.id === selected)
	const selectedStyle = selected ? elementStyles[selected] : undefined

	return (
		<div className="flex flex-col gap-3">
			<input
				ref={imageInputRef}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={(e) => {
					const file = e.target.files?.[0]
					e.target.value = ""
					if (file) handleImagePick(file)
				}}
			/>

			<div className="flex flex-col sm:flex-row gap-3">
				<div
					ref={(el) => {
						setContainerEl(el)
					}}
					className={`relative shrink-0 w-full sm:w-[420px] aspect-video rounded-xl border-2 border-black/15 overflow-hidden p-5 flex flex-col gap-2 ${isDark ? "bg-neutral-900 text-white" : "bg-slate-50 text-black"}`}
					onClick={() => {
						setSelected(null)
						setTargetEl(null)
					}}
				>
					{slots.map((slot) => {
						const style = elementStyles[slot.id]
						const isSelected = selected === slot.id
						const isImage = slot.kind === "image"
						const overrideKey = slide.imageOverrides?.[slot.id]
						return (
							<div
								key={slot.id}
								ref={(el) => {
									refs.current[slot.id] = el
								}}
								onClick={(e) => {
									e.stopPropagation()
									if (isImage) {
										setPendingImageSlot(slot.id)
										imageInputRef.current?.click()
									} else {
										setSelected(slot.id)
										setTargetEl(refs.current[slot.id])
									}
								}}
								className={`cursor-pointer rounded-md border transition-colors ${
									isSelected ? "border-[#EE2C2C] ring-2 ring-[#EE2C2C]/30" : "border-transparent hover:border-black/20"
								} ${isImage ? "flex items-center justify-center bg-black/5 min-h-[48px] text-[10px] font-bold uppercase tracking-wider" : "text-xs font-semibold px-2 py-1"}`}
								style={{
									transform: transformFor(style),
									fontFamily: style?.fontFamily || undefined,
									fontSize: style?.fontSize ? `${style.fontSize}px` : undefined,
									fontWeight: style?.fontWeight,
									color: style?.color || undefined,
								}}
							>
								{isImage ? (overrideKey ? "Image selected — click to replace" : `+ ${slot.label}`) : slot.label}
							</div>
						)
					})}

					{selected && targetEl && (
						<Moveable
							target={targetEl}
							container={containerEl}
							draggable
							scalable
							throttleDrag={0}
							onDrag={({ target, beforeTranslate }) => {
								const scale = elementStyles[selected].scale ?? 1
								target.style.transform = `translate(${beforeTranslate[0]}px, ${beforeTranslate[1]}px) scale(${scale})`
							}}
							onDragEnd={({ lastEvent }) => {
								if (lastEvent) updateElementStyle(selected, { x: lastEvent.beforeTranslate[0], y: lastEvent.beforeTranslate[1] })
							}}
							onScale={({ target, drag, scale }) => {
								target.style.transform = `translate(${drag.beforeTranslate[0]}px, ${drag.beforeTranslate[1]}px) scale(${scale[0]})`
							}}
							onScaleEnd={({ lastEvent }) => {
								if (lastEvent) {
									updateElementStyle(selected, {
										x: lastEvent.drag.beforeTranslate[0],
										y: lastEvent.drag.beforeTranslate[1],
										scale: lastEvent.scale[0],
									})
								}
							}}
						/>
					)}
				</div>

				<div className="flex-1 min-w-0 flex flex-col gap-2">
					<p className="text-[10px] font-black uppercase tracking-wider text-black/40">
						{selectedSlot ? `Editing: ${selectedSlot.label}` : "Click an element to drag, resize, or restyle it"}
					</p>
					{selectedSlot && (
						<div className="flex flex-col gap-2 p-3 rounded-xl border border-black/10 bg-white">
							<div className="grid grid-cols-2 gap-2">
								<label className="flex flex-col gap-1">
									<span className="text-[10px] font-bold text-black/50">Font size (px)</span>
									<input
										type="number"
										min={10}
										max={140}
										value={selectedStyle?.fontSize ?? ""}
										placeholder="Default"
										onChange={(e) => updateElementStyle(selected!, { fontSize: e.target.value ? Number(e.target.value) : undefined })}
										className="h-8 px-2 rounded-lg border border-black/15 text-xs"
									/>
								</label>
								<label className="flex flex-col gap-1">
									<span className="text-[10px] font-bold text-black/50">Font family</span>
									<select
										value={selectedStyle?.fontFamily ?? ""}
										onChange={(e) => updateElementStyle(selected!, { fontFamily: e.target.value || undefined })}
										className="h-8 px-2 rounded-lg border border-black/15 text-xs bg-white"
									>
										{FONT_CHOICES.map((f) => (
											<option key={f.value} value={f.value}>
												{f.label}
											</option>
										))}
									</select>
								</label>
								<label className="flex flex-col gap-1">
									<span className="text-[10px] font-bold text-black/50">Color</span>
									<input
										type="color"
										value={selectedStyle?.color ?? "#111111"}
										onChange={(e) => updateElementStyle(selected!, { color: e.target.value })}
										className="h-8 w-full rounded-lg border border-black/15"
									/>
								</label>
								<label className="flex flex-col gap-1">
									<span className="text-[10px] font-bold text-black/50">Bold</span>
									<button
										type="button"
										onClick={() => updateElementStyle(selected!, { fontWeight: selectedStyle?.fontWeight === 900 ? undefined : 900 })}
										className={`h-8 rounded-lg border text-xs font-bold ${selectedStyle?.fontWeight === 900 ? "bg-black text-white border-black" : "border-black/15"}`}
									>
										Bold
									</button>
								</label>
							</div>
							<button
								type="button"
								onClick={() => resetElementStyle(selected!)}
								className="self-start text-[10px] font-bold text-black/50 hover:text-red-600 underline"
							>
								Reset position &amp; style
							</button>
						</div>
					)}
					<p className="text-[10px] text-black/40 leading-relaxed">
						Drag any highlighted box to reposition it, drag its corner to resize. Click an image slot to replace it. Changes apply to the final PDF.
					</p>
				</div>
			</div>
		</div>
	)
}
