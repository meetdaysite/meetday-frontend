import { AttendeeDarkPanel, type AttendeePanelVariant } from "./AttendeeDarkPanel"

interface AttendeeAuthShellProps {
	children: React.ReactNode
	variant: AttendeePanelVariant
}

export function AttendeeAuthShell({ children, variant }: AttendeeAuthShellProps) {
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
			<div className="hidden lg:block shrink-0 w-[38%] xl:w-[42%]">
				<AttendeeDarkPanel variant={variant} />
			</div>
		</div>
	)
}
