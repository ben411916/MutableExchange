"use client"

import { useEffect, useRef, useState } from "react"
import { createInitialGameState, createPlayer, type GameState, updateGameState } from "./game-engine"
import GameRenderer from "./game-renderer"

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

  // Initialize game
  useEffect(() => {
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
      gameStateRef.current = newState
      setGameState(newState)

      // Check for game over
      if (newState.isGameOver && onGameEnd) {
        onGameEnd(newState.winner)
      } else {
        // Continue game loop
        requestAnimationFrameIdRef.current = requestAnimationFrame(gameLoop)
      }
    }

    // Start game loop
    requestAnimationFrameIdRef.current = requestAnimationFrame(gameLoop)

    // Set up keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStateRef.current.players[playerId]) return

      const player = gameStateRef.current.players[playerId]

      switch (e.key.toLowerCase()) {
        case "w":
          player.controls.up = true
          break
        case "s":
          player.controls.down = true
          break
        case "a":
          player.controls.left = true
          break
        case "d":
          player.controls.right = true
          break
        case " ": // Space
          player.controls.shoot = true
          break
        case "shift":
          player.controls.dash = true
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!gameStateRef.current.players[playerId]) return

      const player = gameStateRef.current.players[playerId]

      switch (e.key.toLowerCase()) {
        case "w":
          player.controls.up = false
          break
        case "s":
          player.controls.down = false
          break
        case "a":
          player.controls.left = false
          break
        case "d":
          player.controls.right = false
          break
        case " ": // Space
          player.controls.shoot = false
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
        // Left click
        gameStateRef.current.players[playerId].controls.shoot = true
      } else if (e.button === 2) {
        // Right click
        gameStateRef.current.players[playerId].controls.dash = true
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (!gameStateRef.current.players[playerId]) return

      if (e.button === 0) {
        // Left click
        gameStateRef.current.players[playerId].controls.shoot = false
      } else if (e.button === 2) {
        // Right click
        gameStateRef.current.players[playerId].controls.dash = false
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

    // Clean up
    return () => {
      cancelAnimationFrame(requestAnimationFrameIdRef.current)
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mousedown", handleMouseDown)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("contextmenu", handleContextMenu)
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
          ai.controls.shoot = Math.random() > 0.8
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

  return <GameRenderer gameState={gameState} localPlayerId={playerId} />
}
