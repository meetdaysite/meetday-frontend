"use client"

import React, { Fragment } from "react"

const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi

interface LinkifiedTextProps {
	text: string
	className?: string
	linkClassName?: string
}

export function LinkifiedText({ text, className, linkClassName }: LinkifiedTextProps) {
	if (!text) return null

	const parts = text.split(URL_REGEX)

	return (
		<span className={className}>
			{parts.map((part, index) => {
				if (part.match(URL_REGEX)) {
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
