// Basic game engine for top-down shooter
export interface Vector2D {
  x: number
  y: number
}

export interface GameObject {
  id: string
  position: Vector2D
  velocity: Vector2D
  rotation: number
  size: number
  health: number
  color: string
  type: "player" | "arrow" | "wall" | "pickup"
  ownerId?: string
  damage?: number // Added damage property for arrows
}

export type PlayerAnimationState = "idle" | "run" | "fire" | "hit" | "death"

export interface Player extends GameObject {
  name: string
  score: number
  kills: number
  deaths: number
  cooldown: number
  dashCooldown: number
  isDashing: boolean
  dashDirection: Vector2D | null
  // Bow mechanics
  isDrawingBow: boolean
  drawStartTime: number | null
  maxDrawTime: number
  // Special attack
  isChargingSpecial: boolean
  specialChargeStartTime: number | null
  specialAttackCooldown: number
  specialAttackReady: boolean
  // Animation state
  animationState: PlayerAnimationState
  lastAnimationChange: number
  // Controls
  controls: {
    up: boolean
    down: boolean
    left: boolean
    right: boolean
    shoot: boolean
    dash: boolean
    special: boolean
  }
}

// Update the GameState interface to include maxGameTime
export interface GameState {
  players: Record<string, Player>
  arrows: GameObject[]
  walls: GameObject[]
  pickups: GameObject[]
  arenaSize: { width: number; height: number }
  gameTime: number
  maxGameTime: number
  isGameOver: boolean
  winner: string | null
}

// Available colors for players
export const playerColors = ["red", "blue", "green", "yellow", "purple", "brown", "black"]

// Update the createInitialGameState function to include maxGameTime
export const createInitialGameState = (): GameState => {
  return {
    players: {},
    arrows: [],
    walls: generateWalls(),
    pickups: [],
    arenaSize: { width: 800, height: 600 },
    gameTime: 0,
    maxGameTime: 120, // 2 minutes in seconds
    isGameOver: false,
    winner: null,
  }
}

export const createPlayer = (id: string, name: string, position: Vector2D, color: string): Player => {
  return {
    id,
    name,
    position,
    velocity: { x: 0, y: 0 },
    rotation: 0,
    size: 24, // Increased size to better match sprite size
    health: 100,
    color,
    type: "player",
    score: 0,
    kills: 0,
    deaths: 0,
    cooldown: 0,
    dashCooldown: 0,
    isDashing: false,
    dashDirection: null,
    // Bow mechanics
    isDrawingBow: false,
    drawStartTime: null,
    maxDrawTime: 1.5, // 1.5 seconds for max draw
    // Special attack
    isChargingSpecial: false,
    specialChargeStartTime: null,
    specialAttackCooldown: 0,
    specialAttackReady: false,
    // Animation state
    animationState: "idle",
    lastAnimationChange: Date.now(),
    controls: {
      up: false,
      down: false,
      left: false,
      right: false,
      shoot: false,
      dash: false,
      special: false,
    },
  }
}

export const createArrow = (
  position: Vector2D,
  velocity: Vector2D,
  rotation: number,
  ownerId: string,
  damage = 10,
): GameObject => {
  return {
    id: `arrow-${Date.now()}-${Math.random()}`,
    position: { ...position },
    velocity: { ...velocity },
    rotation,
    size: 5,
    health: 1,
    color: "#8B4513", // Brown color for arrows
    type: "arrow",
    ownerId,
    damage,
  }
}

