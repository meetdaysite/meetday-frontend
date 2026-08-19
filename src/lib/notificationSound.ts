// Short, distinct "message arrived" chime synthesized via Web Audio API — no audio asset needed,
// avoids licensing concerns, and keeps the bundle small. Two quick ascending tones (not a copy
// of WhatsApp's pop sound). Plays even if the tab is in the background, as long as the page has
// already had a user interaction somewhere (browsers block audio autoplay before that).

let sharedAudioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
	if (typeof window === "undefined") return null
	const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
	if (!AudioContextCtor) return null
	if (!sharedAudioContext) sharedAudioContext = new AudioContextCtor()
	return sharedAudioContext
}

function resumeContext() {
	getAudioContext()?.resume().catch(() => {})
}

if (typeof window !== "undefined") {
	// Any interaction anywhere on the site (login, clicking a nav item, typing) unlocks audio for
	// the rest of the session — resume proactively on the first one instead of waiting for a chime.
	;(["pointerdown", "keydown", "click", "touchstart"] as const).forEach(evt =>
		window.addEventListener(evt, resumeContext, { once: true, passive: true }),
	)
}

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

/** Speaks "Meetday" aloud via the browser's built-in text-to-speech — no audio asset needed. */
function speakMeetday() {
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
		// speechSynthesis unsupported/blocked — silently skip, the tone chime still played.
	}
}

function playTone(ctx: AudioContext, startTime: number, freq: number, duration: number) {
	const oscillator = ctx.createOscillator()
	const gain = ctx.createGain()
	oscillator.type = "sine"
	oscillator.frequency.setValueAtTime(freq, startTime)
	gain.gain.setValueAtTime(0, startTime)
	gain.gain.linearRampToValueAtTime(0.18, startTime + 0.015)
	gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
	oscillator.connect(gain)
	gain.connect(ctx.destination)
	oscillator.start(startTime)
	oscillator.stop(startTime + duration)
}

/** Plays a short two-tone "new message" chime, then speaks "Meetday" — silently no-ops if audio isn't available/allowed yet. */
export function playMessageChime() {
	const ctx = getAudioContext()
	if (ctx) {
		try {
			if (ctx.state === "suspended") {
				// Attempt resume then play regardless — most browsers allow this once any earlier
				// interaction occurred on the page, even if it wasn't captured by our own listeners.
				void ctx.resume()
			}
			const now = ctx.currentTime
			playTone(ctx, now, 880, 0.12)
			playTone(ctx, now + 0.1, 1318.5, 0.16)
		} catch {
			// Autoplay blocked (no interaction yet this session) — silently skip the tone.
		}
	}
	// Slight delay so the spoken word starts right as the tones fade out, not overlapping them.
	setTimeout(speakMeetday, 180)
}
