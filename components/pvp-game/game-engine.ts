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
  type: "player" | "bullet" | "wall" | "pickup"
  ownerId?: string
}

export interface Player extends GameObject {
  name: string
  score: number
  kills: number
  deaths: number
  cooldown: number
  dashCooldown: number
  isDashing: boolean
  dashDirection: Vector2D | null
  controls: {
    up: boolean
    down: boolean
    left: boolean
    right: boolean
    shoot: boolean
    dash: boolean
  }
}

// Update the GameState interface to include maxGameTime
export interface GameState {
  players: Record<string, Player>
  bullets: GameObject[]
  walls: GameObject[]
  pickups: GameObject[]
  arenaSize: { width: number; height: number }
  gameTime: number
  maxGameTime: number
  isGameOver: boolean
  winner: string | null
}

// Update the createInitialGameState function to include maxGameTime
export const createInitialGameState = (): GameState => {
  return {
    players: {},
    bullets: [],
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
    size: 20,
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
    controls: {
      up: false,
      down: false,
      left: false,
      right: false,
      shoot: false,
      dash: false,
    },
  }
}

export const createBullet = (position: Vector2D, velocity: Vector2D, rotation: number, ownerId: string): GameObject => {
  return {
    id: `bullet-${Date.now()}-${Math.random()}`,
    position: { ...position },
    velocity: { ...velocity },
    rotation,
    size: 5,
    health: 1,
    color: "#FF4500",
    type: "bullet",
    ownerId,
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

// Update the updateGameState function to check for time limit
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

    // Handle shooting
    if (player.controls.shoot && player.cooldown <= 0) {
      const bulletSpeed = 400
      const bulletVelocity = {
        x: Math.cos(player.rotation) * bulletSpeed,
        y: Math.sin(player.rotation) * bulletSpeed,
      }

      const bulletPosition = {
        x: player.position.x + Math.cos(player.rotation) * (player.size + 5),
        y: player.position.y + Math.sin(player.rotation) * (player.size + 5),
      }

      newState.bullets.push(createBullet(bulletPosition, bulletVelocity, player.rotation, player.id))
      player.cooldown = 0.3 // 300ms cooldown between shots
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

  // Update bullets
  newState.bullets = newState.bullets.filter((bullet) => {
    // Move bullet
    bullet.position.x += bullet.velocity.x * deltaTime
    bullet.position.y += bullet.velocity.y * deltaTime

    // Check if bullet is out of bounds
    const { width, height } = newState.arenaSize
    if (bullet.position.x < 0 || bullet.position.x > width || bullet.position.y < 0 || bullet.position.y > height) {
      return false
    }

    // Check collision with walls
    for (const wall of newState.walls) {
      const dx = bullet.position.x - wall.position.x
      const dy = bullet.position.y - wall.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < bullet.size + wall.size) {
        return false
      }
    }

    // Check collision with players
    for (const playerId in newState.players) {
      const player = newState.players[playerId]

      // Don't hit the player who fired the bullet
      if (bullet.ownerId === player.id) continue

      const dx = bullet.position.x - player.position.x
      const dy = bullet.position.y - player.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < bullet.size + player.size) {
        // Hit player
        player.health -= 10

        // Check if player is dead
        if (player.health <= 0) {
          player.deaths++
          player.health = 100

          // Respawn player at random position
          player.position = {
            x: Math.random() * (newState.arenaSize.width - 100) + 50,
            y: Math.random() * (newState.arenaSize.height - 100) + 50,
          }

          // Award kill to shooter
          if (bullet.ownerId && newState.players[bullet.ownerId]) {
            newState.players[bullet.ownerId].kills++
            newState.players[bullet.ownerId].score += 100
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
