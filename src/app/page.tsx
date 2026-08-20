"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"

const HEADINGS = [
	{ prefix: "Offline", suffix: "Communities" },
	{ prefix: "Curated", suffix: "Experiences" },
	{ prefix: "Modern", suffix: "Brands" },
]

interface BubbleProps {
	text: string
	bg: string
	border?: string
	textColor: string
	rotation: string
	positionClass: string
	tailOffset?: string
	animationClass?: string
}

function SpeechBubble({ text, bg, textColor, rotation, positionClass, tailOffset = "left-4", animationClass = "animate-float-1" }: BubbleProps) {
	return (
		<div className={`absolute z-20 ${positionClass} ${rotation} desktop-bubbles pointer-events-none transition-transform duration-300 hover:scale-105`}>
			<div className={animationClass}>
				<div 
					className="relative px-5 py-2.5 rounded-full font-bold text-xs tracking-wider"
					style={{ backgroundColor: bg, color: textColor }}
				>
					{text}
					{/* Talk bubble tail */}
					<svg 
						className={`absolute -bottom-[9px] w-5 h-3 ${tailOffset}`}
						viewBox="0 0 20 12" 
						fill="none" 
						xmlns="http://www.w3.org/2000/svg"
					>
						<path d="M0 0 L10 12 L20 0 Z" fill={bg} />
					</svg>
				</div>
			</div>
		</div>
	)
}