export const generateWalls = (): GameObject[] => {
  const walls: GameObject[] = []

  // Arena boundaries
  const thickness = 20
  const width = 800
  const height = 600

  // Top wall
  walls.push({
    id: "wall-top",
    position: { x: width / 2, y: thickness / 2 },
    velocity: { x: 0, y: 0 },
    rotation: 0,
    size: thickness,
    health: Number.POSITIVE_INFINITY,
    color: "#333333",
    type: "wall",
  })

  // Bottom wall
  walls.push({
    id: "wall-bottom",
    position: { x: width / 2, y: height - thickness / 2 },
    velocity: { x: 0, y: 0 },
    rotation: 0,
    size: thickness,
    health: Number.POSITIVE_INFINITY,
    color: "#333333",
    type: "wall",
  })

  // Left wall
  walls.push({
    id: "wall-left",
    position: { x: thickness / 2, y: height / 2 },
    velocity: { x: 0, y: 0 },
    rotation: 0,
    size: thickness,
    health: Number.POSITIVE_INFINITY,
    color: "#333333",
    type: "wall",
  })

  // Right wall
  walls.push({
    id: "wall-right",
    position: { x: width - thickness / 2, y: height / 2 },
    velocity: { x: 0, y: 0 },
    rotation: 0,
    size: thickness,
    health: Number.POSITIVE_INFINITY,
    color: "#333333",
    type: "wall",
  })

  // Add some obstacles
  walls.push({
    id: "obstacle-1",
    position: { x: width / 2, y: height / 2 },
    velocity: { x: 0, y: 0 },
    rotation: 0,
    size: 40,
    health: Number.POSITIVE_INFINITY,
    color: "#555555",
    type: "wall",
  })

  walls.push({
    id: "obstacle-2",
    position: { x: width / 4, y: height / 4 },
    velocity: { x: 0, y: 0 },
    rotation: 0,
    size: 30,
    health: Number.POSITIVE_INFINITY,
    color: "#555555",
    type: "wall",
  })

  walls.push({
    id: "obstacle-3",
    position: { x: (width / 4) * 3, y: (height / 4) * 3 },
    velocity: { x: 0, y: 0 },
    rotation: 0,
    size: 30,
    health: Number.POSITIVE_INFINITY,
    color: "#555555",
    type: "wall",
  })

  return walls
}

// Calculate damage based on draw time
const calculateArrowDamage = (drawTime: number, maxDrawTime: number): number => {
  // Minimum damage is 5, max is 25 based on draw time
  const minDamage = 5
  const maxDamage = 25
  const drawPercentage = Math.min(drawTime / maxDrawTime, 1)
  return minDamage + drawPercentage * (maxDamage - minDamage)
}

// Calculate arrow speed based on draw time
const calculateArrowSpeed = (drawTime: number, maxDrawTime: number): number => {
  // Minimum speed is 300, max is 600 based on draw time
  const minSpeed = 300
  const maxSpeed = 600
  const drawPercentage = Math.min(drawTime / maxDrawTime, 1)
  return minSpeed + drawPercentage * (maxSpeed - minSpeed)
}

