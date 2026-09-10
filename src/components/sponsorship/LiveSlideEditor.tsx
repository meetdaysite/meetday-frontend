"use client"

import { useRef, useState } from "react"
import Moveable from "react-moveable"
import { type DeckSlide, type DeckElementStyle, type DeckTheme, type DeckFontVibe } from "@/lib/api"

// ─── Color math — mirrors ProposalPdfGeneratorService's mix/legibleTextColor/contrastOn exactly,
// so the live editor's colors match what the final PDF will actually render. ───────────────────

function hexToRgb(hex: string): [number, number, number] {
	const clean = hex.replace("#", "")
	const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean
	const int = parseInt(full, 16)
	return [(int >> 16) & 255, (int >> 8) & 255, int & 255]
}

function rgbToHex(r: number, g: number, b: number): string {
	return "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")
}

function mix(hex: string, target: [number, number, number], ratio: number): string {
	const [r, g, b] = hexToRgb(hex)
	const [tr, tg, tb] = target
	return rgbToHex(r + (tr - r) * ratio, g + (tg - g) * ratio, b + (tb - b) * ratio)
}

function relativeLuminance(hex: string): number {
	const [r, g, b] = hexToRgb(hex).map((v) => v / 255)
	const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
	return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function legibleTextColor(hex: string, bg: "light" | "dark"): string {
	const lum = relativeLuminance(hex)
	if (bg === "light" && lum > 0.55) return mix(hex, [0, 0, 0], 0.6)
	if (bg === "dark" && lum < 0.45) return mix(hex, [255, 255, 255], 0.6)
	return hex
}

function resolveSlideBg(theme: DeckTheme, layout: DeckSlide["layout"], index: number, total: number): "light" | "dark" {
	if (theme === "LIGHT") return "light"
	if (theme === "DARK") return "dark"
	return layout === "COVER" || layout === "CLOSING_CONTACT" || index === total - 1 ? "dark" : "light"
}

const KICKER_BY_LAYOUT: Partial<Record<DeckSlide["layout"], string>> = {
	STAT_HIGHLIGHT: "BY THE NUMBERS",
	BULLET_LIST: "DELIVERABLES",
	PAST_SPONSORS: "SOCIAL PROOF",
	PRICING_COMPARISON: "PACKAGES & PRICING",
	CLOSING_CONTACT: "LET'S CONNECT",
}
const KICKER_BY_INDEX: Record<number, string> = { 1: "THE EVENT", 2: "ABOUT US", 4: "WHY SPONSOR" }
function kickerFor(layout: DeckSlide["layout"], index: number): string {
	return KICKER_BY_INDEX[index] ?? KICKER_BY_LAYOUT[layout] ?? ""
}

const FONT_STACKS: Record<DeckFontVibe, string> = {
	MODERN_SANS: "sans-serif",
	CLASSIC_SERIF: "serif",
	TECH_GEOMETRIC: "monospace",
	MINIMALIST: "sans-serif",
}

// ─── Editable element wrapper ───────────────────────────────────────────────────────────────────

function transformFor(style: DeckElementStyle | undefined): string {
	return `translate(${style?.x ?? 0}px, ${style?.y ?? 0}px) scale(${style?.scale ?? 1})`
}

type EditableTextProps = {
	slotId: string
	value: string
	placeholder?: string
	onValueChange: (value: string) => void
	style?: DeckElementStyle
	className?: string
	baseStyle?: React.CSSProperties
	selected: boolean
	onSelect: (el: HTMLElement) => void
	multiline?: boolean
	registerRef: (el: HTMLElement | null) => void
}

// A slide element that is simultaneously: (1) directly editable inline — click and type, just
// like Google Slides/PowerPoint, (2) draggable/resizable via the Moveable handles shown when
// selected, and (3) restyleable (font/color) from the side panel.
function EditableText({ value, placeholder, onValueChange, style, className, baseStyle, selected, onSelect, multiline, registerRef }: EditableTextProps) {
	const ref = useRef<HTMLDivElement | null>(null)

	return (
		<div
			ref={(el) => {
				ref.current = el
				registerRef(el)
			}}
			contentEditable
			suppressContentEditableWarning
			onClick={(e) => {
				e.stopPropagation()
				if (ref.current) onSelect(ref.current)
			}}
			onBlur={(e) => onValueChange(e.currentTarget.textContent ?? "")}
			onKeyDown={(e) => {
				if (!multiline && e.key === "Enter") e.preventDefault()
			}}
			data-placeholder={placeholder}
			className={`outline-none cursor-text rounded transition-shadow ${selected ? "ring-2 ring-[#EE2C2C] ring-offset-1" : "hover:ring-1 hover:ring-black/20"} ${className ?? ""} empty:before:content-[attr(data-placeholder)] empty:before:opacity-40`}
			style={{
				transform: transformFor(style),
				fontFamily: style?.fontFamily || undefined,
				fontSize: style?.fontSize ? `${style.fontSize}px` : undefined,
				fontWeight: style?.fontWeight,
				color: style?.color || undefined,
				...baseStyle,
			}}
		>
			{value}
		</div>
	)
}

// ─── Slot model — mirrors ProposalPdfGeneratorService.styleAttr's slot ids exactly ─────────────

export type ImagePreviews = {
	logo?: string | null
	hero?: string | null
	gallery?: (string | null)[]
	sponsorLogos?: (string | null)[]
}

export type LiveSlideEditorProps = {
	slides: DeckSlide[]
	currentIndex: number
	onNavigate: (index: number) => void
	onChangeSlide: (index: number, patch: Partial<DeckSlide>) => void
	theme: DeckTheme
	fontVibe: DeckFontVibe
	primaryColors: string[]
	accentColors: string[]
	images: ImagePreviews
	onReplaceImage: (slotId: string, file: File) => void
}


export function LiveSlideEditor({
	slides,
	currentIndex,
	onNavigate,
	onChangeSlide,
	theme,
	fontVibe,
	primaryColors,
	accentColors,
	images,
	onReplaceImage,
}: LiveSlideEditorProps) {
	const slide = slides[currentIndex]
	const total = slides.length
	const bg = resolveSlideBg(theme, slide.layout, currentIndex, total)
	const rotatingPrimary = primaryColors[currentIndex % primaryColors.length] || "#EE2C2C"
	const rotatingAccent = accentColors[currentIndex % accentColors.length] || "#111111"
	const bgAccent = bg === "dark" ? rotatingAccent : rotatingPrimary
	const bgColor = bg === "dark" ? mix(bgAccent, [0, 0, 0], 0.82) : mix(bgAccent, [255, 255, 255], 0.94)
	const primaryTextColor = legibleTextColor(rotatingPrimary, bg)
	const accentTextColor = legibleTextColor(rotatingAccent, bg)
	const textColor = bg === "dark" ? "#fff" : "#111"
	const fontFamily = FONT_STACKS[fontVibe]
	const kicker = kickerFor(slide.layout, currentIndex)

	const [selected, setSelected] = useState<string | null>(null)
	const [targetEl, setTargetEl] = useState<HTMLElement | null>(null)
	const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null)
	const refs = useRef<Record<string, HTMLElement | null>>({})
	const imageInputRef = useRef<HTMLInputElement>(null)
	const pendingSlotRef = useRef<string | null>(null)
	const [overridePreviews, setOverridePreviews] = useState<Record<string, string>>({})

	function goTo(index: number) {
		setSelected(null)
		setTargetEl(null)
		onNavigate(index)
	}

	const elementStyles = slide.elementStyles ?? {}
	function updateElementStyle(slotId: string, patch: Partial<DeckElementStyle>) {
		onChangeSlide(currentIndex, { elementStyles: { ...elementStyles, [slotId]: { ...elementStyles[slotId], ...patch } } })
	}
	function select(slotId: string, el: HTMLElement) {
		setSelected(slotId)
		setTargetEl(el)
	}
	function clearSelection() {
		setSelected(null)
		setTargetEl(null)
	}
	function pickImage(slotId: string) {
		pendingSlotRef.current = slotId
		imageInputRef.current?.click()
	}

	function textProps(slotId: string, value: string, onValueChange: (v: string) => void, className?: string, baseStyle?: React.CSSProperties, multiline = false) {
		return {
			slotId,
			value,
			onValueChange,
			className,
			baseStyle,
			multiline,
			style: elementStyles[slotId],
			selected: selected === slotId,
			onSelect: (el: HTMLElement) => select(slotId, el),
			registerRef: (el: HTMLElement | null) => {
				refs.current[slotId] = el
			},
		}
	}

	function ImageSlot({ slotId, url, aspect, label }: { slotId: string; url?: string | null; aspect: string; label: string }) {
		return (
			<div
				onClick={(e) => {
					e.stopPropagation()
					pickImage(slotId)
				}}
				className={`relative rounded-2xl border-2 border-dashed overflow-hidden cursor-pointer group ${aspect}`}
				style={{ borderColor: `${rotatingPrimary}55`, backgroundColor: `${rotatingPrimary}15` }}
			>
				{url ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img src={url} alt="" className="w-full h-full object-cover" />
				) : (
					<div className="w-full h-full flex items-center justify-center text-[10px] font-bold uppercase tracking-wider opacity-50">+ {label}</div>
				)}
				<div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
					<span className="text-white text-[10px] font-bold uppercase tracking-wider">Click to replace</span>
				</div>
			</div>
		)
	}

	function renderLayout() {
		switch (slide.layout) {
			case "COVER": {
				const meta = (slide.body ?? "").split(" • ").filter(Boolean)
				const heroUrl = overridePreviews[`${currentIndex}:hero`] ?? images.hero
				return (
					<div className="flex-1 grid grid-cols-2 gap-8 items-center">
						<div className="flex flex-col gap-3">
							<EditableText {...textProps("title", slide.title, (v) => onChangeSlide(currentIndex, { title: v }))} className="text-4xl font-black leading-tight" />
							<EditableText
								{...textProps("subtitle", slide.subtitle ?? "", (v) => onChangeSlide(currentIndex, { subtitle: v }), "text-base font-semibold opacity-80")}
								placeholder="Tagline"
							/>
							{meta.length > 0 && (
								<div className="flex flex-wrap gap-2 mt-2">
									{meta.map((m, i) => (
										<span key={i} className="text-xs font-bold px-3 py-1.5 rounded-full border-2" style={{ borderColor: "currentColor" }}>
											{m}
										</span>
									))}
								</div>
							)}
						</div>
						<ImageSlot slotId="hero" url={heroUrl} aspect="aspect-[4/3]" label="Hero Image" />
					</div>
				)
			}
			case "VALUE_PROP": {
				// Mirrors backend's aboutGalleryUris (assets 1-2, for slide index 2) / whySponsorGalleryUris
				// (assets 3-4, for slide index 4) — the same media asset pool split by fixed slide position.
				const pool = images.gallery ?? []
				const [poolA, poolB] = currentIndex === 4 ? [pool[2], pool[3]] : [pool[0], pool[1]]
				const g0 = overridePreviews[`${currentIndex}:gallery-0`] ?? poolA
				const g1 = overridePreviews[`${currentIndex}:gallery-1`] ?? poolB
				const hasGallery = !!(g0 || g1)
				return (
					<div className={`flex-1 grid ${hasGallery ? "grid-cols-2" : "grid-cols-1"} gap-8 items-center`}>
						<div className="flex flex-col gap-2">
							<span className="text-xs font-black uppercase tracking-widest" style={{ color: accentTextColor }}>
								{kicker}
							</span>
							<EditableText {...textProps("title", slide.title, (v) => onChangeSlide(currentIndex, { title: v }))} className="text-2xl font-black" />
							<div className="w-12 h-1 rounded" style={{ backgroundColor: rotatingAccent }} />
							<EditableText
								{...textProps("body", slide.body ?? "", (v) => onChangeSlide(currentIndex, { body: v }), "text-sm leading-relaxed opacity-90 mt-1", undefined, true)}
								placeholder="Body text"
							/>
						</div>
						{hasGallery && (
							<div className="flex flex-col gap-3">
								<ImageSlot slotId="gallery-0" url={g0} aspect="aspect-video" label="Image 1" />
								<ImageSlot slotId="gallery-1" url={g1} aspect="aspect-video" label="Image 2" />
							</div>
						)}
					</div>
				)
			}
			case "STAT_HIGHLIGHT": {
				return (
					<div className="flex-1 flex flex-col gap-3">
						<span className="text-xs font-black uppercase tracking-widest" style={{ color: accentTextColor }}>
							{kicker}
						</span>
						<EditableText {...textProps("title", slide.title, (v) => onChangeSlide(currentIndex, { title: v }))} className="text-2xl font-black" />
						<div className="w-12 h-1 rounded" style={{ backgroundColor: rotatingAccent }} />
						<EditableText {...textProps("body", slide.body ?? "", (v) => onChangeSlide(currentIndex, { body: v }), "text-sm leading-relaxed opacity-90", undefined, true)} placeholder="Body text" />
						<div className="grid grid-cols-2 gap-3 mt-2">
							{(slide.stats ?? []).map((s, i) => (
								<div key={i} className="rounded-xl p-4" style={{ border: `2px solid ${rotatingPrimary}`, backgroundColor: `${rotatingPrimary}0f` }}>
									<EditableText
										{...textProps(`stat-${i}`, s.value, (v) => {
											const next = [...(slide.stats ?? [])]
											next[i] = { ...next[i], value: v }
											onChangeSlide(currentIndex, { stats: next })
										})}
										className="text-3xl font-black"
										baseStyle={{ color: primaryTextColor }}
									/>
									<p className="text-[11px] font-bold uppercase opacity-60 mt-1">{s.label}</p>
								</div>
							))}
						</div>
					</div>
				)
			}
			case "BULLET_LIST": {
				return (
					<div className="flex-1 flex flex-col gap-3">
						<span className="text-xs font-black uppercase tracking-widest" style={{ color: accentTextColor }}>
							{kicker}
						</span>
						<EditableText {...textProps("title", slide.title, (v) => onChangeSlide(currentIndex, { title: v }))} className="text-2xl font-black" />
						<div className="w-12 h-1 rounded" style={{ backgroundColor: rotatingAccent }} />
						<div className="grid grid-cols-1 gap-2 mt-1">
							{(slide.bullets ?? []).map((b, i) => (
								<EditableText
									key={i}
									{...textProps(`bullet-${i}`, b, (v) => {
										const next = [...(slide.bullets ?? [])]
										next[i] = v
										onChangeSlide(currentIndex, { bullets: next })
									})}
									className="text-sm px-4 py-3 rounded-xl"
									baseStyle={{ backgroundColor: `${rotatingPrimary}0f` }}
								/>
							))}
						</div>
					</div>
				)
			}
			case "PAST_SPONSORS": {
				const sponsors = slide.pastSponsors ?? []
				return (
					<div className="flex-1 flex flex-col gap-3">
						<span className="text-xs font-black uppercase tracking-widest" style={{ color: accentTextColor }}>
							{kicker}
						</span>
						<EditableText {...textProps("title", slide.title, (v) => onChangeSlide(currentIndex, { title: v }))} className="text-2xl font-black" />
						<div className="w-12 h-1 rounded" style={{ backgroundColor: rotatingAccent }} />
						{sponsors.length ? (
							<div className="grid grid-cols-3 gap-3 mt-1">
								{sponsors.map((s, i) => (
									<div key={i} className="rounded-xl p-3 flex flex-col items-center gap-1.5" style={{ border: `2px solid ${rotatingPrimary}`, backgroundColor: `${rotatingPrimary}0f` }}>
										{images.sponsorLogos?.[i] && (
											// eslint-disable-next-line @next/next/no-img-element
											<img src={images.sponsorLogos[i]!} alt="" className="h-8 object-contain" />
										)}
										<EditableText
											{...textProps(`sponsor-${i}`, s.name, (v) => {
												const next = [...sponsors]
												next[i] = { ...next[i], name: v }
												onChangeSlide(currentIndex, { pastSponsors: next })
											})}
											className="text-xs font-bold text-center"
										/>
									</div>
								))}
							</div>
						) : (
							<div className="flex-1 flex items-center justify-center rounded-2xl border-2 border-dashed" style={{ borderColor: `${rotatingPrimary}40` }}>
								<EditableText {...textProps("body", slide.body ?? "", (v) => onChangeSlide(currentIndex, { body: v }), "text-sm italic opacity-60 text-center px-8", undefined, true)} />
							</div>
						)}
					</div>
				)
			}
			case "PRICING_COMPARISON": {
				return (
					<div className="flex-1 flex flex-col gap-3">
						<span className="text-xs font-black uppercase tracking-widest" style={{ color: accentTextColor }}>
							{kicker}
						</span>
						<EditableText {...textProps("title", slide.title, (v) => onChangeSlide(currentIndex, { title: v }))} className="text-2xl font-black" />
						<div className="w-12 h-1 rounded" style={{ backgroundColor: rotatingAccent }} />
						<div className="grid grid-cols-3 gap-3 mt-1">
							{(slide.pricingTiers ?? []).map((t, i) => (
								<div key={i} className="rounded-xl p-4 flex flex-col gap-1" style={{ border: `2px solid ${rotatingPrimary}`, backgroundColor: `${rotatingPrimary}0f` }}>
									<EditableText
										{...textProps(`tier-${i}`, t.name, (v) => {
											const next = [...(slide.pricingTiers ?? [])]
											next[i] = { ...next[i], name: v }
											onChangeSlide(currentIndex, { pricingTiers: next })
										})}
										className="text-xs font-bold opacity-75"
									/>
									<p className="text-xl font-black" style={{ color: primaryTextColor }}>
										{t.price}
									</p>
								</div>
							))}
						</div>
					</div>
				)
			}
			case "CLOSING_CONTACT":
			default: {
				return (
					<div className="flex-1 flex flex-col gap-3 justify-center">
						<span className="text-xs font-black uppercase tracking-widest" style={{ color: accentTextColor }}>
							{kicker}
						</span>
						<EditableText {...textProps("title", slide.title, (v) => onChangeSlide(currentIndex, { title: v }))} className="text-2xl font-black" />
						<div className="w-12 h-1 rounded" style={{ backgroundColor: rotatingAccent }} />
						<EditableText {...textProps("body", slide.body ?? "", (v) => onChangeSlide(currentIndex, { body: v }), "text-sm leading-relaxed opacity-90", undefined, true)} placeholder="Body text" />
					</div>
				)
			}
		}
	}

	const paletteColors = [...new Set([...primaryColors, ...accentColors])]

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
					if (file && pendingSlotRef.current) {
						const key = `${currentIndex}:${pendingSlotRef.current}`
						setOverridePreviews((prev) => ({ ...prev, [key]: URL.createObjectURL(file) }))
						onReplaceImage(pendingSlotRef.current, file)
					}
				}}
			/>

			{/* Slide navigator — Google Slides style */}
			<div className="flex items-center justify-between">
				<button
					type="button"
					onClick={() => goTo(Math.max(0, currentIndex - 1))}
					disabled={currentIndex === 0}
					className="size-8 rounded-full border-2 border-black flex items-center justify-center font-bold disabled:opacity-30"
				>
					‹
				</button>
				<div className="flex items-center gap-1.5">
					{slides.map((_, i) => (
						<button
							key={i}
							type="button"
							onClick={() => goTo(i)}
							className={`size-2 rounded-full transition-all ${i === currentIndex ? "w-5 bg-[#EE2C2C]" : "bg-black/20"}`}
							aria-label={`Go to slide ${i + 1}`}
						/>
					))}
				</div>
				<button
					type="button"
					onClick={() => goTo(Math.min(total - 1, currentIndex + 1))}
					disabled={currentIndex === total - 1}
					className="size-8 rounded-full border-2 border-black flex items-center justify-center font-bold disabled:opacity-30"
				>
					›
				</button>
			</div>
			<p className="text-center text-[10px] font-black uppercase tracking-wider text-black/40">
				Slide {currentIndex + 1} of {total} — {slide.layout.replace(/_/g, " ")}
			</p>

			{/* The live slide canvas */}
			<div
				ref={(el) => setContainerEl(el)}
				onClick={clearSelection}
				className="relative w-full aspect-video rounded-2xl border-2 border-black/20 overflow-hidden p-10 flex flex-col shadow-lg"
				style={{ backgroundColor: bgColor, color: textColor, fontFamily }}
			>
				{renderLayout()}
			</div>

			{targetEl && containerEl && (
				<Moveable
					target={targetEl}
					container={containerEl}
					draggable
					scalable
					throttleDrag={0}
					onDrag={({ target, beforeTranslate }) => {
						const scale = selected ? elementStyles[selected]?.scale ?? 1 : 1
						target.style.transform = `translate(${beforeTranslate[0]}px, ${beforeTranslate[1]}px) scale(${scale})`
					}}
					onDragEnd={({ lastEvent }) => {
						if (lastEvent && selected) updateElementStyle(selected, { x: lastEvent.beforeTranslate[0], y: lastEvent.beforeTranslate[1] })
					}}
					onScale={({ target, drag, scale }) => {
						target.style.transform = `translate(${drag.beforeTranslate[0]}px, ${drag.beforeTranslate[1]}px) scale(${scale[0]})`
					}}
					onScaleEnd={({ lastEvent }) => {
						if (lastEvent && selected) {
							updateElementStyle(selected, { x: lastEvent.drag.beforeTranslate[0], y: lastEvent.drag.beforeTranslate[1], scale: lastEvent.scale[0] })
						}
					}}
				/>
			)}

			{/* Style panel — colors sourced from the deck's own chosen palette, not an arbitrary picker */}
			{selected && (
				<div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-black/10 bg-white">
					<span className="text-[10px] font-black uppercase tracking-wider text-black/40">Color</span>
					<div className="flex items-center gap-1.5">
						{paletteColors.map((c) => (
							<button
								key={c}
								type="button"
								onClick={() => updateElementStyle(selected, { color: c })}
								className="size-6 rounded-full border-2 border-black/10 hover:scale-110 transition-transform"
								style={{ backgroundColor: c }}
								aria-label={`Use color ${c}`}
							/>
						))}
						<button
							type="button"
							onClick={() => updateElementStyle(selected, { color: undefined })}
							className="text-[10px] font-bold text-black/40 hover:text-red-600 ml-1"
						>
							Reset
						</button>
					</div>
					<span className="text-[10px] font-black uppercase tracking-wider text-black/40 ml-2">Size</span>
					<input
						type="range"
						min={10}
						max={72}
						value={elementStyles[selected]?.fontSize ?? 16}
						onChange={(e) => updateElementStyle(selected, { fontSize: Number(e.target.value) })}
						className="w-24"
					/>
					<button
						type="button"
						onClick={() => onChangeSlide(currentIndex, { elementStyles: { ...elementStyles, [selected]: {} } })}
						className="text-[10px] font-bold text-black/40 hover:text-red-600 underline ml-2"
					>
						Reset position &amp; size
					</button>
				</div>
			)}

			<p className="text-[10px] text-black/40 leading-relaxed text-center">
				Click any text to edit it directly. Drag to reposition, drag the corner to resize. Click an image to replace it.
			</p>
		</div>
	)
}
