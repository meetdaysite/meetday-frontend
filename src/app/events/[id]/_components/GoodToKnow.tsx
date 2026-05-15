import { Icon } from "@/components/ui/Icon"
import InfoCircleSvg from "@/icons/filled/info-circle.svg"

export function GoodToKnow({ instructions }: { instructions: string }) {
	return (
		<div className="flex gap-3 p-4 rounded-card bg-surface-warning-soft border border-(--border-warning)">
			<Icon as={InfoCircleSvg} size="md" color="warning" className="mt-0.5 shrink-0" />
			<div>
				<p className="text-body-md font-medium text-text-warning mb-1">Good to know</p>
				<p className="text-label-sm font-normal text-text-secondary leading-relaxed">{instructions}</p>
			</div>
		</div>
	)
}
