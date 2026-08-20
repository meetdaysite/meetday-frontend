"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { toast } from "@/lib/toast"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Tabs } from "@/components/ui/Tabs"
import clsx from "clsx"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import { Icon } from "@/components/ui/Icon"
import { useHostStore } from "@/store/hostStore"
import {
    getCategories,
    updateHostProfile,
    type Category,
    createSponsorshipProposal,
    updateSponsorshipProposal,
    getMySponsorshipProposals,
    submitSponsorshipProposal,
    deleteSponsorshipProposal,
    getUploadUrl,
    getHostCommunityProfile,
    activateHostCommunityProfile,
    deactivateHostCommunityProfile,
    generateProposalDraft,
    type SponsorshipProposal as ApiSponsorshipProposal,
    type SponsorshipProposalPayload,
    type HostCommunityProfile,
    type HostCommunityProfilePayload,
} from "@/lib/api"

import { ActivateCommunityModal } from "@/components/community/ActivateCommunityModal"
import { CommunityProfileDetailsPanel } from "@/components/community/CommunityProfileDetailsPanel"
import { AddressAutocompleteInput } from "@/components/eventForm/AddressAutocompleteInput"
import PdfViewer from "@/components/pdf/PdfViewer"

import UploadSvg from "@/icons/outlined/upload.svg"
import DocumentTextSvg from "@/icons/outlined/document-text.svg"
import CheckCircleSvg from "@/icons/outlined/check-circle.svg"
import TrashBinSvg from "@/icons/outlined/trash-bin.svg"
import AiAvatarSvg from "@/assets/ai-avatar.svg"
import MagicStickSvg from "@/icons/duotone/magic-stick-3.svg"

export interface SponsorPrice {
    name: string
    price: string
}

export interface StoredProposal {
    id: string
    name: string
    about: string
    image: File | Blob | string | null
    imageName: string
    date: string
    endDate: string
    venue: string
    venues: string[]
    city: string
    venueCities: string[]
    audienceProfile: string | string[]
    ageGroup: string
    guestCount: string
    videoUrl?: string
    docFile: File | Blob | string
    docName: string
    docType: string
    docSize: number
    uploadedAt: string
    status?: "DRAFT" | "UNDER_REVIEW" | "REJECTED" | "PUBLISHED"
    adminRejectionRemark?: string | null
    sponsorPrices?: SponsorPrice[]
    pendingRevision?: {
        name: string
        about: string
        image: File | Blob | string | null
        imageName: string
        date: string
        endDate: string
        venue: string
        venues: string[]
        city: string
        venueCities: string[]
        audienceProfile: string | string[]
        ageGroup: string
        guestCount: string
        videoUrl?: string
        docFile: File | Blob | string
        docName: string
        docType: string
        docSize: number
        uploadedAt: string
        sponsorPrices?: SponsorPrice[]
    }
}

function mapApiProposalToStored(p: ApiSponsorshipProposal): StoredProposal {
    return {
        id: p.id,
        name: p.name || "",
        about: p.about || "",
        image: p.imageUrl || null,
        imageName: p.imageKey ? p.imageKey.split("/").pop() || "" : "",
        date: p.eventDate ? p.eventDate.substring(0, 10) : "",
        endDate: p.eventEndDate ? p.eventEndDate.substring(0, 10) : "",
        venue: p.venue || "",
        venues: p.venues && p.venues.length > 0 ? p.venues : (p.venue ? [p.venue] : []),
        city: p.city || "",
        venueCities: p.venueCities && p.venueCities.length > 0 ? p.venueCities : (p.city ? [p.city] : []),
        audienceProfile: p.audienceProfile || [],
        ageGroup: p.ageGroup || "",
        guestCount: p.guestCount || "",
        videoUrl: p.videoUrl || "",
        docFile: p.docUrl || "",
        docName: p.docName || "",
        docType: p.docType || "",
        docSize: p.docSize || 0,
        uploadedAt: p.updatedAt,
        status: p.status,
        adminRejectionRemark: p.adminRejectionRemark,
        sponsorPrices: (p.sponsorTiers || []).map((t) => ({ name: t.name, price: t.price })),
        pendingRevision: p.pendingRevision
            ? {
                name: (p.pendingRevision.name as string) || p.name || "",
                about: (p.pendingRevision.about as string) || p.about || "",
                image: (p.pendingRevision.imageUrl as string) || p.imageUrl || null,
                imageName: p.pendingRevision.imageKey ? String(p.pendingRevision.imageKey).split("/").pop() || "" : p.imageKey?.split("/").pop() || "",
                date: (p.pendingRevision.eventDate as string)?.substring(0, 10) || (p.eventDate || "").substring(0, 10),
                endDate: (p.pendingRevision.eventEndDate as string)?.substring(0, 10) || (p.eventEndDate || "").substring(0, 10),
                venue: (p.pendingRevision.venue as string) || p.venue || "",
                venues: (p.pendingRevision.venues as string[]) || (p.venues && p.venues.length > 0 ? p.venues : (p.venue ? [p.venue] : [])),
                city: (p.pendingRevision.city as string) || p.city || "",
                venueCities: (p.pendingRevision.venueCities as string[]) || (p.venueCities && p.venueCities.length > 0 ? p.venueCities : (p.city ? [p.city] : [])),
                audienceProfile: (p.pendingRevision.audienceProfile as string[]) || p.audienceProfile || [],
                ageGroup: (p.pendingRevision.ageGroup as string) || p.ageGroup || "",
                guestCount: (p.pendingRevision.guestCount as string) || p.guestCount || "",
                videoUrl: (p.pendingRevision.videoUrl as string) || p.videoUrl || "",
                docFile: (p.pendingRevision.docUrl as string) || p.docUrl || "",
                docName: (p.pendingRevision.docName as string) || p.docName || "",
                docType: (p.pendingRevision.docType as string) || p.docType || "",
                docSize: (p.pendingRevision.docSize as number) || p.docSize || 0,
                uploadedAt: p.updatedAt,
                sponsorPrices: ((p.pendingRevision.sponsorTiers as { name: string; price: string }[]) || (p.sponsorTiers || [])).map((t) => ({ name: t.name, price: t.price })),
            }
            : undefined,
    }
}

// Index-matches a venueCities array to the venues array length, padding missing entries with "".
function padVenueCities(venues: string[], cities: string[]): string[] {
    return venues.map((_, i) => cities[i] ?? "")
}

export async function getProposals(_hostId: string): Promise<StoredProposal[]> {
    const { proposals } = await getMySponsorshipProposals()
    return proposals.map(mapApiProposalToStored)
}

async function uploadFileAndGetKey(
    file: File,
    context: "SPONSORSHIP_MEDIA" | "SPONSORSHIP_DOCUMENT",
): Promise<string> {
    const { url, key } = await getUploadUrl({ context, contentType: file.type })
    await fetch(url, { method: "PUT", headers: { "Content-Type": file.type }, body: file })
    return key
}



// ─── Format helper ──────────────────────────────────────────────────────────
function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

