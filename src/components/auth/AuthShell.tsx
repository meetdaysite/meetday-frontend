import Image from "next/image"
import Link from "next/link"

interface AuthShellProps {
	children: React.ReactNode
	phoneImage?: string // Kept for interface compatibility but ignored
	pointsImage?: string // Kept for interface compatibility but ignored
}

export function AuthShell({ children }: AuthShellProps) {
	return (
		<div className="w-full min-h-screen flex flex-col lg:flex-row bg-[#EE2C2C] text-black">
			
			{/* ── Left Side Panel: Logo, Puzzle Heart, Vibration Arcs (lg screens only) ── */}
			<div className="hidden lg:flex lg:w-[52%] xl:w-[58%] flex-col justify-between p-12 relative overflow-hidden select-none">
				
				{/* Top Logo */}
				<Link href="/" className="inline-block relative z-10 self-center">
					<Image 
						src="/assets/brand_logo.svg" 
						alt="Meetday" 
						width={140} 
						height={38} 
						priority 
						style={{ filter: "brightness(0) invert(1)" }} 
						className="h-9 w-auto"
					/>
				</Link>

				{/* Center: Puzzle Heart + Vibration Arcs */}
				<div className="flex-1 flex items-start justify-center relative pt-20">					{/* The Puzzle Heart Container */}
					<div className="relative z-10 flex flex-col items-center">
						
						{/* Floating Speech Bubble: Beat goes Boom */}
						<div className="absolute top-[-35px] left-[20px] z-20 rotate-[-8deg] animate-float-3">
							<div className="bg-[#FFFDF9] text-black rounded-2xl px-4 py-1.5 font-heading font-extrabold text-xs tracking-wider relative">
								Beat goes Boom
								{/* Tail */}
								<svg className="absolute -bottom-2 w-4.5 h-3.5 text-[#FFFDF9]" viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M0 0 L8 8 L16 0 Z" fill="currentColor" />
								</svg>
							</div>
						</div>

						{/* Puzzle Heart SVG */}
						<svg className="w-[500px] h-[500px] overflow-visible drop-shadow-[0_10px_20px_rgba(0,0,0,0.15)]" viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg">
							
							{/* Background Vibration Arcs (Concentric Heart Outline) */}
							<g className="text-[#A51616] animate-pulse" fill="none" stroke="currentColor" strokeLinecap="round">
								{/* Left concentric arcs (outlining Brands top-left) */}
								<path d="M 135,40 A 80 80 0 0 0 30,175" strokeWidth="8" />
								<path d="M 135,18 A 102 102 0 0 0 12,195" strokeWidth="6" />
								
								{/* Right concentric arcs (outlining IRL Communities top-right) */}
								<path d="M 225,40 A 80 80 0 0 1 330,175" strokeWidth="8" />
								<path d="M 225,18 A 102 102 0 0 1 348,195" strokeWidth="6" />
								
								{/* Bottom concentric arcs (outlining Vibe V-shape bottom) */}
								<path d="M 130,270 Q 180,315 230,270" strokeWidth="8" />
								<path d="M 115,290 Q 180,345 245,290" strokeWidth="6" />
							</g>
							
							{/* Yellow Brands Piece (Left) */}
							<g>
								<path 
									d="M 50,82 a 12,12 0 0 1 12,-12 h 38 c 0,-15 5,-20 15,-20 c 10,0 15,5 15,20 h 50 v 40 c -15,0 -20,5 -20,15 c 0,10 5,15 20,15 v 40 h -20 c 0,15 -5,20 -15,20 c -10,0 -15,-5 -15,-20 h -15 h -53 a 12,12 0 0 1 -12,-12 v -28 c -15,0 -20,-5 -20,-15 c 0,-10 5,-15 20,-15 Z"
									fill="#FFC940" 
									stroke="#000000" 
									strokeWidth="4" 
									strokeLinejoin="round" 
								/>
								<text x="115" y="130" fill="#000000" fontSize="14" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">Brands</text>
							</g>

							{/* White IRL Communities Piece (Right) */}
							<g>
								<path 
									d="M 180,70 h 50 c 0,-15 5,-20 15,-20 c 10,0 15,5 15,20 h 38 a 12,12 0 0 1 12,12 v 28 c 15,0 20,5 20,15 c 0,10 -5,15 -20,15 v 28 a 12,12 0 0 1 -12,12 h -53 h -15 c 0,-15 -5,-20 -15,-20 c -10,0 -15,5 -15,20 h -20 v -40 c -15,0 -20,-5 -20,-15 c 0,-10 5,-15 20,-15 Z"
									fill="#FFFFFF" 
									stroke="#000000" 
									strokeWidth="4" 
									strokeLinejoin="round" 
								/>
								<text x="245" y="120" fill="#000000" fontSize="13.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">IRL</text>
								<text x="245" y="138" fill="#000000" fontSize="13.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">Communities</text>
							</g>

							{/* Peach Vibe Piece (Bottom) */}
							<g>
								<path 
									d="M 115,180 h 15 c 0,15 5,20 15,20 c 10,0 15,-5 15,-20 h 20 h 20 c 0,-15 5,-20 15,-20 c 10,0 15,5 15,20 h 15 v 38 a 12,12 0 0 1 -12,12 h -38 c 0,15 -5,20 -15,20 c -10,0 -15,-5 -15,-20 h -38 a 12,12 0 0 1 -12,-12 Z"
									fill="#FFE3E3" 
									stroke="#000000" 
									strokeWidth="4" 
									strokeLinejoin="round" 
								/>
								<text x="180" y="218" fill="#000000" fontSize="13.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">Vibe</text>
							</g>
						</svg>

					</div>
				</div>

				{/* Empty bottom spacer to match flex layout */}
				<div className="h-10 w-full" />
			</div>

			{/* ── Right Side Panel: Form Card ── */}
			<div className="flex-1 flex items-center justify-center p-6 lg:p-12 xl:p-16 z-10">
				
				{/* The Onboarding Form Card */}
				<div className="w-full max-w-[500px] min-h-[460px] bg-white border-[4px] border-black rounded-[36px] px-8 py-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative flex flex-col justify-between">
					
					{/* Content / Form fields */}
					<div className="w-full">
						{children}
					</div>

				</div>
			</div>

		</div>
	)
}
