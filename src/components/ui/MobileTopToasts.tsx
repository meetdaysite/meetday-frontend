"use client"

import { useToastStore } from "@/store/toastStore"
import clsx from "clsx"

export function MobileTopToasts() {
	const { toasts, removeToast } = useToastStore()

	if (toasts.length === 0) return null

	return (
		<div
			className="fixed top-3 inset-x-3 z-[99999] pointer-events-none flex flex-col items-center gap-2.5 lg:hidden"
			aria-live="polite"
		>
			{toasts.map((t) => {
				const bgColor =
					t.type === "error"
						? "bg-[#FFD2D2]"
						: t.type === "success"
						? "bg-[#D4EDDA]"
						: "bg-[#FFF3CD]"
				const titleColor =
					t.type === "error"
						? "text-[#EE2C2C]"
						: t.type === "success"
						? "text-green-900"
						: "text-amber-900"

				return (
					<div
						key={t.id}
						className={clsx(
							"pointer-events-auto w-full max-w-md border-[3px] border-black rounded-2xl p-3.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black relative flex items-start justify-between gap-3 animate-in slide-in-from-top-3 duration-200 transition-all",
							bgColor
						)}
					>
						<div className="flex-1 min-w-0 pr-1">
							<h4 className={clsx("font-heading font-black text-sm leading-tight", titleColor)}>
								{t.title}
							</h4>
							{t.desc && (
								<p className="text-xs font-semibold text-black/75 mt-0.5 leading-snug break-words">
									{t.desc}
								</p>
							)}
						</div>
						<button
							type="button"
							onClick={() => removeToast(t.id)}
							className="shrink-0 p-1 -mr-1 -mt-1 text-black/60 hover:text-black font-extrabold text-base leading-none touch-manipulation"
							aria-label="Dismiss notification"
						>
							✕
						</button>
					</div>
				)
			})}
		</div>
	)
}
