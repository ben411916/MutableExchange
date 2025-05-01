"use client"

import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { SimpleErrorBoundary } from "../simple-error-boundary"

// Import GameBoard with SSR disabled to prevent hydration issues with Konva
const GameBoard = dynamic(() => import("./game-board"), {
  ssr: false,
  loading: () => <GameBoardFallback />,
})

function GameBoardFallback() {
  return (
    <div className="w-[600px] h-[600px] bg-gray-100 flex items-center justify-center">
      <p className="text-gray-500">Loading game board...</p>
    </div>
  )
}

export default function GameBoardWrapper(props: any) {
  const [isClient, setIsClient] = useState(false)
  const [renderAttempt, setRenderAttempt] = useState(0)
  const errorRef = useRef<Error | null>(null)

  useEffect(() => {
    setIsClient(true)
    console.log("GameBoardWrapper mounted")

    return () => {
      console.log("GameBoardWrapper unmounted")
    }
  }, [])

  const handleError = (error: Error) => {
    // Store the error in a ref to avoid state updates during error handling
    errorRef.current = error
    console.error("GameBoard error:", error.message)

    // Use setTimeout to break the current render cycle
    setTimeout(() => {
      if (errorRef.current === error) {
        setRenderAttempt((prev) => prev + 1)
        errorRef.current = null
      }
    }, 0)
  }

  if (!isClient) {
    return <GameBoardFallback />
  }

  return (
    <SimpleErrorBoundary key={`game-board-${renderAttempt}`} onError={handleError}>
      <div className="relative">
        <GameBoard {...props} />
        {renderAttempt > 0 && (
          <div className="absolute top-0 right-0 bg-yellow-100 text-yellow-800 text-xs p-1 rounded">
            Render attempt: {renderAttempt + 1}
          </div>
        )}
      </div>
    </SimpleErrorBoundary>
  )
}
