// Notification sound for incoming chat messages and alerts — synthesizes a pleasant, crisp
// two-tone chime via the Web Audio API with zero external audio assets, and speaks "Meetday" aloud.

const MUTE_STORAGE_KEY = "meetday_notification_sound_muted"

/** Whether the user has turned off the notification sound from their profile. */
export function isNotificationSoundMuted(): boolean {
	if (typeof window === "undefined") return false
	try {
		return window.localStorage.getItem(MUTE_STORAGE_KEY) === "true"
	} catch {
		return false
	}
}

export function setNotificationSoundMuted(muted: boolean) {
	if (typeof window === "undefined") return
	try {
		window.localStorage.setItem(MUTE_STORAGE_KEY, muted ? "true" : "false")
	} catch {
		// Storage unavailable (private browsing, quota, etc.) — non-critical, just won't persist.
	}
}

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
	if (typeof window === "undefined") return null
	const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
	if (!AudioContextClass) return null
	if (!audioCtx) {
		audioCtx = new AudioContextClass()
	}
	if (audioCtx.state === "suspended") {
		audioCtx.resume().catch(() => {})
	}
	return audioCtx
}

// Auto-unlock AudioContext on first user interaction in browser
if (typeof window !== "undefined") {
	const unlock = () => {
		if (audioCtx && audioCtx.state === "suspended") {
			audioCtx.resume().catch(() => {})
		}
		window.removeEventListener("click", unlock)
		window.removeEventListener("keydown", unlock)
		window.removeEventListener("touchstart", unlock)
	}
	window.addEventListener("click", unlock, { once: true, passive: true })
	window.addEventListener("keydown", unlock, { once: true, passive: true })
	window.addEventListener("touchstart", unlock, { once: true, passive: true })
}

function playWebAudioChime() {
	try {
		const ctx = getAudioContext()
		if (!ctx) return
		const now = ctx.currentTime

		// Primary bell oscillator (E6 -> G6 harmonic)
		const osc1 = ctx.createOscillator()
		const osc2 = ctx.createOscillator()
		const gainNode = ctx.createGain()

		osc1.type = "sine"
		osc1.frequency.setValueAtTime(880, now) // A5
		osc1.frequency.exponentialRampToValueAtTime(1318.5, now + 0.09) // E6

		osc2.type = "triangle"
		osc2.frequency.setValueAtTime(1760, now) // A6
		osc2.frequency.exponentialRampToValueAtTime(2637, now + 0.09)

		gainNode.gain.setValueAtTime(0.28, now)
		gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.38)

		osc1.connect(gainNode)
		osc2.connect(gainNode)
		gainNode.connect(ctx.destination)

		osc1.start(now)
		osc2.start(now)
		osc1.stop(now + 0.38)
		osc2.stop(now + 0.38)
	} catch {
		// AudioContext unsupported/blocked
	}
}

let meetdayVoice: SpeechSynthesisVoice | null = null

const KNOWN_FEMALE_VOICE_NAMES = [
	"Samantha", "Victoria", "Karen", "Moira", "Tessa", "Fiona", "Susan", "Allison", "Ava", "Kate", "Serena", "Zira", "Hazel",
]

function loadPreferredVoice() {
	if (typeof window === "undefined" || !window.speechSynthesis) return
	const voices = window.speechSynthesis.getVoices()
	if (!voices.length) return
	meetdayVoice =
		voices.find(v => /female/i.test(v.name)) ??
		voices.find(v => KNOWN_FEMALE_VOICE_NAMES.some(name => v.name.includes(name))) ??
		voices.find(v => v.lang.startsWith("en") && !/male/i.test(v.name)) ??
		voices.find(v => !/male/i.test(v.name)) ??
		voices[0]
}

if (typeof window !== "undefined" && window.speechSynthesis) {
	loadPreferredVoice()
	window.speechSynthesis.onvoiceschanged = loadPreferredVoice
}

/** Plays a pleasant notification chime and speaks "Meetday" aloud. */
export function playMessageChime() {
	if (isNotificationSoundMuted()) return
	// 1. Play crystal-clear Web Audio synthesized chime
	playWebAudioChime()

	// 2. Speak "Meetday" via SpeechSynthesis
	if (typeof window !== "undefined" && window.speechSynthesis) {
		try {
			if (!meetdayVoice) loadPreferredVoice()
			const synth = window.speechSynthesis
			if (synth.speaking || synth.pending) synth.cancel()
			const utterance = new SpeechSynthesisUtterance("Meetday")
			if (meetdayVoice) utterance.voice = meetdayVoice
			utterance.rate = 1.35
			utterance.pitch = 1.3
			utterance.volume = 0.85
			synth.resume()
			synth.speak(utterance)
		} catch {
			// Silently ignore TTS failure
		}
	}
}