export default function ProposalPage() {
    const { profile, setProfile } = useHostStore()
    const hostId = profile?.id || ""
    const searchParams = useSearchParams()
    const urlProposalId = searchParams ? searchParams.get("proposalId") : null

    const [proposals, setProposals] = useState<StoredProposal[]>([])
    const [selectedProposal, setSelectedProposal] = useState<StoredProposal | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [docBlob, setDocBlob] = useState<Blob | null>(null)
    const [projectImageUrl, setProjectImageUrl] = useState<string | null>(null)
    const [community, setCommunity] = useState<HostCommunityProfile | null>(null)

    // Project Details / Proposal Upload states
    const [showProjectModal, setShowProjectModal] = useState(false)
    const [showProposalForm, setShowProposalForm] = useState(false)
    const [isEditingInPlace, setIsEditingInPlace] = useState(false)
    const [projName, setProjName] = useState("")
    const [projAbout, setProjAbout] = useState("")
    const [projImage, setProjImage] = useState<File | null>(null)
    const [projImagePreview, setProjImagePreview] = useState<string | null>(null)
    const [projDate, setProjDate] = useState("")
    const [projEndDate, setProjEndDate] = useState("")
    const [projVenues, setProjVenues] = useState<string[]>([""])
    const [projVenueCities, setProjVenueCities] = useState<string[]>([""])
    const [projAudience, setProjAudience] = useState<string[]>([])
    const [newAudience, setNewAudience] = useState("")
    const [previewSlide, setPreviewSlide] = useState(0)
    const [projAgeGroup, setProjAgeGroup] = useState("")
    const [projGuestCount, setProjGuestCount] = useState("")
    const [projVideoUrl, setProjVideoUrl] = useState("")
    const [projDoc, setProjDoc] = useState<File | null>(null)
    const [sponsorPrices, setSponsorPrices] = useState<SponsorPrice[]>([{ name: "", price: "" }])
    const [proposalCopilotOpen, setProposalCopilotOpen] = useState(false)
    const [proposalCopilotPrompt, setProposalCopilotPrompt] = useState("")
    const [proposalCopilotLoading, setProposalCopilotLoading] = useState(false)
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)

    const loadingMessages = useMemo(() => [
        "Meetday is cooking... 🍳",
        "Spicing up the proposal details... 🌶️",
        "Whipping up the target audience profile... 📊",
        "Simmering the numbers and sponsor tiers... 💰",
        "Adding the secret sauce to the pitch... 🍯",
        "Plating the perfect proposal... 🍽️",
        "Garnishing with final touches... ✨"
    ], [])

    useEffect(() => {
        let interval: NodeJS.Timeout
        if (proposalCopilotLoading) {
            setLoadingMessageIndex(0)
            interval = setInterval(() => {
                setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length)
            }, 2000)
        }
        return () => clearInterval(interval)
    }, [proposalCopilotLoading, loadingMessages])
    const projImageInputRef = useRef<HTMLInputElement>(null)
    const projDocInputRef = useRef<HTMLInputElement>(null)
    const updateDocInputRef = useRef<HTMLInputElement>(null)
    const previewContainerRef = useRef<HTMLDivElement>(null)

    const [docxRenderer, setDocxRenderer] = useState<any>(null)
    const [pptxViewerClass, setPptxViewerClass] = useState<any>(null)

    const [activeTab, setActiveTab] = useState<"ALL" | "DRAFT" | "UNDER_REVIEW" | "REJECTED" | "PUBLISHED">("ALL")
    const [loading, setLoading] = useState(true)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Modal State
    const [showActivateModal, setShowActivateModal] = useState(false)
    const [showCommunityMobilePanel, setShowCommunityMobilePanel] = useState(false)
    const [communityName, setCommunityName] = useState("")
    const [aboutCommunity, setAboutCommunity] = useState("")
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
    const [communitySize, setCommunitySize] = useState("")
    const [avgGuestCount, setAvgGuestCount] = useState("")
    const [experiencesPerYear, setExperiencesPerYear] = useState("")
    const [categoryIds, setCategoryIds] = useState<string[]>([])
    const [instagram, setInstagram] = useState("")
    const [linkedin, setLinkedin] = useState("")
    const [youtube, setYoutube] = useState("")
    const [portfolio, setPortfolio] = useState("")
    const logoInputRef = useRef<HTMLInputElement>(null)

    const [categories, setCategories] = useState<Category[]>([])

    const isSplitLayout = showActivateModal || !!community

    const communityLogoUrl = useMemo(() => {
        if (!community) return null
        if ((community as any).logoUrl) return (community as any).logoUrl
        if ((community as any).logo) {
            try {
                return URL.createObjectURL((community as any).logo)
            } catch (e) {
                return null
            }
        }
        return null
    }, [community])

    const categoryIdsToShow = useMemo(() => {
        if (!community) return []
        if (community.categories) return community.categories.map(c => c.id)
        if ((community as any).categoryIds) return (community as any).categoryIds
        return []
    }, [community])

    const renderCommunityCard = () => {
        if (!community) return null
        return (
            <CommunityProfileDetailsPanel
                community={community}
                operatingCities={profile?.operatingCities}
                socialLinks={profile?.socialLinks}
                onEdit={openActivationModal}
            />
        )
    }

    const displayDetails = useMemo(() => {
        if (!selectedProposal) return null
        if (selectedProposal.pendingRevision) {
            return {
                name: selectedProposal.pendingRevision.name,
                about: selectedProposal.pendingRevision.about,
            
                imageName: selectedProposal.pendingRevision.imageName,
                date: selectedProposal.pendingRevision.date,
                endDate: selectedProposal.pendingRevision.endDate,
                venue: selectedProposal.pendingRevision.venue,
                venues: selectedProposal.pendingRevision.venues,
                city: selectedProposal.pendingRevision.city,
                venueCities: selectedProposal.pendingRevision.venueCities,
                audienceProfile: selectedProposal.pendingRevision.audienceProfile,
                ageGroup: selectedProposal.pendingRevision.ageGroup,
                guestCount: selectedProposal.pendingRevision.guestCount,
                videoUrl: selectedProposal.pendingRevision.videoUrl || selectedProposal.videoUrl,
                docFile: selectedProposal.pendingRevision.docFile || selectedProposal.docFile,
                docName: selectedProposal.pendingRevision.docName || selectedProposal.docName,
                docType: selectedProposal.pendingRevision.docType || selectedProposal.docType,
                docSize: selectedProposal.pendingRevision.docSize || selectedProposal.docSize,
                uploadedAt: selectedProposal.pendingRevision.uploadedAt,
                sponsorPrices: selectedProposal.pendingRevision.sponsorPrices || selectedProposal.sponsorPrices || [],
                isRevision: true,
            }
        }
        return {
            name: selectedProposal.name,
            about: selectedProposal.about,
            image: selectedProposal.image,
            imageName: selectedProposal.imageName,
            date: selectedProposal.date,
            endDate: selectedProposal.endDate,
            venue: selectedProposal.venue,
            venues: selectedProposal.venues,
            city: selectedProposal.city,
            venueCities: selectedProposal.venueCities,
            audienceProfile: selectedProposal.audienceProfile,
            ageGroup: selectedProposal.ageGroup,
            guestCount: selectedProposal.guestCount,
            videoUrl: selectedProposal.videoUrl,
            docFile: selectedProposal.docFile,
            docName: selectedProposal.docName,
            docType: selectedProposal.docType,
            docSize: selectedProposal.docSize,
            uploadedAt: selectedProposal.uploadedAt,
            sponsorPrices: selectedProposal.sponsorPrices || [],
            isRevision: false,
        }
    }, [selectedProposal, activeTab])

    const draftCount = useMemo(() => proposals.filter(p => p.status === "DRAFT").length, [proposals])
    const underReviewCount = useMemo(() => proposals.filter(p => p.status === "UNDER_REVIEW" || p.pendingRevision != null).length, [proposals])
    const rejectedCount = useMemo(() => proposals.filter(p => p.status === "REJECTED").length, [proposals])
    const publishedCount = useMemo(() => proposals.filter(p => p.status === "PUBLISHED" || !p.status).length, [proposals])
    const allCount = proposals.length

    const filteredProposals = useMemo(() => {
        return proposals.filter(p => {
            if (activeTab === "ALL") return true
            if (activeTab === "DRAFT") return p.status === "DRAFT"
            if (activeTab === "UNDER_REVIEW") return p.status === "UNDER_REVIEW" || p.pendingRevision != null
            if (activeTab === "REJECTED") return p.status === "REJECTED"
            return p.status === "PUBLISHED" || !p.status
        })
    }, [proposals, activeTab])

    useEffect(() => {
        getCategories().then(setCategories).catch(() => { })
    }, [])

    useEffect(() => {
        if (!hostId) return
        setLoading(true)

        Promise.all([getProposals(hostId), getHostCommunityProfile().catch(() => null)])
            .then(([p, c]) => {
                setProposals(p)
                setCommunity(c)
                if (urlProposalId) {
                    const found = p.find(item => item.id === urlProposalId)
                    if (found) {
                        setSelectedProposal(found)
                    }
                }
            })
            .catch((err) => {
                console.error("Failed to load proposal/community details", err)
            })
            .finally(() => {
                setLoading(false)
            })
    }, [hostId, urlProposalId])

    // Poll community approval status while pending, so the create-proposal button
    // unlocks automatically once an admin approves it — no manual refresh needed.
    useEffect(() => {
        if (!hostId || !community || community.approvalStatus === "APPROVED") return
        const interval = setInterval(() => {
            getHostCommunityProfile()
                .then((c) => setCommunity(c))
                .catch(() => { })
        }, 15000)
        return () => clearInterval(interval)
    }, [hostId, community])

    useEffect(() => {
        let cancelled = false
        let objectUrl: string | null = null
        async function run() {
            if (!displayDetails?.docFile) {
                setPreviewUrl(null)
                setDocBlob(null)
                return
            }
            let mimeType = displayDetails.docType
            if (displayDetails.docName.toLowerCase().endsWith(".pdf")) {
                mimeType = "application/pdf"
            } else if (displayDetails.docName.toLowerCase().endsWith(".docx")) {
                mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            } else if (displayDetails.docName.toLowerCase().endsWith(".pptx")) {
                mimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
            }
            const blob = typeof displayDetails.docFile === "string"
                ? await (await fetch(displayDetails.docFile)).blob()
                : new Blob([displayDetails.docFile], { type: mimeType })
            if (cancelled) return
            objectUrl = URL.createObjectURL(blob)
            setDocBlob(blob)
            setPreviewUrl(objectUrl)
        }
        run().catch((err) => {
            console.error("Failed to load document preview", err)
            setPreviewUrl(null)
            setDocBlob(null)
        })
        return () => {
            cancelled = true
            if (objectUrl) URL.revokeObjectURL(objectUrl)
        }
    }, [displayDetails?.docFile])

    useEffect(() => {
        if (!displayDetails?.image) {
            setProjectImageUrl(null)
            return
        }
        if (typeof displayDetails.image === "string") {
            setProjectImageUrl(displayDetails.image)
            return
        }
        const url = URL.createObjectURL(displayDetails.image)
        setProjectImageUrl(url)
        return () => {
            URL.revokeObjectURL(url)
        }
    }, [displayDetails?.image])

    useEffect(() => {
        if (logoFile) {
            const url = URL.createObjectURL(logoFile)
            setLogoPreviewUrl(url)
            return () => {
                URL.revokeObjectURL(url)
            }
        }
    }, [logoFile])

    useEffect(() => {
        if (projImage) {
            const url = URL.createObjectURL(projImage)
            setProjImagePreview(url)
            return () => {
                URL.revokeObjectURL(url)
            }
        } else {
            setProjImagePreview(null)
        }
    }, [projImage])

    useEffect(() => {
        import("docx-preview").then((mod) => {
            setDocxRenderer(() => mod)
        })
        import("pptx-viewer").then((mod) => {
            setPptxViewerClass(() => mod.PPTXViewer)
        })
    }, [])

    useEffect(() => {
        if (!displayDetails || !previewContainerRef.current) return

        const isDoc = displayDetails.docType.includes("msword") ||
            displayDetails.docType.includes("wordprocessingml") ||
            displayDetails.docName.toLowerCase().endsWith(".doc") ||
            displayDetails.docName.toLowerCase().endsWith(".docx")

        const isPpt = displayDetails.docType.includes("presentation") ||
            displayDetails.docType.includes("powerpoint") ||
            displayDetails.docName.toLowerCase().endsWith(".ppt") ||
            displayDetails.docName.toLowerCase().endsWith(".pptx")

        if (!docBlob) return

        if (isDoc && docxRenderer) {
            previewContainerRef.current.innerHTML = '<div class="flex items-center justify-center h-full text-xs text-text-tertiary">Loading document preview...</div>'
            docxRenderer.renderAsync(docBlob, previewContainerRef.current)
                .catch((err: any) => {
                    console.error("Error rendering docx:", err)
                    if (previewContainerRef.current) {
                        previewContainerRef.current.innerHTML = '<div class="p-6 text-center text-xs text-red-500">Failed to load preview. Please download the file to view.</div>'
                    }
                })
        } else if (isPpt && pptxViewerClass) {
            previewContainerRef.current.innerHTML = '<div class="flex items-center justify-center h-full text-xs text-text-tertiary">Loading presentation preview...</div>'
            try {
                const viewer = new pptxViewerClass(previewContainerRef.current)
                viewer.load(docBlob)
                    .catch((err: any) => {
                        console.error("Error loading pptx:", err)
                        if (previewContainerRef.current) {
                            previewContainerRef.current.innerHTML = '<div class="p-6 text-center text-xs text-red-500">Failed to load preview. Please download the file to view.</div>'
                        }
                    })
            } catch (err) {
                console.error("Error initializing pptx viewer:", err)
            }
        }
    }, [displayDetails, docxRenderer, pptxViewerClass, docBlob])

    const isCommunityApproved = community?.approvalStatus === "APPROVED"

    const openProposalForm = (p?: StoredProposal) => {
        // Editing an already-created proposal is always allowed; only NEW proposal
        // creation is gated on the community profile being admin-approved.
        if (!p && !isCommunityApproved) {
            toast.error(
                community?.approvalStatus === "REJECTED"
                    ? "Your community profile was rejected by admin. Update it and wait for re-approval before creating a proposal."
                    : "Your community profile is still pending admin approval. You'll be able to create a proposal once it's approved.",
            )
            return
        }
        if (p) {
            const data = p.pendingRevision ? p.pendingRevision : p;
            setProjName(data.name)
            setProjAbout(data.about)
            setProjImage(null)
            setProjDate(data.date)
            setProjEndDate(data.endDate)
            setProjVenues(data.venues && data.venues.length > 0 ? data.venues : [""])
            setProjVenueCities(padVenueCities(data.venues && data.venues.length > 0 ? data.venues : [""], data.venueCities || []))
            setProjAudience(Array.isArray(data.audienceProfile) ? data.audienceProfile : data.audienceProfile ? data.audienceProfile.split(",").map(x => x.trim()).filter(Boolean) : [])
            setProjAgeGroup(data.ageGroup)
            setProjGuestCount(data.guestCount)
            setProjVideoUrl(data.videoUrl || "")
            setProjDoc(null)
            setSponsorPrices(data.sponsorPrices && data.sponsorPrices.length > 0 ? data.sponsorPrices : [{ name: "", price: "" }])
            setSelectedProposal(p)
        } else {
            setProjName("")
            setProjAbout("")
            setProjImage(null)
            setProjDate("")
            setProjEndDate("")
            setProjVenues([""])
            setProjVenueCities([""])
            setProjAudience([])
            setProjAgeGroup("")
            setProjGuestCount("")
            setProjDoc(null)
            setSponsorPrices([{ name: "", price: "" }])
            setSelectedProposal(null)
        }
        setNewAudience("")
        setShowProposalForm(true)
    }

    const handleProjImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            const allowedExtensions = [".jpg", ".jpeg", ".png"]
            const allowedTypes = ["image/jpeg", "image/jpg", "image/png"]
            const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
            const isValid = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)

            if (!isValid) {
                toast.error("Only JPG, JPEG or PNG images are accepted.")
                return
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image file size cannot exceed 5MB.")
                return
            }
            setProjImage(file)
        }
    }

    const handleProjDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            const allowedExtensions = [".pdf"]
            const allowedTypes = ["application/pdf"]
            const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
            const isValid = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)

            if (!isValid) {
                toast.error("Only PDF files are accepted.")
                return
            }
            if (file.size > 10 * 1024 * 1024) {
                toast.error("File size cannot exceed 10MB.")
                return
            }
            setProjDoc(file)
        }
    }

    async function handleGenerateProposalDraft() {
        const trimmed = proposalCopilotPrompt.trim()
        if (!trimmed || proposalCopilotLoading) return
        setProposalCopilotLoading(true)
        try {
            const draft = await generateProposalDraft(trimmed)
            setProjName(draft.name)
            setProjAbout(draft.about)
            setProjAudience(draft.audience_profile)
            setProjAgeGroup(draft.age_group)
            setProjGuestCount(draft.guest_count)
            setSponsorPrices(draft.sponsor_tiers.length > 0 ? draft.sponsor_tiers : [{ name: "", price: "" }])
            setProposalCopilotOpen(false)
            toast.success("Meetday filled in the proposal — review and adjust as needed.")
        } catch (err: unknown) {
            const status = (err as { response?: { status?: number } })?.response?.status
            if (status === 403) toast.error("Host role required to use Meetday AI.")
            else toast.error("Couldn't generate a draft right now. Please try again.")
        } finally {
            setProposalCopilotLoading(false)
        }
    }


    const handleProposalSubmit = async (e: React.FormEvent, forceStatus?: "DRAFT" | "UNDER_REVIEW" | "REJECTED" | "PUBLISHED") => {
        e.preventDefault()

        if (!projName.trim()) {
            toast.error("Project Name is required.")
            return
        }
        if (!projAbout.trim()) {
            toast.error("About description is required.")
            return
        }
        if (!projImage && !selectedProposal?.image) {
            toast.error("Project Image is required.")
            return
        }
        if (!projDate) {
            toast.error("Date is required.")
            return
        }
        if (!projEndDate) {
            toast.error("End date is required.")
            return
        }
        if (projEndDate < projDate) {
            toast.error("End date cannot be before the start date.")
            return
        }
        if (projVenues.every(v => !v.trim())) {
            toast.error("At least one venue is required.")
            return
        }
        if (projVenues.some((v, idx) => v.trim() && !projVenueCities[idx]?.trim())) {
            toast.error("Please add a city for every venue.")
            return
        }
        if (projAudience.length === 0) {
            toast.error("At least one Audience Profile tag is required.")
            return
        }
        if (!projAgeGroup.trim()) {
            toast.error("Age Group is required.")
            return
        }
        if (!projGuestCount.trim()) {
            toast.error("Number of Guests is required.")
            return
        }
        if (sponsorPrices.length === 0) {
            toast.error("At least one Sponsor Price entry is required.")
            return
        }
        for (const sp of sponsorPrices) {
            if (!sp.name.trim() || !sp.price.trim()) {
                toast.error("All Sponsor Price names and prices must be filled out.")
                return
            }
        }
        if (!projDoc && !selectedProposal) {
            toast.error("Proposal Document file is required.")
            return
        }

        setIsUploading(true)
        setUploadProgress(10)

        try {
            const filledVenueIdx = projVenues
                .map((v, idx) => (v.trim() ? idx : -1))
                .filter((idx) => idx !== -1)
            const payload: SponsorshipProposalPayload = {
                name: projName,
                about: projAbout,
                eventDate: projDate,
                eventEndDate: projEndDate,
                venues: filledVenueIdx.map((idx) => projVenues[idx].trim()),
                venueCities: filledVenueIdx.map((idx) => projVenueCities[idx]?.trim() || ""),
                audienceProfile: projAudience,
                ageGroup: projAgeGroup, guestCount: projGuestCount,
                sponsorTiers: sponsorPrices,
                ...(projVideoUrl.trim() && { videoUrl: projVideoUrl.trim() }),
            }

            if (projImage) {
                payload.imageKey = await uploadFileAndGetKey(projImage, "SPONSORSHIP_MEDIA")
            }
            setUploadProgress(50)
            if (projDoc) {
                payload.docKey = await uploadFileAndGetKey(projDoc, "SPONSORSHIP_DOCUMENT")
                payload.docName = projDoc.name
                payload.docType = projDoc.type
                payload.docSize = projDoc.size
            }
            setUploadProgress(80)

            let saved: ApiSponsorshipProposal
            if (selectedProposal) {
                saved = await updateSponsorshipProposal(selectedProposal.id, payload)
                if (forceStatus !== "DRAFT" && (saved.status === "DRAFT" || saved.status === "REJECTED")) {
                    saved = await submitSponsorshipProposal(selectedProposal.id)
                }
            } else {
                saved = await createSponsorshipProposal(payload)
                if (forceStatus !== "DRAFT") {
                    saved = await submitSponsorshipProposal(saved.id)
                }
            }

            const stored = mapApiProposalToStored(saved)
            setProposals((prev) => {
                const exists = prev.some((p) => p.id === stored.id)
                return exists ? prev.map((p) => (p.id === stored.id ? stored : p)) : [...prev, stored]
            })
            setUploadProgress(100)
            const wasEditing = !!selectedProposal
            resetProposalForm()
            if (wasEditing) {
                setSelectedProposal(stored)
            }
            toast.success("Proposal details saved successfully!")
        } catch (err: any) {
            console.error(err)
            const errMsg = err?.message || err?.response?.data?.message || "Failed to save proposal details."
            toast.error(errMsg)
        } finally {
            setIsUploading(false)
            setUploadProgress(0)
        }
    }

    const handleUpdateFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && selectedProposal) {
            const file = e.target.files[0]
            const allowedExtensions = [".pdf"]
            const allowedTypes = ["application/pdf"]
            const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
            const isValid = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)

            if (!isValid) {
                toast.error("Only PDF files are accepted.")
                return
            }
            if (file.size > 10 * 1024 * 1024) {
                toast.error("File size cannot exceed 10MB.")
                return
            }

            try {
                const docKey = await uploadFileAndGetKey(file, "SPONSORSHIP_DOCUMENT")
                const saved = await updateSponsorshipProposal(selectedProposal.id, {
                    docKey,
                    docName: file.name,
                    docType: file.type,
                    docSize: file.size,
                })
                const stored = mapApiProposalToStored(saved)
                setProposals((prev) => prev.map((p) => (p.id === stored.id ? stored : p)))
                setSelectedProposal(stored)
                toast.success("Document updated successfully!")
            } catch (err) {
                console.error(err)
                toast.error("Failed to update document.")
            }
        }
    }

    const submitProposalForApproval = async (proposal: StoredProposal) => {
        try {
            const saved = await submitSponsorshipProposal(proposal.id)
            const stored = mapApiProposalToStored(saved)
            setProposals((prev) => prev.map((p) => (p.id === stored.id ? stored : p)))
            if (selectedProposal?.id === stored.id) setSelectedProposal(stored)
            toast.success("Proposal submitted for admin approval!")
        } catch (err: any) {
            console.error(err)
            const errMsg = err?.message || err?.response?.data?.message || "Failed to submit proposal."
            toast.error(errMsg)
        }
    }

    const resetProposalForm = () => {
        setProjName("")
        setProjAbout("")
        setProjImage(null)
        setProjDate("")
        setProjEndDate("")
        setProjVenues([""])
        setProjVenueCities([""])
        setProjAudience([])
        setNewAudience("")
        setProjAgeGroup("")
        setProjGuestCount("")
        setProjDoc(null)
        setSponsorPrices([{ name: "", price: "" }])
        setShowProposalForm(false)
        setIsEditingInPlace(false)
    }

    const handleEditDetails = () => {
        if (!selectedProposal || !displayDetails) return
        setProjName(displayDetails.name)
        setProjAbout(displayDetails.about)
        setProjImage(null)
        setProjDate(displayDetails.date)
        setProjEndDate(displayDetails.endDate)
        setProjVenues(displayDetails.venues && displayDetails.venues.length > 0 ? displayDetails.venues : [""])
        setProjVenueCities(padVenueCities(displayDetails.venues && displayDetails.venues.length > 0 ? displayDetails.venues : [""], displayDetails.venueCities || []))
        setProjAudience(Array.isArray(displayDetails.audienceProfile) ? displayDetails.audienceProfile : displayDetails.audienceProfile ? displayDetails.audienceProfile.split(",").map(x => x.trim()).filter(Boolean) : [])
        setNewAudience("")
        setProjAgeGroup(displayDetails.ageGroup)
        setProjGuestCount(displayDetails.guestCount)
        setProjDoc(null)
        setSponsorPrices(displayDetails.sponsorPrices && displayDetails.sponsorPrices.length > 0 ? displayDetails.sponsorPrices : [{ name: "", price: "" }])

        setIsEditingInPlace(true)
    }

    const handleSaveInPlace = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedProposal) return

        if (!projName.trim()) {
            toast.error("Project Name is required.")
            return
        }
        if (!projAbout.trim()) {
            toast.error("About description is required.")
            return
        }
        if (!projDate) {
            toast.error("Date is required.")
            return
        }
        if (!projEndDate) {
            toast.error("End date is required.")
            return
        }
        if (projEndDate < projDate) {
            toast.error("End date cannot be before the start date.")
            return
        }
        if (projVenues.every(v => !v.trim())) {
            toast.error("At least one venue is required.")
            return
        }
        if (projVenues.some((v, idx) => v.trim() && !projVenueCities[idx]?.trim())) {
            toast.error("Please add a city for every venue.")
            return
        }
        if (projAudience.length === 0) {
            toast.error("At least one Audience Profile tag is required.")
            return
        }
        if (!projAgeGroup.trim()) {
            toast.error("Age Group is required.")
            return
        }
        if (!projGuestCount.trim()) {
            toast.error("Number of Guests is required.")
            return
        }

        if (sponsorPrices.length === 0) {
            toast.error("At least one Sponsor Price entry is required.")
            return
        }
        for (const sp of sponsorPrices) {
            if (!sp.name.trim() || !sp.price.trim()) {
                toast.error("All Sponsor Price names and prices must be filled out.")
                return
            }
        }

        try {
            const payload: SponsorshipProposalPayload = {
                name: projName,
                about: projAbout,
                eventDate: projDate,
                eventEndDate: projEndDate,
                venues: projVenues.map(v => v.trim()).filter(Boolean),
                venueCities: projVenueCities.map(v => v.trim()).filter(Boolean),
                audienceProfile: projAudience,
                ageGroup: projAgeGroup, guestCount: projGuestCount,
                sponsorTiers: sponsorPrices,
                ...(projVideoUrl.trim() && { videoUrl: projVideoUrl.trim() }),
            }
            if (projImage) {
                payload.imageKey = await uploadFileAndGetKey(projImage, "SPONSORSHIP_MEDIA")
            }

            const saved = await updateSponsorshipProposal(selectedProposal.id, payload)
            const stored = mapApiProposalToStored(saved)
            setProposals((prev) => prev.map((p) => (p.id === stored.id ? stored : p)))
            setSelectedProposal(stored)
            setIsEditingInPlace(false)
            setShowProjectModal(false)
            toast.success("Project details updated successfully!")
        } catch (err) {
            console.error(err)
            toast.error("Failed to save project details.")
        }
    }

    const handleDelete = (proposalId?: string) => {
        const idToDelete = proposalId || selectedProposal?.id
        if (!idToDelete) return

        if (confirm("Are you sure you want to delete this proposal?")) {
            deleteSponsorshipProposal(idToDelete)
                .then(() => {
                    setProposals((prev) => prev.filter((p) => p.id !== idToDelete))
                    setSelectedProposal(null)
                    resetProposalForm()
                    toast.success("Proposal deleted successfully.")
                })
                .catch((err) => {
                    console.error(err)
                    const errMsg = err?.response?.data?.message || err?.message || "Failed to delete proposal."
                    toast.error(errMsg)
                })
        }
    }

    // ─── Community Activation Handlers ──────────────────────────────────────────

    const openActivationModal = () => {
        if (community) {
            setCommunityName(community.name)
            setAboutCommunity(community.about)
            setCommunitySize(community.size)
            setAvgGuestCount(community.avgGuestCount)
            setExperiencesPerYear(community.experiencesPerYear)
            setCategoryIds(community.categories ? community.categories.map((c) => c.id) : ((community as any).categoryIds || []))
            setInstagram(profile?.socialLinks?.instagram || "")
            setLinkedin(profile?.socialLinks?.linkedin || "")
            setYoutube(profile?.socialLinks?.youtube || "")
            setPortfolio(profile?.socialLinks?.website || "")
            setLogoFile(null)
            setLogoPreviewUrl(community.logoUrl || communityLogoUrl)
        } else {
            setCommunityName("")
            setAboutCommunity("")
            setCommunitySize("")
            setAvgGuestCount("")
            setExperiencesPerYear("")
            setCategoryIds([])
            setInstagram(profile?.socialLinks?.instagram || "")
            setLinkedin(profile?.socialLinks?.linkedin || "")
            setYoutube(profile?.socialLinks?.youtube || "")
            setPortfolio(profile?.socialLinks?.website || "")
            setLogoFile(null)
            setLogoPreviewUrl(null)
        }
        setShowActivateModal(true)
    }

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            const allowedExtensions = [".jpg", ".jpeg", ".png"]
            const allowedTypes = ["image/jpeg", "image/jpg", "image/png"]
            const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
            const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)

            if (!isValidType) {
                toast.error("Only JPG, JPEG or PNG images are accepted for the logo.")
                return
            }

            const maxLogoSize = 5 * 1024 * 1024 // 5MB
            if (file.size > maxLogoSize) {
                toast.error("Logo file size cannot exceed 5MB.")
                return
            }

            setLogoFile(file)
        }
    }

    const handleActivationSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!communityName.trim()) {
            toast.error("Community Name is required.")
            return
        }

        if (!aboutCommunity.trim()) {
            toast.error("About the community description is required.")
            return
        }

        if (!logoFile && !community?.logoUrl) {
            toast.error("Logo image is required.")
            return
        }

        if (!communitySize.trim()) {
            toast.error("Community Size is required.")
            return
        }

        if (!avgGuestCount.trim()) {
            toast.error("Average Guest Count is required.")
            return
        }

        if (!experiencesPerYear.trim()) {
            toast.error("Number of experiences hosted in a year is required.")
            return
        }

        if (categoryIds.length === 0) {
            toast.error("At least one category must be selected.")
            return
        }

        if (!instagram.trim()) {
            toast.error("Instagram profile link is required.")
            return
        }

        try {
            const logoKey = logoFile
                ? await uploadFileAndGetKey(logoFile, "SPONSORSHIP_MEDIA")
                : community!.logoKey

            const payload: HostCommunityProfilePayload = {
                name: communityName,
                about: aboutCommunity,
                logoKey,
                size: communitySize,
                avgGuestCount: avgGuestCount,
                experiencesPerYear: experiencesPerYear,
                categoryIds: categoryIds,
            }

            const saved = await activateHostCommunityProfile(payload)
            setCommunity(saved)
            setShowActivateModal(false)

            try {
                const updated = await updateHostProfile({
                    socialLinks: {
                        instagram: instagram.trim() || undefined,
                        linkedin: linkedin.trim() || undefined,
                        youtube: youtube.trim() || undefined,
                        website: portfolio.trim() || undefined,
                    }
                })
                setProfile(updated)
            } catch (e) {
                console.error("Failed to sync social links to host profile", e)
            }
            toast.success(community ? "Community details updated!" : "Community activated successfully!")
        } catch (err) {
            console.error(err)
            toast.error("Failed to save activation details.")
        }
    }

    const handleDeactivate = async () => {
        if (!confirm("Are you sure you want to deactivate the community? Your sponsorship proposals will remain saved and reappear once you reactivate.")) return
        try {
            await deactivateHostCommunityProfile()
            setCommunity(null)
            setSelectedProposal(null)
            toast.success("Community deactivated.")
        } catch (err) {
            console.error(err)
            toast.error("Failed to deactivate community.")
        }
    }

    return (
        <div className="flex flex-col min-h-screen">
            {/* Top Nav / Subheader */}
            <div className="flex justify-between items-center px-8 py-4 border-b border-black/10 shrink-0">
                <p className="text-sm font-semibold text-black/50 mx-auto">
                    Welcome to <span className="text-[#EE2C2C] font-bold">Meetday</span>
                </p>
            </div>

            <div className={clsx(
                "flex-1 min-h-0 w-full overflow-hidden relative bg-white",
                isSplitLayout ? "md:grid md:grid-cols-[65%_35%]" : "flex flex-col"
            )}>
                <div className={clsx(
                    "px-4 lg:px-6 py-6 lg:py-8 flex-1 flex flex-col gap-8 overflow-y-auto h-full transition-all duration-300",
                    isSplitLayout ? "max-w-3xl w-full mx-auto" : "max-w-2xl mx-auto w-full"
                )}>
                    {loading ? (
                        <>
                            <div className="mb-6">
                                <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-black leading-tight">Sponsorships</h1>
                                <p className="text-sm font-semibold text-black/50 mt-1.5">Activate your community and upload your proposal</p>
                            </div>
                            <div className="bg-white border-2 border-black rounded-[20px] p-12 text-center max-w-2xl">
                                <p className="text-sm font-semibold text-black/50">Loading details...</p>
                            </div>
                        </>
                    ) : !community ? (
                        <div className={clsx(
                            "flex flex-col gap-8 w-full",
                            showActivateModal ? "max-w-none" : "max-w-2xl mx-auto"
                        )}>
                            {/* Welcome header */}
                            <div className="mb-2">
                                <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-black leading-tight mt-1">
                                    My Sponsorships
                                </h1>
                                <p className="text-sm font-semibold text-black/50 mt-1.5">
                                    For all your proposals
                                </p>
                            </div>

                            {/* Activation banner */}
                            <div className="bg-white border-[3px] border-black rounded-[20px] p-6 flex flex-col md:flex-row md:items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <h3 className="font-heading font-black text-black text-lg">
                                        Uh-Oh! Looks like you haven't activated your community yet.
                                    </h3>
                                    <p className="text-sm font-semibold text-black/50">
                                        Activate your community before getting started on sponsorships and approvals.
                                    </p>
                                </div>
                                <button
                                    onClick={openActivationModal}
                                    className="bg-[#EE2C2C] text-white text-[9px] font-black px-4 py-2.5 rounded-lg uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[#1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all select-none shrink-0 self-start md:self-auto"
                                >
                                    ACTIVATE NOW
                                </button>
                            </div>

                            {/* Dashed placeholder */}
                            <div className="border-[3px] border-dashed border-black/30 rounded-[20px] p-12 flex flex-col items-center justify-center text-center gap-2 mt-2 bg-transparent">
                                <p className="font-heading font-black text-black/40 text-lg">
                                    No approved sponsorships yet
                                </p>
                                <p className="text-sm font-semibold text-black/30">
                                    Activate your community before getting approvals.
                                </p>
                            </div>
                        </div>
                    ) : selectedProposal && !showProposalForm ? (
                        /* Proposal Details Section - rendered inline instead of a modal! */
                        <div className="flex flex-col gap-6 animate-in fade-in duration-150">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-2 border-b border-border-default gap-4">
                                <div className="flex flex-col gap-1">
                                    <button
                                        onClick={() => setSelectedProposal(null)}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-brand hover:text-text-brand-hover transition-colors mb-1"
                                    >
                                        ← Back to Sponsorships
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-heading-sm font-semibold text-text-primary">{displayDetails?.name}</h1>
                                        {displayDetails?.isRevision && (
                                            <span className="text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-badge uppercase tracking-wider">
                                                Revision Under Review
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-caption text-text-tertiary">Project Overview & Details</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <input
                                        ref={updateDocInputRef}
                                        type="file"
                                        accept=".pdf,application/pdf"
                                        className="hidden"
                                        onChange={handleUpdateFile}
                                    />
                                    {selectedProposal.status === "PUBLISHED" && (
                                        <button
                                            type="button"
                                            title="Share with brands"
                                            className="bg-white text-black border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider select-none flex items-center gap-1.5"
                                            onClick={() => {
                                                const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" && window.location.origin.includes("localhost") ? window.location.origin : "https://app.meetday.ai")
                                                const link = `${appUrl}/brand/proposal/${selectedProposal.id}`
                                                navigator.clipboard.writeText(link)
                                                    .then(() => toast.success("Link copied! Share it with brands."))
                                                    .catch(() => toast.error("Failed to copy link."))
                                            }}
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 14l5-5-5-5M20 9H9a4 4 0 00-4 4v6" />
                                            </svg>
                                            Share
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="bg-[#EE2C2C] text-white border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider select-none"
                                        onClick={() => {
                                            openProposalForm(selectedProposal)
                                        }}
                                    >
                                        Edit Details
                                    </button>
                                    {(selectedProposal.status === "DRAFT" || selectedProposal.status === "REJECTED") && (
                                        <button
                                            type="button"
                                            className="bg-[#6C32D1] text-white border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider select-none"
                                            onClick={() => {
                                                submitProposalForApproval(selectedProposal)
                                                setSelectedProposal(prev => prev ? { ...prev, status: "UNDER_REVIEW" } : null)
                                            }}
                                        >
                                            Submit for Approval
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="bg-white text-black border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider select-none"
                                        onClick={() => updateDocInputRef.current?.click()}
                                    >
                                        Update File
                                    </button>
                                    <button
                                        type="button"
                                        className="bg-red-50 text-[#EE2C2C] border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider select-none"
                                        onClick={() => {
                                            handleDelete(selectedProposal.id);
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>

                            {/* Banners */}
                            {selectedProposal.status === "REJECTED" && selectedProposal.adminRejectionRemark && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-action text-xs text-red-700">
                                    <span className="font-semibold">Rejected by admin: </span>
                                    {selectedProposal.adminRejectionRemark}
                                </div>
                            )}
                            {displayDetails?.isRevision && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-action text-xs text-amber-800 font-medium">
                                    You are viewing the pending revision of this proposal, which is under review by the admin.
                                </div>
                            )}
                            {(selectedProposal.pendingRevision != null && !displayDetails?.isRevision) && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-action text-xs text-amber-800 font-medium flex items-center justify-between">
                                    <span>This proposal has a pending revision under review by the admin.</span>
                                    <button onClick={() => setActiveTab("UNDER_REVIEW")} className="text-text-brand hover:underline font-semibold">
                                        View Revision
                                    </button>
                                </div>
                            )}

                            {/* Body */}
                            <div className="flex flex-col gap-6">
                                {/* Top Row: Logo left, Metadata right — always side by side */}
                                <div className="flex flex-row gap-4 items-start">
                                    {projectImageUrl && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={projectImageUrl} alt={displayDetails?.name} className="size-16 sm:size-36 object-cover rounded-xl border border-border-default shadow-sm shrink-0" />
                                    )}
                                    <div className="flex-1 bg-surface-card-muted border border-border-default rounded-action p-4 w-full flex flex-col justify-between gap-4 min-w-0">
                                        {/* Row 1: Start date | End date, Row 2: Venue & City */}
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Start Date */}
                                            {(() => {
                                                const startParts = displayDetails?.date ? displayDetails.date.split("-") : [];
                                                const startDisplay = startParts.length === 3 ? `${startParts[2]}/${startParts[1]}/${startParts[0]}` : displayDetails?.date;
                                                return startDisplay ? (
                                                    <div>
                                                        <p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">Start</p>
                                                        <div className="mt-1">
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black bg-[#EE2C2C] text-white border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                                                                {startDisplay}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : null;
                                            })()}

                                            {/* End Date */}
                                            {(() => {
                                                const startParts = displayDetails?.date ? displayDetails.date.split("-") : [];
                                                const startDisplay = startParts.length === 3 ? `${startParts[2]}/${startParts[1]}/${startParts[0]}` : displayDetails?.date;
                                                const endParts = displayDetails?.endDate ? displayDetails.endDate.split("-") : [];
                                                const endDisplay = endParts.length === 3 ? `${endParts[2]}/${endParts[1]}/${endParts[0]}` : displayDetails?.endDate;
                                                return endDisplay && endDisplay !== startDisplay ? (
                                                    <div>
                                                        <p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">End</p>
                                                        <div className="mt-1">
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black bg-[#EE2C2C] text-white border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                                                                {endDisplay}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : null;
                                            })()}

                                            {/* Venue & City — full width second row */}
                                            <div className="col-span-2">
                                                <p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">Venue &amp; City</p>
                                                <div className="flex flex-col gap-2 mt-1">
                                                    {(displayDetails?.venues && displayDetails.venues.length > 0 ? displayDetails.venues : [displayDetails?.venue || ""])
                                                        .map((v, idx) => {
                                                            const c = displayDetails?.venueCities?.[idx] || (idx === 0 ? displayDetails?.city : undefined)
                                                            if (!v.trim()) return null
                                                            return (
                                                                <div key={idx} className="flex flex-row flex-wrap items-center gap-2">
                                                                    {c && (
                                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-[#EE2C2C] text-white border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap">
                                                                            {c}
                                                                        </span>
                                                                    )}
                                                                    <span className="text-xs font-semibold text-text-secondary">{v}</span>
                                                                </div>
                                                            )
                                                        })}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Divider */}
                                        <hr className="border-border-default/15" />
                                        {/* Row 2: Guests, Age Group — 2 cols on all screens */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">Guests</p>
                                                <div className="flex mt-1">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-[#EE2C2C] text-white border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                                                        {displayDetails?.guestCount} Guests
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">Age Group</p>
                                                <div className="flex mt-1">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-[#EE2C2C] text-white border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                                                        {displayDetails?.ageGroup} Years
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {displayDetails?.videoUrl && (
                                            <div className="col-span-1 md:col-span-2">
                                                <p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">Proposal Video</p>
                                                <div className="mt-1">
                                                    <a href={displayDetails.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#6C32D1] text-white border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:bg-[#5922b8] transition-colors">
                                                        Watch Video ↗
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                        {/* Divider */}
                                        <hr className="border-border-default/15" />
                                        {/* Row 3: Audience */}
                                        <div>
                                            <p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">Audience</p>
                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                {(() => {
                                                    const rawAud = displayDetails?.audienceProfile;
                                                    const list = Array.isArray(rawAud) ? rawAud : (typeof rawAud === "string" ? rawAud.split(",").map(s => s.trim()) : []);
                                                    return list.map((aud, i) => {
                                                        if (!aud) return null;
                                                        return (
                                                            <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-[#F5C343] text-black border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider">
                                                                {aud}
                                                            </span>
                                                        )
                                                    }).filter(Boolean);
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Below Top Row: About Project */}
                                <div className="bg-surface-card border border-border-default rounded-action p-5">
                                    <h4 className="text-sm font-bold text-text-primary mb-2">About the Project</h4>
                                    <p className="text-body-sm text-text-secondary leading-relaxed whitespace-pre-wrap break-words">{displayDetails?.about}</p>
                                </div>

                                {displayDetails?.sponsorPrices && displayDetails.sponsorPrices.length > 0 && (
                                    <div className="bg-surface-card border border-border-default rounded-action p-5 flex flex-col gap-3">
                                        <h4 className="text-sm font-bold text-text-primary">Sponsor Pricing Tiers</h4>
                                        <div className="flex flex-wrap gap-3">
                                            {displayDetails.sponsorPrices.map((sp: any, idx: number) => (
                                                <div key={idx} className="flex gap-2 text-sm border border-border-default/45 rounded-xl px-4 py-2 bg-surface-card-muted">
                                                    <span className="text-text-secondary font-medium">{sp.name}:</span>
                                                    <span className="text-text-brand font-semibold">
                                                        {sp.price?.toString().startsWith("₹") ? sp.price : `₹${sp.price}`}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {/* Bottom - PDF Preview */}
                                <div className="flex flex-col gap-3">
                                    <h4 className="text-sm font-bold text-text-primary">Document Preview</h4>
                                    {displayDetails?.docType?.includes("pdf") || displayDetails?.docName?.toLowerCase().endsWith(".pdf") ? (
                                        <div className="border border-border-default rounded-action overflow-hidden bg-surface-card shadow-sm h-[80vh] md:h-[750px] relative">
                                            {previewUrl ? (
                                                <PdfViewer url={previewUrl} />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-xs text-text-tertiary">Loading document preview...</div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="border border-border-default rounded-action bg-surface-card shadow-sm h-[750px] flex flex-col bg-white overflow-hidden">
                                            {/* Container for DOCX/PPTX Client-side rendering */}
                                            <div ref={previewContainerRef} className="flex-1 overflow-auto p-6 docx-preview-container select-text" />
                                            {/* Download toolbar */}
                                            <div className="h-12 border-t border-border-default bg-surface-card-muted flex items-center justify-between px-4 shrink-0">
                                                <span className="text-[10px] text-text-tertiary truncate max-w-xs font-medium">{displayDetails?.docName ?? ""}</span>
                                                <Button
                                                    variant="secondary"
                                                    size="xs"
                                                    radius="md"
                                                    onClick={() => {
                                                        if (!previewUrl) return
                                                        const link = document.createElement("a")
                                                        link.href = previewUrl
                                                        link.download = displayDetails?.docName ?? ""
                                                        document.body.appendChild(link)
                                                        link.click()
                                                        document.body.removeChild(link)
                                                    }}
                                                >
                                                    Download Original
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Proposal section always available; community profile is optional. */
                        <div className="flex flex-col gap-8">
                            {showProposalForm ? (
                                /* Render the inline Create Proposal Form exactly like the user's mockup! */
                                <div className="animate-in fade-in duration-150 flex flex-col gap-6">
                                    <div className="flex justify-between items-center shrink-0">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 cursor-pointer text-black/60 hover:text-black" onClick={resetProposalForm}>
                                                <span className="text-xl font-bold">←</span>
                                                <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-black leading-tight">
                                                    {selectedProposal ? "Edit Proposal" : "Create Proposal"}
                                                </h1>
                                            </div>
                                            <p className="text-sm font-semibold text-black/50 mt-1">
                                                Provide details and upload your proposal document
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={(e) => handleProposalSubmit(e, "DRAFT")}
                                                className="px-4 py-2 bg-black/5 hover:bg-black/10 border border-black/10 text-xs font-bold rounded-lg text-black transition-colors"
                                            >
                                                Save As Draft
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    const nextStatus = selectedProposal ? selectedProposal.status : "UNDER_REVIEW"
                                                    handleProposalSubmit(e, nextStatus)
                                                }}
                                                className="bg-[#EE2C2C] text-white text-[9px] font-black px-4 py-2.5 rounded-lg uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[#1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all select-none"
                                            >
                                                SUBMIT
                                            </button>
                                        </div>
                                    </div>

                                    {/* Enclose the form in a neobrutalist dashed border box */}
                                    <form onSubmit={handleProposalSubmit} className="border-[3px] border-dashed border-black/30 rounded-[28px] p-6 bg-white flex flex-col gap-6 w-full">
                                        {/* AI assist */}
                                        {!selectedProposal && (
                                            <div className="w-full">
                                                {!proposalCopilotOpen ? (
                                                    <div
                                                        onClick={() => setProposalCopilotOpen(true)}
                                                        className="group border-[3px] border-black bg-purple-100 hover:bg-purple-200 p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer flex flex-col md:flex-row items-center justify-between gap-4 select-none"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-[#EE2C2C] text-white shrink-0 transition-transform duration-300 p-2" style={{ animation: 'aiIconPulse 2s ease-in-out infinite' }}>
                                                                <Icon as={AiAvatarSvg} size="2xl" color="inherit" className="w-full h-full" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-heading text-sm sm:text-base font-extrabold text-black uppercase tracking-wider">
                                                                    Start with our <span className="text-[#EE2C2C]">AI Companion</span>
                                                                </h3>
                                                                <p className="text-[11px] sm:text-xs font-semibold text-black/65 mt-0.5">
                                                                    Describe your event in a few words, we fill the rest.
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 bg-black text-white text-sm font-black px-4 py-2.5 rounded-lg uppercase tracking-wider border-2 border-black group-hover:bg-[#EE2C2C] transition-colors duration-200 shrink-0">
                                                            <Icon as={MagicStickSvg} size="sm" color="inherit" />
                                                            Draft with AI
                                                        </div>
                                                    </div>
                                                ) : proposalCopilotLoading ? (
                                                    <div className="border-[3px] border-black bg-purple-100 p-8 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center gap-5 text-center min-h-[180px]">
                                                        <div className="relative flex items-center justify-center h-16 w-16">
                                                            <div className="absolute inset-0 rounded-full border-4 border-dashed border-[#EE2C2C]/40 animate-spin" style={{ animationDuration: '4s' }} />
                                                            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[#EE2C2C] text-white p-2">
                                                                <Icon as={AiAvatarSvg} size="xl" color="inherit" className="w-full h-full" />
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-1.5">
                                                            <h4 className="font-heading text-lg font-black text-black tracking-wide">
                                                                {loadingMessages[loadingMessageIndex]}
                                                            </h4>
                                                            <p className="text-sm text-purple-700 font-bold tracking-tight">
                                                                Whipping up pricing tiers, target audiences, and descriptions...
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="border-[3px] border-black bg-purple-100 p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-[#EE2C2C] text-white shrink-0 p-1.5">
                                                                <Icon as={AiAvatarSvg} size="xl" color="inherit" className="w-full h-full" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-heading text-sm font-extrabold text-black uppercase tracking-wider">
                                                                    Meetday AI Companion
                                                                </h3>
                                                                <p className="text-xs font-bold text-purple-700">
                                                                    Generate structure and fields from your description
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            <label className="text-sm font-bold text-black">
                                                                Describe your sponsorship opportunity
                                                            </label>
                                                            <textarea
                                                                value={proposalCopilotPrompt}
                                                                onChange={(e) => setProposalCopilotPrompt(e.target.value)}
                                                                placeholder="e.g. We run a monthly rooftop networking meetup for startup founders in Bangalore, around 200 people attend each time."
                                                                rows={3}
                                                                disabled={proposalCopilotLoading}
                                                                className="px-4 py-2.5 rounded-xl border-2 border-black/30 bg-white/80 text-black outline-none focus:border-black text-sm transition-colors resize-none disabled:opacity-50"
                                                            />
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between mt-1">
                                                                <p className="text-xs font-bold text-black/60">
                                                                    {proposalCopilotPrompt.trim().length < 20
                                                                        ? "Write a bit more — at least 20 characters to continue."
                                                                        : <span className="text-purple-700">Ready — click below when you&apos;re done writing.</span>}
                                                                </p>
                                                                <div className="flex items-center gap-2 self-end shrink-0">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setProposalCopilotOpen(false)}
                                                                        disabled={proposalCopilotLoading}
                                                                        className="px-3 py-2 text-sm font-black text-black/60 hover:text-black transition-colors disabled:opacity-50"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleGenerateProposalDraft}
                                                                        disabled={proposalCopilotLoading || proposalCopilotPrompt.trim().length < 20}
                                                                        className="flex items-center gap-2 bg-black text-white text-sm font-black px-4 py-2.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#EE2C2C] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-50 transition-all select-none"
                                                                    >
                                                                        <Icon as={MagicStickSvg} size="sm" color="inherit" />
                                                                        Start Cooking
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Name */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-bold text-black">Project Name *</label>
                                            <input
                                                type="text"
                                                required
                                                value={projName}
                                                onChange={(e) => setProjName(e.target.value)}
                                                placeholder="e.g. Annual Charity Gala"
                                                className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
                                            />
                                        </div>

                                        {/* About */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-bold text-black">About the project *</label>
                                            <textarea
                                                required
                                                value={projAbout}
                                                onChange={(e) => setProjAbout(e.target.value)}
                                                placeholder="Describe your project's details, format, and goals..."
                                                rows={15}
                                                className="p-3 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors resize-none"
                                            />
                                        </div>

                                        {/* Logo/Image Upload */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-bold text-black">Project Logo *</label>
                                            <div className="flex items-center gap-4">
                                                {projImagePreview ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={projImagePreview} alt="Preview" className="size-16 rounded-xl object-cover border border-black/10" />
                                                ) : selectedProposal?.image ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={typeof selectedProposal.image === "string" ? selectedProposal.image : URL.createObjectURL(selectedProposal.image)} alt="Current" className="size-16 rounded-xl object-cover border border-black/10" />
                                                ) : (
                                                    <div className="size-16 rounded-xl bg-slate-50 border border-dashed border-black/10 flex items-center justify-center text-black/30 text-xs">
                                                        No Image
                                                    </div>
                                                )}
                                                <div className="flex flex-col gap-1">
                                                    <input
                                                        ref={projImageInputRef}
                                                        type="file"
                                                        accept="image/jpeg,image/jpg,image/png"
                                                        className="hidden"
                                                        onChange={handleProjImageChange}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => projImageInputRef.current?.click()}
                                                        className="px-4 py-2 bg-white border border-black rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50 transition-colors"
                                                    >
                                                        Choose Image
                                                    </button>
                                                    <span className="text-[10px] text-black/40">JPEG, JPG, PNG accepted (1:1 ratio, max 5MB).</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Date */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-bold text-black">Start Date *</label>
                                                <input
                                                    type="date"
                                                    required
                                                    value={projDate}
                                                    onChange={(e) => setProjDate(e.target.value)}
                                                    className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-bold text-black">End Date *</label>
                                                <input
                                                    type="date"
                                                    required
                                                    min={projDate || undefined}
                                                    value={projEndDate}
                                                    onChange={(e) => setProjEndDate(e.target.value)}
                                                    className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
                                                />
                                            </div>
                                        </div>

                                        {/* Venues */}
                                        <div className="flex flex-col gap-3">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs font-bold text-black">Venue *</label>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setProjVenues([...projVenues, ""])
                                                        setProjVenueCities([...projVenueCities, ""])
                                                    }}
                                                    className="text-xs font-bold text-black hover:underline"
                                                >
                                                    + Add Venue
                                                </button>
                                            </div>
                                            {projVenues.map((v, idx) => (
                                                <div key={idx} className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center p-3 sm:p-0 bg-slate-100/50 sm:bg-transparent rounded-xl border border-black/5 sm:border-0 relative">
                                                    <div className="w-full sm:flex-1">
                                                        <AddressAutocompleteInput
                                                            value={v}
                                                            error={false}
                                                            onChange={(val) => {
                                                                const updated = [...projVenues]
                                                                updated[idx] = val
                                                                setProjVenues(updated)
                                                            }}
                                                            onPlaceSelect={(fields) => {
                                                                const updated = [...projVenues]
                                                                updated[idx] = fields.venueName || fields.fullAddress
                                                                setProjVenues(updated)
                                                                if (fields.city && !projVenueCities[idx]?.trim()) {
                                                                    const updatedCities = [...projVenueCities]
                                                                    updatedCities[idx] = fields.city
                                                                    setProjVenueCities(updatedCities)
                                                                }
                                                            }}
                                                            placeholder="e.g. Palace of Fine Arts"
                                                        />
                                                    </div>
                                                    <div className="w-full sm:w-40">
                                                        <input
                                                            type="text"
                                                            value={projVenueCities[idx] || ""}
                                                            onChange={(e) => {
                                                                const updated = [...projVenueCities]
                                                                updated[idx] = e.target.value
                                                                setProjVenueCities(updated)
                                                            }}
                                                            placeholder="City *"
                                                            className="w-full h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
                                                        />
                                                    </div>
                                                    {projVenues.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setProjVenues(projVenues.filter((_, i) => i !== idx))
                                                                setProjVenueCities(projVenueCities.filter((_, i) => i !== idx))
                                                            }}
                                                            className="absolute top-2 right-2 sm:relative sm:top-0 sm:right-0 text-red-500 hover:text-red-700 font-bold text-lg p-1"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Audience Profile */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-bold text-black">Audience Profile *</label>
                                            <div className="flex gap-2 min-w-0">
                                                <input
                                                    type="text"
                                                    value={newAudience}
                                                    onChange={(e) => setNewAudience(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault()
                                                            const trimmed = newAudience.trim()
                                                            if (trimmed && !projAudience.includes(trimmed)) {
                                                                setProjAudience([...projAudience, trimmed])
                                                                setNewAudience("")
                                                            }
                                                        }
                                                    }}
                                                    placeholder="e.g. Tech Founders"
                                                    className="min-w-0 flex-1 h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const trimmed = newAudience.trim()
                                                        if (trimmed && !projAudience.includes(trimmed)) {
                                                            setProjAudience([...projAudience, trimmed])
                                                            setNewAudience("")
                                                        }
                                                    }}
                                                    className="shrink-0 px-4 py-2 bg-white border border-black rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50 transition-colors"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                            {projAudience.length > 0 ? (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {projAudience.map((aud, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-black/5 text-black border border-black/10"
                                                        >
                                                            {aud}
                                                            <button
                                                                type="button"
                                                                onClick={() => setProjAudience(projAudience.filter((_, i) => i !== idx))}
                                                                className="text-black/40 hover:text-black font-bold text-[10px]"
                                                            >
                                                                ✕
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-[10px] text-black/40">Add at least one targeted audience profile.</p>
                                            )}
                                        </div>

                                        {/* Age Group, Number of Guests */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-bold text-black">Age Group *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={projAgeGroup}
                                                    onChange={(e) => setProjAgeGroup(e.target.value)}
                                                    placeholder="e.g. 21-40"
                                                    className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-bold text-black">Guests Count *</label>
                                                <input
                                                    type="number"
                                                    required
                                                    min="1"
                                                    value={projGuestCount}
                                                    onChange={(e) => setProjGuestCount(e.target.value)}
                                                    placeholder="e.g. 150"
                                                    className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
                                                />
                                            </div>
                                        </div>

                                        {/* Video URL (Optional) */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-bold text-black">Proposal Video Link <span className="text-black/40 font-medium">(optional)</span></label>
                                            <input
                                                type="url"
                                                value={projVideoUrl}
                                                onChange={(e) => setProjVideoUrl(e.target.value)}
                                                placeholder="e.g. https://youtube.com/watch?v=..."
                                                className="h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
                                            />
                                            <span className="text-[10px] text-black/40">Paste a YouTube, Vimeo, or any public video link for your proposal</span>
                                        </div>

                                        {/* Document Upload */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-bold text-black">Proposal Document *</label>
                                            <div className="flex items-center gap-4">
                                                <div className="size-16 rounded-xl bg-slate-50 border border-dashed border-black/10 flex items-center justify-center text-black/30">
                                                    📄
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <input
                                                        ref={projDocInputRef}
                                                        type="file"
                                                        accept=".pdf,application/pdf"
                                                        className="hidden"
                                                        onChange={handleProjDocChange}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => projDocInputRef.current?.click()}
                                                        className="px-4 py-2 bg-white border border-black rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50 transition-colors"
                                                    >
                                                        Choose Document
                                                    </button>
                                                    <span className="text-[10px] text-black/40">PDF accepted. Max 10MB.</span>
                                                    {projDoc ? (
                                                        <span className="text-xs font-semibold text-black truncate max-w-xs">{projDoc.name}</span>
                                                    ) : selectedProposal?.docName ? (
                                                        <span className="text-xs font-semibold text-black truncate max-w-xs">{selectedProposal.docName}</span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sponsor pricing slots */}
                                        <div className="flex flex-col gap-3">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs font-bold text-black">Sponsorship Slots *</label>
                                                <button
                                                    type="button"
                                                    onClick={() => setSponsorPrices([...sponsorPrices, { name: "", price: "" }])}
                                                    className="text-xs font-bold text-black hover:underline"
                                                >
                                                    + Add Slot
                                                </button>
                                            </div>
                                            {sponsorPrices.map((sp, idx) => (
                                                <div key={idx} className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center p-3 sm:p-0 bg-slate-100/50 sm:bg-transparent rounded-xl border border-black/5 sm:border-0 relative">
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="Slot Name (e.g., Title Sponsor)"
                                                        value={sp.name}
                                                        onChange={(e) => {
                                                            const updated = [...sponsorPrices]
                                                            updated[idx].name = e.target.value
                                                            setSponsorPrices(updated)
                                                        }}
                                                        className="w-full sm:flex-1 h-10 px-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
                                                    />
                                                    <div className="relative w-full sm:flex-1">
                                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-black/40 select-none">₹</span>
                                                        <input
                                                            type="text"
                                                            required
                                                            placeholder="Price (e.g., 50,000)"
                                                            value={sp.price}
                                                            onChange={(e) => {
                                                                const updated = [...sponsorPrices]
                                                                updated[idx].price = e.target.value
                                                                setSponsorPrices(updated)
                                                            }}
                                                            className="w-full h-10 pl-8 pr-4 rounded-xl border border-black/10 bg-slate-50 text-black outline-none focus:border-black hover:border-black/30 text-sm transition-colors"
                                                        />
                                                    </div>
                                                    {sponsorPrices.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setSponsorPrices(sponsorPrices.filter((_, i) => i !== idx))}
                                                            className="absolute top-2 right-2 sm:relative sm:top-0 sm:right-0 text-red-500 hover:text-red-700 font-bold text-lg p-1"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </form>
                                </div>
                            ) : (
                                <>
                                    {/* Header */}
                                    <div className="flex justify-between items-center mb-2">
                                        <div>
                                            <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-black leading-tight mt-1">
                                                My Sponsorships
                                            </h1>
                                            <p className="text-sm font-semibold text-black/50 mt-1.5">
                                                For all your proposals
                                            </p>
                                        </div>
                                        {proposals.length > 0 && (
                                            <button
                                                onClick={() => openProposalForm()}
                                                title={!isCommunityApproved ? "Your community profile must be admin-approved first" : undefined}
                                                className={clsx(
                                                    "text-white text-[9px] font-black px-4 py-2.5 rounded-lg uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[#1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all select-none cursor-pointer",
                                                    isCommunityApproved ? "bg-[#EE2C2C]" : "bg-black/30",
                                                )}
                                            >
                                                {isCommunityApproved ? "+ CREATE NEW" : "PENDING APPROVAL"}
                                            </button>
                                        )}
                                    </div>

                                    {/* Proposal upload/display section */}
                                    <div className="flex flex-col gap-4 w-full">
                                        {isUploading ? (
                                            <div className="bg-surface-card border border-border-default rounded-action p-8 text-center flex flex-col items-center w-full max-w-2xl mx-auto">
                                                <div className="w-16 h-16 rounded-full bg-surface-brand-soft flex items-center justify-center mb-4 animate-bounce">
                                                    <Icon as={UploadSvg} size="lg" color="brand" />
                                                </div>
                                                <h3 className="text-label-lg font-semibold text-text-primary mb-2">Saving Proposal</h3>
                                                <p className="text-caption text-text-secondary mb-6">Processing details and document file, please wait...</p>
                                                <div className="w-full max-w-xs bg-surface-card-muted rounded-full h-2 overflow-hidden mb-2">
                                                    <div
                                                        className="bg-action-primary h-full transition-all duration-150"
                                                        style={{ width: `${uploadProgress}%` }}
                                                    />
                                                </div>
                                                <span className="text-label-sm font-semibold text-text-brand">{uploadProgress}%</span>
                                            </div>
                                        ) : proposals.length > 0 ? (
                                            /* State 3: Show list/grid of proposals overview cards styled like My Events */
                                            <div className="flex flex-col gap-6 w-full animate-in fade-in duration-150">

                                                {/* Mobile Community Header */}
                                                {community && (
                                                    <div
                                                        onClick={() => setShowCommunityMobilePanel(true)}
                                                        className="sm:hidden flex items-center gap-3 p-3 bg-slate-50 border-[2px] border-black rounded-xl cursor-pointer hover:bg-slate-100 transition-all"
                                                    >
                                                        {communityLogoUrl ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={communityLogoUrl}
                                                                alt={community.name}
                                                                className="size-8 rounded-lg object-cover border border-black/20 shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="size-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm border border-black/20 shrink-0">
                                                                {community.name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[9px] font-bold text-black/50 leading-none">COMMUNITY PROFILE</p>
                                                            <p className="text-xs font-black text-black truncate mt-1">{community.name}</p>
                                                        </div>
                                                        <span className="text-black/40 text-xs font-bold">➔</span>
                                                    </div>
                                                )}

                                                {/* Status tabs */}
                                                <div className="flex flex-row overflow-x-auto whitespace-nowrap scrollbar-none gap-3 sm:gap-5 border-b border-black/10 pb-2 mb-4 w-full">
                                                    {[
                                                        { value: "ALL", label: `ALL (${allCount})` },
                                                        { value: "DRAFT", label: `DRAFT (${draftCount})` },
                                                        { value: "UNDER_REVIEW", label: `UNDER REVIEW (${underReviewCount})` },
                                                        { value: "PUBLISHED", label: `PUBLISHED (${publishedCount})` },
                                                        { value: "REJECTED", label: `REJECTED (${rejectedCount})` }
                                                    ].map((tab) => {
                                                        const isActive = activeTab === tab.value
                                                        return (
                                                            <button
                                                                key={tab.value}
                                                                onClick={() => setActiveTab(tab.value as any)}
                                                                className={clsx(
                                                                    "text-[8px] sm:text-[10px] font-black uppercase tracking-wider pb-2 relative transition-colors shrink-0",
                                                                    isActive ? "text-[#EE2C2C]" : "text-black/40 hover:text-black"
                                                                )}
                                                            >
                                                                {tab.label}
                                                                {isActive && (
                                                                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#EE2C2C]" />
                                                                )}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                                {filteredProposals.length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center py-20 text-center gap-3 border-[3px] border-dashed border-black/30 rounded-[20px]">
                                                        <p className="text-label-md font-semibold text-black/50">No proposals found</p>
                                                        <p className="text-body-sm text-black/30 max-w-xs">
                                                            No proposals in this category yet.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                                                        {filteredProposals.map((p) => {
                                                            const isViewingRevision = p.pendingRevision != null;
                                                            const cardData = isViewingRevision ? p.pendingRevision! : p;
                                                            const imgUrl = typeof cardData.image === "string" ? cardData.image : cardData.image ? URL.createObjectURL(cardData.image) : null;
                                                            // Format date from YYYY-MM-DD to DD/MM/YYYY
                                                            const parts = cardData.date ? cardData.date.split("-") : [];
                                                            const startDisplay = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : cardData.date;
                                                            const endParts = cardData.endDate ? cardData.endDate.split("-") : [];
                                                            const endDisplay = endParts.length === 3 ? `${endParts[2]}/${endParts[1]}/${endParts[0]}` : cardData.endDate;
                                                            const displayDate = endDisplay && endDisplay !== startDisplay ? `${startDisplay} - ${endDisplay}` : startDisplay;
                                                            return (
                                                                <div
                                                                    key={p.id}
                                                                    onClick={() => setSelectedProposal(p)}
                                                                    className="group relative cursor-pointer bg-white border-[3px] border-black rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all overflow-hidden flex flex-row w-full"
                                                                >
                                                                    {/* Image / Logo */}
                                                                    <div className="relative w-[120px] aspect-square shrink-0 overflow-hidden bg-slate-50 border-r-[3px] border-black rounded-l-[17px]">
                                                                        {imgUrl ? (
                                                                            // eslint-disable-next-line @next/next/no-img-element
                                                                            <img
                                                                                src={imgUrl}
                                                                                alt={cardData.name}
                                                                                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 rounded-l-[14px]"
                                                                                onLoad={() => imgUrl && imgUrl.startsWith("blob:") && URL.revokeObjectURL(imgUrl)}
                                                                            />
                                                                        ) : (
                                                                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-black/40 font-black text-sm">
                                                                                {cardData.name.substring(0, 2).toUpperCase()}
                                                                            </div>
                                                                        )}

                                                                        {/* Status Badge */}
                                                                        <span
                                                                            className={clsx(
                                                                                "absolute top-2 left-2 text-[7px] font-black px-1.5 py-0.5 border-[2px] border-black rounded-full uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]",
                                                                                p.status === "DRAFT" && "bg-slate-100 text-black",
                                                                                isViewingRevision && "bg-[#F5C343] text-black",
                                                                                (!isViewingRevision && p.status === "UNDER_REVIEW") && "bg-[#F5C343] text-black",
                                                                                p.status === "REJECTED" && "bg-[#EE2C2C] text-white",
                                                                                (!isViewingRevision && (p.status === "PUBLISHED" || !p.status)) && "bg-green-400 text-black"
                                                                            )}
                                                                        >
                                                                            {p.status === "DRAFT" && "Draft"}
                                                                            {isViewingRevision && "Revision Under Review"}
                                                                            {!isViewingRevision && p.status === "UNDER_REVIEW" && "Under Review"}
                                                                            {p.status === "REJECTED" && "Rejected"}
                                                                            {!isViewingRevision && (p.status === "PUBLISHED" || !p.status) && "Published"}
                                                                        </span>
                                                                    </div>

                                                                    {/* Share button */}
                                                                    {p.status === "PUBLISHED" && (
                                                                        <div className="absolute top-2 right-2 z-30" onClick={(e) => e.stopPropagation()}>
                                                                            <button
                                                                                type="button"
                                                                                title="Share with brands"
                                                                                onClick={() => {
                                                                                    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" && window.location.origin.includes("localhost") ? window.location.origin : "https://app.meetday.ai")
                                                                                    const link = `${appUrl}/brand/proposal/${p.id}`
                                                                                    navigator.clipboard.writeText(link)
                                                                                        .then(() => toast.success("Link copied! Share it with brands."))
                                                                                        .catch(() => toast.error("Failed to copy link."))
                                                                                }}
                                                                                className="flex items-center justify-center size-6 rounded-full bg-white border-[2px] border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-50 text-black transition-colors"
                                                                            >
                                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 14l5-5-5-5M20 9H9a4 4 0 00-4 4v6" />
                                                                                </svg>
                                                                            </button>
                                                                        </div>
                                                                    )}

                                                                    {/* Content & Footer info */}
                                                                    <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                                                                        <div className="flex flex-col gap-1 pr-6">
                                                                            <h3 className="font-heading font-black text-base text-black truncate group-hover:text-[#EE2C2C] transition-colors">{cardData.name}</h3>
                                                                            <p className="text-[11px] font-bold text-black/50 truncate">
                                                                                {(cardData.venues && cardData.venues.length > 0 ? cardData.venues : [cardData.venue])
                                                                                    .map((v, idx) => {
                                                                                        const c = cardData.venueCities?.[idx] || (idx === 0 ? cardData.city : undefined)
                                                                                        return c ? `${v} (${c})` : v
                                                                                    })
                                                                                    .filter(Boolean)
                                                                                    .join(", ")}
                                                                            </p>
                                                                            <p className="text-[11px] font-semibold text-black/70 line-clamp-2 mt-0.5 leading-normal">{cardData.about}</p>
                                                                        </div>

                                                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-[#6C32D1] text-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                                                                {displayDate}
                                                                            </span>
                                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-[#EE2C2C] text-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                                                                {cardData.guestCount} Guests
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            /* State 2b: CTA to open details form */
                                            <div className="border-[3px] border-dashed border-black/30 rounded-[20px] p-12 text-center w-full flex flex-col items-center justify-center gap-2">
                                                <h2 className="font-heading font-black text-black text-lg">No active proposals</h2>
                                                <p className="text-xs font-semibold text-black/50 mb-3">
                                                    Create a comprehensive proposal detailing your project features.
                                                </p>
                                                <button
                                                    onClick={() => openProposalForm()}
                                                    title={!isCommunityApproved ? "Your community profile must be admin-approved first" : undefined}
                                                    className={clsx(
                                                        "text-white text-[9px] font-black px-5 py-2.5 rounded-lg uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[#1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all select-none cursor-pointer",
                                                        isCommunityApproved ? "bg-[#EE2C2C]" : "bg-black/30",
                                                    )}
                                                >
                                                    {isCommunityApproved ? "GET STARTED" : "PENDING ADMIN APPROVAL"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column Drawer / Mobile drawer */}
                {isSplitLayout && (
                    <>
                        {showActivateModal ? (
                            <>
                                {/* Mobile/Tablet Backdrop Blur */}
                                <div
                                    onClick={() => setShowActivateModal(false)}
                                    className="md:hidden fixed inset-0 bg-black/45 z-40 backdrop-blur-xs"
                                />

                                {/* Responsive drawer container */}
                                <div className={clsx(
                                    "bg-white h-full flex flex-col z-50 transition-all duration-300 animate-in slide-in-from-right shrink-0",
                                    "fixed inset-y-0 right-0 w-full sm:w-[420px] border-l-4 border-black shadow-modal",
                                    "md:static md:border-l-0 md:border-l md:border-black/10 md:shadow-none md:w-full overflow-y-auto p-6"
                                )}>
                                    <ActivateCommunityModal
                                        hostId={hostId}
                                        profileInstagram={profile?.socialLinks?.instagram || ""}
                                        profileLinkedin={profile?.socialLinks?.linkedin || ""}
                                        profileYoutube={profile?.socialLinks?.youtube || ""}
                                        profilePortfolio={profile?.socialLinks?.website || ""}
                                        profileOperatingCities={profile?.operatingCities || []}
                                        onClose={() => setShowActivateModal(false)}
                                        onSuccess={(saved) => {
                                            setCommunity(saved as any)
                                            setShowActivateModal(false)
                                        }}
                                        inline={true}
                                    />
                                </div>
                            </>
                        ) : (
                            /* Render the Community details card exactly like the user's mockup! */
                            <div className="hidden md:flex flex-col h-full w-full bg-white animate-in fade-in duration-150 shrink-0 overflow-hidden">
                                {renderCommunityCard()}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Mobile-only Community Profile Drawer */}
            {showCommunityMobilePanel && community && (
                <>
                    {/* Backdrop */}
                    <div
                        onClick={() => setShowCommunityMobilePanel(false)}
                        className="sm:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-xs"
                    />
                    {/* Drawer */}
                    <div className="sm:hidden fixed inset-y-0 right-0 w-full max-w-[380px] bg-white border-l-4 border-black z-50 overflow-y-auto shadow-modal flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="flex justify-between items-center p-4 border-b border-black/10 shrink-0">
                            <h3 className="font-heading font-black text-black text-base">Community Profile</h3>
                            <button
                                onClick={() => setShowCommunityMobilePanel(false)}
                                className="text-black font-extrabold text-sm p-2"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="flex-1 min-h-0">
                            <CommunityProfileDetailsPanel
                                community={community}
                                operatingCities={profile?.operatingCities}
                                socialLinks={profile?.socialLinks}
                                onEdit={() => {
                                    setShowCommunityMobilePanel(false)
                                    openActivationModal()
                                }}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
