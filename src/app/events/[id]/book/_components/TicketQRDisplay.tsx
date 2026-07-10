"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import QRCode from "qrcode"

interface TicketQRDisplayProps {
	qrDataUrl?: string
	value?: string
	size?: number
}

export function TicketQRDisplay({ qrDataUrl, value, size = 160 }: TicketQRDisplayProps) {
	const [generatedUrl, setGeneratedUrl] = useState<string>("")

	useEffect(() => {
		if (qrDataUrl || !value) return
		QRCode.toDataURL(value, {
			width: size,
			margin: 1,
			color: { dark: "#111111", light: "#ffffff" },
		}).then(setGeneratedUrl)
	}, [qrDataUrl, value, size])

	const src = qrDataUrl ?? generatedUrl

	if (!src) {
		return (
			<div
				className="rounded-image bg-neutral-100 animate-pulse"
				style={{ width: size, height: size }}
			/>
		)
	}

	return (
		<Image
			src={src}
			alt="Ticket QR code"
			width={size}
			height={size}
			className="rounded-image block"
			unoptimized
		/>
	)
}
