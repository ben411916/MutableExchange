"use client"

import { useEffect, useRef } from "react"
import type { GameObject, GameState, Player } from "./game-engine"

interface GameRendererProps {
  gameState: GameState
  localPlayerId: string
}

export default function GameRenderer({ gameState, localPlayerId }: GameRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = gameState.arenaSize.width
    canvas.height = gameState.arenaSize.height

    // Clear canvas
    ctx.fillStyle = "#1a1a1a"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    ctx.strokeStyle = "#333333"
    ctx.lineWidth = 1
    const gridSize = 40
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    // Draw walls
    gameState.walls.forEach((wall) => {
      drawObject(ctx, wall)
    })

    // Draw bullets
    gameState.bullets.forEach((bullet) => {
      drawObject(ctx, bullet)
    })

    // Draw players
    Object.values(gameState.players).forEach((player) => {
      drawPlayer(ctx, player, player.id === localPlayerId)
    })

    // Draw pickups
    gameState.pickups.forEach((pickup) => {
      drawObject(ctx, pickup)
    })

    // Draw UI
    drawUI(ctx, gameState, localPlayerId)
  }, [gameState, localPlayerId])

  const drawObject = (ctx: CanvasRenderingContext2D, obj: GameObject) => {
    ctx.save()
    ctx.translate(obj.position.x, obj.position.y)
    ctx.rotate(obj.rotation)

    ctx.fillStyle = obj.color

    if (obj.type === "bullet") {
      // Draw bullet as a small circle
      ctx.beginPath()
      ctx.arc(0, 0, obj.size, 0, Math.PI * 2)
      ctx.fill()
    } else {
      // Draw other objects as squares
      ctx.fillRect(-obj.size, -obj.size, obj.size * 2, obj.size * 2)
    }

    ctx.restore()
  }

  const drawPlayer = (ctx: CanvasRenderingContext2D, player: Player, isLocal: boolean) => {
    ctx.save()
    ctx.translate(player.position.x, player.position.y)
    ctx.rotate(player.rotation)

    // Draw player body
    ctx.fillStyle = player.color
    ctx.beginPath()
    ctx.arc(0, 0, player.size, 0, Math.PI * 2)
    ctx.fill()

    // Draw player direction indicator
    ctx.fillStyle = "#ffffff"
    ctx.beginPath()
    ctx.moveTo(player.size - 5, 0)
    ctx.lineTo(player.size + 10, 0)
    ctx.stroke()

    // Draw health bar
    ctx.restore()

    const healthBarWidth = 40
    const healthBarHeight = 5
    const healthPercentage = player.health / 100

    ctx.fillStyle = "#333333"
    ctx.fillRect(
      player.position.x - healthBarWidth / 2,
      player.position.y - player.size - 10,
      healthBarWidth,
      healthBarHeight,
    )

    ctx.fillStyle = healthPercentage > 0.5 ? "#00ff00" : healthPercentage > 0.25 ? "#ffff00" : "#ff0000"
    ctx.fillRect(
      player.position.x - healthBarWidth / 2,
      player.position.y - player.size - 10,
      healthBarWidth * healthPercentage,
      healthBarHeight,
    )

    // Draw player name
    ctx.fillStyle = "#ffffff"
    ctx.font = "12px 'Press Start 2P', monospace"
    ctx.textAlign = "center"
    ctx.fillText(player.name, player.position.x, player.position.y - player.size - 15)

    // Highlight local player
    if (isLocal) {
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(player.position.x, player.position.y, player.size + 5, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  const drawUI = (ctx: CanvasRenderingContext2D, gameState: GameState, localPlayerId: string) => {
    const player = gameState.players[localPlayerId]
    if (!player) return

    // Draw score and stats
    ctx.fillStyle = "#ffffff"
    ctx.font = "16px 'Press Start 2P', monospace"
    ctx.textAlign = "left"
    ctx.fillText(`HEALTH: ${player.health}`, 20, 30)
    ctx.fillText(`SCORE: ${player.score}`, 20, 60)
    ctx.fillText(`KILLS: ${player.kills}`, 20, 90)
    ctx.fillText(`DEATHS: ${player.deaths}`, 20, 120)

    // Draw cooldown indicators
    const dashCooldownPercentage = Math.max(0, 1 - player.dashCooldown / 2)
    ctx.fillStyle = "#333333"
    ctx.fillRect(20, 140, 100, 10)
    ctx.fillStyle = dashCooldownPercentage === 1 ? "#00ff00" : "#ff9900"
    ctx.fillRect(20, 140, 100 * dashCooldownPercentage, 10)
    ctx.fillStyle = "#ffffff"
    ctx.fillText("DASH", 130, 150)

    // Draw game time
    const minutes = Math.floor(gameState.gameTime / 60)
    const seconds = Math.floor(gameState.gameTime % 60)
    ctx.textAlign = "center"
    ctx.fillText(
      `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      gameState.arenaSize.width / 2,
      30,
    )

    // Draw game over message
    if (gameState.isGameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(0, 0, gameState.arenaSize.width, gameState.arenaSize.height)

      ctx.fillStyle = "#ffffff"
      ctx.font = "24px 'Press Start 2P', monospace"
      ctx.textAlign = "center"
      ctx.fillText("GAME OVER", gameState.arenaSize.width / 2, gameState.arenaSize.height / 2 - 40)

      if (gameState.winner) {
        const winnerName = gameState.players[gameState.winner]?.name || "Unknown"
        ctx.fillText(`${winnerName} WINS!`, gameState.arenaSize.width / 2, gameState.arenaSize.height / 2)
      } else {
        ctx.fillText("DRAW!", gameState.arenaSize.width / 2, gameState.arenaSize.height / 2)
      }
    }
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        width={gameState.arenaSize.width}
        height={gameState.arenaSize.height}
      />
    </div>
  )
}
