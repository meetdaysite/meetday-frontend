"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import { Icon } from "@/components/ui/Icon"
import { useHostStore } from "@/store/hostStore"

import UploadSvg from "@/icons/outlined/upload.svg"
import DocumentTextSvg from "@/icons/outlined/document-text.svg"
import CheckCircleSvg from "@/icons/outlined/check-circle.svg"

// ─── IndexedDB Config ────────────────────────────────────────────────────────
const DB_NAME = "MeetdayProposalDB"
const STORE_NAME = "proposals"
const RECORD_KEY = "current_proposal"
const COMMUNITY_KEY = "activated_community"

interface StoredProposal {
    name: string
    type: string
    size: number
    uploadedAt: string
    data: File | Blob
}

interface ActivatedCommunity {
    name: string
    about: string
    logo: File | Blob | null
    logoName: string
    size: string
    avgGuestCount: string
    experiencesPerYear: string
    experienceTypes: string[]
    activatedAt: string
}

function initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result)
        request.onupgradeneeded = () => {
            request.result.createObjectStore(STORE_NAME)
        }
    })
}

function saveProposal(file: File, hostId: string): Promise<StoredProposal> {
    return initDB().then((db) => {
        return new Promise<StoredProposal>((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, "readwrite")
            const store = transaction.objectStore(STORE_NAME)
            const record: StoredProposal = {
                name: file.name,
                type: file.type,
                size: file.size,
                uploadedAt: new Date().toISOString(),
                data: file,
            }
            const request = store.put(record, `${RECORD_KEY}_${hostId}`)
            request.onerror = () => reject(request.error)
            request.onsuccess = () => resolve(record)
        })
    })
}

function getProposal(hostId: string): Promise<StoredProposal | null> {
    return initDB().then((db) => {
        return new Promise<StoredProposal | null>((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, "readonly")
            const store = transaction.objectStore(STORE_NAME)
            const request = store.get(`${RECORD_KEY}_${hostId}`)
            request.onerror = () => reject(request.error)
            request.onsuccess = () => resolve(request.result || null)
        })
    })
}

function deleteProposal(hostId: string): Promise<void> {
    return initDB().then((db) => {
        return new Promise<void>((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, "readwrite")
            const store = transaction.objectStore(STORE_NAME)
            const request = store.delete(`${RECORD_KEY}_${hostId}`)
            request.onerror = () => reject(request.error)
            request.onsuccess = () => resolve()
        })
    })
}

function saveCommunity(community: ActivatedCommunity, hostId: string): Promise<ActivatedCommunity> {
    return initDB().then((db) => {
        return new Promise<ActivatedCommunity>((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, "readwrite")
            const store = transaction.objectStore(STORE_NAME)
            const request = store.put(community, `${COMMUNITY_KEY}_${hostId}`)
            request.onerror = () => reject(request.error)
            request.onsuccess = () => resolve(community)
        })
    })
}

function getCommunity(hostId: string): Promise<ActivatedCommunity | null> {
    return initDB().then((db) => {
        return new Promise<ActivatedCommunity | null>((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, "readonly")
            const store = transaction.objectStore(STORE_NAME)
            const request = store.get(`${COMMUNITY_KEY}_${hostId}`)
            request.onerror = () => reject(request.error)
            request.onsuccess = () => resolve(request.result || null)
        })
    })
}

