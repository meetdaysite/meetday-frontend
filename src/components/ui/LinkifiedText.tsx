"use client"

import React, { Fragment } from "react"

const MENTION_OR_URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+|@[a-zA-Z0-9_.-]+)/gi

interface LinkifiedTextProps {
	text: string
	className?: string
	linkClassName?: string
}

export function LinkifiedText({ text, className, linkClassName }: LinkifiedTextProps) {
	if (!text) return null

	const parts = text.split(MENTION_OR_URL_REGEX)

	return (
		<span className={className}>
			{parts.map((part, index) => {
				if (!part) return null

				if (part.startsWith("@") && part.length > 1) {
					return (
						<span
							key={index}
							className="inline-flex items-center px-1.5 py-0.2 rounded-md font-black bg-black/15 text-inherit text-[0.92em] shadow-xs tracking-tight"
						>
							{part}
						</span>
					)
				}

				if (part.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/i)) {
					let href = part
					let trailing = ""

					const matchPunctuation = part.match(/[.,!?;:)\]]+$/)
					if (matchPunctuation) {
						trailing = matchPunctuation[0]
						href = part.slice(0, -trailing.length)
					}

					const fullHref = href.startsWith("http://") || href.startsWith("https://")
						? href
						: `https://${href}`

					return (
						<Fragment key={index}>
							<a
								href={fullHref}
								target="_blank"
								rel="noopener noreferrer"
								onClick={(e) => e.stopPropagation()}
								className={linkClassName || "underline underline-offset-2 font-bold break-all hover:opacity-80 transition-opacity"}
							>
								{href}
							</a>
							{trailing}
						</Fragment>
					)
				}
				return <Fragment key={index}>{part}</Fragment>
			})}
		</span>
	)
}
