import { Icon } from "@/components/ui/Icon"
import CheckCircleSvg from "@/icons/outlined/check-circle.svg"

export function WhatToExpect({ items }: { items: string[] }) {
	if (items.length === 0) return null

	return (
		<section>
			<h2 className="text-title-md text-text-primary mb-4">What to expect</h2>
			<ul className="grid sm:grid-cols-2 gap-3">
				{items.map((item, i) => (
					<li
						key={i}
						className="flex items-start gap-3 p-4 rounded-card bg-surface-card border border-border-subtle"
					>
						<Icon as={CheckCircleSvg} size="sm" color="success" className="mt-0.5 shrink-0" />
						<span className="text-body-md text-text-secondary">{item}</span>
					</li>
				))}
			</ul>
		</section>
	)
}
