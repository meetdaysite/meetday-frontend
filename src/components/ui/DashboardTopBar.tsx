import { Icon } from "@/components/ui/Icon"
import BellSvg from "@/icons/outlined/bell.svg"
import AltArrowDownSvg from "@/icons/outlined/alt-arrow-down.svg"

export function DashboardTopBar() {
	return (
		<div className="hidden lg:flex items-center justify-between px-8 py-4 bg-surface-card border-b border-border-subtle shrink-0">
			<p className="text-body-sm text-text-secondary">
				Welcome to <span className="font-semibold text-text-primary">Meetday</span>
			</p>
			<div className="flex items-center gap-3">
				<button className="relative p-2 rounded-action hover:bg-surface-card-muted transition-colors" aria-label="Notifications">
					<Icon as={BellSvg} size="md" color="secondary" />
					<span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-action-primary" />
				</button>
				<div className="flex items-center gap-2 cursor-pointer hover:bg-surface-card-muted px-2 py-1.5 rounded-action transition-colors">
					<div className="size-8 rounded-avatar bg-surface-brand-soft flex items-center justify-center">
						<span className="text-label-sm font-semibold text-text-brand">AM</span>
					</div>
					<span className="text-label-md text-text-primary">Alex Morgan</span>
					<Icon as={AltArrowDownSvg} size="sm" color="secondary" />
				</div>
			</div>
		</div>
	)
}
