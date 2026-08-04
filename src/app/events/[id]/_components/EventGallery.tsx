import Image from "next/image"
import type { PublicEventMedia } from "@/types/attendee"
import { storageUrl } from "@/lib/uploadMedia"

export function EventGallery({ media }: { media: PublicEventMedia[] }) {
	const gallery = media
		.filter(m => m.type === "GALLERY")
		.sort((a, b) => a.order - b.order)

	if (gallery.length === 0) return null

	return (
		<section>
			<h2 className="text-title-md text-text-primary mb-4">Gallery</h2>
			<div className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
				{gallery.map(img => {
					const url = img.url || (img.key ? storageUrl(img.key) : "")
					if (!url) return null
					return (
						<div
							key={img.id}
							className="relative shrink-0 w-52 h-36 rounded-image overflow-hidden bg-neutral-100"
						>
							<Image
								src={url}
								alt=""
								fill
								sizes="208px"
								className="object-cover hover:scale-105 transition-transform duration-300"
							/>
						</div>
					)
				})}
			</div>
		</section>
	)
}
