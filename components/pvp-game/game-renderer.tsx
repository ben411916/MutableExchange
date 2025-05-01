"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import type { GameObject, GameState, Player } from "./game-engine"
import { createArcherAnimationSet, SpriteAnimator } from "@/utils/sprite-animation"
import {
  generateArcherSprite,
  generateArrowSprite,
  generatePickupSprite,
  generateWallSprite,
  generateBackgroundTile,
  generateParticle,
  generateDeathEffect,
} from "@/utils/sprite-generator"

interface GameRendererProps {
  gameState: GameState
  localPlayerId: string
}

// Particle system interface
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  type: string
  frame: number
  maxFrames: number
}

export default function GameRenderer({ gameState, localPlayerId }: GameRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animatorsRef = useRef<Record<string, SpriteAnimator>>({})
  const lastUpdateTimeRef = useRef<number>(Date.now())
  const frameCountRef = useRef<number>(0)
  const [particles, setParticles] = useState<Particle[]>([])
  const particlesRef = useRef<Particle[]>([])
  const [debugMode, setDebugMode] = useState<boolean>(false)

  // Draw background with tiles
  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const tileSize = 40

    // Draw base background
    ctx.fillStyle = "#1a3300"
    ctx.fillRect(0, 0, width, height)

    // Draw tiles
    for (let x = 0; x < width; x += tileSize) {
      for (let y = 0; y < height; y += tileSize) {
        // Use a deterministic pattern based on position
        const tileType = (x + y) % 120 === 0 ? "dirt" : "grass"
        generateBackgroundTile(ctx, x, y, tileSize, tileType)
      }
    }
  }

  const drawWall = (ctx: CanvasRenderingContext2D, wall: GameObject) => {
    // Use our enhanced wall sprite
    generateWallSprite(ctx, wall.position.x, wall.position.y, wall.size)
  }

  const drawArrow = (ctx: CanvasRenderingContext2D, arrow: GameObject) => {
    // Use our enhanced arrow sprite
    generateArrowSprite(ctx, arrow.position.x, arrow.position.y, arrow.size, arrow.rotation)
  }

  const drawPlayer = (ctx: CanvasRenderingContext2D, player: Player, isLocal: boolean) => {
    ctx.save()

    // Get the animator for this player
    const animator = animatorsRef.current[player.id]
    const animationState = player.animationState
    const frame = frameCountRef.current

    // Flip based on direction
    let flipX = false
    if (player.rotation > Math.PI / 2 || player.rotation < -Math.PI / 2) {
      flipX = true
    }

    // Draw the player using our enhanced sprite
    if (flipX) {
      ctx.translate(player.position.x, player.position.y)
      ctx.scale(-1, 1)
      generateArcherSprite(ctx, 0, 0, player.size, player.color, animationState, frame, player.isDrawingBow)
    } else {
      generateArcherSprite(
        ctx,
        player.position.x,
        player.position.y,
        player.size,
        player.color,
        animationState,
        frame,
        player.isDrawingBow,
      )
    }

    ctx.restore()

    // Draw health bar and name
    drawPlayerUI(ctx, player, isLocal)
  }

  const drawPlayerUI = (ctx: CanvasRenderingContext2D, player: Player, isLocal: boolean) => {
    ctx.save()
    ctx.translate(player.position.x, player.position.y)

    // Health bar - pixelated style
    const healthBarWidth = 40
    const healthBarHeight = 4
    const healthPercentage = player.health / 100

    // Health bar position
    const healthBarX = -healthBarWidth / 2
    const healthBarY = -48 // Position above player

    // Health bar background with border
    ctx.fillStyle = "#333333"
    ctx.fillRect(healthBarX - 1, healthBarY - 1, healthBarWidth + 2, healthBarHeight + 2)

    // Health bar fill - pixelated segments
    const filledWidth = Math.floor(healthBarWidth * healthPercentage)
    ctx.fillStyle = healthPercentage > 0.5 ? "#00ff00" : healthPercentage > 0.25 ? "#ffff00" : "#ff0000"

    // Draw health as segments
    const segmentWidth = 4
    const segments = Math.floor(filledWidth / segmentWidth)
    for (let i = 0; i < segments; i++) {
      ctx.fillRect(healthBarX + i * segmentWidth, healthBarY, segmentWidth - 1, healthBarHeight)
    }

    // Draw player name with shadow
    ctx.fillStyle = "#000000"
    ctx.font = "12px Arial"
    ctx.textAlign = "center"
    ctx.fillText(player.name, 1, -51)

    ctx.fillStyle = "#ffffff"
    ctx.fillText(player.name, 0, -52)

    // Highlight local player
    if (isLocal) {
      // Draw arrow pointing to local player
      const arrowSize = 10
      const arrowY = -player.size - 15

      ctx.fillStyle = "#FFFFFF"
      ctx.beginPath()
      ctx.moveTo(0, arrowY)
      ctx.lineTo(-arrowSize / 2, arrowY - arrowSize)
      ctx.lineTo(arrowSize / 2, arrowY - arrowSize)
      ctx.closePath()
      ctx.fill()

      // Pulsating highlight
      const pulseSize = player.size + 5 + Math.sin(frameCountRef.current * 0.1) * 2
      ctx.strokeStyle = "#FFFFFF"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, 0, pulseSize, 0, Math.PI * 2)
      ctx.stroke()
    }

    ctx.restore()
  }

  const drawPickup = (ctx: CanvasRenderingContext2D, pickup: GameObject) => {
    // Use our enhanced pickup sprite
    generatePickupSprite(ctx, pickup.position.x, pickup.position.y, pickup.size, pickup.color, frameCountRef.current)
  }

  const drawUI = (ctx: CanvasRenderingContext2D, gameState: GameState, localPlayerId: string) => {
    const player = gameState.players[localPlayerId]
    if (!player) return

    // Draw UI panel background
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    ctx.fillRect(10, 10, 200, 220)
    ctx.strokeStyle = "#FFFFFF"
    ctx.lineWidth = 2
    ctx.strokeRect(10, 10, 200, 220)

    // Draw score and stats with pixel font
    ctx.fillStyle = "#ffffff"
    ctx.font = "16px Arial"
    ctx.textAlign = "left"
    ctx.fillText(`HEALTH: ${player.health}`, 20, 30)
    ctx.fillText(`SCORE: ${player.score}`, 20, 60)
    ctx.fillText(`KILLS: ${player.kills}`, 20, 90)
    ctx.fillText(`DEATHS: ${player.deaths}`, 20, 120)

    // Draw bow draw indicator - pixelated style
    if (player.isDrawingBow && player.drawStartTime !== null) {
      const currentTime = Date.now() / 1000
      const drawTime = currentTime - player.drawStartTime
      const drawPercentage = Math.min(drawTime / player.maxDrawTime, 1)

      // Background
      ctx.fillStyle = "#333333"
      ctx.fillRect(20, 150, 100, 10)

      // Fill with segments for pixelated look
      ctx.fillStyle = drawPercentage < 0.3 ? "#ff9900" : drawPercentage < 0.7 ? "#ffff00" : "#00ff00"
      const segmentWidth = 5
      const segments = Math.floor((100 * drawPercentage) / segmentWidth)
      for (let i = 0; i < segments; i++) {
        ctx.fillRect(20 + i * segmentWidth, 150, segmentWidth - 1, 10)
      }

      ctx.fillStyle = "#ffffff"
      ctx.fillText("BOW", 130, 160)
    }

    // Draw dash cooldown indicator - pixelated style
    const dashCooldownPercentage = Math.max(0, 1 - player.dashCooldown / 2)

    // Background
    ctx.fillStyle = "#333333"
    ctx.fillRect(20, 170, 100, 10)

    // Fill with segments
    ctx.fillStyle = dashCooldownPercentage === 1 ? "#00ff00" : "#ff9900"
    const dashSegmentWidth = 5
    const dashSegments = Math.floor((100 * dashCooldownPercentage) / dashSegmentWidth)
    for (let i = 0; i < dashSegments; i++) {
      ctx.fillRect(20 + i * dashSegmentWidth, 170, dashSegmentWidth - 1, 10)
    }

    ctx.fillStyle = "#ffffff"
    ctx.fillText("DASH", 130, 180)

    // Draw special attack cooldown indicator - pixelated style
    const specialCooldownPercentage = Math.max(0, 1 - player.specialAttackCooldown / 5)

    // Background
    ctx.fillStyle = "#333333"
    ctx.fillRect(20, 190, 100, 10)

    // Fill with segments
    ctx.fillStyle = specialCooldownPercentage === 1 ? "#00ff00" : "#ff9900"
    const specialSegmentWidth = 5
    const specialSegments = Math.floor((100 * specialCooldownPercentage) / specialSegmentWidth)
    for (let i = 0; i < specialSegments; i++) {
      ctx.fillRect(20 + i * specialSegmentWidth, 190, specialSegmentWidth - 1, 10)
    }

    ctx.fillStyle = "#ffffff"
    ctx.fillText("SPECIAL", 130, 200)

    // Draw remaining time with pixel font
    const remainingTime = Math.max(0, gameState.maxGameTime - gameState.gameTime)
    const minutes = Math.floor(remainingTime / 60)
    const seconds = Math.floor(remainingTime % 60)

    // Time background
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    ctx.fillRect(gameState.arenaSize.width / 2 - 70, 10, 140, 30)
    ctx.strokeStyle = "#FFFFFF"
    ctx.lineWidth = 2
    ctx.strokeRect(gameState.arenaSize.width / 2 - 70, 10, 140, 30)

    ctx.textAlign = "center"
    ctx.fillStyle = "#FFFFFF"
    ctx.font = "20px Arial"
    ctx.fillText(
      `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      gameState.arenaSize.width / 2,
      30,
    )

    // Draw scoreboard
    drawScoreboard(ctx, gameState)

    // Draw game over message with pixel font
    if (gameState.isGameOver) {
      // Semi-transparent overlay
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(0, 0, gameState.arenaSize.width, gameState.arenaSize.height)

      // Game over panel
      ctx.fillStyle = "#333333"
      ctx.fillRect(gameState.arenaSize.width / 2 - 150, gameState.arenaSize.height / 2 - 100, 300, 200)
      ctx.strokeStyle = "#FFFFFF"
      ctx.lineWidth = 3
      ctx.strokeRect(gameState.arenaSize.width / 2 - 150, gameState.arenaSize.height / 2 - 100, 300, 200)

      // Game over text with pixel font
      ctx.fillStyle = "#ffffff"
      ctx.font = "24px Arial"
      ctx.textAlign = "center"
      ctx.fillText("GAME OVER", gameState.arenaSize.width / 2, gameState.arenaSize.height / 2 - 60)

      if (gameState.winner) {
        const winnerName = gameState.players[gameState.winner]?.name || "Unknown"
        ctx.fillText(`${winnerName} WINS!`, gameState.arenaSize.width / 2, gameState.arenaSize.height / 2 - 20)

        // Add winner stats
        const winner = gameState.players[gameState.winner]
        if (winner) {
          ctx.font = "16px Arial"
          ctx.fillText(
            `Kills: ${winner.kills} | Score: ${winner.score}`,
            gameState.arenaSize.width / 2,
            gameState.arenaSize.height / 2 + 20,
          )
        }
      } else {
        ctx.fillText("DRAW!", gameState.arenaSize.width / 2, gameState.arenaSize.height / 2)
      }
    }

    // Draw debug toggle button
    ctx.fillStyle = debugMode ? "#FF5252" : "#4CAF50"
    ctx.fillRect(gameState.arenaSize.width - 110, gameState.arenaSize.height - 40, 100, 30)
    ctx.strokeStyle = "#FFFFFF"
    ctx.lineWidth = 2
    ctx.strokeRect(gameState.arenaSize.width - 110, gameState.arenaSize.height - 40, 100, 30)

    ctx.fillStyle = "#FFFFFF"
    ctx.font = "14px Arial"
    ctx.textAlign = "center"
    ctx.fillText(
      debugMode ? "Debug: ON" : "Debug: OFF",
      gameState.arenaSize.width - 60,
      gameState.arenaSize.height - 20,
    )
  }

  // Draw scoreboard
  const drawScoreboard = (ctx: CanvasRenderingContext2D, gameState: GameState) => {
    const players = Object.values(gameState.players)
    if (players.length === 0) return

    // Sort players by kills (descending)
    const sortedPlayers = [...players].sort((a, b) => b.kills - a.kills)

    // Draw scoreboard background
    const scoreboardWidth = 200
    const scoreboardHeight = 30 + sortedPlayers.length * 25
    const scoreboardX = gameState.arenaSize.width - scoreboardWidth - 10
    const scoreboardY = 10

    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    ctx.fillRect(scoreboardX, scoreboardY, scoreboardWidth, scoreboardHeight)
    ctx.strokeStyle = "#FFFFFF"
    ctx.lineWidth = 2
    ctx.strokeRect(scoreboardX, scoreboardY, scoreboardWidth, scoreboardHeight)

    // Draw header
    ctx.fillStyle = "#FFFFFF"
    ctx.font = "16px Arial"
    ctx.textAlign = "center"
    ctx.fillText("SCOREBOARD", scoreboardX + scoreboardWidth / 2, scoreboardY + 20)

    // Draw player scores
    ctx.textAlign = "left"
    ctx.font = "14px Arial"

    sortedPlayers.forEach((player, index) => {
      const isLocalPlayer = player.id === localPlayerId
      const y = scoreboardY + 45 + index * 25

      // Highlight local player
      if (isLocalPlayer) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)"
        ctx.fillRect(scoreboardX + 5, y - 15, scoreboardWidth - 10, 20)
      }

      // Draw color indicator
      ctx.fillStyle = player.color
      ctx.fillRect(scoreboardX + 10, y - 10, 10, 10)

      // Draw player name
      ctx.fillStyle = isLocalPlayer ? "#FFFF00" : "#FFFFFF"
      ctx.fillText(player.name, scoreboardX + 30, y)

      // Draw kills
      ctx.textAlign = "right"
      ctx.fillText(`${player.kills}`, scoreboardX + scoreboardWidth - 10, y)
      ctx.textAlign = "left"
    })
  }

  // Draw debug information
  const drawDebugInfo = (ctx: CanvasRenderingContext2D, gameState: GameState) => {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    ctx.fillRect(10, gameState.arenaSize.height - 120, 300, 110)
    ctx.strokeStyle = "#FFFFFF"
    ctx.lineWidth = 1
    ctx.strokeRect(10, gameState.arenaSize.height - 120, 300, 110)

    ctx.fillStyle = "#FFFFFF"
    ctx.font = "12px Arial"
    ctx.textAlign = "left"

    // Display frame count and FPS
    const now = Date.now()
    const fps = Math.round(1000 / (now - lastUpdateTimeRef.current))
    ctx.fillText(`Frame: ${frameCountRef.current} | FPS: ${fps}`, 20, gameState.arenaSize.height - 100)

    // Display particle count
    ctx.fillText(`Particles: ${particles.length}`, 20, gameState.arenaSize.height - 80)

    // Display local player info
    const player = gameState.players[localPlayerId]
    if (player) {
      ctx.fillText(
        `Position: (${Math.round(player.position.x)}, ${Math.round(player.position.y)})`,
        20,
        gameState.arenaSize.height - 60,
      )
      ctx.fillText(
        `Velocity: (${Math.round(player.velocity.x)}, ${Math.round(player.velocity.y)})`,
        20,
        gameState.arenaSize.height - 40,
      )
      ctx.fillText(
        `Animation: ${player.animationState} | Rotation: ${player.rotation.toFixed(2)}`,
        20,
        gameState.arenaSize.height - 20,
      )
    }
  }

  // Initialize animators for each player
  useEffect(() => {
    // Create animation set once
    const animationSet = createArcherAnimationSet()

    // Create or update animators for each player
    Object.values(gameState.players).forEach((player) => {
      if (!animatorsRef.current[player.id]) {
        animatorsRef.current[player.id] = new SpriteAnimator(animationSet)
      }

      // Update animator state based on player state
      const animator = animatorsRef.current[player.id]

      // Only change animation if the player's state has changed
      if (animator.getCurrentAnimationName() !== player.animationState) {
        animator.play(player.animationState)

        // Add death effect when player dies
        if (player.animationState === "death" && !animator.isDeathEffectStarted()) {
          animator.setDeathEffectStarted(true)
          addParticle(player.position.x, player.position.y, "hit", "#FF5252", 20, 15)
        }
      }
    })

    // Clean up animators for removed players
    Object.keys(animatorsRef.current).forEach((playerId) => {
      if (!gameState.players[playerId]) {
        delete animatorsRef.current[playerId]
      }
    })
  }, [gameState.players])

  // Animation loop
  useEffect(() => {
    const updateAnimations = () => {
      const now = Date.now()
      const deltaTime = (now - lastUpdateTimeRef.current) / 1000
      lastUpdateTimeRef.current = now
      frameCountRef.current++

      // Update all animators
      Object.values(animatorsRef.current).forEach((animator) => {
        animator.update(deltaTime)
      })

      // Update particles
      updateParticles(deltaTime)
    }

    const animationInterval = setInterval(updateAnimations, 1000 / 60) // 60 FPS

    return () => clearInterval(animationInterval)
  }, [])

  // Add particle effect
  const addParticle = (x: number, y: number, type: string, color: string, count = 1, size = 5) => {
    const newParticles: Particle[] = []

    for (let i = 0; i < count; i++) {
      // Calculate random velocity
      const speed = 20 + Math.random() * 30
      const angle = Math.random() * Math.PI * 2

      newParticles.push({
        x: x + (Math.random() * 10 - 5),
        y: y + (Math.random() * 10 - 5),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: size * (0.8 + Math.random() * 0.4),
        color,
        type,
        frame: 0,
        // FIX: Ensure maxFrames is always less than what would cause negative radius
        maxFrames: 25 + Math.floor(Math.random() * 5), // Reduced from 30 to 25 to prevent negative radius
      })
    }

    particlesRef.current = [...particlesRef.current, ...newParticles]
    setParticles(particlesRef.current)
  }

  // Update particles
  const updateParticles = (deltaTime: number) => {
    if (particlesRef.current.length === 0) return

    const updatedParticles = particlesRef.current
      .map((particle) => {
        // Update position
        const newX = particle.x + particle.vx * deltaTime
        const newY = particle.y + particle.vy * deltaTime

        // Apply gravity and friction for some particle types
        let newVx = particle.vx
        let newVy = particle.vy

        if (particle.type === "hit") {
          newVx *= 0.95 // Apply friction
          newVy *= 0.95
        } else if (particle.type === "trail") {
          newVx *= 0.9
          newVy *= 0.9
        }

        // Increment frame
        const newFrame = particle.frame + 1

        return {
          ...particle,
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy,
          frame: newFrame,
        }
      })
      // FIX: Ensure particles are removed before they cause negative radius
      .filter((particle) => particle.frame < particle.maxFrames && particle.frame < 29)

    particlesRef.current = updatedParticles
    setParticles(updatedParticles)
  }

  // Check for events that should trigger particles
  useEffect(() => {
    // Add hit particles when a player is hit
    Object.values(gameState.players).forEach((player) => {
      if (player.animationState === "hit") {
        addParticle(player.position.x, player.position.y, "hit", "#FF5252", 10, 10)
      } else if (player.animationState === "death") {
        addParticle(player.position.x, player.position.y, "hit", "#FF5252", 20, 15)
      }

      // Add movement trail for dashing players
      if (player.isDashing && frameCountRef.current % 3 === 0) {
        addParticle(player.position.x, player.position.y, "trail", player.color, 3, 8)
      }
    })

    // Add sparkle particles for arrows
    gameState.arrows.forEach((arrow) => {
      if (frameCountRef.current % 5 === 0) {
        addParticle(arrow.position.x, arrow.position.y, "trail", "#D3A973", 1, 3)
      }
    })
  }, [gameState])

  // Main render function
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = gameState.arenaSize.width
    canvas.height = gameState.arenaSize.height

    // Draw background with tiles
    drawBackground(ctx, gameState.arenaSize.width, gameState.arenaSize.height)

    // Draw walls
    gameState.walls.forEach((wall) => {
      drawWall(ctx, wall)
    })

    // Draw pickups
    gameState.pickups.forEach((pickup) => {
      drawPickup(ctx, pickup)
    })

    // Draw death effects first (so they appear under players)
    Object.values(gameState.players).forEach((player) => {
      const animator = animatorsRef.current[player.id]
      if (animator && animator.getCurrentAnimationName() === "death" && animator.isDeathEffectStarted()) {
        generateDeathEffect(ctx, player.position.x, player.position.y, player.size, player.color, frameCountRef.current)
      }
    })

    // Draw arrows
    gameState.arrows.forEach((arrow) => {
      drawArrow(ctx, arrow)
    })

    // Draw particles
    particles.forEach((particle) => {
      try {
        // FIX: Wrap particle generation in try/catch to prevent errors from crashing the game
        generateParticle(ctx, particle.x, particle.y, particle.size, particle.color, particle.type, particle.frame)
      } catch (error) {
        console.error("Error generating particle:", error)
        // Remove problematic particle
        particlesRef.current = particlesRef.current.filter((p) => p !== particle)
      }
    })

    // Draw players
    Object.values(gameState.players).forEach((player) => {
      drawPlayer(ctx, player, player.id === localPlayerId)
    })

    // Draw UI
    drawUI(ctx, gameState, localPlayerId)

    // Draw debug info if enabled
    if (debugMode) {
      drawDebugInfo(ctx, gameState)
    }
  }, [gameState, localPlayerId, particles, debugMode]) // Removed function references from dependency array

  // Handle click on debug button
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if debug button was clicked
    if (
      x >= gameState.arenaSize.width - 110 &&
      x <= gameState.arenaSize.width - 10 &&
      y >= gameState.arenaSize.height - 40 &&
      y <= gameState.arenaSize.height - 10
    ) {
      setDebugMode(!debugMode)
    }
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        width={gameState.arenaSize.width}
        height={gameState.arenaSize.height}
        onClick={handleCanvasClick}
      />
    </div>
  )
}
