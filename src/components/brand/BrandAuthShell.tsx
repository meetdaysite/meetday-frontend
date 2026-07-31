import { BrandDarkPanel, type BrandPanelVariant } from "./BrandDarkPanel"

interface BrandAuthShellProps {
	children: React.ReactNode
	variant: BrandPanelVariant
}

export function BrandAuthShell({ children, variant }: BrandAuthShellProps) {
	return (
		<div className="flex flex-1">
			{/* ── Left — form panel ── */}
			<div className="flex flex-1 items-center justify-center px-4 py-8 lg:pl-8 lg:pr-3 xl:pl-12 xl:pr-4">
				<div
					className={[
						"w-full bg-surface-card rounded-modal shadow-modal",
						"px-5 py-6 my-8",
						"lg:px-7 lg:py-7 lg:max-w-100 lg:my-0",
						"xl:px-8 xl:py-8 xl:max-w-130",
					].join(" ")}
				>
					{children}
				</div>
			</div>

			{/* ── Right — dark panel with floating illustration cards, hidden below lg ── */}
			<div className="hidden lg:block shrink-0 w-[38%] lg:w-[46%] xl:w-[50%]">
				<BrandDarkPanel variant={variant} />
			</div>
		</div>
	)
}
