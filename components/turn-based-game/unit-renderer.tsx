"use client"

import type React from "react"

import { Group, Rect, Circle, Text, Image } from "react-konva"
import { type Unit, UNIT_TYPES } from "./units"
import { useEffect, useState } from "react"

interface UnitRendererProps {
  unit: Unit
  tileSize: number
  isSelected: boolean
  isCurrentPlayer: boolean
  onClick: () => void
}

const UnitRenderer: React.FC<UnitRendererProps> = ({ unit, tileSize, isSelected, isCurrentPlayer, onClick }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!unit.sprite) return

    const img = new Image()
    img.src = unit.sprite
    img.crossOrigin = "anonymous"
    img.onload = () => {
      setImage(img)
    }
    img.onerror = () => {
      console.error(`Failed to load image: ${unit.sprite}`)
      // Don't set image, will use fallback rendering
    }

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [unit.sprite])

  if (!unit.position) return null

  const unitType = UNIT_TYPES.find((type) => type.id === unit.type)
  const unitColor = unitType?.color || "#999"
  const ownerColor = unit.owner === "player1" ? "#4CAF50" : "#F44336"

  const x = unit.position.x * tileSize
  const y = unit.position.y * tileSize

  // Calculate health percentage
  const healthPercentage = unit.hp / unit.maxHp
  const healthBarWidth = tileSize * 0.8
  const healthBarHeight = tileSize * 0.1

  return (
    <Group x={x} y={y} width={tileSize} height={tileSize} onClick={onClick}>
      {/* Selection indicator */}
      {isSelected && <Rect x={0} y={0} width={tileSize} height={tileSize} stroke="yellow" strokeWidth={3} />}

      {/* Unit background */}
      <Circle x={tileSize / 2} y={tileSize / 2} radius={tileSize * 0.4} fill={unitColor} opacity={0.7} />

      {/* Unit sprite or fallback */}
      {image ? (
        <Image x={tileSize * 0.1} y={tileSize * 0.1} width={tileSize * 0.8} height={tileSize * 0.8} image={image} />
      ) : (
        <Text
          x={0}
          y={tileSize * 0.3}
          width={tileSize}
          text={unit.name.charAt(0)}
          fontSize={tileSize * 0.4}
          fill="white"
          align="center"
        />
      )}

      {/* Owner indicator */}
      <Circle
        x={tileSize * 0.8}
        y={tileSize * 0.2}
        radius={tileSize * 0.1}
        fill={ownerColor}
        stroke="white"
        strokeWidth={1}
      />

      {/* Unit name */}
      <Text
        x={0}
        y={tileSize * 0.05}
        width={tileSize}
        text={unit.name}
        fontSize={tileSize * 0.18}
        fill="white"
        align="center"
        stroke="black"
        strokeWidth={0.5}
      />

      {/* Health bar background */}
      <Rect
        x={(tileSize - healthBarWidth) / 2}
        y={tileSize * 0.85}
        width={healthBarWidth}
        height={healthBarHeight}
        fill="#333"
        cornerRadius={2}
      />

      {/* Health bar fill */}
      <Rect
        x={(tileSize - healthBarWidth) / 2}
        y={tileSize * 0.85}
        width={healthBarWidth * healthPercentage}
        height={healthBarHeight}
        fill={healthPercentage > 0.6 ? "#4CAF50" : healthPercentage > 0.3 ? "#FFC107" : "#F44336"}
        cornerRadius={2}
      />

      {/* Status indicators */}
      <Group x={0} y={tileSize * 0.7}>
        {unit.hasMoved && <Circle x={tileSize * 0.2} y={0} radius={tileSize * 0.08} fill="rgba(0, 0, 0, 0.5)" />}
        {unit.hasAttacked && <Circle x={tileSize * 0.4} y={0} radius={tileSize * 0.08} fill="rgba(255, 0, 0, 0.5)" />}
        {unit.hasUsedAbility && (
          <Circle x={tileSize * 0.6} y={0} radius={tileSize * 0.08} fill="rgba(0, 0, 255, 0.5)" />
        )}
        {unit.ability.currentCooldown && unit.ability.currentCooldown > 0 && (
          <Circle x={tileSize * 0.8} y={0} radius={tileSize * 0.08} fill="rgba(100, 100, 100, 0.5)">
            <Text
              x={-tileSize * 0.08}
              y={-tileSize * 0.08}
              width={tileSize * 0.16}
              height={tileSize * 0.16}
              text={unit.ability.currentCooldown.toString()}
              fontSize={tileSize * 0.12}
              fill="white"
              align="center"
              verticalAlign="middle"
            />
          </Circle>
        )}
      </Group>
    </Group>
  )
}

export default UnitRenderer
