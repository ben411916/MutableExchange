"use client"

import type React from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Gamepad2, Crosshair, WalletCardsIcon as Cards, BombIcon as BilliardBall } from "lucide-react"
import Image from "next/image"
import SoundButton from "../sound-button"

interface GameSelectionProps {
  publicKey: string
  balance: number | null
  mutbBalance: number
  onSelectGame: (gameId: string) => void
}

interface Game {
  id: string
  name: string
  description: string
  image: string
  icon: React.ReactNode
  status: "live" | "coming-soon"
  minWager: number
}

export default function GameSelection({ publicKey, balance, mutbBalance, onSelectGame }: GameSelectionProps) {
  // Available games
  const games: Game[] = [
    {
      id: "top-down-shooter",
      name: "MUTBow PvP",
      description: "Fast-paced arena shooter with physics-based projectiles and dodge mechanics",
      image: "/images/archer-game.png",
      icon: <Crosshair className="h-5 w-5" />,
      status: "live",
      minWager: 1,
    },
    {
      id: "mutball-pool",
      name: "MUTBall Pool",
      description: "Strategic pool game with power-ups and special abilities to sink balls",
      image: "/pixel-art-pool.png",
      icon: <BilliardBall className="h-5 w-5" />,
      status: "coming-soon",
      minWager: 3,
    },
    {
      id: "deck-building",
      name: "Deck-Building Battle",
      description: "Strategic card game with skillful drafting and deck building before matches",
      image: "/placeholder.svg?key=6x9fw",
      icon: <Cards className="h-5 w-5" />,
      status: "coming-soon",
      minWager: 5,
    },
  ]

  return (
    <Card className="bg-[#fbf3de] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5" />
            <CardTitle className="font-mono">MUTABLE GAMES</CardTitle>
          </div>
          <Badge
            variant="outline"
            className="bg-[#FFD54F] text-black border-2 border-black flex items-center gap-1 font-mono"
          >
            <Image src="/images/mutable-token.png" alt="MUTB" width={16} height={16} className="rounded-full" />
            {mutbBalance.toFixed(2)} MUTB
          </Badge>
        </div>
        <CardDescription>Select a game to play and wager MUTB tokens</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {games.map((game) => (
            <Card
              key={game.id}
              className={`border-2 ${game.status === "live" ? "border-black" : "border-gray-300"} overflow-hidden`}
            >
              <div className="relative">
                <Image
                  src={game.image || "/placeholder.svg"}
                  alt={game.name}
                  width={200}
                  height={120}
                  className="w-full h-32 object-cover"
                />
                {game.status === "coming-soon" && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <Badge className="bg-yellow-500 text-black font-mono">COMING SOON</Badge>
                  </div>
                )}
              </div>
              <CardHeader className="p-3">
                <div className="flex items-center gap-2">
                  <div className="bg-[#FFD54F] p-1 rounded-md border border-black">{game.icon}</div>
                  <CardTitle className="text-base font-mono">{game.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="text-sm text-muted-foreground">{game.description}</p>
                <div className="mt-2 text-xs flex items-center gap-1">
                  <span className="font-medium">Min Wager:</span>
                  <div className="flex items-center">
                    <Image src="/images/mutable-token.png" alt="MUTB" width={12} height={12} />
                    <span>{game.minWager} MUTB</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-3">
                <SoundButton
                  className="w-full bg-[#FFD54F] hover:bg-[#FFCA28] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all font-mono"
                  disabled={game.status !== "live"}
                  onClick={() => onSelectGame(game.id)}
                >
                  {game.status === "live" ? "PLAY NOW" : "COMING SOON"}
                </SoundButton>
              </CardFooter>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
