"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import { toast } from "sonner"
import {
	getMyCommunityCollaborationChats,
	acceptCommunityCollaborationRequest,
	declineCommunityCollaborationRequest,
	type CommunityHostChatThread,
} from "@/lib/api"
import UsersGroupSvg from "@/icons/outlined/users-group-2.svg"

export function CollaborationRequestsCard() {
	const [requests, setRequests] = useState<CommunityHostChatThread[]>([])
	const [loading, setLoading] = useState(true)
	const [respondingId, setRespondingId] = useState<string | null>(null)

	useEffect(() => {
		loadRequests()
	}, [])

	async function loadRequests() {
		try {
			setLoading(true)
			const chats = await getMyCommunityCollaborationChats("REQUESTED")
			setRequests(chats)
		} catch (err) {
			console.error("Failed to load collaboration requests:", err)
		} finally {
			setLoading(false)
		}
	}

	async function handleAccept(requestId: string) {
		try {
			setRespondingId(requestId)
			await acceptCommunityCollaborationRequest(requestId)
			toast.success("Collaboration request accepted!")
			setRequests(prev => prev.filter(r => r.id !== requestId))
		} catch (err) {
			toast.error("Failed to accept request")
		} finally {
			setRespondingId(null)
		}
	}

	async function handleDecline(requestId: string) {
		try {
			setRespondingId(requestId)
			await declineCommunityCollaborationRequest(requestId)
			toast.success("Request declined")
			setRequests(prev => prev.filter(r => r.id !== requestId))
		} catch (err) {
			toast.error("Failed to decline request")
		} finally {
			setRespondingId(null)
		}
	}

	if (loading) {
		return (
			<div className="rounded-action bg-surface-card border border-border-default p-5">
				<p className="text-label-sm text-text-muted">Loading collaboration requests...</p>
			</div>
		)
	}

	if (requests.length === 0) {
		return null
	}

	return (
		<div className="rounded-action bg-surface-card border border-border-default p-5">
			<div className="flex items-center gap-2 mb-4">
				<Icon as={UsersGroupSvg} size="lg" color="info" />
				<p className="text-body-md font-semibold text-text-primary">Collaboration Requests ({requests.length})</p>
			</div>

			<div className="space-y-3">
				{requests.map(request => (
					<div key={request.id} className="flex items-center justify-between p-3 rounded-action bg-surface-card-muted border border-border-subtle">
						<div className="flex-1 min-w-0">
							<p className="text-label-sm font-semibold text-text-primary truncate">
								{request.communityName} wants to collaborate
							</p>
							<p className="text-caption text-text-muted mt-0.5">
								Sent {new Date(request.createdAt || "").toLocaleDateString()}
							</p>
						</div>
						<div className="flex items-center gap-2 ml-3 shrink-0">
							<Button
								variant="primary"
								size="sm"
								radius="md"
								disabled={respondingId === request.id}
								onClick={() => handleAccept(request.id)}
								className="bg-[#22C55E] hover:bg-[#1ea750] text-white"
							>
								{respondingId === request.id ? "…" : "Accept"}
							</Button>
							<Button
								variant="secondary"
								size="sm"
								radius="md"
								disabled={respondingId === request.id}
								onClick={() => handleDecline(request.id)}
							>
								Decline
							</Button>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
