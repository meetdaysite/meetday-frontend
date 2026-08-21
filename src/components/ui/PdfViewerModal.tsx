"use client"

import { useEffect } from "react"

// In-app PDF viewer — opens in the same tab/context instead of a new browser tab, with an
// explicit download button. Closes on the × button, backdrop click, or Escape.
export function PdfViewerModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === "Escape") onClose()
		}
		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	}, [onClose])

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
			<div className="bg-white rounded-[20px] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden">
				<div className="flex items-center justify-between px-5 py-3 border-b-[3px] border-black shrink-0">
					<p className="font-black text-black truncate">{title}</p>
					<div className="flex items-center gap-2 shrink-0">
						<a
							href={url}
							download
							target="_blank"
							rel="noopener noreferrer"
							className="bg-[#EE2C2C] text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
						>
							Download
						</a>
						<button onClick={onClose} className="text-xl font-black text-black/40 hover:text-black" aria-label="Close">×</button>
					</div>
				</div>
				<iframe src={url} className="flex-1 w-full" title={title} />
			</div>
		</div>
	)
}
