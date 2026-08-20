import Image from "next/image"
import Link from "next/link"

interface AuthShellProps {
	children: React.ReactNode
	phoneImage?: string // Kept for interface compatibility but ignored
	pointsImage?: string // Kept for interface compatibility but ignored
	size?: "small" | "default"
}

export function AuthShell({ children, size = "default" }: AuthShellProps) {
	return (
		<div className="w-full min-h-screen flex flex-col lg:flex-row bg-[#EE2C2C] text-black">
			
			{/* ── Left Side Panel: Logo, Puzzle Heart, Vibration Arcs (lg screens only) ── */}
			<div className="hidden lg:flex lg:w-1/2 h-full flex-col items-center justify-center relative select-none gap-8 p-6">
				
				{/* Top Logo */}
				<Link href="/" className="relative z-20 mb-2 translate-y-8">
					<Image 
						src="/assets/brand_logo.svg" 
						alt="Meetday" 
						width={170} 
						height={46} 
						priority 
						style={{ filter: "brightness(0) invert(1)" }} 
						className="h-11 w-auto"
					/>
				</Link>

				{/* Center: Puzzle Heart + Vibration Arcs — vertically centered */}
				<div className="flex items-center justify-center relative translate-y-8">
					{/* The Puzzle Heart Container */}
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
						<svg className="w-[85vw] h-[85vw] sm:w-[75vw] sm:h-[75vw] lg:w-[38vw] lg:h-[38vw] max-w-[500px] max-h-[500px] min-w-[340px] min-h-[340px] overflow-visible drop-shadow-[0_10px_20px_rgba(0,0,0,0.15)]" viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg">
							
							{/* Background Vibration Arcs (Concentric Heart Outline from public/images/heart.svg) */}
							<g className="animate-pulse" transform="translate(-32, 28) scale(0.5)">
								<defs>
									<linearGradient id="paint0_linear_69_1366" x1="130.661" y1="13.0542" x2="130.661" y2="307.502" gradientUnits="userSpaceOnUse">
										<stop stopColor="#DD1616"/>
										<stop offset="1" stopColor="#AD1A1A"/>
									</linearGradient>
									<linearGradient id="paint1_linear_69_1366" x1="799.661" y1="6.50146" x2="799.661" y2="171.987" gradientUnits="userSpaceOnUse">
										<stop stopColor="#DD1616"/>
										<stop offset="1" stopColor="#AD1A1A"/>
									</linearGradient>
									<linearGradient id="paint2_linear_69_1366" x1="45.6607" y1="6.50146" x2="45.6607" y2="171.987" gradientUnits="userSpaceOnUse">
										<stop stopColor="#DD1616"/>
										<stop offset="1" stopColor="#AD1A1A"/>
									</linearGradient>
									<linearGradient id="paint3_linear_69_1366" x1="717.661" y1="13.0542" x2="717.661" y2="307.502" gradientUnits="userSpaceOnUse">
										<stop stopColor="#DD1616"/>
										<stop offset="1" stopColor="#AD1A1A"/>
									</linearGradient>
								</defs>
								<path d="M212.821 17.0017C90.8213 -14.9989 -31.1787 153.501 115.821 307.502" stroke="url(#paint0_linear_69_1366)" strokeWidth="13" strokeLinecap="round" fill="none"/>
								<path d="M835.631 171.987C850.1 97.7228 813.66 33.4529 760.5 6.50146" stroke="url(#paint1_linear_69_1366)" strokeWidth="13" strokeLinecap="round" fill="none"/>
								<path d="M9.69011 171.987C-4.77864 97.7228 31.6609 33.4529 84.8213 6.50146" stroke="url(#paint2_linear_69_1366)" strokeWidth="13" strokeLinecap="round" fill="none"/>
								<path d="M635.5 17.0017C757.5 -14.9989 879.5 153.501 732.5 307.502" stroke="url(#paint3_linear_69_1366)" strokeWidth="13" strokeLinecap="round" fill="none"/>
								<path d="M549.625 492.501L512.25 529.501L475.291 566.09C454.111 587.057 420.219 587.763 398.185 567.695L356.25 529.501L315.625 492.501" stroke="#C70B0B" strokeWidth="13" strokeLinecap="round" fill="none"/>
								<path d="M512.75 577.001L488.79 598.638C459.638 624.962 415.574 625.871 385.362 600.771L356.75 577.001" stroke="#C70B0B" strokeWidth="13" strokeLinecap="round" fill="none"/>
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
 
			</div>
 
			{/* ── Right Side Panel: Form Card ── */}
			<div className="flex-1 flex flex-col items-center justify-center px-6 py-6 lg:px-10 lg:py-10 z-10 min-h-screen">
				
				{/* Logo visible only on mobile/tablet on the red background */}
				<div className="lg:hidden flex justify-center mb-6 z-20">
					<Link href="/">
						<Image 
							src="/assets/brand_logo.svg" 
							alt="Meetday" 
							width={130} 
							height={36} 
							priority 
							style={{ filter: "brightness(0) invert(1)" }} 
							className="h-8 w-auto"
						/>
					</Link>
				</div>
 
				{/* The Onboarding Form Card */}
				<div className="w-full lg:w-[40vw] max-w-[550px] min-w-[340px] bg-white border-[4px] border-black rounded-[36px] pl-8 pr-2 py-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative flex flex-col h-[87vh] max-h-[87vh] translate-y-8">
					
					{/* Scrollable Container inside the card */}
					<div className="w-full flex-1 overflow-y-auto pr-6 flex flex-col min-h-0">
						<div className="w-full flex flex-col gap-4 my-auto auth-card-content">
							{children}
						</div>
					</div>

				</div>
				<style>{`
					.auth-card-content label {
						font-size: 1.05rem !important;
					}
					.auth-card-content p, 
					.auth-card-content .text-sm,
					.auth-card-content .text-body-sm {
						font-size: 1.05rem !important;
					}
					.auth-card-content input {
						font-size: 1.15rem !important;
					}
					.auth-card-content button {
						font-size: 1.15rem !important;
					}
				`}</style>
			</div>

		</div>
	)
}
