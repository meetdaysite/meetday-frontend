"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Tabs } from "@/components/ui/Tabs"
import clsx from "clsx"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import { Icon } from "@/components/ui/Icon"
import { useHostStore } from "@/store/hostStore"
import { getCategories, updateHostProfile, type Category } from "@/lib/api"

import UploadSvg from "@/icons/outlined/upload.svg"
import DocumentTextSvg from "@/icons/outlined/document-text.svg"
import CheckCircleSvg from "@/icons/outlined/check-circle.svg"
import DotsSvg from "@/icons/outlined/dots.svg"
import TrashBinSvg from "@/icons/outlined/trash-bin.svg"

// ─── IndexedDB Config ────────────────────────────────────────────────────────
const DB_NAME = "MeetdayProposalDB"
const STORE_NAME = "proposals"
const RECORD_KEY = "current_proposal"
const COMMUNITY_KEY = "activated_community"

export interface SponsorPrice {
    name: string
    price: string
}

export interface StoredProposal {
    id: string
    name: string
    about: string
    image: File | Blob | null
    imageName: string
    date: string
    venue: string
    city: string
    audienceProfile: string | string[]
    ageGroup: string
    guestCount: string
    docFile: File | Blob
    docName: string
    docType: string
    docSize: number
    uploadedAt: string
    status?: "DRAFT" | "UNDER_REVIEW" | "REJECTED" | "PUBLISHED"
    sponsorPrices?: SponsorPrice[]
    pendingRevision?: {
        name: string
        about: string
        image: File | Blob | null
        imageName: string
        date: string
        venue: string
        city: string
        audienceProfile: string | string[]
        ageGroup: string
        guestCount: string
        docFile: File | Blob
        docName: string
        docType: string
        docSize: number
        uploadedAt: string
        sponsorPrices?: SponsorPrice[]
    }
}

interface ActivatedCommunity {
    name: string
    about: string
    logo: File | Blob | null
    logoName: string
    size: string
    avgGuestCount: string
    experiencesPerYear: string
    categoryIds: string[]
    instagram?: string
    linkedin?: string
    youtube?: string
    portfolio?: string
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

function saveProposalsList(proposals: StoredProposal[], hostId: string): Promise<StoredProposal[]> {
    return initDB().then((db) => {
        return new Promise<StoredProposal[]>((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, "readwrite")
            const store = transaction.objectStore(STORE_NAME)
            const request = store.put(proposals, `${RECORD_KEY}_${hostId}`)
            request.onerror = () => reject(request.error)
            request.onsuccess = () => resolve(proposals)
        })
    })
}

export function getProposals(hostId: string): Promise<StoredProposal[]> {
    return initDB().then((db) => {
        return new Promise<StoredProposal[]>((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, "readonly")
            const store = transaction.objectStore(STORE_NAME)
            const request = store.get(`${RECORD_KEY}_${hostId}`)
            request.onerror = () => reject(request.error)
            request.onsuccess = () => {
                const res = request.result
                if (!res) {
                    resolve([])
                } else if (Array.isArray(res)) {
                    resolve(res)
                } else {
                    // Legacy single proposal -> convert to array with a dummy ID
                    resolve([{
                        id: res.id || "legacy",
                        name: res.name || "",
                        about: res.about || "",
                        image: res.image || null,
                        imageName: res.imageName || "",
                        date: res.date || "",
                        venue: res.venue || "",
                        city: res.city || "",
                        audienceProfile: res.audienceProfile || "",
                        ageGroup: res.ageGroup || "",
                        guestCount: res.guestCount || "",
                        docFile: res.docFile || res.data,
                        docName: res.docName || res.name || "",
                        docType: res.docType || res.type || "",
                        docSize: res.docSize || res.size || 0,
                        uploadedAt: res.uploadedAt || new Date().toISOString(),
                    }])
                }
            }
        })
    })
}

