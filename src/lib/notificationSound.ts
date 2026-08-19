// Short, distinct "message arrived" chime synthesized via Web Audio API — no audio asset needed,
// avoids licensing concerns, and keeps the bundle small. Two quick ascending tones (not a copy
// of WhatsApp's pop sound). Plays even if the tab is in the background, as long as the page has
// already had a user interaction (browsers block audio autoplay before that).

let sharedAudioContext: AudioContext | null = null
let userHasInteracted = false

function getAudioContext(): AudioContext | null {
	if (typeof window === "undefined") return null
	const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
	if (!AudioContextCtor) return null
	if (!sharedAudioContext) sharedAudioContext = new AudioContextCtor()
	return sharedAudioContext
}

function markInteracted() {
	userHasInteracted = true
	getAudioContext()?.resume().catch(() => {})
}

if (typeof window !== "undefined") {
	;(["pointerdown", "keydown"] as const).forEach(evt =>
		window.addEventListener(evt, markInteracted, { once: true, passive: true }),
	)
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

/** Plays a short two-tone "new message" chime. Silently no-ops if audio isn't available/allowed yet. */
export function playMessageChime() {
	const ctx = getAudioContext()
	if (!ctx || !userHasInteracted) return
	if (ctx.state === "suspended") ctx.resume().catch(() => {})
	const now = ctx.currentTime
	playTone(ctx, now, 880, 0.12)
	playTone(ctx, now + 0.1, 1318.5, 0.16)
}
