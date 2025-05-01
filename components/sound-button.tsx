"use client"

import type React from "react"

import { type ReactNode, useEffect, useState } from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { playRandomCoinSound, initializeAudio, isAudioSupported } from "@/utils/sound-utils"

interface SoundButtonProps extends ButtonProps {
  children: ReactNode
  noSound?: boolean
}

export default function SoundButton({ children, noSound = false, onClick, ...props }: SoundButtonProps) {
  const [audioInitialized, setAudioInitialized] = useState(false)

  // Initialize audio on first user interaction
  useEffect(() => {
    if (!audioInitialized) {
      const handleFirstInteraction = async () => {
        try {
          await initializeAudio()
          setAudioInitialized(true)
        } catch (error) {
          console.error("Failed to initialize audio:", error)
        }
      }

      // Try to initialize on mount
      handleFirstInteraction()

      // Also set up event listener for user interaction
      const handleUserInteraction = () => {
        handleFirstInteraction()
        // Remove event listeners after first interaction
        document.removeEventListener("click", handleUserInteraction)
        document.removeEventListener("touchstart", handleUserInteraction)
        document.removeEventListener("keydown", handleUserInteraction)
      }

      document.addEventListener("click", handleUserInteraction)
      document.addEventListener("touchstart", handleUserInteraction)
      document.addEventListener("keydown", handleUserInteraction)

      return () => {
        document.removeEventListener("click", handleUserInteraction)
        document.removeEventListener("touchstart", handleUserInteraction)
        document.removeEventListener("keydown", handleUserInteraction)
      }
    }
  }, [audioInitialized])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Play sound if not disabled
    if (!props.disabled && !noSound && isAudioSupported()) {
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
