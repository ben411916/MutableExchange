"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import GameBoardWrapper from "./game-board-wrapper"
import { type Unit, UNITS } from "./units"
import {
  type GameState,
  createInitialGameState,
  addUnitToGame,
  moveUnit,
  attackUnit,
  useAbility as useAbilityFn,
  endTurn,
  getPossibleMoves,
  getPossibleAttacks,
  getPossibleAbilityTargets,
} from "./game-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import UnitCard from "./unit-card"
import GameLog from "./game-log"
import { SimpleErrorBoundary } from "../simple-error-boundary"

interface GameControllerProps {
  playerId: string
  playerName: string
  opponentId: string
  opponentName: string
  wagerAmount: number
  onGameEnd?: (winner: string) => void
}

export default function GameController({
  playerId,
  playerName,
  opponentId,
  opponentName,
  wagerAmount,
  onGameEnd,
}: GameControllerProps) {
  // Create initial game state
  const initialGameStateRef = useRef<GameState | null>(null)
  if (!initialGameStateRef.current) {
    try {
      initialGameStateRef.current = createInitialGameState(8, playerId, playerName, opponentId, opponentName)
      console.log("Initial game state created")
    } catch (error) {
      console.error("Error creating initial game state:", error)
      initialGameStateRef.current = {
        gridSize: 8,
        tiles: [],
        units: [],
        currentPlayer: playerId,
        players: {
          player1: {
            id: playerId,
            name: playerName,
            units: [],
          },
          player2: {
            id: opponentId,
            name: opponentName,
            units: [],
          },
        },
        turnNumber: 1,
        phase: "draft",
        winner: null,
        selectedUnit: null,
        selectedAction: null,
        log: ["Game started with errors"],
      }
    }
  }

  const [gameState, setGameState] = useState<GameState>(initialGameStateRef.current)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [selectedAction, setSelectedAction] = useState<"move" | "attack" | "ability" | null>(null)
  const [possibleMoves, setPossibleMoves] = useState<{ x: number; y: number }[]>([])
  const [possibleAttacks, setPossibleAttacks] = useState<{ x: number; y: number }[]>([])
  const [possibleAbilityTargets, setPossibleAbilityTargets] = useState<{ x: number; y: number }[]>([])
  const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>(null)
  const [draftPool] = useState<Unit[]>(UNITS.slice(0, 6)) // First 6 units for draft

  const isCurrentPlayerTurn = gameState.currentPlayer === playerId

  // Initialize the game with some units for testing
  useEffect(() => {
    if (gameState.phase === "draft") {
      console.log("Setting up initial game units")

      try {
        // Skip draft phase for now and place units directly
        let updatedState = { ...gameState, phase: "game" }

        // Add units for player 1 (bottom of the board)
        updatedState = addUnitToGame(updatedState, "bulwark", playerId, { x: 1, y: 6 })
        updatedState = addUnitToGame(updatedState, "archer", playerId, { x: 3, y: 6 })
        updatedState = addUnitToGame(updatedState, "healer", playerId, { x: 5, y: 6 })

        // Add units for player 2 (top of the board)
        updatedState = addUnitToGame(updatedState, "berserker", opponentId, { x: 2, y: 1 })
        updatedState = addUnitToGame(updatedState, "sniper", opponentId, { x: 4, y: 1 })
        updatedState = addUnitToGame(updatedState, "grenadier", opponentId, { x: 6, y: 1 })

        console.log("Initial units added successfully")
        setGameState(updatedState)
      } catch (error) {
        console.error("Error setting up initial game units:", error)
      }
    }
  }, [gameState, playerId, opponentId])

  // Check for game end
  useEffect(() => {
    if (gameState.phase === "end" && gameState.winner && onGameEnd) {
      console.log("Game ended", { winner: gameState.winner, phase: gameState.phase })
      onGameEnd(gameState.winner)
    }
  }, [gameState.phase, gameState.winner, onGameEnd])

  const handleUnitClick = useCallback(
    (unit: Unit) => {
      console.log("Unit clicked", {
        unitId: unit.id,
        unitOwner: unit.owner,
        currentPlayer: gameState.currentPlayer,
      })

      // Can only select your own units on your turn
      if (unit.owner !== gameState.currentPlayer || !isCurrentPlayerTurn) {
        console.log("Unit selection rejected - not current player's unit or not their turn")
        return
      }

      setSelectedUnit(unit)
      setSelectedAction(null)
      setSelectedTile(unit.position || null)
      setPossibleMoves([])
      setPossibleAttacks([])
      setPossibleAbilityTargets([])

      console.log("Unit selected", { unitId: unit.id, unitType: unit.type })
    },
    [gameState.currentPlayer, isCurrentPlayerTurn],
  )

  const handleTileClick = useCallback(
    (x: number, y: number) => {
      console.log("Tile clicked", { x, y, selectedAction, selectedUnit: selectedUnit?.id })

      setSelectedTile({ x, y })

      // If no unit is selected or it's not the player's turn, just select the tile
      if (!selectedUnit || !isCurrentPlayerTurn) {
        return
      }

      // If an action is selected, try to perform it
      if (selectedAction === "move") {
        if (possibleMoves.some((move) => move.x === x && move.y === y)) {
          try {
            const newState = moveUnit(gameState, selectedUnit, x, y)
            setGameState(newState)

            // Update selected unit with the moved unit
            const movedUnit = newState.units.find((u) => u.id === selectedUnit.id && u.owner === selectedUnit.owner)
            setSelectedUnit(movedUnit || null)

            // Clear possible moves
            setPossibleMoves([])
            setSelectedAction(null)
          } catch (error) {
            console.error("Error moving unit:", error)
          }
        }
      } else if (selectedAction === "attack") {
        if (possibleAttacks.some((attack) => attack.x === x && attack.y === y)) {
          try {
            const newState = attackUnit(gameState, selectedUnit, x, y)
            setGameState(newState)

            // Update selected unit
            const updatedUnit = newState.units.find((u) => u.id === selectedUnit.id && u.owner === selectedUnit.owner)
            setSelectedUnit(updatedUnit || null)

            // Clear possible attacks
            setPossibleAttacks([])
            setSelectedAction(null)
          } catch (error) {
            console.error("Error executing attack:", error)
          }
        }
      } else if (selectedAction === "ability") {
        if (possibleAbilityTargets.some((target) => target.x === x && target.y === y)) {
          try {
            const newState = useAbilityFn(gameState, selectedUnit, x, y)
            setGameState(newState)

            // Update selected unit
            const updatedUnit = newState.units.find((u) => u.id === selectedUnit.id && u.owner === selectedUnit.owner)
            setSelectedUnit(updatedUnit || null)

            // Clear possible ability targets
            setPossibleAbilityTargets([])
            setSelectedAction(null)
          } catch (error) {
            console.error("Error using ability:", error)
          }
        }
      }
    },
    [
      gameState,
      isCurrentPlayerTurn,
      possibleAbilityTargets,
      possibleAttacks,
      possibleMoves,
      selectedAction,
      selectedUnit,
    ],
  )

  const handleActionClick = useCallback(
    (action: "move" | "attack" | "ability") => {
      if (!selectedUnit || !isCurrentPlayerTurn) return

      console.log("Action button clicked", { action, unitId: selectedUnit.id })

      // Toggle action if already selected
      if (selectedAction === action) {
        setSelectedAction(null)
        setPossibleMoves([])
        setPossibleAttacks([])
        setPossibleAbilityTargets([])
        return
      }

      setSelectedAction(action)

      // Calculate possible actions
      if (action === "move") {
        if (selectedUnit.hasMoved || selectedUnit.actionPoints < 1) {
          setPossibleMoves([])
        } else {
          try {
            const moves = getPossibleMoves(gameState, selectedUnit)
            setPossibleMoves(moves)
          } catch (error) {
            console.error("Error calculating possible moves:", error)
            setPossibleMoves([])
          }
        }
        setPossibleAttacks([])
        setPossibleAbilityTargets([])
      } else if (action === "attack") {
        if (selectedUnit.hasAttacked || selectedUnit.actionPoints < 1) {
          setPossibleAttacks([])
        } else {
          try {
            const attacks = getPossibleAttacks(gameState, selectedUnit)
            setPossibleAttacks(attacks)
          } catch (error) {
            console.error("Error calculating possible attacks:", error)
            setPossibleAttacks([])
          }
        }
        setPossibleMoves([])
        setPossibleAbilityTargets([])
      } else if (action === "ability") {
        if (
          selectedUnit.hasUsedAbility ||
          selectedUnit.actionPoints < 1 ||
          (selectedUnit.ability.currentCooldown && selectedUnit.ability.currentCooldown > 0)
        ) {
          setPossibleAbilityTargets([])
        } else {
          try {
            const targets = getPossibleAbilityTargets(gameState, selectedUnit)
            setPossibleAbilityTargets(targets)
          } catch (error) {
            console.error("Error calculating possible ability targets:", error)
            setPossibleAbilityTargets([])
          }
        }
        setPossibleMoves([])
        setPossibleAttacks([])
      }
    },
    [gameState, isCurrentPlayerTurn, selectedAction, selectedUnit],
  )

  const handleEndTurn = useCallback(() => {
    if (!isCurrentPlayerTurn) return

    console.log("Ending turn", {
      currentPlayer: gameState.currentPlayer,
      turnNumber: gameState.turnNumber,
    })

    try {
      const newState = endTurn(gameState)
      setGameState(newState)
      setSelectedUnit(null)
      setSelectedAction(null)
      setPossibleMoves([])
      setPossibleAttacks([])
      setPossibleAbilityTargets([])
    } catch (error) {
      console.error("Error ending turn:", error)
    }
  }, [gameState, isCurrentPlayerTurn])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`${
              gameState.currentPlayer === playerId
                ? "bg-green-100 text-green-800 border-green-300"
                : "bg-gray-100 text-gray-800 border-gray-300"
            }`}
          >
            {gameState.currentPlayer === playerId ? "Your Turn" : "Opponent's Turn"}
          </Badge>
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
            Turn {gameState.turnNumber}
          </Badge>
          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
            Wager: {wagerAmount} MUTB
          </Badge>
        </div>

        {isCurrentPlayerTurn && (
          <Button variant="default" className="bg-amber-500 hover:bg-amber-600 text-white" onClick={handleEndTurn}>
            End Turn
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Card className="border-2 border-black">
            <CardContent className="p-4">
              <SimpleErrorBoundary>
                <GameBoardWrapper
                  size={{ width: 600, height: 600 }}
                  gridSize={gameState.gridSize}
                  tiles={gameState.tiles}
                  units={gameState.units}
                  selectedUnit={selectedUnit}
                  selectedTile={selectedTile}
                  possibleMoves={possibleMoves}
                  possibleAttacks={possibleAttacks}
                  possibleAbilityTargets={possibleAbilityTargets}
                  currentPlayer={gameState.currentPlayer}
                  onTileClick={handleTileClick}
                  onUnitClick={handleUnitClick}
                />
              </SimpleErrorBoundary>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          {/* Unit info and actions */}
          <Card className="border-2 border-black">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Unit Info</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {selectedUnit ? (
                <div className="space-y-4">
                  <SimpleErrorBoundary>
                    <UnitCard unit={selectedUnit} />
                  </SimpleErrorBoundary>

                  {isCurrentPlayerTurn && selectedUnit.owner === playerId && (
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={selectedAction === "move" ? "default" : "outline"}
                        className={`${
                          selectedUnit.hasMoved || selectedUnit.actionPoints < 1 ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        onClick={() => handleActionClick("move")}
                        disabled={selectedUnit.hasMoved || selectedUnit.actionPoints < 1}
                      >
                        Move
                      </Button>
                      <Button
                        variant={selectedAction === "attack" ? "default" : "outline"}
                        className={`${
                          selectedUnit.hasAttacked || selectedUnit.actionPoints < 1
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        onClick={() => handleActionClick("attack")}
                        disabled={selectedUnit.hasAttacked || selectedUnit.actionPoints < 1}
                      >
                        Attack
                      </Button>
                      <Button
                        variant={selectedAction === "ability" ? "default" : "outline"}
                        className={`${
                          selectedUnit.hasUsedAbility ||
                          selectedUnit.actionPoints < 1 ||
                          (selectedUnit.ability.currentCooldown && selectedUnit.ability.currentCooldown > 0)
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        onClick={() => handleActionClick("ability")}
                        disabled={
                          selectedUnit.hasUsedAbility ||
                          selectedUnit.actionPoints < 1 ||
                          (selectedUnit.ability.currentCooldown && selectedUnit.ability.currentCooldown > 0)
                        }
                      >
                        Ability
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">Select a unit to view details</div>
              )}
            </CardContent>
          </Card>

          {/* Game log */}
          <Card className="border-2 border-black flex-grow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Game Log</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <SimpleErrorBoundary>
                <GameLog log={gameState.log} />
              </SimpleErrorBoundary>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