function deleteProposalsList(hostId: string): Promise<void> {
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
    const { profile, setProfile } = useHostStore()
    const hostId = profile?.id || ""
    const searchParams = useSearchParams()
    const urlProposalId = searchParams ? searchParams.get("proposalId") : null

    const [proposals, setProposals] = useState<StoredProposal[]>([])
    const [selectedProposal, setSelectedProposal] = useState<StoredProposal | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [projectImageUrl, setProjectImageUrl] = useState<string | null>(null)
    const [community, setCommunity] = useState<ActivatedCommunity | null>(null)
    const [communityLogoUrl, setCommunityLogoUrl] = useState<string | null>(null)

    // Project Details / Proposal Upload states
    const [showProjectModal, setShowProjectModal] = useState(false)
    const [showProposalForm, setShowProposalForm] = useState(false)
    const [isEditingInPlace, setIsEditingInPlace] = useState(false)
    const [projName, setProjName] = useState("")
    const [projAbout, setProjAbout] = useState("")
    const [projImage, setProjImage] = useState<File | null>(null)
    const [projImagePreview, setProjImagePreview] = useState<string | null>(null)
    const [projDate, setProjDate] = useState("")
    const [projVenue, setProjVenue] = useState("")
    const [projCity, setProjCity] = useState("")
    const [projAudience, setProjAudience] = useState<string[]>([])
    const [newAudience, setNewAudience] = useState("")
    const [previewSlide, setPreviewSlide] = useState(0)
    const [projAgeGroup, setProjAgeGroup] = useState("")
    const [projGuestCount, setProjGuestCount] = useState("")
    const [projDoc, setProjDoc] = useState<File | null>(null)
    const [sponsorPrices, setSponsorPrices] = useState<SponsorPrice[]>([{ name: "", price: "" }])
    const projImageInputRef = useRef<HTMLInputElement>(null)
    const projDocInputRef = useRef<HTMLInputElement>(null)
    const updateDocInputRef = useRef<HTMLInputElement>(null)
    const previewContainerRef = useRef<HTMLDivElement>(null)

    const [docxRenderer, setDocxRenderer] = useState<any>(null)
    const [pptxViewerClass, setPptxViewerClass] = useState<any>(null)

    const [activeTab, setActiveTab] = useState<"ALL" | "DRAFT" | "UNDER_REVIEW" | "REJECTED" | "PUBLISHED">("ALL")
    const [openKebabId, setOpenKebabId] = useState<string | null>(null)
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
    const [categoryIds, setCategoryIds] = useState<string[]>([])
    const [instagram, setInstagram] = useState("")
    const [linkedin, setLinkedin] = useState("")
    const [youtube, setYoutube] = useState("")
    const [portfolio, setPortfolio] = useState("")
    const logoInputRef = useRef<HTMLInputElement>(null)

    const [categories, setCategories] = useState<Category[]>([])

    const displayDetails = useMemo(() => {
        if (!selectedProposal) return null
        if ((activeTab === "UNDER_REVIEW" || selectedProposal.status === "UNDER_REVIEW") && selectedProposal.pendingRevision) {
            return {
                name: selectedProposal.pendingRevision.name,
                about: selectedProposal.pendingRevision.about,
                image: selectedProposal.pendingRevision.image,
                imageName: selectedProposal.pendingRevision.imageName,
                date: selectedProposal.pendingRevision.date,
                venue: selectedProposal.pendingRevision.venue,
                city: selectedProposal.pendingRevision.city,
                audienceProfile: selectedProposal.pendingRevision.audienceProfile,
                ageGroup: selectedProposal.pendingRevision.ageGroup,
                guestCount: selectedProposal.pendingRevision.guestCount,
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
            venue: selectedProposal.venue,
            city: selectedProposal.city,
            audienceProfile: selectedProposal.audienceProfile,
            ageGroup: selectedProposal.ageGroup,
            guestCount: selectedProposal.guestCount,
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
        Promise.all([getProposals(hostId), getCommunity(hostId)])
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
                console.error("Failed to load details from IndexedDB", err)
            })
            .finally(() => {
                setLoading(false)
            })
    }, [hostId, urlProposalId])

    useEffect(() => {
        if (displayDetails?.docFile) {
            let mimeType = displayDetails.docType
            if (displayDetails.docName.toLowerCase().endsWith(".pdf")) {
                mimeType = "application/pdf"
            } else if (displayDetails.docName.toLowerCase().endsWith(".docx")) {
                mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            } else if (displayDetails.docName.toLowerCase().endsWith(".pptx")) {
                mimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
            }
            const docBlob = new Blob([displayDetails.docFile], { type: mimeType })
            const url = URL.createObjectURL(docBlob)
            setPreviewUrl(url)
            return () => {
                URL.revokeObjectURL(url)
            }
        } else {
            setPreviewUrl(null)
        }
    }, [displayDetails])

    useEffect(() => {
        if (displayDetails?.image) {
            const url = URL.createObjectURL(displayDetails.image)
            setProjectImageUrl(url)
            return () => {
                URL.revokeObjectURL(url)
            }
        } else {
            setProjectImageUrl(null)
        }
    }, [displayDetails])

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
        if (!openKebabId) return
        const handler = () => setOpenKebabId(null)
        window.addEventListener("click", handler)
        return () => window.removeEventListener("click", handler)
    }, [openKebabId])

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

        if (isDoc && docxRenderer) {
            previewContainerRef.current.innerHTML = '<div class="flex items-center justify-center h-full text-xs text-text-tertiary">Loading document preview...</div>'
            docxRenderer.renderAsync(displayDetails.docFile, previewContainerRef.current)
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
                viewer.load(displayDetails.docFile)
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
    }, [displayDetails, docxRenderer, pptxViewerClass])

    const openProposalForm = (p?: StoredProposal) => {
        if (p) {
            const data = ((activeTab === "UNDER_REVIEW" || p.status === "UNDER_REVIEW") && p.pendingRevision) 
                ? p.pendingRevision 
                : p;
            setProjName(data.name)
            setProjAbout(data.about)
            setProjImage(data.image as File | null)
            setProjDate(data.date)
            setProjVenue(data.venue)
            setProjCity(data.city)
            setProjAudience(Array.isArray(data.audienceProfile) ? data.audienceProfile : data.audienceProfile ? data.audienceProfile.split(",").map(x => x.trim()).filter(Boolean) : [])
            setProjAgeGroup(data.ageGroup)
            setProjGuestCount(data.guestCount)
            setProjDoc(data.docFile as File | null)
            setSponsorPrices(data.sponsorPrices && data.sponsorPrices.length > 0 ? data.sponsorPrices : [{ name: "", price: "" }])
            setSelectedProposal(p)
        } else {
            setProjName("")
            setProjAbout("")
            setProjImage(null)
            setProjDate("")
            setProjVenue("")
            setProjCity("")
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
            const allowedExtensions = [".pdf", ".doc", ".docx", ".ppt", ".pptx"]
            const allowedTypes = [
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-powerpoint",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            ]
            const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
            const isValid = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)

            if (!isValid) {
                toast.error("Only PDF, DOC/DOCX, or PPT/PPTX files are accepted.")
                return
            }
            if (file.size > 10 * 1024 * 1024) {
                toast.error("File size cannot exceed 10MB.")
                return
            }
            setProjDoc(file)
        }
    }

    const handleProposalSubmit = (e: React.FormEvent, forceStatus?: "DRAFT" | "UNDER_REVIEW" | "REJECTED" | "PUBLISHED") => {
        e.preventDefault()

        if (!projName.trim()) {
            toast.error("Project Name is required.")
            return
        }
        if (!projAbout.trim()) {
            toast.error("About description is required.")
            return
        }
        if (!projImage) {
            toast.error("Project Image is required.")
            return
        }
        if (!projDate) {
            toast.error("Date is required.")
            return
        }
        if (!projVenue.trim()) {
            toast.error("Venue is required.")
            return
        }
        if (!projCity.trim()) {
            toast.error("City is required.")
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
        setUploadProgress(0)

        const interval = setInterval(() => {
            setUploadProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval)
                    let updatedProposals: StoredProposal[] = []
                    if (selectedProposal) {
                        // Editing existing proposal details
                        updatedProposals = proposals.map(p => {
                            if (p.id === selectedProposal.id) {
                                if (p.status === "PUBLISHED" || !p.status || (p.status === "UNDER_REVIEW" && p.pendingRevision != null)) {
                                    const baseImage = p.pendingRevision?.image || p.image;
                                    const baseImageName = p.pendingRevision?.imageName || p.imageName;
                                    const baseDocFile = p.pendingRevision?.docFile || p.docFile;
                                    const baseDocName = p.pendingRevision?.docName || p.docName;
                                    const baseDocType = p.pendingRevision?.docType || p.docType;
                                    const baseDocSize = p.pendingRevision?.docSize || p.docSize;
                                    return {
                                        ...p,
                                        pendingRevision: {
                                            name: projName,
                                            about: projAbout,
                                            image: projImage || baseImage,
                                            imageName: projImage ? projImage.name : baseImageName,
                                            date: projDate,
                                            venue: projVenue,
                                            city: projCity,
                                            audienceProfile: projAudience,
                                            ageGroup: projAgeGroup,
                                            guestCount: projGuestCount,
                                            docFile: projDoc || baseDocFile,
                                            docName: projDoc ? projDoc.name : baseDocName,
                                            docType: projDoc ? projDoc.type : baseDocType,
                                            docSize: projDoc ? projDoc.size : baseDocSize,
                                            uploadedAt: new Date().toISOString(),
                                            sponsorPrices: sponsorPrices,
                                        }
                                    }
                                } else {
                                    return {
                                        ...p,
                                        name: projName,
                                        about: projAbout,
                                        image: projImage || p.image,
                                        imageName: projImage ? projImage.name : p.imageName,
                                        date: projDate,
                                        venue: projVenue,
                                        city: projCity,
                                        audienceProfile: projAudience,
                                        ageGroup: projAgeGroup,
                                        guestCount: projGuestCount,
                                        docFile: projDoc || p.docFile,
                                        docName: projDoc ? projDoc.name : p.docName,
                                        docType: projDoc ? projDoc.type : p.docType,
                                        docSize: projDoc ? projDoc.size : p.docSize,
                                        uploadedAt: new Date().toISOString(),
                                        status: forceStatus || p.status || "UNDER_REVIEW",
                                        sponsorPrices: sponsorPrices,
                                    }
                                }
                            }
                            return p
                        })
                    } else {
                        // Creating a brand new proposal
                        const newProposal: StoredProposal = {
                            id: Date.now().toString(),
                            name: projName,
                            about: projAbout,
                            image: projImage,
                            imageName: projImage ? projImage.name : "",
                            date: projDate,
                            venue: projVenue,
                            city: projCity,
                            audienceProfile: projAudience,
                            ageGroup: projAgeGroup,
                            guestCount: projGuestCount,
                            docFile: projDoc!,
                            docName: projDoc!.name,
                            docType: projDoc!.type,
                            docSize: projDoc!.size,
                            uploadedAt: new Date().toISOString(),
                            status: forceStatus || "UNDER_REVIEW",
                            sponsorPrices: sponsorPrices,
                        }
                        updatedProposals = [...proposals, newProposal]
                    }

                    saveProposalsList(updatedProposals, hostId)
                        .then((saved) => {
                            setProposals(saved)
                            resetProposalForm()
                            toast.success("Proposal details saved successfully!")
                        })
                        .catch((err) => {
                            console.error(err)
                            toast.error("Failed to save proposal details.")
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

    const handleUpdateFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && selectedProposal) {
            const file = e.target.files[0]
            const allowedExtensions = [".pdf", ".doc", ".docx", ".ppt", ".pptx"]
            const allowedTypes = [
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-powerpoint",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            ]
            const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
            const isValid = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)

            if (!isValid) {
                toast.error("Only PDF, DOC/DOCX, or PPT/PPTX files are accepted.")
                return
            }
            if (file.size > 10 * 1024 * 1024) {
                toast.error("File size cannot exceed 10MB.")
                return
            }

            const updatedProposals = proposals.map(p => {
                if (p.id === selectedProposal.id) {
                    if (p.status === "PUBLISHED" || !p.status || (p.status === "UNDER_REVIEW" && p.pendingRevision != null)) {
                        const updated = {
                            ...p,
                            pendingRevision: {
                                name: p.pendingRevision?.name || p.name,
                                about: p.pendingRevision?.about || p.about,
                                image: p.pendingRevision?.image || p.image,
                                imageName: p.pendingRevision?.imageName || p.imageName,
                                date: p.pendingRevision?.date || p.date,
                                venue: p.pendingRevision?.venue || p.venue,
                                city: p.pendingRevision?.city || p.city,
                                audienceProfile: p.pendingRevision?.audienceProfile || p.audienceProfile,
                                ageGroup: p.pendingRevision?.ageGroup || p.ageGroup,
                                guestCount: p.pendingRevision?.guestCount || p.guestCount,
                                docFile: file,
                                docName: file.name,
                                docType: file.type,
                                docSize: file.size,
                                uploadedAt: new Date().toISOString(),
                            }
                        }
                        setSelectedProposal(updated)
                        return updated
                    } else {
                        const updated = {
                            ...p,
                            docFile: file,
                            docName: file.name,
                            docType: file.type,
                            docSize: file.size,
                            uploadedAt: new Date().toISOString(),
                        }
                        setSelectedProposal(updated)
                        return updated
                    }
                }
                return p
            })

            saveProposalsList(updatedProposals, hostId)
                .then((saved) => {
                    setProposals(saved)
                    toast.success("Document updated successfully!")
                })
                .catch((err) => {
                    console.error(err)
                    toast.error("Failed to update document.")
                })
        }
    }

    const submitProposalForApproval = (proposal: StoredProposal) => {
        const updatedProposals: StoredProposal[] = proposals.map(p => {
            if (p.id === proposal.id) {
                return { ...p, status: "UNDER_REVIEW" }
            }
            return p
        })
        saveProposalsList(updatedProposals, hostId)
            .then((saved) => {
                setProposals(saved)
                toast.success("Proposal submitted for admin approval!")
            })
            .catch(() => {
                toast.error("Failed to submit proposal.")
            })
    }

    const handleMockAdminApprove = (proposal: StoredProposal) => {
        const updatedProposals = proposals.map(p => {
            if (p.id === proposal.id) {
                if (p.pendingRevision) {
                    return {
                        ...p,
                        name: p.pendingRevision.name,
                        about: p.pendingRevision.about,
                        image: p.pendingRevision.image,
                        imageName: p.pendingRevision.imageName,
                        date: p.pendingRevision.date,
                        venue: p.pendingRevision.venue,
                        city: p.pendingRevision.city,
                        audienceProfile: p.pendingRevision.audienceProfile,
                        ageGroup: p.pendingRevision.ageGroup,
                        guestCount: p.pendingRevision.guestCount,
                        docFile: p.pendingRevision.docFile || p.docFile,
                        docName: p.pendingRevision.docName || p.docName,
                        docType: p.pendingRevision.docType || p.docType,
                        docSize: p.pendingRevision.docSize || p.docSize,
                        uploadedAt: new Date().toISOString(),
                        status: "PUBLISHED" as const,
                        sponsorPrices: p.pendingRevision.sponsorPrices || p.sponsorPrices,
                        pendingRevision: undefined,
                    }
                } else {
                    return {
                        ...p,
                        status: "PUBLISHED" as const,
                    }
                }
            }
            return p
        })

        saveProposalsList(updatedProposals, hostId)
            .then((saved) => {
                setProposals(saved)
                const fresh = saved.find(item => item.id === proposal.id) || null
                setSelectedProposal(fresh)
                toast.success("Proposal approved by Admin!")
            })
            .catch(() => {
                toast.error("Failed to approve proposal.")
            })
    }

    const handleMockAdminReject = (proposal: StoredProposal) => {
        const updatedProposals = proposals.map(p => {
            if (p.id === proposal.id) {
                const wasPublished = p.status === "PUBLISHED" || p.pendingRevision != null;
                return {
                    ...p,
                    status: wasPublished ? ("PUBLISHED" as const) : ("REJECTED" as const),
                    pendingRevision: undefined,
                }
            }
            return p
        })

        saveProposalsList(updatedProposals, hostId)
            .then((saved) => {
                setProposals(saved)
                const fresh = saved.find(item => item.id === proposal.id) || null
                setSelectedProposal(fresh)
                toast.error("Proposal rejected by Admin!")
            })
            .catch(() => {
                toast.error("Failed to reject proposal.")
            })
    }

    const resetProposalForm = () => {
        setProjName("")
        setProjAbout("")
        setProjImage(null)
        setProjDate("")
        setProjVenue("")
        setProjCity("")
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
        setProjImage(displayDetails.image as File | null)
        setProjDate(displayDetails.date)
        setProjVenue(displayDetails.venue)
        setProjCity(displayDetails.city)
        setProjAudience(Array.isArray(displayDetails.audienceProfile) ? displayDetails.audienceProfile : displayDetails.audienceProfile ? displayDetails.audienceProfile.split(",").map(x => x.trim()).filter(Boolean) : [])
        setNewAudience("")
        setProjAgeGroup(displayDetails.ageGroup)
        setProjGuestCount(displayDetails.guestCount)
        setProjDoc(displayDetails.docFile as File | null)
        setSponsorPrices(displayDetails.sponsorPrices && displayDetails.sponsorPrices.length > 0 ? displayDetails.sponsorPrices : [{ name: "", price: "" }])

        setIsEditingInPlace(true)
    }

    const handleSaveInPlace = (e: React.FormEvent) => {
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
        if (!projVenue.trim()) {
            toast.error("Venue is required.")
            return
        }
        if (!projCity.trim()) {
            toast.error("City is required.")
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

        const updatedProposals = proposals.map(p => {
            if (p.id === selectedProposal.id) {
                if (p.status === "PUBLISHED" || !p.status || (p.status === "UNDER_REVIEW" && p.pendingRevision != null)) {
                    const baseImage = p.pendingRevision?.image || p.image;
                    const baseImageName = p.pendingRevision?.imageName || p.imageName;
                    const updated = {
                        ...p,
                        pendingRevision: {
                            name: projName,
                            about: projAbout,
                            image: projImage || baseImage,
                            imageName: projImage ? projImage.name : baseImageName,
                            date: projDate,
                            venue: projVenue,
                            city: projCity,
                            audienceProfile: projAudience,
                            ageGroup: projAgeGroup,
                            guestCount: projGuestCount,
                            docFile: p.pendingRevision?.docFile || p.docFile,
                            docName: p.pendingRevision?.docName || p.docName,
                            docType: p.pendingRevision?.docType || p.docType,
                            docSize: p.pendingRevision?.docSize || p.docSize,
                            uploadedAt: new Date().toISOString(),
                            sponsorPrices: sponsorPrices,
                        }
                    }
                    setSelectedProposal(updated)
                    return updated
                } else {
                    const updated = {
                        ...p,
                        name: projName,
                        about: projAbout,
                        image: projImage || p.image,
                        imageName: projImage ? projImage.name : p.imageName,
                        date: projDate,
                        venue: projVenue,
                        city: projCity,
                        audienceProfile: projAudience,
                        ageGroup: projAgeGroup,
                        guestCount: projGuestCount,
                        uploadedAt: new Date().toISOString(),
                        sponsorPrices: sponsorPrices,
                    }
                    setSelectedProposal(updated)
                    return updated
                }
            }
            return p
        })

        saveProposalsList(updatedProposals, hostId)
            .then((saved) => {
                setProposals(saved)
                setIsEditingInPlace(false)
                setShowProjectModal(false)
                toast.success("Project details updated successfully!")
            })
            .catch((err) => {
                console.error(err)
                toast.error("Failed to save project details.")
            })
    }

    const handleDelete = (proposalId?: string) => {
        const idToDelete = proposalId || selectedProposal?.id
        if (!idToDelete) return

        if (confirm("Are you sure you want to delete this proposal?")) {
            const updated = proposals.filter(p => p.id !== idToDelete)
            saveProposalsList(updated, hostId)
                .then((saved) => {
                    setProposals(saved)
                    setSelectedProposal(null)
                    resetProposalForm()
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
            setCategoryIds(community.categoryIds || [])
            setInstagram(community.instagram || profile?.socialLinks?.instagram || "")
            setLinkedin(community.linkedin || profile?.socialLinks?.linkedin || "")
            setYoutube(community.youtube || profile?.socialLinks?.youtube || "")
            setPortfolio(community.portfolio || profile?.socialLinks?.portfolio || "")
            setLogoFile(community.logo as File | null)
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
            setPortfolio(profile?.socialLinks?.portfolio || "")
            setLogoFile(null)
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

        if (categoryIds.length === 0) {
            toast.error("At least one category must be selected.")
            return
        }

        if (!instagram.trim()) {
            toast.error("Instagram profile link is required.")
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
            categoryIds: categoryIds,
            instagram: instagram.trim() || undefined,
            linkedin: linkedin.trim() || undefined,
            youtube: youtube.trim() || undefined,
            portfolio: portfolio.trim() || undefined,
            activatedAt: community?.activatedAt || new Date().toISOString(),
        }

        saveCommunity(communityData, hostId)
            .then(async (saved) => {
                setCommunity(saved)
                setShowActivateModal(false)
                try {
                    const updated = await updateHostProfile({
                        socialLinks: {
                            instagram: instagram.trim() || undefined,
                            linkedin: linkedin.trim() || undefined,
                            youtube: youtube.trim() || undefined,
                            portfolio: portfolio.trim() || undefined,
                        }
                    })
                    setProfile(updated)
                } catch (e) {
                    console.error("Failed to sync social links to host profile", e)
                }
                toast.success(community ? "Community details updated!" : "Community activated successfully!")
            })
            .catch((err) => {
                console.error(err)
                toast.error("Failed to save activation details.")
            })
    }

    const handleDeactivate = () => {
        if (confirm("Are you sure you want to deactivate the community? Both community details and uploaded proposals will be removed.")) {
            Promise.all([deleteCommunity(hostId), deleteProposalsList(hostId)])
                .then(() => {
                    setCommunity(null)
                    setProposals([])
                    setSelectedProposal(null)
                    toast.success("Community deactivated and proposals cleared.")
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
                <div className="max-w-4xl">
                    {loading ? (
                        <>
                            <div className="mb-6">
                                <h1 className="text-heading-sm font-semibold text-text-primary">Sponsorships</h1>
                                <p className="text-body-sm text-text-secondary mt-0.5">Activate your community and upload your proposal</p>
                            </div>
                            <div className="bg-surface-card border border-border-default rounded-action p-12 text-center max-w-2xl">
                                <p className="text-text-secondary">Loading details...</p>
                            </div>
                        </>
                    ) : !community ? (
                        <>
                            <div className="mb-6">
                                <h1 className="text-heading-sm font-semibold text-text-primary">Sponsorships</h1>
                                <p className="text-body-sm text-text-secondary mt-0.5">Activate your community and upload your proposal</p>
                            </div>
                            {/* State 1: Not Activated yet. User must fill in details first. */}
                            <div className="bg-surface-card border border-border-default rounded-action p-8 text-center max-w-2xl flex flex-col items-center">
                                <div className="size-16 rounded-full bg-surface-brand-soft flex items-center justify-center mb-4">
                                    <Icon as={DocumentTextSvg} size="lg" color="brand" />
                                </div>
                                <h2 className="text-label-lg font-semibold text-text-primary mb-2">Sponsorships</h2>
                                <p className="text-body-sm text-text-secondary mb-6 max-w-md">
                                    Before uploading your proposal document, please provide details about your community.
                                </p>
                                <Button variant="primary" size="md" radius="pill" onClick={openActivationModal}>
                                    Activate
                                </Button>
                            </div>
                        </>
                    ) : selectedProposal && !isEditingInPlace ? (
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
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                                        className="hidden"
                                        onChange={handleUpdateFile}
                                    />
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        radius="pill"
                                        onClick={() => {
                                            handleEditDetails()
                                            setShowProjectModal(true)
                                        }}
                                    >
                                        Edit details
                                    </Button>
                                    {(selectedProposal.status === "DRAFT" || selectedProposal.status === "REJECTED") && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            radius="pill"
                                            onClick={() => {
                                                submitProposalForApproval(selectedProposal)
                                                setSelectedProposal(prev => prev ? { ...prev, status: "UNDER_REVIEW" } : null)
                                            }}
                                        >
                                            Submit for Approval
                                        </Button>
                                    )}
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        radius="pill"
                                        onClick={() => updateDocInputRef.current?.click()}
                                    >
                                        Update file
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        radius="pill"
                                        className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                                        onClick={() => {
                                            handleDelete(selectedProposal.id);
                                        }}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>

                            {/* Banners */}
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
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* Left column - Metadata */}
                                <div className="lg:col-span-3 flex flex-col gap-6">
                                    {projectImageUrl && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={projectImageUrl} alt={displayDetails?.name} className="w-full h-40 object-cover rounded-xl border border-border-default shadow-sm" />
                                    )}
                                    <div className="bg-surface-card-muted border border-border-default rounded-action p-5 flex flex-col gap-4">
                                        <div>
                                            <p className="text-[10px] text-text-tertiary font-semibold uppercase tracking-wider">Date & City</p>
                                            <p className="text-label-sm font-semibold text-text-primary mt-0.5">{displayDetails?.date} • {displayDetails?.city}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-text-tertiary font-semibold uppercase tracking-wider">Venue</p>
                                            <p className="text-label-sm font-semibold text-text-primary mt-0.5">{displayDetails?.venue}</p>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border-default/50">
                                            <div>
                                                <p className="text-[10px] text-text-tertiary font-semibold uppercase tracking-wider">Guests</p>
                                                <p className="text-label-sm font-semibold text-text-primary mt-0.5">{displayDetails?.guestCount}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-text-tertiary font-semibold uppercase tracking-wider">Age Group</p>
                                                <p className="text-label-sm font-semibold text-text-primary mt-0.5">{displayDetails?.ageGroup}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-text-tertiary font-semibold uppercase tracking-wider">Audience</p>
                                                <p className="text-label-sm font-semibold text-text-primary mt-0.5 truncate" title={Array.isArray(displayDetails?.audienceProfile) ? displayDetails.audienceProfile.join(", ") : displayDetails?.audienceProfile}>
                                                    {Array.isArray(displayDetails?.audienceProfile) ? displayDetails.audienceProfile.join(", ") : displayDetails?.audienceProfile}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-surface-card border border-border-default rounded-action p-5">
                                        <h4 className="text-label-sm font-semibold text-text-primary mb-2">About the Project</h4>
                                        <p className="text-body-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{displayDetails?.about}</p>
                                    </div>

                                    {displayDetails?.sponsorPrices && displayDetails.sponsorPrices.length > 0 && (
                                        <div className="bg-surface-card border border-border-default rounded-action p-5 flex flex-col gap-3">
                                            <h4 className="text-label-sm font-semibold text-text-primary">Sponsor Pricing Tiers</h4>
                                            <div className="flex flex-col gap-2">
                                                {displayDetails.sponsorPrices.map((sp: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-center text-sm border-b border-border-default/40 pb-1.5 last:border-b-0 last:pb-0">
                                                        <span className="text-text-secondary font-medium">{sp.name}</span>
                                                        <span className="text-text-brand font-semibold">{sp.price}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right column - PDF Preview */}
                                <div className="lg:col-span-9 flex flex-col gap-3">
                                    <h4 className="text-label-md font-semibold text-text-primary">Document Preview</h4>
                                    {displayDetails?.docType?.includes("pdf") || displayDetails?.docName?.toLowerCase().endsWith(".pdf") ? (
                                        <div className="border border-border-default rounded-action overflow-hidden bg-surface-card shadow-sm h-[750px]">
                                            {previewUrl ? (
                                                <iframe
                                                    src={previewUrl}
                                                    className="w-full h-full border-none"
                                                    title="Proposal Preview"
                                                />
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
                        /* Community activated. Now they can view/edit details and upload/view the proposal. */
                        <div className="flex flex-col gap-8">
                            <div>
                                <h1 className="text-heading-sm font-semibold text-text-primary mb-4">Community profile</h1>

                                {/* Activated Community Details Card */}
                                <div className="bg-surface-card border border-border-default rounded-action p-4 w-full shadow-sm">
                                    <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-border-default">
                                        <div className="flex items-center gap-3">
                                            {communityLogoUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={communityLogoUrl} alt={community.name} className="size-8 rounded-lg object-cover border border-border-default" />
                                            ) : (
                                                <div className="size-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-700 text-[10px] font-bold">
                                                    {community.name.substring(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="text-label-md font-semibold text-text-primary">{community.name}</h3>
                                                <p className="text-caption text-text-tertiary">Community profile</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
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

                                    <div className="flex flex-col gap-2">
                                        {community.about && (
                                            <div>
                                                <p className="text-[10px] text-text-tertiary">About the Community</p>
                                                <p className="text-body-sm text-text-secondary mt-0.5 leading-relaxed">{community.about}</p>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-3 gap-3 mt-1">
                                            {community.size && (
                                                <div>
                                                    <p className="text-[10px] text-text-tertiary">Community Size</p>
                                                    <p className="text-body-sm font-semibold text-text-primary mt-0.5">{community.size} members</p>
                                                </div>
                                            )}
                                            {community.avgGuestCount && (
                                                <div>
                                                    <p className="text-[10px] text-text-tertiary">Avg Guest Count</p>
                                                    <p className="text-body-sm font-semibold text-text-primary mt-0.5">{community.avgGuestCount} guests</p>
                                                </div>
                                            )}
                                            {community.experiencesPerYear && (
                                                <div>
                                                    <p className="text-[10px] text-text-tertiary">Experiences/Year</p>
                                                    <p className="text-body-sm font-semibold text-text-primary mt-0.5">{community.experiencesPerYear}</p>
                                                </div>
                                            )}
                                            {community.categoryIds && community.categoryIds.length > 0 && (
                                                <div className="col-span-3 mt-1">
                                                    <p className="text-[10px] text-text-tertiary">Categories</p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {community.categoryIds.map((catId) => {
                                                            const cat = categories.find(c => c.id === catId)
                                                            if (!cat) return null
                                                            return (
                                                                <span
                                                                    key={catId}
                                                                    className="inline-flex items-center px-2 py-0.5 rounded-badge text-[10px] font-medium bg-surface-brand-soft text-text-brand border border-border-brand"
                                                                >
                                                                    {cat.name}
                                                                </span>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                            {(community.instagram || community.linkedin || community.youtube || community.portfolio) && (
                                                <div className="col-span-3 mt-1 pt-1.5 border-t border-border-default">
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                                                        {community.instagram && <p className="text-[11px] text-text-secondary">Instagram: <a href={`https://${community.instagram}`} target="_blank" rel="noopener noreferrer" className="text-text-brand hover:underline">{community.instagram}</a></p>}
                                                        {community.linkedin && <p className="text-[11px] text-text-secondary">LinkedIn: <a href={`https://${community.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-text-brand hover:underline">{community.linkedin}</a></p>}
                                                        {community.youtube && <p className="text-[11px] text-text-secondary">YouTube: <a href={`https://${community.youtube}`} target="_blank" rel="noopener noreferrer" className="text-text-brand hover:underline">{community.youtube}</a></p>}
                                                        {community.portfolio && <p className="text-[11px] text-text-secondary">Website: <a href={`https://${community.portfolio}`} target="_blank" rel="noopener noreferrer" className="text-text-brand hover:underline">{community.portfolio}</a></p>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-border-default" />

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
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h1 className="text-heading-sm font-semibold text-text-primary">My Sponsorships</h1>
                                                <p className="text-body-sm text-text-secondary mt-0.5">Manage and organize your sponsorship proposals</p>
                                            </div>
                                            <Button variant="primary" size="sm" radius="pill" onClick={() => openProposalForm()}>
                                                + Create New Proposal
                                            </Button>
                                        </div>

                                        {/* Status tabs */}
                                        <Tabs
                                            items={[
                                                { value: "ALL", label: "All", count: allCount },
                                                { value: "DRAFT", label: "Draft", count: draftCount },
                                                { value: "UNDER_REVIEW", label: "Under Review", count: underReviewCount },
                                                { value: "REJECTED", label: "Rejected", count: rejectedCount },
                                                { value: "PUBLISHED", label: "Published", count: publishedCount }
                                            ]}
                                            value={activeTab}
                                            onChange={(val: any) => setActiveTab(val)}
                                            variant="pill"
                                            className="w-fit"
                                        />

                                        {filteredProposals.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-20 text-center gap-3 bg-surface-card border border-border-default rounded-action">
                                                <div className="size-12 rounded-full bg-surface-card-muted flex items-center justify-center">
                                                    <Icon as={DocumentTextSvg} size="md" color="secondary" />
                                                </div>
                                                <p className="text-label-md font-semibold text-text-primary">No proposals found</p>
                                                <p className="text-body-sm text-text-muted max-w-xs">
                                                    No proposals in this category yet.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
                                                {filteredProposals.map((p) => {
                                                    const isViewingRevision = activeTab === "UNDER_REVIEW" && p.pendingRevision != null;
                                                    const cardData = isViewingRevision ? p.pendingRevision! : p;
                                                    const imgUrl = cardData.image ? URL.createObjectURL(cardData.image) : null;
                                                    return (
                                                        <div
                                                            key={p.id}
                                                            onClick={() => setSelectedProposal(p)}
                                                            className="group relative cursor-pointer bg-surface-card border border-border-default rounded-action hover:border-border-strong hover:shadow-card-hover transition-all overflow-hidden flex flex-col justify-between"
                                                        >
                                                            <div>
                                                                {/* Image */}
                                                                <div className="relative aspect-16/10 overflow-hidden bg-surface-card-muted border-b border-border-default">
                                                                    {imgUrl ? (
                                                                        // eslint-disable-next-line @next/next/no-img-element
                                                                        <img
                                                                            src={imgUrl}
                                                                            alt={cardData.name}
                                                                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                                                                            onLoad={() => imgUrl && URL.revokeObjectURL(imgUrl)}
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full bg-linear-to-br from-surface-card-muted to-border-default flex items-center justify-center text-text-tertiary font-bold text-lg">
                                                                            {cardData.name.substring(0, 2).toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                    <span
                                                                        className={clsx(
                                                                            "absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-badge uppercase tracking-wider border",
                                                                            p.status === "DRAFT" && "bg-neutral-100 text-neutral-700 border-neutral-300",
                                                                            isViewingRevision && "bg-amber-50 text-amber-700 border-amber-200",
                                                                            (!isViewingRevision && p.status === "UNDER_REVIEW") && "bg-amber-50 text-amber-700 border-amber-200",
                                                                            p.status === "REJECTED" && "bg-rose-50 text-rose-700 border-rose-200",
                                                                            (!isViewingRevision && (p.status === "PUBLISHED" || !p.status)) && "bg-green-50 text-green-700 border-green-200"
                                                                        )}
                                                                    >
                                                                        {p.status === "DRAFT" && "Draft"}
                                                                        {isViewingRevision && "Revision Under Review"}
                                                                        {!isViewingRevision && p.status === "UNDER_REVIEW" && "Under Review"}
                                                                        {p.status === "REJECTED" && "Rejected"}
                                                                        {!isViewingRevision && (p.status === "PUBLISHED" || !p.status) && "Published"}
                                                                    </span>

                                                                    {/* Kebab button */}
                                                                    <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setOpenKebabId(openKebabId === p.id ? null : p.id)}
                                                                            className="flex items-center justify-center size-7 rounded-full bg-white/95 shadow-sm border border-border-default hover:bg-white text-text-secondary hover:text-text-primary transition-colors"
                                                                        >
                                                                            <Icon as={DotsSvg} size="xs" />
                                                                        </button>
                                                                        {openKebabId === p.id && (
                                                                            <div className="absolute right-0 top-8 z-20 w-36 bg-surface-card border border-border-default rounded-action shadow-floating py-1 flex flex-col">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        setSelectedProposal(p)
                                                                                        setOpenKebabId(null)
                                                                                    }}
                                                                                    className="px-3 py-1.5 text-left text-xs text-text-primary hover:bg-surface-card-muted transition-colors font-medium"
                                                                                >
                                                                                    View details
                                                                                </button>
                                                                                {(p.status === "DRAFT" || p.status === "REJECTED") && (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            submitProposalForApproval(p)
                                                                                            setOpenKebabId(null)
                                                                                        }}
                                                                                        className="px-3 py-1.5 text-left text-xs text-text-primary hover:bg-surface-card-muted transition-colors font-medium"
                                                                                    >
                                                                                        Submit for Approval
                                                                                    </button>
                                                                                )}
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        handleDelete(p.id)
                                                                                        setOpenKebabId(null)
                                                                                    }}
                                                                                    className="px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 transition-colors font-semibold"
                                                                                >
                                                                                    Delete
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Content */}
                                                                <div className="p-4 flex flex-col gap-1.5">
                                                                    <h3 className="text-label-md font-semibold text-text-primary truncate group-hover:text-text-brand transition-colors">{cardData.name}</h3>
                                                                    <p className="text-caption text-text-secondary">{cardData.city} • {cardData.venue}</p>
                                                                    <p className="text-[11px] text-text-tertiary truncate mt-1">{cardData.about}</p>
                                                                </div>
                                                            </div>

                                                            {/* Footer info */}
                                                            <div className="p-4 pt-0">
                                                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-default">
                                                                    <span className="text-[10px] text-text-tertiary">Date: {cardData.date}</span>
                                                                    {cardData.sponsorPrices && cardData.sponsorPrices[0] && (
                                                                        <span className="text-[10px] font-semibold text-text-secondary bg-surface-card-muted px-2 py-0.5 rounded-badge border border-border-default mr-1.5">
                                                                            {cardData.sponsorPrices[0].name}: {cardData.sponsorPrices[0].price}
                                                                        </span>
                                                                    )}
                                                                    <span className="text-[10px] font-semibold text-text-brand bg-surface-brand-soft px-2 py-0.5 rounded-badge border border-border-brand">
                                                                        {cardData.guestCount} guests
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
                                    <div className="bg-surface-card border border-border-default rounded-action p-8 text-center w-full max-w-2xl mx-auto flex flex-col items-center">
                                        <div className="size-16 rounded-full bg-surface-brand-soft flex items-center justify-center mb-4">
                                            <Icon as={DocumentTextSvg} size="lg" color="brand" />
                                        </div>
                                        <h2 className="text-label-lg font-semibold text-text-primary mb-2">No active proposals</h2>
                                        <p className="text-body-sm text-text-secondary mb-6 max-w-md">
                                            Create a comprehensive proposal detailing your project features, target audience, venue details and budget.
                                        </p>
                                        <Button variant="primary" size="md" radius="pill" onClick={() => openProposalForm()}>
                                            Create Sponsorship Proposal
                                        </Button>
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

                            {/* Categories */}
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-label-sm font-semibold text-text-primary">Categories *</label>
                                    <span className="text-caption text-text-muted">Pick all that apply</span>
                                </div>
                                {categories.length === 0 ? (
                                    <p className="text-caption text-text-muted">Loading categories…</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {categories.map(cat => {
                                            const active = categoryIds.includes(cat.id)
                                            return (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setCategoryIds(prev =>
                                                            prev.includes(cat.id)
                                                                ? prev.filter(id => id !== cat.id)
                                                                : [...prev, cat.id]
                                                        )
                                                    }}
                                                    className={`px-3 py-1.5 rounded-avatar border text-xs font-medium transition-colors ${active
                                                        ? "border-border-focus bg-surface-brand-soft text-text-brand font-semibold"
                                                        : "border-border-default bg-surface-canvas text-text-secondary hover:border-border-strong"
                                                        }`}
                                                >
                                                    {cat.name}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Social Media Links */}
                            <div className="flex flex-col gap-3">
                                <label className="text-label-sm font-semibold text-text-primary">Social media links</label>
                                <div className="flex flex-col gap-2.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-caption text-text-secondary w-20">Instagram</span>
                                        <input
                                            type="text"
                                            value={instagram}
                                            onChange={(e) => setInstagram(e.target.value)}
                                            placeholder="instagram.com/handle"
                                            className="flex-1 h-9 px-3 rounded-input border border-border-default bg-surface-canvas text-text-primary outline-none focus:border-border-focused hover:border-border-strong text-sm transition-colors"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-caption text-text-secondary w-20">LinkedIn</span>
                                        <input
                                            type="text"
                                            value={linkedin}
                                            onChange={(e) => setLinkedin(e.target.value)}
                                            placeholder="linkedin.com/in/profile"
                                            className="flex-1 h-9 px-3 rounded-input border border-border-default bg-surface-canvas text-text-primary outline-none focus:border-border-focused hover:border-border-strong text-sm transition-colors"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-caption text-text-secondary w-20">YouTube</span>
                                        <input
                                            type="text"
                                            value={youtube}
                                            onChange={(e) => setYoutube(e.target.value)}
                                            placeholder="youtube.com/@channel"
                                            className="flex-1 h-9 px-3 rounded-input border border-border-default bg-surface-canvas text-text-primary outline-none focus:border-border-focused hover:border-border-strong text-sm transition-colors"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-caption text-text-secondary w-20">Website</span>
                                        <input
                                            type="text"
                                            value={portfolio}
                                            onChange={(e) => setPortfolio(e.target.value)}
                                            placeholder="yourwebsite.com"
                                            className="flex-1 h-9 px-3 rounded-input border border-border-default bg-surface-canvas text-text-primary outline-none focus:border-border-focused hover:border-border-strong text-sm transition-colors"
                                        />
                                    </div>
                                </div>
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
            {/* ─── Project Details & PDF Modal ────────────────────────────────────────── */}
            {showProjectModal && selectedProposal && isEditingInPlace && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
                    <form
                        onSubmit={handleSaveInPlace}
                        className="bg-surface-card rounded-panel border border-border-default shadow-floating w-full max-w-2xl p-6 my-8 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
                    >
                        {/* Modal Header */}
                        <div className="flex justify-between items-center pb-4 mb-4 border-b border-border-default shrink-0">
                            <div>
                                <h2 className="text-heading-xs font-semibold text-text-primary">Edit Project Details</h2>
                                <p className="text-caption text-text-tertiary">Modify project overview fields</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsEditingInPlace(false)}
                                className="text-text-secondary hover:text-text-primary size-8 rounded-full flex items-center justify-center hover:bg-surface-card-muted transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
                            {/* Name */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-label-sm font-semibold text-text-primary">Project Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={projName}
                                    onChange={(e) => setProjName(e.target.value)}
                                    placeholder="Project Name"
                                    className="h-10 px-4 rounded-input border border-border-default bg-surface-canvas text-text-primary outline-none focus:border-border-focused hover:border-border-strong text-sm transition-colors"
                                />
                            </div>

                            {/* About */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-label-sm font-semibold text-text-primary">About the Project *</label>
                                <textarea
                                    required
                                    value={projAbout}
                                    onChange={(e) => setProjAbout(e.target.value)}
                                    placeholder="Describe the project..."
                                    rows={3}
                                    className="p-3 rounded-input border border-border-default bg-surface-canvas text-text-primary outline-none focus:border-border-focused hover:border-border-strong text-sm transition-colors resize-y"
                                />
                            </div>

                            {/* Image picker */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-label-sm font-semibold text-text-primary">Project Image *</label>
                                <div className="flex items-center gap-4">
                                    {projImagePreview ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={projImagePreview} alt="Preview" className="size-16 rounded-xl object-cover border border-border-default" />
                                    ) : projectImageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={projectImageUrl} alt="Current" className="size-16 rounded-xl object-cover border border-border-default" />
                                    ) : (
                                        <div className="size-16 rounded-xl bg-surface-card-muted border border-dashed border-border-default flex items-center justify-center text-text-tertiary text-xs">
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
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="xs"
                                            radius="md"
                                            onClick={() => projImageInputRef.current?.click()}
                                        >
                                            Change Image
                                        </Button>
                                        <span className="text-[10px] text-text-tertiary">JPEG, JPG, PNG accepted. Max 5MB.</span>
                                    </div>
                                </div>
                            </div>

                            {/* Date, City */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-label-sm font-semibold text-text-primary">Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={projDate}
                                        onChange={(e) => setProjDate(e.target.value)}
                                        className="h-10 px-4 rounded-input border border-border-default bg-surface-canvas text-text-primary outline-none focus:border-border-focused hover:border-border-strong text-sm transition-colors"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-label-sm font-semibold text-text-primary">City *</label>
                                    <input
                                        type="text"
                                        required
                                        value={projCity}
                                        onChange={(e) => setProjCity(e.target.value)}
                                        placeholder="City"
                                        className="h-10 px-4 rounded-input border border-border-default bg-surface-canvas text-text-primary outline-none focus:border-border-focused hover:border-border-strong text-sm transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Venue */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-label-sm font-semibold text-text-primary">Venue *</label>
                                <input
                                    type="text"
                                    required
                                    value={projVenue}
                                    onChange={(e) => setProjVenue(e.target.value)}
                                    placeholder="Venue"
                                    className="h-10 px-4 rounded-input border border-border-default bg-surface-canvas text-text-primary outline-none focus:border-border-focused hover:border-border-strong text-sm transition-colors"
                                />
                            </div>

                            {/* Audience Profile (Multiple Submission Input Box) */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-label-sm font-semibold text-text-primary">Audience Profile *</label>
                                <div className="flex gap-2">
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
                                        placeholder="e.g. Tech Founders (press Add or Enter)"
                                        className="flex-1 h-10 px-4 rounded-input border border-border-default bg-surface-canvas text-text-primary outline-none focus:border-border-focused hover:border-border-strong text-sm transition-colors"
                                    />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        radius="md"
                                        onClick={() => {
                                            const trimmed = newAudience.trim()
                                            if (trimmed && !projAudience.includes(trimmed)) {
                                                setProjAudience([...projAudience, trimmed])
                                                setNewAudience("")
                                            }
                                        }}
                                    >
                                        Add
                                    </Button>
                                </div>
                                {projAudience.length > 0 ? (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {projAudience.map((aud, idx) => (
                                            <span
                                                key={idx}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-badge text-label-sm font-medium bg-surface-brand-soft text-text-brand border border-border-brand animate-in fade-in duration-100"
                                            >
                                                {aud}
                                                <button
                                                    type="button"
                                                    onClick={() => setProjAudience(projAudience.filter((_, i) => i !== idx))}
                                                    className="size-4 hover:bg-surface-brand-hover rounded-full flex items-center justify-center text-text-brand text-xs font-bold transition-colors"
                                                >
                                                    ✕
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-text-tertiary">Add at least one targeted audience profile.</p>
                                )}
                            </div>

                            {/* Age Group, Guests */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-label-sm font-semibold text-text-primary">Age Group *</label>
                                    <input
                                        type="text"
                                        required
                                        value={projAgeGroup}
                                        onChange={(e) => setProjAgeGroup(e.target.value)}
                                        placeholder="Age Group"
                                        className="h-10 px-4 rounded-input border border-border-default bg-surface-canvas text-text-primary outline-none focus:border-border-focused hover:border-border-strong text-sm transition-colors"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-label-sm font-semibold text-text-primary">Guests Count *</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={projGuestCount}
                                        onChange={(e) => setProjGuestCount(e.target.value)}
                                        placeholder="Guests"
                                        className="h-10 px-4 rounded-input border border-border-default bg-surface-canvas text-text-primary outline-none focus:border-border-focused hover:border-border-strong text-sm transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Sponsor Price Tiers */}
                            <div className="flex flex-col gap-2.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-label-sm font-semibold text-text-primary">Sponsor Pricing *</label>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="xs"
                                        radius="md"
                                        onClick={() => setSponsorPrices([...sponsorPrices, { name: "", price: "" }])}
                                    >
                                        + Add Sponsor Price
                                    </Button>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {sponsorPrices.map((sp, idx) => (
                                        <div key={idx} className="flex gap-2 items-center animate-in fade-in duration-100">
                                            <input
                                                type="text"
                                                required
                                                value={sp.name}
                                                onChange={(e) => {
                                                    const next = [...sponsorPrices]
                                                    next[idx] = { ...next[idx], name: e.target.value }
                                                    setSponsorPrices(next)
                                                }}
                                                placeholder="Sponsor Tier Name (e.g. Gold)"
                                                className="flex-1 h-10 px-4 rounded-input border border-border-default bg-surface-canvas text-text-primary outline-none focus:border-border-focused hover:border-border-strong text-sm transition-colors"
                                            />
                                            <input
                                                type="text"
                                                required
                                                value={sp.price}
                                                onChange={(e) => {
                                                    const next = [...sponsorPrices]
                                                    next[idx] = { ...next[idx], price: e.target.value }
                                                    setSponsorPrices(next)
                                                }}
                                                placeholder="Price (e.g. $5,000)"
                                                className="w-48 h-10 px-4 rounded-input border border-border-default bg-surface-canvas text-text-primary outline-none focus:border-border-focused hover:border-border-strong text-sm transition-colors"
                                            />
                                            {sponsorPrices.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSponsorPrices(sponsorPrices.filter((_, i) => i !== idx))}
                                                    className="size-10 rounded-input border border-border-default bg-surface-canvas flex items-center justify-center text-text-secondary hover:text-red-600 hover:border-red-200 transition-colors shrink-0 text-lg font-bold"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-border-default shrink-0">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                radius="md"
                                onClick={() => setIsEditingInPlace(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                size="sm"
                                radius="md"
                            >
                                Save details
                            </Button>
                        </div>
                    </form>
                </div>
            )}
            {showProposalForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
                    <form
                        onSubmit={handleProposalSubmit}
                        className="bg-surface-card rounded-panel border border-border-default shadow-floating w-full max-w-2xl p-6 my-8 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
                    >
                        {/* Modal Header */}
                        <div className="flex justify-between items-center pb-4 mb-4 border-b border-border-default shrink-0">
                            <div>
                                <h2 className="text-heading-xs font-semibold text-text-primary">
                                    {selectedProposal ? "Edit Sponsorship Proposal" : "Create Sponsorship Proposal"}
                                </h2>
                                <p className="text-caption text-text-tertiary">Provide details and upload your proposal document</p>
                            </div>
                            <button
                                type="button"
                                onClick={resetProposalForm}
                                className="text-text-secondary hover:text-text-primary size-8 rounded-full flex items-center justify-center hover:bg-surface-card-muted transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
                            {/* Name */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-label-sm font-semibold text-text-primary">Project Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={projName}
                                    onChange={(e) => setProjName(e.target.value)}
                                    placeholder="e.g. Annual Charity Gala"
                                    className="h-10 px-4 rounded-input border border-border-default bg-surface-canvas text-text-primary outline-none focus:border-border-focused hover:border-border-strong text-sm transition-colors"
                                />
                            </div>

                            {/* About */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-label-sm font-semibold text-text-primary">About the Project *</label>
                                <textarea
                                    required
                                    value={projAbout}
                                    onChange={(e) => setProjAbout(e.target.value)}
                                    placeholder="Describe what the event/experience is about..."
                                    rows={3}
                                    className="p-3 rounded-input border border-border-default bg-surface-canvas text-text-primary outline-none focus:border-border-focused hover:border-border-strong text-sm transition-colors resize-y"
                                />
                            </div>

                            {/* Image */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-label-sm font-semibold text-text-primary">Project Image *</label>
                                <div className="flex items-center gap-4">
                                    {projImagePreview ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={projImagePreview} alt="Preview" className="size-16 rounded-xl object-cover border border-border-default" />
                                    ) : selectedProposal?.image ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={URL.createObjectURL(selectedProposal.image)} alt="Current" className="size-16 rounded-xl object-cover border border-border-default" />
                                    ) : (
                                        <div className="size-16 rounded-xl bg-surface-card-muted border border-dashed border-border-default flex items-center justify-center text-text-tertiary text-xs">
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
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="xs"
                                            radius="md"
                                            onClick={() => projImageInputRef.current?.click()}
                                        >
                                            Choose Image
                                        </Button>
                                        <span className="text-[10px] text-text-tertiary">JPEG, JPG, PNG accepted. Max 5MB.</span>
                                    </div>
                                </div>
                            </div>

                            {/* Date, City */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-label-sm font-semibold text-text-primary">Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={projDate}
                                        onChange={(e) => setProjDate(e.target.value)}
                                        className="h-10 px-4 rounded-input border border-border-default bg-surface-canvas text-text-primary outline-none focus:border-border-focused hover:border-border-strong text-sm transition-colors"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-label-sm font-semibold text-text-primary">City *</label>
                                    <input
                                        type="text"
                                        required
                                        value={projCity}
                                        onChange={(e) => setProjCity(e.target.value)}
                                        placeholder="e.g. San Francisco"
                                        className="h-10 px-4 rounded-input border border-border-default bg-surface-canvas text-text-primary outline-none focus:border-border-focused hover:border-border-strong text-sm transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Venue */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-label-sm font-semibold text-text-primary">Venue *</label>
                                <input
                                    type="text"
                                    required
                                    value={projVenue}
                                    onChange={(e) => setProjVenue(e.target.value)}
                                    placeholder="e.g. Palace of Fine Arts"
                                    className="h-10 px-4 rounded-input border border-border-default bg-surface-canvas text-text-primary outline-none focus:border-border-focused hover:border-border-strong text-sm transition-colors"
                                />
                            </div>

                            {/* Audience Profile (Multiple Submission Input Box) */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-label-sm font-semibold text-text-primary">Audience Profile *</label>
                                <div className="flex gap-2">
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
                                        placeholder="e.g. Tech Founders (press Add or Enter)"
                                        className="flex-1 h-10 px-4 rounded-input border border-border-default bg-surface-canvas text-text-primary outline-none focus:border-border-focused hover:border-border-strong text-sm transition-colors"
                                    />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        radius="md"
                                        onClick={() => {
                                            const trimmed = newAudience.trim()
                                            if (trimmed && !projAudience.includes(trimmed)) {
                                                setProjAudience([...projAudience, trimmed])
                                                setNewAudience("")
                                            }
                                        }}
                                    >
                                        Add
                                    </Button>
                                </div>
                                {projAudience.length > 0 ? (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {projAudience.map((aud, idx) => (
                                            <span
                                                key={idx}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-badge text-label-sm font-medium bg-surface-brand-soft text-text-brand border border-border-brand animate-in fade-in duration-100"
                                            >
                                                {aud}
                                                <button
                                                    type="button"
                                                    onClick={() => setProjAudience(projAudience.filter((_, i) => i !== idx))}
                                                    className="size-4 hover:bg-surface-brand-hover rounded-full flex items-center justify-center text-text-brand text-xs font-bold transition-colors"
                                                >
                                                    ✕
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-text-tertiary">Add at least one targeted audience profile.</p>
                                )}
                            </div>

                            {/* Age Group, Number of Guests */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-label-sm font-semibold text-text-primary">Age Group *</label>
                                    <input
                                        type="text"
                                        required
                                        value={projAgeGroup}
                                        onChange={(e) => setProjAgeGroup(e.target.value)}
                                        placeholder="e.g. 21-40"
                                        className="h-10 px-4 rounded-input border border-border-default bg-surface-canvas text-text-primary outline-none focus:border-border-focused hover:border-border-strong text-sm transition-colors"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-label-sm font-semibold text-text-primary">Guests Count *</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={projGuestCount}
                                        onChange={(e) => setProjGuestCount(e.target.value)}
                                        placeholder="e.g. 150"
                                        className="h-10 px-4 rounded-input border border-border-default bg-surface-canvas text-text-primary outline-none focus:border-border-focused hover:border-border-strong text-sm transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Sponsor Price Tiers */}
                            <div className="flex flex-col gap-2.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-label-sm font-semibold text-text-primary">Sponsor Pricing *</label>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="xs"
                                        radius="md"
                                        onClick={() => setSponsorPrices([...sponsorPrices, { name: "", price: "" }])}
                                    >
                                        + Add Sponsor Price
                                    </Button>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {sponsorPrices.map((sp, idx) => (
                                        <div key={idx} className="flex gap-2 items-center animate-in fade-in duration-100">
                                            <input
                                                type="text"
                                                required
                                                value={sp.name}
                                                onChange={(e) => {
                                                    const next = [...sponsorPrices]
                                                    next[idx] = { ...next[idx], name: e.target.value }
                                                    setSponsorPrices(next)
                                                }}
                                                placeholder="Sponsor Tier Name (e.g. Gold)"
                                                className="flex-1 h-10 px-4 rounded-input border border-border-default bg-surface-canvas text-text-primary outline-none focus:border-border-focused hover:border-border-strong text-sm transition-colors"
                                            />
                                            <input
                                                type="text"
                                                required
                                                value={sp.price}
                                                onChange={(e) => {
                                                    const next = [...sponsorPrices]
                                                    next[idx] = { ...next[idx], price: e.target.value }
                                                    setSponsorPrices(next)
                                                }}
                                                placeholder="Price (e.g. $5,000)"
                                                className="w-48 h-10 px-4 rounded-input border border-border-default bg-surface-canvas text-text-primary outline-none focus:border-border-focused hover:border-border-strong text-sm transition-colors"
                                            />
                                            {sponsorPrices.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSponsorPrices(sponsorPrices.filter((_, i) => i !== idx))}
                                                    className="size-10 rounded-input border border-border-default bg-surface-canvas flex items-center justify-center text-text-secondary hover:text-red-600 hover:border-red-200 transition-colors shrink-0 text-lg font-bold"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Upload Proposal Doc */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-label-sm font-semibold text-text-primary">Upload Proposal (PDF/DOC/PPT) {selectedProposal ? "" : "*"}</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        ref={projDocInputRef}
                                        type="file"
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                                        className="hidden"
                                        onChange={handleProjDocChange}
                                    />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="xs"
                                        radius="md"
                                        onClick={() => projDocInputRef.current?.click()}
                                    >
                                        Choose Proposal File
                                    </Button>
                                    {projDoc ? (
                                        <span className="text-xs text-text-secondary font-medium truncate max-w-xs">{projDoc.name}</span>
                                    ) : selectedProposal ? (
                                        <span className="text-xs text-text-secondary font-medium truncate max-w-xs">{selectedProposal.docName} (unchanged)</span>
                                    ) : (
                                        <span className="text-[10px] text-text-tertiary">PDF, DOC, DOCX, PPT, PPTX accepted. Max 10MB.</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-border-default shrink-0">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                radius="pill"
                                onClick={resetProposalForm}
                            >
                                Cancel
                            </Button>
                            {(!selectedProposal || selectedProposal.status === "DRAFT" || selectedProposal.status === "REJECTED") && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    radius="pill"
                                    onClick={(e) => handleProposalSubmit(e, "DRAFT")}
                                >
                                    Save as Draft
                                </Button>
                            )}
                            <Button
                                type="submit"
                                variant="primary"
                                size="sm"
                                radius="pill"
                                onClick={(e) => {
                                    const nextStatus = (selectedProposal && (selectedProposal.status === "UNDER_REVIEW" || selectedProposal.status === "PUBLISHED")) 
                                        ? selectedProposal.status 
                                        : "UNDER_REVIEW";
                                    handleProposalSubmit(e, nextStatus);
                                }}
                            >
                                {selectedProposal ? "Update Proposal" : "Submit Proposal"}
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}
