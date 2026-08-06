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
		<div className={`absolute z-20 ${positionClass} ${rotation} hidden md:block pointer-events-none transition-transform duration-300 hover:scale-105`}>
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
			<header className="relative z-30 w-full max-w-7xl mx-auto px-6 md:px-12 py-6 flex items-center justify-between">
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
				<nav className="flex items-center gap-6 md:gap-8">
					<a 
						href="https://meetday.ai" 
						target="_blank" 
						rel="noopener noreferrer" 
						className="text-black font-semibold text-sm hover:text-[#EE2C2C] transition-colors"
					>
						Our Story
					</a>
					<a 
						href="mailto:info@meetday.ai"
						className="px-6 py-2.5 bg-[#EE2C2C] text-white border-2 border-black rounded-full font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						Contact Us
					</a>
				</nav>
			</header>

			{/* Main Content Area */}
			<main className="relative flex-1 flex flex-col items-center justify-start pt-4 md:pt-6 pb-0">
				
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

				<p className="mt-4 text-black/80 text-base sm:text-lg md:text-xl font-medium leading-relaxed max-w-2xl font-sans text-center z-10">
					Whether you’re looking <span className="inline-block hover:scale-125 transition-transform duration-200">👀</span> to <strong>market</strong> your products, <strong>monetize</strong> your IRL community, or explore how we’re building <span className="inline-block hover:scale-125 transition-transform duration-200">💪</span> the real-world social layer, you’re in the right place.
				</p>

				{/* Cards Container */}
				<div className="w-full max-w-3xl px-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-8 md:mt-10 mb-12 z-20">
					
					{/* Hosts Card */}
					<div className="bg-white border-[4px] border-black rounded-[36px] p-6 md:p-8 flex flex-col items-center shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-transform duration-300 hover:-translate-y-1">
						
						{/* Placeholder Image */}
						<div className="relative w-full aspect-[4/3] border-[3px] border-black rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center group">
							{/* Pattern background to look beautiful */}
							<div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1.5px,transparent_1.5px)] [background-size:12px_12px]" />
							<div className="z-10 text-center flex flex-col items-center gap-3">
								<svg className="w-12 h-12 text-black/40 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
								<span className="text-sm font-bold text-black/50 tracking-wider">HOSTS PLACEHOLDER</span>
							</div>
						</div>
						
						<p className="mt-4 text-black font-semibold text-center text-sm sm:text-base leading-relaxed flex-grow max-w-sm">
							Create experiences, pitch sponsorship proposals, and turn your community into a sustainable business.
						</p>
						
						<Link 
							href="/host"
							className="w-full mt-5 py-3.5 bg-[#EE2C2C] text-white border-[3px] border-black rounded-2xl font-bold text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
						>
							Hosts
						</Link>
					</div>

					{/* Brands Card */}
					<div className="bg-white border-[4px] border-black rounded-[36px] p-6 md:p-8 flex flex-col items-center shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-transform duration-300 hover:-translate-y-1">
						
						{/* Placeholder Image */}
						<div className="relative w-full aspect-[4/3] border-[3px] border-black rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center group">
							<div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1.5px,transparent_1.5px)] [background-size:12px_12px]" />
							<div className="z-10 text-center flex flex-col items-center gap-3">
								<svg className="w-12 h-12 text-black/40 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 12l3-3 3 3 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
								</svg>
								<span className="text-sm font-bold text-black/50 tracking-wider">BRANDS PLACEHOLDER</span>
							</div>
						</div>
						
						<p className="mt-4 text-black font-semibold text-center text-sm sm:text-base leading-relaxed flex-grow max-w-sm">
							Launch campaigns and tap into active IRL communities to market and distribute your products.
						</p>
						
						<Link 
							href="/brand/login"
							className="w-full mt-5 py-3.5 bg-[#EE2C2C] text-white border-[3px] border-black rounded-2xl font-bold text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
						>
							Brands
						</Link>
					</div>
				</div>

				{/* Custom Bottom Wave red background wrapper */}
				<div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden pointer-events-none z-0">
					{/* Wavy curve boundary with dashed line stroke */}
					<svg 
						className="w-full h-auto min-h-[140px] block -mb-[2px]" 
						viewBox="0 0 1440 200" 
						fill="none" 
						xmlns="http://www.w3.org/2000/svg"
						preserveAspectRatio="none"
					>
						<path 
							d="M0,45 Q720,185 1440,45 L1440,200 L0,200 Z" 
							fill="#EE2C2C" 
						/>
						<path 
							d="M0,45 Q720,185 1440,45" 
							stroke="black" 
							strokeWidth="4" 
							strokeDasharray="8 8" 
						/>
					</svg>
					{/* Solid color fill for the rest of the bottom */}
					<div className="bg-[#EE2C2C] h-16 w-full -mt-[2px]" />
				</div>
			</main>
		</div>
	)
}
