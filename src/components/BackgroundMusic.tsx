'use client'

import { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeOff } from 'lucide-react'
import { useSound } from '@/context/SoundContext'

export default function BackgroundMusic() {
    const { isSoundEnabled, toggleSound } = useSound()
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [hasInteracted, setHasInteracted] = useState(false)

    useEffect(() => {
        // Initialize audio instance
        const audio = new Audio('/audio/christmas-bg-song.mp3')
        audio.loop = true
        audio.volume = 0.3
        audio.preload = 'auto' // Instant load
        audioRef.current = audio

        // Cleanup
        return () => {
            audio.pause()
            audioRef.current = null
        }
    }, [])

    // Sync Audio Playback with Global State
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        if (isSoundEnabled) {
            if (hasInteracted) {
                // Standard play if we already have interaction
                audio.play().catch(() => {/* Ignore errors */ })
            } else {
                // Attempt play, might be blocked
                const p = audio.play()
                if (p !== undefined) {
                    p.then(() => setHasInteracted(true))
                        .catch(() => {
                            // Blocked, waiting for interaction
                        })
                }
            }
        } else {
            audio.pause()
        }
    }, [isSoundEnabled, hasInteracted])

    // Global unlock interaction
    useEffect(() => {
        const unlockAudio = () => {
            setHasInteracted(true) // Triggers the effect above to play if sound enabled
        }

        // Add one-time listeners to capture first user gesture
        window.addEventListener('click', unlockAudio, { once: true })
        window.addEventListener('touchstart', unlockAudio, { once: true })
        window.addEventListener('scroll', unlockAudio, { once: true })
        window.addEventListener('keydown', unlockAudio, { once: true })
        window.addEventListener('focus', unlockAudio, { once: true })
        window.addEventListener('input', unlockAudio, { once: true })

        return () => {
            window.removeEventListener('click', unlockAudio)
            window.removeEventListener('touchstart', unlockAudio)
            window.removeEventListener('scroll', unlockAudio)
            window.removeEventListener('keydown', unlockAudio)
            window.removeEventListener('focus', unlockAudio)
            window.removeEventListener('input', unlockAudio)
        }
    }, [])

    return (
        <button
            onClick={toggleSound}
            className="fixed top-9 right-9 z-[9999] p-3 rounded-full bg-white/2 backdrop-blur-[1px] border border-white/30 text-white shadow-lg hover:bg-white/6 transition-all hover:scale-110 active:scale-95 group"
            aria-label={isSoundEnabled ? "Mute background music" : "Play background music"}
        >
            <div className="relative">
                {isSoundEnabled ? (
                    <Volume2 className="w-6 h-6 text-white" />
                ) : (
                    <VolumeOff className="w-6 h-6 text-white/70" />
                )}

                {/* Pulse effect when playing */}
                {isSoundEnabled && (
                    <span className="absolute -inset-2 rounded-full border border-white/30 animate-ping opacity-75"></span>
                )}
            </div>
        </button>
    )
}
