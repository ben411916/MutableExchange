"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Stage, Layer, Rect, Text, Circle, Group } from "react-konva"
import type { Unit } from "./units"
import UnitRenderer from "./unit-renderer"
import type { KonvaEventObject } from "konva/lib/Node"

export interface Tile {
  x: number
  y: number
  type: "normal" | "obstacle" | "objective"
  effect?: string
  effectDuration?: number
}

export interface GameBoardProps {
  size: { width: number; height: number }
  gridSize: number
  tiles: Tile[]
  units: Unit[]
  selectedUnit: Unit | null
  selectedTile: { x: number; y: number } | null
  possibleMoves: { x: number; y: number }[]
  possibleAttacks: { x: number; y: number }[]
  possibleAbilityTargets: { x: number; y: number }[]
  currentPlayer: string
  onTileClick: (x: number, y: number) => void
  onUnitClick: (unit: Unit) => void
}

const GameBoard: React.FC<GameBoardProps> = ({
  size,
  gridSize,
  tiles,
  units,
  selectedUnit,
  selectedTile,
  possibleMoves: propsPossibleMoves,
  possibleAttacks: propsPossibleAttacks,
  possibleAbilityTargets: propsPossibleAbilityTargets,
  currentPlayer,
  onTileClick,
  onUnitClick,
}) => {
  const stageRef = useRef<any>(null)
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null)
  const tileSize = Math.min(size.width / gridSize, size.height / gridSize)

  // Add default values for arrays
  const possibleMoves = propsPossibleMoves || []
  const possibleAttacks = propsPossibleAttacks || []
  const possibleAbilityTargets = propsPossibleAbilityTargets || []

  const handleTileClick = (x: number, y: number) => {
    onTileClick(x, y)
  }

  const handleUnitClick = (unit: Unit) => {
    onUnitClick(unit)
  }

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!stageRef.current) return

    const stage = stageRef.current
    const pointerPosition = stage.getPointerPosition()
    if (!pointerPosition) return

    const x = Math.floor(pointerPosition.x / tileSize)
    const y = Math.floor(pointerPosition.y / tileSize)

    if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
      setHoveredTile({ x, y })
    } else {
      setHoveredTile(null)
    }
  }

  const handleMouseLeave = () => {
    setHoveredTile(null)
  }

  const isTileInArray = (tile: { x: number; y: number }, array: { x: number; y: number }[] = []) => {
    return array.some((t) => t.x === tile.x && t.y === tile.y)
  }

  const getTileColor = (tile: Tile) => {
    if (selectedTile && selectedTile.x === tile.x && selectedTile.y === tile.y) {
      return "rgba(255, 255, 0, 0.5)"
    }

    if (hoveredTile && hoveredTile.x === tile.x && hoveredTile.y === tile.y) {
      return "rgba(200, 200, 200, 0.3)"
    }

    if (possibleMoves && isTileInArray(tile, possibleMoves)) {
      return "rgba(0, 255, 0, 0.3)"
    }

    if (possibleAttacks && isTileInArray(tile, possibleAttacks)) {
      return "rgba(255, 0, 0, 0.3)"
    }

    if (possibleAbilityTargets && isTileInArray(tile, possibleAbilityTargets)) {
      return "rgba(0, 0, 255, 0.3)"
    }

    switch (tile.type) {
      case "obstacle":
        return "#666"
      case "objective":
        return "rgba(255, 215, 0, 0.3)"
      default:
        return (tile.x + tile.y) % 2 === 0 ? "#e8e8e8" : "#d0d0d0"
    }
  }

  const getUnitAtPosition = (x: number, y: number) => {
    return units.find((unit) => unit.position?.x === x && unit.position?.y === y)
  }

  return (
    <Stage
      ref={stageRef}
      width={size.width}
      height={size.height}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Layer>
        {/* Grid */}
        {tiles.map((tile) => (
          <Rect
            key={`tile-${tile.x}-${tile.y}`}
            x={tile.x * tileSize}
            y={tile.y * tileSize}
            width={tileSize}
            height={tileSize}
            fill={getTileColor(tile)}
            stroke="#888"
            strokeWidth={0.5}
            onClick={() => handleTileClick(tile.x, tile.y)}
          />
        ))}

        {/* Effects */}
        {tiles
          .filter((tile) => tile.effect)
          .map((tile) => (
            <Group key={`effect-${tile.x}-${tile.y}`}>
              <Circle
                x={(tile.x + 0.5) * tileSize}
                y={(tile.y + 0.5) * tileSize}
                radius={tileSize * 0.3}
                fill={
                  tile.effect === "barrier"
                    ? "rgba(0, 100, 255, 0.3)"
                    : tile.effect === "turret"
                      ? "rgba(255, 100, 0, 0.3)"
                      : "rgba(100, 100, 100, 0.3)"
                }
                stroke={tile.effect === "barrier" ? "blue" : tile.effect === "turret" ? "orange" : "gray"}
                strokeWidth={1}
              />
              <Text
                x={tile.x * tileSize}
                y={tile.y * tileSize + tileSize * 0.7}
                width={tileSize}
                text={tile.effect || ""}
                fontSize={tileSize * 0.2}
                fill="black"
                align="center"
              />
            </Group>
          ))}

        {/* Units */}
        {units.map((unit) => (
          <UnitRenderer
            key={`unit-${unit.id}-${unit.owner}`}
            unit={unit}
            tileSize={tileSize}
            isSelected={selectedUnit?.id === unit.id && selectedUnit?.owner === unit.owner}
            isCurrentPlayer={unit.owner === currentPlayer}
            onClick={() => handleUnitClick(unit)}
          />
        ))}

        {/* Grid coordinates (for debugging) */}
        {tiles.map((tile) => (
          <Text
            key={`coord-${tile.x}-${tile.y}`}
            x={tile.x * tileSize + 2}
            y={tile.y * tileSize + 2}
            text={`${tile.x},${tile.y}`}
            fontSize={tileSize * 0.15}
            fill="rgba(0, 0, 0, 0.3)"
          />
        ))}

        {/* Hover indicator */}
        {hoveredTile && (
          <Rect
            x={hoveredTile.x * tileSize}
            y={hoveredTile.y * tileSize}
            width={tileSize}
            height={tileSize}
            stroke="white"
            strokeWidth={2}
          />
        )}
      </Layer>
    </Stage>
  )
}

export default GameBoard
