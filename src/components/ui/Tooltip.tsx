"use client"

import { useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"

interface TooltipProps {
	content: ReactNode
	children: ReactNode
	disabled?: boolean
}

// Hover/focus tooltip portaled to <body> so an ancestor `overflow-hidden`
// (card, chip, etc.) can't clip it — flips above the trigger when there
// isn't room below, and clamps horizontally within the viewport.
//
// The trigger is measured off a plain <div> wrapper. An earlier version used
// `display: contents` to stay layout-neutral, but elements with `display:
// contents` generate no box, so `getBoundingClientRect()` on it collapses to
// 0x0 and the tooltip anchors to the viewport corner instead of the trigger.
export function Tooltip({ content, children, disabled = false }: TooltipProps) {
	const [open, setOpen] = useState(false)
	const [pos, setPos] = useState({ top: 0, left: 0 })
	const triggerRef = useRef<HTMLDivElement>(null)
	const tooltipRef = useRef<HTMLDivElement>(null)

	useLayoutEffect(() => {
		if (!open) return

		function updatePosition() {
			const rect = triggerRef.current?.getBoundingClientRect()
			if (!rect) return
			const tooltipWidth = tooltipRef.current?.offsetWidth ?? 200
			const tooltipHeight = tooltipRef.current?.offsetHeight ?? 40
			const margin = 8

			const top =
				rect.top > tooltipHeight + margin
					? rect.top - tooltipHeight - 6
					: rect.bottom + 6

			const left = Math.min(
				Math.max(margin, rect.left + rect.width / 2 - tooltipWidth / 2),
				window.innerWidth - tooltipWidth - margin,
			)

			setPos({ top, left })
		}

		updatePosition()
		window.addEventListener("scroll", updatePosition, true)
		window.addEventListener("resize", updatePosition)
		return () => {
			window.removeEventListener("scroll", updatePosition, true)
			window.removeEventListener("resize", updatePosition)
		}
	}, [open])

	if (disabled) return <>{children}</>

	return (
		<>
			<div
				ref={triggerRef}
				onMouseEnter={() => setOpen(true)}
				onMouseLeave={() => setOpen(false)}
				onFocus={() => setOpen(true)}
				onBlur={() => setOpen(false)}
			>
				{children}
			</div>
			{open && typeof document !== "undefined" && createPortal(
				<div
					ref={tooltipRef}
					role="tooltip"
					style={{
						top: pos.top,
						left: pos.left,
						background: "rgba(15,15,20,0.93)",
						backdropFilter: "blur(6px)",
					}}
					className="fixed z-50 max-w-70 px-2.5 py-1.5 rounded-chip text-label-sm text-text-inverse shadow-floating pointer-events-none"
				>
					{content}
				</div>,
				document.body,
			)}
		</>
	)
}
