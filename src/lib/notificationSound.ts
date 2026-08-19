// "Meetday" spoken aloud as the new-message notification sound, via the browser's built-in
// text-to-speech — no audio asset needed, avoids licensing concerns, keeps the bundle small.

let meetdayVoice: SpeechSynthesisVoice | null = null

// Curated names known to be female voices across macOS/Windows/Chrome — used as a fallback when
// a voice isn't explicitly tagged "female" in its name.
const KNOWN_FEMALE_VOICE_NAMES = [
	"Samantha", "Victoria", "Karen", "Moira", "Tessa", "Fiona", "Susan", "Allison", "Ava", "Kate", "Serena", "Zira", "Hazel",
]

function loadPreferredVoice() {
	if (typeof window === "undefined" || !window.speechSynthesis) return
	const voices = window.speechSynthesis.getVoices()
	if (!voices.length) return
	// Always prefer a clearly female-sounding voice, never a male one.
	meetdayVoice =
		voices.find(v => /female/i.test(v.name)) ??
		voices.find(v => KNOWN_FEMALE_VOICE_NAMES.some(name => v.name.includes(name))) ??
		voices.find(v => v.lang.startsWith("en") && !/male/i.test(v.name)) ??
		voices.find(v => !/male/i.test(v.name)) ??
		voices[0]
}

if (typeof window !== "undefined" && window.speechSynthesis) {
	loadPreferredVoice()
	// Voice list loads asynchronously in some browsers (esp. Chrome) — refresh once it's ready.
	window.speechSynthesis.onvoiceschanged = loadPreferredVoice
}

/** Speaks "Meetday" aloud as the new-message notification sound. Silently no-ops if unsupported/blocked. */
export function playMessageChime() {
	if (typeof window === "undefined" || !window.speechSynthesis) return
	try {
		if (!meetdayVoice) loadPreferredVoice()
		// Cancel any queued utterance so rapid-fire messages don't stack up a backlog of "Meetday"s.
		window.speechSynthesis.cancel()
		const utterance = new SpeechSynthesisUtterance("Meetday")
		if (meetdayVoice) utterance.voice = meetdayVoice
		utterance.rate = 1.35
		utterance.pitch = 1.3
		utterance.volume = 0.85
		window.speechSynthesis.speak(utterance)
	} catch {
		// speechSynthesis unsupported/blocked — silently skip.
	}
}

