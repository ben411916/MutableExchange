import { type Unit, createUnitInstance } from "./units"
import type { Tile } from "./game-board"

export interface GameState {
  gridSize: number
  tiles: Tile[]
  units: Unit[]
  currentPlayer: string
  players: {
    player1: {
      id: string
      name: string
      units: Unit[]
    }
    player2: {
      id: string
      name: string
      units: Unit[]
    }
  }
  turnNumber: number
  phase: "draft" | "placement" | "game" | "end"
  winner: string | null
  selectedUnit: Unit | null
  selectedAction: "move" | "attack" | "ability" | null
  log: string[]
}

export const createInitialGameState = (
  gridSize = 8,
  player1Id: string,
  player1Name: string,
  player2Id: string,
  player2Name: string,
): GameState => {
  // Create tiles
  const tiles: Tile[] = []
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      tiles.push({
        x,
        y,
        type: "normal",
      })
    }
  }

  // Add some obstacles
  tiles.find((t) => t.x === 3 && t.y === 3)!.type = "obstacle"
  tiles.find((t) => t.x === 3 && t.y === 4)!.type = "obstacle"
  tiles.find((t) => t.x === 4 && t.y === 3)!.type = "obstacle"
  tiles.find((t) => t.x === 4 && t.y === 4)!.type = "obstacle"

  // Add objectives
  tiles.find((t) => t.x === 0 && t.y === 0)!.type = "objective"
  tiles.find((t) => t.x === gridSize - 1 && t.y === gridSize - 1)!.type = "objective"

  return {
    gridSize,
    tiles,
    units: [],
    currentPlayer: player1Id,
    players: {
      player1: {
        id: player1Id,
        name: player1Name,
        units: [],
      },
      player2: {
        id: player2Id,
        name: player2Name,
        units: [],
      },
    },
    turnNumber: 1,
    phase: "draft",
    winner: null,
    selectedUnit: null,
    selectedAction: null,
    log: ["Game started"],
  }
}

export const addUnitToGame = (
  state: GameState,
  unitId: string,
  playerId: string,
  position: { x: number; y: number },
): GameState => {
  const newUnit = createUnitInstance(unitId, playerId, position)

  return {
    ...state,
    units: [...state.units, newUnit],
    players: {
      ...state.players,
      [playerId === state.players.player1.id ? "player1" : "player2"]: {
        ...state.players[playerId === state.players.player1.id ? "player1" : "player2"],
        units: [...state.players[playerId === state.players.player1.id ? "player1" : "player2"].units, newUnit],
      },
    },
    log: [...state.log, `${playerId} added ${newUnit.name} at (${position.x}, ${position.y})`],
  }
}

export const isValidMove = (state: GameState, unit: Unit, targetX: number, targetY: number): boolean => {
  if (!unit.position) return false

  // Check if target is within move range
  const distance = Math.abs(unit.position.x - targetX) + Math.abs(unit.position.y - targetY)
  if (distance > unit.move) return false

  // Check if target is occupied by another unit
  const unitAtTarget = state.units.find((u) => u.position?.x === targetX && u.position?.y === targetY)
  if (unitAtTarget) return false

  // Check if target is an obstacle
  const targetTile = state.tiles.find((t) => t.x === targetX && t.y === targetY)
  if (!targetTile || targetTile.type === "obstacle") return false

  return true
}

export const getPossibleMoves = (state: GameState, unit: Unit): { x: number; y: number }[] => {
  if (!unit.position) return []

  const possibleMoves: { x: number; y: number }[] = []

  // Check all tiles within move range
  for (
    let x = Math.max(0, unit.position.x - unit.move);
    x <= Math.min(state.gridSize - 1, unit.position.x + unit.move);
    x++
  ) {
    for (
      let y = Math.max(0, unit.position.y - unit.move);
      y <= Math.min(state.gridSize - 1, unit.position.y + unit.move);
      y++
    ) {
      if (isValidMove(state, unit, x, y)) {
        possibleMoves.push({ x, y })
      }
    }
  }

  return possibleMoves
}

