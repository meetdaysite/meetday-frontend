import { Icon } from "@/components/ui/Icon"
import CheckSvg from "@/icons/outlined/check.svg"

const GUIDELINES = [
	"Respect boundaries and positive energy",
	"No hate speech or discrimination",
	"Keep conversations relevant to the community",
	"No spam or self-promotion without permission",
	"Report misconduct to community admins",
]

export function CommunityGuidelinesCard() {
	return (
		<div className="p-5 rounded-panel bg-surface-card border border-border-default">
			<p className="text-body-md font-semibold text-text-primary mb-4">Community guidelines</p>
			<div className="flex flex-col gap-2">
				{GUIDELINES.slice(0, 3).map((g) => (
					<div key={g} className="flex items-start gap-2">
						<Icon as={CheckSvg} size="sm" color="success" className="mt-0.5 shrink-0" />
						<span className="text-label-sm text-text-primary font-normal leading-snug">{g}</span>
					</div>
				))}
			</div>
		</div>
	)
}
