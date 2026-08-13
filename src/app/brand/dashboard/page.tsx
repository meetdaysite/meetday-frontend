"use client"

import Link from "next/link"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import { useBrandStore } from "@/store/brandStore"

import WidgetsSvg from "@/icons/outlined/widgets.svg"
import UsersGroupSvg from "@/icons/outlined/users-group-2.svg"

export default function DashboardPage() {
	const { profile } = useBrandStore()
	const displayName = profile?.brandName || "Brand"

	return (
		<div className="flex flex-col">
			<DashboardTopBar />

			<div className="px-6 lg:px-8 pt-8 pb-6">
				<h1 className="text-heading-sm lg:text-heading-md font-semibold text-text-primary leading-tight">
					Welcome back, <span className="text-text-brand">{displayName}.</span>
				</h1>
				<p className="text-body-sm text-text-secondary mt-2">
					Browse sponsorship proposals, discover communities, or create a new campaign.
				</p>
			</div>

			<div className="px-6 lg:px-8 pb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				<Link
					href="/brand/dashboard/proposals"
					className="rounded-action border border-border-default bg-surface-card p-5 flex flex-col gap-3 hover:border-border-strong transition-colors"
				>
					<div className="size-10 rounded-xl bg-surface-brand-soft flex items-center justify-center">
						<Icon as={WidgetsSvg} size="md" color="brand" />
					</div>
					<div>
						<p className="text-label-md font-semibold text-text-primary">View Proposals</p>
						<p className="text-caption text-text-muted mt-0.5">Browse active sponsorship opportunities</p>
					</div>
				</Link>

				<Link
					href="/brand/dashboard/communities"
					className="rounded-action border border-border-default bg-surface-card p-5 flex flex-col gap-3 hover:border-border-strong transition-colors"
				>
					<div className="size-10 rounded-xl bg-surface-brand-soft flex items-center justify-center">
						<Icon as={UsersGroupSvg} size="md" color="brand" />
					</div>
					<div>
						<p className="text-label-md font-semibold text-text-primary">Communities</p>
						<p className="text-caption text-text-muted mt-0.5">See onboarded communities on Meetday</p>
					</div>
				</Link>

				<div className="rounded-action border border-border-default bg-surface-card p-5 flex flex-col gap-3 opacity-70">
					<div className="flex items-center justify-between">
						<div className="size-10 rounded-xl bg-surface-card-muted flex items-center justify-center">
							<Icon as={WidgetsSvg} size="md" color="muted" />
						</div>
						<span className="px-2 py-0.5 rounded-full bg-surface-card-muted text-text-muted text-caption font-medium">
							Coming Soon
						</span>
					</div>
					<div>
						<p className="text-label-md font-semibold text-text-primary">Create a Campaign</p>
						<p className="text-caption text-text-muted mt-0.5">Post a sponsorship brief for communities to apply to</p>
					</div>
					<Button variant="secondary" size="sm" disabled className="w-full cursor-not-allowed">
						Coming Soon
					</Button>
				</div>
			</div>
		</div>
	)
}