export const moveUnit = (state: GameState, unit: Unit, targetX: number, targetY: number): GameState => {
  if (!isValidMove(state, unit, targetX, targetY)) return state

  // Find the unit in the state
  const updatedUnits = state.units.map((u) => {
    if (u.id === unit.id && u.owner === unit.owner) {
      return {
        ...u,
        position: { x: targetX, y: targetY },
        hasMoved: true,
        actionPoints: u.actionPoints - 1,
      }
    }
    return u
  })

  return {
    ...state,
    units: updatedUnits,
    log: [...state.log, `${unit.owner} moved ${unit.name} to (${targetX}, ${targetY})`],
  }
}

export const isValidAttack = (state: GameState, unit: Unit, targetX: number, targetY: number): boolean => {
  if (!unit.position) return false

  // Check if target is within attack range
  const distance = Math.abs(unit.position.x - targetX) + Math.abs(unit.position.y - targetY)
  if (distance > unit.range) return false

  // Check if target has an enemy unit
  const targetUnit = state.units.find((u) => u.position?.x === targetX && u.position?.y === targetY)
  if (!targetUnit || targetUnit.owner === unit.owner) return false

  return true
}

export const getPossibleAttacks = (state: GameState, unit: Unit): { x: number; y: number }[] => {
  if (!unit.position) return []

  const possibleAttacks: { x: number; y: number }[] = []

  // Check all tiles within attack range
  for (
    let x = Math.max(0, unit.position.x - unit.range);
    x <= Math.min(state.gridSize - 1, unit.position.x + unit.range);
    x++
  ) {
    for (
      let y = Math.max(0, unit.position.y - unit.range);
      y <= Math.min(state.gridSize - 1, unit.position.y + unit.range);
      y++
    ) {
      if (isValidAttack(state, unit, x, y)) {
        possibleAttacks.push({ x, y })
      }
    }
  }

  return possibleAttacks
}

export const attackUnit = (state: GameState, attacker: Unit, targetX: number, targetY: number): GameState => {
  if (!isValidAttack(state, attacker, targetX, targetY)) return state

  // Find the target unit
  const targetUnit = state.units.find((u) => u.position?.x === targetX && u.position?.y === targetY)
  if (!targetUnit) return state

  // Calculate damage (could be modified by abilities, terrain, etc.)
  const damage = attacker.attack

  // Apply damage
  const updatedUnits = state.units.map((u) => {
    if (u.id === targetUnit.id && u.owner === targetUnit.owner) {
      const newHp = Math.max(0, u.hp - damage)
      return {
        ...u,
        hp: newHp,
      }
    }
    if (u.id === attacker.id && u.owner === attacker.owner) {
      return {
        ...u,
        hasAttacked: true,
        actionPoints: u.actionPoints - 1,
      }
    }
    return u
  })

  // Check if target was defeated
  const wasDefeated = updatedUnits.find((u) => u.id === targetUnit.id && u.owner === targetUnit.owner)?.hp === 0

  // Remove defeated units
  const finalUnits = wasDefeated
    ? updatedUnits.filter((u) => !(u.id === targetUnit.id && u.owner === targetUnit.owner && u.hp === 0))
    : updatedUnits

  return {
    ...state,
    units: finalUnits,
    log: [
      ...state.log,
      `${attacker.owner}'s ${attacker.name} attacked ${targetUnit.owner}'s ${targetUnit.name} for ${damage} damage`,
      ...(wasDefeated ? [`${targetUnit.owner}'s ${targetUnit.name} was defeated`] : []),
    ],
  }
}

export const isValidAbilityTarget = (state: GameState, unit: Unit, targetX: number, targetY: number): boolean => {
  if (!unit.position || !unit.ability) return false
  if (unit.ability.currentCooldown && unit.ability.currentCooldown > 0) return false

  // Check if target is within ability range
  const distance = Math.abs(unit.position.x - targetX) + Math.abs(unit.position.y - targetY)
  if (distance > unit.ability.range) return false

  // Check target type
  const targetUnit = state.units.find((u) => u.position?.x === targetX && u.position?.y === targetY)

  switch (unit.ability.targetType) {
    case "self":
      return targetX === unit.position.x && targetY === unit.position.y
    case "ally":
      return !!targetUnit && targetUnit.owner === unit.owner
    case "enemy":
      return !!targetUnit && targetUnit.owner !== unit.owner
    case "tile":
      return true // Any tile within range is valid
    case "area":
      return true // Any tile within range is valid for area effects
    default:
      return false
  }
}

