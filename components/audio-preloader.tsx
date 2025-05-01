"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

// Dynamically import AudioPlayer with no SSR
const AudioPlayer = dynamic(() => import("@/components/audio-player"), { ssr: false })

export default function AudioPreloader() {
  const [isClient, setIsClient] = useState(false)

  // Only render audio elements on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) return null

  return (
    <div className="hidden">
      <AudioPlayer
        src="/sounds/IntroAudio.mp3"
        volume={0}
        onError={(e) => console.warn("Error preloading intro audio:", e)}
      />
      <AudioPlayer
        src="/sounds/coin1.mp3"
        volume={0}
        onError={(e) => console.warn("Error preloading coin1 audio:", e)}
      />
      <AudioPlayer
        src="/sounds/coin2.mp3"
        volume={0}
        onError={(e) => console.warn("Error preloading coin2 audio:", e)}
      />
      <AudioPlayer
        src="/sounds/coin3.mp3"
        volume={0}
        onError={(e) => console.warn("Error preloading coin3 audio:", e)}
      />
      <AudioPlayer
        src="/sounds/coin4.mp3"
        volume={0}
        onError={(e) => console.warn("Error preloading coin4 audio:", e)}
      />
    </div>
  )
}
