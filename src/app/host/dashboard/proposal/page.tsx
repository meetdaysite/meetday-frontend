"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { DashboardTopBar } from "@/components/ui/DashboardTopBar"
import { Icon } from "@/components/ui/Icon"
import { useHostStore } from "@/store/hostStore"
import { getCategories, type Category } from "@/lib/api"

import UploadSvg from "@/icons/outlined/upload.svg"
import DocumentTextSvg from "@/icons/outlined/document-text.svg"
import CheckCircleSvg from "@/icons/outlined/check-circle.svg"

// ─── IndexedDB Config ────────────────────────────────────────────────────────
const DB_NAME = "MeetdayProposalDB"
const STORE_NAME = "proposals"
const RECORD_KEY = "current_proposal"
const COMMUNITY_KEY = "activated_community"

export interface StoredProposal {
    id: string
    name: string
    about: string
    image: File | Blob | null
    imageName: string
    date: string
    venue: string
    city: string
    audienceProfile: string
    ageGroup: string
    guestCount: string
    docFile: File | Blob
    docName: string
    docType: string
    docSize: number
    uploadedAt: string
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
    const profile = useHostStore((s) => s.profile)
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
    const [projAudience, setProjAudience] = useState("")
    const [projAgeGroup, setProjAgeGroup] = useState("")
    const [projGuestCount, setProjGuestCount] = useState("")
    const [projDoc, setProjDoc] = useState<File | null>(null)
    const projImageInputRef = useRef<HTMLInputElement>(null)
    const projDocInputRef = useRef<HTMLInputElement>(null)
    const updateDocInputRef = useRef<HTMLInputElement>(null)

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

    useEffect(() => {
        getCategories().then(setCategories).catch(() => {})
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
                        setShowProjectModal(true)
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
        if (selectedProposal?.docFile) {
            const url = URL.createObjectURL(selectedProposal.docFile)
            setPreviewUrl(url)
            return () => {
                URL.revokeObjectURL(url)
            }
        } else {
            setPreviewUrl(null)
        }
    }, [selectedProposal])

    useEffect(() => {
        if (selectedProposal?.image) {
            const url = URL.createObjectURL(selectedProposal.image)
            setProjectImageUrl(url)
            return () => {
                URL.revokeObjectURL(url)
            }
        } else {
            setProjectImageUrl(null)
        }
    }, [selectedProposal])

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

    const openProposalForm = (p?: StoredProposal) => {
        if (p) {
            setProjName(p.name)
            setProjAbout(p.about)
            setProjImage(p.image as File | null)
            setProjDate(p.date)
            setProjVenue(p.venue)
            setProjCity(p.city)
            setProjAudience(p.audienceProfile)
            setProjAgeGroup(p.ageGroup)
            setProjGuestCount(p.guestCount)
            setProjDoc(p.docFile as File | null)
            setSelectedProposal(p)
        } else {
            setProjName("")
            setProjAbout("")
            setProjImage(null)
            setProjDate("")
            setProjVenue("")
            setProjCity("")
            setProjAudience("")
            setProjAgeGroup("")
            setProjGuestCount("")
            setProjDoc(null)
            setSelectedProposal(null)
        }
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
            const allowedExtensions = [".pdf", ".doc", ".docx"]
            const allowedTypes = [
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ]
            const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
            const isValid = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)