export const getPossibleAbilityTargets = (state: GameState, unit: Unit): { x: number; y: number }[] => {
  if (!unit.position || !unit.ability) return []
  if (unit.ability.currentCooldown && unit.ability.currentCooldown > 0) return []

  const possibleTargets: { x: number; y: number }[] = []

  // Check all tiles within ability range
  for (
    let x = Math.max(0, unit.position.x - unit.ability.range);
    x <= Math.min(state.gridSize - 1, unit.position.x + unit.ability.range);
    x++
  ) {
    for (
      let y = Math.max(0, unit.position.y - unit.ability.range);
      y <= Math.min(state.gridSize - 1, unit.position.y + unit.ability.range);
      y++
    ) {
      if (isValidAbilityTarget(state, unit, x, y)) {
        possibleTargets.push({ x, y })
      }
    }
  }

  return possibleTargets
}

export const useAbility = (state: GameState, unit: Unit, targetX: number, targetY: number): GameState => {
  if (!isValidAbilityTarget(state, unit, targetX, targetY) || !unit.ability) return state

  const updatedState = { ...state }
  const abilityEffect = unit.ability.effect

  // Apply ability effect based on type
  switch (abilityEffect) {
    case "heal":
      // Heal target unit
      const targetUnit = state.units.find((u) => u.position?.x === targetX && u.position?.y === targetY)
      if (targetUnit) {
        updatedState.units = state.units.map((u) => {
          if (u.id === targetUnit.id && u.owner === targetUnit.owner) {
            const newHp = Math.min(u.maxHp, u.hp + 3) // Heal for 3 HP
            return { ...u, hp: newHp }
          }
          return u
        })
        updatedState.log = [
          ...updatedState.log,
          `${unit.owner}'s ${unit.name} healed ${targetUnit.owner}'s ${targetUnit.name} for 3 HP`,
        ]
      }
      break

    case "barrier":
      // Place a barrier on the target tile
      updatedState.tiles = state.tiles.map((t) => {
        if (t.x === targetX && t.y === targetY) {
          return { ...t, effect: "barrier", effectDuration: 1 }
        }
        return t
      })
      updatedState.log = [
        ...updatedState.log,
        `${unit.owner}'s ${unit.name} placed a barrier at (${targetX}, ${targetY})`,
      ]
      break

    case "turret":
      // Place a turret on the target tile
      updatedState.tiles = state.tiles.map((t) => {
        if (t.x === targetX && t.y === targetY) {
          return { ...t, effect: "turret", effectDuration: 2 }
        }
        return t
      })
      updatedState.log = [
        ...updatedState.log,
        `${unit.owner}'s ${unit.name} deployed a turret at (${targetX}, ${targetY})`,
      ]
      break

    case "grenade":
      // Deal damage in a 3x3 area
      for (let x = targetX - 1; x <= targetX + 1; x++) {
        for (let y = targetY - 1; y <= targetY + 1; y++) {
          if (x >= 0 && x < state.gridSize && y >= 0 && y < state.gridSize) {
            const unitAtPosition = state.units.find((u) => u.position?.x === x && u.position?.y === y)
            if (unitAtPosition) {
              // Deal 2 damage to all units in area (including allies)
              updatedState.units = updatedState.units.map((u) => {
                if (u.id === unitAtPosition.id && u.owner === unitAtPosition.owner) {
                  const newHp = Math.max(0, u.hp - 2)
                  if (newHp === 0) {
                    updatedState.log = [
                      ...updatedState.log,
                      `${unitAtPosition.owner}'s ${unitAtPosition.name} was defeated by the grenade`,
                    ]
                  }
                  return { ...u, hp: newHp }
                }
                return u
              })
            }
          }
        }
      }
      // Remove defeated units
      updatedState.units = updatedState.units.filter((u) => u.hp > 0)
      updatedState.log = [
        ...updatedState.log,
        `${unit.owner}'s ${unit.name} threw a grenade at (${targetX}, ${targetY})`,
      ]
      break

    // Add more ability effects as needed

    default:
      // Unknown ability effect
      return state
  }

  // Update the unit that used the ability
  updatedState.units = updatedState.units.map((u) => {
    if (u.id === unit.id && u.owner === unit.owner) {
      return {
        ...u,
        hasUsedAbility: true,
        actionPoints: u.actionPoints - 1,
        ability: {
          ...u.ability,
          currentCooldown: u.ability.cooldown,
        },
      }
    }
    return u
  })

  return updatedState
}

