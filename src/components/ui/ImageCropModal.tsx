"use client"

import React, { useState, useRef } from "react"

export interface ImageCropModalProps {
	src: string
	fileName: string
	fileType: string
	title?: string
	description?: string
	aspectRatio?: number // default 1 (1:1) for logos, 0.8 (4:5) for posters
	viewportWidth?: number // default 220
	onClose: () => void
	onCrop: (croppedFile: File, previewUrl: string) => void
	onKeepOriginal?: () => void
}

export function ImageCropModal({
	src,
	fileName,
	fileType,
	title = "📐 Fit Image (1:1 Ratio)",
	description = "Drag the image to position it. Use the slider to zoom. The image will be fitted to a 1:1 square ratio.",
	aspectRatio = 1,
	viewportWidth = 220,
	onClose,
	onCrop,
	onKeepOriginal,
}: ImageCropModalProps) {
	const [zoom, setZoom] = useState(1)
	const [offset, setOffset] = useState({ x: 0, y: 0 })
	const [isDragging, setIsDragging] = useState(false)
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
	const imgRef = useRef<HTMLImageElement>(null)

	const viewportHeight = Math.round(viewportWidth / aspectRatio)
	const [imgSize, setImgSize] = useState({ dw: viewportWidth, dh: viewportHeight })

	function handleMouseDown(e: React.MouseEvent) {
		setIsDragging(true)
		setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
	}

	function handleMouseMove(e: React.MouseEvent) {
		if (!isDragging) return
		setOffset({
			x: e.clientX - dragStart.x,
			y: e.clientY - dragStart.y,
		})
	}

	function handleMouseUp() {
		setIsDragging(false)
	}

	function handleTouchStart(e: React.TouchEvent) {
		if (e.touches.length !== 1) return
		setIsDragging(true)
		setDragStart({ x: e.touches[0].clientX - offset.x, y: e.touches[0].clientY - offset.y })
	}

	function handleTouchMove(e: React.TouchEvent) {
		if (!isDragging || e.touches.length !== 1) return
		setOffset({
			x: e.touches[0].clientX - dragStart.x,
			y: e.touches[0].clientY - dragStart.y,
		})
	}

	const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
		const target = e.currentTarget
		const naturalAspect = target.naturalWidth / target.naturalHeight
		let dw = viewportWidth
		let dh = viewportHeight
		if (naturalAspect > aspectRatio) {
			dh = viewportHeight
			dw = viewportHeight * naturalAspect
		} else {
			dw = viewportWidth
			dh = viewportWidth / naturalAspect
		}
		setImgSize({ dw, dh })
	}

	function handleApply() {
		const img = imgRef.current
		if (!img) return

		const canvasWidth = aspectRatio === 1 ? 600 : 800
		const canvasHeight = Math.round(canvasWidth / aspectRatio)

		const canvas = document.createElement("canvas")
		canvas.width = canvasWidth
		canvas.height = canvasHeight
		const ctx = canvas.getContext("2d")
		if (!ctx) return

		ctx.fillStyle = "#ffffff"
		ctx.fillRect(0, 0, canvasWidth, canvasHeight)

		const scaleFactor = canvasWidth / viewportWidth
		ctx.translate(canvasWidth / 2 + offset.x * scaleFactor, canvasHeight / 2 + offset.y * scaleFactor)
		ctx.scale(zoom * scaleFactor, zoom * scaleFactor)

		ctx.drawImage(img, -imgSize.dw / 2, -imgSize.dh / 2, imgSize.dw, imgSize.dh)

		const outputType = fileType || "image/jpeg"
		canvas.toBlob((blob) => {
			if (!blob) return
			const croppedFile = new File([blob], fileName, { type: outputType })
			const previewUrl = URL.createObjectURL(blob)
			onCrop(croppedFile, previewUrl)
		}, outputType, 0.92)
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
			<div className="bg-white rounded-[24px] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full max-w-sm flex flex-col p-6 gap-4">
				<div className="flex items-center justify-between border-b-2 border-black pb-2">
					<h3 className="font-heading font-black text-base text-black">{title}</h3>
					<button type="button" onClick={onClose} className="text-xl font-black text-black/40 hover:text-black">
						×
					</button>
				</div>

				<p className="text-xs text-black/50 font-semibold leading-normal">{description}</p>

				<div
					style={{ width: `${viewportWidth}px`, height: `${viewportHeight}px` }}
					className="rounded-2xl border-[3px] border-black overflow-hidden relative bg-neutral-100 flex items-center justify-center cursor-move select-none mx-auto shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
					onMouseDown={handleMouseDown}
					onMouseMove={handleMouseMove}
					onMouseUp={handleMouseUp}
					onMouseLeave={handleMouseUp}
					onTouchStart={handleTouchStart}
					onTouchMove={handleTouchMove}
					onTouchEnd={handleMouseUp}
				>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						ref={imgRef}
						src={src}
						alt="Source"
						onLoad={onImageLoad}
						draggable={false}
						style={{
							transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
							maxWidth: "none",
							maxHeight: "none",
							width: `${imgSize.dw}px`,
							height: `${imgSize.dh}px`,
						}}
						className="pointer-events-none transition-transform duration-75 origin-center"
					/>
					<div className="absolute inset-0 pointer-events-none border border-black/10 rounded-2xl" />
				</div>

				<div className="flex items-center gap-3">
					<span className="text-xs font-bold text-black/60 shrink-0">Zoom</span>
					<input
						type="range"
						min="0.5"
						max="3"
						step="0.05"
						value={zoom}
						onChange={(e) => setZoom(parseFloat(e.target.value))}
						className="flex-1 accent-black cursor-pointer"
					/>
					<button
						type="button"
						onClick={() => {
							setZoom(1)
							setOffset({ x: 0, y: 0 })
						}}
						className="text-[10px] font-bold text-black/60 underline hover:text-black shrink-0"
					>
						Reset
					</button>
				</div>

				<div className="flex flex-col gap-2 pt-2">
					<button
						type="button"
						onClick={handleApply}
						className="w-full py-2.5 bg-[#FFC940] text-black border-2 border-black rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						Apply &amp; Crop
					</button>
					<div className="flex gap-2">
						{onKeepOriginal && (
							<button
								type="button"
								onClick={onKeepOriginal}
								className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-black border border-black/20 rounded-xl text-xs font-bold transition-colors"
							>
								Use As-Is
							</button>
						)}
						<button
							type="button"
							onClick={onClose}
							className="flex-1 py-2 bg-white hover:bg-slate-50 text-black/60 border border-black/20 rounded-xl text-xs font-bold transition-colors"
						>
							Cancel
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