export default function RootPage() {
	const [index, setIndex] = useState(0)
	const [animationState, setAnimationState] = useState<"normal" | "leaving" | "entering">("normal")
	const [isPricingOpen, setIsPricingOpen] = useState(false)
	const [activeCategory, setActiveCategory] = useState<"host" | "brand" | null>(null)
	const [activeSub, setActiveSub] = useState<string | null>(null)
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

	useEffect(() => {
		const interval = setInterval(() => {
			setAnimationState("leaving")
			setTimeout(() => {
				setIndex((prev) => (prev + 1) % HEADINGS.length)
				setAnimationState("entering")
			}, 300)
		}, 2500)
		return () => clearInterval(interval)
	}, [])

	useEffect(() => {
		if (animationState === "entering") {
			const frame = requestAnimationFrame(() => {
				setAnimationState("normal")
			})
			return () => cancelAnimationFrame(frame)
		}
	}, [animationState])

	let transitionClass = "transition-all duration-300 ease-out translate-x-0 opacity-100"
	if (animationState === "leaving") {
		transitionClass = "transition-all duration-300 ease-in -translate-x-12 opacity-0"
	} else if (animationState === "entering") {
		transitionClass = "transition-none translate-x-12 opacity-0"
	}

	return (
		<div className="relative min-h-screen bg-[#FFFDF9] flex flex-col font-sans overflow-x-hidden selection:bg-[#EE2C2C] selection:text-white">
			
			{/* Top Header */}
			<header className="relative z-30 w-full px-6 md:px-16 lg:px-24 py-3 md:py-4 flex items-center justify-between">
				<Link href="/" className="flex items-center gap-2">
					<Image 
						src="/assets/brand_logo.svg" 
						alt="Meetday Logo" 
						width={130} 
						height={36} 
						className="h-9 w-auto"
						priority 
					/>
				</Link>
				<nav className="hidden md:flex items-center gap-3 sm:gap-6 md:gap-8">
					<a 
						href="https://meetday.ai/website" 
						target="_blank" 
						rel="noopener noreferrer" 
						className="text-black font-semibold text-xs sm:text-sm hover:text-[#EE2C2C] transition-colors"
					>
						Meetday's Story
					</a>

					{/* Pricing Dropdown */}
					<div className="relative">
						<button 
							onClick={() => {
								const nextOpen = !isPricingOpen
								setIsPricingOpen(nextOpen)
								if (nextOpen) {
									setActiveCategory(null)
									setActiveSub(null)
								}
							}}
							className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 bg-[#FFCE29] text-black border-2 border-black rounded-full font-bold text-xs sm:text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
						>
							<span>Pricing</span>
							<svg 
								className={`w-3.5 h-3.5 transition-transform duration-200 ${isPricingOpen ? "rotate-180" : ""}`} 
								fill="none" 
								stroke="currentColor" 
								strokeWidth="3"
								viewBox="0 0 24 24"
							>
								<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
							</svg>
						</button>

						{isPricingOpen && (
							<>
								{/* Invisible full-screen backdrop to close on click outside */}
								<div 
									className="fixed inset-0 z-40 cursor-default" 
									onClick={() => setIsPricingOpen(false)}
								/>
								<div 
									className="absolute right-[-80px] sm:right-0 mt-3.5 w-[290px] sm:w-[340px] bg-[#EE2C2C] border-[3px] border-black rounded-[24px] shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col gap-3 text-left cursor-default"
								>
									{/* Category 1: For Community & Host */}
									<div className="flex flex-col">
										<button
											onClick={() => {
												setActiveCategory(activeCategory === "host" ? null : "host");
												setActiveSub(null); // Reset sub when category toggles
											}}
											className={`w-full text-left font-black uppercase text-[11px] sm:text-xs flex items-center justify-between py-2.5 px-3.5 border-[2.5px] border-black rounded-[16px] cursor-pointer transition-all duration-150 ${
												activeCategory === "host"
													? "bg-[#FFCE29] text-black translate-x-[1px] translate-y-[1px] shadow-none"
													: "bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
											}`}
										>
											<span>For Community & Host</span>
											<svg
												className={`w-3.5 h-3.5 transition-transform duration-200 ${
													activeCategory === "host" ? "rotate-180" : ""
												}`}
												fill="none"
												stroke="currentColor"
												strokeWidth="3"
												viewBox="0 0 24 24"
											>
												<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
											</svg>
										</button>

										{activeCategory === "host" && (
											<div className="flex flex-col gap-2 mt-2.5 pl-2.5 border-l-2 border-white/30">
												{/* Sub 1: Sponsorship Matchmaking */}
												<div className="flex flex-col">
													<button
														onClick={() => setActiveSub(activeSub === "matchmaking" ? null : "matchmaking")}
														className={`w-full text-left font-extrabold uppercase text-[10px] sm:text-[11px] flex items-center justify-between py-2 px-3 border-2 border-black rounded-xl cursor-pointer transition-all duration-150 ${
															activeSub === "matchmaking"
																? "bg-[#FFCE29] text-black translate-x-[1px] translate-y-[1px] shadow-none"
																: "bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
														}`}
													>
														<span>Sponsorship Matchmaking</span>
														<svg
															className={`w-3.5 h-3.5 transition-transform duration-200 ${
																activeSub === "matchmaking" ? "rotate-180" : ""
															}`}
															fill="none"
															stroke="currentColor"
															strokeWidth="3"
															viewBox="0 0 24 24"
														>
															<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
														</svg>
													</button>

													{activeSub === "matchmaking" && (
														<div className="bg-white text-black p-3.5 rounded-xl border-2 border-black font-bold text-[10px] sm:text-[11px] leading-relaxed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mt-1.5 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-100">
															<span className="text-[#EE2C2C] font-black uppercase text-[9px] tracking-wider bg-[#EE2C2C]/10 px-2 py-0.5 rounded border border-[#EE2C2C]/20 w-fit">
																Performance Fee
															</span>
															<p className="font-extrabold text-black">
																15% – 30% commission tiered by raise amount:
															</p>
															<ul className="list-none space-y-1 pl-1 text-black/75">
																<li className="flex items-center gap-1.5">
																	<span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
																	<span>Up to ₹10L Raise: <span className="font-black text-[#EE2C2C]">30% commission</span></span>
																</li>
																<li className="flex items-center gap-1.5">
																	<span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
																	<span>₹10L – ₹50L Raise: <span className="font-black text-[#EE2C2C]">20% commission</span></span>
																</li>
																<li className="flex items-center gap-1.5">
																	<span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
																	<span>₹50L+ Raise: <span className="font-black text-[#EE2C2C]">15% commission</span></span>
																</li>
															</ul>
														</div>
													)}
												</div>

												{/* Sub 2: Co-Created Experiences */}
												<div className="flex flex-col">
													<button
														onClick={() => setActiveSub(activeSub === "co_created" ? null : "co_created")}
														className={`w-full text-left font-extrabold uppercase text-[10px] sm:text-[11px] flex items-center justify-between py-2 px-3 border-2 border-black rounded-xl cursor-pointer transition-all duration-150 ${
															activeSub === "co_created"
																? "bg-[#FFCE29] text-black translate-x-[1px] translate-y-[1px] shadow-none"
																: "bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
														}`}
													>
														<span>Co-Created Experiences</span>
														<svg
															className={`w-3.5 h-3.5 transition-transform duration-200 ${
																activeSub === "co_created" ? "rotate-180" : ""
															}`}
															fill="none"
															stroke="currentColor"
															strokeWidth="3"
															viewBox="0 0 24 24"
														>
															<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
														</svg>
													</button>

													{activeSub === "co_created" && (
														<div className="bg-white text-black p-3.5 rounded-xl border-2 border-black font-bold text-[10px] sm:text-[11px] leading-relaxed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mt-1.5 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-100">
															<span className="text-[#EE2C2C] font-black uppercase text-[9px] tracking-wider bg-[#EE2C2C]/10 px-2 py-0.5 rounded border border-[#EE2C2C]/20 w-fit">
																Revenue Share
															</span>
															<p className="font-extrabold text-black">
																20% Revenue Share Split
															</p>
															<p className="text-black/75 leading-relaxed font-semibold">
																Partner with meetday.ai to co-design, market, and produce high-value experiences. We support and split total event revenue with you 20/80.
															</p>
														</div>
													)}
												</div>
											</div>
										)}
									</div>

									{/* Category 2: For Brand & Agency */}
									<div className="flex flex-col">
										<button
											onClick={() => {
												setActiveCategory(activeCategory === "brand" ? null : "brand");
												setActiveSub(null); // Reset sub when category toggles
											}}
											className={`w-full text-left font-black uppercase text-[11px] sm:text-xs flex items-center justify-between py-2.5 px-3.5 border-[2.5px] border-black rounded-[16px] cursor-pointer transition-all duration-150 ${
												activeCategory === "brand"
													? "bg-[#FFCE29] text-black translate-x-[1px] translate-y-[1px] shadow-none"
													: "bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
											}`}
										>
											<span>For Brand & Agency</span>
											<svg
												className={`w-3.5 h-3.5 transition-transform duration-200 ${
													activeCategory === "brand" ? "rotate-180" : ""
												}`}
												fill="none"
												stroke="currentColor"
												strokeWidth="3"
												viewBox="0 0 24 24"
											>
												<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
											</svg>
										</button>

										{activeCategory === "brand" && (
											<div className="flex flex-col gap-2 mt-2.5 pl-2.5 border-l-2 border-white/30">
												{/* Sub 1: Barter & Sampling */}
												<div className="flex flex-col">
													<button
														onClick={() => setActiveSub(activeSub === "barter" ? null : "barter")}
														className={`w-full text-left font-extrabold uppercase text-[10px] sm:text-[11px] flex items-center justify-between py-2 px-3 border-2 border-black rounded-xl cursor-pointer transition-all duration-150 ${
															activeSub === "barter"
																? "bg-[#FFCE29] text-black translate-x-[1px] translate-y-[1px] shadow-none"
																: "bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
														}`}
													>
														<span>Barter & Sampling</span>
														<svg
															className={`w-3.5 h-3.5 transition-transform duration-200 ${
																activeSub === "barter" ? "rotate-180" : ""
															}`}
															fill="none"
															stroke="currentColor"
															strokeWidth="3"
															viewBox="0 0 24 24"
														>
															<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
														</svg>
													</button>

													{activeSub === "barter" && (
														<div className="bg-white text-black p-3.5 rounded-xl border-2 border-black font-bold text-[10px] sm:text-[11px] leading-relaxed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mt-1.5 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-100">
															<span className="text-[#6C32D1] font-black uppercase text-[9px] tracking-wider bg-[#6C32D1]/10 px-2 py-0.5 rounded border border-[#6C32D1]/20 w-fit">
																Barter & Sampling
															</span>
															<p className="font-extrabold text-black">
																Flat ₹5,000 per Transaction
															</p>
															<ul className="list-none space-y-1.5 pl-1 text-black/75">
																<li className="flex items-start gap-1.5">
																	<span className="w-1.5 h-1.5 rounded-full bg-black shrink-0 mt-1.5" />
																	<span>Product placement, gifting, or venue partnerships with highly engaged local communities.</span>
																</li>
																<li className="flex items-start gap-1.5">
																	<span className="w-1.5 h-1.5 rounded-full bg-black shrink-0 mt-1.5" />
																	<span>Direct deal matchmaking & coordination support.</span>
																</li>
																<li className="flex items-start gap-1.5">
																	<span className="w-1.5 h-1.5 rounded-full bg-black shrink-0 mt-1.5" />
																	<span>Zero commission on non-cash value exchanged.</span>
																</li>
															</ul>
														</div>
													)}
												</div>

												{/* Sub 2: Campaign Design */}
												<div className="flex flex-col">
													<button
														onClick={() => setActiveSub(activeSub === "campaign" ? null : "campaign")}
														className={`w-full text-left font-extrabold uppercase text-[10px] sm:text-[11px] flex items-center justify-between py-2 px-3 border-2 border-black rounded-xl cursor-pointer transition-all duration-150 ${
															activeSub === "campaign"
																? "bg-[#FFCE29] text-black translate-x-[1px] translate-y-[1px] shadow-none"
																: "bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
														}`}
													>
														<span>Campaign Design</span>
														<svg
															className={`w-3.5 h-3.5 transition-transform duration-200 ${
																activeSub === "campaign" ? "rotate-180" : ""
															}`}
															fill="none"
															stroke="currentColor"
															strokeWidth="3"
															viewBox="0 0 24 24"
														>
															<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
														</svg>
													</button>

													{activeSub === "campaign" && (
														<div className="bg-white text-black p-3.5 rounded-xl border-2 border-black font-bold text-[10px] sm:text-[11px] leading-relaxed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mt-1.5 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-100">
															<span className="text-[#6C32D1] font-black uppercase text-[9px] tracking-wider bg-[#6C32D1]/10 px-2 py-0.5 rounded border border-[#6C32D1]/20 w-fit">
																Experiential Campaign
															</span>
															<p className="font-extrabold text-black">
																10% of Total Campaign Budget
															</p>
															<p className="text-black/75 leading-relaxed font-semibold">
																Custom experiential campaign strategy, curator sourcing, host brief development, and multi-city rollout design tailored to your target audience.
															</p>
														</div>
													)}
												</div>
											</div>
										)}
									</div>
								</div>
							</>
						)}
					</div>

					<a 
						href="mailto:info@meetday.ai"
						className="px-4 sm:px-6 py-2 sm:py-2.5 bg-[#EE2C2C] text-white border-2 border-black rounded-full font-bold text-xs sm:text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						Contact Us
					</a>
				</nav>

				{/* Hamburger menu for mobile */}
				<button 
					onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
					className="md:hidden flex items-center justify-center p-2 bg-[#FFCE29] border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none transition-all cursor-pointer text-black"
					aria-label="Toggle menu"
				>
					{isMobileMenuOpen ? (
						// Close Icon (X)
						<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					) : (
						// Hamburger Icon
						<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
						</svg>
					)}
				</button>

				{/* Mobile Navigation Dropdown Menu */}
				{isMobileMenuOpen && (
					<div className="md:hidden absolute top-20 left-6 right-6 bg-white border-[3px] border-black rounded-[24px] shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] p-5 z-40 flex flex-col gap-4 text-left animate-in fade-in slide-in-from-top-4 duration-200">
						{/* Option 1: Meetday's Story */}
						<a 
							href="https://meetday.ai/website" 
							target="_blank" 
							rel="noopener noreferrer" 
							className="text-black font-black text-sm hover:text-[#EE2C2C] transition-colors py-2 border-b border-black/10"
						>
							Meetday's Story
						</a>

						{/* Option 2: Pricing Accordion (Inlined in mobile menu) */}
						<div className="flex flex-col gap-2 border-b border-black/10 pb-3">
							<button 
								onClick={() => {
									const nextOpen = !isPricingOpen
									setIsPricingOpen(nextOpen)
									if (nextOpen) {
										setActiveCategory(null)
										setActiveSub(null)
									}
								}}
								className="w-full text-left flex items-center justify-between font-black text-sm text-black py-2"
							>
								<span>Pricing</span>
								<svg 
									className={`w-4 h-4 transition-transform duration-200 ${isPricingOpen ? "rotate-180" : ""}`} 
									fill="none" 
									stroke="currentColor" 
									strokeWidth="3"
									viewBox="0 0 24 24"
								>
									<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
								</svg>
							</button>

							{isPricingOpen && (
								<div className="bg-[#EE2C2C] border-2 border-black rounded-xl p-3 flex flex-col gap-2.5 mt-1">
									{/* Category 1: For Community & Host */}
									<div className="flex flex-col">
										<button
											onClick={() => {
												setActiveCategory(activeCategory === "host" ? null : "host");
												setActiveSub(null);
											}}
											className={`w-full text-left font-black uppercase text-[10px] sm:text-xs flex items-center justify-between py-2 px-3 border-2 border-black rounded-lg cursor-pointer transition-all duration-150 ${
												activeCategory === "host"
													? "bg-[#FFCE29] text-black"
													: "bg-white text-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
											}`}
										>
											<span>For Community & Host</span>
											<svg
												className={`w-3 h-3 transition-transform duration-200 ${activeCategory === "host" ? "rotate-180" : ""}`}
												fill="none"
												stroke="currentColor"
												strokeWidth="3"
												viewBox="0 0 24 24"
											>
												<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
											</svg>
										</button>

										{activeCategory === "host" && (
											<div className="flex flex-col gap-2 mt-2 pl-2 border-l border-white/30">
												{/* Matchmaking */}
												<div className="flex flex-col">
													<button
														onClick={() => setActiveSub(activeSub === "matchmaking" ? null : "matchmaking")}
														className={`w-full text-left font-extrabold uppercase text-[9px] sm:text-[10px] flex items-center justify-between py-1.5 px-2.5 border border-black rounded-md cursor-pointer transition-all duration-150 ${
															activeSub === "matchmaking" ? "bg-[#FFCE29] text-black" : "bg-white text-black"
														}`}
													>
														<span>Sponsorship Matchmaking</span>
													</button>
													{activeSub === "matchmaking" && (
														<div className="bg-white text-black p-2.5 rounded-lg border border-black text-[10px] mt-1 flex flex-col gap-1 leading-normal font-bold">
															<span className="text-[#EE2C2C] font-black uppercase text-[8px] tracking-wider">Performance Fee</span>
															<p>15% – 30% commission tiered by raise amount:</p>
															<ul className="list-disc list-inside text-black/75">
																<li>Up to ₹10L Raise: <span className="font-black text-[#EE2C2C]">30% commission</span></li>
																<li>₹10L – ₹50L Raise: <span className="font-black text-[#EE2C2C]">20% commission</span></li>
																<li>₹50L+ Raise: <span className="font-black text-[#EE2C2C]">15% commission</span></li>
															</ul>
														</div>
													)}
												</div>
												
												{/* Co-Created */}
												<div className="flex flex-col mt-2">
													<button
														onClick={() => setActiveSub(activeSub === "co_created" ? null : "co_created")}
														className={`w-full text-left font-extrabold uppercase text-[9px] sm:text-[10px] flex items-center justify-between py-1.5 px-2.5 border border-black rounded-md cursor-pointer transition-all duration-150 ${
															activeSub === "co_created" ? "bg-[#FFCE29] text-black" : "bg-white text-black"
														}`}
													>
														<span>Co-Created Experiences</span>
													</button>
													{activeSub === "co_created" && (
														<div className="bg-white text-black p-2.5 rounded-lg border border-black text-[10px] mt-1 flex flex-col gap-1 leading-normal font-bold">
															<span className="text-[#EE2C2C] font-black uppercase text-[8px] tracking-wider">Revenue Share</span>
															<p className="font-black">20% revenue share split</p>
															<p className="text-black/75">Co-design, market, support, and split event revenue 20/80.</p>
														</div>
													)}
												</div>
											</div>
										)}
									</div>

									{/* Category 2: For Brand & Agency */}
									<div className="flex flex-col mt-2.5">
										<button
											onClick={() => {
												setActiveCategory(activeCategory === "brand" ? null : "brand");
												setActiveSub(null);
											}}
											className={`w-full text-left font-black uppercase text-[10px] sm:text-[11px] flex items-center justify-between py-2 px-3 border-2 border-black rounded-lg cursor-pointer transition-all duration-150 ${
												activeCategory === "brand"
													? "bg-[#FFCE29] text-black"
													: "bg-white text-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
											}`}
										>
											<span>For Brand & Agency</span>
											<svg
												className={`w-3.5 h-3.5 transition-transform duration-200 ${activeCategory === "brand" ? "rotate-180" : ""}`}
												fill="none"
												stroke="currentColor"
												strokeWidth="3"
												viewBox="0 0 24 24"
											>
												<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
											</svg>
										</button>

										{activeCategory === "brand" && (
											<div className="flex flex-col gap-2 mt-2 pl-2 border-l border-white/30">
												{/* Barter */}
												<div className="flex flex-col">
													<button
														onClick={() => setActiveSub(activeSub === "barter" ? null : "barter")}
														className={`w-full text-left font-extrabold uppercase text-[9px] sm:text-[10px] flex items-center justify-between py-1.5 px-2.5 border border-black rounded-md cursor-pointer transition-all duration-150 ${
															activeSub === "barter" ? "bg-[#FFCE29] text-black" : "bg-white text-black"
														}`}
													>
														<span>Barter & Sampling</span>
													</button>
													{activeSub === "barter" && (
														<div className="bg-white text-black p-2.5 rounded-lg border border-black text-[10px] mt-1 flex flex-col gap-1 leading-normal font-bold">
															<span className="text-[#6C32D1] font-black uppercase text-[8px] tracking-wider">Sampling</span>
															<p className="font-black">Flat ₹5,000 per Transaction</p>
															<p className="text-black/75">Product placement, coordinate direct deal support with zero commission.</p>
														</div>
													)}
												</div>
												
												{/* Campaign Design */}
												<div className="flex flex-col mt-2">
													<button
														onClick={() => setActiveSub(activeSub === "campaign" ? null : "campaign")}
														className={`w-full text-left font-extrabold uppercase text-[9px] sm:text-[10px] flex items-center justify-between py-1.5 px-2.5 border border-black rounded-md cursor-pointer transition-all duration-150 ${
															activeSub === "campaign" ? "bg-[#FFCE29] text-black" : "bg-white text-black"
														}`}
													>
														<span>Campaign Design</span>
													</button>
													{activeSub === "campaign" && (
														<div className="bg-white text-black p-2.5 rounded-lg border border-black text-[10px] mt-1 flex flex-col gap-1 leading-normal font-bold">
															<span className="text-[#6C32D1] font-black uppercase text-[8px] tracking-wider">experiential strategy</span>
															<p className="font-black">10% of Campaign Budget</p>
															<p className="text-black/75">Multi-city rollout design, curator sourcing, and host brief development.</p>
														</div>
													)}
												</div>
											</div>
										)}
									</div>
								</div>
							)}
						</div>

						{/* Option 3: Contact Us */}
						<a 
							href="mailto:info@meetday.ai"
							className="w-full text-center py-2.5 bg-[#EE2C2C] text-white border-2 border-black rounded-full font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
						>
							Contact Us
						</a>
					</div>
				)}
			</header>

			{/* Main Content Area */}
			<main className="relative flex-1 flex flex-col items-center justify-start pt-2 md:pt-3 pb-0">
				
				{/* Scattered Speech Bubbles (Visible on desktop/tablet) */}
				{/* Left Side Bubbles */}
				<SpeechBubble 
					text="RAISE SPONSORSHIP" 
					bg="#F8EFE2" 
					textColor="#EE2C2C" 
					rotation="rotate-[-8deg]" 
					positionClass="left-[6%] top-[16%]" 
					tailOffset="left-5"
					animationClass="animate-float-1"
				/>
				<SpeechBubble 
					text="CREATE EXPERIENCES" 
					bg="#FFD9D9" 
					textColor="#000000" 
					rotation="rotate-[6deg]" 
					positionClass="left-[10%] top-[39%]" 
					tailOffset="left-6"
					animationClass="animate-float-3"
				/>
				<SpeechBubble 
					text="BACKED BY DATA" 
					bg="#F8EFE2" 
					textColor="#EE2C2C" 
					rotation="rotate-[-3deg]" 
					positionClass="left-[5%] top-[58%]" 
					tailOffset="left-5"
					animationClass="animate-float-2"
				/>
				<SpeechBubble 
					text="VERIFIED USERS" 
					bg="#FFCE29" 
					textColor="#000000" 
					rotation="rotate-[12deg]" 
					positionClass="left-[12%] top-[71%] z-30" 
					tailOffset="left-4"
					animationClass="animate-float-4"
				/>

				{/* Right Side Bubbles */}
				<SpeechBubble 
					text="ENGAGE GEN Z AUDIENCE" 
					bg="#FFD9D9" 
					textColor="#000000" 
					rotation="rotate-[9deg]" 
					positionClass="right-[6%] top-[18%]" 
					tailOffset="right-5"
					animationClass="animate-float-2"
				/>
				<SpeechBubble 
					text="OPTIMIZE BUDGETS" 
					bg="#F8EFE2" 
					textColor="#EE2C2C" 
					rotation="rotate-[-4deg]" 
					positionClass="right-[11%] top-[36%]" 
					tailOffset="right-5"
					animationClass="animate-float-4"
				/>
				<SpeechBubble 
					text="TRUSTED PAYMENTS" 
					bg="#FFD9D9" 
					textColor="#000000" 
					rotation="rotate-[5deg]" 
					positionClass="right-[6%] top-[56%]" 
					tailOffset="right-6"
					animationClass="animate-float-1"
				/>
				<SpeechBubble 
					text="GROW COMMUNITY" 
					bg="#FFCE29" 
					textColor="#000000" 
					rotation="rotate-[-10deg]" 
					positionClass="right-[11%] top-[70%] z-30" 
					tailOffset="right-4"
					animationClass="animate-float-3"
				/>

				{/* Hero Header Section */}
				<div className="text-center px-6 max-w-3xl z-10 flex flex-col items-center min-h-[90px] sm:min-h-[110px] md:min-h-[140px] justify-center overflow-hidden">
					<h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-black leading-[1.15]">
						<span className={`inline-block ${transitionClass}`}>
							{HEADINGS[index].prefix}{" "}
							<span className="relative inline-block text-[#EE2C2C]">
								{HEADINGS[index].suffix}
								{/* Hand-drawn style red underline underline svg */}
								<svg 
									className="absolute left-0 -bottom-2 w-full h-3 text-[#FFC940]"
									viewBox="0 0 100 10" 
									preserveAspectRatio="none" 
									fill="none" 
									xmlns="http://www.w3.org/2000/svg"
								>
									<path 
										d="M3 7C30 3 70 3 97 7" 
										stroke="currentColor" 
										strokeWidth="3.5" 
										strokeLinecap="round" 
									/>
								</svg>
							</span>
						</span>
					</h1>
				</div>

				<p className="mt-2 text-black/80 text-sm sm:text-lg md:text-xl font-medium leading-relaxed max-w-2xl font-sans text-center z-10 px-8 sm:px-0">
					Whether you’re looking <span className="inline-block hover:scale-125 transition-transform duration-200">👀</span> to <strong>market</strong> your products, <strong>monetize</strong> your IRL community, or explore how we’re building <span className="inline-block hover:scale-125 transition-transform duration-200">💪</span> the real-world social layer, you’re in the right place.
				</p>

				{/* Cards Container */}
				<div className="w-full max-w-3xl px-3 sm:px-6 grid grid-cols-2 gap-3 md:gap-8 mt-4 md:mt-5 mb-8 z-20">
					
					{/* Hosts Card */}
					<div className="bg-white border-[2px] md:border-[4px] border-black rounded-[20px] md:rounded-[36px] p-2.5 md:p-5 flex flex-col items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-transform duration-300 hover:-translate-y-1">
						
						{/* Image */}
						<div className="relative w-full aspect-[4/3] border-[2px] md:border-[3px] border-black rounded-lg md:rounded-2xl overflow-hidden bg-slate-100 group">
							<Image
								src="/images/community.png"
								alt="Community"
								fill
								sizes="(max-width: 768px) 100vw, 350px"
								className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
								priority
							/>
						</div>
						
						<p className="mt-2 md:mt-4 text-black font-normal text-center text-[9px] sm:text-sm md:text-base leading-relaxed flex-grow max-w-sm min-h-[36px] sm:min-h-[48px] md:min-h-[60px] flex items-center justify-center">
							Publish proposals, get discovered by top brands, and lock sponsorship deals instantly.
						</p>
						
						<Link 
							href="/community"
							className="w-full mt-3 md:mt-5 py-2 md:py-3.5 bg-[#EE2C2C] text-white border-[2px] md:border-[3px] border-black rounded-xl md:rounded-2xl font-bold text-center text-xs md:text-base shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
						>
							Community
						</Link>
					</div>

					{/* Brands Card */}
					<div className="bg-white border-[2px] md:border-[4px] border-black rounded-[20px] md:rounded-[36px] p-2.5 md:p-5 flex flex-col items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-transform duration-300 hover:-translate-y-1">
						
						{/* Image */}
						<div className="relative w-full aspect-[4/3] border-[2px] md:border-[3px] border-black rounded-lg md:rounded-2xl overflow-hidden bg-slate-100 group">
							<Image
								src="/images/brand.png"
								alt="Brands"
								fill
								sizes="(max-width: 768px) 100vw, 350px"
								className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
								priority
							/>
						</div>
						
						<p className="mt-2 md:mt-4 text-black font-normal text-center text-[9px] sm:text-sm md:text-base leading-relaxed flex-grow max-w-sm min-h-[36px] sm:min-h-[48px] md:min-h-[60px] flex items-center justify-center">
							Publish campaigns, discover verified offline communities, and close partnerships in one workspace.
						</p>
						
						<Link
							href="/brand"
							className="w-full mt-3 md:mt-5 py-2 md:py-3.5 bg-[#EE2C2C] text-white border-[2px] md:border-[3px] border-black rounded-xl md:rounded-2xl font-bold text-center text-xs md:text-base shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
						>
							Brand
						</Link>
					</div>
				</div>

				{/* Scrolling Marquee of Badges (Visible on mobile, positioned above the bottom red wave section) */}
				<div className="mobile-marquee w-full relative z-20 overflow-hidden py-1 mb-28">
					<style>{`
						@keyframes marqueeRTL {
							from { transform: translateX(0%); }
							to   { transform: translateX(-50%); }
						}
						.animate-marquee-rtl {
							animation: marqueeRTL 14s linear infinite;
							will-change: transform;
						}
						@media (max-width: 1024px) {
							.desktop-bubbles {
								display: none !important;
							}
							.mobile-marquee {
								display: block !important;
							}
						}
						@media (min-width: 1025px) {
							.desktop-bubbles {
								display: block !important;
							}
							.mobile-marquee {
								display: none !important;
							}
						}
					`}</style>
					<div className="flex animate-marquee-rtl">
						{/* Group A */}
						<div className="flex gap-3 shrink-0 pr-3">
							{[
								{ text: "RAISE SPONSORSHIP", bg: "#F8EFE2", textColor: "#EE2C2C" },
								{ text: "ENGAGE GEN Z AUDIENCE", bg: "#FFD9D9", textColor: "#000000" },
								{ text: "VERIFIED USERS", bg: "#FFCE29", textColor: "#000000" },
								{ text: "OPTIMIZE BUDGETS", bg: "#F8EFE2", textColor: "#EE2C2C" },
								{ text: "CREATE EXPERIENCES", bg: "#FFD9D9", textColor: "#000000" },
								{ text: "GROW COMMUNITY", bg: "#FFCE29", textColor: "#000000" },
								{ text: "BACKED BY DATA", bg: "#F8EFE2", textColor: "#EE2C2C" },
								{ text: "TRUSTED PAYMENTS", bg: "#FFD9D9", textColor: "#000000" },
							].map((b, idx) => (
								<div 
									key={idx}
									className="px-4 py-2 border-[2px] border-black rounded-xl font-heading font-black text-[10px] tracking-wider uppercase whitespace-nowrap shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
									style={{ backgroundColor: b.bg, color: b.textColor }}
								>
									{b.text}
								</div>
							))}
						</div>
						{/* Group B (seamless duplicate) */}
						<div className="flex gap-3 shrink-0 pr-3" aria-hidden="true">
							{[
								{ text: "RAISE SPONSORSHIP", bg: "#F8EFE2", textColor: "#EE2C2C" },
								{ text: "ENGAGE GEN Z AUDIENCE", bg: "#FFD9D9", textColor: "#000000" },
								{ text: "VERIFIED USERS", bg: "#FFCE29", textColor: "#000000" },
								{ text: "OPTIMIZE BUDGETS", bg: "#F8EFE2", textColor: "#EE2C2C" },
								{ text: "CREATE EXPERIENCES", bg: "#FFD9D9", textColor: "#000000" },
								{ text: "GROW COMMUNITY", bg: "#FFCE29", textColor: "#000000" },
								{ text: "BACKED BY DATA", bg: "#F8EFE2", textColor: "#EE2C2C" },
								{ text: "TRUSTED PAYMENTS", bg: "#FFD9D9", textColor: "#000000" },
							].map((b, idx) => (
								<div 
									key={idx}
									className="px-4 py-2 border-[2px] border-black rounded-xl font-heading font-black text-[10px] tracking-wider uppercase whitespace-nowrap shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
									style={{ backgroundColor: b.bg, color: b.textColor }}
								>
									{b.text}
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Custom Bottom Wave red background wrapper */}
				<div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden pointer-events-none z-0">
					{/* Wavy curve boundary with dashed line stroke */}
					<svg 
						className="w-full h-auto min-h-[90px] block -mb-[2px]" 
						viewBox="0 0 1440 200" 
						fill="none" 
						xmlns="http://www.w3.org/2000/svg"
						preserveAspectRatio="none"
					>
						<path 
							d="M0,75 Q720,185 1440,75 L1440,200 L0,200 Z" 
							fill="#EE2C2C" 
						/>
						<path 
							d="M0,75 Q720,185 1440,75" 
							stroke="black" 
							strokeWidth="4" 
							strokeDasharray="8 8" 
						/>
					</svg>
					{/* Solid color fill for the rest of the bottom */}
					<div className="bg-[#EE2C2C] h-6 w-full -mt-[2px]" />
				</div>
			</main>
		</div>
	)
}
