"use client"

import { useEffect } from "react"

// Full-screen in-app image viewer — replaces opening images in a new browser tab. Closes on
// the × button, clicking the backdrop, or pressing Escape.
export function ImageLightbox({ url, onClose }: { url: string; onClose: () => void }) {
	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === "Escape") onClose()
		}
		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	}, [onClose])

	return (
		<div
			className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-150"
			onClick={onClose}
		>
			<button
				type="button"
				onClick={onClose}
				aria-label="Close"
				className="absolute top-4 right-4 size-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl font-bold flex items-center justify-center transition-colors"
			>
				×
			</button>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={url}
				alt="Full size"
				onClick={e => e.stopPropagation()}
				className="max-w-full max-h-full object-contain rounded-lg"
			/>
		</div>
	)
}
