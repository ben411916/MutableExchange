"use client"

import type React from "react"

import { type Unit, UNIT_TYPES } from "./units"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Image from "next/image"

interface UnitCardProps {
  unit: Unit
}

const UnitCard: React.FC<UnitCardProps> = ({ unit }) => {
  const unitType = UNIT_TYPES.find((type) => type.id === unit.type)
  const healthPercentage = (unit.hp / unit.maxHp) * 100

  return (
    <Card className="border border-gray-200">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-md overflow-hidden bg-gray-200">
            <Image
              src={unit.sprite || "/placeholder.svg?height=40&width=40"}
              alt={unit.name}
              fill
              className="object-cover"
              onError={(e) => {
                // Fallback to placeholder on error
                const target = e.target as HTMLImageElement
                target.src = "/placeholder.svg?height=40&width=40"
              }}
            />
          </div>
          <div>
            <h3 className="font-bold text-lg">{unit.name}</h3>
            <Badge
              variant="outline"
              style={{ backgroundColor: unitType?.color + "20", color: unitType?.color }}
              className="border-current"
            >
              {unitType?.name}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">HP:</span>
            <div className="flex items-center gap-2 flex-1 ml-2">
              <Progress value={healthPercentage} className="h-2" />
              <span className="text-sm whitespace-nowrap">
                {unit.hp}/{unit.maxHp}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">Move:</span>
              <span>{unit.move}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Attack:</span>
              <span>{unit.attack}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Range:</span>
              <span>{unit.range}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">AP:</span>
              <span>
                {unit.actionPoints}/{unit.maxActionPoints}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-200">
          <h4 className="font-semibold text-sm">{unit.ability.name}</h4>
          <p className="text-xs text-gray-600">{unit.ability.description}</p>
          <div className="flex justify-between text-xs mt-1">
            <span>Cooldown: {unit.ability.cooldown}</span>
            {unit.ability.currentCooldown ? (
              <span className="text-amber-600">Ready in {unit.ability.currentCooldown} turns</span>
            ) : (
              <span className="text-green-600">Ready</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default UnitCard
