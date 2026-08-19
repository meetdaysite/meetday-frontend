// "Meetday" spoken aloud as the new-message notification sound, via the browser's built-in
// text-to-speech — no audio asset needed, avoids licensing concerns, keeps the bundle small.

let meetdayVoice: SpeechSynthesisVoice | null = null

function loadPreferredVoice() {
	if (typeof window === "undefined" || !window.speechSynthesis) return
	const voices = window.speechSynthesis.getVoices()
	if (!voices.length) return
	// Prefer a natural-sounding English voice — these tend to sound least robotic across browsers.
	meetdayVoice =
		voices.find(v => /Google US English|Google UK English Female|Samantha|Microsoft Zira|Microsoft David/i.test(v.name)) ??
		voices.find(v => v.lang.startsWith("en")) ??
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
		utterance.rate = 1
		utterance.pitch = 1.05
		utterance.volume = 0.85
		window.speechSynthesis.speak(utterance)
	} catch {
		// speechSynthesis unsupported/blocked — silently skip.
	}
}

