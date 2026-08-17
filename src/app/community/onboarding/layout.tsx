export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="relative min-h-screen bg-[#EE2C2C] flex flex-col font-sans selection:bg-white selection:text-[#EE2C2C]">
			<main className="relative flex flex-1 w-full max-w-screen-2xl mx-auto z-10">
				{children}
			</main>
		</div>
	)
}