            if (!isValid) {
                toast.error("Only PDF or DOC/DOCX files are accepted.")
                return
            }
            if (file.size > 10 * 1024 * 1024) {
                toast.error("File size cannot exceed 10MB.")
                return
            }
            setProjDoc(file)
        }
    }

    const handleProposalSubmit = (e: React.FormEvent) => {
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
        if (!projAudience.trim()) {
            toast.error("Audience Profile is required.")
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
            const allowedExtensions = [".pdf", ".doc", ".docx"]
            const allowedTypes = [
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ]
            const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
            const isValid = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)

            if (!isValid) {
                toast.error("Only PDF or DOC/DOCX files are accepted.")
                return
            }
            if (file.size > 10 * 1024 * 1024) {
                toast.error("File size cannot exceed 10MB.")
                return
            }

            const updatedProposals = proposals.map(p => {
                if (p.id === selectedProposal.id) {
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

    const resetProposalForm = () => {
        setProjName("")
        setProjAbout("")
        setProjImage(null)
        setProjDate("")
        setProjVenue("")
        setProjCity("")
        setProjAudience("")
        setProjAgeGroup("")
        setProjGuestCount("")
        setProjDoc(null)
        setShowProposalForm(false)
        setIsEditingInPlace(false)
    }

    const handleEditDetails = () => {
        if (!selectedProposal) return
        setProjName(selectedProposal.name)
        setProjAbout(selectedProposal.about)
        setProjImage(selectedProposal.image as File | null)
        setProjDate(selectedProposal.date)
        setProjVenue(selectedProposal.venue)
        setProjCity(selectedProposal.city)
        setProjAudience(selectedProposal.audienceProfile)
        setProjAgeGroup(selectedProposal.ageGroup)
        setProjGuestCount(selectedProposal.guestCount)
        setProjDoc(selectedProposal.docFile as File | null)

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
        if (!projAudience.trim()) {
            toast.error("Audience Profile is required.")
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

        const updatedProposals = proposals.map(p => {
            if (p.id === selectedProposal.id) {
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
                }
                setSelectedProposal(updated)
                return updated
            }
            return p
        })

        saveProposalsList(updatedProposals, hostId)
            .then((saved) => {
                setProposals(saved)
                setIsEditingInPlace(false)
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
            setInstagram(community.instagram || "")
            setLinkedin(community.linkedin || "")
            setYoutube(community.youtube || "")
            setPortfolio(community.portfolio || "")
            setLogoFile(community.logo as File | null)
        } else {
            setCommunityName("")
            setAboutCommunity("")
            setCommunitySize("")
            setAvgGuestCount("")
            setExperiencesPerYear("")
            setCategoryIds([])
            setInstagram("")
            setLinkedin("")
            setYoutube("")
            setPortfolio("")
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

        const communityData: ActivatedCommunity = {
            name: communityName,
            about: aboutCommunity,
            logo: logoFile,
            logoName: logoFile.name,
            size: communitySize,
            avgGuestCount: avgGuestCount,
            experiencesPerYear: experiencesPerYear,
            categoryIds: categoryIds,
            instagram: instagram || undefined,
            linkedin: linkedin || undefined,
            youtube: youtube || undefined,
            portfolio: portfolio || undefined,
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
                    ) : (
                        /* Community activated. Now they can view/edit details and upload/view the proposal. */
                        <div className="flex flex-col gap-8">
                            <div>
                                <h1 className="text-heading-sm font-semibold text-text-primary mb-4">Community profile</h1>

                                {/* Activated Community Details Card */}
                                <div className="bg-surface-card border border-border-default rounded-action p-4 max-w-2xl shadow-sm">
                                    <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-border-default">
                                        <div className="flex items-center gap-3">
                                            {communityLogoUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={communityLogoUrl} alt={community.name} className="size-10 rounded-xl object-cover border border-border-default" />
                                            ) : (
                                                <div className="size-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700 text-title-xs font-bold">
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

                            <hr className="border-border-default max-w-2xl" />

                            {/* Proposal upload/display section */}
                            <div className="flex flex-col gap-4">
                                <div className="mb-2">
                                    <h1 className="text-heading-sm font-semibold text-text-primary">Sponsorships</h1>
                                    <p className="text-body-sm text-text-secondary mt-0.5">Upload and manage your sponsorship proposal document</p>
                                </div>

                                {isUploading ? (
                                    <div className="bg-surface-card border border-border-default rounded-action p-8 text-center flex flex-col items-center max-w-2xl">
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
                                ) : showProposalForm ? (
                                    /* State 2a: Form open to fill in details */
                                    <form onSubmit={handleProposalSubmit} className="bg-surface-card border border-border-default rounded-action p-6 max-w-2xl flex flex-col gap-4 animate-in fade-in duration-150">
                                        <div className="flex justify-between items-center pb-2 border-b border-border-default">
                                            <h3 className="text-label-lg font-semibold text-text-primary">
                                                {selectedProposal ? "Edit Sponsorship Proposal" : "Create Sponsorship Proposal"}
                                            </h3>
                                            <Button type="button" variant="secondary" size="xs" radius="pill" onClick={resetProposalForm}>
                                                Cancel
                                            </Button>
                                        </div>

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

                                        {/* Audience Profile, Age Group, Number of Guests */}
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-label-sm font-semibold text-text-primary">Audience Profile *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={projAudience}
                                                    onChange={(e) => setProjAudience(e.target.value)}
                                                    placeholder="e.g. Tech Founders"
                                                    className="h-10 px-4 rounded-input border border-border-default bg-surface-canvas text-text-primary outline-none focus:border-border-focused hover:border-border-strong text-sm transition-colors"
                                                />
                                            </div>
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

                                        {/* Upload Proposal Doc */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-label-sm font-semibold text-text-primary">Upload Proposal (PDF/DOC) {selectedProposal ? "" : "*"}</label>
                                            <div className="flex items-center gap-4">
                                                <input
                                                    ref={projDocInputRef}
                                                    type="file"
                                                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
                                                    <span className="text-[10px] text-text-tertiary">PDF, DOC, DOCX accepted. Max 10MB.</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Submit */}
                                        <Button type="submit" variant="primary" size="sm" radius="pill" className="mt-2 self-end">
                                            {selectedProposal ? "Update Proposal" : "Submit Proposal"}
                                        </Button>
                                    </form>
                                ) : proposals.length > 0 ? (
                                    /* State 3: Show list/grid of proposals overview cards */
                                    <div className="flex flex-col gap-4 max-w-2xl animate-in fade-in duration-150">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-label-md font-semibold text-text-secondary">Your proposals ({proposals.length})</h3>
                                            <Button variant="primary" size="xs" radius="pill" onClick={() => openProposalForm()}>
                                                + Add proposal
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            {proposals.map((p) => {
                                                const imgUrl = p.image ? URL.createObjectURL(p.image) : null
                                                return (
                                                    <div
                                                        key={p.id}
                                                        onClick={() => {
                                                            setSelectedProposal(p);
                                                            setShowProjectModal(true);
                                                        }}
                                                        className="bg-surface-card border border-border-default rounded-action p-4 shadow-sm hover:border-border-strong cursor-pointer transition-all flex gap-4 animate-in fade-in duration-150"
                                                    >
                                                        {imgUrl ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={imgUrl}
                                                                alt={p.name}
                                                                className="size-20 rounded-xl object-cover border border-border-default shrink-0"
                                                                onLoad={() => URL.revokeObjectURL(imgUrl)}
                                                            />
                                                        ) : (
                                                            <div className="size-20 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700 text-title-sm font-bold shrink-0">
                                                                {p.name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                            <div>
                                                                <h3 className="text-label-md font-semibold text-text-primary truncate">{p.name}</h3>
                                                                <p className="text-caption text-text-secondary mt-0.5">{p.city} • {p.venue}</p>
                                                                <p className="text-[11px] text-text-tertiary truncate mt-1">{p.about}</p>
                                                            </div>
                                                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-default">
                                                                <span className="text-[11px] text-text-brand font-medium">Click to view details & PDF</span>
                                                                <span className="text-[10px] text-text-tertiary">Date: {p.date}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    /* State 2b: CTA to open details form */
                                    <div className="bg-surface-card border border-border-default rounded-action p-8 text-center max-w-2xl flex flex-col items-center">
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
                                                    className={`px-3 py-1.5 rounded-avatar border text-xs font-medium transition-colors ${
                                                        active
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
            {showProjectModal && selectedProposal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
                    {isEditingInPlace ? (
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

                                {/* Audience, Age Group, Guests */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-label-sm font-semibold text-text-primary">Audience Profile *</label>
                                        <input
                                            type="text"
                                            required
                                            value={projAudience}
                                            onChange={(e) => setProjAudience(e.target.value)}
                                            placeholder="Audience Profile"
                                            className="h-10 px-4 rounded-input border border-border-default bg-surface-canvas text-text-primary outline-none focus:border-border-focused hover:border-border-strong text-sm transition-colors"
                                        />
                                    </div>
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
                    ) : (
                        <div className="bg-surface-card rounded-panel border border-border-default shadow-floating w-full max-w-4xl p-6 my-8 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
                            {/* Header */}
                            <div className="flex justify-between items-center pb-4 mb-4 border-b border-border-default shrink-0">
                                <div>
                                    <h2 className="text-heading-xs font-semibold text-text-primary">{selectedProposal.name}</h2>
                                    <p className="text-caption text-text-tertiary">Project Overview & Details</p>
                                </div>
                                <button
                                    onClick={() => setShowProjectModal(false)}
                                    className="text-text-secondary hover:text-text-primary size-8 rounded-full flex items-center justify-center hover:bg-surface-card-muted transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-12 gap-6">
                                {/* Left column - Metadata */}
                                <div className="md:col-span-5 flex flex-col gap-4">
                                    {projectImageUrl && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={projectImageUrl} alt={selectedProposal.name} className="w-full h-48 object-cover rounded-xl border border-border-default shadow-sm" />
                                    )}
                                    <div className="bg-surface-card-muted border border-border-default rounded-action p-4 flex flex-col gap-3">
                                        <div>
                                            <p className="text-[10px] text-text-tertiary">Date & City</p>
                                            <p className="text-label-sm font-semibold text-text-primary">{selectedProposal.date} • {selectedProposal.city}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-text-tertiary">Venue</p>
                                            <p className="text-label-sm font-semibold text-text-primary">{selectedProposal.venue}</p>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border-default/50">
                                            <div>
                                                <p className="text-[10px] text-text-tertiary">Guests</p>
                                                <p className="text-label-sm font-semibold text-text-primary">{selectedProposal.guestCount}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-text-tertiary">Age Group</p>
                                                <p className="text-label-sm font-semibold text-text-primary">{selectedProposal.ageGroup}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-text-tertiary">Audience</p>
                                                <p className="text-label-sm font-semibold text-text-primary truncate">{selectedProposal.audienceProfile}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 mt-auto pt-4 border-t border-border-default">
                                        <input
                                            ref={updateDocInputRef}
                                            type="file"
                                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                            className="hidden"
                                            onChange={handleUpdateFile}
                                        />
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            radius="pill"
                                            className="flex-1"
                                            onClick={handleEditDetails}
                                        >
                                            Edit details
                                        </Button>
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
                                                setShowProjectModal(false);
                                            }}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>

                                {/* Right column - About & PDF Preview */}
                                <div className="md:col-span-7 flex flex-col gap-4">
                                    <div>
                                        <h4 className="text-label-sm font-semibold text-text-primary mb-1">About the Project</h4>
                                        <p className="text-body-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{selectedProposal.about}</p>
                                    </div>

                                    <div className="flex-1 min-h-[300px] flex flex-col">
                                        <h4 className="text-label-sm font-semibold text-text-primary mb-2">Document Preview</h4>
                                        {selectedProposal.docType.includes("pdf") ? (
                                            <div className="border border-border-default rounded-action overflow-hidden bg-surface-card flex-1 shadow-sm h-[350px]">
                                                <iframe
                                                    src={previewUrl || undefined}
                                                    className="w-full h-full border-none"
                                                    title="Proposal Preview"
                                                />
                                            </div>
                                        ) : (
                                            <div className="border border-border-default rounded-action p-6 bg-surface-card-muted text-center flex flex-col items-center justify-center flex-1">
                                                <Icon as={DocumentTextSvg} size="lg" color="secondary" className="mb-2" />
                                                <h5 className="text-label-sm font-semibold text-text-primary mb-1">
                                                    Preview not supported
                                                </h5>
                                                <p className="text-[11px] text-text-secondary max-w-xs">
                                                    Word files (.doc, .docx) cannot be previewed in-app. Please download the file to view.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