function deleteCommunity(hostId: string): Promise<void> {
    return initDB().then((db) => {
        return new Promise<void>((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, "readwrite")
            const store = transaction.objectStore(STORE_NAME)
            const request = store.delete(`${COMMUNITY_KEY}_${hostId}`)
            request.onerror = () => reject(request.error)
            request.onsuccess = () => resolve()
        })
    })
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
    const profile = useHostStore((s) => s.profile)
    const hostId = profile?.id || ""

    const [proposal, setProposal] = useState<StoredProposal | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [community, setCommunity] = useState<ActivatedCommunity | null>(null)
    const [communityLogoUrl, setCommunityLogoUrl] = useState<string | null>(null)

    const [loading, setLoading] = useState(true)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Modal State
    const [showActivateModal, setShowActivateModal] = useState(false)
    const [communityName, setCommunityName] = useState("")
    const [aboutCommunity, setAboutCommunity] = useState("")
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
    const [communitySize, setCommunitySize] = useState("")
    const [avgGuestCount, setAvgGuestCount] = useState("")
    const [experiencesPerYear, setExperiencesPerYear] = useState("")
    const [experienceTypes, setExperienceTypes] = useState<string[]>([])
    const [newExperienceType, setNewExperienceType] = useState("")
    const logoInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (!hostId) return
        setLoading(true)
        Promise.all([getProposal(hostId), getCommunity(hostId)])
            .then(([p, c]) => {
                setProposal(p)
                setCommunity(c)
            })
            .catch((err) => {
                console.error("Failed to load details from IndexedDB", err)
            })
            .finally(() => {
                setLoading(false)
            })
    }, [hostId])

    useEffect(() => {
        if (proposal?.data) {
            const url = URL.createObjectURL(proposal.data)
            setPreviewUrl(url)
            return () => {
                URL.revokeObjectURL(url)
            }
        } else {
            setPreviewUrl(null)
        }
    }, [proposal])

    useEffect(() => {
        if (community?.logo) {
            const url = URL.createObjectURL(community.logo)
            setCommunityLogoUrl(url)
            return () => {
                URL.revokeObjectURL(url)
            }
        } else {
            setCommunityLogoUrl(null)
        }
    }, [community])

    useEffect(() => {
        if (logoFile) {
            const url = URL.createObjectURL(logoFile)
            setLogoPreviewUrl(url)
            return () => {
                URL.revokeObjectURL(url)
            }
        } else {
            setLogoPreviewUrl(null)
        }
    }, [logoFile])

    const validateAndProcessFile = (file: File) => {
        const allowedExtensions = [".pdf", ".doc", ".docx"]
        const allowedTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ]
        const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
        const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)

        if (!isValidType) {
            toast.error("Only PDF or DOC/DOCX files are accepted.")
            return
        }

        const maxSize = 10 * 1024 * 1024 // 10MB
        if (file.size > maxSize) {
            toast.error("File size cannot exceed 10MB.")
            return
        }

        setIsUploading(true)
        setUploadProgress(0)

        const interval = setInterval(() => {
            setUploadProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval)
                    saveProposal(file, hostId)
                        .then((saved) => {
                            setProposal(saved)
                            toast.success("Proposal uploaded successfully!")
                        })
                        .catch((err) => {
                            console.error(err)
                            toast.error("Failed to save proposal.")
                        })
                        .finally(() => {
                            setIsUploading(false)
                        })
                    return 100
                }
                return prev + 10
            })
        }, 100)
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndProcessFile(e.dataTransfer.files[0])
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndProcessFile(e.target.files[0])
        }
    }

    const onButtonClick = () => {
        fileInputRef.current?.click()
    }

    const handleDownload = () => {
        if (!proposal) return
        const url = URL.createObjectURL(proposal.data)
        const a = document.createElement("a")
        a.href = url
        a.download = proposal.name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const handleReupload = () => {
        if (confirm("Are you sure you want to replace the current proposal?")) {
            deleteProposal(hostId).then(() => {
                setProposal(null)
                setTimeout(() => {
                    onButtonClick()
                }, 100)
            })
        }
    }

    const handleDelete = () => {
        if (confirm("Are you sure you want to delete the uploaded proposal?")) {
            deleteProposal(hostId)
                .then(() => {
                    setProposal(null)
                    toast.success("Proposal deleted successfully.")
                })
                .catch((err) => {
                    console.error(err)
                    toast.error("Failed to delete proposal.")
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
            setExperienceTypes(community.experienceTypes || [])
            setLogoFile(community.logo as File | null)
        } else {
            setCommunityName("")
            setAboutCommunity("")
            setCommunitySize("")
            setAvgGuestCount("")
            setExperiencesPerYear("")
            setExperienceTypes([])
            setLogoFile(null)
        }
        setNewExperienceType("")
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

    const addExperienceType = () => {
        const trimmed = newExperienceType.trim()
        if (!trimmed) return

        // Normalization function: lowercases and strips all spaces/hyphens/special characters
        const normalize = (val: string) => val.toLowerCase().replace(/[^a-z0-9]/g, "")

        const normalizedNew = normalize(trimmed)
        const isDuplicate = experienceTypes.some((type) => normalize(type) === normalizedNew)

        if (isDuplicate) {
            toast.error("Already added")
            return
        }

        setExperienceTypes([...experienceTypes, trimmed])
        setNewExperienceType("")
    }

    const removeExperienceType = (index: number) => {
        setExperienceTypes(experienceTypes.filter((_, i) => i !== index))
    }

    const handleExperienceTypeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault()
            addExperienceType()
        }
    }

    const handleActivationSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!communityName.trim()) {
            toast.error("Community Name is required.")
            return
        }

        if (!aboutCommunity.trim()) {
            toast.error("About the community description is required.")
            return
        }

        if (!logoFile) {
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

        // Validation for multiple experience types
        if (experienceTypes.length === 0) {
            toast.error("At least one experience type must be added.")
            return
        }

        const communityData: ActivatedCommunity = {
            name: communityName,
            about: aboutCommunity,
            logo: logoFile,
            logoName: logoFile.name,
            size: communitySize,
            avgGuestCount: avgGuestCount,
            experiencesPerYear: experiencesPerYear,
            experienceTypes: experienceTypes,
            activatedAt: community?.activatedAt || new Date().toISOString(),
        }

        saveCommunity(communityData, hostId)
            .then((saved) => {
                setCommunity(saved)
                setShowActivateModal(false)
                toast.success(community ? "Community details updated!" : "Community activated successfully!")
            })
            .catch((err) => {
                console.error(err)
                toast.error("Failed to save activation details.")
            })
    }

    const handleDeactivate = () => {
        if (confirm("Are you sure you want to deactivate the community? Both community details and uploaded proposals will be removed.")) {
            Promise.all([deleteCommunity(hostId), deleteProposal(hostId)])
                .then(() => {
                    setCommunity(null)
                    setProposal(null)
                    toast.success("Community deactivated and proposal cleared.")
                })
                .catch((err) => {
                    console.error(err)
                    toast.error("Failed to deactivate community.")
                })
        }
    }

    return (
        <div className="flex flex-col min-h-screen">
            <DashboardTopBar />

            <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 bg-surface-page">
                <div className="mb-6">
                    <h1 className="text-heading-sm font-semibold text-text-primary">Proposal</h1>
                    <p className="text-body-sm text-text-secondary mt-0.5">Activate your community and upload your proposal</p>
                </div>

                <div className="max-w-4xl">
                    {loading ? (
                        <div className="bg-surface-card border border-border-default rounded-action p-12 text-center max-w-2xl">
                            <p className="text-text-secondary">Loading details...</p>
                        </div>
                    ) : !community ? (
                        /* State 1: Not Activated yet. User must fill in details first. */
                        <div className="bg-surface-card border border-border-default rounded-action p-8 text-center max-w-2xl flex flex-col items-center">
                            <div className="size-16 rounded-full bg-surface-brand-soft flex items-center justify-center mb-4">
                                <Icon as={DocumentTextSvg} size="lg" color="brand" />
                            </div>
                            <h2 className="text-label-lg font-semibold text-text-primary mb-2">Activate Your Community First</h2>
                            <p className="text-body-sm text-text-secondary mb-6 max-w-md">
                                Before uploading your proposal document, please provide details about your community to activate it.
                            </p>
                            <Button variant="primary" size="md" radius="pill" onClick={openActivationModal}>
                                Activate Community
                            </Button>
                        </div>
                    ) : (
                        /* Community activated. Now they can view/edit details and upload/view the proposal. */
                        <div className="flex flex-col gap-6">

                            {/* Activated Community Details Card */}
                            <div className="bg-surface-card border border-border-default rounded-action p-6 max-w-2xl shadow-sm">
                                <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-border-default">
                                    <div className="flex items-center gap-3">
                                        {communityLogoUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={communityLogoUrl} alt={community.name} className="size-12 rounded-xl object-cover border border-border-default" />
                                        ) : (
                                            <div className="size-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700 text-title-sm font-bold">
                                                {community.name.substring(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-label-lg font-semibold text-text-primary">{community.name}</h3>
                                            <p className="text-caption text-text-tertiary">Activated Community</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="secondary"
                                            size="xs"
                                            radius="pill"
                                            onClick={openActivationModal}
                                        >
                                            Edit details
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="xs"
                                            radius="pill"
                                            className="text-red-600 border-red-100 bg-red-50 hover:bg-red-100"
                                            onClick={handleDeactivate}
                                        >
                                            Deactivate
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {community.about && (
                                        <div>
                                            <p className="text-caption text-text-tertiary">About the Community</p>
                                            <p className="text-label-sm text-text-secondary mt-0.5 leading-relaxed">{community.about}</p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        {community.size && (
                                            <div>
                                                <p className="text-caption text-text-tertiary">Community Size</p>
                                                <p className="text-label-sm font-semibold text-text-primary mt-0.5">{community.size} members</p>
                                            </div>
                                        )}
                                        {community.avgGuestCount && (
                                            <div>
                                                <p className="text-caption text-text-tertiary">Avg Guest Count</p>
                                                <p className="text-label-sm font-semibold text-text-primary mt-0.5">{community.avgGuestCount} guests</p>
                                            </div>
                                        )}
                                        {community.experiencesPerYear && (
                                            <div className="col-span-2">
                                                <p className="text-caption text-text-tertiary">Experiences/Year</p>
                                                <p className="text-label-sm font-semibold text-text-primary mt-0.5">{community.experiencesPerYear}</p>
                                            </div>
                                        )}
                                        {community.experienceTypes && community.experienceTypes.length > 0 && (
                                            <div className="col-span-2">
                                                <p className="text-caption text-text-tertiary">Experience Types</p>
                                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                    {community.experienceTypes.map((type, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="inline-flex items-center px-2.5 py-0.5 rounded-badge text-caption font-medium bg-surface-brand-soft text-text-brand border border-border-brand"
                                                        >
                                                            {type}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Proposal upload/display section */}
                            <div className="flex flex-col gap-4">
                                <h3 className="text-label-lg font-semibold text-text-primary">Proposal Document</h3>

                                {isUploading ? (
                                    <div className="bg-surface-card border border-border-default rounded-action p-8 text-center flex flex-col items-center max-w-2xl">
                                        <div className="w-16 h-16 rounded-full bg-surface-brand-soft flex items-center justify-center mb-4 animate-bounce">
                                            <Icon as={UploadSvg} size="lg" color="brand" />
                                        </div>
                                        <h3 className="text-label-lg font-semibold text-text-primary mb-2">Uploading Proposal</h3>
                                        <p className="text-caption text-text-secondary mb-6">Processing your file, please wait...</p>
                                        <div className="w-full max-w-xs bg-surface-card-muted rounded-full h-2 overflow-hidden mb-2">
                                            <div
                                                className="bg-action-primary h-full transition-all duration-150"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                        <span className="text-label-sm font-semibold text-text-brand">{uploadProgress}%</span>
                                    </div>
                                ) : proposal ? (
                                    /* State 3: Proposal Uploaded */
                                    <div className="flex flex-col gap-6">
                                        <div className="bg-surface-card border border-border-default rounded-action p-6 max-w-2xl">
                                            <div className="flex items-start gap-4 mb-6">
                                                <div className="size-12 rounded-xl bg-surface-brand-soft flex items-center justify-center shrink-0">
                                                    <Icon as={DocumentTextSvg} size="lg" color="brand" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h2 className="text-label-lg font-semibold text-text-primary truncate">{proposal.name}</h2>
                                                    <p className="text-caption text-text-secondary mt-0.5">
                                                        Size: {formatBytes(proposal.size)} • Uploaded: {new Date(proposal.uploadedAt).toLocaleString()}
                                                    </p>
                                                </div>
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-badge text-caption font-medium bg-status-success-bg text-status-success-text shrink-0">
                                                    <Icon as={CheckCircleSvg} className="size-3.5" aria-hidden />
                                                    Active
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <Button variant="primary" size="sm" radius="pill" onClick={handleDownload}>
                                                    Download
                                                </Button>
                                                <Button variant="secondary" size="sm" radius="pill" onClick={handleReupload}>
                                                    Reupload
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    radius="pill"
                                                    className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                                                    onClick={handleDelete}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Preview Area */}
                                        <div className="mt-2">
                                            <h3 className="text-label-lg font-semibold text-text-primary mb-3">Document Preview</h3>
                                            {proposal.type.includes("pdf") ? (
                                                <div className="border border-border-default rounded-action overflow-hidden bg-surface-card shadow-sm h-[600px]">
                                                    <iframe
                                                        src={previewUrl || undefined}
                                                        className="w-full h-full border-none"
                                                        title="Proposal Preview"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="border border-border-default rounded-action p-12 bg-surface-card text-center flex flex-col items-center justify-center max-w-2xl">
                                                    <div className="size-16 rounded-full bg-surface-card-muted flex items-center justify-center mb-4">
                                                        <Icon as={DocumentTextSvg} size="lg" color="secondary" />
                                                    </div>
                                                    <h4 className="text-label-lg font-semibold text-text-primary mb-1">
                                                        Preview not supported for Word documents
                                                    </h4>
                                                    <p className="text-caption text-text-secondary max-w-md">
                                                        Word files (.doc, .docx) cannot be displayed inside the browser. Please download the file to preview.
                                                    </p>
                                                    <Button variant="secondary" size="sm" radius="pill" className="mt-4" onClick={handleDownload}>
                                                        Download File
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    /* State 2: Activated but no proposal uploaded yet */
                                    <div
                                        className={`border-2 border-dashed rounded-action p-12 text-center transition-all duration-200 cursor-pointer max-w-2xl ${dragActive
                                                ? "border-action-primary bg-surface-brand-soft"
                                                : "border-border-default hover:border-action-primary hover:bg-surface-card-muted"
                                            }`}
                                        onDragEnter={handleDrag}
                                        onDragOver={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDrop={handleDrop}
                                        onClick={onButtonClick}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                            onChange={handleFileChange}
                                        />

                                        <div className="w-12 h-12 rounded-full bg-surface-card-muted flex items-center justify-center mx-auto mb-4">
                                            <Icon as={UploadSvg} size="lg" color="secondary" />
                                        </div>

                                        <h3 className="text-label-lg font-semibold text-text-primary mb-1">Upload Proposal</h3>
                                        <p className="text-caption text-text-secondary mb-6">
                                            Drag and drop your file here, or click to browse
                                        </p>

                                        <Button variant="secondary" size="sm" radius="pill" className="pointer-events-none">
                                            Select File
                                        </Button>

                                        <p className="text-caption text-text-tertiary mt-4">
                                            Only PDF or DOC/DOCX files accepted, maximum size 10MB
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Activate Community Dialog / Modal ─────────────────────────────────── */}
            {showActivateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-surface-card rounded-panel border border-border-default shadow-floating w-full max-w-lg p-6 my-8 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">

                        {/* Modal Header */}
                        <div className="flex justify-between items-center pb-4 mb-4 border-b border-border-default shrink-0">
                            <h2 className="text-heading-xs font-semibold text-text-primary">
                                {community ? "Edit Community Details" : "Activate Community"}
                            </h2>
                            <button
                                onClick={() => setShowActivateModal(false)}
                                className="text-text-secondary hover:text-text-primary size-8 rounded-full flex items-center justify-center hover:bg-surface-card-muted transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Body (Scrollable) */}
                        <form onSubmit={handleActivationSubmit} className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">

                            {/* Community Name */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-label-sm font-semibold text-text-primary">Community Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={communityName}
                                    onChange={(e) => setCommunityName(e.target.value)}
                                    placeholder="e.g. Bangalore Boardgamers Guild"
                                    className="h-10 px-4 rounded-input border border-border-default bg-surface-canvas text-text-primary outline-none focus:border-border-focused hover:border-border-strong text-sm transition-colors"
                                />
                            </div>

                            {/* About Community */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-label-sm font-semibold text-text-primary">About the community *</label>
                                <textarea
                                    required
                                    value={aboutCommunity}
                                    onChange={(e) => setAboutCommunity(e.target.value)}
                                    placeholder="Describe your community's purpose, focus, and vibes..."
                                    rows={3}
                                    className="p-3 rounded-input border border-border-default bg-surface-canvas text-text-primary outline-none focus:border-border-focused hover:border-border-strong text-sm transition-colors resize-none"
                                />
                            </div>

                            {/* Logo Upload */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-label-sm font-semibold text-text-primary">Logo *</label>
                                <div className="flex items-center gap-4">
                                    <div className="size-16 rounded-xl border border-dashed border-border-default bg-surface-canvas flex items-center justify-center overflow-hidden shrink-0">
                                        {logoPreviewUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={logoPreviewUrl} alt="Logo preview" className="size-full object-cover" />
                                        ) : (
                                            <Icon as={UploadSvg} size="md" color="muted" />
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <input
                                            ref={logoInputRef}
                                            type="file"
                                            accept=".jpeg,.jpg,.png,image/jpeg,image/png"
                                            className="hidden"
                                            onChange={handleLogoChange}
                                        />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="xs"
                                            radius="md"
                                            onClick={() => logoInputRef.current?.click()}
                                        >
                                            Choose Image
                                        </Button>
                                        <span className="text-[10px] text-text-tertiary mt-1">
                                            JPEG, JPG, PNG accepted. Max 5MB.
                                        </span>
                                        {logoFile && (
                                            <span className="text-[10px] text-text-secondary truncate max-w-xs font-semibold">
                                                {logoFile.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Community Size */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-label-sm font-semibold text-text-primary">Community Size *</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={communitySize}
                                    onChange={(e) => setCommunitySize(e.target.value)}
                                    placeholder="e.g. 500"
                                    className="h-10 px-4 rounded-input border border-border-default bg-surface-canvas text-text-primary outline-none focus:border-border-focused hover:border-border-strong text-sm transition-colors"
                                />
                            </div>

                            {/* Average Guest Count */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-label-sm font-semibold text-text-primary">Average Guest Count per event *</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={avgGuestCount}
                                    onChange={(e) => setAvgGuestCount(e.target.value)}
                                    placeholder="e.g. 30"
                                    className="h-10 px-4 rounded-input border border-border-default bg-surface-canvas text-text-primary outline-none focus:border-border-focused hover:border-border-strong text-sm transition-colors"
                                />
                            </div>

                            {/* Experiences Hosted in a Year */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-label-sm font-semibold text-text-primary">Number of curated experiences hosted in a year *</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={experiencesPerYear}
                                    onChange={(e) => setExperiencesPerYear(e.target.value)}
                                    placeholder="e.g. 24"
                                    className="h-10 px-4 rounded-input border border-border-default bg-surface-canvas text-text-primary outline-none focus:border-border-focused hover:border-border-strong text-sm transition-colors"
                                />
                            </div>

                            {/* Types of experiences hosted */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-label-sm font-semibold text-text-primary">Types of experiences hosted *</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newExperienceType}
                                        onChange={(e) => setNewExperienceType(e.target.value)}
                                        onKeyDown={handleExperienceTypeKeyDown}
                                        placeholder="e.g. Boardgame nights (press Add or Enter)"
                                        className="flex-1 h-10 px-4 rounded-input border border-border-default bg-surface-canvas text-text-primary outline-none focus:border-border-focused hover:border-border-strong text-sm transition-colors"
                                    />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        radius="md"
                                        onClick={addExperienceType}
                                    >
                                        Add
                                    </Button>
                                </div>

                                {experienceTypes.length > 0 ? (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {experienceTypes.map((type, i) => (
                                            <span
                                                key={i}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-badge text-label-sm font-medium bg-surface-brand-soft text-text-brand border border-border-brand animate-in fade-in duration-100"
                                            >
                                                {type}
                                                <button
                                                    type="button"
                                                    onClick={() => removeExperienceType(i)}
                                                    className="size-4 hover:bg-surface-brand-hover rounded-full flex items-center justify-center text-text-brand text-xs font-bold transition-colors"
                                                >
                                                    ✕
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-text-tertiary">Add at least one type of experience you host.</p>
                                )}
                            </div>

                            {/* Modal Footer (Sticky/Fixed inside flex layout) */}
                            <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-border-default shrink-0">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    radius="md"
                                    onClick={() => setShowActivateModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="sm"
                                    radius="md"
                                >
                                    {community ? "Update Details" : "Activate"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