export const endTurn = (state: GameState): GameState => {
  // Switch current player
  const nextPlayer =
    state.currentPlayer === state.players.player1.id ? state.players.player2.id : state.players.player1.id

  // Process end-of-turn effects
  const updatedState = { ...state }

  // Reduce ability cooldowns
  updatedState.units = updatedState.units.map((unit) => {
    if (unit.owner === state.currentPlayer) {
      return {
        ...unit,
        hasMoved: false,
        hasAttacked: false,
        hasUsedAbility: false,
        actionPoints: unit.maxActionPoints,
        ability: {
          ...unit.ability,
          currentCooldown: unit.ability.currentCooldown ? Math.max(0, unit.ability.currentCooldown - 1) : 0,
        },
      }
    }
    return unit
  })

  // Process tile effects
  updatedState.tiles = updatedState.tiles.map((tile) => {
    if (tile.effect && tile.effectDuration) {
      const newDuration = tile.effectDuration - 1
      if (newDuration <= 0) {
        return { ...tile, effect: undefined, effectDuration: undefined }
      } else {
        return { ...tile, effectDuration: newDuration }
      }
    }
    return tile
  })

  // Process turret attacks
  updatedState.tiles.forEach((tile) => {
    if (tile.effect === "turret") {
      // Find enemy units in range (adjacent tiles)
      for (let x = tile.x - 1; x <= tile.x + 1; x++) {
        for (let y = tile.y - 1; y <= tile.y + 1; y++) {
          if (x >= 0 && x < state.gridSize && y >= 0 && y < state.gridSize) {
            const unitAtPosition = updatedState.units.find(
              (u) => u.position?.x === x && u.position?.y === y && u.owner !== state.currentPlayer,
            )
            if (unitAtPosition) {
              // Deal 1 damage to enemy unit
              updatedState.units = updatedState.units.map((u) => {
                if (u.id === unitAtPosition.id && u.owner === unitAtPosition.owner) {
                  const newHp = Math.max(0, u.hp - 1)
                  if (newHp === 0) {
                    updatedState.log = [
                      ...updatedState.log,
                      `${unitAtPosition.owner}'s ${unitAtPosition.name} was defeated by a turret`,
                    ]
                  }
                  return { ...u, hp: newHp }
                }
                return u
              })
            }
          }
        }
      }
    }
  })

  // Remove defeated units
  updatedState.units = updatedState.units.filter((u) => u.hp > 0)

  // Check win conditions
  const player1Units = updatedState.units.filter((u) => u.owner === state.players.player1.id)
  const player2Units = updatedState.units.filter((u) => u.owner === state.players.player2.id)

  if (player1Units.length === 0 && player2Units.length > 0) {
    updatedState.winner = state.players.player2.id
    updatedState.phase = "end"
    updatedState.log = [...updatedState.log, `${state.players.player2.name} wins!`]
  } else if (player2Units.length === 0 && player1Units.length > 0) {
    updatedState.winner = state.players.player1.id
    updatedState.phase = "end"
    updatedState.log = [...updatedState.log, `${state.players.player1.name} wins!`]
  }

  return {
    ...updatedState,
    currentPlayer: nextPlayer,
    turnNumber: nextPlayer === state.players.player1.id ? state.turnNumber + 1 : state.turnNumber,
    selectedUnit: null,
    selectedAction: null,
    log: [
      ...updatedState.log,
      `Turn ${state.turnNumber} ended. ${nextPlayer === state.players.player1.id ? state.players.player1.name : state.players.player2.name}'s turn`,
    ],
  }
}
