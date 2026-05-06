import { Button } from "@/components/ui/Button"

function GoogleIcon() {
	return (
		<svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden>
			<path
				d="M19.6 10.23c0-.68-.06-1.36-.17-2H10v3.79h5.39a4.6 4.6 0 0 1-2 3.02v2.5h3.24C18.44 15.95 19.6 13.27 19.6 10.23z"
				fill="#4285F4"
			/>
			<path
				d="M10 20c2.7 0 4.96-.9 6.62-2.43l-3.24-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.75-5.59-4.11H1.07v2.59A10 10 0 0 0 10 20z"
				fill="#34A853"
			/>
			<path
				d="M4.41 11.91A6 6 0 0 1 4.1 10c0-.66.11-1.3.31-1.91V5.5H1.07A10 10 0 0 0 0 10c0 1.61.39 3.14 1.07 4.5l3.34-2.59z"
				fill="#FBBC05"
			/>
			<path
				d="M10 3.98c1.47 0 2.79.5 3.83 1.5l2.87-2.87C14.96.99 12.7 0 10 0A10 10 0 0 0 1.07 5.5l3.34 2.59C5.2 5.73 7.4 3.98 10 3.98z"
				fill="#EA4335"
			/>
		</svg>
	)
}

function AppleIcon() {
	return (
		<svg viewBox="0 0 20 20" fill="currentColor" className="size-5" aria-hidden>
			<path d="M14.18 0c.08 1.09-.32 2.16-.97 2.95-.68.82-1.74 1.46-2.82 1.38-.1-1.06.38-2.17 1-2.93C12.07.6 13.18 0 14.18 0zm3.6 14.62c-.47 1.04-1 1.98-1.76 2.86-.76.9-1.55 1.82-2.73 1.82-1.17 0-1.56-.73-2.91-.73-1.38 0-1.8.75-2.94.75-1.16 0-1.93-.88-2.72-1.8C2.59 15.92 1.25 13.06 1.25 10.3c0-3.76 2.45-5.75 4.86-5.75 1.3 0 2.38.85 3.19.85.78 0 2.02-.9 3.46-.9 1.1 0 3.03.48 4.11 2.27-3.63 2-3.04 7.18.91 7.85z" />
		</svg>
	)
}

interface SocialSignInProps {
	layout?: "stacked" | "side-by-side"
}

export function SocialSignIn({ layout = "stacked" }: SocialSignInProps) {
	const btnClass = layout === "side-by-side" ? "flex-1" : "w-full"

	const buttons = (
		<>
			<Button
				variant="secondary"
				size="md"
				radius="pill"
				leftIcon={<GoogleIcon />}
				className={btnClass}
				type="button"
			>
				Continue with Google
			</Button>
			<Button
				variant="secondary"
				size="md"
				radius="pill"
				leftIcon={<AppleIcon />}
				className={btnClass}
				type="button"
			>
				Continue with Apple
			</Button>
		</>
	)

	return layout === "side-by-side" ? (
		<div className="flex gap-3">{buttons}</div>
	) : (
		<div className="flex flex-col gap-3">{buttons}</div>
	)
}
