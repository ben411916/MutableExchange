export interface UnitAbility {
  name: string
  description: string
  cooldown: number
  currentCooldown?: number
  targetType: "self" | "ally" | "enemy" | "tile" | "area"
  range: number
  effect: string
}

export interface Unit {
  id: string
  name: string
  type: "tank" | "melee" | "ranged" | "support" | "disruptor" | "specialist"
  hp: number
  maxHp: number
  move: number
  attack: number
  range: number
  actionPoints: number
  maxActionPoints: number
  ability: UnitAbility
  description: string
  cost: number
  sprite: string
  owner?: string
  position?: { x: number; y: number }
  hasMoved?: boolean
  hasAttacked?: boolean
  hasUsedAbility?: boolean
}

export const UNIT_TYPES = [
  { id: "tank", name: "Tank", color: "#4CAF50" },
  { id: "melee", name: "Melee", color: "#F44336" },
  { id: "ranged", name: "Ranged", color: "#2196F3" },
  { id: "support", name: "Support", color: "#FFEB3B" },
  { id: "disruptor", name: "Disruptor", color: "#9C27B0" },
  { id: "specialist", name: "Specialist", color: "#FF9800" },
]

export const UNITS: Unit[] = [
  {
    id: "bulwark",
    name: "Bulwark",
    type: "tank",
    hp: 10,
    maxHp: 10,
    move: 2,
    attack: 2,
    range: 1,
    actionPoints: 3,
    maxActionPoints: 3,
    ability: {
      name: "Taunt",
      description: "Forces enemy units in range to attack Bulwark next turn",
      cooldown: 2,
      range: 2,
      targetType: "area",
      effect: "taunt",
    },
    description: "A heavily armored unit that excels at absorbing damage and protecting allies.",
    cost: 3,
    sprite: "/placeholder.svg?key=42khd",
  },
  {
    id: "shield-drone",
    name: "Shield Drone",
    type: "tank",
    hp: 8,
    maxHp: 8,
    move: 3,
    attack: 1,
    range: 1,
    actionPoints: 3,
    maxActionPoints: 3,
    ability: {
      name: "Deploy Barrier",
      description: "Places a temporary shield on a tile that blocks attacks for 1 turn",
      cooldown: 3,
      range: 2,
      targetType: "tile",
      effect: "barrier",
    },
    description: "A hovering drone that can deploy energy barriers to block enemy attacks.",
    cost: 2,
    sprite: "/placeholder.svg?key=9lc2y",
  },
  {
    id: "berserker",
    name: "Berserker",
    type: "melee",
    hp: 7,
    maxHp: 7,
    move: 4,
    attack: 3,
    range: 1,
    actionPoints: 3,
    maxActionPoints: 3,
    ability: {
      name: "Rage",
      description: "Gains +1 damage for each HP lost",
      cooldown: 0,
      range: 0,
      targetType: "self",
      effect: "rage",
    },
    description: "A fierce warrior who becomes stronger as they take damage.",
    cost: 3,
    sprite: "/placeholder.svg?key=q5fkq",
  },
  {
    id: "assassin",
    name: "Assassin",
    type: "melee",
    hp: 5,
    maxHp: 5,
    move: 5,
    attack: 4,
    range: 1,
    actionPoints: 3,
    maxActionPoints: 3,
    ability: {
      name: "Backstab",
      description: "Deals double damage when attacking from behind",
      cooldown: 0,
      range: 0,
      targetType: "enemy",
      effect: "backstab",
    },
    description: "A stealthy unit that excels at flanking and dealing high damage.",
    cost: 3,
    sprite: "/hooded-assassin.png",
  },
  {
    id: "archer",
    name: "Archer",
    type: "ranged",
    hp: 5,
    maxHp: 5,
    move: 3,
    attack: 3,
    range: 4,
    actionPoints: 3,
    maxActionPoints: 3,
    ability: {
      name: "Piercing Shot",
      description: "Hits all enemies in a line",
      cooldown: 2,
      range: 4,
      targetType: "enemy",
      effect: "pierce",
    },
    description: "A skilled archer who can attack from a distance and hit multiple targets.",
    cost: 3,
    sprite: "/placeholder.svg?key=m8xk7",
  },
  {
    id: "sniper",
    name: "Sniper",
    type: "ranged",
    hp: 4,
    maxHp: 4,
    move: 2,
    attack: 4,
    range: 5,
    actionPoints: 3,
    maxActionPoints: 3,
    ability: {
      name: "Focused Fire",
      description: "Must stand still to gain +2 range and +1 damage",
      cooldown: 1,
      range: 0,
      targetType: "self",
      effect: "focus",
    },
    description: "A long-range specialist who can deal high damage from extreme distances.",
    cost: 3,
    sprite: "/placeholder.svg?height=40&width=40&query=sniper with rifle",
  },
  {
    id: "healer",
    name: "Healer",
    type: "support",
    hp: 6,
    maxHp: 6,
    move: 3,
    attack: 1,
    range: 1,
    actionPoints: 3,
    maxActionPoints: 3,
    ability: {
      name: "Restore",
      description: "Heals a nearby unit for 3 HP",
      cooldown: 2,
      range: 2,
      targetType: "ally",
      effect: "heal",
    },
    description: "A support unit that can heal allies and keep them in the fight longer.",
    cost: 3,
    sprite: "/placeholder.svg?height=40&width=40&query=medic with healing staff",
  },
  {
    id: "engineer",
    name: "Engineer",
    type: "support",
    hp: 6,
    maxHp: 6,
    move: 2,
    attack: 2,
    range: 2,
    actionPoints: 3,
    maxActionPoints: 3,
    ability: {
      name: "Deploy Turret",
      description: "Places a turret that auto-attacks enemies in range for 2 turns",
      cooldown: 3,
      range: 2,
      targetType: "tile",
      effect: "turret",
    },
    description: "A technical specialist who can deploy automated turrets to control the battlefield.",
    cost: 3,
    sprite: "/placeholder.svg?height=40&width=40&query=engineer with wrench and turret",
  },
  {
    id: "grenadier",
    name: "Grenadier",
    type: "disruptor",
    hp: 6,
    maxHp: 6,
    move: 3,
    attack: 2,
    range: 2,
    actionPoints: 3,
    maxActionPoints: 3,
    ability: {
      name: "Lob Grenade",
      description: "Deals damage in a 3x3 area, friendly fire possible",
      cooldown: 2,
      range: 3,
      targetType: "area",
      effect: "grenade",
    },
    description: "A unit specialized in area-of-effect damage that can hit multiple enemies at once.",
    cost: 3,
    sprite: "/placeholder.svg?height=40&width=40&query=soldier with grenades",
  },
  {
    id: "time-warden",
    name: "Time Warden",
    type: "disruptor",
    hp: 5,
    maxHp: 5,
    move: 3,
    attack: 2,
    range: 2,
    actionPoints: 3,
    maxActionPoints: 3,
    ability: {
      name: "Rewind",
      description: "Moves a friendly unit back to its position from the previous turn",
      cooldown: 3,
      range: 3,
      targetType: "ally",
      effect: "rewind",
    },
    description: "A mysterious unit with time-manipulation abilities that can reposition allies.",
    cost: 3,
    sprite: "/placeholder.svg?height=40&width=40&query=mage with clock and time symbols",
  },
  {
    id: "infiltrator",
    name: "Infiltrator",
    type: "specialist",
    hp: 5,
    maxHp: 5,
    move: 4,
    attack: 2,
    range: 1,
    actionPoints: 3,
    maxActionPoints: 3,
    ability: {
      name: "Phase Shift",
      description: "Can move through enemy units for 1 turn",
      cooldown: 3,
      range: 0,
      targetType: "self",
      effect: "phase",
    },
    description: "A stealthy unit that can phase through obstacles and enemy lines.",
    cost: 3,
    sprite: "/placeholder.svg?height=40&width=40&query=stealthy agent phasing through wall",
  },
  {
    id: "controller",
    name: "Controller",
    type: "specialist",
    hp: 6,
    maxHp: 6,
    move: 3,
    attack: 2,
    range: 2,
    actionPoints: 3,
    maxActionPoints: 3,
    ability: {
      name: "Gravity Well",
      description: "Pulls all units within a 2-tile radius to center point",
      cooldown: 3,
      range: 4,
      targetType: "area",
      effect: "gravity",
    },
    description: "A unit with gravity manipulation powers that can reposition both allies and enemies.",
    cost: 3,
    sprite: "/placeholder.svg?height=40&width=40&query=mage controlling gravity",
  },
]

export const getUnitById = (id: string): Unit | undefined => {
  return UNITS.find((unit) => unit.id === id)
}

export const createUnitInstance = (unitId: string, owner: string, position: { x: number; y: number }): Unit => {
  const unitTemplate = getUnitById(unitId)
  if (!unitTemplate) {
    throw new Error(`Unit with id ${unitId} not found`)
  }

  return {
    ...JSON.parse(JSON.stringify(unitTemplate)),
    owner,
    position,
    hasMoved: false,
    hasAttacked: false,
    hasUsedAbility: false,
    ability: {
      ...unitTemplate.ability,
      currentCooldown: 0,
    },
  }
}
