"use client"

import { useEffect, useRef, useState } from "react"

interface AudioPlayerProps {
  src: string
  autoPlay?: boolean
  volume?: number
  onError?: (error: Error) => void
  onPlay?: () => void
}

export default function AudioPlayer({ src, autoPlay = false, volume = 1.0, onError, onPlay }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Set volume
    audio.volume = volume

    // Set up event listeners
    const handleError = () => {
      const errorMessage = `Failed to load audio: ${src}`
      setError(errorMessage)
      if (onError) onError(new Error(errorMessage))
    }

    const handlePlay = () => {
      if (onPlay) onPlay()
    }

    audio.addEventListener("error", handleError)
    audio.addEventListener("play", handlePlay)

    // Clean up
    return () => {
      audio.removeEventListener("error", handleError)
      audio.removeEventListener("play", handlePlay)
    }
  }, [src, volume, onError, onPlay])

  // Try to play if autoPlay is true
  useEffect(() => {
    const audio = audioRef.current
    if (autoPlay && audio) {
      audio.play().catch((err) => {
        console.warn("AutoPlay failed:", err)
        // This is expected in many browsers without user interaction
      })
    }
  }, [autoPlay])

  return (
    <>
      <audio ref={audioRef} src={src} preload="auto" />
      {error && <div className="sr-only">Error: {error}</div>}
    </>
  )
}