// Update the updateGameState function to check for time limit and update animation states
export const updateGameState = (state: GameState, deltaTime: number): GameState => {
  const newState = { ...state }
  newState.gameTime += deltaTime

  // Check if time limit is reached
  if (newState.gameTime >= newState.maxGameTime && !newState.isGameOver) {
    newState.isGameOver = true

    // Determine winner based on kills/score
    let highestScore = -1
    let winner: string | null = null

    Object.entries(newState.players).forEach(([playerId, player]) => {
      if (player.kills > highestScore) {
        highestScore = player.kills
        winner = playerId
      } else if (player.kills === highestScore) {
        // In case of a tie, check score
        if (player.score > (newState.players[winner as string]?.score || 0)) {
          winner = playerId
        }
      }
    })

    newState.winner = winner
    return newState
  }

  // Update players
  Object.keys(newState.players).forEach((playerId) => {
    const player = newState.players[playerId]

    // Handle cooldowns
    if (player.cooldown > 0) {
      player.cooldown -= deltaTime
    }

    if (player.dashCooldown > 0) {
      player.dashCooldown -= deltaTime
    }

    if (player.specialAttackCooldown > 0) {
      player.specialAttackCooldown -= deltaTime
      if (player.specialAttackCooldown <= 0) {
        player.specialAttackReady = true
      }
    }

    // Update animation state based on player actions
    const now = Date.now()
    const timeSinceLastAnimChange = now - player.lastAnimationChange

    // Priority order: death > hit > fire > run > idle
    if (player.health <= 0 && player.animationState !== "death") {
      player.animationState = "death"
      player.lastAnimationChange = now
    } else if (player.isDrawingBow || player.controls.shoot) {
      if (player.animationState !== "fire") {
        player.animationState = "fire"
        player.lastAnimationChange = now
      }
    } else if ((player.velocity.x !== 0 || player.velocity.y !== 0) && player.animationState !== "run") {
      // Only change to run if we're not already in a higher priority animation
      if (player.animationState !== "hit" && player.animationState !== "death" && player.animationState !== "fire") {
        player.animationState = "run"
        player.lastAnimationChange = now
      }
    } else if (
      player.animationState !== "idle" &&
      player.animationState !== "death" &&
      player.animationState !== "hit" &&
      player.animationState !== "fire" &&
      player.velocity.x === 0 &&
      player.velocity.y === 0
    ) {
      // Only transition to idle if we're not in a higher priority animation
      // and we're not moving
      player.animationState = "idle"
      player.lastAnimationChange = now
    }

    // Auto-transition from hit back to idle/run after a short time
    if (player.animationState === "hit" && timeSinceLastAnimChange > 500 && player.health > 0) {
      if (player.velocity.x !== 0 || player.velocity.y !== 0) {
        player.animationState = "run"
      } else {
        player.animationState = "idle"
      }
      player.lastAnimationChange = now
    }

    // Handle dash
    if (player.isDashing) {
      if (player.dashDirection) {
        player.position.x += player.dashDirection.x * 10 * deltaTime
        player.position.y += player.dashDirection.y * 10 * deltaTime
      }

      // End dash after 0.2 seconds
      if (player.dashCooldown <= 1.8) {
        player.isDashing = false
        player.dashDirection = null
      }
    } else {
      // Normal movement
      const speed = 200 // pixels per second

      if (player.controls.up) player.velocity.y = -speed
      else if (player.controls.down) player.velocity.y = speed
      else player.velocity.y = 0

      if (player.controls.left) player.velocity.x = -speed
      else if (player.controls.right) player.velocity.x = speed
      else player.velocity.x = 0

      // Apply velocity
      player.position.x += player.velocity.x * deltaTime
      player.position.y += player.velocity.y * deltaTime
    }

    // Handle bow drawing
    if (player.controls.shoot) {
      if (!player.isDrawingBow) {
        player.isDrawingBow = true
        player.drawStartTime = Date.now() / 1000 // Convert to seconds

        // Set animation to fire when starting to draw bow
        player.animationState = "fire"
        player.lastAnimationChange = Date.now()
      }
    } else if (player.isDrawingBow && player.drawStartTime !== null) {
      // Release arrow
      const currentTime = Date.now() / 1000
      const drawTime = currentTime - player.drawStartTime

      // Calculate damage and speed based on draw time
      const damage = calculateArrowDamage(drawTime, player.maxDrawTime)
      const arrowSpeed = calculateArrowSpeed(drawTime, player.maxDrawTime)

      const arrowVelocity = {
        x: Math.cos(player.rotation) * arrowSpeed,
        y: Math.sin(player.rotation) * arrowSpeed,
      }

      const arrowPosition = {
        x: player.position.x + Math.cos(player.rotation) * (player.size + 5),
        y: player.position.y + Math.sin(player.rotation) * (player.size + 5),
      }

      newState.arrows.push(createArrow(arrowPosition, arrowVelocity, player.rotation, player.id, damage))

      // Reset bow state
      player.isDrawingBow = false
      player.drawStartTime = null
      player.cooldown = 0.2 // Small cooldown between shots
    }

    // Handle special attack charging
    if (player.controls.special) {
      if (!player.isChargingSpecial && player.specialAttackCooldown <= 0) {
        player.isChargingSpecial = true
        player.specialChargeStartTime = Date.now() / 1000

        // Set animation to fire when charging special
        player.animationState = "fire"
        player.lastAnimationChange = Date.now()
      }
    } else if (player.isChargingSpecial && player.specialChargeStartTime !== null) {
      // Release special attack (3 arrows in quick succession)
      const currentTime = Date.now() / 1000
      const chargeTime = currentTime - player.specialChargeStartTime

      // Only trigger if charged for at least 0.5 seconds
      if (chargeTime >= 0.5) {
        const arrowSpeed = 500 // Fixed speed for special attack
        const spreadAngle = 0.1 // Small spread between arrows

        // Fire 3 arrows with slight spread
        for (let i = -1; i <= 1; i++) {
          const angle = player.rotation + i * spreadAngle
          const arrowVelocity = {
            x: Math.cos(angle) * arrowSpeed,
            y: Math.sin(angle) * arrowSpeed,
          }

          const arrowPosition = {
            x: player.position.x + Math.cos(angle) * (player.size + 5),
            y: player.position.y + Math.sin(angle) * (player.size + 5),
          }

          newState.arrows.push(createArrow(arrowPosition, arrowVelocity, angle, player.id, 15))
        }

        // Set cooldown for special attack
        player.specialAttackCooldown = 5 // 5 seconds cooldown
        player.specialAttackReady = false
      }

      // Reset special attack state
      player.isChargingSpecial = false
      player.specialChargeStartTime = null
    }

    // Handle dash
    if (player.controls.dash && player.dashCooldown <= 0 && !player.isDashing) {
      player.isDashing = true
      player.dashCooldown = 2 // 2 second cooldown between dashes

      // Dash in the direction of movement or facing direction if not moving
      if (player.velocity.x !== 0 || player.velocity.y !== 0) {
        const magnitude = Math.sqrt(player.velocity.x ** 2 + player.velocity.y ** 2)
        player.dashDirection = {
          x: player.velocity.x / magnitude,
          y: player.velocity.y / magnitude,
        }
      } else {
        player.dashDirection = {
          x: Math.cos(player.rotation),
          y: Math.sin(player.rotation),
        }
      }
    }

    // Collision with walls
    newState.walls.forEach((wall) => {
      const dx = player.position.x - wall.position.x
      const dy = player.position.y - wall.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const minDistance = player.size + wall.size

      if (distance < minDistance) {
        // Push player away from wall
        const angle = Math.atan2(dy, dx)
        const pushDistance = minDistance - distance

        player.position.x += Math.cos(angle) * pushDistance
        player.position.y += Math.sin(angle) * pushDistance
      }
    })

    // Keep player within arena bounds
    const { width, height } = newState.arenaSize
    player.position.x = Math.max(player.size, Math.min(width - player.size, player.position.x))
    player.position.y = Math.max(player.size, Math.min(height - player.size, player.position.y))
  })

  // Update arrows
  newState.arrows = newState.arrows.filter((arrow) => {
    // Move arrow
    arrow.position.x += arrow.velocity.x * deltaTime
    arrow.position.y += arrow.velocity.y * deltaTime

    // Check if arrow is out of bounds
    const { width, height } = newState.arenaSize
    if (arrow.position.x < 0 || arrow.position.x > width || arrow.position.y < 0 || arrow.position.y > height) {
      return false
    }

    // Check collision with walls
    for (const wall of newState.walls) {
      const dx = arrow.position.x - wall.position.x
      const dy = arrow.position.y - wall.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < arrow.size + wall.size) {
        return false
      }
    }

    // Check collision with players
    for (const playerId in newState.players) {
      const player = newState.players[playerId]

      // Don't hit the player who fired the arrow
      if (arrow.ownerId === player.id) continue

      const dx = arrow.position.x - player.position.x
      const dy = arrow.position.y - player.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < arrow.size + player.size) {
        // Hit player
        const damage = arrow.damage || 10
        player.health -= damage

        // Set hit animation
        if (player.animationState !== "death") {
          player.animationState = "hit"
          player.lastAnimationChange = Date.now()

          // Reset to idle after hit animation (approximately 0.5 seconds)
          setTimeout(() => {
            if (
              newState.players[playerId] &&
              newState.players[playerId].animationState === "hit" &&
              newState.players[playerId].health > 0
            ) {
              newState.players[playerId].animationState = "idle"
              newState.players[playerId].lastAnimationChange = Date.now()
            }
          }, 500)
        }

        // Check if player is dead
        if (player.health <= 0) {
          player.deaths++
          player.animationState = "death"
          player.lastAnimationChange = Date.now()

          // Respawn player after death animation (approximately 1 second)
          setTimeout(() => {
            if (newState.players[playerId]) {
              newState.players[playerId].health = 100
              newState.players[playerId].animationState = "idle"
              newState.players[playerId].lastAnimationChange = Date.now()

              // Respawn at random position
              newState.players[playerId].position = {
                x: Math.random() * (newState.arenaSize.width - 100) + 50,
                y: Math.random() * (newState.arenaSize.height - 100) + 50,
              }
            }
          }, 1000)

          // Award kill to shooter
          if (arrow.ownerId && newState.players[arrow.ownerId]) {
            newState.players[arrow.ownerId].kills++
            newState.players[arrow.ownerId].score += 100
          }
        }

        return false
      }
    }

    return true
  })

  // Check for game over conditions
  const activePlayers = Object.values(newState.players).filter((p) => p.health > 0)
  if (activePlayers.length <= 1 && Object.keys(newState.players).length > 1) {
    newState.isGameOver = true
    if (activePlayers.length === 1) {
      newState.winner = activePlayers[0].id
    }
  }

  return newState
}

// Helper function to play hit sound
export const playHitSound = () => {
  // This would be implemented in the audio manager
  // For now, we'll just log it
  console.log("Hit sound played")
}

// Helper function to play dash sound
export const playDashSound = () => {
  // This would be implemented in the audio manager
  console.log("Dash sound played")
}
