import clsx from "clsx"

// ─── Base atom ────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
	return <div className={clsx("bg-neutral-200 animate-pulse rounded", className)} />
}

// ─── Card (aspect-ratio placeholder) ─────────────────────────────────────────

Skeleton.Card = function SkeletonCard({ className }: { className?: string }) {
	return (
		<div className={clsx("aspect-3/4 rounded-2xl bg-neutral-200 animate-pulse", className)} />
	)
}

// ─── Avatar / circle ──────────────────────────────────────────────────────────

Skeleton.Avatar = function SkeletonAvatar({
	size = "md",
	className,
}: {
	size?: "xs" | "sm" | "md" | "lg"
	className?: string
}) {
	const sizes = { xs: "size-7", sm: "size-8", md: "size-10", lg: "size-12" }
	return (
		<div
			className={clsx(
				"rounded-full bg-neutral-200 animate-pulse shrink-0",
				sizes[size],
				className,
			)}
		/>
	)
}

// ─── Text line ────────────────────────────────────────────────────────────────

Skeleton.Text = function SkeletonText({ className }: { className?: string }) {
	return <div className={clsx("h-3 bg-neutral-200 animate-pulse rounded", className)} />
}

// ─── List item (avatar + stacked text lines) ──────────────────────────────────

Skeleton.ListItem = function SkeletonListItem({
	avatarSize = "sm",
	lines = 2,
	className,
}: {
	avatarSize?: "xs" | "sm" | "md" | "lg"
	lines?: 2 | 3
	className?: string
}) {
	return (
		<div className={clsx("flex gap-2.5 animate-pulse", className)}>
			<Skeleton.Avatar size={avatarSize} />
			<div className="flex-1 flex flex-col gap-1.5">
				<Skeleton.Text className="w-20" />
				<Skeleton.Text className="w-3/4" />
				{lines === 3 && <Skeleton.Text className="w-16" />}
			</div>
		</div>
	)
}

// ─── Post card ────────────────────────────────────────────────────────────────

Skeleton.Post = function SkeletonPost({ className }: { className?: string }) {
	return (
		<div
			className={clsx(
				"rounded-panel bg-surface-card border border-border-default p-4 flex flex-col gap-3 animate-pulse",
				className,
			)}
		>
			<div className="flex items-center gap-2.5">
				<Skeleton.Avatar size="md" />
				<div className="flex flex-col gap-1.5 flex-1">
					<Skeleton.Text className="w-28" />
					<Skeleton.Text className="w-20" />
				</div>
			</div>
			<div className="flex flex-col gap-1.5">
				<Skeleton.Text className="w-full" />
				<Skeleton.Text className="w-5/6" />
				<Skeleton.Text className="w-3/4" />
			</div>
		</div>
	)
}

// ─── Announcement card ────────────────────────────────────────────────────────

Skeleton.Announcement = function SkeletonAnnouncement({ className }: { className?: string }) {
	return (
		<div
			className={clsx(
				"rounded-panel bg-surface-card border border-border-default flex gap-4 p-4 animate-pulse",
				className,
			)}
		>
			<div className="w-32 shrink-0 rounded-action bg-neutral-200 min-h-27.5" />
			<div className="flex-1 flex flex-col gap-2">
				<Skeleton.Text className="w-24" />
				<Skeleton.Text className="h-5 w-3/4" />
				<Skeleton.Text className="w-full" />
				<Skeleton.Text className="w-5/6" />
			</div>
		</div>
	)
}

// ─── Stat card (dashboard) ────────────────────────────────────────────────────

Skeleton.StatCard = function SkeletonStatCard({ className }: { className?: string }) {
	return (
		<div
			className={clsx(
				"flex gap-4 items-center p-4 rounded-action border border-border-default bg-surface-card shadow-card animate-pulse",
				className,
			)}
		>
			<div className="size-10 rounded-badge bg-neutral-200 shrink-0" />
			<div className="flex flex-col gap-2 flex-1">
				<Skeleton.Text className="h-5 w-8" />
				<Skeleton.Text className="w-20" />
				<Skeleton.Text className="w-24" />
			</div>
		</div>
	)
}

// ─── Overview item (dashboard) ────────────────────────────────────────────────

Skeleton.OverviewItem = function SkeletonOverviewItem({ className }: { className?: string }) {
	return (
		<div className={clsx("flex items-start gap-3 animate-pulse", className)}>
			<div className="size-10 rounded-xl bg-neutral-200 shrink-0 mt-0.5" />
			<div className="flex flex-col gap-2 flex-1">
				<Skeleton.Text className="w-20" />
				<Skeleton.Text className="h-5 w-12" />
				<Skeleton.Text className="w-16" />
			</div>
		</div>
	)
}

// ─── Saved experience row (avatar block + text) ───────────────────────────────

Skeleton.SavedItem = function SkeletonSavedItem({ className }: { className?: string }) {
	return (
		<div className={clsx("flex items-center gap-3 animate-pulse", className)}>
			<div className="size-12 rounded-action bg-neutral-200 shrink-0" />
			<div className="flex-1 flex flex-col gap-1.5">
				<Skeleton.Text className="w-3/4" />
				<Skeleton.Text className="w-1/2" />
			</div>
		</div>
	)
}

// ─── Generic block (full-width placeholder) ───────────────────────────────────

Skeleton.Block = function SkeletonBlock({ className }: { className?: string }) {
	return <div className={clsx("rounded-action bg-neutral-200 animate-pulse", className)} />
}

// ─── Row (label + value — for activity/stat rows) ─────────────────────────────

Skeleton.Row = function SkeletonRow({ className }: { className?: string }) {
	return (
		<div
			className={clsx(
				"flex items-center justify-between py-2.5 border-b border-border-default last:border-0 animate-pulse",
				className,
			)}
		>
			<Skeleton.Text className="w-36" />
			<Skeleton.Text className="w-8" />
		</div>
	)
}

// ─── Event list item (radio + image + text + badge) ──────────────────────────

Skeleton.EventListItem = function SkeletonEventListItem({ className }: { className?: string }) {
	return (
		<div
			className={clsx(
				"flex items-center gap-3 p-3 rounded-action border border-border-default animate-pulse",
				className,
			)}
		>
			<div className="size-4 rounded-full bg-neutral-200 shrink-0" />
			<div className="size-12 rounded-action bg-neutral-200 shrink-0" />
			<div className="flex-1 flex flex-col gap-1.5">
				<Skeleton.Text className="w-2/3" />
				<Skeleton.Text className="w-1/2" />
			</div>
			<Skeleton.Text className="h-5 w-20 rounded-full" />
		</div>
	)
}

// ─── Page-level full-screen loader ───────────────────────────────────────────

Skeleton.Page = function SkeletonPage({ className }: { className?: string }) {
	return (
		<main
			className={clsx(
				"flex-1 flex items-center justify-center py-24",
				className,
			)}
		>
			<div className="w-full max-w-2xl px-4 flex flex-col gap-4 animate-pulse">
				<Skeleton.Block className="h-8 w-48 mb-2" />
				<Skeleton.Block className="h-48 w-full" />
				<div className="flex flex-col gap-3">
					<Skeleton.Block className="h-6 w-full" />
					<Skeleton.Block className="h-6 w-5/6" />
					<Skeleton.Block className="h-6 w-4/6" />
				</div>
			</div>
		</main>
	)
}

export { Skeleton }
