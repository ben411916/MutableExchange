"use client"

import { useEffect, useRef, useState } from "react"
import { createInitialGameState, createPlayer, type GameState, updateGameState } from "./game-engine"
import GameRenderer from "./game-renderer"
import DebugOverlay from "./debug-overlay"
import {
  initializeAudio,
  playBowDrawSound,
  playBowReleaseSound,
  playBowFullDrawSound,
  playSpecialAttackSound,
  playHitSound,
  playDeathSound,
  playDashSound,
  playGameOverSound,
  playVictorySound,
  startBackgroundMusic,
  stopBackgroundMusic,
  audioManager,
} from "@/utils/audio-manager"

interface GameControllerProps {
  playerId: string
  playerName: string
  isHost: boolean
  onGameEnd?: (winner: string | null) => void
}

export default function GameController({ playerId, playerName, isHost, onGameEnd }: GameControllerProps) {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState)
  const gameStateRef = useRef<GameState>(gameState)
  const lastUpdateTimeRef = useRef<number>(Date.now())
  const requestAnimationFrameIdRef = useRef<number>(0)
  const bowSoundPlayedRef = useRef<boolean>(false)
  const fullDrawSoundPlayedRef = useRef<boolean>(false)
  const specialSoundPlayedRef = useRef<boolean>(false)
  const audioInitializedRef = useRef<boolean>(false)
  const [showDebug, setShowDebug] = useState<boolean>(false)

  // Initialize game
  useEffect(() => {
    // Initialize audio system
    initializeAudio().then(() => {
      audioInitializedRef.current = true
      console.log("Audio system initialized")
    })

    // Create local player
    const playerColors = ["#FF5252", "#4CAF50", "#2196F3", "#FFC107"]
    const playerPositions = [
      { x: 100, y: 100 },
      { x: 700, y: 500 },
      { x: 700, y: 100 },
      { x: 100, y: 500 },
    ]

    const initialState = createInitialGameState()

    // Add local player
    const playerIndex = 0 // In a real multiplayer game, this would be determined by the server
    initialState.players[playerId] = createPlayer(
      playerId,
      playerName,
      playerPositions[playerIndex],
      playerColors[playerIndex],
    )
    console.log(`Created player with color: ${playerColors[playerIndex]}`)

    // Add AI players for testing
    if (isHost) {
      for (let i = 1; i < 3; i++) {
        const aiId = `ai-${i}`
        initialState.players[aiId] = createPlayer(aiId, `AI ${i}`, playerPositions[i], playerColors[i])
      }
    }

    setGameState(initialState)
    gameStateRef.current = initialState

    // Start game loop
    const gameLoop = () => {
      const now = Date.now()
      const deltaTime = (now - lastUpdateTimeRef.current) / 1000 // Convert to seconds
      lastUpdateTimeRef.current = now

      // Update game state
      const newState = updateGameState(gameStateRef.current, deltaTime)

      // Check for sound effects for the local player
      const localPlayer = newState.players[playerId]
      if (localPlayer && audioInitializedRef.current && !audioManager.isSoundMuted()) {
        // Only try to play sounds if audio is initialized and not muted
        try {
          // Bow drawing sound
          if (localPlayer.isDrawingBow && !bowSoundPlayedRef.current) {
            playBowDrawSound()
            bowSoundPlayedRef.current = true
          }

          // Full draw sound (when bow is fully drawn)
          if (localPlayer.isDrawingBow && localPlayer.drawStartTime) {
            const currentTime = Date.now() / 1000
            const drawTime = currentTime - localPlayer.drawStartTime

            if (drawTime >= localPlayer.maxDrawTime && !fullDrawSoundPlayedRef.current) {
              playBowFullDrawSound()
              fullDrawSoundPlayedRef.current = true
            }
          }

          // Bow release sound
          if (!localPlayer.isDrawingBow && gameStateRef.current.players[playerId]?.isDrawingBow) {
            playBowReleaseSound()
            bowSoundPlayedRef.current = false
            fullDrawSoundPlayedRef.current = false
          }

          // Special attack sound
          if (localPlayer.isChargingSpecial && !specialSoundPlayedRef.current) {
            specialSoundPlayedRef.current = true
          }

          // Special attack release sound
          if (!localPlayer.isChargingSpecial && gameStateRef.current.players[playerId]?.isChargingSpecial) {
            playSpecialAttackSound()
            specialSoundPlayedRef.current = false
          }

          // Dash sound
          if (localPlayer.isDashing && !gameStateRef.current.players[playerId]?.isDashing) {
            playDashSound()
          }

          // Hit sound
          if (
            localPlayer.animationState === "hit" &&
            gameStateRef.current.players[playerId]?.animationState !== "hit"
          ) {
            playHitSound()
          }

          // Death sound
          if (
            localPlayer.animationState === "death" &&
            gameStateRef.current.players[playerId]?.animationState !== "death"
          ) {
            playDeathSound()
          }
        } catch (error) {
          console.error("Error playing game sounds:", error)
          // Continue game even if sound playback fails
        }
      }

      gameStateRef.current = newState
      setGameState(newState)

      // Check for game over
      if (newState.isGameOver && onGameEnd) {
        // Play appropriate game over sound
        if (!audioManager.isSoundMuted()) {
          if (newState.winner === playerId) {
            playVictorySound()
          } else {
            playGameOverSound()
          }
        }

        // Stop background music
        stopBackgroundMusic()

        onGameEnd(newState.winner)
      } else {
        // Continue game loop
        requestAnimationFrameIdRef.current = requestAnimationFrame(gameLoop)
      }
    }

    // Start game loop
    requestAnimationFrameIdRef.current = requestAnimationFrame(gameLoop)

    // Start background music if not muted
    if (!audioManager.isSoundMuted()) {
      startBackgroundMusic()
    }

    // Set up keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStateRef.current.players[playerId]) return

      const player = gameStateRef.current.players[playerId]

      switch (e.key.toLowerCase()) {
        case "w":
        case "arrowup":
          player.controls.up = true
          break
        case "s":
        case "arrowdown":
          player.controls.down = true
          break
        case "a":
        case "arrowleft":
          player.controls.left = true
          break
        case "d":
        case "arrowright":
          player.controls.right = true
          break
        case "shift":
          player.controls.dash = true
          break
        // Toggle debug mode with F3
        case "f3":
          setShowDebug((prev) => !prev)
          break
        // Toggle mute with M
        case "m":
          audioManager.toggleMute()
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!gameStateRef.current.players[playerId]) return

      const player = gameStateRef.current.players[playerId]

      switch (e.key.toLowerCase()) {
        case "w":
        case "arrowup":
          player.controls.up = false
          break
        case "s":
        case "arrowdown":
          player.controls.down = false
          break
        case "a":
        case "arrowleft":
          player.controls.left = false
          break
        case "d":
        case "arrowright":
          player.controls.right = false
          break
        case "shift":
          player.controls.dash = false
          break
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!gameStateRef.current.players[playerId]) return

      const player = gameStateRef.current.players[playerId]
      const canvas = e.target as HTMLCanvasElement
      const rect = canvas.getBoundingClientRect()

      // Calculate mouse position relative to canvas
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      // Calculate angle between player and mouse
      const dx = mouseX - player.position.x
      const dy = mouseY - player.position.y
      player.rotation = Math.atan2(dy, dx)
    }

    const handleMouseDown = (e: MouseEvent) => {
      if (!gameStateRef.current.players[playerId]) return

      if (e.button === 0) {
        // Left click - start drawing bow
        gameStateRef.current.players[playerId].controls.shoot = true
      } else if (e.button === 2) {
        // Right click - start charging special attack
        gameStateRef.current.players[playerId].controls.special = true
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (!gameStateRef.current.players[playerId]) return

      if (e.button === 0) {
        // Left click release - fire arrow
        gameStateRef.current.players[playerId].controls.shoot = false
      } else if (e.button === 2) {
        // Right click release - fire special attack
        gameStateRef.current.players[playerId].controls.special = false
      }
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault() // Prevent context menu on right click
    }

    // Add event listeners
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mousedown", handleMouseDown)
    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("contextmenu", handleContextMenu)

    // Resume audio context on user interaction
    const resumeAudio = () => {
      if (!audioManager.isSoundMuted()) {
        audioManager.resumeAudioContext()
      }
    }
    document.addEventListener("click", resumeAudio)

    // Clean up
    return () => {
      cancelAnimationFrame(requestAnimationFrameIdRef.current)
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mousedown", handleMouseDown)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("contextmenu", handleContextMenu)
      document.removeEventListener("click", resumeAudio)

      // Stop background music
      stopBackgroundMusic()
    }
  }, [playerId, playerName, isHost, onGameEnd])

  // Update AI players
  useEffect(() => {
    if (!isHost) return

    const aiUpdateInterval = setInterval(() => {
      Object.keys(gameStateRef.current.players).forEach((id) => {
        if (id.startsWith("ai-")) {
          const ai = gameStateRef.current.players[id]

          // Simple AI: move randomly and shoot occasionally
          ai.controls.up = Math.random() > 0.7
          ai.controls.down = Math.random() > 0.7 && !ai.controls.up
          ai.controls.left = Math.random() > 0.7
          ai.controls.right = Math.random() > 0.7 && !ai.controls.left

          // Randomly shoot arrows
          if (Math.random() > 0.95 && !ai.isDrawingBow) {
            ai.controls.shoot = true

            // Release arrow after a random time
            setTimeout(
              () => {
                if (gameStateRef.current.players[id]) {
                  gameStateRef.current.players[id].controls.shoot = false
                }
              },
              Math.random() * 1000 + 200,
            )
          }

          // Randomly use special attack
          if (Math.random() > 0.98 && !ai.isChargingSpecial && ai.specialAttackCooldown <= 0) {
            ai.controls.special = true

            // Release special after a random time
            setTimeout(
              () => {
                if (gameStateRef.current.players[id]) {
                  gameStateRef.current.players[id].controls.special = false
                }
              },
              Math.random() * 500 + 500,
            )
          }

          // Randomly dash
          ai.controls.dash = Math.random() > 0.95

          // Randomly change rotation
          if (Math.random() > 0.9) {
            ai.rotation = Math.random() * Math.PI * 2
          }
        }
      })
    }, 500)

    return () => clearInterval(aiUpdateInterval)
  }, [isHost])

  return (
    <div className="relative">
      <GameRenderer gameState={gameState} localPlayerId={playerId} />
      <DebugOverlay gameState={gameState} localPlayerId={playerId} visible={showDebug} />

      {/* Small hint text */}
      <div className="absolute bottom-2 right-2 text-xs text-white/70 bg-black/20 backdrop-blur-sm px-2 py-1 rounded">
        Press M to toggle sound | F3 for debug
      </div>
    </div>
  )
}
