const BUCKETS: { bg: string; text: string; border: string }[] = [
	{ bg: "bg-red-100",    text: "text-red-700",    border: "border-red-200"    }, // A B C
	{ bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" }, // D E F
	{ bg: "bg-amber-100",  text: "text-amber-700",  border: "border-amber-200"  }, // G H I
	{ bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" }, // J K L
	{ bg: "bg-emerald-100",text: "text-emerald-700",border: "border-emerald-200"}, // M N O
	{ bg: "bg-cyan-100",   text: "text-cyan-700",   border: "border-cyan-200"   }, // P Q R
	{ bg: "bg-blue-100",   text: "text-blue-700",   border: "border-blue-200"   }, // S T U
	{ bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-200" }, // V W X Y Z
]

export function avatarColor(name: string): { bg: string; text: string; border: string } {
	const code = (name.trim()[0] ?? "A").toUpperCase().charCodeAt(0)
	const index = Math.floor(((code - 65) / 26) * BUCKETS.length)
	return BUCKETS[Math.min(index, BUCKETS.length - 1)]
}
