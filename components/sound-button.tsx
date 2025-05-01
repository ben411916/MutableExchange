"use client"

import type React from "react"

import { type ReactNode, useEffect, useState } from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { playRandomCoinSound, initializeAudio } from "@/utils/sound-utils"

interface SoundButtonProps extends ButtonProps {
  children: ReactNode
  noSound?: boolean
}

export default function SoundButton({ children, noSound = false, onClick, ...props }: SoundButtonProps) {
  const [audioInitialized, setAudioInitialized] = useState(false)

  // Initialize audio on first user interaction
  useEffect(() => {
    if (!audioInitialized) {
      const handleFirstInteraction = () => {
        initializeAudio()
        setAudioInitialized(true)
        document.removeEventListener("click", handleFirstInteraction)
      }

      document.addEventListener("click", handleFirstInteraction)

      return () => {
        document.removeEventListener("click", handleFirstInteraction)
      }
    }
  }, [audioInitialized])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Play sound if not disabled
    if (!props.disabled && !noSound) {
      playRandomCoinSound()
    }

    // Call the original onClick handler if provided
    if (onClick) {
      onClick(e)
    }
  }

  return (
    <Button {...props} onClick={handleClick}>
      {children}
    </Button>
  )
}
