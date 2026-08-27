import React from "react"
import clsx from "clsx"

export function SystemMessageBubble({ content }: { content: string }) {
	const lower = content.toLowerCase()

	// 1. Report Approved / Deal Closed (Check first so "report approved" isn't shadowed by generic "approved")
	if (
		lower.includes("report approved") ||
		lower.includes("deliverables approved") ||
		lower.includes("deal is closed") ||
		lower.includes("closed")
	) {
		return (
			<div className="self-center max-w-[95%] sm:max-w-[85%] my-2 px-4 py-2.5 rounded-2xl bg-[#ECFDF5] border-2 border-black text-[#065F46] shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2.5 text-xs sm:text-sm font-semibold transition-all">
				<div className="size-6 rounded-full bg-[#10B981] border-2 border-black text-white flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
					<svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
						<polyline points="20 6 9 17 4 12" />
					</svg>
				</div>
				<span className="leading-snug">
					🎉 <strong className="font-black text-black">Report approved</strong>, the <strong className="font-black text-black">deal is closed</strong>!
				</span>
			</div>
		)
	}

	// 2. Deal Locked / Approved
	if (
		lower.includes("locked") ||
		lower.includes("deal confirmed") ||
		lower.includes("deal approved") ||
		lower.includes("approved")
	) {
		return (
			<div className="self-center max-w-[95%] sm:max-w-[85%] my-2 px-4 py-2.5 rounded-2xl bg-[#ECFDF5] border-2 border-black text-[#065F46] shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2.5 text-xs sm:text-sm font-semibold transition-all">
				<div className="size-6 rounded-full bg-[#10B981] border-2 border-black text-white flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
					<svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
						<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
						<path d="M7 11V7a5 5 0 0 1 10 0v4" />
					</svg>
				</div>
				<span className="leading-snug">
					🔒 The <strong className="font-black text-black">deal is officially locked</strong> and confirmed!
				</span>
			</div>
		)
	}

	// 3. Deal Proposal Created / Shared
	if (
		lower.includes("created") ||
		lower.includes("proposal") ||
		lower.includes("shared") ||
		lower.includes("deal terms")
	) {
		return (
			<div className="self-center max-w-[95%] sm:max-w-[85%] my-2 px-4 py-2.5 rounded-2xl bg-[#FFFBEB] border-2 border-black text-[#92400E] shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2.5 text-xs sm:text-sm font-semibold transition-all">
				<div className="size-6 rounded-full bg-[#FFC940] border-2 border-black text-black flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
					<svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
						<polyline points="14 2 14 8 20 8" />
						<line x1="16" y1="13" x2="8" y2="13" />
						<line x1="16" y1="17" x2="8" y2="17" />
					</svg>
				</div>
				<span className="leading-snug">
					📄 A new <strong className="font-black text-black">deal proposal</strong> was shared for approval.
				</span>
			</div>
		)
	}

	// 4. Changes Requested
	if (lower.includes("changes") || lower.includes("requested change") || lower.includes("revision")) {
		return (
			<div className="self-center max-w-[95%] sm:max-w-[85%] my-2 px-4 py-2.5 rounded-2xl bg-[#FEF2F2] border-2 border-black text-[#991B1B] shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2.5 text-xs sm:text-sm font-semibold transition-all">
				<div className="size-6 rounded-full bg-[#EE2C2C] border-2 border-black text-white flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
					<svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
						<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
						<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
					</svg>
				</div>
				<span className="leading-snug">
					⚠️ <strong className="font-black text-black">Changes were requested</strong> on the proposal.
				</span>
			</div>
		)
	}

	// 5. Payment Made
	if (lower.includes("paid") || lower.includes("payment")) {
		return (
			<div className="self-center max-w-[95%] sm:max-w-[85%] my-2 px-4 py-2.5 rounded-2xl bg-[#F0FDF4] border-2 border-black text-[#15803D] shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2.5 text-xs sm:text-sm font-semibold transition-all">
				<div className="size-6 rounded-full bg-[#10B981] border-2 border-black text-white flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
					<svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
						<rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
						<line x1="1" y1="10" x2="23" y2="10" />
					</svg>
				</div>
				<span className="leading-snug">
					💳 <strong className="font-black text-black">Payment completed</strong> successfully!
				</span>
			</div>
		)
	}

	// 6. Generic Fallback
	return (
		<div className="self-center max-w-[95%] sm:max-w-[85%] my-2 px-4 py-2 rounded-2xl bg-neutral-100 border-2 border-black text-black/80 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs sm:text-sm font-bold text-center">
			{content}
		</div>
	)
}
