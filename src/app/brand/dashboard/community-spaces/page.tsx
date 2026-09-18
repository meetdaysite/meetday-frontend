import { Suspense } from "react"
import { CommunitySpacesBrowse } from "@/components/spaces/CommunitySpacesBrowse"

export default function BrandCommunitySpacesPage() {
	return (
		<Suspense fallback={<div className="p-8 text-center text-sm font-semibold text-black/50">Loading community hubs...</div>}>
			<CommunitySpacesBrowse viewerRole="BRAND" />
		</Suspense>
	)
}
